import type { AppApi } from "@core/app/api";
import type { CmdApi, CmdManifest } from "@core/cmd/command";
import { joinPath, resolvePath } from "@core/fs/filesystem";
import { randint, sleep } from "@core/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();

  let workingDir = cmdApi.getWorkingDir();

  if (args.length > 0) {
    let newCwd = resolvePath(workingDir, args[0]);
    if (newCwd === null) {
      cmdApi.writeLine(`explorer: invalid path: ${args[0]}`);
      return;
    }
    if (!(await api.fs.exists(newCwd))) {
      cmdApi.writeLine(`explorer: invalid path: ${joinPath(newCwd)}`);
      return;
    }

    workingDir = newCwd;
  }

  cmdApi.writeLine(`launching explorer`);

  await sleep(randint(125, 250));

  let processApi = api.launchApp("explorer", { workingDir });

  await new Promise<void>((resolve) => {
    processApi?.on("exit", () => {
      resolve();
    });
  });
}

export let explorerCmdManifest: CmdManifest = {
  appId: "explorer_cmd",
  command: "explorer",

  launch,
};
