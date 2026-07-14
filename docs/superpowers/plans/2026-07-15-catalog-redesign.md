# 카탈로그 재디자인 (시안 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바+리스트의 카탈로그 레이아웃으로 목록 페이지를 재편하고, 검색·즐겨찾기(★)·잠긴 그룹 보기를 추가한다.

**Architecture:** 순수 필터 로직(`src/filter.ts`)과 `toggleStar`를 TDD로 먼저 만들고(Task 1), UI 재편(Sidebar 신설 + App 레이아웃 교체 + TabItem 별 토글)을 그 위에 얹는다(Task 2). view/query는 저장하지 않는 UI 상태.

**Tech Stack:** 기존 그대로. 신규 의존성 없음.

## Global Constraints

- 스타일은 디자인 토큰만 (리터럴 색/간격 금지; 16px 이하 미세 값 예외는 기존 규칙 유지).
- `SavedTab.starred`는 선택 필드 — 기존 저장 데이터 마이그레이션 없음 (undefined=false).
- 즐겨찾기 탭은 복원(클릭/전체 복원)해도 목록에 유지. 명시적 삭제(×)는 가능.
- 잠금 no-op 규칙(storage 계층)은 그대로. `toggleStar`는 잠긴 그룹에서도 동작(메타데이터 변경).
- 게이트: `npm run check` 0/0, 테스트 전부 통과, `npm run build` 성공. Conventional commits.

---

### Task 1: 순수 로직 — filter.ts + toggleStar (TDD)

**Files:**
- Modify: `src/types.ts` (starred 필드)
- Create: `src/filter.ts`, `src/filter.test.ts`
- Modify: `src/storage.ts`, `src/storage.test.ts` (toggleStar)

**Interfaces:**
- Produces (Task 2가 사용):
  - `type ListView = 'all' | 'starred' | 'locked'`
  - `filterGroups(groups: TabGroup[], query: string): TabGroup[]` — 제목/URL 부분일치(대소문자 무시), 매칭 0 그룹 제거, 빈 query면 원본 그대로
  - `byView(groups: TabGroup[], view: ListView): TabGroup[]`
  - `countStarred(groups: TabGroup[]): number`, `countLockedGroups(groups: TabGroup[]): number`
  - `toggleStar(groups: TabGroup[], groupId: string, tabId: string): TabGroup[]`

- [ ] **Step 1: types.ts 수정**

`SavedTab`에 추가:
```ts
export interface SavedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  starred?: boolean;
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/filter.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { byView, countLockedGroups, countStarred, filterGroups } from './filter';

function fixture(): TabGroup[] {
  return [
    {
      id: 'g1', createdAt: 1000, name: '리서치', locked: false,
      tabs: [
        { id: 't1', url: 'https://svelte.dev/docs', title: 'Svelte 문서', starred: true },
        { id: 't2', url: 'https://developer.chrome.com/', title: 'Chrome Extensions' },
      ],
    },
    {
      id: 'g2', createdAt: 2000, name: '', locked: true,
      tabs: [{ id: 't3', url: 'https://c.com/', title: '여행 준비물' }],
    },
  ];
}

describe('filterGroups', () => {
  it('빈 검색어면 원본을 그대로 반환한다', () => {
    const groups = fixture();
    expect(filterGroups(groups, '  ')).toBe(groups);
  });

  it('제목 부분일치(대소문자 무시)로 탭을 거른다', () => {
    const result = filterGroups(fixture(), 'SVELTE');
    expect(result).toHaveLength(1);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t1']);
  });

  it('URL로도 매칭한다', () => {
    const result = filterGroups(fixture(), 'chrome.com');
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t2']);
  });

  it('매칭 0개인 그룹은 숨긴다', () => {
    const result = filterGroups(fixture(), '여행');
    expect(result.map((g) => g.id)).toEqual(['g2']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const groups = fixture();
    filterGroups(groups, 'svelte');
    expect(groups[0].tabs).toHaveLength(2);
  });
});

describe('byView', () => {
  it('all은 원본 그대로', () => {
    const groups = fixture();
    expect(byView(groups, 'all')).toBe(groups);
  });

  it('starred는 별표 탭만, 없는 그룹은 숨긴다', () => {
    const result = byView(fixture(), 'starred');
    expect(result).toHaveLength(1);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t1']);
  });

  it('locked는 잠긴 그룹만', () => {
    expect(byView(fixture(), 'locked').map((g) => g.id)).toEqual(['g2']);
  });
});

describe('counts', () => {
  it('별표 탭 수와 잠긴 그룹 수를 센다', () => {
    expect(countStarred(fixture())).toBe(1);
    expect(countLockedGroups(fixture())).toBe(1);
  });
});
```

