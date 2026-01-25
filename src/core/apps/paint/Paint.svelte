<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import { HistoryManager } from "./history";
  import { LayerManager } from "./layers.svelte";
  import { toolLibrary, type ToolId } from "./tools";

  let { api: api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let viewCanvas: HTMLCanvasElement;
  let viewCtx: CanvasRenderingContext2D;

  let docWidth = 300;
  let docHeight = 300;

  let layerm = new LayerManager(docWidth, docHeight, render);
  let activeLayer = $derived(layerm.getActiveLayer());
  let activeCtx = $derived(layerm.getActiveLayer().ctx);

  let history = new HistoryManager(50);
  let snapshotBeforeDraw: ImageData | null = null;

  let canvasContainer: HTMLElement | null = null;
  let canvasWidth = 300;
  let canvasHeight = 300;

  let cursorX = 0;
  let cursorY = 0;
  let showCursor = false;

  let drawing = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

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
  let toolId: ToolId = $state("brush");
  let tool = $derived(toolLibrary[toolId]);

  function render() {
    viewCtx.setTransform(1, 0, 0, 1, 0, 0);
    viewCtx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);

    // if (zoom > 12) {
    viewCtx.imageSmoothingEnabled = false;
    // } else {
    //   viewCtx.imageSmoothingEnabled = true;
    // }

    viewCtx.setTransform(zoom, 0, 0, zoom, panX, panY);

    for (const layer of layerm.getLayers()) {
      if (layer.visible) {
        viewCtx.drawImage(layer.canvas, 0, 0);
      }
    }

    if (zoom > 12) {
      drawPixelGrid();
    }

    if (showCursor && !panning) {
      viewCtx.save();
      tool.drawCursor({
        ctx: viewCtx,
        x: cursorX,
        y: cursorY,
        size,
        zoom,
      });
      viewCtx.restore();
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
    snapshotBeforeDraw = activeCtx.getImageData(0, 0, docWidth, docHeight);

    const { x, y } = pointerToCanvasCoords(e);
    startX = x;
    startY = y;
    lastX = x;
    lastY = y;

    viewCanvas.setPointerCapture(e.pointerId);

    activeCtx.save();

    draw(e);
  }

  function draw(e: PointerEvent) {
    if (!drawing) return;

    const { x, y } = pointerToCanvasCoords(e);

    activeCtx.save();
    activeCtx.restore();

    tool.draw({
      ctx: activeCtx,
      color,
      size,
      lastX,
      lastY,
      x,
      y,
    });

    lastX = x;
    lastY = y;

    render();
  }

  function end(e: PointerEvent) {
    if (!drawing) return;
    drawing = false;
    activeCtx.restore();
    viewCanvas.releasePointerCapture(e.pointerId);

    if (snapshotBeforeDraw) {
      const oldData = snapshotBeforeDraw;
      const newData = activeCtx.getImageData(0, 0, docWidth, docHeight);
      const layerId = activeLayer.id;

      history.push({
        name: "Brush Stroke",
        do: () => {
          const layer = layerm.layers.find((l) => l.id === layerId);
          layer?.ctx.putImageData(newData, 0, 0);
          render();
        },
        undo: () => {
          const layer = layerm.layers.find((l) => l.id === layerId);
          layer?.ctx.putImageData(oldData, 0, 0);
          render();
        },
      });
    }

    render();
  }

  function undo() {
    history.undo();
  }

  function redo() {
    history.redo();
  }

  function deleteLayer(id: string) {
    const index = layerm.layers.findIndex((l) => l.id === id);
    const layer = layerm.layers[index];
    if (!layer || layer.locked) return;

    history.execute({
      name: `Delete ${layer.name}`,
      do: () => {
        layerm.layers = layerm.layers.filter((l) => l.id !== id);
        if (layerm.activeIndex >= layerm.layers.length) {
          layerm.activeIndex = layerm.layers.length - 1;
        }
        render();
      },
      undo: () => {
        layerm.layers.splice(index, 0, layer);
        layerm.activeIndex = index;
        render();
      },
    });
  }

  function addLayer(name: string) {
    let newLayer = layerm.makeLayer(name);

    history.execute({
      name: "Add Layer",
      do: () => {
        layerm.layers.push(newLayer);
        layerm.activeIndex = layerm.layers.length - 1;
      },
      undo: () => {
        layerm.layers = layerm.layers.filter((l) => l.id !== newLayer.id);
        layerm.activeIndex = Math.max(0, layerm.layers.length - 1);
      },
    });
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

    let backgroundCtx = layerm.addLayer("Background", {
      locked: true,
    }).ctx;
    backgroundCtx.fillStyle = "#ffffff";
    backgroundCtx.fillRect(0, 0, docWidth, docHeight);

    layerm.addLayer("Layer 1");
    layerm.activeIndex = 1;

    winApi.on("resize", () => {
      resize();
    });

    render();
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="paint">
  <div class="toolbar">
    <select bind:value={toolId}>
      <option value="brush">Brush</option>
      <option value="eraser">Eraser</option>
      <option value="pencil">Pencil</option>
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
    <button onclick={() => addLayer("New Layer")}>+ Add Layer</button>

    {#each layerm.layers as layer, i}
      <div
        class="layer-item
      {layerm.activeIndex === i ? 'active' : ''} 
      {layer.locked ? 'locked' : ''}
      "
      >
        <input type="checkbox" bind:checked={layer.visible} onchange={render} />
        <button onclick={() => (layer.locked = !layer.locked)}>
          {layer.locked ? "locked" : "unlocked"}
        </button>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="name" onclick={() => layerm.selectLayer(layer.id)}>
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
