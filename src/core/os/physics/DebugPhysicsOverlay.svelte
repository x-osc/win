<script lang="ts">
  import { Box } from "planck";
  import { onMount } from "svelte";
  import { world } from "./physics";

  let { show }: { show: boolean } = $props();

  let fps = $state(0);
  let prevTime = 0;

  let debugCtx: CanvasRenderingContext2D | null = null;
  let debugCanvas: HTMLCanvasElement;
  let isRendering = false;

  onMount(() => {
    requestAnimationFrame(renderFps);

    setupDebugRender();
    startDebugRender();
  });

  function renderFps(time: number) {
    time *= 0.001;
    const deltaTime = time - prevTime;
    prevTime = time;
    fps = 1 / deltaTime;

    requestAnimationFrame(renderFps);
  }

  function setupDebugRender() {
    debugCanvas.width = window.innerWidth;
    debugCanvas.height = window.innerHeight;
    debugCtx = debugCanvas.getContext("2d");
  }

  function startDebugRender() {
    isRendering = true;
    requestAnimationFrame(drawDebug);
  }

  function stopDebugRender() {
    isRendering = false;
  }

  function drawDebug() {
    if (!isRendering || !debugCtx || !debugCanvas) return;

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    debugCtx.strokeStyle = "#00ff00";
    debugCtx.lineWidth = 2;

    for (let body = world.getBodyList(); body; body = body.getNext()) {
      const pos = body.getPosition();
      const angle = body.getAngle();

      debugCtx.save();
      debugCtx.translate(pos.x, pos.y);
      debugCtx.rotate(angle);

      for (
        let fixture = body.getFixtureList();
        fixture;
        fixture = fixture.getNext()
      ) {
        const shape = fixture.getShape();

        if (shape instanceof Box) {
          const vertices = shape.m_vertices;
          debugCtx.beginPath();
          debugCtx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertices.length; i++) {
            debugCtx.lineTo(vertices[i].x, vertices[i].y);
          }
          debugCtx.closePath();
          debugCtx.stroke();
        }
      }
      debugCtx.restore();
    }

    requestAnimationFrame(drawDebug);
  }
</script>

<div style={show ? "" : "display: none"} class="fps">
  fps: {fps.toFixed(2)}
</div>

<div style={show ? "" : "display: none"} class="physics-overlay">
  <canvas bind:this={debugCanvas}></canvas>
</div>

<style>
  .fps {
    position: fixed;
    top: 100px;
  }

  .physics-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.5;
  }
</style>
