import { addGroup, createGroup, loadGroups, persistGroups } from './storage';
import type { SavedTab } from './types';

const LIST_PATH = 'list.html';

let collecting = false;

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
