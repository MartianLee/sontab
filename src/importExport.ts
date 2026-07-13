import type { SavedTab, TabGroup } from './types';

const SEP = ' | ';
const URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

export function exportText(groups: TabGroup[]): string {
  return groups
    .map((g) =>
      g.tabs.map((t) => (t.title ? `${t.url}${SEP}${t.title}` : t.url)).join('\n'),
    )
    .join('\n\n');
}

export function parseImport(text: string): SavedTab[][] {
  const result: SavedTab[][] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const tabs: SavedTab[] = [];
    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const sepIndex = trimmed.indexOf(SEP);
      const url = (sepIndex === -1 ? trimmed : trimmed.slice(0, sepIndex)).trim();
      const title = sepIndex === -1 ? '' : trimmed.slice(sepIndex + SEP.length).trim();
      if (!URL_PATTERN.test(url)) continue;
      tabs.push({ id: crypto.randomUUID(), url, title });
    }
    if (tabs.length > 0) result.push(tabs);
  }
  return result;
}
