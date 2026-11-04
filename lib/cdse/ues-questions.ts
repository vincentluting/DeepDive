// ============================================================
// UES-SF-12 — User Engagement Scale, Short Form (12 items)
// O'Brien, H. L., Cairns, P., & Hall, M. (2018).
// A practical approach to measuring user engagement with the
// refined user engagement scale (UES) and new UES short form.
// International Journal of Human-Computer Studies, 112, 28-39.
//
// 4 subscales × 3 items each:
//   FA = Focused Attention
//   PU = Perceived Usability (all 3 items REVERSE-SCORED)
//   AE = Aesthetic Appeal
//   RW = Reward Factor
//
// 5-point Likert: 1 = Strongly Disagree, 5 = Strongly Agree
// Original items from Table 4 of the published paper.
// "[app]" replaced with "Deep Dive" per standard adaptation practice.
// ============================================================

export interface UESQuestion {
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
  subscale:
    | "focused_attention"
    | "perceived_usability"
    | "aesthetic_appeal"
    | "reward_factor";
  /** True if the item should be reverse-scored (5→1, 4→2, etc.) */
  reverseScored: boolean;
}

export interface UESScores {
  ux1: number;
  ux2: number;
  ux3: number;
  ux4: number;
  ux5: number;
  ux6: number;
  ux7: number;
  ux8: number;
  ux9: number;
  ux10: number;
  ux11: number;
  ux12: number;
}

