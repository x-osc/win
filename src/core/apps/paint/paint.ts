import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount } from "svelte";
import Paint from "./Paint.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(344, 414)
      .withTitle("michaelsoft pain")
      .build(),
  );

  let body = winApi.getBody();
  if (body !== null) {
    const component = mount(Paint, {
      target: body,
      props: {
        appApi: api,
        winApi,
      },
    });
  }

  winApi.on("close", () => {
    api.quit();
  });
}

export let paintManifest: AppManifest = {
  appId: "paint",
  launch,
};
