<script lang="ts">
  import { randFromArray, randint } from "@lib/core/utils/utils";
  import type { AppApi } from "@os/app/api";
  import { sadTromboneSfx, winSfx, youWinSfx } from "@os/audio/sounds";
  import type { WindowApi } from "@os/wm/wm.svelte";
  import { onMount } from "svelte";

  let { api, winApi }: { api: AppApi; winApi: WindowApi } = $props();

  let size: number = 10;
  let mineCount: number = 15;
  let grid: Grid = $state([]);
  let lose: boolean = $state(false);
  // say that again
  let win: boolean = $state(false);
  let isPressing: boolean = $state(false);

  interface Cell {
    r: number;
    c: number;
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    neighbors: number;
  }

  type Grid = Cell[][];

  onMount(() => {
    createGrid();
  });

  const createGrid = (): void => {
    let newGrid: Grid = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => ({
        r,
        c,
        mine: false,
        revealed: false,
        flagged: false,
        neighbors: 0,
      })),
    );

    let placed = 0;
    while (placed < mineCount) {
      const r = randint(1, size) - 1;
      const c = randint(1, size) - 1;
      if (!newGrid[r][c].mine) {
        newGrid[r][c].mine = true;
        placed++;
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c].mine) continue;

        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (newGrid[r + dr]?.[c + dc]?.mine) {
              count++;
            }
          }
        }
        newGrid[r][c].neighbors = count;
      }
    }

    grid = newGrid;
    lose = false;
  };

  const reveal = (r: number, c: number): void => {
    const cell = grid[r]?.[c];
    if (!cell || lose || win || cell.revealed || cell.flagged) return;

    cell.revealed = true;

    if (cell.mine) {
      lose = true;
      sadTromboneSfx.play();
      revealAllMines();
      return;
    }

    if (cell.neighbors === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(r + dr, c + dc);
        }
      }
    }

    const hiddenCells = grid.flat().filter((c) => !c.revealed).length;
    if (hiddenCells === mineCount && !lose && grid.length > 0) {
      win = true;
      winSfx.play();
      setTimeout(() => youWinSfx.play(), 200);
    }
  };

  function reset() {
    lose = false;
    win = false;
    createGrid();
  }

  const revealAllMines = (): void => {
    grid.forEach((row) =>
      row.forEach((c) => {
        if (c.mine) {
          c.revealed = true;
        }
      }),
    );
  };

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 0 && !lose && !win) {
      isPressing = true;
    }
  }

  function handleMouseUp() {
    isPressing = false;
  }

  function getNumberColor(n: number): string {
    const colors = [
      "",
      "blue",
      "green",
      "red",
      "purple",
      "maroon",
      "turquoise",
      "black",
      "gray",
    ];
    return colors[n] || "";
  }
</script>

<div class="minesweeper">
  <div class="bar" style="max-width: calc({size} * 30px);">
    <div class="counter">
      {mineCount - grid.flat().filter((c) => c.flagged).length}
    </div>

    <button class="reset" onclick={reset}>
      {#if win}
        ＼(≧▽≦)／
      {:else if lose}
        ☆⌒(#＋_＋)
      {:else if isPressing}
        {randFromArray([
          "(・_・;)",
          "{{ (>_<) }}",
          "(/ω＼)",
          "{{ (>_<) }}",
          "〣( ºΔº )〣",
          "▓▒░(°◡°)░▒▓",
        ])}
      {:else}
        (* ^ ω ^)
      {/if}
    </button>

    <div class="status-text">
      {#if win}
        YOU WIN !!!!
      {/if}
      {#if lose}
        YOU DIDNT WIN !!!!!
      {/if}
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="board"
    style="grid-template-columns: repeat({size}, 30px); grid-template-rows: repeat({size}, 30px);"
    onmousedown={handleMouseDown}
  >
    {#each grid as row}
      <div class="row">
        {#each row as cell}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="cell"
            class:revealed={cell.revealed}
            class:mine={cell.mine && cell.revealed}
            style="color: {getNumberColor(cell.neighbors)}"
            onclick={() => reveal(cell.r, cell.c)}
            oncontextmenu={(e) => {
              e.preventDefault();
              if (cell.revealed) return;
              cell.flagged = !cell.flagged;
            }}
          >
            {#if cell.revealed}
              {cell.mine ? "💣" : cell.neighbors || ""}
            {:else if cell.flagged}
              🚩
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<svelte:window on:mouseup={handleMouseUp} />

<style>
  .board {
    display: grid;
    gap: 0;
    width: fit-content;
  }

  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    height: 70px;
  }

  button.reset {
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  button.reset:active {
    border: 1px solid #7b7b7b;
  }

  .status-text {
    font-weight: bold;
    width: 80px;
    text-align: right;
  }

  .cell {
    width: 30px;
    min-width: 30px;
    height: 30px;
    min-height: 30px;
    aspect-ratio: 1 / 1;

    padding: 0;
    margin: 0;
    font-size: 18px;

    border-top: 3px solid #ffffff;
    border-left: 3px solid #ffffff;
    border-right: 3px solid #7b7b7b;
    border-bottom: 3px solid #7b7b7b;
    background-color: #bdbdbd;

    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell:active:not(.revealed) {
    border: none;
    background-color: #bdbdbd;
  }

  .cell.revealed {
    border: 1px solid #7b7b7b;
    background-color: #bdbdbd;
    cursor: default;
  }

  .cell.mine {
    background-color: red;
  }
</style>
