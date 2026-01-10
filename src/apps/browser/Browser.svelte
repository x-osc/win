<script lang="ts">
  import type { AppApi } from "@core/app/api";
  import { FsError, joinPath } from "@core/fs/filesystem";
  import type { WindowApi } from "@core/wm/wm.svelte";
  import siteindex from "@generated/siteindex.json";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import mlStyles from "../../lang/ml/ml.css?inline";
  import { formatError, processDocument } from "../../lang/ml/mlparser";
  import { generateGoggleNet } from "./search";
  import { parseUrl } from "./url";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let urlInput: HTMLInputElement;
  let pageContainer: HTMLElement;
  let pageSDom: ShadowRoot;
  let pageSDomDiv: HTMLElement;

  let url = $state("");

  let input: string | null = null;
  let html: string | null = null;
  let errors: string[] = $state([]);

  let showConsole = $state(false);

  onMount(() => {
    pageSDom = pageContainer.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(mlStyles);
    pageSDom.adoptedStyleSheets = [sheet];

    pageSDomDiv = document.createElement("div");
    pageSDomDiv.style = "width: 100%; height: 100%";
    pageSDom.appendChild(pageSDomDiv);
  });

  async function reload() {
    input = null;
    html = null;
    errors.length = 0;

    if (url.startsWith("/")) {
      let path = api.fs.resolvePath(["/"], url);
      if (path === null) return;
      url = joinPath(path, false);

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
    } else {
      const { url: newUrl, host, path, params } = parseUrl(url);
      url = newUrl;

      // TODO: registry for js websites?
      if (newUrl === "goggle.net/search") {
        if (!params.q) {
          return;
        }
        input = generateGoggleNet(params.q);
      } else {
        const site = siteindex.sites[newUrl as keyof typeof siteindex.sites];

        if (!site) {
          return;
        }

        const resp = await fetch(site.url);
        if (resp.ok) {
          input = await resp.text();
        } else {
          return;
        }
      }

      let [resHtml, resErrors] = processDocument(input);
      html = resHtml;

      for (const error of resErrors) {
        errors.push(formatError(input, error));
      }
    }

    if (html) {
      pageSDomDiv.innerHTML = html;
      pageSDomDiv.addEventListener("keydown", handleSDomKeyDown);
    }
  }

  function handleSDomKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;

    if (
      e.key === "Enter" &&
      target instanceof HTMLInputElement &&
      target.hasAttribute("data-output-url")
    ) {
      target.blur();

      const domain = parseUrl(url).host;
      const outputUrl = target.getAttribute("data-output-url");
      const id = target.name;
      if (!outputUrl) return;
      if (!id) return;

      let queryString = `?${id}=${target.value}`;
      url = domain + outputUrl + queryString;
      reload();
    }
  }

  function handleInputKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      urlInput.blur();
      reload();
    }
  }
</script>

<div class="browser">
  <div class="titlebar">
    <button onclick={reload}>reload</button>
    <input
      class="urlbar"
      bind:this={urlInput}
      bind:value={url}
      onkeydown={handleInputKeyDown}
    />
    <button class="togglebtn" onclick={() => (showConsole = !showConsole)}>
      {showConsole ? "hide" : "show"} ({errors.length})
    </button>
  </div>

  <div class="maincontent">
    <div class="page" bind:this={pageContainer}></div>

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
    overflow: auto;
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
</style>
