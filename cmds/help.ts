import { COLORS } from "$lib/cmd/colorcodes";
import { randint, sleep } from "$lib/utils";
import type { AppApi } from "../core/app/api";
import { getAliasesFromCmd, getCmds } from "../core/cmd/cmdregistry";
import type { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  for (let [cmdName, cmdManifest] of getCmds()) {
    await sleep(randint(0, 1));

    cmdApi.writeLine(`${cmdName}`, { color: COLORS.brightCyan, bold: true });

    let aliases = getAliasesFromCmd(cmdName);
    if (aliases.length > 0) {
      cmdApi.appendLine(" (aliases: ");

      aliases.forEach((alias, index) => {
        cmdApi.appendLine(alias, { color: COLORS.brightYellow });

        if (index < aliases.length - 1) {
          cmdApi.appendLine(", ");
        }
      });

      cmdApi.appendLine(")");
    }
  }
}

export let helpManifest: CmdManifest = {
  appId: "help",
  command: "help",

  launch,
};
