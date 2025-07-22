import { wmApi, type WindowApi } from "./wm.svelte";

export interface AppApi {
  getId(): number;

  window: {
    createWindow(): number;
    createWindowAsync(): Promise<WindowApi>;
  };
}

export function getAppApi(instId: number): AppApi {
  const api: AppApi = {
    getId: () => instId,

    window: {
      createWindow: () => wmApi.createWindow(),
      createWindowAsync: () => wmApi.createWindowAsync(),
    },
  };

  return api;
}
