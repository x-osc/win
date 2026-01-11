import { mount } from "svelte";
import "./core/app.css";
import Main from "./Main.svelte";

const app = mount(Main, {
  target: document.getElementById("app")!,
});

export default app;
