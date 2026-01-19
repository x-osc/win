<script lang="ts">
  import mlStyles from "@lib/core/lang/ml/ml.css?inline";
  import { processDocument, type MlError } from "@lib/core/lang/ml/mlparser";
  import { parseUrl, resolveURLPath } from "@lib/core/utils/url";
  import { onDestroy, onMount } from "svelte";

  let {
    url,
    publicUrl,
    onNavigate,
  }: {
    url: string;
    publicUrl: string;
    onNavigate: (url: string) => void;
  } = $props();

  let shadow: ShadowRoot;
  let pageContainer: HTMLElement;
  let page: HTMLElement;

  onMount(() => {
    shadow = page.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(mlStyles);
    shadow.adoptedStyleSheets = [sheet];

    pageContainer = document.createElement("div");
    pageContainer.style.cssText = "width: 100%; height: 100%";
    shadow.appendChild(pageContainer);

    pageContainer.addEventListener("click", handleClick);
    pageContainer.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    pageContainer.removeEventListener("click", handleClick);
    pageContainer.removeEventListener("keydown", handleKeyDown);
  });

  function handleClick(e: MouseEvent) {
    const target = e.composedPath()[0] as HTMLElement;
    let link = target.getAttribute("data-ml-link-to");
    if (link) {
      if (link.startsWith(".")) {
        // TODO: temp fix, need to figure out alternative for protocol in links
        // and images
        link = resolveURLPath(url, link);
      }

      onNavigate(link);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
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
      let newUrl = domain + outputUrl + queryString;

      console.log("navigating to", newUrl);

      onNavigate(newUrl);
    }
  }

  export function setContent(newInput: string): MlError[] {
    let [html, errors] = processDocument(newInput);

    if (html) {
      pageContainer.innerHTML = html;
      postProcessPageSDom();
    }

    return errors;
  }

  function postProcessPageSDom() {
    let images = shadow.querySelectorAll("img[data-ml-img]");

    for (const img of images) {
      let imgel = img as HTMLImageElement;
      let relpath = img.getAttribute("data-ml-img-url");
      if (!relpath) return;

      let webPath = resolveURLPath(publicUrl, relpath);
      imgel.src = webPath;
    }
  }
</script>

<div class="page" bind:this={page}></div>

<style>
  .page {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>
