import { describe, expect, it } from "vitest";
import type { ParseResult } from "./parser";
import * as P from "./parser";

describe("Basic Parsers", () => {
  it("consume: should match exact string and return remaining", () => {
    const parser: P.Parser<string> = P.consume("hello");

    const result = parser("helloworld");

    // using 'satisfies' ensures our test expectation matches the actual type definition
    expect(result).toEqual({
      success: true,
      value: "hello",
      remaining: "world",
    } satisfies ParseResult<string>);
  });

  it("ws: should consume zero or more whitespace characters", () => {
    const parser: P.Parser<string> = P.ws();
    expect(parser("  \n\tcode")).toEqual({
      success: true,
      value: "  \n\t",
      remaining: "code",
    } satisfies ParseResult<string>);
  });

  it("alphanumeric1: should require at least one alphanumeric char", () => {
    const parser = P.alphanumeric1();
    expect(parser("abc123!")).toEqual({
      success: true,
      value: "abc123",
      remaining: "!",
    });
    expect(parser("!abc")).toHaveProperty("success", false);
  });

  it("eof: should succeed only at end of string", () => {
    const parser = P.eof();
    expect(parser("")).toEqual({ success: true, value: null, remaining: "" });
    expect(parser("text")).toHaveProperty("success", false);
  });
});

describe("Combinators", () => {
  it("seq: should run parsers in sequence", () => {
    const parser = P.seq(P.consume("a"), P.consume("b"));
    const result = parser("abc");

    expect(result.success).toBe(true);
    if (result.success) {
      const [first, second] = result.value;
      expect(first).toBe("a");
      expect(second).toBe("b");
    }
  });

  it("map: should transform the parsed value", () => {
    const parser = P.consume("123");
    // transform string parser to number parser
    const mapped: P.Parser<number> = P.map(parser, (val) => parseInt(val, 10));

    const result = mapped("12345");
    expect(result).toEqual({
      success: true,
      value: 123,
      remaining: "45",
    } satisfies ParseResult<number>);
  });

  it("many: should parse zero or more times", () => {
    const parser: P.Parser<string[]> = P.many(P.consume("x"));
    expect(parser("xxxy")).toEqual({
      success: true,
      value: ["x", "x", "x"],
      remaining: "y",
    } satisfies ParseResult<string[]>);
  });

  it("between: should extract content between delimiters", () => {
    const parser: P.Parser<string> = P.between(
      P.consume("<"),
      P.alphanumeric1(),
      P.consume(">"),
    );
    expect(parser("<tag>content")).toEqual({
      success: true,
      value: "tag",
      remaining: "content",
    } satisfies ParseResult<string>);
  });

  it("lookahead: should succeed without consuming input", () => {
    const parser = P.seq(P.lookahead(P.consume("foo")), P.alphanumeric1());
    const result = parser("foobar");

    expect(result.success).toBe(true);
    if (result.success) {
      // result.value is ["foo", "foobar"]
      // the "foobar" parser started from the very beginning because lookahead didn't move the pointer
      expect(result.value[1]).toBe("foobar");
    }
  });

  it("not: should succeed only if the child parser fails", () => {
    const parser = P.seq(P.not(P.consume("123")), P.alphanumeric1());

    expect(parser("abc")).toHaveProperty("success", true);
    expect(parser("123")).toHaveProperty("success", false);
  });

  it("manyUntil: should stop when terminator is reached", () => {
    const parser = P.manyUntil(P.anyChar(), P.consume("]"));
    expect(parser("abc]def")).toEqual({
      success: true,
      value: ["a", "b", "c"],
      remaining: "]def",
    });
  });
});
