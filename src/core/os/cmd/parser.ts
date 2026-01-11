export function splitArgs(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (c === " " && !inQuotes) {
      if (current.length > 0) {
        result.push(current);
        current = "";
      }
      continue;
    }

    current += c;
  }

  if (current.length > 0) result.push(current);
  return result;
}
