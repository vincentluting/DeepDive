// ============================================================
// QuickDive — Data Constants
// Questions, depth zones, archetype labels, career mappings
//
// Classic mode now uses the O*NET Mini Interest Profiler (Mini-IP):
// 30 standardized items on a 5-point Likert scale (0–4, per O*NET standard).
// Narrative mode is unchanged.
// ============================================================

import { MINI_IP_ITEMS } from "@/lib/assessment/mini-ip";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";

/** Multilingual text object. `zh` and `en` are required; all other locales are optional. */
export interface MultiLocaleText {
  zh: string;
  en: string;
  nl?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  it?: string;
  ru?: string;
  ja?: string;
  ko?: string;
}

export type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C";
export type RiasecScores = Partial<Record<RiasecKey, number>>;

export interface LikertOption {
  value: 0 | 1 | 2 | 3 | 4;
  text: string;
  textEn: string;
  textNl?: string;
  textDe?: string;
  textFr?: string;
  textEs?: string;
  textPt?: string;
  textIt?: string;
  textRu?: string;
  textJa?: string;
  textKo?: string;
}

export interface QuickDiveQuestionData {
  id: number;
  depth: number;
  riasec: RiasecKey;
  prompt: string;
  promptEn: string;
  options: [
    LikertOption,
    LikertOption,
    LikertOption,
    LikertOption,
    LikertOption,
  ];
}

export interface QuickDiveLabel {
  code: string; // 'R' | 'I' | 'A' | 'S' | 'E' | 'C'
  label_zh: string; // 中文维度名
  label_en: string; // 英文维度名
  label_nl?: string;
  label_de?: string;
  label_fr?: string;
  label_es?: string;
  label_pt?: string;
  label_it?: string;
  label_ru?: string;
  label_ja?: string;
  label_ko?: string;
  tagline_zh: string;
  tagline_en: string;
  tagline_nl?: string;
  tagline_de?: string;
  tagline_fr?: string;
  tagline_es?: string;
  tagline_pt?: string;
  tagline_it?: string;
  tagline_ru?: string;
  tagline_ja?: string;
  tagline_ko?: string;
  colorHex: string; // 品牌色
}

/** @deprecated Use QuickDiveLabel instead */
export type ArchetypeLabel = QuickDiveLabel;

// ── Likert Options (shared by all 30 Mini-IP questions) ──────

export const LIKERT_OPTIONS: [
  LikertOption,
  LikertOption,
  LikertOption,
  LikertOption,
  LikertOption,
] = [
  {
    value: 0,
    text: "非常不喜欢",
    textEn: "Strongly Dislike",
    textNl: "Sterk afkeer",
    textDe: "Starke Abneigung",
    textFr: "Fortement contre",
    textEs: "Muy en desacuerdo",
    textPt: "Forte aversão",
    textIt: "Forte avversione",
    textRu: "Совсем не нравится",
    textJa: "非常に嫌い",
    textKo: "매우 싫어함",
  },
  {
    value: 1,
    text: "不喜欢",
    textEn: "Dislike",
    textNl: "Afkeer",
    textDe: "Abneigung",
    textFr: "Contre",
    textEs: "En desacuerdo",
    textPt: "Aversão",
    textIt: "Avversione",
    textRu: "Не нравится",
    textJa: "嫌い",
    textKo: "싫어함",
  },
  {
    value: 2,
    text: "不确定",
    textEn: "Unsure",
    textNl: "Onzeker",
    textDe: "Unsicher",
    textFr: "Incertain",
    textEs: "No estoy seguro",
    textPt: "Incerto",
    textIt: "Incerto",
    textRu: "Не уверен",
    textJa: "わからない",
    textKo: "잘 모르겠음",
  },
  {
    value: 3,
    text: "喜欢",
    textEn: "Like",
    textNl: "Leuk",
    textDe: "Gefällt mir",
    textFr: "Pour",
    textEs: "De acuerdo",
    textPt: "Gosto",
    textIt: "Mi piace",
    textRu: "Нравится",
    textJa: "好き",
    textKo: "좋아함",
  },
  {
    value: 4,
    text: "非常喜欢",
    textEn: "Strongly Like",
    textNl: "Erg leuk",
    textDe: "Gefällt mir sehr",
    textFr: "Fortement pour",
    textEs: "Muy de acuerdo",
    textPt: "Forte atração",
    textIt: "Mi piace molto",
    textRu: "Очень нравится",
    textJa: "非常に好き",
    textKo: "매우 좋아함",
  },
];

// ── Questions (30 O*NET Mini-IP items) ───────────────────────

const RIASEC_QUESTIONS: QuickDiveQuestionData[] = MINI_IP_ITEMS.map((item) => ({
  id: item.index,
  depth: 0,
  riasec: item.riasecScale,
  prompt: item.textZh,
  promptEn: item.textEn,
  options: LIKERT_OPTIONS,
}));

export const QUESTIONS: QuickDiveQuestionData[] = RIASEC_QUESTIONS;

// ── RIASEC Type Labels (6 types) ─────────────────────────────

export const LABELS: QuickDiveLabel[] = [
  {
    code: "R",
    label_zh: "实践者",
    label_en: "Realistic",
    label_nl: "Realistisch",
    label_de: "Realistisch",
    label_fr: "Réaliste",
    label_es: "Realista",
    label_pt: "Realista",
    label_it: "Realistico",
    label_ru: "Реалистичный",
    label_ja: "現実型",
    label_ko: "현실형",
    tagline_zh: "用双手和工具改变世界",
    tagline_en: "Changing the world with hands and tools",
    tagline_nl: "De wereld veranderen met handen en gereedschap",
    tagline_de: "Die Welt mit Händen und Werkzeugen verändern",
    tagline_fr: "Changer le monde avec ses mains et ses outils",
    tagline_es: "Cambiar el mundo con las manos y las herramientas",
    tagline_pt: "Mudar o mundo com as mãos e ferramentas",
    tagline_it: "Cambiare il mondo con le mani e gli strumenti",
    tagline_ru: "Менять мир руками и инструментами",
    tagline_ja: "手と道具で世界を変える",
    tagline_ko: "손과 도구로 세상을 바꾸다",
    // eslint-disable-next-line local/no-hardcoded-brand-colors -- consumed as hex+alpha suffix (`${colorHex}10`) in archetype-identity-card; CSS var breaks string concat.
    colorHex: "#E74C3C",
  },
  {
    code: "I",
    label_zh: "探索者",
    label_en: "Investigative",
    label_nl: "Onderzoekend",
    label_de: "Forschend",
    label_fr: "Investigateur",
    label_es: "Investigador",
    label_pt: "Investigativo",
    label_it: "Investigativo",
    label_ru: "Исследовательский",
    label_ja: "研究型",
    label_ko: "탐구형",
    tagline_zh: "用思考和分析理解世界",
    tagline_en: "Understanding the world through analysis",
    tagline_nl: "De wereld begrijpen door analyse",
    tagline_de: "Die Welt durch Analyse verstehen",
    tagline_fr: "Comprendre le monde par l'analyse",
    tagline_es: "Entender el mundo a través del análisis",
    tagline_pt: "Compreender o mundo através da análise",
    tagline_it: "Comprendere il mondo attraverso l'analisi",
    tagline_ru: "Понимать мир через анализ",
    tagline_ja: "思考と分析で世界を理解する",
    tagline_ko: "분석을 통해 세상을 이해하다",
    // eslint-disable-next-line local/no-hardcoded-brand-colors -- consumed as hex+alpha suffix (`${colorHex}10`) in archetype-identity-card; CSS var breaks string concat.
    colorHex: "#3498DB",
  },
  {
    code: "A",
    label_zh: "创造者",
    label_en: "Artistic",
    label_nl: "Artistiek",
    label_de: "Künstlerisch",
    label_fr: "Artistique",
    label_es: "Artístico",
    label_pt: "Artístico",
    label_it: "Artistico",
    label_ru: "Артистичный",
    label_ja: "芸術型",
    label_ko: "예술형",
    tagline_zh: "用想象和表达重塑世界",
    tagline_en: "Reshaping the world through expression",
    tagline_nl: "De wereld hervormen door expressie",
    tagline_de: "Die Welt durch Ausdruck neu gestalten",
    tagline_fr: "Remodeler le monde par l'expression",
    tagline_es: "Remodelar el mundo a través de la expresión",
    tagline_pt: "Remodelar o mundo através da expressão",
    tagline_it: "Ridisegnare il mondo attraverso l'espressione",
    tagline_ru: "Преображать мир через самовыражение",
    tagline_ja: "想像と表現で世界を再構築する",
    tagline_ko: "표현을 통해 세상을 재구성하다",
    // eslint-disable-next-line local/no-hardcoded-brand-colors -- consumed as hex+alpha suffix (`${colorHex}10`) in archetype-identity-card; CSS var breaks string concat.
    colorHex: "#9B59B6",
  },
  {
    code: "S",
    label_zh: "连接者",
    label_en: "Social",
    label_nl: "Sociaal",
    label_de: "Sozial",
    label_fr: "Social",
    label_es: "Social",
    label_pt: "Social",
    label_it: "Sociale",
    label_ru: "Социальный",
    label_ja: "社会型",
    label_ko: "사회형",
    tagline_zh: "用关怀和共情温暖世界",
    tagline_en: "Warming the world through empathy",
    tagline_nl: "De wereld verwarmen door empathie",
    tagline_de: "Die Welt durch Empathie erwärmen",
    tagline_fr: "Réchauffer le monde par l'empathie",
    tagline_es: "Calentar el mundo con empatía",
    tagline_pt: "Aquecer o mundo com empatia",
    tagline_it: "Riscaldare il mondo con l'empatia",
    tagline_ru: "Согревать мир через эмпатию",
    tagline_ja: "共感で世界を温める",
    tagline_ko: "공감으로 세상을 따뜻하게 하다",
    colorHex: "#2ECC71",
  },
  {
    code: "E",
    label_zh: "引领者",
    label_en: "Enterprising",
    label_nl: "Ondernemend",
    label_de: "Unternehmerisch",
    label_fr: "Entreprenant",
    label_es: "Emprendedor",
    label_pt: "Empreendedor",
    label_it: "Intraprendente",
    label_ru: "Предприимчивый",
    label_ja: "企業型",
    label_ko: "기업형",
    tagline_zh: "用愿景和行动驱动世界",
    tagline_en: "Driving the world with vision and action",
    tagline_nl: "De wereld aandrijven met visie en actie",
    tagline_de: "Die Welt mit Vision und Tatkraft antreiben",
    tagline_fr: "Conduire le monde avec vision et action",
    tagline_es: "Impulsar el mundo con visión y acción",
    tagline_pt: "Impulsionar o mundo com visão e ação",
    tagline_it: "Guidare il mondo con visione e azione",
    tagline_ru: "Двигать мир видением и действием",
    tagline_ja: "ビジョンと行動で世界を動かす",
    tagline_ko: "비전과 행동으로 세상을 이끌다",
    colorHex: "#F39C12",
  },
  {
    code: "C",
    label_zh: "建构者",
    label_en: "Conventional",
    label_nl: "Conventioneel",
    label_de: "Konventionell",
    label_fr: "Conventionnel",
    label_es: "Convencional",
    label_pt: "Convencional",
    label_it: "Convenzionale",
    label_ru: "Конвенциональный",
    label_ja: "慣習型",
    label_ko: "관습형",
    tagline_zh: "用秩序和精确守护世界",
    tagline_en: "Guarding the world with order and precision",
    tagline_nl: "De wereld bewaken met orde en precisie",
    tagline_de: "Die Welt mit Ordnung und Präzision bewahren",
    tagline_fr: "Protéger le monde avec ordre et précision",
    tagline_es: "Proteger el mundo con orden y precisión",
    tagline_pt: "Guardar o mundo com ordem e precisão",
    tagline_it: "Proteggere il mondo con ordine e precisione",
    tagline_ru: "Хранить мир порядком и точностью",
    tagline_ja: "秩序と正確さで世界を守る",
    tagline_ko: "질서와 정확함으로 세상을 지키다",
    // eslint-disable-next-line local/no-hardcoded-brand-colors -- consumed as hex+alpha suffix (`${colorHex}10`) in archetype-identity-card; CSS var breaks string concat.
    colorHex: "#1ABC9C",
  },
];

