import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/app/command";

class HelpCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  launch() {
    this.cmdApi.writeLine("asdf");
  }
}

export let helpManifest: CmdManifest = {
  appId: "help",
  command: "help",

  createProcess: (api, cmdApi) => new HelpCmd(api, cmdApi),
};
