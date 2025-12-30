import { AppApi } from "../core/app/api";
import { Process } from "../core/app/app";
import { CmdApi, CmdManifest } from "../core/cmd/command";

class ReadCmd implements Process {
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
      this.cmdApi.writeLine("cat: missing operand");
      return;
    }

    const path = this.api.fs.resolvePath(workingDir, args[0]);
    if (path === null) {
      this.cmdApi.writeLine(`cat: no such file or directory: ${args[0]}`);
      return;
    }
    if (!(await this.api.fs.exists(path))) {
      this.cmdApi.writeLine(
        `cat: no such file or directory: ${this.api.fs.joinPath(path)}`
      );
      return;
    }

    const content = await this.api.fs.readFile(path);
    this.cmdApi.writeLine(await content.data.text());
  }
}

export let readManifest: CmdManifest = {
  appId: "read",
  command: "read",

  createProcess: (api, cmdApi) => new ReadCmd(api, cmdApi),
};

export let catManifest: CmdManifest = {
  appId: "read",
  command: "cat",

  createProcess: (api, cmdApi) => new ReadCmd(api, cmdApi),
};
