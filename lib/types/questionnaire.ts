// ============================================================
// Deep Dive — Questionnaire Type Definitions
// ============================================================
// Module-based questionnaire system (SJT + TwIVI/PVQ-21 + IPIP-NEO-120)
// ============================================================

import type {
  BigFiveDimension,
  SchwartzValue,
} from './dimensions';

// ============================================================
// Module-based Questionnaire Types
// ============================================================

// ========== SJT (Module A) ==========

export interface SJTScenario {
  id: number;                       // 1-6
  channelName: string;              // e.g. '#project-kickoff'
  channelName_zh: string;           // e.g. '#项目启动'
  channelName_nl?: string;
  channelName_de?: string;
  channelName_fr?: string;
  channelName_es?: string;
  channelName_pt?: string;
  channelName_it?: string;
  channelName_ru?: string;
  channelName_ja?: string;
  channelName_ko?: string;
  messages: ChatMessage[];          // dialogue message sequence
  systemPrompt_en: string;          // system prompt shown after dialogue
  systemPrompt_zh: string;
  systemPrompt_nl?: string;
  systemPrompt_de?: string;
  systemPrompt_fr?: string;
  systemPrompt_es?: string;
  systemPrompt_pt?: string;
  systemPrompt_it?: string;
  systemPrompt_ru?: string;
  systemPrompt_ja?: string;
  systemPrompt_ko?: string;
  options: SJTOption[];             // 4 options A-D
  scoringMap: Record<string, number>;           // option id → score (primary domain)
  scoringMapSecondary?: Record<string, number>; // SJT-6: secondary domain scoring
  mappedDomain: string;             // 'extraversion' | 'agreeableness' etc.
  mappedDomainSecondary?: string;   // SJT-6: 'agreeableness'
  // Micro-insight copy
  microInsight: {
    tension_en: string;             // shown when should ≠ would
    tension_zh: string;
    tension_nl?: string;
    tension_de?: string;
    tension_fr?: string;
    tension_es?: string;
    tension_pt?: string;
    tension_it?: string;
    tension_ru?: string;
    tension_ja?: string;
    tension_ko?: string;
    consistent_en: string;          // shown when should = would
    consistent_zh: string;
    consistent_nl?: string;
    consistent_de?: string;
    consistent_fr?: string;
    consistent_es?: string;
    consistent_pt?: string;
    consistent_it?: string;
    consistent_ru?: string;
    consistent_ja?: string;
    consistent_ko?: string;
    special?: {                     // optional special micro-insight (e.g. SJT-4 option D)
      trigger: string;              // option id that triggers this
      message_en: string;
      message_zh: string;
      message_nl?: string;
      message_de?: string;
      message_fr?: string;
      message_es?: string;
      message_pt?: string;
      message_it?: string;
      message_ru?: string;
      message_ja?: string;
      message_ko?: string;
    };
  };
}

export interface ChatMessage {
  sender: string;                   // character name
  avatar: string;                   // avatar identifier (e.g. 'pm', 'member', 'boss')
  content_en: string;
  content_zh: string;
  content_nl?: string;
  content_de?: string;
  content_fr?: string;
  content_es?: string;
  content_pt?: string;
  content_it?: string;
  content_ru?: string;
  content_ja?: string;
  content_ko?: string;
  isSystem?: boolean;               // system prompt message (different styling)
}

export interface SJTOption {
  id: 'A' | 'B' | 'C' | 'D';
  label_en: string;
  label_zh: string;
  label_nl?: string;
  label_de?: string;
  label_fr?: string;
  label_es?: string;
  label_pt?: string;
  label_it?: string;
  label_ru?: string;
  label_ja?: string;
  label_ko?: string;
}

// ========== PVQ-21 (Module B) ==========

export interface PVQItem {
  id: number;                       // 1-21 (ESS standard numbering)
  text_en: string;                  // English item text (male version)
  text_zh: string;                  // Chinese item text (gender-neutral)
  text_en_female: string;           // English item text (female version)
  valueType: SchwartzValue;         // mapped Schwartz value type
}

// ========== IPIP-NEO-120 (Module C) ==========

export interface IPIPItem {
  id: number;                       // 1-120 (Johnson standard numbering)
  text_en: string;
  text_zh: string;
  text_nl?: string;
  text_de?: string;
  text_fr?: string;
  text_es?: string;
  text_pt?: string;
  text_it?: string;
  text_ru?: string;
  text_ja?: string;
  text_ko?: string;
  domain: BigFiveDimension;         // N, E, O, A, C
  facet: string;                    // e.g. 'N1_Anxiety'
  isReversed: boolean;              // reverse-scored item
}

// ========== Answer Types ==========

export type AnswerValue =
  | { type: 'sjt'; wouldChoice: string; shouldChoice: string }
  | { type: 'pvq'; rating: number }     // 1-6 (v2.0 legacy)
  | { type: 'ddvq'; rating: number }    // 1-6 (v3.0 TwIVI)
  | { type: 'ipip'; rating: number }    // 1-5
  | { type: 'riasec'; rating: number }; // 1-5 (Mini-IP Likert)

// ========== Module Info ==========

export type ModuleCode = 'A' | 'B' | 'C' | 'R';

export interface ModuleInfo {
  code: ModuleCode;
  name_en: string;
  name_zh: string;
  questionCount: number;
  estimatedMinutes: number;
}

// ============================================================
// Ocean Exploration — Zone Timeline (persisted to DB)
// ============================================================

/** Full zone timeline — keyed by zone ID from ZONE_CONFIG */
export type ZoneTimeline = Record<string, {
  startedAt: number | null;
  completedAt: number | null;
  timeSpentMs: number;
  discoveries: string[];
}>;
