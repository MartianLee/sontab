import type { TabGroup } from './types';

export type ListView = 'all' | 'starred' | 'locked';
// 사이드바에는 필터 보기 외에 도메인별/리마인더/태그 보기가 추가된다
export type SidebarView = ListView | 'domain' | 'later' | 'tag';

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

export interface TagCount {
  tag: string;
  count: number;
}

/** 모든 그룹 태그를 사용 횟수 내림차순(동률이면 사전순)으로 집계 */
export function allTags(groups: TabGroup[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const g of groups) {
    for (const tag of g.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function byTag(groups: TabGroup[], tag: string): TabGroup[] {
  return groups.filter((g) => g.tags?.includes(tag));
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
