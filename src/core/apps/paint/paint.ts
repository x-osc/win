import type { AppApi } from "@os/app/api";
import type { ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Paint from "./Paint.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(299, 340)
      .withSize(358, 533)
      .withTitle("michaelsoft pain")
      .withComponent(Paint, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let paintManifest: ProcessManifest = {
  appId: "paint",
  launch,
};
