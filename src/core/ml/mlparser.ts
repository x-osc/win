import { type Parser, alphanumeric1, consume, map, seq } from "./parser";

// <tagname>
export const parseElement: Parser<string> = map(
  seq(consume("<"), alphanumeric1(), consume(">")),
  ([_open, tagName, _close]) => tagName,
);
