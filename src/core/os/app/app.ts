import type { AppApi } from "./api";

export interface ProcessManifest {
  appId: string;

  launch(api: AppApi, args?: ProcArgs): Promise<void>;
}

export interface AppManifest {
  appId: string;

  launch(api: AppApi, args?: ProcArgs): Promise<void>;

  name: string;
  description?: string;
  exePath?: string[];

  openPath?(path: string[]): Promise<boolean>;
}

export type ProcArgs = Record<string, any>;
export type ProcResult = Record<string, any>;
