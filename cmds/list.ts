import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  let targetDir;
  if (args.length === 0) {
    targetDir = workingDir;
  } else {
    targetDir = api.fs.resolvePath(workingDir, args[0]);
  }

  if (targetDir === null) {
    cmdApi.writeLine(
      `list: cannot access '${args[0]}': No such file or directory`
    );
    return;
  }
  if (!(await api.fs.exists(targetDir))) {
    cmdApi.writeLine(
      `list: cannot access '${api.fs.joinPath(targetDir)}': No such file or directory`
    );
    return;
  }
  if ((await api.fs.type(targetDir)) !== "dir") {
    cmdApi.writeLine(
      `list: cannot access '${api.fs.joinPath(targetDir)}': Not a directory`
    );
    return;
  }

  const entries = await api.fs.listDir(targetDir);
  for (let entry of entries) {
    cmdApi.writeLine(entry.name);
  }
}

export let listManifest: CmdManifest = {
  appId: "list",
  command: "list",

  launch,
};

// TODO: make aliases not bad
export let lsManifest: CmdManifest = {
  appId: "list",
  command: "ls",

  launch,
};
