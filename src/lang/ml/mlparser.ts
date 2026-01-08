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
} from "../parser";

export type AttrValue =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean };

export type AttributeData = {
  key: Located<string>;
  attr: Located<AttrValue>;
};
export type AttributeStore = AttributeData[];

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
const parseAttribute: Parser<AttributeData> = (input, offset) => {
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
    const [key, , , , , locval] = keyvalResult.value;
    let res: AttributeData = {
      key,
      attr: { value: { type: "string", value: locval.value }, loc: locval.loc },
    };
    return success(res, keyvalResult.offset);
  }

  const boolResult = located(alphanumeric1())(input, offset);
  if (boolResult.success) {
    let res: AttributeData = {
      key: boolResult.value,
      attr: {
        value: { type: "boolean", value: true },
        loc: boolResult.value.loc,
      },
    };
    return success(res, boolResult.offset);
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

// transformer

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

export type TagData = {
  html: string;
};

interface AttrDefinition {
  type: AttrValue["type"];
  required?: boolean;
}

type AttrRecord = Record<string, AttrValue["value"]>;

interface TagDefinition {
  attrs: Record<string, AttrDefinition>;
  render: (
    attrs: Record<string, AttrValue["value"] | undefined>,
    children: string,
  ) => string;
}

type TagNames = keyof typeof SCHEMA;

type RefinedTagNode = {
  type: "tag";
  refinedType: string;
  tag: Located<string>;
  children: Located<RefinedNode>[];
  attrs: AttrRecord;
};

type RefinedNode = RefinedTagNode | TextNode;

const SCHEMA: Record<string, TagDefinition> = {
  box: {
    attrs: {
      color: { type: "string" },
    },
    render: (attrs, children) => {
      return `<div style="background-color: ${attrs.color}">${children}</div>`;
    },
  },
  main: {
    attrs: {},
    render: (attrs, children) => {
      return `<main>${children}</main>`;
    },
  },
} as const;

export function refineAst(
  nodes: Located<MlNode>[],
): [Located<RefinedNode>[], MlError[]] {
  let refined: Located<RefinedNode>[] = [];
  let errors: MlError[] = [];

  for (const locnode of nodes) {
    const node = locnode.value;

    if (node.type === "text") {
      refined.push({
        loc: locnode.loc,
        value: { type: "text", content: node.content },
      });
      continue;
    }

    if (node.type === "tag") {
      if (!(node.tag.value in SCHEMA)) {
        errors.push(
          makeMlError(`unknown tag <${node.tag.value}>`, node.tag.loc),
        );
      }

      const [attrs, attrerrors] = getAttrsWithSchema(node);
      errors = errors.concat(attrerrors);

      const [refinedChildren, childerrs] = refineAst(node.children);
      errors = errors.concat(childerrs);

      refined.push({
        loc: locnode.loc,
        value: {
          type: "tag",
          refinedType: node.tag.value,
          tag: node.tag,
          attrs: attrs ?? {},
          children: refinedChildren,
        },
      });
    }
  }

  return [refined, errors];
}

function getAttrsWithSchema(node: TagNode): [AttrRecord | null, MlError[]] {
  let errors: MlError[] = [];

  const tagName = node.tag.value;
  const definition = SCHEMA[tagName];

  if (!definition) {
    return [null, errors];
  }

  const refinedAttrs: AttrRecord = {};
  const seenAttrs = new Set<string>();

  for (const attrdata of node.attributes) {
    const key = attrdata.key.value;
    const spec = definition.attrs[key];
    seenAttrs.add(key);

    if (!spec) {
      errors.push(
        makeMlError(
          `unexpected attribute "${key}" on <${tagName}>`,
          attrdata.key.loc,
        ),
      );
      continue;
    }

    const rawValue = attrdata.attr.value;
    const parsed = checkType(rawValue, spec.type);

    if (parsed === null) {
      errors.push(
        makeMlError(
          `Attribute "${key}" expects a ${spec.type}, got "${typeof rawValue.value}"`,
          attrdata.attr.loc,
        ),
      );
    } else {
      refinedAttrs[key] = parsed;
    }
  }

  for (const [key, spec] of Object.entries(definition.attrs)) {
    if (spec.required && !seenAttrs.has(key)) {
      errors.push(
        makeMlError(
          `<${tagName}> is missing required attribute "${key}"`,
          node.tag.loc,
        ),
      );
    }
  }

  return [refinedAttrs, errors];
}

function checkType(
  val: AttrValue,
  type: AttrValue["type"],
): AttrValue["value"] | null {
  if (type === "string") {
    return typeof val.value === "string" ? val.value : null;
  }
  if (type === "boolean") {
    return typeof val.value === "boolean" ? val.value : null;
  }
  if (type === "number") {
    return typeof val.value === "number" ? val.value : null;
  }
  return null;
}

// generator

export function renderToHtml(nodes: Located<RefinedNode>[]): string {
  return nodes
    .map((locnode) => {
      const node = locnode.value;

      if (node.type === "text") {
        return node.content;
      }

      if (node.type === "tag") {
        const tagName = node.tag.value;
        const definition = SCHEMA[tagName];

        if (!definition) return "";

        const childrenHtml = renderToHtml(node.children);

        return definition.render(node.attrs, childrenHtml);
      }

      return "";
    })
    .join("");
}

export function processDocument(input: string): [string | null, MlError[]] {
  let parseRes = parseDocument(input, 0);

  if (!parseRes.success) {
    return [null, [toMlError(parseRes)]];
  }

  const [ast, errors] = refineAst(parseRes.value.nodes);

  const htmlString = renderToHtml(ast);

  return [htmlString, errors];
}
