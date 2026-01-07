import {
  type Parser,
  alphanumeric1,
  choice,
  consume,
  eof,
  expect,
  failure,
  many,
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

export type AST = MlNode[];

// takes until <
const parseTextNode: Parser<MlNode> = (input, offset) => {
  if (offset >= input.length) return failure("Unexpected EOF", offset);

  if (input.startsWith("<", offset)) {
    return failure("Expected text, but found the start of a tag", offset);
  }

  const result = take1Until((char) => char === "<")(input, offset);
  if (!result.success) return result;

  return success({ type: "text", content: result.value }, result.offset);
};

const parseNode: Parser<MlNode> = (input, offset) => {
  const openResult = map(
    expect(
      seq(consume("<"), ws(), alphanumeric1(), ws(), consume(">")),
      "Expected a start tag",
    ),
    ([, , tagName, ,]) => {
      return tagName;
    },
  )(input, offset);

  if (!openResult.success) return openResult;

  const tagName = openResult.value;
  const newOffset = openResult.offset;

  const closingTag = seq(
    consume("</"),
    ws(),
    consume(tagName),
    ws(),
    consume(">"),
  );
  const childNodeParser = choice(parseNode, parseTextNode);

  const childrenResult = manyUntil(childNodeParser, closingTag)(
    input,
    newOffset,
  );

  if (!childrenResult.success) {
    return failure(
      `${childrenResult.error} (inside <${tagName}> starting at ${offset})`,
      childrenResult.offset,
    );
  }

  const closeResult = closingTag(input, childrenResult.offset);
  if (!closeResult.success) {
    // TODO: cool pointers in output
    return failure(
      `Expected closing tag </${tagName}> for the tag opened at position ${offset}`,
      childrenResult.offset,
    );
  }

  return success(
    {
      type: "tag",
      tag: tagName,
      children: childrenResult.value.filter((node) => !isTextNodeEmpty(node)),
    },
    closeResult.offset,
  );
};

const parseDocument: Parser<AST> = (input, offset) => {
  const nodeParser = choice(parseNode, parseTextNode);

  const result = many(nodeParser)(input, offset);

  if (!result.success) return result;

  const endCheck = eof()(input, result.offset);
  if (!endCheck.success) {
    return endCheck;
  }

  result.value = result.value.filter((node) => !isTextNodeEmpty(node));

  return result;
};

function isTextNodeEmpty(node: MlNode) {
  return node.type === "text" && node.content.trim().length <= 0;
}

export const testParser = parseDocument;
