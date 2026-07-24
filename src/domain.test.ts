import { describe, expect, it } from 'vitest';
import type { TabGroup } from './types';
import { domainOf, groupByDomain, hideMainPages, isMainPageUrl } from './domain';

function fixture(): TabGroup[] {
  return [
    {
      id: 'g1',
      createdAt: 2000,
      name: '',
      locked: false,
      tabs: [
        { id: 't1', url: 'https://www.youtube.com/watch?v=1', title: '영상 1' },
        { id: 't2', url: 'https://github.com/a/b', title: '리포' },
      ],
    },
    {
      id: 'g2',
      createdAt: 1000,
      name: '',
      locked: false,
      tabs: [
        { id: 't3', url: 'https://youtube.com/watch?v=2', title: '영상 2' },
        { id: 't4', url: 'https://youtube.com/watch?v=3', title: '영상 3' },
      ],
    },
  ];
}

describe('domainOf', () => {
  it('hostname에서 www.을 제거해 반환한다', () => {
    expect(domainOf('https://www.youtube.com/watch?v=1')).toBe('youtube.com');
    expect(domainOf('https://github.com/a/b')).toBe('github.com');
  });

  it('hostname이 없으면 프로토콜 이름을 반환한다', () => {
    expect(domainOf('file:///Users/me/doc.pdf')).toBe('file');
  });

  it('URL이 아니면 빈 문자열을 반환한다', () => {
    expect(domainOf('not-a-url')).toBe('');
  });
});

describe('groupByDomain', () => {
  it('www 유무를 무시하고 같은 도메인으로 묶고, 탭 수 내림차순으로 정렬한다', () => {
    const result = groupByDomain(fixture());
    expect(result.map((d) => d.domain)).toEqual(['youtube.com', 'github.com']);
    expect(result[0].entries).toHaveLength(3);
  });

  it('각 entry는 원본 그룹과 탭을 참조한다 (복원/삭제 콜백용)', () => {
    const groups = fixture();
    const result = groupByDomain(groups);
    const entry = result[0].entries[0];
    expect(entry.group.id).toBe('g1');
    expect(entry.tab.id).toBe('t1');
  });

  it('도메인 안의 엔트리는 그룹 생성일 최신순이다', () => {
    const groups: TabGroup[] = [
      {
        id: 'old', createdAt: 1000, name: '', locked: false,
        tabs: [{ id: 't1', url: 'https://a.com/1', title: '옛날' }],
      },
      {
        id: 'new', createdAt: 2000, name: '', locked: false,
        tabs: [{ id: 't2', url: 'https://a.com/2', title: '최신' }],
      },
    ];
    const result = groupByDomain(groups);
    expect(result[0].entries.map((e) => e.tab.id)).toEqual(['t2', 't1']);
  });

  it('탭 수가 같으면 도메인 사전순으로 정렬한다', () => {
    const groups: TabGroup[] = [
      {
        id: 'g1', createdAt: 1, name: '', locked: false,
        tabs: [
          { id: 't1', url: 'https://b.com/x', title: 'B' },
          { id: 't2', url: 'https://a.com/x', title: 'A' },
        ],
      },
    ];
    expect(groupByDomain(groups).map((d) => d.domain)).toEqual(['a.com', 'b.com']);
  });
});

describe('isMainPageUrl', () => {
  it('경로·쿼리·해시 없는 루트 URL은 메인 페이지다', () => {
    expect(isMainPageUrl('https://naver.com/')).toBe(true);
    expect(isMainPageUrl('https://www.google.com')).toBe(true);
    expect(isMainPageUrl('https://x.com/')).toBe(true);
  });

  it('경로나 쿼리가 있으면 메인 페이지가 아니다', () => {
    expect(isMainPageUrl('https://naver.com/news')).toBe(false);
    expect(isMainPageUrl('https://google.com/search?q=a')).toBe(false);
    expect(isMainPageUrl('https://x.com/#top')).toBe(false);
  });

  it('URL이 아니면 false다', () => {
    expect(isMainPageUrl('not-a-url')).toBe(false);
  });
});

describe('hideMainPages', () => {
  const groups: TabGroup[] = [
    {
      id: 'g1', createdAt: 1, name: '', locked: false,
      tabs: [
        { id: 't1', url: 'https://naver.com/', title: '네이버' },
        { id: 't2', url: 'https://naver.com/news/1', title: '기사' },
      ],
    },
    {
      id: 'g2', createdAt: 2, name: '', locked: false,
      tabs: [{ id: 't3', url: 'https://google.com/', title: '구글' }],
    },
    {
      id: 'g3', createdAt: 3, name: '', locked: false,
      tabs: [{ id: 't4', url: 'https://x.com/', title: 'X', starred: true }],
    },
  ];

  it('메인 페이지 탭을 숨기고, 빈 그룹은 제외한다', () => {
    const result = hideMainPages(groups);
    expect(result.map((g) => g.id)).toEqual(['g1', 'g3']);
    expect(result[0].tabs.map((t) => t.id)).toEqual(['t2']);
  });

  it('즐겨찾기한 메인 페이지는 숨기지 않는다', () => {
    const result = hideMainPages(groups);
    expect(result.find((g) => g.id === 'g3')?.tabs[0].id).toBe('t4');
  });

  it('잠긴 그룹은 탭이 모두 숨겨져도 목록에서 사라지지 않는다', () => {
    const locked: TabGroup[] = [
      {
        id: 'gl', createdAt: 1, name: '잠김', locked: true,
        tabs: [{ id: 't', url: 'https://naver.com/', title: '네이버' }],
      },
    ];
    const result = hideMainPages(locked);
    expect(result.map((g) => g.id)).toEqual(['gl']);
  });
});
