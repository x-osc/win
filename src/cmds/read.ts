import type { AppApi } from "@core/app/api";
import type { CmdApi, CmdManifest } from "@core/cmd/command";
import { FsError } from "@core/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("read: missing operand");
    return;
  }

  const path = api.fs.resolvePath(workingDir, args[0]);
  if (path === null) {
    cmdApi.writeLine(`read: no such file or directory: ${args[0]}`);
    return;
  }
  if (!(await api.fs.exists(path))) {
    cmdApi.writeLine(
      `read: no such file or directory: ${api.fs.joinPath(path, false)}`
    );
    return;
  }
  if ((await api.fs.type(path)) !== "file") {
    cmdApi.writeLine(`read: '${api.fs.joinPath(path, false)}' is not a file`);
    return;
  }
  try {
    const content = await api.fs.readFile(path);
    cmdApi.writeLine(await content.data.text());
  } catch (err) {
    if (err instanceof FsError) {
      cmdApi.writeLine(
        `read: cannot read file '${api.fs.joinPath(path, false)}': ${err.message}`
      );
      return;
    }
  }
}

export let readManifest: CmdManifest = {
  appId: "read",
  command: "read",
  aliases: ["cat"],

  launch,
};
