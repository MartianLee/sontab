# SonTab

[English](README.md) | **한국어**

OneTab 스타일의 가벼운 크롬 탭 관리자.
툴바 아이콘을 누르면 현재 창의 모든 탭을 그룹으로 저장하고 닫아, 메모리를 아끼면서도 모든 탭을 한 번의 클릭 거리에 보관합니다.

![SonTab 목록 페이지](docs/screenshots/list.png)

## 기능

- **원클릭 수집** — 현재 창의 고정되지 않은 탭 전체를 그룹으로 저장 후 닫습니다. 저장이 성공한 뒤에만 탭을 닫아 데이터 유실을 방지합니다.
- **카탈로그 뷰** — 생성 시간순 정렬(최신이 위), 그룹 이름 인라인 편집, 그룹 잠금, 탭/그룹 단위 복원·삭제.
- **도메인별 뷰** — 저장된 모든 탭을 사이트별로 묶어서 보기(`www.` 무시). 각 탭 옆에 수집된 그룹이 표시되고, 도메인당 최신순 N개(1/5/10/20 설정 가능)까지 보여준 뒤 펼치기/접기.
- **검색·필터** — 제목·URL 실시간 검색, 즐겨찾기·잠긴 그룹 보기.
- **즐겨찾기 탭** — 다시 읽을 페이지에 ★를 켜 두면 복원해도 목록에 유지됩니다.
- **메인 페이지 정리** — `google.com`, `x.com` 같은 루트 페이지는 자동으로 숨깁니다(즐겨찾기는 예외, 끌 수 있음).
- **가져오기 / 내보내기** — OneTab 호환 텍스트 형식, OneTab 페이지 저장 HTML 가져오기(그룹 이름·원본 생성일 보존).
- **테마** — 자동(기기 설정)/라이트/다크. 페이퍼 아카이브 디자인.
- **5개 언어** — English, Español, Français, 한국어, 日本語. 첫 실행 시 브라우저 언어를 자동 감지합니다.
- **프라이버시 우선** — 백엔드·분석 없음. 모든 데이터는 `chrome.storage.local`에만 저장. 런타임 의존성 0.

## 설치 (소스에서)

1. `npm install && npm run build`
2. `chrome://extensions` → **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드합니다** → `dist/` 폴더 선택

## 개발

```bash
npm install
npm run build     # dist/ 생성
npm run dev       # watch 빌드
npm run test      # Vitest 단위 테스트
npm run check     # svelte-check 타입 검사
```

Svelte 5 + TypeScript + Vite (Manifest V3, 런타임 의존성 없음).

## 구조

- `src/background.ts` — 서비스 워커: 탭 수집/저장/닫기
- `src/storage.ts` — 그룹 CRUD·설정 (순수 로직 + `chrome.storage` 어댑터)
- `src/domain.ts` — 도메인 그룹핑·메인 페이지 숨김 (순수 로직)
- `src/importExport.ts` — OneTab 호환 텍스트/HTML 파서
- `src/i18n.ts` — 의존성 없는 i18n (EN/ES/FR/KO/JA)
- `src/theme.ts` — 자동/라이트/다크 테마 결정
- `src/list/` — Svelte 5 목록 페이지 (카탈로그·도메인별 뷰·설정)
