import type { AppApi } from "../core/app/api";
import { getProcesses } from "../core/app/processes";
import { COLORS } from "../core/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "../core/cmd/command";
import { randint, sleep } from "../core/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  for (let [id, process] of getProcesses()) {
    await sleep(randint(0, 1));
    cmdApi.writeLine(`${id}`, { color: COLORS.brightCyan, bold: true });
    cmdApi.appendLine(`: ${process.appId}`);
  }
}

export let psManifest: CmdManifest = {
  appId: "ps",
  command: "ps",

  launch,
};