/** Find a QuickDiveLabel by code. Supports 12-type codes ('R-enhancement'),
 *  single-letter codes ('R'), and legacy two-letter codes ('RI'). */
export function findLabel(code: string): QuickDiveLabel | undefined {
  // 12-type archetype lookup (e.g., "R-enhancement", "I-enhancement")
  const entry = ARCHETYPE_MAP[code];
  if (entry) {
    const primaryCode = code.split("-")[0];
    const baseLabel = LABELS.find((l) => l.code === primaryCode);
    const rec = entry as unknown as Record<string, unknown>;
    return {
      code,
      label_zh: entry.label_zh,
      label_en: entry.label_en,
      // Spread any locale fields from ARCHETYPE_MAP entry, fall back to base LABELS
      ...(rec.label_nl || baseLabel?.label_nl
        ? { label_nl: (rec.label_nl as string) || baseLabel?.label_nl }
        : {}),
      ...(rec.label_de || baseLabel?.label_de
        ? { label_de: (rec.label_de as string) || baseLabel?.label_de }
        : {}),
      ...(rec.label_fr || baseLabel?.label_fr
        ? { label_fr: (rec.label_fr as string) || baseLabel?.label_fr }
        : {}),
      ...(rec.label_es || baseLabel?.label_es
        ? { label_es: (rec.label_es as string) || baseLabel?.label_es }
        : {}),
      ...(rec.label_pt || baseLabel?.label_pt
        ? { label_pt: (rec.label_pt as string) || baseLabel?.label_pt }
        : {}),
      ...(rec.label_it || baseLabel?.label_it
        ? { label_it: (rec.label_it as string) || baseLabel?.label_it }
        : {}),
      ...(rec.label_ru || baseLabel?.label_ru
        ? { label_ru: (rec.label_ru as string) || baseLabel?.label_ru }
        : {}),
      ...(rec.label_ja || baseLabel?.label_ja
        ? { label_ja: (rec.label_ja as string) || baseLabel?.label_ja }
        : {}),
      ...(rec.label_ko || baseLabel?.label_ko
        ? { label_ko: (rec.label_ko as string) || baseLabel?.label_ko }
        : {}),
      tagline_zh: entry.tagline_zh,
      tagline_en: entry.tagline_en,
      ...(rec.tagline_nl || baseLabel?.tagline_nl
        ? { tagline_nl: (rec.tagline_nl as string) || baseLabel?.tagline_nl }
        : {}),
      ...(rec.tagline_de || baseLabel?.tagline_de
        ? { tagline_de: (rec.tagline_de as string) || baseLabel?.tagline_de }
        : {}),
      ...(rec.tagline_fr || baseLabel?.tagline_fr
        ? { tagline_fr: (rec.tagline_fr as string) || baseLabel?.tagline_fr }
        : {}),
      ...(rec.tagline_es || baseLabel?.tagline_es
        ? { tagline_es: (rec.tagline_es as string) || baseLabel?.tagline_es }
        : {}),
      ...(rec.tagline_pt || baseLabel?.tagline_pt
        ? { tagline_pt: (rec.tagline_pt as string) || baseLabel?.tagline_pt }
        : {}),
      ...(rec.tagline_it || baseLabel?.tagline_it
        ? { tagline_it: (rec.tagline_it as string) || baseLabel?.tagline_it }
        : {}),
      ...(rec.tagline_ru || baseLabel?.tagline_ru
        ? { tagline_ru: (rec.tagline_ru as string) || baseLabel?.tagline_ru }
        : {}),
      ...(rec.tagline_ja || baseLabel?.tagline_ja
        ? { tagline_ja: (rec.tagline_ja as string) || baseLabel?.tagline_ja }
        : {}),
      ...(rec.tagline_ko || baseLabel?.tagline_ko
        ? { tagline_ko: (rec.tagline_ko as string) || baseLabel?.tagline_ko }
        : {}),
      colorHex: baseLabel?.colorHex || "#5A8A9A",
    };
  }
  // 6-type fallback (single letter or legacy two-letter)
  return (
    LABELS.find((l) => l.code === code) ||
    LABELS.find((l) => l.code === code[0])
  );
}

// ── Career Mappings ──────────────────────────────────────────

