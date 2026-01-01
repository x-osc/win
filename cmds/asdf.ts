import { AppApi } from "../core/app/api";
import { COLORS } from "../core/cmd/colorcodes";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { sleep } from "../core/utils";

async function launch(appApi: AppApi, cmdApi: CmdApi) {
  let args = cmdApi.getArgs();
  await sleep(500);
  cmdApi.writeLine("[" + args.join(", ") + "]");
  await sleep(200);
  cmdApi.writeLine("as", { color: COLORS.brightCyan });
  await sleep(200);
  cmdApi.appendLine("df", { color: COLORS.brightMagenta });
  await sleep(200);
  cmdApi.writeLine("done", { color: COLORS.green, italic: true });
}

export let asdfManifest: CmdManifest = {
  appId: "asdf",
  command: "asdf",

  launch,
};
