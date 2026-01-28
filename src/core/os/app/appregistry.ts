import type { AppManifest, ProcArgs } from "./app";
import {
  launchProcess,
  type ExtraProcessOptions,
  type ProcessApi,
} from "./processes";

let appRegistry: Map<string, AppManifest> = new Map();

/** Launches app from it's manifest if it does not point to a null value */
export function launchApp(
  id: string,
  args?: ProcArgs,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchProcess(app.process, args, extraOptions);
}

/** Adds app to App Registry */
export function registerApp(app: AppManifest) {
  let id = app.process.appId;
  appRegistry.set(id, app);
}

/** Returns App Registry */
export function getApps(): Map<string, AppManifest> {
  return appRegistry;
}
