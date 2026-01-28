// calc is short for calculator

import type { AppApi } from "@os/app/api";
import type { AppManifest, ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Calc from "./Calc.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(200, 382)
      .withSize(270, 382)
      .withTitle("calculator")
      .withComponent(Calc, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let calcProcess: ProcessManifest = {
  appId: "calc",

  launch,
};

export let calcApp: AppManifest = {
  process: calcProcess,
  name: "Calculator",
};
