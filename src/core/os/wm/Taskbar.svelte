<script lang="ts">
  import { flip } from "svelte/animate";
  import ContextMenu from "./ContextMenu.svelte";
  import StartMenu from "./StartMenu.svelte";
  import type { WmApi } from "./wm.svelte";

  let { taskbar = $bindable(), wmApi }: { taskbar: number[]; wmApi: WmApi } =
    $props();

  let draggingIdx: number | null = $state(null);
  let hoveredIdx: number | null = $state(null);

  let isStartOpen = $state(false);

  let startButton: HTMLButtonElement;
  let startMenu: HTMLElement | null = $state(null);
  let contextMenu: ContextMenu;
  let menuTarget: number = $state(-1);

  function handleGlobalClick(e: MouseEvent) {
    if (!isStartOpen) return;

    const target = e.target as Node;
    if (startButton.contains(target)) return;
    if (startMenu?.contains(target)) return;

    isStartOpen = false;
  }

  function handlePointerDown(e: PointerEvent, index: number) {
    draggingIdx = index;
  }

  function handlePointerEnter(index: number) {
    if (draggingIdx !== null && draggingIdx !== index) {
      const draggedItem = taskbar.splice(draggingIdx, 1)[0];
      taskbar.splice(index, 0, draggedItem);

      draggingIdx = index;
    }
  }

  function handlePointerUp() {
    draggingIdx = null;
  }
</script>

<svelte:window
  onmousedowncapture={handleGlobalClick}
  onpointerup={handlePointerUp}
/>

{#if isStartOpen}
  <div bind:this={startMenu}>
    <StartMenu
      closeMenu={() => {
        isStartOpen = false;
      }}
    />
  </div>
{/if}

<div class="taskbar" class:is-dragging={draggingIdx !== null}>
  <button
    class="startbutton {isStartOpen ? 'active' : ''}"
    bind:this={startButton}
    onclick={() => (isStartOpen = !isStartOpen)}
  >
    Start
  </button>

  <div class="divider"></div>

  {#each taskbar as id, i (id)}
    {@const w = wmApi.getWindows().get(id)!.data}
    <div
      animate:flip={{ duration: 300 }}
      class="wintab-wrapper"
      class:dragging={draggingIdx === i}
      onpointerenter={() => handlePointerEnter(i)}
    >
      <button
        class="wintab {wmApi.isWindowFocused(id) && !w.isMinimized
          ? 'active'
          : ''}"
        onclick={() => wmApi.focusWindow(Number(id))}
        onpointerdown={(e) => handlePointerDown(e, i)}
        oncontextmenu={(e) => {
          menuTarget = id;
          contextMenu.show(e);
        }}
      >
        {w.title}
      </button>
    </div>
  {/each}
</div>

<ContextMenu bind:this={contextMenu}>
  {#if wmApi.getWindows().get(menuTarget)?.data.isMinimized}
    <button onclick={() => wmApi.focusWindow(menuTarget)}>restore</button>
  {:else}
    <button onclick={() => wmApi.minimizeWindow(menuTarget)}>minimize</button>
  {/if}

  <button onclick={() => wmApi.closeWindow(menuTarget)}>close</button>
</ContextMenu>

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

  .wintab-wrapper {
    display: flex;
  }

  .wintab-wrapper.dragging {
    z-index: 10;
  }

  .wintab {
    width: 100%;
  }
</style>
