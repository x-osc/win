import clickDownFile from "@assets/audio/mouse03_down.wav?url";
import clickUpFile from "@assets/audio/mouse03_up.wav?url";
import { Howl } from "howler";

Howler.autoSuspend = false;

const clickDown = new Howl({
  src: [clickDownFile],
  volume: 0.7,
  preload: true,
});

const clickUp = new Howl({
  src: [clickUpFile],
  volume: 0.7,
  preload: true,
});

export async function playClickDown() {
  clickDown.play();
}

export async function playClickUp() {
  clickUp.play();
}
