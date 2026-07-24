import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import {
  countDue,
  countReminders,
  hideSnoozed,
  isDue,
  isSnoozed,
  nextRemindAt,
  presetTimes,
  reminderEntries,
} from './remind';

const NOW = new Date(2026, 6, 17, 14, 0, 0).getTime(); // 금요일 오후 2시

function fixture(): TabGroup[] {
  return [
    {
      id: 'g1', createdAt: 2000, name: '리서치', locked: false,
      tabs: [
        { id: 't1', url: 'https://a.com/1', title: '일반 탭' },
        { id: 't2', url: 'https://a.com/2', title: '예정', remindAt: NOW + 3600_000 },
        { id: 't3', url: 'https://a.com/3', title: '도착', remindAt: NOW - 3600_000 },
      ],
    },
    {
      id: 'g2', createdAt: 1000, name: '', locked: false,
      tabs: [{ id: 't4', url: 'https://b.com/', title: '예정 먼 미래', remindAt: NOW + 7200_000 }],
    },
  ];
}

describe('presetTimes', () => {
  it('1시간 뒤와 3시간 뒤를 준다', () => {
    const base = new Date(2026, 6, 17, 14, 0);
    const p = presetTimes(base);
    expect(p.inOneHour).toBe(base.getTime() + 3600_000);
    expect(p.inThreeHours).toBe(base.getTime() + 3 * 3600_000);
  });

  it('오후 6시 이전이면 오늘 저녁 6시를 준다', () => {
    const p = presetTimes(new Date(2026, 6, 17, 14, 0));
    expect(new Date(p.evening).getHours()).toBe(18);
    expect(new Date(p.evening).getDate()).toBe(17);
  });

  it('오후 6시가 지났으면 내일 저녁 6시를 준다', () => {
    const p = presetTimes(new Date(2026, 6, 17, 20, 0));
    expect(new Date(p.evening).getDate()).toBe(18);
  });

  it('내일 아침 9시와 다음 주 월요일 9시를 준다', () => {
    const p = presetTimes(new Date(2026, 6, 17, 14, 0)); // 금요일
    const tomorrow = new Date(p.tomorrowMorning);
    expect([tomorrow.getDate(), tomorrow.getHours()]).toEqual([18, 9]);
    const monday = new Date(p.nextMonday);
    expect([monday.getDay(), monday.getDate(), monday.getHours()]).toEqual([1, 20, 9]);
  });

  it('월요일에도 다음 주 월요일(7일 뒤)을 준다', () => {
    const p = presetTimes(new Date(2026, 6, 20, 10, 0)); // 월요일
    expect(new Date(p.nextMonday).getDate()).toBe(27);
  });
});

describe('isSnoozed / isDue', () => {
  it('remindAt이 미래면 snoozed, 과거면 due, 없으면 둘 다 아니다', () => {
    const [g1] = fixture();
    expect(isSnoozed(g1.tabs[1], NOW)).toBe(true);
    expect(isDue(g1.tabs[1], NOW)).toBe(false);
    expect(isSnoozed(g1.tabs[2], NOW)).toBe(false);
    expect(isDue(g1.tabs[2], NOW)).toBe(true);
    expect(isSnoozed(g1.tabs[0], NOW)).toBe(false);
    expect(isDue(g1.tabs[0], NOW)).toBe(false);
  });
});

describe('hideSnoozed', () => {
  it('예정 탭만 숨기고 도착 탭은 남긴다, 빈 그룹은 제외', () => {
    const result = hideSnoozed(fixture(), NOW);
    expect(result.map((g) => g.id)).toEqual(['g1']);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t1', 't3']);
  });

  it('잠긴 그룹은 탭이 모두 스누즈돼도 목록에서 사라지지 않는다', () => {
    const locked: TabGroup[] = [
      {
        id: 'gl', createdAt: 1, name: '', locked: true,
        tabs: [{ id: 't', url: 'https://a.com/', title: 'A', remindAt: NOW + 1000 }],
      },
    ];
    expect(hideSnoozed(locked, NOW).map((g) => g.id)).toEqual(['gl']);
  });
});

describe('reminderEntries', () => {
  it('리마인더 걸린 탭을 도착 시각 오름차순으로 반환한다', () => {
    const entries = reminderEntries(fixture());
    expect(entries.map((e) => e.tab.id)).toEqual(['t3', 't2', 't4']);
    expect(entries[0].group.id).toBe('g1');
  });
});

describe('counts / nextRemindAt', () => {
  it('전체 리마인더 수와 도착 수를 센다', () => {
    expect(countReminders(fixture())).toBe(3);
    expect(countDue(fixture(), NOW)).toBe(1);
  });

  it('다음 도착 시각은 미래 remindAt 중 최솟값이다', () => {
    expect(nextRemindAt(fixture(), NOW)).toBe(NOW + 3600_000);
  });

  it('미래 리마인더가 없으면 null', () => {
    const groups = fixture().map((g) => ({
      ...g,
      tabs: g.tabs.filter((t) => !t.remindAt || t.remindAt <= NOW),
    }));
    expect(nextRemindAt(groups, NOW)).toBeNull();
  });
});
