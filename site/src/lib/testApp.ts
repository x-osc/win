import type { App, AppManifest } from "./app";
import { registerApp } from "./apps.svelte";

class TestApp implements App {
  launch(): void {
    console.log("yipe it worke");
  }
}

export let testAppManifest: AppManifest = {
  appId: "test_app",
  app: TestApp,
};
