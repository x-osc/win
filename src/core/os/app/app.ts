import type { AppApi } from "./api";

export interface AppManifest {
  appId: string;

  launch(api: AppApi, args?: AppArgs): Promise<void>;

  openPath?(path: string[]): Promise<boolean>;
}

export type AppArgs = Record<string, any>;
export type AppResult = Record<string, any>;
