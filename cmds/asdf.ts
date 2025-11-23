import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";

class AsdfCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  launch() {
    let args = this.cmdApi.getArgs();
    this.cmdApi.writeLine("[" + args.join(", ") + "]");
  }
}

export let asdfManifest: CmdManifest = {
  appId: "asdf",
  command: "asdf",

  createProcess: (api, cmdApi) => new AsdfCmd(api, cmdApi),
};
