export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// min and max included
export function randint(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
