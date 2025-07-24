import { wmApi, type WinData, type WindowApi } from "../wm/wm.svelte";

export interface AppApi {
  getId(): number;

  window: {
    createWindow(data: WinData): number;
    createWindowAsync(data: WinData): Promise<WindowApi>;
  };
}

export function getAppApi(instId: number): AppApi {
  const api: AppApi = {
    getId: () => instId,

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
  };

  return api;
}
