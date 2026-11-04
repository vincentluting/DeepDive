/**
 * MeaningCompass — Chapter 03 of the Profile page
 *
 * Lifts the Schwartz E/T axis (once a one-line subtitle on the cover)
 * into a full chapter weaving:
 *   1. Compass SVG hero — abstract astrolabe, radial shape language
 *   2. Narrative paragraph — meaningCompassNarrative (LLM, soul-call generated)
 *   3. Ikigai three-circle Venn + overlap zone (replaces old IkigaiContent)
 *   4. Meaning tension card — only renders when conflictPair detected
 *   5. Soft CTA footer pointing forward to ch-tensions (no coach CTA)
 *
 * Visual differentiator: circular/radial shape language. All other
 * dashboard chapters are rectangular/linear — the radial compass IS the
 * recognition signal that this chapter is about meaning, not behavior.
 *
 * Empty state: when profile.meaningCompass is absent (pre-v3.1 profiles),
 * the chapter renders nothing — the dashboard skips it gracefully.
 *
 * Light/dark dual-mode: all colors via CSS variables from globals.css —
 * --rev-paper, --rev-ink, --rev-glow-cold, --rev-signal-positive,
 * --rev-signal-attention. Both modes covered by the variable system.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PersonalProfileData, IkigaiItem } from "@/lib/types";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface MeaningCompassProps {
  profile: PersonalProfileData;
  locale: string;
  /** Admin viewing another user's profile — suppress write actions. */
  viewingAsAdmin?: boolean;
}

function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

function pickLabel(item: IkigaiItem, loc: Locale): string {
  return getLocalizedField(item, "label", loc);
}

export function MeaningCompass({
  profile,
  locale,
  viewingAsAdmin = false,
}: MeaningCompassProps) {
  const compass = profile.meaningCompass;
  // Hooks must run before any early return. We pass `enabled` so the lazy
  // trigger short-circuits when there's no compass data — the LLM would
  // otherwise be asked to write a "why you live this way" paragraph with
  // no anchor points (pre-v3.1 profiles).
  useLazyMeaningCompassNarrative({
    // Admin view is strictly read-only — never trigger LLM generation
    // against the target user's account when an admin scrolls past.
    enabled: !!compass && !viewingAsAdmin,
    assessmentId: profile.assessmentId,
    locale,
    alreadyHasNarrative:
      !!profile.narrativeSnapshots?.meaningCompassNarrative?.trim(),
  });

  if (!compass) return null;

  const loc = resolveLocale(locale);
  const t = getDictionaryClient(loc).profile;
  const tp = t as unknown as Record<string, string>;

  const narrative = profile.narrativeSnapshots?.meaningCompassNarrative?.trim();
  const dominantKeystone = compass.keystones[0];
  const dominantLabel = dominantKeystone
    ? pickLabel(
        {
          themeKey: "",
          label_en: dominantKeystone.label_en,
          label_zh: dominantKeystone.label_zh,
          circles: [],
          sources: [],
        } as IkigaiItem,
        loc,
      )
    : null;

  // Spectrum position is in [-1, +1]. Map to a horizontal needle position
  // on the SVG: -1 → 8% (full enhancement, left), +1 → 92% (full transcendence, right)
  const needleX = 50 + compass.pole.spectrumPosition * 42;

  const tensionCopy =
    compass.meaningTension.surfacedAs === "creative_vs_experiential"
      ? tp.meaningTensionCreativeVsExperiential
      : compass.meaningTension.surfacedAs === "agency_vs_acceptance"
        ? tp.meaningTensionAgencyVsAcceptance
        : null;

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── 1. Compass SVG hero ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <CompassSvg
          spectrumX={needleX}
          centerLabel={dominantLabel}
          axis={compass.pole.axis}
        />
      </motion.div>

      {/* ── 2. Narrative paragraph ──────────────────────────── */}
      {narrative ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-[60ch] mx-auto"
        >
          <p
            className="font-serif text-rev-ink leading-[1.7] whitespace-pre-line"
            style={{ fontSize: "18px" }}
          >
            {narrative}
          </p>
        </motion.div>
      ) : (
        <div className="max-w-[60ch] mx-auto">
          <p className="font-serif italic text-rev-ink-soft leading-relaxed text-center text-sm">
            {tp.meaningCompassMissing}
          </p>
        </div>
      )}

      {/* ── 3. Three currents — visual anchors only (no numbers) ── */}
      <ThreeCurrents tp={tp} />

      {/* ── 4. Ikigai three-circle Venn + overlap zone ──────── */}
      <IkigaiVenn compass={compass} loc={loc} tp={tp} />

      {/* ── 5. Meaning tension card (conditional) ───────────── */}
      {tensionCopy && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="max-w-[60ch] mx-auto"
        >
          <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-rev-signal-attention mb-3">
            {tp.meaningTensionLabel}
          </p>
          <p className="font-serif text-rev-ink leading-relaxed text-[17px]">
            {tensionCopy}
          </p>
          <hr className="mt-6 border-t border-rev-rule/50 max-w-[20ch]" />
        </motion.div>
      )}

      {/* ── 6. Soft CTA footer (anchor-only, no coach CTA) ──── */}
      <div className="max-w-[60ch] mx-auto pt-4">
        <a
          href="#ch-tensions"
          className="block text-center font-serif italic text-rev-ink-soft hover:text-rev-ink transition-colors text-[15px]"
        >
          {tp.meaningCompassCTA}
        </a>
      </div>
    </div>
  );
}

