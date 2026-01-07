/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import UnpluginInjectPreload from "unplugin-inject-preload/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({}) => ({
  test: {
    reporters: process.env.GITHUB_ACTIONS
      ? ["tree", "github-actions"]
      : ["tree"],
  },
  base: process.env.GITHUB_ACTIONS ? "/win/" : "/",
  plugins: [
    svelte(),
    visualizer({
      filename: "bundle-stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
    UnpluginInjectPreload({
      files: [
        {
          entryMatch: /Cozette.*\.woff$/,
          attributes: {
            as: "font",
            crossorigin: true,
          },
        },
        {
          entryMatch: /.*DOS-V_TWN.*\.woff$/,
          attributes: {
            as: "font",
            crossorigin: true,
          },
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./src/core"),
    },
  },
}));
