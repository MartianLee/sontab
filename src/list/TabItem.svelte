<script lang="ts">
  import type { SavedTab } from '../types';

  let {
    tab,
    onRestore,
    onDelete,
  }: {
    tab: SavedTab;
    onRestore: () => void;
    onDelete: () => void;
  } = $props();
</script>

<li class="tab-item">
  {#if tab.favIconUrl}
    <img class="favicon" src={tab.favIconUrl} alt="" />
  {:else}
    <span class="favicon placeholder"></span>
  {/if}
  <button class="title" title={tab.url} onclick={onRestore}>
    {tab.title || tab.url}
  </button>
  <button class="delete" title="삭제" onclick={onDelete}>×</button>
</li>

<style>
  .tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .tab-item:hover {
    background: #f2f4f7;
  }
  .favicon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .placeholder {
    display: inline-block;
    background: #d5d9e0;
    border-radius: 4px;
  }
  .title {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: #1a56db;
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
    color: #98a2b3;
    font-size: 16px;
    cursor: pointer;
    padding: 0 4px;
    visibility: hidden;
  }
  .tab-item:hover .delete {
    visibility: visible;
  }
  .delete:hover {
    color: #d92d20;
  }
</style>
