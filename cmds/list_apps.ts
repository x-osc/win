import type { AppApi } from "../core/app/api";
import { getApps } from "../core/app/appregistry";
import { COLORS } from "../core/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "../core/cmd/command";
import { randint, sleep } from "../core/utils";

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
