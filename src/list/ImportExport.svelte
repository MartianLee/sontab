<script lang="ts">
  let {
    onExport,
    onImport,
  }: {
    onExport: () => string;
    onImport: (text: string) => number;
  } = $props();

  let open = $state(false);
  let text = $state('');
  let message = $state('');

  function handleExport() {
    text = onExport();
    message = '';
  }

  function handleImport() {
    const added = onImport(text);
    message = added > 0 ? `그룹 ${added}개를 가져왔습니다.` : '가져올 URL이 없습니다.';
  }
</script>

<div class="import-export">
  <button class="toggle" onclick={() => (open = !open)}>
    {open ? '가져오기/내보내기 닫기' : '가져오기/내보내기'}
  </button>
  {#if open}
    <div class="panel">
      <textarea
        bind:value={text}
        rows="8"
        placeholder={'URL | 제목 형식, 그룹 사이는 빈 줄 (OneTab 호환)'}
      ></textarea>
      <div class="buttons">
        <button onclick={handleExport}>현재 목록 내보내기</button>
        <button onclick={handleImport}>텍스트 가져오기</button>
        {#if message}<span class="message">{message}</span>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .import-export {
    margin-bottom: var(--space-5);
  }
  .toggle,
  .buttons button {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
  }
  .toggle:hover,
  .buttons button:hover {
    background: var(--surface-hover);
  }
  .panel {
    margin-top: var(--space-2);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.5;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
  }
  .buttons {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin-top: var(--space-2);
  }
  .message {
    font-size: var(--text-xs);
    color: var(--success);
  }
</style>
