// ============================================================
// SOC Major Group Annotations — Big Five + Values
//
// Provides group-level Big Five idealRange and aligned values
// for O*NET occupations that lack individual Big Five annotations.
//
// Sources:
//   - Barrick & Mount (1991): Big Five meta-analysis by occupation group
//   - Judge et al. (1999): Big Five and career success
//   - Holland (1997): RIASEC-occupation mapping
//   - Schwartz (2012): Values and occupational choice
//   - O*NET Content Model: Work Styles → Big Five mapping
//
// Design principle:
//   - Ranges are intentionally WIDER than individual career annotations
//     to avoid false precision at the group level
//   - Only annotate dimensions with clear group-level signal
//   - Unannotated dimensions → calculatePersonalityFit returns neutral (60)
//
// Usage:
//   When a career has empty idealBigFive, look up its SOC group here
//   and use the group-level annotation as fallback.
//
// Generated: 2026-03-10
// ============================================================

export interface SOCGroupAnnotation {
  socMajor: string            // e.g. '11', '13', '15'
  label_en: string
  label_zh: string
  idealBigFive: Partial<Record<
    'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism',
    { min: number; max: number }
  >>
  alignedValues: string[]     // 2-3 Schwartz value types: power | achievement | hedonism | stimulation | self-direction | universalism | benevolence | conformity | tradition | security
}

/**
 * Also covers emerging career category prefixes.
 * Emerging categories are mapped to the closest SOC-equivalent group.
 */
export interface EmergingGroupAnnotation {
  category: string            // e.g. 'ai', 'web3', 'green'
  label_en: string
  label_zh: string
  idealBigFive: Partial<Record<
    'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism',
    { min: number; max: number }
  >>
  alignedValues: string[]
}

// ============================================================
// 22 SOC Major Groups
// ============================================================

