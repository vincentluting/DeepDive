// ============================================================
// Deep Dive — Standard Industry Classification
//
// Internal industry taxonomy (~40 industries) used for:
//   - User preference collection (Reality Conditions)
//   - Career direction matching (industry scoring factor)
//   - Data region routing (country → data source)
//
// Phase 1: User selection + matching weight
// Phase 3: Map to NAICS/NACE/GB-T for API data ingestion
// ============================================================

export interface IndustryOption {
  id: string
  label_en: string
  label_zh: string
  /** Broad sector grouping for analytics & fallback matching */
  sector: IndustrySector
}

export type IndustrySector =
  | 'technology'
  | 'finance'
  | 'professional_services'
  | 'healthcare'
  | 'education'
  | 'creative'
  | 'engineering'
  | 'public_sector'
  | 'consumer'
  | 'other'

/**
 * Standard industry list — bilingual, ordered by typical user relevance.
 * Each career direction in the DB has `industries: string[]` using these IDs.
 */
export const INDUSTRIES: IndustryOption[] = [
  // ── Technology ──
  { id: 'technology', label_en: 'Technology & Software', label_zh: '科技与软件', sector: 'technology' },
  { id: 'ai_ml', label_en: 'AI & Machine Learning', label_zh: '人工智能与机器学习', sector: 'technology' },
  { id: 'data_analytics', label_en: 'Data & Analytics', label_zh: '数据与分析', sector: 'technology' },
  { id: 'cybersecurity', label_en: 'Cybersecurity', label_zh: '网络安全', sector: 'technology' },
  { id: 'fintech', label_en: 'Blockchain & FinTech', label_zh: '区块链与金融科技', sector: 'technology' },

  // ── Finance ──
  { id: 'finance', label_en: 'Finance & Banking', label_zh: '金融与银行', sector: 'finance' },
  { id: 'investment', label_en: 'Investment & Asset Management', label_zh: '投资与资产管理', sector: 'finance' },
  { id: 'insurance', label_en: 'Insurance', label_zh: '保险', sector: 'finance' },
  { id: 'accounting', label_en: 'Accounting & Auditing', label_zh: '会计与审计', sector: 'finance' },

  // ── Professional Services ──
  { id: 'consulting', label_en: 'Consulting & Professional Services', label_zh: '咨询与专业服务', sector: 'professional_services' },
  { id: 'legal', label_en: 'Legal', label_zh: '法律', sector: 'professional_services' },
  { id: 'hr', label_en: 'Human Resources', label_zh: '人力资源', sector: 'professional_services' },
  { id: 'marketing', label_en: 'Marketing & Advertising', label_zh: '市场营销与广告', sector: 'professional_services' },
  { id: 'pr', label_en: 'Public Relations & Communications', label_zh: '公共关系与传播', sector: 'professional_services' },

  // ── Healthcare & Life Sciences ──
  { id: 'healthcare', label_en: 'Healthcare & Life Sciences', label_zh: '医疗与生命科学', sector: 'healthcare' },
  { id: 'biotech', label_en: 'Biotechnology', label_zh: '生物技术', sector: 'healthcare' },
  { id: 'pharma', label_en: 'Pharmaceuticals', label_zh: '制药', sector: 'healthcare' },

  // ── Education & Research ──
  { id: 'education', label_en: 'Education & Research', label_zh: '教育与学术研究', sector: 'education' },

  // ── Creative & Media ──
  { id: 'design', label_en: 'Design & Creative Arts', label_zh: '设计与创意', sector: 'creative' },
  { id: 'media', label_en: 'Media & Content', label_zh: '媒体与内容', sector: 'creative' },
  { id: 'entertainment', label_en: 'Entertainment & Gaming', label_zh: '娱乐与游戏', sector: 'creative' },
  { id: 'fashion', label_en: 'Fashion & Luxury', label_zh: '时尚与奢侈品', sector: 'creative' },
  { id: 'arts', label_en: 'Arts & Culture', label_zh: '艺术与文化', sector: 'creative' },
  { id: 'publishing', label_en: 'Publishing & Writing', label_zh: '出版与写作', sector: 'creative' },

  // ── Engineering & Manufacturing ──
  { id: 'engineering', label_en: 'Engineering & Manufacturing', label_zh: '工程与制造', sector: 'engineering' },
  { id: 'automotive', label_en: 'Automotive & Transportation', label_zh: '汽车与交通', sector: 'engineering' },
  { id: 'aerospace', label_en: 'Aerospace & Defense', label_zh: '航空航天与国防', sector: 'engineering' },
  { id: 'architecture', label_en: 'Architecture & Real Estate', label_zh: '建筑与房地产', sector: 'engineering' },
  { id: 'telecom', label_en: 'Telecommunications', label_zh: '电信与通信', sector: 'engineering' },

  // ── Energy & Environment ──
  { id: 'energy', label_en: 'Energy & Sustainability', label_zh: '能源与可持续发展', sector: 'engineering' },
  { id: 'environmental', label_en: 'Environmental & Climate', label_zh: '环保与气候', sector: 'engineering' },

  // ── Public Sector ──
  { id: 'government', label_en: 'Government & Public Policy', label_zh: '政府与公共政策', sector: 'public_sector' },
  { id: 'nonprofit', label_en: 'Non-profit & Social Enterprise', label_zh: '非营利与社会企业', sector: 'public_sector' },
  { id: 'international', label_en: 'International Organizations', label_zh: '国际组织与发展', sector: 'public_sector' },

  // ── Consumer & Services ──
  { id: 'retail', label_en: 'Retail & E-commerce', label_zh: '零售与电商', sector: 'consumer' },
  { id: 'hospitality', label_en: 'Hospitality & Tourism', label_zh: '旅游与酒店', sector: 'consumer' },
  { id: 'agriculture', label_en: 'Agriculture & Food', label_zh: '农业与食品', sector: 'consumer' },
  { id: 'logistics', label_en: 'Logistics & Supply Chain', label_zh: '物流与供应链', sector: 'consumer' },
  { id: 'sports', label_en: 'Sports & Fitness', label_zh: '体育与健身', sector: 'consumer' },

  // ── Other ──
  { id: 'freelance', label_en: 'Freelance & Entrepreneurship', label_zh: '自由职业与创业', sector: 'other' },
]

