/**
 * NarrativeSynthesis — Zone B of the Profile page
 *
 * 4-section progressive narrative arc:
 * 1. Identity Thesis — 3-sentence hero block ("this is me!")
 * 2. Three Evidence Cards — pattern / style / values
 * 3. Core Tension Teaser — the hook that drives exploration
 * 4. What's Next — preview + report CTA
 *
 * When narrativeSnapshots is empty (LLM generation pending/failed),
 * shows a skeleton state with a retry button — no fake template content.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2 } from "lucide-react";
import type { PersonalProfileData, RealConditions } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";
import { hasCompleteNarratives } from "@/lib/profile-generation/narrative-renderability";
import { RealConditionsForm } from "@/components/reality-conditions/real-conditions-form";
import {
  ReportDepthDialog,
  type ReportDepthMode,
} from "@/components/report/report-depth-dialog";
import { RevDropCap, RevHandRule, RevFleuron } from "./editorial";

interface NarrativeSynthesisProps {
  profile: PersonalProfileData;
  locale: string;
  /** If set, report already exists — show "View Report" link instead of "Generate" CTA */
  reportId?: string | null;
  /** Whether user has filled in reality conditions (for prerequisite gate) */
  hasConditions?: boolean;
  /** Full conditions object for edit pre-population */
  conditions?: RealConditions | null;
  /** Whether the existing report is stale (inputs changed since generation) */
  reportStale?: boolean;
  /** Session ID for inline reality conditions form */
  sessionId?: string | null;
  /** Ref populated with generateReport() so parent can trigger generation */
  generateReportRef?: React.MutableRefObject<(() => void) | null>;
  /** When true, omit the in-chapter "What's Next + Report CTA" finale — caller
   *  is rendering <NarrativeReportFinale> at the page end instead. */
  hideReportFinale?: boolean;
  /**
   * When true, an administrator is viewing another user's profile. All
   * write-action CTAs (generate report, regenerate narratives, profile
   * feedback) are suppressed — admin view is strictly read-only and any
   * write would target the OTHER user, not the admin.
   */
  viewingAsAdmin?: boolean;
}

const NARRATIVE_POLL_INTERVAL_MS = 3_000;
const NARRATIVE_POLL_MAX_ATTEMPTS = 25;
// Short foreground readiness probe — most generations take 60–120s, so polling
// ≤1s here just checks if a server-side cache race happened. Beyond that, we
// hand off to PendingReportClient (which has a proper waiting shell + its own
// polling). Previous values (8 × 1.2s) left the user staring at a spinning CTA
// for up to 10s after generation actually finished.
const REPORT_READY_POLL_INTERVAL_MS = 500;
const REPORT_READY_MAX_ATTEMPTS = 2;

