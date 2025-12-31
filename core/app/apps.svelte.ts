import { CmdApi, CmdManifest } from "../cmd/command";
import { instanceId } from "../state.svelte";
import { wmApi } from "../wm/wm.svelte";
import { getAppApi } from "./api";
import type { AppManifest } from "./app";

let processes: Map<number, Process> = new Map();

export interface Process {
  instId: number;
}

export function launchApp(id: string): number | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(app);
}

export function launchCmd(cmd: string, cmdApi: CmdApi): number | null {
  const command = cmdRegistry.get(cmd);
  if (command === undefined) {
    console.error(`command ${cmd} does not exist`);
    console.log(cmdRegistry);
    return null;
  }
  return launchCmdFromManifest(command, cmdApi);
}

export function launchAppFromManifest(manifest: AppManifest): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  manifest.launch(appApi).catch(console.error);

  let process: Process = {
    instId,
  };
  processes.set(instId, process);

  return instId;
}

export function launchCmdFromManifest(
  manifest: CmdManifest,
  cmdApi: CmdApi
): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  manifest.launch(appApi, cmdApi).catch(console.error);

  let process: Process = {
    instId,
  };
  processes.set(instId, process);

  return instId;
}

export function closeApp(instId: number) {
  for (const [id, win] of wmApi.getWindows().entries()) {
    if (win.data.owner === instId) {
      wmApi.closeWindow(id);
    }
  }

  processes.delete(instId);
}

let appRegistry: Map<string, AppManifest> = new Map();

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry.set(id, app);
}

let cmdRegistry: Map<string, CmdManifest> = new Map();

export function registerCmd(cmd: CmdManifest) {
  let name = cmd.command;
  cmdRegistry.set(name, cmd);
}
