<script lang="ts">
  import { launchApp, registerApp } from "@os/app/appregistry"; 
  import { launchAppFromManifest } from "@os/app/processes";
  import { mousePos } from "./core/os/state.svelte";
  import { playClickDown, playClickUp } from "@os/audio/click";
  import { initAudio } from "@os/audio/sounds";
  import { registerCmd } from "@os/cmd/cmdregistry";
  import { writeInitialFiles } from "@os/fs/filesystem";
  import DebugPhysicsOverlay from "@os/physics/DebugPhysicsOverlay.svelte";
  import { initPhysics } from "@os/physics/physics";
  import { enablePhysics } from "@os/physics/windows";
  import { enablePhysicsForAll } from "@os/physics/windows";
  import Taskbar from "@os/wm/Taskbar.svelte";
  import Window from "@os/wm/Window.svelte";
  import { wmApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  // app manifests
  const AppModules = import.meta.glob<Record<string, any>>('./core/apps/**/*.manifest.ts', { eager: true });
  import { testAppManifest } from "./core/apps/testApp.manifest";

  const CmdModules = import.meta.glob<Record<string, any>>('./core/cmds/*.manifest.ts', { eager: true });

  // secret import
  import { hydraManifest } from "./game/apps/hydra";
  import Bsod from "./game/Bsod.svelte";
  import { gameState } from "./game/gameState.svelte";
  import Trail from "./game/Trail.svelte";

  // adding apps to app registry
  Object.values(AppModules).forEach((module) => {
    Object.entries(module).forEach(([exportName, exportValue]) => {
      if (exportName.endsWith('Manifest')) {
        registerApp(exportValue);
      }
    });
  });

  // adding cmds to cmd registry
  Object.values(CmdModules).forEach((module) => {
    Object.entries(module).forEach(([exportName, exportValue]) => {
      if (exportName.endsWith('Manifest')) {
        registerCmd(exportValue);
      }
    });
  });

  console.log(CmdModules);

  let debugPhysicsOverlay = $state(false);

  /** Passes mouse movements from App to Browser */
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
          windowData = {win.data}
          focused = {id === wmApi.getFocusHistory()[wmApi.getFocusHistory().length - 1]}
          callbacks = {win.callbacks}
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
      <button onclick={(_) => launchApp("firebeats")}>make sum fire beats</button>
      <button onclick={(_) => launchAppFromManifest(hydraManifest)}>hydra.exe</button>
      <button onclick={(_) => launchApp("settings")}>settings</button>
      <button onclick={(_) => enablePhysicsForAll()}>fysiks</button>
      <button onclick={(_) => {
          wmApi.on("anymounted", (id) => enablePhysics(id));
        }}>fysiks 2</button
      >
      <button onclick={(_) => {debugPhysicsOverlay = !debugPhysicsOverlay;}}>toggle hitboxes</button>

      {#if gameState.isTrail}
        <Trail />
      {/if}
    </div>
    <Taskbar taskbar={wmApi.getTaskbar()} {wmApi} />
  </div>

  <DebugPhysicsOverlay show={debugPhysicsOverlay} />

  {#if gameState.isBsod}
    <Bsod />
  {/if}
</div>

<svelte:window
  onmousemove={handleMouseMove}
  onmousedowncapture={playClickDown}
  onmouseupcapture={playClickUp}
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
