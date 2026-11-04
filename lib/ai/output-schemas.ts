// Zod output schemas for LLM-generated JSON responses.
// Each schema mirrors the TypeScript interface consumed by the caller.
// Used by callLLMStructured() for native structured output + validation.

import { z } from "zod/v4";

// ── Career Match Narrative (career-match-narrative task) ──

export const CareerMatchNarrativeSchema = z.object({
  summary: z.string().min(20),
  directions: z
    .array(
      z.object({
        whySuitable: z.string().min(10),
        challenges: z.string().min(10),
        actionableInsights: z
          .union([
            z.object({
              books: z.array(
                z.object({
                  title: z.string(),
                  author: z.string(),
                  reason_zh: z.string(),
                  reason_en: z.string(),
                }),
              ),
              certifications: z.array(
                z.object({
                  name: z.string(),
                  provider: z.string(),
                  timeToComplete: z.string(),
                  priority: z.enum(["start_here", "next_step"]),
                  reason_zh: z.string(),
                  reason_en: z.string(),
                }),
              ),
              communityMove: z.object({
                action_zh: z.string(),
                action_en: z.string(),
                platform: z.string(),
              }),
              thirtyDayChallenge: z.object({
                challenge_zh: z.string(),
                challenge_en: z.string(),
              }),
            }),
            z.null().transform(() => undefined),
          ])
          .optional(),
      }),
    )
    .min(1),
  aiEraDirections: z
    .array(
      z.object({
        whySuitable: z.string().min(10),
        challenges: z.string().min(10),
      }),
    )
    .optional(),
});

export type CareerMatchNarrativeOutput = z.infer<
  typeof CareerMatchNarrativeSchema
>;

// ── Identity Narratives — Call A (profile-narrative task) ──

export const IdentityNarrativesCallASchema = z.object({
  identitySummary: z.string().min(10),
  archetypeNarrative: z.string().min(10),
  bigFiveNarrative: z.string().min(10),
  valueNarrative: z.string().min(10),
});

// ── Identity Narratives — Call B (profile-narrative task) ──

export const IdentityNarrativesCallBSchema = z.object({
  sjtTensionNarrative: z.string().min(10),
  crossDimensionNarrative: z.string().min(10),
  growthMapInsight: z.string().min(10),
});

// ── Panel 3 Career Pathway (career-pathway task) ──

const JobDirectionSchema = z.object({
  title_zh: z.string(),
  title_en: z.string(),
  industry: z.string(),
  seniority: z.string(),
  matchScore: z.number(),
  matchReason: z.string(),
  linkedinSearchQuery: z.string(),
  isIdealMatch: z.boolean().optional(),
  resourceGuide: z
    .object({
      atsKeywords: z.array(z.string()),
      linkedinTip_zh: z.string(),
      linkedinTip_en: z.string(),
      salaryContext_zh: z.string(),
      salaryContext_en: z.string(),
    })
    .optional(),
  gapAnalysis: z
    .object({
      readinessScore: z.number(),
      readinessLabel_zh: z.string(),
      readinessLabel_en: z.string(),
      skillGaps: z.array(
        z.object({
          skill_zh: z.string(),
          skill_en: z.string(),
          currentLevel_zh: z.string(),
          currentLevel_en: z.string(),
          requiredLevel_zh: z.string(),
          requiredLevel_en: z.string(),
          bridgeAction_zh: z.string(),
          bridgeAction_en: z.string(),
          timeToClose: z.string(),
          difficulty: z.enum(["low", "medium", "high"]),
        }),
      ),
      experienceGaps: z.array(
        z.object({
          gap_zh: z.string(),
          gap_en: z.string(),
          workaround_zh: z.string(),
          workaround_en: z.string(),
        }),
      ),
      conditionsAlignment: z.object({
        visaCompatibility: z.enum([
          "favorable",
          "neutral",
          "challenging",
          "unknown",
        ]),
        locationMatch: z.enum(["strong", "partial", "mismatch", "unknown"]),
        salaryExpectationMatch: z.enum([
          "within_range",
          "stretch",
          "overqualified",
          "unknown",
        ]),
        note_zh: z.string(),
        note_en: z.string(),
      }),
      timelineToCompetitive_zh: z.string(),
      timelineToCompetitive_en: z.string(),
      topPriorityAction_zh: z.string(),
      topPriorityAction_en: z.string(),
    })
    .optional(),
});

export const Panel3LLMOutputSchema = z.object({
  jobDirections: z.array(JobDirectionSchema).min(1),
  jobSearchStrategy: z.object({
    positioning: z.string(),
    resumeHighlights: z.array(z.string()),
    networkingTips: z.array(z.string()),
    constraintStrategies: z.array(
      z.object({ constraint: z.string(), strategy: z.string() }),
    ),
  }),
  week1: z.object({
    theme: z.string(),
    tasks: z.array(
      z.object({
        description: z.string(),
        relatedDirection: z.number(),
        difficulty: z.enum(["easy", "medium", "stretch"]),
      }),
    ),
  }),
  weeksPreview: z.array(
    z.object({
      weekNumber: z.number(),
      theme: z.string(),
      taskCount: z.number(),
    }),
  ),
});

// ── Integration Layer (integration task) ──

export const IntegrationLLMOutputSchema = z.object({
  coreInsight: z.string().min(10),
  transitions: z.object({
    profileToPathway: z.string(),
  }),
  letterToUser: z.string().min(50),
});

// ── Resume Parse (resume-parse task) ──

export const ResumeDataSchema = z.object({
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      industry: z.string(),
      durationMonths: z.number(),
      responsibilities: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  languages: z.array(
    z.object({
      language: z.string(),
      proficiency: z.enum(["native", "fluent", "professional", "basic"]),
    }),
  ),
  industries: z.array(z.string()),
  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string(),
      institution: z.string(),
    }),
  ),
  yearsOfExperience: z.number(),
  seniority: z.enum(["entry", "mid", "senior", "executive", "unknown"]),
});

// ── Memory Extract (memory-extract task) ──

export const MemoryExtractSchema = z.array(
  z.object({
    category: z.string(),
    keyword: z.string(),
    insight: z.string(),
    confidence: z.number().optional(),
    source: z.string().optional(),
  }),
);

// ── Coaching Summary (coaching-summary task) ──

export const CoachingSummarySchema = z.object({
  coachingInsights: z
    .array(z.object({ insight: z.string(), discoveredAt: z.string() }))
    .optional(),
  tensionUpdates: z
    .array(z.object({ tension: z.string(), newStatus: z.string() }))
    .optional(),
  memories: z
    .array(
      z.object({
        category: z.string().optional(),
        keyword: z.string().optional(),
        insight: z.string().optional(),
        confidence: z.number().optional(),
        source: z.string().optional(),
      }),
    )
    .optional(),
  reinforcedKeywords: z.array(z.string()).optional(),
});
