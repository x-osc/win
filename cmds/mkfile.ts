import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { FsError, resolvePath } from "../core/fs/filesystem";

class MkfileCmd implements Process {
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
      this.cmdApi.writeLine("mkdir: missing operand");
      return;
    }

    const path = resolvePath(workingDir, args[0]);
    if (path === null) {
      this.cmdApi.writeLine(`mkdir: invalid path '${args[0]}'`);
      return;
    }

    try {
      await this.api.fs.mkdir(path);
    } catch (err) {
      if (err instanceof FsError) {
        this.cmdApi.writeLine(
          `mkdir: cannot create directory '${this.api.fs.joinPath(path)}': ${err.message}`
        );
      }
    }
  }
}

export let mkfileManifest: CmdManifest = {
  appId: "mkfile",
  command: "mkfile",

  createProcess: (api, cmdApi) => new MkfileCmd(api, cmdApi),
};

export let touchManifest: CmdManifest = {
  appId: "mkfile",
  command: "touch",

  createProcess: (api, cmdApi) => new MkfileCmd(api, cmdApi),
};
