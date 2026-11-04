import { z } from "zod/v4";
import { locales } from "@/lib/i18n/config";

// ============================================================
// Helpers
// ============================================================

type AnyRecord = Record<string, unknown>;
/** Refine predicate: reject z.record() payloads exceeding `max` keys. */
const atMostKeys = (max: number) => (r: AnyRecord) =>
  Object.keys(r).length <= max;

/** Strip HTML tags and trim — prevents stored XSS via display name in emails. */
const safeName = z
  .string()
  .trim()
  .transform((s) => s.replace(/<[^>]*>/g, "").trim())
  .pipe(z.string().min(1, "Name is required").max(100));

// ============================================================
// Shared sub-schemas
// ============================================================

/** Matches the RealConditions interface from lib/types */
const realConditionsSchema = z
  .object({
    education: z.object({
      level: z.enum(["high_school", "bachelor", "master", "phd", "other"]),
      field: z.string().default(""),
    }),
    experienceYears: z.number().min(0).default(0),
    pastIndustries: z.array(z.string()).max(20).default([]),
    currentCountry: z.string().optional(),
    currentCity: z.string().default(""),
    targetCountry: z.string().optional(),
    targetCities: z.array(z.string()).max(10).default([]),
    visaStatus: z
      .enum([
        "citizen",
        "permanent_resident",
        "work_visa",
        "student_visa",
        "job_seeker_visa",
        "dependent_visa",
        "undocumented",
        "other",
        "",
      ])
      .default(""),
    visaType: z.string().max(100).optional(),
    workRestrictions: z
      .object({
        canWorkFullTime: z.boolean().default(true),
        sponsorshipRequired: z.boolean().default(false),
        occupationRestricted: z.boolean().default(false),
        occupationNote: z.string().max(80).optional(),
      })
      .default({
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      }),
    workLanguages: z
      .array(
        z.object({
          language: z.string().min(1),
          proficiency: z.enum(["native", "fluent", "professional", "basic"]),
        }),
      )
      .max(10)
      .default([]),
    locationFlexibility: z
      .enum([
        "stay-local",
        "relocate-home",
        "relocate-other",
        "remote-global",
        "open",
      ])
      .default("open"),
    relocationTimeline: z
      .enum(["1year", "2-3years", "5years", "indefinite"])
      .optional(),
    familyConstraints: z
      .object({
        hasPartner: z.boolean().default(false),
        partnerWorkRestriction: z.boolean().default(false),
        hasDependents: z.boolean().default(false),
      })
      .default({
        hasPartner: false,
        partnerWorkRestriction: false,
        hasDependents: false,
      }),
    economicConstraints: z
      .object({
        salaryFloor: z.enum(["critical", "important", "flexible"]).optional(),
        canRelocate: z.boolean().default(true),
        willingToRetrain: z.boolean().default(true),
      })
      .default({ canRelocate: true, willingToRetrain: true }),
    salaryRange: z
      .object({
        min: z.number().default(0),
        max: z.number().default(0),
        currency: z.string().default("USD"),
      })
      .default({ min: 0, max: 0, currency: "USD" }),
    workType: z
      .enum(["fulltime", "parttime", "freelance", "open"])
      .default("open"),
    officeMode: z.enum(["remote", "hybrid", "onsite", "open"]).default("open"),
    currentIndustry: z.string().max(50).optional(),
    industrySatisfaction: z.number().int().min(1).max(5).optional(),
    careerChangeUrgency: z
      .enum(["exploring", "considering", "urgent"])
      .optional(),
    interestedIndustries: z.array(z.string()).max(20).default([]),
    openToCareerChange: z.enum(["yes", "no", "open"]).default("open"),
    industryBackground: z.string().max(200).optional(),
    culturalIdentity: z
      .object({
        externalExpectationPressure: z
          .enum(["high", "medium", "low", "none"])
          .default("none"),
        externalExpectationNote: z.string().max(80).optional(),
      })
      .default({
        externalExpectationPressure: "none",
      }),
  })
  .passthrough();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
  kind: z.enum(["message", "correction"]).optional(),
});

// ============================================================
// API route schemas
// ============================================================

