import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { exportText, parseImport, parseKoreanDate, parseOneTabHtml } from './importExport';

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

const FIXTURE = `<!DOCTYPE html><html><body><div id="tabGroupsDiv">
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">탭 2개</div>
  <div class="createdDate">생성일 2026. 7. 3., 오후 8:12:12</div></div>
  <div class="tabList">
    <div class="tab"><a class="tabLink" href="https://a.com/?x=1&amp;y=2">A &amp; B</a></div>
    <div class="tab"><a class="tabLink" href="https://b.com/">B</a></div>
  </div>
</div>
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">아침 리서치</div>
  <div class="createdDate">생성일 2026. 6. 28., 오전 12:05:51</div></div>
  <div class="tabList">
    <div class="tab"><a class="tabLink" href="https://c.com/">C</a></div>
  </div>
</div>
<div class="tabGroup">
  <div class="tabGroupHeader"><div class="tabGroupTitleText">탭 0개</div>
  <div class="createdDate">Created 7/3/2026, 8:12:12 PM</div></div>
  <div class="tabList"></div>
</div>
</div></body></html>`;

describe('parseKoreanDate', () => {
  it('오후 시각을 파싱한다', () => {
    expect(parseKoreanDate('생성일 2026. 7. 3., 오후 8:12:12')).toBe(
      new Date(2026, 6, 3, 20, 12, 12).getTime(),
    );
  });

  it('오전 12시는 0시로 파싱한다', () => {
    expect(parseKoreanDate('생성일 2026. 6. 28., 오전 12:05:51')).toBe(
      new Date(2026, 5, 28, 0, 5, 51).getTime(),
    );
  });

  it('다른 로캘은 null을 반환한다', () => {
    expect(parseKoreanDate('Created 7/3/2026, 8:12:12 PM')).toBeNull();
  });

  it('두 자리 연도와 초 없는 시각도 파싱한다', () => {
    expect(parseKoreanDate('26. 7. 3. 오후 8:12')).toBe(
      new Date(2026, 6, 3, 20, 12, 0).getTime(),
    );
  });
});

describe('parseOneTabHtml', () => {
  it('그룹/탭/생성일을 파싱하고 빈 그룹은 제외한다', () => {
    const groups = parseOneTabHtml(FIXTURE);
    expect(groups).toHaveLength(2);
    expect(groups[0].tabs.map((t) => t.url)).toEqual(['https://a.com/?x=1&y=2', 'https://b.com/']);
    expect(groups[0].tabs[0].title).toBe('A & B');
    expect(groups[0].createdAt).toBe(new Date(2026, 6, 3, 20, 12, 12).getTime());
    expect(groups[0].tabs[0].id).toBeTruthy();
  });

  it('"탭 N개" 자동 제목은 이름 없음으로, 실제 이름은 보존한다', () => {
    const groups = parseOneTabHtml(FIXTURE);
    expect(groups[0].name).toBe('');
    expect(groups[1].name).toBe('아침 리서치');
  });

  it('tabGroup 블록이 없으면 빈 배열을 반환한다', () => {
    expect(parseOneTabHtml('<html><body>hello</body></html>')).toEqual([]);
  });
});

// OneTab 페이지를 브라우저 "페이지 저장"으로 받은 DOM 형식 (내보내기 버튼과 마크업이 다름)
const SAVED_PAGE_FIXTURE = `<!DOCTYPE html><html><body>
<div class="treeItem"><span class="editInPlaceLabelSpan">모두</span></div>
<div class="tabGroup" style="display: block; margin-inline: 0px;">
  <div class="tabGroupBody centerColFolderHeaderGroup" style="border-radius: 10px;">
    <div class="tabGroupLabelText" style="position: relative;"><span class="editInPlaceLabelSpan">탭 2개</span></div>
    <div style="text-align: end;"><span style="unicode-bidi: plaintext;">26. 7. 3.</span> <span style="unicode-bidi: plaintext;">오후 8:12</span> - <span style="unicode-bidi: plaintext;">2주 전</span></div>
    <div class="tab"><div class="tabInner">
      <a draggable="false" tabindex="-1" class="tabLink tabLinkText" href="https://a.com/?x=1&amp;y=2" style="cursor: default;"><span class="tabLinkText tabLinkTextStripesPossible" style="cursor: pointer;">A &amp; B</span></a>
    </div></div>
    <div class="tab"><div class="tabInner">
      <a draggable="false" class="tabLink tabLinkText" href="https://b.com/"><span class="tabLinkText tabLinkTextStripesPossible">B</span></a>
    </div></div>
  </div>
</div>
<div class="tabGroup" style="display: block;">
  <div class="tabGroupBody">
    <div class="tabGroupLabelText"><span class="editInPlaceLabelSpan">아침 리서치</span></div>
    <div class="tab"><a draggable="false" class="tabLink tabLinkText" href="https://c.com/"><span class="tabLinkText tabLinkTextStripesPossible">C</span></a></div>
  </div>
</div>
</body></html>`;

