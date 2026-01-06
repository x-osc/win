import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Explorer from "./Explorer.svelte";

async function launch(api: AppApi, args?: ExplorerArgs) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder().withMinSize(290, 161).withTitle("file explorerer").build(),
  );

  let body = winApi.getBody();
  const component = mount(Explorer, {
    target: body,
    props: {
      api,
      winApi,
      args,
    },
  });

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
