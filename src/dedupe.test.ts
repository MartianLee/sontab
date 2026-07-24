import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { countDuplicates, removeDuplicates } from './dedupe';

function fixture(): TabGroup[] {
  return [
    {
      id: 'new', createdAt: 3000, name: '', locked: false,
      tabs: [
        { id: 'n1', url: 'https://a.com/', title: 'A 최신' },
        { id: 'n2', url: 'https://b.com/', title: 'B' },
      ],
    },
    {
      id: 'mid', createdAt: 2000, name: '', locked: false,
      tabs: [
        { id: 'm1', url: 'https://a.com/', title: 'A 중복' },
        { id: 'm2', url: 'https://c.com/', title: 'C', starred: true },
      ],
    },
    {
      id: 'old', createdAt: 1000, name: '', locked: false,
      tabs: [
        { id: 'o1', url: 'https://a.com/', title: 'A 더 오래됨' },
        { id: 'o2', url: 'https://c.com/', title: 'C 중복 (별 없음)' },
      ],
    },
  ];
}

describe('removeDuplicates', () => {
  it('같은 URL은 최신 그룹의 것만 남긴다', () => {
    const result = removeDuplicates(fixture());
    const urls = result.flatMap((g) => g.tabs.map((t) => `${g.id}:${t.id}`));
    expect(urls).toContain('new:n1');
    expect(urls).not.toContain('mid:m1');
    expect(urls).not.toContain('old:o1');
  });

  it('즐겨찾기 탭은 남기고, 별 없는 중복을 제거한다', () => {
    const result = removeDuplicates(fixture());
    const ids = result.flatMap((g) => g.tabs.map((t) => t.id));
    expect(ids).toContain('m2'); // 별표 → 유지
    expect(ids).not.toContain('o2'); // 별 없는 중복 → 제거
  });

  it('잠긴 그룹의 탭은 제거하지 않고 그쪽을 유지한다', () => {
    const groups: TabGroup[] = [
      { id: 'g1', createdAt: 2000, name: '', locked: false,
        tabs: [{ id: 't1', url: 'https://a.com/', title: 'A' }] },
      { id: 'g2', createdAt: 1000, name: '', locked: true,
        tabs: [{ id: 't2', url: 'https://a.com/', title: 'A 잠김' }] },
    ];
    const result = removeDuplicates(groups);
    const ids = result.flatMap((g) => g.tabs.map((t) => t.id));
    expect(ids).toContain('t2'); // 잠긴 그룹 → 유지
    expect(ids).not.toContain('t1');
  });

  it('빈 그룹은 제거하고 원본은 바꾸지 않는다', () => {
    const groups: TabGroup[] = [
      { id: 'g1', createdAt: 2000, name: '', locked: false,
        tabs: [{ id: 't1', url: 'https://a.com/', title: 'A' }] },
      { id: 'g2', createdAt: 1000, name: '', locked: false,
        tabs: [{ id: 't2', url: 'https://a.com/', title: 'A 중복' }] },
    ];
    const result = removeDuplicates(groups);
    expect(result.map((g) => g.id)).toEqual(['g1']);
    expect(groups).toHaveLength(2);
  });
});

describe('removeDuplicates — 리마인더 보호', () => {
  it('리마인더가 걸린 탭은 제거하지 않고 그쪽을 유지한다', () => {
    const groups: TabGroup[] = [
      { id: 'new', createdAt: 2000, name: '', locked: false,
        tabs: [{ id: 't1', url: 'https://a.com/', title: 'A 최신 (리마인더 없음)' }] },
      { id: 'old', createdAt: 1000, name: '', locked: false,
        tabs: [{ id: 't2', url: 'https://a.com/', title: 'A 스누즈', remindAt: 9999999999999 }] },
    ];
    const result = removeDuplicates(groups);
    const ids = result.flatMap((g) => g.tabs.map((t) => t.id));
    expect(ids).toContain('t2'); // 리마인더 보유 → 유지
    expect(ids).not.toContain('t1');
  });
});

describe('countDuplicates', () => {
  it('정리될 탭 수를 센다', () => {
    // a.com 3개 → 2개 제거, c.com은 별표가 키퍼 → 1개 제거
    expect(countDuplicates(fixture())).toBe(3);
  });

  it('중복이 없으면 0', () => {
    const groups: TabGroup[] = [
      { id: 'g', createdAt: 1, name: '', locked: false,
        tabs: [{ id: 't', url: 'https://a.com/', title: 'A' }] },
    ];
    expect(countDuplicates(groups)).toBe(0);
  });
});
