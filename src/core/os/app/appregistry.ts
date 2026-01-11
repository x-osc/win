import type { AppArgs, AppManifest } from "./app";
import {
  launchAppFromManifest,
  type ExtraProcessOptions,
  type ProcessApi,
} from "./processes";

let appRegistry: Map<string, AppManifest> = new Map();

export function launchApp(
  id: string,
  args?: AppArgs,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(app, args, extraOptions);
}

export function registerApp(app: AppManifest) {
  let id = app.appId;
  appRegistry.set(id, app);
}

export function getApps(): Map<string, AppManifest> {
  return appRegistry;
}