// Bug-log #006: previously this schema only capped each block at "max N keys"
// and let the scorer compute aggregates over partial data. A participant
// could POST 6 SJT records that all share scenarioId=1, send `{"1":1}` as
// `values`, send `{"1":1}` as `ipip`, and the route would still save a
// scored AssessmentResult — silently poisoning the thesis data pool.
//
// The fix below enforces the published instrument size + canonical item-id
// shape at the API boundary. Anything that does not match the
// TwIVI-20 / IPIP-60 / 6-unique-SJT contract is rejected before it can
// reach `lib/scoring/` (which is a frozen zone we deliberately do not
// touch — closing the attack vector here is sufficient per codex final
// review, and `lib/scoring/` keeps its existing aggregate behaviour for
// the cases the schema now blocks from ever being constructed).

/** Items 1..N → "1".."N" string-key set used by `z.record` payloads. */
function buildCanonicalKeySet(n: number): Set<string> {
  return new Set(Array.from({ length: n }, (_, i) => String(i + 1)));
}
const TWIVI_KEYS = buildCanonicalKeySet(20);
const IPIP60_KEYS = buildCanonicalKeySet(60);
const PVQ21_KEYS = buildCanonicalKeySet(21);

function isExactKeySet(target: Set<string>) {
  return (rec: Record<string, number>): boolean => {
    const keys = Object.keys(rec);
    if (keys.length !== target.size) return false;
    for (const k of keys) {
      if (!target.has(k)) return false;
    }
    return true;
  };
}

/** POST /api/score (v2.0: SJT + PVQ-21 + IPIP-120 | v3.0: SJT + TwIVI + IPIP-60) */
export const scoreSchema = z
  .object({
    sessionId: z.string().min(1),
    /** Module A: SJT should-would tension (6 scenarios, scenarioIds 1-6 must be unique) */
    sjt: z
      .array(
        z.object({
          scenarioId: z.number().int().min(1).max(6),
          wouldChoice: z.enum(["A", "B", "C", "D"]),
          shouldChoice: z.enum(["A", "B", "C", "D"]),
        }),
      )
      .length(6)
      .refine(
        (arr) => new Set(arr.map((s) => s.scenarioId)).size === 6,
        "sjt: scenarioIds must cover all 6 scenarios uniquely (1-6)",
      ),
    /** Module B: TwIVI 20 items — item_id string ("1".."20") → rating (1-6). Primary field for v3.0. */
    values: z
      .record(z.string(), z.number().int().min(1).max(6))
      .refine(
        isExactKeySet(TWIVI_KEYS),
        "values: TwIVI requires exactly 20 canonical item keys ('1'..'20')",
      )
      .optional(),
    /** @deprecated Use `values` instead. PVQ-21 backward compat — 21 canonical keys, rating (1-6). */
    pvq: z
      .record(z.string(), z.number().int().min(1).max(6))
      .refine(
        isExactKeySet(PVQ21_KEYS),
        "pvq: PVQ-21 requires exactly 21 canonical item keys ('1'..'21')",
      )
      .optional(),
    /** Module C: IPIP-60 — exactly 60 canonical keys ("1".."60"), rating (1-5). */
    ipip: z
      .record(z.string(), z.number().int().min(1).max(5))
      .refine(
        isExactKeySet(IPIP60_KEYS),
        "ipip: IPIP-60 requires exactly 60 canonical item keys ('1'..'60')",
      ),
    /** RIASEC scores inherited from Quick Dive (0-100) */
    riasecNormalized: z
      .record(z.string(), z.number().min(0).max(100))
      .refine(atMostKeys(10), "riasecNormalized: max 10 entries"),
    /** Archetype from Quick Dive (required for v2.0, optional for v3.0 — computed internally) */
    archetype: z
      .object({
        primary: z.string(),
        polarity: z.enum(["explore", "anchor"]),
        code: z.string(),
      })
      .passthrough()
      .optional(),
    /** Session timing metadata */
    metadata: z
      .object({
        totalTimeMs: z.number().default(0),
        moduleTimes: z
          .object({
            sjt: z.number(),
            // v3.0 keys (TwIVI + IPIP-60)
            ddvq: z.number().optional(),
            ipip60: z.number().optional(),
            // v2.0 / backward-compat keys
            ipip30: z.number().optional(),
            pvq: z.number().optional(),
            ipip: z.number().optional(),
          })
          .default({ sjt: 0 }),
        itemResponseTimes: z
          .object({
            sjt: z
              .record(z.string(), z.number())
              .refine(atMostKeys(12), "sjt times: max 12")
              .optional(),
            ddvq: z
              .record(z.string(), z.number())
              .refine(atMostKeys(30), "ddvq times: max 30")
              .optional(),
            ipip60: z
              .record(z.string(), z.number())
              .refine(atMostKeys(70), "ipip60 times: max 70")
              .optional(),
            ipip30: z
              .record(z.string(), z.number())
              .refine(atMostKeys(40), "ipip30 times: max 40")
              .optional(),
            pvq: z
              .record(z.string(), z.number())
              .refine(atMostKeys(30), "pvq times: max 30")
              .optional(),
            ipip: z
              .record(z.string(), z.number())
              .refine(atMostKeys(130), "ipip times: max 130")
              .optional(),
          })
          .optional(),
      })
      .optional()
      .default({ totalTimeMs: 0, moduleTimes: { sjt: 0 } }),
    locale: z.enum(locales).optional().default("en"),
  })
  .passthrough()
  // Bug-log #006: at least one of `values` (v3.0 TwIVI) or `pvq` (v2.0
  // back-compat) MUST be present. Allowing both `.optional()` means a
  // payload with only SJT + IPIP would silently store an AssessmentResult
  // with no values data and the scorer would compute `raw[value] = 0` for
  // every Schwartz value — invalid thesis psychometrics.
  .refine(
    (data) => data.values !== undefined || data.pvq !== undefined,
    "Either `values` (TwIVI-20) or `pvq` (PVQ-21) is required for Module B",
  );

