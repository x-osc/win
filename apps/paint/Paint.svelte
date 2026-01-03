<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import type { WindowApi } from "@core/wm/wm.svelte";
  import { onMount } from "svelte";

  let { appApi, winApi }: { appApi: AppApi; winApi: WindowApi } = $props();

  let viewCanvas: HTMLCanvasElement;
  let viewCtx: CanvasRenderingContext2D;

  let bufferCanvas: HTMLCanvasElement;
  let bufferCtx: CanvasRenderingContext2D;

  let drawing = false;
  let startX = 0;
  let startY = 0;

  let undoStack: ImageData[] = [];
  let redoStack: ImageData[] = [];

  const MAX_UNDO = 100;

  let zoom = 1;
  let panX = 0;
  let panY = 0;

  let panning = false;
  let panStartX = 0;
  let panStartY = 0;

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 8;

  let color = $state("#000000");
  let size = $state(6);
  let tool: "brush" | "eraser" = $state("brush");

  function render() {
    viewCtx.setTransform(1, 0, 0, 1, 0, 0);
    viewCtx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);

    viewCtx.setTransform(zoom, 0, 0, zoom, panX, panY);
    // TODO: no more exclamation mark
    viewCtx.drawImage(bufferCanvas!, 0, 0);
  }

  function start(e: PointerEvent) {
    drawing = true;
    saveUndoState();

    const { x, y } = pointerToCanvasCoords(e);
    startX = x;
    startY = y;

    bufferCtx.beginPath();
    bufferCtx.moveTo(x, y);

    viewCanvas.setPointerCapture(e.pointerId);

    draw(e);
  }

  function draw(e: PointerEvent) {
    if (!drawing) return;

    const { x, y } = pointerToCanvasCoords(e);

    bufferCtx.lineWidth = size;
    bufferCtx.lineCap = "round";

    if (tool === "eraser") {
      bufferCtx.globalCompositeOperation = "destination-out";
      bufferCtx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      bufferCtx.globalCompositeOperation = "source-over";
      bufferCtx.strokeStyle = color;
    }

    bufferCtx.lineTo(x, y);
    bufferCtx.stroke();
    bufferCtx.beginPath();
    bufferCtx.moveTo(x, y);

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

    bufferCtx.beginPath();
    render();
  }

  function drawDot(x: number, y: number) {
    bufferCtx.save();

    if (tool === "eraser") {
      bufferCtx.globalCompositeOperation = "destination-out";
    } else {
      bufferCtx.globalCompositeOperation = "source-over";
      bufferCtx.fillStyle = color;
    }

    bufferCtx.beginPath();
    bufferCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    bufferCtx.fill();

    bufferCtx.restore();
  }

  function saveUndoState() {
    while (undoStack.length >= MAX_UNDO) {
      undoStack.shift();
    }

    undoStack.push(
      bufferCtx.getImageData(0, 0, viewCanvas.width, viewCanvas.height)
    );
    redoStack.length = 0; // clear in js lmao
  }

  function undo() {
    if (undoStack.length === 0) {
      return;
    }

    redoStack.push(
      bufferCtx.getImageData(0, 0, viewCanvas.width, viewCanvas.height)
    );

    bufferCtx.putImageData(undoStack.pop()!, 0, 0);

    render();
  }

  function redo() {
    if (redoStack.length === 0) {
      return;
    }

    undoStack.push(
      bufferCtx.getImageData(0, 0, viewCanvas.width, viewCanvas.height)
    );

    bufferCtx.putImageData(redoStack.pop()!, 0, 0);

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

    bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = viewCanvas.width;
    bufferCanvas.height = viewCanvas.height;
    bufferCtx = bufferCanvas.getContext("2d")!;

    render();
  });
</script>

<div class="toolbar">
  <select bind:value={tool}>
    <option value="brush">Brush</option>
    <option value="eraser">Eraser</option>
  </select>

  <input type="color" bind:value={color} style="min-width: 65px" />
  <button onclick={undo}>Undo</button>
  <button onclick={redo}>Redo</button>
  <input type="range" min="1" max="50" bind:value={size} />
  <button onclick={resetView}>Reset View</button>
</div>

<svelte:window onkeydown={handleKeyDown} />

<canvas
  bind:this={viewCanvas}
  width={1000}
  height={1000}
  onwheel={handleWheel}
  onpointerdown={(e) => {
    if (e.button === 0) {
      start(e);
    } else if (e.button === 1) {
      panStart(e);
    }
  }}
  onpointermove={(e) => {
    draw(e);
    panMove(e);
  }}
  onpointerup={(e) => {
    if (e.button === 0) {
      end(e);
    } else if (e.button === 1) {
      panEnd(e);
    }
  }}
  onpointerleave={(e) => {
    if (e.button === 0) {
      end(e);
    } else if (e.button === 1) {
      panEnd(e);
    }
  }}
></canvas>

<style>
  canvas {
    border: 1px solid #444;
    touch-action: none;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>
