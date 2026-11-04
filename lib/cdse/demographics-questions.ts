// ============================================================
// Demographics & Career Baseline — T0 (pre-experience) only
//
// Demographics: 4 items (categorical/ordinal)
// Career Baseline: 3 items (5-point Likert)
//
// Collected once at T0 to describe sample characteristics
// and establish baseline career exploration state.
// ============================================================

export interface DemographicQuestion {
  id: string;
  text_en: string;
  text_zh: string;
  text_nl: string;
  type: "select" | "number" | "text";
  options?: readonly {
    value: string;
    label_en: string;
    label_zh: string;
    label_nl: string;
  }[];
}

export interface CareerBaselineQuestion {
  id: string;
  text_en: string;
  text_zh: string;
  text_nl: string;
  text_de: string;
  text_fr: string;
  text_es: string;
  text_pt: string;
  text_it: string;
  text_ru: string;
  text_ja: string;
  text_ko: string;
  key: string;
  scale: readonly number[];
}

// ── Demographics (4 items at T0 — per Research Survey v5.1, 2026-04-06) ────
// All demographics collected from ALL participants at T0.
// Survey language (Chinese/English) serves as cultural background proxy.
// Education, nationality, industry removed (re-identification risk at N=15).

export const DEMOGRAPHIC_QUESTIONS: readonly DemographicQuestion[] = [
  {
    id: "demo_age",
    text_en: "What is your age range?",
    text_zh: "你的年龄段是？",
    text_nl: "Wat is uw leeftijdscategorie?",
    type: "select",
    options: [
      {
        value: "18-24",
        label_en: "18-24",
        label_zh: "18-24",
        label_nl: "18-24",
      },
      {
        value: "25-34",
        label_en: "25-34",
        label_zh: "25-34",
        label_nl: "25-34",
      },
      {
        value: "35-44",
        label_en: "35-44",
        label_zh: "35-44",
        label_nl: "35-44",
      },
      {
        value: "45+",
        label_en: "45+",
        label_zh: "45+",
        label_nl: "45+",
      },
    ],
  },
  {
    id: "demo_gender",
    text_en: "What is your gender?",
    text_zh: "你的性别是？",
    text_nl: "Wat is uw geslacht?",
    type: "select",
    options: [
      {
        value: "male",
        label_en: "Male",
        label_zh: "男",
        label_nl: "Man",
      },
      {
        value: "female",
        label_en: "Female",
        label_zh: "女",
        label_nl: "Vrouw",
      },
      {
        value: "non_binary",
        label_en: "Non-binary",
        label_zh: "非二元性别",
        label_nl: "Non-binair",
      },
      {
        value: "prefer_not_to_say",
        label_en: "Prefer not to say",
        label_zh: "不愿透露",
        label_nl: "Zeg ik liever niet",
      },
    ],
  },
  {
    id: "demo_employment",
    text_en: "What is your current employment status?",
    text_zh: "你目前的就业状态是？",
    text_nl: "Wat is uw huidige werkstatus?",
    type: "select",
    options: [
      {
        value: "student",
        label_en: "Student",
        label_zh: "学生",
        label_nl: "Student",
      },
      {
        value: "employed_ft",
        label_en: "Employed full-time",
        label_zh: "全职就业",
        label_nl: "Voltijd werkzaam",
      },
      {
        value: "employed_pt",
        label_en: "Employed part-time",
        label_zh: "兼职就业",
        label_nl: "Deeltijd werkzaam",
      },
      {
        value: "self_employed",
        label_en: "Self-employed / Freelance",
        label_zh: "自雇 / 自由职业",
        label_nl: "Zelfstandig / Freelance",
      },
      {
        value: "seeking",
        label_en: "Seeking employment",
        label_zh: "求职中",
        label_nl: "Werkzoekend",
      },
      {
        value: "career_transition",
        label_en: "In career transition",
        label_zh: "职业转型中",
        label_nl: "In loopbaantransitie",
      },
      {
        value: "other",
        label_en: "Other",
        label_zh: "其他",
        label_nl: "Anders",
      },
    ],
  },
  {
    id: "demo_experience",
    text_en: "How many years of work experience do you have?",
    text_zh: "你有多少年的工作经验？",
    text_nl: "Hoeveel jaar werkervaring heeft u?",
    type: "select",
    options: [
      {
        value: "0-2",
        label_en: "0-2 years",
        label_zh: "0-2 年",
        label_nl: "0-2 jaar",
      },
      {
        value: "3-5",
        label_en: "3-5 years",
        label_zh: "3-5 年",
        label_nl: "3-5 jaar",
      },
      {
        value: "6-10",
        label_en: "6-10 years",
        label_zh: "6-10 年",
        label_nl: "6-10 jaar",
      },
      {
        value: "11+",
        label_en: "11+ years",
        label_zh: "11 年以上",
        label_nl: "11+ jaar",
      },
    ],
  },
] as const;

