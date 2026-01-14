import type { AudioCategory } from "./audiomanager";

export interface SoundOptions {
  src: string;
  category?: AudioCategory;
  loop?: boolean;
  volume?: number;
}

export class Sound {
  private buffer: AudioBuffer | null = null;
  private ctx: AudioContext;
  private destination: AudioNode;
  private options: Required<SoundOptions>;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    options: SoundOptions,
  ) {
    this.ctx = ctx;
    this.destination = destination;
    this.options = {
      category: "main",
      loop: false,
      volume: 1.0,
      ...options,
    };

    this.load(this.options.src);
  }

  private async load(url: string) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Failed to load sound: ${url}`, e);
    }
  }

  async play(overrideOptions: Partial<SoundOptions> = {}) {
    if (!this.buffer) {
      await this.load(this.options.src);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = overrideOptions.loop ?? this.options.loop;

    const localGain = this.ctx.createGain();
    localGain.gain.value = overrideOptions.volume ?? this.options.volume;

    // Routing: Source -> Instance Volume -> Category Bus
    source.connect(localGain);
    localGain.connect(this.destination);

    source.start(0);
    this.activeSources.add(source);

    source.onended = () => this.activeSources.delete(source);
    return source;
  }

  stop() {
    this.activeSources.forEach((s) => s.stop());
    this.activeSources.clear();
  }
}
