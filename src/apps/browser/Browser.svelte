<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import { FsError, resolvePath } from "@core/fs/filesystem";
  import type { WindowApi } from "@core/wm/wm.svelte";
  import { slide } from "svelte/transition";
  import { formatError, processDocument } from "../../lang/ml/mlparser";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let url = $state("");

  let input: string | null = $state(null);
  let html: string | null = $state(null);
  let errors: string[] = $state([]);

  let showConsole = $state(false);

  async function reload() {
    input = null;
    html = null;
    errors.length = 0;

    if (url.startsWith("/")) {
      let path = resolvePath(["/"], url);
      if (path === null) return;

      let content;
      try {
        content = await api.fs.readFile(path);
      } catch (err) {
        if (err instanceof FsError) {
          errors.push(err.message);
          return;
        }
        console.error(err);
        return;
      }

      input = await content.data.text();
      let [resHtml, resErrors] = processDocument(input);
      html = resHtml;

      for (const error of resErrors) {
        errors.push(formatError(input, error));
      }
    }
  }
</script>

<div class="browser">
  <div class="titlebar">
    <button onclick={reload}>reload</button>
    <input class="urlbar" bind:value={url} />
    <button class="togglebtn" onclick={() => (showConsole = !showConsole)}>
      {showConsole ? "hide" : "show"} ({errors.length})
    </button>
  </div>

  <div class="maincontent">
    <div class="page">
      {#if html}
        {@html html}
      {/if}
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

  .titlebar {
    display: flex;
    gap: 8px;
  }

  .urlbar {
    flex: 1;
  }

  .maincontent {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .page {
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
</style>
