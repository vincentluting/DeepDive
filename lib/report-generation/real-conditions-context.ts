// ============================================================
// Real Conditions Context Builder — shared LLM prompt block helper
//
// One place to format the user's RealConditions into prompt-ready text.
// Used by Career Pathway, Career Match Narrative, Integration, and
// Coaching system prompts. Eliminates three-place field drift.
//
// Modes:
//   - "summary"   → 2-4 most decision-weighty constraints (Integration)
//   - "narrative" → 8 lower-sensitivity fields (Career Match, sent to Gemini)
//   - "full"      → 17+ field list (Career Pathway)
//   - "coaching"  → full fields + perspective directives (Coaching chat)
//
// Notes
//   - `sanitizeRealConditions` (prompt-sanitization.ts) is prompt-injection
//     defense, NOT PII redaction. We invoke it here so every prompt path
//     gets the same cleaned input.
//   - `provided` + `fieldCount` are returned so callers can attach them to
//     LLMUsageLog metadata for observability (Phase F).
// ============================================================

import type { RealConditions } from "../types";
import { sanitizeRealConditions } from "../ai/prompt-sanitization";
import {
  INDUSTRY_MAP,
  getIndustryLabelByLocale,
} from "../constants/industries";

export type RealConditionsContextMode =
  | "summary"
  | "narrative"
  | "full"
  | "coaching";

export interface RealConditionsContextResult {
  /** Prompt-ready text block, or empty string if RC absent and mode allows. */
  block: string;
  /** Whether the user has actually filled in real conditions. */
  provided: boolean;
  /** Number of distinct fields rendered (for observability metric). */
  fieldCount: number;
}

type LocaleTexts = Record<string, string>;

function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

const YES_TEXTS: LocaleTexts = {
  en: "Yes",
  zh: "是",
  nl: "Ja",
  de: "Ja",
  fr: "Oui",
  es: "Sí",
  pt: "Sim",
  it: "Sì",
  ru: "Да",
  ja: "はい",
  ko: "예",
};

const NO_TEXTS: LocaleTexts = {
  en: "No",
  zh: "否",
  nl: "Nee",
  de: "Nein",
  fr: "Non",
  es: "No",
  pt: "Não",
  it: "No",
  ru: "Нет",
  ja: "いいえ",
  ko: "아니요",
};

const NOT_SPECIFIED_TEXTS: LocaleTexts = {
  en: "Not specified",
  zh: "未指定",
  nl: "Niet opgegeven",
  de: "Nicht angegeben",
  fr: "Non spécifié",
  es: "No especificado",
  pt: "Não especificado",
  it: "Non specificato",
  ru: "Не указано",
  ja: "未指定",
  ko: "미지정",
};

const SEP_TEXTS: LocaleTexts = {
  en: ", ",
  zh: "、",
  ja: "、",
  ko: ", ",
  nl: ", ",
  de: ", ",
  fr: ", ",
  es: ", ",
  pt: ", ",
  it: ", ",
  ru: ", ",
};

// ── Section titles per mode × locale ─────────────────────────────────

const FULL_TITLE: LocaleTexts = {
  en: "## Real-World Constraints — honor these in constraintStrategies and jobDirections",
  zh: "## 现实约束 — 必须在 constraintStrategies 和 jobDirections 中体现",
  nl: "## Reële beperkingen — verwerk deze in constraintStrategies en jobDirections",
  de: "## Reale Rahmenbedingungen — in constraintStrategies und jobDirections berücksichtigen",
  fr: "## Contraintes réelles — à intégrer dans constraintStrategies et jobDirections",
  es: "## Restricciones reales — refleja en constraintStrategies y jobDirections",
  pt: "## Restrições reais — incorpore em constraintStrategies e jobDirections",
  it: "## Vincoli reali — rispetta in constraintStrategies e jobDirections",
  ru: "## Реальные ограничения — учитывайте в constraintStrategies и jobDirections",
  ja: "## 現実の制約 — constraintStrategies と jobDirections に反映してください",
  ko: "## 현실 제약 — constraintStrategies와 jobDirections에 반영하세요",
};

const NARRATIVE_TITLE: LocaleTexts = {
  en: "## Real-World Context",
  zh: "## 现实背景",
  nl: "## Context uit de praktijk",
  de: "## Realer Kontext",
  fr: "## Contexte réel",
  es: "## Contexto real",
  pt: "## Contexto real",
  it: "## Contesto reale",
  ru: "## Реальный контекст",
  ja: "## 現実の文脈",
  ko: "## 현실 맥락",
};

// Sub-block title for the sensitive constraints sub-section in narrative mode.
// Sensitive fields (visa/family/salary/external pressure) are exposed to the
// LLM as conditional thresholds, never as bare field-name copy. See
// `lineForSensitiveConstraints` below for the rendering and directive.
const SENSITIVE_TITLE: LocaleTexts = {
  en: "### Sensitive Strategic Thresholds (write as conditional clauses only — never copy bare field names)",
  zh: "### 敏感策略门槛（仅使用条件句式撰写——绝不复制字段名）",
  nl: "### Gevoelige strategische drempels (alleen voorwaardelijke formuleringen — kopieer nooit ruwe veldnamen)",
  de: "### Sensible strategische Schwellen (nur als Konditionalsätze — niemals Feldnamen unverändert übernehmen)",
  fr: "### Seuils stratégiques sensibles (formuler uniquement en clauses conditionnelles — ne jamais reprendre les noms de champs)",
  es: "### Umbrales estratégicos sensibles (solo cláusulas condicionales — nunca copies nombres de campos)",
  pt: "### Limiares estratégicos sensíveis (apenas cláusulas condicionais — nunca copies nomes de campos)",
  it: "### Soglie strategiche sensibili (solo clausole condizionali — non copiare mai i nomi dei campi)",
  ru: "### Чувствительные стратегические пороги (только условные конструкции — никогда не копируйте имена полей)",
  ja: "### 機微な戦略的しきい値（条件節のみで記述——フィールド名をそのまま引用しない）",
  ko: "### 민감한 전략적 임계값 (조건절로만 작성 — 필드명을 그대로 복사하지 말 것)",
};

const SUMMARY_TITLE: LocaleTexts = {
  en: "## User's Reality Snapshot",
  zh: "## 用户的现实处境",
  nl: "## Realiteit van de gebruiker",
  de: "## Lebensumstände der Person",
  fr: "## Situation réelle de l'utilisateur",
  es: "## Situación real del usuario",
  pt: "## Situação real do utilizador",
  it: "## Situazione reale dell'utente",
  ru: "## Реальная ситуация пользователя",
  ja: "## ユーザーの現実",
  ko: "## 사용자의 현실 상황",
};

