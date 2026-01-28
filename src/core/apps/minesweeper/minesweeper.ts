import type { AppApi } from "@os/app/api";
import type { AppManifest, ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Minesweeper from "./Minesweeper.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(318, 417)
      .withSize(318, 417)
      .withTitle("minesweeper")
      .withComponent(Minesweeper, api)
      .build(),
  );

  winApi.on("close", () => {
    api.quit();
  });
}

export let minesweeperProcess: ProcessManifest = {
  appId: "minesweeper",
  launch,
};

export let minesweeperApp: AppManifest = {
  process: minesweeperProcess,
  name: "Minesweeper",
};
