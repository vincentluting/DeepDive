// ============================================================
// CDC-5 — Career Direction Confidence Scale (5 items)
//
// Purpose-built for this study. Items adapted from:
//   - CDSE-SF Goal Selection & Self-Appraisal constructs
//     (Betz, Klein & Taylor, 1996)
//   - Holland's Vocational Identity construct
//     (Holland, Daiger & Power, 1980)
//
// Context: Measures confidence in career direction following
// an AI-assisted career exploration experience.
//
// 5-point Likert: 1 = Strongly Disagree, 5 = Strongly Agree
// No reverse-scored items.
//
// Collected at: T0 (pre), T1 (post_immediate), T2 (post_1week)
// ============================================================

export interface CDCQuestion {
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
}

export const CDC_QUESTIONS: readonly CDCQuestion[] = [
  {
    id: "cdc1",
    text_en: "I feel confident about the career direction I want to pursue.",
    text_zh: "我对自己想要追求的职业方向感到有信心。",
    text_nl:
      "Ik voel me zelfverzekerd over de loopbaanrichting die ik wil volgen.",
    text_de:
      "Ich fühle mich zuversichtlich in Bezug auf die berufliche Richtung, die ich einschlagen möchte.",
    text_fr:
      "Je me sens confiant(e) quant à la direction de carrière que je souhaite poursuivre.",
    text_es:
      "Me siento seguro/a sobre la dirección profesional que quiero seguir.",
    text_pt:
      "Sinto-me confiante sobre a direção profissional que quero seguir.",
    text_it:
      "Mi sento sicuro/a riguardo alla direzione di carriera che voglio perseguire.",
    text_ru: "Я уверен(а) в карьерном направлении, которое хочу выбрать.",
    text_ja: "自分が進みたいキャリアの方向性に自信がある。",
    text_ko: "내가 추구하고 싶은 직업 방향에 대해 자신감을 느낀다.",
    key: "cdc_direction_confidence",
  },
  {
    id: "cdc2",
    text_en:
      "I have a clear understanding of which career paths suit my strengths and interests.",
    text_zh: "我清楚地了解哪些职业路径适合我的优势和兴趣。",
    text_nl:
      "Ik heb een duidelijk beeld van welke loopbaanpaden passen bij mijn sterke punten en interesses.",
    text_de:
      "Ich habe ein klares Verständnis davon, welche Berufswege zu meinen Stärken und Interessen passen.",
    text_fr:
      "J'ai une compréhension claire des parcours professionnels qui correspondent à mes forces et intérêts.",
    text_es:
      "Tengo una comprensión clara de qué caminos profesionales se adaptan a mis fortalezas e intereses.",
    text_pt:
      "Tenho uma compreensão clara de quais caminhos profissionais se adequam às minhas forças e interesses.",
    text_it:
      "Ho una chiara comprensione di quali percorsi di carriera si adattano ai miei punti di forza e interessi.",
    text_ru:
      "Я чётко понимаю, какие карьерные пути соответствуют моим сильным сторонам и интересам.",
    text_ja: "自分の強みや興味に合うキャリアパスがどれかを明確に理解している。",
    text_ko:
      "내 강점과 관심사에 맞는 직업 경로가 무엇인지 명확하게 이해하고 있다.",
    key: "cdc_path_clarity",
  },
  {
    id: "cdc3",
    text_en: "I feel certain about my career choices.",
    text_zh: "我对自己的职业选择感到确定。",
    text_nl: "Ik voel me zeker over mijn loopbaankeuzes.",
    text_de: "Ich fühle mich sicher in meinen Berufsentscheidungen.",
    text_fr: "Je me sens certain(e) de mes choix de carrière.",
    text_es: "Me siento seguro/a de mis elecciones profesionales.",
    text_pt: "Sinto-me certo/a sobre minhas escolhas profissionais.",
    text_it: "Mi sento sicuro/a delle mie scelte di carriera.",
    text_ru: "Я уверен(а) в своих карьерных решениях.",
    text_ja: "自分のキャリア選択について確信がある。",
    text_ko: "내 직업 선택에 대해 확신을 느낀다.",
    key: "cdc_certainty",
  },
  {
    id: "cdc4",
    text_en:
      "I would feel comfortable explaining my career direction to others.",
    text_zh: "我可以自信地向别人解释我的职业方向。",
    text_nl:
      "Ik zou me op mijn gemak voelen om mijn loopbaanrichting aan anderen uit te leggen.",
    text_de:
      "Ich würde mich wohl dabei fühlen, anderen meine berufliche Richtung zu erklären.",
    text_fr:
      "Je me sentirais à l'aise d'expliquer ma direction de carrière à d'autres personnes.",
    text_es:
      "Me sentiría cómodo/a explicando mi dirección profesional a otros.",
    text_pt:
      "Eu me sentiria confortável explicando minha direção profissional para outras pessoas.",
    text_it:
      "Mi sentirei a mio agio nello spiegare la mia direzione di carriera agli altri.",
    text_ru:
      "Мне было бы комфортно объяснить другим своё карьерное направление.",
    text_ja: "自分のキャリアの方向性を他者に説明することに抵抗を感じない。",
    text_ko: "다른 사람들에게 내 직업 방향을 편안하게 설명할 수 있을 것이다.",
    key: "cdc_can_articulate",
  },
  {
    id: "cdc5",
    text_en: "I believe I can make well-informed career decisions.",
    text_zh: "我相信自己能够做出明智的职业决策。",
    text_nl:
      "Ik geloof dat ik goed geïnformeerde loopbaanbeslissingen kan nemen.",
    text_de:
      "Ich glaube, dass ich gut informierte Berufsentscheidungen treffen kann.",
    text_fr:
      "Je crois que je peux prendre des décisions de carrière bien éclairées.",
    text_es: "Creo que puedo tomar decisiones profesionales bien informadas.",
    text_pt: "Acredito que posso tomar decisões profissionais bem informadas.",
    text_it: "Credo di poter prendere decisioni di carriera ben informate.",
    text_ru: "Я верю, что могу принимать обоснованные карьерные решения.",
    text_ja: "十分な情報に基づいてキャリアの決断ができると信じている。",
    text_ko: "충분한 정보를 바탕으로 직업적 결정을 내릴 수 있다고 믿는다.",
    key: "cdc_informed_decisions",
  },
] as const;

export const CDC_SCALE_LABELS = {
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
