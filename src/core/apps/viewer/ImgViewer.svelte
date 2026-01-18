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

  const MIN_ZOOM = 0.15;
  const MAX_ZOOM = 100;

  onMount(async () => {
    if (args?.path) {
      await openFile(args.path);
    }
  });

  function updateDims() {
    if (!imgElement || !viewerElement) return;
    imgWidth = imgElement.naturalWidth;
    imgHeight = imgElement.naturalHeight;
    containerWidth = viewerElement.clientWidth;
    containerHeight = viewerElement.clientHeight;
  }

  function fitImage() {
    const ratio = Math.min(
      containerWidth / imgWidth,
      containerHeight / imgHeight,
    );

    zoom = ratio;
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
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));

    panX = mx - (mx - panX) * (zoom / oldZoom);
    panY = my - (my - panY) * (zoom / oldZoom);
  }

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
  }

  function handleMouseUp() {
    isDragging = false;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="viewer"
  bind:this={viewerElement}
  onwheel={handleWheel}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseUp}
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
