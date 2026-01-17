<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import { FsError, joinPath } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import CodeTab from "./CodeTab.svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  interface TabData {
    id: string;
    path: string[] | null;
    content: string;
    initialContent: string;
    isSaved: boolean;
    editorRef: CodeTab | null;
  }

  let tabs: TabData[] = $state([]);

  let activeTabIndex = $state(0);
  let activeTab: TabData | undefined = $derived(tabs[activeTabIndex]);

  // svelte-ignore state_referenced_locally
  winApi.on("close", async () => {
    console.log("a");

    let unsaved = tabs.filter((tab) => !tab.isSaved).length;
    if (unsaved > 0) {
      let code = await api.showDialog({
        message: `are you sure you want to quit? you have ${unsaved} unsaved files.`,
      });

      if (code !== 1) {
        return;
      }
    }

    api.quit();
  });

  function addTab(data?: Partial<TabData>) {
    tabs.push({
      id: crypto.randomUUID(),
      path: null,
      content: "",
      initialContent: "",
      isSaved: true,
      editorRef: null,
      ...data,
    });
    activeTabIndex = tabs.length - 1;
  }

  async function closeTab(index: number) {
    const tab = tabs[index];
    if (!tab.isSaved) {
      let code = await api.showDialog({
        message: `would you like to close ${joinPath(tab.path ?? [])} without saving?`,
        buttons: ["save", "dont save", "cancel"],
      });

      if (code === 2) {
        return;
      }

      if (code === 0) {
        handleSave();
      }
    }

    const closingActive = index === activeTabIndex;
    tabs = tabs.filter((_, i) => i !== index);

    if (tabs.length === 0) {
      activeTabIndex = 0;
    } else if (closingActive) {
      activeTabIndex = Math.max(0, index - 1);
    } else if (index < activeTabIndex) {
      activeTabIndex--;
    }
  }

  async function openFile(path: string[]) {
    let alreadyTab = tabs.findIndex((data) => {
      return data.path?.every((part, i) => part === path[i]);
    });
    if (alreadyTab !== -1) {
      activeTabIndex = alreadyTab;
      return;
    }

    try {
      const content = await api.fs.readFile(path);
      const text = await content.data.text();

      addTab({ path: path, content: text, initialContent: text });
    } catch (err) {
      if (err instanceof FsError) {
        // TODO: replace this
        console.error(err.message);
      }
      console.error(err);
      return;
    }
  }

  async function handleOpen() {
    let procApi = api.launchApp("explorer", { dialogType: "fileonly" });
    procApi?.on("exit", (result) => {
      if (result?.selectedEntry == null) {
        return;
      }
      openFile(result.selectedEntry);
    });
  }

  async function handleSave() {
    if (!activeTab) return;

    if (!activeTab.path) return handleSaveAs();

    try {
      await api.fs.overwriteFile(activeTab.path, {
        data: new Blob([activeTab.content]),
      });
    } catch (err) {
      if (err instanceof FsError) {
        console.error(err.message);
      }
      console.error(err);
      return;
    }

    activeTab.initialContent = activeTab.content;
    activeTab.isSaved = true;
  }

  async function handleSaveAs() {
    if (!activeTab) return;

    let wd = null;
    let name = null;

    let path = activeTab.path;
    if (path !== null) {
      wd = [...path];
      name = wd.pop();
    }

    let procApi = api.launchApp("explorer", {
      dialogType: "save",
      workingDir: wd,
      saveDefaultName: name,
    });

    procApi?.on("exit", async (result) => {
      if (!result?.selectedEntry) return;

      try {
        await api.fs.overwriteFile(result.selectedEntry, {
          data: new Blob([activeTab.content]),
        });
      } catch (err) {
        if (err instanceof FsError) {
          console.error(err.message);
        }
        console.error(err);
        return;
      }

      activeTab.path = result.selectedEntry;
    });
  }
</script>

<div class="code">
  <div class="toolbar">
    <button onclick={handleOpen}>open</button>
    <button onclick={handleSave}>save</button>
    <button onclick={handleSaveAs}>save as</button>
  </div>

  <div class="tablist">
    {#each tabs as tab, i (tab.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tab"
        class:active={i === activeTabIndex}
        onclick={() => (activeTabIndex = i)}
      >
        <span class="tablabel">
          {tab.path ? tab.path.at(-1) : "Untitled"}{tab.isSaved ? "" : "*"}
        </span>

        <button
          class="closebutton"
          onclick={(e) => {
            e.stopPropagation();
            closeTab(i);
          }}>x</button
        >
      </div>
    {/each}
  </div>

  {#each tabs as tab, i (tab.id)}
    <CodeTab
      bind:this={tab.editorRef}
      content={tab.content}
      active={i === activeTabIndex}
      onDocChange={(text) => {
        tab.content = text;
        tab.isSaved = text === tab.initialContent;
      }}
    />
  {/each}
</div>

<style>
  .code {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .toolbar {
    flex: 0 0 auto;
    margin-bottom: 10px;
  }
</style>