// ── Compass SVG hero ─────────────────────────────────────────
// Abstract astrolabe — outer ring of 12 archetype glyphs (faint),
// middle horizontal E↔T spectrum bar, inner triangle marking
// Create / Encounter / Endure (visual anchors only — no proportions).

function stableSvgNumber(value: number): number {
  return Number(value.toFixed(4));
}

function CompassSvg({
  spectrumX,
  centerLabel,
  axis,
}: {
  spectrumX: number;
  centerLabel: string | null;
  axis: "enhancement" | "transcendence";
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 12 outer-ring glyphs — small dots evoking archetype constellation
  const outerDots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = 46;
    return {
      cx: stableSvgNumber(50 + r * Math.cos(angle)),
      cy: stableSvgNumber(50 + r * Math.sin(angle)),
      key: i,
    };
  });

  // Inner triangle vertices (Create top, Encounter bottom-right, Endure bottom-left)
  const triangle = [
    { x: 50, y: 28 }, // top — Create
    { x: 68, y: 60 }, // bottom-right — Encounter
    { x: 32, y: 60 }, // bottom-left — Endure
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full max-w-[360px] aspect-square"
      role="img"
      aria-hidden="true"
    >
      {/* Outer ring — 12 archetype glyphs (faint) */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="var(--rev-rule)"
        strokeWidth="0.3"
        opacity="0.5"
      />
      {outerDots.map((d) => (
        <circle
          key={d.key}
          cx={d.cx}
          cy={d.cy}
          r="0.6"
          fill="var(--rev-rule)"
          opacity="0.6"
        />
      ))}

      {/* Middle horizontal E↔T spectrum bar */}
      <line
        x1="14"
        y1="50"
        x2="86"
        y2="50"
        stroke="var(--rev-glow-cold)"
        strokeWidth="0.3"
        opacity="0.4"
      />
      {/* Enhancement pole tick (left) */}
      <circle
        cx="14"
        cy="50"
        r="1.2"
        fill="var(--rev-glow-cold)"
        opacity="0.7"
      />
      {/* Transcendence pole tick (right) */}
      <circle
        cx="86"
        cy="50"
        r="1.2"
        fill="var(--rev-signal-positive)"
        opacity="0.7"
      />
      {/* Needle marker */}
      <motion.circle
        initial={false}
        cx="50"
        animate={{ cx: isMounted ? spectrumX : 50 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        cy="50"
        r="2.2"
        fill="var(--rev-signal-attention)"
        stroke="var(--rev-paper)"
        strokeWidth="0.8"
      />

      {/* Inner triangle — three currents (visual anchors only) */}
      <polygon
        points={triangle.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="var(--rev-rule)"
        strokeWidth="0.4"
        opacity="0.45"
      />
      {triangle.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="0.9"
          fill={
            axis === "transcendence" && i !== 0
              ? "var(--rev-signal-positive)"
              : "var(--rev-glow-cold)"
          }
          opacity="0.65"
        />
      ))}

      {/* Center keystone label */}
      {centerLabel && (
        <text
          x="50"
          y="50.5"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-rev-ink"
          style={{
            fontFamily: "var(--font-fraunces, serif)",
            fontSize: centerLabel.length > 8 ? "5.5px" : "6.5px",
            fontStyle: "italic",
          }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

// ── Three currents bar (visual labels only, no numbers) ──────

function ThreeCurrents({ tp }: { tp: Record<string, string> }) {
  const currents = [
    { key: "create", label: tp.compassThreeCurrentsCreate },
    { key: "encounter", label: tp.compassThreeCurrentsEncounter },
    { key: "endure", label: tp.compassThreeCurrentsEndure },
  ];

  return (
    <div className="max-w-[60ch] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {currents.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
          className="text-center px-3 py-3 border-t border-rev-rule/40"
        >
          <p className="font-serif italic text-rev-ink leading-snug text-[14px]">
            {c.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Ikigai three-circle Venn (replaces old IkigaiContent) ────

function IkigaiVenn({
  compass,
  loc,
  tp,
}: {
  compass: NonNullable<PersonalProfileData["meaningCompass"]>;
  loc: Locale;
  tp: Record<string, string>;
}) {
  const { love, goodAt, need, overlap } = compass.ikigai;

  return (
    <div className="max-w-[60ch] mx-auto">
      {/* Overlap zone — the strongest signal first */}
      <div className="mb-6">
        <p className="font-mono uppercase tracking-[0.18em] text-[11px] text-rev-signal-attention mb-3 text-center">
          {tp.ikigaiZone}
        </p>
        {overlap.length > 0 ? (
          <ul className="space-y-2">
            {overlap.map((item) => (
              <li
                key={item.themeKey}
                className="flex items-start gap-2 text-rev-ink leading-relaxed"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: "var(--rev-signal-attention)" }}
                />
                <span className="text-[15px]">{pickLabel(item, loc)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center font-serif italic text-rev-ink-soft text-[14px]">
            {tp.ikigaiZoneEmpty}
          </p>
        )}
      </div>

      {/* Three circles — list view (mobile-friendly fallback for triangular Venn) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <IkigaiCircle
          label={tp.ikigaiLove}
          items={love}
          loc={loc}
          colorVar="var(--rev-signal-positive)"
        />
        <IkigaiCircle
          label={tp.ikigaiGoodAt}
          items={goodAt}
          loc={loc}
          colorVar="var(--rev-signal-info)"
        />
        <IkigaiCircle
          label={tp.ikigaiWorldNeeds}
          items={need}
          loc={loc}
          colorVar="var(--rev-glow-cold)"
        />
      </div>

      {/* Academic-honesty footnote */}
      <p className="mt-6 text-center text-[11px] italic text-rev-ink-soft/70 leading-relaxed">
        {tp.ikigaiProjectionNote}
      </p>
    </div>
  );
}

function IkigaiCircle({
  label,
  items,
  loc,
  colorVar,
}: {
  label: string;
  items: IkigaiItem[];
  loc: Locale;
  colorVar: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="p-3 rounded-[2px] bg-rev-paper-warm border border-rev-rule/40">
      <p
        className="text-[10px] font-mono uppercase tracking-[0.12em] mb-2"
        style={{ color: colorVar }}
      >
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.themeKey}
            className="text-[13px] text-rev-ink/90 leading-snug flex items-start gap-1.5"
          >
            <span
              className="w-1 h-1 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: colorVar }}
            />
            {pickLabel(item, loc)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Lazy meaning-compass narrative trigger ───────────────────
// Fires a single POST /api/regenerate-narratives?scope=meaning-compass
// the first time the user actually scrolls Ch3 into view. Most users
// never reach this chapter (<5% by analytics), so eager generation
// during profile creation wastes ~30% of the soul-call's output budget.
//
// Idempotency: the route also no-ops if the field is already present,
// so a duplicate trigger is harmless. We additionally short-circuit on
// the client via sessionStorage. Failures roll back both gates so a
// network blip / 500 doesn't permanently lock the tab out.

const SAFE_STORAGE = {
  has(key: string): boolean {
    try {
      return !!sessionStorage.getItem(key);
    } catch {
      return false;
    }
  },
  mark(key: string): void {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Safari private mode / iframe denies access — silently degrade;
      // the in-memory triggeredRef still gates against same-mount duplicates.
    }
  },
  unmark(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Same as above.
    }
  },
};

function useLazyMeaningCompassNarrative({
  enabled,
  assessmentId,
  locale,
  alreadyHasNarrative,
}: {
  enabled: boolean;
  assessmentId: string;
  locale: string;
  alreadyHasNarrative: boolean;
}) {
  const router = useRouter();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (alreadyHasNarrative || triggeredRef.current) return;
    if (!assessmentId) return;
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;

    const storageKey = `meaning-compass-lazy:${assessmentId}`;
    if (SAFE_STORAGE.has(storageKey)) return;

    const target = document.getElementById("ch-meaning");
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (triggeredRef.current) return;
          triggeredRef.current = true;
          SAFE_STORAGE.mark(storageKey);
          observer.disconnect();

          void (async () => {
            const rollback = () => {
              SAFE_STORAGE.unmark(storageKey);
              triggeredRef.current = false;
            };
            try {
              const res = await csrfFetch("/api/regenerate-narratives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  assessmentId,
                  locale,
                  scope: "meaning-compass",
                }),
              });
              if (res.ok) {
                router.refresh();
              } else {
                // Server failure — let next page-load retry.
                rollback();
              }
            } catch {
              rollback();
            }
          })();
          return;
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, assessmentId, locale, alreadyHasNarrative, router]);
}
