import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { FsError, resolvePath } from "../core/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("mkdir: missing operand");
    return;
  }

  const path = resolvePath(workingDir, args[0]);
  if (path === null) {
    cmdApi.writeLine(`mkdir: invalid path '${args[0]}'`);
    return;
  }

  try {
    await api.fs.mkdir(path);
  } catch (err) {
    if (err instanceof FsError) {
      cmdApi.writeLine(
        `mkdir: cannot create directory '${api.fs.joinPath(path)}': ${err.message}`
      );
    }
  }
}

export let mkdirManifest: CmdManifest = {
  appId: "mkdir",
  command: "mkdir",

  launch,
};
