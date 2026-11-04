// ============================================================
// Shadow Algorithm — Pure Algorithmic Shadow Insight Computation
//
// Transforms PersonalProfileData → ShadowInsights.
// NO LLM calls. All content from static SHADOW_CONTENT mapping.
//
// "Shadow" in the Jungian sense: undeveloped potential, not weakness.
// Low-scoring Big Five dimensions hold latent career advantages in
// contexts where those traits become assets.
// ============================================================

import type { PersonalProfileData, ShadowInsight, ShadowInsights } from '../types';
import type { BigFiveDimension } from '../types';
import { SHADOW_CONTENT, DOMAIN_LABELS } from '../content/shadow-content';

// Minimum shadow intensity to include a dimension (avoids noise from near-average scores)
const SHADOW_THRESHOLD = 8;

// Maximum number of shadow insights to surface
const MAX_SHADOWS = 3;

/**
 * Compute the "shadow intensity" for a domain.
 *
 * For Extraversion, Agreeableness, Conscientiousness, Openness:
 *   intensity = max(0, 50 - score)   — low score = stronger shadow
 *
 * For Neuroticism:
 *   intensity = max(0, score - 45)   — high score = heightened sensitivity = shadow gift
 */
function shadowIntensity(domain: BigFiveDimension, score: number): number {
  if (domain === 'neuroticism') {
    return Math.max(0, score - 45);
  }
  return Math.max(0, 50 - score);
}

/**
 * Detect a cross-framework tension between a shadow dimension and the user's
 * RIASEC archetype or top Schwartz values.
 */
function detectTension(
  domain: BigFiveDimension,
  score: number,
  profile: PersonalProfileData,
): ShadowInsight['tensionWith'] | undefined {
  const primary = profile.archetype?.primary;
  const secondaryRiasec = profile.archetype?.derivedFrom?.secondary?.dimension;
  const top3Values = profile.schwartzAnchors?.top3 ?? [];

  if (domain === 'extraversion' && score < 40) {
    if (primary === 'S' || secondaryRiasec === 'S') {
      return {
        framework: 'riasec',
        dimension: 'Social',
        description_zh:
          '你对人际工作的兴趣与你对安静深度的需求形成张力——高互动角色会比大多数人更快消耗你。',
        description_en:
          'Your interest in people-facing work sits in tension with your need for inner quiet — high-interaction roles will drain you faster than most.',
      };
    }
    if (primary === 'E' || secondaryRiasec === 'E') {
      return {
        framework: 'riasec',
        dimension: 'Enterprising',
        description_zh:
          '你对领导力的向往与你偏好安静深度之间形成张力——你需要找到一种不需要持续表演的领导方式。',
        description_en:
          "Your draw to leadership sits in tension with your preference for quiet depth — you'll need to lead in ways that don't require constant performance.",
      };
    }
  }

  if (domain === 'agreeableness' && score < 40) {
    if (top3Values.includes('benevolence')) {
      return {
        framework: 'schwartz',
        dimension: 'benevolence',
        description_zh:
          '你深切希望帮助他人，但你的本能倾向独立而非和谐——这在以服务为核心的角色中创造了一种创造性张力。',
        description_en:
          "You deeply want to help others, yet your instinct is independence rather than harmony — a creative tension in service-oriented roles.",
      };
    }
  }

  if (domain === 'conscientiousness' && score < 40) {
    if (primary === 'C' || secondaryRiasec === 'C') {
      return {
        framework: 'riasec',
        dimension: 'Conventional',
        description_zh:
          '你对有结构、精准工作的兴趣与你天然的自发性形成张力——你在有外部结构支撑的环境中会比自我驱动的常规管理更茁壮成长。',
        description_en:
          "Your interest in structured, precise work sits in tension with your natural spontaneity — you'll thrive with external structure rather than self-imposed routine.",
      };
    }
  }

  if (domain === 'openness' && score < 40) {
    if (primary === 'I' || secondaryRiasec === 'I') {
      return {
        framework: 'riasec',
        dimension: 'Investigative',
        description_zh:
          '你对探究工作的兴趣与你偏好已验证方法之间形成张力——在研究类角色中，选择专注于执行深度而非持续创新的子领域。',
        description_en:
          "Your interest in investigative work sits in tension with your preference for proven methods — within research roles, seek the sub-roles focused on execution depth rather than constant invention.",
      };
    }
    if (primary === 'A' || secondaryRiasec === 'A') {
      return {
        framework: 'riasec',
        dimension: 'Artistic',
        description_zh:
          '你对创意工作的兴趣与你偏好已验证方法之间形成张力——在创意类角色中，专注于将创意想法转化为可执行结构的角色最适合你。',
        description_en:
          "Your draw to creative work sits in tension with your preference for the familiar — within creative fields, seek roles that translate creative ideas into executable structures.",
      };
    }
  }

  if (domain === 'neuroticism' && score > 55) {
    if (top3Values.includes('power')) {
      return {
        framework: 'schwartz',
        dimension: 'power',
        description_zh:
          '你对影响力的渴望与你内在的情感敏感性形成张力——在高竞争环境中，你的感知既是优势也是需要保护的资源。',
        description_en:
          "Your drive for influence sits in tension with your heightened emotional sensitivity — in high-competition environments, your attunement is both an asset and a resource to protect.",
      };
    }
    if (top3Values.includes('achievement')) {
      return {
        framework: 'schwartz',
        dimension: 'achievement',
        description_zh:
          '你对成就的渴望与你内在的情感敏感性形成张力——在高绩效环境中，记得建立恢复性仪式保护你的感知能力。',
        description_en:
          "Your drive for achievement sits in tension with your heightened emotional sensitivity — in high-performance environments, build recovery practices to protect your perceptive capacity.",
      };
    }
  }

  return undefined;
}

