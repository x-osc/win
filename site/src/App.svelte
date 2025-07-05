<script lang="ts">
  import { windowId, zIndex } from "./lib/state.svelte";
  import Window from "./lib/Window.svelte";

  let windows: any = $state({});

  function createWindow() {
    const newWindow = {
      title: `blblblblb`,
      x: 100,
      y: 100,
      z: 1,
    };
    windows[windowId.value++] = newWindow;
    console.log(windows);
  }

  function moveWindow(id: number, x: number, y: number) {
    if (windows[id]) {
      windows[id].x = x;
      windows[id].y = y;
    } else {
      console.warn(`Window with id ${id} does not exist.`);
    }
  }

  function focusWindow(id: number) {
    if (windows[id]) {
      windows[id].z = zIndex.value++;
    } else {
      console.warn(`Window with id ${id} does not exist.`);
    }
  }

  let windowApi = {
    createWindow,
    moveWindow,
    focusWindow,
  };
</script>

<div id="desktop">
  {#each Object.entries(windows) as [id, win] (id)}
    {@const w = win as any}
    <Window {id} title={w.title} x={w.x} y={w.y} z={w.z} {windowApi} />
  {/each}

  <button onclick={createWindow}>make window</button>
</div>

<style>
  #desktop {
    width: 100%;
    height: 100vh;
    background-color: teal;
  }
</style>
