import type { AppApi } from "@os/app/api";
import { getApps } from "@os/app/appregistry";
import { COLORS } from "@os/cmd/colorcodes";
import type { CmdApi, CmdManifest } from "@os/cmd/command";
import { randint, sleep } from "@os/utils";

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
