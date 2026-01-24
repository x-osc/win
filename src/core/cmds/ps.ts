import type { AppApi } from "@os/app/api";
import { getProcesses } from "@os/app/processes";
import { COLORS } from "@os/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { randint, usleep } from "../utils/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  for (let [id, [process, processApi]] of getProcesses()) {
    await usleep(randint(0, 1));
    cmdApi.writeLine(`${id}`, { color: COLORS.brightCyan, bold: true });
    cmdApi.appendLine(`: ${process.appId}`);
  }
}

export let psManifest: CmdManifest = {
  appId: "ps",
  command: "ps",

  launch,
};
