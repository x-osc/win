import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";

class CdCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  async launch() {
    const args = this.cmdApi.getArgs();
    const workingDir = this.cmdApi.getWorkingDir();

    if (args.length === 0) {
      this.cmdApi.writeLine("cd: missing operand");
      return;
    }

    let newPath = this.api.fs.resolvePath(workingDir, args[0]);
    if (newPath === null) {
      this.cmdApi.writeLine(`cd: no such file or directory: ${args[0]}`);
      return;
    }
    if (!(await this.api.fs.exists(newPath))) {
      this.cmdApi.writeLine(
        `cd: no such file or directory: ${this.api.fs.joinPath(newPath)}`
      );
      return;
    }

    this.cmdApi.setWorkingDir(newPath);
  }
}

export let cdManifest: CmdManifest = {
  appId: "cd",
  command: "cd",

  createProcess: (api, cmdApi) => new CdCmd(api, cmdApi),
};
