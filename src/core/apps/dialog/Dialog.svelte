<script lang="ts">
  import type { DialogArgs } from "./dialog";

  let { args, quit }: { args: DialogArgs; quit: (code: number) => void } =
    $props();

  // svelte-ignore state_referenced_locally
  let message = args?.message ?? "\xa0"; // nbsp
  // svelte-ignore state_referenced_locally
  let buttons = args?.buttons ?? ["cancel", "ok"];

  function handleKeyPress() {}
</script>

<svelte:window onkeypress={handleKeyPress} />

<div class="dialog">
  <div class="main">
    <div class="message">{message}</div>
  </div>
  <div class="buttons">
    {#each buttons as button, i}
      <button
        onclick={() => {
          quit(i);
        }}
      >
        {button}
      </button>
    {/each}
  </div>
</div>

<style>
  .dialog {
    position: relative;
    height: 100%;

    display: flex;
    flex-direction: column;
  }

  .main {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
  }
</style>
