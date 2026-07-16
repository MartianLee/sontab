# 탭 리마인더 ("나중에 보기") 설계

날짜: 2026-07-17 · 상태: 구현 진행 (사용자 부재로 권장안 채택, 사후 리뷰 예정)

## 목적

Slack의 "Remind me"처럼, 저장된 탭을 지정 시간까지 목록에서 숨겼다가
시간이 되면 다시 보여준다. "지금은 아니고 나중에 볼 탭"을 위한 기능.

## 채택안: 목록 재등장 + 툴바 배지

세 가지 후보 중 권한 추가가 최소(`alarms`)이고 작업 흐름을 방해하지 않는 안:

1. **목록 재등장 + 배지 (채택)** — 시간이 되면 목록에 다시 나타나고 툴바
   아이콘에 도착 개수 배지 표시.
2. 실제 탭으로 열기 — 눈에 잘 띄지만 작업 중 탭이 불쑥 생김.
3. 크롬 알림 — `notifications` 권한 추가로 스토어 심사 항목 증가.

## 동작 정의

- 탭 행의 ⏰ 버튼 → 메뉴: **오늘 저녁 6시**(지났으면 내일 저녁), **내일
  아침 9시**, **다음 주 월요일 9시**, **직접 선택**(datetime-local),
  **리마인더 해제**.
- `remindAt`이 미래인 탭(**snoozed**)은 전체/즐겨찾기/잠긴 그룹/도메인
  뷰에서 숨겨진다. 탭만 숨고 데이터는 그대로.
- `remindAt`이 지난 탭(**due**)은 원래 그룹 위치에 다시 보이며 ⏰ 도착
  시각 라벨이 붙는다. 사용자가 열거나 삭제하거나 해제할 때까지 유지.
- 사이드바에 **⏰ 나중에** 뷰 추가: 리마인더 걸린 모든 탭(예정+도착)을
  도착 시각 오름차순 플랫 리스트로 표시(출처 그룹·시각 라벨). 검색 적용.
- 툴바 배지: due 탭 개수. 0이면 배지 없음. 서비스 워커가
  `chrome.alarms`로 다음 도착 시각에 깨어나 갱신하고, storage 변경
  시에도 재계산한다.
- 복원(클릭) 시 리마인더는 자동 해제된다(즐겨찾기 탭 포함).
- 메인 페이지 자동 숨김과 무관하게 "나중에" 뷰에서는 리마인더 탭이
  항상 보인다.

## 데이터 모델

`SavedTab.remindAt?: number` (epoch ms). 선택 필드 추가 방식이므로
마이그레이션 불필요(기존 정책). 해제는 필드 삭제.

## 모듈 구성 (순수 로직 TDD)

- `src/remind.ts` — `presetTimes(now)`, `isSnoozed/isDue(tab, now)`,
  `hideSnoozed(groups, now)`, `reminderEntries(groups)`(remindAt 오름차순,
  {group, tab} 참조), `countReminders(groups)`, `countDue(groups, now)`,
  `nextRemindAt(groups, now)`.
- `src/storage.ts` — `setReminder(groups, groupId, tabId, remindAt|null)`
  (잠긴 그룹에서도 허용, 별표와 동일 정책).
- `src/background.ts` — storage 변경/알람/시작 시 배지 갱신 + 다음 알람
  예약. manifest에 `alarms` 권한 추가.
- UI — TabItem에 ⏰ 메뉴, Sidebar에 "나중에" 뷰, App에 30초 tick으로
  due 판정 갱신. i18n 5개 언어 키 추가.

## 범위 제외 (YAGNI)

반복 리마인더, 시스템 알림, 스누즈 연장 원클릭, 그룹 단위 리마인더.
