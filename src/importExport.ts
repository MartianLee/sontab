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
// 내보내기 HTML은 class="tabGroup">, 브라우저 "페이지 저장"은 class="tabGroup" style=... 형태
const GROUP_SPLIT = 'class="tabGroup"';
// 제목은 앵커 직속 텍스트(내보내기) 또는 중첩 span(저장된 페이지) 안에 있다
const LINK_PATTERN =
  /class="tabLink(?: tabLinkText)?" href="([^"]*)"[^>]*>(?:<span[^>]*>)?([^<]*)</g;
const NAME_PATTERN =
  /class="(?:tabGroupTitleText|editInPlaceLabelSpan)"[^>]*>([^<]*)</;
// OneTab은 file:// 등 직접 열 수 없는 URL을 자기 placeholder 페이지로 감싼다
const PLACEHOLDER_PATTERN = /^chrome-extension:\/\/[^/]+\/placeholder\.html\?url=([^&]+)/;

function unwrapPlaceholder(url: string): string {
  const m = url.match(PLACEHOLDER_PATTERN);
  return m ? decodeURIComponent(m[1]) : url;
}

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
    /(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*,?\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!m) return null;
  const year = Number(m[1]) < 100 ? Number(m[1]) + 2000 : Number(m[1]);
  let hour = Number(m[5]) % 12;
  if (m[4] === '오후') hour += 12;
  return new Date(
    year, Number(m[2]) - 1, Number(m[3]), hour, Number(m[6]), Number(m[7] ?? 0),
  ).getTime();
}

export function parseOneTabHtml(html: string): OneTabGroup[] {
  const groups: OneTabGroup[] = [];
  for (const block of html.split(GROUP_SPLIT).slice(1)) {
    const tabs: SavedTab[] = [];
    LINK_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = LINK_PATTERN.exec(block)) !== null) {
      const url = unwrapPlaceholder(decodeEntities(m[1].trim()));
      if (!url) continue;
      tabs.push({ id: crypto.randomUUID(), url, title: decodeEntities(m[2].trim()) });
    }
    if (tabs.length === 0) continue;
    const rawTitle = decodeEntities((block.match(NAME_PATTERN)?.[1] ?? '').trim());
    // 생성일은 그룹 헤더(첫 탭 링크 이전)에만 있다 — 탭 제목 속 날짜 오인 방지
    const headerEnd = block.search(/class="tabLink/);
    const headerHtml = headerEnd === -1 ? block : block.slice(0, headerEnd);
    // 전용 createdDate 요소가 있으면 그것만 쓰고(내보내기 형식),
    // 없으면 그룹 이름 스팬 뒤쪽에서만 찾는다 — 날짜처럼 생긴 그룹 이름 오인 방지
    const dateEl = headerHtml.match(/class="createdDate">([^<]*)</);
    let dateText: string;
    if (dateEl) {
      dateText = decodeEntities(dateEl[1]);
    } else {
      const nameMatch = headerHtml.match(NAME_PATTERN);
      const searchFrom = nameMatch
        ? headerHtml.indexOf(nameMatch[0]) + nameMatch[0].length
        : 0;
      dateText = decodeEntities(headerHtml.slice(searchFrom).replace(/<[^>]*>/g, ' '));
    }
    groups.push({
      name: AUTO_TITLE.test(rawTitle) ? '' : rawTitle,
      createdAt: parseKoreanDate(dateText),
      tabs,
    });
  }
  return groups;
}