const COACHING_TITLE: LocaleTexts = {
  en: "## User's Stated Real-World Constraints (DO NOT re-ask, ground every suggestion in these)",
  zh: "## 用户已填写的现实约束（不要重新询问，每个建议都必须围绕这些约束展开）",
  nl: "## Door gebruiker opgegeven reële beperkingen (NIET opnieuw vragen, baseer elk advies hierop)",
  de: "## Vom Benutzer angegebene reale Rahmenbedingungen (NICHT erneut fragen, jeden Vorschlag darauf gründen)",
  fr: "## Contraintes réelles déclarées par l'utilisateur (NE PAS redemander, ancrer chaque suggestion ici)",
  es: "## Restricciones reales declaradas por el usuario (NO vuelvas a preguntar, ancla cada sugerencia aquí)",
  pt: "## Restrições reais declaradas pelo utilizador (NÃO pergunte de novo, baseie cada sugestão aqui)",
  it: "## Vincoli reali dichiarati dall'utente (NON richiedere di nuovo, basa ogni suggerimento qui)",
  ru: "## Реальные ограничения, указанные пользователем (НЕ переспрашивайте, опирайтесь на них в каждом совете)",
  ja: "## ユーザーが既に共有した現実の制約（再度尋ねず、すべての提案をこれらに基づかせる）",
  ko: "## 사용자가 이미 공유한 현실 제약 (다시 묻지 말고 모든 제안의 기반으로 삼으세요)",
};

// ── Field labels (per locale where it matters) ───────────────────────

const FIELD_LABELS = {
  education: {
    en: "Education",
    zh: "学历",
    nl: "Opleiding",
    de: "Bildung",
    fr: "Formation",
    es: "Educación",
    pt: "Educação",
    it: "Istruzione",
    ru: "Образование",
    ja: "学歴",
    ko: "학력",
  } as LocaleTexts,
  experience: {
    en: "Work experience",
    zh: "工作年限",
    nl: "Werkervaring",
    de: "Berufserfahrung",
    fr: "Expérience",
    es: "Experiencia",
    pt: "Experiência",
    it: "Esperienza",
    ru: "Опыт работы",
    ja: "職務経験",
    ko: "경력",
  } as LocaleTexts,
  pastIndustries: {
    en: "Past industries",
    zh: "过往行业",
    nl: "Eerdere sectoren",
    de: "Frühere Branchen",
    fr: "Secteurs précédents",
    es: "Sectores anteriores",
    pt: "Setores anteriores",
    it: "Settori precedenti",
    ru: "Прошлые отрасли",
    ja: "過去の業界",
    ko: "과거 산업",
  } as LocaleTexts,
  industryBackground: {
    en: "Industry background",
    zh: "行业背景",
    nl: "Achtergrond in sector",
    de: "Branchenhintergrund",
    fr: "Contexte sectoriel",
    es: "Trasfondo sectorial",
    pt: "Histórico de setor",
    it: "Esperienza di settore",
    ru: "Опыт в отрасли",
    ja: "業界の背景",
    ko: "산업 배경",
  } as LocaleTexts,
  currentCity: {
    en: "Current city",
    zh: "当前城市",
    nl: "Huidige stad",
    de: "Aktueller Standort",
    fr: "Ville actuelle",
    es: "Ciudad actual",
    pt: "Cidade atual",
    it: "Città attuale",
    ru: "Текущий город",
    ja: "現在の都市",
    ko: "현재 도시",
  } as LocaleTexts,
  targetCities: {
    en: "Target cities",
    zh: "目标城市",
    nl: "Doelsteden",
    de: "Zielorte",
    fr: "Villes cibles",
    es: "Ciudades objetivo",
    pt: "Cidades-alvo",
    it: "Città target",
    ru: "Целевые города",
    ja: "希望都市",
    ko: "목표 도시",
  } as LocaleTexts,
  visaStatus: {
    en: "Visa status",
    zh: "签证状态",
    nl: "Visumstatus",
    de: "Visumstatus",
    fr: "Statut de visa",
    es: "Estado de visa",
    pt: "Estado de visto",
    it: "Stato del visto",
    ru: "Визовый статус",
    ja: "ビザ状況",
    ko: "비자 상태",
  } as LocaleTexts,
  sponsorshipRequired: {
    en: "Requires employer visa sponsorship",
    zh: "需要雇主担保签证",
    nl: "Werkgever-visumsponsoring vereist",
    de: "Benötigt Visa-Sponsoring durch Arbeitgeber",
    fr: "Nécessite le parrainage de visa employeur",
    es: "Necesita patrocinio de visa empleador",
    pt: "Necessita de patrocínio de visto",
    it: "Richiede sponsorizzazione visto da datore",
    ru: "Требуется виза-спонсор от работодателя",
    ja: "雇用主のビザ支援が必要",
    ko: "고용주 비자 후원 필요",
  } as LocaleTexts,
  locationFlexibility: {
    en: "Location flexibility",
    zh: "未来发展地点偏好",
    nl: "Locatieflexibiliteit",
    de: "Standortflexibilität",
    fr: "Flexibilité géographique",
    es: "Flexibilidad de ubicación",
    pt: "Flexibilidade de localização",
    it: "Flessibilità geografica",
    ru: "Гибкость по местоположению",
    ja: "勤務地の柔軟性",
    ko: "위치 유연성",
  } as LocaleTexts,
  workLanguages: {
    en: "Work languages",
    zh: "工作语言",
    nl: "Werktalen",
    de: "Arbeitssprachen",
    fr: "Langues de travail",
    es: "Idiomas de trabajo",
    pt: "Idiomas de trabalho",
    it: "Lingue di lavoro",
    ru: "Рабочие языки",
    ja: "業務言語",
    ko: "업무 언어",
  } as LocaleTexts,
  salaryFloor: {
    en: "Salary floor importance",
    zh: "薪资底线重要程度",
    nl: "Belang van salarisondergrens",
    de: "Bedeutung der Mindestgehaltsgrenze",
    fr: "Importance du salaire plancher",
    es: "Importancia del salario mínimo",
    pt: "Importância do salário mínimo",
    it: "Importanza del salario minimo",
    ru: "Важность минимальной зарплаты",
    ja: "給与下限の重要度",
    ko: "최저 급여 중요도",
  } as LocaleTexts,
  willingToRetrain: {
    en: "Willing to retrain/certify for career change",
    zh: "是否愿意为转行培训/考证",
    nl: "Bereid tot omscholing/certificering",
    de: "Bereit zur Umschulung/Zertifizierung",
    fr: "Disposé à se reconvertir/certifier",
    es: "Dispuesto a reentrenar/certificarse",
    pt: "Disposto a reciclar-se/certificar-se",
    it: "Disposto a riqualificarsi/certificarsi",
    ru: "Готов переучиваться/получать сертификаты",
    ja: "転職のための再訓練/資格取得の意欲",
    ko: "전직을 위한 재교육/자격증 의지",
  } as LocaleTexts,
  hasPartner: {
    en: "Has partner/family to consider",
    zh: "有伴侣/家庭需跟随",
    nl: "Partner/gezin in afweging",
    de: "Partner/Familie zu berücksichtigen",
    fr: "Partenaire/famille à considérer",
    es: "Pareja/familia a considerar",
    pt: "Parceiro(a)/família a considerar",
    it: "Partner/famiglia da considerare",
    ru: "Есть партнёр/семья",
    ja: "パートナー/家族の事情あり",
    ko: "파트너/가족 고려 필요",
  } as LocaleTexts,
  workType: {
    en: "Work type",
    zh: "工作形式",
    nl: "Werkvorm",
    de: "Beschäftigungsart",
    fr: "Type de travail",
    es: "Tipo de trabajo",
    pt: "Tipo de trabalho",
    it: "Tipo di lavoro",
    ru: "Тип занятости",
    ja: "勤務形態",
    ko: "근무 형태",
  } as LocaleTexts,
  officeMode: {
    en: "Office mode",
    zh: "办公模式",
    nl: "Werklocatie-modus",
    de: "Büromodus",
    fr: "Mode de bureau",
    es: "Modo de oficina",
    pt: "Modo de escritório",
    it: "Modalità ufficio",
    ru: "Формат офиса",
    ja: "オフィス形態",
    ko: "근무지 형태",
  } as LocaleTexts,
  interestedIndustries: {
    en: "Industries of interest",
    zh: "感兴趣行业",
    nl: "Sectoren van interesse",
    de: "Interessante Branchen",
    fr: "Secteurs d'intérêt",
    es: "Industrias de interés",
    pt: "Setores de interesse",
    it: "Settori di interesse",
    ru: "Интересующие отрасли",
    ja: "関心のある業界",
    ko: "관심 산업",
  } as LocaleTexts,
  openToCareerChange: {
    en: "Open to career change",
    zh: "是否转行",
    nl: "Openstaan voor loopbaanverandering",
    de: "Offen für Berufswechsel",
    fr: "Ouvert au changement de carrière",
    es: "Abierto a cambio de carrera",
    pt: "Aberto a mudança de carreira",
    it: "Aperto a cambio di carriera",
    ru: "Готов к смене карьеры",
    ja: "キャリアチェンジへの意欲",
    ko: "직업 전환 의지",
  } as LocaleTexts,
  externalPressure: {
    en: "External expectation pressure (family/social/cultural)",
    zh: "外部期望压力(家庭/社会/文化)",
    nl: "Druk vanuit omgeving (familie/sociaal/cultureel)",
    de: "Externer Erwartungsdruck (Familie/Gesellschaft/Kultur)",
    fr: "Pression d'attentes externes (famille/société/culture)",
    es: "Presión de expectativas externas (familia/social/cultural)",
    pt: "Pressão externa (família/social/cultural)",
    it: "Pressione esterna (famiglia/sociale/culturale)",
    ru: "Внешнее давление (семья/общество/культура)",
    ja: "外部からの期待圧力(家族/社会/文化)",
    ko: "외부 기대 압력(가족/사회/문화)",
  } as LocaleTexts,
  canWorkFullTime: {
    en: "Can work full-time",
    zh: "可全职工作",
    nl: "Kan voltijds werken",
    de: "Kann Vollzeit arbeiten",
    fr: "Peut travailler à temps plein",
    es: "Puede trabajar a tiempo completo",
    pt: "Pode trabalhar a tempo inteiro",
    it: "Può lavorare a tempo pieno",
    ru: "Может работать полный рабочий день",
    ja: "フルタイム就労可能",
    ko: "정규직 근무 가능",
  } as LocaleTexts,
  occupationRestricted: {
    en: "Occupation restricted to specific roles",
    zh: "仅限特定职业",
    nl: "Beperkt tot specifieke beroepen",
    de: "Auf bestimmte Berufe beschränkt",
    fr: "Limité à certaines professions",
    es: "Limitado a profesiones específicas",
    pt: "Limitado a profissões específicas",
    it: "Limitato a professioni specifiche",
    ru: "Ограничен определёнными профессиями",
    ja: "特定の職種に限定",
    ko: "특정 직종으로 제한",
  } as LocaleTexts,
  salaryRange: {
    en: "Salary range",
    zh: "期望薪资区间",
    nl: "Salarisrange",
    de: "Gehaltsspanne",
    fr: "Fourchette salariale",
    es: "Rango salarial",
    pt: "Faixa salarial",
    it: "Fascia salariale",
    ru: "Зарплатный диапазон",
    ja: "希望給与レンジ",
    ko: "희망 급여 범위",
  } as LocaleTexts,
  currentIndustry: {
    en: "Current industry",
    zh: "当前行业",
    nl: "Huidige sector",
    de: "Aktuelle Branche",
    fr: "Secteur actuel",
    es: "Industria actual",
    pt: "Setor atual",
    it: "Settore attuale",
    ru: "Текущая отрасль",
    ja: "現在の業界",
    ko: "현재 산업",
  } as LocaleTexts,
  careerChangeUrgency: {
    en: "Career change urgency",
    zh: "转行紧迫度",
    nl: "Urgentie loopbaanverandering",
    de: "Dringlichkeit des Berufswechsels",
    fr: "Urgence du changement de carrière",
    es: "Urgencia de cambio de carrera",
    pt: "Urgência de mudança de carreira",
    it: "Urgenza cambio carriera",
    ru: "Срочность смены карьеры",
    ja: "キャリアチェンジの緊急度",
    ko: "경력 전환 긴급도",
  } as LocaleTexts,
};

