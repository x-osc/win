<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import type { WindowApi } from "@core/wm/wm.svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  async function handleOpen() {
    api.launchApp("explorer", { isDialog: true });
  }
</script>

<div class="container">
  <div class="toolbar"><button onclick={handleOpen}>open</button></div>
  <textarea></textarea>
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
