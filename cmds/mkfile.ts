import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { FsError, resolvePath } from "../core/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("mkfile: missing operand");
    return;
  }

  let content = "";
  if (args[1] != undefined) {
    content = args.slice(1).join(" ");
  }

  const path = resolvePath(workingDir, args[0]);
  if (path === null) {
    cmdApi.writeLine(`mkfile: invalid path '${args[0]}'`);
    return;
  }
  if (await api.fs.exists(path)) {
    cmdApi.writeLine(
      `mkfile: cannot create file '${api.fs.joinPath(path, false)}': File exists`
    );
    return;
  }

  cmdApi.writeLine(`creating file '${api.fs.joinPath(path, false)}'`);
  try {
    await api.fs.writeFile(path, {
      data: new Blob([content], { type: "text/plain" }),
    });
  } catch (err) {
    if (err instanceof FsError) {
      cmdApi.writeLine(
        `mkfile: cannot create file '${api.fs.joinPath(path, false)}': ${err.message}`
      );
    }
  }
}

export let mkfileManifest: CmdManifest = {
  appId: "mkfile",
  command: "mkfile",

  launch,
};

export let touchManifest: CmdManifest = {
  appId: "mkfile",
  command: "touch",

  launch,
};