describe('parseOneTabHtml (저장된 페이지 형식)', () => {
  it('tabLink tabLinkText 앵커와 중첩 span 제목을 파싱한다', () => {
    const groups = parseOneTabHtml(SAVED_PAGE_FIXTURE);
    expect(groups).toHaveLength(2);
    expect(groups[0].tabs.map((t) => t.url)).toEqual(['https://a.com/?x=1&y=2', 'https://b.com/']);
    expect(groups[0].tabs[0].title).toBe('A & B');
  });

  it('"탭 N개" 자동 라벨은 무명 그룹, 실제 이름은 보존한다', () => {
    const groups = parseOneTabHtml(SAVED_PAGE_FIXTURE);
    expect(groups[0].name).toBe('');
    expect(groups[1].name).toBe('아침 리서치');
  });

  it('헤더의 두 자리 연도 날짜(26. 7. 3. 오후 8:12)를 생성일로 파싱한다', () => {
    const groups = parseOneTabHtml(SAVED_PAGE_FIXTURE);
    expect(groups[0].createdAt).toBe(new Date(2026, 6, 3, 20, 12, 0).getTime());
  });

  it('그룹 이름에 날짜가 들어 있어도 생성일로 오인하지 않는다', () => {
    // 저장된 페이지 형식: 이름 스팬 뒤의 날짜만 생성일이다
    const saved = `<div class="tabGroup"><div class="tabGroupLabelText"><span class="editInPlaceLabelSpan">20. 1. 1. 오전 9:00 백업</span></div>
      <div><span>26. 7. 3.</span> <span>오후 8:12</span></div>
      <div class="tab"><a class="tabLink tabLinkText" href="https://a.com/"><span class="tabLinkText">A</span></a></div></div>`;
    const g1 = parseOneTabHtml(saved);
    expect(g1[0].name).toBe('20. 1. 1. 오전 9:00 백업');
    expect(g1[0].createdAt).toBe(new Date(2026, 6, 3, 20, 12, 0).getTime());

    // 내보내기 형식: createdDate 요소가 있으면 그것만 사용한다
    const exported = `<div class="tabGroup"><div class="tabGroupTitleText">20. 1. 1. 오전 9:00 백업</div>
      <div class="createdDate">생성일 2026. 7. 3., 오후 8:12:12</div>
      <div class="tab"><a class="tabLink" href="https://a.com/">A</a></div></div>`;
    const g2 = parseOneTabHtml(exported);
    expect(g2[0].createdAt).toBe(new Date(2026, 6, 3, 20, 12, 12).getTime());
  });

  it('헤더에 날짜가 없으면 생성일은 null이고, 탭 제목 속 날짜는 무시한다', () => {
    const html = `<div class="tabGroup"><div class="tab">
      <a class="tabLink tabLinkText" href="https://a.com/"><span class="tabLinkText">26. 7. 3. 오후 8:12 회의록</span></a>
    </div></div>`;
    expect(parseOneTabHtml(html)[0].createdAt).toBeNull();
  });

  it('첫 tabGroup 이전의 사이드바 라벨("모두")은 그룹에 영향을 주지 않는다', () => {
    const groups = parseOneTabHtml(SAVED_PAGE_FIXTURE);
    expect(groups.every((g) => g.name !== '모두')).toBe(true);
  });

  it('OneTab placeholder URL은 원본 file:// URL로 복원한다', () => {
    const html = `<div class="tabGroup"><div class="tab">
      <a class="tabLink tabLinkText" href="chrome-extension://chphlpgkkbolifaimnlloiipkdnihall/placeholder.html?url=file%3A%2F%2F%2FUsers%2Fme%2Fdoc%2520a.pdf"><span class="tabLinkText">문서</span></a>
    </div></div>`;
    const groups = parseOneTabHtml(html);
    expect(groups[0].tabs[0].url).toBe('file:///Users/me/doc%20a.pdf');
  });
});
