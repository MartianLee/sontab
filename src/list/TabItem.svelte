<script lang="ts">
  import { presetTimes } from '../remind';
  import type { SavedTab } from '../types';
  import { t } from './locale.svelte';

  let {
    tab,
    onRestore,
    onDelete,
    onToggleStar,
    onRemind,
    disabled = false,
    source = '',
  }: {
    tab: SavedTab;
    onRestore: () => void;
    onDelete: () => void;
    onToggleStar: () => void;
    onRemind: (remindAt: number | null) => void;
    disabled?: boolean;
    /** 출처 표시 (도메인별 보기의 그룹, 도착 리마인더 시각 등) */
    source?: string;
  } = $props();

  let menuOpen = $state(false);
  let custom = $state('');
  let item: HTMLLIElement;

  const presets = $derived(menuOpen ? presetTimes(new Date()) : null);

  function pick(remindAt: number | null) {
    menuOpen = false;
    custom = '';
    onRemind(remindAt);
  }

  function pickCustom() {
    const ts = new Date(custom).getTime();
    if (!Number.isNaN(ts)) pick(ts);
  }

  function onFocusOut(e: FocusEvent) {
    if (!item.contains(e.relatedTarget as Node)) menuOpen = false;
  }
</script>

<li class="tab-item" bind:this={item} onfocusout={onFocusOut}>
  <button
    class="star"
    class:on={tab.starred}
    title={t('tab.star')}
    aria-pressed={tab.starred === true}
    onclick={onToggleStar}
  >
    {tab.starred ? '★' : '☆'}
  </button>
  {#if tab.favIconUrl}
    <img class="favicon" src={tab.favIconUrl} alt="" />
  {:else}
    <span class="favicon placeholder"></span>
  {/if}
  <button class="title" title={tab.url} onclick={onRestore}>
    {tab.title || tab.url}
  </button>
  {#if source}
    <span class="source">{source}</span>
  {/if}
  <button
    class="remind"
    class:on={tab.remindAt !== undefined}
    title={t('remind.button')}
    aria-expanded={menuOpen}
    onclick={() => (menuOpen = !menuOpen)}
  >⏰</button>
  <button class="delete" title={t('tab.delete')} onclick={onDelete} disabled={disabled}>×</button>
  {#if menuOpen && presets}
    <div class="remind-menu" role="menu">
      <button onclick={() => pick(presets.evening)}>{t('remind.evening')}</button>
      <button onclick={() => pick(presets.tomorrowMorning)}>{t('remind.tomorrow')}</button>
      <button onclick={() => pick(presets.nextMonday)}>{t('remind.nextWeek')}</button>
      <div class="custom">
        <input type="datetime-local" bind:value={custom} />
        <button onclick={pickCustom} disabled={!custom}>{t('remind.set')}</button>
      </div>
      {#if tab.remindAt !== undefined}
        <button class="clear" onclick={() => pick(null)}>{t('remind.clear')}</button>
      {/if}
    </div>
  {/if}
</li>

<style>
  .tab-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    position: relative;
  }
  .tab-item:hover {
    background: var(--surface-hover);
  }
  .favicon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .placeholder {
    display: inline-block;
    background: var(--border-strong);
    border-radius: 4px;
  }
  .title {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--accent);
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title:hover {
    text-decoration: underline;
  }
  .source {
    flex-shrink: 0;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-xs);
    color: var(--text-faint);
  }
  .delete {
    background: none;
    border: none;
    color: var(--text-faint);
    font-size: 16px;
    cursor: pointer;
    padding: 0 var(--space-1);
    visibility: hidden;
  }
  .tab-item:hover .delete {
    visibility: visible;
  }
  .delete:hover {
    color: var(--danger);
  }
  .delete:disabled {
    color: var(--border-strong);
    cursor: default;
  }
  .remind {
    background: none;
    border: none;
    padding: 0 var(--space-1);
    font-size: var(--text-xs);
    cursor: pointer;
    filter: grayscale(1);
    opacity: 0.35;
    visibility: hidden;
  }
  .tab-item:hover .remind,
  .remind.on {
    visibility: visible;
  }
  .remind:hover,
  .remind.on {
    filter: none;
    opacity: 1;
  }
  .remind-menu {
    position: absolute;
    right: var(--space-4);
    top: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 200px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.25);
  }
  .remind-menu button {
    font: inherit;
    font-size: var(--text-xs);
    text-align: left;
    padding: var(--space-1) var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    cursor: pointer;
  }
  .remind-menu button:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .remind-menu .custom {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    border-top: 1px solid var(--border);
    margin-top: var(--space-1);
    padding-top: var(--space-1);
  }
  .remind-menu .custom input {
    font: inherit;
    font-size: var(--text-xs);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 2px var(--space-1);
    background: var(--bg);
    color: var(--text);
    min-width: 0;
    flex: 1;
  }
  .remind-menu .clear {
    color: var(--danger);
    border-top: 1px solid var(--border);
    margin-top: var(--space-1);
    padding-top: var(--space-1);
    border-radius: 0;
  }
  .remind-menu .custom button:disabled {
    color: var(--text-faint);
    cursor: default;
  }
  .star {
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-xs);
    color: var(--border-strong);
    cursor: pointer;
  }
  .star:hover {
    color: var(--text-muted);
  }
  .star.on {
    color: var(--star);
  }
</style>
