import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { joinPath } from "../core/fs/filesystem";

class PwdCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  async launch() {
    const workingDir = this.cmdApi.getWorkingDir();
    this.cmdApi.writeLine(joinPath(workingDir));
  }
}

export let pwdManifest: CmdManifest = {
  appId: "pwd",
  command: "pwd",

  createProcess: (api, cmdApi) => new PwdCmd(api, cmdApi),
};
