import { mount } from "svelte";
import "$lib/app.css";
import Main from "$lib/Main.svelte";

const app = mount(Main, {
  target: document.getElementById("app")!,
});

export default app;
