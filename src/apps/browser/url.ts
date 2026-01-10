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
    // includes params aswell
    urlfull: normalized,
    host,
    path: path === "" ? "/" : path,
    params,
  };
}

export function normalizeUrl(input: string): string {
  const firstQuestion = input.indexOf("?");

  let pathPart = firstQuestion === -1 ? input : input.slice(0, firstQuestion);
  let queryPart = firstQuestion === -1 ? "" : input.slice(firstQuestion);

  const pathNormalized = pathPart
    .replace(/\/+/g, "/") // replace multiple slashes with single
    .replace(/\/$/, ""); // remove trailing slash

  return pathNormalized + queryPart;
}

export function resolveURLPath(basePath: string, relative: string) {
  let base = parseUrl(basePath);

  // root relative
  if (relative.startsWith("/")) {
    return normalizeUrl(base.host + relative);
  }

  const pathSegments = base.path.split("/").filter((s) => s !== "");

  if (!basePath.trim().endsWith("/") && pathSegments.length > 0) {
    pathSegments.pop();
  }

  const relativeSegments = relative.split("/");
  for (const segment of relativeSegments) {
    if (segment === "." || segment === "") {
      continue;
    }
    if (segment === "..") {
      pathSegments.pop(); // go up
    } else {
      pathSegments.push(segment); // go down
    }
  }

  const finalPath = "/" + pathSegments.join("/");
  return normalizeUrl(base.host + finalPath);
}

export function isLikelyUrl(input: string): boolean {
  const text = input.trim();

  if (text.includes("/") && text.indexOf("/") > 0) return true;

  // matches anyth1ng.wh4t3ver.blahblah.bla/literallyanythingnotincludingspaces-!@#$%^
  //                                     ^
  //                                 2-6 letter tld
  // im sorry for the horrors
  const regex = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,6}(\/\S*)?$/i;

  if (regex.test(text)) return true;

  return false;
}
