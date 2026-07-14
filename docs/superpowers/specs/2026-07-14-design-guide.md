# SonTab 디자인 가이드 (v2 준비) 설계

날짜: 2026-07-14
상태: 승인됨 — 테마 B안 "페이퍼 아카이브" 확정 (3안 아티팩트 비교 후 선택)

## 목표

v2(분류/즐겨찾기/태그)에서 UI가 늘어나기 전에 디자인 원칙과 토큰을 확립하고,
v1 컴포넌트의 하드코딩 스타일 값을 토큰으로 교체한다. 이후 모든 UI는 토큰만
사용한다.

## 디자인 원칙

1. **콘텐츠 우선** — 탭 목록이 주인공. 장식적 요소 최소화, 크롬(chrome)보다
   데이터에 시각적 무게를 둔다.
2. **가벼움** — 시스템 폰트 스택, 외부 리소스/웹폰트/이미지 0, CSS만으로
   구현. 빌드 산출물 크기 원칙(스펙 v1)과 동일선상.
3. **밀도** — 수백 개 탭을 훑기 좋은 컴팩트한 행. 기본 폰트 14px, 행 패딩
   4~8px 유지.
4. **접근성** — 본문 텍스트 대비 4.5:1 이상, 모든 인터랙티브 요소에
   `:focus-visible` 포커스 링, 아이콘 전용 버튼에 `title`/`aria-label`.

## 디자인 토큰

파일: `src/list/tokens.css` — `list.html`(또는 App.svelte 최상위)에서 로드.
시멘틱 네이밍만 사용한다 (raw 팔레트 이름 금지: `--blue-600` ❌ `--accent` ⭕).

### 색 — B안 "페이퍼 아카이브" (사용자 확정, 2026-07-14)

따뜻한 종이빛 바탕 + 딥 파인 그린 액센트. "탭 보관함/서재" 정체성.
다크는 `prefers-color-scheme: dark`에서 같은 토큰의 값만 교체.

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--bg` | `#faf8f5` | `#161815` | 페이지 배경 |
| `--surface` | `#fffdfa` | `#1e211c` | 카드/패널 |
| `--surface-hover` | `#f3efe8` | `#262a24` | 행 hover, 버튼 hover |
| `--border` | `#e7e1d8` | `#34382f` | 카드/입력 테두리 |
| `--border-strong` | `#d5cdc0` | `#454a3f` | 버튼 테두리 |
| `--text` | `#26221b` | `#e9e7e1` | 본문 |
| `--text-muted` | `#7d756a` | `#a09a8e` | 메타 정보 |
| `--text-faint` | `#a09a8e` | `#7d756a` | 비활성/플레이스홀더 |
| `--accent` | `#23684d` | `#6fbf95` | 링크(탭 제목), 주요 액션 |
| `--danger` | `#b42318` | `#f2705d` | 삭제 hover |
| `--success` | `#1f7a4d` | `#4cc38a` | 성공 메시지 |
| `--focus` | `#23684d` | `#6fbf95` | 포커스 링 |

다크 모드는 v1에 없던 신규 지원이며 `@media (prefers-color-scheme: dark)`
값 교체만으로 동작한다 (토글 UI 없음 — v2 이후 후보).
`list.html`에 `<meta name="color-scheme" content="light dark">` 추가,
`:root { color-scheme: light dark; }` 선언으로 폼 요소도 따라가게 한다.

### 간격 / 반경 / 타이포

- 간격: `--space-1: 4px` `--space-2: 8px` `--space-3: 12px`
  `--space-4: 16px` `--space-5: 24px` `--space-6: 32px`
- 반경: `--radius-sm: 7px` (버튼/입력/행), `--radius-md: 12px` (카드) —
  B안의 부드러운 모서리. 파비콘 등 16px 이하 미세 요소의 3~4px 반경은
  구조 값 예외로 허용.
- 폰트: `--font-sans: system-ui, -apple-system, 'Apple SD Gothic Neo',
  sans-serif`, `--font-mono: ui-monospace, monospace` (import/export 텍스트영역)
- 크기: `--text-xs: 12px` (메타/버튼), `--text-sm: 14px` (기본),
  `--text-lg: 20px` (페이지 제목)

## 컴포넌트 규칙

- **버튼(보더형 기본)**: `--surface` 배경 + `--border-strong` 테두리 +
  `--radius-sm`, hover 시 `--surface-hover`. 비활성: opacity 0.4, cursor
  default. 위험 액션은 텍스트/아이콘만 `--danger`로.
- **그룹 카드**: `--surface` + `--border` + `--radius-md`, 패딩
  `--space-3 --space-4`, 카드 간격 `--space-4`.
- **리스트 행(탭)**: hover 시 `--surface-hover` 배경 + 삭제 버튼 노출(현
  패턴 유지). 제목은 `--accent`, hover 밑줄.
- **인라인 입력**: 폰트 상속, `--border` 테두리.
- **포커스**: 전역 `:focus-visible { outline: 2px solid var(--focus);
  outline-offset: 2px; }`. 마우스 클릭에는 링 없음(`:focus-visible` 시멘틱).
- **금지 규칙**: 컴포넌트 `<style>`에 색상/간격/반경/폰트 리터럴 사용 금지 —
  토큰만. (예외: `width: 100%` 같은 구조 값)

## 마이그레이션 (v1 컴포넌트 토큰 교체)

- 대상: `App.svelte`, `Group.svelte`, `TabItem.svelte`, `ImportExport.svelte`
- 하드코딩된 hex/px 값을 위 토큰으로 역할 기준 1:1 교체. 라이트 모드의
  시각 결과는 B안 팔레트로 바뀐다 (구조·레이아웃은 동일). 스케일에 없는
  근사 px 값(예: 20px)은 가장 가까운 토큰으로 올림/내림.
- 검증: `npm run check` / `npm run test` / `npm run build` 통과 +
  크롬 수동 확인(라이트/다크 각 1회).

## 범위 제외 (이번 아님)

로고/아이콘 제작, 다크 모드 수동 토글, 브랜드 컬러 재정의, 모션/애니메이션
가이드, 컴포넌트 라이브러리화. 필요 시 v2 기능 기획과 함께 다룬다.

## 확정/가정 사항

- 문서 + 코드 토큰화 방식 (사용자 확정, 2026-07-14)
- 테마: B안 "페이퍼 아카이브" (사용자 확정, 2026-07-14 — A 클리어 블루,
  C 미드나잇 터미널 중 선택)
- 다크 모드 시스템 연동 포함 (추천안 채택)
- 폰트: 시스템 스택 유지
