import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Explorer from "./Explorer.svelte";

async function launch(api: AppApi, args?: ExplorerArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(410, 237)
      .withTitle("file explorerer")
      .withComponent(Explorer, api, args)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export type ExplorerArgs = {
  dialogType?: "none" | "save" | "fileonly" | "dironly" | "both";
  workingDir?: string[];
  saveDefaultName?: string;
};

export type ExplorerResult = {
  selectedEntry: string[] | null;
};

export let explorerManifest: AppManifest = {
  appId: "explorer",

  launch,
};
