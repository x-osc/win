import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("cd: missing operand");
    return;
  }

  let newPath = api.fs.resolvePath(workingDir, args[0]);
  if (newPath === null) {
    cmdApi.writeLine(`cd: no such file or directory: ${args[0]}`);
    return;
  }
  if (!(await api.fs.exists(newPath))) {
    cmdApi.writeLine(
      `cd: no such file or directory: ${api.fs.joinPath(newPath)}`
    );
    return;
  }

  cmdApi.setWorkingDir(newPath);
}

export let cdManifest: CmdManifest = {
  appId: "cd",
  command: "cd",

  launch,
};