// Urgency level → localized label (mirrors the labels formerly hard-coded in
// app/api/coaching-chat/route.ts so we can retire that path without text drift).
const URGENCY_LABELS: Record<
  "exploring" | "considering" | "urgent",
  LocaleTexts
> = {
  exploring: {
    en: "Exploring",
    zh: "探索阶段",
    nl: "Verkennen",
    de: "Erkunden",
    fr: "Exploration",
    es: "Explorando",
    pt: "Explorando",
    it: "Esplorazione",
    ru: "Исследование",
    ja: "探索中",
    ko: "탐색 중",
  },
  considering: {
    en: "Actively considering",
    zh: "认真考虑中",
    nl: "Actief overwegend",
    de: "Aktiv in Betracht ziehend",
    fr: "En réflexion active",
    es: "Considerando activamente",
    pt: "Considerando ativamente",
    it: "In seria considerazione",
    ru: "Активно рассматривает",
    ja: "真剣に検討中",
    ko: "적극적으로 고려 중",
  },
  urgent: {
    en: "Urgent",
    zh: "急需转变",
    nl: "Dringend",
    de: "Dringend",
    fr: "Urgent",
    es: "Urgente",
    pt: "Urgente",
    it: "Urgente",
    ru: "Срочно",
    ja: "急務",
    ko: "긴급",
  },
};

// ── Null fallback messages per mode ──────────────────────────────────

