import { describe, expect, it } from "vitest";
import { processDocument } from "./mlparser";

describe("Document Parsing", () => {
  it("renders simple text and tags", () => {
    const input = "<box><text>Hello World</text></box>";
    const [html, errors] = processDocument(input);
    expect(errors).toHaveLength(0);
    expect(html).toContain("Hello World");
  });

  it("renders nested boxes with styles", () => {
    const input = `<box color="red" width=100><box color="blue"></box></box>`;
    const [html, errors] = processDocument(input);
    expect(errors).toHaveLength(0);

    expectStyle(html!, "background-color", "red");
    expectStyle(html!, "width", "100");
    expectStyle(html!, "background-color", "blue");
  });

  it("skips blank text nodes", () => {
    const input = `
      <main  >
        <  main 
          > </main>
      </main    >
    `;
    const [html, errors] = processDocument(input);
    expect(errors).toHaveLength(0);
    // no whitespace
    expect(html).toContain("<main><main></main></main>");
  });

  it("parses numeric attributes without quotes", () => {
    const input = `<box width=500></box>`;
    const [html, errors] = processDocument(input);
    expect(errors).toHaveLength(0);
    expect(html).toContain("width: 500");
  });

  it("parses boolean attributes without values", () => {
    const input = `<box center></box>`;
    const [html, errors] = processDocument(input);
    expect(errors).toHaveLength(0);
    expect(html).toContain("center");
  });

  it("allows text inside <text> and <heading> tags", () => {
    const input = `
      <box>
        <text>test</text>
      </box>
      <heading>test2</heading>
    `;
    const [html, errors] = processDocument(input);

    expect(errors).toHaveLength(0);
    expect(html).toContain("test");
    expect(html).toContain("test2");
  });
});

describe("Error States", () => {
  it("reports error for unknown tags", () => {
    const input = `<asdf>content</asdf>`;
    const [_, errors] = processDocument(input);
    expect(errors[0].code).toBe("unknown-tag");
  });

  it("reports type mismatch errors", () => {
    const input = `<box width="not-a-number"></box>`;
    const [_, errors] = processDocument(input);
    expect(errors[0].code).toBe("attribute-type-mismatch");
  });

  it("catches unclosed tags at EOF", () => {
    const input = "<a><b></a>";
    const [html, errors] = processDocument(input);
    expect(errors[0].code).toBe("mismatched-nesting");
  });

  it("catches unclosed attributes", () => {
    const input = "<box width=";
    const [html, errors] = processDocument(input);
    expect(errors[0].code).toBe("expected-attr-value");
  });

  it("catches missing closing bracket", () => {
    const input = "<box width=10 ";
    const [html, errors] = processDocument(input);
    expect(errors[0].code).toBe("unterminated-tag");
  });

  it("disallows text nodes at the root level", () => {
    const input = `asdf`;
    const [html, errors] = processDocument(input);

    expect(errors[0].code).toBe("text-not-allowed");
  });

  it("rejects text nodes directly inside <box>", () => {
    const input = `
      <box>
        This text should not be here
      </box>
    `;
    const [html, errors] = processDocument(input);

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("text-not-allowed");

    expect(html).not.toContain("This text should not be here");
  });
});

function expectStyle(html: string, prop: string, value: string) {
  // matches style="...prop: 'value'..." or style="...prop: value..."
  const regex = new RegExp(`${prop}:\\s*['"]?${value}['"]?`);
  const match = Array.from(html.matchAll(/style="([^"]+)"/g), (m) => m[1]);
  const styleContent = match.join(' style="');

  if (!regex.test(styleContent)) {
    throw new Error(
      `Expected style "${prop}: ${value}" but found \`${styleContent}\``,
    );
  }
}
