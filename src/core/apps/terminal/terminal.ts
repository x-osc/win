import type { AppApi } from "@os/app/api";
import type { ProcessManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import Terminal from "./Terminal.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder().withTitle("terminal").withComponent(Terminal, api).build(),
  );

  let body = winApi.getBody();
  if (body !== null) {
    body.style.margin = "0px 1px";
  }

  winApi.on("close", () => {
    api.quit();
  });
}

export let terminalManifest: ProcessManifest = {
  appId: "terminal",
  launch,
};