/** Alias for backward compatibility — same as scoreSchema */
export const scoreSchemaCombined = scoreSchema;

/** POST /api/generate-report */
export const generateReportSchema = z.object({
  assessmentId: z.string().min(1),
  sessionId: z.string().optional(),
  locale: z.enum(locales).optional().default("en"),
  /** When true, regenerate even if report exists (for stale report refresh) */
  refresh: z.boolean().optional().default(false),
  /**
   * Selected by the depth-mode dialog on the Profile page:
   *   - "enhanced": layer the latest ResumeMatchResult into the report
   *   - "standard": ignore persisted resume evidence even if it exists
   * Omitted / undefined → "enhanced" (legacy callers preserve their
   * existing behavior of using whatever resume is persisted).
   */
  depthMode: z.enum(["standard", "enhanced"]).optional(),
});

/** POST /api/generate-profile */
export const generateProfileSchema = z.object({
  assessmentId: z.string().min(1),
  userId: z.string().optional(),
  locale: z.enum(locales).optional().default("en"),
});

/** POST /api/session/create */
export const sessionCreateSchema = z.object({
  sessionId: z.string().min(1),
  tier: z.enum(["quick", "deep", "ultra"]).optional(),
  language: z.enum(locales),
});

/** Matches the SessionQuestionAnswer interface from lib/types/platform.
 *  questionId is optional because the v2 store uses questionIndex + itemId instead. */
const sessionQuestionAnswerSchema = z
  .object({
    questionId: z.string().optional(),
    questionIndex: z.number().optional(),
    itemId: z.number().optional(),
    moduleCode: z.string().optional(),
    value: z.unknown(),
    responseTimeMs: z.number(),
    timestamp: z.number(),
    // Reconsider-flow metadata: preserved first-response time + revision count.
    firstResponseTimeMs: z.number().optional(),
    revisionCount: z.number().optional(),
  })
  .passthrough();

/** Per-zone timeline entry for exploration progress persistence */
const zoneTimelineEntrySchema = z.object({
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  timeSpentMs: z.number().default(0),
  discoveries: z.array(z.string()).max(50).default([]),
});

/** POST /api/session/save */
export const sessionSaveSchema = z.object({
  sessionId: z.string().min(1),
  // Bound the payload: an assessment has <100 items, so 500 is generous
  // headroom while stopping an unbounded array (or a few huge values) from
  // being persisted by this anonymous-writable endpoint (#110).
  answers: z
    .array(sessionQuestionAnswerSchema)
    .max(500)
    .refine((a) => JSON.stringify(a).length <= 262_144, {
      message: "answers payload too large",
    }),
  currentModule: z.string().optional(),
  currentPhase: z.number().optional(),
  currentQuestionIndex: z.number().optional(),
  language: z.enum(locales).optional(),
  explorationProgress: z.record(z.string(), zoneTimelineEntrySchema).optional(),
});