export const CAREERS: Record<string, MultiLocaleText[]> = {
  A: [
    {
      zh: "AI视觉艺术总监",
      en: "AI Visual Art Director",
      nl: "AI Visueel Kunstdirecteur",
      de: "KI-Kunstdirektor",
      fr: "Directeur artistique IA",
      es: "Director de arte visual IA",
      pt: "Diretor de arte visual IA",
      it: "Direttore artistico visivo IA",
      ru: "Арт-директор визуального ИИ",
      ja: "AIビジュアルアートディレクター",
      ko: "AI 비주얼 아트 디렉터",
    },
    {
      zh: "沉浸式体验设计师",
      en: "Immersive Experience Designer",
      nl: "Ontwerper van immersieve ervaringen",
      de: "Designer für immersive Erlebnisse",
      fr: "Concepteur d'expériences immersives",
      es: "Diseñador de experiencias inmersivas",
      pt: "Designer de experiências imersivas",
      it: "Designer di esperienze immersive",
      ru: "Дизайнер иммерсивного опыта",
      ja: "没入型体験デザイナー",
      ko: "몰입형 경험 디자이너",
    },
    {
      zh: "品牌创意策略师",
      en: "Brand Creative Strategist",
      nl: "Creatief merkstrateeg",
      de: "Kreativer Markenstratege",
      fr: "Stratège créatif de marque",
      es: "Estratega creativo de marca",
      pt: "Estrategista criativo de marca",
      it: "Stratega creativo del marchio",
      ru: "Креативный бренд-стратег",
      ja: "ブランドクリエイティブストラテジスト",
      ko: "브랜드 크리에이티브 전략가",
    },
    {
      zh: "独立游戏设计师",
      en: "Indie Game Designer",
      nl: "Indie gameontwerper",
      de: "Indie-Spieledesigner",
      fr: "Concepteur de jeux indépendants",
      es: "Diseñador de juegos independientes",
      pt: "Designer de jogos independentes",
      it: "Game designer indipendente",
      ru: "Инди-геймдизайнер",
      ja: "インディーゲームデザイナー",
      ko: "인디 게임 디자이너",
    },
  ],
  I: [
    {
      zh: "AI提示词架构师",
      en: "AI Prompt Architect",
      nl: "AI Prompt Architect",
      de: "KI-Prompt-Architekt",
      fr: "Architecte de prompts IA",
      es: "Arquitecto de prompts IA",
      pt: "Arquiteto de prompts IA",
      it: "Architetto di prompt IA",
      ru: "Архитектор промптов ИИ",
      ja: "AIプロンプトアーキテクト",
      ko: "AI 프롬프트 아키텍트",
    },
    {
      zh: "量化研究分析师",
      en: "Quantitative Research Analyst",
      nl: "Kwantitatief onderzoeksanalist",
      de: "Quantitativer Forschungsanalyst",
      fr: "Analyste en recherche quantitative",
      es: "Analista de investigación cuantitativa",
      pt: "Analista de pesquisa quantitativa",
      it: "Analista di ricerca quantitativa",
      ru: "Аналитик количественных исследований",
      ja: "定量リサーチアナリスト",
      ko: "정량 연구 분석가",
    },
    {
      zh: "认知科学研究者",
      en: "Cognitive Science Researcher",
      nl: "Cognitiewetenschapper",
      de: "Kognitionswissenschaftler",
      fr: "Chercheur en sciences cognitives",
      es: "Investigador en ciencias cognitivas",
      pt: "Pesquisador em ciência cognitiva",
      it: "Ricercatore in scienze cognitive",
      ru: "Исследователь когнитивных наук",
      ja: "認知科学研究者",
      ko: "인지과학 연구자",
    },
    {
      zh: "技术战略顾问",
      en: "Technical Strategy Consultant",
      nl: "Technisch strategieconsultant",
      de: "Technischer Strategieberater",
      fr: "Consultant en stratégie technique",
      es: "Consultor de estrategia técnica",
      pt: "Consultor de estratégia técnica",
      it: "Consulente di strategia tecnica",
      ru: "Консультант по технической стратегии",
      ja: "テクニカルストラテジーコンサルタント",
      ko: "기술 전략 컨설턴트",
    },
  ],
  S: [
    {
      zh: "用户体验研究员",
      en: "UX Researcher",
      nl: "UX-onderzoeker",
      de: "UX-Forscher",
      fr: "Chercheur UX",
      es: "Investigador de UX",
      pt: "Pesquisador de UX",
      it: "Ricercatore UX",
      ru: "UX-исследователь",
      ja: "UXリサーチャー",
      ko: "UX 리서처",
    },
    {
      zh: "组织发展顾问",
      en: "Organizational Development Consultant",
      nl: "Organisatieontwikkelingsadviseur",
      de: "Organisationsentwicklungsberater",
      fr: "Consultant en développement organisationnel",
      es: "Consultor de desarrollo organizacional",
      pt: "Consultor de desenvolvimento organizacional",
      it: "Consulente di sviluppo organizzativo",
      ru: "Консультант по организационному развитию",
      ja: "組織開発コンサルタント",
      ko: "조직개발 컨설턴트",
    },
    {
      zh: "教育创新设计师",
      en: "Education Innovation Designer",
      nl: "Ontwerper van onderwijsinnovatie",
      de: "Designer für Bildungsinnovation",
      fr: "Concepteur d'innovation éducative",
      es: "Diseñador de innovación educativa",
      pt: "Designer de inovação educacional",
      it: "Designer di innovazione educativa",
      ru: "Дизайнер образовательных инноваций",
      ja: "教育イノベーションデザイナー",
      ko: "교육 혁신 디자이너",
    },
    {
      zh: "心理咨询师",
      en: "Counselor / Therapist",
      nl: "Counselor / Therapeut",
      de: "Berater / Therapeut",
      fr: "Conseiller / Thérapeute",
      es: "Consejero / Terapeuta",
      pt: "Conselheiro / Terapeuta",
      it: "Consulente / Terapeuta",
      ru: "Консультант / Терапевт",
      ja: "カウンセラー / セラピスト",
      ko: "상담사 / 치료사",
    },
  ],
  E: [
    {
      zh: "科技创业CEO",
      en: "Tech Startup CEO",
      nl: "Tech Startup CEO",
      de: "Tech-Startup-CEO",
      fr: "PDG de startup tech",
      es: "CEO de startup tecnológica",
      pt: "CEO de startup de tecnologia",
      it: "CEO di startup tecnologica",
      ru: "CEO технологического стартапа",
      ja: "テックスタートアップCEO",
      ko: "테크 스타트업 CEO",
    },
    {
      zh: "风险投资人",
      en: "Venture Capitalist",
      nl: "Durfkapitalist",
      de: "Risikokapitalgeber",
      fr: "Capital-risqueur",
      es: "Capitalista de riesgo",
      pt: "Capitalista de risco",
      it: "Venture capitalist",
      ru: "Венчурный инвестор",
      ja: "ベンチャーキャピタリスト",
      ko: "벤처 캐피탈리스트",
    },
    {
      zh: "商业增长负责人",
      en: "Head of Growth",
      nl: "Hoofd Groei",
      de: "Leiter Wachstum",
      fr: "Responsable de la croissance",
      es: "Director de crecimiento",
      pt: "Diretor de crescimento",
      it: "Responsabile della crescita",
      ru: "Руководитель отдела роста",
      ja: "グロース責任者",
      ko: "그로스 책임자",
    },
    {
      zh: "战略咨询合伙人",
      en: "Strategy Consulting Partner",
      nl: "Strategieconsulting partner",
      de: "Partner für Strategieberatung",
      fr: "Associé en conseil stratégique",
      es: "Socio de consultoría estratégica",
      pt: "Sócio de consultoria estratégica",
      it: "Partner di consulenza strategica",
      ru: "Партнёр стратегического консалтинга",
      ja: "戦略コンサルティングパートナー",
      ko: "전략 컨설팅 파트너",
    },
  ],
  R: [
    {
      zh: "全栈技术架构师",
      en: "Full-Stack Architect",
      nl: "Full-stack architect",
      de: "Full-Stack-Architekt",
      fr: "Architecte full-stack",
      es: "Arquitecto full-stack",
      pt: "Arquiteto full-stack",
      it: "Architetto full-stack",
      ru: "Full-stack архитектор",
      ja: "フルスタックアーキテクト",
      ko: "풀스택 아키텍트",
    },
    {
      zh: "智能硬件产品经理",
      en: "Smart Hardware PM",
      nl: "Smart hardware productmanager",
      de: "Smart-Hardware-Produktmanager",
      fr: "Chef de produit matériel intelligent",
      es: "Gerente de producto de hardware inteligente",
      pt: "Gerente de produto de hardware inteligente",
      it: "Product manager hardware intelligente",
      ru: "Менеджер продукта умного оборудования",
      ja: "スマートハードウェアPM",
      ko: "스마트 하드웨어 PM",
    },
    {
      zh: "数字孪生工程师",
      en: "Digital Twin Engineer",
      nl: "Digital twin-ingenieur",
      de: "Digital-Twin-Ingenieur",
      fr: "Ingénieur jumeau numérique",
      es: "Ingeniero de gemelo digital",
      pt: "Engenheiro de gêmeo digital",
      it: "Ingegnere digital twin",
      ru: "Инженер цифрового двойника",
      ja: "デジタルツインエンジニア",
      ko: "디지털 트윈 엔지니어",
    },
    {
      zh: "技术团队负责人",
      en: "Engineering Team Lead",
      nl: "Technisch teamleider",
      de: "Technischer Teamleiter",
      fr: "Responsable d'équipe technique",
      es: "Líder de equipo de ingeniería",
      pt: "Líder de equipe de engenharia",
      it: "Team lead di ingegneria",
      ru: "Руководитель инженерной команды",
      ja: "エンジニアリングチームリード",
      ko: "엔지니어링 팀 리드",
    },
  ],
  C: [
    {
      zh: "数据治理专家",
      en: "Data Governance Expert",
      nl: "Expert datagovernance",
      de: "Daten-Governance-Experte",
      fr: "Expert en gouvernance des données",
      es: "Experto en gobernanza de datos",
      pt: "Especialista em governança de dados",
      it: "Esperto di data governance",
      ru: "Эксперт по управлению данными",
      ja: "データガバナンスエキスパート",
      ko: "데이터 거버넌스 전문가",
    },
    {
      zh: "供应链优化师",
      en: "Supply Chain Optimizer",
      nl: "Ketenoptimalisatie-specialist",
      de: "Lieferketten-Optimierer",
      fr: "Optimiseur de chaîne d'approvisionnement",
      es: "Optimizador de cadena de suministro",
      pt: "Otimizador de cadeia de suprimentos",
      it: "Ottimizzatore della supply chain",
      ru: "Оптимизатор цепи поставок",
      ja: "サプライチェーンオプティマイザー",
      ko: "공급망 최적화 전문가",
    },
    {
      zh: "风控模型分析师",
      en: "Risk Model Analyst",
      nl: "Risicomodel-analist",
      de: "Risikomodell-Analyst",
      fr: "Analyste de modèles de risque",
      es: "Analista de modelos de riesgo",
      pt: "Analista de modelos de risco",
      it: "Analista di modelli di rischio",
      ru: "Аналитик моделей рисков",
      ja: "リスクモデルアナリスト",
      ko: "리스크 모델 분석가",
    },
    {
      zh: "财务建模分析师",
      en: "Financial Modeling Analyst",
      nl: "Financieel modelleerder",
      de: "Finanzmodellierungs-Analyst",
      fr: "Analyste en modélisation financière",
      es: "Analista de modelado financiero",
      pt: "Analista de modelagem financeira",
      it: "Analista di modellazione finanziaria",
      ru: "Аналитик финансового моделирования",
      ja: "ファイナンシャルモデリングアナリスト",
      ko: "재무 모델링 분석가",
    },
  ],
};

// ── RIASEC Core Traits (for share cards when archetype content unavailable) ──

