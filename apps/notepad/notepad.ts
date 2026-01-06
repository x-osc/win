import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Notepad from "./Notepad.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(300, 420)
      .withTitle("notepad")
      .build(),
  );

  let body = winApi.getBody();
  const component = mount(Notepad, {
    target: body,
    props: {
      api,
      winApi,
    },
  });

  winApi.on("close", () => {
    api.quit();
  });
}

export let notepadManifest: AppManifest = {
  appId: "notepad",
  launch,
};
