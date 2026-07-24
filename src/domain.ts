import type { SavedTab, TabGroup } from './types';

export interface DomainEntry {
  group: TabGroup;
  tab: SavedTab;
}

export interface DomainGroup {
  domain: string;
  entries: DomainEntry[];
}

export function domainOf(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname ? u.hostname.replace(/^www\./, '') : u.protocol.replace(/:$/, '');
  } catch {
    return '';
  }
}

export function groupByDomain(groups: TabGroup[]): DomainGroup[] {
  const byDomain = new Map<string, DomainEntry[]>();
  for (const group of groups) {
    for (const tab of group.tabs) {
      const domain = domainOf(tab.url);
      const entries = byDomain.get(domain) ?? [];
      entries.push({ group, tab });
      byDomain.set(domain, entries);
    }
  }
  return [...byDomain.entries()]
    .map(([domain, entries]) => ({
      domain,
      entries: [...entries].sort((a, b) => b.group.createdAt - a.group.createdAt),
    }))
    .sort(
      (a, b) => b.entries.length - a.entries.length || a.domain.localeCompare(b.domain),
    );
}

export function isMainPageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.pathname === '/' || u.pathname === '') && !u.search && !u.hash;
  } catch {
    return false;
  }
}

export function hideMainPages(groups: TabGroup[]): TabGroup[] {
  return groups
    .map((g) => ({
      ...g,
      tabs: g.tabs.filter((t) => t.starred === true || !isMainPageUrl(t.url)),
    }))
    .filter((g) => g.tabs.length > 0 || g.locked);
}
