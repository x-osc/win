import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import UnpluginInjectPreload from "unplugin-inject-preload/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/win/" : "/",
  plugins: [
    svelte(),
    UnpluginInjectPreload({
      files: [
        {
          entryMatch: /Cozette.*\.woff$/,
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./core"),
    },
  },
}));