`src/storage.test.ts`에 추가 (기존 fixture 재사용):
```ts
import { toggleStar } from './storage';

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
```

- [ ] **Step 3: 실패 확인**

Run: `npx vitest run src/filter.test.ts src/storage.test.ts`
Expected: FAIL — `./filter` 모듈 없음, `toggleStar` export 없음.

- [ ] **Step 4: 구현**

`src/filter.ts`:
```ts
import type { TabGroup } from './types';

export type ListView = 'all' | 'starred' | 'locked';

export function filterGroups(groups: TabGroup[], query: string): TabGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      tabs: g.tabs.filter(
        (t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.tabs.length > 0);
}

export function byView(groups: TabGroup[], view: ListView): TabGroup[] {
  if (view === 'locked') return groups.filter((g) => g.locked);
  if (view === 'starred') {
    return groups
      .map((g) => ({ ...g, tabs: g.tabs.filter((t) => t.starred === true) }))
      .filter((g) => g.tabs.length > 0);
  }
  return groups;
}

export function countStarred(groups: TabGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.tabs.filter((t) => t.starred === true).length,
    0,
  );
}

export function countLockedGroups(groups: TabGroup[]): number {
  return groups.filter((g) => g.locked).length;
}
```

`src/storage.ts`에 추가:
```ts
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
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run`
Expected: 기존 22개 + 신규 12개 전부 통과.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/filter.ts src/filter.test.ts src/storage.ts src/storage.test.ts
git commit -m "feat: 검색/보기 필터 순수 로직 및 즐겨찾기 토글"
```

---

### Task 2: 카탈로그 레이아웃 UI

**Files:**
- Create: `src/list/Sidebar.svelte`
- Modify: `src/list/App.svelte` (전체 교체 — 아래 코드)
- Modify: `src/list/TabItem.svelte` (별 토글 추가)
- Modify: `src/list/Group.svelte` (onToggleStar 전달)

**Interfaces:**
- Consumes: Task 1의 filter.ts/toggleStar 전부, 기존 storage/importExport 함수
- Produces: 최종 사용자 UI. Sidebar props: `query($bindable)`, `view`, `counts{tabs,groups,starred,locked}`, `onSelectView(view)`

- [ ] **Step 1: Sidebar.svelte 작성**

`src/list/Sidebar.svelte`:
```svelte
<script lang="ts">
  import type { ListView } from '../filter';

  let {
    query = $bindable(''),
    view,
    counts,
    onSelectView,
  }: {
    query: string;
    view: ListView;
    counts: { tabs: number; groups: number; starred: number; locked: number };
    onSelectView: (view: ListView) => void;
  } = $props();
</script>

