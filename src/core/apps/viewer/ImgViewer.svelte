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

  let imgUrl: string = $state("");

  onMount(async () => {
    if (args?.path) {
      await openFile(args.path);
    }
  });

  async function openFile(path: string[]) {
    const content = await api.fs.readFile(path);
    const url = URL.createObjectURL(content.data);
    imgUrl = url;
  }
</script>

<div class="viewer">
  <div class="viewer-content">
    <!-- svelte-ignore a11y_missing_attribute -->
    <img src={imgUrl} />
  </div>
</div>

<style>
  .viewer {
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;
  }

  .viewer-content {
    transform-origin: 0 0;
    cursor: inherit;
  }
</style>
