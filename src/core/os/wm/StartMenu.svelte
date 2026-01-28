<script lang="ts">
  import { getApps, launchApp } from "@os/app/appregistry";

  let { closeMenu }: { closeMenu: () => void } = $props();
</script>

<div class="startmenu">
  <div class="header">
    <span>Start</span>
  </div>

  <div class="applist">
    {#each getApps().entries() as [id, app]}
      <button
        onclick={() => {
          closeMenu();
          launchApp(id);
        }}
      >
        <span class="name">{app.name}</span>
      </button>
    {/each}
  </div>

  <div class="footer">
    <button>Shutdown</button>
    <button>Restart</button>
  </div>
</div>

<style>
  .startmenu {
    position: absolute;
    bottom: calc(var(--taskbar-height) + 5px);
    left: 5px;
    width: 250px;
    height: 450px;
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  }

  .applist {
    background: white;
    margin: 2px;
    padding: 5px;
    flex-grow: 1;
    overflow-y: auto;
  }

  .applist button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .applist button:hover {
    background: teal;
    color: white;
  }

  .header {
    color: white;
    background-color: teal;
    padding: 10px;
    font-weight: bold;
  }
</style>
