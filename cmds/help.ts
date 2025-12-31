import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const output = args.join(" ");
  cmdApi.writeLine(output);
}

export let helpManifest: CmdManifest = {
  appId: "help",
  command: "help",

  launch,
};
