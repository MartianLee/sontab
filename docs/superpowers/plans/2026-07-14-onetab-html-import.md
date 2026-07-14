# OneTab HTML 가져오기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OneTab HTML 내보내기 파일을 그룹 이름·생성일 보존하며 가져온다.

**Architecture:** 정규식 기반 순수 파서 `parseOneTabHtml`을 `src/importExport.ts`에 추가(TDD), ImportExport 패널에 파일 선택 버튼을 달아 App.svelte의 신규 핸들러로 연결.

**Tech Stack:** 기존 그대로. 신규 의존성 없음.

## Global Constraints

- 런타임 의존성 0. DOMParser 사용 금지(파서는 node 환경 Vitest에서 돌아야 함).
- **사용자 실데이터(/Users/me/Downloads/onetab-all.html)를 레포에 커밋 금지.** 검증용 임시 테스트는 커밋 전 삭제.
- 스타일은 디자인 토큰만 사용 (리터럴 색/간격 금지, tokens.css 참조).
- `npm run check` 0/0, 테스트 전부 통과, 빌드 성공. Conventional commits.

---

### Task 1: 파서(TDD) + UI 배선

**Files:**
- Modify: `src/importExport.ts`, `src/importExport.test.ts`
- Modify: `src/list/ImportExport.svelte`, `src/list/App.svelte`

**Interfaces:**
- Produces:
  - `interface OneTabGroup { name: string; createdAt: number | null; tabs: SavedTab[] }`
  - `parseOneTabHtml(html: string): OneTabGroup[]`
  - `parseKoreanDate(text: string): number | null` (export — 테스트 대상)
  - ImportExport 신규 prop: `onImportHtml: (html: string) => { groups: number; tabs: number }`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/importExport.test.ts`에 추가:
```ts
import { parseKoreanDate, parseOneTabHtml } from './importExport';

const FIXTURE = `<!DOCTYPE html><html><body><div id="tabGroupsDiv">
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">탭 2개</div>
  <div class="createdDate">생성일 2026. 7. 3., 오후 8:12:12</div></div>
  <div class="tabList">
    <div class="tab"><a class="tabLink" href="https://a.com/?x=1&amp;y=2">A &amp; B</a></div>
    <div class="tab"><a class="tabLink" href="https://b.com/">B</a></div>
  </div>
</div>
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">아침 리서치</div>
  <div class="createdDate">생성일 2026. 6. 28., 오전 12:05:51</div></div>
  <div class="tabList">
    <div class="tab"><a class="tabLink" href="https://c.com/">C</a></div>
  </div>
</div>
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">탭 0개</div>
  <div class="createdDate">Created 7/3/2026, 8:12:12 PM</div></div>
  <div class="tabList"></div>
</div>
</div></body></html>`;

describe('parseKoreanDate', () => {
  it('오후 시각을 파싱한다', () => {
    expect(parseKoreanDate('생성일 2026. 7. 3., 오후 8:12:12')).toBe(
      new Date(2026, 6, 3, 20, 12, 12).getTime(),
    );
  });

  it('오전 12시는 0시로 파싱한다', () => {
    expect(parseKoreanDate('생성일 2026. 6. 28., 오전 12:05:51')).toBe(
      new Date(2026, 5, 28, 0, 5, 51).getTime(),
    );
  });

  it('다른 로캘은 null을 반환한다', () => {
    expect(parseKoreanDate('Created 7/3/2026, 8:12:12 PM')).toBeNull();
  });
});

