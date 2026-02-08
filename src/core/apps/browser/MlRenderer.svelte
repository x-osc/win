<script lang="ts">
  import { parseUrl, resolveURLPath } from "@lib/core/utils/url";

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
  let frame: HTMLIFrameElement;

  function handleFrameLoad() {
    const doc = getDoc();
    if (!doc) return;

    injectStyles(doc);
    attachHandlers(doc);

    const loc = frame.contentWindow?.location.href;
    if (loc) {
      onNavigate(loc);
    }
  }

  export function setContent(url: string) {
    frame.src = url;

    postProcessImages(doc);
    injectStyles(doc);
    attachHandlers(doc);
  }

  function getDoc() {
    return frame.contentDocument;
  }

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
</script>

<iframe class="page" bind:this={frame} title="page" onload={handleFrameLoad}>
</iframe>

<style>
  .page {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>
