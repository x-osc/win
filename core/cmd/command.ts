import { AppApi } from "../app/api";

export interface CmdManifest {
  appId: string;
  command: string;

  launch(api: AppApi, cmdApi: CmdApi): Promise<void>;
}

export interface CmdApi {
  getArgs(): string[];
  getWorkingDir(): string[];
  setWorkingDir(path: string[]): Promise<void>;
  appendLine(content: string): void;
  writeLine(content: string): void;
}
