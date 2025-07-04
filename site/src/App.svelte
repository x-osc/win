<script lang="ts">
  import Window from "./lib/Window.svelte";

  let windows: any = $state([]);

  function createWindow() {
    const newWindow = {
      title: `Window ${windows.length + 1}`,
    };
    windows.push(newWindow);
  }
</script>

<div id="desktop">
  {#each windows as win}
    <Window title={win.title} />
  {/each}

  <button onclick={createWindow}>make window</button>
</div>

<style>
  #desktop {
    width: 100%;
    height: 100vh;
    background-color: teal;
  }
</style>
