<script lang="ts">
  let { taskbar, wmApi } = $props();
</script>

<div id="taskbar">
  {#each taskbar as id (id)}
    {@const w = wmApi.getWindows()[id]}
    <button onclick={() => wmApi.focusWindow(Number(id))}>
      {w.title}
    </button>
  {/each}
</div>

<style>
  #taskbar {
    position: absolute;
    box-sizing: border-box;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40px;
    background: #c0c0c0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    /* TODO: jank */
    z-index: 1000000;
  }

  #taskbar button {
    color: white;
    background-color: #c0c0c0;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
  }

  #taskbar button:hover {
    background-color: #a0a0a0;
  }
</style>
