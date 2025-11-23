import type { AppApi } from "./api";

export type AppManifest = {
  appId: string;

  createApp: (api: AppApi) => Process;
};

export interface Process {
  launch(): Promise<void>;
}