const NULL_BLOCKS = {
  full: {
    en: "## Real-World Constraints\n_(User has not provided real-world constraints. Treat all suggestions as exploratory; do not invent constraints.)_",
    zh: "## 现实约束\n_（用户尚未提供现实约束。将所有建议视为探索性，不要编造约束。）_",
  } as LocaleTexts,
  narrative: {
    en: "## Real-World Context\n_(User has not provided real-world conditions. In challenges, use general phrasing like 'you'll want to verify how this fits your visa, family, and financial situation' rather than specific claims.)_",
    zh: '## 现实背景\n_（用户尚未提供现实条件。在 challenges 中使用通用措辞，例如"建议你验证这个方向如何与你的签证、家庭和经济情况契合"，避免具体断言。）_',
  } as LocaleTexts,
  summary: {
    en: "## User's Reality Snapshot\n_(No real-world conditions on file. Paragraph 3 should focus on the general transition tension and avoid inventing concrete constraints.)_",
    zh: "## 用户的现实处境\n_（暂无现实条件记录。第 3 段应聚焦于一般转型张力，避免编造具体约束。）_",
  } as LocaleTexts,
  coaching: {
    en: "## Reality Conditions Status\n_(The user has not yet filled in their real-world conditions. In rounds 2-3 you may gently invite 1-2 questions about practical situation — current city, visa or work-permit constraints, family or financial pressure. Do NOT ask in round 1; build rapport first.)_",
    zh: "## 现实条件状态\n_（用户尚未填写现实条件。可在第 2-3 轮自然地通过 1-2 个问题了解其实际情况——当前城市、签证或工作许可限制、家庭或经济压力。第 1 轮请不要问，先建立信任。）_",
  } as LocaleTexts,
};

// Used when the user filled in RC but none of the high-decision-weight fields
// registered for the summary mode. Different from NULL_BLOCKS.summary, which
// implies "user did not fill at all." (Codex audit 2026-05-18: weak-signal
// vs no-signal distinction lost when both rendered the same fallback.)
const SUMMARY_WEAK_SIGNAL: LocaleTexts = {
  en: "## User's Reality Snapshot\n_(User shared their real conditions, but no high-decision-weight constraint registered — they're flexible on visa, family, salary, and external pressure. Paragraph 3 may honor that flexibility itself as the relevant tension, or focus on the general transition arc — but DO NOT invent constraints that aren't there.)_",
  zh: "## 用户的现实处境\n_（用户填写了现实条件，但没有任何高决策权重的约束被记录——他们在签证、家庭、薪资、外部压力等维度都相对灵活。第 3 段可以把这种灵活本身视为一个张力来源，或者聚焦在一般性的转型弧线上——但不要编造不存在的约束。）_",
};

// ── Mode footers — perspective / discipline directives ───────────────

const COACHING_FOOTER: LocaleTexts = {
  en: "\n\n_How to use this block: ground every suggestion in these constraints. If advice would conflict with one (e.g., suggesting jobs requiring visa sponsorship the user can't get, or relocation incompatible with locationFlexibility), acknowledge the constraint and pivot to a constraint-compatible alternative. NEVER re-ask information already shown above._",
  zh: "\n\n_使用方式：每个建议都必须围绕以上约束。如果建议与约束冲突（例如推荐用户无法获得担保的签证类工作，或与位置灵活度不符的搬迁建议），承认该约束并转向兼容的替代方案。绝不要重新询问以上已经显示的信息。_",
  nl: "\n\n_Hoe te gebruiken: anker elk advies in deze beperkingen. Bij conflict (bijv. een baan voorstellen waarvoor sponsoring vereist is die de gebruiker niet kan krijgen, of een verhuizing buiten de locatieflexibiliteit), erken de beperking en bied een passend alternatief. Vraag NOOIT opnieuw naar wat hierboven al staat._",
  de: "\n\n_Verwendung: jede Empfehlung in diesen Bedingungen verankern. Bei Konflikt (z. B. Jobs vorschlagen, die Visa-Sponsoring erfordern, das die Person nicht erhalten kann, oder Umzug außerhalb der Standortflexibilität), die Bedingung anerkennen und zu einer kompatiblen Alternative wechseln. NIEMALS erneut nach bereits genannten Informationen fragen._",
  fr: "\n\n_Utilisation : ancrez chaque suggestion dans ces contraintes. En cas de conflit (par ex. proposer un poste exigeant un parrainage de visa hors d'atteinte, ou un déménagement incompatible), reconnaissez la contrainte et proposez une alternative compatible. NE redemandez JAMAIS les informations déjà affichées._",
  es: "\n\n_Cómo usar: ancla cada sugerencia en estas restricciones. Si entran en conflicto (p. ej. recomendar empleos que exigen un patrocinio que el usuario no puede obtener, o reubicaciones incompatibles), reconoce la restricción y ofrece una alternativa compatible. NUNCA vuelvas a preguntar información ya mostrada._",
  pt: "\n\n_Como usar: ancore cada sugestão nestas restrições. Em caso de conflito (p. ex. sugerir vagas que exigem patrocínio inacessível, ou mudanças incompatíveis com a flexibilidade), reconheça a restrição e ofereça uma alternativa compatível. NUNCA pergunte novamente o que já está acima._",
  it: "\n\n_Come usare: ancora ogni suggerimento a questi vincoli. In caso di conflitto (es. proporre lavori che richiedono sponsorizzazione visto irraggiungibile, o trasferimenti incompatibili), riconosci il vincolo e proponi un'alternativa compatibile. Non richiedere MAI informazioni già mostrate._",
  ru: "\n\n_Как использовать: каждое предложение опирается на эти ограничения. При конфликте (например, предложение работы, требующей недоступной визовой поддержки, или переезда, несовместимого с гибкостью), признайте ограничение и предложите совместимую альтернативу. НИКОГДА не переспрашивайте уже указанную информацию._",
  ja: "\n\n_使い方：すべての提案をこれらの制約に根ざして行うこと。矛盾する場合（例：取得できないビザ支援を要する仕事の提案、地理的柔軟性と合わない転居の提案）は、その制約を認めたうえで互換性のある代替案に切り替える。上記の情報を二度尋ねないこと。_",
  ko: "\n\n_사용 방법: 모든 제안은 위 제약을 기반으로 합니다. 충돌이 있을 경우(예: 사용자가 받을 수 없는 비자 후원이 필요한 일자리 추천, 위치 유연성과 맞지 않는 이주 제안), 제약을 인정하고 호환되는 대안으로 전환하세요. 위에 표시된 정보를 다시 묻지 마세요._",
};

