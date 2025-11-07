import { AppApi } from "./api";
import { App } from "./app";

export type CmdManifest = {
  appId: string;
  command: string;

  createApp: (api: AppApi, cmdApi: CmdApi) => App;
};

export interface CmdApi {
  getArgs(): string[];
  writeLine(content: string): void;
}
