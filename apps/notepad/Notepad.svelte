<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import { FsError } from "@core/fs/filesystem";
  import type { WindowApi } from "@core/wm/wm.svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let textarea: HTMLTextAreaElement;

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

    textarea.value = await content.data.text();
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
</script>

<div class="container">
  <div class="toolbar"><button onclick={handleOpen}>open</button></div>
  <textarea bind:this={textarea}></textarea>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
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
