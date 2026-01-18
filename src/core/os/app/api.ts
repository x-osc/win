import type {
  CallbackManager,
  OffFunction,
  OnceFunction,
  OnFunction,
} from "@lib/core/utils/callbacks";
import { launchCmd } from "@os/cmd/cmdregistry";
import type { CmdApi } from "@os/cmd/command";
import { fsApi } from "@os/fs/filesystem";
import { wmApi, type WinData, type WindowApi } from "@os/wm/wm.svelte";
import { showDialog, type DialogArgs } from "../../apps/dialog/dialog";
import type { AppArgs, AppResult } from "./app";
import { launchApp } from "./appregistry";
import { closeApp, sendIpc, type IpcData, type ProcessApi } from "./processes";

export type AppEvents = {
  ipc(data: IpcData, from: number | null): void;
};

export interface AppApi {
  getId(): number;
  quit(result?: AppResult): void;

  sendIpc(targetProcess: number, data: IpcData): boolean;

  launchApp(id: string, args?: AppArgs): ProcessApi | null;
  launchCmd(id: string, cmdApi: CmdApi): ProcessApi | null;
  showDialog(args: DialogArgs): Promise<number>;

  window: {
    createWindow(data: WinData): Promise<WindowApi>;
  };

  fs: typeof fsApi;

  on: OnFunction<AppEvents>;
  once: OnceFunction<AppEvents>;
  off: OffFunction<AppEvents>;
}

export function getAppApi(
  instId: number,
  callbacks: CallbackManager<AppEvents>,
): AppApi {
  const api: AppApi = {
    getId: () => instId,
    quit: (result) => closeApp(instId, result),

    sendIpc: (targetProcess, data) => sendIpc(targetProcess, data, instId),

    launchApp: (id, args) => launchApp(id, args, { owner: instId }),
    launchCmd: (id, cmdApi) => launchCmd(id, cmdApi, { owner: instId }),
    showDialog: (args) => showDialog(api, args),

    window: {
      createWindow: (data: WinData) => {
        data.owner = instId;
        return wmApi.createWindow(data);
      },
    },

    fs: fsApi,

    on: callbacks.on.bind(callbacks),
    once: callbacks.once.bind(callbacks),
    off: callbacks.off.bind(callbacks),
  };

  return api;
}
