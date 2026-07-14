<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabGroup } from '../types';
  import {
    countTabs,
    loadGroups,
    persistGroups,
    removeGroup,
    removeTab,
    renameGroup,
    toggleLock,
    addGroup,
    createGroup,
  } from '../storage';
  import { exportText, parseImport, parseOneTabHtml } from '../importExport';
  import Group from './Group.svelte';
  import ImportExport from './ImportExport.svelte';

  let groups = $state<TabGroup[]>([]);

  onMount(() => {
    void loadGroups().then((g) => (groups = g));
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes.groups) {
        groups = (changes.groups.newValue as TabGroup[] | undefined) ?? [];
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  });

  async function update(mutate: (current: TabGroup[]) => TabGroup[]) {
    const next = mutate(await loadGroups());
    groups = next;
    await persistGroups(next);
  }

  async function openTab(url: string): Promise<boolean> {
    try {
      await chrome.tabs.create({ url, active: false });
      return true;
    } catch {
      return false; // 복원 실패(특수 URL 등) 시 항목 유지
    }
  }

  async function restoreTab(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    if (await openTab(tab.url)) {
      await update((g) => removeTab(g, group.id, tabId));
    }
  }

  async function restoreGroup(group: TabGroup) {
    const failed = new Set<string>();
    for (const tab of group.tabs) {
      if (!(await openTab(tab.url))) failed.add(tab.id);
    }
    await update((current) => {
      if (failed.size === 0) return removeGroup(current, group.id);
      let next = current;
      for (const tab of group.tabs) {
        if (!failed.has(tab.id)) next = removeTab(next, group.id, tab.id);
      }
      return next;
    });
  }

  function handleImport(text: string): number {
    const parsed = parseImport(text);
    if (parsed.length > 0) {
      void update((current) => {
        let next = current;
        for (const tabs of [...parsed].reverse()) {
          next = addGroup(next, createGroup(tabs, Date.now()));
        }
        return next;
      });
    }
    return parsed.length;
  }

  function handleImportHtml(html: string): { groups: number; tabs: number } {
    const parsed = parseOneTabHtml(html);
    if (parsed.length > 0) {
      void update((current) => {
        let next = current;
        for (const g of [...parsed].reverse()) {
          next = addGroup(next, { ...createGroup(g.tabs, g.createdAt ?? Date.now()), name: g.name });
        }
        return next;
      });
    }
    return {
      groups: parsed.length,
      tabs: parsed.reduce((sum, g) => sum + g.tabs.length, 0),
    };
  }
</script>

<main>
  <header class="page-header">
    <h1>SonTab</h1>
    <p class="summary">탭 {countTabs(groups)}개 · 그룹 {groups.length}개</p>
  </header>

  <ImportExport onExport={() => exportText(groups)} onImport={handleImport} onImportHtml={handleImportHtml} />

  {#if groups.length === 0}
    <p class="empty">저장된 탭이 없습니다. 툴바의 SonTab 아이콘을 눌러 탭을 모아보세요.</p>
  {:else}
    {#each groups as group (group.id)}
      <Group
        {group}
        onRestoreTab={(tabId) => restoreTab(group, tabId)}
        onDeleteTab={(tabId) => update((g) => removeTab(g, group.id, tabId))}
        onRestoreGroup={() => restoreGroup(group)}
        onDeleteGroup={() => update((g) => removeGroup(g, group.id))}
        onRename={(name) => update((g) => renameGroup(g, group.id, name))}
        onToggleLock={() => update((g) => toggleLock(g, group.id))}
      />
    {/each}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-6);
  }
  .page-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }
  h1 {
    font-size: var(--text-lg);
    margin: 0;
  }
  .summary {
    color: var(--text-muted);
    margin: 0;
  }
  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--space-6) 0;
  }
</style>
