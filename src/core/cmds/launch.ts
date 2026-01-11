import { randint, sleep } from "@lib/core/utils";
import type { AppApi } from "@os/app/api";
import { getApps } from "@os/app/appregistry";
import type { CmdApi, CmdManifest } from "@os/cmd/command";

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

  let processApi = api.launchApp(appId);

  await new Promise<void>((resolve) => {
    processApi?.on("exit", () => {
      resolve();
    });
  });
}

export let launchManifest: CmdManifest = {
  appId: "launch",
  command: "launch",

  launch,
};
