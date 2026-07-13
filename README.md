# SonTab

OneTab 스타일의 가벼운 탭 관리 크롬 익스텐션.
툴바 아이콘을 누르면 현재 창의 탭을 모두 저장하고 닫아 메모리를 아낍니다.

## 개발

```bash
npm install
npm run build     # dist/ 생성
npm run dev       # watch 빌드
npm run test      # Vitest 단위 테스트
npm run check     # svelte-check 타입 검사
```

## 크롬에 설치

1. `npm run build`
2. `chrome://extensions` → 개발자 모드 켜기
3. "압축해제된 확장 프로그램을 로드합니다" → `dist/` 폴더 선택

## 구조

- `src/background.ts` — 서비스 워커: 탭 수집/저장/닫기
- `src/storage.ts` — 그룹 CRUD (순수 로직 + chrome.storage 어댑터)
- `src/importExport.ts` — OneTab 호환 텍스트 파서
- `src/list/` — Svelte 5 목록 페이지
