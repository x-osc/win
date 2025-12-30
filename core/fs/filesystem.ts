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

await mkdirIgnoreExists(["home"]);
await mkdirIgnoreExists(["home", "user"]);
await mkdirIgnoreExists(["home", "user", "desktop"]);
await mkdirIgnoreExists(["home", "user", "documents"]);
await mkdirIgnoreExists(["home", "user", "downloads"]);
await mkdirIgnoreExists(["home", "user", "pictures"]);
await mkdirIgnoreExists(["home", "user", "music"]);
await mkdirIgnoreExists(["home", "user", "videos"]);
await mkdirIgnoreExists(["etc"]);
await mkdirIgnoreExists(["var"]);

await resolvePath(["home", "user", "desktop"]).then((entry) => {
  if (entry) {
    console.log("Resolved /home/user/desktop:", entry);
  }
});
