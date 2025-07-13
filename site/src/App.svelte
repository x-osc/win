<script lang="ts">
  import { windowId, zIndex } from "./lib/state.svelte";
  import Taskbar from "./lib/Taskbar.svelte";
  import Window from "./lib/Window.svelte";

  type Win = {
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    z: number;
    minWidth: number;
    minHeight: number;
  };

  // stores a mapping of id to window data
  let windows: Record<number, Win> = $state({});
  // contains the order of taskbar buttons by window id
  let taskbar: number[] = $state([]);
  // history of all focused windows
  let focusHistory: number[] = $state([]);

  function createWindow() {
    windowId.value++;

    const newWindow: Win = {
      title: `${windowId.value}`,
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      z: 1,
      minHeight: 50,
      minWidth: 120,
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

  // window's responsibility to ensure minwidth and minheight
  function setWindowSize(id: number, width: number, height: number) {
    const win = windows[id];
    if (!win) {
      console.warn(`Window with id ${id} does not exist.`);
      return;
    }

    win.width = Math.max(width, 0);
    win.height = Math.max(height, 0);
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
      <Window
        id={Number(id)}
        windowData={win}
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
