# 디자인 토큰(B안 페이퍼 아카이브) 도입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B안 "페이퍼 아카이브" 팔레트를 CSS 커스텀 프로퍼티 토큰으로 도입하고 v1 컴포넌트 4개의 하드코딩 값을 토큰으로 교체한다 (다크 모드 시스템 연동 포함).

**Architecture:** `src/list/tokens.css` 한 파일에 시멘틱 토큰 전부 + 다크 오버라이드 + 전역 `:focus-visible`. `main.ts`에서 import하여 목록 페이지 전역 적용. 컴포넌트 `<style>`은 토큰 참조로만 변경 — 마크업/로직 무변경.

**Tech Stack:** 기존 그대로 (Svelte 5 + Vite + TS). 신규 의존성 없음.

## Global Constraints

- 런타임 의존성 0 유지. 마크업/스크립트 로직 변경 금지 — `<style>` 블록과 tokens.css, list.html `<meta>` 1줄, main.ts import 1줄만 변경.
- 토큰 값은 스펙(docs/superpowers/specs/2026-07-14-design-guide.md)의 B안 표와 정확히 일치해야 한다.
- 미세 값 예외(스펙 명시): 16px 이하 요소의 3~4px 반경, 4px 미만 패딩, 아이콘 글리프 크기(16px)는 리터럴 유지 허용.
- `npm run check` 0 errors 0 warnings, `npx vitest run` 16/16, `npm run build` 성공.
- Conventional commits.

---

### Task 1: 토큰 도입 + 컴포넌트 마이그레이션

**Files:**
- Create: `src/list/tokens.css`
- Modify: `list.html` (meta 1줄), `src/list/main.ts` (import 1줄)
- Modify: `src/list/App.svelte`, `src/list/Group.svelte`, `src/list/TabItem.svelte`, `src/list/ImportExport.svelte` (각 `<style>` 블록만)

**Interfaces:**
- Consumes: 기존 컴포넌트의 `<style>` 블록
- Produces: 이후 모든 UI 작업이 사용할 토큰 세트 (`--bg` `--surface` `--surface-hover` `--border` `--border-strong` `--text` `--text-muted` `--text-faint` `--accent` `--danger` `--success` `--focus` `--space-1..6` `--radius-sm` `--radius-md` `--font-sans` `--font-mono` `--text-xs` `--text-sm` `--text-lg`)

- [ ] **Step 1: tokens.css 작성**

`src/list/tokens.css`:
```css
:root {
  color-scheme: light dark;

  /* 색 — B안 페이퍼 아카이브 (라이트) */
  --bg: #faf8f5;
  --surface: #fffdfa;
  --surface-hover: #f3efe8;
  --border: #e7e1d8;
  --border-strong: #d5cdc0;
  --text: #26221b;
  --text-muted: #7d756a;
  --text-faint: #a09a8e;
  --accent: #23684d;
  --danger: #b42318;
  --success: #1f7a4d;
  --focus: #23684d;

  /* 간격 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* 반경 */
  --radius-sm: 7px;
  --radius-md: 12px;

  /* 타이포 */
  --font-sans: system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif;
  --font-mono: ui-monospace, monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-lg: 20px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161815;
    --surface: #1e211c;
    --surface-hover: #262a24;
    --border: #34382f;
    --border-strong: #454a3f;
    --text: #e9e7e1;
    --text-muted: #a09a8e;
    --text-faint: #7d756a;
    --accent: #6fbf95;
    --danger: #f2705d;
    --success: #4cc38a;
    --focus: #6fbf95;
  }
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

- [ ] **Step 2: 로드 배선**

`list.html`의 `<head>`에 추가 (title 위):
```html
    <meta name="color-scheme" content="light dark" />
```

`src/list/main.ts` 맨 위에 추가:
```ts
import './tokens.css';
```

- [ ] **Step 3: App.svelte `<style>` 토큰 교체**

`<style>` 블록만 수정. 매핑 (좌 → 우 교체):

| 기존 | 교체 |
|---|---|
| `background: #f8f9fb` | `background: var(--bg)` |
| `color: #101828` | `color: var(--text)` |
| `font-family: system-ui, ...` 전체 스택 | `font-family: var(--font-sans)` |
| `font-size: 14px` (body) | `font-size: var(--text-sm)` |
| `padding: 24px 16px 64px` (main) | `padding: var(--space-5) var(--space-4) var(--space-6)` |
| `gap: 12px` (.page-header) | `gap: var(--space-3)` |
| `margin-bottom: 20px` (.page-header) | `margin-bottom: var(--space-5)` |
| `font-size: 20px` (h1) | `font-size: var(--text-lg)` |
| `color: #667085` (.summary, .empty) | `color: var(--text-muted)` |
| `padding: 48px 0` (.empty) | `padding: var(--space-6) 0` |

