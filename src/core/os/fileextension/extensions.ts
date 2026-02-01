export function getFileExtension(name: string): string {
  let res = /(?:\.([^.]+))?$/.exec(name);
  return res ? (res[1] ?? "") : "";
}
