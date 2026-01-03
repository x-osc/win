import type { AppApi } from "./api";

export interface AppManifest<
  TArgs extends Record<string, any> = {},
  TResult extends Record<string, any> = {},
> {
  appId: string;

  launch(api: AppApi, args?: TArgs): Promise<void>;
}
