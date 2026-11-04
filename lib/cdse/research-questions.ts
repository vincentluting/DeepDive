// ============================================================
// Research Questions — Thesis-specific measurement items
//
// Q1: Trust & Psychological Safety Scale (5 items, 1-5 Likert)
// Q2: Constraints Integration Confidence (3 items, 1-5 Likert)
// Q3: Feature Attribution (ranking)
// DR-3: Delayed Reflection (3 items, 1-5 Likert, T2 only)
//
// Collected during post_immediate (Q1-Q3) and post_1week (DR-3) assessments.
// ============================================================

export interface ResearchQuestion {
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

export interface FeatureOption {
  id: string;
  label_en: string;
  label_zh: string;
  label_nl: string;
  label_de: string;
  label_fr: string;
  label_es: string;
  label_pt: string;
  label_it: string;
  label_ru: string;
  label_ja: string;
  label_ko: string;
  /** Optional group-specific label overrides if a feature label varies by experiment arm. */
  groupLabels?: {
    classic: { label_en: string; label_zh: string };
    immersive: { label_en: string; label_zh: string };
  };
}

// Q1: Trust & Psychological Safety Scale (5 items)
// Self-developed, informed by Edmondson's (1999) psychological safety framework.
// 5 facets: Disclosure willingness, Perceived understanding, Platform trust,
//           AI competence, Emotional safety.
export const TRUST_SAFETY_QUESTIONS: readonly ResearchQuestion[] = [
  {
    id: "trust_1",
    text_en:
      "I felt comfortable sharing my real career concerns with the AI Career Coach.",
    text_zh: "我在与 AI 职业教练的对话中，愿意分享真实的职业顾虑。",
    text_nl:
      "Ik voelde me op mijn gemak om mijn echte loopbaanzorgen te delen met de AI Career Coach.",
    text_de:
      "Ich fühlte mich wohl dabei, meine echten beruflichen Bedenken mit dem AI Career Coach zu teilen.",
    text_fr:
      "Je me suis senti(e) à l'aise pour partager mes véritables préoccupations de carrière avec le coach IA.",
    text_es:
      "Me sentí cómodo/a compartiendo mis preocupaciones profesionales reales con el Coach de Carrera IA.",
    text_pt:
      "Me senti confortável em compartilhar minhas preocupações profissionais reais com o Coach de Carreira IA.",
    text_it:
      "Mi sono sentito/a a mio agio nel condividere le mie vere preoccupazioni professionali con il Career Coach IA.",
    text_ru:
      "Мне было комфортно делиться своими реальными карьерными переживаниями с AI-коучем.",
    text_ja:
      "AIキャリアコーチに自分の本当のキャリアの悩みを共有することに抵抗を感じなかった。",
    text_ko: "AI 커리어 코치에게 실제 직업적 고민을 공유하는 것이 편안했다.",
    key: "trust_willing_to_disclose",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "trust_2",
    text_en:
      "During the coaching conversation, I felt understood rather than judged.",
    text_zh: "在教练对话中，我感到被理解而非被评判。",
    text_nl:
      "Tijdens het coachgesprek voelde ik me begrepen in plaats van beoordeeld.",
    text_de:
      "Während des Coaching-Gesprächs fühlte ich mich verstanden statt beurteilt.",
    text_fr:
      "Pendant la conversation de coaching, je me suis senti(e) compris(e) plutôt que jugé(e).",
    text_es:
      "Durante la conversación de coaching, me sentí comprendido/a en lugar de juzgado/a.",
    text_pt:
      "Durante a conversa de coaching, me senti compreendido/a em vez de julgado/a.",
    text_it:
      "Durante la conversazione di coaching, mi sono sentito/a compreso/a piuttosto che giudicato/a.",
    text_ru:
      "Во время коучинговой беседы я чувствовал(а) себя понятым(ой), а не осуждённым(ой).",
    text_ja: "コーチングの会話中、批判されるのではなく理解されていると感じた。",
    text_ko: "코칭 대화 중 판단받는 것이 아니라 이해받는다고 느꼈다.",
    key: "trust_felt_understood",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "trust_3",
    text_en:
      "I was willing to share personal career-related information on this platform.",
    text_zh: "我愿意在这个平台上分享个人的职业相关信息。",
    text_nl:
      "Ik was bereid om persoonlijke loopbaangerelateerde informatie te delen op dit platform.",
    text_de:
      "Ich war bereit, persönliche berufsbezogene Informationen auf dieser Plattform zu teilen.",
    text_fr:
      "J'étais disposé(e) à partager des informations personnelles liées à ma carrière sur cette plateforme.",
    text_es:
      "Estaba dispuesto/a a compartir información personal relacionada con mi carrera en esta plataforma.",
    text_pt:
      "Eu estava disposto/a a compartilhar informações pessoais relacionadas à carreira nesta plataforma.",
    text_it:
      "Ero disposto/a a condividere informazioni personali legate alla carriera su questa piattaforma.",
    text_ru:
      "Я был(а) готов(а) делиться личной информацией, связанной с карьерой, на этой платформе.",
    text_ja:
      "このプラットフォームで個人的なキャリア関連情報を共有することに前向きだった。",
    text_ko: "이 플랫폼에서 개인적인 직업 관련 정보를 공유할 의향이 있었다.",
    key: "trust_comfortable_sharing",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "trust_4",
    text_en:
      "The AI Career Coach provided responses that felt knowledgeable and relevant.",
    text_zh: "AI 职业教练的回答让我感到专业且切题。",
    text_nl:
      "De AI Career Coach gaf antwoorden die deskundig en relevant aanvoelden.",
    text_de:
      "Der AI Career Coach gab Antworten, die sachkundig und relevant wirkten.",
    text_fr:
      "Le coach IA a fourni des réponses qui semblaient compétentes et pertinentes.",
    text_es:
      "El Coach de Carrera IA proporcionó respuestas que parecían expertas y relevantes.",
    text_pt:
      "O Coach de Carreira IA forneceu respostas que pareciam conhecedoras e relevantes.",
    text_it:
      "Il Career Coach IA ha fornito risposte che sembravano competenti e pertinenti.",
    text_ru:
      "AI-коуч давал ответы, которые казались компетентными и релевантными.",
    text_ja:
      "AIキャリアコーチは、知識に基づいた適切な回答を提供してくれたと感じた。",
    text_ko:
      "AI 커리어 코치가 전문적이고 관련성 있는 답변을 제공했다고 느꼈다.",
    key: "trust_ai_competence",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "trust_5",
    text_en:
      "I felt emotionally safe throughout the career exploration process.",
    text_zh: "在整个职业探索过程中，我感到情绪上是安全的。",
    text_nl:
      "Ik voelde me emotioneel veilig gedurende het hele loopbaanverkenningsproces.",
    text_de:
      "Ich fühlte mich emotional sicher während des gesamten Karriereerkundungsprozesses.",
    text_fr:
      "Je me suis senti(e) en sécurité émotionnelle tout au long du processus d'exploration de carrière.",
    text_es:
      "Me sentí emocionalmente seguro/a durante todo el proceso de exploración profesional.",
    text_pt:
      "Me senti emocionalmente seguro/a durante todo o processo de exploração profissional.",
    text_it:
      "Mi sono sentito/a emotivamente al sicuro durante tutto il processo di esplorazione della carriera.",
    text_ru:
      "Я чувствовал(а) себя эмоционально безопасно на протяжении всего процесса исследования карьеры.",
    text_ja: "キャリア探索プロセス全体を通じて、感情的に安全だと感じた。",
    text_ko: "직업 탐색 과정 전반에 걸쳐 감정적으로 안전하다고 느꼈다.",
    key: "trust_emotional_safety",
    scale: [1, 2, 3, 4, 5],
  },
] as const;

// Attention check — T1 only, single instructed-response item.
// Standard psychometric practice (Meade & Craig 2012, Curran 2016):
// inserted between content blocks to detect inattentive responders.
// Expected value = 4 (Agree). Stored in PrePostAssessment.experienceFeedback
// JSONB; not strict-rejected at submit (preserves UX) — flagged at analysis.
export const ATTENTION_CHECK_QUESTION: ResearchQuestion = {
  id: "attn_1",
  text_en:
    "This is a check to make sure you are reading carefully. Please select 'Agree' for this item.",
  text_zh: "这是一道注意力检查题，请确认你正在认真阅读。请为此题选择「同意」。",
  text_nl:
    "Dit is een controlevraag om te checken of je aandachtig leest. Selecteer 'Mee eens' voor dit item.",
  text_de:
    "Dies ist eine Aufmerksamkeitsprüfung. Bitte wählen Sie für dieses Item „Stimme zu“.",
  text_fr:
    "Ceci est une question de vérification d'attention. Veuillez sélectionner « D'accord » pour cet item.",
  text_es:
    "Esta es una pregunta de verificación de atención. Por favor selecciona «De acuerdo» para este ítem.",
  text_pt:
    "Esta é uma questão de verificação de atenção. Por favor selecione «Concordo» para este item.",
  text_it:
    "Questa è una domanda di verifica dell'attenzione. Per favore seleziona «D'accordo» per questo item.",
  text_ru:
    "Это проверочный вопрос на внимательность. Пожалуйста, выберите «Согласен(на)» для этого пункта.",
  text_ja:
    "これは注意確認の質問です。この項目には「そう思う」を選択してください。",
  text_ko:
    "이것은 주의력 확인 문항입니다. 이 항목에는 '동의함'을 선택해 주세요.",
  key: "attn_check_1",
  scale: [1, 2, 3, 4, 5],
} as const;

// Q2: Constraints Integration Confidence (3 items)
export const CONSTRAINTS_CONFIDENCE_QUESTIONS: readonly ResearchQuestion[] = [
  {
    id: "constraints_1",
    text_en:
      "The career recommendations adequately considered my real-world constraints (visa, family, finances, etc.).",
    text_zh: "职业推荐充分考虑了我的现实约束（签证、家庭、财务等）。",
    text_nl:
      "De loopbaanaanbevelingen hielden voldoende rekening met mijn praktische beperkingen (visum, gezin, financiën, etc.).",
    text_de:
      "Die Berufsempfehlungen berücksichtigten meine realen Einschränkungen (Visum, Familie, Finanzen usw.) angemessen.",
    text_fr:
      "Les recommandations de carrière ont suffisamment pris en compte mes contraintes réelles (visa, famille, finances, etc.).",
    text_es:
      "Las recomendaciones profesionales consideraron adecuadamente mis restricciones del mundo real (visa, familia, finanzas, etc.).",
    text_pt:
      "As recomendações de carreira consideraram adequadamente minhas restrições do mundo real (visto, família, finanças, etc.).",
    text_it:
      "Le raccomandazioni di carriera hanno considerato adeguatamente i miei vincoli reali (visto, famiglia, finanze, ecc.).",
    text_ru:
      "Рекомендации по карьере в достаточной мере учли мои реальные ограничения (виза, семья, финансы и т.д.).",
    text_ja:
      "キャリアの推薦は、私の現実的な制約（ビザ、家族、財政など）を適切に考慮していた。",
    text_ko:
      "직업 추천이 나의 현실적 제약(비자, 가족, 재정 등)을 충분히 고려했다.",
    key: "constraints_adequately_considered",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "constraints_2",
    text_en:
      "After the platform integrated my real-world conditions, I felt more confident about the recommended directions.",
    text_zh: "在平台整合了我的现实条件后，我对推荐方向更有信心了。",
    text_nl:
      "Nadat het platform mijn praktische omstandigheden had geïntegreerd, had ik meer vertrouwen in de aanbevolen richtingen.",
    text_de:
      "Nachdem die Plattform meine realen Bedingungen integriert hatte, fühlte ich mich zuversichtlicher bezüglich der empfohlenen Richtungen.",
    text_fr:
      "Après que la plateforme a intégré mes conditions réelles, j'avais plus confiance dans les directions recommandées.",
    text_es:
      "Después de que la plataforma integró mis condiciones del mundo real, me sentí más seguro/a sobre las direcciones recomendadas.",
    text_pt:
      "Depois que a plataforma integrou minhas condições do mundo real, me senti mais confiante sobre as direções recomendadas.",
    text_it:
      "Dopo che la piattaforma ha integrato le mie condizioni reali, mi sono sentito/a più sicuro/a riguardo alle direzioni raccomandate.",
    text_ru:
      "После того как платформа учла мои реальные условия, я почувствовал(а) больше уверенности в рекомендованных направлениях.",
    text_ja:
      "プラットフォームが私の現実の条件を統合した後、推薦された方向性により自信を持てるようになった。",
    text_ko:
      "플랫폼이 나의 현실적 조건을 통합한 후, 추천된 방향에 대해 더 자신감을 느꼈다.",
    key: "constraints_increased_confidence",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "constraints_3",
    text_en:
      "The career recommendations felt actionable given my current real-world situation.",
    text_zh: "考虑到我目前的现实情况，这些职业推荐是可以实际行动的。",
    text_nl:
      "De loopbaanaanbevelingen voelden uitvoerbaar gezien mijn huidige praktische situatie.",
    text_de:
      "Die Berufsempfehlungen fühlten sich angesichts meiner aktuellen realen Situation umsetzbar an.",
    text_fr:
      "Les recommandations de carrière semblaient réalisables compte tenu de ma situation réelle actuelle.",
    text_es:
      "Las recomendaciones profesionales se sentían realizables dada mi situación real actual.",
    text_pt:
      "As recomendações de carreira pareciam viáveis considerando minha situação real atual.",
    text_it:
      "Le raccomandazioni di carriera sembravano realizzabili data la mia situazione reale attuale.",
    text_ru:
      "Рекомендации по карьере казались осуществимыми с учётом моей текущей реальной ситуации.",
    text_ja:
      "現在の現実的な状況を考慮すると、キャリアの推薦は実行可能だと感じた。",
    text_ko:
      "현재의 현실적 상황을 고려할 때, 직업 추천이 실행 가능하다고 느꼈다.",
    key: "constraints_actionable",
    scale: [1, 2, 3, 4, 5],
  },
] as const;

// Q3: Feature Attribution — ranking + per-feature Likert contribution items
export const FEATURE_OPTIONS: readonly FeatureOption[] = [
  {
    id: "quick_dive",
    label_en: "Quick Dive",
    label_zh: "Quick Dive",
    label_nl: "Assessmentervaring",
    label_de: "Bewertungserfahrung",
    label_fr: "Expérience d'évaluation",
    label_es: "Experiencia de evaluación",
    label_pt: "Experiência de avaliação",
    label_it: "Esperienza di valutazione",
    label_ru: "Опыт оценки",
    label_ja: "アセスメント体験",
    label_ko: "평가 경험",
  },
  {
    id: "profile",
    label_en: "Profile",
    label_zh: "档案",
    label_nl: "Profiel",
    label_de: "Profil",
    label_fr: "Profil",
    label_es: "Perfil",
    label_pt: "Perfil",
    label_it: "Profilo",
    label_ru: "Профиль",
    label_ja: "プロフィール",
    label_ko: "프로필",
  },
  {
    id: "deep_dive_report",
    label_en: "Deep Dive Report",
    label_zh: "Deep Dive 报告",
    label_nl: "Deep Dive-rapport",
    label_de: "Deep-Dive-Bericht",
    label_fr: "Rapport Deep Dive",
    label_es: "Informe Deep Dive",
    label_pt: "Relatório Deep Dive",
    label_it: "Report Deep Dive",
    label_ru: "Отчёт Deep Dive",
    label_ja: "Deep Diveレポート",
    label_ko: "Deep Dive 리포트",
  },
  {
    id: "ai_coach",
    label_en: "AI Coach",
    label_zh: "AI 教练",
    label_nl: "AI-coachinggesprek",
    label_de: "KI-Coaching-Gespräch",
    label_fr: "Conversation de coaching IA",
    label_es: "Conversación de coaching con IA",
    label_pt: "Conversa de coaching com IA",
    label_it: "Conversazione di coaching con IA",
    label_ru: "Коучинговая беседа с ИИ",
    label_ja: "AIコーチング対話",
    label_ko: "AI 코칭 대화",
  },
  {
    id: "action_hub",
    label_en: "Action Hub",
    label_zh: "行动中心",
    label_nl: "Actiehub",
    label_de: "Aktions-Hub",
    label_fr: "Hub d'action",
    label_es: "Centro de acción",
    label_pt: "Central de ação",
    label_it: "Hub azioni",
    label_ru: "Центр действий",
    label_ja: "アクションハブ",
    label_ko: "액션 허브",
  },
] as const;

/**
 * Get the display label for a feature option, with optional group-specific override.
 */
export function getFeatureLabel(
  feature: FeatureOption,
  locale: string,
  researchGroup?: "classic" | "immersive" | null,
): string {
  // Check for group-specific label override (currently only en/zh supported)
  if (researchGroup && feature.groupLabels?.[researchGroup]) {
    const groupLabel = feature.groupLabels[researchGroup];
    const localeKey = `label_${locale}` as keyof typeof groupLabel;
    if (localeKey in groupLabel) {
      return groupLabel[localeKey as "label_en" | "label_zh"];
    }
  }
  // Fall back to default label
  const localeKey = `label_${locale}` as keyof FeatureOption;
  const value = feature[localeKey];
  return (typeof value === "string" && value) || feature.label_en;
}

// Agree/Disagree Likert scale labels (shared by Q1 & Q2)
export const AGREE_DISAGREE_SCALE_LABELS = {
  en: [
    { value: 1, label: "Strongly Disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Agree" },
    { value: 5, label: "Strongly Agree" },
  ],
  zh: [
    { value: 1, label: "非常不同意" },
    { value: 2, label: "不同意" },
    { value: 3, label: "中立" },
    { value: 4, label: "同意" },
    { value: 5, label: "非常同意" },
  ],
  nl: [
    { value: 1, label: "Helemaal mee oneens" },
    { value: 2, label: "Mee oneens" },
    { value: 3, label: "Neutraal" },
    { value: 4, label: "Mee eens" },
    { value: 5, label: "Helemaal mee eens" },
  ],
  de: [
    { value: 1, label: "Stimme überhaupt nicht zu" },
    { value: 2, label: "Stimme nicht zu" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Stimme zu" },
    { value: 5, label: "Stimme voll zu" },
  ],
  fr: [
    { value: 1, label: "Tout à fait en désaccord" },
    { value: 2, label: "En désaccord" },
    { value: 3, label: "Neutre" },
    { value: 4, label: "D'accord" },
    { value: 5, label: "Tout à fait d'accord" },
  ],
  es: [
    { value: 1, label: "Totalmente en desacuerdo" },
    { value: 2, label: "En desacuerdo" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "De acuerdo" },
    { value: 5, label: "Totalmente de acuerdo" },
  ],
  pt: [
    { value: 1, label: "Discordo totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Neutro" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo totalmente" },
  ],
  it: [
    { value: 1, label: "Fortemente in disaccordo" },
    { value: 2, label: "In disaccordo" },
    { value: 3, label: "Neutrale" },
    { value: 4, label: "D'accordo" },
    { value: 5, label: "Fortemente d'accordo" },
  ],
  ru: [
    { value: 1, label: "Совершенно не согласен(на)" },
    { value: 2, label: "Не согласен(на)" },
    { value: 3, label: "Нейтрально" },
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
    { value: 3, label: "중립" },
    { value: 4, label: "동의함" },
    { value: 5, label: "매우 동의함" },
  ],
} as const;

// ============================================================
// DR-3 — Delayed Reflection Scale (3 items, T2 only)
// Self-developed, informed by Kirkpatrick's (1959) four-level
// evaluation framework. 3 dimensions:
//   Cognitive impact, Behavioral impact, Attitudinal impact.
// Report item-level descriptives (do NOT compute composite).
// ============================================================

export const DELAYED_REFLECTION_QUESTIONS: readonly ResearchQuestion[] = [
  {
    id: "dr1",
    text_en:
      "Over the past week, I found myself continuing to think about the career insights from Deep Dive.",
    text_zh: "过去一周，我发现自己一直在思考 Deep Dive 中的职业洞察。",
    text_nl:
      "De afgelopen week merkte ik dat ik bleef nadenken over de loopbaaninzichten van Deep Dive.",
    text_de:
      "In der letzten Woche ertappte ich mich dabei, weiterhin über die Karriereerkenntnisse von Deep Dive nachzudenken.",
    text_fr:
      "Au cours de la semaine passée, je me suis surpris(e) à continuer de réfléchir aux insights de carrière de Deep Dive.",
    text_es:
      "Durante la última semana, me encontré continuando a pensar en las ideas de carrera de Deep Dive.",
    text_pt:
      "Na última semana, percebi que continuava pensando nos insights de carreira do Deep Dive.",
    text_it:
      "Nell'ultima settimana, mi sono trovato/a a continuare a pensare agli insight di carriera di Deep Dive.",
    text_ru:
      "За прошедшую неделю я ловил(а) себя на том, что продолжаю думать о карьерных инсайтах Deep Dive.",
    text_ja:
      "この1週間、Deep Diveで得たキャリアに関する気づきについて考え続けている自分に気づいた。",
    text_ko:
      "지난 한 주간, Deep Dive에서 얻은 직업 통찰에 대해 계속 생각하고 있는 자신을 발견했다.",
    key: "delayed_continued_thinking",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "dr2",
    text_en:
      "Since using Deep Dive, I have taken at least one concrete step toward exploring a career direction.",
    text_zh: "使用 Deep Dive 后，我至少采取了一个具体步骤来探索职业方向。",
    text_nl:
      "Sinds het gebruik van Deep Dive heb ik minstens één concrete stap gezet richting het verkennen van een loopbaanrichting.",
    text_de:
      "Seit der Nutzung von Deep Dive habe ich mindestens einen konkreten Schritt unternommen, um eine berufliche Richtung zu erkunden.",
    text_fr:
      "Depuis que j'ai utilisé Deep Dive, j'ai pris au moins une mesure concrète pour explorer une direction de carrière.",
    text_es:
      "Desde que usé Deep Dive, he dado al menos un paso concreto para explorar una dirección profesional.",
    text_pt:
      "Desde que usei o Deep Dive, dei pelo menos um passo concreto para explorar uma direção profissional.",
    text_it:
      "Da quando ho usato Deep Dive, ho compiuto almeno un passo concreto verso l'esplorazione di una direzione di carriera.",
    text_ru:
      "После использования Deep Dive я предпринял(а) хотя бы один конкретный шаг в исследовании карьерного направления.",
    text_ja:
      "Deep Diveを使って以来、キャリアの方向性を探るために少なくとも1つの具体的な行動を取った。",
    text_ko:
      "Deep Dive를 사용한 이후, 직업 방향을 탐색하기 위해 최소한 하나의 구체적인 조치를 취했다.",
    key: "delayed_took_action",
    scale: [1, 2, 3, 4, 5],
  },
  {
    id: "dr3",
    text_en:
      "The experience has changed how I think about my career possibilities.",
    text_zh: "这次体验改变了我对职业可能性的看法。",
    text_nl:
      "De ervaring heeft veranderd hoe ik denk over mijn loopbaanmogelijkheden.",
    text_de:
      "Die Erfahrung hat verändert, wie ich über meine beruflichen Möglichkeiten denke.",
    text_fr:
      "L'expérience a changé ma façon de penser à mes possibilités de carrière.",
    text_es:
      "La experiencia ha cambiado cómo pienso sobre mis posibilidades profesionales.",
    text_pt:
      "A experiência mudou a forma como penso sobre minhas possibilidades profissionais.",
    text_it:
      "L'esperienza ha cambiato il modo in cui penso alle mie possibilità di carriera.",
    text_ru:
      "Этот опыт изменил то, как я думаю о своих карьерных возможностях.",
    text_ja: "この体験は、自分のキャリアの可能性についての考え方を変えた。",
    text_ko: "이 경험은 나의 직업적 가능성에 대한 생각을 바꿨다.",
    key: "delayed_perspective_shift",
    scale: [1, 2, 3, 4, 5],
  },
] as const;
