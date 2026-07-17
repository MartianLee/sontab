import { domainOf } from './domain';

/** chrome.tabs.Tab에서 수집 판단에 필요한 부분만 (순수 로직 테스트용) */
export interface OpenTab {
  id?: number;
  index: number;
  url?: string;
  title?: string;
  pinned: boolean;
  favIconUrl?: string;
}

export type CollectMode = 'tab' | 'domain' | 'left' | 'right';

/**
 * 컨텍스트 메뉴/단축키로 보낼 탭 선택.
 * - tab: 클릭한 탭 하나 — 명시적 의도이므로 고정 탭도 허용 (목록 페이지만 제외)
 * - domain/left/right: 일괄 수집 — 고정 탭과 목록 페이지 제외
 */
export function selectTabsToSend(
  all: OpenTab[],
  clicked: OpenTab,
  mode: CollectMode,
  listUrl: string,
): OpenTab[] {
  const usable = (t: OpenTab) =>
    t.id !== undefined && !!t.url && !t.url.startsWith(listUrl);

  if (mode === 'tab') {
    return usable(clicked) ? [clicked] : [];
  }

  const bulk = all.filter((t) => usable(t) && !t.pinned);
  if (mode === 'domain') {
    const domain = domainOf(clicked.url ?? '');
    return bulk.filter((t) => domainOf(t.url!) === domain);
  }
  if (mode === 'left') return bulk.filter((t) => t.index < clicked.index);
  return bulk.filter((t) => t.index > clicked.index);
}
