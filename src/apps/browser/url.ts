export interface ParsedUrl {
  host: string;
  path: string;
  params: Record<string, string>;
}

/// parse url like goggle.net/search?q=blabla?q2=blabla2
export function parseUrl(input: string): ParsedUrl {
  let remaining = input.trim();

  const firstSlash = remaining.indexOf("/");
  let host = firstSlash === -1 ? remaining : remaining.slice(0, firstSlash);
  let pathAndQuery = firstSlash === -1 ? "" : remaining.slice(firstSlash);

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
    host,
    path: path || "/",
    params,
  };
}
