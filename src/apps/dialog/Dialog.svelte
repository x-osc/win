<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import type { WindowApi } from "@core/wm/wm.svelte";
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

  function handleKeyPress() {}

  function handleCancel() {
    api.quit({ code: 0 });
  }

  function handleOk() {
    api.quit({ code: 1 });
  }
</script>

<svelte:window onkeypress={handleKeyPress} />

<div class="dialog">
  <div class="main">
    <div class="message">{message}</div>
  </div>
  <div class="buttons">
    <button onclick={handleCancel}>cancel</button>
    <button onclick={handleOk}>ok</button>
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
