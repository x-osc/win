import type { Snippet } from "svelte";

export let contextMenuApi = {
  show: (e: MouseEvent, menuContent: Snippet) => {},
};
