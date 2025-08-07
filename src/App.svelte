<script lang="ts">
  import { launchApp, registerApp } from "$lib/app/apps.svelte";
  import Taskbar from "$lib/wm/Taskbar.svelte";
  import { testAppManifest } from "$lib/testApp";
  import { notepadManifest } from "../apps/notepad/notepad";
  import Window from "$lib/wm/Window.svelte";
  import {
    getFocusHistory,
    getTaskbar,
    winDataBuilder,
    wmApi,
  } from "../lib/wm/wm.svelte";

  registerApp(testAppManifest);
  registerApp(notepadManifest);
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
