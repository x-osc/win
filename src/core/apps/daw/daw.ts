import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Daw from "./Daw.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(200, 382)
      .withSize(270, 382)
      .withTitle("fire beat maker")
      .withComponent(Daw, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let dawManifest: AppManifest = {
  appId: "firebeats",

  launch,
};
