// ============================================================
// Deterministic Memory Generator
// Extracts 10-15 memory entries from structured assessment data
// WITHOUT calling any LLM — ensures memories always work even
// when OpenAI is unavailable.
// ============================================================

import type { MemoryEntry, MemoryCategory } from "@/lib/types/memory";
import type { PersonalProfileData } from "@/lib/types/platform";
import type {
  BigFiveDimension,
  SchwartzValue,
  RIASECDimension,
} from "@/lib/types/dimensions";
import { detectIntraDomainTensions } from "@/lib/profile-generation/detect-facet-tensions";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";

// ── Locale helper: pick text by locale with fallback to 'en' ──
type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

// ---- Label maps (zh/en) ----

const BIG_FIVE_LABELS: Record<BigFiveDimension, { zh: string; en: string }> = {
  openness: { zh: "开放性", en: "Openness" },
  conscientiousness: { zh: "尽责性", en: "Conscientiousness" },
  extraversion: { zh: "外向性", en: "Extraversion" },
  agreeableness: { zh: "宜人性", en: "Agreeableness" },
  neuroticism: { zh: "神经质", en: "Neuroticism" },
};

const BIG_FIVE_HIGH_INSIGHT: Record<
  BigFiveDimension,
  { zh: string; en: string }
> = {
  openness: {
    zh: "对新想法和体验持开放态度，倾向于创造性思考和探索未知领域",
    en: "Open to new ideas and experiences, tends toward creative thinking and exploring the unknown",
  },
  conscientiousness: {
    zh: "做事有条理、注重计划和目标执行，对细节有较高要求",
    en: "Organized and goal-driven, values planning and has high standards for detail",
  },
  extraversion: {
    zh: "在社交互动中获得能量，善于建立关系和团队协作",
    en: "Energized by social interaction, skilled at building relationships and team collaboration",
  },
  agreeableness: {
    zh: "重视和谐关系，具有同理心和合作精神，关注他人感受",
    en: "Values harmonious relationships, empathetic and cooperative, attentive to others' feelings",
  },
  neuroticism: {
    zh: "情绪敏感度较高，可能在压力下更容易体验焦虑或波动",
    en: "Emotionally sensitive, may experience more anxiety or fluctuation under pressure",
  },
};

const BIG_FIVE_LOW_INSIGHT: Record<
  BigFiveDimension,
  { zh: string; en: string }
> = {
  openness: {
    zh: "偏好成熟稳定的方法，在实践和确定性中找到安全感",
    en: "Prefers established methods, finds security in practicality and certainty",
  },
  conscientiousness: {
    zh: "灵活应变，不拘泥于计划，擅长在变化中找到机会",
    en: "Flexible and adaptive, not bound by rigid plans, skilled at finding opportunity in change",
  },
  extraversion: {
    zh: "在独处和深度思考中获得能量，偏好有意义的深度交流",
    en: "Energized by solitude and deep thinking, prefers meaningful one-on-one conversations",
  },
  agreeableness: {
    zh: "独立思考能力强，不轻易受他人影响，善于提出挑战性观点",
    en: "Independent thinker, not easily swayed by others, skilled at raising challenging perspectives",
  },
  neuroticism: {
    zh: "情绪稳定性较高，在压力环境下仍能保持冷静和理性",
    en: "Emotionally stable, maintains calm and rationality even under pressure",
  },
};

const SCHWARTZ_LABELS: Record<SchwartzValue, { zh: string; en: string }> = {
  achievement: { zh: "成就", en: "Achievement" },
  power: { zh: "影响力", en: "Power" },
  stimulation: { zh: "刺激", en: "Stimulation" },
  "self-direction": { zh: "自我导向", en: "Self-Direction" },
  hedonism: { zh: "享乐", en: "Hedonism" },
  benevolence: { zh: "利他", en: "Benevolence" },
  universalism: { zh: "普世", en: "Universalism" },
  conformity: { zh: "遵从", en: "Conformity" },
  tradition: { zh: "传统", en: "Tradition" },
  security: { zh: "安全", en: "Security" },
};

const SCHWARTZ_INSIGHT: Record<SchwartzValue, { zh: string; en: string }> = {
  achievement: {
    zh: "追求个人成就和能力的展现，需要明确的成长反馈",
    en: "Driven by personal accomplishment and demonstrating capability, needs clear growth feedback",
  },
  power: {
    zh: "重视影响力和决策权，适合需要领导力的环境",
    en: "Values influence and decision-making power, suited for environments requiring leadership",
  },
  stimulation: {
    zh: "渴望新鲜感和多样性，在常规工作中容易感到倦怠",
    en: "Craves novelty and variety, prone to burnout in routine work",
  },
  "self-direction": {
    zh: "高度重视自主权和独立决策空间，对微管理敏感",
    en: "Highly values autonomy and independent decision-making, sensitive to micromanagement",
  },
  hedonism: {
    zh: "追求工作中的愉悦感和创造性表达，重视工作生活平衡",
    en: "Seeks enjoyment and creative expression in work, values work-life balance",
  },
  benevolence: {
    zh: "关注身边人的福祉，在帮助他人成长中获得满足",
    en: "Cares about well-being of those around them, fulfilled by helping others grow",
  },
  universalism: {
    zh: "关注社会公正和普世价值，倾向于有使命感的工作",
    en: "Concerned with social justice and universal values, drawn to mission-driven work",
  },
  conformity: {
    zh: "重视规则和社会期望，在有明确框架的环境中更自在",
    en: "Values rules and social expectations, more comfortable in structured environments",
  },
  tradition: {
    zh: "尊重传统和使命感，在有文化根基的组织中能发挥优势",
    en: "Respects tradition and sense of mission, thrives in culturally grounded organizations",
  },
  security: {
    zh: "重视稳定性和可预测性，在职业选择中偏好安全感",
    en: "Values stability and predictability, prioritizes security in career choices",
  },
};

