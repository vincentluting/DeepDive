import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileSectionNav } from "@/components/design/meridian/mobile-section-nav";

const sections = [
  { id: "dash-overview", label: "Overview" },
  { id: "dash-continue", label: "Continue" },
  { id: "dash-reports", label: "Reports" },
];

describe("MobileSectionNav", () => {
  it("renders a chip per section with zero-padded numbering", () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={sections} label="Dashboard" />,
    );
    expect(html).toContain("Overview");
    expect(html).toContain("Continue");
    expect(html).toContain("Reports");
    // Meridian numbered compartments — 01 / 02 / 03
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("03");
  });

  it("marks the first section active on initial render (scrollspy default)", () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={sections} label="Dashboard" />,
    );
    // First chip carries aria-current; exactly one active chip initially.
    expect(html).toContain('aria-current="true"');
    expect((html.match(/aria-current="true"/g) ?? []).length).toBe(1);
    expect((html.match(/is-active/g) ?? []).length).toBe(1);
  });

  it("exposes an accessible nav landmark labelled by the page", () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={sections} label="Dashboard" />,
    );
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain("md-section-nav");
  });

  it("renders nothing when there are no sections", () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={[]} label="Empty" />,
    );
    expect(html).toBe("");
  });
});
