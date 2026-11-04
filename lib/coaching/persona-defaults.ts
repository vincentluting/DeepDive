// ============================================================
// Coach Persona Auto-Configuration
//
// Derives coaching style defaults from user assessment data.
// Pure algorithmic — 0 LLM calls.
//
// Inputs: Big Five facets, TKI conflict style, IPC circumplex, locale
// Output: CoachPersona preferences
// ============================================================

export interface CoachPersona {
  /** supportive = warm encouragement, balanced = mix, challenging = tough love */
  coachingStyle: "supportive" | "balanced" | "challenging";
  /** warm = conversational, professional = structured */
  communicationStyle: "warm" | "professional";
  /** brief = concise, balanced = moderate, thorough = detailed */
  responseDetail: "brief" | "balanced" | "thorough";
  /** Whether defaults were auto-set from assessment data */
  autoConfigured: boolean;
  /** ISO timestamp of last configuration */
  configuredAt: string;
}

interface AssessmentSignals {
  /** Big Five facets: top 5 strongest labels */
  topFacets?: string[];
  /** Big Five facets: bottom 5 weakest labels */
  bottomFacets?: string[];
  /** TKI dominant style if available */
  tkiStyle?: string;
  /** IPC circumplex quadrant if available */
  ipcQuadrant?: string;
  /** User locale */
  locale?: string;
}

/**
 * Generate default coach persona from assessment signals.
 * Falls back to balanced defaults if no assessment data available.
 */
export function generatePersonaDefaults(
  signals: AssessmentSignals,
): CoachPersona {
  let coachingStyle: CoachPersona["coachingStyle"] = "balanced";
  let communicationStyle: CoachPersona["communicationStyle"] = "warm";
  let responseDetail: CoachPersona["responseDetail"] = "balanced";
  let hasSignals = false;

  // ── Coaching style: derived from TKI + Big Five Agreeableness ──
  if (signals.tkiStyle) {
    hasSignals = true;
    // Competing/Collaborating types handle challenge well
    if (
      ["competing", "collaborating"].includes(signals.tkiStyle.toLowerCase())
    ) {
      coachingStyle = "challenging";
    }
    // Avoiding/Accommodating types need gentler approach
    else if (
      ["avoiding", "accommodating"].includes(signals.tkiStyle.toLowerCase())
    ) {
      coachingStyle = "supportive";
    }
  }

  // High Neuroticism facets → lean supportive
  if (
    signals.topFacets?.some((f) =>
      /anxiety|depression|vulnerability|self-consciousness/i.test(f),
    )
  ) {
    hasSignals = true;
    if (coachingStyle !== "supportive") coachingStyle = "supportive";
  }

  // Low Agreeableness facets in top → can handle challenge
  if (
    signals.bottomFacets?.some((f) =>
      /cooperation|modesty|sympathy|trust/i.test(f),
    )
  ) {
    hasSignals = true;
    if (coachingStyle === "balanced") coachingStyle = "challenging";
  }

  // ── Communication style: derived from cognitive style ──
  // High Openness/Intellect → can handle abstract, warm conversation
  // High Conscientiousness/Orderliness → prefers structured, professional
  if (
    signals.topFacets?.some((f) =>
      /orderliness|self-discipline|dutifulness|achievement/i.test(f),
    )
  ) {
    hasSignals = true;
    communicationStyle = "professional";
  }

  // Locale alone must not make the coach more formal. In particular, the
  // previous zh/ja/ko override made Chinese conversations sound noticeably
  // stiffer even when the user's assessment did not indicate that preference.

  // ── Response detail: derived from cognitive style ──
  // High Intellect/Openness → enjoys thorough exploration
  if (
    signals.topFacets?.some((f) => /intellect|imagination|artistic/i.test(f))
  ) {
    hasSignals = true;
    responseDetail = "thorough";
  }

  // High Activity Level / Excitement-Seeking → prefers brief, action-oriented
  if (
    signals.topFacets?.some((f) =>
      /activity.level|excitement|assertiveness/i.test(f),
    )
  ) {
    hasSignals = true;
    responseDetail = "brief";
  }

  return {
    coachingStyle,
    communicationStyle,
    responseDetail,
    autoConfigured: hasSignals,
    configuredAt: new Date().toISOString(),
  };
}

/**
 * Merge user overrides with auto-configured defaults.
 * User choices always win over auto-config.
 */
export function mergePersona(
  auto: CoachPersona,
  userOverrides: Partial<
    Pick<
      CoachPersona,
      "coachingStyle" | "communicationStyle" | "responseDetail"
    >
  >,
): CoachPersona {
  return {
    ...auto,
    ...userOverrides,
    autoConfigured: false, // User has manually adjusted
    configuredAt: new Date().toISOString(),
  };
}
