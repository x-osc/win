import type { AppApi } from "@os/app/api";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { sleep } from "@os/utils";

async function launch(appApi: AppApi, cmdApi: CmdApi) {
  let args = cmdApi.getArgs();

  if (args.length === 0) {
    cmdApi.writeLine("sleep: missing operand");
    return;
  }

  let length = parseInt(args[0]);

  if (isNaN(length)) {
    cmdApi.writeLine(`sleep: please enter a valid integer`);
    return;
  }

  cmdApi.writeLine(`sleeping for ${length} milliseconds`);

  await sleep(length);
}

export let sleepManifest: CmdManifest = {
  appId: "sleep",
  command: "sleep",

  launch,
};
