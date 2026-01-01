import { mount } from "svelte";
import type { AppApi } from "../../core/app/api";
import type { AppManifest } from "../../core/app/app";
import { winDataBuilder } from "../../core/wm/wm.svelte";
import Paint from "./Paint.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder().withMinSize(290, 161).withTitle("michaelsoft pain").build()
  );

  let body = winApi.getBody();
  const component = mount(Paint, {
    target: body,
  });

  winApi.on("close", () => {
    api.quit();
  });
}

export let paintManifest: AppManifest = {
  appId: "paint",
  launch,
};
