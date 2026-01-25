<script lang="ts">
  import { onMount, tick, type Snippet } from "svelte";
  import { contextMenuApi } from "./contextMenu";

  let menuElement: HTMLElement | null = $state(null);
  let visible = $state(false);
  let posX = $state(0);
  let posY = $state(0);
  let content: Snippet | null = $state(null);

  onMount(() => {
    contextMenuApi.show = show;
  });

  export async function show(e: MouseEvent, menuContent: Snippet) {
    e.preventDefault();
    e.stopPropagation();

    content = menuContent;
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
  }

  export function hide() {
    visible = false;
    content = null;
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

{#if visible && content}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={menuElement}
    class="context-menu"
    style="transform: translate({posX}px, {posY}px);"
    onclick={handleInsideClick}
    oncontextmenu={handleInsideClick}
  >
    <div class="menu-items">
      {@render content()}
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
