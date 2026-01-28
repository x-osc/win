import type { AppApi } from "@os/app/api";
import type { AppManifest, ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Explorer from "./Explorer.svelte";

async function launch(api: AppApi, args?: ExplorerArgs) {
  let title = "file explorerer";
  if (args?.dialogType === "save") {
    title = "save";
  } else if (args?.dialogType === "fileonly") {
    title = "open";
  }

  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(410, 237)
      .withTitle(title)
      .withComponent(Explorer, api, args)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export type ExplorerArgs = {
  dialogType?: "none" | "save" | "fileonly" | "dironly";
  workingDir?: string[];
  saveDefaultName?: string;
};

export type ExplorerResult = {
  selectedEntry: string[] | null;
};

export let explorerProcess: ProcessManifest = {
  appId: "explorer",

  launch,
};

export let exporerApp: AppManifest = {
  process: explorerProcess,
  name: "File Explorer",
};
