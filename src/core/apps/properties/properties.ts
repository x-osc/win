import type { AppApi } from "@os/app/api";
import type { ProcessManifest } from "@os/app/app";
import { launchProcess } from "@os/app/processes";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Properties from "./Properties.svelte";

async function launch(api: AppApi, args?: PropertiesArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(410, 237)
      .withTitle("file properties")
      .withComponent(Properties, api, args)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export type PropertiesArgs = {
  path?: string[];
};

export let propertiesManifest: ProcessManifest = {
  appId: "properties",

  launch,
};

export function showProperties(api: AppApi, path: string[]) {
  launchProcess(propertiesManifest, { path }, { owner: api.getId() });
}
