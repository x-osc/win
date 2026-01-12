import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

const PUBLIC_FS_DIR = "initfs/";

interface InitFsIndexerOpts {
  initFsDir: string;
}

export function initFsIndexer(opts: InitFsIndexerOpts): Plugin {
  let config: ResolvedConfig;

  return {
    name: "fs-indexer",

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

    async configureServer(server) {
      const sourceDir = path.resolve(config.root, opts.initFsDir);

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/" + PUBLIC_FS_DIR)) {
          const relativePath = req.url
            .replace("/" + PUBLIC_FS_DIR, "")
            .split("?")[0];
          const filePath = path.join(sourceDir, relativePath);

          if (
            // !filePath.endsWith(".gitkeep") &&
            (await fs.pathExists(filePath)) &&
            (await fs.stat(filePath)).isFile()
          ) {
            const content = await fs.readFile(filePath);
            res.end(content);
            return;
          }
        }
        next();
      });
    },

    async generateBundle() {
      const sourceDir = path.resolve(config.root, opts.initFsDir);
      const files = await glob("**/*", {
        cwd: sourceDir,
        // ignore: ["**/.gitkeep"],
        dot: true,
        nodir: true,
        posix: true,
      });

      for (const file of files) {
        this.emitFile({
          type: "asset",
          fileName: path.posix.join(PUBLIC_FS_DIR, file),
          source: await fs.readFile(path.join(sourceDir, file)),
        });
      }
    },
  };
}

async function runIndexer(config: ResolvedConfig, opts: InitFsIndexerOpts) {
  const sourceDir = path.resolve(config.root, opts.initFsDir);
  const filePath = path.resolve(config.root, "generated/initfs.json");

  let index = await generateIndexData(sourceDir);

  console.log(`indexed ${index.length} initfs entries`);

  await fs.writeFile(filePath, JSON.stringify(index, null, 2), "utf-8");
}

async function generateIndexData(sourceDir: string) {
  const entries = await glob("**/*", {
    cwd: sourceDir,
    ignore: ["**/.gitkeep"],
    dot: true,
    posix: true,
    mark: true,
  });

  let index: { path: string; type: "file" | "dir" }[] = [];

  for (const relPath of entries) {
    index.push({ path: relPath, type: relPath.endsWith("/") ? "dir" : "file" });
  }

  return index;
}
