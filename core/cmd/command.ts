import { AppApi } from "../app/api";
import { Process } from "../app/app";

export type CmdManifest = {
  appId: string;
  command: string;

  createProcess: (api: AppApi, cmdApi: CmdApi) => Process;
};

export interface CmdApi {
  getArgs(): string[];
  getWorkingDir(): string[];
  setWorkingDir(path: string[]): Promise<void>;
  writeLine(content: string): void;
}
