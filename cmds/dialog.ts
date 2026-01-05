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

  let processApi = api.launchApp("dialog", { message });

  await new Promise<void>((resolve) => {
    processApi?.on("exit", (result) => {
      cmdApi.writeLine(((result?.code ?? 0) as number).toString());
      resolve();
    });
  });
}

export let dialogCmdManifest: CmdManifest = {
  appId: "dialog_cmd",
  command: "dialog",

  launch,
};
