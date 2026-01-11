<script lang="ts">
  import { launchApp, registerApp } from "@os/app/appregistry";
  import { playClick } from "@os/audio/click";
  import { registerCmd } from "@os/cmd/cmdregistry";
  import Taskbar from "@os/wm/Taskbar.svelte";
  import Window from "@os/wm/Window.svelte";
  import { wmApi } from "@os/wm/wm.svelte";
  import { browserManifest } from "./core/apps/browser/browser";
  import { calcManifest } from "./core/apps/calc/calc";
  import { dialogManifest } from "./core/apps/dialog/dialog";
  import { explorerManifest } from "./core/apps/explorer/explorer";
  import { notepadManifest } from "./core/apps/notepad/notepad";
  import { paintManifest } from "./core/apps/paint/paint";
  import { terminalManifest } from "./core/apps/terminal/terminal";
  import { testAppManifest } from "./core/apps/testApp";
  import { asdfManifest } from "./core/cmds/asdf";
  import { cdManifest } from "./core/cmds/cd";
  import { deleteManifest } from "./core/cmds/delete";
  import { dialogCmdManifest } from "./core/cmds/dialog";
  import { echoManifest } from "./core/cmds/echo";
  import { explorerCmdManifest } from "./core/cmds/explorer";
  import { helpManifest } from "./core/cmds/help";
  import { launchManifest } from "./core/cmds/launch";
  import { listManifest } from "./core/cmds/list";
  import { listAppsManifest } from "./core/cmds/list_apps";
  import { mkdirManifest } from "./core/cmds/mkdir";
  import { mkfileManifest } from "./core/cmds/mkfile";
  import { mkwindowManifest } from "./core/cmds/mkwindow";
  import { psManifest } from "./core/cmds/ps";
  import { pwdManifest } from "./core/cmds/pwd";
  import { readManifest } from "./core/cmds/read";
  import { sleepManifest } from "./core/cmds/sleep";
  import { mousePos } from "./core/os/state.svelte";
  import { hydraManifest } from "./game/apps/hydra";
  import Bsod from "./game/Bsod.svelte";
  import { gameState } from "./game/gameState.svelte";
  import Trail from "./game/Trail.svelte";

  registerApp(testAppManifest);
  registerApp(notepadManifest);
  registerApp(terminalManifest);
  registerApp(paintManifest);
  registerApp(explorerManifest);
  registerApp(calcManifest);
  registerApp(dialogManifest);
  registerApp(browserManifest);
  registerApp(hydraManifest);

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
  registerCmd(listAppsManifest);
  registerCmd(launchManifest);
  registerCmd(psManifest);
  registerCmd(sleepManifest);
  registerCmd(mkwindowManifest);
  registerCmd(explorerCmdManifest);
  registerCmd(dialogCmdManifest);

  function handleMouseMove(e: MouseEvent) {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  }

  function handleMouseDown(e: MouseEvent) {
    playClick();
  }

  let trail: Trail;
</script>

<div id="root">
  <div id="desktop-container">
    <div id="desktop">
      {#each wmApi.getWindows().entries() as [id, win] (id)}
        <Window
          {id}
          windowData={win.data}
          focused={id ===
            wmApi.getFocusHistory()[wmApi.getFocusHistory().length - 1]}
          callbacks={win.callbacks}
          {wmApi}
        />
      {/each}

      <button onclick={(_) => launchApp("test_app")}>make app</button>
      <button onclick={(_) => launchApp("notepad")}>notepad</button>
      <button onclick={(_) => launchApp("terminal")}>terminal</button>
      <button onclick={(_) => launchApp("paint")}>michaelsoft paint</button>
      <button onclick={(_) => launchApp("explorer")}>file explorer</button>
      <button onclick={(_) => launchApp("calc")}>calcoolator</button>
      <button onclick={(_) => launchApp("browser")}>internet exploder</button>
      <button onclick={(_) => launchApp("hydra")}>hydra.exe</button>

      {#if gameState.isTrail}
        <Trail />
      {/if}
    </div>
    <Taskbar taskbar={wmApi.getTaskbar()} {wmApi} />
  </div>

  {#if gameState.isBsod}
    <Bsod />
  {/if}
</div>

<svelte:window onmousemove={handleMouseMove} onmousedown={handleMouseDown} />

<style>
  #root {
    height: 100vh;
  }

  #desktop-container {
    position: absolute;
    width: 100%;
    height: 100%;
    isolation: isolate;
    overflow: hidden;
  }

  #desktop {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: teal;
    overflow: hidden;
    isolation: isolate;
  }
</style>
