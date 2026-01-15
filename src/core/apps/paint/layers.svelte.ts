export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  locked: boolean;
}

export class LayerManager {
  layers: Layer[] = $state([]);
  activeIndex = $state(0);

  docWidth: number;
  docHeight: number;

  render: () => void;

  constructor(width: number, height: number, render: () => void) {
    this.docWidth = width;
    this.docHeight = height;
    this.render = render;
  }

  getActiveLayer() {
    return this.layers[this.activeIndex];
  }

  getLayers() {
    return this.layers;
  }

  makeLayer(name: string, opts?: Partial<Layer>): Layer {
    const canvas = document.createElement("canvas");
    canvas.width = this.docWidth;
    canvas.height = this.docHeight;
    const ctx = canvas.getContext("2d")!;
    // ctx.imageSmoothingEnabled = false;
    return {
      id: crypto.randomUUID(),
      name,
      canvas,
      ctx,
      visible: true,
      locked: false,
      ...opts,
    };
  }

  addLayer(name: string, opts?: Partial<Layer>) {
    let layer = this.makeLayer(name, opts);
    this.layers.push(layer);
    this.activeIndex = this.layers.length - 1;
    return layer;
  }

  selectLayer(id: string) {
    const layer = this.layers.find((l) => l.id === id);
    const index = this.layers.findIndex((l) => l.id === id);

    if (!layer || layer.locked) return;

    this.activeIndex = index;
  }

  deleteLayer(id: string): { layer: Layer; index: number } | undefined {
    if (this.layers.length <= 1) return;

    const layer = this.layers.find((l) => l.id === id);
    const index = this.layers.findIndex((l) => l.id === id);
    if (!layer || layer.locked) return;

    this.layers = this.layers.filter((l) => l.id !== id);

    if (this.activeIndex >= this.layers.length) {
      this.activeIndex = this.layers.length - 1;
    }

    this.render();

    return { layer, index };
  }
}