export const RIASEC_TRAITS: Record<string, MultiLocaleText[]> = {
  R: [
    {
      zh: "用实际行动验证可能性",
      en: "Validates possibilities through hands-on action",
      nl: "Valideert mogelijkheden door praktisch handelen",
      de: "Überprüft Möglichkeiten durch praktisches Handeln",
      fr: "Valide les possibilités par l'action concrète",
      es: "Valida posibilidades mediante la acción práctica",
      pt: "Valida possibilidades por meio de ação prática",
      it: "Valida le possibilità attraverso l'azione pratica",
      ru: "Проверяет возможности через практические действия",
      ja: "実践的な行動で可能性を検証する",
      ko: "실제 행동으로 가능성을 검증한다",
    },
    {
      zh: "在动手中学习和理解世界",
      en: "Learns and understands the world by doing",
      nl: "Leert en begrijpt de wereld door te doen",
      de: "Lernt und versteht die Welt durch Tun",
      fr: "Apprend et comprend le monde en faisant",
      es: "Aprende y entiende el mundo haciendo",
      pt: "Aprende e entende o mundo fazendo",
      it: "Impara e comprende il mondo facendo",
      ru: "Познаёт мир через действие",
      ja: "実践を通じて世界を学び理解する",
      ko: "실행을 통해 세상을 배우고 이해한다",
    },
    {
      zh: "追求看得见摸得着的成果",
      en: "Pursues tangible, visible results",
      nl: "Streeft naar tastbare, zichtbare resultaten",
      de: "Strebt nach greifbaren, sichtbaren Ergebnissen",
      fr: "Recherche des résultats tangibles et visibles",
      es: "Busca resultados tangibles y visibles",
      pt: "Busca resultados tangíveis e visíveis",
      it: "Persegue risultati tangibili e visibili",
      ru: "Стремится к осязаемым результатам",
      ja: "目に見え手に触れる成果を追求する",
      ko: "눈에 보이고 손에 잡히는 성과를 추구한다",
    },
  ],
  I: [
    {
      zh: "用系统思考拆解复杂问题",
      en: "Deconstructs complex problems with systematic thinking",
      nl: "Ontleedt complexe problemen met systematisch denken",
      de: "Zerlegt komplexe Probleme durch systematisches Denken",
      fr: "Déconstruit les problèmes complexes par la pensée systématique",
      es: "Descompone problemas complejos con pensamiento sistemático",
      pt: "Desconstrói problemas complexos com pensamento sistemático",
      it: "Decostruisce problemi complessi con il pensiero sistematico",
      ru: "Разбирает сложные проблемы системным мышлением",
      ja: "システム思考で複雑な問題を分解する",
      ko: "체계적 사고로 복잡한 문제를 분해한다",
    },
    {
      zh: "追求深度理解而非表面认知",
      en: "Seeks deep understanding over surface knowledge",
      nl: "Zoekt diep begrip boven oppervlakkige kennis",
      de: "Sucht tiefes Verständnis statt oberflächliches Wissen",
      fr: "Recherche une compréhension profonde plutôt que superficielle",
      es: "Busca una comprensión profunda en lugar de superficial",
      pt: "Busca compreensão profunda em vez de superficial",
      it: "Cerca una comprensione profonda oltre la conoscenza superficiale",
      ru: "Стремится к глубокому пониманию, а не поверхностному",
      ja: "表面的な知識より深い理解を求める",
      ko: "표면적 지식보다 깊은 이해를 추구한다",
    },
    {
      zh: "独立分析中找到洞察",
      en: "Finds insight through independent analysis",
      nl: "Vindt inzicht door onafhankelijke analyse",
      de: "Findet Erkenntnisse durch unabhängige Analyse",
      fr: "Trouve des insights par l'analyse indépendante",
      es: "Encuentra insights a través del análisis independiente",
      pt: "Encontra insights através de análise independente",
      it: "Trova intuizioni attraverso l'analisi indipendente",
      ru: "Находит озарения через независимый анализ",
      ja: "独立した分析から洞察を見出す",
      ko: "독립적인 분석에서 통찰을 찾는다",
    },
  ],
  A: [
    {
      zh: "在创造中表达内在世界",
      en: "Expresses inner world through creation",
      nl: "Drukt de innerlijke wereld uit door creatie",
      de: "Drückt die innere Welt durch Schöpfung aus",
      fr: "Exprime le monde intérieur par la création",
      es: "Expresa el mundo interior a través de la creación",
      pt: "Expressa o mundo interior através da criação",
      it: "Esprime il mondo interiore attraverso la creazione",
      ru: "Выражает внутренний мир через творчество",
      ja: "創造を通じて内なる世界を表現する",
      ko: "창조를 통해 내면 세계를 표현한다",
    },
    {
      zh: "用非常规方式重新定义问题",
      en: "Redefines problems in unconventional ways",
      nl: "Herdefinieert problemen op onconventionele wijze",
      de: "Definiert Probleme auf unkonventionelle Weise neu",
      fr: "Redéfinit les problèmes de manière non conventionnelle",
      es: "Redefine problemas de manera no convencional",
      pt: "Redefine problemas de maneira não convencional",
      it: "Ridefinisce i problemi in modo non convenzionale",
      ru: "Переосмысливает проблемы нестандартным путём",
      ja: "型にはまらない方法で問題を再定義する",
      ko: "관습에 얽매이지 않는 방식으로 문제를 재정의한다",
    },
    {
      zh: "在美感与意义之间找到平衡",
      en: "Finds balance between aesthetics and meaning",
      nl: "Vindt balans tussen esthetiek en betekenis",
      de: "Findet die Balance zwischen Ästhetik und Bedeutung",
      fr: "Trouve l'équilibre entre esthétique et sens",
      es: "Encuentra el equilibrio entre estética y significado",
      pt: "Encontra equilíbrio entre estética e significado",
      it: "Trova l'equilibrio tra estetica e significato",
      ru: "Находит баланс между эстетикой и смыслом",
      ja: "美しさと意味の間にバランスを見出す",
      ko: "미학과 의미 사이에서 균형을 찾는다",
    },
  ],
  S: [
    {
      zh: "通过共情建立深度连接",
      en: "Builds deep connections through empathy",
      nl: "Bouwt diepe verbindingen op door empathie",
      de: "Baut tiefe Verbindungen durch Empathie auf",
      fr: "Crée des connexions profondes par l'empathie",
      es: "Construye conexiones profundas a través de la empatía",
      pt: "Constrói conexões profundas por meio da empatia",
      it: "Costruisce connessioni profonde attraverso l'empatia",
      ru: "Строит глубокие связи через эмпатию",
      ja: "共感を通じて深いつながりを築く",
      ko: "공감을 통해 깊은 유대를 형성한다",
    },
    {
      zh: "在帮助他人中找到价值感",
      en: "Finds purpose in helping others",
      nl: "Vindt zingeving in het helpen van anderen",
      de: "Findet Sinn darin, anderen zu helfen",
      fr: "Trouve un sens à aider les autres",
      es: "Encuentra propósito en ayudar a otros",
      pt: "Encontra propósito em ajudar os outros",
      it: "Trova scopo nell'aiutare gli altri",
      ru: "Находит смысл в помощи другим",
      ja: "他者を助けることに意義を見出す",
      ko: "다른 사람을 돕는 데서 가치를 찾는다",
    },
    {
      zh: "让团队中每个人都被看见",
      en: "Makes everyone in a team feel seen",
      nl: "Zorgt dat iedereen in het team gezien wordt",
      de: "Sorgt dafür, dass jeder im Team gesehen wird",
      fr: "Fait en sorte que chacun dans l'équipe se sente vu",
      es: "Hace que todos en el equipo se sientan vistos",
      pt: "Faz com que todos na equipe se sintam vistos",
      it: "Fa sentire ogni membro del team visto",
      ru: "Делает так, чтобы каждый в команде чувствовал себя замеченным",
      ja: "チームの全員が認められていると感じさせる",
      ko: "팀의 모든 사람이 존재감을 느끼게 한다",
    },
  ],
  E: [
    {
      zh: "将愿景转化为可执行的行动",
      en: "Transforms vision into executable action",
      nl: "Vertaalt visie naar uitvoerbare actie",
      de: "Verwandelt Visionen in umsetzbare Aktionen",
      fr: "Transforme la vision en actions exécutables",
      es: "Transforma la visión en acción ejecutable",
      pt: "Transforma visão em ação executável",
      it: "Trasforma la visione in azione eseguibile",
      ru: "Превращает видение в реализуемые действия",
      ja: "ビジョンを実行可能なアクションに変える",
      ko: "비전을 실행 가능한 행동으로 전환한다",
    },
    {
      zh: "在不确定性中找到机会",
      en: "Finds opportunity in uncertainty",
      nl: "Vindt kansen in onzekerheid",
      de: "Findet Chancen in der Unsicherheit",
      fr: "Trouve des opportunités dans l'incertitude",
      es: "Encuentra oportunidades en la incertidumbre",
      pt: "Encontra oportunidades na incerteza",
      it: "Trova opportunità nell'incertezza",
      ru: "Находит возможности в неопределённости",
      ja: "不確実性の中に機会を見出す",
      ko: "불확실성 속에서 기회를 찾는다",
    },
    {
      zh: "天然地调动资源和团队能量",
      en: "Naturally mobilizes resources and team energy",
      nl: "Mobiliseert van nature middelen en teamenergie",
      de: "Mobilisiert natürlich Ressourcen und Teamenergie",
      fr: "Mobilise naturellement les ressources et l'énergie d'équipe",
      es: "Moviliza naturalmente recursos y energía del equipo",
      pt: "Mobiliza naturalmente recursos e energia da equipe",
      it: "Mobilita naturalmente risorse ed energia del team",
      ru: "Естественно мобилизует ресурсы и энергию команды",
      ja: "自然にリソースとチームのエネルギーを引き出す",
      ko: "자연스럽게 자원과 팀 에너지를 동원한다",
    },
  ],
  C: [
    {
      zh: "在复杂系统中建立清晰秩序",
      en: "Establishes clear order in complex systems",
      nl: "Vestigt duidelijke orde in complexe systemen",
      de: "Schafft klare Ordnung in komplexen Systemen",
      fr: "Établit un ordre clair dans les systèmes complexes",
      es: "Establece un orden claro en sistemas complejos",
      pt: "Estabelece ordem clara em sistemas complexos",
      it: "Stabilisce un ordine chiaro in sistemi complessi",
      ru: "Устанавливает ясный порядок в сложных системах",
      ja: "複雑なシステムに明確な秩序を築く",
      ko: "복잡한 시스템에 명확한 질서를 세운다",
    },
    {
      zh: "用精确和可靠性赢得信任",
      en: "Earns trust through precision and reliability",
      nl: "Verdient vertrouwen door precisie en betrouwbaarheid",
      de: "Verdient Vertrauen durch Präzision und Zuverlässigkeit",
      fr: "Gagne la confiance par la précision et la fiabilité",
      es: "Gana confianza a través de la precisión y la fiabilidad",
      pt: "Conquista confiança por meio de precisão e confiabilidade",
      it: "Guadagna fiducia attraverso precisione e affidabilità",
      ru: "Завоёвывает доверие точностью и надёжностью",
      ja: "正確さと信頼性で信頼を勝ち取る",
      ko: "정확성과 신뢰성으로 신뢰를 얻는다",
    },
    {
      zh: "确保每个细节都经得起检验",
      en: "Ensures every detail withstands scrutiny",
      nl: "Zorgt dat elk detail bestand is tegen controle",
      de: "Stellt sicher, dass jedes Detail einer Prüfung standhält",
      fr: "S'assure que chaque détail résiste à l'examen",
      es: "Asegura que cada detalle resiste el escrutinio",
      pt: "Garante que cada detalhe resiste ao escrutínio",
      it: "Assicura che ogni dettaglio resista al controllo",
      ru: "Обеспечивает безупречность каждой детали",
      ja: "すべての細部が精査に耐えることを保証する",
      ko: "모든 세부 사항이 검증에 견디도록 보장한다",
    },
  ],
};

export const DRAIN: Record<string, MultiLocaleText[]> = {
  A: [
    {
      zh: "合规审计专员",
      en: "Compliance Auditor",
      nl: "Compliance-auditor",
      de: "Compliance-Prüfer",
      fr: "Auditeur de conformité",
      es: "Auditor de cumplimiento",
      pt: "Auditor de conformidade",
      it: "Revisore di conformità",
      ru: "Аудитор соответствия",
      ja: "コンプライアンス監査員",
      ko: "컴플라이언스 감사관",
    },
    {
      zh: "标准化流程执行",
      en: "Standardized Process Executor",
      nl: "Gestandaardiseerde procesuitvoerder",
      de: "Standardisierter Prozessausführer",
      fr: "Exécutant de processus standardisés",
      es: "Ejecutor de procesos estandarizados",
      pt: "Executor de processos padronizados",
      it: "Esecutore di processi standardizzati",
      ru: "Исполнитель стандартизированных процессов",
      ja: "標準化プロセス実行者",
      ko: "표준화 프로세스 실행자",
    },
  ],
  I: [
    {
      zh: "高频社交销售",
      en: "High-Frequency Social Selling",
      nl: "Hoogfrequente sociale verkoop",
      de: "Hochfrequenter Sozialverkauf",
      fr: "Vente sociale à haute fréquence",
      es: "Ventas sociales de alta frecuencia",
      pt: "Vendas sociais de alta frequência",
      it: "Vendita sociale ad alta frequenza",
      ru: "Высокочастотные социальные продажи",
      ja: "高頻度ソーシャルセリング",
      ko: "고빈도 소셜 셀링",
    },
    {
      zh: "活动现场执行",
      en: "Event Operations",
      nl: "Evenementenoperaties",
      de: "Veranstaltungsdurchführung",
      fr: "Opérations événementielles",
      es: "Operaciones de eventos",
      pt: "Operações de eventos",
      it: "Operazioni eventi",
      ru: "Операционное управление мероприятиями",
      ja: "イベントオペレーション",
      ko: "이벤트 운영",
    },
  ],
  S: [
    {
      zh: "独立量化交易",
      en: "Solo Quantitative Trading",
      nl: "Solo kwantitatieve handel",
      de: "Solo-Quantitatives-Trading",
      fr: "Trading quantitatif en solo",
      es: "Trading cuantitativo en solitario",
      pt: "Trading quantitativo solo",
      it: "Trading quantitativo in solitaria",
      ru: "Самостоятельный количественный трейдинг",
      ja: "単独定量トレーディング",
      ko: "단독 퀀트 트레이딩",
    },
    {
      zh: "数据库运维",
      en: "Database Operations",
      nl: "Databasebeheer",
      de: "Datenbankbetrieb",
      fr: "Opérations de base de données",
      es: "Operaciones de base de datos",
      pt: "Operações de banco de dados",
      it: "Operazioni di database",
      ru: "Администрирование баз данных",
      ja: "データベース運用",
      ko: "데이터베이스 운영",
    },
  ],
  E: [
    {
      zh: "档案整理归档",
      en: "File Archiving",
      nl: "Archiefbeheer",
      de: "Aktenarchivierung",
      fr: "Archivage de dossiers",
      es: "Archivado de documentos",
      pt: "Arquivamento de documentos",
      it: "Archiviazione documenti",
      ru: "Архивирование документов",
      ja: "ファイルアーカイブ",
      ko: "문서 정리 및 보관",
    },
    {
      zh: "固定流程质检",
      en: "Routine Quality Inspection",
      nl: "Routinematige kwaliteitscontrole",
      de: "Routinemäßige Qualitätsprüfung",
      fr: "Inspection qualité de routine",
      es: "Inspección de calidad rutinaria",
      pt: "Inspeção de qualidade rotineira",
      it: "Ispezione qualità di routine",
      ru: "Рутинный контроль качества",
      ja: "定常品質検査",
      ko: "정기 품질 검사",
    },
  ],
  R: [
    {
      zh: "公关文案撰写",
      en: "PR Copywriting",
      nl: "PR-copywriting",
      de: "PR-Texterstellung",
      fr: "Rédaction de relations publiques",
      es: "Redacción de relaciones públicas",
      pt: "Redação de relações públicas",
      it: "Copywriting PR",
      ru: "PR-копирайтинг",
      ja: "PRコピーライティング",
      ko: "PR 카피라이팅",
    },
    {
      zh: "品牌营销策划",
      en: "Brand Marketing Planning",
      nl: "Merkmarketingplanning",
      de: "Markenmarketing-Planung",
      fr: "Planification marketing de marque",
      es: "Planificación de marketing de marca",
      pt: "Planejamento de marketing de marca",
      it: "Pianificazione marketing del marchio",
      ru: "Планирование бренд-маркетинга",
      ja: "ブランドマーケティング企画",
      ko: "브랜드 마케팅 기획",
    },
  ],
  C: [
    {
      zh: "自由艺术创作",
      en: "Freeform Art Creation",
      nl: "Vrije kunstcreatie",
      de: "Freie Kunstgestaltung",
      fr: "Création artistique libre",
      es: "Creación artística libre",
      pt: "Criação artística livre",
      it: "Creazione artistica libera",
      ru: "Свободное художественное творчество",
      ja: "自由な芸術創作",
      ko: "자유 예술 창작",
    },
    {
      zh: "即兴演讲主持",
      en: "Impromptu Public Speaking",
      nl: "Improvisatie-spreken",
      de: "Improvisiertes öffentliches Reden",
      fr: "Prise de parole improvisée",
      es: "Oratoria improvisada",
      pt: "Discurso improvisado em público",
      it: "Parlare in pubblico improvvisato",
      ru: "Импровизационные публичные выступления",
      ja: "即興パブリックスピーキング",
      ko: "즉흥 대중 연설",
    },
  ],
};

