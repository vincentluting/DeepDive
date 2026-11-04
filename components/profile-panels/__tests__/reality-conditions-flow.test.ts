/**
 * Verify the reality conditions flow refactoring:
 * 1. Dashboard no longer renders RealConditionsEntry
 * 2. Profile page ReportCTA uses inline sheet (not dashboard link)
 * 3. i18n keys are complete (new keys in en + zh)
 * 4. No hardcoded English fallbacks in background-pressure-step
 * 5. Fullpage copy uses empowering framing (not "constraints")
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

function readJson(relPath: string): Record<string, unknown> {
  return JSON.parse(readFile(relPath));
}

// ── 1. Dashboard no longer renders RealConditionsEntry ──

describe("Dashboard — RealConditionsEntry removed", () => {
  const src = readFile("app/[locale]/(app)/dashboard/page.tsx");

  it("does not import RealConditionsEntry", () => {
    expect(src).not.toContain("import { RealConditionsEntry }");
    expect(src).not.toContain(
      'from "@/components/reality-conditions/real-conditions-entry"',
    );
  });

  it("does not render <RealConditionsEntry", () => {
    expect(src).not.toContain("<RealConditionsEntry");
  });
});

// ── 2. ReportCTA uses inline form, not dashboard link ──

describe("ReportCTA — inline conditions form", () => {
  const src = readFile("components/profile-panels/narrative-synthesis.tsx");

  it("does not link to /dashboard#conditions", () => {
    expect(src).not.toContain("dashboard#conditions");
  });

  it("imports RealConditionsForm", () => {
    expect(src).toContain("import { RealConditionsForm }");
  });

  it("renders RealConditionsForm inline", () => {
    expect(src).toContain("<RealConditionsForm");
  });

  it("accepts sessionId prop", () => {
    expect(src).toContain("sessionId");
  });

  it("has handleConditionsSuccess that triggers generateReport", () => {
    expect(src).toContain("handleConditionsSuccess");
    // After conditions success, should call generateReport directly
    expect(src).toMatch(
      /handleConditionsSuccess.*=.*\(\).*=>.*\{[\s\S]*?generateReport/,
    );
  });
});

// ── 3. i18n keys complete in en + zh research.json ──

describe("i18n — research.json new keys", () => {
  const en = readJson("lib/i18n/dictionaries/en/research.json") as {
    realityConditions: Record<string, string>;
  };
  const zh = readJson("lib/i18n/dictionaries/zh/research.json") as {
    realityConditions: Record<string, string>;
  };

  const requiredKeys = [
    "interestedIndustriesHint",
    "careerChangeUrgencyLabel",
    "urgency_exploring",
    "urgency_considering",
    "urgency_urgent",
  ];

  for (const key of requiredKeys) {
    it(`en has key: ${key}`, () => {
      expect(en.realityConditions[key]).toBeTruthy();
    });
    it(`zh has key: ${key}`, () => {
      expect(zh.realityConditions[key]).toBeTruthy();
    });
  }

  it("en and zh have same key count for realityConditions", () => {
    const enKeys = Object.keys(en.realityConditions).sort();
    const zhKeys = Object.keys(zh.realityConditions).sort();
    expect(enKeys).toEqual(zhKeys);
  });
});

// ── 4. No hardcoded English fallbacks in background-pressure-step ──

describe("BackgroundPressureStep — no hardcoded English", () => {
  const src = readFile(
    "components/reality-conditions/steps/background-pressure-step.tsx",
  );

  it("does not have hardcoded interestedIndustriesHint fallback", () => {
    expect(src).not.toContain("Select up to 5 industries you want to explore");
  });

  it("does not have hardcoded careerChangeUrgencyLabel fallback", () => {
    expect(src).not.toContain(
      "How urgently are you considering a career change?",
    );
  });

  it("uses i18n key for interestedIndustriesHint", () => {
    expect(src).toContain("interestedIndustriesHint");
  });

  it("uses i18n key for careerChangeUrgencyLabel", () => {
    expect(src).toContain("careerChangeUrgencyLabel");
  });
});

// ── 5. Step label copy uses empowering framing ──

describe("Step label copy — empowering framing", () => {
  const en = readJson("lib/i18n/dictionaries/en/research.json") as {
    realityConditions: Record<string, string>;
  };
  const zh = readJson("lib/i18n/dictionaries/zh/research.json") as {
    realityConditions: Record<string, string>;
  };

  it("en step label is 'Your Situation' not 'Your Constraints'", () => {
    expect(en.realityConditions.stepYourConstraints).toBe("Your Situation");
  });

  it("zh step label is '你的情况' not '你的约束'", () => {
    expect(zh.realityConditions.stepYourConstraints).toBe("你的情况");
  });
});

// ── 6. Profile page threads sessionId ──

describe("Profile page — sessionId threading", () => {
  const profilePage = readFile("app/[locale]/(app)/profile/[id]/page.tsx");

  it("imports getLatestSessionIdForUser", () => {
    expect(profilePage).toContain("getLatestSessionIdForUser");
  });

  it("passes sessionId to ProfileDashboard", () => {
    expect(profilePage).toContain("sessionId={latestSessionId}");
  });

  it("does not pass unused userId to ProfileDashboard", () => {
    expect(profilePage).not.toContain("userId={userId}");
  });
});

// ── 7. Profile i18n — updated CTA copy ──

describe("Profile i18n — updated CTA copy", () => {
  const en = readJson("lib/i18n/dictionaries/en/profile.json") as {
    profile: Record<string, string>;
  };
  const zh = readJson("lib/i18n/dictionaries/zh/profile.json") as {
    profile: Record<string, string>;
  };

  it("en groundStepEdit key exists", () => {
    expect(en.profile.groundStepEdit).toBeTruthy();
  });

  it("zh groundStepEdit key exists", () => {
    expect(zh.profile.groundStepEdit).toBeTruthy();
  });

  it("en skip text implies consequence", () => {
    expect(en.profile.reportCtaSkip).toContain("general assumptions");
  });

  it("zh skip text implies consequence", () => {
    expect(zh.profile.reportCtaSkip).toContain("通用假设");
  });
});

// ── 8. Two-step ground-discovery i18n keys ──

describe("Profile i18n — two-step ground-discovery keys", () => {
  const en = readJson("lib/i18n/dictionaries/en/profile.json") as {
    profile: Record<string, string>;
  };
  const zh = readJson("lib/i18n/dictionaries/zh/profile.json") as {
    profile: Record<string, string>;
  };

  const requiredKeys = [
    "groundStepTitle",
    "groundStepDesc",
    "groundStepDone",
    "groundStepButton",
    "groundStepEdit",
    "generateStepTitle",
    "generateStepDesc",
    "generateStepLocked",
    "reportCtaSkipConsequence",
    // Top-of-page tip that nudges first-time users toward the finale CTA.
    // Replaces the old top "Generate Now" banner that lived above the
    // frontispiece — the banner was retired so users can absorb the profile
    // before committing to the deeper report generation.
    "reportTopTip",
  ];

  for (const key of requiredKeys) {
    it(`en has key: ${key}`, () => {
      expect(en.profile[key]).toBeTruthy();
    });
    it(`zh has key: ${key}`, () => {
      expect(zh.profile[key]).toBeTruthy();
    });
  }
});

// ── 9. Two-step visual structure in ReportCTA ──

describe("ReportCTA — two-step visual structure", () => {
  const src = readFile("components/profile-panels/narrative-synthesis.tsx");

  it("has step 1 ground discovery references", () => {
    expect(src).toContain("groundStepTitle");
    expect(src).toContain("groundStepDesc");
    expect(src).toContain("groundStepButton");
  });

  it("has step 2 generate report references", () => {
    expect(src).toContain("generateStepTitle");
    expect(src).toContain("generateStepDesc");
    expect(src).toContain("generateStepLocked");
  });

  it("has skip consequence text", () => {
    expect(src).toContain("reportCtaSkipConsequence");
  });

  it("uses conditionsFilled for step progression", () => {
    expect(src).toContain("conditionsFilled");
  });
});

// ── 11. QuestionnaireShell no longer shows RealConditionsForm ──
//       (Post-Deep-Dive fatigue-state collection retired; main entry now
//        lives in Profile ReportCTA groundStep.)

describe("QuestionnaireShell — RealConditionsForm removed", () => {
  const src = readFile("components/questionnaire/questionnaire-shell.tsx");

  it("does not import RealConditionsForm", () => {
    expect(src).not.toContain("import { RealConditionsForm }");
  });

  it("does not render <RealConditionsForm", () => {
    expect(src).not.toContain("<RealConditionsForm");
  });

  it("does not branch on submission.showRealityConditions", () => {
    expect(src).not.toContain("showRealityConditions");
  });
});

describe("useAssessmentSubmission — RealConditions state/handlers removed", () => {
  const src = readFile("components/questionnaire/use-assessment-submission.ts");

  it("does not declare showRealityConditions state", () => {
    expect(src).not.toContain("setShowRealityConditions");
    expect(src).not.toContain("showRealityConditions");
  });

  it("does not define handleRealityConditionsSuccess/Skip", () => {
    expect(src).not.toContain("handleRealityConditionsSuccess");
    expect(src).not.toContain("handleRealityConditionsSkip");
  });

  it("beginSubmission flows directly into finalizeAndNavigate", () => {
    expect(src).toMatch(
      /beginSubmission[\s\S]*?scoringInputRef\.current = scoringInput;[\s\S]*?finalizeAndNavigate\(\)/,
    );
  });
});

// ── 12. Profile finale + top tip replace the old top banner ──

describe("ProfileDashboard — finale CTA + top tip", () => {
  const src = readFile("components/profile-panels/profile-dashboard.tsx");

  it("renders the finale <NarrativeReportFinale> at page end", () => {
    expect(src).toContain("NarrativeReportFinale");
  });

  it("passes hideReportFinale to <NarrativeSynthesis>", () => {
    expect(src).toContain("hideReportFinale");
  });

  it("shows a lightweight top tip pointing to the finale", () => {
    expect(src).toContain("reportTopTip");
  });

  it("no longer renders the old reportBanner top block", () => {
    expect(src).not.toContain("reportBannerTitleGround");
    expect(src).not.toContain("reportBannerCtaGround");
  });
});
