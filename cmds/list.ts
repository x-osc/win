import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";

class ListCmd implements Process {
  api: AppApi;
  cmdApi: CmdApi;

  constructor(api: AppApi, cmdApi: CmdApi) {
    this.api = api;
    this.cmdApi = cmdApi;
  }

  async launch() {
    const args = this.cmdApi.getArgs();
    const workingDir = this.cmdApi.getWorkingDir();

    let targetDir;
    if (args.length === 0) {
      targetDir = workingDir;
    } else {
      targetDir = this.api.fs.resolvePath(workingDir, args[0]);
    }

    if (targetDir === null) {
      this.cmdApi.writeLine(
        `list: cannot access '${args[0]}': No such file or directory`
      );
      return;
    }
    if (!(await this.api.fs.exists(targetDir))) {
      this.cmdApi.writeLine(
        `list: cannot access '${this.api.fs.joinPath(targetDir)}': No such file or directory`
      );
      return;
    }
    if ((await this.api.fs.type(targetDir)) !== "dir") {
      this.cmdApi.writeLine(
        `list: cannot access '${this.api.fs.joinPath(targetDir)}': Not a directory`
      );
      return;
    }

    const entries = await this.api.fs.listDir(targetDir);
    for (let entry of entries) {
      this.cmdApi.writeLine(entry.name);
    }
  }
}

export let listManifest: CmdManifest = {
  appId: "list",
  command: "list",

  createProcess: (api, cmdApi) => new ListCmd(api, cmdApi),
};

// TODO: make aliases not bad
export let lsManifest: CmdManifest = {
  appId: "list",
  command: "ls",

  createProcess: (api, cmdApi) => new ListCmd(api, cmdApi),
};
