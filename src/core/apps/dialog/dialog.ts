import type { AppApi } from "@os/app/api";
import { mousePos } from "@os/state.svelte";
import { winDataBuilder } from "@os/wm/wm.svelte";
import { mount, unmount } from "svelte";
import Dialog from "./Dialog.svelte";

export async function showDialog(
  api: AppApi,
  args: DialogArgs,
): Promise<number> {
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

  return new Promise((resolve) => {
    const component = mount(Dialog, {
      target: winApi.getBody(),
      props: {
        args,
        quit: (code: number) => {
          winApi.close();
          resolve(code);
        },
      },
    });

    winApi.on("close", () => {
      unmount(component);
      winApi.close();
      resolve(-1);
    });
  });
}

export type DialogArgs = {
  message?: string;
  title?: string;
  buttons?: string[];
  position?: { x: number; y: number };
};
