import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Paint from "./Paint.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder()
      .withMinSize(290, 161)
      .withSize(344, 414)
      .withTitle("michaelsoft pain")
      .build()
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
