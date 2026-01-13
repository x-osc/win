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
    class="startbutton {isStartOpen ? 'active' : ''}"
    bind:this={startButton}
    onclick={() => (isStartOpen = !isStartOpen)}
  >
    Start
  </button>

  <div class="divider"></div>

  {#each taskbar as id (id)}
    {@const w = wmApi.getWindows().get(id).data}
    <button class="wintab" onclick={() => wmApi.focusWindow(Number(id))}>
      {w.title}
    </button>
  {/each}
</div>

<style>
  .taskbar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
  }
</style>
