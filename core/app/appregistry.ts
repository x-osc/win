import type { AppManifest } from "./app";
import { launchAppFromManifest, type ProcessApi } from "./processes";

let appRegistry: Map<string, AppManifest> = new Map();

export function launchApp(id: string): ProcessApi | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(app);
}

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry.set(id, app);
}

export function getApps(): Map<string, AppManifest> {
  return appRegistry;
}
