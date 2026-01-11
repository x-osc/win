import type { IndexHtmlTransformContext, Plugin, ResolvedConfig } from "vite";

export interface ResourceHintRule {
  regex: RegExp;
  rel: "preload" | "prefetch";
  as?: "font" | "script" | "style" | "image" | "video" | "audio" | "track";
  fetchpriority?: "low" | "high" | "auto";
  type?: string;
  crossorigin?: boolean;
}

/// higher rules have higher priority
export function injectPreload(rules: ResourceHintRule[] = []): Plugin {
  let config: ResolvedConfig;

  return {
    name: "vite-plugin-inject-preload",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
      if (!ctx.bundle) return html;

      const tags: any[] = [];
      const processedFiles = new Set<string>();
      const bundleEntries = Object.values(ctx.bundle);
      const base = config.base;

      for (const rule of rules) {
        const matches = bundleEntries.filter((chunk) => {
          const names = (chunk as any).names || [];

          return names.some((n: string) => rule.regex.test(n));
        });

        matches.forEach((chunk) => {
          if (processedFiles.has(chunk.fileName)) return;

          const href = `${base}${chunk.fileName}`.replace(/\/+/g, "/");

          tags.push({
            tag: "link",
            attrs: {
              rel: rule.rel,
              href: href,
              ...(rule.as && { as: rule.as }),
              ...(rule.type && { type: rule.type }),
              ...(rule.fetchpriority && { fetchpriority: rule.fetchpriority }),
              ...(rule.crossorigin && { crossorigin: "anonymous" }),
            },
            injectTo: "head-prepend",
          });

          processedFiles.add(chunk.fileName);
        });
      }

      return tags;
    },
  };
}
