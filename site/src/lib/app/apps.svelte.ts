import { getAppApi, type AppApi } from "./api";
import type { App, AppManifest } from "./app";
import { instanceId } from "../state.svelte";
import { wmApi } from "../wm/wm.svelte";

let apps: Record<number, App> = $state({});

export function launchApp(id: string): number | null {
  if (!appRegistry[id]) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(appRegistry[id]);
}

function launchAppFromManifest(manifest: AppManifest): number {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let appInstance = manifest.createApp(appApi);

  appInstance.launch();
  apps[instId] = appInstance;

  return instId;
}

export function closeApp(instId: number) {
  for (const [id, win] of Object.entries(wmApi.getWindows())) {
    if (win.data.owner === instId) {
      wmApi.closeWindow(Number(id));
    }
  }

  delete apps[instId];
}

let appRegistry: Record<string, AppManifest> = {};

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry[id] = app;
}