<aside>
  <div class="logo">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="var(--text)" stroke-width="7" stroke-linejoin="round">
        <circle cx="60" cy="74" r="30" fill="var(--surface)" />
        <path d="M30,56 L30,42 Q30,30 44,30 L76,30 Q90,30 90,42 L90,56 Z" fill="var(--accent)" />
        <circle cx="44" cy="42" r="3.4" fill="var(--danger)" stroke="none" />
        <circle cx="50" cy="74" r="3.2" fill="var(--text)" stroke="none" />
        <circle cx="70" cy="74" r="3.2" fill="var(--text)" stroke="none" />
        <path d="M52,86 Q60,93 68,86" stroke-width="5" stroke-linecap="round" />
      </g>
    </svg>
    <span class="wordmark">SonTab</span>
  </div>

  <input
    class="search"
    type="search"
    placeholder="제목·주소 검색"
    bind:value={query}
  />

  <nav class="views">
    <button class:active={view === 'all'} onclick={() => onSelectView('all')}>
      전체 <span class="count">{counts.tabs}</span>
    </button>
    <button class:active={view === 'starred'} onclick={() => onSelectView('starred')}>
      ★ 즐겨찾기 <span class="count">{counts.starred}</span>
    </button>
    <button class:active={view === 'locked'} onclick={() => onSelectView('locked')}>
      🔒 잠긴 그룹 <span class="count">{counts.locked}</span>
    </button>
  </nav>

  <p class="summary">탭 {counts.tabs}개 · 그룹 {counts.groups}개</p>
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: var(--surface);
    border-right: 1px solid var(--border);
    position: sticky;
    top: 0;
    height: 100vh;
    box-sizing: border-box;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .logo svg {
    width: 30px;
    height: 30px;
  }
  .wordmark {
    font-size: var(--text-lg);
    font-weight: 800;
  }
  .search {
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg);
    color: var(--text);
  }
  .views {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .views button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    padding: var(--space-1) var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    cursor: pointer;
  }
  .views button:hover {
    background: var(--surface-hover);
  }
  .views button.active {
    background: var(--surface-hover);
    font-weight: 700;
  }
  .count {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
  .summary {
    margin-top: auto;
    margin-bottom: 0;
    font-size: var(--text-xs);
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
  }
  @media (max-width: 720px) {
    aside {
      position: static;
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: var(--space-3) var(--space-4);
    }
    .views {
      flex-direction: row;
    }
    .summary {
      margin-top: 0;
      border-top: none;
      padding-top: 0;
    }
  }
</style>
```

- [ ] **Step 2: App.svelte 전체 교체**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabGroup } from '../types';
  import {
    addGroup,
    countTabs,
    createGroup,
    loadGroups,
    persistGroups,
    removeGroup,
    removeTab,
    renameGroup,
    toggleLock,
    toggleStar,
  } from '../storage';
  import {
    byView,
    countLockedGroups,
    countStarred,
    filterGroups,
    type ListView,
  } from '../filter';
  import { exportText, parseImport, parseOneTabHtml } from '../importExport';
  import Group from './Group.svelte';
  import ImportExport from './ImportExport.svelte';
  import Sidebar from './Sidebar.svelte';

  let groups = $state<TabGroup[]>([]);
  let query = $state('');
  let view = $state<ListView>('all');

  const visible = $derived(filterGroups(byView(groups, view), query));
  const counts = $derived({
    tabs: countTabs(groups),
    groups: groups.length,
    starred: countStarred(groups),
    locked: countLockedGroups(groups),
  });
  const viewTitle = $derived(
    view === 'all' ? '전체' : view === 'starred' ? '즐겨찾기' : '잠긴 그룹',
  );

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

  async function update(mutate: (current: TabGroup[]) => TabGroup[]) {
    const next = mutate(await loadGroups());
    groups = next;
    await persistGroups(next);
  }

  async function openTab(url: string): Promise<boolean> {
    try {
      await chrome.tabs.create({ url, active: false });
      return true;
    } catch {
      return false;
    }
  }

  async function restoreTab(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const opened = await openTab(tab.url);
    if (opened && !tab.starred) {
      await update((g) => removeTab(g, group.id, tabId));
    }
  }

  async function restoreGroup(group: TabGroup) {
    const keep = new Set<string>();
    for (const tab of group.tabs) {
      const opened = await openTab(tab.url);
      if (!opened || tab.starred) keep.add(tab.id);
    }
    await update((current) => {
      if (keep.size === 0) return removeGroup(current, group.id);
      let next = current;
      for (const tab of group.tabs) {
        if (!keep.has(tab.id)) next = removeTab(next, group.id, tab.id);
      }
      return next;
    });
  }

  function handleImport(text: string): number {
    const parsed = parseImport(text);
    if (parsed.length > 0) {
      void update((current) => {
        let next = current;
        for (const tabs of [...parsed].reverse()) {
          next = addGroup(next, createGroup(tabs, Date.now()));
        }
        return next;
      });
    }
    return parsed.length;
  }

  function handleImportHtml(html: string): { groups: number; tabs: number } {
    const parsed = parseOneTabHtml(html);
    if (parsed.length > 0) {
      void update((current) => {
        let next = current;
        for (const g of [...parsed].reverse()) {
          next = addGroup(next, {
            ...createGroup(g.tabs, g.createdAt ?? Date.now()),
            name: g.name,
          });
        }
        return next;
      });
    }
    return {
      groups: parsed.length,
      tabs: parsed.reduce((sum, g) => sum + g.tabs.length, 0),
    };
  }
</script>

<div class="layout">
  <Sidebar bind:query {view} {counts} onSelectView={(v) => (view = v)} />

  <main>
    <header class="content-head">
      <h1>{viewTitle}</h1>
      <span class="meta">
        탭 {countTabs(visible)}개 · 그룹 {visible.length}개
      </span>
    </header>

    <ImportExport
      onExport={() => exportText(groups)}
      onImport={handleImport}
      onImportHtml={handleImportHtml}
    />

    {#if visible.length === 0}
      <p class="empty">
        {#if query.trim()}
          '{query.trim()}'에 맞는 탭이 없습니다.
        {:else if view === 'starred'}
          즐겨찾기한 탭이 없습니다. 탭 왼쪽의 ☆를 눌러 다시 읽을 페이지를 표시해 보세요.
        {:else if view === 'locked'}
          잠긴 그룹이 없습니다.
        {:else}
          저장된 탭이 없습니다. 툴바의 SonTab 아이콘을 눌러 탭을 모아보세요.
        {/if}
      </p>
    {:else}
      {#each visible as group (group.id)}
        <Group
          {group}
          onRestoreTab={(tabId) => restoreTab(group, tabId)}
          onDeleteTab={(tabId) => update((g) => removeTab(g, group.id, tabId))}
          onRestoreGroup={() => restoreGroup(group)}
          onDeleteGroup={() => update((g) => removeGroup(g, group.id))}
          onRename={(name) => update((g) => renameGroup(g, group.id, name))}
          onToggleLock={() => update((g) => toggleLock(g, group.id))}
          onToggleStar={(tabId) => update((g) => toggleStar(g, group.id, tabId))}
        />
      {/each}
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }
  .layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 100vh;
  }
  main {
    max-width: 760px;
    padding: var(--space-5) var(--space-4) var(--space-6);
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .content-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  h1 {
    font-size: var(--text-lg);
    margin: 0;
  }
  .meta {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--space-6) 0;
  }
  @media (max-width: 720px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
```

참고: `restoreGroup`은 화면에 보이는(필터된) 그룹 객체를 받으므로 "전체 복원"은
현재 보이는 탭만 연다 — 검색/즐겨찾기 보기에서 직관과 일치하는 의도된 동작.

- [ ] **Step 3: TabItem.svelte에 별 토글 추가**

`$props()` 타입/구조분해에 `onToggleStar: () => void` 추가.
마크업 — 파비콘 앞에 삽입:
```svelte
<button class="star" class:on={tab.starred} title="즐겨찾기" onclick={onToggleStar}>
  {tab.starred ? '★' : '☆'}
</button>
```
스타일 추가:
```css
.star {
  background: none;
  border: none;
  padding: 0;
  font-size: var(--text-xs);
  color: var(--border-strong);
  cursor: pointer;
}
.star:hover {
  color: var(--text-muted);
}
.star.on {
  color: var(--danger);
}
```
주의: `.star.on`의 색은 앰버 계열이 적합하지만 현 토큰에 앰버가 없으므로
`--danger`가 아닌 **신규 토큰 `--star: #f59f00` (다크 `#f7b955`)를
tokens.css에 추가**하고 `color: var(--star)`를 사용한다 (라이트/다크 모두).

- [ ] **Step 4: Group.svelte에 onToggleStar 전달**

props 타입/구조분해에 `onToggleStar: (tabId: string) => void` 추가.
`<TabItem ...>`에 `onToggleStar={() => onToggleStar(tab.id)}` 추가.

- [ ] **Step 5: 검증**

Run: `npm run check && npx vitest run && npm run build`
Expected: 0/0, 전부 통과, 빌드 성공.

Run: `grep -nE '#[0-9a-fA-F]{3,6}' src/list/*.svelte | grep -v '{#'`
Expected: 출력 없음 (색 리터럴 0).

- [ ] **Step 6: Commit**

```bash
git add src/list/ src/filter.ts
git commit -m "feat: 카탈로그 레이아웃 (사이드바+검색+보기 필터+즐겨찾기)"
```
