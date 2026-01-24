import { gameState } from "@lib/game/gameState.svelte";

export async function usleep(ms: number): Promise<void> {
  if (!gameState.fakeSleep) return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// min and max included
export function randint(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
