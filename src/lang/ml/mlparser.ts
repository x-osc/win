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
  seq,
  success,
  take1Until,
  takeUntil,
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

export interface MlError {
  type: "parser" | "transformer";
  code: ErrorCode;
  params?: Record<string, string | number>; // error message template interpolation
  loc: SourceLocation;
}

export const ERROR_CODES = {
  "generic-error": "{message}",

  // Parser Phase
  "missing-opening-bracket": "Expected a start tag '<'",
  "tag-name-alphanumeric": "Tag name must be alphanumeric",
  "unclosed-tag": "Unclosed tag <{tag}>: reached end of file",
  "mismatched-nesting":
    "Unexpected closing tag or mismatched nesting for <{tag}>",
  "expected-attr-value": "Expected quoted string or a number after '='",
  "unterminated-tag": "Unterminated opening tag (expected '>' or attributes)",
  "unexpected-eof": "Unexpected end of file",
  "expected-text-found-tag": "Expected text, but found the start of a tag",
  "expected-number": "Expected a number",

  // Transformer Phase
  "unknown-tag": "Unknown tag <{tag}>",
  "unexpected-attribute": "Unexpected attribute '{key}' on <{tag}>",
  "attribute-type-mismatch":
    "Attribute '{key}' expects a {expected}, got {actual}",
  "missing-required-attribute": "<{tag}> is missing required attribute '{key}'",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// jank
function errorPayload(
  code: ErrorCode,
  params?: Record<string, string | number>,
): string {
  return JSON.stringify({ code, params });
}

// parser stuffs

// -123.45
const parseNumber: Parser<number> = (input, offset) => {
  // optional negative sign
  const match = input.slice(offset).match(/^-?\d+(\.\d+)?/);
  if (!match) return failure(errorPayload("expected-number"), offset);

  const value = parseFloat(match[0]);
  return success(value, offset + match[0].length);
};

// takes until <
const parseTextNode: Parser<MlNode> = (input, offset) => {
  if (offset >= input.length)
    return failure(errorPayload("unexpected-eof"), offset);

  if (input.startsWith("<", offset)) {
    return failure(errorPayload("expected-text-found-tag"), offset);
  }

  const result = take1Until((char) => char === "<")(input, offset);
  if (!result.success) return result;

  return success({ type: "text", content: result.value }, result.offset);
};

// foo = "bar" || foo
const parseAttribute: Parser<AttributeData> = (input, offset) => {
  const headResult = seq(
    located(alphanumeric1()),
    ws(),
    consume("="),
    ws(),
  )(input, offset);

  if (headResult.success) {
    const [key, , ,] = headResult.value;

    const stringResult = seq(
      consume('"'),
      located(takeUntil((c) => c === '"')),
      consume('"'),
    )(input, headResult.offset);
    if (stringResult.success) {
      const [, locval, _] = stringResult.value;
      return success(
        {
          key,
          attr: {
            value: { type: "string", value: locval.value },
            loc: locval.loc,
          },
        },
        stringResult.offset,
      );
    }

    const numResult = located(parseNumber)(input, headResult.offset);
    if (numResult.success) {
      const locval = numResult.value;
      return success(
        {
          key,
          attr: {
            value: { type: "number", value: locval.value },
            loc: locval.loc,
          },
        },
        numResult.offset,
      );
    }

    return failure(errorPayload("expected-attr-value"), headResult.offset);
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

  return failure(errorPayload("unterminated-tag"), offset);
};

// many attributes separated by whitespace
const parseAttributes: Parser<AttributeStore> = (input, offset) => {
  const attrs: AttributeStore = [];
  let currentOffset = offset;

  while (true) {
    const whitespace = ws()(input, currentOffset);
    currentOffset = whitespace.offset;

    // if the next char is '>', we are done with attributes
    if (input[currentOffset] === ">") break;

    const result = parseAttribute(input, currentOffset);
    if (!result.success) return result;

    attrs.push(result.value);
    currentOffset = result.offset;
  }

  return success(attrs, currentOffset);
};

const parseNode: Parser<MlNode> = (input, offset) => {
  const openResult = seq(
    expect(consume("<"), errorPayload("missing-opening-bracket")),
    ws(),
    expect(located(alphanumeric1()), errorPayload("tag-name-alphanumeric")),
    parseAttributes,
    ws(),
    expect(consume(">"), errorPayload("unterminated-tag")),
  )(input, offset);

  if (!openResult.success) return openResult;

  const [, , tagName, attributes, ,] = openResult.value;
  const tagStr = tagName.value;

  let currentOffset = openResult.offset;
  let children: Located<MlNode>[] = [];

  const closePattern = new RegExp(`^<\\/\\s*${tagStr}\\s*>`);

  while (true) {
    const whitespace = ws()(input, currentOffset);
    currentOffset = whitespace.offset;

    if (currentOffset >= input.length) {
      return failure(
        errorPayload("unclosed-tag", { tag: tagStr }),
        currentOffset,
      );
    }

    const closeMatch = input.slice(currentOffset).match(closePattern);

    if (closeMatch) {
      currentOffset += closeMatch[0].length;
      break;
    }

    if (input.startsWith("</", currentOffset)) {
      return failure(
        errorPayload("mismatched-nesting", { tag: tagStr }),
        currentOffset,
      );
    }

    // if not closing tag, must be child
    const childParser = located(choice(parseNode, parseTextNode));
    const childResult = childParser(input, currentOffset);

    if (!childResult.success) return childResult;

    children.push(childResult.value);
    currentOffset = childResult.offset;
  }

  const node: MlNode = {
    type: "tag",
    tag: tagName,
    attributes,
    children,
  };

  return success(node, currentOffset);
};

export const parseDocument: Parser<Located<MlNode>[]> = (input, offset) => {
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

  return success(result.value, result.offset);
};

// transformer

export function formatError(input: string, error: MlError) {
  const message = getErrorMessage(error);
  const loc = error.loc;

  const lines = input.slice(0, loc.start).split("\n");
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length + 1;
  const allLines = input.split("\n");
  const lineContent = allLines[lineNum - 1];

  // Calculate how many carets to draw if it's a span
  const spanLength = Math.max(1, loc.end - loc.start);
  const carets = "^".repeat(spanLength);

  return [
    `Error [${error.code}]: ${message}`,
    `At: Line ${lineNum}, Column ${colNum}`,
    `> ${lineContent}`,
    `  ${" ".repeat(colNum - 1)}${carets}`,
  ].join("\n");
}

export function toMlError(result: ParseFaliure): MlError {
  try {
    const data = JSON.parse(result.reason);

    if (data.code in ERROR_CODES) {
      return {
        type: "parser",
        code: data.code,
        params: data.params,
        loc: result.loc,
      };
    }
  } catch {}

  return {
    type: "parser",
    code: "generic-error",
    params: { message: result.reason },
    loc: result.loc,
  };
}

export function makeMlError(
  code: ErrorCode,
  loc: SourceLocation,
  params?: Record<string, string | number>,
): MlError {
  return {
    type: "transformer",
    code,
    loc,
    params,
  };
}

function getErrorMessage(error: MlError): string {
  let template: string = ERROR_CODES[error.code];
  if (error.params) {
    for (const [key, val] of Object.entries(error.params)) {
      template = template.replace(`{${key}}`, String(val));
    }
  }
  return template;
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
  validate?: (attrs: AttrRecord) => MlError[];
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
      center: { type: "boolean" },
      color: { type: "string" },
      width: { type: "number" },
      height: { type: "number" },
    },
    render: (attrs, children) => {
      const styles = styleString({
        width: attrs.width + "px",
        height: attrs.height + "px",
        "background-color": attrs.color,
      });

      let el = `<div style="${styles}">${children}</div>`;

      if (attrs.center) el = `<div class="center-container">${el}</div>`;

      return el;
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
      if (node.content.trim().length === 0) {
        continue;
      }

      refined.push({
        loc: locnode.loc,
        value: { type: "text", content: node.content },
      });
      continue;
    }

    if (node.type === "tag") {
      if (!(node.tag.value in SCHEMA)) {
        errors.push(
          makeMlError("unknown-tag", node.tag.loc, {
            tag: node.tag.value,
          }),
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

      continue;
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
        makeMlError("unexpected-attribute", attrdata.key.loc, {
          key,
          tag: tagName,
        }),
      );
      continue;
    }

    const rawValue = attrdata.attr.value;
    const parsed = checkType(rawValue, spec.type);

    if (parsed === null) {
      errors.push(
        makeMlError("attribute-type-mismatch", attrdata.attr.loc, {
          key,
          expected: spec.type,
          actual: typeof rawValue.value,
        }),
      );
    } else {
      refinedAttrs[key] = parsed;
    }
  }

  for (const [key, spec] of Object.entries(definition.attrs)) {
    if (spec.required && !seenAttrs.has(key)) {
      errors.push(
        makeMlError("missing-required-attribute", node.tag.loc, {
          tag: tagName,
          key,
        }),
      );
    }
  }

  if (definition.validate) {
    const validationErrors = definition.validate(refinedAttrs);
    for (const error of validationErrors) {
      errors.push(error);
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

/// pls attach ml.css to wherever ur rendering this aswell thx
export function renderToHtml(nodes: Located<RefinedNode>[]): string {
  let html = nodes
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

  return `<div style="width: 100%; height: 100%">${html}</div>`;
}

export function processDocument(input: string): [string | null, MlError[]] {
  let parseRes = parseDocument(input, 0);

  if (!parseRes.success) {
    return [null, [toMlError(parseRes)]];
  }

  const [ast, errors] = refineAst(parseRes.value);

  const htmlString = renderToHtml(ast);

  return [htmlString, errors];
}

function styleString(styles: Record<string, any>) {
  const css = Object.entries(styles)
    .filter(
      ([_, value]) => value !== undefined && value != null && value != false,
    )
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");

  return css ? `${css}` : "";
}
