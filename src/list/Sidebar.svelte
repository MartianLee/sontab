<script lang="ts">
  import type { SidebarView, TagCount } from '../filter';
  import { t, tc } from './locale.svelte';

  let {
    query = $bindable(''),
    view,
    counts,
    tags,
    activeTag,
    settingsOpen,
    onSelectView,
    onSelectTag,
    onOpenSettings,
  }: {
    query: string;
    view: SidebarView;
    counts: {
      tabs: number;
      groups: number;
      starred: number;
      locked: number;
      domains: number;
      later: number;
    };
    tags: TagCount[];
    activeTag: string | null;
    settingsOpen: boolean;
    onSelectView: (view: SidebarView) => void;
    onSelectTag: (tag: string) => void;
    onOpenSettings: () => void;
  } = $props();
</script>

<aside>
  <div class="logo">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="var(--text)" stroke-width="7" stroke-linejoin="round">
        <circle cx="60" cy="74" r="30" fill="var(--surface)" />
        <path d="M30,56 L30,42 Q30,30 44,30 L76,30 Q90,30 90,42 L90,56 Z" fill="var(--accent)" />
        <circle cx="44" cy="42" r="3.4" fill="var(--danger)" stroke="none" />
        <circle cx="50" cy="74" r="3.2" fill="var(--text)" stroke="none" />
        <circle cx="70" cy="74" r="3.2" fill="var(--text)" stroke="none" />
        <path d="M52,86 Q60,93 68,86" stroke-width="5" stroke-linecap="round" />
      </g>
    </svg>
    <span class="wordmark">SonTab</span>
  </div>

  <input
    class="search"
    type="search"
    placeholder={t('sidebar.search')}
    bind:value={query}
  />

  <nav class="views">
    <button class:active={!settingsOpen && view === 'all'} onclick={() => onSelectView('all')}>
      {t('view.all')} <span class="count">{counts.tabs}</span>
    </button>
    <button
      class:active={!settingsOpen && view === 'starred'}
      onclick={() => onSelectView('starred')}
    >
      ★ {t('view.starred')} <span class="count">{counts.starred}</span>
    </button>
    <button
      class:active={!settingsOpen && view === 'locked'}
      onclick={() => onSelectView('locked')}
    >
      🔒 {t('view.locked')} <span class="count">{counts.locked}</span>
    </button>
    <button
      class:active={!settingsOpen && view === 'domain'}
      onclick={() => onSelectView('domain')}
    >
      🌐 {t('view.domain')} <span class="count">{counts.domains}</span>
    </button>
    <button
      class:active={!settingsOpen && view === 'later'}
      onclick={() => onSelectView('later')}
    >
      ⏰ {t('view.later')} <span class="count">{counts.later}</span>
    </button>
  </nav>

  {#if tags.length > 0}
    <nav class="views tags" aria-label={t('sidebar.tags')}>
      <p class="section-label">{t('sidebar.tags')}</p>
      {#each tags as { tag, count } (tag)}
        <button
          class:active={!settingsOpen && view === 'tag' && activeTag === tag}
          onclick={() => onSelectTag(tag)}
        >
          <span class="tag-name">#{tag}</span> <span class="count">{count}</span>
        </button>
      {/each}
    </nav>
  {/if}

  <div class="footer">
    <button class="settings-btn" class:active={settingsOpen} onclick={onOpenSettings}>
      ⚙ {t('sidebar.settings')}
    </button>
    <p class="summary">{tc('unit.tab', counts.tabs)} · {tc('unit.group', counts.groups)}</p>
  </div>
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: var(--surface);
    border-right: 1px solid var(--border);
    position: sticky;
    top: 0;
    height: 100vh;
    box-sizing: border-box;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .logo svg {
    width: 30px;
    height: 30px;
  }
  .wordmark {
    font-size: var(--text-lg);
    font-weight: 800;
  }
  .search {
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg);
    color: var(--text);
  }
  .views {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .views button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    padding: var(--space-1) var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    cursor: pointer;
  }
  .views button:hover {
    background: var(--surface-hover);
  }
  .views button.active {
    background: var(--surface-hover);
    font-weight: 700;
  }
  .count {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
  .tags {
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
    overflow-y: auto;
  }
  .section-label {
    margin: 0 0 var(--space-1);
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .tag-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
  }
  .settings-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    padding: var(--space-1) var(--space-2);
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    cursor: pointer;
  }
  .settings-btn:hover,
  .settings-btn.active {
    background: var(--surface-hover);
  }
  .settings-btn.active {
    font-weight: 700;
  }
  .summary {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
  @media (max-width: 720px) {
    aside {
      position: static;
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: var(--space-3) var(--space-4);
    }
    .views {
      flex-direction: row;
    }
    .footer {
      margin-top: 0;
      border-top: none;
      padding-top: 0;
      flex-direction: row;
      align-items: center;
    }
  }
</style>
