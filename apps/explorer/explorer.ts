import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Explorer from "./Explorer.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder().withMinSize(290, 161).withTitle("file explorer").build()
  );

  let body = winApi.getBody();
  const component = mount(Explorer, {
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

export let explorerManifest: AppManifest = {
  appId: "explorer",
  launch,
};
