import { DBSchema, openDB } from "idb";

export type FileContent = {
  data: Blob;
};

export type EntryType = "file" | "dir";

export interface FileEntry {
  id: string;
  parentId: string;
  name: string;
  type: "file";
  created: number;
  modified: number;

  size: number;
}

export interface DirEntry {
  id: string;
  parentId: string;
  name: string;
  type: "dir";
  created: number;
  modified: number;
}

export type FsEntry = FileEntry | DirEntry;

export type FsErrorKind =
  | { type: "notfound"; path: string[] }
  | { type: "alreadyexists"; path: string[] }
  | {
      type: "typemismatch";
      path: string[];
      expected: EntryType;
      actual: EntryType;
    }
  | { type: "notempty"; path: string[] }
  | { type: "missingdata"; path: string[] }
  | { type: "invalidpath"; path: string[]; reason?: string }
  | { type: "backendfailure"; path: string[]; cause?: unknown };

export class FsError extends Error {
  kind: FsErrorKind;

  constructor(kind: FsErrorKind) {
    super("Filesystem error: " + JSON.stringify(kind));
    this.name = "FsError";
    this.kind = kind;
  }
}

export function isFsError(err: unknown): err is FsError {
  return err instanceof FsError;
}

const ROOT_ID = "_root_";

interface FSDB_Schema extends DBSchema {
  entries: {
    key: string; // id of entry
    value: FsEntry;
    indexes: {
      "by-parent": string; // idb doesnt like nulls in indexes, have to filter manually
      "by-name-parent": [string, string]; // [name, parentId]
    };
  };
  contents: {
    key: string; // id of file entry
    value: FileContent;
  };
}

export const FSDB = openDB<FSDB_Schema>("fs", 1, {
  upgrade(db) {
    const entries = db.createObjectStore("entries", { keyPath: "id" });
    entries.createIndex("by-parent", "parentId");
    entries.createIndex("by-name-parent", ["name", "parentId"], {
      unique: true,
    });

    db.createObjectStore("contents");

    entries.add({
      id: ROOT_ID,
      parentId: ROOT_ID,
      name: "",
      type: "dir",
      created: Date.now(),
      modified: Date.now(),
    });
  },
});

export function splitPath(path: string): string[] {
  // replace multiple slashes with single slash and remove trailing slash
  const clean = path.replace(/\/+/g, "/").replace(/\/$/, "");
  const parts = clean.split("/");
  return parts;
}

export function joinPath(parts: string[]): string {
  return parts.join("/");
}

export async function resolvePath(path: string[]): Promise<FsEntry | null> {
  const db = await FSDB;
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");

  let currId = ROOT_ID;
  for (const name of path) {
    const entry = await store.index("by-name-parent").get([name, currId]);
    if (entry == null) {
      return null;
    }
    currId = entry.id;
  }

  if (!currId) {
    return null;
  }

  return (await store.get(currId)) ?? null;
}

export async function exists(path: string[]): Promise<boolean> {
  return (await resolvePath(path)) !== null;
}

export async function mkdir(path: string[]): Promise<DirEntry> {
  const db = await FSDB;
  const name = path.pop();
  if (!name) {
    throw new FsError({ type: "invalidpath", path });
  }

  console.log("mkdir", name, "in", path);

  const parentEntry = await resolvePath(path);
  if (!parentEntry || parentEntry.type !== "dir") {
    throw new FsError({ type: "notfound", path });
  }

  const now = Date.now();

  let entry: DirEntry = {
    id: crypto.randomUUID(),
    parentId: parentEntry.id,
    name,
    type: "dir",
    created: now,
    modified: now,
  };

  if (await resolvePath([...path, name])) {
    throw new FsError({ type: "alreadyexists", path: [...path, name] });
  }

  try {
    await db.put("entries", entry);
  } catch (e) {
    throw new FsError({
      type: "backendfailure",
      path: [...path, name],
      cause: e,
    });
  }

  return entry;
}

async function mkdirIgnoreExists(path: string[]): Promise<DirEntry | null> {
  try {
    return await mkdir(path);
  } catch (e) {
    if (isFsError(e) && e.kind.type === "alreadyexists") {
      return null;
    } else {
      throw e;
    }
  }
}

export async function writeFile(
  path: string[],
  content: FileContent
): Promise<FileEntry> {
  const db = await FSDB;
  const name = path.pop();
  if (!name) {
    throw new FsError({ type: "invalidpath", path });
  }

  const parentEntry = await resolvePath(path);
  if (!parentEntry || parentEntry.type !== "dir") {
    throw new FsError({ type: "notfound", path });
  }

  const now = Date.now();

  let entry: FileEntry = {
    id: crypto.randomUUID(),
    parentId: parentEntry.id,
    name,
    type: "file",
    created: now,
    modified: now,
    size: content.data.size,
  };

  if (await resolvePath([...path, name])) {
    throw new FsError({ type: "alreadyexists", path: [...path, name] });
  }

  const tx = db.transaction(["entries", "contents"], "readwrite");
  const entriesStore = tx.objectStore("entries");
  const contentsStore = tx.objectStore("contents");

  try {
    await entriesStore.put(entry);
    await contentsStore.put(content, entry.id);
  } catch (e) {
    throw new FsError({
      type: "backendfailure",
      path: [...path, name],
      cause: e,
    });
  }

  return entry;
}

