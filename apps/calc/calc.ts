// calc is short for calculator

import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Calc from "./Calc.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder()
      .withMinSize(200, 348)
      .withSize(270, 348)
      .withTitle("calculator")
      .build(),
  );

  let body = winApi.getBody();
  const component = mount(Calc, {
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

export let calcManifest: AppManifest = {
  appId: "calc",

  launch,
};
