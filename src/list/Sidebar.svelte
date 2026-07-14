<script lang="ts">
  import type { ListView } from '../filter';

  let {
    query = $bindable(''),
    view,
    counts,
    onSelectView,
  }: {
    query: string;
    view: ListView;
    counts: { tabs: number; groups: number; starred: number; locked: number };
    onSelectView: (view: ListView) => void;
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
    placeholder="제목·주소 검색"
    bind:value={query}
  />

  <nav class="views">
    <button class:active={view === 'all'} onclick={() => onSelectView('all')}>
      전체 <span class="count">{counts.tabs}</span>
    </button>
    <button class:active={view === 'starred'} onclick={() => onSelectView('starred')}>
      ★ 즐겨찾기 <span class="count">{counts.starred}</span>
    </button>
    <button class:active={view === 'locked'} onclick={() => onSelectView('locked')}>
      🔒 잠긴 그룹 <span class="count">{counts.locked}</span>
    </button>
  </nav>

  <p class="summary">탭 {counts.tabs}개 · 그룹 {counts.groups}개</p>
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
  .summary {
    margin-top: auto;
    margin-bottom: 0;
    font-size: var(--text-xs);
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
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
    .summary {
      margin-top: 0;
      border-top: none;
      padding-top: 0;
    }
  }
</style>