/** POST /api/auth/login */
export const loginSchema = z.object({
  email: z.string().min(1).email().max(255),
  password: z.string().min(1).max(128),
});

/** POST /api/auth/register */
export const registerSchema = z.object({
  email: z.string().min(1).email().max(255),
  password: z.string().min(8).max(128),
  name: safeName,
  careerStage: z.string().max(100).optional(),
  anonymousId: z.string().uuid().optional(),
  inviteCode: z.string().max(50).optional(),
  // Locale of the registration UI. Used to gate thesis cohort entry to
  // languages where the consent / DDVQ instruments are professionally
  // translated (currently en + zh only). Optional for back-compat.
  locale: z.enum(locales).optional(),
});

/** POST /api/auth/forgot-password */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1).email().max(255),
  locale: z.string().max(5).optional(),
});

/** POST /api/auth/reset-password */
export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(128),
  password: z.string().min(8).max(128),
});

/** POST /api/reality-conditions */
export const realityConditionsSchema = z
  .object({
    sessionId: z.string().min(1),
    userId: z.string().nullable(),
    conditions: realConditionsSchema,
  })
  .passthrough();

/** POST /api/coaching-summary */
export const coachingSummarySchema = z.object({
  sessionId: z.string().min(1).max(64),
  reportId: z.string().nullish(),
  messages: z.array(chatMessageSchema).min(1).max(100),
  locale: z.enum(locales).optional().default("en"),
  state: z.record(z.string(), z.unknown()).optional(),
});

/** POST /api/report-reaction */
export const reportReactionSchema = z.object({
  reportId: z.string().min(1),
  reaction: z.enum(["surprised", "skeptical", "resonates"]),
});

/** POST /api/pre-post-assessment */
// Canonical SCC-12 item IDs (scc1..scc12) — the thesis pre-registered
// instrument. Any deviation (junk keys, missing keys, typos) must be
// rejected before the row is persisted, because T0 submission is treated
// downstream as a server-verified consent signal.
const SCC_CANONICAL_KEYS = new Set(
  Array.from({ length: 12 }, (_, i) => `scc${i + 1}`),
);
const sccResponsesSchema = z
  .record(z.string(), z.number().int().min(1).max(5))
  .refine((obj) => {
    const keys = Object.keys(obj);
    if (keys.length !== SCC_CANONICAL_KEYS.size) return false;
    return keys.every((k) => SCC_CANONICAL_KEYS.has(k));
  }, "sccResponses: must contain exactly the canonical SCC-12 item IDs (scc1..scc12)");

const experienceFeedbackSchema = z
  .object({
    // Demographics (T0 pre only — 4 select items)
    demo_age: z.string().max(10).optional(),
    demo_gender: z.string().max(30).optional(),
    demo_employment: z.string().max(30).optional(),
    demo_experience: z.string().max(10).optional(),
    // Q1: Trust & Psychological Safety (3 items, 1-5 Likert)
    trust_willing_to_disclose: z.number().int().min(1).max(5).optional(),
    trust_felt_understood: z.number().int().min(1).max(5).optional(),
    trust_comfortable_sharing: z.number().int().min(1).max(5).optional(),
    // Q2: Real-World Constraints Confidence (2 items, 1-5 Likert)
    constraints_adequately_considered: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional(),
    constraints_increased_confidence: z.number().int().min(1).max(5).optional(),
    // Q3: Feature Attribution — ranking
    most_valuable_features: z
      .array(
        z.enum([
          "quick_dive",
          "profile",
          "deep_dive_report",
          "ai_coach",
          "action_hub",
        ]),
      )
      .max(2)
      .optional(),
    feature_ranking: z.array(z.string()).max(2).optional(),
    // Trust-5 additional items (trust_1-3 already above via passthrough)
    trust_ai_competence: z.number().int().min(1).max(5).optional(),
    trust_emotional_safety: z.number().int().min(1).max(5).optional(),
    // Constraints-3 additional item
    constraints_actionable: z.number().int().min(1).max(5).optional(),
    // Attention check (T1 only, expected value = 4). Stored verbatim; data
    // quality filtering happens at analysis time, not at submit.
    attn_check_1: z.number().int().min(1).max(5).optional(),
    // UES-SF-12: User Engagement Scale (12 items, 1-5 Likert; ux4/5/6 reverse-scored)
    ux1: z.number().int().min(1).max(5).optional(),
    ux2: z.number().int().min(1).max(5).optional(),
    ux3: z.number().int().min(1).max(5).optional(),
    ux4: z.number().int().min(1).max(5).optional(),
    ux5: z.number().int().min(1).max(5).optional(),
    ux6: z.number().int().min(1).max(5).optional(),
    ux7: z.number().int().min(1).max(5).optional(),
    ux8: z.number().int().min(1).max(5).optional(),
    ux9: z.number().int().min(1).max(5).optional(),
    ux10: z.number().int().min(1).max(5).optional(),
    ux11: z.number().int().min(1).max(5).optional(),
    ux12: z.number().int().min(1).max(5).optional(),
    // DR-3: Delayed Reflection (T2 only)
    delayed_continued_thinking: z.number().int().min(1).max(5).optional(),
    delayed_took_action: z.number().int().min(1).max(5).optional(),
    delayed_perspective_shift: z.number().int().min(1).max(5).optional(),
    // Legacy / general fields
    clarity: z.number().int().min(1).max(5).optional(),
    usefulness: z.number().int().min(1).max(5).optional(),
    comments: z.string().max(2000).optional(),
  })
  .passthrough();

