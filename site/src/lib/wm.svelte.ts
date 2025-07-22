import { windowId, zIndex } from "./state.svelte";

export type Win = {
  data: WinData;
  api: WindowApi | null;
};

export type WinData = {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minWidth: number;
  minHeight: number;
};

export interface WindowApi {
  getId(): number;
  getData(): WinData;
  move(x: number, y: number): void;
  resize(width: number, height: number): void;
  focus(): void;
  close(): void;
  getWindowElement(): HTMLElement | null;
  getBody(): HTMLElement | null;
  isOpen(): boolean;
}

export function winDataBuilder() {
  const data: WinData = {
    title: "",
    x: 100,
    y: 100,
    width: 300,
    height: 200,
    z: 1,
    minHeight: 50,
    minWidth: 120,
  };

  return {
    withTitle(title: string) {
      data.title = title;
      return this;
    },
    withPosition(x: number, y: number) {
      data.x = x;
      data.y = y;
      return this;
    },
    withSize(width: number, height: number) {
      data.width = width;
      data.height = height;
      return this;
    },
    withMinSize(width: number, height: number) {
      data.minWidth = width;
      data.minHeight = height;
      return this;
    },
    build(): WinData {
      return data;
    },
  };
}

let windowApiResolvers: Record<number, (api: WindowApi) => void> = {};
// stores a mapping of id to window data
let windows: Record<number, Win> = $state({});
// contains the order of taskbar buttons by window id
let taskbar: number[] = $state([]);
// history of all focused windows
let focusHistory: number[] = $state([]);

export let wmApi = {
  createWindow,
  createWindowAsync,
  moveWindow,
  setWindowSize,
  focusWindow,
  closeWindow,
  getWindows,
  registerWindowApi,
  getWindowApi,
};

async function createWindowAsync(data: WinData): Promise<WindowApi> {
  let id = createWindow(data);

  return new Promise((resolve) => {
    windowApiResolvers[id] = resolve;
  });
}

function createWindow(data: WinData): number {
  let id = windowId.value++;

  const newWindow: Win = {
    data,
    api: null,
  };
  windows[id] = newWindow;

  taskbar.push(id);
  // dont focus to begin with
  focusHistory.unshift(id);

  return id;
}

function moveWindow(id: number, x: number, y: number) {
  const win = windows[id].data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.x = x;
  win.y = y;
}

// window's responsibility to ensure minwidth and minheight
function setWindowSize(id: number, width: number, height: number) {
  const win = windows[id].data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.width = Math.max(width, 0);
  win.height = Math.max(height, 0);
}

function focusWindow(id: number) {
  const win = windows[id].data;
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
  if (lastFocused !== null && lastFocused !== undefined) {
    focusWindow(lastFocused);
  }
}

function registerWindowApi(id: number, api: WindowApi) {
  const win = windows[id];
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.api = api;

  if (windowApiResolvers[id]) {
    windowApiResolvers[id](api);
    delete windowApiResolvers[id];
  }
}

function getWindowApi(id: number): WindowApi | null {
  const win = windows[id];
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return null;
  }

  if (!win.api) {
    console.warn(`Window API for id ${id} is not registered.`);
    return null;
  }

  return win.api;
}

function getWindows(): Record<number, Win> {
  return windows;
}

export function getTaskbar(): number[] {
  return taskbar;
}

export function getFocusHistory(): number[] {
  return focusHistory;
}
