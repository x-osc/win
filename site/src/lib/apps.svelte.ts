import { getAppApi, type AppApi } from "./api";
import type { App, AppManifest } from "./app";
import { instanceId } from "./state.svelte";

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

let appRegistry: Record<string, AppManifest> = {};

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry[id] = app;
}
