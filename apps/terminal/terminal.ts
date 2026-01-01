import { mount } from "svelte";
import type { AppApi } from "../../core/app/api";
import type { AppManifest } from "../../core/app/app";
import { winDataBuilder } from "../../core/wm/wm.svelte";
import Terminal from "./Terminal.svelte";

async function launch(api: AppApi) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder().withTitle("terminal").build()
  );

  let body = winApi.getBody();
  if (body !== null) {
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
