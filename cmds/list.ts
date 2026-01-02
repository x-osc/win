import { randint, sleep } from "$lib/utils";
import type { AppApi } from "../core/app/api";
import { COLORS } from "../core/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "../core/cmd/command";

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
  entries.sort((a, b) => a.name.localeCompare(b.name));

  // if (entries.length === 0) {
  //   cmdApi.writeLine("");
  //   return;
  // }

  const files = entries.filter((entry) => entry.type === "file");
  const dirs = entries.filter((entry) => entry.type === "dir");
  for (let dir of dirs) {
    await sleep(randint(0, 1));
    cmdApi.writeLine(dir.name + "/", { color: COLORS.brightCyan, bold: true });
  }
  for (let file of files) {
    await sleep(randint(0, 1));
    cmdApi.writeLine(file.name);
  }
}

export let listManifest: CmdManifest = {
  appId: "list",
  command: "list",
  aliases: ["ls"],

  launch,
};
