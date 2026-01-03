import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Explorer from "./Explorer.svelte";

async function launch(api: AppApi, args?: Record<string, any>) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder().withMinSize(290, 161).withTitle("file explorerer").build(),
  );

  let body = winApi.getBody();
  const component = mount(Explorer, {
    target: body,
    props: {
      api,
      winApi,
      args,
    },
  });

  winApi.on("close", () => {
    api.quit();
  });
}

export let explorerManifest: AppManifest = {
  appId: "explorer",

  launch,
};
