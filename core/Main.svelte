<script lang="ts">
  import { notepadManifest } from "../apps/notepad/notepad";
  import { paintManifest } from "../apps/paint/paint";
  import { terminalManifest } from "../apps/terminal/terminal";
  import { asdfManifest } from "../cmds/asdf";
  import { cdManifest } from "../cmds/cd";
  import { deleteManifest } from "../cmds/delete";
  import { echoManifest } from "../cmds/echo";
  import { helpManifest } from "../cmds/help";
  import { listManifest } from "../cmds/list";
  import { mkdirManifest } from "../cmds/mkdir";
  import { mkfileManifest } from "../cmds/mkfile";
  import { pwdManifest } from "../cmds/pwd";
  import { readManifest } from "../cmds/read";
  import { launchApp, registerApp } from "./app/appregistry";
  import { registerCmd } from "./cmd/cmdregistry";
  import { testAppManifest } from "./testApp";
  import Taskbar from "./wm/Taskbar.svelte";
  import Window from "./wm/Window.svelte";
  import { winDataBuilder, wmApi } from "./wm/wm.svelte";

  registerApp(testAppManifest);
  registerApp(notepadManifest);
  registerApp(terminalManifest);
  registerApp(paintManifest);

  registerCmd(helpManifest);
  registerCmd(asdfManifest);
  registerCmd(echoManifest);
  registerCmd(pwdManifest);
  registerCmd(mkdirManifest);
  registerCmd(mkfileManifest);
  registerCmd(cdManifest);
  registerCmd(listManifest);
  registerCmd(readManifest);
  registerCmd(deleteManifest);
</script>

<div id="root">
  <div id="desktop">
    {#each wmApi.getWindows().entries() as [id, win] (id)}
      <Window
        {id}
        windowData={win.data}
        focused={id ===
          wmApi.getFocusHistory()[wmApi.getFocusHistory().length - 1]}
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
    <button onclick={(_) => launchApp("paint")}>michaelsoft paint</button>
  </div>
  <Taskbar taskbar={wmApi.getTaskbar()} {wmApi} />
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
