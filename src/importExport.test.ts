import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { exportText, parseImport } from './importExport';

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