// CDC-5 — Career Direction Confidence Scale (5 fixed items, 1-5 Likert).
// Bug-log #007: previously this was `z.record(z.string(), z.number())` with
// only a max-10-keys guard, so a participant could submit `{"x":1}` or
// `{"cdc1":1}` (missing items) and the route would still save a meaningless
// total score. The thesis pre-post comparison requires all 5 items to be
// present and bounded to 1-5. Use `.strict()` to reject unknown keys.
const cdcResponsesSchema = z
  .object({
    cdc1: z.number().int().min(1).max(5),
    cdc2: z.number().int().min(1).max(5),
    cdc3: z.number().int().min(1).max(5),
    cdc4: z.number().int().min(1).max(5),
    cdc5: z.number().int().min(1).max(5),
  })
  .strict();

export const prePostAssessmentSchema = z.object({
  assessmentType: z.enum(["pre", "post_immediate", "post_1week"]),
  sccResponses: sccResponsesSchema,
  // Bug-log #007: CDC-5 is collected at all 3 timepoints (T0/T1/T2) per
  // cdc-questions.ts spec. Required schema-side so we cannot silently save
  // a meaningless aggregate. .strict() in cdcResponsesSchema also blocks
  // attacker payloads like `{"x":1}` that previously slipped through the
  // permissive `z.record(z.string(), z.number())` validator.
  cdcResponses: cdcResponsesSchema,
  experienceFeedback: experienceFeedbackSchema.optional(),
  sessionId: z.string().nullable().optional(),
});

/** POST /api/coaching-feedback */
export const coachingFeedbackSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.enum(["okay", "helpful", "very_helpful"]),
  reasons: z
    .array(
      z.enum([
        "understood_me",
        "missed_my_point",
        "unclear",
        "too_many_questions",
        "too_generic",
        "not_practical",
        "avoided_recommendation",
        "helpful_next_step",
        "natural_conversation",
      ]),
    )
    .max(5)
    .optional()
    .default([]),
  highlight: z.string().max(1000).optional(),
  tags: z
    .array(
      z.enum([
        "too_superficial",
        "disjointed",
        "too_fast_advice",
        "missed_emotion",
        "did_not_use_report",
      ]),
    )
    .max(5)
    .optional(),
});

/** POST /api/report-nps */
export const reportNpsSchema = z.object({
  reportId: z.string().min(1),
  score: z.number().int().min(1).max(10),
  pmfResponse: z
    .enum(["very_disappointed", "somewhat_disappointed", "not_disappointed"])
    .optional(),
  feedback: z.string().max(2000).optional(),
  locale: z.string().max(10).optional(),
});