export const UES_QUESTIONS: UESQuestion[] = [
  // ── Focused Attention (FA) — 3 items ────────────────────────
  {
    id: "ux1",
    text_en: "I lost myself in this experience.",
    text_zh: "我沉浸在了这个体验中。",
    text_nl: "Ik ging helemaal op in deze ervaring.",
    text_de: "Ich habe mich in dieser Erfahrung verloren.",
    text_fr: "Je me suis perdu(e) dans cette expérience.",
    text_es: "Me sumergí por completo en esta experiencia.",
    text_pt: "Eu me perdi nesta experiência.",
    text_it: "Mi sono perso/a in questa esperienza.",
    text_ru: "Я полностью погрузился(ась) в этот опыт.",
    text_ja: "この体験に没頭した。",
    text_ko: "이 경험에 완전히 몰입했다.",
    subscale: "focused_attention",
    reverseScored: false,
  },
  {
    id: "ux2",
    text_en: "The time I spent using Deep Dive just slipped away.",
    text_zh: "使用 Deep Dive 的时间不知不觉就过去了。",
    text_nl: "De tijd die ik besteedde aan Deep Dive vloog voorbij.",
    text_de: "Die Zeit, die ich mit Deep Dive verbracht habe, verflog einfach.",
    text_fr:
      "Le temps passé à utiliser Deep Dive s'est écoulé sans que je m'en rende compte.",
    text_es: "El tiempo que pasé usando Deep Dive pasó volando.",
    text_pt: "O tempo que passei usando o Deep Dive passou voando.",
    text_it: "Il tempo trascorso usando Deep Dive è volato via.",
    text_ru: "Время, проведённое с Deep Dive, пролетело незаметно.",
    text_ja: "Deep Diveを使っている間、時間があっという間に過ぎた。",
    text_ko: "Deep Dive를 사용하는 동안 시간이 순식간에 지나갔다.",
    subscale: "focused_attention",
    reverseScored: false,
  },
  {
    id: "ux3",
    text_en: "I was absorbed in this experience.",
    text_zh: "我被这个体验深深吸引了。",
    text_nl: "Ik was verdiept in deze ervaring.",
    text_de: "Ich war in diese Erfahrung vertieft.",
    text_fr: "J'étais absorbé(e) par cette expérience.",
    text_es: "Estaba absorto/a en esta experiencia.",
    text_pt: "Eu estava absorto/a nesta experiência.",
    text_it: "Ero assorto/a in questa esperienza.",
    text_ru: "Я был(а) поглощён(а) этим опытом.",
    text_ja: "この体験に引き込まれた。",
    text_ko: "이 경험에 흠뻑 빠져들었다.",
    subscale: "focused_attention",
    reverseScored: false,
  },
  // ── Perceived Usability (PU) — 3 items (all reverse-scored) ─
  {
    id: "ux4",
    text_en: "I felt frustrated while using Deep Dive.",
    text_zh: "使用 Deep Dive 时我感到沮丧。",
    text_nl: "Ik voelde me gefrustreerd tijdens het gebruik van Deep Dive.",
    text_de: "Ich fühlte mich frustriert bei der Nutzung von Deep Dive.",
    text_fr: "Je me suis senti(e) frustré(e) en utilisant Deep Dive.",
    text_es: "Me sentí frustrado/a al usar Deep Dive.",
    text_pt: "Me senti frustrado/a ao usar o Deep Dive.",
    text_it: "Mi sono sentito/a frustrato/a nell'usare Deep Dive.",
    text_ru: "Я чувствовал(а) разочарование при использовании Deep Dive.",
    text_ja: "Deep Diveを使用中、フラストレーションを感じた。",
    text_ko: "Deep Dive를 사용하면서 답답함을 느꼈다.",
    subscale: "perceived_usability",
    reverseScored: true,
  },
  {
    id: "ux5",
    text_en: "I found Deep Dive confusing to use.",
    text_zh: "我觉得 Deep Dive 用起来令人困惑。",
    text_nl: "Ik vond Deep Dive verwarrend om te gebruiken.",
    text_de: "Ich fand Deep Dive verwirrend in der Nutzung.",
    text_fr: "J'ai trouvé Deep Dive déroutant à utiliser.",
    text_es: "Encontré confuso el uso de Deep Dive.",
    text_pt: "Achei o Deep Dive confuso de usar.",
    text_it: "Ho trovato Deep Dive confuso da usare.",
    text_ru: "Мне показалось, что Deep Dive сбивает с толку.",
    text_ja: "Deep Diveは使い方が分かりにくかった。",
    text_ko: "Deep Dive는 사용하기 혼란스러웠다.",
    subscale: "perceived_usability",
    reverseScored: true,
  },
  {
    id: "ux6",
    text_en: "Using Deep Dive was taxing.",
    text_zh: "使用 Deep Dive 让人感到疲惫。",
    text_nl: "Het gebruik van Deep Dive was vermoeiend.",
    text_de: "Die Nutzung von Deep Dive war anstrengend.",
    text_fr: "Utiliser Deep Dive était éprouvant.",
    text_es: "Usar Deep Dive fue agotador.",
    text_pt: "Usar o Deep Dive foi cansativo.",
    text_it: "Usare Deep Dive è stato faticoso.",
    text_ru: "Использование Deep Dive было утомительным.",
    text_ja: "Deep Diveの使用は疲れるものだった。",
    text_ko: "Deep Dive를 사용하는 것은 부담스러웠다.",
    subscale: "perceived_usability",
    reverseScored: true,
  },
  // ── Aesthetic Appeal (AE) — 3 items ─────────────────────────
  {
    id: "ux7",
    text_en: "Deep Dive was attractive.",
    text_zh: "Deep Dive 很有吸引力。",
    text_nl: "Deep Dive was aantrekkelijk.",
    text_de: "Deep Dive war ansprechend.",
    text_fr: "Deep Dive était attrayant.",
    text_es: "Deep Dive era atractivo.",
    text_pt: "O Deep Dive era atraente.",
    text_it: "Deep Dive era attraente.",
    text_ru: "Deep Dive был привлекательным.",
    text_ja: "Deep Diveは魅力的だった。",
    text_ko: "Deep Dive는 매력적이었다.",
    subscale: "aesthetic_appeal",
    reverseScored: false,
  },
  {
    id: "ux8",
    text_en: "Deep Dive was aesthetically appealing.",
    text_zh: "Deep Dive 在审美上令人愉悦。",
    text_nl: "Deep Dive was esthetisch aantrekkelijk.",
    text_de: "Deep Dive war ästhetisch ansprechend.",
    text_fr: "Deep Dive était esthétiquement plaisant.",
    text_es: "Deep Dive era estéticamente atractivo.",
    text_pt: "O Deep Dive era esteticamente atraente.",
    text_it: "Deep Dive era esteticamente gradevole.",
    text_ru: "Deep Dive был эстетически привлекательным.",
    text_ja: "Deep Diveは審美的に魅力的だった。",
    text_ko: "Deep Dive는 심미적으로 매력적이었다.",
    subscale: "aesthetic_appeal",
    reverseScored: false,
  },
  {
    id: "ux9",
    text_en: "Deep Dive appealed to my visual senses.",
    text_zh: "Deep Dive 对我的视觉感官很有吸引力。",
    text_nl: "Deep Dive sprak mijn visuele zintuigen aan.",
    text_de: "Deep Dive sprach meine visuellen Sinne an.",
    text_fr: "Deep Dive plaisait à mes sens visuels.",
    text_es: "Deep Dive atraía mis sentidos visuales.",
    text_pt: "O Deep Dive agradou meus sentidos visuais.",
    text_it: "Deep Dive faceva appello ai miei sensi visivi.",
    text_ru: "Deep Dive привлекал мои визуальные чувства.",
    text_ja: "Deep Diveは視覚的に訴えるものがあった。",
    text_ko: "Deep Dive는 시각적으로 호소력이 있었다.",
    subscale: "aesthetic_appeal",
    reverseScored: false,
  },
  // ── Reward Factor (RW) — 3 items ────────────────────────────
  {
    id: "ux10",
    text_en: "Using Deep Dive was worthwhile.",
    text_zh: "使用 Deep Dive 是值得的。",
    text_nl: "Het gebruik van Deep Dive was de moeite waard.",
    text_de: "Die Nutzung von Deep Dive hat sich gelohnt.",
    text_fr: "Utiliser Deep Dive en valait la peine.",
    text_es: "Usar Deep Dive valió la pena.",
    text_pt: "Usar o Deep Dive valeu a pena.",
    text_it: "Usare Deep Dive è valso la pena.",
    text_ru: "Использование Deep Dive стоило потраченного времени.",
    text_ja: "Deep Diveを使う価値があった。",
    text_ko: "Deep Dive를 사용하는 것은 가치가 있었다.",
    subscale: "reward_factor",
    reverseScored: false,
  },
  {
    id: "ux11",
    text_en: "My experience with Deep Dive was rewarding.",
    text_zh: "我在 Deep Dive 上的体验是有收获的。",
    text_nl: "Mijn ervaring met Deep Dive was lonend.",
    text_de: "Meine Erfahrung mit Deep Dive war bereichernd.",
    text_fr: "Mon expérience avec Deep Dive était enrichissante.",
    text_es: "Mi experiencia con Deep Dive fue gratificante.",
    text_pt: "Minha experiência com o Deep Dive foi gratificante.",
    text_it: "La mia esperienza con Deep Dive è stata gratificante.",
    text_ru: "Мой опыт с Deep Dive был вознаграждающим.",
    text_ja: "Deep Diveでの体験は実りあるものだった。",
    text_ko: "Deep Dive 경험은 보람 있었다.",
    subscale: "reward_factor",
    reverseScored: false,
  },
  {
    id: "ux12",
    text_en: "I felt interested in this experience.",
    text_zh: "我对这个体验感到有兴趣。",
    text_nl: "Ik voelde me geïnteresseerd in deze ervaring.",
    text_de: "Ich fühlte mich von dieser Erfahrung angesprochen.",
    text_fr: "Je me suis senti(e) intéressé(e) par cette expérience.",
    text_es: "Me sentí interesado/a en esta experiencia.",
    text_pt: "Me senti interessado/a nesta experiência.",
    text_it: "Mi sono sentito/a interessato/a a questa esperienza.",
    text_ru: "Мне было интересно проходить этот опыт.",
    text_ja: "この体験に興味を感じた。",
    text_ko: "이 경험에 흥미를 느꼈다.",
    subscale: "reward_factor",
    reverseScored: false,
  },
];

