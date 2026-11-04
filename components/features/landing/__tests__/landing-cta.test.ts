import { describe, expect, it } from "vitest";

import {
  RETURNING_VISITOR_KEYS,
  readIsReturning,
  resolveCtaHref,
} from "../landing-cta";

describe("resolveCtaHref", () => {
  it("sends new visitors straight to quickdive", () => {
    expect(
      resolveCtaHref({ isReturning: false, isLoggedIn: false, locale: "en" }),
    ).toBe("/en/quickdive");
  });

  it("sends new visitors to quickdive even when logged in", () => {
    expect(
      resolveCtaHref({ isReturning: false, isLoggedIn: true, locale: "en" }),
    ).toBe("/en/quickdive");
  });

  it("sends returning logged-in visitors to explore", () => {
    expect(
      resolveCtaHref({ isReturning: true, isLoggedIn: true, locale: "zh" }),
    ).toBe("/zh/explore");
  });

  it("sends returning logged-out visitors to register with quickdive intent", () => {
    expect(
      resolveCtaHref({ isReturning: true, isLoggedIn: false, locale: "zh" }),
    ).toBe("/zh/register?from=quickdive");
  });
});

describe("readIsReturning", () => {
  const storageWith = (present: Record<string, string>) => ({
    getItem: (key: string) => present[key] ?? null,
  });

  it("returns false when no returning keys exist", () => {
    expect(readIsReturning(storageWith({}))).toBe(false);
  });

  it.each(RETURNING_VISITOR_KEYS)("returns true when %s is present", (key) => {
    expect(readIsReturning(storageWith({ [key]: "1" }))).toBe(true);
  });

  it("ignores empty-string values (falsy)", () => {
    expect(
      readIsReturning(storageWith({ "deep-dive-quickdive-history": "" })),
    ).toBe(false);
  });
});
