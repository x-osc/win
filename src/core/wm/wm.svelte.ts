import type { OffFunction, OnceFunction, OnFunction } from "@core/callbacks";
import { windowId, zIndex } from "@core/state.svelte";
import { SvelteMap } from "svelte/reactivity";

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
  isMinimized: boolean;
  // TODO: make non-data (runtime only) stuff part of a different type
  owner: number | null;
};

export interface WindowApi {
  getId(): number;
  getData(): WinData;
  setTitle(title: string): void;
  move(x: number, y: number): void;
  resize(width: number, height: number): void;
  focus(): void;
  isFocused(): boolean;
  close(): void;
  getWindowElement(): HTMLElement;
  getBody(): HTMLElement;
  isOpen(): boolean;

  on: OnFunction<WindowEvents>;
  once: OnceFunction<WindowEvents>;
  off: OffFunction<WindowEvents>;
}

export type WindowEvents = {
  focus(): void;
  move(x: number, y: number): void;
  resize(width: number, height: number): void;
  close(): void;
};

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
    isMinimized: false,
    owner: null,
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

let windowApiResolvers: Map<number, (api: WindowApi) => void> = new Map();
// stores a mapping of id to window data
let windows: Map<number, Win> = new SvelteMap();
// contains the order of taskbar buttons by window id
let taskbar: number[] = $state([]);
// history of all focused windows
let focusHistory: number[] = $state([]);

export const wmApi = {
  createWindow,
  createWindowAsync,
  setWindowTitle,
  moveWindow,
  setWindowSize,
  focusWindow,
  minimizeWindow,
  closeWindow,
  getWindows,
  getFocusHistory,
  getTaskbar,
  registerWindowApi,
  getWindowApi,
} as const;

export type WmApi = typeof wmApi;

async function createWindowAsync(data: WinData): Promise<WindowApi> {
  let id = createWindow(data);

  return new Promise((resolve) => {
    windowApiResolvers.set(id, resolve);
  });
}

function createWindow(data: WinData): number {
  let id = windowId.value++;

  // TODO: why does this work im scared
  const newWindow: Win = $state({
    data,
    api: null,
  });
  windows.set(id, newWindow);

  taskbar.push(id);
  // dont focus to begin with
  focusHistory.unshift(id);

  return id;
}

function setWindowTitle(id: number, title: string) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.title = title;
}

function moveWindow(id: number, x: number, y: number) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.x = x;
  win.y = y;
}

// window's responsibility to ensure minwidth and minheight
function setWindowSize(id: number, width: number, height: number) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.width = Math.max(width, 0);
  win.height = Math.max(height, 0);
}

function focusWindow(id: number) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.isMinimized = false;
  win.z = zIndex.value++;
  focusHistory = focusHistory.filter((winId) => winId !== id);
  focusHistory.push(id);
}

function minimizeWindow(id: number) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.isMinimized = true;
}

function closeWindow(id: number) {
  const win = windows.get(id)?.data;
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  taskbar = taskbar.filter((taskId) => taskId !== id);
  focusHistory = focusHistory.filter((winId) => winId !== id);
  windows.delete(id);

  let lastFocused = focusHistory[focusHistory.length - 1];
  if (lastFocused !== null && lastFocused !== undefined) {
    focusWindow(lastFocused);
  }
}

function registerWindowApi(id: number, api: WindowApi) {
  const win = windows.get(id);
  if (!win) {
    console.warn(`Window with id ${id} does not exist.`);
    return;
  }

  win.api = api;

  let resolver = windowApiResolvers.get(id);
  if (resolver) {
    resolver(api);
    windowApiResolvers.delete(id);
  }
}

function getWindowApi(id: number): WindowApi | null {
  const win = windows.get(id);
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

function getWindows(): Map<number, Win> {
  return windows;
}

function getTaskbar(): number[] {
  return taskbar;
}

function getFocusHistory(): number[] {
  return focusHistory;
}
