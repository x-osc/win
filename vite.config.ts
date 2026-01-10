/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import websiteIndexer from "./plugins/vite-plugin-website-indexer";

// https://vite.dev/config/
export default defineConfig(({}) => ({
  test: {
    reporters: process.env.GITHUB_ACTIONS
      ? ["tree", "github-actions"]
      : ["tree"],
  },
  base: process.env.GITHUB_ACTIONS ? "/win/" : "/",
  plugins: [
    websiteIndexer(),
    svelte(),
    visualizer({
      filename: "bundle-stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./src/core"),
    },
  },
  appType: "mpa",
}));
