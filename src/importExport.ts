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

export interface OneTabGroup {
  name: string;
  createdAt: number | null;
  tabs: SavedTab[];
}

const AUTO_TITLE = /^(탭 \d+개|\d+ tabs?)$/i;
const GROUP_SPLIT = 'class="tabGroup">';
const LINK_PATTERN = /class="tabLink" href="([^"]*)"[^>]*>([^<]*)</g;

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function parseKoreanDate(text: string): number | null {
  const m = text.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*,?\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/,
  );
  if (!m) return null;
  let hour = Number(m[5]) % 12;
  if (m[4] === '오후') hour += 12;
  return new Date(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, Number(m[6]), Number(m[7]),
  ).getTime();
}

export function parseOneTabHtml(html: string): OneTabGroup[] {
  const groups: OneTabGroup[] = [];
  for (const block of html.split(GROUP_SPLIT).slice(1)) {
    const tabs: SavedTab[] = [];
    LINK_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LINK_PATTERN.exec(block)) !== null) {
      const url = decodeEntities(m[1].trim());
      if (!url) continue;
      tabs.push({ id: crypto.randomUUID(), url, title: decodeEntities(m[2].trim()) });
    }
    if (tabs.length === 0) continue;
    const rawTitle = decodeEntities(
      (block.match(/class="tabGroupTitleText">([^<]*)</)?.[1] ?? '').trim(),
    );
    const dateText = block.match(/class="createdDate">([^<]*)</)?.[1] ?? '';
    groups.push({
      name: AUTO_TITLE.test(rawTitle) ? '' : rawTitle,
      createdAt: parseKoreanDate(dateText),
      tabs,
    });
  }
  return groups;
}
