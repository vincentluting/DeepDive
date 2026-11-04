"use client";

import { motion } from "framer-motion";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import {
  MODULE_META,
  MODULE_SEQUENCE,
  DEPTH_ZONES,
  SIDE_QUESTS,
  type ModuleKey,
  type SideQuestMeta,
} from "@/lib/exploration/depth-calculator";

// ── Derive UI modules from depth-calculator (single source of truth) ────

type ZoneId = (typeof DEPTH_ZONES)[number]["id"];

export interface Module {
  id: string;
  label: Record<string, string>;
  time?: string;
  depth: number;
  zone: ZoneId;
}

/** Assign a module to a zone based on its cumulative depth. */
function getZoneForDepth(cumulativeDepth: number): ZoneId {
  let result: ZoneId = DEPTH_ZONES[0].id;
  for (const zone of DEPTH_ZONES) {
    if (cumulativeDepth >= zone.minDepth) {
      result = zone.id;
    }
  }
  return result;
}

/** Derived from MODULE_META — no manual sync needed. */
const MODULES: Module[] = MODULE_SEQUENCE.map((key: ModuleKey) => {
  const meta = MODULE_META[key];
  return {
    id: meta.id,
    label: meta.label,
    time: meta.time,
    depth: meta.cumulativeDepth,
    zone: getZoneForDepth(meta.cumulativeDepth),
  };
});

/** Side quests indexed by parent module ID for quick lookup. */
const SIDE_QUEST_BY_PARENT = new Map<string, SideQuestMeta[]>();
for (const sq of SIDE_QUESTS) {
  const parentId = MODULE_META[sq.parentModule].id;
  const existing = SIDE_QUEST_BY_PARENT.get(parentId) ?? [];
  existing.push(sq);
  SIDE_QUEST_BY_PARENT.set(parentId, existing);
}

/** Only zones that have at least one module. */
const ACTIVE_ZONES = [...new Set(MODULES.map((m) => m.zone))] as ZoneId[];

const ZONE_LABELS: Record<
  string,
  { label: Record<string, string>; range: string; minDepth: number }
> = {};
for (const zone of DEPTH_ZONES) {
  const nextZone = DEPTH_ZONES[DEPTH_ZONES.indexOf(zone) + 1];
  const range = nextZone
    ? `${zone.minDepth.toLocaleString()} – ${nextZone.minDepth.toLocaleString()}m`
    : `${zone.minDepth.toLocaleString()}m+`;
  ZONE_LABELS[zone.id] = {
    label: zone.label as Record<string, string>,
    range,
    minDepth: zone.minDepth,
  };
}

// ── Depth → node color (warm surface → cool abyss) ────────────────────────

function nodeColor(depth: number): string {
  const r = depth / 3000;
  if (r < 0.12) return "#C4956A";
  if (r < 0.25) return "#A09478";
  if (r < 0.42) return "#6E8E96";
  if (r < 0.65) return "#3E7D8E";
  return "#1B5E6B";
}

// ── Types ──────────────────────────────────────────────────────────────────

interface DepthJourneyProps {
  depth: number;
  completedModules: string[];
  locale: Locale | string;
}

function resolveLocale(locale: Locale | string): Locale {
  return typeof locale === "string" && isValidLocale(locale)
    ? locale
    : defaultLocale;
}

// ── Component ──────────────────────────────────────────────────────────────

