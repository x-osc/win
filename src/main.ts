import { mount } from "svelte";
import "./core/app.css";
import Main from "./core/Main.svelte";

const app = mount(Main, {
  target: document.getElementById("app")!,
});

export default app;
