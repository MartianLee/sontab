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
  import { exportText, parseImport } from '../importExport';
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

  async function update(next: TabGroup[]) {
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
      await update(removeTab(groups, group.id, tabId));
    }
  }

  async function restoreGroup(group: TabGroup) {
    const failed = new Set<string>();
    for (const tab of group.tabs) {
      if (!(await openTab(tab.url))) failed.add(tab.id);
    }
    if (failed.size === 0) {
      await update(removeGroup(groups, group.id));
      return;
    }
    let next = groups;
    for (const tab of group.tabs) {
      if (!failed.has(tab.id)) next = removeTab(next, group.id, tab.id);
    }
    await update(next);
  }

  function handleImport(text: string): number {
    const parsed = parseImport(text);
    let next = groups;
    for (const tabs of [...parsed].reverse()) {
      next = addGroup(next, createGroup(tabs, Date.now()));
    }
    if (parsed.length > 0) void update(next);
    return parsed.length;
  }
</script>

<main>
  <header class="page-header">
    <h1>SonTab</h1>
    <p class="summary">탭 {countTabs(groups)}개 · 그룹 {groups.length}개</p>
  </header>

  <ImportExport onExport={() => exportText(groups)} onImport={handleImport} />

  {#if groups.length === 0}
    <p class="empty">저장된 탭이 없습니다. 툴바의 SonTab 아이콘을 눌러 탭을 모아보세요.</p>
  {:else}
    {#each groups as group (group.id)}
      <Group
        {group}
        onRestoreTab={(tabId) => restoreTab(group, tabId)}
        onDeleteTab={(tabId) => update(removeTab(groups, group.id, tabId))}
        onRestoreGroup={() => restoreGroup(group)}
        onDeleteGroup={() => update(removeGroup(groups, group.id))}
        onRename={(name) => update(renameGroup(groups, group.id, name))}
        onToggleLock={() => update(toggleLock(groups, group.id))}
      />
    {/each}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #f8f9fb;
    color: #101828;
    font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', sans-serif;
    font-size: 14px;
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 16px 64px;
  }
  .page-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 20px;
    margin: 0;
  }
  .summary {
    color: #667085;
    margin: 0;
  }
  .empty {
    color: #667085;
    text-align: center;
    padding: 48px 0;
  }
</style>
