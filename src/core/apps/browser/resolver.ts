import siteindex from "@generated/siteindex.json";
import { isLikelyUrl, parseUrl } from "@lib/core/utils/url";
import type { AppApi } from "@os/app/api";
import { generateGoggleNet } from "./search";

type ResolvedContent =
  | { type: "path"; url: string; content: string }
  | { type: "site"; url: string; content: string; publicUrl: string }
  | { type: "error"; error: string };

export async function resolveContent(
  input: string,
  api: AppApi,
): Promise<ResolvedContent> {
  if (input.startsWith("/")) {
    // file path

    const path = api.fs.resolvePath(["/"], input);
    if (!path) return { type: "error", error: "File not found" };

    try {
      const content = await api.fs.readFile(path);
      return { type: "path", url: input, content: await content.data.text() };
    } catch {
      return { type: "error", error: "Unable to read file" };
    }
  }

  if (!isLikelyUrl(input)) {
    // search query
    return resolveContent(`goggle.net/search?q=${input}`, api);
  }

  const { url: newUrl, urlfull, host, path, params } = parseUrl(input);

  // TODO: registry for js websites?
  if (newUrl === "goggle.net/search" && params.q) {
    // js website

    const content = generateGoggleNet(params.q);
    return {
      type: "site",
      url: urlfull,
      content,
      publicUrl: "goggle.net/search",
    };
  }

  // normal site

  const site = siteindex.sites[newUrl as keyof typeof siteindex.sites];

  if (!site) return { type: "error", error: "Site not found" };

  const publicUrl = site.publicurl;
  const resp = await fetch(publicUrl);
  if (resp.ok) {
    const content = await resp.text();

    return { type: "site", url: urlfull, content, publicUrl };
  } else {
    return { type: "error", error: "Failed to load site" };
  }
}