const RIASEC_LABELS: Record<RIASECDimension, { zh: string; en: string }> = {
  R: { zh: "实用型", en: "Realistic" },
  I: { zh: "探究型", en: "Investigative" },
  A: { zh: "艺术型", en: "Artistic" },
  S: { zh: "社会型", en: "Social" },
  E: { zh: "企业型", en: "Enterprising" },
  C: { zh: "常规型", en: "Conventional" },
};

const RIASEC_INSIGHT: Record<RIASECDimension, { zh: string; en: string }> = {
  R: {
    zh: "偏好动手实践和具体成果，在可见的产出中获得成就感",
    en: "Prefers hands-on work and tangible results, finds fulfillment in visible output",
  },
  I: {
    zh: "享受深度分析和研究，在解决复杂问题中获得满足",
    en: "Enjoys deep analysis and research, fulfilled by solving complex problems",
  },
  A: {
    zh: "追求创意表达和非常规思路，在自由创作空间中表现最佳",
    en: "Seeks creative expression and unconventional approaches, performs best with creative freedom",
  },
  S: {
    zh: "在帮助和教育他人中获得能量，擅长建立信任关系",
    en: "Energized by helping and educating others, skilled at building trust",
  },
  E: {
    zh: "善于推动项目和影响他人，在领导和说服场景中如鱼得水",
    en: "Skilled at driving projects and influencing others, thrives in leadership and persuasion",
  },
  C: {
    zh: "擅长系统化和流程优化，在有序环境中效率最高",
    en: "Excels at systematization and process optimization, most efficient in orderly environments",
  },
};

// ---- Synthesis pattern types ----

interface SynthesisContext {
  bigFive: Record<BigFiveDimension, number> | null;
  schwartzTop2: SchwartzValue[];
  riasecTop: RIASECDimension | null;
  locale: string;
}

interface SynthesisPattern {
  category: MemoryCategory;
  keyword: { zh: string; en: string };
  insight: { zh: string; en: string };
  matches: (ctx: SynthesisContext) => boolean;
}

// Thresholds for cross-framework pattern matching
const HIGH = 60;
const LOW = 40;

function schwartzIncludes(
  top2: SchwartzValue[],
  ...values: SchwartzValue[]
): boolean {
  return values.some((v) => top2.includes(v));
}

/**
 * Cross-framework synthesis patterns.
 * Ordered by specificity: 3-framework convergences first, then 2-framework tensions.
 * At runtime, all matching patterns are collected and capped at 3.
 */
