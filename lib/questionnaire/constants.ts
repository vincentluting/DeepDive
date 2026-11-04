// ============================================================
// Questionnaire Constants — v3.0 module-based questionnaire
// ============================================================

import type { ModuleInfo } from "@/lib/types";

// ============================================================
// Questionnaire Version
// ============================================================

export const QUESTIONNAIRE_VERSION = "3.0";

/** Scored questions only (6 SJT + 20 TwIVI + 60 IPIP-60). Reality Snapshot counted separately. */
export const TOTAL_QUESTIONS = 86;

export const MODULE_INFO: Record<string, ModuleInfo> = {
  A: {
    code: "A",
    name_en: "Scenario Exploration",
    name_zh: "场景探索",
    questionCount: 6,
    estimatedMinutes: 4,
  },
  B: {
    code: "B",
    name_en: "Values Portrait",
    name_zh: "价值画像",
    questionCount: 20,
    estimatedMinutes: 5,
  },
  C: {
    code: "C",
    name_en: "Personality Profile",
    name_zh: "人格画像",
    questionCount: 60,
    estimatedMinutes: 11,
  },
  R: {
    code: "R",
    name_en: "Your Reality",
    name_zh: "你的现实",
    questionCount: 0,
    estimatedMinutes: 2,
  },
};

// IPIP-NEO-120 chapter pacing (retained for Ultra-Deep, not used in v3.0 Deep Dive)
export const IPIP_CHAPTERS = [
  {
    id: 1,
    items: [1, 24] as const,
    title_en: "Emotions & social situations",
    title_zh: "情绪和社交",
    minutes: 3,
  },
  {
    id: 2,
    items: [25, 48] as const,
    title_en: "Your thinking style",
    title_zh: "思维风格",
    minutes: 3,
  },
  {
    id: 3,
    items: [49, 72] as const,
    title_en: "How you relate to others",
    title_zh: "人际关系",
    minutes: 3,
  },
  {
    id: 4,
    items: [73, 96] as const,
    title_en: "Work and goals",
    title_zh: "工作和目标",
    minutes: 3,
  },
  {
    id: 5,
    items: [97, 120] as const,
    title_en: "Daily patterns",
    title_zh: "日常模式",
    minutes: 2,
  },
];

// Micro-insight trigger points (Variable Reward Scheduling)
export const MICRO_INSIGHT_TRIGGERS = {
  afterSJT: true, // After Module A: initial tension glimpse
  afterPVQ_item12: true, // After PVQ-21 item 12: top 2 value drivers preview
  afterIPIP_chapter: [1, 2, 3], // After IPIP chapters 1, 2, and 3: personality insights (Ultra-Deep)
};

// Depth colors for all modules (v3.0: 4 zones)
export const MODULE_DEPTH_COLORS: Record<
  string,
  { bg: string; depth: string; label_en: string; label_zh: string }
> = {
  A: {
    bg: "#0A2D3D",
    depth: "200m",
    label_en: "Scenario Depths",
    label_zh: "场景深流",
  },
  B: {
    bg: "#071E2A",
    depth: "800m",
    label_en: "Value Depths",
    label_zh: "价值深流",
  },
  C: {
    bg: "#041520",
    depth: "1500m",
    label_en: "Personality Bedrock",
    label_zh: "人格基岩",
  },
  R: {
    bg: "#020C13",
    depth: "2000m",
    label_en: "Reality Anchor",
    label_zh: "现实锚点",
  },
};

// ============================================================
// Ocean Exploration Map — Zone Configuration
// ============================================================

export interface OceanZone {
  id: string;
  moduleCode: string;
  name_en: string;
  name_zh: string;
  depthStart: number;
  depthEnd: number;
  colorPrimary: string;
  colorGlow: string;
  tier: "deep" | "ultra";
  icon: string;
  flavor_en: string;
  flavor_zh: string;
}

export const ZONE_CONFIG: OceanZone[] = [
  {
    id: "coral-reef",
    moduleCode: "A",
    name_en: "Coral Reef",
    name_zh: "珊瑚礁",
    depthStart: 0,
    depthEnd: 200,
    colorPrimary: "#38BDF8",
    colorGlow: "rgba(56, 189, 248, 0.3)",
    tier: "deep",
    icon: "",
    flavor_en: "Observe your instincts in action",
    flavor_zh: "观察你的本能反应",
  },
  {
    id: "kelp-forest",
    moduleCode: "B",
    name_en: "Kelp Forest",
    name_zh: "海藻林",
    depthStart: 200,
    depthEnd: 600,
    colorPrimary: "#2DD4BF",
    colorGlow: "rgba(45, 212, 191, 0.25)",
    tier: "deep",
    icon: "",
    flavor_en: "Discover the values guiding your decisions",
    flavor_zh: "发现指引你决定的核心价值观",
  },
  {
    id: "open-ocean",
    moduleCode: "C",
    name_en: "Open Ocean",
    name_zh: "远洋区",
    depthStart: 600,
    depthEnd: 1200,
    colorPrimary: "#3B82F6",
    colorGlow: "rgba(59, 130, 246, 0.2)",
    tier: "deep",
    icon: "",
    flavor_en: "Map the dimensions of your personality",
    flavor_zh: "绘制你人格的广阔维度",
  },
  {
    id: "hydrothermal-vent",
    moduleCode: "IPIP60",
    name_en: "Hydrothermal Vent",
    name_zh: "热泉口",
    depthStart: 2000,
    depthEnd: 4000,
    colorPrimary: "#F97316",
    colorGlow: "rgba(249, 115, 22, 0.15)",
    tier: "ultra",
    icon: "",
    flavor_en: "Research-grade personality depth",
    flavor_zh: "研究级人格深度分析",
  },
  {
    id: "hadal-trench",
    moduleCode: "ADDITIONAL",
    name_en: "Hadal Trench",
    name_zh: "超深海沟",
    depthStart: 4000,
    depthEnd: 6000,
    colorPrimary: "#A855F7",
    colorGlow: "rgba(168, 85, 247, 0.12)",
    tier: "ultra",
    icon: "",
    flavor_en: "Advanced career and adaptability scales",
    flavor_zh: "高级职业与适应力量表",
  },
];

export function getZonesForTier(tier: "deep" | "ultra"): OceanZone[] {
  if (tier === "ultra") return ZONE_CONFIG;
  return ZONE_CONFIG.filter((z) => z.tier === "deep");
}

export function getZoneForModule(moduleCode: string): OceanZone | undefined {
  return ZONE_CONFIG.find((z) => z.moduleCode === moduleCode);
}
