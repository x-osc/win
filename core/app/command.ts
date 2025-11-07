import { AppApi } from "./api";
import { Process } from "./app";

export type CmdManifest = {
  appId: string;
  command: string;

  createProcess: (api: AppApi, cmdApi: CmdApi) => Process;
};

export interface CmdApi {
  getArgs(): string[];
  writeLine(content: string): void;
}
