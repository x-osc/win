import type { AppApi } from "./api";

export interface AppManifest {
  appId: string;

  launch(api: AppApi, args?: Record<string, any>): Promise<void>;
}
