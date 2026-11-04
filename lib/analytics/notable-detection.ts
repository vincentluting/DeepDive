/**
 * Scoring algorithm for identifying notable real visitors.
 *
 * Input: PageVisit records for a given ipHash (past 7 days window)
 * Output: score + reasons array
 *
 * Threshold: score >= 8 to be inserted into NotableVisitor table
 */

interface VisitRecord {
  path: string;
  country: string | null;
  referer: string | null;
  userId: string | null;
  durationMs: number | null;
  utmSource: string | null;
  createdAt: string;
}

export interface ScoringResult {
  score: number;
  reasons: string[];
}

const SELF_DOMAINS = [
  "deepdivecareer.com",
  "www.deepdivecareer.com",
  "v0-career-exploration-questionnaire.vercel.app",
];

const DEEP_PATHS = [
  "/deepdive",
  "/questionnaire",
  "/quickdive",
  "/report",
  "/coaching",
  "/explore",
];

function isExternalReferral(referer: string | null): boolean {
  if (!referer) return false;
  try {
    const hostname = new URL(referer).hostname;
    return !SELF_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

/**
 * Score a visitor based on their page visit records.
 *
 * Scoring rules:
 * | Rule                | Score   | Condition                                             |
 * |---------------------|---------|-------------------------------------------------------|
 * | Multi-page          | +2/page | >= 2 unique paths (max +10)                           |
 * | Deep page visit     | +5/type | path contains questionnaire/explore/report/coaching   |
 * | Registered (userId) | +15     | visited /register AND has userId                      |
 * | Register intent     | +5      | visited /register without userId                      |
 * | Long dwell (>60s)   | +5      | any PV durationMs > 60000                             |
 * | Dwell (>10s)        | +3      | any PV durationMs > 10000                             |
 * | Non-NL country      | +3      | country != 'NL' (owner is in NL)                      |
 * | External referral   | +5      | referer is not Self/Direct                            |
 * | UTM source          | +5      | any PV has utmSource                                  |
 *
 * Exclusion (returns score 0):
 * - All PVs within 2 seconds AND count > 5 (bulk automated request)
 */
export function scoreVisitor(visits: VisitRecord[]): ScoringResult {
  if (visits.length === 0) return { score: 0, reasons: [] };

  // Bulk request detection: all PVs within 2 seconds with >5 pages
  if (visits.length > 5) {
    const timestamps = visits.map((v) => new Date(v.createdAt).getTime());
    const span = Math.max(...timestamps) - Math.min(...timestamps);
    if (span < 2000) {
      return { score: 0, reasons: ["bulk_request_excluded"] };
    }
  }

  const reasons: string[] = [];
  let score = 0;

  // Multi-page browsing: +2/page (max 10)
  const uniquePaths = new Set(visits.map((v) => v.path));
  if (uniquePaths.size >= 2) {
    const pageScore = Math.min(10, uniquePaths.size * 2);
    score += pageScore;
    reasons.push(`multi_page:${uniquePaths.size}`);
  }

  // Deep page visits: +5 per distinct deep path type
  const deepPageTypes = new Set<string>();
  for (const path of uniquePaths) {
    for (const deepPath of DEEP_PATHS) {
      if (path.includes(deepPath)) {
        deepPageTypes.add(deepPath);
        break;
      }
    }
  }
  if (deepPageTypes.size > 0) {
    score += deepPageTypes.size * 5;
    reasons.push(`deep_pages:${[...deepPageTypes].join(",")}`);
  }

  // Registration behavior
  const registeredVisit = visits.find(
    (v) => v.path.includes("/register") && v.userId,
  );
  if (registeredVisit) {
    score += 15;
    reasons.push("registered");
  } else {
    const registerIntent = visits.some((v) => v.path.includes("/register"));
    if (registerIntent) {
      score += 5;
      reasons.push("register_intent");
    }
  }

  // Dwell time
  const maxDuration = Math.max(...visits.map((v) => v.durationMs ?? 0));
  if (maxDuration > 60_000) {
    score += 5;
    reasons.push("long_dwell");
  } else if (maxDuration > 10_000) {
    score += 3;
    reasons.push("dwell");
  }

  // Non-NL traffic (owner is in NL, non-local visitors more noteworthy)
  const countries = [
    ...new Set(visits.map((v) => v.country).filter(Boolean)),
  ] as string[];
  if (countries.length > 0 && !countries.every((c) => c === "NL")) {
    score += 3;
    const nonNl = countries.find((c) => c !== "NL") ?? countries[0];
    reasons.push(`non_nl:${nonNl}`);
  }

  // External referral
  const hasExternal = visits.some((v) => isExternalReferral(v.referer));
  if (hasExternal) {
    score += 5;
    reasons.push("external_referral");
  }

  // UTM source
  const hasUtm = visits.some((v) => v.utmSource);
  if (hasUtm) {
    score += 5;
    reasons.push("utm_source");
  }

  return { score, reasons };
}

/**
 * Produce a human-readable summary of the scoring reasons.
 * Used for display in the admin panel.
 */
const REASON_LABELS: Record<string, { en: string; zh: string }> = {
  registered: { en: "Registered", zh: "已注册账号" },
  register_intent: { en: "Visited register page", zh: "访问了注册页" },
  long_dwell: { en: "Stayed >1 min", zh: "停留超过1分钟" },
  dwell: { en: "Dwell time noted", zh: "有明显停留" },
  external_referral: { en: "External referral", zh: "来自外部链接" },
  utm_source: { en: "Has UTM source", zh: "有 UTM 参数" },
};

const REASON_TEMPLATES: Record<string, { en: string; zh: string }> = {
  multi_page: { en: "Viewed {v} pages", zh: "浏览了 {v} 个页面" },
  deep_pages: { en: "Visited {v}", zh: "访问了 {v}" },
  non_nl: { en: "From {v}", zh: "来自 {v}" },
};

export function formatReasons(
  reasons: string[],
  locale: "en" | "zh" = "en",
): string {
  const parts: string[] = [];

  for (const r of reasons) {
    const label = REASON_LABELS[r];
    if (label) {
      parts.push(label[locale]);
      continue;
    }
    const colonIdx = r.indexOf(":");
    if (colonIdx > 0) {
      const key = r.slice(0, colonIdx);
      const val = r.slice(colonIdx + 1);
      const tpl = REASON_TEMPLATES[key];
      if (tpl) {
        const display =
          key === "deep_pages"
            ? val
                .split(",")
                .map((p) => p.replace("/", ""))
                .join("/")
            : val;
        parts.push(tpl[locale].replace("{v}", display));
      }
    }
  }

  return parts.join(" · ");
}

/**
 * Derive color tier from score.
 * Returns 'high' (>=20), 'medium' (>=12), or 'low' (>=8).
 */
export function scoreTier(score: number): "high" | "medium" | "low" {
  if (score >= 20) return "high";
  if (score >= 12) return "medium";
  return "low";
}
