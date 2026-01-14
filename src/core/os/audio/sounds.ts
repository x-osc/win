import sadTromboneFile from "@assets/audio/sadtrombone.wav?url";
import winFile from "@assets/audio/win.wav?url";
import youWinFile from "@assets/audio/you_win.wav?url";
import { getSettings, settingsCallbacks } from "@os/settings/settings";
import { setupUnlockListeners, setVolume, sound } from "./audiomanager";

settingsCallbacks.on("changed:mainvol", (newval) => {
  setVolume("main", newval / 100);
});

settingsCallbacks.on("changed:uivol", (newval) => {
  setVolume("ui", newval / 100);
});

export async function initAudio() {
  setupUnlockListeners();

  const settings = await getSettings();
  setVolume("main", settings.mainvol / 100);
  setVolume("ui", settings.uivol / 100);
}

export const sadTromboneSfx = sound({
  src: sadTromboneFile,
  volume: 0.6,
});

export const youWinSfx = sound({
  src: youWinFile,
  volume: 0.8,
});

export const winSfx = sound({
  src: winFile,
  volume: 0.8,
});
