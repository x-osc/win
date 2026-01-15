<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onDestroy, onMount } from "svelte";
  import * as Tone from "tone";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  const steps = 16;
  const tracks = ["C4", "A3", "F3", "C3"];

  let grid: boolean[][] = $state(
    Array(tracks.length)
      .fill(null)
      .map(() => Array(steps).fill(false)),
  );

  let currentStep = $state(0);
  let isPlaying = $state(false);
  let synth: Tone.PolySynth;

  onMount(() => {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();

    Tone.getTransport().scheduleRepeat((time) => {
      grid.forEach((track, index) => {
        if (track[currentStep]) {
          synth.triggerAttackRelease(tracks[index], "8n", time);
        }
      });

      currentStep = (currentStep + 1) % steps;
    }, "16n");
  });

  onDestroy(() => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    if (synth) {
      synth.dispose();
    }
  });

  async function togglePlay() {
    await Tone.start();
    if (isPlaying) {
      Tone.getTransport().stop();
    } else {
      Tone.getTransport().start();
    }
    isPlaying = !isPlaying;
  }

  function toggleStep(trackIdx: number, stepIdx: number) {
    grid[trackIdx][stepIdx] = !grid[trackIdx][stepIdx];
  }
</script>

<div class="daw">
  <button onclick={togglePlay}>
    {isPlaying ? "stop" : "play"}
  </button>

  <div class="main">
    <div class="grid">
      {#each grid as track, tIdx}
        <div class="row">
          <!-- svelte-ignore a11y_consider_explicit_label -->
          {#each track as step, sIdx}
            <button
              class="step"
              class:activestep={step}
              class:highlight={currentStep === sIdx}
              onclick={() => toggleStep(tIdx, sIdx)}
            ></button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .main {
    overflow-y: auto;
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 20px;
  }

  .row {
    display: flex;
    gap: 5px;
  }

  .step {
    width: 30px;
    min-width: 30px;
    height: 30px;
    min-height: 30px;
    border: 1px solid #cccccc;
    background: white;
  }

  .activestep {
    background: #008cff;
  }

  .highlight {
    border: 2px solid black;
  }
</style>
