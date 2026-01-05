import { type DBSchema, openDB } from "idb";

export let fsApi = {
  splitPath,
  joinPath,
  getEntry,
  getEntryFromId,
  getPath,
  resolvePath,
  exists,
  type,
  mkdir,
  writeFile,
  overwriteFile,
  readFile,
  listDir,
  listDirRecursive,
  rename,
  move,
  remove,
  removeRecursive,
};

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

export const ROOT_ID = "_root_";

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

export function joinPath(path: string[], trailingSlash = true): string {
  let result = "/" + path.join("/");
  if (trailingSlash && !result.endsWith("/")) {
    result += "/";
  }
  return result;
}

export function resolvePath(
  relativeTo: string[],
  path: string,
): string[] | null {
  let relTo = [...relativeTo];
  let parts = splitPath(path);

  if (path.startsWith("/")) {
    // absolute path
    relTo = [];
  }

  for (const part of parts) {
    if (part === "" || part === ".") {
      continue;
    } else if (part === "..") {
      if (relTo.pop() === undefined) {
        return null;
      }
    } else {
      relTo.push(part);
    }
  }

  return relTo;
}

export async function getEntry(path: string[]): Promise<FsEntry | null> {
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

export async function getEntryFromId(id: string): Promise<FsEntry | null> {
  const db = await FSDB;

  return (await db.get("entries", id)) ?? null;
}

export async function getPath(entry: FsEntry): Promise<string[] | null> {
  const db = await FSDB;
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");

  let parts: string[] = [];
  let current: FsEntry = entry;
  while (current && current.id !== ROOT_ID) {
    parts.push(current.name);
    let newEntry = await store.get(current.parentId);

    if (newEntry === undefined) {
      return null;
    }

    current = newEntry;
  }

  return parts.reverse();
}

export async function exists(path: string[]): Promise<boolean> {
  return (await getEntry(path)) !== null;
}

export async function type(path: string[]): Promise<EntryType | null> {
  const entry = await getEntry(path);
  return entry ? entry.type : null;
}

export async function mkdir(path: string[]): Promise<DirEntry> {
  const db = await FSDB;
  const name = path.pop();
  if (!name) {
    throw new FsError({ type: "invalidpath", path });
  }

  console.log("mkdir", name, "in", path);

  const parentEntry = await getEntry(path);
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

  if (await getEntry([...path, name])) {
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
  content: FileContent,
): Promise<FileEntry> {
  const db = await FSDB;
  const name = path.pop();
  if (!name) {
    throw new FsError({ type: "invalidpath", path });
  }

  const parentEntry = await getEntry(path);
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

  if (await getEntry([...path, name])) {
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

export async function overwriteFile(path: string[], content: FileContent) {
  const db = await FSDB;
  const entry = await getEntry(path);

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

  try {
    await db.put("contents", content, entry.id);
  } catch (e) {
    throw new FsError({
      type: "backendfailure",
      path: path,
      cause: e,
    });
  }
}

export async function readFile(path: string[]): Promise<FileContent> {
  const db = await FSDB;
  const entry = await getEntry(path);

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
  const entry = await getEntry(path);
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

  let result = (
    await db.getAllFromIndex("entries", "by-parent", entry.id)
  ).filter((e) => e.id !== ROOT_ID);

  return result;
}

export async function listDirRecursive(path: string[]): Promise<FsEntry[]> {
  const db = await FSDB;
  const entry = await getEntry(path);

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

  let results: FsEntry[] = [];

  async function recurseDir(dirEntry: DirEntry) {
    const children = await db.getAllFromIndex(
      "entries",
      "by-parent",
      dirEntry.id,
    );
    for (const child of children) {
      if (child.id === ROOT_ID) {
        continue;
      }

      results.push(child);
      if (child.type === "dir") {
        await recurseDir(child);
      }
    }
  }

  await recurseDir(entry);
  return results;
}

export async function rename(path: string[], newName: string) {
  const db = await FSDB;
  const entry = await getEntry(path);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }

  if (await getEntry([...path.slice(0, -1), newName])) {
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
  const entry = await getEntry(path);
  const newParentEntry = await getEntry(newParentPath);
  if (!entry) {
    throw new FsError({ type: "notfound", path });
  }
  if (!newParentEntry || newParentEntry.type !== "dir") {
    throw new FsError({ type: "notfound", path: newParentPath });
  }
  if (await getEntry([...newParentPath, entry.name])) {
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
  const entry = await getEntry(path);
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
  const entry = await getEntry(path);
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
        if (entry.id === ROOT_ID) {
          return;
        }

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