// When sensitive constraints ARE rendered (see SENSITIVE_TITLE / lineForSensitiveConstraints):
// engage them as conditional thresholds, never copy field-name labels, cap at
// 1-2 sentences per constraint.
const NARRATIVE_FOOTER_WITH_SENSITIVE: LocaleTexts = {
  en: '\n\n_Writing discipline for challenges: paraphrase the impact, never the field name. One-to-two sentences per sensitive constraint, max. Prefer "if this direction requires a visa you can\'t obtain…" over "your visa status is X." If multiple sensitive constraints stack, surface only the one with the highest decision weight._',
  zh: '\n\n_challenges 写作纪律：用条件句转译影响，绝不复制字段名。每条敏感约束最多 1-2 句。优先使用"如果该方向需要你无法获得的签证…"而非"你的签证状态是 X"。若多条敏感约束同时存在，仅突出决策权重最高的一条。_',
  nl: '\n\n_Schrijfdiscipline voor challenges: parafraseer de impact, nooit de veldnaam. Maximaal 1-2 zinnen per gevoelige beperking. Geef de voorkeur aan "als deze richting een visum vereist dat je niet kunt verkrijgen…" boven "je visumstatus is X." Bij meerdere gevoelige beperkingen, benoem alleen die met de hoogste beslissingsweging._',
  de: '\n\n_Schreibdisziplin für challenges: die Auswirkung umschreiben, nie den Feldnamen. Pro sensibler Bedingung höchstens 1-2 Sätze. Bevorzuge „falls diese Richtung ein Visum erfordert, das du nicht erhalten kannst…" statt „dein Visumstatus ist X." Bei mehreren sensiblen Bedingungen nur die mit dem höchsten Entscheidungsgewicht hervorheben._',
  fr: "\n\n_Discipline d'écriture pour challenges : paraphrasez l'impact, jamais le nom du champ. Au maximum 1-2 phrases par contrainte sensible. Préférez « si cette direction exige un visa que vous ne pouvez pas obtenir… » à « votre statut de visa est X. » En cas de cumul de contraintes sensibles, ne mettez en avant que celle au poids décisionnel le plus élevé._",
  es: '\n\n_Disciplina de escritura para challenges: parafrasea el impacto, nunca el nombre del campo. Como máximo 1-2 frases por restricción sensible. Prefiere "si esta dirección requiere una visa que no puedes obtener…" antes que "tu estado de visa es X." Si se acumulan varias restricciones sensibles, destaca solo la de mayor peso decisional._',
  pt: '\n\n_Disciplina de escrita para challenges: parafraseia o impacto, nunca o nome do campo. No máximo 1-2 frases por restrição sensível. Prefere "se esta direção exigir um visto que não podes obter…" em vez de "o teu estado de visto é X." Se houver várias restrições sensíveis, destaca apenas a de maior peso decisional._',
  it: '\n\n_Disciplina di scrittura per challenges: parafrasare l\'impatto, mai il nome del campo. Massimo 1-2 frasi per vincolo sensibile. Preferire "se questa direzione richiede un visto che non puoi ottenere…" a "il tuo stato di visto è X." Se più vincoli sensibili si sommano, evidenziarne solo uno — quello con il peso decisionale più alto._',
  ru: "\n\n_Дисциплина письма для challenges: перефразируйте влияние, никогда — название поля. Максимум 1-2 предложения на каждое чувствительное ограничение. Предпочитайте «если это направление требует визы, которую вы не можете получить…» вместо «ваш визовый статус — X». Если несколько чувствительных ограничений накладываются, выделите только одно с наибольшим решающим весом._",
  ja: "\n\n_challenges を書く際の規律：影響を言い換え、フィールド名は決して引用しない。機微な制約ごとに最大 1-2 文まで。「あなたのビザ状況は X です」ではなく「この方向が取得できないビザを必要とする場合は…」を優先する。複数の機微な制約が重なる場合は、決定の重みが最も大きい 1 つだけを浮かび上がらせる。_",
  ko: '\n\n_challenges 작성 규율: 영향을 의역하되 필드명을 그대로 복사하지 마세요. 민감한 제약당 최대 1-2 문장. "당신의 비자 상태는 X입니다" 대신 "이 방향이 당신이 얻을 수 없는 비자를 요구한다면…"을 선호하세요. 여러 민감한 제약이 겹칠 경우 의사결정 가중치가 가장 높은 하나만 부각하세요._',
};

// Used when no sensitive constraints registered for this user (all flexible
// or empty). Keeps the legacy "assume general thresholds" framing — never
// invent constraints that weren't provided.
const NARRATIVE_FOOTER_NO_SENSITIVE: LocaleTexts = {
  en: '\n\n_Note: no high-weight sensitive constraints were provided. In challenges, use general conditional phrasing such as "you\'ll want to verify how this fits your visa, family, and financial situation" rather than specific claims. Frame as strategic threshold, not exclusion._',
  zh: '\n\n_注意：用户未填写高权重的敏感约束。在 challenges 中使用通用条件句式，例如"建议你验证该方向如何与你的签证、家庭和经济情况契合"，避免具体断言。表达为策略门槛，而非排他性否定。_',
  nl: '\n\n_Let op: er zijn geen zwaarwegende gevoelige beperkingen opgegeven. Gebruik bij challenges een algemene voorwaardelijke formulering, bijv. "je zult willen verifiëren hoe dit past bij je visum, gezin en financiële situatie." Frame het als strategische drempel, geen uitsluiting._',
  de: '\n\n_Hinweis: keine schwergewichtigen sensiblen Bedingungen angegeben. Verwende in challenges allgemeine Konditionalformulierungen wie „du solltest prüfen, wie das zu deinem Visum, deiner Familie und deiner finanziellen Situation passt." Rahme als strategische Schwelle, keine Ausschlussaussage._',
  fr: "\n\n_Note : aucune contrainte sensible à fort poids n'a été fournie. Dans challenges, utilisez des formules conditionnelles générales, par ex. « il faudra vérifier comment cela s'articule avec votre visa, votre famille et votre situation financière ». Cadrez comme seuil stratégique, non comme exclusion._",
  es: '\n\n_Nota: no se proporcionaron restricciones sensibles de alto peso. En challenges, usa frases condicionales generales, p. ej. "querrás verificar cómo esto encaja con tu visa, familia y situación financiera." Encuádralo como umbral estratégico, no como exclusión._',
  pt: '\n\n_Nota: não foram fornecidas restrições sensíveis de alto peso. Em challenges, usa frases condicionais gerais, p. ex. "vais querer verificar como isto se ajusta ao teu visto, família e situação financeira." Enquadra como limiar estratégico, não como exclusão._',
  it: '\n\n_Nota: nessun vincolo sensibile di alto peso fornito. Nelle challenges, usa formulazioni condizionali generali, ad es. "vorrai verificare come questo si concilia con il tuo visto, famiglia e situazione finanziaria." Inquadra come soglia strategica, non esclusione._',
  ru: "\n\n_Примечание: чувствительные ограничения с высоким весом не указаны. В challenges используйте общие условные формулировки, например «стоит проверить, как это сочетается с вашей визой, семьёй и финансовой ситуацией». Подавайте как стратегический порог, а не как исключение._",
  ja: "\n\n_注意：重みの大きい機微な制約は記入されていません。challenges を書く際は、「これがあなたのビザ、家族、経済状況とどう噛み合うか確認するとよい」のような一般的な条件文を用いてください。排他ではなく戦略的なしきい値として扱うこと。_",
  ko: '\n\n_참고: 가중치가 높은 민감한 제약은 제공되지 않았습니다. challenges 작성 시 "이것이 당신의 비자, 가족, 재정 상황과 어떻게 맞물리는지 확인하라" 같은 일반적인 조건문을 사용하세요. 배제가 아닌 전략적 임계값으로 표현하세요._',
};

// ── Field rendering helpers ─────────────────────────────────────────

