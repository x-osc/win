import { mount } from "svelte";
import type { AppApi } from "../../core/app/api";
import type { AppManifest } from "../../core/app/app";
import { winDataBuilder } from "../../core/wm/wm.svelte";
import Notepad from "./Notepad.svelte";

async function launch(api: AppApi) {
  api.window
    .createWindowAsync(
      winDataBuilder().withMinSize(290, 161).withTitle("notepad").build()
    )
    .then((winApi) => {
      let body = winApi.getBody();
      const component = mount(Notepad, {
        target: body,
      });

      winApi.on("close", () => {
        api.quit();
      });
    });
}

export let notepadManifest: AppManifest = {
  appId: "notepad",
  launch,
};
