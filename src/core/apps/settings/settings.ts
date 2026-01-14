import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
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

export let settingsManifest: AppManifest = {
  appId: "settings",
  launch,
};
