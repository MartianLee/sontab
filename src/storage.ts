import type { SavedTab, TabGroup } from './types';

const KEY = 'groups';

export function createGroup(tabs: SavedTab[], createdAt: number): TabGroup {
  return { id: crypto.randomUUID(), createdAt, name: '', locked: false, tabs };
}

export function addGroup(groups: TabGroup[], group: TabGroup): TabGroup[] {
  return [group, ...groups];
}

export function removeTab(groups: TabGroup[], groupId: string, tabId: string): TabGroup[] {
  return groups
    .map((g) =>
      g.id === groupId && !g.locked
        ? { ...g, tabs: g.tabs.filter((t) => t.id !== tabId) }
        : g,
    )
    .filter((g) => g.tabs.length > 0 || g.locked);
}

export function removeTabs(groups: TabGroup[], groupId: string, tabIds: string[]): TabGroup[] {
  const ids = new Set(tabIds);
  return groups
    .map((g) =>
      g.id === groupId && !g.locked
        ? { ...g, tabs: g.tabs.filter((t) => !ids.has(t.id)) }
        : g,
    )
    .filter((g) => g.tabs.length > 0 || g.locked);
}

export function removeGroup(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.filter((g) => g.id !== groupId || g.locked);
}

export function renameGroup(groups: TabGroup[], groupId: string, name: string): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, name } : g));
}

export function toggleLock(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, locked: !g.locked } : g));
}

export function countTabs(groups: TabGroup[]): number {
  return groups.reduce((sum, g) => sum + g.tabs.length, 0);
}

export function toggleStar(groups: TabGroup[], groupId: string, tabId: string): TabGroup[] {
  return groups.map((g) =>
    g.id === groupId
      ? {
          ...g,
          tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, starred: !t.starred } : t)),
        }
      : g,
  );
}

export async function loadGroups(): Promise<TabGroup[]> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as TabGroup[] | undefined) ?? [];
}

export async function persistGroups(groups: TabGroup[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: groups });
}
