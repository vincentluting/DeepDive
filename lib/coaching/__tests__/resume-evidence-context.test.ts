import { describe, expect, it } from "vitest";

import type { ResumeMatchRow } from "@/lib/db/resume-match";

import { buildResumeEvidenceContext } from "../resume-evidence-context";

const resumeMatch: ResumeMatchRow = {
  id: "resume-1",
  assessmentId: "assessment-1",
  userId: "user-1",
  sourceType: "resume",
  fileName: null,
  fileType: null,
  flowVersion: "v2-dialog",
  supersededAt: null,
  createdAt: new Date("2026-06-10T00:00:00Z"),
  resumeData: {
    experience: [],
    skills: ["Research", "Stakeholder interviews"],
    languages: [],
    industries: ["Education"],
    education: [],
    yearsOfExperience: 6,
    seniority: "mid",
  },
  matchResult: {
    alignedDimensions: [
      {
        dimension: "Investigative",
        assessmentSignal: "high",
        resumeEvidence: "Led user research",
        confidenceBoost: 0.2,
      },
    ],
    conflictingDimensions: [],
    autoFillRealConditions: {},
    summary_zh: "研究能力有明确经历支持。",
    summary_en: "Research strengths are supported by experience.",
  },
};

describe("buildResumeEvidenceContext", () => {
  it("returns no prompt block when the user has no resume evidence", () => {
    expect(buildResumeEvidenceContext(null, "en")).toBe("");
  });

  it("builds a concise evidence block without exposing file metadata", () => {
    const context = buildResumeEvidenceContext(resumeMatch, "en");

    expect(context).toContain("6 years");
    expect(context).toContain("Led user research");
    expect(context).toContain("Research");
    expect(context).not.toContain("resume.pdf");
  });
});
