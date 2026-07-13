# SonTab (OneTab 클론) v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OneTab 기본 기능(탭 수집/복원/삭제/그룹 관리/가져오기·내보내기)을 갖춘 Manifest V3 크롬 익스텐션을 만든다.

**Architecture:** 서비스 워커(background.ts)가 툴바 클릭 시 탭을 수집해 `chrome.storage.local`에 저장하고, Svelte 5로 만든 목록 페이지(list.html)가 저장된 그룹을 렌더링/조작한다. 순수 로직(그룹 CRUD, 파서)은 chrome API와 분리된 모듈로 두어 Vitest로 테스트한다.

**Tech Stack:** TypeScript, Svelte 5(runes), Vite 6, Vitest, @types/chrome. 런타임 의존성 0.

## Global Constraints

- Manifest V3, 권한은 `tabs`, `storage`, `unlimitedStorage` 세 개만. 호스트 권한 금지.
- 런타임 의존성(dependencies) 0개 유지. devDependencies는 자유.
- 모든 소스는 TypeScript (`.ts`, `.svelte` 내 `lang="ts"`).
- 저장 성공 **후에만** 원본 탭을 닫는다 (데이터 유실 방지).
- 잠긴(locked) 그룹: 복원해도 항목 유지, 삭제 불가 — storage 계층에서 강제.
- 커밋 메시지는 conventional commits (`feat:`, `test:`, `chore:`, `docs:`).

---

### Task 1: 프로젝트 스캐폴딩 + 빌드 파이프라인

