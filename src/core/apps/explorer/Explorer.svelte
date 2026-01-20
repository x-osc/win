<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import { joinPath, type FsEntry } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import type { ExplorerArgs } from "./explorer";
  import { ExplorerState } from "./explorerState.svelte";

  let {
    api,
    winApi,
    args,
  }: {
    api: AppApi;
    winApi: WindowApi;
    args?: ExplorerArgs;
  } = $props();

  // svelte-ignore state_referenced_locally
  let dialogType = args?.dialogType ?? "none";
  let dialogMode: "none" | "open" | "save" = $state("none");

  if (dialogType === "none") {
    dialogMode = "none";
  } else if (dialogType === "dironly" || dialogType === "fileonly") {
    dialogMode = "open";
  } else if (dialogType === "save") {
    dialogMode = "save";
  }

  // svelte-ignore state_referenced_locally
  const fsc = new ExplorerState(api, ["user"]);

  onMount(async () => {
    if (args?.workingDir && (await api.fs.exists(args.workingDir))) {
      fsc.cwd = args.workingDir;
    }

    fsc.refresh();
  });

  function autofocus(node: HTMLInputElement) {
    node.focus();
  }

  function createFile() {
    fsc.startCreating("file");
  }

  function createDir() {
    fsc.startCreating("dir");
  }

  function handleCreatingKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      fsc.commitCreate();
    } else if (e.key === "Escape") {
      fsc.cancelEdits();
    }
  }

  function handleEntryClicked(e: MouseEvent, id: string) {
    fsc.handleSelect(id, e.ctrlKey, e.shiftKey);
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (!winApi.isFocused()) return;

    if (e.key === "Enter") {
      fsc.openSelected();
    }
  }

  async function handleDoubleClick(entry: FsEntry) {
    if (dialogType === "fileonly" && entry.type === "file") {
      api.quit({
        selectedEntry: await api.fs.getPath(entry),
      });
      return;
    }

    if (dialogType !== "none" && entry.type === "file") {
      return;
    }

    fsc.openEntry(entry);
  }

  async function handleDialogSelect() {
    if (!fsc.mainSelectedEntry) return;

    const entry = fsc.mainSelectedEntry;

    const isFile = entry.type === "file";
    const isDir = entry.type === "dir";

    if (isDir && (dialogType === "fileonly" || dialogType === "save")) {
      fsc.openEntry(entry);
      return;
    }

    if (dialogType === "dironly" && entry.type !== "dir") {
      return; // TODO: do smth here
    }

    if (dialogType === "save" && entry.type === "file") {
      const overwrite = await api.showDialog({
        message: `Overwrite file "${entry.name}"?`,
      });
      if (overwrite !== 1) return;
    }

    api.quit({
      selectedEntry: await api.fs.getPath(entry),
    });
  }

  function handleDialogCancel() {
    api.quit({ selectedEntry: null });
  }
</script>

<svelte:window onkeypress={handleKeyPress} />

<div class="explorer">
  <div class="toolbar">
    <button onclick={() => fsc.goUp()}>^</button>
    <button onclick={() => createDir()}>New Folder</button>
    <button onclick={() => createFile()}>New File</button>
    <button onclick={() => fsc.deleteSelected()}>Delete</button>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="pathbar">
    <span
      class="breadcrumb"
      style="padding-right: 2px;"
      onclick={() => fsc.navigate([])}
    >
      /
    </span>
    {#each fsc.breadcrumbs as part, i}
      <span
        class="breadcrumb"
        style={i === 0 ? "padding-left: 1px" : ""}
        onclick={() => fsc.navigate(part.path)}
      >
        {part.name} /
      </span>
    {/each}
  </div>

  {#if fsc.error}
    <div>{fsc.error}</div>
  {:else}
    <div class="list">
      {#each fsc.sortedEntries as entry (entry.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class={[
            "entry",
            entry.type === "dir" ? "direntry" : "fileentry",
            { selected: fsc.selectedIds.has(entry.id) },
            { "main-selected": fsc.mainSelectedId === entry.id },
          ]}
          onclick={(e: MouseEvent) => handleEntryClicked(e, entry.id)}
          ondblclick={(e: MouseEvent) => {
            if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
            handleDoubleClick(entry);
          }}
        >
          <span class="icon">{entry.type === "dir" ? "(dir)" : "(file)"} </span>
          <span class="name"> {entry.name}</span>
        </div>
      {/each}

      {#if fsc.editing?.mode === "creating"}
        <div
          class={[
            "entry",
            fsc.editing.type === "dir" ? "direntry" : "fileentry",
          ]}
        >
          <span class="icon">
            {fsc.editing.type === "dir" ? "(dir)" : "(file)"}
          </span>
          <input
            {@attach autofocus}
            bind:value={fsc.editing.name}
            onkeydown={handleCreatingKeyDown}
            onblur={() => fsc.cancelEdits()}
          />
        </div>
      {/if}
    </div>
  {/if}

  {#if dialogType !== "none"}
    <div class="dialogbar">
      <div class="dialogselected">
        {#await fsc.mainSelectedEntry ? api.fs.getPath(fsc.mainSelectedEntry) : null then path}
          {path ? joinPath(path) : ""}
        {/await}
      </div>
      <div class="dialogbuttons">
        <button onclick={handleDialogCancel}>cancel</button>
        <button onclick={handleDialogSelect}>
          {dialogMode === "save" ? "save" : "open"}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .toolbar {
    flex: 0 0 auto;
    margin-bottom: 5px;
  }

  .pathbar {
    margin-left: 3px;
    flex: 0 0 auto;
  }

  .breadcrumb {
    cursor: pointer;
    margin: 0;
    padding-left: 2px;
    padding-right: 5px;
  }

  .breadcrumb:hover {
    outline: 1px solid black;
  }

  .list {
    flex: 1 1 auto;
    overflow-y: auto;
    margin-top: 0.5rem;
  }

  .dialogbar {
    display: flex;
    flex: 0 0 auto;
    margin-top: auto;
  }

  .dialogselected {
    flex-grow: 1;
    margin-right: 1em;
  }

  /* .dialogbuttons {
    margin-left: auto;
  } */

  .entry {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    outline: 1px solid #eef4ff;
    outline-offset: -1px;
    user-select: none;
  }

  .entry:hover {
    background: #e9e9e9;
    outline: none;
  }

  .entry.selected {
    background: #cecece;
    outline: none;
  }

  .entry.main-selected {
    outline: 2px solid #bdbdbd;
    outline-offset: -2px;
  }

  .direntry {
    font-weight: bold;
  }
</style>
