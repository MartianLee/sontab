<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabGroup } from '../types';
  import {
    addGroup,
    countTabs,
    createGroup,
    loadGroups,
    persistGroups,
    removeGroup,
    removeTab,
    renameGroup,
    toggleLock,
    toggleStar,
  } from '../storage';
  import {
    byView,
    countLockedGroups,
    countStarred,
    filterGroups,
    type ListView,
  } from '../filter';
  import { exportText, parseImport, parseOneTabHtml } from '../importExport';
  import Group from './Group.svelte';
  import ImportExport from './ImportExport.svelte';
  import Sidebar from './Sidebar.svelte';

  let groups = $state<TabGroup[]>([]);
  let query = $state('');
  let view = $state<ListView>('all');

  const visible = $derived(filterGroups(byView(groups, view), query));
  const counts = $derived({
    tabs: countTabs(groups),
    groups: groups.length,
    starred: countStarred(groups),
    locked: countLockedGroups(groups),
  });
  const viewTitle = $derived(
    view === 'all' ? '전체' : view === 'starred' ? '즐겨찾기' : '잠긴 그룹',
  );

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
      return false;
    }
  }

  async function restoreTab(group: TabGroup, tabId: string) {
    const tab = group.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const opened = await openTab(tab.url);
    if (opened && !tab.starred) {
      await update((g) => removeTab(g, group.id, tabId));
    }
  }

  async function restoreGroup(group: TabGroup) {
    const keep = new Set<string>();
    for (const tab of group.tabs) {
      const opened = await openTab(tab.url);
      if (!opened || tab.starred) keep.add(tab.id);
    }
    await update((current) => {
      if (keep.size === 0) return removeGroup(current, group.id);
      let next = current;
      for (const tab of group.tabs) {
        if (!keep.has(tab.id)) next = removeTab(next, group.id, tab.id);
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
          next = addGroup(next, {
            ...createGroup(g.tabs, g.createdAt ?? Date.now()),
            name: g.name,
          });
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

<div class="layout">
  <Sidebar bind:query {view} {counts} onSelectView={(v) => (view = v)} />

  <main>
    <header class="content-head">
      <h1>{viewTitle}</h1>
      <span class="meta">
        탭 {countTabs(visible)}개 · 그룹 {visible.length}개
      </span>
    </header>

    <ImportExport
      onExport={() => exportText(groups)}
      onImport={handleImport}
      onImportHtml={handleImportHtml}
    />

    {#if visible.length === 0}
      <p class="empty">
        {#if query.trim()}
          '{query.trim()}'에 맞는 탭이 없습니다.
        {:else if view === 'starred'}
          즐겨찾기한 탭이 없습니다. 탭 왼쪽의 ☆를 눌러 다시 읽을 페이지를 표시해 보세요.
        {:else if view === 'locked'}
          잠긴 그룹이 없습니다.
        {:else}
          저장된 탭이 없습니다. 툴바의 SonTab 아이콘을 눌러 탭을 모아보세요.
        {/if}
      </p>
    {:else}
      {#each visible as group (group.id)}
        <Group
          {group}
          onRestoreTab={(tabId) => restoreTab(group, tabId)}
          onDeleteTab={(tabId) => update((g) => removeTab(g, group.id, tabId))}
          onRestoreGroup={() => restoreGroup(group)}
          onDeleteGroup={() => update((g) => removeGroup(g, group.id))}
          onRename={(name) => update((g) => renameGroup(g, group.id, name))}
          onToggleLock={() => update((g) => toggleLock(g, group.id))}
          onToggleStar={(tabId) => update((g) => toggleStar(g, group.id, tabId))}
        />
      {/each}
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }
  .layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 100vh;
  }
  main {
    max-width: 760px;
    padding: var(--space-5) var(--space-4) var(--space-6);
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .content-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  h1 {
    font-size: var(--text-lg);
    margin: 0;
  }
  .meta {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: var(--space-6) 0;
  }
  @media (max-width: 720px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
