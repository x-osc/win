import fs from "fs-extra";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

interface InitFsIndexerOpts {
  initFsDir: string;
}

export function initFsIndexer(opts: InitFsIndexerOpts): Plugin {
  let config: ResolvedConfig;

  return {
    name: "vite-seed-plugin",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async buildStart() {
      const sourceDir = path.resolve(config.root, opts.initFsDir);
      this.addWatchFile(sourceDir);
      await runIndexer(config, opts);
    },

    async watchChange(id) {
      if (id.includes(opts.initFsDir)) {
        await runIndexer(config, opts);
      }
    },
  };
}

async function runIndexer(config: ResolvedConfig, opts: InitFsIndexerOpts) {
  const sourceDir = path.resolve(config.root, opts.initFsDir);
  const filePath = path.resolve(config.root, "generated/initfs.json");

  let entries = await generateIndexData(sourceDir);

  console.log(`indexed ${entries.length} initfs entries`);

  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), "utf-8");
}

async function generateIndexData(sourceDir: string) {
  const entries: { path: string; type: "file" | "dir" }[] = [];

  const scan = async (currentDir: string, relativePrefix = "") => {
    const items = await fs.readdir(currentDir);

    // if dir is empty record self
    if (items.length === 0 && relativePrefix !== "") {
      entries.push({
        path: relativePrefix,
        type: "dir",
      });
      return;
    }

    for (const item of items) {
      if (item === ".gitkeep") continue;

      const fullPath = path.posix.join(currentDir, item);
      const relPath = path.posix.join(relativePrefix, item);

      if ((await fs.stat(fullPath)).isDirectory()) {
        entries.push({ path: relPath, type: "dir" });
        await scan(fullPath, relPath);
      } else {
        entries.push({ path: relPath, type: "file" });
      }
    }
  };

  await scan(sourceDir);

  return entries;
}