function fmtWorkLanguages(
  langs: RealConditions["workLanguages"],
  sep: string,
): string {
  return langs.map((wl) => `${wl.language}(${wl.proficiency})`).join(sep);
}

function lineForFull(
  rc: RealConditions,
  locale: string,
  sep: string,
  yes: string,
  no: string,
  notSpecified: string,
): { lines: string[]; fieldCount: number } {
  const workLangs = fmtWorkLanguages(rc.workLanguages, sep);
  const partnerSuffix = rc.familyConstraints?.partnerWorkRestriction
    ? locale === "zh"
      ? "（伴侣工作有限制）"
      : " (partner has work restrictions)"
    : "";
  const visaTypeSuffix = rc.visaType ? ` (${rc.visaType})` : "";
  const relocationSuffix = rc.relocationTimeline
    ? locale === "zh"
      ? ` (预计: ${rc.relocationTimeline})`
      : ` (timeline: ${rc.relocationTimeline})`
    : "";
  const externalNoteSuffix = rc.culturalIdentity?.externalExpectationNote
    ? ` (${rc.culturalIdentity.externalExpectationNote})`
    : "";
  const occupationSuffix =
    rc.workRestrictions?.occupationRestricted &&
    rc.workRestrictions?.occupationNote
      ? ` (${rc.workRestrictions.occupationNote})`
      : "";
  const currentIndustryLabel = rc.currentIndustry
    ? (() => {
        const ind = INDUSTRY_MAP.get(rc.currentIndustry);
        return ind ? getIndustryLabelByLocale(ind, locale) : rc.currentIndustry;
      })()
    : null;
  const urgencyText = rc.careerChangeUrgency
    ? L(URGENCY_LABELS[rc.careerChangeUrgency], locale)
    : null;
  const showSalaryRange =
    !!rc.salaryRange && (rc.salaryRange.min > 0 || rc.salaryRange.max > 0);

  const lines = [
    `- ${L(FIELD_LABELS.education, locale)}: ${rc.education.level} · ${rc.education.field}`,
    `- ${L(FIELD_LABELS.experience, locale)}: ${rc.experienceYears}${locale === "zh" ? "年" : " years"}`,
    `- ${L(FIELD_LABELS.pastIndustries, locale)}: ${rc.pastIndustries.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.industryBackground, locale)}: ${rc.industryBackground || notSpecified}`,
    `- ${L(FIELD_LABELS.currentCity, locale)}: ${rc.currentCity || notSpecified}`,
    `- ${L(FIELD_LABELS.targetCities, locale)}: ${rc.targetCities.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.visaStatus, locale)}: ${rc.visaStatus || notSpecified}${visaTypeSuffix}`,
    `- ${L(FIELD_LABELS.sponsorshipRequired, locale)}: ${rc.workRestrictions?.sponsorshipRequired ? yes : no}`,
    `- ${L(FIELD_LABELS.canWorkFullTime, locale)}: ${rc.workRestrictions?.canWorkFullTime ? yes : no}`,
    ...(rc.workRestrictions?.occupationRestricted
      ? [
          `- ${L(FIELD_LABELS.occupationRestricted, locale)}: ${yes}${occupationSuffix}`,
        ]
      : []),
    `- ${L(FIELD_LABELS.locationFlexibility, locale)}: ${rc.locationFlexibility || notSpecified}${relocationSuffix}`,
    `- ${L(FIELD_LABELS.workLanguages, locale)}: ${workLangs || notSpecified}`,
    `- ${L(FIELD_LABELS.salaryFloor, locale)}: ${rc.economicConstraints?.salaryFloor || notSpecified}`,
    `- ${L(FIELD_LABELS.willingToRetrain, locale)}: ${rc.economicConstraints?.willingToRetrain ? yes : no}`,
    ...(showSalaryRange
      ? [
          `- ${L(FIELD_LABELS.salaryRange, locale)}: ${rc.salaryRange.min}-${rc.salaryRange.max} ${rc.salaryRange.currency}`,
        ]
      : []),
    `- ${L(FIELD_LABELS.hasPartner, locale)}: ${rc.familyConstraints?.hasPartner ? yes : no}${partnerSuffix}`,
    `- ${L(FIELD_LABELS.workType, locale)}: ${rc.workType || notSpecified}`,
    `- ${L(FIELD_LABELS.officeMode, locale)}: ${rc.officeMode || notSpecified}`,
    ...(currentIndustryLabel
      ? [
          `- ${L(FIELD_LABELS.currentIndustry, locale)}: ${currentIndustryLabel}`,
        ]
      : []),
    `- ${L(FIELD_LABELS.interestedIndustries, locale)}: ${rc.interestedIndustries.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.openToCareerChange, locale)}: ${rc.openToCareerChange || notSpecified}`,
    ...(urgencyText
      ? [`- ${L(FIELD_LABELS.careerChangeUrgency, locale)}: ${urgencyText}`]
      : []),
    `- ${L(FIELD_LABELS.externalPressure, locale)}: ${rc.culturalIdentity?.externalExpectationPressure || notSpecified}${externalNoteSuffix}`,
  ];
  return { lines, fieldCount: lines.length };
}

function lineForNarrative(
  rc: RealConditions,
  locale: string,
  sep: string,
  notSpecified: string,
): { lines: string[]; fieldCount: number } {
  // 8-field "low-sensitivity" subset. Excludes: visaStatus, sponsorshipRequired,
  // familyConstraints, salaryRange, salaryFloor, willingToRetrain,
  // externalExpectationPressure. Those are flagged in the footer instead.
  const lines = [
    `- ${L(FIELD_LABELS.education, locale)}: ${rc.education.level} · ${rc.education.field}`,
    `- ${L(FIELD_LABELS.experience, locale)}: ${rc.experienceYears}${locale === "zh" ? "年" : " years"}`,
    `- ${L(FIELD_LABELS.pastIndustries, locale)}: ${rc.pastIndustries.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.currentCity, locale)}: ${rc.currentCity || notSpecified}`,
    `- ${L(FIELD_LABELS.targetCities, locale)}: ${rc.targetCities.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.workType, locale)}: ${rc.workType || notSpecified}`,
    `- ${L(FIELD_LABELS.officeMode, locale)}: ${rc.officeMode || notSpecified}`,
    `- ${L(FIELD_LABELS.interestedIndustries, locale)}: ${rc.interestedIndustries.join(sep) || notSpecified}`,
    `- ${L(FIELD_LABELS.openToCareerChange, locale)}: ${rc.openToCareerChange || notSpecified}`,
  ];
  return { lines, fieldCount: lines.length };
}

/**
 * Sensitive-constraint sub-block for narrative mode.
 *
 * Renders 2-4 high-decision-weight constraints (visa / family / salary /
 * external pressure) with an attached example of conditional-clause phrasing
 * so the LLM has both the VALUE (to ground its reasoning) AND a template
 * (to avoid copying bare field-name labels).
 *
 * Each line follows the shape:
 *   - Value summary — write as e.g. "if a direction does X, surface this as Y"
 *
 * Returns an empty `block` when no sensitive constraint registered — caller
 * then uses NARRATIVE_FOOTER_NO_SENSITIVE to keep the generic conditional
 * framing intact.
 */
