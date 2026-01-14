<script lang="ts">
  import type { AppApi } from "@os/app/api";
  import {
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    type MainSettings,
  } from "@os/settings/settings";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  let { api: api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let settings: MainSettings = $state(DEFAULT_SETTINGS);
  let isLoading = $state(true);

  onMount(async () => {
    settings = await getSettings();
    isLoading = false;
  });

  async function apply() {
    if (settings) {
      await saveSettings(settings);
    }
  }
</script>

{#if !isLoading}
  <div class="settings">
    <div class="main">
      <div class="field-row">
        <label for="mastervol">Main Volume</label>
        <label for="mastervol">Low</label>
        <input
          type="range"
          id="mastervol"
          min="1"
          max="100"
          bind:value={settings.mainvol}
        />
        <label for="mastervol">High</label>
      </div>

      <div class="field-row">
        <label for="uivol">UI Volume</label>
        <label for="uivol">Low</label>
        <input
          type="range"
          id="uivol"
          min="1"
          max="100"
          bind:value={settings.uivol}
        />
        <label for="uivol">High</label>
      </div>
    </div>

    <div class="buttons">
      <button onclick={() => apply()}>apply</button>
      <button
        onclick={async () => {
          await apply();
          api.quit();
        }}>ok</button
      >
      <button onclick={() => api.quit()}>cancel</button>
    </div>
  </div>
{/if}

<style>
  input {
    width: 100%;
    margin-right: 15px;
  }

  .settings {
    position: relative;
    height: 100%;

    display: flex;
    flex-direction: column;
  }

  .main {
    flex-grow: 1;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
  }
</style>