// ── RIASEC display names ─────────────────────────────────────

export const TYPE_NAMES: Record<string, MultiLocaleText> = {
  R: {
    zh: "现实 R",
    en: "Realistic",
    nl: "Realistisch",
    de: "Realistisch",
    fr: "Réaliste",
    es: "Realista",
    pt: "Realista",
    it: "Realistico",
    ru: "Реалистичный",
    ja: "現実型",
    ko: "현실형",
  },
  I: {
    zh: "研究 I",
    en: "Investigative",
    nl: "Onderzoekend",
    de: "Forschend",
    fr: "Investigateur",
    es: "Investigador",
    pt: "Investigativo",
    it: "Investigativo",
    ru: "Исследовательский",
    ja: "研究型",
    ko: "탐구형",
  },
  A: {
    zh: "艺术 A",
    en: "Artistic",
    nl: "Artistiek",
    de: "Künstlerisch",
    fr: "Artistique",
    es: "Artístico",
    pt: "Artístico",
    it: "Artistico",
    ru: "Артистичный",
    ja: "芸術型",
    ko: "예술형",
  },
  S: {
    zh: "社会 S",
    en: "Social",
    nl: "Sociaal",
    de: "Sozial",
    fr: "Social",
    es: "Social",
    pt: "Social",
    it: "Sociale",
    ru: "Социальный",
    ja: "社会型",
    ko: "사회형",
  },
  E: {
    zh: "企业 E",
    en: "Enterprising",
    nl: "Ondernemend",
    de: "Unternehmerisch",
    fr: "Entreprenant",
    es: "Emprendedor",
    pt: "Empreendedor",
    it: "Intraprendente",
    ru: "Предприимчивый",
    ja: "企業型",
    ko: "기업형",
  },
  C: {
    zh: "常规 C",
    en: "Conventional",
    nl: "Conventioneel",
    de: "Konventionell",
    fr: "Conventionnel",
    es: "Convencional",
    pt: "Convencional",
    it: "Convenzionale",
    ru: "Конвенциональный",
    ja: "慣習型",
    ko: "관습형",
  },
};

export const TYPE_COLORS: Record<string, string> = {
  R: "#4a8a7a",
  I: "#5a7ab0",
  A: "#b06a6a",
  S: "#9a6a9a",
  E: "#b09a4a",
  C: "#5a7a7a",
};

// ── Mission Observations (6 RIASEC types) ─────────────────────

export const MISSION_OBSERVATIONS: Record<string, MultiLocaleText> = {
  R: {
    zh: "你在发电机故障时第一个走进机房，拿起工具拆开面板查找原因；修缮营地时你亲手干了最难的部分。动手和理解，在你这里从来不是两件事。",
    en: "You were the first to walk into the generator shed, tools in hand, pulling open the panel to find the cause. During repairs you took on the hardest part by hand. For you, doing and understanding have never been separate things.",
  },
  I: {
    zh: "你在旧档案室里花了最长时间，把几十年的记录串成了一条线索；分析溪水样本时，你写下了完整的推理过程。你不满足于理解，你要把理解变成可以触碰的结果。",
    en: "You spent the longest time in the archive room, connecting decades of records into a single thread. Analyzing the stream samples, you wrote out your full reasoning. Understanding alone isn't enough — you need it to become something tangible.",
  },
  A: {
    zh: "你设计最后一晚活动时，每个环节都考虑了空间和动线；个人呈现时用了一种没人预料到的形式。你的想象力不是空想，它带着落地的执行力。",
    en: "Designing the last evening's event, you considered space and flow for every segment. Your personal presentation used a form no one expected. Your imagination isn't idle dreaming — it carries the execution to make ideas real.",
  },
  S: {
    zh: "深夜山路上你陪着Kai，什么也没说，只是在。第四天你走向了Nora。你帮人不靠说，靠做。你的关怀不是安慰的话，而是解决问题的双手。",
    en: "On the mountain trail at night, you sat with Kai, saying nothing, just being there. On the fourth day, you walked over to Nora. You help through action, not words. Your care isn't comforting phrases; it's problem-solving hands.",
  },
  E: {
    zh: "规划最后36小时的分工时你直接站出来画出了行动表。代表营地和村子谈判时你把条件理得清清楚楚。你的领导力不是口头的——它印在你做过的每一件事上。",
    en: "Planning the last 36 hours, you stood up and drew the action chart. Negotiating with the village, you laid out the terms clearly. Your leadership isn't verbal — it's imprinted on everything you've done.",
  },
  C: {
    zh: "你逐项完成了Ruth的安全检查清单，分析五天的运营数据时找出了三个可改进的模式，归档记录时每份文件都标注了日期和分类。你追求效率和品质的完美平衡。",
    en: "You completed Ruth's safety checklist item by item. Analyzing five days of data, you found three improvable patterns. Archiving records, every document was dated and categorized. You pursue the perfect balance between efficiency and quality.",
  },
};

// ── RIASEC Type Interpretations (for saved report view) ─────────
// General-purpose interpretation paragraphs for each RIASEC type.
// NOT storyline-specific — suitable for Classic mode users.

export const RIASEC_INTERPRETATIONS: Record<string, MultiLocaleText> = {
  R: {
    zh: "你的兴趣组合显示，你在「动手做」的过程中最能找到状态。比起抽象讨论，你更倾向于直接上手验证、搭建和修复。你的职业能量来自于看到自己的行动产生了具体的、可触碰的结果——无论是写出能跑的代码、造出可用的产品，还是解决了一个棘手的技术问题。",
    en: "Your interest profile shows you come alive when you're hands-on. Rather than abstract discussion, you lean toward direct action — building, fixing, and verifying things yourself. Your career energy comes from seeing your efforts produce tangible, concrete results, whether that's shipping working code, crafting a usable product, or solving a tough technical challenge.",
  },
  I: {
    zh: "你的兴趣组合显示，你被「弄明白」这件事本身驱动。你享受深入研究的过程——搜集证据、建立假设、追踪逻辑链条直到找到答案。你的职业能量来自于独立思考的空间，以及能够把复杂问题拆解为可理解结构的满足感。",
    en: "Your interest profile shows you're driven by the act of figuring things out. You enjoy the process of deep investigation — gathering evidence, forming hypotheses, and following logic chains until the answer emerges. Your career energy comes from having space for independent thought and the satisfaction of breaking complex problems into understandable structures.",
  },
  A: {
    zh: "你的兴趣组合显示，你需要「创造的自由」来保持职业活力。你在开放式的、允许自我表达的环境中最能发挥——用非常规的方式重新组合想法，产出有美感、有意义的作品。你的职业能量来自于创造本身，以及看到自己的独特视角被认可的瞬间。",
    en: "Your interest profile shows you need creative freedom to stay energized. You thrive in open, expressive environments — recombining ideas in unconventional ways and producing work that carries both beauty and meaning. Your career energy comes from the act of creation itself, and from moments when your unique perspective is recognized.",
  },
  S: {
    zh: "你的兴趣组合显示，你在「与人产生深度连接」时最有动力。你天然地关注他人的需求，擅长创造让人感到被理解和被支持的空间。你的职业能量来自于看到自己的帮助真实地改变了一个人的处境——不是表面的客套，而是实质的影响。",
    en: "Your interest profile shows you're most motivated when forming meaningful connections with people. You naturally tune into others' needs and excel at creating spaces where people feel understood and supported. Your career energy comes from seeing your help genuinely change someone's situation — not surface-level pleasantries, but real, substantive impact.",
  },
  E: {
    zh: "你的兴趣组合显示，你被「推动事情发生」这个过程激励。你倾向于主动承担领导角色，把愿景变成行动计划，把计划变成成果。你的职业能量来自于说服、组织和调动资源——你需要一个足够大的舞台，来匹配你内在的驱动力。",
    en: "Your interest profile shows you're energized by making things happen. You naturally step into leadership roles, turning vision into action plans and plans into results. Your career energy comes from persuading, organizing, and mobilizing resources — you need a stage big enough to match the drive inside you.",
  },
  C: {
    zh: "你的兴趣组合显示，你在「让系统有序运转」的过程中找到成就感。你注重细节、追求精确，享受把混乱的数据变成清晰结构的过程。你的职业能量来自于可预测、可衡量的工作成果——你建立的秩序是其他人可以信赖的基石。",
    en: "Your interest profile shows you find fulfillment in making systems run smoothly. You value detail, pursue precision, and enjoy transforming messy data into clear structures. Your career energy comes from predictable, measurable outcomes — the order you create becomes a foundation others can rely on.",
  },
};

// ── AI-Era RIASEC Insights ──────────────────────────────────
// Maps each primary RIASEC type to its AI-era advantage, risk, and suggested direction.
// Source: WEF Future of Jobs 2025, PwC AI Jobs Barometer, Brookings Institution research.

export const AI_ERA_RIASEC_INSIGHTS: Record<
  string,
  {
    advantage: MultiLocaleText;
    risk: MultiLocaleText;
    direction: MultiLocaleText;
  }
