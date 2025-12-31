import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("cat: missing operand");
    return;
  }

  const path = api.fs.resolvePath(workingDir, args[0]);
  if (path === null) {
    cmdApi.writeLine(`cat: no such file or directory: ${args[0]}`);
    return;
  }
  if (!(await api.fs.exists(path))) {
    cmdApi.writeLine(
      `cat: no such file or directory: ${api.fs.joinPath(path)}`
    );
    return;
  }

  const content = await api.fs.readFile(path);
  cmdApi.writeLine(await content.data.text());
}

export let readManifest: CmdManifest = {
  appId: "read",
  command: "read",

  launch,
};

export let catManifest: CmdManifest = {
  appId: "read",
  command: "cat",

  launch,
};
