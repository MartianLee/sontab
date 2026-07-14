import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { byView, countLockedGroups, countStarred, filterGroups } from './filter';

function fixture(): TabGroup[] {
  return [
    {
      id: 'g1', createdAt: 1000, name: '리서치', locked: false,
      tabs: [
        { id: 't1', url: 'https://svelte.dev/docs', title: 'Svelte 문서', starred: true },
        { id: 't2', url: 'https://developer.chrome.com/', title: 'Chrome Extensions' },
      ],
    },
    {
      id: 'g2', createdAt: 2000, name: '', locked: true,
      tabs: [{ id: 't3', url: 'https://c.com/', title: '여행 준비물' }],
    },
  ];
}

describe('filterGroups', () => {
  it('빈 검색어면 원본을 그대로 반환한다', () => {
    const groups = fixture();
    expect(filterGroups(groups, '  ')).toBe(groups);
  });

  it('제목 부분일치(대소문자 무시)로 탭을 거른다', () => {
    const result = filterGroups(fixture(), 'SVELTE');
    expect(result).toHaveLength(1);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t1']);
  });

  it('URL로도 매칭한다', () => {
    const result = filterGroups(fixture(), 'chrome.com');
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t2']);
  });

  it('매칭 0개인 그룹은 숨긴다', () => {
    const result = filterGroups(fixture(), '여행');
    expect(result.map((g) => g.id)).toEqual(['g2']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const groups = fixture();
    filterGroups(groups, 'svelte');
    expect(groups[0].tabs).toHaveLength(2);
  });
});

describe('byView', () => {
  it('all은 원본 그대로', () => {
    const groups = fixture();
    expect(byView(groups, 'all')).toBe(groups);
  });

  it('starred는 별표 탭만, 없는 그룹은 숨긴다', () => {
    const result = byView(fixture(), 'starred');
    expect(result).toHaveLength(1);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t1']);
  });

  it('locked는 잠긴 그룹만', () => {
    expect(byView(fixture(), 'locked').map((g) => g.id)).toEqual(['g2']);
  });
});

describe('counts', () => {
  it('별표 탭 수와 잠긴 그룹 수를 센다', () => {
    expect(countStarred(fixture())).toBe(1);
    expect(countLockedGroups(fixture())).toBe(1);
  });
});
