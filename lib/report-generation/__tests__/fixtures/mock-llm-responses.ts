// ============================================================
// Mock LLM Responses — Valid and Invalid
// For testing JSON parsing, retry, and fallback behavior.
// ============================================================

// ── Profile Narrative ──────────────────────────────────────

export const VALID_PROFILE_NARRATIVE = JSON.stringify({
  archetypeNarrative:
    'Your exploration reveals a pattern that bridges analysis and creative expression. Your interest map shows strong peaks in decoding and creating, suggesting you thrive when you can first understand a problem deeply, then translate that understanding into something others can experience.',
  bigFiveNarrative:
    'Your personality data tells an interesting story through its 30 facets. Your Imagination scores are notably high, paired with strong Intellect — you tend to see possibilities that others miss. Yet your Gregariousness score sits lower, suggesting that your creative process is more internal than social. This contrast between rich inner exploration and selective social engagement is worth noting.',
  sjtTensionNarrative:
    'Your behavioral choices align closely with your stated ideals, with an overall consistency of 85%. This suggests a high degree of self-awareness — you tend to act in ways that match what you believe is right.',
  valueNarrative:
    'Your top three values — Self-Direction, Benevolence, and Achievement — paint a clear picture. Self-Direction scores highest in your centered values, meaning independent thinking matters more to you than average. The combination with Benevolence suggests you want autonomy not for its own sake, but to help others in your own way.',
  adaptabilityNarrative:
    'Your orientation toward career change sits in a moderate zone. Your Openness scores suggest curiosity about new possibilities, while your security values aren\'t negligible — you prefer change that feels purposeful rather than chaotic.',
  valuesCrossImpactNarrative:
    'Your Self-Direction value amplifies your Investigative interests in a specific way: you pursue intellectual exploration on your own terms, not because someone assigned it. The combination with high Imagination creates a distinctive pattern — you generate ideas through solitary immersion rather than collaborative brainstorming. When facing a career decision, your Benevolence value then acts as a filter: you gravitate toward work where your analytical creativity serves others rather than just yourself.',
});

export const INCOMPLETE_PROFILE_NARRATIVE = JSON.stringify({
  archetypeNarrative: 'Your pattern bridges analysis and creation.',
  bigFiveNarrative: 'Your personality shows interesting contrasts.',
  // Missing: sjtTensionNarrative, valueNarrative, adaptabilityNarrative
});

export const INVALID_JSON_RESPONSE = '{"archetypeNarrative": "incomplete JSON...';

export const EMPTY_RESPONSE = '';

// ── Panel 1 Narrative ──────────────────────────────────────

export const VALID_PANEL1_NARRATIVE = JSON.stringify({
  summary:
    'Based on your interest map, personality profile, and values, these five directions represent the strongest alignment with your exploration patterns. Each combines your analytical strength with creative potential.',
  directions: [
    {
      whySuitable:
        'Your high Decode and Create dimensions, combined with strong Self-Direction values, suggest this direction could leverage your natural pattern of deep analysis followed by creative synthesis.',
      challenges:
        'This direction may require more sustained social engagement than your current comfort zone. Your lower Gregariousness scores suggest building this capacity gradually.',
      actionableInsights: null,
    },
    {
      whySuitable:
        'The data suggests your Intellect facet and Achievement values align well with this direction. Your RIASEC profile shows the analytical depth this role demands.',
      challenges:
        'The structured environment may feel constraining given your high Self-Direction values. Finding organizations that offer autonomy within structure will be key.',
    },
    {
      whySuitable:
        'Your combination of high Openness and Imagination facets, paired with Benevolence values, makes this a direction worth exploring.',
      challenges:
        'This direction requires consistent output discipline, which may tension with your lower Conscientiousness scores.',
    },
    {
      whySuitable:
        'Your RIASEC cosine similarity is strong here. The mix of Investigation and Artistic dimensions matches well.',
      challenges:
        'Market entry can be competitive. Your profile suggests starting with projects that showcase analytical creativity.',
    },
    {
      whySuitable:
        'This direction aligns with your value anchors — particularly Self-Direction and Achievement — while leveraging your analytical profile.',
      challenges:
        'Building initial credibility may require more networking than your natural tendencies prefer.',
    },
  ],
});

export const INCOMPLETE_PANEL1_NARRATIVE = JSON.stringify({
  summary: 'These directions are worth exploring.',
  directions: [], // Empty array — should trigger retry
});

export const PANEL1_MISSING_SUMMARY = JSON.stringify({
  directions: [
    { whySuitable: 'Good fit.', challenges: 'Some challenges.' },
  ],
});

// ── Career Drain ───────────────────────────────────────────

