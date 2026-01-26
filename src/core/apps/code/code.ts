import type { AppApi } from "@os/app/api";
import type { ProcArgs, ProcessManifest } from "@os/app/app";
import { launchProcess, sendIpc } from "@os/app/processes";
import { fsApi } from "@os/fs/filesystem";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Code from "./Code.svelte";

let mainCodeInstance: number[] = [];
export function setMainCodeInstance(inst: number) {
  mainCodeInstance = mainCodeInstance.filter((instId) => instId !== inst);
  mainCodeInstance.push(inst);
}
export function removeCodeInstance(inst: number) {
  mainCodeInstance = mainCodeInstance.filter((instId) => instId !== inst);
}

async function launch(api: AppApi, args?: ProcArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(300, 420)
      .withTitle("code")
      .withComponent(Code, api, args)
      .build(),
  );
}

export let codeManifest: ProcessManifest = {
  appId: "code",
  launch,

  openPath: async (path) => {
    let entry = await fsApi.getEntry(path);
    if (!entry) return false;
    if (entry.type !== "file") return false;

    if (mainCodeInstance.length > 0) {
      sendIpc(mainCodeInstance[mainCodeInstance.length - 1], {
        openPath: path,
      });
    } else {
      launchProcess(codeManifest, { path });
    }

    return true;
  },
};
