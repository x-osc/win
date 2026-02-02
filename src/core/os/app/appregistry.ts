import { ensureDir, fsApi, FsError, PROGRAMS_DIR } from "@os/fs/filesystem";
import type { AppManifest, ProcArgs, ProcessManifest } from "./app";
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
  return launchProcess(app, args, extraOptions);
}

/** Adds app to App Registry */
export async function registerApp(app: AppManifest) {
  registerProcess(app);

  let id = app.appId;
  appRegistry.set(id, app);

  await ensureDir(PROGRAMS_DIR);
  let path = app.exePath ?? [...PROGRAMS_DIR, app.appId];

  try {
    await fsApi.writeFile(path, { data: new Blob([]), process: id });
  } catch (e) {
    if (e instanceof FsError && e.kind.type === "alreadyexists") {
      return;
    } else if (e instanceof FsError && e.kind.type === "backendfailure") {
      console.log(e.kind.cause);
      return;
    }
    throw e;
  }
}

/** Returns App Registry */
export function getApps() {
  return appRegistry;
}

let processRegistry: Map<string, ProcessManifest> = new Map();

export function registerProcess(proc: ProcessManifest) {
  let id = proc.appId;
  processRegistry.set(id, proc);
}

export function getProcessRegistry() {
  return processRegistry;
}
