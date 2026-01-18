import type { AppApi } from "@os/app/api";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { FsError } from "@os/fs/filesystem";

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
      `cd: no such file or directory: ${api.fs.joinPath(newPath)}`,
    );
    return;
  }
  if ((await api.fs.type(newPath)) !== "dir") {
    cmdApi.writeLine(`cd: not a directory: ${api.fs.joinPath(newPath)}`);
    return;
  }

  try {
    cmdApi.setWorkingDir(newPath);
  } catch (err) {
    if (err instanceof FsError) {
      cmdApi.writeLine(
        `cd: cannot change directory to '${api.fs.joinPath(newPath)}': ${err.message}`,
      );
    }
  }
}

export let cdManifest: CmdManifest = {
  appId: "cd",
  command: "cd",

  launch,
};
