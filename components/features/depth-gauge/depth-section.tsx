"use client";

import { DepthRing } from "./depth-ring";
import { DepthJourney } from "./depth-journey";

import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DepthSectionProps {
  locale: Locale | string;
  userName: string;
  reportCount: number;
  insightCount: number;
  daysActive: number;
  sessionCount: number;
  // Pre-computed progress from server
  depth: number;
  completionPercent: number;
  zoneName: string;
  completedModules: string[];
}

// Depth gradient — Meridian noon gold → sea → deep (sunlit surface to abyss)
const DEPTH_GRAD_H =
  "linear-gradient(90deg, var(--md-gold) 0%, var(--md-sea-bright) 45%, var(--md-sea) 72%, var(--md-sea-deep) 100%)";

function resolveLocale(locale: Locale | string): Locale {
  return typeof locale === "string" && isValidLocale(locale)
    ? locale
    : defaultLocale;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Depth exploration section for the dashboard.
 * Receives pre-computed progress from server — no client-side fetch needed.
 * Renders:
 *   - A page header with DepthRing (desktop right) + gradient accent line
 *   - Desktop (≥ 768px): two-column grid — journey card | sidebar
 *   - Mobile (< 768px): stacked — MobileDepth, ContinueCard, stats, collapsible journey
 */
export function DepthSection({
  locale,
  userName,
  reportCount,
  insightCount,
  daysActive,
  sessionCount,
  depth,
  completionPercent,
  zoneName,
  completedModules,
}: DepthSectionProps) {
  const localeValue = resolveLocale(locale);
  const dt = getDictionaryClient(localeValue).dashboardPage as Record<
    string,
    string
  >;

  const zoneDesc = (dt.depthCurrentDepth || "")
    .replace("{{depth}}", String(depth))
    .replace("{{zone}}", zoneName);

  // 2×2 stats
  const stats = [
    { label: dt.reportsGenerated, value: reportCount },
    { label: dt.insightsCollected, value: insightCount },
    { label: dt.daysActive, value: daysActive },
    { label: dt.sessionsCount, value: sessionCount },
  ];

  return (
    <>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div
        className="glass-premium mb-6 animate-fade-in-up"
        style={{ borderRadius: 16, padding: "24px 28px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Left: labels + accent line */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {dt.dashboardLabel}
            </p>
            <h1
              className="text-foreground font-display"
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {(dt.depthWelcomeBack || "").replace("{{name}}", userName)}
            </h1>

            {/* Accent line + zone description */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 2.5,
                  borderRadius: 2,
                  background: DEPTH_GRAD_H,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <p
                className="text-muted-foreground font-display"
                style={{ fontSize: 13, fontStyle: "italic", margin: 0 }}
              >
                {zoneDesc}
              </p>
            </div>
          </div>

          {/* Right: DepthRing */}
          <div style={{ flexShrink: 0 }}>
            <DepthRing
              depth={depth}
              completionPercent={completionPercent}
              size={100}
              unitLabel={dt.depthMeters}
            />
          </div>
        </div>

        {/* Inline stats */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 20px",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", alignItems: "baseline", gap: 6 }}
            >
              <span
                className="text-foreground"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile layout (< 768px) ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden mb-6">
        {/* Journey — collapsible, default collapsed */}
        <details>
          <summary
            className="text-muted-foreground"
            style={{
              fontSize: 12,
              cursor: "pointer",
              userSelect: "none",
              padding: "8px 0",
              listStyle: "none",
            }}
          >
            {dt.viewJourney}
          </summary>
          <div
            className="bg-card border border-border"
            style={{ padding: "20px 16px", borderRadius: 16, marginTop: 8 }}
          >
            <DepthJourney
              depth={depth}
              completedModules={completedModules}
              locale={localeValue}
            />
          </div>
        </details>
      </div>

      {/* ── Desktop layout (≥ 768px): collapsible journey ─────────────────── */}
      <details className="hidden md:block mb-6 animate-fade-in-up">
        <summary
          className="bg-card border border-border hover:border-primary/20 transition-colors"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 20px",
            borderRadius: 14,
            cursor: "pointer",
            listStyle: "none",
            userSelect: "none",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: "var(--md-mist)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                width: `${completionPercent}%`,
                background: DEPTH_GRAD_H,
                transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
          <span
            className="text-muted-foreground"
            style={{ fontSize: 13, flexShrink: 0 }}
          >
            {completionPercent}%
          </span>
          <span
            className="text-muted-foreground"
            style={{ fontSize: 12, flexShrink: 0 }}
          >
            {dt.viewJourney}
          </span>
        </summary>
        <div
          className="bg-card border border-border"
          style={{ padding: "24px", borderRadius: 16, marginTop: 8 }}
        >
          <DepthJourney
            depth={depth}
            completedModules={completedModules}
            locale={localeValue}
          />
        </div>
      </details>
    </>
  );
}