/** Quick lookup by industry ID */
export const INDUSTRY_MAP = new Map(INDUSTRIES.map((i) => [i.id, i]))

const INDUSTRY_LABELS_NL: Record<string, string> = {
  technology: 'Technologie & software',
  ai_ml: 'AI & machine learning',
  data_analytics: 'Data & analytics',
  cybersecurity: 'Cybersecurity',
  fintech: 'Blockchain & fintech',
  finance: 'Financiën & bankwezen',
  investment: 'Beleggen & vermogensbeheer',
  insurance: 'Verzekeringen',
  accounting: 'Boekhouding & audit',
  consulting: 'Consultancy & professionele dienstverlening',
  legal: 'Juridisch',
  hr: 'HR',
  marketing: 'Marketing & reclame',
  pr: 'PR & communicatie',
  healthcare: 'Zorg & life sciences',
  biotech: 'Biotechnologie',
  pharma: 'Farmacie',
  education: 'Onderwijs & onderzoek',
  design: 'Design & creatieve kunsten',
  media: 'Media & content',
  entertainment: 'Entertainment & gaming',
  fashion: 'Mode & luxe',
  arts: 'Kunst & cultuur',
  publishing: 'Uitgeven & schrijven',
  engineering: 'Engineering & productie',
  automotive: 'Automotive & transport',
  aerospace: 'Lucht- en ruimtevaart & defensie',
  architecture: 'Architectuur & vastgoed',
  telecom: 'Telecommunicatie',
  energy: 'Energie & duurzaamheid',
  environmental: 'Milieu & klimaat',
  government: 'Overheid & publiek beleid',
  nonprofit: 'Non-profit & sociaal ondernemerschap',
  international: 'Internationale organisaties',
  retail: 'Retail & e-commerce',
  hospitality: 'Horeca & toerisme',
  agriculture: 'Landbouw & voedsel',
  logistics: 'Logistiek & supply chain',
  sports: 'Sport & fitness',
  freelance: 'Freelance & ondernemerschap',
}

export function getIndustryLabelByLocale(
  industry: IndustryOption,
  locale: string,
): string {
  if (locale === 'zh') return industry.label_zh
  if (locale === 'nl') return INDUSTRY_LABELS_NL[industry.id] ?? industry.label_en
  return industry.label_en
}

/** All valid industry IDs (for validation) */
export const INDUSTRY_IDS = INDUSTRIES.map((i) => i.id)