/** POST /api/quickdive/save */
export const quickdiveSaveSchema = z
  .object({
    scores: z
      .record(z.string(), z.number())
      .refine(atMostKeys(10), "scores: max 10 entries"),
    code: z.string().min(1),
    label: z.string().optional().default(""),
    locale: z.enum(locales).optional().default("en"),
    // Legacy: A/B assignment removed. New quickdive sessions default to 'classic'.
    // 'immersive' and 'narrative' may still exist in historical data.
    exploreMode: z
      .enum(["immersive", "narrative", "classic"])
      .optional()
      .default("classic"),
    resultData: z
      .object({
        sortedScores: z.array(z.tuple([z.string(), z.number()])),
        topCareers: z.array(z.object({ name: z.string(), pct: z.number() })),
        fitCareers: z.array(z.object({ name: z.string(), pct: z.number() })),
        drainCareers: z.array(z.object({ name: z.string(), pct: z.number() })),
        confidenceTier: z.enum(["HC", "MC", "LC"]),
        labelData: z
          .object({
            code: z.string(),
            label_zh: z.string(),
            label_en: z.string(),
            tagline_zh: z.string(),
            tagline_en: z.string(),
            colorHex: z.string(),
          })
          .passthrough(),
      })
      .passthrough()
      .optional(),
  })
  .merge(
    z.object({
      anonymousId: z.string().uuid().optional(),
      /** Visual-only gender for archetype avatar matching.
       *  Optional: older clients and "Prefer not to say" skips omit it. */
      avatarGender: z.enum(["male", "female"]).optional(),
      /** @deprecated Legacy request field. Use avatarGender. */
      chibiGender: z.enum(["male", "female"]).optional(),
    }),
  )
  .passthrough();

/** POST /api/quickdive/claim */
export const quickdiveClaimSchema = z.object({
  resultId: z.string().min(1).max(64),
});

/** POST /api/coaching-chat */
export const coachingChatSchema = z
  .object({
    sessionId: z.string().min(1).max(64),
    reportId: z.string().min(1).max(64).nullish(),
    messages: z.array(chatMessageSchema).max(100).optional().default([]),
    answers: z
      .union([z.record(z.string(), z.unknown()), z.array(z.unknown())])
      .nullish(),
    reportSummary: z
      .union([z.string(), z.record(z.string(), z.unknown())])
      .nullish(),
    round: z.number().optional().default(1),
    maxRounds: z.number().optional().default(10),
    locale: z.string().optional().default("en"),
    behaviorInsight: z.string().max(2000).nullish(),
    /** Age confirmation — must be true for coaching access (server-side gate) */
    ageConfirmed: z.boolean().optional(),
    /** Contextual hint about which report panel the user navigated from */
    triggerContext: z.string().max(200).nullish(),
    correctionSignal: z
      .enum(["missed_point", "be_direct", "recommend", "not_practical"])
      .nullish(),
    /** Optional action hub context — injected when user has an active action plan */
    actionHubContext: z
      .object({
        totalItems: z.number(),
        completedItems: z.number(),
        inProgressItems: z.number(),
        topPendingActions: z.array(z.string()).max(3),
      })
      .nullish(),
  })
  .passthrough();

/** POST /api/action-hub/plan — Generate action plan from report */
export const generateActionPlanRequestSchema = z.object({
  reportId: z.string().min(1).max(64),
});

/** POST /api/exercises/non-negotiables — Save non-negotiables selection */
export const saveNonNegotiablesSchema = z.object({
  selected: z.array(z.string().min(1).max(30)).length(3),
});

/** POST /api/exercises/flow-moments — Save 3 flow moment entries */
const flowMomentEntrySchema = z.object({
  description: z.string().min(3).max(120),
  activity: z.enum([
    "creating",
    "analyzing",
    "teaching",
    "organizing",
    "fixing",
    "performing",
    "connecting",
    "exploring",
  ]),
  social: z.enum(["alone", "with_people", "mixed"]),
  environment: z.enum(["quiet", "lively", "outdoor", "online"]),
});
export const saveFlowMomentsSchema = z.object({
  moments: z.array(flowMomentEntrySchema).length(3),
});

/** POST /api/exercises/energy-log — Save a single day's energy entry */
export const saveEnergyEntrySchema = z.object({
  day: z.number().int().min(1).max(7),
  energizer: z.string().min(2).max(80),
  drain: z.string().min(2).max(80),
  overallEnergy: z.number().int().min(1).max(5),
});

/** POST /api/action-hub/items/[id]/feedback — Submit action item feedback */
export const actionFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  note: z.string().max(500).optional(),
  locale: z.enum(locales).default("en"),
});

