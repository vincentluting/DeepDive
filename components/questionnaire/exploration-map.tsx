"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { ModuleCode } from "@/store/questionnaire-store";
import { getZonesForTier, type OceanZone } from "@/lib/questionnaire/constants";
import { MODULE_RANGES } from "@/store/questionnaire-store";
import type { ZoneStatus } from "./zone-card";
import { MobileMapSheet } from "./mobile-map-sheet";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

// ── Types ────────────────────────────────────────────────────

interface ExplorationMapProps {
  currentModule: ModuleCode;
  moduleProgress: { module: string; current: number; total: number };
  currentDepthMeters: number;
  language: "en" | "zh";
  answers: Array<{ moduleCode: string }>;
  triggeredInsights: Set<string>;
  tier?: "deep" | "ultra";
  reduced?: boolean;
}

interface ZoneProgressItem extends OceanZone {
  status: ZoneStatus;
  progress: number;
}

// ── Helpers ──────────────────────────────────────────────────

function computeZoneProgress(
  zones: OceanZone[],
  answers: Array<{ moduleCode: string }>,
  currentModule: ModuleCode,
): ZoneProgressItem[] {
  const moduleOrder: ModuleCode[] = ["A", "B", "C"];
  const currentModIdx = moduleOrder.indexOf(currentModule);

  return zones.map((zone) => {
    const modCode = zone.moduleCode as ModuleCode;
    const range = MODULE_RANGES[modCode];

    // Ultra zones are always locked in current tier
    if (!range) {
      return { ...zone, status: "locked" as const, progress: 0 };
    }

    const modIdx = moduleOrder.indexOf(modCode);
    const answered = answers.filter((a) => a.moduleCode === modCode).length;
    const total = range.end - range.start + 1;
    const progress = Math.min(answered / total, 1);

    let status: ZoneStatus;
    if (answered >= total) {
      status = "completed";
    } else if (modIdx === currentModIdx) {
      status = "active";
    } else if (modIdx < currentModIdx) {
      status = "completed";
    } else {
      status = "locked";
    }

    return { ...zone, status, progress };
  });
}

/** Determine which zones have triggered micro-insights (discoveries) */
function getDiscoveredZones(triggeredInsights: Set<string>): Set<string> {
  const discovered = new Set<string>();
  if (triggeredInsights.has("afterSJT")) discovered.add("A");
  if (triggeredInsights.has("afterPVQ")) discovered.add("B");
  for (const key of triggeredInsights) {
    if (key.startsWith("bonus") || key.startsWith("afterIPIP")) {
      discovered.add("C");
    }
  }
  return discovered;
}

// ── Component ────────────────────────────────────────────────