function lineForSensitiveConstraints(
  rc: RealConditions,
  locale: string,
): { block: string; sensitiveFieldCount: number } {
  const isZh = locale === "zh";
  const lines: string[] = [];

  // 1. Visa pressure — only render if sponsorship required or non-PR/citizen.
  const isCitizenOrPR =
    rc.visaStatus === "citizen" || rc.visaStatus === "permanent_resident";
  if (
    rc.workRestrictions?.sponsorshipRequired ||
    (rc.visaStatus && !isCitizenOrPR)
  ) {
    const visaValue = `${rc.visaStatus || "unspecified"}${rc.visaType ? ` (${rc.visaType})` : ""}${rc.workRestrictions?.sponsorshipRequired ? (isZh ? "，需雇主担保" : ", requires employer sponsorship") : ""}`;
    const visaLine = isZh
      ? `- 签证/身份：${visaValue} — 写成例如"如果该方向需要你尚未拥有的工作许可，建议在投入前先核实雇主担保流程"`
      : `- Visa/work-permit: ${visaValue} — write as e.g. "if this direction requires a work-permit pathway you don't currently hold, verify sponsorship feasibility before committing"`;
    lines.push(visaLine);
  }

  // 2. Family pressure
  if (
    rc.familyConstraints?.hasPartner ||
    rc.familyConstraints?.hasDependents ||
    rc.familyConstraints?.partnerWorkRestriction
  ) {
    const parts: string[] = [];
    if (rc.familyConstraints.hasPartner)
      parts.push(isZh ? "有伴侣" : "partner");
    if (rc.familyConstraints.partnerWorkRestriction)
      parts.push(isZh ? "伴侣工作受限" : "partner has work restrictions");
    if (rc.familyConstraints.hasDependents)
      parts.push(isZh ? "有家属" : "dependents");
    const familyLine = isZh
      ? `- 家庭情况：${parts.join("、")} — 写成例如"如果该方向涉及搬迁，需要把伴侣或家属的安排作为同等权重的条件来评估"`
      : `- Family: ${parts.join(", ")} — write as e.g. "if this direction implies relocation, weigh your partner's or family's situation as an equally weighted condition"`;
    lines.push(familyLine);
  }

  // 3. Salary floor — only render critical/important (flexible = no signal).
  if (
    rc.economicConstraints?.salaryFloor === "critical" ||
    rc.economicConstraints?.salaryFloor === "important"
  ) {
    const salaryLevel = rc.economicConstraints.salaryFloor;
    const salaryValueZh = salaryLevel === "critical" ? "关键" : "重要";
    const salaryLine = isZh
      ? `- 薪资底线：${salaryValueZh} — 写成例如"如果该方向的入门薪资可能低于你设定的底线，建议把薪资匹配作为筛选门槛而非弹性变量"`
      : `- Salary floor: ${salaryLevel} — write as e.g. "if this direction's entry compensation may fall below your stated floor, treat salary fit as a screening threshold rather than a flexible variable"`;
    lines.push(salaryLine);
  }

  // 4. External expectation pressure — only high/medium.
  if (
    rc.culturalIdentity?.externalExpectationPressure === "high" ||
    rc.culturalIdentity?.externalExpectationPressure === "medium"
  ) {
    const level = rc.culturalIdentity.externalExpectationPressure;
    const levelZh = level === "high" ? "高" : "中";
    const pressureLine = isZh
      ? `- 外部期望压力：${levelZh} — 写成例如"如果该方向与你提到的外部期望存在张力，可以把它点出来作为背景张力，但不要给出绝对建议"`
      : `- External expectation pressure: ${level} — write as e.g. "if this direction sits in tension with the external expectations you've mentioned, surface that as background tension rather than a hard prescription"`;
    lines.push(pressureLine);
  }

  // 5. Retraining unwillingness — signal is the absence of willingness.
  if (rc.economicConstraints?.willingToRetrain === false) {
    const retrainLine = isZh
      ? `- 不愿为转行重新培训/考证 — 写成例如"如果该方向需要从零开始的资格或培训，优先考虑能直接迁移已有能力的路径"`
      : `- Unwilling to retrain/certify for a switch — write as e.g. "if this direction requires from-scratch certification or retraining, prioritize paths that transfer existing capabilities directly"`;
    lines.push(retrainLine);
  }

  // Cap at 4 lines — same reasoning as summary mode: keep the LLM focused
  // on the highest-weight thresholds rather than reciting a checklist.
  const capped = lines.slice(0, 4);
  if (capped.length === 0) {
    return { block: "", sensitiveFieldCount: 0 };
  }
  return {
    block: `${L(SENSITIVE_TITLE, locale)}\n${capped.join("\n")}`,
    sensitiveFieldCount: capped.length,
  };
}

/**
 * Summary mode — picks 2-4 fields with the greatest decision weight.
 *
 * Selection heuristic (in order of priority):
 *   1. Visa pressure (visaStatus + sponsorshipRequired) — single line if any
 *   2. Family pressure (hasPartner / dependents / partner work restriction)
 *   3. Salary floor importance (critical/important only)
 *   4. External expectation pressure (high/medium only)
 *   5. Retraining unwillingness (willingToRetrain=false)
 *   6. Current city + target city mismatch (fallback if nothing else)
 *
 * Stops at 4 lines. Returns sparse output so letterToUser stays "wise friend"
 * not "data dump."
 */
