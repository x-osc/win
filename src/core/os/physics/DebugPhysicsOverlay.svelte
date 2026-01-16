<script lang="ts">
  import { onMount } from "svelte";
  import { setupDebugRender, startDebugRender } from "./physics";

  let container: HTMLDivElement;
  let { show }: { show: boolean } = $props();
  let fps = $state(0);
  let prevTime = 0;

  onMount(() => {
    setupDebugRender(container);
    startDebugRender();
    requestAnimationFrame(render);
  });

  function render(time: number) {
    time *= 0.001;
    const deltaTime = time - prevTime;
    prevTime = time;
    fps = 1 / deltaTime;

    requestAnimationFrame(render);
  }
</script>

<div style={show ? "" : "display: none"} class="fps">
  fps: {fps.toFixed(2)}
</div>

<div
  style={show ? "" : "display: none"}
  bind:this={container}
  class="physics-overlay"
></div>

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
