import { countDue, nextRemindAt } from './remind';
import { addGroup, createGroup, loadGroups, persistGroups } from './storage';
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

chrome.runtime.onInstalled.addListener(() => void refreshReminders());
chrome.runtime.onStartup.addListener(() => void refreshReminders());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REMIND_ALARM) void refreshReminders();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.groups) void refreshReminders();
});

chrome.action.onClicked.addListener((activeTab) => {
  if (collecting) return;
  collecting = true;
  collectWindow(activeTab.windowId)
    .catch((error) => {
      console.error('sontab: 탭 수집 실패', error);
    })
    .finally(() => {
      collecting = false;
    });
});

async function collectWindow(windowId: number): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const tabs = await chrome.tabs.query({ windowId });
  const collectible = tabs.filter(
    (t) => !t.pinned && t.id !== undefined && !!t.url && !t.url.startsWith(listUrl),
  );

  // 저장이 성공한 뒤에만 탭을 닫는다 (실패 시 탭 유지 = 데이터 유실 방지)
  if (collectible.length > 0) {
    const saved: SavedTab[] = collectible.map((t) => ({
      id: crypto.randomUUID(),
      url: t.url!,
      title: t.title || t.url!,
      favIconUrl: t.favIconUrl,
    }));
    const groups = await loadGroups();
    await persistGroups(addGroup(groups, createGroup(saved, Date.now())));
  }

  await openListPage(windowId);

  if (collectible.length > 0) {
    await chrome.tabs.remove(collectible.map((t) => t.id!));
  }
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
