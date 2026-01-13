import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount } from "svelte";
import Minesweeper from "./Minesweeper.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(318, 417)
      .withSize(318, 417)
      .withTitle("minesweeper")
      .build(),
  );

  let body = winApi.getBody();
  const component = mount(Minesweeper, {
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

export let minesweeperManifest: AppManifest = {
  appId: "minesweeper",
  launch,
};
