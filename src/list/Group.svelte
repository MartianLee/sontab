<script lang="ts">
  import type { TabGroup } from '../types';
  import { locale, t, tc } from './locale.svelte';
  import TabItem from './TabItem.svelte';

  let {
    group,
    onRestoreTab,
    onDeleteTab,
    onRestoreGroup,
    onDeleteGroup,
    onRename,
    onToggleLock,
    onToggleStar,
  }: {
    group: TabGroup;
    onRestoreTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onRestoreGroup: () => void;
    onDeleteGroup: () => void;
    onRename: (name: string) => void;
    onToggleLock: () => void;
    onToggleStar: (tabId: string) => void;
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
    new Date(group.createdAt).toLocaleString(locale.lang, {
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
      <button class="name" onclick={startEdit} title={t('group.rename')}>
        {group.name || tc('unit.tab', group.tabs.length)}
      </button>
    {/if}
    <span class="meta">{tc('unit.tab', group.tabs.length)} · {dateLabel}</span>
    <span class="actions">
      <button onclick={onRestoreGroup}>{t('group.restoreAll')}</button>
      <button onclick={onToggleLock}>
        {group.locked ? `🔒 ${t('group.unlock')}` : t('group.lock')}
      </button>
      <button onclick={onDeleteGroup} disabled={group.locked}>{t('group.delete')}</button>
    </span>
  </header>
  <ul>
    {#each group.tabs as tab (tab.id)}
      <TabItem
        {tab}
        onRestore={() => onRestoreTab(tab.id)}
        onDelete={() => onDeleteTab(tab.id)}
        onToggleStar={() => onToggleStar(tab.id)}
        disabled={group.locked}
      />
    {/each}
  </ul>
</section>

<style>
  .group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
  }
  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
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
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: var(--space-2);
  }
  .actions button {
    font-size: var(--text-xs);
    padding: 3px var(--space-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
  }
  .actions button:hover:not(:disabled) {
    background: var(--surface-hover);
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
