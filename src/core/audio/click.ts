import clickDownFile from "@assets/audio/mouse03_down.wav?url";
import clickUpFile from "@assets/audio/mouse03_up.wav?url";
import { Howl } from "howler";

const clickDown = new Howl({
  src: [clickDownFile],
  preload: true,
});

const clickUp = new Howl({
  src: [clickUpFile],
  preload: true,
});

export async function playClickDown() {
  clickDown.play();
}

export async function playClickUp() {
  clickUp.play();
}
