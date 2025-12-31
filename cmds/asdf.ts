import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { sleep } from "../core/utils";

async function launch(appApi: AppApi, cmdApi: CmdApi) {
  let args = cmdApi.getArgs();
  await sleep(500);
  cmdApi.writeLine("[" + args.join(", ") + "]");
  await sleep(200);
  cmdApi.writeLine("as");
  await sleep(200);
  cmdApi.appendLine("df");
  await sleep(200);
  cmdApi.writeLine("done");
}

export let asdfManifest: CmdManifest = {
  appId: "asdf",
  command: "asdf",

  launch,
};
