import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("Deep Dive Meridian questionnaire shell", () => {
  const shell = () =>
    readFileSync(join(__dirname, "../questionnaire-shell.tsx"), "utf8");

  it("renders the questionnaire inside the Meridian page-art shell", () => {
    const src = shell();

    expect(src).toContain("PageArtLayer");
    expect(src).toContain('route="deepdive"');
    expect(src).toContain("dd-questionnaire-shell");
    expect(src).toContain('data-testid="deepdive-meridian-shell"');
  });

  it("keeps the desktop chart-room structure around the active question", () => {
    const src = shell();

    expect(src).toContain("ExpeditionRail");
    expect(src).toContain("dd-questionnaire-stage");
    expect(src).toContain("dd-questionnaire-card");
    expect(src).toContain("dd-questionnaire-aside");
    expect(src).toContain("DepthGauge");
  });
});
