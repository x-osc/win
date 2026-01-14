import clickDownFile from "@assets/audio/mouse03_down.wav?url";
import clickUpFile from "@assets/audio/mouse03_up.wav?url";
import { sound } from "./audiomanager";

const clickDown = sound({
  src: clickDownFile,
  category: "ui",
});

const clickUp = sound({
  src: clickUpFile,
  category: "ui",
});

export async function playClickDown() {
  clickDown.play();
}

export async function playClickUp() {
  clickUp.play();
}
