import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { allTags, byTag, byView, countLockedGroups, countStarred, filterGroups } from './filter';

describe('allTags / byTag', () => {
  const tagged: TabGroup[] = [
    { id: 'a', createdAt: 1, name: '', locked: false, tags: ['여행', '리서치'],
      tabs: [{ id: 't1', url: 'https://a.com/', title: 'A' }] },
    { id: 'b', createdAt: 2, name: '', locked: false, tags: ['여행'],
      tabs: [{ id: 't2', url: 'https://b.com/', title: 'B' }] },
    { id: 'c', createdAt: 3, name: '', locked: false,
      tabs: [{ id: 't3', url: 'https://c.com/', title: 'C' }] },
  ];

  it('태그를 사용 횟수 내림차순(동률이면 사전순)으로 집계한다', () => {
    expect(allTags(tagged)).toEqual([
      { tag: '여행', count: 2 },
      { tag: '리서치', count: 1 },
    ]);
  });

  it('해당 태그가 달린 그룹만 반환한다', () => {
    expect(byTag(tagged, '여행').map((g) => g.id)).toEqual(['a', 'b']);
    expect(byTag(tagged, '없음')).toEqual([]);
  });
});

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
