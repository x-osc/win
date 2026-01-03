import type { AppApi } from "@core/app/api";
import type { CmdApi, CmdManifest } from "@core/cmd/command";
import { resolvePath } from "@core/fs/filesystem";
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

    workingDir = newCwd;
  }

  let appId = args[0];

  cmdApi.writeLine(`launching explorer`);

  await sleep(randint(125, 250));

  api.launchApp("explorer", { workingDir });
}

export let explorerCmdManifest: CmdManifest = {
  appId: "explorer",
  command: "explorer",

  launch,
};