export function ExplorationMap({
  currentModule,
  moduleProgress: _moduleProgress,
  currentDepthMeters,
  language,
  answers,
  triggeredInsights,
  tier = "deep",
  reduced = false,
}: ExplorationMapProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const dict = getDictionaryClient(language as Locale).explorationMap;

  const zones = useMemo(() => getZonesForTier(tier), [tier]);
  const zoneProgress = useMemo(
    () => computeZoneProgress(zones, answers, currentModule),
    [zones, answers, currentModule],
  );
  const discoveredZones = useMemo(
    () => getDiscoveredZones(triggeredInsights),
    [triggeredInsights],
  );

  // Find active zone for connector indicator
  const activeZoneIdx = zoneProgress.findIndex((z) => z.status === "active");
  const activeZone = activeZoneIdx >= 0 ? zoneProgress[activeZoneIdx] : null;

  return (
    <>
      {/* Desktop Layout (md+) — minimal depth bar */}
      <div className="hidden md:block mb-3">
        <div className="flex items-center justify-center gap-3">
          {/* Compact zone indicators — dots + labels, no card boxes */}
          {zoneProgress
            .filter((z) => z.tier === "deep")
            .map((zone, idx, arr) => {
              const name = language === "zh" ? zone.name_zh : zone.name_en;
              const isActive = zone.status === "active";
              const isCompleted = zone.status === "completed";
              return (
                <div key={zone.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {/* Zone dot */}
                    <div
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: isActive ? 8 : 6,
                        height: isActive ? 8 : 6,
                        background:
                          isCompleted || isActive
                            ? zone.colorPrimary
                            : "rgba(255,255,255,0.12)",
                        boxShadow: isActive
                          ? `0 0 8px ${zone.colorGlow}`
                          : "none",
                        opacity: zone.status === "locked" ? 0.3 : 1,
                      }}
                    />
                    {/* Zone label — only show for active */}
                    <span
                      className="text-[10px] font-medium transition-colors duration-500"
                      style={{
                        color: isActive
                          ? zone.colorPrimary
                          : isCompleted
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(255,255,255,0.15)",
                      }}
                    >
                      {name}
                    </span>
                  </div>
                  {/* Thin connector */}
                  {idx < arr.length - 1 && (
                    <div
                      className="h-px transition-colors duration-500"
                      style={{
                        width: 24,
                        background: isCompleted
                          ? `${zone.colorPrimary}40`
                          : "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>

        {/* Depth readout — monospace, cold blue */}
        <div className="text-center mt-2">
          <span className="text-[10px] font-mono text-cyan-400/40 tabular-nums tracking-wider">
            ▼ {currentDepthMeters}m
          </span>
        </div>
      </div>

      {/* Mobile Layout (< md) */}
      <div className="md:hidden mb-3">
        <button
          type="button"
          className="w-full flex items-center gap-1.5"
          onClick={() => setMobileSheetOpen(true)}
          aria-label={dict.expandMap}
        >
          {/* Zone icons strip */}
          <div className="flex items-center gap-0.5 flex-1">
            {zoneProgress.map((zone, idx) => {
              const isActive = zone.status === "active";
              const isCompleted = zone.status === "completed";
              const isUltra = zone.tier === "ultra";

              return (
                <div key={zone.id} className="flex items-center">
                  {/* Zone circle */}
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: isActive ? "24px" : "18px",
                      height: isActive ? "24px" : "18px",
                      background: isCompleted
                        ? `${zone.colorPrimary}30`
                        : isActive
                          ? `${zone.colorPrimary}20`
                          : isUltra
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(255,255,255,0.06)",
                      border: isActive
                        ? `1.5px solid ${zone.colorPrimary}60`
                        : isCompleted
                          ? `1px solid ${zone.colorPrimary}30`
                          : "1px solid rgba(255,255,255,0.08)",
                      opacity: isUltra
                        ? 0.25
                        : zone.status === "locked"
                          ? 0.4
                          : 1,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isCompleted && (
                      <svg
                        className="w-2 h-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={zone.colorPrimary}
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {isActive && !reduced && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: zone.colorPrimary }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {isUltra && (
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                      />
                    )}
                  </div>

                  {/* Active zone progress bar */}
                  {isActive && (
                    <div className="flex items-center mx-1">
                      <div
                        className="h-px rounded-full overflow-hidden"
                        style={{
                          width: "48px",
                          background: "rgba(255,255,255,0.08)",
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: zone.colorPrimary }}
                          animate={{ width: `${zone.progress * 100}%` }}
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Connector dot */}
                  {idx < zoneProgress.length - 1 && !isActive && (
                    <div
                      className="mx-0.5 w-1 h-px"
                      style={{
                        background: isCompleted
                          ? `${zone.colorPrimary}40`
                          : "rgba(255,255,255,0.06)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </button>

        {/* Current zone name + depth below strip */}
        <div className="flex items-center justify-between mt-1 px-0.5">
          <span className="text-[9px] text-white/60">
            {activeZone
              ? language === "zh"
                ? activeZone.name_zh
                : activeZone.name_en
              : ""}
            {" · "}
            {currentDepthMeters}m
          </span>
          <button
            type="button"
            className="text-[8px] text-white/50"
            onClick={() => setMobileSheetOpen(true)}
          >
            {dict.tapToExpand}
          </button>
        </div>

        {/* Full map bottom sheet */}
        <MobileMapSheet
          open={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          zones={zoneProgress}
          currentDepthMeters={currentDepthMeters}
          language={language}
          discoveredZones={discoveredZones}
          reduced={reduced}
          dict={dict}
        />
      </div>
    </>
  );
}
