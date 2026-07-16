<script lang="ts">
  import type { ReminderEntry } from '../remind';
  import { locale, t } from './locale.svelte';
  import TabItem from './TabItem.svelte';

  let {
    entries,
    now,
    onRestoreTab,
    onDeleteTab,
    onToggleStar,
    onSetReminder,
  }: {
    entries: ReminderEntry[];
    now: number;
    onRestoreTab: (entry: ReminderEntry) => void;
    onDeleteTab: (entry: ReminderEntry) => void;
    onToggleStar: (entry: ReminderEntry) => void;
    onSetReminder: (entry: ReminderEntry, remindAt: number | null) => void;
  } = $props();

  function label(entry: ReminderEntry): string {
    const time = new Date(entry.tab.remindAt!).toLocaleString(locale.lang, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const origin =
      entry.group.name ||
      new Date(entry.group.createdAt).toLocaleDateString(locale.lang, { dateStyle: 'medium' });
    return `⏰ ${time} · ${origin}`;
  }
</script>

<section class="group">
  <ul>
    {#each entries as entry (entry.tab.id)}
      <li class:due={entry.tab.remindAt! <= now}>
        <TabItem
          tab={entry.tab}
          source={label(entry)}
          onRestore={() => onRestoreTab(entry)}
          onDelete={() => onDeleteTab(entry)}
          onToggleStar={() => onToggleStar(entry)}
          onRemind={(remindAt) => onSetReminder(entry, remindAt)}
          disabled={entry.group.locked}
        />
      </li>
    {/each}
  </ul>
</section>

<style>
  .group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li.due :global(.source) {
    color: var(--accent);
    font-weight: 600;
  }
</style>
