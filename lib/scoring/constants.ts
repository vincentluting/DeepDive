// ============================================================
// Scoring Constants — v2.0
// Label maps, color tables, value labels (bilingual)
// All scoring LOGIC is in score-*.ts modules.
// ============================================================

import type {
  SchwartzValue,
  CrossCulturalType,
  RIASECDimension,
  BigFiveDimension,
} from "../types";

// ============================================================
// Archetype Map (12-type: RIASEC × ValueOrientation)
// Enhancement = Self-Enhancement (Schwartz: Achievement + Power)
// Transcendence = Self-Transcendence (Schwartz: Benevolence + Universalism)
// ============================================================

export interface ArchetypeMapEntry {
  label_zh: string;
  label_en: string;
  tagline_zh: string;
  tagline_en: string;
}

// 12-type archetype map: `${primary}-${orientation}` → label data
export const ARCHETYPE_MAP: Record<string, ArchetypeMapEntry> = {
  // R 造物 — builds for excellence vs builds for service
  "R-enhancement": {
    label_zh: "工程专家",
    label_en: "Architect",
    tagline_zh: "用极致工艺赢得竞争优势",
    tagline_en: "Winning through engineering excellence",
  },
  "R-transcendence": {
    label_zh: "主心骨",
    label_en: "Backbone",
    tagline_zh: "离了我就塌的那个人",
    tagline_en: "The one everything stands on",
  },
  // I 探知 — knowledge as weapon vs knowledge as light
  "I-enhancement": {
    label_zh: "战略家",
    label_en: "Tactician",
    tagline_zh: "信息就是弹药，知识就是权力",
    tagline_en: "Turning information into strategic advantage",
  },
  "I-transcendence": {
    label_zh: "科学家",
    label_en: "Researcher",
    tagline_zh: "不到真相不罢休",
    tagline_en: "Relentless in the pursuit of truth",
  },
  // A 创意 — create to be seen vs create to be felt
  "A-enhancement": {
    label_zh: "C位",
    label_en: "Icon",
    tagline_zh: "我的作品就是要被看见",
    tagline_en: "Creating to be seen and remembered",
  },
  "A-transcendence": {
    label_zh: "追梦人",
    label_en: "Dreamweaver",
    tagline_zh: "我的作品要让你不想醒来",
    tagline_en: "Creating dreams that touch the soul",
  },
  // S 联结 — empower others vs heal others
  "S-enhancement": {
    label_zh: "伯乐",
    label_en: "Mentor",
    tagline_zh: "我一眼看出你是千里马",
    tagline_en: "Spotting hidden potential in everyone",
  },
  "S-transcendence": {
    label_zh: "疗愈师",
    label_en: "Healer",
    tagline_zh: "靠近我就会好起来",
    tagline_en: "Healing through deep empathy and presence",
  },
  // E 驱动 — win the game vs change the game
  "E-enhancement": {
    label_zh: "王牌",
    label_en: "Ace",
    tagline_zh: "看到机会就下注，从零到一",
    tagline_en: "Seizing opportunity, building from zero to one",
  },
  "E-transcendence": {
    label_zh: "先驱",
    label_en: "Pioneer",
    tagline_zh: "不只赢，要改游戏规则",
    tagline_en: "Not just winning — rewriting the rules",
  },
  // C 秩序 — order as power vs order as justice
  "C-enhancement": {
    label_zh: "总指挥",
    label_en: "Commander",
    tagline_zh: "混乱到我手里就变秩序",
    tagline_en: "Turning chaos into precision",
  },
  "C-transcendence": {
    label_zh: "仲裁人",
    label_en: "Arbiter",
    tagline_zh: "规则面前，所有人一样",
    tagline_en: "Ensuring fairness for everyone",
  },
};

// ============================================================
// Schwartz Value Labels (10 types — bilingual)
// ============================================================

export const SCHWARTZ_VALUE_LABELS: Record<
  SchwartzValue,
  { zh: string; en: string }
