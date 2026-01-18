import type { AppApi } from "@os/app/api";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { winDataBuilder } from "@os/wm/wm.svelte";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();

  let title = "New Window";
  if (args[0]) {
    title = args[0];
  }

  let winApi = await api.window.createWindow(
    winDataBuilder().withTitle(title).build(),
  );

  await new Promise<void>((resolve) => {
    winApi.on("close", () => {
      resolve();
    });
  });
}

export let mkwindowManifest: CmdManifest = {
  appId: "mkwindow",
  command: "mkwindow",

  launch,
};
