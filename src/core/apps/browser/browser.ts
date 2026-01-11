import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount } from "svelte";
import Browser from "./Browser.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(632, 544)
      .withTitle("browser")
      .build(),
  );

  let body = winApi.getBody();
  const component = mount(Browser, {
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

export let browserManifest: AppManifest = {
  appId: "browser",

  launch,
};
