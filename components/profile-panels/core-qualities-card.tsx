"use client";

import type { CoreQualityQuadrant } from "@/lib/types";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { pickLocaleText } from "@/lib/i18n/localize";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { RevHandRule } from "./editorial";

interface CoreQualitiesCardProps {
  qualities: CoreQualityQuadrant[];
  locale: string;
}

export function CoreQualitiesContent({
  qualities,
  locale,
}: CoreQualitiesCardProps) {
  const loc = isValidLocale(locale) ? locale : defaultLocale;
  const t = getDictionaryClient(loc).profile;

  if (!qualities || qualities.length === 0) return null;

  return (
    <div className="space-y-14">
      {qualities.map((q, i) => (
        <InterlockedQuadrant
          key={q.facet}
          quadrant={q}
          locale={loc}
          t={t}
          index={i}
        />
      ))}
      <p className="text-[11px] text-rev-ink-soft/70 leading-relaxed">
        {t.coreQualitiesNote}
      </p>
    </div>
  );
}

/**
 * Editorial 2×2 of the Ofman model, rendered as four plates joined by a
 * central diamond and fine connector lines. Reads like a museum wall-label:
 *   Core Quality ──▶ Pitfall
 *        │               │
 *        ▼               ▼
 *   Challenge ◀──── Allergy
 *
 * Replaces the previous solid-tinted grid. No drop shadows, no pill labels,
 * fully on rev-paper tokens.
 */
function InterlockedQuadrant({
  quadrant: q,
  locale: loc,
  t,
  index,
}: {
  quadrant: CoreQualityQuadrant;
  locale: Locale;
  t: Record<string, string>;
  index: number;
}) {
  const cq = pickLocaleText(q.coreQuality, loc);
  const pf = pickLocaleText(q.pitfall, loc);
  const ch = pickLocaleText(q.challenge, loc);
  const al = pickLocaleText(q.allergy, loc);

  return (
    <section className="space-y-5">
      {index > 0 && (
        <div className="flex justify-center">
          <RevHandRule tone="rule" width={48} />
        </div>
      )}

      {/* Eyebrow + facet */}
      <header className="text-center">
        <p className="font-sans uppercase font-medium tracking-[0.18em] text-[11px] text-rev-signal-info">
          {t.coreQualityLabel}
          <span className="mx-2 text-rev-glow-cold/60">·</span>
          <span className="font-serif italic normal-case tracking-normal text-rev-ink">
            {cq}
          </span>
        </p>
      </header>

      {/* Interlocked four plates */}
      <div className="relative mx-auto max-w-[640px]">
        <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] items-stretch">
          {/* Row 1: Core Quality + connector + Pitfall */}
          <Plate
            label={t.coreQualityLabel}
            value={cq}
            tone="accent"
            side="left"
          />
          <Connector orientation="horizontal" arrow="→" />
          <Plate
            label={t.pitfallLabel}
            value={pf}
            hint={(t.pitfallDesc as string).replace("{cq}", cq)}
            side="right"
          />

          {/* Row 2: vertical connector column */}
          <Connector orientation="vertical" arrow="↓" />
          <CenterDiamond />
          <Connector orientation="vertical" arrow="↑" reverse />

          {/* Row 3: Challenge + connector + Allergy */}
          <Plate
            label={t.challengeLabel}
            value={ch}
            hint={t.challengeDesc}
            tone="accent"
            side="left"
          />
          <Connector orientation="horizontal" arrow="←" />
          <Plate
            label={t.allergyLabel}
            value={al}
            hint={t.allergyDesc}
            side="right"
          />
        </div>
      </div>
    </section>
  );
}

function Plate({
  label,
  value,
  hint,
  tone = "default",
  side,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent";
  side: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col ${side === "left" ? "items-end text-right pr-5" : "items-start text-left pl-5"} py-5`}
    >
      <p
        className={`font-sans uppercase tracking-[0.14em] text-[10px] mb-2 ${
          tone === "accent" ? "text-rev-signal-info" : "text-rev-ink-soft/80"
        }`}
      >
        {label}
      </p>
      <p
        className="font-display font-normal text-rev-ink leading-[1.15] tracking-[-0.01em]"
        style={{ fontSize: "clamp(20px, 3vw, 26px)" }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-2 font-serif italic text-rev-ink-soft/80 text-[12px] leading-[1.45] max-w-[22ch]">
          {hint}
        </p>
      )}
    </div>
  );
}

function Connector({
  orientation,
  arrow,
  reverse = false,
}: {
  orientation: "horizontal" | "vertical";
  arrow: string;
  reverse?: boolean;
}) {
  if (orientation === "horizontal") {
    return (
      <div className="flex flex-col items-center justify-center px-3">
        <RevHandRule tone="cold" width={56} />
        <span
          aria-hidden="true"
          className="mt-1 text-rev-glow-cold/70 text-[11px] font-serif"
        >
          {arrow}
        </span>
      </div>
    );
  }
  // vertical — gridColumn controls placement; no flex order needed
  return (
    <div
      className="flex flex-col items-center justify-center py-2"
      style={{ gridColumn: reverse ? "3 / 4" : "1 / 2" }}
    >
      <div
        aria-hidden="true"
        className="w-px bg-rev-rule"
        style={{ height: 36 }}
      />
      <span
        aria-hidden="true"
        className="text-rev-glow-cold/50 text-[11px] font-serif -mt-0.5"
      >
        {arrow}
      </span>
    </div>
  );
}

function CenterDiamond() {
  return (
    <div className="flex items-center justify-center px-2 py-2">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
        <polygon
          points="10,2 18,10 10,18 2,10"
          fill="none"
          stroke="var(--rev-glow-cold)"
          strokeOpacity={0.55}
          strokeWidth={0.8}
        />
        <polygon
          points="10,6 14,10 10,14 6,10"
          fill="var(--rev-glow-cold)"
          opacity={0.22}
        />
      </svg>
    </div>
  );
}
