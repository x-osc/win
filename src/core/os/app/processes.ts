import type {
  OffFunction,
  OnceFunction,
  OnFunction,
} from "@lib/core/callbacks";
import { CallbackManager } from "@lib/core/callbacks";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { instanceId } from "@os/state.svelte";
import { wmApi } from "@os/wm/wm.svelte";
import { getAppApi } from "./api";
import type { AppArgs, AppManifest, AppResult } from "./app";

let processes: Map<number, [Process, ProcessApi]> = new Map();

export interface Process {
  instId: number;
  owner: number | null;
  appId: string;

  callbacks: CallbackManager<ProcessEvents>;
}

type ProcessEvents = {
  setupFinished(): void;
  exit(result?: AppResult): void;
};

export interface ExtraProcessOptions {
  owner?: number;
}

export interface ProcessApi {
  getId(): number;
  getOwner(): number | null;
  quit(): void;

  on: OnFunction<ProcessEvents>;
  once: OnceFunction<ProcessEvents>;
  off: OffFunction<ProcessEvents>;
}

export function getProcesses(): Map<number, [Process, ProcessApi]> {
  return processes;
}

export function getProcessApi(id: number): ProcessApi | null {
  return processes.get(id)?.[1] ?? null;
}

export function launchAppFromManifest(
  manifest: AppManifest,
  args?: AppArgs,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let promise = manifest.launch(appApi, args).catch(console.error);

  let api = makeProcess(promise, instId, manifest.appId, extraOptions);

  return api;
}

export function launchCmdFromManifest(
  manifest: CmdManifest,
  cmdApi: CmdApi,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi {
  const instId = instanceId.value++;

  let appApi = getAppApi(instId);
  let promise = manifest.launch(appApi, cmdApi).catch(console.error);

  let api = makeProcess(promise, instId, manifest.appId, extraOptions);

  return api;
}

function makeProcess(
  promise: Promise<void>,
  instId: number,
  appId: string,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi {
  let callbacks = new CallbackManager<ProcessEvents>();
  promise.then(() => {
    callbacks.emit("setupFinished");
  });

  let process = {
    instId,
    appId,
    owner: extraOptions.owner ?? null,
    callbacks,
  };

  let processApi: ProcessApi = {
    getId: () => instId,
    // use process inst here since owner can change !!!!
    getOwner: () => process.owner,
    quit: () => closeApp(instId),

    on: callbacks.on.bind(callbacks),
    once: callbacks.once.bind(callbacks),
    off: callbacks.off.bind(callbacks),
  };

  processes.set(instId, [process, processApi]);

  return processApi;
}

export function closeApp(instId: number, result?: AppResult) {
  if (!processes.has(instId)) {
    return;
  }

  for (const [id, win] of wmApi.getWindows().entries()) {
    if (win.data.owner === instId) {
      wmApi.closeWindow(id);
    }
  }

  for (const [id, [process, processApi]] of processes) {
    if (process.owner === instId) {
      closeApp(id);
    }
  }

  let [process, processApi] = processes.get(instId)!;
  process.callbacks.emit("exit", result);

  processes.delete(instId);
}
