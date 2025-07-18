<script lang="ts">
  import { launchApp, registerApp } from "./lib/apps.svelte";
  import Taskbar from "./lib/Taskbar.svelte";
  import { testAppManifest } from "./lib/testApp";
  import Window from "./lib/Window.svelte";
  import { getFocusHistory, getTaskbar, wmApi } from "./lib/wm.svelte";

  registerApp(testAppManifest);
</script>

<div id="root">
  <div id="desktop">
    {#each Object.entries(wmApi.getWindows()) as [id, win] (id)}
      <Window
        id={Number(id)}
        windowData={win}
        focused={Number(id) === getFocusHistory()[getFocusHistory().length - 1]}
        {wmApi}
      />
    {/each}

    <button onclick={(_) => wmApi.createWindow()}>make window</button>
    <button onclick={(_) => launchApp("test_app")}>make app</button>
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
