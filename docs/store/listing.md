# Chrome Web Store Listing — SonTab

Everything needed to fill in the Chrome Web Store developer dashboard.

## Basics

| Field | Value |
|---|---|
| Name | SonTab |
| Category | Productivity › Tools |
| Language | English (default) — additional listings: 한국어, 日本語, Español, Français |
| Store icon | `public/icons/icon-128.png` (128×128) |
| Screenshots (1280×800) | `docs/screenshots/list.png`, `docs/screenshots/by-domain.png` |
| Small promo tile (440×280) | `docs/store/promo-tile.png` |
| Privacy policy URL | `PRIVACY.md` — host publicly (GitHub Pages or make the repo public) and paste the URL |
| Package | `npm run package` → `sontab-v0.1.0.zip` |

## Short description (≤132 chars)

**EN**
> Save all your tabs with one click, browse them by time or by site, and restore them anytime. Local-only, no tracking.

**KO**
> 탭을 클릭 한 번으로 모두 저장하고, 시간순·사이트별로 정리해 언제든 복원하세요. 로컬 저장, 추적 없음.

## Detailed description

**EN**

```
SonTab is a lightweight, OneTab-style tab manager that keeps your browser fast
and your tabs safe.

⭐ ONE CLICK TO CLEAN UP
Click the toolbar icon and every tab in the window is saved into a group and
closed — freeing memory instantly. Tabs are closed only after they are safely
stored, so nothing is ever lost.

🗂 FIND TABS AGAIN, YOUR WAY
• Catalog view: groups sorted by time, with renaming and locking
• By-domain view: every saved tab grouped by site, with the source group shown
  next to each tab and a configurable newest-first limit per domain
• Live search across titles and URLs, plus Starred and Locked filters
• Home pages like google.com are hidden automatically to reduce clutter
  (starred tabs are kept; can be turned off)

⭐ STAR WHAT MATTERS
Starred tabs stay in your list even after you restore them — perfect for pages
you keep coming back to.

🔄 EASY MIGRATION FROM ONETAB
Import your existing OneTab data — either the text export or a saved OneTab
page — with group names and original creation dates preserved. Export your
data anytime in OneTab-compatible text.

🎨 COMFORTABLE BY DEFAULT
A warm paper-archive design with auto/light/dark themes, in English, Español,
Français, 한국어, and 日本語 (your browser language is detected automatically).

🔒 PRIVATE BY DESIGN
No account. No server. No analytics. Everything is stored locally on your
device and never leaves it.
```

**KO**

```
SonTab은 브라우저를 가볍게, 탭을 안전하게 지켜 주는 OneTab 스타일의 탭
관리자입니다.

⭐ 클릭 한 번으로 정리
툴바 아이콘을 누르면 창의 모든 탭이 그룹으로 저장되고 닫혀 메모리가 바로
확보됩니다. 저장이 완료된 뒤에만 탭을 닫아 데이터 유실이 없습니다.

🗂 원하는 방식으로 다시 찾기
• 카탈로그 뷰: 시간순 그룹, 이름 편집·잠금
• 도메인별 뷰: 저장된 모든 탭을 사이트별로 정리, 탭마다 수집된 그룹 표시,
  도메인당 최신순 표시 개수 설정
• 제목·URL 실시간 검색, 즐겨찾기·잠긴 그룹 필터
• google.com 같은 메인 페이지는 자동으로 숨겨 목록을 깔끔하게
  (즐겨찾기는 유지, 끌 수 있음)

⭐ 중요한 탭은 별표
즐겨찾기한 탭은 복원해도 목록에 남아 자주 보는 페이지에 딱 맞습니다.

🔄 OneTab에서 쉬운 이사
OneTab 텍스트 내보내기와 페이지 저장 HTML 모두 가져올 수 있으며, 그룹
이름과 원래 생성일이 보존됩니다. 내보내기도 OneTab 호환 형식입니다.

🎨 편안한 기본기
페이퍼 아카이브 디자인, 자동/라이트/다크 테마, 5개 언어 지원(브라우저
언어 자동 감지).

🔒 프라이버시 우선
계정 없음, 서버 없음, 분석 없음. 모든 데이터는 기기에만 저장됩니다.
```

## Permission justifications (Privacy tab of the dashboard)

- **tabs** — "Reads the URL and title of the tabs in the current window when the user clicks the toolbar icon, so they can be saved as a group; reopens saved URLs when the user restores them. No tab data leaves the device."
- **storage** — "Stores the user's saved tab groups and preferences (theme, language, display options) locally."
- **unlimitedStorage** — "Users may archive thousands of tabs over time; this prevents saved groups from being lost when the default storage quota is exceeded."
- **Host permissions** — none requested.
- **Remote code** — none. All code is packaged with the extension.

## Data-usage disclosures (Privacy tab)

- "Does your extension collect user data?" → SonTab processes tab URLs/titles **on-device only**; nothing is transmitted off the device. Answer **No** for every data category (the dashboard defines collection as transmitting data off the device), and certify the three disclosures (no sale, no unrelated use, no creditworthiness use).

## Submission checklist

1. `npm run package` → upload `sontab-v0.1.0.zip`
2. Fill in listing texts and upload screenshots/promo tile (above)
3. Paste permission justifications and complete data-usage certification
4. Set the privacy policy URL (host `PRIVACY.md` publicly first)
5. Set visibility (public/unlisted) and submit for review
   — the `tabs` permission usually adds a manual-review delay of a few days