> = {
  R: {
    advantage: {
      zh: "你的动手能力是 AI 最难复制的领域之一。在物理环境中判断、操作和创造性解决问题的能力，让你在自动化浪潮中拥有天然护城河。",
      en: "Your hands-on ability is one of the hardest areas for AI to replicate. The capacity to judge, operate, and creatively solve problems in physical environments gives you a natural moat against automation.",
    },
    risk: {
      zh: "重复性的操作和标准化流程正在被机器人和自动化系统接管。纯执行型的技术工作面临压缩。",
      en: "Repetitive operations and standardized processes are being taken over by robotics and automation systems. Purely execution-oriented technical work faces compression.",
    },
    direction: {
      zh: '人机协作技术专家 — 将你的实操直觉与 AI 工具结合，成为"最后一公里"的关键人物。',
      en: 'Human-AI technical specialist — combine your hands-on intuition with AI tools to become the critical "last mile" expert.',
    },
  },
  I: {
    advantage: {
      zh: "你定义问题、构建假设和解读复杂结果的能力，正是 AI 最需要人类参与的环节。AI 能处理数据，但提出正确的问题仍然是人类的领地。",
      en: "Your ability to define problems, form hypotheses, and interpret complex results is precisely where AI needs human involvement most. AI can process data, but asking the right questions remains human territory.",
    },
    risk: {
      zh: '基础数据分析和文献检索等入门级研究任务正在被 AI 自动化。停留在"信息收集"层面的工作将减少。',
      en: 'Entry-level research tasks like basic data analysis and literature review are being automated by AI. Work that stays at the "information gathering" level will diminish.',
    },
    direction: {
      zh: "AI 时代研究策略师 — 从执行研究升级为设计研究框架，让 AI 成为你的研究助手而非替代者。",
      en: "AI-era research strategist — evolve from executing research to designing research frameworks, making AI your research assistant rather than replacement.",
    },
  },
  A: {
    advantage: {
      zh: "原创性和情感表达是 AI 最难复制的能力。你的独特视角、审美判断和叙事直觉，在 AI 生成内容泛滥的时代反而更加稀缺和珍贵。",
      en: "Originality and emotional expression are the hardest capabilities for AI to replicate. Your unique perspective, aesthetic judgment, and narrative intuition become even more scarce and valuable in an era flooded with AI-generated content.",
    },
    risk: {
      zh: "AI 生成内容正在冲击基础创意工作 — 模板化设计、素材拼接和初级文案正在被自动化。",
      en: "AI-generated content is disrupting foundational creative work — template design, asset assembly, and entry-level copywriting are being automated.",
    },
    direction: {
      zh: "AI 增强创意总监 — 用 AI 放大你的创意效率，专注于只有人类能做到的概念突破和情感共鸣。",
      en: "AI-augmented creative director — use AI to amplify your creative efficiency while focusing on the conceptual breakthroughs and emotional resonance that only humans can achieve.",
    },
  },
  S: {
    advantage: {
      zh: '你的同理心和人际洞察力是 AI 无法替代的核心竞争力。在 AI 时代，"被理解"和"被真正看见"的需求不会减少，反而会随着数字化的加深而更加稀缺。',
      en: 'Your empathy and interpersonal insight are core competencies that AI cannot replace. In the AI era, the need to "be understood" and "truly seen" will not diminish — it will become even more scarce as digitalization deepens.',
    },
    risk: {
      zh: "标准化的客户服务和信息传递类社交工作正在被聊天机器人和 AI 助手替代。",
      en: "Standardized customer service and information-delivery social roles are being replaced by chatbots and AI assistants.",
    },
    direction: {
      zh: "人类体验设计师 — 在 AI 处理效率问题的世界里，你专注于只有人类能创造的深度连接和转化性体验。",
      en: "Human experience designer — in a world where AI handles efficiency, you focus on the deep connection and transformative experiences that only humans can create.",
    },
  },
  E: {
    advantage: {
      zh: '战略判断、跨团队谈判和在不确定性中做决策的能力，是 AI 时代的"人类护城河"。AI 能提供数据，但把人和资源组织起来朝一个方向前进，仍然需要你这样的人。',
      en: 'Strategic judgment, cross-team negotiation, and decision-making under uncertainty are the "human moat" of the AI era. AI can provide data, but organizing people and resources to move in one direction still requires someone like you.',
    },
    risk: {
      zh: "AI 驱动的扁平化管理正在压缩中层管理岗位。纯信息传递和协调型的领导角色面临重组。",
      en: "AI-driven organizational flattening is compressing middle management positions. Leadership roles focused purely on information relay and coordination face restructuring.",
    },
    direction: {
      zh: "AI 时代变革领导者 — 从管理流程升级为引领变革，成为帮助团队和组织适应 AI 转型的关键人物。",
      en: "AI-era transformation leader — evolve from managing processes to leading change, becoming the key figure who helps teams and organizations navigate AI transformation.",
    },
  },
  C: {
    advantage: {
      zh: "你对系统和流程的深度理解，在 AI 时代变成了独特优势。当 AI 工具需要被正确配置、监控和优化时，你的精确性和结构化思维正是关键。",
      en: "Your deep understanding of systems and processes becomes a unique advantage in the AI era. When AI tools need to be correctly configured, monitored, and optimized, your precision and structured thinking are exactly what's needed.",
    },
    risk: {
      zh: "数据录入、文书处理和规则执行类工作是 AI 自动化的首要目标。95% 的纯数据录入岗位面临消失。",
      en: "Data entry, document processing, and rule-execution work are the primary targets of AI automation. 95% of pure data-entry positions face elimination.",
    },
    direction: {
      zh: "AI 流程架构师 — 从执行流程升级为设计和优化人机协作流程，用你的系统思维让 AI 真正高效运转。",
      en: "AI workflow architect — evolve from executing processes to designing and optimizing human-AI collaboration workflows, using your systems thinking to make AI truly effective.",
    },
  },
};

// ── Generating steps ─────────────────────────────────────────

export const GENERATING_STEPS: Record<string, string[]> = {
  zh: [
    "你刚才回答了 30 道职业兴趣题",
    "题目来自美国劳工部的标准化模型",
    "现实、探究、艺术、社会、企业、常规",
    "六大维度勾勒出你的职业兴趣轮廓",
    "你的职业兴趣画像正在生成中……",
  ],
  en: [
    "You just answered 30 career interest questions",
    "Based on the U.S. Department of Labor's standardized model",
    "Realistic, Investigative, Artistic, Social, Enterprising, Conventional",
    "Six dimensions outline your career interest profile",
    "Your career interest portrait is being generated...",
  ],
  nl: [
    "Je hebt zojuist 30 vragen over carrière-interesses beantwoord",
    "Gebaseerd op het gestandaardiseerde model van het Amerikaanse Ministerie van Arbeid",
    "Realistisch, Onderzoekend, Artistiek, Sociaal, Ondernemend, Conventioneel",
    "Zes dimensies schetsen je carrière-interesseprofiel",
    "Je carrière-interesseportret wordt gegenereerd...",
  ],
  de: [
    "Du hast gerade 30 Fragen zu Berufsinteressen beantwortet",
    "Basierend auf dem standardisierten Modell des US-Arbeitsministeriums",
    "Realistisch, Forschend, Künstlerisch, Sozial, Unternehmerisch, Konventionell",
    "Sechs Dimensionen zeichnen dein Berufsinteressenprofil",
    "Dein Berufsinteressenporträt wird erstellt...",
  ],
  fr: [
    "Vous venez de répondre à 30 questions sur vos intérêts professionnels",
    "Basé sur le modèle standardisé du Département du Travail des États-Unis",
    "Réaliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel",
    "Six dimensions dessinent votre profil d'intérêts professionnels",
    "Votre portrait d'intérêts professionnels est en cours de génération...",
  ],
  es: [
    "Acabas de responder 30 preguntas sobre intereses profesionales",
    "Basado en el modelo estandarizado del Departamento de Trabajo de EE.UU.",
    "Realista, Investigador, Artístico, Social, Emprendedor, Convencional",
    "Seis dimensiones perfilan tu perfil de intereses profesionales",
    "Tu retrato de intereses profesionales se está generando...",
  ],
  pt: [
    "Você acabou de responder 30 perguntas sobre interesses profissionais",
    "Baseado no modelo padronizado do Departamento do Trabalho dos EUA",
    "Realista, Investigativo, Artístico, Social, Empreendedor, Convencional",
    "Seis dimensões delineiam seu perfil de interesses profissionais",
    "Seu retrato de interesses profissionais está sendo gerado...",
  ],
  it: [
    "Hai appena risposto a 30 domande sugli interessi professionali",
    "Basato sul modello standardizzato del Dipartimento del Lavoro degli Stati Uniti",
    "Realistico, Investigativo, Artistico, Sociale, Intraprendente, Convenzionale",
    "Sei dimensioni delineano il tuo profilo di interessi professionali",
    "Il tuo ritratto degli interessi professionali è in fase di generazione...",
  ],
  ru: [
    "Вы только что ответили на 30 вопросов о профессиональных интересах",
    "На основе стандартизированной модели Министерства труда США",
    "Реалистичный, Исследовательский, Артистичный, Социальный, Предприимчивый, Конвенциональный",
    "Шесть измерений очерчивают ваш профиль профессиональных интересов",
    "Ваш портрет профессиональных интересов создаётся...",
  ],
  ja: [
    "30の職業興味に関する質問に回答しました",
    "米国労働省の標準化モデルに基づいています",
    "現実型、研究型、芸術型、社会型、企業型、慣習型",
    "6つの次元があなたの職業興味プロフィールを描きます",
    "あなたの職業興味ポートレートを生成中...",
  ],
  ko: [
    "방금 30개의 직업 흥미 질문에 답했습니다",
    "미국 노동부의 표준화 모델을 기반으로 합니다",
    "현실형, 탐구형, 예술형, 사회형, 기업형, 관습형",
    "6개의 차원이 당신의 직업 흥미 프로필을 그립니다",
    "당신의 직업 흥미 초상화를 생성 중...",
  ],
};

// ── Confidence Narratives (result page) ────────────────────────

export const CONFIDENCE_NARRATIVES: Record<
  "HC" | "MC" | "LC",
  MultiLocaleText
> = {
  HC: {
    zh: "Ruth 在档案室的角落找到了一份旧地图。它和你的选择高度吻合。",
    en: "Ruth found an old map in the archive corner. It aligns closely with your choices.",
  },
  MC: {
    zh: "你的选择勾勒出了一个形状，但还有几条线需要你自己去画。",
    en: "Your choices sketch a shape. A few lines remain for you to draw.",
  },
  LC: {
    zh: "你的内在罗盘正在校准中。这份结果是第一个读数，不是终点。",
    en: "Your internal compass is calibrating. This is a first reading, not a final answer.",
  },
};

// ── Locale-aware Career Derivation ──────────────────────────────

/**
 * Re-derive career names from sorted RIASEC scores using the given locale.
 * Used at display time so career names always match the current page locale,
 * regardless of which locale was active when the result was saved to DB.
 */
