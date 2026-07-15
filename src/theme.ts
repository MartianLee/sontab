export type ThemeSetting = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

// 표시 라벨은 i18n 키 `theme.<value>`로 조회한다
export const THEME_OPTIONS: ThemeSetting[] = ['auto', 'light', 'dark'];

export function resolveTheme(setting: ThemeSetting, systemDark: boolean): ResolvedTheme {
  if (setting === 'auto') return systemDark ? 'dark' : 'light';
  return setting;
}
