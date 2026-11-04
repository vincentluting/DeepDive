import { describe, it, expect } from "vitest";
import { escapeCsvField } from "../csv";

describe("escapeCsvField", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("passes plain text through unchanged", () => {
    expect(escapeCsvField("hello world")).toBe("hello world");
    expect(escapeCsvField("Researcher")).toBe("Researcher");
  });

  it("RFC4180-quotes commas, quotes, and newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('she said "hi"')).toBe('"she said ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvField("carriage\rreturn")).toBe('"carriage\rreturn"');
  });

  it("preserves plain numbers (including negatives) — no formula guard", () => {
    expect(escapeCsvField(-5)).toBe("-5");
    expect(escapeCsvField("-5")).toBe("-5");
    expect(escapeCsvField("+3.2")).toBe("+3.2");
    expect(escapeCsvField("1.5e-3")).toBe("1.5e-3");
    expect(escapeCsvField(0)).toBe("0");
  });

  it("neutralizes spreadsheet formula injection with a leading quote", () => {
    expect(escapeCsvField("=cmd()")).toBe("'=cmd()");
    expect(escapeCsvField("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvField("=1+1")).toBe("'=1+1");
    // formula that also needs quoting (contains a comma)
    expect(escapeCsvField("=HYPERLINK(1,2)")).toBe('"\'=HYPERLINK(1,2)"');
    // "-cmd" / "+cmd" are not plain numbers → guarded
    expect(escapeCsvField("-2+3")).toBe("'-2+3");
    expect(escapeCsvField("@foo")).toBe("'@foo");
  });

  it("joins arrays with semicolons (avoids spurious comma-quoting)", () => {
    expect(escapeCsvField(["a", "b", "c"])).toBe("a;b;c");
    expect(escapeCsvField([])).toBe("");
  });

  it("guards a malicious user-agent-style string", () => {
    // leading '=' neutralized with a quote; no comma/quote/newline ⇒ no RFC4180 wrap
    expect(escapeCsvField("=2+5+cmd|' /C calc'!A0")).toBe(
      "'=2+5+cmd|' /C calc'!A0",
    );
  });
});
