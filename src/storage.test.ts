import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import {
  addGroup,
  countTabs,
  createGroup,
  sortByCreatedAt,
  removeGroup,
  removeTab,
  addGroupTag,
  removeGroupTag,
  removeTabs,
  renameGroup,
  setReminder,
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

describe('setReminder', () => {
  it('리마인더를 설정하고 null이면 해제한다 (잠긴 그룹에서도 동작)', () => {
    const groups = fixture();
    const set = setReminder(groups, 'g2', 't3', 12345); // g2는 잠긴 그룹
    expect(set[1].tabs[0].remindAt).toBe(12345);
    const cleared = setReminder(set, 'g2', 't3', null);
    expect(cleared[1].tabs[0].remindAt).toBeUndefined();
    expect(groups[1].tabs[0].remindAt).toBeUndefined(); // 원본 불변
  });
});

describe('addGroupTag / removeGroupTag', () => {
  it('공백을 정리해 태그를 추가하고 중복은 무시한다', () => {
    const groups = fixture();
    let next = addGroupTag(groups, 'g1', '  여행 ');
    next = addGroupTag(next, 'g1', '여행');
    next = addGroupTag(next, 'g1', '리서치');
    expect(next[0].tags).toEqual(['여행', '리서치']);
    expect(groups[0].tags).toBeUndefined(); // 원본 불변
  });

  it('빈 태그는 추가하지 않는다', () => {
    const next = addGroupTag(fixture(), 'g1', '   ');
    expect(next[0].tags).toBeUndefined();
  });

  it('태그를 제거하고 마지막 태그면 필드를 없앤다', () => {
    let next = addGroupTag(fixture(), 'g1', '여행');
    next = removeGroupTag(next, 'g1', '여행');
    expect(next[0].tags).toBeUndefined();
  });
});

describe('sortByCreatedAt', () => {
  it('생성일 내림차순(최신이 앞)으로 정렬한다', () => {
    const groups = fixture(); // g1(1000), g2(2000)
    const next = sortByCreatedAt(groups);
    expect(next.map((g) => g.id)).toEqual(['g2', 'g1']);
    expect(groups.map((g) => g.id)).toEqual(['g1', 'g2']); // 원본 불변
  });

  it('생성일이 같으면 기존 순서를 유지한다 (stable)', () => {
    const groups = [
      { ...fixture()[0], id: 'a', createdAt: 500 },
      { ...fixture()[0], id: 'b', createdAt: 500 },
    ];
    expect(sortByCreatedAt(groups).map((g) => g.id)).toEqual(['a', 'b']);
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
