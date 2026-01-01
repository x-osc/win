import { AppApi } from "../app/api";

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
