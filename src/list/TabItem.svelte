<script lang="ts">
  import type { SavedTab } from '../types';

  let {
    tab,
    onRestore,
    onDelete,
    onToggleStar,
    disabled = false,
  }: {
    tab: SavedTab;
    onRestore: () => void;
    onDelete: () => void;
    onToggleStar: () => void;
    disabled?: boolean;
  } = $props();
</script>

<li class="tab-item">
  <button
    class="star"
    class:on={tab.starred}
    title="즐겨찾기"
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
  <button class="delete" title="삭제" onclick={onDelete} disabled={disabled}>×</button>
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
