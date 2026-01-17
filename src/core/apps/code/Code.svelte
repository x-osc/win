<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import { FsError } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import CodeTab from "./CodeTab.svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let codeTab: CodeTab;

  async function openFile(path: string[]) {
    let content;
    try {
      content = await api.fs.readFile(path);
    } catch (err) {
      if (err instanceof FsError) {
        codeTab.setEditorText(`an unexpected error occured: ${err.message}`);
      }
      return;
    }

    codeTab.setFile(path, await content.data.text());
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
    let path = codeTab.getFile();

    if (path === null) return;

    try {
      await api.fs.overwriteFile(path, {
        data: new Blob([codeTab.getEditorText()]),
      });
    } catch (err) {
      if (err instanceof FsError) {
        codeTab.setEditorText(`an unexpected error occured: ${err.message}`);
      }
      return;
    }

    codeTab.setCurrentContent(codeTab.getEditorText());
  }

  async function handleSaveAs() {
    let wd = null;
    let name = null;

    let path = codeTab.getFile();
    if (path !== null) {
      wd = [...path];
      name = wd.pop();
    }

    let procApi = api.launchApp("explorer", {
      dialogType: "save",
      workingDir: wd,
      saveDefaultName: name,
    });

    procApi?.on("exit", async (result) => {
      if (!result?.selectedEntry) return;

      try {
        await api.fs.overwriteFile(result.selectedEntry, {
          data: new Blob([codeTab.getEditorText()]),
        });
      } catch (err) {
        if (err instanceof FsError) {
          codeTab.setEditorText(`an unexpected error occured: ${err.message}`);
        }
        return;
      }

      codeTab.setFile(result.selectedEntry, codeTab.getEditorText());
    });
  }
</script>

<div class="notepad">
  <div class="toolbar">
    <button onclick={handleOpen}>open</button>
    <button
      onclick={() => {
        if (codeTab.getFile() === null) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }}>save</button
    >
    <button onclick={handleSaveAs}>save as</button>
  </div>

  <CodeTab bind:this={codeTab} />
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
</style>