function lineForSummary(
  rc: RealConditions,
  locale: string,
  yes: string,
  no: string,
): { lines: string[]; fieldCount: number } {
  const picked: string[] = [];

  // 1. Visa pressure — only render if sponsorship is required or visa is non-citizen/PR
  const isCitizenOrPR =
    rc.visaStatus === "citizen" || rc.visaStatus === "permanent_resident";
  if (
    rc.workRestrictions?.sponsorshipRequired ||
    (rc.visaStatus && !isCitizenOrPR)
  ) {
    const visaLine =
      locale === "zh"
        ? `- 签证/身份: ${rc.visaStatus || "未指定"}${rc.visaType ? ` (${rc.visaType})` : ""}${rc.workRestrictions?.sponsorshipRequired ? "，需雇主担保" : ""}`
        : `- Visa/work-permit: ${rc.visaStatus || "unspecified"}${rc.visaType ? ` (${rc.visaType})` : ""}${rc.workRestrictions?.sponsorshipRequired ? ", requires employer sponsorship" : ""}`;
    picked.push(visaLine);
  }

  // 2. Family pressure
  if (
    rc.familyConstraints?.hasPartner ||
    rc.familyConstraints?.hasDependents ||
    rc.familyConstraints?.partnerWorkRestriction
  ) {
    const parts: string[] = [];
    if (rc.familyConstraints.hasPartner)
      parts.push(locale === "zh" ? "有伴侣" : "partner");
    if (rc.familyConstraints.partnerWorkRestriction)
      parts.push(
        locale === "zh" ? "伴侣工作受限" : "partner has work restrictions",
      );
    if (rc.familyConstraints.hasDependents)
      parts.push(locale === "zh" ? "有家属" : "dependents");
    if (parts.length > 0) {
      const familyLine =
        locale === "zh"
          ? `- 家庭情况: ${parts.join("、")}`
          : `- Family: ${parts.join(", ")}`;
      picked.push(familyLine);
    }
  }

  // 3. Salary floor — only render if critical/important (flexible = not signal)
  if (
    rc.economicConstraints?.salaryFloor === "critical" ||
    rc.economicConstraints?.salaryFloor === "important"
  ) {
    const salaryLine =
      locale === "zh"
        ? `- 薪资底线: ${rc.economicConstraints.salaryFloor === "critical" ? "关键" : "重要"}`
        : `- Salary floor: ${rc.economicConstraints.salaryFloor}`;
    picked.push(salaryLine);
  }

  // 4. External expectation pressure — only high/medium
  if (
    rc.culturalIdentity?.externalExpectationPressure === "high" ||
    rc.culturalIdentity?.externalExpectationPressure === "medium"
  ) {
    const pressureLine =
      locale === "zh"
        ? `- 外部期望压力: ${rc.culturalIdentity.externalExpectationPressure === "high" ? "高" : "中"}${rc.culturalIdentity.externalExpectationNote ? ` (${rc.culturalIdentity.externalExpectationNote})` : ""}`
        : `- External expectation pressure: ${rc.culturalIdentity.externalExpectationPressure}${rc.culturalIdentity.externalExpectationNote ? ` (${rc.culturalIdentity.externalExpectationNote})` : ""}`;
    picked.push(pressureLine);
  }

  // 5. Retraining unwillingness (the absence is the signal)
  if (rc.economicConstraints?.willingToRetrain === false && picked.length < 4) {
    const retrainLine =
      locale === "zh"
        ? `- 不愿为转行重新培训/考证`
        : `- Unwilling to retrain/certify for a career switch`;
    picked.push(retrainLine);
  }

  // 6. Geographic mismatch — fallback only
  if (
    picked.length < 3 &&
    rc.currentCity &&
    rc.targetCities.length > 0 &&
    !rc.targetCities.includes(rc.currentCity)
  ) {
    const geoLine =
      locale === "zh"
        ? `- 当前位于 ${rc.currentCity}，目标城市为 ${rc.targetCities.join("、")}`
        : `- Currently in ${rc.currentCity}, targeting ${rc.targetCities.join(", ")}`;
    picked.push(geoLine);
  }

  // Cap at 4 lines to keep the letter "wise friend" not "data dump"
  const lines = picked.slice(0, 4);
  // Silence unused-yes/no params (kept for signature symmetry)
  void yes;
  void no;
  return { lines, fieldCount: lines.length };
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Build a real-conditions context block for a specific prompt.
 *
 * @param rc       The user's RealConditions (or null if not filled).
 * @param locale   Site locale (drives field labels, yes/no, fallbacks).
 * @param mode     Which prompt is consuming this block — controls field
 *                 subset and accompanying discipline/perspective directives.
 * @returns        { block, provided, fieldCount }
 *                 - `block`: prompt-ready text including title, lines, and
 *                            mode-specific footer/directive.
 *                 - `provided`: true if RC was filled (not null).
 *                 - `fieldCount`: number of rendered field lines (for
 *                                 observability metrics in LLMUsageLog).
 */
export function buildRealConditionsContextBlock(
  rc: RealConditions | null,
  locale: string,
  mode: RealConditionsContextMode,
): RealConditionsContextResult {
  if (!rc) {
    const fallback =
      mode === "full"
        ? L(NULL_BLOCKS.full, locale)
        : mode === "narrative"
          ? L(NULL_BLOCKS.narrative, locale)
          : mode === "summary"
            ? L(NULL_BLOCKS.summary, locale)
            : L(NULL_BLOCKS.coaching, locale);
    return { block: fallback, provided: false, fieldCount: 0 };
  }

  const safe = sanitizeRealConditions(rc);
  const sep = L(SEP_TEXTS, locale);
  const yes = L(YES_TEXTS, locale);
  const no = L(NO_TEXTS, locale);
  const notSpecified = L(NOT_SPECIFIED_TEXTS, locale);

  if (mode === "full") {
    const { lines, fieldCount } = lineForFull(
      safe,
      locale,
      sep,
      yes,
      no,
      notSpecified,
    );
    return {
      block: `${L(FULL_TITLE, locale)}\n${lines.join("\n")}`,
      provided: true,
      fieldCount,
    };
  }

  if (mode === "coaching") {
    const { lines, fieldCount } = lineForFull(
      safe,
      locale,
      sep,
      yes,
      no,
      notSpecified,
    );
    return {
      block: `${L(COACHING_TITLE, locale)}\n${lines.join("\n")}${L(COACHING_FOOTER, locale)}`,
      provided: true,
      fieldCount,
    };
  }

  if (mode === "narrative") {
    const { lines, fieldCount } = lineForNarrative(
      safe,
      locale,
      sep,
      notSpecified,
    );
    // 2026-05-23 audit fix: previously narrative mode excluded ALL sensitive
    // fields and warned the LLM to "assume they may exist." Users felt their
    // visa/family/salary inputs were ignored. We now expose sensitive
    // constraints as a separate sub-block with explicit condition-clause
    // discipline so the Career Match challenges can reference them concretely
    // — without copying bare field names. Empty sub-block → fall back to
    // the legacy generic-conditional footer (no sensitive constraints to
    // engage).
    const { block: sensitiveBlock, sensitiveFieldCount } =
      lineForSensitiveConstraints(safe, locale);
    const footer = sensitiveFieldCount
      ? L(NARRATIVE_FOOTER_WITH_SENSITIVE, locale)
      : L(NARRATIVE_FOOTER_NO_SENSITIVE, locale);
    const sensitiveSection = sensitiveBlock ? `\n\n${sensitiveBlock}` : "";
    return {
      block: `${L(NARRATIVE_TITLE, locale)}\n${lines.join("\n")}${sensitiveSection}${footer}`,
      provided: true,
      fieldCount: fieldCount + sensitiveFieldCount,
    };
  }

  // summary
  const { lines, fieldCount } = lineForSummary(safe, locale, yes, no);
  if (fieldCount === 0) {
    // RC is filled but none of the "high-decision-weight" fields registered —
    // user is genuinely flexible. Distinguish this from "RC not filled at all"
    // (NULL_BLOCKS.summary) so the letter can honor the flexibility as its
    // own kind of tension without inventing constraints.
    return {
      block: L(SUMMARY_WEAK_SIGNAL, locale),
      provided: true,
      fieldCount: 0,
    };
  }
  return {
    block: `${L(SUMMARY_TITLE, locale)}\n${lines.join("\n")}`,
    provided: true,
    fieldCount,
  };
}