export function DepthJourney({
  depth,
  completedModules,
  locale,
}: DepthJourneyProps) {
  const localeStr = resolveLocale(locale);
  const dt = getDictionaryClient(localeStr).dashboardPage as Record<
    string,
    string
  >;

  // Group modules by zone
  const grouped = MODULES.reduce<Record<string, Module[]>>((acc, mod) => {
    if (!acc[mod.zone]) acc[mod.zone] = [];
    acc[mod.zone].push(mod);
    return acc;
  }, {});

  return (
    <div>
      {ACTIVE_ZONES.map((zoneId, zi) => {
        const zone = ZONE_LABELS[zoneId];
        if (!zone) return null;
        const mods = grouped[zoneId] ?? [];
        const reached = depth >= zone.minDepth;

        return (
          <motion.div
            key={zoneId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: zi * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ marginBottom: zi < ACTIVE_ZONES.length - 1 ? 28 : 0 }}
          >
            {/* Zone header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(10,26,47,0.06)",
                opacity: reached ? 1 : 0.32,
                transition: "opacity 0.6s",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
                className={reached ? "text-primary" : "text-muted-foreground"}
              >
                {pickLocaleText(zone.label, localeStr)}
              </span>
              <span
                className="font-mono text-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {zone.range}
              </span>
            </div>

            {/* Module rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {mods.map((mod) => {
                const isDone = completedModules.includes(mod.id);
                const modIdx = MODULES.indexOf(mod);
                const prevMod = MODULES[modIdx - 1];
                const isNext =
                  !isDone &&
                  (modIdx === 0 ||
                    completedModules.includes(prevMod?.id ?? ""));
                const isLocked = !isDone && !isNext;
                const nc = nodeColor(mod.depth);
                const sideQuests = SIDE_QUEST_BY_PARENT.get(mod.id);

                return (
                  <div key={mod.id}>
                    {/* Main module row */}
                    <MainModuleRow
                      mod={mod}
                      isDone={isDone}
                      isNext={isNext}
                      isLocked={isLocked}
                      nc={nc}
                      localeStr={localeStr}
                    />

                    {/* Side quest branches */}
                    {sideQuests &&
                      sideQuests.map((sq) => {
                        const sqDone = completedModules.includes(sq.id);
                        const sqAvailable = isDone; // parent must be done
                        const sqLocked = !sqDone && !sqAvailable;

                        return (
                          <SideQuestRow
                            key={sq.key}
                            sq={sq}
                            isDone={sqDone}
                            isLocked={sqLocked}
                            localeStr={localeStr}
                            optionalLabel={dt.sideQuestOptional}
                          />
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main module row ────────────────────────────────────────────────────────

function MainModuleRow({
  mod,
  isDone,
  isNext,
  isLocked,
  nc,
  localeStr,
}: {
  mod: Module;
  isDone: boolean;
  isNext: boolean;
  isLocked: boolean;
  nc: string;
  localeStr: Locale;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 12px",
        borderRadius: 12,
        background: isNext ? "rgba(8,112,174,0.08)" : "transparent",
        border: isNext
          ? "1px solid rgba(8,112,174,0.12)"
          : "1px solid transparent",
        opacity: isLocked ? 0.28 : 1,
        transition: "all 0.35s ease",
      }}
    >
      {/* Node circle */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDone ? nc : "transparent",
          border: isDone
            ? `1.5px solid ${nc}`
            : isNext
              ? "1.5px solid var(--primary)"
              : "1.5px solid #9EACB9",
          boxShadow: isDone ? `0 0 8px ${nc}22` : "none",
          transition: "all 0.35s ease",
        }}
      >
        {isDone && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5.5L4 7.5L8 3"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Module name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: isNext ? 600 : isDone ? 500 : 400,
            letterSpacing: "-0.01em",
          }}
          className={
            isDone || isNext ? "text-foreground" : "text-muted-foreground"
          }
        >
          {pickLocaleText(mod.label, localeStr)}
        </span>
      </div>

      {/* Meta: time + depth */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {mod.time && !isDone && !isLocked && (
          <span className="text-muted-foreground" style={{ fontSize: 10 }}>
            {mod.time}
          </span>
        )}
        <span
          className="font-mono text-muted-foreground"
          style={{
            fontSize: 10,
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {mod.depth}m
        </span>
      </div>
    </div>
  );
}

// ── Side quest row (branching visual) ──────────────────────────────────────

function SideQuestRow({
  sq,
  isDone,
  isLocked,
  localeStr,
  optionalLabel,
}: {
  sq: SideQuestMeta;
  isDone: boolean;
  isLocked: boolean;
  localeStr: Locale;
  optionalLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 12px 6px 28px", // indented from parent
        opacity: isLocked ? 0.22 : isDone ? 0.7 : 0.55,
        transition: "all 0.35s ease",
      }}
    >
      {/* Branch connector */}
      <div
        style={{
          width: 12,
          height: 1,
          borderTop: "1px dashed #9EACB9",
          flexShrink: 0,
        }}
      />

      {/* Small node */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDone ? "#A09478" : "transparent",
          border: isDone ? "1px solid #A09478" : "1px dashed #9EACB9",
          transition: "all 0.35s ease",
        }}
      >
        {isDone && (
          <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5.5L4 7.5L8 3"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 400,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
          flex: 1,
        }}
        className="text-muted-foreground"
      >
        {pickLocaleText(sq.label, localeStr)}
      </span>

      {/* Time + optional badge */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        {!isDone && !isLocked && sq.time && (
          <span className="text-muted-foreground" style={{ fontSize: 9 }}>
            {sq.time}
          </span>
        )}
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
          className="text-muted-foreground"
        >
          {optionalLabel}
        </span>
      </div>
    </div>
  );
}

// Re-export MODULES so other components (e.g. ContinueCard) can share the same data
export { MODULES };
