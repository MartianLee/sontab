<script lang="ts">
  import type { DomainEntry, DomainGroup } from '../domain';
  import { locale, t, tc } from './locale.svelte';
  import TabItem from './TabItem.svelte';

  let {
    domainGroup,
    limit,
    onRestoreTab,
    onDeleteTab,
    onToggleStar,
  }: {
    domainGroup: DomainGroup;
    limit: number;
    onRestoreTab: (entry: DomainEntry) => void;
    onDeleteTab: (entry: DomainEntry) => void;
    onToggleStar: (entry: DomainEntry) => void;
  } = $props();

  let expanded = $state(false);

  const favicon = $derived(
    domainGroup.entries.find((e) => e.tab.favIconUrl)?.tab.favIconUrl,
  );
  const shown = $derived(expanded ? domainGroup.entries : domainGroup.entries.slice(0, limit));
  const hiddenCount = $derived(domainGroup.entries.length - Math.min(limit, domainGroup.entries.length));

  function sourceLabel(entry: DomainEntry): string {
    return (
      entry.group.name ||
      new Date(entry.group.createdAt).toLocaleDateString(locale.lang, { dateStyle: 'medium' })
    );
  }
</script>

<section class="group">
  <header>
    {#if favicon}
      <img class="favicon" src={favicon} alt="" />
    {/if}
    <span class="name">{domainGroup.domain || t('domain.other')}</span>
    <span class="meta">{tc('unit.tab', domainGroup.entries.length)}</span>
  </header>
  <ul>
    {#each shown as entry (entry.tab.id)}
      <TabItem
        tab={entry.tab}
        source={sourceLabel(entry)}
        onRestore={() => onRestoreTab(entry)}
        onDelete={() => onDeleteTab(entry)}
        onToggleStar={() => onToggleStar(entry)}
        disabled={entry.group.locked}
      />
    {/each}
  </ul>
  {#if hiddenCount > 0}
    <button class="fold" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
      {expanded ? t('domain.collapse') : t('domain.expand', { n: hiddenCount })}
    </button>
  {/if}
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
  .favicon {
    width: 16px;
    height: 16px;
  }
  .name {
    font-weight: 600;
  }
  .meta {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fold {
    margin-top: var(--space-1);
    font: inherit;
    font-size: var(--text-xs);
    color: var(--accent);
    background: none;
    border: none;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .fold:hover {
    background: var(--surface-hover);
  }
</style>
