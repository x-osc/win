import { sleep } from "@lib/core/utils";
import type { AppApi } from "@os/app/api";
import { wmApi } from "@os/wm/wm.svelte";
import { gameState } from "./gameState.svelte";

// TODO: either have a root app api or a background app that has this
export async function calcError(api: AppApi) {
  gameState.isTrail = true;
  await sleep(100);
  api.showDialog({ 
    message: "an error occured.",
    buttons: ["oh no"],
  });
  await sleep(120);
  api.showDialog({
    message: "an error occured.",
    buttons: ["oh no"],
    position: dialogpositions[0][0],
  });
  await sleep(80);
  api.showDialog({
    message: "an error occured.",
    buttons: ["oh no"],
    position: dialogpositions[0][1],
  });
  await sleep(60);
  api.showDialog({
    message: "an error occured.",
    buttons: ["oh no"],
    position: dialogpositions[0][2],
  });
  await sleep(40);
  api.showDialog({
    message: "an error occured.",
    buttons: ["oh no"],
    position: dialogpositions[0][3],
  });

  wmApi.once("anymoved", async () => {
    await sleep(850);
    continueError();
  });

  let closeCount = 0;
  wmApi.on("anyclosed", async () => {
    closeCount++;
    console.log(closeCount);

    if (closeCount >= 4) {
      await sleep(750);
      continueError();
    }
  });

  function continueError() {
    gameState.isBsod = true;
  }
}

let dialogpositions: { x: number; y: number }[][] = [
  [
    { x: 93, y: 136 },
    { x: 959, y: 56 },
    { x: 603, y: 632 },
    { x: 1252, y: 437 },
  ],
];

export async function hydraError() {
  gameState.isTrail = true;

  wmApi.once("anymoved", async () => {
    await sleep(850);
    gameState.isBsod = true;
  });
}
