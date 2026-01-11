import clickSoundFile from "@assets/mouse03.wav?url";

const audioCtx = new window.AudioContext();
let buffer: AudioBuffer | null = null;

async function loadSounds() {
  const response = await fetch(clickSoundFile);
  const arrayBuffer = await response.arrayBuffer();
  buffer = await audioCtx.decodeAudioData(arrayBuffer);
}

loadSounds();

export async function playClick() {
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
    return;
  }

  if (buffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  }
}
