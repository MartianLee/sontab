import { SUPPORTED_LANGS, type Lang } from './i18n';
import type { ThemeSetting } from './theme';
import type { SavedTab, TabGroup } from './types';

const KEY = 'groups';
const THEME_KEY = 'theme';
const HIDE_MAIN_KEY = 'hideMainPages';
const LANG_KEY = 'lang';
const DOMAIN_LIMIT_KEY = 'domainLimit';

export const DOMAIN_LIMIT_OPTIONS = [1, 5, 10, 20] as const;
export type DomainLimit = (typeof DOMAIN_LIMIT_OPTIONS)[number];

export function createGroup(tabs: SavedTab[], createdAt: number): TabGroup {
  return { id: crypto.randomUUID(), createdAt, name: '', locked: false, tabs };
}

export function addGroup(groups: TabGroup[], group: TabGroup): TabGroup[] {
  return [group, ...groups];
}

export function sortByCreatedAt(groups: TabGroup[]): TabGroup[] {
  return [...groups].sort((a, b) => b.createdAt - a.createdAt);
}

export function removeTab(groups: TabGroup[], groupId: string, tabId: string): TabGroup[] {
  return groups
    .map((g) =>
      g.id === groupId && !g.locked
        ? { ...g, tabs: g.tabs.filter((t) => t.id !== tabId) }
        : g,
    )
    .filter((g) => g.tabs.length > 0 || g.locked);
}

export function removeTabs(groups: TabGroup[], groupId: string, tabIds: string[]): TabGroup[] {
  const ids = new Set(tabIds);
  return groups
    .map((g) =>
      g.id === groupId && !g.locked
        ? { ...g, tabs: g.tabs.filter((t) => !ids.has(t.id)) }
        : g,
    )
    .filter((g) => g.tabs.length > 0 || g.locked);
}

export function removeGroup(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.filter((g) => g.id !== groupId || g.locked);
}

export function renameGroup(groups: TabGroup[], groupId: string, name: string): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, name } : g));
}

export function toggleLock(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, locked: !g.locked } : g));
}

export function countTabs(groups: TabGroup[]): number {
  return groups.reduce((sum, g) => sum + g.tabs.length, 0);
}

export function toggleStar(groups: TabGroup[], groupId: string, tabId: string): TabGroup[] {
  return groups.map((g) =>
    g.id === groupId
      ? {
          ...g,
          tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, starred: !t.starred } : t)),
        }
      : g,
  );
}

export async function loadGroups(): Promise<TabGroup[]> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as TabGroup[] | undefined) ?? [];
}

export async function persistGroups(groups: TabGroup[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: groups });
}

export async function loadTheme(): Promise<ThemeSetting> {
  const data = await chrome.storage.local.get(THEME_KEY);
  const value = data[THEME_KEY];
  return value === 'light' || value === 'dark' ? value : 'auto';
}

export async function persistTheme(theme: ThemeSetting): Promise<void> {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}

export async function loadHideMainPages(): Promise<boolean> {
  const data = await chrome.storage.local.get(HIDE_MAIN_KEY);
  return data[HIDE_MAIN_KEY] !== false; // 기본값 켬
}

export async function persistHideMainPages(value: boolean): Promise<void> {
  await chrome.storage.local.set({ [HIDE_MAIN_KEY]: value });
}

/** 저장된 언어. 없으면 null — 첫 실행 시 브라우저 언어를 감지해 저장한다 */
export async function loadLang(): Promise<Lang | null> {
  const data = await chrome.storage.local.get(LANG_KEY);
  const value = data[LANG_KEY] as string | undefined;
  return value && (SUPPORTED_LANGS as readonly string[]).includes(value)
    ? (value as Lang)
    : null;
}

export async function persistLang(lang: Lang): Promise<void> {
  await chrome.storage.local.set({ [LANG_KEY]: lang });
}

export async function loadDomainLimit(): Promise<DomainLimit> {
  const data = await chrome.storage.local.get(DOMAIN_LIMIT_KEY);
  const value = data[DOMAIN_LIMIT_KEY] as number | undefined;
  return value !== undefined && (DOMAIN_LIMIT_OPTIONS as readonly number[]).includes(value)
    ? (value as DomainLimit)
    : 5;
}

export async function persistDomainLimit(value: DomainLimit): Promise<void> {
  await chrome.storage.local.set({ [DOMAIN_LIMIT_KEY]: value });
}
