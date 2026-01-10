import { describe, expect, it } from "vitest";
import { isLikelyUrl, normalizeUrl, parseUrl, resolveURLPath } from "./url";

describe("URL Parsing and Normalization", () => {
  it("should normalize slashes correctly", () => {
    expect(normalizeUrl("goggle.com///search//")).toBe("goggle.com/search");
  });

  it("should parse query params", () => {
    const result = parseUrl("goggle.net/search?q=test");
    expect(result.host).toBe("goggle.net");
    expect(result.path).toBe("/search");
    expect(result.params).toEqual({ q: "test" });
  });

  it("should handle multiple question marks", () => {
    const result = parseUrl("site.com/page?q1=a?q2=b");
    expect(result.params).toEqual({ q1: "a", q2: "b" });
  });

  it("should handle URLs with no path", () => {
    const result = parseUrl("example.com");
    expect(result.host).toBe("example.com");
    expect(result.path).toBe("/");
  });
});

describe("URL Resolution", () => {
  const base = "mysite.com/blog/posts/art1";

  it("should resolve root-relative paths", () => {
    expect(resolveURLPath(base, "/home")).toBe("mysite.com/home");
  });

  it("should resolve relative paths (moving up if file)", () => {
    expect(resolveURLPath(base, "comment")).toBe(
      "mysite.com/blog/posts/comment",
    );
  });

  it('should resolve ".." to go up a directory and "." as self', () => {
    expect(resolveURLPath(base, ".././all")).toBe("mysite.com/blog/all");
  });

  it("should handle trailing slashes in base path", () => {
    const baseWithSlash = "mysite.com/blog/posts/";
    expect(resolveURLPath(baseWithSlash, "new")).toBe(
      "mysite.com/blog/posts/new",
    );
  });
});

describe("Likely URL", () => {
  it("should return true for valid domains", () => {
    expect(isLikelyUrl("example.com")).toBe(true);
    expect(isLikelyUrl("sub.domain.org/path")).toBe(true);
    expect(isLikelyUrl("sub.domain.org/path?q=query")).toBe(true);
  });

  it("should return true for strings containing internal slashes", () => {
    expect(isLikelyUrl("my/path")).toBe(true);
  });

  it("should return false for plain text", () => {
    expect(isLikelyUrl("textextextxtexe928493084")).toBe(false);
  });

  it("should respect the TLD length limit (2-6)", () => {
    expect(isLikelyUrl("site.babababa")).toBe(false);
    expect(isLikelyUrl("site.bababa")).toBe(true);
  });
});
