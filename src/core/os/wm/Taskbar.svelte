<script lang="ts">
  import { flip } from "svelte/animate";
  import ContextMenu from "./ContextMenu.svelte";
  import StartMenu from "./StartMenu.svelte";
  import type { WmApi } from "./wm.svelte";

  let { taskbar = $bindable(), wmApi }: { taskbar: number[]; wmApi: WmApi } =
    $props();

  let itemRefs = new Map<number, HTMLElement>();
  let draggingIdx: number | null = $state(null);
  let hoveredIdx: number | null = $state(null);

  let mouseX = $state(0);
  let startX = $state(0);
  let scrollOffset = 0;

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
    if (e.button !== 0) return;

    draggingIdx = index;
    startX = e.clientX;
    mouseX = e.clientX;
  }

  function handlePointerMove(e: PointerEvent) {
    if (draggingIdx === null) return;

    mouseX = e.clientX;

    for (let i = 0; i < taskbar.length; i++) {
      if (i === draggingIdx) continue;

      const id = taskbar[i];
      const el = itemRefs.get(id);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      if (i > draggingIdx && mouseX > midpoint) {
        reorder(draggingIdx, i);
        startX += rect.width * 1;
      } else if (i < draggingIdx && mouseX < midpoint) {
        reorder(draggingIdx, i);
        startX += rect.width * -1;
      }
    }
  }

  function reorder(from: number, to: number) {
    const [movedItem] = taskbar.splice(from, 1);
    taskbar.splice(to, 0, movedItem);
    draggingIdx = to;
  }

  function handlePointerUp() {
    draggingIdx = null;
  }

  function registerRef(id: number) {
    return (node: HTMLElement) => {
      itemRefs.set(id, node);

      return () => {
        itemRefs.delete(id);
      };
    };
  }
</script>

<svelte:window
  onmousedowncapture={handleGlobalClick}
  onpointermove={handlePointerMove}
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
      animate:flip={draggingIdx === i ? { duration: 0 } : { duration: 200 }}
      class="wintab-wrapper"
      class:dragging={draggingIdx === i}
      style:translate={draggingIdx === i
        ? `${mouseX - startX}px 0px`
        : undefined}
      {@attach registerRef(id)}
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
