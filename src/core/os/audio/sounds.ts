import sadTromboneFile from "@assets/audio/sadtrombone.wav?url";
import winFile from "@assets/audio/win.wav?url";
import youWinFile from "@assets/audio/you_win.wav?url";
import { settingsCallbacks } from "@os/settings/settings";
import { setVolume, sound } from "./audiomanager";

settingsCallbacks.on("changed", (settings) => {
  setVolume("main", settings.mainvol / 100);
  setVolume("ui", settings.uivol / 100);
});

export const sadTromboneSfx = sound({
  src: sadTromboneFile,
});

export const youWinSfx = sound({
  src: youWinFile,
});

export const winSfx = sound({
  src: winFile,
});
