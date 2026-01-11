import type { AppApi } from "@os/app/api";
import { COLORS } from "@os/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { sleep } from "@os/utils";

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
