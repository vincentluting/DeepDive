import { describe, it, expect } from "vitest";
import { isSafeRedirectPath, safeRedirectPath } from "../safe-redirect";

describe("isSafeRedirectPath", () => {
  it("accepts relative app paths", () => {
    expect(isSafeRedirectPath("/en/dashboard")).toBe(true);
    expect(isSafeRedirectPath("/zh/report/abc-123")).toBe(true);
    expect(isSafeRedirectPath("/en/deepdive?tab=overview")).toBe(true);
    expect(isSafeRedirectPath("/en/report#section")).toBe(true);
  });

  it("rejects absolute URLs to other origins", () => {
    expect(isSafeRedirectPath("https://evil.com/phish")).toBe(false);
    expect(isSafeRedirectPath("http://evil.com")).toBe(false);
  });

  it("rejects protocol-relative URLs (//evil.com)", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath("///evil.com")).toBe(false);
  });

  it("rejects dangerous schemes", () => {
    expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectPath("data:text/html,<script>")).toBe(false);
    expect(isSafeRedirectPath("file:///etc/passwd")).toBe(false);
    expect(isSafeRedirectPath("vbscript:msgbox")).toBe(false);
  });

  it("rejects backslash-based bypass attempts", () => {
    expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
    expect(isSafeRedirectPath("/path\\with\\slashes")).toBe(false);
  });

  it("rejects control characters", () => {
    expect(isSafeRedirectPath("/path\nwith\nnewline")).toBe(false);
    expect(isSafeRedirectPath("/path\x00null")).toBe(false);
    expect(isSafeRedirectPath("/path\rwith\rcarriage")).toBe(false);
  });

  it("rejects non-string and empty inputs", () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath(123)).toBe(false);
    expect(isSafeRedirectPath("")).toBe(false);
    expect(isSafeRedirectPath("dashboard")).toBe(false); // no leading /
  });

  it("rejects overly long paths", () => {
    expect(isSafeRedirectPath("/" + "a".repeat(2001))).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("returns input when safe", () => {
    expect(safeRedirectPath("/en/dashboard", "/fallback")).toBe(
      "/en/dashboard",
    );
  });

  it("returns fallback when unsafe", () => {
    expect(safeRedirectPath("https://evil.com", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath("//evil.com", "/fallback")).toBe("/fallback");
    expect(safeRedirectPath(null, "/fallback")).toBe("/fallback");
    expect(safeRedirectPath(undefined, "/fallback")).toBe("/fallback");
  });
});
