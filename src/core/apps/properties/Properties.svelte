<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import { joinPath, type FileContent, type FsEntry } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import type { PropertiesArgs } from "./properties";

  let {
    api,
    winApi,
    args,
  }: { api: AppApi; winApi: WindowApi; args?: PropertiesArgs } = $props();

  let entry: FsEntry | null = $state(null);
  // svelte-ignore non_reactive_update
  let path: string[];
  let data: FileContent | null = null;

  onMount(async () => {
    if (!args?.path) {
      api.quit();
      return;
    }

    let gotentry = await api.fs.getEntry(args.path);
    if (!gotentry) {
      api.quit();
      return;
    }

    entry = gotentry;
    path = args.path;

    if (entry.type === "file") {
      data = await api.fs.readFile(path);
    }
  });
</script>

<div class="properties">
  {#if entry}
    <div class="name">{entry.name}</div>
    <div class="type"></div>

    <hr />

    <div class="type"></div>
    <div class="location">
      {entry.type === "dir" ? joinPath(path) : joinPath(path, false)}
    </div>
    <div class="size">100KB</div>
  {/if}
</div>
