# 목록 페이지 전면 재디자인 — 시안 2 "카탈로그" 설계

날짜: 2026-07-14
상태: 승인됨 (재디자인 3안 아티팩트 중 시안 2 선택)

## 목표

B안 페이퍼 아카이브 아이덴티티로 목록 페이지를 전면 재디자인한다.
OneTab은 기능만 벤치마크(검색·즐겨찾기 별)하고 외형은 참고하지 않는다.
구조: 좌측 고정 사이드바 + 우측 그룹 리스트.

## 레이아웃

- **사이드바** (좌측 고정, 폭 220px):
  1. 로고: 마스코트 SVG(public/icons/icon.svg 그래픽 인라인) + "SonTab" 워드마크
  2. 검색 인풋 (실시간 필터)
  3. 보기 필터: **전체 / ★ 즐겨찾기 / 🔒 잠긴 그룹** — 각 항목에 개수 뱃지,
     활성 항목 하이라이트
  4. 하단 요약: "탭 N개 · 그룹 M개"
  - 태그 섹션은 이번에 넣지 않는다 (2페이즈 기능 개발에서 추가 — 구조만
    확장 가능하게)
- **콘텐츠 영역**: 현재 보기 제목(전체/즐겨찾기/잠긴 그룹) + 가져오기/내보내기
  패널 + 그룹 카드 리스트(기존 Group/TabItem 구조 유지)
- **반응형**: 720px 미만에서 사이드바를 상단 바(로고+검색+필터 가로 배치)로
  전환

## 기능

### 검색 (OneTab 기능 벤치마크)
- 제목+URL 부분일치, 대소문자 무시, 실시간
- 매칭 탭만 표시하고 매칭 0개인 그룹은 숨김
- 검색어와 보기 필터는 AND 결합
- 순수 함수 `filterGroups(groups, query)` — TDD

### 즐겨찾기 ★ (2페이즈 첫 기능)
- `SavedTab.starred?: boolean` (선택 필드 — 기존 데이터는 undefined=false,
  마이그레이션 불필요. 스펙 v1의 확장 방침 그대로)
- TabItem 왼쪽에 별 토글 버튼 (★/☆)
- **즐겨찾기 탭은 복원(클릭)해도 목록에서 제거되지 않는다** (다시 읽을
  페이지 — 잠긴 그룹의 탭 단위 버전). 명시적 삭제(×)는 가능
- 즐겨찾기 보기: starred 탭만 (그룹 구조 유지, starred 없는 그룹 숨김)
- `toggleStar(groups, groupId, tabId)` — storage.ts에 추가, TDD

### 잠긴 그룹 보기
- locked 그룹만 표시

## 파일 구조

```
src/filter.ts            # 순수 필터: filterGroups(query), byView(view), 카운트
src/storage.ts           # toggleStar 추가
src/list/Sidebar.svelte  # 로고/검색/보기 필터/요약 (신규)
src/list/App.svelte      # 레이아웃 재편 + view/query 상태
src/list/TabItem.svelte  # 별 토글 추가
src/list/Group.svelte    # 스킨 미세 조정 (구조 유지)
```

view/query는 UI 상태 (저장하지 않음). 스타일은 토큰만 사용.

## 검증

- filter.ts / toggleStar / starred 복원 규칙: Vitest TDD
- check 0/0, 빌드 성공, 기존 테스트 유지
- 크롬 수동: 검색·필터·별 토글·즐겨찾기 복원 유지 확인 (사용자)

## 범위 제외

태그, 자동 분류, 사이드바 접기 애니메이션, 아낀 메모리 통계, 드래그앤드롭.
