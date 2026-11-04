import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { getPageArt } from "@/lib/design/page-art";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Meridian page-art route coverage", () => {
  test("public and pricing routes resolve distinct page-art direction", () => {
    expect(getPageArt("/en/research")).toMatchObject({
      light: "laboratory",
      dark: "laboratory",
      wash: "utility",
    });
    expect(getPageArt("/zh/ai-career-check")).toMatchObject({
      light: "mechanical",
      dark: "mechanical",
      wash: "utility",
    });
    expect(getPageArt("/en/pricing")).toMatchObject({
      light: "sunlit-day",
      dark: "hero-ocean",
    });
  });

  test("audited public and pricing pages mount the page-art shell", () => {
    const publicLayout = readProjectFile("app/[locale]/(public)/layout.tsx");
    const researchPage = readProjectFile(
      "app/[locale]/(public)/research/page.tsx",
    );
    const aiCareerCheckPage = readProjectFile(
      "app/[locale]/(public)/ai-career-check/page.tsx",
    );
    const pricingPage = readProjectFile(
      "app/[locale]/(marketing)/pricing/page.tsx",
    );

    expect(publicLayout).toContain("RouteSurfaceBoundary");
    expect(publicLayout).toContain("RoutePageArt");
    expect(researchPage).toContain("dd-public-page");
    expect(aiCareerCheckPage).toContain("dd-public-page");
    expect(pricingPage).toContain("PageArtLayer");
    expect(pricingPage).toContain('route="pricing"');
    expect(pricingPage).toContain("bg-transparent");
  });

  test("page-art CSS lets public pages reveal the shared painting", () => {
    const css = readProjectFile("app/globals.css");

    expect(css).toContain(".dd-public-page");
    expect(css).toContain(
      "[data-surface]:has(.md-page-art) .dd-public-page",
    );
  });

  test("Quick Dive monograph has dark-mode legibility overrides", () => {
    const css = readProjectFile("app/globals.css");

    for (const selector of [
      ".dark .dd-quickdive-monograph__spread",
      ".dark .dd-quickdive-monograph__page--side",
      ".dark .dd-quickdive-monograph__title",
      ".dark .dd-quickdive-monograph__description",
      ".dark .dd-quickdive-monograph__source-note",
    ]) {
      expect(css).toContain(selector);
    }
  });
});
