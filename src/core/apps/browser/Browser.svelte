<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import { HistoryManager } from "./history.svelte";
  import MlRenderer from "./MlRenderer.svelte";
  import { resolveContent } from "./resolver";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  const history = new HistoryManager();
  let renderer: MlRenderer;

  let urlInput: HTMLInputElement;

  let url = $state("");
  let publicUrl = $state("web/");
  let isLoading = $state(false);

  onMount(() => {
    navigate("goggle.net");
  });

  async function navigate(targetUrl: string, addToHistory = true) {
    isLoading = true;
    const result = await resolveContent(targetUrl, api);
    isLoading = false;

    if (result.type === "error") {
      return;
    }

    publicUrl = result.type === "site" ? result.publicUrl : "web/";

    renderer.setContent(result.content);

    if (addToHistory) {
      history.push(result.url);
    }

    url = result.url;
  }

  function handleInputKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      urlInput.blur();
      navigate(url);
    }
  }
</script>

<div class="browser">
  <div class="toolbar">
    <button onclick={() => navigate(url)}>reload</button>

    <button class="action-button" onclick={() => navigate("goggle.net")}>
      home
    </button>

    <button
      class="action-button"
      onclick={() => {
        history.back();
        navigate(history.current, false);
      }}>&lt</button
    >

    <button
      class="action-button"
      onclick={() => {
        history.forward();
        navigate(history.current, false);
      }}>&gt</button
    >

    <input
      class="urlbar"
      type="text"
      bind:this={urlInput}
      bind:value={url}
      onkeydown={handleInputKeyDown}
      onfocus={() => urlInput.select()}
      placeholder="Search"
    />
  </div>

  <div class="maincontent">
    <div class="page-container">
      <MlRenderer
        bind:this={renderer}
        {url}
        {publicUrl}
        handleNavigate={(url) => navigate(url)}
      />
    </div>
  </div>
</div>

<style>
  .browser {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    overflow: auto;
    margin-bottom: 6px;
  }

  .urlbar {
    flex: 1;
  }

  .maincontent {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .page-container {
    display: flex;
    flex: 1;
    overflow: auto;
  }

  .action-button {
    min-width: 0;
  }
</style>
