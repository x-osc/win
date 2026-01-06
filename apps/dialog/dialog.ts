import type { AppApi } from "@core/app/api";
import type { AppManifest } from "@core/app/app";
import { mousePos } from "@core/state.svelte";
import { winDataBuilder } from "@core/wm/wm.svelte";
import { mount } from "svelte";
import Dialog from "./Dialog.svelte";

async function launch(api: AppApi, args?: DialogArgs) {
  let winApi = await api.window.createWindowAsync(
    winDataBuilder()
      .withMinSize(290, 100)
      .withSize(300, 100)
      .withPosition(mousePos.x - 120, mousePos.y - 40)
      .withTitle("dialog")
      .build(),
  );

  let body = winApi.getBody();
  const component = mount(Dialog, {
    target: body,
    props: {
      api,
      winApi,
      args,
    },
  });

  winApi.on("close", () => {
    api.quit();
  });
}

export type DialogArgs = {
  message?: string;
};

export type DialogResult = {
  code?: number;
};

export let dialogManifest: AppManifest = {
  appId: "dialog",

  launch,
};