describe('parseOneTabHtml', () => {
  it('그룹/탭/생성일을 파싱하고 빈 그룹은 제외한다', () => {
    const groups = parseOneTabHtml(FIXTURE);
    expect(groups).toHaveLength(2);
    expect(groups[0].tabs.map((t) => t.url)).toEqual(['https://a.com/?x=1&y=2', 'https://b.com/']);
    expect(groups[0].tabs[0].title).toBe('A & B');
    expect(groups[0].createdAt).toBe(new Date(2026, 6, 3, 20, 12, 12).getTime());
    expect(groups[0].tabs[0].id).toBeTruthy();
  });

  it('"탭 N개" 자동 제목은 이름 없음으로, 실제 이름은 보존한다', () => {
    const groups = parseOneTabHtml(FIXTURE);
    expect(groups[0].name).toBe('');
    expect(groups[1].name).toBe('아침 리서치');
  });

  it('tabGroup 블록이 없으면 빈 배열을 반환한다', () => {
    expect(parseOneTabHtml('<html><body>hello</body></html>')).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/importExport.test.ts`
Expected: FAIL — `parseOneTabHtml` export 없음.

- [ ] **Step 3: 파서 구현**

`src/importExport.ts`에 추가:
```ts
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
```

주의: `GROUP_SPLIT`은 닫는 `">`까지 포함해야 `class="tabGroupHeader"` 등 접두 일치를 피한다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run`
Expected: 기존 16개 + 신규 6개 전부 통과.

- [ ] **Step 5: UI 배선**

`src/list/ImportExport.svelte` — props에 `onImportHtml` 추가:
```ts
let {
  onExport,
  onImport,
  onImportHtml,
}: {
  onExport: () => string;
  onImport: (text: string) => number;
  onImportHtml: (html: string) => { groups: number; tabs: number };
} = $props();

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const res = onImportHtml(await file.text());
  message =
    res.groups > 0
      ? `그룹 ${res.groups}개(탭 ${res.tabs}개)를 가져왔습니다.`
      : 'OneTab 그룹을 찾지 못했습니다.';
  input.value = '';
}
```

`.panel` 안 `.buttons` div에 버튼(label) 추가 — 기존 버튼들 뒤:
```svelte
<label class="file-btn">
  OneTab HTML 파일 가져오기
  <input type="file" accept=".html,text/html" onchange={handleFile} />
</label>
```

스타일 추가 (`<style>`, 토큰만 사용):
```css
.file-btn {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
}
.file-btn:hover {
  background: var(--surface-hover);
}
.file-btn input {
  display: none;
}
```

`src/list/App.svelte` — import에 `parseOneTabHtml` 추가, 핸들러 추가:
```ts
function handleImportHtml(html: string): { groups: number; tabs: number } {
  const parsed = parseOneTabHtml(html);
  if (parsed.length > 0) {
    void update((current) => {
      let next = current;
      for (const g of [...parsed].reverse()) {
        next = addGroup(next, { ...createGroup(g.tabs, g.createdAt ?? Date.now()), name: g.name });
      }
      return next;
    });
  }
  return {
    groups: parsed.length,
    tabs: parsed.reduce((sum, g) => sum + g.tabs.length, 0),
  };
}
```

템플릿: `<ImportExport ... onImportHtml={handleImportHtml} />`

- [ ] **Step 6: 실데이터 로컬 검증 (커밋 금지)**

`src/onetab-real.local.test.ts`를 임시 생성:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseOneTabHtml } from './importExport';

describe('실데이터 검증(로컬 전용)', () => {
  it('onetab-all.html 파싱', () => {
    const html = readFileSync('/Users/me/Downloads/onetab-all.html', 'utf8');
    const groups = parseOneTabHtml(html);
    console.log('groups:', groups.length, 'tabs:', groups.reduce((s, g) => s + g.tabs.length, 0));
    expect(groups.length).toBe(14);
    expect(groups.reduce((s, g) => s + g.tabs.length, 0)).toBe(459);
  });
});
```
Run: `npx vitest run src/onetab-real.local.test.ts` → 통과 확인 후 **파일 삭제**.
Expected: groups 14 / tabs 459. 커밋 전 `git status`에 이 파일이 없어야 한다.

- [ ] **Step 7: 전체 검증 + 커밋**

Run: `npm run check && npx vitest run && npm run build`
Expected: 0/0, 전부 통과, 빌드 성공.

```bash
git add src/importExport.ts src/importExport.test.ts src/list/
git commit -m "feat: OneTab HTML 내보내기 가져오기 (그룹 이름·생성일 보존)"
```
