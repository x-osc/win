export interface ParsedUrl {
  url: string;
  urlfull: string;
  host: string;
  path: string;
  params: Record<string, string>;
}

/// parse url like goggle.net/search?q=blabla?q2=blabla2
export function parseUrl(input: string): ParsedUrl {
  let normalized = normalizeUrl(input.trim());

  const firstSlash = normalized.indexOf("/");
  let host = firstSlash === -1 ? normalized : normalized.slice(0, firstSlash);
  let pathAndQuery = firstSlash === -1 ? "" : normalized.slice(firstSlash);

  const firstQuestion = pathAndQuery.indexOf("?");
  let path =
    firstQuestion === -1 ? pathAndQuery : pathAndQuery.slice(0, firstQuestion);
  let queryString =
    firstQuestion === -1 ? "" : pathAndQuery.slice(firstQuestion + 1);

  const params: Record<string, string> = {};

  queryString.split("?").forEach((pair) => {
    if (!pair) return;
    const [key, value] = pair.split("=");
    if (!key) return;

    params[key] = value || "";
  });

  return {
    url: host + (path ?? ""),
    urlfull: normalized,
    host,
    path: path ?? "/",
    params,
  };
}

export function normalizeUrl(input: string): string {
  const firstQuestion = input.indexOf("?");

  let pathPart = firstQuestion === -1 ? input : input.slice(0, firstQuestion);
  let queryPart = firstQuestion === -1 ? "" : input.slice(firstQuestion);

  const pathNormalized = pathPart
    .replace(/\/+/g, "/") // replace multiple slashes with single
    .replace(/\/$/, "") // remove trailing slash
    .toLowerCase();

  return pathNormalized + queryPart;
}
