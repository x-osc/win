import type { AppApi } from "@os/app/api";
import type { AppManifest } from "@os/app/app";
import { launchAppFromManifest } from "@os/app/processes";
import { mousePos } from "@os/state.svelte";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount } from "svelte";
import Dialog from "./Dialog.svelte";

async function launch(api: AppApi, args?: DialogArgs) {
  let winApi = await api.window.createWindow(
    winDataBuilder()
      .withMinSize(290, 100)
      .withSize(300, 100)
      .withTitle(args?.title ?? "dialog")
      .withPosition(
        args?.position?.x ?? mousePos.x - 120,
        args?.position?.y ?? mousePos.y - 40,
      )
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
  title?: string;
  position?: { x: number; y: number };
};

export type DialogResult = {
  code?: number;
};

export let dialogManifest: AppManifest = {
  appId: "dialog",

  launch,
};

export async function showDialog(
  args: DialogArgs,
  owner: number,
): Promise<number | null> {
  let procApi = launchAppFromManifest(dialogManifest, args, { owner });

  return new Promise((resolve) => {
    procApi.on("exit", (result) => {
      resolve(result?.code ?? null);
    });
  });
}
