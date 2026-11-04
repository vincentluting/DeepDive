// ============================================================
// CoachingContextRetriever — unified evidence packet for the coach
// ============================================================

import type { CoachingHypothesisForPrompt } from "./hypothesis-memory";

export type CoachingEvidenceSource =
  | "current_turn"
  | "user_memory"
  | "coaching_theme"
  | "coaching_hypothesis"
  | "report"
  | "profile"
  | "reality_conditions"
  | "guided_exercise"
  | "action_hub"
  | "session_summary";

export interface CoachingEvidenceItem {
  text: string;
  source: CoachingEvidenceSource;
  reason: string;
}

export interface CoachingContextEvidencePacket {
  currentTurnEvidence: CoachingEvidenceItem[];
  relevantReportSignals: CoachingEvidenceItem[];
  confirmedUserPatterns: CoachingEvidenceItem[];
  openHypotheses: CoachingEvidenceItem[];
  actionHubSignals: CoachingEvidenceItem[];
  realityConstraints: CoachingEvidenceItem[];
}

export interface BuildCoachingContextEvidencePacketParams {
  latestUserMessage: string;
  userMemorySignals?: string[];
  themeSignals?: string[];
  hypotheses?: CoachingHypothesisForPrompt[];
  reportSignals?: string[];
  profileNarratives?: string[];
  realityConstraints?: string[];
  exerciseSignals?: string[];
  actionHubSignals?: string[];
  recentSessionSummaries?: string[];
  maxItems?: number;
}

const EMPTY_PACKET: CoachingContextEvidencePacket = {
  currentTurnEvidence: [],
  relevantReportSignals: [],
  confirmedUserPatterns: [],
  openHypotheses: [],
  actionHubSignals: [],
  realityConstraints: [],
};

// 360 (was 220): 220 chars fragmented complex multi-constraint messages
// (e.g. career-switch + visa + family + skill-gap) into unusable slivers.
function compact(text: string, max = 360): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function cloneEmptyPacket(): CoachingContextEvidencePacket {
  return {
    currentTurnEvidence: [],
    relevantReportSignals: [],
    confirmedUserPatterns: [],
    openHypotheses: [],
    actionHubSignals: [],
    realityConstraints: [],
  };
}

function totalItems(packet: CoachingContextEvidencePacket): number {
  return Object.values(packet).reduce((sum, items) => sum + items.length, 0);
}

function addItem(
  packet: CoachingContextEvidencePacket,
  key: keyof CoachingContextEvidencePacket,
  item: CoachingEvidenceItem,
  maxItems: number,
): void {
  if (!item.text || totalItems(packet) >= maxItems) return;
  packet[key].push({ ...item, text: compact(item.text) });
}

function addSignals(params: {
  packet: CoachingContextEvidencePacket;
  key: keyof CoachingContextEvidencePacket;
  signals: string[] | undefined;
  source: CoachingEvidenceSource;
  reason: string;
  maxItems: number;
}): void {
  for (const signal of params.signals ?? []) {
    addItem(
      params.packet,
      params.key,
      { text: signal, source: params.source, reason: params.reason },
      params.maxItems,
    );
  }
}

