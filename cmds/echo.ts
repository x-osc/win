import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";

class EchoCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  async launch() {
    const args = this.cmdApi.getArgs();
    const output = args.join(" ");
    this.cmdApi.writeLine(output);
  }
}

export let echoManifest: CmdManifest = {
  appId: "echo",
  command: "echo",

  createProcess: (api, cmdApi) => new EchoCmd(api, cmdApi),
};
