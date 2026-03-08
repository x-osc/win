<script lang="ts">
  import { resolveURLPath } from "@lib/core/utils/url";

  let {
    url,
    publicUrl,
    handleNavigate,
  }: {
    url: string;
    publicUrl: string;
    handleNavigate: (url: string) => void;
  } = $props();

  let frame: HTMLIFrameElement;

  function handleFrameLoad() {
    const doc = frame.contentDocument;
    if (!doc) return;

    attachHandlers(doc);
  }

  export function setContent(content: string) {
    frame.srcdoc = buildDocument(content);
  }

  function buildDocument(html: string) {
    let currDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <base href="${publicUrl}">
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    return currDoc;
  }

  function attachHandlers(doc: Document) {
    doc.addEventListener("click", handleClick);
  }

  function handleClick(e: MouseEvent) {
    const linkEl = (e.target as HTMLElement).closest(`a`);
    if (!linkEl) return;

    let link = linkEl.getAttribute("href");
    if (!link) return;

    e.preventDefault;

    if (link.startsWith(".")) {
      // TODO: temp fix, need to figure out alternative for protocol in links
      // and images
      link = resolveURLPath(url, link);
    }

    handleNavigate(link);
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
