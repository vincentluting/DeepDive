// ============================================================
// JSON Resume Mapper
// Maps internal user data → JSON Resume-compatible export format
// Reference: https://jsonresume.org/schema/
// ============================================================

import type { PersonalProfileData } from "@/lib/types";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";

export interface JsonResumeExport {
  meta: {
    version: string;
    exportedAt: string;
    source: string;
  };
  basics: {
    name: string;
    email: string;
    summary: string;
    profiles: {
      archetype: {
        label_en: string;
        label_zh: string;
        group: string;
      } | null;
      cognitiveStyleCode: string | null;
      cognitiveStyleDisplayMode: string;
      collabMapping: {
        primary: string;
        secondary: string | null;
      } | null;
      crossCultural: {
        type: string;
        label: string;
      } | null;
    };
  };
  interests: {
    name: string;
    score: number;
    confidence: number | null;
  }[];
  skills: {
    name: string;
    level: string;
    keywords: string[];
  }[];
  values: {
    anchors: {
      name: string;
      rank: number;
      confirmed: boolean;
    }[];
    tensions: {
      between: string[];
      severity: string;
    }[];
  };
  // CAAS removed in v6.0 — adaptability field kept for export schema compat
  adaptability: null;
  confidence: Record<string, number>;
  assessments: {
    id: string;
    sessionId: string;
    completedAt: string | null;
    version: string;
  }[];
  reports: {
    id: string;
    version: string;
    createdAt: string;
    summary: string | null;
  }[];
  coachingSessions: {
    id: string;
    mode: string;
    messageCount: number;
    startedAt: string;
    endedAt: string | null;
  }[];
  quickDive: {
    id: string;
    archetypeCode: string;
    archetypeLabel: string;
    exploreMode: string;
    scores: Record<string, unknown> | null;
    createdAt: string;
  }[];
}

/**
 * Map a personal profile to JSON Resume-compatible "basics" + "interests" + "values" fields.
 */
export function mapProfileToJsonResume(
  profile: PersonalProfileData | null,
  user: { name: string | null; email: string },
): Pick<
  JsonResumeExport,
  "basics" | "interests" | "values" | "adaptability" | "confidence"
> {
  if (!profile) {
    return {
      basics: {
        name: user.name || "",
        email: user.email,
        summary: "",
        profiles: {
          archetype: null,
          cognitiveStyleCode: null,
          cognitiveStyleDisplayMode: "standard",
          collabMapping: null,
          crossCultural: null,
        },
      },
      interests: [],
      values: { anchors: [], tensions: [] },
      adaptability: null,
      confidence: {},
    };
  }

  return {
    basics: {
      name: user.name || "",
      email: user.email,
      summary: `Deep Dive Archetype: ${profile.archetype?.label_en || "Unknown"}`,
      profiles: {
        archetype: profile.archetype
          ? {
              label_en: profile.archetype.label_en,
              label_zh: profile.archetype.label_zh,
              group: profile.archetype.code,
            }
          : null,
        cognitiveStyleCode: profile.cognitiveStyleCode,
        cognitiveStyleDisplayMode:
          profile.cognitiveStyleDisplayMode || "standard",
        collabMapping: profile.collabMapping
          ? {
              primary: profile.collabMapping.primary,
              secondary: profile.collabMapping.secondary,
            }
          : null,
        crossCultural: profile.crossCultural?.type
          ? {
              type: profile.crossCultural.type,
              label: profile.crossCultural.label_zh ?? "",
            }
          : null,
      },
    },
    interests: profile.archetype
      ? [
          {
            name: `Primary: ${profile.archetype.primary}`,
            score: 1,
            confidence: profile.confidenceMap?.riasec ?? null,
          },
          {
            name: `Orientation: ${profile.archetype.orientation}`,
            score: 2,
            confidence: profile.confidenceMap?.riasec ?? null,
          },
        ]
      : [],
    values: {
      anchors: profile.schwartzAnchors?.top3
        ? profile.schwartzAnchors.top3.map((v, i) => ({
            name: v,
            rank: i + 1,
            confirmed: true,
          }))
        : [],
      tensions: profile.schwartzAnchors?.conflictPair
        ? [
            {
              between:
                getSchwartzConflictValues(
                  profile.schwartzAnchors.conflictPair,
                )?.slice() ?? [],
              severity: profile.schwartzAnchors.conflictStatus || "unknown",
            },
          ]
        : [],
    },
    adaptability: null, // CAAS removed in v6.0
    confidence: profile.confidenceMap || {},
  };
}

/**
 * Map raw database rows to clean export format for assessments.
 */
function mapAssessments(
  rows: Record<string, unknown>[],
): JsonResumeExport["assessments"] {
  return rows.map((row) => ({
    id: row.id as string,
    sessionId: row.sessionId as string,
    completedAt: row.createdAt ? String(row.createdAt) : null,
    version: (row.version as string) || "5.0",
  }));
}

/**
 * Map raw database rows to clean export format for reports.
 */
function mapReports(
  rows: Record<string, unknown>[],
): JsonResumeExport["reports"] {
  return rows.map((row) => {
    const reportJson = row.reportJson as Record<string, unknown> | null;
    return {
      id: row.id as string,
      version: (row.version as string) || "5.0",
      createdAt: row.createdAt ? String(row.createdAt) : "",
      summary: reportJson?.summary ? String(reportJson.summary) : null,
    };
  });
}

/**
 * Map raw database rows to clean export format for coaching sessions.
 */
function mapCoachingSessions(
  rows: Record<string, unknown>[],
): JsonResumeExport["coachingSessions"] {
  return rows.map((row) => {
    const messages = row.messagesJson as unknown[];
    return {
      id: row.id as string,
      mode: (row.mode as string) || "report-qa",
      messageCount: Array.isArray(messages) ? messages.length : 0,
      startedAt: row.startedAt ? String(row.startedAt) : "",
      endedAt: row.endedAt ? String(row.endedAt) : null,
    };
  });
}

/**
 * Map raw database rows to clean export format for quick explore results.
 */
function mapQuickDive(
  rows: Record<string, unknown>[],
): JsonResumeExport["quickDive"] {
  return rows.map((row) => ({
    id: row.id as string,
    archetypeCode: (row.archetypeCode as string) || "",
    archetypeLabel: (row.archetypeLabel as string) || "",
    exploreMode: (row.exploreMode as string) || "immersive",
    scores: (row.scoresJson as Record<string, unknown>) ?? null,
    createdAt: row.createdAt ? String(row.createdAt) : "",
  }));
}

/**
 * Assemble the complete JSON Resume export from all mapped sections.
 */
export function assembleExport(params: {
  user: { name: string | null; email: string };
  profile: PersonalProfileData | null;
  assessmentRows: Record<string, unknown>[];
  reportRows: Record<string, unknown>[];
  quickDiveRows: Record<string, unknown>[];
  coachingRows: Record<string, unknown>[];
}): JsonResumeExport {
  const profileData = mapProfileToJsonResume(params.profile, params.user);

  return {
    meta: {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      source: "Deep Dive Career Exploration",
    },
    ...profileData,
    skills: [],
    assessments: mapAssessments(params.assessmentRows),
    reports: mapReports(params.reportRows),
    quickDive: mapQuickDive(params.quickDiveRows),
    coachingSessions: mapCoachingSessions(params.coachingRows),
  };
}
