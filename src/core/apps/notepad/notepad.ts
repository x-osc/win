import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Notepad from "./Notepad.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(300, 420)
      .withTitle("notepad")
      .withComponent(Notepad, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let notepadManifest: AppManifest = {
  appId: "notepad",
  launch,
};
