import fs from "fs-extra";
import { glob } from "glob";
import JSON5 from "json5";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

const PUBLIC_WEB_DIR = "web/";
const LOCAL_WEB_DIR = "websites/";

export default function websiteIndexer(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "website-indexer",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async buildStart() {
      const sourceDir = path.resolve(config.root, LOCAL_WEB_DIR);
      this.addWatchFile(sourceDir);
      await runIndexer(config);
    },

    async watchChange(id) {
      if (id.includes(LOCAL_WEB_DIR)) {
        await runIndexer(config);
      }
    },

    async configureServer(server) {
      const sourceDir = path.resolve(config.root, LOCAL_WEB_DIR);

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/" + PUBLIC_WEB_DIR)) {
          const relativePath = req.url
            .replace("/" + PUBLIC_WEB_DIR, "")
            .split("?")[0];
          const filePath = path.join(sourceDir, relativePath);

          if (
            !filePath.endsWith(".mlmeta") &&
            (await fs.pathExists(filePath)) &&
            (await fs.stat(filePath)).isFile()
          ) {
            const content = await fs.readFile(filePath);
            // res.setHeader("Content-Type", "text/plain");
            res.end(content);
            return;
          }
        }
        next();
      });
    },

    async generateBundle() {
      const sourceDir = path.resolve(config.root, LOCAL_WEB_DIR);

      const mlFiles = await glob("**/*", {
        cwd: sourceDir,
        ignore: "**/*.mlmeta",
        nodir: true,
        posix: true,
      });

      for (const file of mlFiles) {
        const content = await fs.readFile(path.join(sourceDir, file));

        this.emitFile({
          type: "asset",
          fileName: path.posix.join(PUBLIC_WEB_DIR, file),
          source: content,
        });
      }
    },
  };
}

async function runIndexer(config: ResolvedConfig) {
  const sourceDir = path.resolve(config.root, LOCAL_WEB_DIR);
  const filePath = path.resolve(config.root, "generated/siteindex.json");

  let index = await generateIndexData(sourceDir);

  await fs.writeFile(filePath, JSON.stringify(index, null, 2), "utf-8");
}

async function generateIndexData(sourceDir: string) {
  const index: any = { sites: {}, tags: {} };

  const mlFiles = await glob("**/*.mlmeta", { cwd: sourceDir, posix: true });

  for (const relativePath of mlFiles) {
    const dir = path.dirname(relativePath);
    const filenameext = path.basename(relativePath);
    const filename = filenameext.slice(0, filenameext.lastIndexOf("."));
    const metaPath = path.join(sourceDir, relativePath);
    let tags = [];

    if (await fs.pathExists(metaPath)) {
      const metaContent = await fs.readFile(metaPath, "utf-8");
      const meta = JSON5.parse(metaContent);
      tags = meta.tags || [];
    }

    const url = filename === "index" ? `${dir}` : `${dir}/${filename}.ml`;

    for (const tag of tags) {
      if (index.tags[tag] == undefined) {
        index.tags[tag] = [url];
      } else {
        index.tags[tag].push(url);
      }
    }

    index.sites[url] = {
      host: dir,
      url: `/${PUBLIC_WEB_DIR}${dir}/${filename}.ml`,
      tags: tags,
    };
  }

  console.log(`indexed ${Object.keys(index.sites).length} websites`);

  return index;
}
