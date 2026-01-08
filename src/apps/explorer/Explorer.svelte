<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import {
    fsApi,
    FsError,
    getPath,
    joinPath,
    type EntryType,
    type FsEntry,
  } from "@core/fs/filesystem";
  import { randint, sleep } from "@core/utils";
  import type { WindowApi } from "@core/wm/wm.svelte";
  import { onMount, tick } from "svelte";
  import type { ExplorerArgs } from "./explorer";

  let {
    api,
    winApi,
    args,
  }: {
    api: AppApi;
    winApi: WindowApi;
    args?: ExplorerArgs;
  } = $props();

  type CreatingData = {
    mode: "creating";
    type: EntryType;
    name: string;
  };

  // svelte-ignore state_referenced_locally
  let dialogType = args?.dialogType ?? "none";
  let dialogMode: "none" | "open" | "save" = $state("none");
  let isDialog = dialogType !== "none";

  if (dialogType === "none") {
    dialogMode = "none";
  } else if (
    dialogType === "both" ||
    dialogType === "dironly" ||
    dialogType === "fileonly"
  ) {
    dialogMode = "open";
  } else if (dialogType === "save") {
    dialogMode = "save";
  }

  let cwd: string[] = $state([]);
  let entries: FsEntry[] = $state([]);
  let error: string | null = $state(null);
  let loading: boolean = $state(false);
  let editing: CreatingData | null = $state(null);
  let editingInput: HTMLInputElement | null = $state(null);

  let mainSelectedEntry: string | null = $state(null);
  let mainSelectionPath: Promise<string[] | null> | null = $derived(
    mainSelectedEntry ? getPath(expGetEntry(mainSelectedEntry)) : null,
  );
  let selectedEntries: string[] = $state([]);

  onMount(async () => {
    if (args?.workingDir && (await api.fs.exists(args.workingDir))) {
      cwd = args.workingDir;
    }

    refresh();
  });

  async function refresh() {
    error = null;
    loading = true;
    let currEntries;

    clearSelection();

    try {
      currEntries = await api.fs.listDir(cwd);
      currEntries = sortEntries(currEntries);
      entries.length = 0;

      for (const entry of currEntries) {
        entries.push(entry);
        await sleep(randint(2, 3));
      }
    } catch (e) {
      if (e instanceof FsError) {
        error = e.message;
      } else {
        error = "an unknown error occured";
      }
    } finally {
      loading = false;
    }
  }

  function quickrefresh() {
    resort();
  }

  function resort() {
    entries = sortEntries(entries);
  }

  function sortEntries(entries: FsEntry[]): FsEntry[] {
    let newEntries = entries;

    newEntries.sort((a, b) => a.name.localeCompare(b.name));

    newEntries.sort((a, b) => {
      if (a.type === "dir" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "dir") return 1;
      return 0;
    });

    return newEntries;
  }

  function expGetEntry(id: string): FsEntry {
    let entry = entries.find((entry) => entry.id === id) ?? null;
    if (entry === null) {
      throw new Error(`uhoh entry ${id} missing from explorer`);
    }
    return entry;
  }

  function selectEntry(id: string) {
    if (selectedEntries.includes(id)) {
      return;
    }

    selectedEntries.push(id);
    mainSelectedEntry = id;
  }

  function deselectEntry(id: string) {
    if (!selectedEntries.includes(id)) {
      return;
    }

    selectedEntries = selectedEntries.filter((currId) => currId != id);
    if (mainSelectedEntry === id) {
      mainSelectedEntry = selectedEntries[selectedEntries.length - 1];
    }
  }

  function clearSelection() {
    selectedEntries.length = 0;
    mainSelectedEntry = null;
  }

  async function openEntry(entry: FsEntry) {
    if (entry.type === "dir") {
      // TODO: error here
      cwd = (await api.fs.getPath(entry)) ?? cwd;
      clearSelection();
      await refresh();
    } else {
      if (
        (dialogType === "fileonly" || dialogType === "both") &&
        entry.type === "file"
      ) {
        quitWithEntry(entry);
        return;
      }

      if (dialogType !== "none") {
        return;
      }

      console.log(`XDG_OPEN ${joinPath((await api.fs.getPath(entry)) ?? [])}`);
    }
  }

  async function goUp() {
    if (cwd.length === 0) {
      return;
    }
    cwd.pop();
    await refresh();
  }

  async function createFolder() {
    editing = { mode: "creating", type: "dir", name: "" };
    await tick();
    editingInput?.focus();
  }

  async function createFile() {
    editing = { mode: "creating", type: "file", name: "" };
    await tick();
    editingInput?.focus();
  }

  async function deleteFiles() {
    if (selectedEntries.length === 0) {
      return;
    }

    if (
      selectedEntries.length === 1 &&
      expGetEntry(selectedEntries[0]).type === "file"
    ) {
      let entry = expGetEntry(selectedEntries[0]);

      let code = await api.showDialog({
        message: `delete file '${joinPath((await api.fs.getPath(entry)) ?? [entry.name], false)}'?`,
      });

      if (code !== 1) {
        return;
      }

      clearSelection();

      let path = await getPath(entry);

      if (path === null) return;
      if (!(await api.fs.exists(path))) return;

      try {
        await api.fs.remove(path);
        entries = entries.filter((e) => e.id !== entry.id);
      } catch (err) {
        if (err instanceof FsError) {
          error = "an unexpected error occured: " + err.message;
        }
      }

      return;
    }

    let entriesToRemove: [string, string[]][] = [];
    let count = 0;

    for (const entryid of selectedEntries) {
      let entry = expGetEntry(entryid);
      let path = await api.fs.getPath(entry);
      if (path === null) continue;
      if (!(await api.fs.exists(path))) continue;

      entriesToRemove.push([entryid, path]);
      if (entry.type === "dir") {
        let files = await api.fs.listDirRecursive(path);
        count += files.length;
        count += 1;
      } else {
        count += 1;
      }
    }

    let code = await api.showDialog({ message: `delete ${count} entries?` });

    if (code !== 1) {
      return;
    }

    clearSelection();

    try {
      for (const [id, path] of entriesToRemove) {
        await api.fs.removeRecursive(path);
        entries = entries.filter((e) => e.id !== id);
      }
    } catch (err) {
      if (err instanceof FsError) {
        error = "an unexpected error occured: " + err.message;
      }
    }
  }

  async function commitEdits() {
    if (editing === null) {
      return;
    }

    const name = editing.name;
    const mode = editing.mode;
    const type = editing.type;

    if (mode === "creating") {
      if (type === "file") {
        let filepath = [...cwd];
        filepath.push(name);

        let entry = await fsApi.writeFile(filepath, { data: new Blob() });
        entries.push(entry);
        clearSelection();
        selectEntry(entry.id);
      } else if (type === "dir") {
        let dirpath = [...cwd];
        dirpath.push(name);

        let entry = await fsApi.mkdir(dirpath);
        entries.push(entry);
        clearSelection();
        selectEntry(entry.id);
      }

      editing = null;
    }

    quickrefresh();
  }

  function cancelEdits() {
    editing = null;
  }

  function handleEditingKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      commitEdits();
    } else if (e.key === "Escape") {
      cancelEdits();
    }
  }

  function handleEntryClicked(e: MouseEvent, entry: FsEntry) {
    const id = entry.id;

    if (e.ctrlKey) {
      // toggle selection
      if (selectedEntries.includes(id)) {
        deselectEntry(id);
      } else {
        selectEntry(id);
      }
    } else if (e.shiftKey) {
      if (mainSelectedEntry) {
        const mainIndex = entries.findIndex((e) => e.id === mainSelectedEntry);
        const currentIndex = entries.findIndex((e) => e.id === id);

        const start = Math.min(mainIndex, currentIndex);
        const end = Math.max(mainIndex, currentIndex);

        for (let i = start; i <= end; i++) {
          selectEntry(entries[i].id);
        }

        // dont change main selected
      }
    } else {
      // regular click
      selectedEntries.length = 0;
      selectedEntries.push(id);
      mainSelectedEntry = id;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (!winApi.isFocused()) {
      return;
    }

    if (editing !== null) {
      return;
    }

    if (e.key === "Enter") {
      if (mainSelectedEntry === null) {
        return;
      }
      let selectedEntry = expGetEntry(mainSelectedEntry);
      if (selectedEntry === null) {
        return;
      }

      openEntry(selectedEntry);
    }
  }

  function handleDialogCancel() {
    api.quit({ selectedEntry: null });
  }

  async function handleDialogSelect() {
    const id = mainSelectedEntry;
    if (!id) return;

    let entry = expGetEntry(id);
    const path = await api.fs.getPath(entry);
    if (!path) return;

    const isFile = entry.type === "file";
    const isDir = entry.type === "dir";

    if (isDir && dialogType === "fileonly") {
      openEntry(entry);
      return;
    }

    if (dialogType === "save" && entry.type !== "file") {
      openEntry(entry);
      return;
    }

    if (dialogType === "dironly" && entry.type !== "dir") {
      return; // TODO: do smth here
    }

    if (dialogType === "save" && entry.type === "file") {
      let content = await api.fs.getContent(entry.id);
      const hasContent = content && (await content?.data.text()) !== "";

      if (!hasContent) {
        quitWithEntry(entry);
        return;
      }

      // we have content
      let code = await api.showDialog({
        message: `overwrite file '${path ? joinPath(path, false) : entry.name}' ??`,
      });

      if (code === 1) {
        quitWithEntry(entry);
      }

      return;
    }

    quitWithEntry(entry);
  }

  async function quitWithEntry(entry: FsEntry) {
    api.quit({
      selectedEntry: await api.fs.getPath(entry),
    });
  }
</script>

<svelte:window onkeypress={handleKeyPress} />

<div class="explorer">
  <div class="toolbar">
    <button onclick={goUp}>^</button>
    <button onclick={createFolder}>New Folder</button>
    <button onclick={createFile}>New File</button>
    <button onclick={deleteFiles}>Delete</button>
  </div>

  <div class="pathbar">{api.fs.joinPath(cwd)}</div>

  {#if error}
    <div>{error}</div>
  {:else}
    <div class="list">
      {#each entries as entry}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class={[
            "entry",
            entry.type === "dir" ? "direntry" : "fileentry",
            { selected: selectedEntries.includes(entry.id) },
            { "main-selected": mainSelectedEntry === entry.id },
          ]}
          onclick={(e: MouseEvent) => {
            handleEntryClicked(e, entry);
          }}
          ondblclick={(e: MouseEvent) => {
            if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
            openEntry(entry);
          }}
        >
          <span class="icon">{entry.type === "dir" ? "(dir)" : "(file)"} </span>
          <span class="name"> {entry.name}</span>
        </div>
      {/each}

      {#if editing?.mode === "creating"}
        <div
          class={["entry", editing.type === "dir" ? "direntry" : "fileentry"]}
        >
          <span class="icon">
            {editing.type === "dir" ? "(dir)" : "(file)"}
          </span>
          <input
            bind:this={editingInput}
            bind:value={editing.name}
            onkeydown={handleEditingKeyDown}
            onblur={cancelEdits}
          />
        </div>
      {/if}
    </div>
  {/if}

  {#if isDialog}
    <div class="dialogbar">
      <div class="dialogselected">
        {#await mainSelectionPath then path}
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
  }

  .pathbar {
    flex: 0 0 auto;
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
