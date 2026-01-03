import { launchCmd } from "@core/cmd/cmdregistry";
import type { CmdApi } from "@core/cmd/command";
import { fsApi } from "@core/fs/filesystem";
import { wmApi, type WinData, type WindowApi } from "@core/wm/wm.svelte";
import { launchApp } from "./appregistry";
import { closeApp, type ProcessApi } from "./processes";

export interface AppApi {
  getId(): number;
  quit(): void;

  launchApp(id: string, args?: Record<string, any>): ProcessApi | null;
  launchCmd(id: string, cmdApi: CmdApi): ProcessApi | null;

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

    launchApp: (id) => launchApp(id, { owner: instId }),
    launchCmd: (id, cmdApi) => launchCmd(id, cmdApi, { owner: instId }),

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
