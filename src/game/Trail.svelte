<script lang="ts">
  import { type Win } from "@core/wm/wm.svelte";
  import rasterizeHTML from "rasterizeHTML";
  import { onMount, tick } from "svelte";

  // TODO: fix z-index

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let winEl: HTMLElement;

  let currentCapture: HTMLCanvasElement | null = null;

  let isCapturing = false;

  let sourceX = 0;
  let sourceY = 0;

  const captureInterval = 10;
  const refreshInterval = 3200;
  let lastRefreshTime = 0;
  let lastCaptureTime = 0;

  let { win }: { win: Win } = $props();

  onMount(async () => {
    ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    win.callbacks.on("move", handleMove);
    win.callbacks.on("focus", handleFocus);
    win.callbacks.on("resize", handleResize);

    await tick();

    winEl = win.api?.getWindowElement()!;
    screenshot();
  });

  async function screenshot(): Promise<HTMLCanvasElement | null> {
    if (isCapturing) {
      return null;
    }

    console.log("screenshoting");

    isCapturing = true;

    let img = document.createElement("canvas");
    img.width = window.innerWidth;
    img.height = window.innerHeight;

    const clone = winEl.cloneNode(true) as HTMLElement;

    const elements = [clone, ...clone.querySelectorAll("*")];
    const origElements = [winEl, ...winEl.querySelectorAll("*")];

    // most jank thing ever but like.. it works
    elements.forEach((el, i) => {
      const computed = window.getComputedStyle(origElements[i]);
      let styleStr = "";
      for (let prop of computed) {
        styleStr += `${prop}:${computed.getPropertyValue(prop)};`;
      }
      el.setAttribute("style", styleStr);
    });

    clone.style.position = "absolute";
    clone.style.left = "0px";
    clone.style.top = "0px";
    clone.style.right = "auto";
    clone.style.bottom = "auto";

    // console.log(clone.outerHTML);

    await rasterizeHTML.drawHTML(clone.outerHTML, img, {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    sourceX = win.data.x;
    sourceY = win.data.y;

    currentCapture = img;

    // console.log(img.toDataURL());

    isCapturing = false;

    return img;
  }

  export async function drawImage() {
    let rect = winEl.getBoundingClientRect();

    const capture = currentCapture ?? (await screenshot());
    if (capture === null) {
      return;
    }

    ctx.drawImage(
      capture,
      0,
      0,
      rect.width,
      rect.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
  }

  function handleMove(x: number, y: number) {
    const now = Date.now();
    if (now - lastCaptureTime > captureInterval) {
      lastCaptureTime = now;
      drawImage();
    }

    if (now - lastRefreshTime > refreshInterval) {
      lastRefreshTime = now;
      screenshot();
    }
  }

  function handleFocus() {}

  function handleResize() {
    currentCapture = null;
  }

  function handleCanvasResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
</script>

<svelte:window onresize={handleCanvasResize} />

<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: block;
    pointer-events: none;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>
