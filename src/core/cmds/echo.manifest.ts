import type { AppApi } from "@os/app/api";
import type { CmdApi, CmdManifest } from "@os/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const output = args.join(" ");
  cmdApi.writeLine(output);
}

export let echoManifest: CmdManifest = {
  appId: "echo",
  command: "echo",

  launch,
};
