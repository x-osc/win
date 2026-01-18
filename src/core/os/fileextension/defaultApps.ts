import { getApps } from "@os/app/appregistry";
import { fsApi, type FsEntry } from "@os/fs/filesystem";
import { getFileExtension } from "./extensionRegistry";

export let defaultApps: Record<string, string> = {
  txt: "notepad",
  ml: "code",
  sto: "code",
  jpg: "viewer",
};

export async function openFileWithDefault(entry: FsEntry) {
  let extension = getFileExtension(entry.name);
  let appId = defaultApps[extension];
  if (!appId) return;

  let app = getApps().get(appId);
  let path = await fsApi.getPath(entry);
  if (app?.openPath && path) {
    app.openPath(path);
  }
}
