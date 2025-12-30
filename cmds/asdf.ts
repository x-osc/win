import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { sleep } from "../core/utils";

class AsdfCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  async launch() {
    let args = this.cmdApi.getArgs();
    await sleep(500);
    this.cmdApi.writeLine("[" + args.join(", ") + "]");
    await sleep(200);
    this.cmdApi.writeLine("as");
    await sleep(200);
    this.cmdApi.appendLine("df");
    await sleep(200);
    this.cmdApi.writeLine("done");
  }
}

export let asdfManifest: CmdManifest = {
  appId: "asdf",
  command: "asdf",

  createProcess: (api, cmdApi) => new AsdfCmd(api, cmdApi),
};
