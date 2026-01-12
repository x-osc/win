<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import type { DialogArgs } from "./dialog";

  let {
    api,
    winApi,
    args,
  }: {
    api: AppApi;
    winApi: WindowApi;
    args?: DialogArgs;
  } = $props();

  // svelte-ignore state_referenced_locally
  let message = args?.message ?? "\xa0"; // nbsp
  // svelte-ignore state_referenced_locally
  let buttons = args?.buttons ?? ["cancel", "ok"];

  function handleKeyPress() {}
</script>

<svelte:window onkeypress={handleKeyPress} />

<div class="dialog">
  <div class="main">
    <div class="message">{message}</div>
  </div>
  <div class="buttons">
    {#each buttons as button, i}
      <button
        onclick={() => {
          api.quit({ code: i });
        }}
      >
        {button}
      </button>
    {/each}
  </div>
</div>

<style>
  .dialog {
    position: relative;
    height: 100%;

    display: flex;
    flex-direction: column;
  }

  .main {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
  }
</style>
