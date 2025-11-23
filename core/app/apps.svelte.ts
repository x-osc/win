import { CmdApi, CmdManifest } from "../cmd/command";
import { instanceId } from "../state.svelte";
import { wmApi } from "../wm/wm.svelte";
import { getAppApi } from "./api";
import type { AppManifest, Process } from "./app";

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

  // TODO: idk make sure this isnt bad lmao
  process.launch().catch(console.error);
  processes.set(instId, process);

  return instId;
}

export function launchCmdFromManifest(
  manifest: CmdManifest,
  cmdApi: CmdApi
): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let process = manifest.createProcess(appApi, cmdApi);

  process.launch().catch(console.error);
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
