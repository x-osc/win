<script lang="ts">
  import { windowId, zIndex } from "./lib/state.svelte";
  import Taskbar from "./lib/Taskbar.svelte";
  import Window from "./lib/Window.svelte";

  // stores a mapping of id to window data
  let windows: any = $state({});
  // contains the order of taskbar buttons by window id
  let taskbar: number[] = $state([]);
  // history of all focused windows
  let focusHistory: number[] = $state([]);

  function createWindow() {
    windowId.value++;

    const newWindow = {
      title: `${windowId.value}`,
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      z: 1,
      min_height: 50,
      min_width: 120,
    };
    windows[windowId.value] = newWindow;

    taskbar.push(windowId.value);
    // dont focus to begin with
    focusHistory.unshift(windowId.value);
  }

  function moveWindow(id: number, x: number, y: number) {
    const win = windows[id];
    if (!win) {
      console.warn(`Window with id ${id} does not exist.`);
      return;
    }

    win.x = x;
    win.y = y;
  }

  function setWindowSize(id: number, width: number, height: number) {
    const win = windows[id];
    if (!win) {
      console.warn(`Window with id ${id} does not exist.`);
      return;
    }

    win.width = Math.max(width, win.min_width);
    win.height = Math.max(height, win.min_height);
  }

  function focusWindow(id: number) {
    const win = windows[id];
    if (!win) {
      console.warn(`Window with id ${id} does not exist.`);
      return;
    }

    win.z = zIndex.value++;
    focusHistory = focusHistory.filter((winId) => winId !== id);
    focusHistory.push(id);
  }

  function closeWindow(id: number) {
    const win = windows[id];
    if (!win) {
      console.warn(`Window with id ${id} does not exist.`);
      return;
    }

    taskbar = taskbar.filter((taskId) => taskId !== id);
    focusHistory = focusHistory.filter((winId) => winId !== id);
    delete windows[id];

    let lastFocused = focusHistory[focusHistory.length - 1];
    if (lastFocused) {
      focusWindow(lastFocused);
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
        focused={Number(id) === focusHistory[focusHistory.length - 1]}
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
