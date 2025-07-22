<script lang="ts">
  import { onMount } from "svelte";
  import { on } from "svelte/events";
  import { ResizeDirection } from "./types";
  import "./win.css";
  import type { WinData, WindowApi } from "./wm.svelte";

  let {
    id,
    windowData,
    focused,
    wmApi,
  }: { id: number; windowData: WinData; focused: boolean; wmApi: any } =
    $props();

  let bodyElement: HTMLElement | null = null;
  let windowElement: HTMLElement | null = null;

  const windowApi: WindowApi = {
    getId: () => id,
    getData: () => windowData,
    focus: () => wmApi.focusWindow(id),
    move: (x: number, y: number) => wmApi.moveWindow(id, x, y),
    resize: (width: number, height: number) =>
      wmApi.setWindowSize(id, width, height),
    close: () => wmApi.closeWindow(id),
    getWindowElement: () => windowElement,
    getBody: () => bodyElement,
    isOpen: () => id in wmApi.getWindows(),
  };

  onMount(() => {
    wmApi.registerWindowApi(id, windowApi);
    wmApi.focusWindow(id);
  });

  function handleTitlebarDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest(".nodrag")) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    wmApi.focusWindow(id);

    let offsetX = event.clientX - windowData.x;
    let offsetY = event.clientY - windowData.y;

    function onMouseMove(event: MouseEvent) {
      let posX = event.clientX - offsetX;
      let poxY = event.clientY - offsetY;
      wmApi.moveWindow(id, posX, poxY);
    }

    function onMouseUp() {
      removeMouseMove();
      removeMouseUp();
    }

    let removeMouseMove = on(window, "mousemove", onMouseMove);
    let removeMouseUp = on(window, "mouseup", onMouseUp);
  }

  function handleResize(event: MouseEvent, direction: ResizeDirection) {
    event.stopPropagation();
    event.preventDefault();
    wmApi.focusWindow(id);

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

  function handleMinimize(e: MouseEvent) {}

  function handleMaximize(e: MouseEvent) {}

  function handleClose(e: MouseEvent) {
    wmApi.closeWindow(id);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="window {focused ? 'focused' : ''}"
  style="left: {windowData.x}px; top: {windowData.y}px; width: {windowData.width}px; height: {windowData.height}px; z-index: {windowData.z}"
  bind:this={windowElement}
>
  <div class="titlebar" onmousedown={handleTitlebarDrag}>
    <span class="title">{windowData.title}</span>
    <div class="window-controls">
      <button class="minimize-button win-button nodrag" onclick={handleMinimize}
        >_</button
      >
      <button class="maximize-button win-button nodrag" onclick={handleMaximize}
        >[]</button
      >
      <button class="close-button win-button nodrag" onclick={handleClose}
        >X</button
      >
    </div>
  </div>
  <div class="content" bind:this={bodyElement}></div>

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
    background: #c0c0c0;
    border: 2px solid black;
    box-shadow: 4px 4px black;
  }

  .window.focused .titlebar {
    background: #000080;
  }

  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #404080;
    color: white;
    height: 24px;
    line-height: 24px;
    padding-left: 4px;
    padding-right: 4px;
    cursor: move;
    flex-shrink: 0;
  }

  .content {
    padding: 5px;
    background: white;
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
