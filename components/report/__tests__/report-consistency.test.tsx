import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportConsistency } from "@/components/report/report-consistency";
import type { ReportDict } from "@/lib/types";

const t: ReportDict = {
  consistencyEyebrow: "Ideals vs. Actions",
  consistencyHigh: "HIGH-BAND",
  consistencyModerate: "MODERATE-BAND",
  consistencyLow: "LOW-BAND",
};

describe("ReportConsistency", () => {
  it("renders the high band + percentage for strong alignment", () => {
    const html = renderToStaticMarkup(
      <ReportConsistency consistency={0.83} t={t} />,
    );
    expect(html).toContain("83%");
    expect(html).toContain("HIGH-BAND");
    expect(html).toContain("Ideals vs. Actions");
  });

  it("renders the moderate band", () => {
    const html = renderToStaticMarkup(
      <ReportConsistency consistency={0.5} t={t} />,
    );
    expect(html).toContain("50%");
    expect(html).toContain("MODERATE-BAND");
    expect(html).not.toContain("HIGH-BAND");
  });

  it("renders the low band", () => {
    const html = renderToStaticMarkup(
      <ReportConsistency consistency={0.2} t={t} />,
    );
    expect(html).toContain("20%");
    expect(html).toContain("LOW-BAND");
  });

  it("renders nothing when consistency is missing", () => {
    expect(
      renderToStaticMarkup(<ReportConsistency consistency={null} t={t} />),
    ).toBe("");
    expect(
      renderToStaticMarkup(<ReportConsistency consistency={undefined} t={t} />),
    ).toBe("");
  });

  it("clamps out-of-range values", () => {
    const html = renderToStaticMarkup(
      <ReportConsistency consistency={1.5} t={t} />,
    );
    expect(html).toContain("100%");
    expect(html).toContain("HIGH-BAND");
  });
});