/** POST /api/admin/bootstrap */
export const adminBootstrapSchema = z.object({
  email: z.string().min(1).email().max(255),
});

/** POST /api/admin/analytics (cleanup action) */
export const adminAnalyticsCleanupSchema = z.object({
  action: z.string().min(1),
  retentionDays: z.number().optional(),
});

/**
 * Funnel event names — imported from the zero-dependency source of truth.
 * No manual sync needed: adding an event to FUNNEL_EVENTS automatically updates Zod validation.
 */
import { FUNNEL_EVENTS } from "@/lib/analytics/funnel-events";

/** POST /api/analytics/event */
export const analyticsEventSchema = z.object({
  event: z.enum(FUNNEL_EVENTS).optional(),
  metadata: z
    .record(z.string(), z.unknown())
    .refine((m) => JSON.stringify(m).length <= 4096, {
      message: "metadata too large",
    })
    .optional(),
  clientId: z.string().max(128).optional(),
  /** Optional deduplication key — server passes to trackFunnelEvent for ON CONFLICT DO NOTHING */
  idempotencyKey: z.string().max(255).optional(),
});

/** POST /api/user-data/delete (account deletion request) */
export const userDataDeleteSchema = z.object({
  password: z.string().max(128).optional().default(""),
});

/** POST /api/memory/generate */
export const memoryGenerateSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
});

/** POST /api/memory — manually add a memory */
export const memoryCreateSchema = z.object({
  category: z.string().min(1),
  keyword: z.string().min(1).max(20),
  insight: z.string().min(1).max(200),
});

/** PATCH /api/memory */
export const memoryUpdateSchema = z.object({
  id: z.string().min(1),
  keyword: z.string().max(20).optional(),
  insight: z.string().max(200).optional(),
});

/** DELETE /api/memory */
export const memoryDeleteSchema = z.object({
  id: z.string().min(1),
});

/** POST /api/report/[id]/regenerate-pathway */
export const regeneratePathwaySchema = z.object({
  sessionId: z.string().min(1),
});

/** POST /api/admin/auto-fill */
export const adminAutoFillSchema = z.object({
  type: z.enum(["quick", "deep", "immersive"]).optional().default("deep"),
  locale: z.enum(locales).optional().default("en"),
  generateReport: z.boolean().optional().default(false),
  usePreset: z.boolean().optional().default(false),
  avatarGender: z.enum(["male", "female"]).optional(),
});

/** PATCH /api/admin/notable */
export const notablePatchSchema = z.object({
  ipHash: z.string().min(1).max(64),
});

/** DELETE /api/admin/users/[userId]/reports */
export const adminDeleteReportSchema = z.object({
  reportId: z.string().min(1).max(64),
  reportType: z.enum(["deep_dive", "quick_dive", "immersive_dive"]),
});

// ============================================================
// Analytics (sendBeacon) schemas — lenient validation
// ============================================================

const scrollbackEventSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    atMs: z.number(),
  })
  .passthrough();

/** POST /api/analytics/report-engagement */
export const reportEngagementSchema = z
  .object({
    id: z.string().max(64),
    reportId: z.string().max(64),
    panelTimes: z
      .record(z.string(), z.number())
      .refine(atMostKeys(20), "panelTimes: max 20 entries")
      .default({}),
    scrollbacks: z.array(scrollbackEventSchema).max(100).default([]),
    maxScrollDepth: z.number().nullable().optional(),
    totalTimeMs: z.number().nullable().optional(),
  })
  .passthrough();

/** POST /api/profile-settings — username + visibility */
export const profileSettingsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/)
    .nullable(),
  isPublic: z.boolean(),
});

/** POST /api/profile-feedback */
export const profileFeedbackSchema = z.object({
  section: z.string().min(1).max(100),
  accurate: z.boolean(),
  /** Optional payload for structured data (e.g. socialLinks array) */
  data: z.unknown().optional(),
});

/** POST /api/analytics/duration */
export const analyticsDurationSchema = z
  .object({
    visitId: z.string().max(64),
    durationMs: z.number(),
  })
  .passthrough();

// ============================================================
// Action Hub
// ============================================================

/** PATCH /api/action-hub/items — Update action item status */
export const actionItemUpdateSchema = z.object({
  itemId: z.string().min(1).max(64),
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  note: z.string().max(2000).optional(),
});

