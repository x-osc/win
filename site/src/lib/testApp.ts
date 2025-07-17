import type { App, AppManifest } from "./app";
import { registerApp } from "./apps.svelte";

class TestApp implements App {
  appApi: any;

  constructor(appApi: any) {
    this.appApi = appApi;
  }

  launch(): void {
    console.log("yipe it worke");
  }
}

export let testAppManifest: AppManifest = {
  appId: "test_app",
  createApp: (appApi: any) => new TestApp(appApi),
};
