// ============================================================
// Core Qualities Algorithm — Ofman Quadrant Model
//
// Maps Big Five facets to Daniel Ofman's (2004) four-quadrant
// model: Core Quality → Pitfall → Challenge → Allergy.
//
// Pure algorithm, no LLM. Selects the user's top 2 most
// extreme facets and generates personalized quadrants.
// ============================================================

import type { CoreQualityQuadrant } from "../types";

interface FacetInput {
  facet: string;
  domain: string;
  score: number;
  deviationFromMean: number;
}

/**
 * Ofman quadrant mapping for each Big Five facet.
 * Each facet has a 'high' and 'low' direction.
 * Based on Ofman (2004) and Big Five facet literature.
 */
const FACET_QUADRANTS: Record<
  string,
  {
    high: {
      coreQuality: { en: string; zh: string };
      pitfall: { en: string; zh: string };
      challenge: { en: string; zh: string };
      allergy: { en: string; zh: string };
    };
    low: {
      coreQuality: { en: string; zh: string };
      pitfall: { en: string; zh: string };
      challenge: { en: string; zh: string };
      allergy: { en: string; zh: string };
    };
  }
> = {
  // === EXTRAVERSION ===
  E1_Friendliness: {
    high: {
      coreQuality: { en: "Warmth", zh: "温暖" },
      pitfall: { en: "People-pleasing", zh: "讨好" },
      challenge: { en: "Healthy boundaries", zh: "健康边界" },
      allergy: { en: "Coldness", zh: "冷漠" },
    },
    low: {
      coreQuality: { en: "Selectiveness", zh: "精选交往" },
      pitfall: { en: "Aloofness", zh: "疏离" },
      challenge: { en: "Openness to others", zh: "向他人敞开" },
      allergy: { en: "Superficial warmth", zh: "表面热情" },
    },
  },
  E2_Gregariousness: {
    high: {
      coreQuality: { en: "Sociability", zh: "社交力" },
      pitfall: { en: "Dependency on others", zh: "依赖他人" },
      challenge: { en: "Self-sufficiency", zh: "独立自处" },
      allergy: { en: "Isolation", zh: "孤立" },
    },
    low: {
      coreQuality: { en: "Independence", zh: "独立" },
      pitfall: { en: "Withdrawal", zh: "退缩" },
      challenge: { en: "Reaching out", zh: "主动连接" },
      allergy: { en: "Neediness", zh: "过度依赖" },
    },
  },
  E3_Assertiveness: {
    high: {
      coreQuality: { en: "Decisiveness", zh: "果断" },
      pitfall: { en: "Domineering", zh: "武断" },
      challenge: { en: "Patient listening", zh: "耐心倾听" },
      allergy: { en: "Passivity", zh: "被动" },
    },
    low: {
      coreQuality: { en: "Thoughtful reserve", zh: "沉稳深思" },
      pitfall: { en: "Hesitancy", zh: "犹豫不决" },
      challenge: { en: "Speaking up", zh: "勇于表达" },
      allergy: { en: "Bossiness", zh: "颐指气使" },
    },
  },
  E4_Activity_Level: {
    high: {
      coreQuality: { en: "Drive", zh: "行动力" },
      pitfall: { en: "Restlessness", zh: "浮躁" },
      challenge: { en: "Stillness", zh: "沉静" },
      allergy: { en: "Lethargy", zh: "懒散" },
    },
    low: {
      coreQuality: { en: "Composure", zh: "沉着" },
      pitfall: { en: "Inertia", zh: "惰性" },
      challenge: { en: "Initiative", zh: "主动出击" },
      allergy: { en: "Hyperactivity", zh: "过度忙碌" },
    },
  },
  "E5_Excitement-Seeking": {
    high: {
      coreQuality: { en: "Boldness", zh: "勇敢" },
      pitfall: { en: "Recklessness", zh: "莽撞" },
      challenge: { en: "Prudence", zh: "审慎" },
      allergy: { en: "Timidity", zh: "胆怯" },
    },
    low: {
      coreQuality: { en: "Steadiness", zh: "稳健" },
      pitfall: { en: "Over-caution", zh: "过度谨慎" },
      challenge: { en: "Embracing novelty", zh: "拥抱新事物" },
      allergy: { en: "Impulsiveness", zh: "冲动" },
    },
  },
  E6_Cheerfulness: {
    high: {
      coreQuality: { en: "Optimism", zh: "乐观" },
      pitfall: { en: "Denial of problems", zh: "回避问题" },
      challenge: { en: "Realistic assessment", zh: "直面现实" },
      allergy: { en: "Pessimism", zh: "悲观" },
    },
    low: {
      coreQuality: { en: "Realism", zh: "务实" },
      pitfall: { en: "Cynicism", zh: "愤世嫉俗" },
      challenge: { en: "Seeing possibility", zh: "看到可能性" },
      allergy: { en: "Naive optimism", zh: "盲目乐观" },
    },
  },

  // === AGREEABLENESS ===
  A1_Trust: {
    high: {
      coreQuality: { en: "Trust", zh: "信任" },
      pitfall: { en: "Naivety", zh: "天真" },
      challenge: { en: "Healthy skepticism", zh: "适度质疑" },
      allergy: { en: "Cynicism", zh: "多疑" },
    },
    low: {
      coreQuality: { en: "Discernment", zh: "洞察力" },
      pitfall: { en: "Suspicion", zh: "猜忌" },
      challenge: { en: "Giving benefit of doubt", zh: "善意推定" },
      allergy: { en: "Blind trust", zh: "盲信" },
    },
  },
  A2_Morality: {
    high: {
      coreQuality: { en: "Integrity", zh: "正直" },
      pitfall: { en: "Rigidity", zh: "刻板" },
      challenge: { en: "Pragmatic flexibility", zh: "灵活变通" },
      allergy: { en: "Dishonesty", zh: "不诚实" },
    },
    low: {
      coreQuality: { en: "Pragmatism", zh: "务实变通" },
      pitfall: { en: "Opportunism", zh: "投机" },
      challenge: { en: "Principled consistency", zh: "坚持原则" },
      allergy: { en: "Moralizing", zh: "道德说教" },
    },
  },
  A3_Altruism: {
    high: {
      coreQuality: { en: "Generosity", zh: "慷慨" },
      pitfall: { en: "Self-neglect", zh: "忽视自己" },
      challenge: { en: "Self-care", zh: "自我关怀" },
      allergy: { en: "Selfishness", zh: "自私" },
    },
    low: {
      coreQuality: { en: "Self-preservation", zh: "自我保护" },
      pitfall: { en: "Self-centeredness", zh: "以自我为中心" },
      challenge: { en: "Giving without agenda", zh: "无条件付出" },
      allergy: { en: "Martyrdom", zh: "自我牺牲" },
    },
  },
  A4_Cooperation: {
    high: {
      coreQuality: { en: "Harmony", zh: "和谐" },
      pitfall: { en: "Conflict avoidance", zh: "回避冲突" },
      challenge: { en: "Constructive confrontation", zh: "建设性对抗" },
      allergy: { en: "Aggression", zh: "攻击性" },
    },
    low: {
      coreQuality: { en: "Directness", zh: "直率" },
      pitfall: { en: "Abrasiveness", zh: "尖锐" },
      challenge: { en: "Diplomatic sensitivity", zh: "外交敏感度" },
      allergy: { en: "Excessive accommodation", zh: "过度迁就" },
    },
  },
  A5_Modesty: {
    high: {
      coreQuality: { en: "Humility", zh: "谦逊" },
      pitfall: { en: "Self-deprecation", zh: "自我贬低" },
      challenge: { en: "Owning your strengths", zh: "正视自身优势" },
      allergy: { en: "Arrogance", zh: "傲慢" },
    },
    low: {
      coreQuality: { en: "Confidence", zh: "自信" },
      pitfall: { en: "Arrogance", zh: "傲慢" },
      challenge: { en: "Humility", zh: "谦逊" },
      allergy: { en: "Mediocrity", zh: "平庸" },
    },
  },
  A6_Sympathy: {
    high: {
      coreQuality: { en: "Empathy", zh: "共情" },
      pitfall: { en: "Over-identification", zh: "过度共情" },
      challenge: { en: "Emotional detachment", zh: "情感抽离" },
      allergy: { en: "Callousness", zh: "冷酷" },
    },
    low: {
      coreQuality: { en: "Objectivity", zh: "客观" },
      pitfall: { en: "Emotional distance", zh: "情感疏远" },
      challenge: { en: "Compassionate presence", zh: "带着同理心在场" },
      allergy: { en: "Sentimentality", zh: "滥情" },
    },
  },

  // === CONSCIENTIOUSNESS ===
  "C1_Self-Efficacy": {
    high: {
      coreQuality: { en: "Capability", zh: "胜任力" },
      pitfall: { en: "Overconfidence", zh: "过度自信" },
      challenge: { en: "Humble learning", zh: "虚心学习" },
      allergy: { en: "Self-doubt", zh: "自我怀疑" },
    },
    low: {
      coreQuality: { en: "Openness to help", zh: "乐于求助" },
      pitfall: { en: "Learned helplessness", zh: "习得性无助" },
      challenge: { en: "Self-efficacy", zh: "自我效能" },
      allergy: { en: "Know-it-all attitude", zh: "自以为是" },
    },
  },
  C2_Orderliness: {
    high: {
      coreQuality: { en: "Organization", zh: "条理性" },
      pitfall: { en: "Rigidity", zh: "僵化" },
      challenge: { en: "Flexibility", zh: "灵活" },
      allergy: { en: "Chaos", zh: "混乱" },
    },
    low: {
      coreQuality: { en: "Flexibility", zh: "灵活" },
      pitfall: { en: "Disorganization", zh: "无序" },
      challenge: { en: "Structured planning", zh: "结构化规划" },
      allergy: { en: "Micromanagement", zh: "微管理" },
    },
  },
  C3_Dutifulness: {
    high: {
      coreQuality: { en: "Responsibility", zh: "责任感" },
      pitfall: { en: "Over-obligation", zh: "过度负责" },
      challenge: { en: "Saying no", zh: "学会拒绝" },
      allergy: { en: "Irresponsibility", zh: "不负责任" },
    },
    low: {
      coreQuality: { en: "Freedom-orientation", zh: "追求自由" },
      pitfall: { en: "Unreliability", zh: "不可靠" },
      challenge: { en: "Honoring commitments", zh: "信守承诺" },
      allergy: { en: "Guilt-tripping", zh: "道德绑架" },
    },
  },
  "C4_Achievement-Striving": {
    high: {
      coreQuality: { en: "Ambition", zh: "进取心" },
      pitfall: { en: "Workaholism", zh: "工作狂" },
      challenge: { en: "Contentment", zh: "知足" },
      allergy: { en: "Complacency", zh: "安于现状" },
    },
    low: {
      coreQuality: { en: "Contentment", zh: "知足" },
      pitfall: { en: "Complacency", zh: "安于现状" },
      challenge: { en: "Goal-setting", zh: "目标设定" },
      allergy: { en: "Relentless ambition", zh: "不知疲倦的野心" },
    },
  },
  "C5_Self-Discipline": {
    high: {
      coreQuality: { en: "Persistence", zh: "坚持" },
      pitfall: { en: "Stubbornness", zh: "固执" },
      challenge: { en: "Knowing when to let go", zh: "适时放手" },
      allergy: { en: "Giving up easily", zh: "轻易放弃" },
    },
    low: {
      coreQuality: { en: "Spontaneity", zh: "随性" },
      pitfall: { en: "Lack of follow-through", zh: "虎头蛇尾" },
      challenge: { en: "Finishing what you start", zh: "善始善终" },
      allergy: { en: "Rigid persistence", zh: "死磕到底" },
    },
  },
  C6_Cautiousness: {
    high: {
      coreQuality: { en: "Thoughtfulness", zh: "深思熟虑" },
      pitfall: { en: "Analysis paralysis", zh: "分析瘫痪" },
      challenge: { en: "Decisive action", zh: "果断行动" },
      allergy: { en: "Rash decisions", zh: "草率决定" },
    },
    low: {
      coreQuality: { en: "Quick decision-making", zh: "快速决策" },
      pitfall: { en: "Impulsiveness", zh: "冲动" },
      challenge: { en: "Pausing to reflect", zh: "暂停反思" },
      allergy: { en: "Indecisiveness", zh: "优柔寡断" },
    },
  },

  // === OPENNESS ===
  O1_Imagination: {
    high: {
      coreQuality: { en: "Creativity", zh: "创造力" },
      pitfall: { en: "Impracticality", zh: "不切实际" },
      challenge: { en: "Grounding ideas", zh: "落地执行" },
      allergy: { en: "Narrow-mindedness", zh: "思维狭隘" },
    },
    low: {
      coreQuality: { en: "Practicality", zh: "务实" },
      pitfall: { en: "Unimaginativeness", zh: "缺乏想象" },
      challenge: { en: "Visionary thinking", zh: "远见思维" },
      allergy: { en: "Pipe dreams", zh: "空想" },
    },
  },
  O2_Artistic_Interests: {
    high: {
      coreQuality: { en: "Aesthetic sensitivity", zh: "审美敏感" },
      pitfall: { en: "Over-refinement", zh: "过度精致" },
      challenge: { en: "Functional focus", zh: "功能优先" },
      allergy: { en: "Crudeness", zh: "粗糙" },
    },
    low: {
      coreQuality: { en: "Functional focus", zh: "功能导向" },
      pitfall: { en: "Aesthetic blindness", zh: "审美缺失" },
      challenge: { en: "Appreciating beauty", zh: "欣赏美感" },
      allergy: { en: "Form over function", zh: "形式大于内容" },
    },
  },
  O3_Emotionality: {
    high: {
      coreQuality: { en: "Emotional depth", zh: "情感深度" },
      pitfall: { en: "Overwhelm", zh: "情绪淹没" },
      challenge: { en: "Emotional composure", zh: "情绪沉着" },
      allergy: { en: "Emotional numbness", zh: "情感麻木" },
    },
    low: {
      coreQuality: { en: "Emotional stability", zh: "情绪稳定" },
      pitfall: { en: "Emotional suppression", zh: "情绪压抑" },
      challenge: { en: "Emotional expression", zh: "情感表达" },
      allergy: { en: "Drama", zh: "情绪化" },
    },
  },
  O4_Adventurousness: {
    high: {
      coreQuality: { en: "Exploration", zh: "探索精神" },
      pitfall: { en: "Restless pursuit", zh: "不安分" },
      challenge: { en: "Appreciation of routine", zh: "珍惜常规" },
      allergy: { en: "Stagnation", zh: "停滞不前" },
    },
    low: {
      coreQuality: { en: "Consistency", zh: "一致性" },
      pitfall: { en: "Resistance to change", zh: "抗拒变化" },
      challenge: { en: "Openness to new paths", zh: "拥抱新路径" },
      allergy: { en: "Constant disruption", zh: "不断颠覆" },
    },
  },
  O5_Intellect: {
    high: {
      coreQuality: { en: "Intellectual curiosity", zh: "求知欲" },
      pitfall: { en: "Overthinking", zh: "过度思考" },
      challenge: { en: "Action over analysis", zh: "行动优先" },
      allergy: { en: "Intellectual laziness", zh: "思维惰性" },
    },
    low: {
      coreQuality: { en: "Action-orientation", zh: "行动导向" },
      pitfall: { en: "Shallow thinking", zh: "浅尝辄止" },
      challenge: { en: "Depth of inquiry", zh: "深度探究" },
      allergy: { en: "Endless theorizing", zh: "纸上谈兵" },
    },
  },
  O6_Liberalism: {
    high: {
      coreQuality: { en: "Open-mindedness", zh: "开明" },
      pitfall: { en: "Relativism", zh: "相对主义" },
      challenge: { en: "Principled conviction", zh: "有原则的信念" },
      allergy: { en: "Dogmatism", zh: "教条主义" },
    },
    low: {
      coreQuality: { en: "Principled conviction", zh: "信念坚定" },
      pitfall: { en: "Closed-mindedness", zh: "固步自封" },
      challenge: { en: "Considering alternatives", zh: "考虑替代方案" },
      allergy: { en: "Moral relativism", zh: "道德相对主义" },
    },
  },

  // === NEUROTICISM (reversed: low = positive core quality) ===
  N1_Anxiety: {
    high: {
      coreQuality: { en: "Vigilance", zh: "警觉" },
      pitfall: { en: "Chronic worry", zh: "过度焦虑" },
      challenge: { en: "Trust in the process", zh: "相信过程" },
      allergy: { en: "Reckless disregard", zh: "不管不顾" },
    },
    low: {
      coreQuality: { en: "Calm", zh: "沉着" },
      pitfall: { en: "Complacency", zh: "麻痹大意" },
      challenge: { en: "Appropriate concern", zh: "适度关注" },
      allergy: { en: "Panic", zh: "惊慌失措" },
    },
  },
  N2_Anger: {
    high: {
      coreQuality: { en: "Passion", zh: "激情" },
      pitfall: { en: "Volatile temper", zh: "暴躁" },
      challenge: { en: "Equanimity", zh: "心平气和" },
      allergy: { en: "Apathy", zh: "冷漠无感" },
    },
    low: {
      coreQuality: { en: "Equanimity", zh: "平和" },
      pitfall: { en: "Suppressed frustration", zh: "压抑不满" },
      challenge: { en: "Healthy assertion of anger", zh: "健康表达不满" },
      allergy: { en: "Explosive anger", zh: "暴怒" },
    },
  },
  N3_Depression: {
    high: {
      coreQuality: { en: "Emotional sensitivity", zh: "情感敏锐" },
      pitfall: { en: "Hopelessness", zh: "绝望" },
      challenge: { en: "Resilient optimism", zh: "韧性乐观" },
      allergy: { en: "Toxic positivity", zh: "有毒积极" },
    },
    low: {
      coreQuality: { en: "Resilience", zh: "韧性" },
      pitfall: { en: "Dismissing valid sadness", zh: "否认悲伤" },
      challenge: {
        en: "Sitting with difficult emotions",
        zh: "与困难情绪共处",
      },
      allergy: { en: "Wallowing", zh: "沉溺" },
    },
  },
  "N4_Self-Consciousness": {
    high: {
      coreQuality: { en: "Social awareness", zh: "社交觉察" },
      pitfall: { en: "Crippling self-doubt", zh: "自我怀疑" },
      challenge: { en: "Self-assurance", zh: "自信从容" },
      allergy: { en: "Obliviousness", zh: "对他人感受毫不在意" },
    },
    low: {
      coreQuality: { en: "Self-assurance", zh: "自信从容" },
      pitfall: { en: "Insensitivity to perception", zh: "不顾他人看法" },
      challenge: { en: "Receptive to feedback", zh: "接受反馈" },
      allergy: { en: "Excessive self-consciousness", zh: "过度在意外界" },
    },
  },
  N5_Immoderation: {
    high: {
      coreQuality: { en: "Spontaneity", zh: "随性" },
      pitfall: { en: "Excess", zh: "过度放纵" },
      challenge: { en: "Self-regulation", zh: "自我调节" },
      allergy: { en: "Rigid control", zh: "严格控制" },
    },
    low: {
      coreQuality: { en: "Self-control", zh: "自制力" },
      pitfall: { en: "Over-restriction", zh: "过度克制" },
      challenge: { en: "Allowing indulgence", zh: "适度放纵" },
      allergy: { en: "Lack of restraint", zh: "无节制" },
    },
  },
  N6_Vulnerability: {
    high: {
      coreQuality: { en: "Sensitivity", zh: "敏感" },
      pitfall: { en: "Fragility", zh: "脆弱" },
      challenge: { en: "Inner strength", zh: "内在力量" },
      allergy: { en: "Callous toughness", zh: "冷酷强硬" },
    },
    low: {
      coreQuality: { en: "Inner strength", zh: "内在力量" },
      pitfall: { en: "Dismissing vulnerability", zh: "否认脆弱" },
      challenge: { en: "Courage to be vulnerable", zh: "敢于示弱" },
      allergy: { en: "Helplessness", zh: "无助" },
    },
  },
};