> = {
  achievement: { zh: "成就与认可", en: "Achievement" },
  power: { zh: "影响力与地位", en: "Power" },
  stimulation: { zh: "刺激与新体验", en: "Stimulation" },
  "self-direction": { zh: "自我导向与独立", en: "Self-Direction" },
  hedonism: { zh: "创造与表达", en: "Hedonism" },
  benevolence: { zh: "帮助身边的人", en: "Benevolence" },
  universalism: { zh: "普世关怀与公正", en: "Universalism" },
  conformity: { zh: "规范与合规", en: "Conformity" },
  tradition: { zh: "传统与使命感", en: "Tradition" },
  security: { zh: "安全与稳定", en: "Security" },
};

// ============================================================
// Cross-Cultural Labels (bilingual)
// ============================================================

export const CROSS_CULTURAL_LABELS: Record<
  CrossCulturalType,
  { zh: string; en: string }
> = {
  bridge: { zh: "桥梁型", en: "Bridge" },
  integrate: { zh: "融入型", en: "Integrator" },
  root: { zh: "根基型", en: "Rooted" },
  global: { zh: "全球型", en: "Global" },
};

// ============================================================
// Collaboration Style Colors  (derived from Big Five via layer3-derive.ts)
// Brand names: D=引领型(Leading), I=激发型(Inspiring), S=稳健型(Anchoring), C=精研型(Refining)
// Keys D/I/S/C are internal identifiers retained for DB compatibility.
// ============================================================

/** Collaboration Style colors and brand names for UI rendering. */
export const COLLAB_STYLE_COLORS: Record<
  string,
  { hex: string; name_zh: string; name_en: string }
> = {
  D: { hex: "#E74C3C", name_zh: "引领", name_en: "Leading" },
  I: { hex: "#F1C40F", name_zh: "激发", name_en: "Inspiring" },
  S: { hex: "#2ECC71", name_zh: "稳健", name_en: "Anchoring" },
  C: { hex: "#3498DB", name_zh: "精研", name_en: "Refining" },
};

// ============================================================
// RIASEC Brand Colors
// ============================================================

export const RIASEC_BRAND_COLORS: Record<
  RIASECDimension,
  { hex: string; brandKey_zh: string; brandKey_en: string }
> = {
  R: { hex: "#34D399", brandKey_zh: "建造", brandKey_en: "Build" },
  I: { hex: "#60A5FA", brandKey_zh: "解码", brandKey_en: "Decode" },
  A: { hex: "#A78BFA", brandKey_zh: "创造", brandKey_en: "Create" },
  S: { hex: "#FBBF24", brandKey_zh: "连接", brandKey_en: "Connect" },
  E: { hex: "#F87171", brandKey_zh: "驱动", brandKey_en: "Drive" },
  C: { hex: "#2DD4BF", brandKey_zh: "构架", brandKey_en: "Structure" },
};

// ============================================================
// Big Five Domain Labels (bilingual)
// ============================================================

export const BIG_FIVE_LABELS: Record<
  BigFiveDimension,
  { zh: string; en: string; shortZh: string; shortEn: string }
> = {
  openness: { zh: "开放性", en: "Openness", shortZh: "开放", shortEn: "O" },
  conscientiousness: {
    zh: "尽责性",
    en: "Conscientiousness",
    shortZh: "尽责",
    shortEn: "C",
  },
  extraversion: {
    zh: "外向性",
    en: "Extraversion",
    shortZh: "外向",
    shortEn: "E",
  },
  agreeableness: {
    zh: "宜人性",
    en: "Agreeableness",
    shortZh: "宜人",
    shortEn: "A",
  },
  neuroticism: {
    zh: "敏感性",
    en: "Sensitivity",
    shortZh: "敏感",
    shortEn: "N",
  },
};

// ============================================================
// v2.0 Scoring Constants
// ============================================================

/** Minimum response time (ms) to not be flagged as rushing */
export const RUSH_THRESHOLD_MS = {
  sjt: 3000, // SJT scenarios need reading time
  pvq: 1500, // PVQ items are short person descriptions
  ipip: 1200, // IPIP items are single statements
};

/** IPIP-NEO-120 reverse scoring: raw → 6 - raw */
export const IPIP_REVERSE_CONSTANT = 6;
