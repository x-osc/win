import type { AppApi } from "./api";
import type { App, AppManifest } from "./app";
import { registerApp } from "./apps.svelte";

class TestApp implements App {
  api: AppApi;

  constructor(api: AppApi) {
    this.api = api;
  }

  launch(): void {
    console.log("yipe it worke");
    this.api.window.createWindowAsync().then((winApi) => {
      console.log("asdjfkdj");
      setTimeout(() => winApi.move(100, 100), 0);
      setTimeout(() => winApi.move(200, 100), 1000);
      setTimeout(() => winApi.move(200, 200), 2000);
      setTimeout(() => winApi.move(100, 200), 3000);
      setTimeout(() => winApi.move(100, 100), 4000);
    });
  }
}

export let testAppManifest: AppManifest = {
  appId: "test_app",
  createApp: (api: AppApi) => new TestApp(api),
};
