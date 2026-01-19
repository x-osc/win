<script lang="ts">
  import { tick, type Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let menuElement: HTMLElement | null = $state(null);
  let visible = $state(false);
  let posX = $state(0);
  let posY = $state(0);

  export async function show(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    visible = true;
    await tick();

    if (!menuElement) return;

    const menuWidth = menuElement.offsetWidth;
    const menuHeight = menuElement.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (e.clientX + menuWidth > windowWidth) {
      posX = e.clientX - menuWidth;
    } else {
      posX = e.clientX;
    }

    if (e.clientY + menuHeight > windowHeight) {
      posY = e.clientY - menuHeight;
    } else {
      posY = e.clientY;
    }

    visible = true;
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
  onmousedowncapture={handleOutsideClick}
  oncontextmenucapture={handleOutsideClick}
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

<style>
  .context-menu {
    position: fixed;
    display: block;
    top: 0;
    left: 0;
  }
</style>
