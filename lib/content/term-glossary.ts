// lib/content/term-glossary.ts
// Deep Dive — Term Glossary for Interactive Tooltips
// 品牌概念术语定义字典（中英双版本）
// 仅使用品牌语言，不暴露理论框架名称
import type { Locale } from '@/lib/i18n/config';

export interface TermDefinition {
  id: string;
  term_zh: string;
  term_en: string;
  term_nl?: string;
  definition_zh: string;
  definition_en: string;
  definition_nl?: string;
}

export const TERM_GLOSSARY: Record<string, TermDefinition> = {
  // ── 核心维度 ──────────────────────────────────

  interestProfile: {
    id: 'interestProfile',
    term_zh: '兴趣图谱',
    term_en: 'Interest Profile',
    definition_zh: '你在六个核心方向上的兴趣分布：构建、解码、创造、连接、驱动、结构化。它反映的是你自然被吸引的领域，而不是你擅长什么。',
    definition_en: 'Your interest distribution across six core directions: Build, Decode, Create, Connect, Drive, and Structure. This reflects what naturally attracts you, not what you\'re good at.',
  },

  valueAnchors: {
    id: 'valueAnchors',
    term_zh: '价值锚',
    term_en: 'Value Anchors',
    definition_zh: '你在做职业决策时，内心深处最不愿意妥协的3个核心价值。它们像锚一样固定你的方向感——当外部选择让你犹豫时，价值锚帮你判断"这到底值不值"。',
    definition_en: 'The 3 core values you\'re least willing to compromise on in career decisions. They anchor your sense of direction — when external choices leave you uncertain, your value anchors help you judge "is this really worth it."',
  },

  collaboration: {
    id: 'collaboration',
    term_zh: '协作风格',
    term_en: 'Collaboration Style',
    definition_zh: '你在团队中自然表现出的双色协作模式。每个人都有主色和副色——主色是你最舒适的工作方式，副色是你在特定情境下会切换到的模式。颜色渐变表示两种风格的融合程度。',
    definition_en: 'Your natural dual-color collaboration pattern in teams. Everyone has a primary and secondary color — your primary is your most comfortable working style, while the secondary emerges in specific contexts. The gradient shows how these styles blend.',
  },

  crossCultural: {
    id: 'crossCultural',
    term_zh: '跨文化定位',
    term_en: 'Cross-Cultural Positioning',
    definition_zh: '你在不同文化之间的自我定位方式。这不是能力评估，而是你如何看待自己与不同文化的关系：桥梁型在文化间穿梭、融入型整合多元身份、根基型保持文化传承、全球型超越边界思考。',
    definition_en: 'How you position yourself between cultures. This isn\'t a capability assessment, but how you see your relationship with different cultures: Bridge moves between worlds, Integrator blends identities, Rooted stays connected to heritage, Global thinks beyond borders.',
  },

  energyBoundaries: {
    id: 'energyBoundaries',
    term_zh: '能量与边界',
    term_en: 'Energy & Boundaries',
    definition_zh: '什么样的工作环境给你充电，什么样的消耗你。了解你的能量来源和红线，可以帮你避开"看起来很好但做起来痛苦"的职业陷阱。',
    definition_en: 'What work environments energize you and what drains you. Understanding your energy sources and red lines helps you avoid career traps that "look great on paper but feel miserable in practice."',
  },

  adaptability: {
    id: 'adaptability',
    term_zh: '职业适应力',
    term_en: 'Career Adaptability',
    definition_zh: '你应对职业变化和不确定性的内在资源。由四个维度组成：前瞻力（对未来的规划意识）、掌控力（对自身发展的主动性）、探索力（对新可能性的好奇心）、自信力（面对挑战的信心）。',
    definition_en: 'Your inner resources for handling career change and uncertainty. Composed of four dimensions: Future Thinking (planning awareness), Control (proactivity over your development), Curiosity (openness to new possibilities), and Confidence (self-assurance facing challenges).',
  },

  // ── 推力等级 ──────────────────────────────────

  thrustLevel: {
    id: 'thrustLevel',
    term_zh: '推力等级',
    term_en: 'Thrust Level',
    definition_zh: '你当前职业适应力的综合状态。从"热身中"到"全力"，它反映的不是能力高低，而是你现阶段对职业发展的心理准备程度。推力等级会随时间和经历变化。',
    definition_en: 'Your overall career adaptability state right now. From "Warming Up" to "Full Thrust," this reflects not your ability level, but your psychological readiness for career development at this stage. Thrust level changes over time and experience.',
  },

  // ── 跨文化四型 ──────────────────────────────────

  bridgeType: {
    id: 'bridgeType',
    term_zh: '桥梁型',
    term_en: 'Bridge',
    definition_zh: '你在不同文化间穿梭自如，把跨文化经验当作职业优势。你擅长连接不同背景的人和观点。',
    definition_en: 'You move fluidly between cultures, treating cross-cultural experience as a career strength. You excel at connecting people and perspectives from different backgrounds.',
  },

  integrateType: {
    id: 'integrateType',
    term_zh: '融入型',
    term_en: 'Integrator',
    definition_zh: '你将不同文化的元素融合进了自己的新身份。你的力量在于整合——你不是"哪边的人"，而是创造了属于你自己的混合身份。',
    definition_en: 'You\'ve woven elements from different cultures into a new identity. Your strength is integration — you\'re not "from one side," but have created your own blended identity.',
  },

  rootType: {
    id: 'rootType',
    term_zh: '根基型',
    term_en: 'Rooted',
    definition_zh: '你的文化传承是你职业身份的核心部分。你从根基中汲取力量，在熟悉的文化语境中发挥最佳。',
    definition_en: 'Your cultural heritage is central to your professional identity. You draw strength from your roots and perform best in familiar cultural contexts.',
  },

  globalType: {
    id: 'globalType',
    term_zh: '全球型',
    term_en: 'Global',
    definition_zh: '你不特别认同某一文化，而是随情境适应。你的视角天然超越国界，在多元环境中如鱼得水。',
    definition_en: 'You don\'t primarily identify with one culture but adapt to context. Your perspective naturally transcends borders, and you thrive in diverse environments.',
  },

  // ── 性格表达 ──────────────────────────────────

  personalityExpression: {
    id: 'personalityExpression',
    term_zh: '性格表达',
    term_en: 'Personality Expression',
    definition_zh: '基于 Big Five 学术框架推导出的四维认知风格倾向，是 Deep Dive 的原创认知风格模型。帮助你理解自己在关键维度上的自然偏好。四个维度分别是：外向/内向、实感/直觉、思考/情感、判断/感知。注：Deep Dive 的认知风格分析与 MBTI® 是完全不同的测评体系。MBTI® 是 The Myers-Briggs Company 的注册商标。',
    definition_en: 'Four-dimensional cognitive style tendencies derived from the Big Five academic framework — Deep Dive\'s original Cognitive Style model. Helps you understand your natural preferences across key dimensions: Extraversion/Introversion, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving. Note: Deep Dive\'s Cognitive Style Analysis is an entirely different assessment system from MBTI®. MBTI® is a registered trademark of The Myers-Briggs Company.',
  },

  // ── 报告相关概念 ──────────────────────────────────

  confidence: {
    id: 'confidence',
    term_zh: '置信度',
    term_en: 'Confidence Level',
    definition_zh: '我们对这个评估结果的确信程度。高置信度意味着你的回答模式一致性强；中低置信度意味着你可能处于两种类型的交汇处，或者某些维度的数据还不够充分。置信度不代表结果好坏。',
    definition_en: 'How confident we are in this assessment result. High confidence means your response patterns were highly consistent; medium-low confidence means you might be at the intersection of two types, or some dimensions need more data. Confidence doesn\'t indicate good or bad results.',
  },

  fluidityNote: {
    id: 'fluidityNote',
    term_zh: '流动性说明',
    term_en: 'Fluidity Note',
    definition_zh: '你的类型不是固定标签。随着你的经历、成长和环境变化，你的类型特质会自然演化。这个报告反映的是你"此刻"的状态。',
    definition_en: 'Your type is not a fixed label. As your experience, growth, and environment evolve, your type traits will naturally shift. This report reflects your state "right now."',
  },

  careerDirections: {
    id: 'careerDirections',
    term_zh: '值得探索的方向',
    term_en: 'Directions Worth Exploring',
    definition_zh: '基于你的兴趣、价值观和现实条件综合匹配的职业方向。这些不是"最适合你的职业"，而是"最值得你花时间去了解"的方向——最终的判断权在你手中。',
    definition_en: 'Career directions matched from your interests, values, and real conditions combined. These aren\'t "the best careers for you," but "directions most worth your time exploring" — the final judgment is in your hands.',
  },

  matchScore: {
    id: 'matchScore',
    term_zh: '匹配度',
    term_en: 'Match Score',
    definition_zh: '基于四个维度的综合评分：兴趣匹配(35%)、价值匹配(25%)、性格匹配(20%)和适应力匹配(20%)。分数越高意味着这个方向越值得你深入了解——但它不是命运判决书。',
    definition_en: 'A composite score across four dimensions: Interest Fit (35%), Value Fit (25%), Personality Fit (20%), and Adaptability Fit (20%). Higher scores mean this direction is more worth exploring in depth — but it\'s not a verdict.',
  },

  valueConflict: {
    id: 'valueConflict',
    term_zh: '价值张力',
    term_en: 'Value Tension',
    definition_zh: '当你的两个核心价值之间存在天然矛盾时（比如"自由"和"安全感"），这种张力不是问题，而是洞察——它说明你的需求是多层次的，需要在不同阶段做出取舍。',
    definition_en: 'When two of your core values naturally conflict (e.g., "Freedom" and "Security"), this tension isn\'t a problem — it\'s an insight. It shows your needs are multi-layered and require trade-offs at different stages.',
  },

  careerDrain: {
    id: 'careerDrain',
    term_zh: '内耗预警',
    term_en: 'Energy Drain Warning',
    definition_zh: '根据你的能量模式和非谈判项，某些看似不错的职业方向可能会持续消耗你。这些预警帮你提前识别"做着做着就不想做了"的隐患。',
    definition_en: 'Based on your energy patterns and non-negotiables, some seemingly good career paths may chronically drain you. These warnings help you spot the risk of "losing motivation over time" before it happens.',
  },
};

/**
 * Get term definition text for a given locale.
 */
export function getTermText(id: string, locale: Locale): { term: string; definition: string } | undefined {
  const def = TERM_GLOSSARY[id];
  if (!def) return undefined;
  if (locale === 'nl') {
    return {
      term: def.term_nl ?? def.term_en,
      definition: def.definition_nl ?? def.definition_en,
    };
  }
  return {
    term: locale === 'zh' ? def.term_zh : def.term_en,
    definition: locale === 'zh' ? def.definition_zh : def.definition_en,
  };
}
