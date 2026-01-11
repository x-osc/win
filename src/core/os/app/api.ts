import { launchCmd } from "@os/cmd/cmdregistry";
import type { CmdApi } from "@os/cmd/command";
import { fsApi } from "@os/fs/filesystem";
import { wmApi, type WinData, type WindowApi } from "@os/wm/wm.svelte";
import { showDialog, type DialogArgs } from "../../apps/dialog/dialog";
import type { AppArgs, AppResult } from "./app";
import { launchApp } from "./appregistry";
import { closeApp, type ProcessApi } from "./processes";

export interface AppApi {
  getId(): number;
  quit(result?: AppResult): void;

  launchApp(id: string, args?: AppArgs): ProcessApi | null;
  launchCmd(id: string, cmdApi: CmdApi): ProcessApi | null;
  showDialog(args: DialogArgs): Promise<number | null>;

  window: {
    createWindow(data: WinData): Promise<WindowApi>;
  };

  fs: typeof fsApi;
}

export function getAppApi(instId: number): AppApi {
  const api: AppApi = {
    getId: () => instId,
    quit: (result) => closeApp(instId, result),

    launchApp: (id, args) => launchApp(id, args, { owner: instId }),
    launchCmd: (id, cmdApi) => launchCmd(id, cmdApi, { owner: instId }),
    showDialog: (args) => showDialog(args, instId),

    window: {
      createWindow: (data: WinData) => {
        data.owner = instId;
        return wmApi.createWindow(data);
      },
    },

    fs: fsApi,
  };

  return api;
}
