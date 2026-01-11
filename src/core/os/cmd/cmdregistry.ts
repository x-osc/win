import {
  type ExtraProcessOptions,
  type ProcessApi,
  launchCmdFromManifest,
} from "@os/app/processes";
import type { CmdApi, CmdManifest } from "./command";

let cmdRegistry: Map<string, CmdManifest> = new Map();

export function launchCmd(
  cmd: string,
  cmdApi: CmdApi,
  extraOptions: ExtraProcessOptions = {},
): ProcessApi | null {
  let tryAlias = getCmdFromAlias(cmd);
  if (tryAlias !== undefined) {
    cmd = tryAlias;
  }

  const command = cmdRegistry.get(cmd);
  if (command === undefined) {
    console.error(`command ${cmd} does not exist`);
    console.log(cmdRegistry);
    console.log(aliasRegistry);
    return null;
  }
  return launchCmdFromManifest(command, cmdApi, extraOptions);
}

export function registerCmd(cmd: CmdManifest) {
  let name = cmd.command;
  cmdRegistry.set(name, cmd);

  let aliases = cmd.aliases ?? [];
  for (const alias of aliases) {
    if (aliasRegistry.has(alias)) {
      console.log(
        `alias ${alias} already registered to ${aliasRegistry.get(alias)}`,
      );
    }
    aliasRegistry.set(alias, name);
  }
}

export function getCmds(): Map<string, CmdManifest> {
  return cmdRegistry;
}

let aliasRegistry: Map<string, string> = new Map(); // alias -> cmd

export function getCmdFromAlias(alias: string): string | undefined {
  return aliasRegistry.get(alias);
}

export function getAliasesFromCmd(cmd: string): string[] {
  let aliases = [];
  for (const [key, value] of aliasRegistry) {
    if (value === cmd) {
      aliases.push(key);
    }
  }
  return aliases;
}
