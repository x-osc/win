import { AppApi } from "../../core/app/api";
import { App, AppManifest } from "../../core/app/app";
import { winDataBuilder } from "../../core/wm/wm.svelte";
import { mount } from "svelte";
import Notepad from "./Notepad.svelte";

class NotepadApp implements App {
  api: AppApi;

  constructor(api: AppApi) {
    this.api = api;
  }

  launch(): void {
    this.api.window
      .createWindowAsync(
        winDataBuilder().withMinSize(290, 161).withTitle("notepad").build(),
      )
      .then((winApi) => {
        let body = winApi.getBody();
        const component = mount(Notepad, {
          target: body,
        });

        winApi.on("close", () => {
          this.api.quit();
        });
      });
  }
}

export let notepadManifest: AppManifest = {
  appId: "notepad",
  createApp: (api) => new NotepadApp(api),
};
