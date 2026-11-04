import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

const brandTokens = [
  "--brand-sky",
  "--brand-seaglass",
  "--brand-ultramarine",
  "--brand-foam",
  "--brand-pearl",
  "--brand-kelp",
  "--brand-lantern",
  "--brand-ink",
] as const;

describe("Sunlit Descent design contract", () => {
  test("light and dark modes share the same brand token names", () => {
    const rootBlock = css.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    const darkBlock = css.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

    for (const token of brandTokens) {
      expect(rootBlock).toContain(token);
      expect(darkBlock).toContain(token);
    }
  });

  test("each semantic surface maps through Sunlit/Nocturne tokens", () => {
    for (const surface of ["dive", "revelation", "sanctuary", "utility"]) {
      expect(css).toContain(`[data-surface="${surface}"]`);
    }

    for (const token of [
      "--surface-daylight-bg",
      "--surface-daylight-fg",
      "--surface-daylight-muted",
      "--surface-daylight-rule",
      "--surface-daylight-accent",
    ]) {
      expect(css).toContain(token);
    }
  });

  test("shared visual primitives exist for the full-site upgrade", () => {
    for (const className of [
      ".sunlit-field",
      ".surface-wash",
      ".depth-rail",
      ".monograph-panel",
    ]) {
      expect(css).toContain(className);
    }
  });

  test("does not include wildcard arbitrary-value examples Tailwind can compile", () => {
    const wildcardCandidate = String.fromCharCode(
      98,
      103,
      45,
      91,
      118,
      97,
      114,
      40,
      45,
      45,
      103,
      114,
      97,
      100,
      45,
      42,
      41,
      93,
    );
    const wildcardCssVar = String.fromCharCode(
      118,
      97,
      114,
      40,
      45,
      45,
      103,
      114,
      97,
      100,
      45,
      42,
      41,
    );

    expect(css).not.toContain(wildcardCandidate);
    expect(css).not.toContain(wildcardCssVar);
  });
});
