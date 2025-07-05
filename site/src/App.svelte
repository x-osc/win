<script lang="ts">
  import { windowId, zIndex } from "./lib/state.svelte";
  import Taskbar from "./lib/Taskbar.svelte";
  import Window from "./lib/Window.svelte";

  // stores a mapping of id to window data
  let windows: any = $state({});
  // contains the order of taskbar buttons by window id
  let taskbar: any = $state([]);

  function createWindow() {
    windowId.value++;

    const newWindow = {
      title: `${windowId.value}`,
      x: 100,
      y: 100,
      z: 1,
    };
    windows[windowId.value] = newWindow;

    taskbar.push(windowId.value);
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

  function getWindows() {
    return windows;
  }

  let windowApi = {
    createWindow,
    moveWindow,
    focusWindow,
    getWindows,
  };
</script>

<div id="root">
  <div id="desktop">
    {#each Object.entries(windows) as [id, win] (id)}
      {@const w = win as any}
      <Window {id} title={w.title} x={w.x} y={w.y} z={w.z} {windowApi} />
    {/each}

    <button onclick={createWindow}>make window</button>
  </div>
  <Taskbar {taskbar} {windowApi} />
</div>

<style>
  #root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  #desktop {
    flex: 1;
    position: relative;
    width: 100%;
    background-color: teal;
    overflow: hidden;
  }
</style>
