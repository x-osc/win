import type { AppApi } from "@os/app/api";
import { getAliasesFromCmd, getCmds } from "@os/cmd/cmdregistry";
import { COLORS } from "@os/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { randint, sleep } from "@os/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  cmdApi.writeLine("currently installed commands:");

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
