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
  import { searchKeymap } from "@codemirror/search";
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
  import { EditorView } from "codemirror";
  import { onDestroy, onMount } from "svelte";

  let {
    content,
    active,
    onDocChange,
  }: {
    content: string;
    active: boolean;
    onDocChange: (content: string) => void;
  } = $props();

  let currentFile: string[] | null = $state(null);
  let currentFileContent = "";
  let isSaved = $state(true);

  let container: HTMLElement;
  let view: EditorView;

  const fullHeight = EditorView.theme({
    "&": { height: "100%", "background-color": "#F0EFEB" },
    ".cm-scroller": { overflow: "auto" },
    ".cm-selectionMatch": {
      outline: "1px solid #c8d6c3",
      // "background-color": "transparent",
      "background-color": "#99ff7710",
    },
    ".cm-selectionMatch-main": {
      // outline: "1px solid #c8d6c3",
      // "background-color": "transparent",
      // "background-color": "#99ff7710",
    },
  });

  onMount(() => {
    view = new EditorView({
      doc: content,
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
        // highlightSelectionMatches({
        //   highlightWordAroundCursor: true,
        // }),
        fullHeight,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onDocChange(update.state.doc.toString());
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
  });

  onDestroy(() => {
    view.destroy();
  });
</script>

<div class="codeview" style={active ? "" : "display: none;"}>
  <div class="editor-wrapper" bind:this={container}></div>
</div>

<style>
  .codeview {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .editor-wrapper {
    border: 1px solid #ccc;
    flex: 1;
    overflow: auto;
  }
</style>