export async function readFile(path: string[]): Promise<FileContent> {
  const db = await FSDB;
  const entry = await resolvePath(path);

  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }

  if (entry.type !== "file") {
    throw new FsError({
      type: "typemismatch",
      path,
      expected: "file",
      actual: entry.type,
    });
  }

  const content = await db.get("contents", entry.id);
  if (!content) {
    throw new FsError({
      type: "missingdata",
      path,
    });
  }

  return content;
}

export async function listDir(path: string[]): Promise<FsEntry[]> {
  const db = await FSDB;
  const entry = await resolvePath(path);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }
  if (entry.type !== "dir") {
    throw new FsError({
      type: "typemismatch",
      path,
      expected: "dir",
      actual: entry.type,
    });
  }

  return db.getAllFromIndex("entries", "by-parent", entry.id);
}

export async function rename(path: string[], newName: string) {
  const db = await FSDB;
  const entry = await resolvePath(path);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }

  if (await resolvePath([...path.slice(0, -1), newName])) {
    throw new FsError({
      type: "alreadyexists",
      path: [...path.slice(0, -1), newName],
    });
  }

  entry.name = newName;
  entry.modified = Date.now();

  await db.put("entries", entry);
}

export async function move(path: string[], newParentPath: string[]) {
  const db = await FSDB;
  const entry = await resolvePath(path);
  const newParentEntry = await resolvePath(newParentPath);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }
  if (!newParentEntry || newParentEntry.type !== "dir") {
    throw new FsError({ type: "notfound", path: newParentPath });
  }
  if (await resolvePath([...newParentPath, entry.name])) {
    throw new FsError({
      type: "alreadyexists",
      path: [...newParentPath, entry.name],
    });
  }

  entry.parentId = newParentEntry.id;
  entry.modified = Date.now();

  await db.put("entries", entry);
}

export async function remove(path: string[]) {
  const db = await FSDB;
  const entry = await resolvePath(path);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }

  const tx = db.transaction(["entries", "contents"], "readwrite");
  const entriesStore = tx.objectStore("entries");
  const contentsStore = tx.objectStore("contents");

  if (entry.type === "dir") {
    const children = await entriesStore.index("by-parent").getAll(entry.id);
    if (children.length > 0) {
      throw new FsError({ type: "notempty", path });
    }
    await entriesStore.delete(entry.id);
  } else if (entry.type === "file") {
    await entriesStore.delete(entry.id);
    await contentsStore.delete(entry.id);
  } else {
    throw new Error("Unreachable ?");
  }
}

export async function removeRecursive(path: string[]) {
  const db = await FSDB;
  const entry = await resolvePath(path);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }

  const tx = db.transaction(["entries", "contents"], "readwrite");
  const entriesStore = tx.objectStore("entries");
  const contentsStore = tx.objectStore("contents");

  async function removeEntryRec(entry: FsEntry) {
    if (entry.type === "dir") {
      const children = await entriesStore.index("by-parent").getAll(entry.id);
      for (const child of children) {
        await removeEntryRec(child);
      }
      await entriesStore.delete(entry.id);
    } else if (entry.type === "file") {
      await entriesStore.delete(entry.id);
      await contentsStore.delete(entry.id);
    } else {
      throw new Error("Unreachable ?");
    }
  }

  await removeEntryRec(entry);
}

await mkdirIgnoreExists(["home"]);
await mkdirIgnoreExists(["home", "user"]);
await mkdirIgnoreExists(["home", "user", "decktop"]);
if (await exists(["home", "user", "desktop"])) {
  await remove(["home", "user", "desktop"]);
}
await rename(["home", "user", "decktop"], "desktop");
await mkdirIgnoreExists(["home", "user", "documents"]);
await mkdirIgnoreExists(["home", "user", "downloads"]);
await mkdirIgnoreExists(["home", "user", "pictures"]);
await mkdirIgnoreExists(["home", "user", "music"]);
await mkdirIgnoreExists(["home", "user", "videos"]);
await mkdirIgnoreExists(["etc"]);
await mkdirIgnoreExists(["var"]);
await mkdirIgnoreExists(["balls"]);
await writeFile(["home", "user", "asdf.txt"], {
  data: new Blob(["hihihihi"], { type: "text/plain" }),
});
await rename(["home", "user", "asdf.txt"], "readme.txt");
console.log(await listDir(["home", "user"]));
console.log(await (await readFile(["home", "user", "readme.txt"])).data.text());
console.log(await resolvePath(["home", "user", "desktop"]));
await mkdirIgnoreExists(["balls", "test"]);
await mkdirIgnoreExists(["balls", "test", "test2"]);
await writeFile(["balls", "test", "file1.txt"], {
  data: new Blob(["ja;ldlfjskdflkds"], { type: "text/plain" }),
});
await writeFile(["balls", "test", "test2", "file2.txt"], {
  data: new Blob(["ertfgh"], { type: "text/plain" }),
});
await remove(["balls", "test", "file1.txt"]);
await removeRecursive(["balls"]);
console.log(await listDir([]));
