import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const surveySrc = () =>
  readFileSync(join(__dirname, "../post-assessment-survey.tsx"), "utf8");

const globalsCss = () =>
  readFileSync(join(__dirname, "../../../app/globals.css"), "utf8");

describe("post-assessment survey readability", () => {
  it("uses a scoped high-contrast surface instead of raw dive card styling", () => {
    const src = surveySrc();
    const css = globalsCss();

    expect(src).toContain("dd-post-assessment-page");
    expect(src).toContain("dd-post-assessment-card");
    expect(css).toContain(".dd-post-assessment-page [data-slot=\"card\"]");
    expect(css).toContain(".dd-post-assessment-page .text-muted-foreground");
    expect(css).toContain(".dd-post-assessment-page textarea");
  });
});
