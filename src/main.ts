import { mount } from "svelte";
import "./app.css";
import Main from "./Main.svelte";

const app = mount(Main, {
  target: document.getElementById("app")!,
});

export default app;
