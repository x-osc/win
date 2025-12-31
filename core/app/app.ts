import type { AppApi } from "./api";

export interface AppManifest {
  appId: string;

  launch(api: AppApi): Promise<void>;
}
