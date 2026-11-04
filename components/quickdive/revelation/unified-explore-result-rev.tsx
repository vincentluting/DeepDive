// ============================================================
// UnifiedExploreResultRev — Sounding "Chart Archive" shell for Quick Dive.
//
// The result page is a single editorial archive long-page: a left Expedition
// Rail (depth-gauge nav, lg+) plus a main column of ten numbered compartments
// (00 Cover Plate → 09 Appendix). Pure rev-token paper / midnight chart room;
// Swiss editorial grid, hairlines, ledger tables, a true Holland hexagon.
//
// Same prop signature as before so the router shim swaps transparently.
// Scoring, auth, claim, waitForSave, isReportView and every data-testid are
// preserved — only the chrome around the data changed.
// ============================================================

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ExpeditionRail,
  type RailSection,
} from "@/components/design/meridian/expedition-rail";
import { MobileSectionNav } from "@/components/design/meridian/mobile-section-nav";
import { Compartment } from "@/components/design/meridian/compartment";
import { RevHandRule, RevFleuron } from "@/components/profile-panels/editorial";

import { OnetAttribution } from "@/components/quickdive/onet-attribution";
import { InlineRegisterPanel } from "@/components/quickdive/inline-register-panel";

import {
  COMBO_NARRATIVES,
  RIASEC_INTERPRETATIONS,
  RIASEC_DIM_FULL,
  RIASEC_HEX_LEGEND,
  RIASEC_SIGNAL_ROWS,
  RIASEC_EVIDENCE,
  RIASEC_EXPERIMENT,
  DPTI_LABELS,
  DIFFERENTIATION_TEXT,
  AI_ERA_RIASEC_INSIGHTS,
  getComboKey,
  getHollandCode3,
  getDPTIScores,
  getDPTIInterpretation,
  getProfileDifferentiation,
  findLabel,
  type QuickDiveResultData,
  type CareerItem,
  type RiasecKey,
  type MultiLocaleText,
} from "@/components/quickdive/quickdive-data";
import { NORTH_STAR_MAP } from "@/lib/content/north-star";

import { getClientId } from "@/lib/auth/client-id";
import { analytics } from "@/lib/analytics/client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";

import { ThresholdCta } from "./threshold-cta";
import { SealedCareersChapter } from "./sealed-careers-chapter";
import { AppendixData } from "./appendix-data";
import { CoverPlate } from "./cover-plate";
import { FirstSignal } from "./first-signal";
import { HollandHexagon } from "./holland-hexagon";
import { WorkOrientationMeters } from "./work-orientation-meters";
import { TheFitPlate } from "./the-fit-plate";
import { CareerDirectionsLedger } from "./career-directions-ledger";
import { AiEraAngle } from "./ai-era-angle";
import { NorthStarPeaks } from "./north-star-peaks";

export interface UnifiedExploreResultProps {
  result: QuickDiveResultData;
  locale: string;
  t: Record<string, string>;
  onRedive?: (mode: "keep" | "replace") => void;
  savedReportId?: string | null;
  exploreMode?: "classic" | "narrative" | "immersive";
  /** When true, hides upsell/CTA zones for use in saved report pages */
  isReportView?: boolean;
  /** Resolves when the DB save is complete — await before navigating away */
  waitForSave?: () => Promise<string | null>;
  /** ISO timestamp of the saved report (kept for prop compatibility). */
  reportCreatedAt?: string | null;
  /** Persisted avatar gender from DB (kept for prop compatibility). */
  savedAvatarGender?: "male" | "female" | null;
}

// ── Helpers ────────────────────────────────────────────────

/** First sentence of a paragraph — falls back to the whole string. */
function firstSentence(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  const m = trimmed.match(/^.+?[。.!?！？](?=\s|$)/);
  return (m ? m[0] : trimmed).trim();
}

/** Stable hash for deterministic variation across list items. */
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const RIASEC_KEYS: readonly RiasecKey[] = ["R", "I", "A", "S", "E", "C"];

