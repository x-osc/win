import {
  type Parser,
  alphanumeric1,
  choice,
  consume,
  failure,
  manyUntil,
  map,
  seq,
  success,
  take1Until,
  ws,
} from "./parser";

export type MlNode =
  | { type: "tag"; tag: string; children: MlNode[] }
  | { type: "text"; content: string };

// takes until <
const parseTextNode: Parser<MlNode> = (input: string) => {
  if (input.length === 0) return failure("EOF");

  if (input.startsWith("<")) {
    return failure("Expected text, but found a tag");
  }

  const result = take1Until((char) => char === "<")(input);
  if (!result.success) {
    return result;
  }

  return success({ type: "text", content: result.value }, result.remaining);
};

const parseNode: Parser<MlNode> = (input: string) => {
  const openResult = map(
    seq(consume("<"), ws(), alphanumeric1(), ws(), consume(">")),
    ([, , tagName, ,]) => {
      return tagName;
    },
  )(input);

  if (!openResult.success) {
    return openResult;
  }

  const tagName = openResult.value;

  const closingTag = seq(
    consume("</"),
    ws(),
    consume(tagName),
    ws(),
    consume(">"),
  );
  const childNodeParser = choice(parseNode, parseTextNode);

  const childrenResult = manyUntil(
    childNodeParser,
    closingTag,
  )(openResult.remaining);

  if (!childrenResult.success) {
    return childrenResult;
  }

  const closeResult = seq(ws(), closingTag)(childrenResult.remaining);

  if (!closeResult.success) {
    return failure(`Expected closing tag </${tagName}>`);
  }

  return success(
    {
      type: "tag",
      tag: tagName,
      children: childrenResult.value.filter((node) => !isTextNodeEmpty(node)),
    },
    closeResult.remaining,
  );
};

function isTextNodeEmpty(node: MlNode) {
  return node.type === "text" && node.content.length <= 0;
}

export const testParser = parseNode;
