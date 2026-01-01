import type { AppApi } from "../core/app/api";
import { getCmds } from "../core/app/apps.svelte";
import type { CmdApi, CmdManifest } from "../core/cmd/command";

async function launch(api: AppApi, cmdApi: CmdApi) {
  for (let [cmdName, cmdManifest] of getCmds()) {
    cmdApi.writeLine(`${cmdName}`);
  }
}

export let helpManifest: CmdManifest = {
  appId: "help",
  command: "help",

  launch,
};
