import type { TabGroup } from './types';

export type ListView = 'all' | 'starred' | 'locked';
// 사이드바에는 필터 보기 외에 도메인별 묶어 보기와 리마인더 보기가 추가된다
export type SidebarView = ListView | 'domain' | 'later';

export function filterGroups(groups: TabGroup[], query: string): TabGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      tabs: g.tabs.filter(
        (t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.tabs.length > 0);
}

export function byView(groups: TabGroup[], view: ListView): TabGroup[] {
  if (view === 'locked') return groups.filter((g) => g.locked);
  if (view === 'starred') {
    return groups
      .map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.starred === true) }))
      .filter((g) => g.tabs.length > 0);
  }
  return groups;
}

export function countStarred(groups: TabGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.tabs.filter((t) => t.starred === true).length,
    0,
  );
}

export function countLockedGroups(groups: TabGroup[]): number {
  return groups.filter((g) => g.locked).length;
}
