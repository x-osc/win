import clickSoundFile from "@assets/mouse03.wav";

const clickSound = new Audio(clickSoundFile);
clickSound.volume = 0.3;

export function playClick() {
  clickSound.play();
}
