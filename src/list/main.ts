import './tokens.css';
import { mount } from 'svelte';
import { resolveTheme } from '../theme';
import App from './App.svelte';

// 저장된 테마 설정을 읽기 전에 기기 설정을 먼저 적용해 다크 모드 플래시를 줄인다
document.documentElement.dataset.theme = resolveTheme(
  'auto',
  matchMedia('(prefers-color-scheme: dark)').matches,
);

mount(App, { target: document.getElementById('app')! });
