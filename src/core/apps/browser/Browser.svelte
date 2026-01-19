<script lang="ts">
  import { formatError } from "@lib/core/lang/ml/mlparser";
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { HistoryManager } from "./history.svelte";
  import MlRenderer from "./MlRenderer.svelte";
  import { resolveContent } from "./resolver";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  const history = new HistoryManager();
  let renderer: MlRenderer;

  let urlInput: HTMLInputElement;

  let url = $state("");
  let publicUrl = $state("web/");
  let errors = $state<string[]>([]);
  let showConsole = $state(false);
  let isLoading = $state(false);

  onMount(() => {
    navigate("goggle.net");
  });

  async function navigate(targetUrl: string, addToHistory = true) {
    errors = [];

    isLoading = true;
    const result = await resolveContent(targetUrl, api);
    isLoading = false;

    if (result.type === "error") {
      errors = [result.error];
      return;
    }

    publicUrl = result.type === "site" ? result.publicUrl : "web/";

    let errs = renderer.setContent(result.content);
    errors = errors.concat(errs.map((err) => formatError(result.content, err)));

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

    <button class="togglebtn" onclick={() => (showConsole = !showConsole)}>
      {showConsole ? "hide" : "show"} ({errors.length})
    </button>
  </div>

  <div class="maincontent">
    <div class="page-container">
      <MlRenderer
        bind:this={renderer}
        {url}
        {publicUrl}
        onNavigate={(url) => navigate(url)}
      />
    </div>

    {#if showConsole}
      <div class="console-sidebar" transition:slide={{ axis: "x" }}>
        <div class="console-header">
          <button class="close-btn" onclick={() => (showConsole = false)}
            >x</button
          >
          <span>Console Output</span>
        </div>
        <div class="console-body">
          <pre>{errors.join("\n\n")}</pre>
        </div>
      </div>
    {/if}
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

  .console-sidebar {
    width: 300px;
    border-left: 1px solid #444;
    display: flex;
    flex-direction: column;
  }

  .console-body {
    overflow-y: auto;
    flex: 1;
    font-size: 14px;
    font-family: monospace;
  }

  .action-button {
    min-width: 0;
  }
</style>
