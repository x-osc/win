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
  import { joinPath } from "@os/fs/filesystem";
  import { EditorView } from "codemirror";
  import { onMount } from "svelte";

  let {}: {} = $props();

  let currentFile: string[] | null = $state(null);
  let currentFileContent = "";
  let isSaved = $state(true);

  let container: HTMLElement;
  let view: EditorView;

  const fullHeight = EditorView.theme({
    "&": { height: "100%", "background-color": "#F0EFEB" },
  });

  onMount(() => {
    view = new EditorView({
      doc: "",
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
      parent: container,
    });

    return () => {
      view.destroy();
    };
  });

  export function getEditorText() {
    return view?.state.doc.toString() ?? "";
  }

  export function setEditorText(text: string) {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: text,
      },
    });
  }

  export function setFile(path: string[], content: string) {
    currentFile = path;
    currentFileContent = content;
    setEditorText(content);
    updateSaved();
  }

  export function getFile(): string[] | null {
    return currentFile;
  }

  export function setCurrentContent(content: string) {
    currentFileContent = content;
    updateSaved();
  }

  function updateSaved() {
    isSaved = getEditorText() === currentFileContent;
  }
</script>

<div class="codetab">
  <div class="pathbar">
    {currentFile ? joinPath(currentFile, false) : "untitled-1 (new file)"}
    {isSaved ? "" : "*"}
  </div>

  <div class="editor-wrapper" bind:this={container}></div>
</div>

<style>
  .codetab {
    flex: 1;
    display: flex;
    flex-direction: column;
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
