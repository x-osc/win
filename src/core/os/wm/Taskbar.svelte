<script lang="ts">
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { cubicInOut } from "svelte/easing";
  import { Spring } from "svelte/motion";
  import type { TransitionConfig } from "svelte/transition";
  import ContextMenu from "./ContextMenu.svelte";
  import StartMenu from "./StartMenu.svelte";
  import type { WmApi } from "./wm.svelte";

  let { taskbar = $bindable(), wmApi }: { taskbar: number[]; wmApi: WmApi } =
    $props();

  let itemRefs = new Map<number, HTMLElement>();
  let draggingId: number | null = $state(null);
  let justDragged = false;

  let mouseX = $state(0);
  let startX = $state(0);
  let grabOffset = $state(0);
  let wasDragActive = $state(false);
  let dragRect = $state({ width: 0, height: 0, top: 0 });
  let dragPosition = new Spring(0, {
    stiffness: 0.15,
    damping: 0.6,
  });

  let lastActiveState = $state(false);
  let animatingBackId: number | null = $state(null);
  let animBackRect = $state({ width: 0, height: 0, top: 0 });
  let animBackStartX = $state(0);
  let animBackEndX = $state(0);

  let wintabsContainer: HTMLElement;
  let leftEdge: number;

  let isStartOpen = $state(false);

  let startButton: HTMLButtonElement;
  let startMenu: HTMLElement | null = $state(null);
  let contextMenu: ContextMenu;
  let menuTarget: number = $state(-1);

  onMount(() => {
    leftEdge = wintabsContainer.getBoundingClientRect().left + 6;
  });

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
    dragPosition.set(e.clientX - grabOffset, { instant: true });
  }

  let lastMouseX = 0;

  function handlePointerMove(e: PointerEvent) {
    if (draggingId === null) return;

    mouseX = e.clientX;
    if (Math.abs(mouseX - startX) > 5) {
      justDragged = true;
    }

    const movingRight = mouseX > lastMouseX;
    const movingLeft = mouseX < lastMouseX;
    lastMouseX = mouseX;

    dragPosition.set(Math.max(e.clientX - grabOffset, leftEdge));

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
        movingRight &&
        i > draggingIdx &&
        floatingCenter > targetRect.left + 5
      ) {
        reorder(draggingIdx, i);
        startX += targetRect.width * 1;
        break;
      } else if (
        movingLeft &&
        i < draggingIdx &&
        floatingCenter < targetRect.right - 5
      ) {
        reorder(draggingIdx, i);
        startX += targetRect.width * -1;
        break;
      }
    }
  }

  function reorder(from: number, to: number) {
    const [movedItem] = taskbar.splice(from, 1);
    taskbar.splice(to, 0, movedItem);
  }

  function handlePointerUp() {
    if (draggingId !== null) {
      const id = draggingId;
      const targetEl = itemRefs.get(id);

      if (targetEl) {
        animatingBackId = id;
        lastActiveState = wasDragActive;
        animBackRect = { ...dragRect };
        animBackStartX = dragPosition.current;
        animBackEndX = targetEl.getBoundingClientRect().left;
        setTimeout(() => {
          animatingBackId = null;
        }, 150);
      }
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

  <div class="wintabs-container" bind:this={wintabsContainer}>
    {#each taskbar as id, i (id)}
      {@const w = wmApi.getWindows().get(id)!.data}
      <div
        animate:flip={draggingId === id ? { duration: 0 } : { duration: 200 }}
        class="wintab-wrapper"
        class:is-placeholder={draggingId === id || animatingBackId === id}
        {@attach registerRef(id)}
      >
        <button
          class="wintab {wmApi.isWindowFocused(id) && !w.isMinimized
            ? 'focused'
            : ''}"
          onpointerup={(e) => {
            if (e.button !== 0) return;
            if (!justDragged) {
              wasDragActive = true;
              wmApi.focusWindow(Number(id));
            }
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
      style:left="{dragPosition.current}px"
      style:top="{dragRect.top}px"
      in:grab
    >
      <button class="wintab active" class:focused={wasDragActive}
        >{w.title}</button
      >
    </div>
  {/if}

  {#if animatingBackId !== null}
    {@const w = wmApi.getWindows().get(animatingBackId)!.data}
    {@const wasActive = lastActiveState}
    <div
      class="wintab-wrapper dragging animating-back"
      style:width="{animBackRect.width}px"
      style:height="{animBackRect.height}px"
      style:top="{animBackRect.top}px"
      style:left="{animBackEndX}px"
      style:--start-x="{animBackStartX}px"
      style:--end-x="{animBackEndX}px"
    >
      <button class="wintab active" class:focused={wasActive}>{w.title}</button>
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
    transform: scale(1.05) translateY(-2px);
  }

  .wintab-wrapper.animating-back {
    animation: slide-back 0.16s cubic-bezier(0.2, 0, 0, 1);
    animation-iteration-count: 1;
  }

  @keyframes slide-back {
    from {
      left: var(--start-x);
      transform: scale(1.05) translateY(-2px);
      filter: brightness(1.1);
    }
    to {
      left: var(--end-x);
      transform: none;
      filter: none;
    }
  }

  .wintab {
    width: 100%;
  }
</style>
