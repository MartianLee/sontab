import { tCount, translate, type Lang, type MsgKey } from '../i18n';

// 현재 UI 언어 — $state 객체라 t()를 쓰는 컴포넌트가 언어 변경에 반응한다
export const locale = $state<{ lang: Lang }>({ lang: 'en' });

export function t(key: MsgKey, params?: Record<string, string | number>): string {
  return translate(locale.lang, key, params);
}

export function tc(key: 'unit.tab' | 'unit.group' | 'unit.domain', n: number): string {
  return tCount(locale.lang, key, n);
}
