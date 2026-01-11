<script lang="ts">
  import siteindex from "@generated/siteindex.json";
  import type { AppApi } from "@os/app/api";
  import { FsError, joinPath } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import mlStyles from "../../lang/ml/ml.css?inline";
  import { formatError, processDocument } from "../../lang/ml/mlparser";
  import { generateGoggleNet } from "./search";
  import { isLikelyUrl, parseUrl, resolveURLPath } from "./url";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let urlInput: HTMLInputElement;
  let pageContainer: HTMLElement;
  let pageSDom: ShadowRoot;
  let pageSDomDiv: HTMLElement;

  let url = $state("");
  // TODO: jank
  let publicUrl: string | null = "";

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

    pageSDomDiv.addEventListener("keydown", handleSDomKeyDown);
    pageSDomDiv.addEventListener("click", handleSDomClick);
  });

  async function reload(humanTriggered = false) {
    input = null;
    html = null;
    publicUrl = null;
    errors.length = 0;

    pageSDomDiv.innerHTML = "";

    if (url.startsWith("/")) {
      // its a path

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
    } else {
      // its either a url or a search

      if (isLikelyUrl(url)) {
        // its probably a url

        const { url: newUrl, urlfull, host, path, params } = parseUrl(url);
        url = urlfull;
        publicUrl = "web/" + newUrl;

        // TODO: registry for js websites?
        if (newUrl === "goggle.net/search") {
          // its a js website

          if (!params.q) {
            return;
          }
          input = generateGoggleNet(params.q);
        } else {
          // its a normal website

          const site = siteindex.sites[newUrl as keyof typeof siteindex.sites];

          if (!site) {
            return;
          }

          publicUrl = site.publicurl;
          const resp = await fetch(site.publicurl);
          if (resp.ok) {
            input = await resp.text();
          } else {
            console.error(
              "uhuhuhoh tried to request : " +
                site.publicurl +
                " and failed :((",
            );
            return;
          }
        }
      } else {
        // its a search

        // only search if human triggered
        if (!humanTriggered) {
          return;
        }

        // search with goggle (they have a monopoly)
        url = `goggle.net/search?q=${url}`;
        reload();
        return;
      }
    }

    let [resHtml, resErrors] = processDocument(input);
    html = resHtml;

    for (const error of resErrors) {
      errors.push(formatError(input, error));
    }

    if (html) {
      pageSDomDiv.innerHTML = html;
      postProcessPageSDom();
    }
  }

  function postProcessPageSDom() {
    let images = pageSDom.querySelectorAll("img[data-ml-img]");
    for (const img of images) {
      let imgel = img as HTMLImageElement;
      let relpath = img.getAttribute("data-ml-img-url");
      if (!relpath) return;
      // TODO: buildtime const for web
      let webPath = resolveURLPath(publicUrl ?? "web/", relpath);
      imgel.src = webPath;
    }
  }

  function handleSDomKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;

    if (
      e.key === "Enter" &&
      target instanceof HTMLInputElement &&
      target.hasAttribute("data-ml-output-url")
    ) {
      target.blur();

      const domain = parseUrl(url).host;
      const outputUrl = target.getAttribute("data-ml-output-url");
      const id = target.name;
      if (!outputUrl) return;
      if (!id) return;

      let queryString = `?${id}=${target.value}`;
      url = domain + outputUrl + queryString;
      reload();
    }
  }

  function handleSDomClick(e: MouseEvent) {
    const target = e.composedPath()[0] as HTMLElement;

    if (target.hasAttribute("data-ml-link")) {
      let linkUrl = target.getAttribute("data-ml-link-to")?.trim();
      if (!linkUrl) return;

      if (linkUrl.startsWith(".")) {
        // TODO: temp fix, need to figure out alternative for protocol in links
        // and images
        linkUrl = resolveURLPath(url, linkUrl);
      }

      url = linkUrl;
      reload();
    }
  }

  function handleInputKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      urlInput.blur();
      reload(true);
    }
  }
</script>

<div class="browser">
  <div class="titlebar">
    <button onclick={() => reload(true)}>reload</button>
    <input
      class="urlbar"
      bind:this={urlInput}
      bind:value={url}
      onkeydown={handleInputKeyDown}
      onfocus={() => urlInput.select()}
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
