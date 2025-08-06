import type { AppApi } from "./api";

export type AppManifest = {
  appId: string;

  createApp: (api: AppApi) => App;
};

export interface App {
  launch(): void;
}
