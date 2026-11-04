// ============================================================
// Behavior Insights — Decision-Style Derivation
// Transforms response-time metadata (rushCount / hesitationCount)
// into a user-facing insight and a coaching prompt hint.
// ============================================================

export type BehaviorProfile = 'decisive' | 'reflective' | 'mixed' | 'exploratory'

export interface BehaviorInsight {
  profile: BehaviorProfile
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  coachingHint_zh: string
  coachingHint_en: string
}

/**
 * Derive a decision-style insight from response-time behavior data.
 *
 * Threshold: >30 % of total questions triggers "high" for that metric.
 *   - rushCount high + hesitationCount low  → decisive
 *   - hesitationCount high + rushCount low  → reflective
 *   - both high                             → mixed
 *   - both low                              → exploratory
 */
export function getBehaviorInsight(
  rushCount: number,
  hesitationCount: number,
  totalQuestions: number,
): BehaviorInsight {
  const threshold = 0.3
  const rushRatio = totalQuestions > 0 ? rushCount / totalQuestions : 0
  const hesitationRatio = totalQuestions > 0 ? hesitationCount / totalQuestions : 0

  const highRush = rushRatio > threshold
  const highHesitation = hesitationRatio > threshold

  if (highRush && !highHesitation) {
    return {
      profile: 'decisive',
      title_zh: '果断型决策者',
      title_en: 'Decisive Decision-Maker',
      description_zh:
        '你的直觉反应迅速，通常对自己的偏好有清晰感知。这种果断往往意味着你对核心价值有较强的内在锚定。',
      description_en:
        'Your intuitive responses are swift — you tend to have a clear sense of your preferences. This decisiveness often signals strong inner anchoring around core values.',
      coachingHint_zh:
        '用户的决策风格偏果断型——直觉反应快，偏好清晰。在对话中可以探索：这种果断是来自内在确信，还是倾向于回避不确定性？',
      coachingHint_en:
        'The user has a decisive decision style — fast intuitive responses with clear preferences. Explore whether this decisiveness comes from inner conviction or a tendency to avoid uncertainty.',
    }
  }

  if (highHesitation && !highRush) {
    return {
      profile: 'reflective',
      title_zh: '深思型决策者',
      title_en: 'Reflective Decision-Maker',
      description_zh:
        '你在某些选择上停留了较久，这通常意味着内心存在真实的价值张力。这种深思是自我觉察的表现，而非优柔寡断。',
      description_en:
        'You lingered on certain choices — this usually signals genuine value tensions within. This reflectiveness is a sign of self-awareness, not indecision.',
      coachingHint_zh:
        '用户的决策风格偏深思型——在多个选择上停留较久，内心可能存在价值冲突。在对话中可以温和地探索这些犹豫背后的具体张力。',
      coachingHint_en:
        'The user has a reflective decision style — they lingered on multiple choices, possibly facing value conflicts. Gently explore the specific tensions behind their hesitations.',
    }
  }

  if (highRush && highHesitation) {
    return {
      profile: 'mixed',
      title_zh: '选择性直觉型',
      title_en: 'Selective Intuition',
      description_zh:
        '你的决策节奏不均匀——某些领域本能清晰，某些领域则需要更多探索。这种模式本身就是一种有价值的自我信号。',
      description_en:
        'Your decision pace is uneven — instinctively clear in some areas, needing more exploration in others. This pattern itself is a valuable self-signal.',
      coachingHint_zh:
        '用户的决策风格呈现混合型——某些领域反应极快，某些领域犹豫较久。在对话中可以帮助用户区分哪些领域是"已确信"的，哪些还需要探索。',
      coachingHint_en:
        'The user has a mixed decision style — very fast in some areas, hesitant in others. Help them distinguish which areas feel "settled" versus which need more exploration.',
    }
  }

  // Both low → exploratory
  return {
    profile: 'exploratory',
    title_zh: '稳健探索型',
    title_en: 'Steady Explorer',
    description_zh:
      '你以稳定节奏完成了整个深度探索，没有仓促也没有过度纠结。这本身就是一种自我觉察的信号，意味着你在认真对待每一个选择。',
    description_en:
      'You completed the entire deep dive at a steady pace — neither rushing nor overthinking. This itself is a signal of self-awareness, meaning you took each choice seriously.',
    coachingHint_zh:
      '用户以稳定节奏完成了测评，决策风格均衡。这可能意味着用户处于认真探索的心态，在对话中可以直接深入核心问题。',
    coachingHint_en:
      'The user completed the assessment at a steady pace with a balanced decision style. This may indicate a serious exploratory mindset — feel free to dive into core questions directly.',
  }
}
