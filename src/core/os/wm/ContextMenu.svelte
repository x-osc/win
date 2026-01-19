<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let menuElement: HTMLElement | null = $state(null);
  let visible = $state(false);
  let posX = $state(0);
  let posY = $state(0);

  export function show(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    visible = true;
    posX = e.clientX;
    posY = e.clientY;
  }

  export function hide() {
    visible = false;
  }

  function handleOutsideClick(e: MouseEvent) {
    if (visible && !menuElement?.contains(e.target as Node)) {
      hide();
    }
  }

  function handleInsideClick(e: MouseEvent) {
    if (visible) {
      hide();
    }
  }
</script>

<svelte:window
  onclick={handleOutsideClick}
  oncontextmenu={handleOutsideClick}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if visible}
  <div
    bind:this={menuElement}
    class="context-menu"
    style="transform: translate({posX}px, {posY}px);"
    onclick={handleInsideClick}
    oncontextmenu={handleInsideClick}
  >
    <div class="menu-items">
      {@render children()}
    </div>
  </div>
{/if}
