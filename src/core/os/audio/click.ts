import clickSoundFile from "@assets/mouse03.wav?url";
import { Howl } from "howler";

const clickSound = new Howl({
  src: [clickSoundFile],
  volume: 0.3,
  preload: true,
});

export async function playClick() {
  clickSound.play();
}
