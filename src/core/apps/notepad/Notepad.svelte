<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { AppArgs } from "@os/app/app";
  import { FsError, joinPath } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  let {
    api,
    winApi,
    args,
  }: { api: AppApi; winApi: WindowApi; args?: AppArgs } = $props();

  let currentFile: string[] | null = $state(null);
  let textarea: HTMLTextAreaElement;
  let currentFileContent = "";
  let isSaved = $state(true);

  onMount(() => {
    if (args?.path) {
      openFile(args.path);
    }
  });

  async function openFile(path: string[]) {
    let content;
    try {
      content = await api.fs.readFile(path);
    } catch (err) {
      if (err instanceof FsError) {
        textarea.value = `an unexpected error occured: ${err.message}`;
      }
      return;
    }

    currentFile = path;
    let text = await content.data.text();
    currentFileContent = text;
    textarea.value = text;
    updateSaved();
  }

  async function handleOpen() {
    let procApi = api.launchApp("explorer", { dialogType: "fileonly" });

    procApi?.on("exit", (result) => {
      if (result?.selectedEntry == null) {
        return;
      }

      openFile(result.selectedEntry);
    });
  }

  async function handleSave() {
    if (currentFile === null) {
      return;
    }

    try {
      await api.fs.overwriteFile(currentFile, {
        data: new Blob([textarea.value]),
      });
    } catch (err) {
      if (err instanceof FsError) {
        textarea.value = `an unexpected error occured: ${err.message}`;
      }
      return;
    }

    currentFileContent = textarea.value;
    updateSaved();
  }

  async function handleSaveAs() {
    let wd = null;
    let name = null;
    if (currentFile !== null) {
      wd = [...currentFile];
      name = wd.pop();
    }

    let procApi = api.launchApp("explorer", {
      dialogType: "save",
      workingDir: wd,
      saveDefaultName: name,
    });

    procApi?.on("exit", async (result) => {
      if (result?.selectedEntry == null) {
        return;
      }

      try {
        await api.fs.overwriteFile(result.selectedEntry, {
          data: new Blob([textarea.value]),
        });
      } catch (err) {
        if (err instanceof FsError) {
          textarea.value = `an unexpected error occured: ${err.message}`;
        }
        return;
      }

      currentFile = result.selectedEntry;
      currentFileContent = textarea.value;
      updateSaved();
    });
  }

  function updateSaved() {
    isSaved = textarea?.value === currentFileContent;
  }
</script>

<div class="notepad">
  <div class="toolbar">
    <button onclick={handleOpen}>open</button>
    <button
      onclick={() => {
        if (currentFile === null) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }}>save</button
    >
    <button onclick={handleSaveAs}>save as</button>
  </div>
  <div class="pathbar">
    {currentFile ? joinPath(currentFile, false) : "untitled-1 (new file)"}
    {isSaved ? "" : "*"}
  </div>
  <textarea oninput={updateSaved} bind:this={textarea}></textarea>
</div>

<style>
  .notepad {
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

  textarea {
    flex: 1;
    box-sizing: border-box;
    margin-top: 0.4rem;
    padding: 1rem;
    border: 1px solid #333333;
    resize: none;
    font-size: 1rem;
    line-height: 1.5;
    background-color: #ffffff;
    color: #333333;
    width: 100%;
    outline: none;
  }

  textarea::placeholder {
    color: #aaaaaa;
  }
</style>