/** Type guard so map lookups (RIASEC_SIGNAL_ROWS[d] etc.) are never undefined
 *  even if an upstream score row carries an unexpected dimension string. */
function isRiasecKey(k: string): k is RiasecKey {
  return (RIASEC_KEYS as readonly string[]).includes(k);
}

const clampPct = (n: number): number =>
  Math.max(0, Math.min(100, Math.round(n)));

// ── Main Component ──────────────────────────────────────────

export function UnifiedExploreResultRev({
  result,
  locale,
  t,
  onRedive,
  savedReportId,
  exploreMode,
  isReportView = false,
  waitForSave,
}: UnifiedExploreResultProps) {
  const router = useRouter();
  const isZh = locale === "zh";
  const L = useCallback(
    (m: MultiLocaleText | undefined): string => (m ? (isZh ? m.zh : m.en) : ""),
    [isZh],
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showRegisterPanel, setShowRegisterPanel] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // ── Auth probe — non-blocking ──
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(!!data.user);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  // ── Custom-event tracking — bare fetch to a CSRF-exempt endpoint ──
  const trackEvent = useCallback(
    (event: string, metadata?: Record<string, unknown>) => {
      try {
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, clientId: getClientId(), metadata }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* tracking failure is non-critical */
      }
    },
    [],
  );

  // ── Auth handlers ──
  const handleClaimClick = useCallback(() => {
    trackEvent("qd_result_claim_clicked", {
      mode: exploreMode,
      code: result.code,
      locale,
      shell: "rev",
    });
    setShowRegisterPanel(true);
  }, [trackEvent, exploreMode, result.code, locale]);

  const handleRegisterSuccess = useCallback(() => {
    setShowRegisterPanel(false);
    setIsLoggedIn(true);
    trackEvent("qd_result_register_success", {
      mode: exploreMode,
      code: result.code,
      locale,
      shell: "rev",
    });
    router.refresh();
  }, [trackEvent, exploreMode, result.code, locale, router]);

  // ── Data ──
  const {
    label: savedLabel,
    code,
    sortedScores,
    topCareers,
    fitCareers,
    drainCareers,
  } = result;

  const label = findLabel(code) ?? savedLabel;
  const primaryDim = (code.includes("-") ? code.split("-")[0] : code) as string;
  const titleZh = label["label_zh"];
  const titleEn = label["label_en"];
  const archetypeName = isZh ? label.label_zh : label.label_en;

  const hollandCode3 = getHollandCode3(sortedScores);
  const comboKey = getComboKey(sortedScores);
  const comboNarrative = COMBO_NARRATIVES[comboKey]
    ? isZh
      ? COMBO_NARRATIVES[comboKey].zh
      : COMBO_NARRATIVES[comboKey].en
    : undefined;

  // Max raw score per dimension: classic Mini-IP 0-4×5=20, immersive 1-5×5=25.
  const rawScoreMax =
    exploreMode === "immersive" || exploreMode === "narrative" ? 25 : 20;

  // Normalized 0-100 score per RIASEC letter (drives hexagon + evidence).
  const normScores = useMemo(() => {
    const out: Record<RiasecKey, number> = {
      R: 0,
      I: 0,
      A: 0,
      S: 0,
      E: 0,
      C: 0,
    };
    for (const [k, v] of sortedScores) {
      if (isRiasecKey(k)) {
        out[k] = clampPct((v / rawScoreMax) * 100);
      }
    }
    return out;
  }, [sortedScores, rawScoreMax]);

  const top3Dims = useMemo(
    () =>
      sortedScores
        .slice(0, 3)
        .map(([k]) => k)
        .filter(isRiasecKey),
    [sortedScores],
  );

  // ── Cover plate ──
  const hollandDisplay = hollandCode3.split("").join("-"); // "I-R-A"
  const coverTitle = interpolate(
    t.qdArchiveHollandCodeLabel ?? "Holland Code {{code}}",
    { code: hollandDisplay },
  );
  const dimsLine = top3Dims.map((d) => L(RIASEC_DIM_FULL[d])).join(" · ");
  const primaryPct = normScores[primaryDim as RiasecKey] ?? 0;
  const plateCode = `QD-${hollandCode3}-${String(primaryPct).padStart(3, "0")}`;
  const questionCount =
    exploreMode === "immersive" || exploreMode === "narrative" ? 38 : 30;
  const coverMeta = [
    { label: t.qdArchiveMetaQuestions, value: String(questionCount) },
    { label: t.qdArchiveMetaTime, value: t.qdArchiveMetaTimeValue },
    { label: t.qdArchiveMetaSignal, value: hollandDisplay },
    { label: t.qdArchiveMetaSurface, value: t.qdArchiveMetaSurfaceValue },
  ];

  // ── First signal ──
  const signalRows = top3Dims.map((d) => ({
    title: L(RIASEC_SIGNAL_ROWS[d].title),
    body: L(RIASEC_SIGNAL_ROWS[d].body),
  }));
  const monogramCaption =
    firstSentence(comboNarrative) ??
    (isZh ? label.tagline_zh : label.tagline_en);

  // ── Hexagon ──
  const hexLegend = (["R", "I", "A", "S", "E", "C"] as RiasecKey[]).map(
    (d) => ({
      dim: d,
      verb: L(RIASEC_HEX_LEGEND[d].verb),
      desc: L(RIASEC_HEX_LEGEND[d].desc),
    }),
  );
  const clusterIntro = interpolate(
    t.qdArchiveHexClusterIntro ?? "{{dims}} form your dominant cluster.",
    { dims: dimsLine },
  );
  const diff = getProfileDifferentiation(sortedScores);
  const clarityLabelMap: Record<string, string> = {
    sharp: t.qdArchiveClaritySharp,
    moderate: t.qdArchiveClarityModerate,
    flat: t.qdArchiveClarityFlat,
  };
  const clarityTierLabel = clarityLabelMap[diff.tier];
  const clarityText = L(DIFFERENTIATION_TEXT[diff.tier]);

  // ── Orientation meters ──
  const dpti = getDPTIScores(sortedScores);
  const dptiInterp = getDPTIInterpretation(dpti);
  const orientationMeters = [
    { key: "data", label: L(DPTI_LABELS.data), value: dpti.data },
    { key: "ideas", label: L(DPTI_LABELS.ideas), value: dpti.ideas },
    { key: "things", label: L(DPTI_LABELS.things), value: dpti.things },
    { key: "people", label: L(DPTI_LABELS.people), value: dpti.people },
  ];

  // ── The fit ──
  const bestFit = topCareers[0];
  const fitEvidence = (bestFit?.matchDimensions ?? top3Dims)
    .filter(isRiasecKey)
    .slice(0, 3)
    .map((d) => ({
      dim: d as string,
      score: normScores[d] ?? 0,
      phrase: L(RIASEC_EVIDENCE[d]),
    }));
  const fitTagline =
    bestFit?.tagline ??
    (isZh ? bestFit?.tagline_zh : bestFit?.tagline_en) ??
    undefined;
  const dayText = L(RIASEC_INTERPRETATIONS[primaryDim]);

  // ── Career ledger (open / authed view) ──
  const ledgerWhy = useCallback(
    (c: CareerItem): string =>
      c.tagline ?? (isZh ? c.tagline_zh : c.tagline_en) ?? "",
    [isZh],
  );
  const ledgerExperiment = useCallback(
    (c: CareerItem): string => {
      const d = (c.matchDimensions?.[0] ??
        (primaryDim as RiasecKey)) as RiasecKey;
      const pool = RIASEC_EXPERIMENT[d] ?? RIASEC_EXPERIMENT.I;
      const pick = pool[stableHash(c.id ?? c.name) % pool.length];
      return L(pick);
    },
    [L, primaryDim],
  );
  const ledgerRows = [...topCareers, ...fitCareers].slice(0, 6).map((c) => ({
    name: c.name,
    pct: c.pct,
    why: ledgerWhy(c),
    experiment: ledgerExperiment(c),
  }));
  const watchOuts = drainCareers
    .slice(0, 3)
    .map((c) => ({ name: c.name, pct: c.pct }));

  // ── AI-era ──
  const aiEra = AI_ERA_RIASEC_INSIGHTS[primaryDim];

  // ── North star ──
  const northStar = NORTH_STAR_MAP[code];
  const northStarPeaks = northStar
    ? [
        {
          label: t.northStarLeadership,
          role: isZh
            ? northStar.leadership.role_zh
            : northStar.leadership.role_en,
          why: isZh ? northStar.leadership.why_zh : northStar.leadership.why_en,
        },
        {
          label: t.northStarExpertise,
          role: isZh
            ? northStar.expertise.role_zh
            : northStar.expertise.role_en,
          why: isZh ? northStar.expertise.why_zh : northStar.expertise.why_en,
        },
        {
          label: t.northStarImpact,
          role: isZh ? northStar.impact.role_zh : northStar.impact.role_en,
          why: isZh ? northStar.impact.why_zh : northStar.impact.why_en,
        },
      ]
    : [];

  // ── Threshold CTA copy ──
  const thresholdLabel =
    isLoggedIn === false
      ? (t.revThresholdCtaUnauth ?? t.ctaBeginDeepDive)
      : (t.revThresholdCtaAuth ?? t.ctaBeginDeepDive);

  // ── Rail / nav sections ──
  const navSections: RailSection[] = [
    { id: "cover", label: t.qdArchiveCoverEyebrow },
    { id: "signal", label: t.qdArchiveSignalEyebrow },
    { id: "hexagon", label: t.qdArchiveHexagonEyebrow },
    { id: "fit", label: t.qdArchiveFitEyebrow },
    { id: "directions", label: t.qdArchiveDirectionsEyebrow },
    ...(northStar
      ? [{ id: "north-star", label: t.qdArchiveNorthStarEyebrow }]
      : []),
    ...(isReportView
      ? []
      : [{ id: "threshold", label: t.qdArchiveThresholdEyebrow }]),
    { id: "appendix", label: t.qdArchiveAppendixEyebrow },
  ];

  const compartmentClass = "scroll-mt-24 mt-16 sm:mt-20 first:mt-0";

  // ── Body ──
  const archive = (
    <div className="w-full max-w-[1180px] mx-auto lg:grid lg:grid-cols-[230px_minmax(0,1fr)]">
      <ExpeditionRail
        surface="revelation"
        kicker={t.qdArchiveRailKicker}
        title={t.qdArchiveRailTitle}
        signatureName={t.qdArchiveRailSignature}
        sections={navSections}
        className="lg:sticky lg:top-0 lg:self-start lg:max-h-dvh lg:overflow-y-auto"
      />

      <main className="min-w-0 px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
        <MobileSectionNav sections={navSections} label={t.qdArchiveNavLabel} />

        {/* 00 · Cover plate */}
        <Compartment
          index="00"
          id="cover"
          label={t.qdArchiveCoverKicker}
          className={`${compartmentClass} !mt-0`}
        >
          <CoverPlate
            title={coverTitle}
            dimsLine={dimsLine}
            lede={t.qdArchiveCoverLede}
            plateLabel={t.qdArchivePlateLabel}
            plateCode={plateCode}
            meta={coverMeta}
            coda={t.qdArchiveCoda}
          />
        </Compartment>

        {/* 01 · Your first signal */}
        <Compartment
          index="01"
          id="signal"
          label={t.qdArchiveSignalEyebrow}
          className={compartmentClass}
        >
          <FirstSignal
            monogram={hollandCode3}
            monogramCaption={monogramCaption}
            title={archetypeName}
            lede={t.qdArchiveSignalLede}
            rows={signalRows}
            curiosityLabel={t.qdArchiveCuriosityLabel}
            curiosityQuote={t.qdArchiveCuriosityQuote}
          />
        </Compartment>

        {/* 02 · Holland hexagon */}
        <Compartment
          index="02"
          id="hexagon"
          label={t.qdArchiveHexagonEyebrow}
          className={compartmentClass}
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:gap-x-14 items-center">
            <div className="mx-auto w-full max-w-[320px]">
              <HollandHexagon
                scores={normScores}
                ariaLabel={interpolate(
                  t.qdArchiveHexClusterIntro ?? "{{dims}}",
                  { dims: dimsLine },
                )}
              />
            </div>

            <div>
              <h3
                className="font-display font-normal text-rev-ink leading-tight"
                style={{ fontSize: "var(--rev-display-md)" }}
              >
                {t.qdArchiveHexSays}
              </h3>
              <p className="mt-4 font-serif text-rev-ink-soft text-[15px] leading-[1.7] max-w-[52ch]">
                <span className="text-rev-ink">{clusterIntro}</span>
                {comboNarrative ? ` ${comboNarrative}` : ""}
              </p>

              <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3">
                {hexLegend.map((leg) => (
                  <div key={leg.dim} className="flex gap-2.5">
                    <dt className="font-display text-rev-ink text-[14px] w-4 shrink-0">
                      {leg.dim}
                    </dt>
                    <dd className="min-w-0">
                      <span className="font-sans text-rev-ink text-[12px] font-medium">
                        {leg.verb}
                      </span>
                      <span className="block font-serif text-rev-ink-soft text-[12px] leading-[1.5]">
                        {leg.desc}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7">
                <RevHandRule width="full" tone="rule" />
                <p className="mt-3 font-serif text-rev-ink text-[14px] leading-[1.6]">
                  <span className="font-sans uppercase tracking-[0.14em] text-[10px] text-rev-signal-info mr-2">
                    {t.qdArchiveProfileClarityLabel} · {clarityTierLabel}
                  </span>
                  <span className="text-rev-ink-soft italic">
                    {clarityText}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Compartment>

        {/* 03 · Orientation bars */}
        <Compartment
          index="03"
          id="orientation"
          label={t.qdArchiveOrientationEyebrow}
          className={compartmentClass}
        >
          <WorkOrientationMeters
            title={t.qdArchiveOrientationTitle}
            lede={t.qdArchiveOrientationLede}
            meters={orientationMeters}
            interpretation={dptiInterp ? L(dptiInterp) : undefined}
          />
        </Compartment>

        {/* 04 · The fit */}
        {bestFit && (
          <Compartment
            index="04"
            id="fit"
            label={t.qdArchiveFitEyebrow}
            className={compartmentClass}
          >
            <TheFitPlate
              bestFitLabel={t.qdArchiveFitBestLabel}
              careerName={bestFit.name}
              fitPct={bestFit.pct}
              tagline={fitTagline}
              evidenceLabel={t.qdArchiveFitEvidenceLabel}
              evidence={fitEvidence}
              dayLabel={t.qdArchiveFitDayLabel}
              dayText={dayText}
            />
          </Compartment>
        )}

        {/* 05 · Career directions */}
        <Compartment
          index="05"
          id="directions"
          label={t.qdArchiveDirectionsEyebrow}
          className={compartmentClass}
        >
          {isLoggedIn === true ? (
            <CareerDirectionsLedger
              rows={ledgerRows}
              directionCol={t.qdArchiveDirDirectionCol}
              fitCol={t.qdArchiveDirFitCol}
              whyCol={t.qdArchiveDirWhyCol}
              experimentCol={t.qdArchiveDirExperimentCol}
              watchOuts={watchOuts}
              watchOutsLabel={t.qdArchiveWatchoutsLabel}
              watchOutsLede={t.qdArchiveWatchoutsLede}
            />
          ) : (
            <SealedCareersChapter
              careers={{ topCareers, fitCareers, drainCareers }}
              archetypeCode={code}
              archetypeTitle={titleZh}
              archetypeTitleEn={titleEn}
              locale={locale}
              isLoggedIn={isLoggedIn}
              onClaimClick={handleClaimClick}
              artifactEyebrow={t.revChapterCareersArtifactEyebrow}
              sealedCaption={
                t.revSealedCaption ??
                "Three names rest behind the seal — break it open with a free account."
              }
            />
          )}
        </Compartment>

        {/* 06 · AI-era angle */}
        {aiEra && (
          <Compartment
            index="06"
            id="ai-era"
            label={t.qdArchiveAiEraEyebrow}
            className={compartmentClass}
          >
            <AiEraAngle
              advantageLabel={t.aiEraInsightAdvantage}
              advantage={L(aiEra.advantage)}
              riskLabel={t.aiEraInsightRisk}
              risk={L(aiEra.risk)}
              directionLabel={t.aiEraInsightDirection}
              direction={L(aiEra.direction)}
              source={t.aiEraInsightSource}
            />
          </Compartment>
        )}

        {/* 07 · North star */}
        {northStar && (
          <Compartment
            index="07"
            id="north-star"
            label={t.qdArchiveNorthStarEyebrow}
            className={compartmentClass}
          >
            <NorthStarPeaks
              peaks={northStarPeaks}
              caption={t.qdArchiveNorthStarCaption}
            />
          </Compartment>
        )}

        {/* 08 · Deep dive threshold (hidden in report view) */}
        {!isReportView && (
          <Compartment
            index="08"
            id="threshold"
            label={t.qdArchiveThresholdEyebrow}
            className={compartmentClass}
          >
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-x-14 items-start">
              <div>
                <h3
                  className="font-display font-normal text-rev-ink leading-[1.05] tracking-[-0.01em]"
                  style={{ fontSize: "var(--rev-display-md)" }}
                >
                  {t.qdArchiveThresholdTitle}
                </h3>
                <p className="mt-3 font-display italic text-rev-ink-soft text-[clamp(16px,1.7vw,20px)] leading-snug">
                  {t.revThresholdHeadline ??
                    "What you've seen is the index. The book is below."}
                </p>

                <ol className="mt-7 space-y-5">
                  {[
                    {
                      label: t.revThresholdAwaitsItem1Label,
                      desc: t.revThresholdAwaitsItem1Desc,
                    },
                    {
                      label: t.revThresholdAwaitsItem2Label,
                      desc: t.revThresholdAwaitsItem2Desc,
                    },
                    {
                      label: t.qdArchiveThresholdItem3Label,
                      desc: t.qdArchiveThresholdItem3Desc,
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="font-sans uppercase tracking-[0.16em] text-[11px] text-rev-signal-attention pt-1">
                        {["I", "II", "III"][i]}
                      </span>
                      <div className="flex-1 border-t border-rev-rule pt-1">
                        <p className="font-display text-rev-ink text-[16px] leading-snug">
                          {item.label}
                        </p>
                        <p className="mt-1 font-serif text-rev-ink-soft text-[13px] leading-[1.6]">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border border-rev-rule rounded-[3px] bg-rev-paper-warm px-6 py-9">
                <ThresholdCta
                  locale={locale}
                  isLoggedIn={isLoggedIn}
                  label={thresholdLabel}
                  meta={t.revThresholdAwaitsMeta ?? t.ctaTimeHint}
                  waitForSave={waitForSave}
                  saveErrorLabel={
                    t.revThresholdSaveError ??
                    "We couldn't save your results — please try again."
                  }
                  saveRetryLabel={t.revThresholdSaveRetry ?? "Try Again"}
                  onTrack={() =>
                    trackEvent("qd_result_unlock_clicked", {
                      mode: exploreMode,
                      code: result.code,
                      locale,
                      shell: "rev",
                    })
                  }
                />
              </div>
            </div>
          </Compartment>
        )}

        {/* 09 · Appendix */}
        <Compartment
          index="09"
          id="appendix"
          label={t.qdArchiveAppendixEyebrow}
          className={compartmentClass}
        >
          <AppendixData
            sortedScores={sortedScores}
            primaryDim={primaryDim}
            locale={locale}
            rawScoreMax={rawScoreMax}
            eyebrow={t.revAppendixEyebrow ?? "APPENDIX · RAW MEASUREMENTS"}
            toggleLabel={t.revAppendixToggle ?? "Open the data drawer"}
            interestsLabel={t.revAppendixInterestsTitle}
            dptiLabel={t.revAppendixDptiTitle}
            aiEraPositionLabel={t.revAppendixAiEraPosition}
            aiEraInsightLabel={t.aiEraInsightLabel}
            aiEraAdvantageLabel={
              t.aiEraInsightAdvantage ?? t.revAppendixAdvantageLabel
            }
            aiEraRiskLabel={t.aiEraInsightRisk ?? t.revAppendixRiskLabel}
            aiEraDirectionLabel={
              t.aiEraInsightDirection ?? t.revAppendixDirectionLabel
            }
          />
        </Compartment>

        {/* Colophon */}
        <footer className="mt-16 sm:mt-20">
          <RevHandRule width="full" tone="rule" />
          <div className="mt-6 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2">
            {onRedive && (
              <button
                type="button"
                disabled={isNavigating}
                onClick={async () => {
                  if (isNavigating) return;
                  setIsNavigating(true);
                  trackEvent("qd_result_retake_clicked", {
                    mode: exploreMode,
                    code: result.code,
                    locale,
                    shell: "rev",
                  });
                  if (waitForSave) await waitForSave().catch(() => {});
                  onRedive("replace");
                }}
                className="font-serif italic text-[14px] text-rev-ink hover:text-rev-signal-attention transition-colors disabled:opacity-50"
              >
                {t.revColophonRetake ?? t.redive}
              </button>
            )}
            {onRedive && (
              <span
                aria-hidden="true"
                className="text-rev-glow-cold/50 text-[9px]"
              >
                ✦
              </span>
            )}
            <button
              type="button"
              disabled={isNavigating}
              onClick={async () => {
                if (isNavigating) return;
                setIsNavigating(true);
                trackEvent("qd_result_home_clicked", {
                  mode: exploreMode,
                  code: result.code,
                  locale,
                  shell: "rev",
                });
                if (waitForSave) await waitForSave().catch(() => {});
                router.push(`/${locale}`);
              }}
              className="font-serif italic text-[14px] text-rev-ink-soft hover:text-rev-ink transition-colors disabled:opacity-50"
            >
              {t.revColophonHome ?? t.backToHome}
            </button>
          </div>

          {exploreMode === "classic" && (
            <div className="mt-8 text-center">
              <OnetAttribution locale={locale} variant="compact" t={t} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-3 font-script text-rev-signal-attention text-[clamp(18px,1.8vw,22px)]">
            {t.qdArchiveCoda}
          </div>
          <div className="mt-4 flex justify-center">
            <RevFleuron glyph="sextile" className="!mt-0 !mb-0" />
          </div>
        </footer>
      </main>
    </div>
  );

  const registerPanel = (
    <InlineRegisterPanel
      isOpen={showRegisterPanel}
      onClose={() => setShowRegisterPanel(false)}
      onSuccess={handleRegisterSuccess}
      locale={locale}
      archetypeCode={code}
      archetypeTitle={titleZh}
      archetypeTitleEn={titleEn}
      quickDiveResultId={savedReportId ?? undefined}
    />
  );

  // ── Report-view embed: break out of any narrow parent container. ──
  if (isReportView) {
    return (
      <>
        {registerPanel}
        <div
          className="relative w-[100vw] left-[calc(-50vw+50%)] bg-rev-paper text-rev-ink"
          data-surface="revelation"
          data-testid="quickdive-result"
        >
          {archive}
        </div>
      </>
    );
  }

  // ── Full standalone view ──
  return (
    <>
      {registerPanel}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-dvh bg-rev-paper text-rev-ink"
        data-surface="revelation"
        data-testid="quickdive-result"
      >
        {archive}
      </motion.div>
    </>
  );
}
