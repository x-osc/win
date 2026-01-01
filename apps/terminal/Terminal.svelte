<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { AppApi } from "../../core/app/api";
  import { launchCmd } from "../../core/app/apps.svelte";
  import type { CmdApi } from "../../core/cmd/command";
  import { splitArgs } from "../../core/cmd/parser";
  import { joinPath } from "../../core/fs/filesystem";
  import type { WindowApi } from "../../core/wm/wm.svelte";

  let { appApi, winApi }: { appApi: AppApi; winApi: WindowApi } = $props();

  let lines: string[] = $state([]);
  let workingDir: string[] = $state([]);
  let isCmdRunning: boolean = $state(false);
  let isInputRunning: boolean = $state(false);

  let resolveInput: (value: string) => void | null = null;

  let textInput: HTMLInputElement;
  let terminal: HTMLElement;
  let currPrompt: HTMLElement;

  onMount(() => {
    textInput.focus();
  });

  function processCommand(input: string) {
    const [cmd, ...rest] = input.split(" ");
    const args = rest.join(" ");

    let cmdApi: CmdApi = {
      getArgs: () => splitArgs(args),
      getWorkingDir: () => workingDir,
      setWorkingDir: async (path: string[]) => {
        if (!(await appApi.fs.exists(path))) {
          return;
        }
        if ((await appApi.fs.type(path)) !== "dir") {
          return;
        }
        workingDir = path;
      },
      appendLine: (content: string) => appendLine(content),
      writeLine: (line) => addLine(line),
      getInput: async () => {
        isInputRunning = true;
        await tick();
        textInput.focus();

        return new Promise<string>((resolve) => {
          resolveInput = resolve;
        });
      },
    };

    let procApi = launchCmd(cmd, cmdApi);
    if (procApi === null) {
      addLine(`Command not found: ${cmd}`);
      return;
    }

    isCmdRunning = true;
    procApi.on("exit", async () => {
      isCmdRunning = false;
      await tick();
      textInput.focus();
    });
  }

  function addLine(line: string) {
    lines.push(line);
    tick().then(() => {
      terminal.scrollTop = terminal.scrollHeight;
    });
  }

  function appendLine(txt: string) {
    if (lines.length === 0) {
      lines.push(txt);
    } else {
      lines[lines.length - 1] += txt;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      if (!isCmdRunning) {
        const command = textInput.value.trim();
        addLine("$ " + command);
        textInput.value = "";

        processCommand(command);
        return;
      }

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
  }

  winApi.on("focus", () => {
    textInput.focus();
  });

  function handleBlur(_) {
    if ((!isCmdRunning || isInputRunning) && winApi.isFocused()) {
      textInput.focus();
    }
  }
</script>

<div bind:this={terminal} class="terminal">
  {#each lines as line}
    <div class="terminal-line">{line}</div>
  {/each}

  <div class="prompt">
    <span style="display: {isCmdRunning ? 'none' : 'inline'}">
      [ {joinPath(workingDir)} ] $
    </span>
    <input
      bind:this={textInput}
      style="display: {!isCmdRunning || isInputRunning ? 'inline' : 'none'}"
      onkeydown={handleKeyDown}
      onblur={handleBlur}
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
    font-size: 14px;
    font-family: monospace;
    line-height: 1.4;
    margin: 0;
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

  .input {
    background-color: rgba(0, 0, 0, 0);
    color: #f5f5f5;
    margin: 0;
    padding: 0;
    font-family: monospace;
    font-size: 14px;
    outline: none;
    border: none;
    word-wrap: break-word;
    word-break: break-all;
  }
</style>
