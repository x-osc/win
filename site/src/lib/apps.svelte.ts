import type { App, AppManifest } from "./app";
import { instanceId } from "./state.svelte";

let appApi: any;

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
  let appInstance = new manifest.app(appApi);
  appInstance.launch();

  const instId = instanceId.value++;
  apps[instId] = appInstance;

  return instId;
}

let appRegistry: Record<string, AppManifest> = {};

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry[id] = app;
}
