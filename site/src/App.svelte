<script lang="ts">
  import { windowId, zIndex } from "./lib/state.svelte";
  import Taskbar from "./lib/Taskbar.svelte";
  import Window from "./lib/Window.svelte";

  // stores a mapping of id to window data
  let windows: any = $state({});
  // contains the order of taskbar buttons by window id
  let taskbar: Array<number> = $state([]);

  function createWindow() {
    windowId.value++;

    const newWindow = {
      title: `${windowId.value}`,
      x: 100,
      y: 100,
      width: 300,
      height: 200,
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

  function setWindowSize(id: number, width: number, height: number) {
    if (windows[id]) {
      windows[id].width = width;
      windows[id].height = height;
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

  function closeWindow(id: number) {
    if (windows[id]) {
      taskbar = taskbar.filter((taskId) => taskId !== id);
      delete windows[id];
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
    setWindowSize,
    focusWindow,
    closeWindow,
    getWindows,
  };
</script>

<div id="root">
  <div id="desktop">
    {#each Object.entries(windows) as [id, win] (id)}
      {@const w = win as any}
      <Window
        id={Number(id)}
        title={w.title}
        x={w.x}
        y={w.y}
        width={w.width}
        height={w.height}
        z={w.z}
        {windowApi}
      />
    {/each}

    <button onclick={createWindow}>make window</button>
  </div>
  <Taskbar {taskbar} {windowApi} />
</div>

<style>
  #root {
    height: 100vh;
  }

  #desktop {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: teal;
    overflow: hidden;
  }
</style>
