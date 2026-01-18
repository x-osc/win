// unused rn

export function getFileExtension(name: string): string {
  let res = /(?:\.([^.]+))?$/.exec(name);
  return res ? (res[1] ?? "") : "";
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
