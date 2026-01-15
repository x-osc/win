<script lang="ts">
  import { CallbackManager } from "@lib/core/callbacks";
  import { grabWindow, releaseWindow, updateGrab } from "@os/physics/windows";
  import "@os/win.css";
  import { onMount } from "svelte";
  import { on } from "svelte/events";
  import { ResizeDirection } from "./types";
  import type { WinData, WindowApi, WindowEvents, WmApi } from "./wm.svelte";

  let {
    id,
    windowData,
    focused,
    callbacks,
    wmApi,
  }: {
    id: number;
    windowData: WinData;
    focused: boolean;
    callbacks: CallbackManager<WindowEvents>;
    wmApi: WmApi;
  } = $props();

  let bodyElement: HTMLElement;
  let windowElement: HTMLElement;

  // TODO: callbacks in svelte class feels bad is there a way
  // to make it managed in wm?
  const windowApi: WindowApi = {
    getId: () => id,
    getData: () => windowData,
    setTitle: (title: string) => wmApi.setWindowTitle(id, title),
    focus: () => focus(),
    isFocused: () =>
      Array.from(wmApi.getWindows().keys()).includes(id) &&
      wmApi.isWindowFocused(id),
    move: (x: number, y: number) => wmApi.moveWindow(id, x, y),
    resize: (width: number, height: number) =>
      wmApi.setWindowSize(id, width, height),
    close: () => wmApi.closeWindow(id),
    getWindowElement: () => windowElement,
    getBody: () => bodyElement,
    isOpen: () => Array.from(wmApi.getWindows().keys()).includes(id),

    // svelte-ignore state_referenced_locally
    on: callbacks.on.bind(callbacks),
    // svelte-ignore state_referenced_locally
    once: callbacks.once.bind(callbacks),
    // svelte-ignore state_referenced_locally
    off: callbacks.off.bind(callbacks),
  };

  onMount(() => {
    wmApi.registerWindowApi(id, windowApi);
    focus();
  });

  function focus() {
    wmApi.focusWindow(id);
  }

  function handleTitlebarDrag(event: MouseEvent | TouchEvent) {
    if ((event.target as HTMLElement).closest(".nodrag")) return;

    event.stopPropagation();
    event.preventDefault();
    focus();

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    let offsetX = clientX - windowData.x;
    let offsetY = clientY - windowData.y;

    function onMouseMove(event: MouseEvent | TouchEvent) {
      const clientX =
        event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY =
        event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

      let posX = clientX - offsetX;
      let posY = clientY - offsetY;

      callbacks.emit("move", posX, posY);
      wmApi.moveWindow(id, posX, posY);
    }

    function onMouseUp() {
      removeMouseMove();
      removeMouseUp();
      removeTouchMove();
      removeTouchEnd();
    }

    let removeMouseMove = on(window, "mousemove", onMouseMove);
    let removeTouchMove = on(window, "touchmove", onMouseMove, {
      passive: false,
    });

    let removeMouseUp = on(window, "mouseup", onMouseUp);
    let removeTouchEnd = on(window, "touchend", onMouseUp);
  }

  function handlePhysicsTitlebarDrag(event: MouseEvent | TouchEvent) {
    if ((event.target as HTMLElement).closest(".nodrag")) return;

    event.stopPropagation();
    event.preventDefault();
    focus();

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    grabWindow(id, clientX, clientY);

    function onMouseMove(event: MouseEvent | TouchEvent) {
      const clientX =
        event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY =
        event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

      updateGrab(clientX, clientY);
    }

    function onMouseUp() {
      releaseWindow();

      removeMouseMove();
      removeMouseUp();
      removeTouchMove();
      removeTouchEnd();
    }

    let removeMouseMove = on(window, "mousemove", onMouseMove);
    let removeTouchMove = on(window, "touchmove", onMouseMove, {
      passive: false,
    });

    let removeMouseUp = on(window, "mouseup", onMouseUp);
    let removeTouchEnd = on(window, "touchend", onMouseUp);
  }

  function handleResize(event: MouseEvent, direction: ResizeDirection) {
    event.stopPropagation();
    event.preventDefault();
    focus();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startX = windowData.x;
    const startY = windowData.y;
    const startWidth = windowData.width;
    const startHeight = windowData.height;

    function onMouseMove(moveEvent: MouseEvent) {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startX;
      let newY = startY;

      if (
        direction === ResizeDirection.S ||
        direction === ResizeDirection.SE ||
        direction === ResizeDirection.SW
      ) {
        newHeight = Math.max(
          startHeight + (moveEvent.clientY - startMouseY),
          windowData.minHeight,
        );
      }
      if (
        direction === ResizeDirection.E ||
        direction === ResizeDirection.SE ||
        direction === ResizeDirection.NE
      ) {
        newWidth = Math.max(
          startWidth + (moveEvent.clientX - startMouseX),
          windowData.minWidth,
        );
      }
      if (
        direction === ResizeDirection.N ||
        direction === ResizeDirection.NE ||
        direction === ResizeDirection.NW
      ) {
        newHeight = Math.max(
          startHeight - (moveEvent.clientY - startMouseY),
          windowData.minHeight,
        );
        newY = startY + (startHeight - newHeight);
      }
      if (
        direction === ResizeDirection.W ||
        direction === ResizeDirection.NW ||
        direction === ResizeDirection.SW
      ) {
        newWidth = Math.max(
          startWidth - (moveEvent.clientX - startMouseX),
          windowData.minWidth,
        );
        newX = startX + (startWidth - newWidth);
      }

      callbacks.emit("resize", newWidth, newHeight);
      wmApi.setWindowSize(id, newWidth, newHeight);
      wmApi.moveWindow(id, newX, newY);
    }

    function onMouseUp() {
      removeMouseMove();
      removeMouseUp();
    }

    let removeMouseMove = on(window, "mousemove", onMouseMove);
    let removeMouseUp = on(window, "mouseup", onMouseUp);
  }

  function handleMinimize(e: MouseEvent) {
    wmApi.minimizeWindow(id);
  }

  function handleMaximize(e: MouseEvent) {}

  function handleClose(e: MouseEvent) {
    callbacks.emit("close");
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={["window", { focused }, { minimized: windowData.isMinimized }]}
  style="
    left: {windowData.x}px;
    top: {windowData.y}px;
    width: {windowData.width}px; 
    height: {windowData.height}px; 
    z-index: {windowData.z};
    transform: rotate({windowData.rotation}rad);
  "
  bind:this={windowElement}
  onmousedown={focus}
>
  <div
    class="titlebar"
    onmousedown={(e) =>
      windowData.physicsEnabled
        ? handlePhysicsTitlebarDrag(e)
        : handleTitlebarDrag(e)}
    ontouchstart={(e) =>
      windowData.physicsEnabled
        ? handlePhysicsTitlebarDrag(e)
        : handleTitlebarDrag(e)}
  >
    <span class="title">{windowData.title}</span>
    <div class="controls">
      <button class="minimize-button nodrag" onclick={handleMinimize}>_</button>
      <button class="maximize-button nodrag" onclick={handleMaximize}>[]</button
      >
      <button class="close-button nodrag" onclick={handleClose}>X</button>
    </div>
  </div>

  <div class="content" bind:this={bodyElement}>
    {#if windowData.componentData}
      <windowData.componentData.component
        winApi={windowApi}
        api={windowData.componentData.api}
        args={windowData.componentData.args}
      />
    {/if}
  </div>

  <div
    class="resize-handle resize-n"
    onmousedown={(e) => handleResize(e, ResizeDirection.N)}
  ></div>
  <div
    class="resize-handle resize-e"
    onmousedown={(e) => handleResize(e, ResizeDirection.E)}
  ></div>
  <div
    class="resize-handle resize-s"
    onmousedown={(e) => handleResize(e, ResizeDirection.S)}
  ></div>
  <div
    class="resize-handle resize-w"
    onmousedown={(e) => handleResize(e, ResizeDirection.W)}
  ></div>

  <div
    class="resize-handle resize-nw"
    onmousedown={(e) => handleResize(e, ResizeDirection.NW)}
  ></div>
  <div
    class="resize-handle resize-ne"
    onmousedown={(e) => handleResize(e, ResizeDirection.NE)}
  ></div>
  <div
    class="resize-handle resize-se"
    onmousedown={(e) => handleResize(e, ResizeDirection.SE)}
  ></div>
  <div
    class="resize-handle resize-sw"
    onmousedown={(e) => handleResize(e, ResizeDirection.SW)}
  ></div>
</div>

<style>
  .window {
    position: absolute;
    display: flex;
    flex-direction: column;
  }

  .window.minimized {
    display: none;
  }

  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .titlebar .controls {
    display: flex;
  }

  .content {
    height: 100%;
    overflow: auto;
    flex: 1;
  }

  .resize-handle {
    position: absolute;
    background: transparent;
  }

  .resize-handle.resize-nw {
    left: -6px;
    top: -6px;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
  }
  .resize-handle.resize-n {
    left: 0px;
    top: -6px;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
  }
  .resize-handle.resize-ne {
    right: -6px;
    top: -6px;
    width: 10px;
    height: 10px;
    cursor: nesw-resize;
  }
  .resize-handle.resize-e {
    right: -6px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
  }
  .resize-handle.resize-se {
    right: -6px;
    bottom: -6px;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
  }
  .resize-handle.resize-s {
    left: 0;
    bottom: -6px;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
  }
  .resize-handle.resize-sw {
    left: -6px;
    bottom: -6px;
    width: 10px;
    height: 10px;
    cursor: nesw-resize;
  }
  .resize-handle.resize-w {
    left: -6px;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
  }
</style>