/** POST /api/action-hub/draft — confirm coach-generated action draft */
export const confirmCoachingActionDraftSchema = z.object({
  sessionId: z.string().min(1).max(64),
  reportId: z.string().min(1).max(64).nullish(),
  title: z.string().min(1).max(120),
  actions: z
    .array(
      z.object({
        title: z.string().min(2).max(160),
        description: z.string().max(600).optional().default(""),
        category: z.enum([
          "explore",
          "learn",
          "network",
          "create",
          "apply",
          "reflect",
        ]),
        estimatedMinutes: z.number().int().min(5).max(480).optional(),
      }),
    )
    .min(1)
    .max(3),
});

// ============================================================
// Coach Companion
// ============================================================

/** PATCH /api/coach-messages — mark messages as read */
export const coachMessageMarkReadSchema = z.object({
  messageId: z.string().optional(),
  markAll: z.boolean().optional(),
});

/** POST /api/coach-messages/generate — trigger a proactive coach message */
export const coachMessageGenerateSchema = z.object({
  trigger: z.string(),
});

/** PATCH /api/coach-persona — update coach persona preferences */
export const coachPersonaUpdateSchema = z.object({
  coachingStyle: z.enum(["supportive", "balanced", "challenging"]).optional(),
  communicationStyle: z.enum(["warm", "professional"]).optional(),
  responseDetail: z.enum(["brief", "balanced", "thorough"]).optional(),
});

/** PATCH /api/user/update-name — update user display name */
export const updateNameSchema = z.object({
  name: safeName,
});

// ============================================================
// Archetype Companion (social discovery)
// ============================================================

/** Display name shown to other companion users — XSS-stripped, 1–40 chars (mirrors SQL CHECK). */
const safeCompanionDisplayName = z
  .string()
  .trim()
  .transform((s) => s.replace(/<[^>]*>/g, "").trim())
  .pipe(
    z.string().min(1, "Display name is required").max(40, "Max 40 characters"),
  );

/** Bio — XSS-stripped, ≤200 chars (mirrors SQL CHECK on CompanionProfile.bio). */
const safeCompanionBio = z
  .string()
  .trim()
  .transform((s) => s.replace(/<[^>]*>/g, "").trim())
  .pipe(z.string().max(200, "Max 200 characters"))
  .nullable()
  .optional();

const companionVisibilitySchema = z.enum([
  "discoverable",
  "friends_only",
  "hidden",
]);

/** POST /api/user/social-toggle — flip the per-user opt-in flag */
export const socialToggleSchema = z.object({
  enabled: z.boolean(),
});

/** POST /api/companions/profile — first-time onboarding (creates the row) */
export const companionProfileCreateSchema = z.object({
  displayName: safeCompanionDisplayName,
  bio: safeCompanionBio,
  visibility: companionVisibilitySchema.optional(),
  locale: z.enum(["en", "zh"]),
});

/** PATCH /api/companions/profile — update existing fields (all optional) */
export const companionProfileUpdateSchema = z
  .object({
    displayName: safeCompanionDisplayName.optional(),
    bio: safeCompanionBio,
    visibility: companionVisibilitySchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  });

/** POST /api/companions/connections — friend request */
export const connectionRequestSchema = z.object({
  recipientId: z.string().min(1).max(64),
  message: z
    .string()
    .trim()
    .transform((s) => s.replace(/<[^>]*>/g, "").trim())
    .pipe(z.string().max(200))
    .nullable()
    .optional(),
});

/** PATCH /api/companions/connections/:id — accept or decline */
export const connectionDecisionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

/** POST /api/companions/blocks — block another user */
export const companionBlockSchema = z.object({
  blockedId: z.string().min(1).max(64),
  reason: z.string().trim().max(500).nullable().optional(),
});

/** POST /api/companions/reports — file a Trust&Safety report */
export const companionReportSchema = z.object({
  reportedId: z.string().min(1).max(64),
  reason: z.enum(["harassment", "inappropriate_content", "spam", "other"]),
  details: z
    .string()
    .trim()
    .transform((s) => s.replace(/<[^>]*>/g, "").trim())
    .pipe(z.string().max(1000))
    .nullable()
    .optional(),
});

/** PATCH /api/companions/reports/:id — admin reviews a report */
export const companionReportReviewSchema = z.object({
  status: z.enum(["reviewed", "dismissed"]),
});
