<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let drawing = false;

  let color = "#000000";
  let size = 6;
  let tool: "brush" | "eraser" = "brush";

  function start(e: PointerEvent) {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    draw(e);
  }

  function end(e: PointerEvent) {
    drawing = false;
    ctx.beginPath();
    canvas.releasePointerCapture(e.pointerId);
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

  <input type="color" bind:value={color} />
  <input type="range" min="1" max="50" bind:value={size} />
</div>

<canvas
  bind:this={canvas}
  width={300}
  height={300}
  on:pointerdown={start}
  on:pointermove={draw}
  on:pointerup={end}
  on:pointerleave={end}
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