export const UES_SCALE_LABELS = {
  en: [
    { value: 1, label: "Strongly Disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Neither Agree nor Disagree" },
    { value: 4, label: "Agree" },
    { value: 5, label: "Strongly Agree" },
  ],
  zh: [
    { value: 1, label: "非常不同意" },
    { value: 2, label: "不同意" },
    { value: 3, label: "既不同意也不反对" },
    { value: 4, label: "同意" },
    { value: 5, label: "非常同意" },
  ],
  nl: [
    { value: 1, label: "Helemaal mee oneens" },
    { value: 2, label: "Mee oneens" },
    { value: 3, label: "Niet mee eens, niet mee oneens" },
    { value: 4, label: "Mee eens" },
    { value: 5, label: "Helemaal mee eens" },
  ],
  de: [
    { value: 1, label: "Stimme überhaupt nicht zu" },
    { value: 2, label: "Stimme nicht zu" },
    { value: 3, label: "Weder noch" },
    { value: 4, label: "Stimme zu" },
    { value: 5, label: "Stimme voll zu" },
  ],
  fr: [
    { value: 1, label: "Tout à fait en désaccord" },
    { value: 2, label: "En désaccord" },
    { value: 3, label: "Ni en accord ni en désaccord" },
    { value: 4, label: "D'accord" },
    { value: 5, label: "Tout à fait d'accord" },
  ],
  es: [
    { value: 1, label: "Totalmente en desacuerdo" },
    { value: 2, label: "En desacuerdo" },
    { value: 3, label: "Ni de acuerdo ni en desacuerdo" },
    { value: 4, label: "De acuerdo" },
    { value: 5, label: "Totalmente de acuerdo" },
  ],
  pt: [
    { value: 1, label: "Discordo totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Nem concordo nem discordo" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo totalmente" },
  ],
  it: [
    { value: 1, label: "Fortemente in disaccordo" },
    { value: 2, label: "In disaccordo" },
    { value: 3, label: "Né d'accordo né in disaccordo" },
    { value: 4, label: "D'accordo" },
    { value: 5, label: "Fortemente d'accordo" },
  ],
  ru: [
    { value: 1, label: "Совершенно не согласен(на)" },
    { value: 2, label: "Не согласен(на)" },
    { value: 3, label: "Ни то, ни другое" },
    { value: 4, label: "Согласен(на)" },
    { value: 5, label: "Полностью согласен(на)" },
  ],
  ja: [
    { value: 1, label: "全くそう思わない" },
    { value: 2, label: "そう思わない" },
    { value: 3, label: "どちらともいえない" },
    { value: 4, label: "そう思う" },
    { value: 5, label: "非常にそう思う" },
  ],
  ko: [
    { value: 1, label: "전혀 동의하지 않음" },
    { value: 2, label: "동의하지 않음" },
    { value: 3, label: "동의도 비동의도 아님" },
    { value: 4, label: "동의함" },
    { value: 5, label: "매우 동의함" },
  ],
} as const;
