// ============================================================
// Narrative Telemetry — Sentry reporter for identity-narrative failures
//
// Why this exists:
// The narrative generator has 8+ failure paths (soul too short, soul
// missing fields, language guard, legacy incomplete, JSON parse, ...).
// Before this module, each path only emitted a console.warn — invisible
// in production. When a user got stuck (assessment 377de626... in May
// 2026), we had to manually correlate LLMUsageLog rows against the
// generator's branching logic to guess what went wrong.
//
// reportNarrativeFailure unifies all those paths into one Sentry tag
// space so we can:
//   1. Alert on failure spikes (Sentry rule by `tag.mode`)
//   2. Diagnose without DB forensics (missingKeys + fieldLengths in extra)
//   3. Distinguish soul vs legacy vs guard failures by tag
//
// Pairs with: docs/architecture/sentry-llm-alerts.md (alert rules)
// ============================================================

import * as Sentry from "@sentry/nextjs";

/**
 * Discrete failure modes for narrative generation.
 * Used as Sentry tag `mode` so alerts/dashboards can filter by failure type.
 */
export type NarrativeFailureMode =
  | "soul-too-short" // soul call: response < 200 chars
  | "soul-parse-failed" // soul call: JSON extract failed
  | "soul-fields-short" // soul call: ≥1 field trim().length < 20
  | "soul-language-guard" // soul call: language-guard couldn't rescue output
  | "legacy-call-rejected" // legacy: Promise.allSettled rejection on call A or B
  | "legacy-both-failed" // legacy: both calls returned null
  | "legacy-fields-missing" // legacy: produced output but some required key empty
  | "legacy-language-guard" // legacy: language-guard sanitize triggered
  | "generator-returned-null" // generator returned null (all paths exhausted)
  | "pipeline-step-incomplete"; // narratives step: generator returned but post-check failed

interface NarrativeTelemetryArgs {
  mode: NarrativeFailureMode;
  locale: string;
  /** Assessment ID for forensic correlation with DB rows. */
  assessmentId?: string;
  /** Keys that failed length/presence validation. */
  missingKeys?: readonly string[];
  /** Map of fieldName → trim().length, for diagnosing "off by 1" thresholds. */
  fieldLengths?: Record<string, number>;
  /** Free-form detail (e.g. "raw starts with: ..."). Truncate to 200 chars. */
  detail?: string;
}

interface ReportNarrativeFailureArgs extends NarrativeTelemetryArgs {
  /** Override default warning level for hard failures. */
  level?: "warning" | "error";
}

const __DEV__ = process.env.NODE_ENV !== "production";

function formatExtra(args: NarrativeTelemetryArgs): Record<string, unknown> {
  return {
    ...(args.assessmentId ? { assessmentId: args.assessmentId } : {}),
    ...(args.missingKeys?.length ? { missingKeys: [...args.missingKeys] } : {}),
    ...(args.fieldLengths ? { fieldLengths: args.fieldLengths } : {}),
    ...(args.detail ? { detail: args.detail.slice(0, 200) } : {}),
  };
}

function devLog(prefix: string, args: NarrativeTelemetryArgs): void {
  if (!__DEV__) return;
  const missingStr = args.missingKeys?.length
    ? ` missing=[${args.missingKeys.join(",")}]`
    : "";
  const lenStr = args.fieldLengths
    ? ` lens=${JSON.stringify(args.fieldLengths)}`
    : "";
  console.warn(
    `[narrative-telemetry] ${prefix} ${args.mode} locale=${args.locale}${missingStr}${lenStr}${args.detail ? ` detail="${args.detail.slice(0, 120)}"` : ""}`,
  );
}

/**
 * Record an intermediate failure as a Sentry breadcrumb (no captureMessage).
 * Breadcrumbs accumulate in the request scope and only ship to Sentry if a
 * subsequent captureMessage / captureException fires.
 *
 * Use this for failures that are RECOVERED by fallback paths (soul → legacy,
 * call A null but call B succeeded, etc). They're debugging context, not
 * alertable events. If we used captureMessage here, a single user failure
 * would produce 3-5 Sentry events and trigger "24h ≥ 3 failures" alerts on
 * normal fallback behavior — false positives.
 */
export function addNarrativeBreadcrumb(args: NarrativeTelemetryArgs): void {
  devLog("breadcrumb", args);
  try {
    Sentry.addBreadcrumb({
      category: "profile-narrative",
      message: `profile-narrative intermediate: ${args.mode}`,
      level: "info",
      data: {
        mode: args.mode,
        locale: args.locale,
        ...formatExtra(args),
      },
    });
  } catch {
    // Sentry must never crash narrative generation.
  }
}

/**
 * Report a TERMINAL narrative-generation failure to Sentry (prod).
 *
 * Use this ONLY at points that produce `return null` / `throw` from the
 * generator's top-level orchestrator — i.e. moments where the entire
 * generation run has given up. Intermediate failures (soul failed, fall
 * through to legacy) belong in `addNarrativeBreadcrumb`, not here.
 *
 * The Sentry alert rule (docs/architecture/sentry-llm-alerts.md) counts
 * these events at the 24h-window threshold, so we want exactly ONE per
 * user-visible failure.
 *
 * Never throws — observability must not cascade into new failures.
 */
export function reportNarrativeFailure(args: ReportNarrativeFailureArgs): void {
  const { level = "warning", ...telemetry } = args;
  devLog("terminal", telemetry);

  try {
    Sentry.captureMessage(`profile-narrative ${args.mode}`, {
      level,
      tags: {
        feature: "profile-generation",
        task: "profile-narrative",
        mode: args.mode,
        locale: args.locale,
      },
      extra: formatExtra(telemetry),
    });
  } catch {
    // Sentry must never crash narrative generation.
  }
}

/**
 * Build a fieldLengths map for the given object — only includes keys whose
 * value is a string. Numeric length = trim().length so it matches our gates.
 *
 * Returns undefined if `obj` is null/not an object, so callers can pass
 * directly without guards (reportNarrativeFailure ignores undefined).
 */
export function fieldLengthMap(
  obj: unknown,
  keys: readonly string[],
): Record<string, number> | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  const lengths: Record<string, number> = {};
  for (const k of keys) {
    const v = record[k];
    lengths[k] = typeof v === "string" ? v.trim().length : -1; // -1 = not a string
  }
  return lengths;
}
