<script lang="ts">
  import StartMenu from "./StartMenu.svelte";

  let { taskbar, wmApi }: { taskbar: number[]; wmApi: any } = $props();

  let isStartOpen = $state(false);

  let startButton: HTMLButtonElement | null = $state(null);
  let startMenu: HTMLElement | null = $state(null);

  function handleGlobalClick(e: MouseEvent) {
    if (!isStartOpen) return;

    const target = e.target as Node;
    if (startButton?.contains(target)) return;
    if (startMenu?.contains(target)) return;

    isStartOpen = false;
  }
</script>

<svelte:window onmousedowncapture={handleGlobalClick} />

{#if isStartOpen}
  <div bind:this={startMenu}>
    <StartMenu
      closeMenu={() => {
        isStartOpen = false;
      }}
    />
  </div>
{/if}

<div class="taskbar">
  <button
    class="startbutton {isStartOpen ? 'activated' : ''}"
    bind:this={startButton}
    onclick={() => (isStartOpen = !isStartOpen)}
  >
    Start
  </button>

  <div class="divider"></div>

  {#each taskbar as id (id)}
    {@const w = wmApi.getWindows().get(id).data}
    <button onclick={() => wmApi.focusWindow(Number(id))}>
      {w.title}
    </button>
  {/each}
</div>

<style>
  .taskbar {
    position: absolute;
    box-sizing: border-box;
    bottom: 0;
    left: 0;
    width: 100%;
    min-height: 40px;
    background: #c0c0c0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }

  .taskbar button {
    color: white;
    background-color: #c0c0c0;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
  }

  .taskbar button:hover {
    background-color: #a0a0a0;
  }

  button.startbutton {
    padding: 4px 14px;
    font-weight: bold;
  }

  /* specificity porblem */
  button.startbutton:where(.activated) {
    background-color: #b8b8b8;
  }

  .divider {
    align-self: stretch;
    width: 3px;
    background: #b8b8b8;
    margin: 0 4px;
  }
</style>
