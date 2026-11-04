// ============================================================
// LLM Prompt Input Sanitization
// Prevents prompt injection by sanitizing user-provided fields
// before they are interpolated into LLM prompts.
// ============================================================

import type { RealConditions } from "../types";

const MAX_FIELD_LENGTH = 200;
const MAX_ARRAY_ITEMS = 20;

/**
 * Patterns that commonly indicate prompt injection attempts.
 * These are stripped from user input before prompt interpolation.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+/gi,
  /new\s+instructions?\s*:/gi,
  /system\s*:\s*/gi,
  /\bact\s+as\b/gi,
  /\brole\s*:\s*/gi,
  /```[\s\S]*?```/g, // Code blocks that might contain injection
  /\[INST\]/gi,
  /<\|.*?\|>/g, // Special tokens like <|im_start|>
  /<<\s*SYS\s*>>/gi,
];

/**
 * Sanitize a single string field for safe LLM prompt interpolation.
 * Strips injection patterns, trims length, and removes control characters.
 */
export function sanitizeField(
  value: string,
  maxLength = MAX_FIELD_LENGTH,
): string {
  if (typeof value !== "string") return "";

  let sanitized = value;

  // Remove control characters (except newline and tab)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Strip injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "…";
  }

  return sanitized.trim();
}

/**
 * Sanitize an array of strings (e.g., pastIndustries, targetCities).
 * Each item is individually sanitized and the array is capped.
 */
function sanitizeArray(
  values: string[],
  maxLength = MAX_FIELD_LENGTH,
  maxItems = MAX_ARRAY_ITEMS,
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .slice(0, maxItems)
    .map((v) => sanitizeField(String(v), maxLength));
}

/**
 * Sanitize a numeric value — coerce to number, clamp to range.
 */
function sanitizeNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(value);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Sanitize workLanguages array — handles both {language, proficiency} object format
 * and plain string[] format for backward compatibility.
 */
function sanitizeWorkLanguages(
  values: RealConditions["workLanguages"],
): RealConditions["workLanguages"] {
  if (!Array.isArray(values)) return [];
  return values.slice(0, MAX_ARRAY_ITEMS).map((item) => {
    if (typeof item === "string") {
      return {
        language: sanitizeField(item, 100),
        proficiency: "professional" as const,
      };
    }
    return {
      language: sanitizeField(item.language, 100),
      proficiency: (["native", "fluent", "professional", "basic"].includes(
        item.proficiency,
      )
        ? item.proficiency
        : "professional") as RealConditions["workLanguages"][number]["proficiency"],
    };
  });
}

/**
 * Sanitize the RealConditions object before prompt interpolation.
 * Returns a new object with all user-provided fields sanitized.
 */
export function sanitizeRealConditions(
  conditions: RealConditions,
): RealConditions {
  return {
    education: {
      level: conditions.education.level,
      field: sanitizeField(conditions.education.field, 100),
    },
    experienceYears: sanitizeNumber(conditions.experienceYears, 0, 60, 0),
    pastIndustries: sanitizeArray(conditions.pastIndustries, 100),
    currentCountry: conditions.currentCountry
      ? sanitizeField(conditions.currentCountry, 10)
      : undefined,
    currentCity: sanitizeField(conditions.currentCity, 100),
    targetCountry: conditions.targetCountry
      ? sanitizeField(conditions.targetCountry, 10)
      : undefined,
    targetCities: sanitizeArray(conditions.targetCities, 100),
    visaStatus: conditions.visaStatus || "",
    visaType: conditions.visaType
      ? sanitizeField(conditions.visaType, 100)
      : undefined,
    workRestrictions: {
      canWorkFullTime: !!conditions.workRestrictions?.canWorkFullTime,
      sponsorshipRequired: !!conditions.workRestrictions?.sponsorshipRequired,
      occupationRestricted: !!conditions.workRestrictions?.occupationRestricted,
      occupationNote: conditions.workRestrictions?.occupationNote
        ? sanitizeField(conditions.workRestrictions.occupationNote, 80)
        : undefined,
    },
    workLanguages: sanitizeWorkLanguages(conditions.workLanguages),
    locationFlexibility: conditions.locationFlexibility || "open",
    relocationTimeline: conditions.relocationTimeline,
    familyConstraints: {
      hasPartner: !!conditions.familyConstraints?.hasPartner,
      partnerWorkRestriction:
        !!conditions.familyConstraints?.partnerWorkRestriction,
      hasDependents: !!conditions.familyConstraints?.hasDependents,
    },
    economicConstraints: {
      salaryFloor: conditions.economicConstraints?.salaryFloor,
      canRelocate: conditions.economicConstraints?.canRelocate ?? true,
      willingToRetrain:
        conditions.economicConstraints?.willingToRetrain ?? true,
    },
    salaryRange: {
      min: sanitizeNumber(conditions.salaryRange.min, 0, 10_000_000, 0),
      max: sanitizeNumber(conditions.salaryRange.max, 0, 10_000_000, 0),
      currency: sanitizeField(conditions.salaryRange.currency, 10),
    },
    workType: conditions.workType,
    officeMode: conditions.officeMode,
    interestedIndustries: sanitizeArray(conditions.interestedIndustries, 100),
    openToCareerChange: conditions.openToCareerChange,
    industryBackground: conditions.industryBackground
      ? sanitizeField(conditions.industryBackground, 200)
      : undefined,
    culturalIdentity: {
      externalExpectationPressure:
        conditions.culturalIdentity?.externalExpectationPressure || "none",
      externalExpectationNote: conditions.culturalIdentity
        ?.externalExpectationNote
        ? sanitizeField(conditions.culturalIdentity.externalExpectationNote, 80)
        : undefined,
    },
    // Industry exploration fields — previously dropped (silent bug). Without
    // these, the report-generation helper's `safe.currentIndustry` /
    // `safe.careerChangeUrgency` would always be undefined even when the
    // user filled them in, defeating the "render 23 fields" guarantee.
    currentIndustry: conditions.currentIndustry
      ? sanitizeField(conditions.currentIndustry, 100)
      : undefined,
    industrySatisfaction:
      typeof conditions.industrySatisfaction === "number"
        ? sanitizeNumber(conditions.industrySatisfaction, 1, 5, 3)
        : undefined,
    careerChangeUrgency: conditions.careerChangeUrgency,
  };
}
