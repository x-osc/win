import type { AppApi } from "../core/app/api";
import { getApps, launchApp } from "../core/app/appregistry";
import type { CmdApi, CmdManifest } from "../core/cmd/command";
import { randint, sleep } from "../core/utils";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();

  await sleep(10);

  if (args.length === 0) {
    cmdApi.writeLine("launch: missing operand");
    return;
  }

  let appId = args[0];

  await sleep(randint(15, 25));

  if (!getApps().has(appId)) {
    cmdApi.writeLine(`launch: app '${appId}' does not exist`);
    await sleep(10);
    cmdApi.writeLine("Use `list_apps` to view installed apps.");
    return;
  }

  cmdApi.writeLine(`launching app '${appId}'`);

  await sleep(randint(125, 350));

  launchApp(appId);
}

export let launchManifest: CmdManifest = {
  appId: "launch",
  command: "launch",

  launch,
};
