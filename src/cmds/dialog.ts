import type { AppApi } from "@core/app/api";
import type { CmdApi, CmdManifest } from "@core/cmd/command";
import { randint, sleep } from "@core/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();

  let message = undefined;

  if (args.length > 0) {
    message = args[0];
  }

  cmdApi.writeLine(`launching dialog`);

  await sleep(randint(125, 250));

  let code = await api.showDialog({ message: message ?? "" });
  if (code) {
    cmdApi.writeLine(code.toString());
  }
}

export let dialogCmdManifest: CmdManifest = {
  appId: "dialog_cmd",
  command: "dialog",

  launch,
};