export const VALID_CAREER_DRAIN = JSON.stringify({
  drainingDirections: [
    {
      title_zh: '大客户销售经理',
      title_en: 'Enterprise Sales Manager',
      reason_zh: '你的 Gregariousness 得分较低(1.5)，且 Extraversion 整体处于低位。持续的高强度社交互动可能造成显著的能量消耗。',
      reason_en: 'Your Gregariousness score is notably low (1.5), and Extraversion sits in the lower range. Sustained high-intensity social interaction may cause significant energy drain.',
    },
    {
      title_zh: '行政合规专员',
      title_en: 'Compliance Officer',
      reason_zh: '你的 Orderliness(1.8) 和 Cautiousness(2.1) 得分偏低，而 Self-Direction 是你的核心价值锚。高度规范化的角色可能与你的内在动力产生持续摩擦。',
      reason_en: 'Low Orderliness (1.8) and Cautiousness (2.1) scores, combined with Self-Direction as a core value, suggest sustained friction in highly regulated roles.',
    },
  ],
  drainingIndustries: [
    {
      name_zh: '传统金融（银行/保险）',
      name_en: 'Traditional Finance (Banking/Insurance)',
      reason_zh: '你的 Tradition 和 Conformity 价值观排名最低，这类行业的文化可能让你感到窒息。',
      reason_en: 'Your Tradition and Conformity values rank lowest — the culture in these industries may feel stifling.',
    },
    {
      name_zh: '快消品销售',
      name_en: 'FMCG Sales',
      reason_zh: '高重复性 + 强社交需求与你的低 Gregariousness 和高 Stimulation 价值观直接冲突。',
      reason_en: 'High repetition plus strong social demands directly conflict with your low Gregariousness and high Stimulation values.',
    },
  ],
  drainingManagementStyles: [
    {
      style_zh: '微管理型领导',
      style_en: 'Micromanagement',
      reason_zh: '你的 Self-Direction 排名第一，微管理会直接压制你的核心动力源。',
      reason_en: 'Self-Direction is your top value — micromanagement directly suppresses your core motivation.',
    },
    {
      style_zh: '高度社交型团队文化',
      style_en: 'Highly social team culture',
      reason_zh: '频繁的团建和社交活动对你的 Introversion 倾向可能是持续的能量消耗。',
      reason_en: 'Frequent team-building and social activities may continuously drain your introverted energy.',
    },
  ],
  redFlagEnvironments: [
    { signal_zh: '每天超过4小时的会议', signal_en: 'More than 4 hours of meetings daily' },
    { signal_zh: '开放式办公室无安静空间', signal_en: 'Open office with no quiet spaces' },
    { signal_zh: '绩效主要基于社交指标', signal_en: 'Performance primarily measured by social metrics' },
  ],
  framingSummary_zh: '这些是基于你人格画像的预警信号，不是禁区。如果某个方向吸引你，探索它——但带着对自身能量管理的觉察。',
  framingSummary_en: 'These are early warning signals based on your profile, not prohibitions. If a direction attracts you, explore it — but with awareness of your energy management needs.',
});

export const CAREER_DRAIN_MISSING_FIELDS = JSON.stringify({
  drainingDirections: [
    { title_zh: '销售', title_en: 'Sales', reason_zh: '不适合', reason_en: 'Not a fit' },
  ],
  // Missing: drainingIndustries, drainingManagementStyles, redFlagEnvironments, framingSummary
});

// ── Integration ────────────────────────────────────────────

export const VALID_INTEGRATION = JSON.stringify({
  coreInsight:
    'Your exploration reveals a Synthesizer pattern — someone who connects analysis with creative expression. The directions worth exploring leverage this bridge, and your next step is to test these connections in small experiments.',
  transitions: {
    profileToPathway:
      'Understanding your patterns is the foundation — now let\'s map a concrete path forward —',
  },
  letterToUser:
    'Hello.\n\nYour exploration through 147 questions has painted a picture of someone who lives at the intersection of understanding and creating. As a Synthesizer, you don\'t just want to know things — you want to translate that knowledge into something others can feel.\n\nYour values tell an important story. Self-Direction and Benevolence sit at the top, suggesting you want the freedom to help others in your own way. Your Big Five profile adds nuance — high Imagination paired with selective social engagement means your best work likely happens when you have both space to think and a meaningful audience to create for.\n\nYour behavioral consistency score of 85% tells us something valuable: you generally act in alignment with your ideals. This isn\'t about perfection — it\'s about self-awareness.\n\nYou are more than this label — this report is a snapshot, not a sentence. Your profile evolves as you do. Take what resonates, question what doesn\'t, and use your AI coaching conversations to go deeper.',
});

export const INTEGRATION_MISSING_CORE = JSON.stringify({
  transitions: {
    profileToPathway: 'transition text',
  },
  letterToUser: 'A letter to the user.',
  // Missing: coreInsight — should trigger retry
});

