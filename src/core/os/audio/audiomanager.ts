import { Sound, type SoundOptions } from "./audio";

export type AudioCategory = "ui" | "main";

interface AudioBus {
  gainNode: GainNode;
}

let ctx: AudioContext = new window.AudioContext();
let buses: Record<AudioCategory, AudioBus> = {
  ui: createBus(),
  main: createBus(),
};

function createBus(): AudioBus {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  return { gainNode: gain };
}

export function sound(options: SoundOptions): Sound {
  const category = options.category ?? "main";
  return new Sound(ctx, buses[category].gainNode, options);
}

export function setVolume(category: AudioCategory, value: number) {
  const bus = buses[category];
  // smooth ramp to avoid clicks
  bus.gainNode.gain.setTargetAtTime(value, ctx.currentTime, 0.1);
}

async function resume() {
  if (ctx.state === "suspended") await ctx.resume();
}
