import { describe, expect, it } from 'vitest';
import { resolveTheme, THEME_OPTIONS } from './theme';

describe('resolveTheme', () => {
  it('auto는 기기 설정을 따른다', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
  });

  it('light/dark는 기기 설정과 무관하게 고정된다', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('옵션 목록은 자동/라이트/다크 순이다', () => {
    expect(THEME_OPTIONS).toEqual(['auto', 'light', 'dark']);
  });
});
