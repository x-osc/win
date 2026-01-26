import type { AppApi } from "@os/app/api";
import type { ProcArgs, ProcessManifest } from "@os/app/app";
import { launchProcess } from "@os/app/processes";
import { fsApi } from "@os/fs/filesystem";
import { winDataBuilder } from "@os/wm/wm.svelte";
import ImgViewer from "./ImgViewer.svelte";

async function launch(api: AppApi, args?: ProcArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withTitle("image viewer")
      .withMinSize(300, 200)
      .withSize(300, 300)
      .withComponent(ImgViewer, api, args)
      .build(),
  );

  let body = winApi.getBody();
  if (body !== null) {
    body.style.margin = "0px 3px";
  }

  winApi.on("close", () => {
    api.quit();
  });
}

export let viewerManifest: ProcessManifest = {
  appId: "viewer",
  launch,

  openPath: async (path) => {
    let entry = await fsApi.getEntry(path);
    if (!entry) return false;
    if (entry.type !== "file") return false;

    launchProcess(viewerManifest, { path });
    return true;
  },
};
