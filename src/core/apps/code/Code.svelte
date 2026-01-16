<script lang="ts">
  import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
  } from "@codemirror/autocomplete";
  import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
  } from "@codemirror/commands";
  import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    foldKeymap,
    indentOnInput,
    syntaxHighlighting,
  } from "@codemirror/language";
  import { lintKeymap } from "@codemirror/lint";
  import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
  import { EditorState } from "@codemirror/state";
  import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
  } from "@codemirror/view";
  import type { AppApi } from "@os/app/api";
  import { FsError, joinPath } from "@os/fs/filesystem";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { EditorView } from "codemirror";
  import { onMount } from "svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let editorContainer: HTMLElement;
  let view: EditorView;

  let currentFile: string[] | null = $state(null);
  let currentFileContent = "";
  let isSaved = $state(true);

  const fullHeight = EditorView.theme({
    "&": { height: "100%", "background-color": "#F0EFEB" },
  });

  onMount(() => {
    view = new EditorView({
      doc: "hi",
      extensions: [
        lineNumbers(),
        foldGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        EditorView.lineWrapping,
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        fullHeight,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            updateSaved();
          }
        }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
      ],
      parent: editorContainer,
    });

    return () => {
      view.destroy();
    };
  });

  function getEditorText() {
    return view?.state.doc.toString() ?? "";
  }

  function setEditorText(text: string) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: text,
      },
    });
  }

  async function openFile(path: string[]) {
    let content;
    try {
      content = await api.fs.readFile(path);
    } catch (err) {
      if (err instanceof FsError) {
        setEditorText(`an unexpected error occured: ${err.message}`);
      }
      return;
    }

    currentFile = path;
    let text = await content.data.text();
    currentFileContent = text;
    setEditorText(text);
    updateSaved();
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
    if (currentFile === null) {
      return;
    }
    try {
      await api.fs.overwriteFile(currentFile, {
        data: new Blob([getEditorText()]),
      });
    } catch (err) {
      if (err instanceof FsError) {
        setEditorText(`an unexpected error occured: ${err.message}`);
      }
      return;
    }
    currentFileContent = getEditorText();
    updateSaved();
  }

  async function handleSaveAs() {
    let wd = null;
    let name = null;
    if (currentFile !== null) {
      wd = [...currentFile];
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
          data: new Blob([getEditorText()]),
        });
      } catch (err) {
        if (err instanceof FsError) {
          setEditorText(`an unexpected error occured: ${err.message}`);
        }
        return;
      }
      currentFile = result.selectedEntry;
      currentFileContent = getEditorText();
      updateSaved();
    });
  }

  function updateSaved() {
    isSaved = getEditorText() === currentFileContent;
  }
</script>

<div class="notepad">
  <div class="toolbar">
    <button onclick={handleOpen}>open</button>
    <button
      onclick={() => {
        if (currentFile === null) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }}>save</button
    >
    <button onclick={handleSaveAs}>save as</button>
  </div>
  <div class="pathbar">
    {currentFile ? joinPath(currentFile, false) : "untitled-1 (new file)"}
    {isSaved ? "" : "*"}
  </div>

  <div class="editor-wrapper" bind:this={editorContainer}></div>
</div>

<style>
  .notepad {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .toolbar {
    flex: 0 0 auto;
  }

  .pathbar {
    flex: 0 0 auto;
  }

  .editor-wrapper {
    border: 1px solid #ccc;
    flex: 1;
    overflow: auto;
  }
</style>
