<script lang="ts">
  import { launchApp, registerApp } from "@os/app/appregistry";
  import { launchProcess } from "@os/app/processes";
  import { playClickDown, playClickUp } from "@os/audio/click";
  import { initAudio } from "@os/audio/sounds";
  import { registerCmd } from "@os/cmd/cmdregistry";
  import { writeInitialFiles } from "@os/fs/filesystem";
  import DebugPhysicsOverlay from "@os/physics/DebugPhysicsOverlay.svelte";
  import { initPhysics } from "@os/physics/physics";
  import {
    disablePhysicsForAll,
    enablePhysics,
    enablePhysicsForAll,
  } from "@os/physics/windows";
  import Taskbar from "@os/wm/Taskbar.svelte";
  import Window from "@os/wm/Window.svelte";
  import { wmApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";
  // app manifests
  import { browserApp } from "./core/apps/browser/browser";
  import { calcApp } from "./core/apps/calc/calc";
  import { codeApp } from "./core/apps/code/code";
  import { dawApp } from "./core/apps/daw/daw";
  import { exporerApp } from "./core/apps/explorer/explorer";
  import { minesweeperApp } from "./core/apps/minesweeper/minesweeper";
  import { notepadApp } from "./core/apps/notepad/notepad";
  import { paintApp } from "./core/apps/paint/paint";
  import { settingsApp } from "./core/apps/settings/settings";
  import { terminalApp } from "./core/apps/terminal/terminal";
  import { viewerApp } from "./core/apps/viewer/veiwer";
  // terminal command manifests
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
  // secret import
  import ContextMenu from "@os/wm/ContextMenu.svelte";
  import { hydraProcess } from "./game/apps/hydra";
  import Bsod from "./game/Bsod.svelte";
  import { gameState } from "./game/gameState.svelte";
  import Trail from "./game/Trail.svelte";

  // adding apps to app registry
  registerApp(notepadApp);
  registerApp(terminalApp);
  registerApp(paintApp);
  registerApp(exporerApp);
  registerApp(calcApp);
  registerApp(browserApp);
  registerApp(minesweeperApp);
  registerApp(settingsApp);
  registerApp(dawApp);
  registerApp(codeApp);
  registerApp(viewerApp);

  // adding cmds to cmd registry
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

  let debugPhysicsOverlay = $state(false);

  /** sets global mousepos */
  function handleMouseMove(e: MouseEvent) {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  }

  onMount(async () => {
    writeInitialFiles();
    initAudio();
    initPhysics();
  });
</script>

<div class="root">
  <div class="desktop-container">
    <div class="desktop">
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
      <button onclick={(_) => launchApp("minesweeper")}>mine craft</button>
      <button onclick={(_) => launchApp("code")}>code</button>
      <button onclick={(_) => launchApp("firebeats")}
        >make sum fire beats</button
      >
      <button onclick={(_) => launchProcess(hydraProcess)}>hydra.exe</button>
      <button onclick={(_) => launchApp("settings")}>settings</button>
      <button onclick={(_) => enablePhysicsForAll()}>fysiks</button>
      <button onclick={(_) => disablePhysicsForAll()}> auf fysiks</button>
      <button
        onclick={(_) => {
          wmApi.on("anymounted", (id) => enablePhysics(id));
        }}>fysiks 2</button
      >
      <button
        onclick={(_) => {
          debugPhysicsOverlay = !debugPhysicsOverlay;
        }}>toggle hitboxes</button
      >

      {#if gameState.isTrail}
        <Trail />
      {/if}
    </div>
    <Taskbar taskbar={wmApi.getTaskbar()} {wmApi} />
  </div>

  <ContextMenu />

  <DebugPhysicsOverlay show={debugPhysicsOverlay} />

  {#if gameState.isBsod}
    <Bsod />
  {/if}
</div>

<svelte:window
  onmousemove={handleMouseMove}
  onmousedowncapture={playClickDown}
  onmouseupcapture={playClickUp}
  oncontextmenucapture={(e) => e.preventDefault()}
/>

<style>
  .root {
    height: 100vh;
  }

  .desktop-container {
    position: absolute;
    width: 100%;
    height: 100%;
    isolation: isolate;
    overflow: hidden;
  }

  .desktop {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
  }
</style>
