<script lang="ts">
  import type { TabGroup } from '../types';
  import TabItem from './TabItem.svelte';

  let {
    group,
    onRestoreTab,
    onDeleteTab,
    onRestoreGroup,
    onDeleteGroup,
    onRename,
    onToggleLock,
  }: {
    group: TabGroup;
    onRestoreTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onRestoreGroup: () => void;
    onDeleteGroup: () => void;
    onRename: (name: string) => void;
    onToggleLock: () => void;
  } = $props();

  let editing = $state(false);
  let draft = $state('');

  function startEdit() {
    draft = group.name;
    editing = true;
  }

  function commitEdit() {
    editing = false;
    if (draft !== group.name) onRename(draft);
  }

  const dateLabel = $derived(
    new Date(group.createdAt).toLocaleString('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  );
</script>

<section class="group">
  <header>
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="name-input"
        bind:value={draft}
        autofocus
        onblur={commitEdit}
        onkeydown={(e) => {
          if (e.key === 'Enter') commitEdit();
          if (e.key === 'Escape') editing = false;
        }}
      />
    {:else}
      <button class="name" onclick={startEdit} title="이름 바꾸기">
        {group.name || `탭 ${group.tabs.length}개`}
      </button>
    {/if}
    <span class="meta">{group.tabs.length}개 · {dateLabel}</span>
    <span class="actions">
      <button onclick={onRestoreGroup}>전체 복원</button>
      <button onclick={onToggleLock}>{group.locked ? '🔒 잠금 해제' : '잠금'}</button>
      <button onclick={onDeleteGroup} disabled={group.locked}>그룹 삭제</button>
    </span>
  </header>
  <ul>
    {#each group.tabs as tab (tab.id)}
      <TabItem
        {tab}
        onRestore={() => onRestoreTab(tab.id)}
        onDelete={() => onDeleteTab(tab.id)}
      />
    {/each}
  </ul>
</section>

<style>
  .group {
    background: #fff;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .name {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    cursor: text;
  }
  .name-input {
    font: inherit;
    font-weight: 600;
  }
  .meta {
    color: #667085;
    font-size: 12px;
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
  }
  .actions button {
    font-size: 12px;
    padding: 3px 8px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .actions button:hover:not(:disabled) {
    background: #f2f4f7;
  }
  .actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