export function deriveCareersFromScores(
  sortedScores: [string, number][],
  locale: string,
): {
  topCareers: CareerItem[];
  fitCareers: CareerItem[];
  drainCareers: CareerItem[];
} {
  const first = sortedScores[0]?.[0] ?? "R";
  const second = sortedScores[1]?.[0] ?? "I";
  const third = sortedScores[2]?.[0] ?? "A";
  const lowest = sortedScores[sortedScores.length - 1]?.[0] ?? "C";
  const secondLowest = sortedScores[sortedScores.length - 2]?.[0] ?? lowest;

  const pick = (
    map: Record<string, MultiLocaleText[]>,
    key: string,
    idx: number,
  ) => {
    const list = map[key] || [];
    const item = list[idx];
    if (!item) return null;
    // Try locale-specific field, fall back to en
    const localeVal = (item as unknown as Record<string, unknown>)[locale];
    if (typeof localeVal === "string" && localeVal) return localeVal;
    if (locale === "zh") return item.zh;
    return item.en;
  };

  const top = [
    pick(CAREERS, first, 0),
    pick(CAREERS, first, 1),
    pick(CAREERS, second, 0),
  ].filter(Boolean) as string[];
  const fit = [
    pick(CAREERS, second, 1),
    pick(CAREERS, third, 0),
    pick(CAREERS, third, 1),
  ].filter(Boolean) as string[];
  const drain = [
    pick(DRAIN, lowest, 0),
    pick(DRAIN, lowest, 1),
    pick(DRAIN, secondLowest, 0),
  ].filter(Boolean) as string[];

  // Use actual RIASEC scores (max 20 per dimension, O*NET 0-4 scale) for relative bar widths
  const scoreOf = (key: string) => {
    const entry = sortedScores.find(([k]) => k === key);
    return entry ? Math.round((entry[1] / 20) * 100) : 50;
  };

  return {
    topCareers: top.map((c, i) => ({
      name: c,
      pct: scoreOf(i < 2 ? first : second),
    })),
    fitCareers: fit.map((c, i) => ({
      name: c,
      pct: scoreOf(i === 0 ? second : third),
    })),
    drainCareers: drain.map((c, i) => ({
      name: c,
      pct: scoreOf(i < 2 ? lowest : secondLowest),
    })),
  };
}

// ── Result Types (used by engine and report panel) ──────────────

export interface CareerItem {
  id?: string;
  name: string;
  title_zh?: string;
  title_en?: string;
  pct: number;
  aiEraCategory?: "stable" | "augmented" | "transformed" | "ai-native";
  aiExposureScore?: number | null;
  aiImpactLabel?: "low" | "medium" | "high" | null;
  resilienceLevel?: number;
  /** One-line description (localized by engine) */
  tagline?: string;
  /** One-line description of what this career does (zh) */
  tagline_zh?: string;
  /** One-line description of what this career does (en) */
  tagline_en?: string;
  /** Top 1-2 RIASEC dimensions driving the match (for top/fit careers) */
  matchDimensions?: RiasecKey[];
  /** The RIASEC dimension that creates a hidden strain (for drain careers) */
  drainDimension?: RiasecKey;
}

export interface QuickDiveResultData {
  label: QuickDiveLabel;
  code: string;
  sortedScores: [string, number][];
  topCareers: CareerItem[];
  fitCareers: CareerItem[];
  drainCareers: CareerItem[];
  /** Best AI-era (ai-native/transformed) career match from the full pool */
  aiEraCareer?: CareerItem;
  confidenceTier: "HC" | "MC" | "LC";
}

// ============================================================
// Extended Insights — derived from 30-question RIASEC scores
// ============================================================

// ── 3-Letter Holland Code ────────────────────────────────────

/** Extract the 3-letter Holland Code from sorted RIASEC scores (e.g. "RIA") */
export function getHollandCode3(sortedScores: [string, number][]): string {
  return sortedScores
    .slice(0, 3)
    .map(([k]) => k)
    .join("");
}

// ── Profile Differentiation ──────────────────────────────────

export type DifferentiationTier = "sharp" | "moderate" | "flat";

export interface DifferentiationResult {
  tier: DifferentiationTier;
  spread: number; // highest - lowest score
}

/** Calculate profile differentiation (how peaked vs flat the profile is) */
export function getProfileDifferentiation(
  sortedScores: [string, number][],
): DifferentiationResult {
  if (sortedScores.length < 2) return { tier: "flat", spread: 0 };
  const highest = sortedScores[0][1];
  const lowest = sortedScores[sortedScores.length - 1][1];
  const spread = highest - lowest;
  // 30 items, 5 per dimension, max score 20 per dimension (O*NET 0-4 scale)
  // spread thresholds: ≥10 sharp, 5-9 moderate, <5 flat
  const tier: DifferentiationTier =
    spread >= 10 ? "sharp" : spread >= 5 ? "moderate" : "flat";
  return { tier, spread };
}

export const DIFFERENTIATION_TEXT: Record<
  DifferentiationTier,
  MultiLocaleText
> = {
  sharp: {
    zh: "你的兴趣高度聚焦——你很清楚自己被什么吸引，职业方向感强。",
    en: "Your interests are highly focused — you know what draws you in, and your career compass points clearly.",
  },
  moderate: {
    zh: "你的兴趣有明确主线，但也保持着对其他领域的好奇——这意味着跨界可能性。",
    en: "You have a clear primary direction while staying curious about other domains — cross-disciplinary roles could suit you well.",
  },
  flat: {
    zh: "你的兴趣广泛均衡——你是多面手型人才，适合需要整合多种技能的角色。",
    en: "Your interests are broadly balanced — you're a versatile generalist, well-suited for roles that integrate diverse skills.",
  },
};

// ── DPTI (Data/People/Things/Ideas) ──────────────────────────

export interface DPTIScores {
  data: number; // (I + C) normalized to 0-100
  people: number; // (S + E) normalized to 0-100
  things: number; // (R + C) normalized to 0-100
  ideas: number; // (I + A) normalized to 0-100
}

/** Calculate DPTI orientation from RIASEC scores */
export function getDPTIScores(sortedScores: [string, number][]): DPTIScores {
  const scores: Record<string, number> = {};
  for (const [key, val] of sortedScores) {
    scores[key] = val;
  }
  const r = scores["R"] ?? 0;
  const i = scores["I"] ?? 0;
  const a = scores["A"] ?? 0;
  const s = scores["S"] ?? 0;
  const e = scores["E"] ?? 0;
  const c = scores["C"] ?? 0;

  // Each dimension is sum of two RIASEC scores. Max per RIASEC = 25, so max pair = 50.
  const normalize = (val: number) => Math.round((val / 50) * 100);

  return {
    data: normalize(i + c),
    people: normalize(s + e),
    things: normalize(r + c),
    ideas: normalize(i + a),
  };
}

export const DPTI_LABELS: Record<
  keyof DPTIScores,
  MultiLocaleText & { icon: string }
> = {
  data: {
    zh: "数据导向",
    en: "Data",
    nl: "Data",
    de: "Daten",
    fr: "Données",
    es: "Datos",
    pt: "Dados",
    it: "Dati",
    ru: "Данные",
    ja: "データ",
    ko: "데이터",
    icon: "BarChart3",
  },
  people: {
    zh: "人际导向",
    en: "People",
    nl: "Mensen",
    de: "Menschen",
    fr: "Personnes",
    es: "Personas",
    pt: "Pessoas",
    it: "Persone",
    ru: "Люди",
    ja: "人",
    ko: "사람",
    icon: "Users",
  },
  things: {
    zh: "实物导向",
    en: "Things",
    nl: "Dingen",
    de: "Dinge",
    fr: "Choses",
    es: "Cosas",
    pt: "Coisas",
    it: "Cose",
    ru: "Вещи",
    ja: "モノ",
    ko: "사물",
    icon: "Wrench",
  },
  ideas: {
    zh: "理念导向",
    en: "Ideas",
    nl: "Ideeën",
    de: "Ideen",
    fr: "Idées",
    es: "Ideas",
    pt: "Ideias",
    it: "Idee",
    ru: "Идеи",
    ja: "アイデア",
    ko: "아이디어",
    icon: "Lightbulb",
  },
};

// ── DPTI Interpretation Sentences ────────────────────────────
// Key format: "{highest}-{lowest}" e.g. "ideas-things"

export const DPTI_INTERPRETATIONS: Record<string, MultiLocaleText> = {
  "data-people": {
    zh: "你更擅长与信息打交道，而非频繁的人际互动——独立分析型角色最能发挥你的优势。",
    en: "You work better with information than constant social interaction — independent analytical roles play to your strengths.",
  },
  "data-things": {
    zh: '你倾向于处理抽象数据而非具体实物——数据科学、金融分析等"屏幕前"的工作更适合你。',
    en: 'You gravitate toward abstract data over physical objects — "screen-first" work like data science or financial analysis suits you.',
  },
  "data-ideas": {
    zh: "你注重数据的精确性，比起天马行空更偏好有据可依——在结构化环境中你表现最佳。",
    en: "You value data precision over open-ended ideation — you perform best in structured environments.",
  },
  "people-data": {
    zh: "你天然被人际关系驱动，比起数据更在乎人——团队协作和客户导向的角色适合你。",
    en: "You're naturally driven by human connection over data — team-based and client-facing roles suit you well.",
  },
  "people-things": {
    zh: "你的能量来自与人互动，而非独自操作——教育、咨询和管理是你的舒适区。",
    en: "Your energy comes from interacting with people, not working solo with objects — education, consulting, and management are your comfort zones.",
  },
  "people-ideas": {
    zh: "你更喜欢直接帮助他人，而非停留在构想阶段——你是行动导向的社会型人才。",
    en: "You prefer directly helping others over staying in the ideation phase — you're an action-oriented social talent.",
  },
  "things-data": {
    zh: "你喜欢动手做而非纯粹分析——工程、制造和技术操作领域能满足你的实践欲。",
    en: "You prefer doing over pure analysis — engineering, manufacturing, and technical operations satisfy your hands-on drive.",
  },
  "things-people": {
    zh: "你更倾向于与工具和系统打交道，而非频繁社交——技术专家型角色最适合你。",
    en: "You lean toward working with tools and systems over frequent socializing — technical specialist roles fit you best.",
  },
  "things-ideas": {
    zh: "你追求可触碰的成果，而非抽象的概念——你是把想法变成现实的执行者。",
    en: "You pursue tangible results over abstract concepts — you're the executor who turns ideas into reality.",
  },
  "ideas-data": {
    zh: "你更被创新和可能性吸引，而非现有数据的整理——前沿研究和创意策略适合你。",
    en: "You're drawn to innovation and possibilities over organizing existing data — frontier research and creative strategy suit you.",
  },
  "ideas-people": {
    zh: "你倾向于独立思考和深度创造，而非在团队中频繁互动——学术、写作和设计是你的领地。",
    en: "You lean toward independent thinking and deep creation over frequent team interaction — academia, writing, and design are your territory.",
  },
  "ideas-things": {
    zh: "你被概念和可能性驱动，而非具体操作——战略规划、研究和概念设计更能激发你。",
    en: "You're driven by concepts and possibilities over hands-on operation — strategic planning, research, and concept design energize you.",
  },
};

