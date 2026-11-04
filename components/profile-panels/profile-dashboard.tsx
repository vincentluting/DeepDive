// ProfileDashboard — Personal Monograph long-scroll layout.
//
// Replaces the old 3-tab navigator with a continuous 3-chapter scroll
// (Portrait / Inner Landscape / Tensions) wrapped in <RevChapter> containers.
// URL hashes are back-compatible: #story → #ch-portrait, etc.
//
// PR-2 of the Personal Monograph redesign. Business panels (NarrativeSynthesis,
// DimensionExplorer, InnerTensions) are untouched and plugged into the new
// editorial frame as-is; their internal rewrite happens in PR-3 through PR-5.
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import type {
  PersonalProfileData,
  RIASECDimension,
  RealConditions,
} from "@/lib/types";
import {
  getDictionaryClient,
  getAdminViewingAsBanner,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { analytics } from "@/lib/analytics/client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { toDateLocaleOrDefault } from "@/lib/i18n/config";
import {
  NarrativeSynthesis,
  NarrativeReportFinale,
} from "./narrative-synthesis";
import { Languages, Sparkles, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  RevChapter,
  RevHandRule,
  RevReadingProgress,
  RevBookSpine,
  RevFleuron,
} from "./editorial";
import { MonographMuseumHero } from "./monograph-museum-hero";
import { ScriptCoda } from "@/components/design/meridian/script-coda";

const DimensionExplorer = dynamic(
  () => import("./dimension-explorer").then((m) => m.DimensionExplorer),
  { ssr: false },
);
const InnerTensions = dynamic(
  () => import("./inner-tensions").then((m) => m.InnerTensions),
  { ssr: false },
);
// Server-rendered (no ssr:false) so the chapter survives any client-side
// hydration interruption. Component is light + uses CSS variables for theming.
import { MeaningCompass } from "./meaning-compass";

import { DataTransparency } from "./data-transparency";

/** Kept for backward compatibility — layer 5 confidence breakdown was removed */
type ConfidenceBreakdownEntry = {
  dimension: string;
  confidence: number;
  reasons: { factor: string; impact: number; detail: string }[];
};

interface ProfileDashboardProps {
  profile: PersonalProfileData;
  locale: string;
  /** Optional RIASEC normalized scores for the radar chart */
  riasecScores?: Record<RIASECDimension, number>;
  /** Optional confidence breakdown entries from evidence chain (PR-C1) */
  confidenceBreakdown?: ConfidenceBreakdownEntry[];
  /** Optional report ID for the "Return to Report" link */
  reportId?: string | null;
  /** Whether user has filled in reality conditions */
  hasConditions?: boolean;
  /** Full conditions object for edit pre-population */
  conditions?: RealConditions | null;
  /** Whether the existing report is stale (inputs changed since generation) */
  reportStale?: boolean;
  /** Whether the profile is stale (QD archetype changed since profile generation) */
  profileStale?: boolean;
  /** Session ID for inline reality conditions form */
  sessionId?: string | null;
  /** Persisted avatar gender used to render the profile avatar. */
  savedAvatarGender?: "male" | "female" | null;
  /**
   * True when an administrator is viewing another user's profile.
   * Hides write-action buttons (refresh / regenerate) and renders an
   * "Admin view" banner on top of the page.
   */
  viewingAsAdmin?: boolean;
  /** Email of the target user — only used when viewingAsAdmin is true. */
  viewingAsAdminEmail?: string | null;
  /** Name of the target user — only used when viewingAsAdmin is true. */
  viewingAsAdminName?: string | null;
}

// ── Chapter definitions ────────────────────────────────────────
// Each chapter maps a canonical hash id → one or more legacy hashes
// (for URL back-compat from the old tab system) → a pair of i18n keys
// that populate the Chapter Opener title + lead.
//
// PR-2 keeps just 3 chapters matching the existing business panels.
// PR-4 will split Ch.02 into Inner Landscape / Value Compass / Social
// Physics as the visualisations are rebuilt.

interface ChapterDef {
  id: string;
  legacyHashes: string[];
  eyebrow: string;
  tone: "paper" | "warm";
  ruleTone: "cold" | "attention";
  titleKey: string;
  leadKey: string;
  numeralHint: string;
}

const CHAPTERS: ChapterDef[] = [
  {
    id: "ch-portrait",
    legacyHashes: ["story"],
    eyebrow: "CHAPTER 01 · PORTRAIT",
    tone: "paper",
    ruleTone: "cold",
    titleKey: "tabMyStory",
    leadKey: "tabStorySubtitle",
    numeralHint: "I",
  },
  {
    id: "ch-inner-landscape",
    legacyHashes: ["dimensions"],
    eyebrow: "CHAPTER 02 · INNER LANDSCAPE",
    tone: "warm",
    ruleTone: "cold",
    titleKey: "tabMyDimensions",
    leadKey: "tabDimensionsSubtitle",
    numeralHint: "II",
  },
  {
    id: "ch-meaning",
    legacyHashes: ["meaning", "compass"],
    eyebrow: "CHAPTER 03 · MEANING COMPASS",
    tone: "paper",
    ruleTone: "cold",
    titleKey: "meaningCompassTitle",
    leadKey: "meaningCompassLead",
    numeralHint: "III",
  },
  {
    id: "ch-tensions",
    legacyHashes: ["tensions"],
    eyebrow: "CHAPTER 05 · TENSIONS & BECOMING",
    tone: "paper",
    ruleTone: "attention",
    titleKey: "tabMyTensions",
    leadKey: "tabTensionsSubtitle",
    numeralHint: "V",
  },
];

const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

/** Resolve a hash fragment (with or without leading `#`) to a canonical chapter id. */
function resolveChapterFromHash(hashLike: string): string {
  const clean = hashLike.replace(/^#/, "");
  if (!clean) return CHAPTERS[0].id;
  if (CHAPTER_IDS.includes(clean)) return clean;
  const legacy = CHAPTERS.find((c) => c.legacyHashes.includes(clean));
  return legacy ? legacy.id : CHAPTERS[0].id;
}

// ── Scroll-based hooks ─────────────────────────────────────────

/**
 * Tracks which chapter is currently visible using IntersectionObserver.
 * Uses a weighted intersection ratio so the "most visible" chapter wins
 * even during rapid scrolling.
 */
function useActiveChapter(chapterIds: string[], initialId: string): string {
  const [activeId, setActiveId] = useState(initialId);
  const key = chapterIds.join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, r] of ratios.entries()) {
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.3, 0.6, 1],
      },
    );

    const ids = key.split("|");
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return activeId;
}

