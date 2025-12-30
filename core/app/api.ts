import { fsApi } from "../fs/filesystem";
import { wmApi, type WinData, type WindowApi } from "../wm/wm.svelte";
import { closeApp } from "./apps.svelte";

export interface AppApi {
  getId(): number;
  quit(): void;

  window: {
    createWindow(data: WinData): number;
    createWindowAsync(data: WinData): Promise<WindowApi>;
  };

  fs: typeof fsApi;
}

export function getAppApi(instId: number): AppApi {
  const api: AppApi = {
    getId: () => instId,
    quit: () => closeApp(instId),

    window: {
      createWindow: (data: WinData) => {
        data.owner = instId;
        return wmApi.createWindow(data);
      },
      createWindowAsync: (data: WinData) => {
        data.owner = instId;
        return wmApi.createWindowAsync(data);
      },
    },

    fs: fsApi,
  };

  return api;
}
