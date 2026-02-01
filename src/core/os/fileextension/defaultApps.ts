import { getApps, getProcessRegistry } from "@os/app/appregistry";
import { launchProcess } from "@os/app/processes";
import { fsApi, type FsEntry } from "@os/fs/filesystem";
import { getFileExtension } from "./extensions";

export let defaultApps: Record<string, string> = {
  txt: "notepad",
  ml: "code",
  sto: "code",
  jpg: "viewer",
};

export async function openFileWithDefault(entry: FsEntry) {
  let content = await fsApi.getContent(entry.id);
  if (content?.process) {
    const manifest = getProcessRegistry().get(content.process);
    if (!manifest) {
      console.log(`process ${content.process} not in registry`);
      return;
    }
    launchProcess(manifest);
  }

  let extension = getFileExtension(entry.name);

  let appId = defaultApps[extension];
  if (!appId) return;

  let app = getApps().get(appId);
  let path = await fsApi.getPath(entry);
  if (app?.openPath && path) {
    app.openPath(path);
  }
}

let extensionRegistry: Map<string, string[]> = new Map();

export function registerExtension(extension: string, appId: string) {
  if (extensionRegistry.has(extension)) {
    extensionRegistry.get(extension)!.push(appId);
  } else {
    extensionRegistry.set(extension, [appId]);
  }
}

export function getExtensionRegistry(): Map<string, string[]> {
  return extensionRegistry;
}
