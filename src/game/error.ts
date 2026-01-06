import type { AppApi } from "@core/app/api";
import { sleep } from "@core/utils";
import { mount } from "svelte";
import Bsod from "./Bsod.svelte";

// TODO: either have a root app api or a background app that has this
export async function doError(api: AppApi) {
  await sleep(100);
  api.showDialog({ message: "an error occured. uh oh" });
  await sleep(120);
  api.showDialog({
    message: "an error occured. uh oh",
    position: dialogpositions[0][0],
  });
  await sleep(80);
  api.showDialog({
    message: "an error occured. uh oh",
    position: dialogpositions[0][1],
  });
  await sleep(60);
  api.showDialog({
    message: "an error occured. uh oh",
    position: dialogpositions[0][2],
  });
  await sleep(40);
  api.showDialog({
    message: "an error occured. uh oh",
    position: dialogpositions[0][3],
  });
  await sleep(800);

  bsod();
}

export function bsod() {
  mount(Bsod, {
    target: document.getElementById("root")!,
  });
}

let dialogpositions: { x: number; y: number }[][] = [
  [
    { x: 93, y: 136 },
    { x: 959, y: 56 },
    { x: 603, y: 632 },
    { x: 1252, y: 437 },
  ],
];
