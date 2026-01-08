import {
  type Located,
  type ParseFaliure,
  type Parser,
  type SourceLocation,
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

export type MlNode = TagNode | TextNode;

export type TagNode = {
  type: "tag";
  tag: Located<string>;
  attributes: AttributeStore;
  children: Located<MlNode>[];
};
export type TextNode = { type: "text"; content: string };

export type BasicAst = { nodes: Located<MlNode>[] };

export interface MlError {
  type: "parser" | "transformer";
  message: string;
  loc: SourceLocation;
  code?: string;
}

// parser stuffs

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
      `${childrenResult.reason} (inside <${unwraploc(tagName)}> starting at ${offset})`,
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
    children: childrenResult.value,
  };

  return success(node, closeResult.offset);
};

export const parseDocument: Parser<BasicAst> = (input, offset) => {
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

  return success({ nodes: result.value }, result.offset);
};

// walker and validator / transformer

export function formatErrorAtLoc(
  input: string,
  message: string,
  loc: SourceLocation,
) {
  const lines = input.slice(0, loc.start).split("\n");
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length + 1;
  const allLines = input.split("\n");
  const lineContent = allLines[lineNum - 1];

  // Calculate how many carets to draw if it's a span
  const spanLength = Math.max(1, loc.end - loc.start);
  const carets = "^".repeat(spanLength);

  return [
    `Error: ${message}`,
    `At: Line ${lineNum}, Column ${colNum}`,
    `> ${lineContent}`,
    `  ${" ".repeat(colNum - 1)}${carets}`,
  ].join("\n");
}

export function toMlError(result: ParseFaliure): MlError {
  return {
    type: "parser",
    message: result.reason,
    loc: result.loc,
  };
}

export function makeMlError(
  reason: string,
  loc: SourceLocation,
  code?: string,
): MlError {
  return {
    type: "transformer",
    message: reason,
    loc,
  };
}

const TAG_MAP: Record<string, TagData> = {
  box: {
    html: "div",
  },
};

export type TagData = {
  html: string;
};

export interface TransformVisitor {
  tag?: (node: Located<TagNode>) => Located<MlNode> | null;
  text?: (node: Located<TextNode>) => Located<MlNode> | null;
}

export function transform(
  nodes: Located<MlNode>[],
  visitor: TransformVisitor,
): Located<MlNode>[] {
  const result: Located<MlNode>[] = [];

  for (const node of nodes) {
    let current: Located<MlNode> | null = node;

    if (current.value.type === "tag" && visitor.tag) {
      current = visitor.tag(current as Located<TagNode>);
    } else if (current.value.type === "text" && visitor.text) {
      current = visitor.text(current as Located<TextNode>);
    }

    if (!current) continue; // node was deleted by the visitor

    if (current.value.type === "tag") {
      const transformedChildren = transform(current.value.children, visitor);

      // maintain immutability
      current = {
        ...current,
        value: {
          ...current.value,
          children: transformedChildren,
        },
      };
    }

    result.push(current);
  }

  return result;
}

export function toHtmlAst(ast: BasicAst): [BasicAst, MlError[]] {
  let errors: MlError[] = [];

  let newTree = transform(ast.nodes, {
    tag: (nodeloc) => {
      let node = nodeloc.value;

      let tagData = TAG_MAP[unwraploc(node.tag)];
      if (tagData == undefined) {
        errors.push(makeMlError("invalid tag", node.tag.loc, "invalid_tag"));
        return nodeloc;
      }

      // TODO: mutation !!!! uhoh
      node.tag.value = tagData.html;
      return nodeloc;
    },
  });

  return [{ nodes: newTree }, errors];
}

// generator

export function generateHTML(nodes: Located<MlNode>[]): string {
  return nodes
    .map((locnode) => {
      const node = unwraploc(locnode);
      if (node.type === "text") {
        return node.content;
      }

      const attrString = node.attributes
        .map(({ key, value }) =>
          unwraploc(value) === true
            ? ` ${unwraploc(key)}`
            : ` ${unwraploc(key)}="${unwraploc(value)}"`,
        )
        .join("");

      const childrenString = generateHTML(node.children);
      return `<${node.tag.value}${attrString}>${childrenString}</${node.tag.value}>`;
    })
    .join("");
}
