import { ProcessApi, launchCmdFromManifest } from "../app/apps.svelte";
import { CmdApi, CmdManifest } from "./command";

let cmdRegistry: Map<string, CmdManifest> = new Map();

export function launchCmd(cmd: string, cmdApi: CmdApi): ProcessApi | null {
  const command = cmdRegistry.get(cmd);
  if (command === undefined) {
    console.error(`command ${cmd} does not exist`);
    console.log(cmdRegistry);
    return null;
  }
  return launchCmdFromManifest(command, cmdApi);
}

export function registerCmd(cmd: CmdManifest) {
  let name = cmd.command;
  cmdRegistry.set(name, cmd);
}

export function getCmds(): Map<string, CmdManifest> {
  return cmdRegistry;
}
