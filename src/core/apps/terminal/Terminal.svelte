<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import { closeApp } from "@os/app/processes";
  import {
    DEFAULTOPTIONS,
    type CmdApi,
    type TextOptions,
  } from "@os/cmd/command";
  import { splitArgs } from "@os/cmd/parser";
  import { joinPath } from "@os/fs/filesystem";
  import { type WindowApi } from "@os/wm/wm.svelte";
  import { onMount, tick } from "svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let history: string[] = $state([]);
  // -1 means temp input value
  // -2 means blank
  let historyIndex: number = $state(-1);
  // saves currently editing command
  // so when you go up and back down its still there
  let temporaryInput: string = "";

  let lines: [string, TextOptions][][] = $state([]);
  let workingDir: string[] = $state([]);
  let isCmdRunning: boolean = $state(false);
  let isInputRunning: boolean = $state(false);

  let prompt: string = $derived(`[ ${joinPath(workingDir)} ] $`);

  let resolveInput: ((value: string) => void) | null = null;

  let textInput: HTMLInputElement;
  let terminal: HTMLElement;
  let currPrompt: HTMLElement;

  onMount(() => {
    addLine("type help for help");
    textInput.focus();
  });

  function processCommand(input: string) {
    input = input.trim();

    if (history[history.length - 1] !== input) {
      history.push(input);
    }
    historyIndex = -1;

    const [cmd, ...rest] = input.split(" ");
    const args = rest.join(" ");

    let cmdApi: CmdApi = {
      getArgs: () => splitArgs(args),
      getWorkingDir: () => workingDir,
      setWorkingDir: async (path: string[]) => {
        if (!(await api.fs.exists(path))) {
          return;
        }
        if ((await api.fs.type(path)) !== "dir") {
          return;
        }
        workingDir = path;
      },
      appendLine: (content, options = {}) => appendLine(content, options),
      writeLine: (line, options = {}) => addLine(line, options),
      getInput: async () => {
        isInputRunning = true;
        await tick();
        textInput.focus();

        return new Promise<string>((resolve) => {
          resolveInput = resolve;
        });
      },
    };

    let procApi = api.launchCmd(cmd, cmdApi);
    if (procApi === null) {
      addLine(`Command not found: ${cmd}`);
      return;
    }

    isCmdRunning = true;
    procApi.on("setupFinished", async () => {
      // TODO: put this somewhere better
      closeApp(procApi.getId());

      isCmdRunning = false;
      await tick();
      scrollToBottom();
      textInput.focus({ preventScroll: true });
    });
  }

  function addLine(line: string, options: Partial<TextOptions> = {}) {
    let newOptions = { ...DEFAULTOPTIONS, ...options };

    lines.push([[line, newOptions]]);
    tick().then(() => {
      scrollToBottom();
    });
  }

  function appendLine(txt: string, options: Partial<TextOptions> = {}) {
    let newOptions = { ...DEFAULTOPTIONS, ...options };

    if (lines.length === 0) {
      lines.push([[txt, newOptions]]);
    } else {
      lines[lines.length - 1].push([txt, newOptions]);
    }
  }

  function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      // launch command
      if (!isCmdRunning) {
        const command = textInput.value.trim();
        let promptNow = prompt;
        addLine(promptNow + " " + command);
        textInput.value = "";

        processCommand(command);
        return;
      }

      // run input
      if (isInputRunning && resolveInput !== null) {
        const input = textInput.value;
        addLine(input);
        textInput.value = "";

        isInputRunning = false;
        resolveInput(input);
        resolveInput = null;
        return;
      }
    }

    if (!isCmdRunning && !isInputRunning) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;

        if (historyIndex === -2) {
          historyIndex++;

          if (textInput.value === "") {
            textInput.value = temporaryInput;
            temporaryInput = "";
            return;
          }
        }

        if (historyIndex === -1) {
          temporaryInput = textInput.value;
        }

        if (historyIndex < history.length - 1) {
          historyIndex++;
          textInput.value = history[history.length - 1 - historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();

        if (historyIndex === -1 && textInput.value !== "") {
          historyIndex--;
          temporaryInput = textInput.value;
          textInput.value = "";
          return;
        }

        if (historyIndex > -1) {
          historyIndex--;
          if (historyIndex === -1) {
            textInput.value = temporaryInput;
          } else {
            textInput.value = history[history.length - 1 - historyIndex];
          }
        }
      }
    }
  }

  // svelte-ignore state_referenced_locally
  winApi.on("focus", (wasWindowContent) => {
    if (wasWindowContent) return;
    textInput.focus({ preventScroll: true });
  });

  function handleMouseUp() {
    const selection = window.getSelection();
    if (selection && selection.toString().length === 0) {
      textInput.focus({ preventScroll: true });
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={terminal} class="terminal" onmouseup={handleMouseUp}>
  {#each lines as line}
    <div class="terminal-line">
      <span class="terminal-segment">
        {#each line as [text, options]}
          <span
            style="
              color: {options.color};
              font-weight: {options.bold ? 'bold' : 'normal'};
              font-style: {options.italic ? 'italic' : 'normal'};
            "
          >
            {text}
          </span>
        {/each}
      </span>
    </div>
  {/each}

  <div class="prompt">
    <span style="display: {isCmdRunning ? 'none' : 'inline'}">
      {prompt}
    </span>
    <input
      bind:this={textInput}
      type="text"
      style="display: {!isCmdRunning || isInputRunning ? 'inline' : 'none'}"
      onkeydown={handleKeyDown}
      spellcheck="false"
      class="input"
    />
  </div>
</div>

<style>
  .terminal {
    box-sizing: border-box;
    background-color: black;
    color: #f5f5f5;

    font-size: 13px;
    font-family: "Cozette", monospace;
    font-smooth: never;
    line-height: 17px;

    margin: 0px;
    padding: 0.3rem;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
    height: 100%;
  }

  .terminal-line {
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    padding: 0;
  }

  .terminal-line:empty::after {
    content: "\00a0"; /* nbsp */
  }

  .prompt {
    margin: 0;
    padding: 0;
  }

  .terminal-line::selection,
  .prompt::selection {
    color: black;
    background-color: white;
  }

  input.input {
    background-color: rgba(0, 0, 0, 0);

    color: #f5f5f5;
    margin: 0;
    padding: 0;

    font-size: inherit;
    font-family: inherit;

    outline: none;
    border: none;
    border-radius: 0;
    word-wrap: break-word;
    word-break: break-all;
  }
</style>