// ── Career Status Baseline — DEPRECATED (2026-04-02) ────────
// Removed from T0 survey per Research Survey v4.3:
//   - baseline_1 ≈ cdc1 (direction clarity overlap)
//   - baseline_3 ≈ cdc3/cdc5 (decision readiness overlap)
//   - baseline_2 (active exploration) captured in Interview Q1
//   - N=15 cannot use as covariate (ANCOVA requires N≥50)
// Retained for backward compatibility with any existing data; NOT rendered to participants.

/** @deprecated Removed from T0 survey — use CDC-5 at T0 as baseline measure */
export const CAREER_BASELINE_QUESTIONS: readonly CareerBaselineQuestion[] = [
  {
    id: "baseline_1",
    text_en: "I have a clear sense of the career direction I want to pursue.",
    text_zh: "我清楚自己想要追求的职业方向。",
    text_nl:
      "Ik heb een duidelijk beeld van de loopbaanrichting die ik wil volgen.",
    text_de:
      "Ich habe eine klare Vorstellung von der beruflichen Richtung, die ich einschlagen möchte.",
    text_fr:
      "J'ai une idée claire de la direction de carrière que je souhaite poursuivre.",
    text_es:
      "Tengo una idea clara de la dirección profesional que quiero seguir.",
    text_pt: "Tenho uma ideia clara da direção profissional que quero seguir.",
    text_it:
      "Ho un'idea chiara della direzione di carriera che voglio perseguire.",
    text_ru: "Я чётко понимаю, какое карьерное направление хочу выбрать.",
    text_ja: "自分が進みたいキャリアの方向性が明確にわかっている。",
    text_ko: "내가 추구하고 싶은 직업 방향이 명확하다.",
    key: "baseline_direction_clarity",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "baseline_2",
    text_en: "I am actively exploring career options.",
    text_zh: "我正在积极探索职业选项。",
    text_nl: "Ik verken actief mijn loopbaanmogelijkheden.",
    text_de: "Ich erkunde aktiv berufliche Möglichkeiten.",
    text_fr: "J'explore activement les options de carrière.",
    text_es: "Estoy explorando activamente opciones profesionales.",
    text_pt: "Estou explorando ativamente opções de carreira.",
    text_it: "Sto esplorando attivamente opzioni di carriera.",
    text_ru: "Я активно изучаю варианты карьеры.",
    text_ja: "キャリアの選択肢を積極的に探索している。",
    text_ko: "직업 옵션을 적극적으로 탐색하고 있다.",
    key: "baseline_active_exploration",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "baseline_3",
    text_en: "I feel ready to make a career decision.",
    text_zh: "我觉得自己已经准备好做出职业决策了。",
    text_nl: "Ik voel me klaar om een loopbaanbeslissing te nemen.",
    text_de: "Ich fühle mich bereit, eine berufliche Entscheidung zu treffen.",
    text_fr: "Je me sens prêt(e) à prendre une décision de carrière.",
    text_es: "Me siento preparado/a para tomar una decisión profesional.",
    text_pt: "Sinto-me pronto/a para tomar uma decisão de carreira.",
    text_it: "Mi sento pronto/a a prendere una decisione di carriera.",
    text_ru: "Я чувствую себя готовым(ой) принять карьерное решение.",
    text_ja: "キャリアの決断をする準備ができていると感じる。",
    text_ko: "직업적 결정을 내릴 준비가 되었다고 느낀다.",
    key: "baseline_decision_readiness",
    scale: [1, 2, 3, 4, 5],
  },
] as const;
