<script lang="ts">
  import { randint, sleep } from "@lib/core/utils/utils";
  import { wmApi } from "@os/wm/wm.svelte";
  import { drawHTML } from "rasterizehtml";
  import { onMount, tick } from "svelte";

  // TODO: fix z-index

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let trails: Map<number, TrailData> = new Map();

  type TrailData = {
    id: number;
    element: HTMLElement;
    currentCapture: HTMLCanvasElement | null;
    isCapturing: boolean;
    lastRefreshTime: number;
    lastCaptureTime: number;
  };

  let isDoneMountWindows = false;

  const captureInterval = 10;
  const refreshInterval = 3200 + 400 * wmApi.getWindows().size;

  onMount(async () => {
    ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    wmApi.on("anymoved", (id, x, y) => handleMove(id, x, y));
    wmApi.on("anyfocused", (id) => handleFocus(id));
    wmApi.on("anyresized", (id, width, height) =>
      handleResize(id, width, height),
    );
    wmApi.on("anymounted", (id) => handleMount(id));

    await tick();

    for (const [id, win] of wmApi.getWindows().entries()) {
      if (win.api === null) return;

      trails.set(id, {
        id,
        element: win.api.getWindowElement(),
        currentCapture: null,
        isCapturing: false,
        lastRefreshTime: Date.now() + refreshInterval,
        lastCaptureTime: Date.now(),
      });
    }

    for (const data of trails.values()) {
      await screenshot(data);
      await sleep(4 + wmApi.getWindows().size);
    }

    isDoneMountWindows = true;
  });

  async function screenshot(
    data: TrailData,
  ): Promise<HTMLCanvasElement | null> {
    if (data.isCapturing) {
      return null;
    }

    let win = wmApi.getWindows().get(data.id);

    data.isCapturing = false;

    let img = document.createElement("canvas");
    img.width = win?.data.width ?? window.innerWidth;
    img.height = win?.data.height ?? window.innerHeight;

    const clone = data.element.cloneNode(true) as HTMLElement;

    const elements = [clone, ...clone.querySelectorAll("*")];
    const origElements = [data.element, ...data.element.querySelectorAll("*")];

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
    clone.style.transform = "";
    clone.style.right = "auto";
    clone.style.bottom = "auto";

    // console.log(clone.outerHTML);

    await drawHTML(clone.outerHTML, img, {
      width: win?.data.width ?? window.innerWidth,
      height: win?.data.height ?? window.innerHeight,
    });

    data.currentCapture = img;

    console.log(img.toDataURL());

    data.isCapturing = false;

    return img;
  }

  export async function drawImage(data: TrailData) {
    let win = wmApi.getWindows().get(data.id);
    if (!win) return;

    const { x, y, width, height, rotation } = win.data;
    const capture = data.currentCapture ?? (await screenshot(data));
    if (capture === null) return;

    ctx.save();

    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);

    ctx.drawImage(
      capture,
      0,
      0,
      width,
      height,
      -width / 2,
      -height / 2,
      width,
      height,
    );

    ctx.restore();
  }

  function handleMount(id: number) {
    let win = wmApi.getWindows().get(id)!;

    let data = {
      id,
      element: win.api!.getWindowElement(),
      currentCapture: null,
      isCapturing: false,
      lastRefreshTime: Date.now() + refreshInterval,
      lastCaptureTime: Date.now(),
    };

    trails.set(id, data);

    screenshot(data);
  }

  function handleMove(id: number, x: number, y: number) {
    if (!isDoneMountWindows) return;

    let data = trails.get(id);
    if (data == undefined) {
      return;
    }

    const now = Date.now();
    if (now - data.lastCaptureTime > captureInterval) {
      data.lastCaptureTime = now;
      requestAnimationFrame(() => drawImage(data));
    }

    if (
      now - data.lastRefreshTime >
      refreshInterval + randint(1, refreshInterval)
    ) {
      data.lastRefreshTime = now;
      screenshot(data);
    }
  }

  function handleFocus(id: number) {}

  function handleResize(id: number, width: number, height: number) {
    let data = trails.get(id);
    if (data == undefined) {
      return;
    }

    data.currentCapture = null;
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
