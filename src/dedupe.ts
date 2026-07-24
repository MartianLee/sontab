import type { TabGroup } from './types';
import { countTabs } from './storage';

/**
 * 같은 URL이 여러 번 저장된 탭을 정리한다.
 * 유지 우선순위: 즐겨찾기(전부 유지) > 잠긴 그룹의 탭(전부 유지) > 최신 그룹의 것 하나.
 * 잠긴 그룹에서는 어떤 탭도 제거하지 않는다. 빈 그룹은 제거한다.
 */
export function removeDuplicates(groups: TabGroup[]): TabGroup[] {
  // URL별 키퍼: 보호 대상(별표/잠금)이 하나라도 있으면 일반 사본은 전부 제거,
  // 없으면 가장 최신 그룹의 사본 하나만 남긴다.
  const keeper = new Map<string, string>(); // url -> 유지할 tab.id (일반 사본 중)
  const protectedUrls = new Set<string>();

  const byNewest = [...groups].sort((a, b) => b.createdAt - a.createdAt);
  for (const g of byNewest) {
    for (const t of g.tabs) {
      if (t.starred === true || g.locked) {
        protectedUrls.add(t.url);
      } else if (!keeper.has(t.url)) {
        keeper.set(t.url, t.id);
      }
    }
  }

  return groups
    .map((g) => {
      if (g.locked) return g;
      return {
        ...g,
        tabs: g.tabs.filter((t) => {
          if (t.starred === true) return true;
          if (protectedUrls.has(t.url)) return false;
          return keeper.get(t.url) === t.id;
        }),
      };
    })
    .filter((g) => g.tabs.length > 0 || g.locked);
}

/** 정리 시 제거될 탭 수 */
export function countDuplicates(groups: TabGroup[]): number {
  return countTabs(groups) - countTabs(removeDuplicates(groups));
}
