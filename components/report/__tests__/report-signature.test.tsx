import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReportSignature } from "@/components/report/report-signature";
import type { ReportDict } from "@/lib/types";

const t: ReportDict = {
  signatureEyebrow: "Beneath the surface",
  signatureTensionFrame: "Within {{domain}}, {{high}} high, {{low}} low.",
  signatureDistinctiveLabel: "Most distinctive",
};

// Extraversion holds an internal contrast: high Assertiveness, low Gregariousness
// (domain mean 3.0) — exactly the nuance a single domain score hides.
const facets = {
  E1_Friendliness: 3,
  E2_Gregariousness: 1.5,
  E3_Assertiveness: 4.5,
  E4_Activity_Level: 3,
  "E5_Excitement-Seeking": 3,
  E6_Cheerfulness: 3,
  O1_Imagination: 3,
  O5_Intellect: 3.2,
};

describe("ReportSignature", () => {
  it("renders the eyebrow and an intra-domain tension contrast", () => {
    const html = renderToStaticMarkup(
      <ReportSignature facets={facets} locale="en" t={t} />,
    );
    expect(html).toContain("Beneath the surface");
    expect(html).toContain("Within"); // tension frame interpolated
    expect(html).toContain("Assertiveness"); // strongest positive facet
    expect(html).toContain("Most distinctive");
  });

  it("renders distinctive facet chips with a direction arrow", () => {
    const html = renderToStaticMarkup(
      <ReportSignature facets={facets} locale="en" t={t} />,
    );
    expect(/[↑↓]/.test(html)).toBe(true);
  });

  it("renders nothing without enough facet data", () => {
    expect(
      renderToStaticMarkup(<ReportSignature facets={null} locale="en" t={t} />),
    ).toBe("");
    expect(
      renderToStaticMarkup(<ReportSignature facets={{}} locale="en" t={t} />),
    ).toBe("");
  });
});
