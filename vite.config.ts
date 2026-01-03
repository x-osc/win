import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/win/" : "/",
  plugins: [svelte()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./core"),
    },
  },
}));
