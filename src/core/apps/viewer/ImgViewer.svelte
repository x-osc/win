<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { AppArgs } from "@os/app/app";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  let {
    api,
    winApi,
    args,
  }: { api: AppApi; winApi: WindowApi; args?: AppArgs } = $props();

  let imgElement: HTMLImageElement;
  let viewerElement: HTMLElement;
  let imgUrl: string = $state("");

  let imgWidth = 0;
  let imgHeight = 0;
  let containerWidth = 0;
  let containerHeight = 0;

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let startPanX = $state(0);
  let startPanY = $state(0);
  let isDragging = $state(false);

  let minZoom = $state(1);
  const MAX_ZOOM = 100;

  // svelte-ignore state_referenced_locally
  winApi.on("resize", () => {
    let fullyZoomedOut = zoom === minZoom;
    updateDims();
    clampPan();
    if (zoom < minZoom || fullyZoomedOut) {
      fitImage();
    }
  });

  onMount(async () => {
    if (!args?.path) {
      let procApi = api.launchApp("explorer", { dialogType: "fileonly" });
      procApi?.on("exit", (result) => {
        if (!result?.selectedEntry) {
          api.quit();
          return;
        }

        openFile(result.selectedEntry);
      });

      return;
    }

    await openFile(args?.path);
  });

  function updateDims() {
    if (!imgElement || !viewerElement) return;
    imgWidth = imgElement.naturalWidth;
    imgHeight = imgElement.naturalHeight;
    containerWidth = viewerElement.clientWidth;
    containerHeight = viewerElement.clientHeight;

    minZoom = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
  }

  function fitImage() {
    zoom = minZoom;
    panX = 0;
    panY = 0;
  }

  async function openFile(path: string[]) {
    const content = await api.fs.readFile(path);
    const url = URL.createObjectURL(content.data);
    imgUrl = url;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = viewerElement.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const oldZoom = zoom;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoom = Math.min(MAX_ZOOM, Math.max(minZoom, zoom * factor));

    panX = mx - (mx - panX) * (zoom / oldZoom);
    panY = my - (my - panY) * (zoom / oldZoom);

    clampPan();
  }

  function clampPan() {
    const scaledWidth = imgWidth * zoom;
    const scaledHeight = imgHeight * zoom;

    const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);

    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
  }

  function handleMouseDown(e: PointerEvent) {
    viewerElement.setPointerCapture(e.pointerId);

    isDragging = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  }

  function handleMouseMove(e: PointerEvent) {
    if (!isDragging) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;

    clampPan();
  }

  function handleMouseUp(e: PointerEvent) {
    isDragging = false;

    viewerElement.releasePointerCapture(e.pointerId);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="viewer"
  bind:this={viewerElement}
  onwheel={handleWheel}
  onpointerdown={handleMouseDown}
  onpointermove={handleMouseMove}
  onpointerup={handleMouseUp}
  onpointercancel={handleMouseUp}
  ondragstartcapture={(e) => e.preventDefault()}
>
  <div
    class="container"
    style="transform: translate({panX}px, {panY}px) scale({zoom});"
  >
    <!-- svelte-ignore a11y_missing_attribute -->
    <img
      bind:this={imgElement}
      src={imgUrl}
      onload={() => {
        updateDims();
        fitImage();
      }}
      draggable="false"
    />
  </div>
</div>

<style>
  .viewer {
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .viewer:active {
    cursor: grabbing;
  }

  img {
    max-width: none;
    user-select: none;
  }
</style>
