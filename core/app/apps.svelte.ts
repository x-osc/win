import {
  CallbackManager,
  OffFunction,
  OnceFunction,
  OnFunction,
} from "../callbacks";
import { CmdApi, CmdManifest } from "../cmd/command";
import { instanceId } from "../state.svelte";
import { wmApi } from "../wm/wm.svelte";
import { getAppApi } from "./api";
import type { AppManifest } from "./app";

let processes: Map<number, Process> = new Map();

export interface Process {
  instId: number;

  api: ProcessApi;
}

export interface ProcessApi {
  getId(): number;

  on: OnFunction<ProcessEvents>;
  once: OnceFunction<ProcessEvents>;
  off: OffFunction<ProcessEvents>;
}

export function launchApp(id: string): ProcessApi | null {
  const app = appRegistry.get(id);
  if (app === undefined) {
    console.error(`app ${id} does not exist`);
    console.log(appRegistry);
    return null;
  }
  return launchAppFromManifest(app);
}

export function launchCmd(cmd: string, cmdApi: CmdApi): ProcessApi | null {
  const command = cmdRegistry.get(cmd);
  if (command === undefined) {
    console.error(`command ${cmd} does not exist`);
    console.log(cmdRegistry);
    return null;
  }
  return launchCmdFromManifest(command, cmdApi);
}

export function launchAppFromManifest(manifest: AppManifest): ProcessApi {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let promise = manifest.launch(appApi).catch(console.error);

  let process = makeProcess(promise, instId);

  return process.api;
}

export function launchCmdFromManifest(
  manifest: CmdManifest,
  cmdApi: CmdApi
): ProcessApi {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let promise = manifest.launch(appApi, cmdApi).catch(console.error);

  let process = makeProcess(promise, instId);

  return process.api;
}

type ProcessEvents = {
  exit: [];
};

function makeProcess(promise: Promise<void>, instId: number): Process {
  let callbacks = new CallbackManager<ProcessEvents>();
  promise.then(() => {
    callbacks.emit("exit");
  });

  let processApi: ProcessApi = {
    getId: () => instId,

    on: callbacks.on.bind(callbacks),
    once: callbacks.once.bind(callbacks),
    off: callbacks.off.bind(callbacks),
  };

  let process: Process = {
    instId,

    api: processApi,
  };

  processes.set(instId, process);

  return process;
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

export function getApps(): Map<string, AppManifest> {
  return appRegistry;
}

let cmdRegistry: Map<string, CmdManifest> = new Map();

export function registerCmd(cmd: CmdManifest) {
  let name = cmd.command;
  cmdRegistry.set(name, cmd);
}

export function getCmds(): Map<string, CmdManifest> {
  return cmdRegistry;
}