export const SOC_GROUP_ANNOTATIONS: SOCGroupAnnotation[] = [
  {
    // 56 careers: Chief Executives, General Managers, Legislators, etc.
    socMajor: '11',
    label_en: 'Management',
    label_zh: '管理',
    idealBigFive: {
      extraversion: { min: 50, max: 95 },
      conscientiousness: { min: 55, max: 95 },
    },
    alignedValues: ['achievement', 'self-direction'],
  },
  {
    // 48 careers: Accountants, Financial Analysts, Budget Analysts, etc.
    socMajor: '13',
    label_en: 'Business and Financial Operations',
    label_zh: '商业与金融',
    idealBigFive: {
      conscientiousness: { min: 60, max: 95 },
    },
    alignedValues: ['achievement', 'security'],
  },
  {
    // 36 careers: Software Developers, Data Scientists, Statisticians, etc.
    socMajor: '15',
    label_en: 'Computer and Mathematical',
    label_zh: '计算机与数学',
    idealBigFive: {
      openness: { min: 50, max: 95 },
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    // 56 careers: Civil Engineers, Architects, Surveyors, etc.
    socMajor: '17',
    label_en: 'Architecture and Engineering',
    label_zh: '建筑与工程',
    idealBigFive: {
      conscientiousness: { min: 55, max: 95 },
      openness: { min: 40, max: 85 },
    },
    alignedValues: ['stimulation', 'achievement'],
  },
  {
    // 60 careers: Physicists, Biologists, Psychologists, Sociologists, etc.
    socMajor: '19',
    label_en: 'Life, Physical, and Social Science',
    label_zh: '生命/物理/社会科学',
    idealBigFive: {
      openness: { min: 60, max: 100 },
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['self-direction', 'universalism'],
  },
  {
    // 14 careers: Counselors, Social Workers, Clergy, etc.
    socMajor: '21',
    label_en: 'Community and Social Service',
    label_zh: '社区与社会服务',
    idealBigFive: {
      agreeableness: { min: 55, max: 95 },
      extraversion: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    // 7 careers: Lawyers, Judges, Paralegals, etc.
    socMajor: '23',
    label_en: 'Legal',
    label_zh: '法律',
    idealBigFive: {
      conscientiousness: { min: 60, max: 95 },
      openness: { min: 45, max: 85 },
    },
    alignedValues: ['achievement', 'security'],
  },
  {
    // 62 careers: Teachers (K-12, postsecondary), Librarians, etc.
    socMajor: '25',
    label_en: 'Educational Instruction and Library',
    label_zh: '教育与图书馆',
    idealBigFive: {
      agreeableness: { min: 50, max: 90 },
      openness: { min: 50, max: 90 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    // 40 careers: Artists, Designers, Musicians, Writers, Reporters, etc.
    socMajor: '27',
    label_en: 'Arts, Design, Entertainment, Sports, and Media',
    label_zh: '艺术/设计/娱乐/体育/媒体',
    idealBigFive: {
      openness: { min: 65, max: 100 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    // 89 careers: Physicians, Nurses, Pharmacists, Therapists, etc.
    socMajor: '29',
    label_en: 'Healthcare Practitioners and Technical',
    label_zh: '医疗专业与技术',
    idealBigFive: {
      conscientiousness: { min: 60, max: 95 },
      agreeableness: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'security'],
  },
  {
    // 19 careers: Home Health Aides, Nursing Assistants, etc.
    socMajor: '31',
    label_en: 'Healthcare Support',
    label_zh: '医疗辅助',
    idealBigFive: {
      agreeableness: { min: 55, max: 95 },
    },
    alignedValues: ['universalism', 'security'],
  },
  {
    // 26 careers: Police, Firefighters, Security Guards, etc.
    socMajor: '33',
    label_en: 'Protective Service',
    label_zh: '保护性服务',
    idealBigFive: {
      conscientiousness: { min: 55, max: 95 },
      extraversion: { min: 40, max: 80 },
    },
    alignedValues: ['security', 'universalism'],
  },
  {
    // 16 careers: Chefs, Cooks, Bartenders, Food Service Managers, etc.
    socMajor: '35',
    label_en: 'Food Preparation and Serving',
    label_zh: '餐饮服务',
    idealBigFive: {
      extraversion: { min: 40, max: 85 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    // 8 careers: Janitors, Landscapers, Pest Control, etc.
    socMajor: '37',
    label_en: 'Building and Grounds Cleaning and Maintenance',
    label_zh: '建筑清洁与维护',
    idealBigFive: {
      conscientiousness: { min: 45, max: 85 },
    },
    alignedValues: ['security', 'self-direction'],
  },
  {
    // 31 careers: Hairdressers, Fitness Trainers, Funeral Directors, etc.
    socMajor: '39',
    label_en: 'Personal Care and Service',
    label_zh: '个人护理与服务',
    idealBigFive: {
      agreeableness: { min: 50, max: 90 },
      extraversion: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    // 22 careers: Retail Salespersons, Insurance Agents, Real Estate, etc.
    socMajor: '41',
    label_en: 'Sales and Related',
    label_zh: '销售',
    idealBigFive: {
      extraversion: { min: 55, max: 95 },
    },
    alignedValues: ['achievement', 'self-direction'],
  },
  {
    // 51 careers: Secretaries, Bookkeepers, Receptionists, etc.
    socMajor: '43',
    label_en: 'Office and Administrative Support',
    label_zh: '行政与办公支持',
    idealBigFive: {
      conscientiousness: { min: 55, max: 90 },
    },
    alignedValues: ['security', 'achievement'],
  },
  {
    // 12 careers: Farmers, Fishers, Loggers, etc.
    socMajor: '45',
    label_en: 'Farming, Fishing, and Forestry',
    label_zh: '农业/渔业/林业',
    idealBigFive: {
      conscientiousness: { min: 45, max: 85 },
    },
    alignedValues: ['self-direction', 'security'],
  },
  {
    // 61 careers: Carpenters, Electricians, Plumbers, etc.
    socMajor: '47',
    label_en: 'Construction and Extraction',
    label_zh: '建筑与采掘',
    idealBigFive: {
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['security', 'achievement'],
  },
  {
    // 50 careers: Automotive Mechanics, HVAC Technicians, etc.
    socMajor: '49',
    label_en: 'Installation, Maintenance, and Repair',
    label_zh: '安装/维护/维修',
    idealBigFive: {
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['security', 'achievement'],
  },
  {
    // 107 careers: Assemblers, Machinists, Welders, Plant Operators, etc.
    socMajor: '51',
    label_en: 'Production',
    label_zh: '生产制造',
    idealBigFive: {
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['security', 'achievement'],
  },
  {
    // 52 careers: Truck Drivers, Pilots, Sailors, etc.
    socMajor: '53',
    label_en: 'Transportation and Material Moving',
    label_zh: '运输与物流',
    idealBigFive: {
      conscientiousness: { min: 45, max: 85 },
    },
    alignedValues: ['security', 'self-direction'],
  },
]

// ============================================================
// 11 Emerging Career Categories
// ============================================================

export const EMERGING_GROUP_ANNOTATIONS: EmergingGroupAnnotation[] = [
  {
    category: 'ai',
    label_en: 'AI & Machine Learning',
    label_zh: 'AI与机器学习',
    idealBigFive: {
      openness: { min: 60, max: 100 },
      conscientiousness: { min: 50, max: 90 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    category: 'data',
    label_en: 'Data Engineering & Analytics',
    label_zh: '数据工程与分析',
    idealBigFive: {
      openness: { min: 50, max: 90 },
      conscientiousness: { min: 55, max: 95 },
    },
    alignedValues: ['achievement', 'self-direction'],
  },
  {
    category: 'cyber',
    label_en: 'Cybersecurity',
    label_zh: '网络安全',
    idealBigFive: {
      conscientiousness: { min: 60, max: 95 },
      openness: { min: 45, max: 85 },
    },
    alignedValues: ['security', 'achievement'],
  },
  {
    category: 'web3',
    label_en: 'Web3 & Blockchain',
    label_zh: 'Web3与区块链',
    idealBigFive: {
      openness: { min: 65, max: 100 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    category: 'creator',
    label_en: 'Creator Economy',
    label_zh: '创作者经济',
    idealBigFive: {
      openness: { min: 60, max: 100 },
      extraversion: { min: 50, max: 90 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
  {
    category: 'green',
    label_en: 'Green Economy & Sustainability',
    label_zh: '绿色经济与可持续',
    idealBigFive: {
      openness: { min: 50, max: 90 },
      agreeableness: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    category: 'health',
    label_en: 'Digital Health & Biotech',
    label_zh: '数字健康与生物科技',
    idealBigFive: {
      conscientiousness: { min: 55, max: 95 },
      openness: { min: 50, max: 90 },
    },
    alignedValues: ['universalism', 'stimulation'],
  },
  {
    category: 'edtech',
    label_en: 'EdTech & Learning',
    label_zh: '教育科技',
    idealBigFive: {
      openness: { min: 55, max: 95 },
      agreeableness: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    category: 'remote',
    label_en: 'Remote Work & Distributed Teams',
    label_zh: '远程办公与分布式团队',
    idealBigFive: {
      conscientiousness: { min: 55, max: 95 },
      openness: { min: 45, max: 85 },
    },
    alignedValues: ['self-direction', 'stimulation'],
  },
  {
    category: 'crosscultural',
    label_en: 'Cross-Cultural & Global',
    label_zh: '跨文化与全球化',
    idealBigFive: {
      openness: { min: 60, max: 100 },
      extraversion: { min: 45, max: 85 },
    },
    alignedValues: ['universalism', 'self-direction'],
  },
  {
    category: 'xr',
    label_en: 'XR & Spatial Computing',
    label_zh: 'XR与空间计算',
    idealBigFive: {
      openness: { min: 65, max: 100 },
    },
    alignedValues: ['stimulation', 'self-direction'],
  },
]

// ============================================================
// Lookup helpers
// ============================================================

const socMap = new Map(SOC_GROUP_ANNOTATIONS.map((g) => [g.socMajor, g]))
const emergingMap = new Map(EMERGING_GROUP_ANNOTATIONS.map((g) => [g.category, g]))

/**
 * Get group-level Big Five annotation for a career by its ID.
 * Returns null if no group mapping found (falls back to neutral scoring).
 *
 * ID patterns:
 *   'onet-11-1011.00'  → SOC major '11'
 *   'emerging-ai-001'  → category 'ai'
 *   'tech-001'         → expert-annotated, should have own Big Five (no fallback needed)
 */
export function getGroupBigFive(
  careerId: string
): Partial<Record<'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism', { min: number; max: number }>> | null {
  if (careerId.startsWith('onet-')) {
    const socMajor = careerId.split('-')[1]
    return socMap.get(socMajor)?.idealBigFive ?? null
  }
  if (careerId.startsWith('emerging-')) {
    const category = careerId.split('-')[1]
    return emergingMap.get(category)?.idealBigFive ?? null
  }
  return null // expert-annotated careers use their own Big Five
}

/**
 * Get group-level aligned values for a career by its ID.
 * Same fallback logic as getGroupBigFive.
 */
export function getGroupValues(careerId: string): string[] | null {
  if (careerId.startsWith('onet-')) {
    const socMajor = careerId.split('-')[1]
    return socMap.get(socMajor)?.alignedValues ?? null
  }
  if (careerId.startsWith('emerging-')) {
    const category = careerId.split('-')[1]
    return emergingMap.get(category)?.alignedValues ?? null
  }
  return null
}
