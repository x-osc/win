<script lang="ts">
  import { on } from "svelte/events";
  import { ResizeDirection } from "./types";

  let { id, title, x, y, width, height, z, focused, windowApi } = $props();

  function handleTitlebarDrag(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    windowApi.focusWindow(id);

    let offsetX = event.clientX - x;
    let offsetY = event.clientY - y;

    function onMouseMove(event: MouseEvent) {
      let posX = event.clientX - offsetX;
      let poxY = event.clientY - offsetY;
      windowApi.moveWindow(id, posX, poxY);
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
    windowApi.focusWindow(id);

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startX = x;
    const startY = y;
    const startWidth = width;
    const startHeight = height;

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
        newHeight = startHeight + (moveEvent.clientY - startMouseY);
      }
      if (
        direction === ResizeDirection.E ||
        direction === ResizeDirection.SE ||
        direction === ResizeDirection.NE
      ) {
        newWidth = startWidth + (moveEvent.clientX - startMouseX);
      }
      if (
        direction === ResizeDirection.N ||
        direction === ResizeDirection.NE ||
        direction === ResizeDirection.NW
      ) {
        newHeight = startHeight - (moveEvent.clientY - startMouseY);
        newY = startY + (moveEvent.clientY - startMouseY);
      }
      if (
        direction === ResizeDirection.W ||
        direction === ResizeDirection.NW ||
        direction === ResizeDirection.SW
      ) {
        newWidth = startWidth - (moveEvent.clientX - startMouseX);
        newX = startX + (moveEvent.clientX - startMouseX);
      }

      windowApi.setWindowSize(id, newWidth, newHeight);
      windowApi.moveWindow(id, newX, newY);
    }

    function onMouseUp() {
      removeMouseMove();
      removeMouseUp();
    }

    let removeMouseMove = on(window, "mousemove", onMouseMove);
    let removeMouseUp = on(window, "mouseup", onMouseUp);
  }

  function handleClose() {
    windowApi.closeWindow(id);
  }

  windowApi.focusWindow(id);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="window {focused ? 'focused' : ''}"
  style="left: {x}px; top: {y}px; width: {width}px; height: {height}px; z-index: {z}"
>
  <div class="titlebar" onmousedown={handleTitlebarDrag}>
    <span class="title">{title}</span>
    <div class="window-controls">
      <button class="minimize-button">_</button>
      <button class="maximize-button">[]</button>
      <button class="close-button" onclick={handleClose}>X</button>
    </div>
  </div>
  <div class="content">asdjflks;bkfd;lgklfj</div>

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
