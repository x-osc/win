import sadTromboneFile from "@assets/audio/sadtrombone.wav?url";
import winFile from "@assets/audio/win.wav?url";
import youWinFile from "@assets/audio/you_win.wav?url";

Howler.autoSuspend = false;
Howler.volume(0.5);

export const sadTromboneSfx = new Howl({
  src: [sadTromboneFile],
});

export const youWinSfx = new Howl({
  src: [youWinFile],
});

export const winSfx = new Howl({
  src: [winFile],
});
