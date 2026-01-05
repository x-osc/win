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
  <div>{message}</div>
  <button onclick={handleCancel}>cancel</button>
  <button onclick={handleOk}>ok</button>
</div>

<style>
</style>
