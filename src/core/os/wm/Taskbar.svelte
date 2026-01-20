<script lang="ts">
  import { flip } from "svelte/animate";
  import { cubicInOut } from "svelte/easing";
  import { SvelteSet } from "svelte/reactivity";
  import type { TransitionConfig } from "svelte/transition";
  import ContextMenu from "./ContextMenu.svelte";
  import StartMenu from "./StartMenu.svelte";
  import type { WmApi } from "./wm.svelte";

  let { taskbar = $bindable(), wmApi }: { taskbar: number[]; wmApi: WmApi } =
    $props();

  let itemRefs = new Map<number, HTMLElement>();
  let animatingIds: Set<number> = new SvelteSet();
  let draggingId: number | null = $state(null);
  let lastDragged: number = -1;

  let justDragged = false;

  let mouseX = $state(0);
  let startX = $state(0);
  let grabOffset = $state(0);
  let wasDragActive = $state(false);
  let dragRect = $state({ width: 0, height: 0, top: 0 });

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

  function handlePointerDown(
    e: PointerEvent,
    id: number,
    index: number,
    active: boolean,
  ) {
    justDragged = false;

    if (e.button !== 0) return;

    const target = itemRefs.get(id)!;
    const rect = target.getBoundingClientRect();

    draggingId = id;
    grabOffset = e.clientX - rect.left;
    dragRect = { width: rect.width, height: rect.height, top: rect.top };
    wasDragActive = active;

    startX = e.clientX;
    mouseX = e.clientX;
  }

  function handlePointerMove(e: PointerEvent) {
    if (draggingId === null) return;

    mouseX = e.clientX;
    if (Math.abs(mouseX - startX) > 5) {
      justDragged = true;
    }

    const draggingIdx = taskbar.indexOf(draggingId);
    const floatingLeft = mouseX - grabOffset;
    const floatingCenter = floatingLeft + dragRect.width / 2;

    for (let i = 0; i < taskbar.length; i++) {
      if (i === draggingIdx) continue;

      const id = taskbar[i];
      const targetEl = itemRefs.get(id);
      if (!targetEl) continue;

      const targetRect = targetEl.getBoundingClientRect();

      if (
        i > draggingIdx &&
        floatingCenter > targetRect.left + targetRect.width * 0.55
      ) {
        reorder(draggingIdx, i);
        startX += targetRect.width * 1;
      } else if (
        i < draggingIdx &&
        floatingCenter < targetRect.right - targetRect.width * 0.55
      ) {
        reorder(draggingIdx, i);
        startX += targetRect.width * -1;
      }
    }
  }

  function reorder(from: number, to: number) {
    const [movedItem] = taskbar.splice(from, 1);
    taskbar.splice(to, 0, movedItem);
  }

  function handlePointerUp() {
    if (draggingId !== null) {
      lastDragged = draggingId;
      animatingIds.add(draggingId);
    }
    draggingId = null;
  }

  function registerRef(id: number) {
    return (node: HTMLElement) => {
      itemRefs.set(id, node);

      return () => {
        itemRefs.delete(id);
      };
    };
  }

  function grab(
    node: HTMLElement,
    params: {
      delay?: number;
      duration?: number;
      easing?: (t: number) => number;
    } = {},
  ): TransitionConfig {
    return {
      delay: params.delay || 0,
      duration: params.duration || 100,
      easing: params.easing || cubicInOut,
      css: (t, u) => {
        return `
          transform: scale(${1 + 0.05 * t}) translateY(${-2 * t}px);
        `;
      },
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

<div class="taskbar" class:is-dragging={draggingId !== null}>
  <button
    class="startbutton {isStartOpen ? 'active' : ''}"
    bind:this={startButton}
    onclick={() => (isStartOpen = !isStartOpen)}
  >
    Start
  </button>

  <div class="divider"></div>

  <div class="wintabs-container">
    {#each taskbar as id, i (id)}
      {@const w = wmApi.getWindows().get(id)!.data}
      <div
        animate:flip={draggingId === id ? { duration: 0 } : { duration: 200 }}
        class="wintab-wrapper"
        class:is-placeholder={draggingId === id || animatingIds.has(id)}
        {@attach registerRef(id)}
      >
        <button
          class="wintab {wmApi.isWindowFocused(id) && !w.isMinimized
            ? 'active'
            : ''}"
          onpointerup={() => {
            if (!justDragged) wmApi.focusWindow(Number(id));
          }}
          onpointerdown={(e) =>
            handlePointerDown(
              e,
              id,
              i,
              wmApi.isWindowFocused(id) && !w.isMinimized,
            )}
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

  {#if draggingId !== null}
    {@const w = wmApi.getWindows().get(draggingId)!.data}
    <div
      class="wintab-wrapper dragging"
      style:width="{dragRect.width}px"
      style:height="{dragRect.height}px"
      style:left="{mouseX - grabOffset}px"
      style:top="{dragRect.top}px"
      transition:grab
      onoutroend={() => {
        animatingIds.delete(lastDragged);
      }}
    >
      <button class="wintab" class:active={wasDragActive}>{w.title}</button>
    </div>
  {/if}
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
  }

  .wintabs-container {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    overflow-x: auto;
    scrollbar-width: none;
    padding-left: 6px;

    /* extend clipping box */
    padding-top: 10px;
    margin-top: -10px;
  }

  .startbutton {
    z-index: 20;
    margin-right: 8px;
  }

  .wintab-wrapper {
    display: flex;
  }

  .wintab-wrapper.is-placeholder {
    opacity: 0;
  }

  .wintab-wrapper.dragging {
    position: fixed;
    z-index: 15;
    pointer-events: none;
  }

  .wintab {
    width: 100%;
  }
</style>
