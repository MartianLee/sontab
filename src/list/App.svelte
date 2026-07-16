<script lang="ts">
  import { onMount } from 'svelte';
  import type { TabGroup } from '../types';
  import {
    addGroup,
    addGroupTag,
    countTabs,
    createGroup,
    loadDomainLimit,
    loadGroups,
    loadHideMainPages,
    loadLang,
    loadTheme,
    persistDomainLimit,
    persistGroups,
    persistHideMainPages,
    persistLang,
    persistTheme,
    type DomainLimit,
    removeGroup,
    removeGroupTag,
    removeTab,
    removeTabs,
    renameGroup,
    setReminder,
    sortByCreatedAt,
    toggleLock,
    toggleStar,
  } from '../storage';
  import {
    allTags,
    byTag,
    byView,
    countLockedGroups,
    countStarred,
    filterGroups,
    type SidebarView,
  } from '../filter';
  import { groupByDomain, hideMainPages, type DomainEntry } from '../domain';
  import { exportText, parseImport, parseOneTabHtml } from '../importExport';
  import { detectLang, type Lang } from '../i18n';
  import {
    countReminders,
    hideSnoozed,
    reminderEntries,
    type ReminderEntry,
  } from '../remind';
  import { resolveTheme, type ThemeSetting } from '../theme';
  import { locale, t, tc } from './locale.svelte';
  import DomainGroup from './DomainGroup.svelte';
  import Group from './Group.svelte';
  import ReminderList from './ReminderList.svelte';
  import Settings from './Settings.svelte';
  import Sidebar from './Sidebar.svelte';

  let groups = $state<TabGroup[]>([]);
  let query = $state('');
  let view = $state<SidebarView>('all');
  let page = $state<'list' | 'settings'>('list');
  let theme = $state<ThemeSetting>('auto');
  let systemDark = $state(matchMedia('(prefers-color-scheme: dark)').matches);
  let hideMain = $state(true);
  let domainLimit = $state<DomainLimit>(5);
  let now = $state(Date.now()); // 30초마다 갱신 — 도착한 리마인더를 새로고침 없이 반영
  let activeTag = $state<string | null>(null);

  $effect(() => {
    document.documentElement.dataset.theme = resolveTheme(theme, systemDark);
  });

  function setTheme(t: ThemeSetting) {
    theme = t;
    void persistTheme(t);
  }

  function setHideMain(value: boolean) {
    hideMain = value;
    void persistHideMainPages(value);
  }

  function setLang(lang: Lang) {
    locale.lang = lang;
    void persistLang(lang);
  }

  function setDomainLimit(value: DomainLimit) {
    domainLimit = value;
    void persistDomainLimit(value);
  }

  const effective = $derived(
    hideSnoozed(hideMain ? hideMainPages(groups) : groups, now),
  );
  const tags = $derived(allTags(groups));
  const visible = $derived.by(() => {
    if (view === 'domain' || view === 'later') return [];
    if (view === 'tag') {
      return activeTag ? filterGroups(byTag(effective, activeTag), query) : [];
    }
    return filterGroups(byView(effective, view), query);
  });

  // 마지막 그룹에서 태그가 지워지면 태그 뷰를 떠난다
  $effect(() => {
    if (view === 'tag' && (!activeTag || !tags.some((t) => t.tag === activeTag))) {
      view = 'all';
      activeTag = null;
    }
  });
  const domainGroups = $derived(
    view === 'domain' ? groupByDomain(filterGroups(effective, query)) : [],
  );
  // '나중에' 뷰는 숨김 규칙과 무관하게 리마인더 걸린 모든 탭을 보여준다
  const laterEntries = $derived.by(() => {
    if (view !== 'later') return [];
    const q = query.trim().toLowerCase();
    return reminderEntries(groups).filter(
      (e) =>
        !q ||
        e.tab.title.toLowerCase().includes(q) ||
        e.tab.url.toLowerCase().includes(q),
    );
  });
  const counts = $derived({
    tabs: countTabs(effective),
    groups: effective.length,
    starred: countStarred(effective),
    locked: countLockedGroups(effective),
    domains: groupByDomain(effective).length,
    later: countReminders(groups),
  });
  const viewTitle = $derived(
    view === 'all'
      ? t('view.all')
      : view === 'starred'
        ? t('view.starred')
        : view === 'locked'
          ? t('view.locked')
          : view === 'domain'
            ? t('view.domain')
            : view === 'tag'
              ? `#${activeTag ?? ''}`
              : t('view.later'),
  );

  onMount(() => {
    void loadGroups().then((g) => (groups = sortByCreatedAt(g)));
    void loadTheme().then((v) => (theme = v));
    void loadHideMainPages().then((v) => (hideMain = v));
    void loadDomainLimit().then((v) => (domainLimit = v));
    void loadLang().then((stored) => {
      if (stored) {
        locale.lang = stored;
      } else {
        // 첫 실행: 브라우저 언어가 지원 언어면 자동 설정 (기본 영어)
        locale.lang = detectLang(navigator.languages);
        void persistLang(locale.lang);
      }
    });
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onMedia = (e: MediaQueryListEvent) => (systemDark = e.matches);
    media.addEventListener('change', onMedia);
    const tick = setInterval(() => (now = Date.now()), 30_000);
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes.groups) {
        groups = sortByCreatedAt(
          (changes.groups.newValue as TabGroup[] | undefined) ?? [],
        );
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
      media.removeEventListener('change', onMedia);
      clearInterval(tick);
    };
  });

  async function update(mutate: (current: TabGroup[]) => TabGroup[]) {
    const next = sortByCreatedAt(mutate(await loadGroups()));
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
    if (!opened) return;
    if (!tab.starred) {
      await update((g) => removeTab(g, group.id, tabId));
    } else if (tab.remindAt !== undefined) {
      // 열어본 리마인더는 완료 처리 (즐겨찾기라 탭은 목록에 남는다)
      await update((g) => setReminder(g, group.id, tabId, null));
    }
  }

  async function restoreGroup(group: TabGroup) {
    const keep = new Set<string>();
    for (const tab of group.tabs) {
      const opened = await openTab(tab.url);
      if (!opened || tab.starred) keep.add(tab.id);
    }
    const toRemove = group.tabs.filter((t) => !keep.has(t.id)).map((t) => t.id);
    if (toRemove.length > 0) {
      await update((g) => removeTabs(g, group.id, toRemove));
    }
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
  <Sidebar
    bind:query
    {view}
    {counts}
    {tags}
    {activeTag}
    settingsOpen={page === 'settings'}
    onSelectView={(v) => {
      view = v;
      activeTag = null;
      page = 'list';
    }}
    onSelectTag={(tag) => {
      activeTag = tag;
      view = 'tag';
      page = 'list';
    }}
    onOpenSettings={() => (page = 'settings')}
  />

  <main>
    {#if page === 'settings'}
      <header class="content-head">
        <h1>{t('settings.title')}</h1>
      </header>
      <Settings
        counts={{ tabs: counts.tabs, groups: counts.groups }}
        {theme}
        {hideMain}
        {domainLimit}
        onSetTheme={setTheme}
        onSetHideMain={setHideMain}
        onSetLang={setLang}
        onSetDomainLimit={setDomainLimit}
        onExport={() => exportText(groups)}
        onImport={handleImport}
        onImportHtml={handleImportHtml}
      />
    {:else}
    <header class="content-head">
      <h1>{viewTitle}</h1>
      <span class="meta">
        {#if view === 'domain'}
          {tc('unit.tab', domainGroups.reduce((n, d) => n + d.entries.length, 0))} · {tc('unit.domain', domainGroups.length)}
        {:else if view === 'later'}
          {tc('unit.tab', laterEntries.length)}
        {:else}
          {tc('unit.tab', countTabs(visible))} · {tc('unit.group', visible.length)}
        {/if}
      </span>
    </header>

    {#if view === 'later'}
      {#if laterEntries.length === 0}
        <p class="empty">
          {#if query.trim()}
            {t('empty.search', { query: query.trim() })}
          {:else}
            {t('empty.later')}
          {/if}
        </p>
      {:else}
        <ReminderList
          entries={laterEntries}
          {now}
          onRestoreTab={(e: ReminderEntry) => restoreTab(e.group, e.tab.id)}
          onDeleteTab={(e: ReminderEntry) => update((g) => removeTab(g, e.group.id, e.tab.id))}
          onToggleStar={(e: ReminderEntry) => update((g) => toggleStar(g, e.group.id, e.tab.id))}
          onSetReminder={(e: ReminderEntry, remindAt) =>
            update((g) => setReminder(g, e.group.id, e.tab.id, remindAt))}
        />
      {/if}
    {:else if view === 'domain'}
      {#if domainGroups.length === 0}
        <p class="empty">
          {#if query.trim()}
            {t('empty.search', { query: query.trim() })}
          {:else}
            {t('empty.all')}
          {/if}
        </p>
      {:else}
        {#each domainGroups as domainGroup (domainGroup.domain)}
          <DomainGroup
            {domainGroup}
            limit={domainLimit}
            onRestoreTab={(e: DomainEntry) => restoreTab(e.group, e.tab.id)}
            onDeleteTab={(e: DomainEntry) => update((g) => removeTab(g, e.group.id, e.tab.id))}
            onToggleStar={(e: DomainEntry) => update((g) => toggleStar(g, e.group.id, e.tab.id))}
            onSetReminder={(e: DomainEntry, remindAt) =>
              update((g) => setReminder(g, e.group.id, e.tab.id, remindAt))}
          />
        {/each}
      {/if}
    {:else if visible.length === 0}
      <p class="empty">
        {#if query.trim()}
          {t('empty.search', { query: query.trim() })}
        {:else if view === 'starred'}
          {t('empty.starred')}
        {:else if view === 'locked'}
          {t('empty.locked')}
        {:else}
          {t('empty.all')}
        {/if}
      </p>
    {:else}
      {#each visible as group (group.id)}
        <Group
          {group}
          {now}
          onRestoreTab={(tabId) => restoreTab(group, tabId)}
          onDeleteTab={(tabId) => update((g) => removeTab(g, group.id, tabId))}
          onRestoreGroup={() => restoreGroup(group)}
          onDeleteGroup={() => update((g) => removeGroup(g, group.id))}
          onRename={(name) => update((g) => renameGroup(g, group.id, name))}
          onToggleLock={() => update((g) => toggleLock(g, group.id))}
          onToggleStar={(tabId) => update((g) => toggleStar(g, group.id, tabId))}
          onSetReminder={(tabId, remindAt) =>
            update((g) => setReminder(g, group.id, tabId, remindAt))}
          onAddTag={(tag) => update((g) => addGroupTag(g, group.id, tag))}
          onRemoveTag={(tag) => update((g) => removeGroupTag(g, group.id, tag))}
        />
      {/each}
    {/if}
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
