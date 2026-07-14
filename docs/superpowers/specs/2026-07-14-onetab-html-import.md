# OneTab HTML 내보내기 가져오기 설계

날짜: 2026-07-14
상태: 승인됨 (사용자: "onetab html은 import 호환 용도")

## 목표

OneTab의 HTML 내보내기 파일을 SonTab으로 가져온다. 그룹 이름과 생성일을
보존해 기존 OneTab 사용자(실데이터: 그룹 14개/탭 459개)가 이력 그대로
마이그레이션할 수 있게 한다.

## 입력 포맷 (OneTab HTML export 구조)

- 그룹: `<div class="tabGroup">` 블록
- 그룹 제목: `<div class="tabGroupTitleText">탭 25개</div>` — 이름 없는
  그룹은 "탭 N개" 자동 제목. 사용자가 이름 지은 그룹은 실제 이름이 들어감.
- 생성일: `<div class="createdDate">생성일 2026. 7. 3., 오후 8:12:12</div>`
- 탭: `<a class="tabLink" href="URL">제목</a>`
- 중첩 그룹(innerGroup)은 무시하고 탭은 부모 그룹으로 흡수 (드묾)

## 동작

1. 가져오기/내보내기 패널에 **"OneTab HTML 파일" 선택 버튼**(`<input
   type="file" accept=".html,text/html">`) 추가. 파일을 읽어 파싱 후
   그룹들을 목록 맨 앞에 추가 (기존 텍스트 가져오기와 동일한 흐름).
2. 파서 `parseOneTabHtml(html: string): { name: string; createdAt:
   number | null; tabs: SavedTab[] }[]` — `src/importExport.ts`에 추가.
   - **정규식 기반** (DOMParser 미사용 — Vitest node 환경에서 테스트
     가능해야 하고, 포맷이 고정적이라 충분)
   - 제목이 `/^탭 \d+개$/` 또는 `/^\d+ tabs?$/i` 패턴이면 이름 없음(`''`)
   - 생성일 한국어 로캘 파싱: `생성일 YYYY. M. D., 오전|오후 h:mm:ss` →
     epoch ms. 파싱 실패(다른 로캘 등) 시 `null` 반환 → 호출부가
     `Date.now()`로 대체
   - 탭이 0개인 그룹은 제외. HTML 엔티티(`&amp;` 등)는 제목/URL에서 디코드
3. 성공 메시지: "그룹 N개(탭 M개)를 가져왔습니다."

## 테스트

- 파서는 **합성 픽스처**(실제 export 구조를 모사한 소형 HTML 문자열)로
  Vitest 단위 테스트. **사용자 실데이터(onetab-all.html)는 레포에 커밋
  금지** (개인 브라우징 기록) — 구현 검증 단계에서 로컬 파일로 파서를
  1회 실행해 그룹 14/탭 459 카운트만 확인한다.
- 케이스: 이름 없는 그룹("탭 N개"), 이름 있는 그룹, 오전/오후 시각,
  파싱 불가 날짜 → null, 엔티티 디코드, 빈 그룹 제외.

## 범위 제외

파일 드래그앤드롭, OneTab 이외 포맷(Session Buddy 등), 내보내기를 HTML로
하는 기능(텍스트 내보내기 유지).
