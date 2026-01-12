/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { initFsIndexer } from "./src/plugins/vite-plugin-initial-fs";
import { injectPreload } from "./src/plugins/vite-plugin-inject-preload";
import { websiteIndexer } from "./src/plugins/vite-plugin-website-indexer";

// https://vite.dev/config/
export default defineConfig(({}) => ({
  test: {
    reporters: process.env.GITHUB_ACTIONS
      ? ["tree", "github-actions"]
      : ["tree"],
  },
  base: process.env.GITHUB_ACTIONS ? "/win/" : "/",
  plugins: [
    websiteIndexer({ websitesDir: "src/websites" }),
    initFsIndexer({ initFsDir: "src/initfs" }),
    injectPreload([
      {
        regex: /.*\.woff2?$/,
        rel: "preload",
        as: "font",
        crossorigin: true,
        fetchpriority: "low",
      },
    ]),
    svelte(),
    visualizer({
      filename: "bundle-stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@os": path.resolve(__dirname, "./src/core/os"),
      "@lib": path.resolve(__dirname, "./src"),
      "@generated": path.resolve(__dirname, "./generated"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  appType: "mpa",
}));
