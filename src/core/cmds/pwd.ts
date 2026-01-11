import type { AppApi } from "@os/app/api";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { joinPath } from "@os/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const workingDir = cmdApi.getWorkingDir();
  cmdApi.writeLine(joinPath(workingDir));
}

export let pwdManifest: CmdManifest = {
  appId: "pwd",
  command: "pwd",

  launch,
};
