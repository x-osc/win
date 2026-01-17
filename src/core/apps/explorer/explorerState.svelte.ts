import { randint, sleep } from "@lib/core/utils/utils";
import type { AppApi } from "@os/app/api";
import { joinPath, type EntryType, type FsEntry } from "@os/fs/filesystem";
import { SvelteSet } from "svelte/reactivity";

type CreatingData = {
  mode: "creating";
  type: EntryType;
  name: string;
};

export class ExplorerState {
  cwd: string[] = $state([]);
  entries: FsEntry[] = $state([]);
  error: string | null = $state(null);
  selectedIds: Set<string> = new SvelteSet();
  mainSelectedId: string | null = $state(null);
  editing: CreatingData | null = $state(null);

  private api: AppApi;

  constructor(api: any, initialPath: string[] = []) {
    this.api = api;
    this.cwd = initialPath;
  }

  sortedEntries = $derived.by(() => {
    return [...this.entries].sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  });

  breadcrumbs = $derived.by(() => {
    const parts = [];
    for (let i = 0; i < this.cwd.length; i++) {
      parts.push({
        name: this.cwd[i],
        path: this.cwd.slice(0, i + 1),
      });
    }
    return parts;
  });

  mainSelectedEntry = $derived(
    this.entries.find((e) => e.id === this.mainSelectedId) ?? null,
  );

  async refresh() {
    this.error = null;

    try {
      const raw = await this.api.fs.listDir(this.cwd);
      this.entries = [];

      for (const entry of raw) {
        this.entries.push(entry);
        await sleep(randint(2, 3));
      }
    } catch (err) {
      this.error = "Reading directory failed: " + (err as Error).message;
    }
  }

  async navigate(path: string[]) {
    this.cwd = path;
    this.clearSelection();
    await this.refresh();
  }

  async goUp() {
    if (this.cwd.length > 0) {
      this.cwd.pop();
      this.clearSelection();
      await this.refresh();
    }
  }

  async openDir(entry: FsEntry) {
    // TODO: file open
    if (entry.type !== "dir") return;

    // TODO: error here
    this.cwd = (await this.api.fs.getPath(entry)) ?? this.cwd;
    this.clearSelection();
    await this.refresh();
  }

  async openSelected() {
    if (!this.mainSelectedEntry) return;

    this.openDir(this.mainSelectedEntry);
  }

  handleSelect(id: string, ctrl: boolean, shift: boolean) {
    if (shift && this.mainSelectedId) {
      const all = this.sortedEntries;
      const start = all.findIndex((e) => e.id === this.mainSelectedId);
      const end = all.findIndex((e) => e.id === id);
      const range = all.slice(Math.min(start, end), Math.max(start, end) + 1);

      if (!ctrl) this.selectedIds.clear();
      for (const item of range) {
        this.selectedIds.add(item.id);
      }
    } else if (ctrl) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        if (this.mainSelectedId === id)
          this.mainSelectedId = Array.from(this.selectedIds)[0] || null;
      } else {
        this.selectedIds.add(id);
        this.mainSelectedId = id;
      }
    } else {
      this.selectedIds.clear();
      this.selectedIds.add(id);
      this.mainSelectedId = id;
    }
  }

  clearSelection() {
    this.selectedIds.clear();
    this.mainSelectedId = null;
  }

  async deleteSelected() {
    if (this.selectedIds.size === 0) return;

    let count = 0;
    const pathsToRemove: { id: string; path: string[] }[] = [];
    const entriesToProcess = this.entries.filter((e) =>
      this.selectedIds.has(e.id),
    );

    for (const entry of entriesToProcess) {
      const path = await this.api.fs.getPath(entry);
      if (!path) continue;

      pathsToRemove.push({ id: entry.id, path });

      if (entry.type === "dir") {
        const subFiles = await this.api.fs.listDirRecursive(path);
        count += subFiles.length + 1;
      } else {
        count += 1;
      }
    }

    const message =
      pathsToRemove.length === 1
        ? `Delete "${joinPath(pathsToRemove[0].path, false)}"?`
        : `Delete ${count} items?`;

    const ret = await this.api.showDialog({ message });
    if (ret !== 1) return;

    try {
      for (const { id, path } of pathsToRemove) {
        await this.api.fs.removeRecursive(path);
        this.entries = this.entries.filter((e) => e.id !== id);
      }

      this.clearSelection();
    } catch (err) {
      this.error = "Deletion failed: " + (err as Error).message;
    }
  }

  startCreating(type: EntryType) {
    this.editing = { type, name: "", mode: "creating" };
  }

  async commitCreate() {
    if (!this.editing || this.editing.mode !== "creating" || !this.editing.name)
      return;

    const path = [...this.cwd, this.editing.name];
    try {
      let entry;
      if (this.editing.type === "file") {
        entry = await this.api.fs.writeFile(path, { data: new Blob() });
      } else {
        entry = await this.api.fs.mkdir(path);
      }

      this.entries.push(entry);
      this.handleSelect(entry.id, false, false);
      this.editing = null;
    } catch (err) {
      this.error = "Failed to create entry: " + (err as Error).message;
    }
  }

  cancelEdits() {
    this.editing = null;
  }
}
