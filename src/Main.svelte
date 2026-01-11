<script lang="ts">
  import { launchApp, registerApp } from "@core/app/appregistry";
  import { playClick } from "@core/audio/click";
  import { registerCmd } from "@core/cmd/cmdregistry";
  import Taskbar from "@core/wm/Taskbar.svelte";
  import Window from "@core/wm/Window.svelte";
  import { wmApi } from "@core/wm/wm.svelte";
  import { browserManifest } from "./apps/browser/browser";
  import { calcManifest } from "./apps/calc/calc";
  import { dialogManifest } from "./apps/dialog/dialog";
  import { explorerManifest } from "./apps/explorer/explorer";
  import { hydraManifest } from "./apps/hydra";
  import { notepadManifest } from "./apps/notepad/notepad";
  import { paintManifest } from "./apps/paint/paint";
  import { terminalManifest } from "./apps/terminal/terminal";
  import { testAppManifest } from "./apps/testApp";
  import { asdfManifest } from "./cmds/asdf";
  import { cdManifest } from "./cmds/cd";
  import { deleteManifest } from "./cmds/delete";
  import { dialogCmdManifest } from "./cmds/dialog";
  import { echoManifest } from "./cmds/echo";
  import { explorerCmdManifest } from "./cmds/explorer";
  import { helpManifest } from "./cmds/help";
  import { launchManifest } from "./cmds/launch";
  import { listManifest } from "./cmds/list";
  import { listAppsManifest } from "./cmds/list_apps";
  import { mkdirManifest } from "./cmds/mkdir";
  import { mkfileManifest } from "./cmds/mkfile";
  import { mkwindowManifest } from "./cmds/mkwindow";
  import { psManifest } from "./cmds/ps";
  import { pwdManifest } from "./cmds/pwd";
  import { readManifest } from "./cmds/read";
  import { sleepManifest } from "./cmds/sleep";
  import { mousePos } from "./core/state.svelte";
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
