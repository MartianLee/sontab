<script lang="ts">
  import { LANG_OPTIONS, type Lang } from '../i18n';
  import { DOMAIN_LIMIT_OPTIONS, type DomainLimit } from '../storage';
  import { THEME_OPTIONS, type ThemeSetting } from '../theme';
  import { locale, t, tc } from './locale.svelte';

  let {
    counts,
    theme,
    hideMain,
    domainLimit,
    onSetTheme,
    onSetHideMain,
    onSetLang,
    onSetDomainLimit,
    onExport,
    onImport,
    onImportHtml,
  }: {
    counts: { tabs: number; groups: number };
    theme: ThemeSetting;
    hideMain: boolean;
    domainLimit: DomainLimit;
    onSetTheme: (theme: ThemeSetting) => void;
    onSetHideMain: (value: boolean) => void;
    onSetLang: (lang: Lang) => void;
    onSetDomainLimit: (value: DomainLimit) => void;
    onExport: () => string;
    onImport: (text: string) => number;
    onImportHtml: (html: string) => { groups: number; tabs: number };
  } = $props();

  type Section = 'general' | 'data' | 'about';
  let section = $state<Section>('general');
  let text = $state('');
  let message = $state('');

  const version = chrome.runtime?.getManifest?.().version ?? 'dev';

  function handleExport() {
    text = onExport();
    message = t('msg.exported');
  }

  function handleImport() {
    const added = onImport(text);
    message =
      added > 0 ? t('msg.imported', { groups: tc('unit.group', added) }) : t('msg.noUrls');
  }

  async function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const res = onImportHtml(await file.text());
    message =
      res.groups > 0
        ? t('msg.importedHtml', {
            groups: tc('unit.group', res.groups),
            tabs: tc('unit.tab', res.tabs),
          })
        : t('msg.noOneTab');
    input.value = '';
  }
</script>

<div class="settings">
  <nav aria-label={t('settings.title')}>
    <button class:active={section === 'general'} onclick={() => (section = 'general')}>
      {t('settings.general')}
    </button>
    <button class:active={section === 'data'} onclick={() => (section = 'data')}>
      {t('settings.data')}
    </button>
    <button class:active={section === 'about'} onclick={() => (section = 'about')}>
      {t('settings.about')}
    </button>
  </nav>

  <div class="content">
    {#if section === 'general'}
      <h2>{t('settings.general')}</h2>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.language')}</div>
          <div class="setting-desc">{t('settings.languageDesc')}</div>
        </div>
        <select
          value={locale.lang}
          onchange={(e) => onSetLang(e.currentTarget.value as Lang)}
          aria-label={t('settings.language')}
        >
          {#each LANG_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.theme')}</div>
          <div class="setting-desc">{t('settings.themeDesc')}</div>
        </div>
        <div class="segmented" role="group" aria-label={t('settings.theme')}>
          {#each THEME_OPTIONS as value (value)}
            <button
              class:active={theme === value}
              aria-pressed={theme === value}
              onclick={() => onSetTheme(value)}
            >
              {t(`theme.${value}`)}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.domainLimit')}</div>
          <div class="setting-desc">{t('settings.domainLimitDesc')}</div>
        </div>
        <div class="segmented" role="group" aria-label={t('settings.domainLimit')}>
          {#each DOMAIN_LIMIT_OPTIONS as value (value)}
            <button
              class:active={domainLimit === value}
              aria-pressed={domainLimit === value}
              onclick={() => onSetDomainLimit(value)}
            >
              {value}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.hideMain')}</div>
          <div class="setting-desc">{t('settings.hideMainDesc')}</div>
        </div>
        <input
          type="checkbox"
          class="switch"
          checked={hideMain}
          onchange={(e) => onSetHideMain(e.currentTarget.checked)}
          aria-label={t('settings.hideMain')}
        />
      </div>
    {:else if section === 'data'}
      <h2>{t('settings.data')}</h2>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.importHtml')}</div>
          <div class="setting-desc">{t('settings.importHtmlDesc')}</div>
        </div>
        <label class="file-btn">
          {t('settings.chooseFile')}
          <input type="file" accept=".html,text/html" onchange={handleFile} />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.importText')}</div>
          <div class="setting-desc">{t('settings.importTextDesc')}</div>
        </div>
        <button onclick={handleImport}>{t('settings.import')}</button>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('settings.exportText')}</div>
          <div class="setting-desc">{t('settings.exportTextDesc')}</div>
        </div>
        <button onclick={handleExport}>{t('settings.export')}</button>
      </div>

      <textarea bind:value={text} rows="10" placeholder={t('settings.placeholder')}></textarea>
      {#if message}<p class="message" role="status">{message}</p>{/if}
    {:else}
      <h2>{t('settings.about')}</h2>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">SonTab</div>
          <div class="setting-desc">{t('about.tagline')}</div>
        </div>
        <span class="value">v{version}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-name">{t('about.stats')}</div>
          <div class="setting-desc">{t('about.statsDesc')}</div>
        </div>
        <span class="value">{tc('unit.tab', counts.tabs)} · {tc('unit.group', counts.groups)}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .settings {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: var(--space-5);
    align-items: start;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    position: sticky;
    top: var(--space-5);
  }
  nav button {
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    padding: var(--space-1) var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    cursor: pointer;
  }
  nav button:hover {
    background: var(--surface-hover);
  }
  nav button.active {
    background: var(--surface-hover);
    font-weight: 700;
  }
  h2 {
    font-size: var(--text-sm);
    font-weight: 700;
    margin: 0 0 var(--space-2);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border);
  }
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--border);
  }
  .setting-info {
    min-width: 0;
  }
  .setting-name {
    font-weight: 600;
  }
  .setting-desc {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-top: 2px;
  }
  .setting-item button,
  .file-btn {
    flex-shrink: 0;
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .setting-item button:hover,
  .file-btn:hover {
    background: var(--surface-hover);
  }
  .file-btn input {
    display: none;
  }
  .value {
    flex-shrink: 0;
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
  select {
    flex-shrink: 0;
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .segmented {
    display: flex;
    flex-shrink: 0;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .segmented button {
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border: none;
    border-right: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    border-radius: 0;
  }
  .segmented button:last-child {
    border-right: none;
  }
  .segmented button:hover {
    background: var(--surface-hover);
  }
  .segmented button.active {
    background: var(--accent);
    color: var(--bg);
    font-weight: 700;
  }
  .switch {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    cursor: pointer;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    margin-top: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.5;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    background: var(--surface);
    color: var(--text);
  }
  .message {
    font-size: var(--text-xs);
    color: var(--success);
    margin: var(--space-2) 0 0;
  }
  @media (max-width: 720px) {
    .settings {
      grid-template-columns: 1fr;
    }
    nav {
      position: static;
      flex-direction: row;
    }
  }
</style>
