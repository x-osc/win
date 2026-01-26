import type { AppApi } from "@os/app/api";
import type { ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Browser from "./Browser.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(632, 544)
      .withTitle("browser")
      .withComponent(Browser, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let browserManifest: ProcessManifest = {
  appId: "browser",

  launch,
};
