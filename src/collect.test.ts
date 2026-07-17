import { describe, expect, it } from 'vitest';
import { selectTabsToSend, type CollectMode, type OpenTab } from './collect';

const LIST_URL = 'chrome-extension://abc/list.html';

function tabs(): OpenTab[] {
  return [
    { id: 1, index: 0, url: LIST_URL, title: 'SonTab', pinned: true },
    { id: 2, index: 1, url: 'https://a.com/x', title: 'A1', pinned: false },
    { id: 3, index: 2, url: 'https://www.a.com/y', title: 'A2', pinned: false },
    { id: 4, index: 3, url: 'https://b.com/', title: 'B', pinned: false },
    { id: 5, index: 4, url: 'https://c.com/', title: 'C 고정', pinned: true },
    { id: 6, index: 5, url: 'https://d.com/', title: 'D', pinned: false },
  ];
}

function ids(all: OpenTab[], clickedId: number, mode: CollectMode): number[] {
  const clicked = all.find((t) => t.id === clickedId)!;
  return selectTabsToSend(all, clicked, mode, LIST_URL).map((t) => t.id!);
}

describe('selectTabsToSend', () => {
  it('tab 모드: 클릭한 탭 하나만 (고정 탭이어도 보낸다)', () => {
    expect(ids(tabs(), 4, 'tab')).toEqual([4]);
    expect(ids(tabs(), 5, 'tab')).toEqual([5]);
  });

  it('tab 모드: 목록 페이지 자신은 보내지 않는다', () => {
    expect(ids(tabs(), 1, 'tab')).toEqual([]);
  });

  it('domain 모드: www 무시하고 같은 도메인의 일반 탭 전부', () => {
    expect(ids(tabs(), 2, 'domain')).toEqual([2, 3]);
  });

  it('left/right 모드: 클릭한 탭 기준 좌우의 일반 탭 (고정·목록 페이지 제외)', () => {
    expect(ids(tabs(), 4, 'left')).toEqual([2, 3]);
    expect(ids(tabs(), 4, 'right')).toEqual([6]); // 고정 탭 5는 제외
  });

  it('URL 없는 탭은 제외한다', () => {
    const all = [...tabs(), { id: 7, index: 6, url: undefined, title: '', pinned: false }];
    const clicked = all.find((t) => t.id === 4)!;
    expect(selectTabsToSend(all, clicked, 'right', LIST_URL).map((t) => t.id)).toEqual([6]);
  });
});