export const INTEGRATION_MISSING_LETTER = JSON.stringify({
  coreInsight: 'An insight.',
  transitions: {
    profileToPathway: 'c',
  },
  // Missing: letterToUser — should trigger retry
});

// ── Panel 3 ────────────────────────────────────────────────

export const VALID_PANEL3_LLM = JSON.stringify({
  jobDirections: [
    {
      title_zh: 'AI产品经理',
      title_en: 'AI Product Manager',
      industry: 'tech',
      seniority: 'mid-level',
      matchScore: 82,
      matchReason: 'Your analytical depth and creative synthesis skills are worth exploring in AI product roles.',
      linkedinSearchQuery: 'AI product manager tech',
      isIdealMatch: true,
      resourceGuide: {
        atsKeywords: ['product strategy', 'AI/ML', 'cross-functional', 'data-driven', 'roadmap'],
        linkedinTip_zh: '在标题中加入"AI Product"关键词',
        linkedinTip_en: 'Add "AI Product" to your LinkedIn headline',
        salaryContext_zh: '北美 $120k-180k USD，需3-5年产品经验',
        salaryContext_en: 'North America $120k-180k USD, requires 3-5 years product experience',
      },
      gapAnalysis: {
        readinessScore: 65,
        readinessLabel_zh: '基础具备，需补强',
        readinessLabel_en: 'Foundation ready, needs strengthening',
        skillGaps: [
          {
            skill_zh: '产品路线图',
            skill_en: 'Product Roadmapping',
            currentLevel_zh: '有技术背景',
            currentLevel_en: 'Technical background',
            requiredLevel_zh: '能独立制定季度路线图',
            requiredLevel_en: 'Can independently create quarterly roadmaps',
            bridgeAction_zh: '完成一个Product School在线课程',
            bridgeAction_en: 'Complete a Product School online course',
            timeToClose: '2 months',
            difficulty: 'low',
          },
        ],
        experienceGaps: [
          {
            gap_zh: '缺少正式的产品管理经验',
            gap_en: 'No formal PM experience',
            workaround_zh: '用现有技术项目经验包装为产品思维案例',
            workaround_en: 'Frame existing technical projects as product thinking case studies',
          },
        ],
        conditionsAlignment: {
          visaCompatibility: 'favorable',
          locationMatch: 'strong',
          salaryExpectationMatch: 'within_range',
          note_zh: 'H1B签证对科技公司友好，旧金山是AI产品管理的核心市场',
          note_en: 'H1B is favorable for tech companies, SF is a core market for AI PM roles',
        },
        timelineToCompetitive_zh: '3-6个月后具备竞争力',
        timelineToCompetitive_en: 'Competitive in 3-6 months',
        topPriorityAction_zh: '本周在LinkedIn搜索"AI Product Manager"并申请3个岗位',
        topPriorityAction_en: 'Search "AI Product Manager" on LinkedIn this week and apply to 3 positions',
      },
    },
  ],
  jobSearchStrategy: {
    positioning: 'Position yourself as a technical product thinker who bridges engineering and user experience.',
    resumeHighlights: [
      'Technical depth in software engineering',
      'Cross-functional collaboration experience',
      'Data-driven decision making',
    ],
    networkingTips: [
      'Join the "Product Led Growth" LinkedIn group',
      'Attend local AI meetups in SF',
    ],
    constraintStrategies: [
      {
        constraint: 'H1B visa sponsorship',
        strategy: 'Target large tech companies (FAANG+) that regularly sponsor H1B transfers',
      },
    ],
  },
  week1: {
    theme: 'Find Direction',
    tasks: [
      { description: 'Search LinkedIn for "AI Product Manager" and save 5 interesting postings', relatedDirection: 1, difficulty: 'easy' },
      { description: 'Read one article about transitioning from engineering to PM', relatedDirection: 1, difficulty: 'easy' },
      { description: 'Identify 3 companies that sponsor H1B for PM roles', relatedDirection: 1, difficulty: 'medium' },
    ],
  },
  weeksPreview: [
    { weekNumber: 2, theme: 'Gather Info', taskCount: 6 },
    { weekNumber: 3, theme: 'Small Experiments', taskCount: 7 },
    { weekNumber: 4, theme: 'Build Habits', taskCount: 5 },
  ],
});

export const PANEL3_INCOMPLETE = JSON.stringify({
  jobDirections: [],
  // Missing: jobSearchStrategy, week1
});

// ── Helper: Build mock OpenAI response ─────────────────────

export function buildMockOpenAIResponse(content: string) {
  return {
    choices: [{ message: { content }, finish_reason: 'stop' }],
  };
}

export function buildEmptyOpenAIResponse() {
  return {
    choices: [{ message: { content: undefined }, finish_reason: 'stop' }],
  };
}
