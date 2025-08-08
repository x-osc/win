import { mount } from "svelte";
import { AppApi } from "../../core/app/api";
import { App, AppManifest } from "../../core/app/app";
import { winDataBuilder } from "../../core/wm/wm.svelte";
import Terminal from "./Terminal.svelte";

class TerminalApp implements App {
  api: AppApi;

  constructor(api: AppApi) {
    this.api = api;
  }

  launch(): void {
    this.api.window
      .createWindowAsync(winDataBuilder().withTitle("terminal").build())
      .then((winApi) => {
        let body = winApi.getBody();
        if (body !== null) {
          const component = mount(Terminal, {
            target: body,
            props: {
              appApi: this.api,
              winApi,
            },
          });
        }

        winApi.on("close", () => {
          this.api.quit();
        });
      });
  }
}

export let terminalManifest: AppManifest = {
  appId: "terminal",
  createApp: (api) => new TerminalApp(api),
};
