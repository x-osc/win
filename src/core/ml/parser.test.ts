import { describe, expect, it } from "vitest";
import type { ParseResult } from "./parser";
import * as P from "./parser";

describe("Basic Parsers", () => {
  it("consume: should match exact string and return remaining", () => {
    const parser = P.consume("hello");
    const input = "helloworld";

    const result = parser(input, 0);

    expect(result).toEqual({
      success: true,
      value: "hello",
      offset: 5,
    } satisfies ParseResult<string>);
  });

  it("ws: should consume zero or more whitespace characters", () => {
    const parser = P.ws();
    const input = "  \n\tcode";

    expect(parser(input, 0)).toEqual({
      success: true,
      value: "  \n\t",
      offset: 4,
    } satisfies ParseResult<string>);
  });

  it("alphanumeric1: should require at least one alphanumeric char", () => {
    const parser = P.alphanumeric1();
    const input = "abc123!";

    expect(parser(input, 0)).toEqual({
      success: true,
      value: "abc123",
      offset: 6,
    });

    expect(parser("!abc", 0).success).toBe(false);
  });

  it("eof: should succeed only at end of string", () => {
    const parser = P.eof();

    expect(parser("text", 0).success).toBe(false);
    expect(parser("text", 4)).toEqual({
      success: true,
      value: null,
      offset: 4,
    });
  });
});

describe("Combinators", () => {
  it("seq: should run parsers in sequence", () => {
    const parser = P.seq(P.consume("a"), P.consume("b"));
    const result = parser("abc", 0);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(["a", "b"]);
      expect(result.offset).toBe(2);
    }
  });

  it("map: should transform the parsed value", () => {
    const parser = P.consume("123");
    const mapped = P.map(parser, (val) => parseInt(val, 10));

    const result = mapped("12345", 0);
    expect(result).toEqual({
      success: true,
      value: 123,
      offset: 3,
    } satisfies ParseResult<number>);
  });

  it("many: should parse zero or more times", () => {
    const parser = P.many(P.consume("x"));
    expect(parser("xxxy", 0)).toEqual({
      success: true,
      value: ["x", "x", "x"],
      offset: 3,
    } satisfies ParseResult<string[]>);
  });

  it("lookahead: should succeed without consuming input", () => {
    const parser = P.seq(P.lookahead(P.consume("foo")), P.alphanumeric1());
    const result = parser("foobar", 0);

    expect(result.success).toBe(true);
    if (result.success) {
      // result.value is ["foo", "foobar"]
      // The second parser started at 0 because lookahead reset/didn't move the pointer
      expect(result.value[1]).toBe("foobar");
      expect(result.offset).toBe(6);
    }
  });

  it("not: should succeed only if the child parser fails", () => {
    const parser = P.seq(P.not(P.consume("123")), P.alphanumeric1());

    expect(parser("123abc", 0)).toHaveProperty("success", false);

    const result = parser("42abc", 0);
    if (result.success) {
      expect(result.value).toStrictEqual([null, "42abc"]);
      expect(result.offset).toBe(5);
    }
  });

  it("manyUntil: should stop when terminator is reached", () => {
    const parser = P.manyUntil(P.anyChar(), P.consume("]"));
    const input = "abc]def";

    expect(parser(input, 0)).toEqual({
      success: true,
      value: ["a", "b", "c"],
      offset: 3,
    });
  });

  it("expect: should provide a custom error message when the child fails", () => {
    const tagName = P.alphanumeric1();
    const importantTag = P.expect(
      tagName,
      "A valid tag name is required here!",
    );

    const successRes = importantTag("myTag123", 0);
    expect(successRes.success).toBe(true);
    if (successRes.success) {
      expect(successRes.value).toBe("myTag123");
      expect(successRes.offset).toBe(8);
    }

    const failRes = importantTag("!!!", 0);
    expect(failRes.success).toBe(false);
    if (!failRes.success) {
      expect(failRes.reason).toBe("A valid tag name is required here!");
      expect(failRes.offset).toBe(0);
    }
  });
});
