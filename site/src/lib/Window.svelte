<script lang="ts">
  import { zIndex } from "./state.svelte";

  let { title, x = 100, y = 100 } = $props();

  let posX = $state(x);
  let poxY = $state(y);
  let z = $state(1);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function sendToTop() {
    z = zIndex.value++;
  }

  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    offsetX = event.clientX - posX;
    offsetY = event.clientY - poxY;
    sendToTop();
  }

  function handleMouseMove(event: MouseEvent) {
    if (isDragging) {
      posX = event.clientX - offsetX;
      poxY = event.clientY - offsetY;
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  sendToTop();
</script>

<svelte:window
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="window" style="left: {posX}px; top: {poxY}px; z-index: {z}">
  <div class="titlebar" onmousedown={handleMouseDown}>
    <span class="title">{title}</span>
    <div class="window-controls">
      <button class="minimize-button">_</button>
      <button class="maximize-button">[]</button>
      <button class="close-button">X</button>
    </div>
  </div>
  <div class="content">asdjflks;bkfd;lgklfj</div>
</div>

<style>
  .window {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 100px;
    left: 100px;
    width: 300px;
    height: 200px;
    background: #c0c0c0;
    border: 2px solid black;
    box-shadow: 4px 4px black;
  }

  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: navy;
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
</style>
