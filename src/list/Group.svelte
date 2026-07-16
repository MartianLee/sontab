<script lang="ts">
  import type { TabGroup } from '../types';
  import { locale, t, tc } from './locale.svelte';
  import TabItem from './TabItem.svelte';

  let {
    group,
    now,
    onRestoreTab,
    onDeleteTab,
    onRestoreGroup,
    onDeleteGroup,
    onRename,
    onToggleLock,
    onToggleStar,
    onSetReminder,
    onAddTag,
    onRemoveTag,
  }: {
    group: TabGroup;
    now: number;
    onRestoreTab: (tabId: string) => void;
    onDeleteTab: (tabId: string) => void;
    onRestoreGroup: () => void;
    onDeleteGroup: () => void;
    onRename: (name: string) => void;
    onToggleLock: () => void;
    onToggleStar: (tabId: string) => void;
    onSetReminder: (tabId: string, remindAt: number | null) => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (tag: string) => void;
  } = $props();

  let addingTag = $state(false);
  let tagDraft = $state('');

  function commitTag() {
    const value = tagDraft.trim();
    addingTag = false;
    tagDraft = '';
    if (value) onAddTag(value);
  }

  function dueLabel(remindAt: number | undefined): string {
    if (remindAt === undefined || remindAt > now) return '';
    return (
      '⏰ ' +
      new Date(remindAt).toLocaleString(locale.lang, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    );
  }

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
  <div class="tags">
    {#each group.tags ?? [] as tag (tag)}
      <span class="chip">
        #{tag}
        <button class="chip-x" title={t('tag.remove')} onclick={() => onRemoveTag(tag)}>×</button>
      </span>
    {/each}
    {#if addingTag}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="tag-input"
        bind:value={tagDraft}
        autofocus
        placeholder={t('tag.placeholder')}
        onblur={commitTag}
        onkeydown={(e) => {
          if (e.key === 'Enter') commitTag();
          if (e.key === 'Escape') {
            addingTag = false;
            tagDraft = '';
          }
        }}
      />
    {:else}
      <button class="add-tag" onclick={() => (addingTag = true)}>+ {t('tag.add')}</button>
    {/if}
  </div>
  <ul>
    {#each group.tabs as tab (tab.id)}
      <TabItem
        {tab}
        source={dueLabel(tab.remindAt)}
        onRestore={() => onRestoreTab(tab.id)}
        onDelete={() => onDeleteTab(tab.id)}
        onToggleStar={() => onToggleStar(tab.id)}
        onRemind={(remindAt) => onSetReminder(tab.id, remindAt)}
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
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
    margin-bottom: var(--space-2);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: var(--text-xs);
    color: var(--accent);
    background: var(--surface-hover);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 1px var(--space-2);
  }
  .chip-x {
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-xs);
    color: var(--text-faint);
    cursor: pointer;
    visibility: hidden;
  }
  .chip:hover .chip-x {
    visibility: visible;
  }
  .chip-x:hover {
    color: var(--danger);
  }
  .add-tag {
    background: none;
    border: none;
    padding: 1px var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-faint);
    cursor: pointer;
    border-radius: 999px;
    visibility: hidden;
  }
  .group:hover .add-tag {
    visibility: visible;
  }
  .add-tag:hover {
    background: var(--surface-hover);
    color: var(--text-muted);
  }
  .tag-input {
    font: inherit;
    font-size: var(--text-xs);
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    padding: 1px var(--space-2);
    background: var(--bg);
    color: var(--text);
    width: 110px;
  }
</style>
