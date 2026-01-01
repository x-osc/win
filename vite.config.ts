import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/win/" : "/",
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "./core"),
    },
  },
}));
