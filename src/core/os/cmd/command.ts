import type { AppApi } from "@os/app/api";
import type { ProcessManifest } from "@os/app/app";

export type TextOptions = {
  color: string;
  bold: boolean;
  italic: boolean;
};

export const DEFAULTOPTIONS = {
  color: "#f5f5f5",
  bold: false,
  italic: false,
};

export interface CmdManifest {
  appId: string;
  command: string;
  aliases?: string[];

  launch(api: AppApi, cmdApi: CmdApi): Promise<void>;
}

export interface CmdApi {
  getArgs(): string[];
  getWorkingDir(): string[];
  setWorkingDir(path: string[]): Promise<void>;
  appendLine(content: string, options?: Partial<TextOptions>): void;
  writeLine(content: string, options?: Partial<TextOptions>): void;
  getInput(): Promise<string>;
}

export function cmdManifestToProcessManifest(
  cmdManifest: CmdManifest,
  cmdApi: CmdApi,
): ProcessManifest {
  return {
    ...cmdManifest,
    launch: (api, args) => cmdManifest.launch(api, cmdApi),
  };
}
