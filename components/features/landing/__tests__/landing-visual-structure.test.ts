import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readSection = (name: string) =>
  readFileSync(new URL(`../sections/${name}`, import.meta.url), "utf8");

const readProjectFile = (path: string) =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");

describe("landing visual structure", () => {
  it("pairs the healing ocean hero with a glass product instrument", () => {
    const source = readSection("landing-hero.tsx");

    expect(source).toContain("/brand/landing-healing-hero.webp");
    expect(source).toContain("dd-hero-light-field");
    expect(source).toContain("HeroDashboard");
    expect(source).toContain("dd-hero-product-stage");
    expect(source).not.toContain("deep-dive-healing-descent.mp4");
  });

  it("uses dedicated portrait and report art assets for the first two sections", () => {
    const source = readSection("dive-compartments.tsx");

    expect(source).toContain("/brand/landing-portrait-field-v3.webp");
    expect(source).toContain("/brand/landing-career-sea-chart-v3.webp");
    expect(source).not.toContain("TerrainLine");
  });

  it("shows depth choices with a quiet journey progress cell", () => {
    const source = readSection("dive-choice-band.tsx");

    expect(source).toContain("d.showcase.depthChoice");
    expect(source).toContain("DEPTH_MARKS");
    expect(source).toContain("ArrowRight");
    expect(source).toContain("dd-showcase-journey-cell");
    expect(source).toContain("dd-showcase-journey-ring");
    expect(source).not.toContain("Brain");
    expect(source).not.toContain("Compass");
    expect(source).not.toContain("Sparkles");
    expect(source).not.toContain("DepthRing");
    expect(source).not.toContain("SAMPLE_JOURNEY_PROGRESS");
  });

  it("keeps the V11 glass descent overrides scoped to the landing showcase", () => {
    const css = readProjectFile("app/globals.css");
    const landingCss = css.slice(css.indexOf("LANDING V11"));

    expect(landingCss).toContain("LANDING V11");
    expect(landingCss).toContain("--md-card: #071d2b");
    expect(landingCss).not.toContain("color: var(--md-cream)");
    expect(landingCss).toContain(
      ".dd-landing-showcase .dd-showcase-hero .dd-landing-hero-inner",
    );
    expect(landingCss).toContain(
      ".dd-landing-showcase .dd-showcase-depth-card em {\n  display: block;",
    );
    expect(landingCss).toContain("@media (max-width: 760px)");
  });

  it("does not render the legacy mobile outcome strip or sticky CTA chrome", () => {
    const source = readProjectFile("app/[locale]/(marketing)/preview/page.tsx");

    expect(source).not.toContain("MobileOutcomeStrip");
    expect(source).not.toContain("MobileStickyDiveCta");
  });
});