export function buildCoachingContextEvidencePacket(
  params: BuildCoachingContextEvidencePacketParams,
): CoachingContextEvidencePacket {
  // 14 (was 8): an 8-item cap let memory + current-turn evidence fill every
  // slot, starving report/reality/profile signals (the practical constraints
  // a user actually needs the coach to honor). Sonnet's context is far larger.
  const maxItems = Math.max(5, Math.min(params.maxItems ?? 14, 14));
  const packet = cloneEmptyPacket();
  const latest = compact(params.latestUserMessage);

  if (latest) {
    addItem(
      packet,
      "currentTurnEvidence",
      {
        text: latest,
        source: "current_turn",
        reason: "latest user message anchors this turn",
      },
      maxItems,
    );
  }

  addSignals({
    packet,
    key: "confirmedUserPatterns",
    signals: params.userMemorySignals,
    source: "user_memory",
    reason: "stored memory related to the user's long-term pattern",
    maxItems,
  });
  addSignals({
    packet,
    key: "confirmedUserPatterns",
    signals: params.themeSignals,
    source: "coaching_theme",
    reason: "recurring coaching theme from past sessions",
    maxItems,
  });

  for (const hypothesis of params.hypotheses ?? []) {
    if (hypothesis.status === "confirmed") {
      addItem(
        packet,
        "confirmedUserPatterns",
        {
          text: hypothesis.hypothesis,
          source: "coaching_hypothesis",
          reason: "user-confirmed hypothesis",
        },
        maxItems,
      );
    } else if (hypothesis.status === "active") {
      addItem(
        packet,
        "openHypotheses",
        {
          text: hypothesis.hypothesis,
          source: "coaching_hypothesis",
          reason: "tentative hypothesis to test, not a fact",
        },
        maxItems,
      );
    }
  }

  // Action signals are part of the coaching loop, so keep them before broader
  // report/profile evidence when the item cap is tight.
  addSignals({
    packet,
    key: "actionHubSignals",
    signals: params.actionHubSignals,
    source: "action_hub",
    reason: "active or pending action item",
    maxItems,
  });
  addSignals({
    packet,
    key: "actionHubSignals",
    signals: params.recentSessionSummaries,
    source: "session_summary",
    reason: "recent coaching session summary",
    maxItems,
  });

  addSignals({
    packet,
    key: "relevantReportSignals",
    signals: params.reportSignals,
    source: "report",
    reason: "report evidence relevant to this turn",
    maxItems,
  });
  addSignals({
    packet,
    key: "relevantReportSignals",
    signals: params.profileNarratives,
    source: "profile",
    reason: "profile narrative signal",
    maxItems,
  });
  addSignals({
    packet,
    key: "realityConstraints",
    signals: params.realityConstraints,
    source: "reality_conditions",
    reason: "practical constraint that should shape coaching",
    maxItems,
  });
  addSignals({
    packet,
    key: "realityConstraints",
    signals: params.exerciseSignals,
    source: "guided_exercise",
    reason: "guided exercise completed by the user",
    maxItems,
  });

  return totalItems(packet) > 0 ? packet : EMPTY_PACKET;
}

function renderItems(title: string, items: CoachingEvidenceItem[]): string[] {
  if (items.length === 0) return [];
  return [
    `- ${title}:`,
    ...items.map(
      (item) =>
        `  • ${item.text} (source=${item.source}; reason=${item.reason})`,
    ),
  ];
}

export function buildCoachingEvidencePacketSection(
  packet: CoachingContextEvidencePacket,
  locale: string,
): string {
  if (totalItems(packet) === 0) return "";

  if (locale === "zh") {
    return [
      "\n## 可用证据包（内部使用，不要逐字展示）",
      "只使用与本轮最相关的证据。每次回复至少锚定一条 evidence；openHypotheses 只能试探，不能当事实。",
      ...renderItems("currentTurnEvidence", packet.currentTurnEvidence),
      ...renderItems("relevantReportSignals", packet.relevantReportSignals),
      ...renderItems("confirmedUserPatterns", packet.confirmedUserPatterns),
      ...renderItems("openHypotheses", packet.openHypotheses),
      ...renderItems("actionHubSignals", packet.actionHubSignals),
      ...renderItems("realityConstraints", packet.realityConstraints),
    ].join("\n");
  }

  return [
    "\n## Available Evidence Packet (internal, do not display verbatim)",
    "Use only the evidence most relevant to this turn. Anchor every reply in at least one evidence item; openHypotheses are tentative, not facts.",
    ...renderItems("currentTurnEvidence", packet.currentTurnEvidence),
    ...renderItems("relevantReportSignals", packet.relevantReportSignals),
    ...renderItems("confirmedUserPatterns", packet.confirmedUserPatterns),
    ...renderItems("openHypotheses", packet.openHypotheses),
    ...renderItems("actionHubSignals", packet.actionHubSignals),
    ...renderItems("realityConstraints", packet.realityConstraints),
  ].join("\n");
}