/** Minimum absolute deviation to qualify as a notable facet */
const MIN_DEVIATION = 0.2;

/**
 * Compute top N Ofman Core Quality quadrants from Big Five facet data.
 * Returns empty array if no facets have sufficient deviation.
 *
 * Selection strategy:
 * - Pass 1: Pick the most extreme facet from each domain (domain diversity)
 * - Pass 2: Fill remaining slots from highest-deviation facets (allow max 2 per domain)
 * - Result: 3-5 qualities with good domain coverage
 */
export function computeCoreQualities(
  facetPairs: FacetInput[],
  maxResults = 5,
): CoreQualityQuadrant[] {
  if (!facetPairs || facetPairs.length === 0) return [];

  // Sort by absolute deviation, pick most extreme
  const qualified = facetPairs
    .filter(
      (f) =>
        Math.abs(f.deviationFromMean) >= MIN_DEVIATION &&
        FACET_QUADRANTS[f.facet],
    )
    .sort(
      (a, b) => Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean),
    );

  const results: CoreQualityQuadrant[] = [];
  const domainCount: Record<string, number> = {};
  const usedFacets = new Set<string>();

  // Pass 1: one per domain (diversity first)
  for (const f of qualified) {
    if (results.length >= maxResults) break;
    if (domainCount[f.domain]) continue;

    const mapping = FACET_QUADRANTS[f.facet];
    if (!mapping) continue;

    const direction: "high" | "low" = f.deviationFromMean > 0 ? "high" : "low";
    const quadrant = mapping[direction];

    results.push({
      facet: f.facet,
      domain: f.domain,
      direction,
      score: f.score,
      deviation: f.deviationFromMean,
      ...quadrant,
    });

    domainCount[f.domain] = 1;
    usedFacets.add(f.facet);
  }

  // Pass 2: fill remaining slots, allow max 2 per domain
  for (const f of qualified) {
    if (results.length >= maxResults) break;
    if (usedFacets.has(f.facet)) continue;
    if ((domainCount[f.domain] ?? 0) >= 2) continue;

    const mapping = FACET_QUADRANTS[f.facet];
    if (!mapping) continue;

    const direction: "high" | "low" = f.deviationFromMean > 0 ? "high" : "low";
    const quadrant = mapping[direction];

    results.push({
      facet: f.facet,
      domain: f.domain,
      direction,
      score: f.score,
      deviation: f.deviationFromMean,
      ...quadrant,
    });

    domainCount[f.domain] = (domainCount[f.domain] ?? 0) + 1;
    usedFacets.add(f.facet);
  }

  return results;
}
