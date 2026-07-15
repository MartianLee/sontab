<script lang="ts">
  import type { SavedTab } from '../types';
  import { t } from './locale.svelte';

  let {
    tab,
    onRestore,
    onDelete,
    onToggleStar,
    disabled = false,
    source = '',
  }: {
    tab: SavedTab;
    onRestore: () => void;
    onDelete: () => void;
    onToggleStar: () => void;
    disabled?: boolean;
    /** 출처 표시 (도메인별 보기에서 수집된 그룹 이름/날짜) */
    source?: string;
  } = $props();
</script>

<li class="tab-item">
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
  <button class="delete" title={t('tab.delete')} onclick={onDelete} disabled={disabled}>×</button>
</li>

<style>
  .tab-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
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
