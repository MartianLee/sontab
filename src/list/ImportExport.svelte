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
    margin-bottom: 20px;
  }
  .toggle,
  .buttons button {
    font-size: 12px;
    padding: 4px 10px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .toggle:hover,
  .buttons button:hover {
    background: #f2f4f7;
  }
  .panel {
    margin-top: 8px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: 12px/1.5 ui-monospace, monospace;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    padding: 8px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
  }
  .message {
    font-size: 12px;
    color: #027a48;
  }
</style>
