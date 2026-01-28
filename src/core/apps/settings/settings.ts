import type { AppApi } from "@os/app/api";
import type { AppManifest, ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Settings from "./Settings.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(344, 414)
      .withTitle("settings")
      .withComponent(Settings, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let settingsProcess: ProcessManifest = {
  appId: "settings",
  launch,
};

export let settingsApp: AppManifest = {
  process: settingsProcess,
  name: "Settings",
};
