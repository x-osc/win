<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { AppApi } from "../../core/app/api";
  import type { WindowApi } from "../../core/wm/wm.svelte";
  import { helpManifest } from "../../cmds/help";
  import type { CmdApi } from "../../core/app/command";
  import { launchCmdFromManifest } from "../../core/app/apps.svelte";

  let { appApi, winApi }: { appApi: AppApi; winApi: WindowApi } = $props();

  let lines: string[] = $state([]);

  let input: HTMLInputElement;
  let terminal: HTMLElement;
  let currPrompt: HTMLElement;

  onMount(() => {
    addLine("balls");
    input.focus();
  });

  function processCommand(command: string) {
    let cmdApi: CmdApi = {
      getArgs: () => [""],
      writeLine: (line) => addLine(line),
    };

    if (command == "help") {
      launchCmdFromManifest(helpManifest, cmdApi);
    }
  }

  function addLine(line: string) {
    lines.push(line);
    tick().then(() => {
      terminal.scrollTop = terminal.scrollHeight;
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const command = input.value.trim();
      addLine("$ " + command);
      processCommand(command);
      input.value = "";
    }
  }

  // TODO: logic like on input blur => check if win is focused => if is then focus input
  winApi.on("focus", () => {
    input.focus();
  });
</script>

<div bind:this={terminal} class="terminal">
  {#each lines as line}
    <div class="terminal-line">{line}</div>
  {/each}
  <div class="prompt">
    <span>$ </span>
    <input
      bind:this={input}
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
