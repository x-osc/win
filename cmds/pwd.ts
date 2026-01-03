import type { AppApi } from "@core/app/api";
import type { CmdApi, CmdManifest } from "@core/cmd/command";
import { joinPath } from "@core/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const workingDir = cmdApi.getWorkingDir();
  cmdApi.writeLine(joinPath(workingDir));
}

export let pwdManifest: CmdManifest = {
  appId: "pwd",
  command: "pwd",

  launch,
};
