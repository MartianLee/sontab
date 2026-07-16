import type { SavedTab, TabGroup } from './types';

export interface ReminderEntry {
  group: TabGroup;
  tab: SavedTab;
}

/** 스누즈 프리셋: 1시간/3시간 뒤, 오늘 저녁 6시(지났으면 내일), 내일 아침 9시, 다음 주 월요일 9시 */
export function presetTimes(now: Date): {
  inOneHour: number;
  inThreeHours: number;
  evening: number;
  tomorrowMorning: number;
  nextMonday: number;
} {
  const evening = new Date(now);
  evening.setHours(18, 0, 0, 0);
  if (evening.getTime() <= now.getTime()) evening.setDate(evening.getDate() + 1);

  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  const nextMonday = new Date(now);
  const ahead = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + ahead);
  nextMonday.setHours(9, 0, 0, 0);

  return {
    inOneHour: now.getTime() + 3600_000,
    inThreeHours: now.getTime() + 3 * 3600_000,
    evening: evening.getTime(),
    tomorrowMorning: tomorrowMorning.getTime(),
    nextMonday: nextMonday.getTime(),
  };
}

export function isSnoozed(tab: SavedTab, now: number): boolean {
  return tab.remindAt !== undefined && tab.remindAt > now;
}

export function isDue(tab: SavedTab, now: number): boolean {
  return tab.remindAt !== undefined && tab.remindAt <= now;
}

/** 아직 시간이 안 된(snoozed) 탭을 숨긴다. 도착(due) 탭은 남긴다. */
export function hideSnoozed(groups: TabGroup[], now: number): TabGroup[] {
  return groups
    .map((g) => ({ ...g, tabs: g.tabs.filter((t) => !isSnoozed(t, now)) }))
    .filter((g) => g.tabs.length > 0);
}

/** 리마인더 걸린 모든 탭(예정+도착)을 도착 시각 오름차순으로 */
export function reminderEntries(groups: TabGroup[]): ReminderEntry[] {
  const entries: ReminderEntry[] = [];
  for (const group of groups) {
    for (const tab of group.tabs) {
      if (tab.remindAt !== undefined) entries.push({ group, tab });
    }
  }
  return entries.sort((a, b) => a.tab.remindAt! - b.tab.remindAt!);
}

export function countReminders(groups: TabGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.tabs.filter((t) => t.remindAt !== undefined).length,
    0,
  );
}

export function countDue(groups: TabGroup[], now: number): number {
  return groups.reduce((sum, g) => sum + g.tabs.filter((t) => isDue(t, now)).length, 0);
}

/** 다음 알람 시각: 미래 remindAt 중 최솟값 (없으면 null) */
export function nextRemindAt(groups: TabGroup[], now: number): number | null {
  let min: number | null = null;
  for (const g of groups) {
    for (const t of g.tabs) {
      if (t.remindAt !== undefined && t.remindAt > now && (min === null || t.remindAt < min)) {
        min = t.remindAt;
      }
    }
  }
  return min;
}
