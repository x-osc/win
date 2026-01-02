<script lang="ts">
  import { onMount } from "svelte";
  import type { AppApi } from "../../core/app/api";
  import type { WindowApi } from "../../core/wm/wm.svelte";

  let { appApi, winApi }: { appApi: AppApi; winApi: WindowApi } = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let drawing = false;
  let startX = 0;
  let startY = 0;

  let undoStack: ImageData[] = [];
  let redoStack: ImageData[] = [];

  const MAX_UNDO = 100;

  let color = $state("#000000");
  let size = $state(6);
  let tool: "brush" | "eraser" = $state("brush");

  function start(e: PointerEvent) {
    drawing = true;
    saveUndoState();

    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    draw(e);
  }

  function draw(e: PointerEvent) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = size;
    ctx.lineCap = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function end(e: PointerEvent) {
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x === startX && y === startY) {
      drawDot(x, y);
    }

    ctx.beginPath();
  }

  function drawDot(x: number, y: number) {
    ctx.save();

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function saveUndoState() {
    while (undoStack.length >= MAX_UNDO) {
      undoStack.shift();
    }

    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack.length = 0; // clear in js lmao
  }

  function undo() {
    if (undoStack.length === 0) {
      return;
    }

    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    ctx.putImageData(undoStack.pop()!, 0, 0);
  }

  function redo() {
    if (redoStack.length === 0) {
      return;
    }

    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    ctx.putImageData(redoStack.pop()!, 0, 0);
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
    ctx = canvas.getContext("2d")!;
    ctx.lineJoin = "round";
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
</div>

<svelte:window onkeydown={handleKeyDown} />

<canvas
  bind:this={canvas}
  width={300}
  height={300}
  onpointerdown={start}
  onpointermove={draw}
  onpointerup={end}
  onpointerleave={end}
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
