<script lang="ts">
  import { tick } from "svelte";
  import type { AppApi } from "../../core/app/api";
  import {
    fsApi,
    FsError,
    getPath,
    joinPath,
    type EntryType,
    type FsEntry,
  } from "../../core/fs/filesystem";
  import { randint, sleep } from "../../core/utils";
  import type { WindowApi } from "../../core/wm/wm.svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  type CreatingData = {
    mode: "creating";
    type: EntryType;
    name: string;
  };

  let cwd: string[] = $state([]);
  let entries: FsEntry[] = $state([]);
  let error: string | null = $state(null);
  let loading: boolean = $state(false);
  let editing: CreatingData | null = $state(null);
  let editingInput: HTMLInputElement | null = $state(null);

  let selectedFile: string | null = null;

  async function refresh() {
    error = null;
    loading = true;
    let currEntries;
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

  async function openEntry(entry: FsEntry) {
    if (entry.type === "dir") {
      // TODO: error here
      cwd = (await getPath(entry)) ?? cwd;
      selectedFile = null;
      await refresh();
    } else {
      console.log(`XDG_OPEN ${joinPath((await getPath(entry)) ?? [])}`);
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

  async function commitEdits() {
    if (editing === null) {
      return;
    }

    const name = editing.name;
    const mode = editing.mode;
    const type = editing.type;
    editing = null;

    if (mode === "creating") {
      if (type === "file") {
        let filepath = [...cwd];
        filepath.push(name);
        let entry = await fsApi.writeFile(filepath, { data: new Blob() });
        entries.push(entry);
      } else if (type === "dir") {
        let dirpath = [...cwd];
        dirpath.push(name);
        let entry = await fsApi.mkdir(dirpath);
        entries.push(entry);
      }
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

  refresh();
</script>

<div class="explorer">
  <div class="toolbar">
    <button onclick={goUp}>^</button>
    <button onclick={createFolder}>New Folder</button>
    <button onclick={createFile}>New File</button>
  </div>

  <div class="pathbar">{api.fs.joinPath(cwd)}</div>

  {#if error}
    <div>{error}</div>
  {:else}
    <div class="list">
      {#each entries as entry}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="entry {entry.type === 'dir' ? 'direntry' : 'fileentry'}"
          ondblclick={() => {
            openEntry(entry);
          }}
        >
          <span class="icon">{entry.type === "dir" ? "(dir)" : "(file)"} </span>
          <span class="name"> {entry.name}</span>
        </div>
      {/each}

      {#if editing?.mode === "creating"}
        <div class="entry {editing.type === 'dir' ? 'direntry' : 'fileentry'}">
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
</div>

<style>
  .list {
    margin-top: 0.5rem;
  }

  .entry {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    user-select: none;
  }

  .entry:hover {
    background: #d4d4d4;
  }

  .direntry {
    font-weight: bold;
  }
</style>
