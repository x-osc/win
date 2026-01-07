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
  takeUntil,
  ws,
} from "./parser";

export type AttributeValue = string | boolean;
export type AttributeStore = Record<string, AttributeValue>;

export type MlNode =
  | {
      type: "tag";
      tag: string;
      attributes: AttributeStore;
      children: MlNode[];
    }
  | { type: "text"; content: string };

export type BasicAST = { nodes: MlNode[] };

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

// foo = "bar" || foo
const parseAttribute: Parser<[string, AttributeValue]> = (input, offset) => {
  const keyvalResult = seq(
    alphanumeric1(),
    ws(),
    consume("="),
    ws(),
    consume('"'),
    takeUntil((c) => c === '"'),
    consume('"'),
  )(input, offset);

  if (keyvalResult.success) {
    const [key, , , , , value] = keyvalResult.value;
    return success([key, value], keyvalResult.offset);
  }

  const boolResult = alphanumeric1()(input, offset);
  if (boolResult.success) {
    return success([boolResult.value, true], boolResult.offset);
  }

  return failure("Expected attribute", offset);
};

// many attributes separated by whitespace
const parseAttributes: Parser<AttributeStore> = map(
  many(seq(ws(), parseAttribute)),
  (results) => {
    const attrs: AttributeStore = {};
    for (const [, [key, value]] of results) {
      attrs[key] = value;
    }
    return attrs;
  },
);

const parseNode: Parser<MlNode> = (input, offset) => {
  const openResult = seq(
    expect(consume("<"), "Expected a start tag"),
    ws(),
    expect(alphanumeric1(), "Tag name must be alphanumeric"),
    parseAttributes,
    ws(),
    expect(consume(">"), "Missing closing '>' for opening tag"),
  )(input, offset);

  if (!openResult.success) return openResult;

  const [, , tagName, attributes, ,] = openResult.value;
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

  const node: MlNode = {
    type: "tag",
    tag: tagName,
    attributes,
    children: childrenResult.value.filter((node) => !isTextNodeEmpty(node)),
  };

  return success(node, closeResult.offset);
};

export const parseDocument: Parser<BasicAST> = (input, offset) => {
  const nodeParser = choice(parseNode, parseTextNode);

  const result = many(nodeParser)(input, offset);

  if (!result.success) return result;

  const endCheck = eof()(input, result.offset);
  if (!endCheck.success) {
    // we arent at the end of the file
    // means we failed to parse the following node
    // try to parse it to get an error

    const errorCheck = nodeParser(input, result.offset);
    // guaranteed to fail otherwise many() would have continued
    if (!errorCheck.success) {
      return errorCheck;
    } else {
      throw Error("unreachable ?");
    }
  }

  return success(
    { nodes: result.value.filter((node) => !isTextNodeEmpty(node)) },
    result.offset,
  );
};

function isTextNodeEmpty(node: MlNode) {
  return node.type === "text" && node.content.trim().length <= 0;
}
