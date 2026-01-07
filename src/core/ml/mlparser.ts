import {
  type Located,
  type Parser,
  alphanumeric1,
  choice,
  consume,
  eof,
  expect,
  failure,
  located,
  many,
  manyUntil,
  map,
  seq,
  success,
  take1Until,
  takeUntil,
  unwraploc,
  ws,
} from "./parser";

export type AttributeValue = {
  key: Located<string>;
  value: Located<string | boolean>;
};
export type AttributeStore = AttributeValue[];

export type MlNode =
  | {
      type: "tag";
      tag: Located<string>;
      attributes: AttributeStore;
      children: Located<MlNode>[];
    }
  | { type: "text"; content: string };

export type BasicAST = { nodes: Located<MlNode>[] };

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
const parseAttribute: Parser<AttributeValue> = (input, offset) => {
  const keyvalResult = seq(
    located(alphanumeric1()),
    ws(),
    consume("="),
    ws(),
    consume('"'),
    located(takeUntil((c) => c === '"')),
    consume('"'),
  )(input, offset);

  if (keyvalResult.success) {
    const [key, , , , , value] = keyvalResult.value;
    return success({ key, value }, keyvalResult.offset);
  }

  const boolResult = located(alphanumeric1())(input, offset);
  if (boolResult.success) {
    return success(
      {
        key: boolResult.value,
        value: { value: true, loc: boolResult.value.loc },
      },
      boolResult.offset,
    );
  }

  return failure("Expected attribute", offset);
};

// many attributes separated by whitespace
const parseAttributes: Parser<AttributeStore> = map(
  many(seq(ws(), parseAttribute)),
  (results) => results.map(([, attr]) => attr),
);

const parseNode: Parser<MlNode> = (input, offset) => {
  const openResult = seq(
    expect(consume("<"), "Expected a start tag"),
    ws(),
    expect(located(alphanumeric1()), "Tag name must be alphanumeric"),
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
    consume(unwraploc(tagName)),
    ws(),
    consume(">"),
  );
  const childNodeParser = located(choice(parseNode, parseTextNode));

  const childrenResult = manyUntil(childNodeParser, closingTag)(
    input,
    newOffset,
  );

  if (!childrenResult.success) {
    return failure(
      `${childrenResult.error} (inside <${unwraploc(tagName)}> starting at ${offset})`,
      childrenResult.offset,
    );
  }

  const closeResult = closingTag(input, childrenResult.offset);
  if (!closeResult.success) {
    // TODO: cool pointers in output
    return failure(
      `Expected closing tag </${unwraploc(tagName)}> for the tag opened at position ${offset}`,
      childrenResult.offset,
    );
  }

  const node: MlNode = {
    type: "tag",
    tag: tagName,
    attributes,
    children: childrenResult.value.filter(
      (node) => !isTextNodeEmpty(unwraploc(node)),
    ),
  };

  return success(node, closeResult.offset);
};

export const parseDocument: Parser<BasicAST> = (input, offset) => {
  const nodeParser = located(choice(parseNode, parseTextNode));

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
    { nodes: result.value.filter((node) => !isTextNodeEmpty(unwraploc(node))) },
    result.offset,
  );
};

function isTextNodeEmpty(node: MlNode) {
  return node.type === "text" && node.content.trim().length <= 0;
}