/**
 * Generate a 1-2 sentence overall pattern summary from the selected shadow dimensions.
 */
function generateOverallPattern(shadows: ShadowInsight[]): { zh: string; en: string } {
  const domains = shadows.map((s) => s.domain);

  if (domains.includes('extraversion') && domains.includes('neuroticism')) {
    return {
      en: 'Your shadow pattern centers on quiet depth: a reserved, empathetically attuned inner world that processes what others miss. The work ahead is learning to surface this depth at the moments when it matters most.',
      zh: '你的阴影图谱以安静的深度为中心：一个内敛、深度共情的内在世界，能处理他人忽略的信号。接下来的工作是学会在最重要的时刻展现这份深度。',
    };
  }

  if (domains.includes('extraversion') && domains.includes('agreeableness')) {
    return {
      en: 'Your shadow pattern suggests quiet independence: reserve combined with discernment. You observe deeply, hold your own counsel, and push back when it matters. The work is knowing when to surface that judgment.',
      zh: '你的阴影图谱指向安静的独立性：内敛与辨别力的结合。你观察深刻，守护内心判断，在关键时刻敢于反驳。工作是学会何时展现这种判断力。',
    };
  }

  if (domains.includes('conscientiousness') && domains.includes('openness')) {
    return {
      en: 'Your shadow pattern suggests fluent pragmatism: comfort with ambiguity paired with a preference for proven approaches. In fast-moving contexts, this combination allows rapid iteration within tested frameworks.',
      zh: '你的阴影图谱指向流动的务实主义：对模糊性的适应能力，加上对已验证方法的偏好。在快速变化的情境中，这种组合让你能在经过检验的框架内快速迭代。',
    };
  }

  if (domains.includes('agreeableness') && domains.includes('conscientiousness')) {
    return {
      en: "Your shadow pattern is about operating on your own terms: independent judgment paired with adaptive flexibility. You resist both social pressure and rigid procedure — strongest in roles that reward autonomous decision-making.",
      zh: '你的阴影图谱关于按自己的方式行事：独立判断与适应性灵活性的结合。你抵制社会压力和僵化程序——在奖励自主决策的角色中最为出色。',
    };
  }

  if (domains.includes('extraversion') && domains.includes('conscientiousness')) {
    return {
      en: 'Your shadow pattern is deep, independent focus: reserved energy paired with flexible flow. You work best when left to process and create without external performance demands.',
      zh: '你的阴影图谱是深度、独立的专注：内敛的能量与灵活的流动性结合。当被允许自主处理和创造、没有外部表演要求时，你发挥最佳状态。',
    };
  }

  if (domains.length > 0) {
    const primary = shadows[0];
    return {
      en: `Your dominant shadow is ${primary.shadowLabel_en.toLowerCase()}: the undeveloped potential in your ${DOMAIN_LABELS[primary.domain].en.toLowerCase()} holds specific advantages in the right career contexts.`,
      zh: `你的主要阴影是${primary.shadowLabel_zh}：你在${DOMAIN_LABELS[primary.domain].zh}维度上的未开发潜力在正确的职业情境中具有特定优势。`,
    };
  }

  return {
    en: 'Your personality dimensions are well-integrated, with no single dominant shadow pattern. This broad balance is itself a form of adaptability.',
    zh: '你的人格维度整合良好，没有单一主导的阴影图谱。这种广泛的均衡本身就是一种适应力。',
  };
}

/**
 * Compute shadow insights from a PersonalProfileData.
 *
 * Pure algorithm — no LLM calls.
 * Returns an empty ShadowInsights object if bigFiveScores is not available.
 */
export function computeShadowInsights(profile: PersonalProfileData): ShadowInsights {
  const bigFive = profile.bigFiveScores;

  if (!bigFive) {
    return { shadows: [], overallPattern_zh: '', overallPattern_en: '' };
  }

  // Rank dimensions by shadow intensity, filter noise, cap at MAX_SHADOWS
  const candidates = (Object.entries(bigFive) as [BigFiveDimension, number][])
    .map(([domain, score]) => ({
      domain,
      score,
      intensity: shadowIntensity(domain, score),
    }))
    .filter((c) => c.intensity >= SHADOW_THRESHOLD)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, MAX_SHADOWS);

  const shadows: ShadowInsight[] = candidates.map(({ domain, score }) => {
    const content = SHADOW_CONTENT[domain];
    const tension = detectTension(domain, score, profile);

    return {
      facet: domain,
      domain,
      score,
      shadowLabel_zh: content.shadowLabel.zh,
      shadowLabel_en: content.shadowLabel.en,
      contextualStrength_zh: content.contextualStrength.zh,
      contextualStrength_en: content.contextualStrength.en,
      integrationHint_zh: content.integrationHint.zh,
      integrationHint_en: content.integrationHint.en,
      relatedCareerContexts: content.advantageousContexts,
      spectrumLowLabel: content.spectrumLowLabel,
      spectrumHighLabel: content.spectrumHighLabel,
      tensionWith: tension,
    };
  });

  const pattern = generateOverallPattern(shadows);

  return {
    shadows,
    overallPattern_zh: pattern.zh,
    overallPattern_en: pattern.en,
  };
}