/**
 * useScrollProgress — 0..1 document scroll completion, rAF-throttled.
 * Drives <RevReadingProgress> (the mobile reading bar that replaces the
 * desktop spine on narrow screens). Passive listener; no layout thrash.
 */
function useScrollProgress(): number {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setPercent(max > 0 ? doc.scrollTop / max : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return percent;
}

// ── Main component ─────────────────────────────────────────────

export function ProfileDashboard({
  profile,
  locale,
  riasecScores,
  confidenceBreakdown,
  reportId,
  hasConditions,
  conditions,
  reportStale,
  profileStale,
  sessionId,
  savedAvatarGender = null,
  viewingAsAdmin = false,
  viewingAsAdminEmail = null,
  viewingAsAdminName = null,
}: ProfileDashboardProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const dateLocale = toDateLocaleOrDefault(locale);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bypassLocaleMismatch, setBypassLocaleMismatch] = useState(false);
  const [regeneratingLocale, setRegeneratingLocale] = useState(false);

  // ── Hash-driven initial chapter + legacy rewrite ────
  // Initial chapter is resolved once on mount; useActiveChapter then takes
  // over via scroll position. We also rewrite legacy #story/#dimensions/
  // #tensions hashes to their canonical ch-* equivalents.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    const resolved = resolveChapterFromHash(raw);
    if (resolved !== raw) {
      window.history.replaceState(null, "", `#${resolved}`);
    }
    const el = document.getElementById(resolved);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }, []);

  // Always initialise to the first chapter for SSR-safe hydration; the
  // mount-time useEffect below will scroll the hash-resolved chapter into
  // view, which the IntersectionObserver will then detect and update state.
  // Do NOT read window.location.hash here — that causes a client/server
  // render mismatch when users deep-link to #ch-inner-landscape etc.
  const activeChapterId = useActiveChapter(CHAPTER_IDS, CHAPTERS[0].id);

  // Mobile reading bar (desktop uses the in-hero chapter rail instead).
  const scrollPercent = useScrollProgress();

  // Desktop persistent chapter spine — fades in only once the hero (which
  // carries its own chapter rail) has scrolled out of view, so the two never
  // overlap at the top. This is the long-scroll monograph's lasting nav.
  const [spinePast, setSpinePast] = useState(false);
  // Re-run when bypassLocaleMismatch flips: on the locale-mismatch early-return
  // path the hero isn't in the DOM at mount, so the observer must re-attach
  // once the reader chooses "view anyway" and the monograph renders.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hero = document.querySelector('[data-slot="monograph-museum-hero"]');
    if (!hero) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSpinePast(!entry.isIntersecting),
      { rootMargin: "-15% 0px 0px 0px" },
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, [bypassLocaleMismatch]);

  // Soft-sync URL hash with active chapter (no jump, just history replace).
  // We reuse the existing `profile_tab_switched` funnel event — chapter ids
  // like `ch-portrait` take the `tab` slot so downstream dashboards keep
  // working without a schema migration.
  const prevActiveRef = useRef<string>(activeChapterId);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prevActiveRef.current === activeChapterId) return;
    // Admin view is read-only; their scroll behavior would otherwise pollute
    // the target user's funnel with profile_tab_switched events.
    if (!viewingAsAdmin) {
      analytics
        .track("profile_tab_switched", {
          tab: activeChapterId,
          previousTab: prevActiveRef.current,
        })
        .catch(() => {});
    }
    const current = window.location.hash.replace(/^#/, "");
    if (current !== activeChapterId) {
      window.history.replaceState(null, "", `#${activeChapterId}`);
    }
    prevActiveRef.current = activeChapterId;
  }, [activeChapterId]);

  // Smooth scroll to chapter when user clicks a book-spine link or
  // navigates via browser back/forward.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHashChange = () => {
      const resolved = resolveChapterFromHash(window.location.hash);
      const el = document.getElementById(resolved);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Ref populated by ReportCTA inside <NarrativeReportFinale> — lets the
  // top-of-page tip trigger report generation directly after scrolling,
  // without brittle DOM queries.
  const generateReportRef = useRef<(() => void) | null>(null);

  // Top-of-page "report awaits at the end" tip handler. Always scrolls to the
  // finale CTA so the user can see the full context before generating —
  // opening the depth dialog here would bypass that intent.
  const handleGenerateReportClick = useCallback(() => {
    analytics
      .track("profile_cta_clicked", {
        dimension: "top_tip",
        destination: "finale_cta",
      })
      .catch(() => {});

    document.getElementById("profile-report-cta")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const mintedDate = new Date(profile.updatedAt).toLocaleDateString(
    dateLocale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  // ── Locale mismatch detection ──
  // Profile narratives are generated in a specific locale but don't store it.
  // Detect language by checking for CJK characters in the narrative text.
  const narrativeText =
    profile.narrativeSnapshots?.archetypeNarrative ||
    profile.narrativeSnapshots?.identitySummary ||
    "";
  const hasCJK =
    narrativeText.length > 0 && /[\u4e00-\u9fff]/.test(narrativeText);
  const narrativeLocale =
    profile.narrativeSnapshots?.narrativeLocale ?? (hasCJK ? "zh" : "en");
  const hasNarrativeLocaleMismatch =
    narrativeText.length > 0 &&
    narrativeLocale !== locale &&
    !bypassLocaleMismatch &&
    // Admin view is strictly read-only — don't trap admins behind a
    // regenerate-or-view prompt that would otherwise write to the target user.
    !viewingAsAdmin;

  if (hasNarrativeLocaleMismatch) {
    // `t` is already `getDictionaryClient(...).profile` — no extra `.profile`
    // hop. (The earlier double-access was a dormant bug that only surfaced
    // when narrative locale actually differed from site locale.)
    const tp = t as unknown as Record<string, string>;
    const langName =
      narrativeLocale === "zh"
        ? tp.localeMismatchLangZh
        : tp.localeMismatchLangEn;

    const handleRegenerate = async () => {
      setRegeneratingLocale(true);
      try {
        const res = await csrfFetch("/api/generate-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: profile.assessmentId,
            locale,
            refreshNarratives: true,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        window.location.reload();
      } catch {
        setRegeneratingLocale(false);
        setBypassLocaleMismatch(true);
      }
    };

    return (
      <div
        data-surface="revelation"
        className="min-h-dvh bg-rev-paper text-rev-ink flex flex-col"
      >
        <main
          className="flex-1 flex items-center justify-center p-4"
          style={{ paddingTop: "var(--header-height, 64px)" }}
        >
          <div className="max-w-md w-full rounded-[4px] border border-rev-rule border-l-2 border-l-rev-signal-attention bg-rev-paper-warm p-8 text-center">
            <div className="mb-6 mx-auto w-14 h-14 rounded-full bg-rev-paper flex items-center justify-center border border-rev-signal-attention/30">
              <Languages className="h-7 w-7 text-rev-signal-attention" />
            </div>
            <h2 className="font-display text-xl font-normal text-rev-ink mb-3 tracking-[-0.01em]">
              {tp.localeMismatchTitle}
            </h2>
            <p className="text-rev-ink-soft mb-6 text-sm leading-relaxed">
              {(tp.localeMismatchDesc ?? "").replace("{lang}", langName)}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regeneratingLocale}
                className="inline-flex items-center gap-2 rounded-[2px] bg-rev-ink text-rev-paper border-b-2 border-rev-glow-cold px-6 py-3 text-sm font-medium tracking-[0.02em] hover:bg-rev-ink/90 transition-colors disabled:opacity-60 min-h-[44px]"
              >
                <Sparkles
                  className={`w-4 h-4 ${regeneratingLocale ? "animate-pulse" : ""}`}
                />
                {regeneratingLocale ? "..." : tp.localeMismatchRegenerate}
              </button>
              <button
                type="button"
                onClick={() => setBypassLocaleMismatch(true)}
                className="inline-flex items-center gap-2 rounded-[2px] px-6 py-3 text-sm font-medium text-rev-ink-soft hover:text-rev-ink transition-colors min-h-[44px]"
              >
                {tp.localeMismatchViewAnyway}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      data-surface="revelation"
      className="dd-profile-monograph min-h-dvh bg-rev-paper text-rev-ink relative"
    >
      {/* Mobile reading progress (lg:hidden) — the persistent dynamic nav cue
          on narrow screens, where the in-hero chapter rail scrolls away.
          Sits just below the fixed app header so the line isn't occluded. */}
      <RevReadingProgress
        percent={scrollPercent}
        // Show the active section name only once the cover has scrolled away,
        // matching the desktop spine so the two nav cues stay in lockstep.
        label={
          spinePast
            ? String(
                t[
                  (CHAPTERS.find((c) => c.id === activeChapterId)?.titleKey ??
                    "") as keyof typeof t
                ] ?? "",
              )
            : undefined
        }
        style={{ top: "var(--header-height, 64px)" }}
      />

      {/* Desktop persistent chapter spine (lg+). Hidden until the hero scrolls
          away, then tracks the active chapter as the reader moves down the
          long-scroll monograph. */}
      <RevBookSpine
        chapters={CHAPTERS.map((ch) => ({
          id: ch.id,
          label: String(t[ch.titleKey as keyof typeof t] ?? ch.eyebrow),
          numeral: ch.numeralHint,
        }))}
        activeId={activeChapterId}
        ariaLabel={String(t.chapterNavAria ?? "Chapter navigation")}
        // `inert` (not aria-hidden) so the hidden spine's links are removed
        // from both the tab order and the accessibility tree — aria-hidden
        // alone would leave focusable links inside a hidden region.
        inert={!spinePast}
        style={{
          opacity: spinePast ? 1 : 0,
          transition: "opacity 320ms var(--ease-out-quint, ease-out)",
        }}
      />

      {viewingAsAdmin && (
        <AdminViewingAsBanner
          locale={locale}
          email={viewingAsAdminEmail}
          name={viewingAsAdminName}
          profileUserId={profile.userId}
        />
      )}
      {/* Auxiliary banners — live above the first chapter */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-2">
        {profileStale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 p-4 rounded-[4px] border border-rev-rule border-l-2 border-l-rev-signal-attention bg-rev-paper-warm"
          >
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rev-signal-attention shrink-0 mt-2" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rev-ink">
                  {t.profileStaleTitle}
                </p>
                <p className="text-xs text-rev-ink-soft mt-0.5">
                  {t.profileStaleDesc}
                </p>
              </div>
              {!viewingAsAdmin && (
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      await csrfFetch("/api/generate-profile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          assessmentId: profile.assessmentId,
                          locale,
                        }),
                      });
                      window.location.reload();
                    } catch {
                      setIsRefreshing(false);
                    }
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-[2px]
                  bg-rev-ink text-rev-paper
                  hover:bg-rev-ink/90 transition-colors disabled:opacity-50"
                >
                  {isRefreshing ? t.profileRefreshing : t.profileStaleAction}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* First-time users see a lightweight tip that the report CTA lives at
            the end — so they read through the Profile first instead of being
            pushed into report generation before absorbing their own portrait. */}
        {!reportId && !viewingAsAdmin && (
          <motion.button
            type="button"
            onClick={handleGenerateReportClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 w-full text-left text-xs sm:text-sm text-rev-ink-soft italic
              px-4 py-2.5 rounded-[2px] border border-dashed border-rev-rule/60
              hover:border-rev-glow-cold/50 hover:text-rev-ink transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rev-glow-cold
              focus-visible:ring-offset-2 focus-visible:ring-offset-rev-paper"
            aria-label={String(t.reportTopTip ?? "")}
          >
            {t.reportTopTip}
          </motion.button>
        )}
      </div>

      <MonographMuseumHero
        profile={profile}
        locale={locale}
        mintedDate={mintedDate}
        reportId={reportId}
        savedAvatarGender={savedAvatarGender}
        activeChapterId={activeChapterId}
        chapters={CHAPTERS.map((ch) => ({
          id: ch.id,
          label: String(t[ch.titleKey as keyof typeof t] ?? ch.eyebrow),
          numeral: ch.numeralHint,
        }))}
      />

      {/* ── Chapters ── */}
      {CHAPTERS.map((ch) => {
        const title = String(t[ch.titleKey as keyof typeof t] ?? "");
        const lead = String(t[ch.leadKey as keyof typeof t] ?? "");

        return (
          <RevChapter
            key={ch.id}
            id={ch.id}
            eyebrow={ch.eyebrow}
            title={title}
            lead={lead}
            tone={ch.tone}
            ruleTone={ch.ruleTone}
            contentClassName={
              ch.id === "ch-portrait" ? "mt-12 sm:mt-14 lg:mt-16" : undefined
            }
          >
            <div className="max-w-5xl mx-auto w-full">
              {ch.id === "ch-portrait" && (
                // The archetype name, avatar, anchors and minted date already
                // live on the cover (MonographMuseumHero). Chapter 01 opens
                // straight into the prose — no second title page.
                <NarrativeSynthesis
                  profile={profile}
                  locale={locale}
                  reportId={reportId}
                  hasConditions={hasConditions}
                  conditions={conditions}
                  reportStale={reportStale}
                  sessionId={sessionId}
                  generateReportRef={generateReportRef}
                  hideReportFinale
                  viewingAsAdmin={viewingAsAdmin}
                />
              )}
              {ch.id === "ch-inner-landscape" && (
                <DimensionExplorer
                  profile={profile}
                  locale={locale}
                  riasecScores={riasecScores}
                  confidenceBreakdown={confidenceBreakdown}
                  viewingAsAdmin={viewingAsAdmin}
                />
              )}
              {ch.id === "ch-meaning" && (
                <MeaningCompass
                  profile={profile}
                  locale={locale}
                  viewingAsAdmin={viewingAsAdmin}
                />
              )}
              {ch.id === "ch-tensions" && (
                <InnerTensions
                  profile={profile}
                  locale={locale}
                  coachingHref={`/${locale}/coaching`}
                />
              )}
            </div>
          </RevChapter>
        );
      })}

      {/* Finale — "What's Next + Report CTA" page-end Hero. Lives here (after
          every chapter) instead of mid-page in ch-portrait so the user finishes
          reading their monograph before being asked to commit to the deeper
          LLM-generated report. */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <NarrativeReportFinale
          profile={profile}
          locale={locale}
          reportId={reportId}
          hasConditions={hasConditions}
          conditions={conditions}
          reportStale={reportStale}
          sessionId={sessionId}
          generateReportRef={generateReportRef}
          viewingAsAdmin={viewingAsAdmin}
        />
      </section>

      {/* Colophon — editorial version-page scaffold.
          Wraps the existing DataTransparency so it reads as the book's
          "printed in" page rather than an orphaned footer. PR-6 will
          rebuild this into a full methodology page. */}
      <section className="bg-rev-paper-warm px-6 sm:px-10 lg:px-16 py-20 sm:py-24">
        <header className="mx-auto max-w-[var(--rev-measure)] text-center">
          <p className="font-sans uppercase font-medium tracking-[0.18em] text-[11px] sm:text-[12px] text-rev-signal-info">
            {String(t.colophonEyebrow ?? "COLOPHON")}
          </p>
          <div className="mt-4 flex justify-center">
            <RevHandRule tone="cold" width={40} />
          </div>
          <h2
            className="font-display font-normal mt-8 mb-0 leading-[1.05] tracking-[-0.015em] text-rev-ink"
            style={{ fontSize: "var(--rev-display-md)" }}
          >
            {String(t.colophonTitle ?? "Colophon")}
          </h2>
          {t.colophonSubtitle && (
            <p
              className="font-serif italic text-rev-ink-soft mt-5 max-w-[56ch] mx-auto leading-[1.5]"
              style={{ fontSize: "var(--rev-lead)" }}
            >
              {String(t.colophonSubtitle)}
            </p>
          )}
        </header>
        <div className="mt-14 max-w-5xl mx-auto">
          <DataTransparency profile={profile} locale={locale} />
        </div>

        {/* Script Coda — the book's hand-signed "printed" mark, closing the
            monograph the way the global footer signs off the site. */}
        <div className="mt-16 flex flex-col items-center">
          <RevFleuron glyph="floral" className="mt-0 mb-6" />
          <ScriptCoda
            text={String(t.colophonCoda ?? "Go deeper. Live clearer.")}
          />
        </div>
      </section>
    </div>
  );
}

// ── Admin viewing-as banner ────────────────────────────────────
// Renders only when an administrator is viewing another user's profile.
// Sticky at the very top so the admin never forgets the context; works in
// both light and dark mode.
function AdminViewingAsBanner({
  locale,
  email,
  name,
  profileUserId,
}: {
  locale: string;
  email: string | null;
  name: string | null;
  profileUserId: string | null | undefined;
}) {
  const t = getAdminViewingAsBanner(locale as Locale);

  const title = t.title;
  const subtitle = t.subtitle;
  const backLabel = t.backToPanel;
  const journeyLabel = t.viewJourney;

  const display = email
    ? title.replace("{email}", email).replace("{name}", name ?? email)
    : title.replace("{email}", "—");

  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-300 bg-amber-100/95 text-amber-950 backdrop-blur-sm dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2">
        <div className="flex min-w-0 items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-medium">{display}</p>
            <p className="truncate text-amber-900/80 dark:text-amber-200/80">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          <Link
            href={`/${locale}/admin`}
            className="underline underline-offset-2 hover:no-underline"
          >
            {backLabel}
          </Link>
          {profileUserId && (
            <Link
              href={`/${locale}/admin/user-journey/${profileUserId}`}
              className="underline underline-offset-2 hover:no-underline"
            >
              {journeyLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
