<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  let { api: api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let viewCanvas: HTMLCanvasElement;
  let viewCtx: CanvasRenderingContext2D;

  let layers: Layer[] = $state([]);
  let activeLayerIndex = $state(0);
  let activeLayer = $derived(layers[activeLayerIndex]);
  let activeCtx = $derived(layers[activeLayerIndex]?.ctx);

  let docWidth = 300;
  let docHeight = 300;

  let canvasContainer: HTMLElement | null = null;
  let canvasWidth = 300;
  let canvasHeight = 300;

  let cursorX = 0;
  let cursorY = 0;
  let showCursor = false;

  let drawing = false;
  let startX = 0;
  let startY = 0;

  let undoStack: HistoryAction[] = [];
  let redoStack: HistoryAction[] = [];

  const MAX_UNDO = 100;

  let zoom = 1;
  let panX = 0;
  let panY = 0;

  let panning = false;
  let panStartX = 0;
  let panStartY = 0;

  const MIN_ZOOM = 0.15;
  const MAX_ZOOM = 100;

  let color = $state("#000000");
  let size = $state(6);
  let tool: "brush" | "eraser" = $state("brush");

  interface Layer {
    id: string;
    name: string;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    visible: boolean;
    locked: boolean;
  }

  type HistoryAction =
    | { type: "draw"; layerId: string; snapshot: ImageData }
    | { type: "delete_layer"; layerId: string; layer: Layer; index: number };

  function render() {
    viewCtx.setTransform(1, 0, 0, 1, 0, 0);
    viewCtx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);

    // dont smooth if zoomed in
    if (zoom > 12) {
      viewCtx.imageSmoothingEnabled = false;
    } else {
      viewCtx.imageSmoothingEnabled = true;
    }

    viewCtx.setTransform(zoom, 0, 0, zoom, panX, panY);

    for (const layer of layers) {
      if (layer.visible) {
        viewCtx.drawImage(layer.canvas, 0, 0);
      }
    }

    if (zoom > 12) {
      drawPixelGrid();
    }

    if (showCursor && !panning) {
      drawCursorCircle();
    }
  }

  function drawPixelGrid() {
    viewCtx.save();

    viewCtx.lineWidth = 1 / zoom;
    viewCtx.strokeStyle = "rgba(128, 128, 128, 0.3)";

    viewCtx.beginPath();

    const startX = Math.max(0, Math.floor(-panX / zoom));
    const endX = Math.min(
      docWidth,
      Math.ceil((viewCanvas.width - panX) / zoom),
    );

    const startY = Math.max(0, Math.floor(-panY / zoom));
    const endY = Math.min(
      docHeight,
      Math.ceil((viewCanvas.height - panY) / zoom),
    );

    for (let x = startX; x <= endX; x++) {
      viewCtx.moveTo(x, 0);
      viewCtx.lineTo(x, viewCanvas.height);
    }

    for (let y = startY; y <= endY; y++) {
      viewCtx.moveTo(0, y);
      viewCtx.lineTo(viewCanvas.width, y);
    }

    viewCtx.stroke();
    viewCtx.restore();
  }

  function drawCursorCircle() {
    viewCtx.save();
    viewCtx.globalCompositeOperation = "difference";

    viewCtx.beginPath();
    viewCtx.arc(cursorX, cursorY, size / 2, 0, Math.PI * 2);

    viewCtx.strokeStyle = "white";
    viewCtx.lineWidth = 0.66 / Math.pow(zoom, 0.8);
    viewCtx.stroke();

    viewCtx.restore();
  }

  function resize() {
    if (!canvasContainer || !viewCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasContainer.getBoundingClientRect();

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    viewCanvas.width = canvasWidth * dpr;
    viewCanvas.height = canvasHeight * dpr;

    viewCanvas.style.width = `${canvasWidth}px`;
    viewCanvas.style.height = `${canvasHeight}px`;

    render();
  }

  function start(e: PointerEvent) {
    if (!activeCtx || activeLayer.locked || !activeLayer.visible) return;

    drawing = true;
    saveDrawUndoState();

    const { x, y } = pointerToCanvasCoords(e);
    startX = x;
    startY = y;

    activeCtx.beginPath();
    activeCtx.moveTo(x, y);

    viewCanvas.setPointerCapture(e.pointerId);

    draw(e);
  }

  function draw(e: PointerEvent) {
    if (!drawing) return;

    const { x, y } = pointerToCanvasCoords(e);

    activeCtx.lineWidth = size;
    activeCtx.lineCap = "round";

    if (tool === "eraser") {
      activeCtx.globalCompositeOperation = "destination-out";
      activeCtx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      activeCtx.globalCompositeOperation = "source-over";
      activeCtx.strokeStyle = color;
    }

    activeCtx.lineTo(x, y);
    activeCtx.stroke();
    activeCtx.beginPath();
    activeCtx.moveTo(x, y);

    render();
  }

  function end(e: PointerEvent) {
    if (!drawing) return;
    drawing = false;
    viewCanvas.releasePointerCapture(e.pointerId);

    const { x, y } = pointerToCanvasCoords(e);

    if (x === startX && y === startY) {
      drawDot(x, y);
    }

    activeCtx.beginPath();
    render();
  }

  function drawDot(x: number, y: number) {
    activeCtx.save();

    if (tool === "eraser") {
      activeCtx.globalCompositeOperation = "destination-out";
    } else {
      activeCtx.globalCompositeOperation = "source-over";
      activeCtx.fillStyle = color;
    }

    activeCtx.beginPath();
    activeCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    activeCtx.fill();

    activeCtx.restore();
  }

  // ..its a long name so i remember not to use it..
  function createLayerAndReturnTheLayer(
    name: string,
    opts?: Partial<Layer>,
  ): Layer {
    const canvas = document.createElement("canvas");
    canvas.width = docWidth;
    canvas.height = docHeight;
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

  function createLayer(name: string, opts?: Partial<Layer>) {
    let layer = createLayerAndReturnTheLayer(name, opts);
    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    return layer;
  }

  function selectLayer(id: string) {
    const layer = layers.find((l) => l.id === id);
    const index = layers.findIndex((l) => l.id === id);

    if (!layer || layer.locked) return;

    activeLayerIndex = index;
  }

  function deleteLayer(id: string) {
    if (layers.length <= 1) return;

    const layer = layers.find((l) => l.id === id);
    const index = layers.findIndex((l) => l.id === id);
    if (!layer || layer.locked) return;

    undoStack.push({
      type: "delete_layer",
      layerId: id,
      layer: layer,
      index,
    });
    redoStack.length = 0;

    layers = layers.filter((l) => l.id !== id);

    if (activeLayerIndex >= layers.length) {
      activeLayerIndex = layers.length - 1;
    }

    render();
  }

  function saveDrawUndoState() {
    const activeLayer = layers[activeLayerIndex];
    if (!activeLayer) return;

    while (undoStack.length >= MAX_UNDO) {
      undoStack.shift();
    }

    undoStack.push({
      type: "draw",
      layerId: activeLayer.id,
      snapshot: activeLayer.ctx.getImageData(
        0,
        0,
        viewCanvas.width,
        viewCanvas.height,
      ),
    });

    redoStack.length = 0; // clear in js lmao
  }

  function undo() {
    const action = undoStack.pop();
    if (!action) return;

    if (action.type === "draw") {
      const targetLayer = layers.find((l) => l.id === action.layerId);
      if (!targetLayer) return;

      redoStack.push({
        type: "draw",
        layerId: targetLayer.id,
        snapshot: targetLayer.ctx.getImageData(
          0,
          0,
          viewCanvas.width,
          viewCanvas.height,
        ),
      });

      targetLayer.ctx.putImageData(action.snapshot, 0, 0);
    } else if (action.type === "delete_layer") {
      layers.splice(action.index, 0, action.layer);

      activeLayerIndex = action.index;

      redoStack.push({
        type: "delete_layer",
        layerId: action.layerId,
        index: action.index,
        layer: action.layer,
      });
    }

    render();
  }

  function redo() {
    const action = redoStack.pop();
    if (!action) return;

    if (action.type === "draw") {
      const targetLayer = layers.find((l) => l.id === action.layerId);
      if (!targetLayer) return;

      undoStack.push({
        type: "draw",
        layerId: targetLayer.id,
        snapshot: targetLayer.ctx.getImageData(
          0,
          0,
          viewCanvas.width,
          viewCanvas.height,
        ),
      });

      targetLayer.ctx.putImageData(action.snapshot, 0, 0);
    } else if (action.type === "delete_layer") {
      const index = layers.findIndex((l) => l.id === action.layerId);
      if (index !== -1) {
        const removedLayer = layers[index];
        undoStack.push({
          type: "delete_layer",
          layerId: removedLayer.id,
          layer: removedLayer,
          index: index,
        });
        layers = layers.filter((l) => l.id !== action.layerId);
      }
    }

    render();
  }

  function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
    render();
  }

  function pointerToCanvasCoords(e: PointerEvent): { x: number; y: number } {
    const rect = viewCanvas.getBoundingClientRect();

    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    return {
      x: (sx - panX) / zoom,
      y: (sy - panY) / zoom,
    };
  }

  function toCanvasCoords(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - panX) / zoom,
      y: (sy - panY) / zoom,
    };
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = viewCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const oldZoom = zoom;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;

    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));

    // keep cursor position stable
    panX = mx - ((mx - panX) / oldZoom) * zoom;
    panY = my - ((my - panY) / oldZoom) * zoom;

    render();
  }

  function panStart(e: PointerEvent) {
    e.preventDefault();

    panning = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    viewCanvas.setPointerCapture(e.pointerId);
  }

  function panMove(e: PointerEvent) {
    if (!panning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    render();
  }

  function panEnd(e: PointerEvent) {
    panning = false;
    viewCanvas.releasePointerCapture(e.pointerId);
    render();
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button === 0) {
      start(e);
    } else if (e.button === 1) {
      panStart(e);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const { x, y } = pointerToCanvasCoords(e);
    cursorX = x;
    cursorY = y;
    showCursor = true;

    draw(e);
    panMove(e);
    render();
  }

  function handlePointerUp(e: PointerEvent) {
    if (e.button === 0) {
      end(e);
    } else if (e.button === 1) {
      panEnd(e);
    }
  }

  function handlePointerLeave(e: PointerEvent) {
    showCursor = false;
    // TODO: idk why not working
    end(e);
    render();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!winApi.isFocused()) {
      return;
    }

    if (e.ctrlKey && e.key === "z") {
      undo();
    } else if (e.ctrlKey && e.key === "Z") {
      redo();
    }
  }

  onMount(() => {
    viewCtx = viewCanvas.getContext("2d")!;

    let backgroundCtx = createLayer("Background", { locked: true }).ctx;
    backgroundCtx.fillStyle = "#ffffff";
    backgroundCtx.fillRect(0, 0, docWidth, docHeight);

    createLayer("Layer 1");
    activeLayerIndex = 1;

    winApi.on("resize", () => {
      resize();
    });

    render();
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="paint">
  <div class="toolbar">
    <select bind:value={tool}>
      <option value="brush">Brush</option>
      <option value="eraser">Eraser</option>
    </select>

    <input type="color" bind:value={color} style="min-width: 65px" />
    <button onclick={undo}>Undo</button>
    <button onclick={redo}>Redo</button>
    <input
      class="has-box-indicator"
      type="range"
      min="1"
      max="50"
      bind:value={size}
    />
    <button onclick={resetView}>Reset View</button>
  </div>

  <div class="container" bind:this={canvasContainer}>
    <canvas
      bind:this={viewCanvas}
      width={500}
      height={500}
      onwheel={handleWheel}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerleave={handlePointerLeave}
    ></canvas>
  </div>

  <div class="layers-panel">
    <button onclick={() => createLayer("New Layer")}>+ Add Layer</button>

    {#each layers as layer, i}
      <div
        class="layer-item
      {activeLayerIndex === i ? 'active' : ''} 
      {layer.locked ? 'locked' : ''}
      "
      >
        <input type="checkbox" bind:checked={layer.visible} onchange={render} />
        <button onclick={() => (layer.locked = !layer.locked)}>
          {layer.locked ? "locked" : "unlocked"}
        </button>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="name" onclick={() => selectLayer(layer.id)}>
          {layer.name}
        </span>

        <button onclick={() => deleteLayer(layer.id)}> Delete </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .paint {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .container {
    flex-grow: 1;
    overflow: hidden;
    position: relative;
    background: transparent;
    margin: 0.5rem;
  }

  canvas {
    border: 1px solid #444;
    touch-action: none;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .toolbar > * {
    flex-shrink: 0;
  }

  .locked span {
    color: #888;
    cursor: not-allowed;
  }

  .layer-item.active .name {
    font-weight: bold;
  }
</style>