- [ ] **Step 4: Group.svelte `<style>` 토큰 교체**

| 기존 | 교체 |
|---|---|
| `background: #fff` (.group, .actions button) | `background: var(--surface)` |
| `border: 1px solid #e4e7ec` (.group) | `border: 1px solid var(--border)` |
| `border-radius: 10px` (.group) | `border-radius: var(--radius-md)` |
| `padding: 12px 16px` (.group) | `padding: var(--space-3) var(--space-4)` |
| `margin-bottom: 16px` (.group) | `margin-bottom: var(--space-4)` |
| `gap: 10px` (header) | `gap: var(--space-2)` |
| `margin-bottom: 8px` (header) | `margin-bottom: var(--space-2)` |
| `color: #667085` (.meta) | `color: var(--text-muted)` |
| `font-size: 12px` (.meta, .actions button) | `font-size: var(--text-xs)` |
| `gap: 6px` (.actions) | `gap: var(--space-2)` |
| `padding: 3px 8px` (.actions button) | `padding: 3px var(--space-2)` |
| `border: 1px solid #d0d5dd` (.actions button) | `border: 1px solid var(--border-strong)` |
| `border-radius: 6px` (.actions button) | `border-radius: var(--radius-sm)` |
| `background: #f2f4f7` (hover) | `background: var(--surface-hover)` |

- [ ] **Step 5: TabItem.svelte `<style>` 토큰 교체**

| 기존 | 교체 |
|---|---|
| `gap: 8px` (.tab-item) | `gap: var(--space-2)` |
| `padding: 4px 8px` (.tab-item) | `padding: var(--space-1) var(--space-2)` |
| `border-radius: 6px` (.tab-item) | `border-radius: var(--radius-sm)` |
| `background: #f2f4f7` (hover) | `background: var(--surface-hover)` |
| `background: #d5d9e0` (.placeholder) | `background: var(--border-strong)` |
| `border-radius: 4px` (.placeholder) | 유지 (미세 값 예외) |
| `color: #1a56db` (.title) | `color: var(--accent)` |
| `color: #98a2b3` (.delete) | `color: var(--text-faint)` |
| `font-size: 16px` (.delete) | 유지 (글리프 크기 예외) |
| `color: #d92d20` (.delete:hover) | `color: var(--danger)` |
| `color: #d0d5dd` (.delete:disabled) | `color: var(--border-strong)` |

- [ ] **Step 6: ImportExport.svelte `<style>` 토큰 교체**

| 기존 | 교체 |
|---|---|
| `font-size: 12px` (.toggle, .buttons button, .message) | `font-size: var(--text-xs)` |
| `padding: 4px 10px` (.toggle, .buttons button) | `padding: var(--space-1) var(--space-3)` |
| `border: 1px solid #d0d5dd` (버튼, textarea) | `border: 1px solid var(--border-strong)` |
| `border-radius: 6px` (버튼, textarea) | `border-radius: var(--radius-sm)` |
| `background: #fff` (버튼) | `background: var(--surface)` |
| `background: #f2f4f7` (hover) | `background: var(--surface-hover)` |
| `margin-top: 8px` (.panel) | `margin-top: var(--space-2)` |
| `font: 12px/1.5 ui-monospace, monospace` (textarea) | `font: var(--text-xs)/1.5 var(--font-mono)` ← CSS `font` 축약형에 var()가 안 통하면 `font-family: var(--font-mono); font-size: var(--text-xs); line-height: 1.5;`로 풀어쓴다 |
| `padding: 8px` (textarea) | `padding: var(--space-2)` |
| `gap: 8px` / `margin-top: 6px` (.buttons) | `gap: var(--space-2)` / `margin-top: var(--space-2)` |
| `color: #027a48` (.message) | `color: var(--success)` |

- [ ] **Step 7: 잔여 리터럴 검사**

Run: `grep -nE '#[0-9a-fA-F]{3,6}' src/list/*.svelte`
Expected: 출력 없음 (색 리터럴 0개). 있으면 매핑 누락 — 해당 값을 역할에 맞는 토큰으로 교체.

- [ ] **Step 8: 검증**

Run: `npm run check && npx vitest run && npm run build`
Expected: 0 errors/0 warnings, 16/16, 빌드 성공.

- [ ] **Step 9: Commit**

```bash
git add src/list/ list.html
git commit -m "feat: B안 페이퍼 아카이브 디자인 토큰 도입 및 컴포넌트 적용"
```
