import type { AppApi } from "@os/app/api";
import type { ProcArgs, ProcessManifest } from "@os/app/app";
import { launchProcess } from "@os/app/processes";
import { fsApi } from "@os/fs/filesystem";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Notepad from "./Notepad.svelte";

async function launch(api: AppApi, args?: ProcArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(300, 420)
      .withTitle("notepad")
      .withComponent(Notepad, api, args)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let notepadManifest: ProcessManifest = {
  appId: "notepad",
  launch,

  openPath: async (path) => {
    let entry = await fsApi.getEntry(path);
    if (!entry) return false;
    if (entry.type !== "file") return false;

    launchProcess(notepadManifest, {
      path: path,
    });
    return true;
  },
};
