import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount } from "svelte";
import Terminal from "./Terminal.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindow(
    winDataBuilder().withTitle("terminal").build(),
  );

  let body = winApi.getBody();
  if (body !== null) {
    body.style.margin = "0px 1px";

    const component = mount(Terminal, {
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

export let terminalManifest: AppManifest = {
  appId: "terminal",
  launch,
};
