import { selectTabsToSend, type CollectMode } from './collect';
import { domainOf } from './domain';
import { translate, type Lang, type MsgKey } from './i18n';
import { countDue, nextRemindAt } from './remind';
import { addGroup, createGroup, loadGroups, loadLang, persistGroups } from './storage';
import type { SavedTab } from './types';

const LIST_PATH = 'list.html';
const REMIND_ALARM = 'sontab-reminders';

let collecting = false;

// 도착한 리마인더 수를 툴바 배지로 보여주고, 다음 도착 시각에 알람을 예약한다
async function refreshReminders(): Promise<void> {
  const groups = await loadGroups();
  const now = Date.now();
  const due = countDue(groups, now);
  await chrome.action.setBadgeText({ text: due > 0 ? String(due) : '' });
  if (due > 0) {
    await chrome.action.setBadgeBackgroundColor({ color: '#23684d' });
  }
  await chrome.alarms.clear(REMIND_ALARM);
  const next = nextRemindAt(groups, now);
  if (next !== null) {
    await chrome.alarms.create(REMIND_ALARM, { when: next });
  }
}

// ---- 컨텍스트 메뉴 (제목은 앱에서 선택한 언어를 따른다) ----

const MENU_ITEMS: { id: CollectMode; key: MsgKey }[] = [
  { id: 'tab', key: 'menu.sendTab' },
  { id: 'domain', key: 'menu.sendDomain' },
  { id: 'left', key: 'menu.sendLeft' },
  { id: 'right', key: 'menu.sendRight' },
];

async function rebuildMenus(): Promise<void> {
  const lang: Lang = (await loadLang()) ?? 'en';
  await chrome.contextMenus.removeAll();
  for (const item of MENU_ITEMS) {
    chrome.contextMenus.create({
      id: item.id,
      title: translate(lang, item.key),
      contexts: ['page'],
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void refreshReminders();
  void rebuildMenus();
});
chrome.runtime.onStartup.addListener(() => {
  void refreshReminders();
  void rebuildMenus();
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REMIND_ALARM) void refreshReminders();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.groups) void refreshReminders();
  if (changes.lang) void rebuildMenus();
});

chrome.action.onClicked.addListener((activeTab) => {
  run(() => collectWindow(activeTab.windowId));
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;
  run(() => sendTabs(tab, info.menuItemId as CollectMode));
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'collect-window' && tab?.windowId !== undefined) {
    run(() => collectWindow(tab.windowId));
  } else if (command === 'collect-tab' && tab) {
    run(() => sendTabs(tab, 'tab'));
  }
});

function run(job: () => Promise<void>): void {
  if (collecting) return;
  collecting = true;
  job()
    .catch((error) => {
      console.error('sontab: 탭 수집 실패', error);
    })
    .finally(() => {
      collecting = false;
    });
}

/** 저장만 한다 — 탭 닫기는 호출자가 창 생존을 보장한 뒤 수행 */
async function saveGroup(tabs: chrome.tabs.Tab[], name = ''): Promise<void> {
  const saved: SavedTab[] = tabs.map((t) => ({
    id: crypto.randomUUID(),
    url: t.url!,
    title: t.title || t.url!,
    favIconUrl: t.favIconUrl,
  }));
  const groups = await loadGroups();
  await persistGroups(addGroup(groups, { ...createGroup(saved, Date.now()), name }));
}

/**
 * 툴바 클릭/단축키: 창 전체 수집.
 * 순서 중요 — 저장 → 목록 페이지 열기 → 탭 닫기.
 * 목록 페이지를 먼저 열어야 마지막 탭을 닫아도 창이 살아남고,
 * 저장이 실패하면 탭을 닫지 않아 데이터가 유실되지 않는다.
 */
async function collectWindow(windowId: number): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const tabs = await chrome.tabs.query({ windowId });
  const collectible = tabs.filter(
    (t) => !t.pinned && t.id !== undefined && !!t.url && !t.url.startsWith(listUrl),
  );

  if (collectible.length > 0) {
    await saveGroup(collectible);
  }
  await openListPage(windowId);
  if (collectible.length > 0) {
    await chrome.tabs.remove(collectible.map((t) => t.id!));
  }
}

/** 컨텍스트 메뉴/단축키: 부분 수집 — 조용히 보관만 하고 목록 페이지는 열지 않는다 */
async function sendTabs(clicked: chrome.tabs.Tab, mode: CollectMode): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const all = await chrome.tabs.query({ windowId: clicked.windowId });
  const selected = selectTabsToSend(all, clicked, mode, listUrl) as chrome.tabs.Tab[];
  if (selected.length === 0) return;
  await saveGroup(selected, mode === 'domain' ? domainOf(clicked.url ?? '') : '');
  // 창의 모든 탭을 보내는 경우엔 창이 닫히지 않도록 목록 페이지를 먼저 연다
  if (selected.length === all.length) {
    await openListPage(clicked.windowId);
  }
  await chrome.tabs.remove(selected.map((t) => t.id!));
}

async function openListPage(windowId: number): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const [existing] = await chrome.tabs.query({ url: listUrl });
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    // 고정 탭은 파비콘 크기로만 표시된다 (OneTab처럼 탭 바 공간 절약)
    await chrome.tabs.create({ url: listUrl, windowId, pinned: true });
  }
}
