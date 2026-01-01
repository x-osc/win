import { AppApi } from "../core/app/api";
import { CmdApi, CmdManifest } from "../core/cmd/command";
import { FsError } from "../core/fs/filesystem";

async function launch(api: AppApi, cmdApi: CmdApi) {
  const args = cmdApi.getArgs();
  const workingDir = cmdApi.getWorkingDir();

  if (args.length === 0) {
    cmdApi.writeLine("delete: missing operand");
    return;
  }

  const path = api.fs.resolvePath(workingDir, args[0]);
  if (path === null) {
    cmdApi.writeLine(`delete: no such file or directory: ${args[0]}`);
    return;
  }
  if (!(await api.fs.exists(path))) {
    cmdApi.writeLine(
      `delete: no such file or directory: ${api.fs.joinPath(path)}`
    );
    return;
  }

  if ((await api.fs.type(path)) === "file") {
    cmdApi.writeLine(`delete file ${api.fs.joinPath(path, false)}? (y/n): `);
    const input = await cmdApi.getInput();
    if (input.toLowerCase() !== "y") {
      try {
        await api.fs.remove(path);
      } catch (err) {
        if (err instanceof FsError) {
          cmdApi.writeLine(
            `delete: cannot remove '${api.fs.joinPath(path, false)}': ${err.message}`
          );
        }
      }
    }
  } else if ((await api.fs.type(path)) === "dir") {
    let entries = await api.fs.listDirRecursive(path);
    let files = entries.filter((entry) => entry.type === "file");
    let dirs = entries.filter((entry) => entry.type === "dir");

    if (entries.length === 0) {
      cmdApi.writeLine(
        `delete empty directory ${api.fs.joinPath(path)}? (y/n): `
      );
    } else {
      cmdApi.writeLine(
        `delete ${files.length} files and ${dirs.length + 1} directories including directory ${api.fs.joinPath(path)}? (y/n): `
      );
    }
    const input = await cmdApi.getInput();
    if (input.toLowerCase() === "y") {
      try {
        await api.fs.removeRecursive(path);
      } catch (err) {
        if (err instanceof FsError) {
          cmdApi.writeLine(
            `delete: cannot remove '${api.fs.joinPath(path, false)}': ${err.message}`
          );
        }
      }
    }
  }
  const content = await api.fs.readFile(path);
  cmdApi.writeLine(await content.data.text());
}

export let deleteManifest: CmdManifest = {
  appId: "delete",
  command: "delete",

  launch,
};

export let rmManifest: CmdManifest = {
  appId: "delete",
  command: "rm",

  launch,
};
