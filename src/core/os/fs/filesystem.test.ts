import "fake-indexeddb/auto"; // mock for indexeddb
import { beforeEach } from "node:test";
import { describe, expect, it } from "vitest";
import { clearAllStores, fsApi, FsError, ROOT_ID } from "./filesystem";

// may need a mock for Blob on old versions of node

describe("IndexedDB Filesystem API", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("starts with an empty root directory", async () => {
    const rootChildren = await fsApi.listDir([]);
    expect(rootChildren).toEqual([]);
  });

  describe("Path Utilities", () => {
    it("splitPath: should clean and split strings", () => {
      expect(fsApi.splitPath("///foo/bar//")).toEqual(["", "foo", "bar"]);
    });

    it("resolvePath: should handle relative jumps", () => {
      const base = ["home", "user"];
      expect(fsApi.resolvePath(base, "docs/../downloads")).toEqual([
        "home",
        "user",
        "downloads",
      ]);
      expect(fsApi.resolvePath(base, "/absolute")).toEqual(["absolute"]);
    });
  });

  describe("Directory Operations", () => {
    it("mkdir: should create a new directory entry", async () => {
      const path = ["test-dir"];
      const entry = await fsApi.mkdir(path);

      expect(entry.name).toBe("test-dir");
      expect(entry.type).toBe("dir");
      expect(entry.parentId).toBe(ROOT_ID);

      const exists = await fsApi.exists(path);
      expect(exists).toBe(true);
    });

    it("mkdir: should throw if parent does not exist", async () => {
      const path = ["ghost", "folder"];
      await expect(fsApi.mkdir(path)).rejects.toThrow();
    });

    it("listDir: should return children of a directory", async () => {
      await fsApi.mkdir(["dir1"]);
      await fsApi.mkdir(["dir1", "subdir"]);

      const list = await fsApi.listDir(["dir1"]);
      expect(list.length).toBe(1);
      expect(list[0].name).toBe("subdir");
    });
  });

  describe("File Operations", () => {
    const mockContent = {
      data: new Blob(["hello world"], { type: "text/plain" }),
    };

    it("writeFile and readFile: should persist content", async () => {
      const path = ["hello.txt"];
      await fsApi.writeFile(path, mockContent);

      const read = await fsApi.readFile(path);
      const text = await read.data.text();

      expect(text).toBe("hello world");
      expect(read.data.size).toBe(mockContent.data.size);
    });

    it("overwriteFile: should update existing file content", async () => {
      const path = ["update.txt"];
      await fsApi.writeFile(path, mockContent);

      const newContent = { data: new Blob(["new content"]) };
      await fsApi.overwriteFile(path, newContent);

      const read = await fsApi.readFile(path);
      expect(await read.data.text()).toBe("new content");
    });

    it("writeFile: should throw if file already exists", async () => {
      const path = ["duplicate.txt"];
      await fsApi.writeFile(path, mockContent);

      try {
        await fsApi.writeFile(path, mockContent);
      } catch (e) {
        const err = e as FsError;
        expect(err.kind.type).toBe("alreadyexists");
      }
    });
  });

  describe("Move and Delete", () => {
    it("move: should move entry to new parent", async () => {
      await fsApi.mkdir(["source"]);
      await fsApi.mkdir(["target"]);
      await fsApi.writeFile(["source", "move-me.txt"], {
        data: new Blob(["test"]),
      });

      await fsApi.move(["source", "move-me.txt"], ["target"]);

      expect(await fsApi.exists(["source", "move-me.txt"])).toBe(false);
      expect(await fsApi.exists(["target", "move-me.txt"])).toBe(true);
    });

    it("remove: should delete files but fail on non-empty dirs", async () => {
      await fsApi.mkdir(["delete-me"]);
      await fsApi.writeFile(["delete-me", "file.txt"], {
        data: new Blob(["test"]),
      });

      // Should fail because it has a child
      await expect(fsApi.remove(["delete-me"])).rejects.toThrow();

      // Should succeed on file
      await fsApi.remove(["delete-me", "file.txt"]);
      expect(await fsApi.exists(["delete-me", "file.txt"])).toBe(false);
    });

    it("removeRecursive: should delete everything", async () => {
      await fsApi.mkdir(["outer"]);
      await fsApi.mkdir(["outer", "inner"]);
      await fsApi.writeFile(["outer", "inner", "deep.txt"], {
        data: new Blob(["test"]),
      });

      await fsApi.removeRecursive(["outer"]);
      expect(await fsApi.exists(["outer"])).toBe(false);
    });
  });
});