const SYNTHESIS_PATTERNS: SynthesisPattern[] = [
  // ─── Drive Chains (strength): 3-framework convergences ───

  {
    // High O + self-direction + RIASEC I
    category: "strength",
    keyword: { zh: "智识自主驱动力", en: "Intellectual Autonomy Drive" },
    insight: {
      zh: "你的开放性人格、自我导向价值观和探究型兴趣三重叠加——这不是偶然，而是指向你需要独立思考和深度钻研空间的核心职业驱动力",
      en: "Your open personality, self-direction values, and investigative interests converge — this triple alignment points to a core career drive for independent thinking and deep intellectual exploration",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.openness >= HIGH &&
      schwartzIncludes(ctx.schwartzTop2, "self-direction") &&
      ctx.riasecTop === "I",
  },
  {
    // High C + achievement + RIASEC E or C
    category: "strength",
    keyword: { zh: "结构化成就引擎", en: "Structured Achievement Engine" },
    insight: {
      zh: "高尽责性、成就导向价值观和组织/进取型兴趣三者汇聚，你擅长在清晰体系中推动目标落地，是天然的执行力引擎",
      en: "High conscientiousness, achievement-driven values, and enterprising/conventional interests converge — you excel at driving goals to completion within clear systems",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.conscientiousness >= HIGH &&
      schwartzIncludes(ctx.schwartzTop2, "achievement") &&
      (ctx.riasecTop === "E" || ctx.riasecTop === "C"),
  },
  {
    // High A or High E(extraversion) + benevolence/universalism + RIASEC S
    category: "strength",
    keyword: { zh: "以人为本使命感", en: "People-Centered Mission" },
    insight: {
      zh: "共情人格、利他价值观和社会型兴趣三者汇聚——你天然适合以帮助他人成长为核心的职业路径",
      en: "Your empathetic personality, altruistic values, and social interests align — you are naturally drawn to careers centered on helping others grow",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      (ctx.bigFive.agreeableness >= HIGH || ctx.bigFive.extraversion >= HIGH) &&
      schwartzIncludes(ctx.schwartzTop2, "benevolence", "universalism") &&
      ctx.riasecTop === "S",
  },
  {
    // High E(extraversion) + power/achievement + RIASEC E
    category: "strength",
    keyword: { zh: "社交领导力汇聚", en: "Social Leadership Convergence" },
    insight: {
      zh: "外向能量、影响力/成就驱动和企业型兴趣汇聚——你在需要说服力和推动力的角色中最能发挥潜能",
      en: "Extraverted energy, power/achievement drive, and enterprising interests converge — you perform at your peak in roles requiring persuasion and initiative",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.extraversion >= HIGH &&
      schwartzIncludes(ctx.schwartzTop2, "power", "achievement") &&
      ctx.riasecTop === "E",
  },

  // ─── Tension Chains (blindspot): cross-framework conflicts ───

  {
    // High O + security in top 2
    category: "blindspot",
    keyword: { zh: "安全-好奇拉锯", en: "Security-Curiosity Tension" },
    insight: {
      zh: "你的人格渴望探索未知，但价值观上又寻求稳定和安全感——这种张力在职业转换或新机会出现时会格外明显",
      en: "Your personality craves exploration, but your values seek stability and security — this tension becomes especially pronounced during career transitions",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.openness >= HIGH &&
      schwartzIncludes(ctx.schwartzTop2, "security"),
  },
  {
    // High O + conformity or tradition in top 2
    category: "blindspot",
    keyword: { zh: "创新-遵从张力", en: "Innovation-Conformity Tension" },
    insight: {
      zh: "创造性思维与遵从或传统价值观之间存在内在张力——你可能在想要突破常规时感受到来自内心深处的犹豫",
      en: "Creative thinking and conformity/tradition values create an internal tension — you may feel deep hesitation when wanting to break from convention",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.openness >= HIGH &&
      schwartzIncludes(ctx.schwartzTop2, "conformity", "tradition"),
  },
  {
    // High O + stimulation + Low C
    category: "blindspot",
    keyword: { zh: "创意发散风险", en: "Creative Restlessness" },
    insight: {
      zh: "强烈的好奇心和新鲜感需求遇上低结构化倾向——创意不缺但容易分散，你可能需要外部框架来锚定方向",
      en: "Strong curiosity and novelty-seeking meets low structure — no shortage of ideas but they scatter easily; you may need external frameworks to anchor direction",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.openness >= HIGH &&
      ctx.bigFive.conscientiousness <= LOW &&
      schwartzIncludes(ctx.schwartzTop2, "stimulation"),
  },

  // ─── Environment Chains (behavior): consistent preference signals ───

  {
    // Low E + self-direction + RIASEC I
    category: "behavior",
    keyword: { zh: "深度独处型工作模式", en: "Deep Solitary Work Mode" },
    insight: {
      zh: "内省能量、自主价值观和探究型兴趣一致指向你需要独立深度工作的空间来发挥最佳状态",
      en: "Introverted energy, self-direction values, and investigative interests all point to needing independent deep-work space to perform at your best",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.extraversion <= LOW &&
      schwartzIncludes(ctx.schwartzTop2, "self-direction") &&
      ctx.riasecTop === "I",
  },
  {
    // Low O + security/tradition + RIASEC C
    category: "behavior",
    keyword: { zh: "稳定秩序型偏好", en: "Structured Stability Anchor" },
    insight: {
      zh: "务实人格、安全/传统价值观和常规型兴趣共同指向你在可预测、有秩序的环境中效率最高、压力最低",
      en: "Practical personality, security/tradition values, and conventional interests converge — you perform best and feel least stressed in predictable, orderly environments",
    },
    matches: (ctx) =>
      !!ctx.bigFive &&
      ctx.bigFive.openness <= LOW &&
      schwartzIncludes(ctx.schwartzTop2, "security", "tradition") &&
      ctx.riasecTop === "C",
  },
];

const MAX_SYNTHESIS_ENTRIES = 3;

/**
 * Generate cross-framework synthesis memories by detecting patterns
 * across Big Five, Schwartz values, and RIASEC interest dimensions.
 * Pure algorithmic — no LLM calls.
 */
function generateSynthesisMemories(input: DeterministicInput): MemoryEntry[] {
  const { profile, assessment, locale } = input;

  // Build context from available data
  const bigFive =
    profile?.bigFiveScores || extractBigFiveFromAssessment(assessment);
  const schwartzTop2 = (profile?.schwartzAnchors?.top3?.slice(0, 2) ??
    []) as SchwartzValue[];
  const riasecTop = extractRiasecTop(profile);

  // Need at least Big Five + one other framework to synthesize
  if (!bigFive || (schwartzTop2.length === 0 && !riasecTop)) return [];

  const ctx: SynthesisContext = { bigFive, schwartzTop2, riasecTop, locale };

  const matched: MemoryEntry[] = [];
  for (const pattern of SYNTHESIS_PATTERNS) {
    if (matched.length >= MAX_SYNTHESIS_ENTRIES) break;
    if (pattern.matches(ctx)) {
      matched.push({
        category: pattern.category,
        keyword: L(pattern.keyword, locale),
        insight: L(pattern.insight, locale),
        source: "questionnaire",
        confidence: 0.85,
      });
    }
  }

  return matched;
}

function extractRiasecTop(
  profile: PersonalProfileData | null,
): RIASECDimension | null {
  const riasec = profile?.riasecScores;
  if (!riasec) return null;
  const sorted = (Object.entries(riasec) as [RIASECDimension, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  return sorted[0]?.[0] ?? null;
}

// ---- Main extraction function ----

export interface DeterministicInput {
  profile: PersonalProfileData | null;
  assessment: Record<string, unknown> | null;
  report: Record<string, unknown> | null;
  locale: string;
}

export function generateMemoriesFromAssessment(
  input: DeterministicInput,
): MemoryEntry[] {
  const { profile, assessment, report, locale } = input;
  const memories: MemoryEntry[] = [];

  // ---------- 1. Archetype (from profile) ----------
  if (profile?.archetype) {
    const arch = profile.archetype;
    const label = locale === "zh" ? arch.label_zh : arch.label_en;
    const tagline = locale === "zh" ? arch.tagline_zh : arch.tagline_en;
    memories.push({
      category: "personality",
      keyword: L(
        {
          en: label,
          zh: `${label}型`,
          nl: label,
          de: label,
          fr: label,
          es: label,
          pt: label,
          it: label,
          ru: label,
          ja: `${label}型`,
          ko: `${label}형`,
        },
        locale,
      ),
      insight:
        tagline ||
        L(
          {
            en: `Primary career personality type is ${label}`,
            zh: `主要职业人格类型为${label}`,
            nl: `Primair carrièrepersoonlijkheidstype is ${label}`,
            de: `Primärer Karrierepersönlichkeitstyp ist ${label}`,
            fr: `Type de personnalité professionnelle principal : ${label}`,
            es: `Tipo de personalidad profesional principal: ${label}`,
            pt: `Tipo de personalidade profissional principal: ${label}`,
            it: `Tipo di personalità professionale principale: ${label}`,
            ru: `Основной тип карьерной личности: ${label}`,
            ja: `主要なキャリアパーソナリティタイプ: ${label}`,
            ko: `주요 커리어 성격 유형: ${label}`,
          },
          locale,
        ),
      source: "profile",
      confidence: Math.min(1, Math.max(0.7, arch.confidence)),
    });

    // Boundary type as a blindspot if confidence is not high
    if (arch.confidenceLevel !== "high" && arch.isBoundary) {
      memories.push({
        category: "blindspot",
        keyword: L(
          {
            en: "Type Boundary",
            zh: "类型边界模糊",
            nl: "Typegrens",
            de: "Typgrenze",
            fr: "Limite de type",
            es: "Límite de tipo",
            pt: "Limite de tipo",
            it: "Confine di tipo",
            ru: "Граница типа",
            ja: "タイプ境界",
            ko: "유형 경계",
          },
          locale,
        ),
        insight: L(
          {
            en: "Career personality confidence is moderate, dimension gap is small — may switch between modes",
            zh: "职业人格类型置信度不高，维度分差较小，可能在不同模式间切换",
            nl: "Vertrouwen in carrièrepersoonlijkheid is matig, dimensieverschil is klein — kan tussen modi wisselen",
            de: "Karrierepersönlichkeits-Konfidenz ist moderat, Dimensionsunterschied gering — wechselt möglicherweise zwischen Modi",
            fr: "Confiance modérée dans le type de personnalité, écart dimensionnel faible — peut alterner entre les modes",
            es: "Confianza moderada en la personalidad profesional, diferencia dimensional pequeña — puede alternar entre modos",
            pt: "Confiança moderada na personalidade profissional, diferença dimensional pequena — pode alternar entre modos",
            it: "Fiducia moderata nella personalità professionale, divario dimensionale ridotto — potrebbe alternare tra modalità",
            ru: "Уверенность в типе карьерной личности умеренная, разрыв между измерениями мал — возможно переключение между режимами",
            ja: "キャリアパーソナリティの確信度は中程度、次元間の差は小さく、モード間で切り替わる可能性あり",
            ko: "커리어 성격 유형의 확신도가 보통이고 차원 간 차이가 작아 모드 간 전환 가능성이 있음",
          },
          locale,
        ),
        source: "profile",
        confidence: 0.75,
      });
    }
  }

  // ---------- 2. Big Five (from profile or assessment) ----------
  const bigFive =
    profile?.bigFiveScores || extractBigFiveFromAssessment(assessment);
  if (bigFive) {
    const dims = Object.entries(bigFive) as [BigFiveDimension, number][];
    // Sort by extremity (distance from 50)
    const sorted = dims.sort(
      (a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50),
    );
    const topTraits = sorted.slice(0, 2);

    for (const [dim, score] of topTraits) {
      const isHigh = score >= 55;
      const labels = BIG_FIVE_LABELS[dim];
      const insight = isHigh
        ? BIG_FIVE_HIGH_INSIGHT[dim]
        : BIG_FIVE_LOW_INSIGHT[dim];
      const highLow = L(
        {
          en: isHigh ? "High" : "Low",
          zh: isHigh ? "高" : "低",
          nl: isHigh ? "Hoog" : "Laag",
          de: isHigh ? "Hoch" : "Niedrig",
          fr: isHigh ? "Élevé" : "Faible",
          es: isHigh ? "Alto" : "Bajo",
          pt: isHigh ? "Alto" : "Baixo",
          it: isHigh ? "Alto" : "Basso",
          ru: isHigh ? "Высокий" : "Низкий",
          ja: isHigh ? "高" : "低",
          ko: isHigh ? "높은" : "낮은",
        },
        locale,
      );
      const labelText = L(labels, locale);
      memories.push({
        category: "personality",
        keyword: ["zh", "ja", "ko"].includes(locale)
          ? `${highLow}${labelText}`
          : `${highLow} ${labelText}`,
        insight: L(insight, locale),
        source: "questionnaire",
        confidence: 0.85,
      });
    }

    // Detect tension: high openness + high conscientiousness
    if (bigFive.openness >= 60 && bigFive.conscientiousness >= 60) {
      memories.push({
        category: "behavior",
        keyword: L(
          {
            en: "Innovation-Order Tension",
            zh: "创新与秩序张力",
            nl: "Innovatie-Orde spanning",
            de: "Innovations-Ordnungs-Spannung",
            fr: "Tension innovation-ordre",
            es: "Tensión innovación-orden",
            pt: "Tensão inovação-ordem",
            it: "Tensione innovazione-ordine",
            ru: "Напряжение инновации-порядок",
            ja: "革新と秩序の緊張",
            ko: "혁신-질서 긴장",
          },
          locale,
        ),
        insight: L(
          {
            en: "Combines high creativity with high discipline — may feel internal tension between free exploration and systematic execution",
            zh: "同时具有高创造力和高执行力，可能在自由探索与系统执行之间产生内在张力",
            nl: "Combineert hoge creativiteit met hoge discipline — kan innerlijke spanning voelen tussen vrije verkenning en systematische uitvoering",
            de: "Vereint hohe Kreativität mit hoher Disziplin — kann innere Spannung zwischen freier Exploration und systematischer Umsetzung erleben",
            fr: "Allie haute créativité et forte discipline — peut ressentir une tension interne entre exploration libre et exécution systématique",
            es: "Combina alta creatividad con alta disciplina — puede sentir tensión interna entre exploración libre y ejecución sistemática",
            pt: "Combina alta criatividade com alta disciplina — pode sentir tensão interna entre exploração livre e execução sistemática",
            it: "Combina alta creatività con alta disciplina — può provare tensione interna tra esplorazione libera ed esecuzione sistematica",
            ru: "Сочетает высокую креативность с высокой дисциплиной — может испытывать внутреннее напряжение между свободным исследованием и систематическим выполнением",
            ja: "高い創造性と高い規律を併せ持つ — 自由な探索と体系的な実行の間で内的緊張を感じる可能性あり",
            ko: "높은 창의성과 높은 규율을 겸비 — 자유로운 탐색과 체계적 실행 사이에서 내적 긴장을 느낄 수 있음",
          },
          locale,
        ),
        source: "questionnaire",
        confidence: 0.8,
      });
    }
  }

  // ---------- 2b. Big Five Facet Tensions (from algoSnapshot) ----------
  const facetPairs = profile?.algoSnapshot?.bigFiveFacetPairs;
  const facetPrecision = profile?.algoSnapshot?.bigFivePrecision;
  if (facetPairs && facetPrecision !== "screening") {
    const tensions = detectIntraDomainTensions(facetPairs, 2);
    for (const t of tensions) {
      const domainLabel = BIG_FIVE_LABELS[t.domain as BigFiveDimension];
      if (!domainLabel) continue;
      const highName = t.high.facet.split("_").slice(1).join(" ");
      const lowName = t.low.facet.split("_").slice(1).join(" ");
      const domainText = L(domainLabel, locale);
      memories.push({
        category: "personality",
        keyword: L(
          {
            en: `${domainLabel.en} Facet Tension`,
            zh: `${domainLabel.zh}域内张力`,
            nl: `${domainText} Facetspanning`,
            de: `${domainText} Facettenspannung`,
            fr: `Tension de facette ${domainText}`,
            es: `Tensión de faceta ${domainText}`,
            pt: `Tensão de faceta ${domainText}`,
            it: `Tensione di sfaccettatura ${domainText}`,
            ru: `Напряжение граней ${domainText}`,
            ja: `${domainText}ファセット緊張`,
            ko: `${domainText} 측면 긴장`,
          },
          locale,
        ),
        insight: L(
          {
            en: `Tension within ${domainLabel.en}: high ${highName} coexists with low ${lowName}. The domain-level score hides this contradiction — worth exploring through specific behavioral scenarios in coaching`,
            zh: `${domainLabel.zh}内部存在张力：高${highName}与低${lowName}并存。域级分数掩盖了这一矛盾——教练对话中值得用具体行为场景探索这种内在拉扯`,
          },
          locale,
        ),
        source: "questionnaire",
        confidence: 0.82,
      });
    }
  }

  // ---------- 3. Schwartz Values (from profile) ----------
  const schwartz = profile?.schwartzAnchors;
  if (schwartz?.top3) {
    const top3 = schwartz.top3.slice(0, 3);
    for (const val of top3) {
      const labels = SCHWARTZ_LABELS[val];
      const insightText = SCHWARTZ_INSIGHT[val];
      if (labels && insightText) {
        const valLabel = L(labels, locale);
        memories.push({
          category: "values",
          keyword: `${L({ en: "Core", zh: "核心", nl: "Kern", de: "Kern", fr: "Cœur", es: "Núcleo", pt: "Núcleo", it: "Nucleo", ru: "Ядро", ja: "コア", ko: "핵심" }, locale)}: ${valLabel}`,
          insight: L(insightText, locale),
          source: "questionnaire",
          confidence: 0.9,
        });
      }
    }

    // Value conflict pair (string format: e.g. 'achievement_benevolence')
    if (schwartz.conflictPair) {
      const values = getSchwartzConflictValues(schwartz.conflictPair);
      const a = values ? SCHWARTZ_LABELS[values[0]] : undefined;
      const b = values ? SCHWARTZ_LABELS[values[1]] : undefined;
      if (a && b) {
        const aLabel = L(a, locale);
        const bLabel = L(b, locale);
        memories.push({
          category: "blindspot",
          keyword: L(
            {
              en: "Value Tension",
              zh: "价值观张力",
              nl: "Waardespanning",
              de: "Wertespannung",
              fr: "Tension de valeurs",
              es: "Tensión de valores",
              pt: "Tensão de valores",
              it: "Tensione di valori",
              ru: "Ценностное напряжение",
              ja: "価値観の緊張",
              ko: "가치 긴장",
            },
            locale,
          ),
          insight: L(
            {
              en: `Tension between "${a.en}" and "${b.en}" values — may feel conflicted during major decisions`,
              zh: `「${a.zh}」与「${b.zh}」之间存在价值观冲突，可能在重大决策时感到矛盾`,
              nl: `Spanning tussen "${aLabel}" en "${bLabel}" waarden — kan zich tegenstrijdig voelen bij grote beslissingen`,
              de: `Spannung zwischen "${aLabel}" und "${bLabel}" Werten — kann bei wichtigen Entscheidungen Konflikte empfinden`,
              fr: `Tension entre les valeurs "${aLabel}" et "${bLabel}" — peut se sentir tiraillé lors de décisions majeures`,
              es: `Tensión entre los valores "${aLabel}" y "${bLabel}" — puede sentirse en conflicto en decisiones importantes`,
              pt: `Tensão entre os valores "${aLabel}" e "${bLabel}" — pode sentir-se em conflito em decisões importantes`,
              it: `Tensione tra i valori "${aLabel}" e "${bLabel}" — può sentirsi in conflitto nelle decisioni importanti`,
              ru: `Напряжение между ценностями "${aLabel}" и "${bLabel}" — может вызывать внутренний конфликт при важных решениях`,
              ja: `「${aLabel}」と「${bLabel}」の価値観間の緊張 — 重要な決断時に矛盾を感じる可能性あり`,
              ko: `"${aLabel}"와 "${bLabel}" 가치 간의 긴장 — 중요한 결정 시 갈등을 느낄 수 있음`,
            },
            locale,
          ),
          source: "questionnaire",
          confidence: 0.85,
        });
      }
    }
  }

  // ---------- 4. RIASEC top codes (from profile) ----------
  const riasec = profile?.riasecScores;
  if (riasec) {
    const sorted = (Object.entries(riasec) as [RIASECDimension, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    const top = sorted[0];
    if (top) {
      const [dim] = top;
      const labels = RIASEC_LABELS[dim];
      const insightText = RIASEC_INSIGHT[dim];
      const riasecLabel = L(labels, locale);
      memories.push({
        category: "career",
        keyword: L(
          {
            en: `${labels.en} Oriented`,
            zh: `${labels.zh}导向`,
            nl: `${riasecLabel}-georiënteerd`,
            de: `${riasecLabel}-orientiert`,
            fr: `Orienté ${riasecLabel}`,
            es: `Orientado ${riasecLabel}`,
            pt: `Orientado ${riasecLabel}`,
            it: `Orientato ${riasecLabel}`,
            ru: `Ориентация: ${riasecLabel}`,
            ja: `${riasecLabel}志向`,
            ko: `${riasecLabel} 지향`,
          },
          locale,
        ),
        insight: L(insightText, locale),
        source: "questionnaire",
        confidence: 0.85,
      });
    }
  }

  // ---------- 5. Cross-cultural (from profile) ----------
  if (profile?.crossCultural?.type) {
    const type = profile.crossCultural.type;
    const label = profile.crossCultural.label_zh;
    const typeInsights: Record<string, { zh: string; en: string }> = {
      bridge: {
        zh: "具有文化桥梁特质，能在不同文化间灵活切换和沟通",
        en: "Has cultural bridge traits, able to fluidly switch and communicate across cultures",
      },
      integrate: {
        zh: "倾向于文化整合，将多元文化背景融合为独特优势",
        en: "Tends toward cultural integration, blending multicultural background into a unique advantage",
      },
      root: {
        zh: "深植于本土文化认同，在熟悉的文化环境中最为自如",
        en: "Rooted in native cultural identity, most comfortable in familiar cultural environments",
      },
      global: {
        zh: "具有全球化视野，不受单一文化框架限制",
        en: "Has a global perspective, not constrained by a single cultural framework",
      },
    };
    const insight = typeInsights[type];
    if (insight) {
      const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
      memories.push({
        category: "behavior",
        keyword: L(
          {
            en: `${typeCapitalized} Type`,
            zh: label || `${type}型`,
            nl: `${typeCapitalized} Type`,
            de: `${typeCapitalized}-Typ`,
            fr: `Type ${typeCapitalized}`,
            es: `Tipo ${typeCapitalized}`,
            pt: `Tipo ${typeCapitalized}`,
            it: `Tipo ${typeCapitalized}`,
            ru: `Тип ${typeCapitalized}`,
            ja: `${label || type}型`,
            ko: `${label || type}형`,
          },
          locale,
        ),
        insight: L(insight, locale),
        source: "questionnaire",
        confidence: 0.8,
      });
    }
  }

  // ---------- 6. Top roles from report ----------
  if (report) {
    const idealFit = report.ideal_fit_summary as
      | Record<string, unknown>
      | undefined;
    const topRoles = (idealFit?.top_roles || idealFit?.top_3_primary_roles) as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(topRoles) && topRoles.length > 0) {
      const roleNames = topRoles
        .slice(0, 3)
        .map(
          (r) =>
            (locale === "zh"
              ? r.title_zh || r.role_zh || r.title
              : r.title_en || r.role_en || r.title) as string,
        )
        .filter(Boolean);
      if (roleNames.length > 0) {
        const roleList =
          locale === "zh" ? roleNames.join("、") : roleNames.join(", ");
        memories.push({
          category: "career",
          keyword: L(
            {
              en: "Recommended Roles",
              zh: "推荐角色",
              nl: "Aanbevolen Rollen",
              de: "Empfohlene Rollen",
              fr: "Rôles recommandés",
              es: "Roles recomendados",
              pt: "Funções recomendadas",
              it: "Ruoli consigliati",
              ru: "Рекомендуемые роли",
              ja: "推奨される役割",
              ko: "추천 역할",
            },
            locale,
          ),
          insight: L(
            {
              en: `Core career roles recommended by report: ${roleList}`,
              zh: `报告推荐的核心职业角色：${roleList}`,
              nl: `Belangrijkste carrièrerollen aanbevolen door rapport: ${roleList}`,
              de: `Vom Bericht empfohlene Kernkarrierrollen: ${roleList}`,
              fr: `Rôles professionnels clés recommandés par le rapport : ${roleList}`,
              es: `Roles profesionales clave recomendados por el informe: ${roleList}`,
              pt: `Funções profissionais principais recomendadas pelo relatório: ${roleList}`,
              it: `Ruoli professionali chiave consigliati dal report: ${roleList}`,
              ru: `Ключевые карьерные роли, рекомендованные отчётом: ${roleList}`,
              ja: `レポートが推奨する主要キャリアロール: ${roleList}`,
              ko: `리포트에서 추천하는 핵심 커리어 역할: ${roleList}`,
            },
            locale,
          ),
          source: "report",
          confidence: 0.85,
        });
      }
    }

    // Career tensions from report
    const careerTensions = report.career_tensions as
      | Record<string, unknown>
      | undefined;
    const tensions = careerTensions?.tensions as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(tensions) && tensions.length > 0) {
      const t = tensions[0];
      const desc = (
        locale === "zh"
          ? t.description_zh || t.description
          : t.description_en || t.description
      ) as string;
      if (desc) {
        memories.push({
          category: "blindspot",
          keyword: L(
            {
              en: "Career Tension",
              zh: "职业张力",
              nl: "Carrièrespanning",
              de: "Karrierespannung",
              fr: "Tension de carrière",
              es: "Tensión profesional",
              pt: "Tensão profissional",
              it: "Tensione professionale",
              ru: "Карьерное напряжение",
              ja: "キャリアの緊張",
              ko: "커리어 긴장",
            },
            locale,
          ),
          insight:
            typeof desc === "string"
              ? desc.slice(0, 200)
              : L(
                  {
                    en: "Has career tensions worth exploring",
                    zh: "存在需要关注的职业内在张力",
                    nl: "Heeft carrièrespanningen die het verkennen waard zijn",
                    de: "Hat Karrierespannungen, die es wert sind, erkundet zu werden",
                    fr: "A des tensions de carrière qui méritent d'être explorées",
                    es: "Tiene tensiones profesionales que vale la pena explorar",
                    pt: "Possui tensões profissionais que valem a pena explorar",
                    it: "Ha tensioni professionali che vale la pena esplorare",
                    ru: "Есть карьерные напряжения, которые стоит исследовать",
                    ja: "探索する価値のあるキャリアの緊張がある",
                    ko: "탐색할 가치가 있는 커리어 긴장이 있음",
                  },
                  locale,
                ),
          source: "report",
          confidence: 0.8,
        });
      }
    }
  }

  // ---------- 7. Cognitive style (from profile) — single lightweight entry ----------
  if (profile?.cognitiveStyleCode) {
    memories.push({
      category: "personality",
      keyword: L(
        {
          en: `Cognitive Style ${profile.cognitiveStyleCode}`,
          zh: `认知风格 ${profile.cognitiveStyleCode}`,
          nl: `Cognitieve Stijl ${profile.cognitiveStyleCode}`,
          de: `Kognitiver Stil ${profile.cognitiveStyleCode}`,
          fr: `Style Cognitif ${profile.cognitiveStyleCode}`,
          es: `Estilo Cognitivo ${profile.cognitiveStyleCode}`,
          pt: `Estilo Cognitivo ${profile.cognitiveStyleCode}`,
          it: `Stile Cognitivo ${profile.cognitiveStyleCode}`,
          ru: `Когнитивный Стиль ${profile.cognitiveStyleCode}`,
          ja: `認知スタイル ${profile.cognitiveStyleCode}`,
          ko: `인지 스타일 ${profile.cognitiveStyleCode}`,
        },
        locale,
      ),
      insight: L(
        {
          en: `Cognitive style code is ${profile.cognitiveStyleCode}, useful as a reference for communication style and team role`,
          zh: `认知风格代码为 ${profile.cognitiveStyleCode}，可作为沟通风格和团队角色的参考`,
          nl: `Cognitieve stijlcode is ${profile.cognitiveStyleCode}, nuttig als referentie voor communicatiestijl en teamrol`,
          de: `Kognitiver Stilcode ist ${profile.cognitiveStyleCode}, nützlich als Referenz für Kommunikationsstil und Teamrolle`,
          fr: `Code de style cognitif : ${profile.cognitiveStyleCode}, utile comme référence pour le style de communication et le rôle en équipe`,
          es: `Código de estilo cognitivo: ${profile.cognitiveStyleCode}, útil como referencia para estilo de comunicación y rol de equipo`,
          pt: `Código de estilo cognitivo: ${profile.cognitiveStyleCode}, útil como referência para estilo de comunicação e papel na equipe`,
          it: `Codice stile cognitivo: ${profile.cognitiveStyleCode}, utile come riferimento per stile comunicativo e ruolo nel team`,
          ru: `Код когнитивного стиля: ${profile.cognitiveStyleCode}, полезен как ориентир для стиля общения и роли в команде`,
          ja: `認知スタイルコード: ${profile.cognitiveStyleCode}、コミュニケーションスタイルとチーム役割の参考として有用`,
          ko: `인지 스타일 코드: ${profile.cognitiveStyleCode}, 커뮤니케이션 스타일 및 팀 역할의 참고로 유용`,
        },
        locale,
      ),
      source: "profile",
      confidence: profile.cognitiveStyleConfidence ?? 0.75,
    });
  }

  // ---------- 8. Cross-framework synthesis ----------
  const synthesisMemories = generateSynthesisMemories(input);
  memories.push(...synthesisMemories);

  // Add generation metadata
  return memories.map((m) => ({
    ...m,
    metadata: {
      generatedAt: new Date().toISOString(),
      method: "deterministic",
    },
  }));
}

// ---- Helper: extract Big Five from raw assessment JSON ----

function extractBigFiveFromAssessment(
  assessment: Record<string, unknown> | null,
): Record<BigFiveDimension, number> | null {
  if (!assessment) return null;

  // Try derivedModels path (newer format)
  const derived = assessment.derivedModels as
    | Record<string, unknown>
    | undefined;
  if (derived?.bigFiveScores)
    return derived.bigFiveScores as Record<BigFiveDimension, number>;

  // Try normalizedScores path
  const normalized = assessment.normalizedScores as
    | Record<string, unknown>
    | undefined;
  if (normalized?.bigFive)
    return normalized.bigFive as Record<BigFiveDimension, number>;

  return null;
}
