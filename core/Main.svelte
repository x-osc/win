<script lang="ts">
  import { launchApp, registerApp } from "$lib/app/apps.svelte";
  import { testAppManifest } from "$lib/testApp";
  import Taskbar from "$lib/wm/Taskbar.svelte";
  import Window from "$lib/wm/Window.svelte";
  import {
    getFocusHistory,
    getTaskbar,
    winDataBuilder,
    wmApi,
  } from "$lib/wm/wm.svelte";
  import { notepadManifest } from "../apps/notepad/notepad";
  import { terminalManifest } from "../apps/terminal/terminal";
  import { asdfManifest } from "../cmds/asdf";
  import { echoManifest } from "../cmds/echo";
  import { helpManifest } from "../cmds/help";
  import { registerCmd } from "./app/apps.svelte";

  import "$lib/fs/filesystem.ts";

  registerApp(testAppManifest);
  registerApp(notepadManifest);
  registerApp(terminalManifest);

  registerCmd(helpManifest);
  registerCmd(asdfManifest);
  registerCmd(echoManifest);
</script>

<div id="root">
  <div id="desktop">
    {#each wmApi.getWindows().entries() as [id, win] (id)}
      <Window
        {id}
        windowData={win.data}
        focused={id === getFocusHistory()[getFocusHistory().length - 1]}
        {wmApi}
      />
    {/each}

    <button
      onclick={(_) =>
        wmApi.createWindow(winDataBuilder().withTitle("test_win").build())}
      >make window</button
    >
    <button onclick={(_) => launchApp("test_app")}>make app</button>
    <button onclick={(_) => launchApp("notepad")}>notepad</button>
    <button onclick={(_) => launchApp("terminal")}>terminal</button>
  </div>
  <Taskbar taskbar={getTaskbar()} {wmApi} />
</div>

<style>
  #root {
    height: 100vh;
  }

  #desktop {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: teal;
    overflow: hidden;
  }
</style>
