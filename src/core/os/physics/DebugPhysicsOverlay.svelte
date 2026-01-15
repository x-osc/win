<script lang="ts">
  import { onMount } from "svelte";
  import { setupDebugRender, startDebugRender } from "./physics";

  let container: HTMLDivElement;
  let { show }: { show: boolean } = $props();

  onMount(() => {
    setupDebugRender(container);
    startDebugRender();
  });
</script>

<div
  style={show ? "" : "display: none"}
  bind:this={container}
  class="physics-overlay"
></div>

<style>
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