export function NarrativeSynthesis({
  profile,
  locale,
  reportId,
  hasConditions,
  conditions,
  reportStale,
  sessionId,
  generateReportRef,
  hideReportFinale = false,
  viewingAsAdmin = false,
}: NarrativeSynthesisProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const ns = profile.narrativeSnapshots;

  // LLM-generated narratives (come from profile generation)
  const hasLLMNarratives = hasCompleteNarratives(ns);

  // If no LLM narratives, show skeleton with retry — no fake templates
  if (!hasLLMNarratives) {
    return (
      <NarrativePending
        profile={profile}
        locale={locale}
        viewingAsAdmin={viewingAsAdmin}
      />
    );
  }

  const identityText = ns?.identitySummary || ns?.coreInsight;
  const hasEvidence =
    ns?.archetypeNarrative || ns?.bigFiveNarrative || ns?.valueNarrative;
  const hasTension = ns?.sjtTensionNarrative || ns?.crossDimensionNarrative;

  return (
    <div className="space-y-4">
      {/* ── SECTION 1: Identity Thesis — the opening paragraph ── */}
      {identityText && (
        <IdentityThesis
          text={identityText}
          locale={locale}
          viewingAsAdmin={viewingAsAdmin}
        />
      )}

      {/* ── SECTION 2: Three Evidence Movements — the only place the full
          archetype / style / values prose appears. The cover carries the
          numeric confidence reading; the body carries the narrative. ── */}
      {hasEvidence && (
        <div>
          <EditorialSectionLabel label={t.evidenceSectionTitle} />

          <div className="mt-12 space-y-14">
            {ns?.archetypeNarrative && (
              <EvidenceMovement
                label={t.evidencePatternLabel}
                content={ns.archetypeNarrative}
              />
            )}
            {ns?.bigFiveNarrative && (
              <EvidenceMovement
                label={t.evidenceStyleLabel}
                content={ns.bigFiveNarrative}
              />
            )}
            {ns?.valueNarrative && (
              <EvidenceMovement
                label={t.evidenceValuesLabel}
                content={ns.valueNarrative}
              />
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Core Tension Teaser — the hook into Chapter 05 ── */}
      {hasTension && (
        <>
          <RevFleuron glyph="lozenge" />
          <div className="mx-auto max-w-[60ch] pt-2">
            <EditorialSectionLabel
              label={t.tensionTeaserLabel}
              subtitle={t.tensionTeaserSubtitle}
              align="left"
              tone="attention"
            />

            {/* Standfirst — set as serif body (not a giant display quote) so
                it reads cleanly whatever the paragraph length. A left
                attention rule ties it to the hook tone. */}
            {ns?.sjtTensionNarrative && (
              <p
                className="font-serif text-rev-ink leading-[1.8] mt-8 pl-5 border-l-2 border-rev-signal-attention/70"
                style={{ fontSize: "var(--rev-body)" }}
              >
                {ns.sjtTensionNarrative}
              </p>
            )}

            {/* Cross-dimension synthesis — the climax */}
            {ns?.crossDimensionNarrative && (
              <p
                className="font-serif italic text-rev-ink-soft leading-[1.75] mt-6 pt-6 border-t border-rev-rule"
                style={{ fontSize: "var(--rev-body)" }}
              >
                {ns.crossDimensionNarrative}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── SECTION 4: What's Next + Report CTA ── */}
      {/* Rendered at the profile page finale instead — see <NarrativeReportFinale>.
          When <hideReportFinale> is false we still render it inline for callers
          that haven't been migrated to the finale-section pattern. */}
      {!hideReportFinale && !viewingAsAdmin && (
        <div id="profile-report-cta" className="space-y-6 scroll-mt-24">
          <WhatsNextPreview locale={locale} />
          <ReportCTA
            profile={profile}
            locale={locale}
            reportId={reportId}
            hasConditions={hasConditions}
            conditions={conditions}
            reportStale={reportStale}
            sessionId={sessionId}
            generateReportRef={generateReportRef}
          />
        </div>
      )}
    </div>
  );
}

// ── Finale section — page-end Hero CTA ────────────────────────
//
// Exposed as its own component so <ProfileDashboard> can render it at the
// very bottom of the monograph (after all chapters, before the colophon)
// instead of mid-page in ch-portrait. This matches the product intent of
// letting the user absorb the entire profile before committing to the
// deeper LLM-generated report.

export function NarrativeReportFinale({
  profile,
  locale,
  reportId,
  hasConditions,
  conditions,
  reportStale,
  sessionId,
  generateReportRef,
  viewingAsAdmin = false,
}: Omit<NarrativeSynthesisProps, "hideReportFinale">) {
  // Admin-as-viewer: hide the whole finale CTA section entirely. The admin's
  // job is to inspect the OTHER user's profile, not trigger paid LLM generation
  // against the target user's account.
  if (viewingAsAdmin) {
    return null;
  }
  return (
    <div id="profile-report-cta" className="space-y-6 scroll-mt-24">
      <WhatsNextPreview locale={locale} />
      <ReportCTA
        profile={profile}
        locale={locale}
        reportId={reportId}
        hasConditions={hasConditions}
        conditions={conditions}
        reportStale={reportStale}
        sessionId={sessionId}
        generateReportRef={generateReportRef}
      />
    </div>
  );
}

// ── Editorial section label — small-caps kicker + hand rule ──────────
//
// Replaces the old numbered-circle SectionHeader with the monograph's
// editorial voice: a tracked small-caps label over a hand-drawn rule. The
// "attention" tone tints the rule amber for the tension teaser.

function EditorialSectionLabel({
  label,
  subtitle,
  align = "center",
  tone = "cold",
}: {
  label: string;
  subtitle?: string;
  align?: "center" | "left";
  tone?: "cold" | "attention";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : "text-left"}>
      <p className="font-sans uppercase tracking-[0.18em] text-[11px] font-medium text-rev-ink-soft">
        {label}
      </p>
      <div className={`mt-4 flex ${centered ? "justify-center" : ""}`}>
        <RevHandRule
          tone={tone === "attention" ? "attention" : "cold"}
          width={40}
        />
      </div>
      {subtitle && (
        <p
          className={`font-serif italic text-rev-ink-soft mt-4 leading-[1.5] ${
            centered ? "max-w-[52ch] mx-auto" : ""
          }`}
          style={{ fontSize: "var(--rev-lead)" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Identity Thesis — the opening paragraph of the monograph ─────────
//
// No card, no decorative quote glyph: this is the first line of the book's
// body. A drop-cap leads the reader in; an unobtrusive micro-feedback row
// sits beneath. (Admin view is strictly read-only — no feedback writes.)

function IdentityThesis({
  text,
  locale,
  viewingAsAdmin = false,
}: {
  text: string;
  locale: string;
  viewingAsAdmin?: boolean;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale === "zh" ? "zh" : "en";
  const [feedbackState, setFeedbackState] = useState<"idle" | "submitted">(
    "idle",
  );

  const handleFeedback = async (accurate: boolean) => {
    // Admin view is strictly read-only — don't let admins submit feedback
    // attributed to the OTHER user's profile.
    if (viewingAsAdmin) return;
    setFeedbackState("submitted");
    try {
      await csrfFetch("/api/profile-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "coreInsight", accurate }),
      });
    } catch {
      // Feedback is non-critical
    }
  };

  return (
    <div className="mx-auto max-w-[60ch]">
      <p className="font-sans uppercase tracking-[0.18em] text-[11px] font-medium text-rev-ink-soft mb-5">
        {t.identityThesisLabel}
      </p>
      <RevDropCap locale={loc} className="text-rev-ink">
        {text}
      </RevDropCap>

      {/* Micro-feedback — hidden in admin view (would attribute to the
          target user, not the admin). */}
      <div className="mt-7">
        {viewingAsAdmin ? null : feedbackState === "idle" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              className="px-3.5 py-2 sm:py-1.5 rounded-full text-xs font-medium min-h-[44px] sm:min-h-0
                bg-rev-paper border border-rev-glow-cold/40 text-rev-signal-info hover:bg-rev-glow-cold/10 transition-colors"
            >
              {t.feedbackAccurate}
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              className="px-3.5 py-2 sm:py-1.5 rounded-full text-xs font-medium min-h-[44px] sm:min-h-0
                bg-rev-paper border border-rev-rule text-rev-ink-soft hover:bg-rev-paper-warm transition-colors"
            >
              {t.feedbackUnsure}
            </button>
          </div>
        ) : (
          <p className="text-xs text-rev-ink-soft/80 italic">
            {t.feedbackThanks}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Evidence Movement — one editorial narrative passage ──────────────
//
// The full archetype / style / values prose, set as an article column:
// a tracked small-caps kicker, a hand rule, then Source Serif body at the
// monograph's reading measure. No coloured accent bars — hairline + breath
// carry the structure, honouring the two-accent rule of the design system.

function EvidenceMovement({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <article className="mx-auto max-w-[60ch]">
      <p className="font-sans uppercase tracking-[0.16em] text-[11px] font-medium text-rev-ink-soft mb-3">
        {label}
      </p>
      <RevHandRule tone="rule" width={48} className="mb-6" />
      <p
        className="font-serif text-rev-ink leading-[1.8]"
        style={{ fontSize: "var(--rev-body)" }}
      >
        {content}
      </p>
    </article>
  );
}

// ── What's Next preview (trailer for deeper exploration) ─────

function WhatsNextPreview({ locale }: { locale: string }) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  return (
    <div className="text-center space-y-3 pt-4">
      <p className="text-sm font-semibold text-rev-ink">{t.whatsNextTitle}</p>
      <p className="text-xs text-rev-ink-soft max-w-sm mx-auto leading-relaxed">
        {t.whatsNextDesc}
      </p>
    </div>
  );
}

// ── Report Generation Progress ──────────────────────────────

/** Maps SSE stage names to step indices for the progress UI */
const STAGE_TO_STEP: Record<string, number> = {
  preparing: 0,
  algorithms: 0,
  career_match: 1,
  integration: 2,
  complete: 3,
};

/** Fallback timer-based steps (used when SSE stage is not available) */
const REPORT_STEPS = [
  { key: "algo", delayMs: 0, durationMs: 8_000 },
  { key: "career", delayMs: 8_000, durationMs: 50_000 },
  { key: "letter", delayMs: 58_000, durationMs: 40_000 },
] as const;

function ReportGenerationProgress({
  locale,
  isRetrying,
  pipelineStage,
}: {
  locale: string;
  isRetrying?: boolean;
  pipelineStage?: string | null;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const steps = [
    t.reportProgressStepAnalyze,
    t.reportProgressStepMatch,
    t.reportProgressStepLetter,
  ];
  const estimate = t.reportProgressEstimate;

  // Timer-based fallback for when SSE stages are not available
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (pipelineStage) return; // Real stages available — skip timer
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - t0), 500);
    return () => clearInterval(id);
  }, [pipelineStage]);

  // Use real pipeline stage when available, fall back to timer-based
  const currentStep = pipelineStage
    ? (STAGE_TO_STEP[pipelineStage] ?? 0)
    : REPORT_STEPS.reduce((acc, s, i) => (elapsed >= s.delayMs ? i : acc), 0);

  return (
    <div className="mx-auto max-w-sm space-y-6 py-4">
      {/* Data safety confirmation — always shown first */}
      <div className="flex items-center justify-center gap-2 text-xs text-rev-signal-positive">
        <Check className="w-3.5 h-3.5" />
        <span>{t.reportProgressDataSafe}</span>
      </div>

      <p className="text-center text-xs text-rev-ink-soft">{estimate}</p>

      {/* Retry indicator */}
      {isRetrying && (
        <p className="text-center text-xs text-rev-signal-attention animate-pulse">
          {t.reportProgressRetrying}
        </p>
      )}

      <div className="space-y-3">
        {steps.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {done ? (
                  <Check className="w-4 h-4 text-rev-signal-positive" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 text-rev-signal-info animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-rev-ink-soft/30" />
                )}
              </div>
              <span
                className={`text-sm ${
                  done
                    ? "text-rev-ink-soft line-through"
                    : active
                      ? "text-rev-ink font-medium"
                      : "text-rev-ink-soft/60"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Report CTA (generate or view career report) ─────────────

function ReportCTA({
  profile,
  locale,
  reportId,
  hasConditions,
  conditions,
  reportStale,
  sessionId,
  generateReportRef,
}: {
  profile: PersonalProfileData;
  locale: string;
  reportId?: string | null;
  hasConditions?: boolean;
  conditions?: RealConditions | null;
  reportStale?: boolean;
  sessionId?: string | null;
  generateReportRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const [generating, setGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [showConditionsForm, setShowConditionsForm] = useState(false);
  const [conditionsFilled, setConditionsFilled] = useState(!!hasConditions);
  const [depthDialogOpen, setDepthDialogOpen] = useState(false);
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  const buildPendingUrl = (pendingReportId?: string | null) => {
    const params = new URLSearchParams({
      assessmentId: profile.assessmentId,
    });
    if (pendingReportId) params.set("reportId", pendingReportId);
    return `/${locale}/report/pending?${params.toString()}`;
  };

  const waitForReportReadiness = async (pendingReportId: string) => {
    for (let attempt = 0; attempt < REPORT_READY_MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`/api/report/${pendingReportId}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) return true;
        if (res.status === 401 || res.status === 403) {
          throw Object.assign(new Error("Unauthorized"), { retryable: false });
        }
      } catch (error) {
        if ((error as { retryable?: boolean })?.retryable === false) {
          throw error;
        }
      }

      if (attempt < REPORT_READY_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, REPORT_READY_POLL_INTERVAL_MS),
        );
      }
    }

    return false;
  };

  /**
   * Stream-based report generation via SSE endpoint.
   * Falls back to the non-streaming endpoint if SSE fails to connect.
   */
  const callGenerateStreamApi = async (
    mode: ReportDepthMode,
  ): Promise<{
    reportId: string;
    retryable: boolean;
  }> => {
    const body = JSON.stringify({
      assessmentId: profile.assessmentId,
      locale,
      refresh: !!reportStale,
      depthMode: mode,
    });

    let res: Response;
    try {
      res = await csrfFetch("/api/generate-report/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch {
      throw Object.assign(new Error("Network error"), { retryable: true });
    }

    // Non-SSE response (existing report found — returns JSON directly)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: { message: "Request failed" } }));
        const msg = data.error?.message || `Failed (${res.status})`;
        throw Object.assign(new Error(msg), { retryable: res.status >= 500 });
      }
      const { reportId: newReportId } = await res.json();
      return { reportId: newReportId, retryable: false };
    }

    // SSE stream — read events
    if (!res.body) {
      throw Object.assign(new Error("No response body"), { retryable: true });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reportId: string | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.stage === "error") {
              throw Object.assign(new Error(data.message || "Pipeline error"), {
                retryable: true,
              });
            }
            if (data.stage === "complete" && data.reportId) {
              reportId = data.reportId;
            }
            // Update progress stage in real-time
            if (data.stage) {
              setPipelineStage(data.stage);
            }
          } catch (parseErr) {
            if ((parseErr as { retryable?: boolean })?.retryable)
              throw parseErr;
            // Malformed SSE line — skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!reportId) {
      throw Object.assign(new Error("Stream ended without report ID"), {
        retryable: true,
      });
    }
    return { reportId, retryable: false };
  };

  /** Fallback: non-streaming endpoint (used when SSE fails) */
  const callGenerateApi = async (
    mode: ReportDepthMode,
  ): Promise<{
    reportId: string;
    retryable: boolean;
  }> => {
    let res: Response;
    try {
      res = await csrfFetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: profile.assessmentId,
          locale,
          refresh: !!reportStale,
          depthMode: mode,
        }),
      });
    } catch {
      throw Object.assign(new Error("Network error"), { retryable: true });
    }
    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ error: { message: "Request failed" } }));
      const msg = data.error?.message || `Failed (${res.status})`;
      const retryable = res.status >= 500;
      throw Object.assign(new Error(msg), { retryable });
    }
    const { reportId: newReportId } = await res.json();
    if (
      typeof newReportId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(newReportId)
    ) {
      throw Object.assign(new Error("Invalid report ID"), { retryable: false });
    }
    return { reportId: newReportId, retryable: false };
  };

  // Internal — drives the actual SSE + retry pipeline after depth mode
  // has been decided. Callers should go through `generateReport()` which
  // opens the depth-mode dialog first. The mode is forwarded into the
  // request body so the backend can honor "Standard" even when a stale
  // resume still exists in ResumeMatchResult.
  const runGenerateReport = async (mode: ReportDepthMode) => {
    setGenerating(true);
    setGenError(null);
    setIsRetrying(false);
    setPipelineStage(null);

    // Mark pipeline intent first. Ensures a cron-advanced safety net — even
    // if the foreground streaming call below fails, reportStatus stays
    // 'pending' and the worker will retry on the user's behalf.
    // Fire-and-forget: pipeline failure must never block foreground generation.
    csrfFetch(
      `/api/assessment/${encodeURIComponent(profile.assessmentId)}/request-report?locale=${encodeURIComponent(locale)}&depthMode=${encodeURIComponent(mode)}`,
      { method: "POST" },
    ).catch(() => {
      // Non-fatal — the streaming call below is the primary path.
    });

    try {
      // Try SSE stream first for real-time progress, fall back to non-streaming
      const { reportId: newReportId } = await callGenerateStreamApi(mode);
      const isReady = await waitForReportReadiness(newReportId);
      if (isReady) {
        window.location.href = `/${locale}/report/${newReportId}`;
        return;
      }
      window.location.href = buildPendingUrl(newReportId);
    } catch (err) {
      const retryable = (err as { retryable?: boolean })?.retryable !== false;
      if (!retryable) {
        // Deterministic failure (403, 404, 422) — don't retry.
        // Reset `generating` so the error UI's "Try again" button can re-fire
        // generateReport (it has `if (generating) return` guard at line 740).
        // Pre-2026-05-12 we forgot this — codex audit caught the stuck state.
        setGenError(err instanceof Error ? err.message : "Unknown error");
        setGenerating(false);
        return;
      }
      // Transient failure — retry once with non-streaming fallback
      setIsRetrying(true);
      setPipelineStage(null);
      try {
        const { reportId: newReportId } = await callGenerateApi(mode);
        const isReady = await waitForReportReadiness(newReportId);
        if (isReady) {
          window.location.href = `/${locale}/report/${newReportId}`;
          return;
        }
        window.location.href = buildPendingUrl(newReportId);
      } catch (retryErr) {
        const finalRetryable =
          (retryErr as { retryable?: boolean })?.retryable !== false;
        if (finalRetryable) {
          window.location.href = buildPendingUrl();
          return;
        }
        // Same fix as the non-retryable branch above — clear `generating`
        // so the "Try again" button isn't locked behind the guard.
        setGenError(
          retryErr instanceof Error ? retryErr.message : "Unknown error",
        );
        setIsRetrying(false);
        setGenerating(false);
      }
    }
  };

  // Public entry point — all "generate report" triggers go through here so
  // the user can choose Standard vs Enhanced (resume-layered) mode before
  // any LLM work starts. The dialog's onGenerate callback then invokes
  // runGenerateReport once the mode has been decided.
  const generateReport = () => {
    if (generating) return; // Guard against double-click while in flight
    setDepthDialogOpen(true);
  };

  // Expose generateReport to parent (banner CTA) via ref
  useEffect(() => {
    if (generateReportRef) generateReportRef.current = generateReport;
    return () => {
      if (generateReportRef) generateReportRef.current = null;
    };
  });

  // After conditions form success → brief pause to show ✓, then generate
  const handleConditionsSuccess = () => {
    setShowConditionsForm(false);
    setConditionsFilled(true);
    setTimeout(() => generateReport(), 600);
  };

  // Keep hooks unconditional; only branch the rendered UI after setup work.
  if (generating) {
    return (
      <div className="text-center pt-2 space-y-4">
        <ReportGenerationProgress
          locale={locale}
          isRetrying={isRetrying}
          pipelineStage={pipelineStage}
        />
        {genError && (
          <div className="mx-auto max-w-sm space-y-3">
            <div className="rounded-[4px] border border-rev-rule border-l-2 border-l-rev-signal-attention bg-rev-paper-warm p-4 space-y-2">
              <p className="text-xs text-rev-signal-attention leading-relaxed">
                {t.reportGenFailedFinal}
              </p>
            </div>
            <button
              onClick={() => {
                setGenError(null);
                generateReport();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors"
            >
              {t.reportGenRetryButton}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (reportId && !reportStale) {
    return (
      <div className="text-center pt-2">
        <Link
          href={`/${locale}/report/${reportId}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium
            bg-rev-paper border border-rev-glow-cold/40 text-rev-signal-info hover:bg-rev-glow-cold/10 transition-colors"
        >
          {t.viewReport}
        </Link>
      </div>
    );
  }

  if (reportId && reportStale) {
    return (
      <div className="text-center pt-2 space-y-3">
        <div className="mx-auto max-w-sm rounded-[4px] border border-rev-rule border-l-2 border-l-rev-signal-attention bg-rev-paper-warm p-4 space-y-3">
          <p className="text-xs text-rev-signal-attention leading-relaxed">
            {t.reportStaleNotice}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={generating}
              onClick={generateReport}
              className="px-4 py-2 rounded-full text-xs font-medium
                bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles
                className={`inline w-3 h-3 mr-1 ${generating ? "animate-pulse" : ""}`}
              />
              {generating ? t.templateGenerating : t.reportStaleRefresh}
            </button>
            <Link
              href={`/${locale}/report/${reportId}`}
              className="px-4 py-2 rounded-full text-xs font-medium
                text-rev-ink-soft hover:text-rev-ink transition-colors"
            >
              {t.viewReport}
            </Link>
          </div>
        </div>
        {genError && <p className="text-[11px] text-destructive">{genError}</p>}
      </div>
    );
  }

  // No report yet — two-step flow: Ground Discovery → Generate Report
  const showTwoStep = !!sessionId;

  if (!showTwoStep) {
    // Edge case: no sessionId — direct generate only
    return (
      <div className="text-center pt-2 space-y-4">
        <button
          disabled={generating}
          onClick={generateReport}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium
            bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles
            className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`}
          />
          {generating ? t.templateGenerating : t.reportCtaGenerateDirect}
        </button>
        {genError && <p className="text-[11px] text-destructive">{genError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Two-step card */}
      <div className="rounded-[4px] border border-rev-rule bg-rev-paper-warm p-5 sm:p-6 space-y-5">
        {/* Step 1: Ground Your Discovery */}
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
              conditionsFilled
                ? "bg-rev-paper border border-rev-signal-positive/40 text-rev-signal-positive"
                : "bg-rev-paper border border-rev-glow-cold/40 text-rev-signal-info"
            }`}
          >
            {conditionsFilled ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="text-xs font-semibold">1</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rev-ink">
              {t.groundStepTitle}
            </p>
            <p className="text-xs text-rev-ink-soft mt-1 leading-relaxed">
              {conditionsFilled ? t.groundStepDone : t.groundStepDesc}
            </p>
            {!conditionsFilled ? (
              <button
                onClick={() => {
                  analytics
                    .track("profile_cta_clicked", {
                      dimension: "ground_discovery",
                      destination: "real_conditions_form",
                    })
                    .catch(() => {});
                  setShowConditionsForm(true);
                }}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
                  bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors"
              >
                {t.groundStepButton}
              </button>
            ) : (
              <button
                onClick={() => setShowConditionsForm(true)}
                className="mt-1.5 text-[11px] text-rev-ink-soft/80 hover:text-rev-ink-soft
                  transition-colors underline underline-offset-2 decoration-muted-foreground/30"
              >
                {t.groundStepEdit}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-rev-rule/60" />

        {/* Step 2: Generate Career Report */}
        <div
          className={`flex items-start gap-3 transition-opacity ${
            !conditionsFilled ? "opacity-50" : ""
          }`}
        >
          <div
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
              conditionsFilled
                ? "bg-rev-paper border border-rev-glow-cold/40 text-rev-signal-info"
                : "bg-rev-paper border border-rev-rule text-rev-ink-soft"
            }`}
          >
            <span className="text-xs font-semibold">2</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rev-ink">
              {t.generateStepTitle}
            </p>
            <p className="text-xs text-rev-ink-soft mt-1 leading-relaxed">
              {t.generateStepDesc}
            </p>
            {conditionsFilled ? (
              <button
                disabled={generating}
                onClick={() => {
                  analytics
                    .track("profile_cta_clicked", {
                      dimension: "generate_report_grounded",
                      destination: "report_generation",
                    })
                    .catch(() => {});
                  generateReport();
                }}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
                  bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles
                  className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`}
                />
                {generating ? t.templateGenerating : t.reportCtaGenerateDirect}
              </button>
            ) : (
              <p className="text-[11px] text-rev-ink-soft/70 mt-2">
                {t.generateStepLocked}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Skip — extremely de-emphasized, outside the card */}
      {!conditionsFilled && (
        <div className="text-center space-y-1">
          <button
            disabled={generating}
            onClick={() => {
              analytics
                .track("profile_cta_clicked", {
                  dimension: "skip_ground",
                  destination: "report_generation",
                })
                .catch(() => {});
              generateReport();
            }}
            className="text-[11px] text-rev-ink-soft/70 hover:text-rev-ink-soft
              transition-colors underline underline-offset-2 decoration-muted-foreground/20
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? t.templateGenerating : t.reportCtaSkip}
          </button>
          <p className="text-[10px] text-rev-ink-soft/60 max-w-xs mx-auto leading-relaxed">
            {t.reportCtaSkipConsequence}
          </p>
        </div>
      )}

      {/* Inline conditions form (sheet mode) */}
      <RealConditionsForm
        open={showConditionsForm}
        onOpenChange={setShowConditionsForm}
        sessionId={sessionId}
        locale={locale as Locale}
        existingConditions={conditions}
        onSuccess={handleConditionsSuccess}
        onSkip={() => {
          setShowConditionsForm(false);
          generateReport();
        }}
      />

      {/* Depth-mode selector — wraps every generateReport call site so users
          can choose Standard vs Enhanced (resume-layered) before any LLM
          work starts. */}
      <ReportDepthDialog
        open={depthDialogOpen}
        locale={locale as "en" | "zh"}
        assessmentId={profile.assessmentId}
        onClose={() => setDepthDialogOpen(false)}
        onGenerate={runGenerateReport}
      />

      {genError && (
        <p className="text-[11px] text-destructive text-center">{genError}</p>
      )}
    </div>
  );
}

// ── Narrative pending state — fallback content + manual generate button ──────
//
// Design principle: never auto-trigger expensive LLM calls on page mount.
// We only poll for completion when a freshly generated profile suggests after()
// is still in flight; otherwise we fall back to manual retry.
// Uses router.refresh() instead of window.location.reload() for seamless RSC update.

function NarrativePending({
  profile,
  locale,
  viewingAsAdmin = false,
}: {
  profile: PersonalProfileData;
  locale: string;
  viewingAsAdmin?: boolean;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";
  const router = useRouter();
  const hasAssessment = !!profile.assessmentId;
  const generationFailed = !!profile.narrativeSnapshots?.failedAt;
  const [status, setStatus] = useState<"idle" | "generating" | "error">(
    hasAssessment && !generationFailed ? "generating" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAssessment || generationFailed || status !== "generating") return;

    let cancelled = false;

    const pollForNarratives = async () => {
      for (let attempt = 0; attempt < NARRATIVE_POLL_MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, NARRATIVE_POLL_INTERVAL_MS),
          );
        }
        if (cancelled) return;

        try {
          const res = await fetch(
            `/api/generate-profile?assessmentId=${profile.assessmentId}`,
            {
              credentials: "include",
              cache: "no-store",
            },
          );
          if (!res.ok) continue;

          const data = (await res.json()) as { narrativeStatus?: string };
          if (
            data.narrativeStatus === "ready" ||
            data.narrativeStatus === "failed"
          ) {
            router.refresh();
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setStatus("idle");
      }
    };

    void pollForNarratives();

    return () => {
      cancelled = true;
    };
  }, [generationFailed, hasAssessment, profile.assessmentId, router, status]);

  const handleGenerate = async () => {
    if (!hasAssessment) return;
    // Admin view is strictly read-only — never trigger narrative regeneration
    // against the OTHER user's account.
    if (viewingAsAdmin) return;
    setStatus("generating");
    setErrorMsg(null);
    try {
      const res = await csrfFetch("/api/regenerate-narratives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: profile.assessmentId, locale }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: { message: "Request failed" } }));
        throw new Error(data.error?.message || `Failed (${res.status})`);
      }
      // Atomic RSC refresh — cache was already invalidated server-side
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  if (!hasAssessment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center py-12"
      >
        <p className="text-sm text-rev-ink-soft/80 mb-4">{t.narrativeEmpty}</p>
        <Link
          href={`/${locale}/deepdive`}
          className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium
            bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors"
        >
          {t.startDeepDive}
        </Link>
      </motion.div>
    );
  }

  // Active generation — show skeleton
  if (status === "generating") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[4px] border border-rev-rule/60 p-6 space-y-3"
            >
              <div className="h-3 w-24 rounded-full bg-rev-paper-warm animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-rev-paper-warm/70 animate-pulse" />
                <div className="h-3 w-5/6 rounded-full bg-rev-paper-warm/70 animate-pulse" />
                <div className="h-3 w-4/6 rounded-full bg-rev-paper-warm/70 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-rev-ink-soft">
          <Sparkles className="w-4 h-4 animate-pulse text-rev-signal-info/85" />
          <p>{t.narrativeGenerating}</p>
        </div>
      </motion.div>
    );
  }

  // Idle / error — show fallback content + generate button
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-10 space-y-6"
    >
      {/* Archetype fallback — meaningful content from algorithmic profile */}
      {profile.archetype && (
        <p
          className="text-base text-rev-ink-soft italic max-w-md mx-auto leading-relaxed"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          &ldquo;
          {loc === "zh"
            ? profile.archetype.tagline_zh
            : profile.archetype.tagline_en}
          &rdquo;
        </p>
      )}

      <p className="text-xs text-rev-ink-soft/70 max-w-sm mx-auto leading-relaxed">
        {generationFailed || status === "error"
          ? t.narrativeFailedDesc
          : t.narrativePendingDesc}
      </p>

      {(generationFailed || status === "error") && !viewingAsAdmin && (
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium
            bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold hover:bg-rev-ink/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {t.narrativeRetry}
        </button>
      )}

      {status === "error" && errorMsg && (
        <p className="text-xs text-destructive/80">{errorMsg}</p>
      )}
    </motion.div>
  );
}