**Files:**
- Create: `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `.gitignore`
- Create: `public/manifest.json`
- Create: `list.html`, `src/list/main.ts`, `src/list/App.svelte`
- Create: `src/background.ts` (빈 껍데기)

**Interfaces:**
- Produces: `npm run build` → `dist/`에 `manifest.json`, `background.js`, `list.html`, `assets/*` 생성. 이후 모든 태스크가 이 빌드 파이프라인을 사용.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "sontab",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: 개발 의존성 설치**

Run:
```bash
npm install -D vite @sveltejs/vite-plugin-svelte svelte typescript svelte-check vitest @types/chrome @tsconfig/svelte
```
Expected: `package-lock.json` 생성, 에러 없음. `dependencies` 항목이 생기지 않아야 함.

- [ ] **Step 3: 설정 파일 작성**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        list: 'list.html',
        background: 'src/background.ts',
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
```

`svelte.config.js`:
```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default { preprocess: vitePreprocess() };
```

`tsconfig.json`:
```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["chrome", "vite/client"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"]
}
```

`.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 4: manifest.json 작성**

`public/manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "SonTab",
  "version": "0.1.0",
  "description": "탭을 한 곳에 모아 메모리를 아끼는 가벼운 탭 관리자",
  "permissions": ["tabs", "storage", "unlimitedStorage"],
  "background": { "service_worker": "background.js", "type": "module" },
  "action": { "default_title": "탭 모으기" }
}
```

참고: v1에서는 아이콘 파일을 넣지 않는다 (크롬이 기본 퍼즐 아이콘 표시). 아이콘은 v2 폴리시 항목.

- [ ] **Step 5: 최소 엔트리 작성**

`list.html` (프로젝트 루트):
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SonTab</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/list/main.ts"></script>
  </body>
</html>
```

`src/list/main.ts`:
```ts
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
```

`src/list/App.svelte`:
```svelte
<h1>SonTab</h1>
```

`src/background.ts`:
```ts
console.log('sontab service worker loaded');
export {};
```

- [ ] **Step 6: 빌드 검증**

Run: `npm run build && ls dist dist/assets`
Expected: `dist/manifest.json`, `dist/background.js`, `dist/list.html`, `dist/assets/list-*.js` 존재.

Run: `cat dist/list.html | grep assets`
Expected: 해시된 JS 경로가 삽입되어 있음.

- [ ] **Step 7: 크롬 로드 스모크 테스트 (수동)**

`chrome://extensions` → 개발자 모드 → "압축해제된 확장 프로그램 로드" → `dist/` 선택.
Expected: 에러 없이 로드, 서비스 워커 콘솔에 `sontab service worker loaded`.
(자동화 불가 단계 — 실행자가 크롬을 쓸 수 없으면 빌드 성공까지만 확인하고 넘어간다.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: Vite+Svelte5+TS 익스텐션 스캐폴딩"
```

---

### Task 2: 타입 정의 + 그룹 CRUD 순수 로직 (TDD)

**Files:**
- Create: `src/types.ts`
- Create: `src/storage.ts`
- Test: `src/storage.test.ts`

**Interfaces:**
- Produces (이후 모든 태스크가 사용):
  - `interface SavedTab { id: string; url: string; title: string; favIconUrl?: string }`
  - `interface TabGroup { id: string; createdAt: number; name: string; locked: boolean; tabs: SavedTab[] }`
  - `createGroup(tabs: SavedTab[], createdAt: number): TabGroup`
  - `addGroup(groups: TabGroup[], group: TabGroup): TabGroup[]` — 앞에 추가
  - `removeTab(groups: TabGroup[], groupId: string, tabId: string): TabGroup[]` — 잠긴 그룹 no-op, 빈 그룹 자동 제거
  - `removeGroup(groups: TabGroup[], groupId: string): TabGroup[]` — 잠긴 그룹 no-op
  - `renameGroup(groups: TabGroup[], groupId: string, name: string): TabGroup[]`
  - `toggleLock(groups: TabGroup[], groupId: string): TabGroup[]`
  - `countTabs(groups: TabGroup[]): number`
  - `loadGroups(): Promise<TabGroup[]>` / `persistGroups(groups: TabGroup[]): Promise<void>` — chrome.storage.local 키 `"groups"`

- [ ] **Step 1: 타입 작성**

`src/types.ts`:
```ts
export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
}

export interface TabGroup {
  id: string;
  createdAt: number;
  name: string;
  locked: boolean;
  tabs: SavedTab[];
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/storage.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import {
  addGroup,
  countTabs,
  createGroup,
  removeGroup,
  removeTab,
  renameGroup,
  toggleLock,
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
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/storage.test.ts`
Expected: FAIL — `Cannot find module './storage'` 류의 에러.

- [ ] **Step 4: 구현**

`src/storage.ts`:
```ts
import type { SavedTab, TabGroup } from './types';

const KEY = 'groups';

export function createGroup(tabs: SavedTab[], createdAt: number): TabGroup {
  return { id: crypto.randomUUID(), createdAt, name: '', locked: false, tabs };
}

export function addGroup(groups: TabGroup[], group: TabGroup): TabGroup[] {
  return [group, ...groups];
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

export async function loadGroups(): Promise<TabGroup[]> {
  const data = await chrome.storage.local.get(KEY);
  return (data[KEY] as TabGroup[] | undefined) ?? [];
}

export async function persistGroups(groups: TabGroup[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: groups });
}
```

참고: `loadGroups`/`persistGroups`는 chrome API 얇은 래퍼라 단위 테스트하지 않는다 (Task 4·5에서 수동 검증). 테스트 파일이 이 모듈을 import해도 chrome 전역을 건드리지 않으므로 Vitest에서 안전하다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/storage.test.ts`
Expected: PASS — 10개 테스트 전부 통과.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/storage.ts src/storage.test.ts
git commit -m "feat: 탭 그룹 타입 및 CRUD 순수 로직"
```

---

### Task 3: 가져오기/내보내기 파서 (TDD)

**Files:**
- Create: `src/importExport.ts`
- Test: `src/importExport.test.ts`

**Interfaces:**
- Consumes: `SavedTab`, `TabGroup` (Task 2의 `src/types.ts`)
- Produces:
  - `exportText(groups: TabGroup[]): string` — `URL | 제목` 줄, 그룹 사이 빈 줄 (OneTab 호환)
  - `parseImport(text: string): SavedTab[][]` — 빈 줄로 그룹 구분, 파싱 불가 줄은 건너뜀

- [ ] **Step 1: 실패하는 테스트 작성**

`src/importExport.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { exportText, parseImport } from './importExport';

describe('exportText', () => {
  it('URL | 제목 형식으로 그룹 사이 빈 줄을 넣어 출력한다', () => {
    const groups: TabGroup[] = [
      {
        id: 'g1', createdAt: 1, name: '', locked: false,
        tabs: [
          { id: 't1', url: 'https://a.com/', title: 'A' },
          { id: 't2', url: 'https://b.com/', title: '' },
        ],
      },
      {
        id: 'g2', createdAt: 2, name: '', locked: false,
        tabs: [{ id: 't3', url: 'https://c.com/', title: 'C' }],
      },
    ];
    expect(exportText(groups)).toBe(
      'https://a.com/ | A\nhttps://b.com/\n\nhttps://c.com/ | C',
    );
  });
});

describe('parseImport', () => {
  it('빈 줄로 그룹을 나누고 제목을 파싱한다', () => {
    const parsed = parseImport('https://a.com/ | A\nhttps://b.com/\n\nhttps://c.com/ | C');
    expect(parsed).toHaveLength(2);
    expect(parsed[0].map((t) => t.url)).toEqual(['https://a.com/', 'https://b.com/']);
    expect(parsed[0][0].title).toBe('A');
    expect(parsed[0][1].title).toBe('');
    expect(parsed[0][0].id).toBeTruthy();
  });

  it('URL이 아닌 줄은 건너뛴다', () => {
    const parsed = parseImport('메모입니다\nhttps://a.com/ | A\nnot-a-url');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveLength(1);
  });

  it('유효한 줄이 하나도 없으면 빈 배열을 반환한다', () => {
    expect(parseImport('그냥 텍스트\n\n또 텍스트')).toEqual([]);
  });

  it('제목에 구분자가 들어 있어도 첫 구분자만 사용한다', () => {
    const parsed = parseImport('https://a.com/ | A | B');
    expect(parsed[0][0].title).toBe('A | B');
  });

  it('내보내기 결과를 다시 가져오면 같은 구조가 된다 (roundtrip)', () => {
    const groups: TabGroup[] = [
      {
        id: 'g1', createdAt: 1, name: '', locked: false,
        tabs: [{ id: 't1', url: 'https://a.com/path?q=1', title: '제목 A' }],
      },
    ];
    const parsed = parseImport(exportText(groups));
    expect(parsed[0][0].url).toBe('https://a.com/path?q=1');
    expect(parsed[0][0].title).toBe('제목 A');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/importExport.test.ts`
Expected: FAIL — `Cannot find module './importExport'`.

- [ ] **Step 3: 구현**

`src/importExport.ts`:
```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run`
Expected: PASS — storage 테스트 포함 전부 통과.

- [ ] **Step 5: Commit**

```bash
git add src/importExport.ts src/importExport.test.ts
git commit -m "feat: OneTab 호환 가져오기/내보내기 파서"
```

---

### Task 4: 백그라운드 서비스 워커 (탭 수집)

**Files:**
- Modify: `src/background.ts` (Task 1의 껍데기 전체 교체)

**Interfaces:**
- Consumes: `createGroup`, `addGroup`, `loadGroups`, `persistGroups` (Task 2), `SavedTab` (Task 2)
- Produces: 툴바 클릭 → 수집/저장/닫기/목록 페이지 열기 동작. 목록 페이지 URL은 `chrome.runtime.getURL('list.html')`.

- [ ] **Step 1: 구현**

`src/background.ts` 전체를 다음으로 교체:
```ts
import { addGroup, createGroup, loadGroups, persistGroups } from './storage';
import type { SavedTab } from './types';

const LIST_PATH = 'list.html';

chrome.action.onClicked.addListener((activeTab) => {
  void collectWindow(activeTab.windowId);
});

async function collectWindow(windowId: number): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const tabs = await chrome.tabs.query({ windowId });
  const collectible = tabs.filter(
    (t) => !t.pinned && t.id !== undefined && !!t.url && !t.url.startsWith(listUrl),
  );

  // 저장이 성공한 뒤에만 탭을 닫는다 (실패 시 탭 유지 = 데이터 유실 방지)
  if (collectible.length > 0) {
    const saved: SavedTab[] = collectible.map((t) => ({
      id: crypto.randomUUID(),
      url: t.url!,
      title: t.title || t.url!,
      favIconUrl: t.favIconUrl,
    }));
    const groups = await loadGroups();
    await persistGroups(addGroup(groups, createGroup(saved, Date.now())));
  }

  await openListPage(windowId);

  if (collectible.length > 0) {
    await chrome.tabs.remove(collectible.map((t) => t.id!));
  }
}

async function openListPage(windowId: number): Promise<void> {
  const listUrl = chrome.runtime.getURL(LIST_PATH);
  const [existing] = await chrome.tabs.query({ url: listUrl });
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: listUrl, windowId });
  }
}
```

주의: 탭을 닫기 전에 목록 페이지를 먼저 연다 — 창의 모든 탭을 닫으면 창 자체가 닫히는 것을 방지.

- [ ] **Step 2: 타입 검사 + 빌드**

Run: `npx tsc --noEmit -p tsconfig.json && npm run build`
Expected: 타입 에러 없음, 빌드 성공, `dist/background.js` 갱신.

- [ ] **Step 3: 크롬 수동 검증**

`chrome://extensions`에서 새로고침 후:
1. 일반 탭 2-3개 연 상태에서 툴바 아이콘 클릭
2. Expected: 탭이 닫히고 list.html 탭이 열림 (아직 UI는 "SonTab" 제목만 표시)
3. 서비스 워커 DevTools → `chrome.storage.local.get('groups', console.log)` 실행
4. Expected: 방금 수집한 그룹 1개, 탭 항목에 url/title 존재
5. 고정 탭을 하나 만들고 다시 클릭 → 고정 탭은 닫히지 않고 목록에도 없음
(크롬을 쓸 수 없는 실행자는 이 단계를 건너뛰고 커밋 메시지에 "수동 검증 보류" 명시.)

- [ ] **Step 4: Commit**

```bash
git add src/background.ts
git commit -m "feat: 툴바 클릭으로 탭 수집·저장·닫기"
```

---

### Task 5: 목록 페이지 UI (그룹/탭 렌더링 + 복원/삭제/이름/잠금)

**Files:**
- Modify: `src/list/App.svelte` (전체 교체)
- Create: `src/list/Group.svelte`
- Create: `src/list/TabItem.svelte`

**Interfaces:**
- Consumes: Task 2의 storage 함수 전부, `TabGroup`/`SavedTab` 타입
- Produces: 동작하는 목록 페이지. Task 6이 `App.svelte`의 `groups` 상태와 `update()` 패턴에 ImportExport 패널을 끼워 넣는다.

- [ ] **Step 1: TabItem.svelte 작성**

`src/list/TabItem.svelte`:
```svelte
<script lang="ts">
  import type { SavedTab } from '../types';

  let {
    tab,
    onRestore,
    onDelete,
  }: {
    tab: SavedTab;
    onRestore: () => void;
    onDelete: () => void;
  } = $props();
</script>

<li class="tab-item">
  {#if tab.favIconUrl}
    <img class="favicon" src={tab.favIconUrl} alt="" />
  {:else}
    <span class="favicon placeholder"></span>
  {/if}
  <button class="title" title={tab.url} onclick={onRestore}>
    {tab.title || tab.url}
  </button>
  <button class="delete" title="삭제" onclick={onDelete}>×</button>
</li>

<style>
  .tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .tab-item:hover {
    background: #f2f4f7;
  }
  .favicon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .placeholder {
    display: inline-block;
    background: #d5d9e0;
    border-radius: 4px;
  }
  .title {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: #1a56db;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title:hover {
    text-decoration: underline;
  }
  .delete {
    background: none;
    border: none;
    color: #98a2b3;
    font-size: 16px;
    cursor: pointer;
    padding: 0 4px;
    visibility: hidden;
  }
  .tab-item:hover .delete {
    visibility: visible;
  }
  .delete:hover {
    color: #d92d20;
  }
</style>
```

- [ ] **Step 2: Group.svelte 작성**

`src/list/Group.svelte`:
```svelte
<script lang="ts">
  import type { TabGroup } from '../types';
  import TabItem from './TabItem.svelte';

  let {
    group,
    onRestoreTab,
    onDeleteTab,
    onRestoreGroup,
    onDeleteGroup,
    onRename,
    onToggleLock,
  }: {
    group: TabGroup;
    onRestoreTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onRestoreGroup: () => void;
    onDeleteGroup: () => void;
    onRename: (name: string) => void;
    onToggleLock: () => void;
  } = $props();

  let editing = $state(false);
  let draft = $state('');

  function startEdit() {
    draft = group.name;
    editing = true;
  }

  function commitEdit() {
    editing = false;
    if (draft !== group.name) onRename(draft);
  }

  const dateLabel = new Date(group.createdAt).toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
</script>

<section class="group">
  <header>
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="name-input"
        bind:value={draft}
        autofocus
        onblur={commitEdit}
        onkeydown={(e) => {
          if (e.key === 'Enter') commitEdit();
          if (e.key === 'Escape') editing = false;
        }}
      />
    {:else}
      <button class="name" onclick={startEdit} title="이름 바꾸기">
        {group.name || `탭 ${group.tabs.length}개`}
      </button>
    {/if}
    <span class="meta">{group.tabs.length}개 · {dateLabel}</span>
    <span class="actions">
      <button onclick={onRestoreGroup}>전체 복원</button>
      <button onclick={onToggleLock}>{group.locked ? '🔒 잠금 해제' : '잠금'}</button>
      <button onclick={onDeleteGroup} disabled={group.locked}>그룹 삭제</button>
    </span>
  </header>
  <ul>
    {#each group.tabs as tab (tab.id)}
      <TabItem
        {tab}
        onRestore={() => onRestoreTab(tab.id)}
        onDelete={() => onDeleteTab(tab.id)}
      />
    {/each}
  </ul>
</section>

<style>
  .group {
    background: #fff;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .name {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    cursor: text;
  }
  .name-input {
    font: inherit;
    font-weight: 600;
  }
  .meta {
    color: #667085;
    font-size: 12px;
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
  }
  .actions button {
    font-size: 12px;
    padding: 3px 8px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .actions button:hover:not(:disabled) {
    background: #f2f4f7;
  }
  .actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
```

- [ ] **Step 3: App.svelte 전체 교체**

`src/list/App.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabGroup } from '../types';
  import {
    countTabs,
    loadGroups,
    persistGroups,
    removeGroup,
    removeTab,
    renameGroup,
    toggleLock,
  } from '../storage';
  import Group from './Group.svelte';

  let groups = $state<TabGroup[]>([]);

  onMount(() => {
    void loadGroups().then((g) => (groups = g));
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes.groups) {
        groups = (changes.groups.newValue as TabGroup[] | undefined) ?? [];
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  });

  async function update(next: TabGroup[]) {
    groups = next;
    await persistGroups(next);
  }

  async function openTab(url: string): Promise<boolean> {
    try {
      await chrome.tabs.create({ url, active: false });
      return true;
    } catch {
      return false; // 복원 실패(특수 URL 등) 시 항목 유지
    }
  }

  async function restoreTab(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    if (await openTab(tab.url)) {
      await update(removeTab(groups, group.id, tabId));
    }
  }

  async function restoreGroup(group: TabGroup) {
    for (const tab of group.tabs) {
      await openTab(tab.url);
    }
    await update(removeGroup(groups, group.id));
  }
</script>

<main>
  <header class="page-header">
    <h1>SonTab</h1>
    <p class="summary">탭 {countTabs(groups)}개 · 그룹 {groups.length}개</p>
  </header>

  {#if groups.length === 0}
    <p class="empty">저장된 탭이 없습니다. 툴바의 SonTab 아이콘을 눌러 탭을 모아보세요.</p>
  {:else}
    {#each groups as group (group.id)}
      <Group
        {group}
        onRestoreTab={(tabId) => restoreTab(group, tabId)}
        onDeleteTab={(tabId) => update(removeTab(groups, group.id, tabId))}
        onRestoreGroup={() => restoreGroup(group)}
        onDeleteGroup={() => update(removeGroup(groups, group.id))}
        onRename={(name) => update(renameGroup(groups, group.id, name))}
        onToggleLock={() => update(toggleLock(groups, group.id))}
      />
    {/each}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #f8f9fb;
    color: #101828;
    font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif;
    font-size: 14px;
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 16px 64px;
  }
  .page-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 20px;
    margin: 0;
  }
  .summary {
    color: #667085;
    margin: 0;
  }
  .empty {
    color: #667085;
    text-align: center;
    padding: 48px 0;
  }
</style>
```

- [ ] **Step 4: 타입 검사 + 빌드**

Run: `npm run check && npm run build`
Expected: svelte-check 에러 0, 빌드 성공.

- [ ] **Step 5: 크롬 수동 검증**

익스텐션 새로고침 후 확인:
1. 탭 수집 → 목록 페이지에 그룹과 탭 표시, 상단에 "탭 N개 · 그룹 M개"
2. 탭 제목 클릭 → 백그라운드 탭으로 열리고 목록에서 사라짐
3. "전체 복원" → 모든 탭 열리고 그룹 사라짐
4. 그룹 잠금 → 탭 클릭해도 항목 유지, "그룹 삭제" 비활성화
5. 그룹 이름 클릭 → 인라인 편집, Enter로 저장
6. 목록 페이지가 열린 채 다른 창에서 수집 → 목록 자동 갱신 (onChanged)

- [ ] **Step 6: Commit**

```bash
git add src/list/
git commit -m "feat: 탭 목록 페이지 UI (복원/삭제/이름/잠금)"
```

---

### Task 6: 가져오기/내보내기 패널

**Files:**
- Create: `src/list/ImportExport.svelte`
- Modify: `src/list/App.svelte` (패널 연결)

**Interfaces:**
- Consumes: `exportText`, `parseImport` (Task 3), `createGroup`, `addGroup` (Task 2), App.svelte의 `groups` 상태와 `update()` 함수 (Task 5)

- [ ] **Step 1: ImportExport.svelte 작성**

`src/list/ImportExport.svelte`:
```svelte
<script lang="ts">
  let {
    onExport,
    onImport,
  }: {
    onExport: () => string;
    onImport: (text: string) => number;
  } = $props();

  let open = $state(false);
  let text = $state('');
  let message = $state('');

  function handleExport() {
    text = onExport();
    message = '';
  }

  function handleImport() {
    const added = onImport(text);
    message = added > 0 ? `그룹 ${added}개를 가져왔습니다.` : '가져올 URL이 없습니다.';
  }
</script>

<div class="import-export">
  <button class="toggle" onclick={() => (open = !open)}>
    {open ? '가져오기/내보내기 닫기' : '가져오기/내보내기'}
  </button>
  {#if open}
    <div class="panel">
      <textarea
        bind:value={text}
        rows="8"
        placeholder={'URL | 제목 형식, 그룹 사이는 빈 줄 (OneTab 호환)'}
      ></textarea>
      <div class="buttons">
        <button onclick={handleExport}>현재 목록 내보내기</button>
        <button onclick={handleImport}>텍스트 가져오기</button>
        {#if message}<span class="message">{message}</span>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .import-export {
    margin-bottom: 20px;
  }
  .toggle,
  .buttons button {
    font-size: 12px;
    padding: 4px 10px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .toggle:hover,
  .buttons button:hover {
    background: #f2f4f7;
  }
  .panel {
    margin-top: 8px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: 12px/1.5 ui-monospace, monospace;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    padding: 8px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
  }
  .message {
    font-size: 12px;
    color: #027a48;
  }
</style>
```

- [ ] **Step 2: App.svelte에 연결**

`src/list/App.svelte`의 `<script>`에 import 추가:
```ts
import { addGroup, createGroup } from '../storage';
import { exportText, parseImport } from '../importExport';
import ImportExport from './ImportExport.svelte';
```

`<script>` 안에 핸들러 추가:
```ts
function handleImport(text: string): number {
  const parsed = parseImport(text);
  let next = groups;
  for (const tabs of [...parsed].reverse()) {
    next = addGroup(next, createGroup(tabs, Date.now()));
  }
  if (parsed.length > 0) void update(next);
  return parsed.length;
}
```

템플릿의 `.page-header` 바로 아래에 추가:
```svelte
<ImportExport onExport={() => exportText(groups)} onImport={handleImport} />
```

- [ ] **Step 3: 타입 검사 + 빌드 + 테스트**

Run: `npm run check && npm run test && npm run build`
Expected: 전부 통과.

- [ ] **Step 4: 크롬 수동 검증**

1. 그룹이 있는 상태에서 "현재 목록 내보내기" → textarea에 `URL | 제목` 텍스트
2. 텍스트를 지우고 `https://example.com/ | 예시` 입력 후 "텍스트 가져오기" → 새 그룹 추가
3. 내보내기 → 전체 삭제 → 붙여넣고 가져오기 → 복원 확인 (roundtrip)

- [ ] **Step 5: Commit**

```bash
git add src/list/
git commit -m "feat: OneTab 호환 가져오기/내보내기 패널"
```

---

### Task 7: 최종 검증 + README

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: 전체 빌드 파이프라인

- [ ] **Step 1: 전체 검증 실행**

Run: `npm run check && npm run test && npm run build`
Expected: svelte-check 에러 0, 테스트 전부 통과, 빌드 성공.

Run: `du -sh dist && du -h dist/assets/*`
Expected: dist 전체 수백 KB 이하 (Svelte 런타임 포함 목록 페이지 JS는 수십 KB 수준). 결과 크기를 커밋 메시지에 기록.

- [ ] **Step 2: README 작성**

`README.md`:
```markdown
# SonTab

OneTab 스타일의 가벼운 탭 관리 크롬 익스텐션.
툴바 아이콘을 누르면 현재 창의 탭을 모두 저장하고 닫아 메모리를 아낍니다.

## 개발

​```bash
npm install
npm run build     # dist/ 생성
npm run dev       # watch 빌드
npm run test      # Vitest 단위 테스트
npm run check     # svelte-check 타입 검사
​```

## 크롬에 설치

1. `npm run build`
2. `chrome://extensions` → 개발자 모드 켜기
3. "압축해제된 확장 프로그램을 로드합니다" → `dist/` 폴더 선택

## 구조

- `src/background.ts` — 서비스 워커: 탭 수집/저장/닫기
- `src/storage.ts` — 그룹 CRUD (순수 로직 + chrome.storage 어댑터)
- `src/importExport.ts` — OneTab 호환 텍스트 파서
- `src/list/` — Svelte 5 목록 페이지
```

(README의 코드펜스는 실제 파일에서는 일반 ``` 를 사용한다.)

- [ ] **Step 3: 수동 인수 테스트 (전체 시나리오)**

스펙의 v1 기능 범위를 위에서부터 순서대로 확인:
- [ ] 수집: 아이콘 클릭 → 저장 → 닫힘 → 목록 열림
- [ ] 고정 탭/목록 페이지 제외
- [ ] 수집할 탭 0개면 목록 페이지만 열림
- [ ] 개별/전체 복원, 개별/그룹 삭제, 이름, 잠금
- [ ] 가져오기/내보내기 roundtrip
- [ ] 목록 페이지 열린 채 수집 시 자동 갱신

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README 및 v1 최종 검증"
```
