import { describe, expect, it } from 'vitest';
import { LANG_OPTIONS, SUPPORTED_LANGS, detectLang, tCount, translate } from './i18n';

describe('detectLang', () => {
  it('브라우저 언어 목록에서 첫 번째 지원 언어를 고른다 (지역 코드 무시)', () => {
    expect(detectLang(['ko-KR', 'en-US'])).toBe('ko');
    expect(detectLang(['ja'])).toBe('ja');
    expect(detectLang(['fr-CA', 'ko'])).toBe('fr');
  });

  it('지원 언어가 없으면 영어가 기본이다', () => {
    expect(detectLang(['de-DE', 'zh-CN'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });
});

describe('translate', () => {
  it('언어별 문자열을 반환하고 {변수}를 치환한다', () => {
    expect(translate('en', 'empty.search', { query: 'abc' })).toContain("'abc'");
    expect(translate('ko', 'empty.search', { query: 'abc' })).toContain("'abc'");
  });

  it('번역이 없는 키는 영어로 폴백한다', () => {
    // @ts-expect-error 존재하지 않는 키
    expect(translate('ko', 'no.such.key')).toBe('no.such.key');
  });

  it('모든 지원 언어에 영어와 같은 키가 있다', () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translate(lang, 'settings.title').length).toBeGreaterThan(0);
      expect(translate(lang, 'view.all').length).toBeGreaterThan(0);
    }
  });
});

describe('tCount', () => {
  it('1이면 단수형, 그 외엔 복수형을 쓴다', () => {
    expect(tCount('en', 'unit.tab', 1)).toBe('1 tab');
    expect(tCount('en', 'unit.tab', 5)).toBe('5 tabs');
  });

  it('한국어는 단복수 구분 없이 개수를 넣는다', () => {
    expect(tCount('ko', 'unit.tab', 1)).toBe('탭 1개');
    expect(tCount('ko', 'unit.tab', 5)).toBe('탭 5개');
  });
});

describe('LANG_OPTIONS', () => {
  it('언어 이름은 각 언어의 원어로 표기한다', () => {
    const labels = Object.fromEntries(LANG_OPTIONS.map((o) => [o.value, o.label]));
    expect(labels.en).toBe('English');
    expect(labels.ko).toBe('한국어');
    expect(labels.ja).toBe('日本語');
  });
});
