import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import {
  addGroup,
  countTabs,
  createGroup,
  removeGroup,
  removeTab,
  removeTabs,
  renameGroup,
  toggleLock,
  toggleStar,
} from './storage';

function fixture(): TabGroup[] {
  return [
    {
      id: 'g1',
      createdAt: 1000,
      name: '',
      locked: false,
      tabs: [
        { id: 't1', url: 'https://a.com/', title: 'A' },
        { id: 't2', url: 'https://b.com/', title: 'B' },
      ],
    },
    {
      id: 'g2',
      createdAt: 2000,
      name: '잠긴 그룹',
      locked: true,
      tabs: [{ id: 't3', url: 'https://c.com/', title: 'C' }],
    },
  ];
}

describe('createGroup', () => {
  it('id를 생성하고 기본값을 채운다', () => {
    const g = createGroup([{ id: 't1', url: 'https://a.com/', title: 'A' }], 1234);
    expect(g.id).toBeTruthy();
    expect(g.createdAt).toBe(1234);
    expect(g.name).toBe('');
    expect(g.locked).toBe(false);
    expect(g.tabs).toHaveLength(1);
  });
});

describe('addGroup', () => {
  it('새 그룹을 맨 앞에 추가한다', () => {
    const groups = fixture();
    const g = createGroup([{ id: 'tx', url: 'https://x.com/', title: 'X' }], 3000);
    const next = addGroup(groups, g);
    expect(next[0].id).toBe(g.id);
    expect(next).toHaveLength(3);
    expect(groups).toHaveLength(2); // 원본 불변
  });
});

describe('removeTab', () => {
  it('탭을 제거한다', () => {
    const next = removeTab(fixture(), 'g1', 't1');
    expect(next[0].tabs.map((t) => t.id)).toEqual(['t2']);
  });

  it('마지막 탭 제거 시 그룹도 제거한다', () => {
    let next = removeTab(fixture(), 'g1', 't1');
    next = removeTab(next, 'g1', 't2');
    expect(next.map((g) => g.id)).toEqual(['g2']);
  });

  it('잠긴 그룹에서는 아무것도 하지 않는다', () => {
    const next = removeTab(fixture(), 'g2', 't3');
    expect(next[1].tabs).toHaveLength(1);
  });
});

describe('removeTabs', () => {
  it('지정한 탭만 제거하고 나머지는 유지한다', () => {
    const next = removeTabs(fixture(), 'g1', ['t1']);
    expect(next[0].tabs.map((t) => t.id)).toEqual(['t2']);
  });

  it('모든 탭을 제거하면 그룹도 제거한다', () => {
    const next = removeTabs(fixture(), 'g1', ['t1', 't2']);
    expect(next.map((g) => g.id)).toEqual(['g2']);
  });

  it('잠긴 그룹에서는 아무것도 하지 않는다', () => {
    const next = removeTabs(fixture(), 'g2', ['t3']);
    expect(next[1].tabs).toHaveLength(1);
  });

  it('빈 목록이면 원본과 동일한 내용을 반환한다', () => {
    const next = removeTabs(fixture(), 'g1', []);
    expect(next[0].tabs).toHaveLength(2);
  });
});

describe('removeGroup', () => {
  it('그룹을 제거한다', () => {
    expect(removeGroup(fixture(), 'g1').map((g) => g.id)).toEqual(['g2']);
  });

  it('잠긴 그룹은 제거하지 않는다', () => {
    expect(removeGroup(fixture(), 'g2')).toHaveLength(2);
  });
});

describe('renameGroup / toggleLock', () => {
  it('이름을 바꾼다', () => {
    expect(renameGroup(fixture(), 'g1', '아침 조사')[0].name).toBe('아침 조사');
  });

  it('잠금을 토글한다', () => {
    const next = toggleLock(fixture(), 'g2');
    expect(next[1].locked).toBe(false);
  });
});

describe('countTabs', () => {
  it('전체 탭 수를 센다', () => {
    expect(countTabs(fixture())).toBe(3);
  });
});

describe('toggleStar', () => {
  it('별표를 켜고 끈다', () => {
    let next = toggleStar(fixture(), 'g1', 't1');
    expect(next[0].tabs[0].starred).toBe(true);
    next = toggleStar(next, 'g1', 't1');
    expect(next[0].tabs[0].starred).toBe(false);
  });

  it('잠긴 그룹에서도 동작한다', () => {
    const next = toggleStar(fixture(), 'g2', 't3');
    expect(next[1].tabs[0].starred).toBe(true);
  });

  it('원본을 변경하지 않는다', () => {
    const groups = fixture();
    toggleStar(groups, 'g1', 't1');
    expect(groups[0].tabs[0].starred).toBeUndefined();
  });
});
