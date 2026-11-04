"use client";

import { forwardRef } from "react";
import { getArchetypeContent } from "@/lib/content";
import {
  findLabel,
  RIASEC_TRAITS,
  CAREERS,
} from "@/components/quickdive/quickdive-data";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface ExplorerCertificateProps {
  /** Archetype code, e.g. "R-enhancement", "I-transcendence" */
  code: string;
  /** Locale for primary/secondary language ordering */
  locale: string;
  /** Accent color hex from the archetype */
  color: string;
  /** Rarity percentage (e.g. 5) */
  rare: number;
  /** Optional combo narrative — replaces tagline if provided */
  comboNarrative?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * "Explorer Certificate" — 1080x1080 achievement-style share card.
 *
 * Designed to feel like a formal certificate of completion, giving users
 * a sense of accomplishment and social proof for sharing.
 *
 * Must have `data-export="share-card"` for targeting the canvas capture.
 */
export const ExplorerCertificate = forwardRef<
  HTMLDivElement,
  ExplorerCertificateProps
>(function ExplorerCertificate(
  { code, locale, color, rare, comboNarrative },
  ref,
) {
  const content = getArchetypeContent(code);
  const label = findLabel(code);
  const t = getDictionaryClient(locale as Locale).shareCard;

  // RIASEC primary type rarity (% of O*NET occupations with this dominant type)
  const RIASEC_RARITY: Record<string, number> = {
    R: 28,
    I: 15,
    A: 8,
    S: 19,
    E: 16,
    C: 14,
  };
  const primaryType = code.charAt(0).toUpperCase();
  const actualRare = RIASEC_RARITY[primaryType] ?? rare;

  const primaryLabel = content
    ? getLocalizedField(content, "label", locale as Locale)
    : label
      ? pickLocaleText(
          { en: label.label_en, zh: label.label_zh },
          locale as Locale,
        )
      : code;
  // Show English subtitle on zh cards (internationally readable);
  // skip subtitle on en cards to avoid Chinese text leaking into English shares.
  const secondaryLabel =
    locale === "zh"
      ? content
        ? getLocalizedField(content, "label", "en")
        : label
          ? label.label_en
          : ""
      : "";
  const tagline =
    comboNarrative ||
    (content
      ? getLocalizedField(content, "tagline", locale as Locale)
      : label
        ? pickLocaleText(
            { en: label.tagline_en, zh: label.tagline_zh },
            locale as Locale,
          )
        : "");

  // Core strengths: use archetype content if available, fall back to RIASEC traits
  const strengths = content?.coreStrengths
    ? content.coreStrengths
        .slice(0, 3)
        .map((s) => pickLocaleText(s, locale as Locale))
    : (
        RIASEC_TRAITS[code]?.slice(0, 3) ||
        RIASEC_TRAITS[code[0]]?.slice(0, 3) ||
        []
      ).map((s) => pickLocaleText(s, locale as Locale));

  const today = new Date().toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Top career for RIASEC-only results
  const topCareer =
    !content && CAREERS[code]?.[0]
      ? locale === "zh"
        ? CAREERS[code][0].zh
        : CAREERS[code][0].en
      : null;

  return (
    <div
      ref={ref}
      data-export="share-card"
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        fontFamily: 'system-ui, -apple-system, "Noto Sans SC", sans-serif',
        background: `linear-gradient(160deg, #020a14 0%, ${hexToRgba(color, 0.12)} 45%, #020810 100%)`,
      }}
    >
      {/* Ambient glow — larger, centered on type name area */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          width: 700,
          height: 700,
          marginLeft: -350,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(color, 0.2)} 0%, ${hexToRgba(color, 0.05)} 45%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Decorative border */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 36,
          right: 36,
          bottom: 36,
          borderRadius: 28,
          border: `1px solid ${hexToRgba(color, 0.18)}`,
          pointerEvents: "none",
        }}
      />

      {/* Content — 3 visual zones: header, hero, footer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "64px 72px 56px",
        }}
      >
        {/* ── Zone 1: Header badge ── */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 28px",
            borderRadius: 100,
            background: hexToRgba(color, 0.1),
            border: `1px solid ${hexToRgba(color, 0.22)}`,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 12px ${hexToRgba(color, 0.6)}`,
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 5,
              color: hexToRgba(color, 0.85),
              textTransform: "uppercase" as const,
            }}
          >
            {t.certificateTitle}
          </span>
        </div>

        {/* ── Zone 2: Hero — type identity ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* Type letter — compact accent */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: `linear-gradient(135deg, ${color}, ${hexToRgba(color, 0.7)})`,
              boxShadow: `0 8px 48px ${hexToRgba(color, 0.35)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 36,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1,
              }}
            >
              {(content?.label_en || label?.label_en || code).charAt(0)}
            </span>
          </div>

          {/* Primary type name — THE hero element */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: 12,
              letterSpacing: -1,
            }}
          >
            {primaryLabel}
          </div>

          {/* Secondary label */}
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              color: hexToRgba(color, 0.85),
              marginBottom: 24,
              textAlign: "center",
              letterSpacing: 2,
            }}
          >
            {secondaryLabel}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "rgba(255,255,255,0.60)",
              textAlign: "center",
              maxWidth: 720,
              lineHeight: 1.6,
              marginBottom: 40,
            }}
          >
            {tagline}
          </div>

          {/* Strengths — horizontal pill layout for visual impact */}
          {strengths.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                alignItems: "center",
                width: "100%",
                maxWidth: 780,
              }}
            >
              {strengths.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 28px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: hexToRgba(color, 0.6),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.80)",
                      lineHeight: 1.4,
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Top career */}
          {topCareer && (
            <div
              style={{
                marginTop: 28,
                padding: "10px 24px",
                borderRadius: 12,
                background: hexToRgba(color, 0.08),
                border: `1px solid ${hexToRgba(color, 0.18)}`,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: hexToRgba(color, 0.8),
                }}
              >
                {t.topCareerDirection || "Top Career Direction"}:
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                  marginLeft: 8,
                }}
              >
                {topCareer}
              </span>
            </div>
          )}

          {/* Rarity badge */}
          {actualRare > 0 && (
            <div
              style={{
                marginTop: topCareer ? 16 : 28,
                fontSize: 18,
                fontWeight: 500,
                color: hexToRgba(color, 0.65),
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              {(t.rarityText || "Only {{rare}}% of explorers — Rare").replace(
                "{{rare}}",
                String(actualRare),
              )}
            </div>
          )}
        </div>

        {/* ── Zone 3: Footer ── */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: `1px solid rgba(255,255,255,0.08)`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {today}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 3,
              color: "rgba(255,255,255,0.50)",
            }}
          >
            deepdivecareer.com
          </div>
        </div>
      </div>
    </div>
  );
});
