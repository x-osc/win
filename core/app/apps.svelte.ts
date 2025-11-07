import { getAppApi, type AppApi } from "./api";
import type { Process, AppManifest } from "./app";
import { instanceId } from "../state.svelte";
import { wmApi } from "../wm/wm.svelte";
import { CmdApi, CmdManifest } from "./command";

let processes: Map<number, Process> = new Map();

export function launchApp(id: string): number | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(app);
}

function launchAppFromManifest(manifest: AppManifest): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let process = manifest.createApp(appApi);

  process.launch();
  processes.set(instId, process);

  return instId;
}

export function launchCmdFromManifest(
  manifest: CmdManifest,
  cmdApi: CmdApi,
): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let process = manifest.createProcess(appApi, cmdApi);

  process.launch();
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
