import { getApps } from "$lib/app/appregistry";
import { COLORS } from "$lib/cmd/colorcodes";
import { randint, sleep } from "$lib/utils";
import type { AppApi } from "../core/app/api";
import type { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  for (let [appName, appManifest] of getApps()) {
    await sleep(randint(0, 1));
    cmdApi.writeLine(`${appName}`, { color: COLORS.brightCyan, bold: true });
  }
}

export let listAppsManifest: CmdManifest = {
  appId: "list_apps",
  command: "list_apps",

  launch,
};
