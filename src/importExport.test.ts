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
