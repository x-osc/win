import type { OffFunction, OnceFunction, OnFunction } from "../callbacks";
import { CallbackManager } from "../callbacks";
import type { CmdApi, CmdManifest } from "../cmd/command";
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