/** Get DPTI interpretation based on highest and lowest dimensions */
export function getDPTIInterpretation(
  dpti: DPTIScores,
): MultiLocaleText | undefined {
  const entries = Object.entries(dpti) as [keyof DPTIScores, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const highest = entries[0][0];
  const lowest = entries[entries.length - 1][0];
  if (highest === lowest) return undefined;
  return DPTI_INTERPRETATIONS[`${highest}-${lowest}`];
}

// ── 2-Letter Combination Narratives ──────────────────────────
// The top-2 RIASEC combination gives much richer insight than single type.
// 15 unique combos (order-independent: RI = IR).

/** Get the canonical 2-letter combo key (alphabetically sorted within RIASEC order) */
export function getComboKey(sortedScores: [string, number][]): string {
  const a = sortedScores[0]?.[0] ?? "R";
  const b = sortedScores[1]?.[0] ?? "I";
  // Keep RIASEC order for canonical key
  const order = "RIASEC";
  return order.indexOf(a) <= order.indexOf(b) ? `${a}${b}` : `${b}${a}`;
}

export const COMBO_NARRATIVES: Record<string, MultiLocaleText> = {
  RI: {
    zh: "你兼具动手能力和深度分析思维——在技术研发和工程创新领域，你能把理论变成可运行的系统。",
    en: "You combine hands-on capability with deep analytical thinking — in R&D and engineering, you turn theory into working systems.",
  },
  RA: {
    zh: "你把实践能力和创意想象结合在一起——你适合需要兼顾功能性与美感的领域，比如工业设计或创客文化。",
    en: "You blend practical skills with creative imagination — ideal for fields where function meets form, like industrial design or maker culture.",
  },
  RS: {
    zh: "你既能动手解决问题，又懂得关注人的需求——技术支持、医疗技术、教育科技都是你的舒适区。",
    en: "You solve problems hands-on while staying attuned to human needs — technical support, health tech, and edtech are your comfort zones.",
  },
  RE: {
    zh: "你是行动派的领导者——你不只是规划，你亲自下场执行，带动团队把事情做成。",
    en: "You're a leader who leads by doing — you don't just plan, you execute alongside your team to make things happen.",
  },
  RC: {
    zh: "你追求精确的执行力——在质量控制、技术运维和精密制造中，你的可靠性是团队的定心丸。",
    en: "You pursue precision in execution — in quality control, technical operations, and precision manufacturing, your reliability anchors the team.",
  },
  IA: {
    zh: "你在分析与创造之间自由切换——学术研究、内容策略和创新咨询都能让你同时满足好奇心与表达欲。",
    en: "You flow between analysis and creation — academic research, content strategy, and innovation consulting satisfy both your curiosity and need for expression.",
  },
  IS: {
    zh: "你用研究思维去理解人——心理学、用户研究和教育设计是你的天然赛道。",
    en: "You apply research thinking to understand people — psychology, user research, and instructional design are your natural tracks.",
  },
  IE: {
    zh: "你既能深入研究又想影响他人——这是学术创业者和技术策略顾问的典型画像。",
    en: "You dig deep into research yet want to influence others — the classic profile of academic entrepreneurs and tech strategists.",
  },
  IC: {
    zh: "你是数据世界的架构师——把复杂信息整理成清晰的知识体系是你的核心竞争力。",
    en: "You're an architect of the data world — organizing complex information into clear knowledge systems is your core strength.",
  },
  AS: {
    zh: "你用创造力服务于人——艺术治疗、社区文化项目、创意教育都是你能发光的领域。",
    en: "You channel creativity in service of others — art therapy, community cultural projects, and creative education are where you shine.",
  },
  AE: {
    zh: "你是有创意的商业头脑——品牌建设、创意产业管理和文化创业需要你这种想象力加执行力的组合。",
    en: "You're a creative with business instinct — brand building, creative industry management, and cultural entrepreneurship need your blend of imagination and drive.",
  },
  AC: {
    zh: "你是少见的创意+秩序组合——你能在设计系统、编辑出版和UX工程中发挥独特优势。",
    en: "You're a rare creative-plus-order combination — design systems, editorial publishing, and UX engineering play to your unique strengths.",
  },
  SE: {
    zh: "你天生是社会影响力的放大器——管理咨询、HR领导力和社会创业都需要你这种共情+驱动力。",
    en: "You naturally amplify social impact — management consulting, HR leadership, and social entrepreneurship all need your blend of empathy and drive.",
  },
  SC: {
    zh: "你在人际关怀和系统运营之间找到平衡——医疗管理、教育行政和社区服务管理很适合你。",
    en: "You balance interpersonal care with systematic operations — healthcare administration, educational management, and community services fit you well.",
  },
  EC: {
    zh: "你用商业思维建立可持续系统——运营管理、金融规划和创业中的后台架构需要你这种人才。",
    en: "You build sustainable systems with a business mind — operations management, financial planning, and startup infrastructure need your talent.",
  },
};

// ============================================================
// Chart Archive (Sounding) content maps — additive, used by the
// Quick Dive result page's editorial chart-archive layout.
// No scoring impact: pure presentation copy keyed by RIASEC dimension.
// Follows the existing zh/en MultiLocaleText convention in this file
// (non-zh locales fall back to English at the call site).
// ============================================================

/** Canonical full dimension name per RIASEC letter. */
export const RIASEC_DIM_FULL: Record<RiasecKey, MultiLocaleText> = {
  R: { zh: "实干", en: "Realistic" },
  I: { zh: "探究", en: "Investigative" },
  A: { zh: "创作", en: "Artistic" },
  S: { zh: "助人", en: "Social" },
  E: { zh: "进取", en: "Enterprising" },
  C: { zh: "规则", en: "Conventional" },
};

/** One-word verb + one-line gloss per dimension — the hexagon legend (02). */
export const RIASEC_HEX_LEGEND: Record<
  RiasecKey,
  { verb: MultiLocaleText; desc: MultiLocaleText }
> = {
  R: {
    verb: { zh: "搭建", en: "Build" },
    desc: {
      zh: "动手把想法做成可用的东西。",
      en: "Make ideas into things that work.",
    },
  },
  I: {
    verb: { zh: "解码", en: "Decode" },
    desc: {
      zh: "拆解复杂，追问背后的为什么。",
      en: "Break complexity down to its why.",
    },
  },
  A: {
    verb: { zh: "创造", en: "Create" },
    desc: {
      zh: "用非常规的方式重新组合意义。",
      en: "Recombine meaning in new forms.",
    },
  },
  S: {
    verb: { zh: "连接", en: "Connect" },
    desc: {
      zh: "关注人，让人感到被理解。",
      en: "Tune into people and their needs.",
    },
  },
  E: {
    verb: { zh: "推动", en: "Drive" },
    desc: {
      zh: "组织资源，把事情往前推。",
      en: "Mobilize and push things forward.",
    },
  },
  C: {
    verb: { zh: "梳理", en: "Structure" },
    desc: { zh: "把混乱变成清晰的秩序。", en: "Turn chaos into clear order." },
  },
};

/** Verb-phrase title + "you…" body per dimension — the first-signal rows (01). */
export const RIASEC_SIGNAL_ROWS: Record<
  RiasecKey,
  { title: MultiLocaleText; body: MultiLocaleText }
> = {
  R: {
    title: { zh: "动手验证", en: "Test in the real world" },
    body: {
      zh: "一个想法只有碰到现实的约束，才算真正完成。",
      en: "An idea feels complete only after it touches real constraints.",
    },
  },
  I: {
    title: { zh: "拆解复杂", en: "Decode complexity" },
    body: {
      zh: "你能感觉到可见问题背后那层隐藏的结构。",
      en: "You feel the structure hiding behind the visible problem.",
    },
  },
  A: {
    title: { zh: "塑造意义", en: "Shape meaning" },
    body: {
      zh: "你希望答案清晰到别人也能拿去用。",
      en: "You want the answer clear enough for others to use.",
    },
  },
  S: {
    title: { zh: "理解他人", en: "Read people" },
    body: {
      zh: "你天然留意别人没说出口的需要。",
      en: "You naturally notice what others leave unsaid.",
    },
  },
  E: {
    title: { zh: "推动落地", en: "Move things" },
    body: {
      zh: "看到停滞，你会本能地站出来推一把。",
      en: "When things stall, you instinctively step up to push.",
    },
  },
  C: {
    title: { zh: "建立秩序", en: "Bring order" },
    body: {
      zh: "你享受把杂乱整理成可信赖的系统。",
      en: "You enjoy turning the messy into a system people can trust.",
    },
  },
};

/** Short evidence phrase per dimension — the fit plate's evidence rows (04). */
export const RIASEC_EVIDENCE: Record<RiasecKey, MultiLocaleText> = {
  R: { zh: "让它保持可验证", en: "keeps it testable" },
  I: { zh: "驱动整个探究", en: "drives the inquiry" },
  A: { zh: "帮它落到人心里", en: "helps it land" },
  S: { zh: "把人放在中心", en: "keeps people centered" },
  E: { zh: "推动它向前", en: "moves it forward" },
  C: { zh: "让它严谨可靠", en: "keeps it rigorous" },
};

/** "First experiment" suggestions per dimension — career ledger (05).
 *  Picked by a stable hash on the career id so each row reads differently. */
export const RIASEC_EXPERIMENT: Record<RiasecKey, MultiLocaleText[]> = {
  R: [
    {
      zh: "用一周做出一个能用的小原型。",
      en: "Build a working prototype in a week.",
    },
    {
      zh: "跟岗一天，记录你真正动手做了什么。",
      en: "Shadow the role for a day; log what you actually built.",
    },
  ],
  I: [
    {
      zh: "写一页研究简报，提出三个真问题。",
      en: "Write a one-page brief with three real questions.",
    },
    {
      zh: "拆解一个你好奇的系统，画出它的逻辑。",
      en: "Reverse-engineer a system you're curious about.",
    },
  ],
  A: [
    {
      zh: "把一个想法做成一张图或一段叙事。",
      en: "Turn one idea into a visual or a short narrative.",
    },
    {
      zh: "用非常规方式重新表达一个旧问题。",
      en: "Reframe an old problem in an unconventional way.",
    },
  ],
  S: [
    {
      zh: "做五次访谈，听他们真正卡在哪。",
      en: "Run five interviews; hear where people are stuck.",
    },
    {
      zh: "帮一个人走完一段流程，记下摩擦点。",
      en: "Guide one person through a process; note the friction.",
    },
  ],
  E: [
    {
      zh: "组一个小局，推动一件具体的事落地。",
      en: "Rally a small group to ship one concrete thing.",
    },
    {
      zh: "向三个人推销你的方案，收集反对意见。",
      en: "Pitch your plan to three people; collect the pushback.",
    },
  ],
  C: [
    {
      zh: "把一团混乱的数据整理成清晰结构。",
      en: "Turn a messy dataset into a clean structure.",
    },
    {
      zh: "为一个流程写下可复用的标准步骤。",
      en: "Document a repeatable standard for one process.",
    },
  ],
};
