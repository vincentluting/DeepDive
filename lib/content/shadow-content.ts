// ============================================================
// Shadow Content Mapping — Jungian Big Five Domain Framing
//
// Maps each Big Five domain's "shadow" (undeveloped potential)
// to Jungian framing, contextual strengths, and career contexts.
//
// ⚠️ FROZEN — Only add, never modify existing entries.
// ============================================================

import type { BigFiveDimension } from '@/lib/types';

/** Bilingual text with optional 9-locale extensions */
interface ShadowLocaleText {
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

export interface ShadowDomainContent {
  /** Shadow label — poetic Jungian name for this dimension's undeveloped side */
  shadowLabel: ShadowLocaleText;
  /** When this "undeveloped" trait becomes a career advantage */
  contextualStrength: ShadowLocaleText;
  /** Integration hint — how to grow without forcing */
  integrationHint: ShadowLocaleText;
  /** Career contexts where the shadow dimension is advantageous */
  advantageousContexts: string[];
  /** Spectrum bar labels: low end → high end of this dimension */
  spectrumLowLabel: ShadowLocaleText;
  spectrumHighLabel: ShadowLocaleText;
}

/**
 * Static content for each Big Five domain's shadow framing.
 *
 * For Extraversion, Agreeableness, Conscientiousness, Openness:
 *   low score → shadow (undeveloped potential in that direction)
 * For Neuroticism:
 *   high score → shadow (heightened sensitivity as gift)
 */
export const SHADOW_CONTENT: Record<BigFiveDimension, ShadowDomainContent> = {
  extraversion: {
    shadowLabel: {
      zh: '内敛的力量',
      en: 'The Power of Reserve',
      nl: 'De Kracht van Terughoudendheid',
      de: 'Die Kraft der Zurückhaltung',
      fr: 'La Force de la Réserve',
      es: 'El Poder de la Reserva',
      pt: 'O Poder da Reserva',
      it: 'Il Potere della Riservatezza',
      ru: 'Сила Сдержанности',
      ja: '内省の力',
      ko: '절제의 힘',
    },
    contextualStrength: {
      zh: '在需要深度倾听、持续专注或一对一深度的工作场景中，你的内倾能量不是限制——而是精准。你带来的是临在，而不是表演。那些需要你处理复杂信息、建立深度关系或独立推进的角色，正是你的主场。',
      en: "In environments requiring deep listening, sustained focus, or one-on-one depth, your introverted energy is not a limitation — it's precision. You bring presence where others bring performance. The roles that ask you to process complexity, build depth with individuals, or advance independently are where you operate at full power.",
      nl: "In omgevingen die diep luisteren, aanhoudende focus of één-op-één diepgang vereisen, is je introverte energie geen beperking — het is precisie. Jij brengt aanwezigheid waar anderen prestatie brengen. De rollen die je vragen complexiteit te verwerken, diepte op te bouwen met individuen, of zelfstandig vooruit te gaan, zijn waar je op volle kracht werkt.",
      de: "In Umgebungen, die tiefes Zuhören, anhaltenden Fokus oder Eins-zu-eins-Tiefe erfordern, ist deine introvertierte Energie keine Einschränkung — sie ist Präzision. Du bringst Präsenz, wo andere Performance bringen. Die Rollen, die dich bitten, Komplexität zu verarbeiten, Tiefe mit Einzelpersonen aufzubauen oder eigenständig voranzukommen, sind dein Stärkefeld.",
      fr: "Dans les environnements exigeant une écoute profonde, une concentration soutenue ou une profondeur en tête-à-tête, votre énergie introvertie n'est pas une limitation — c'est de la précision. Vous apportez de la présence là où d'autres apportent de la performance. Les rôles qui vous demandent de traiter la complexité, de construire la profondeur avec les individus ou d'avancer de manière indépendante sont votre terrain de force.",
      es: "En entornos que requieren escucha profunda, enfoque sostenido o profundidad uno a uno, tu energía introvertida no es una limitación — es precisión. Tú aportas presencia donde otros aportan rendimiento. Los roles que te piden procesar complejidad, construir profundidad con individuos o avanzar de forma independiente son donde operas a plena potencia.",
      pt: "Em ambientes que exigem escuta profunda, foco sustentado ou profundidade individual, a tua energia introvertida não é uma limitação — é precisão. Tu trazes presença onde outros trazem performance. Os papéis que te pedem para processar complexidade, construir profundidade com indivíduos ou avançar independentemente são onde operas a plena potência.",
      it: "In ambienti che richiedono ascolto profondo, concentrazione sostenuta o profondità uno a uno, la tua energia introversa non è un limite — è precisione. Tu porti presenza dove altri portano performance. I ruoli che ti chiedono di elaborare complessità, costruire profondità con gli individui o avanzare in modo indipendente sono dove operi a piena potenza.",
      ru: "В среде, требующей глубокого слушания, устойчивого фокуса или индивидуальной глубины, твоя интровертная энергия — не ограничение, а точность. Ты приносишь присутствие там, где другие приносят перформанс. Роли, где нужно обрабатывать сложность, строить глубину с отдельными людьми или продвигаться самостоятельно — твоя территория полной мощности.",
      ja: "深い傾聴、持続的な集中、または一対一の深さを必要とする環境では、あなたの内向的エネルギーは制限ではなく精密さだ。他の人がパフォーマンスを持ち込むところに、あなたはプレゼンスを持ち込む。複雑さを処理し、個人との深さを築き、独立して前進することを求められる役割こそ、あなたがフルパワーで機能する場だ。",
      ko: "깊은 경청, 지속적 집중, 또는 일대일 깊이를 요구하는 환경에서, 당신의 내향적 에너지는 제한이 아니라 정밀함이다. 다른 사람이 퍼포먼스를 가져오는 곳에 당신은 존재감을 가져온다. 복잡성을 처리하고, 개인과의 깊이를 구축하고, 독립적으로 전진하는 것을 요구하는 역할이 당신이 최대 출력으로 작동하는 곳이다.",
    },
    integrationHint: {
      zh: '你不需要变得更外向。关键是在最重要的时刻清晰表达你的立场——学会战略性发声，而不是强行表演外向。寻找小组深度对话的场景，而不是需要持续社交能量的舞台。',
      en: "You don't need to become more outgoing. The edge is learning to project your position clearly at moments that matter — strategic voice, not performed extroversion. Seek roles that place you in small-group or deep one-on-one contexts rather than continuous high-social-energy environments.",
      nl: "Je hoeft niet extrovert te worden. De sleutel is leren je standpunt helder over te brengen op momenten die ertoe doen — strategische stem, geen gespeelde extraversie. Zoek rollen in kleine groepen of diepe één-op-één contexten in plaats van continue hoog-sociale-energie omgevingen.",
      de: "Du musst nicht extrovertierter werden. Der Schlüssel ist, deine Position in entscheidenden Momenten klar zu artikulieren — strategische Stimme, nicht gespieltes Extrovertiertsein. Suche Rollen in Kleingruppen oder tiefen Einzelgesprächen statt in durchgehend hochenergetischen sozialen Umgebungen.",
      fr: "Vous n'avez pas besoin de devenir plus extraverti. L'avantage est d'apprendre à projeter clairement votre position aux moments clés — une voix stratégique, pas une extraversion jouée. Cherchez des rôles en petit groupe ou en tête-à-tête approfondi plutôt qu'en environnements à haute énergie sociale continue.",
      es: "No necesitas volverte más extrovertido. La clave es aprender a proyectar tu posición claramente en los momentos que importan — voz estratégica, no extraversión actuada. Busca roles en grupos pequeños o contextos profundos uno a uno en lugar de entornos de alta energía social continua.",
      pt: "Não precisas de te tornar mais extrovertido. A vantagem é aprender a projetar a tua posição claramente nos momentos que importam — voz estratégica, não extraversão performada. Procura papéis em pequenos grupos ou contextos profundos individuais em vez de ambientes de alta energia social contínua.",
      it: "Non hai bisogno di diventare più estroverso. Il vantaggio è imparare a proiettare chiaramente la tua posizione nei momenti che contano — voce strategica, non estroversione recitata. Cerca ruoli in piccoli gruppi o contesti profondi uno a uno piuttosto che ambienti ad alta energia sociale continua.",
      ru: "Тебе не нужно становиться более общительным. Ключ — научиться ясно выражать свою позицию в моменты, когда это важно: стратегический голос, а не разыгранная экстраверсия. Ищи роли в малых группах или глубоких индивидуальных контекстах, а не в среде с постоянно высокой социальной энергией.",
      ja: "より外向的になる必要はない。重要なのは、大事な瞬間に自分の立場を明確に発信する方法を学ぶこと——戦略的な発声であり、演じられた外向性ではない。継続的に高いソーシャルエネルギーを必要とする環境ではなく、少人数グループや深い一対一の文脈に身を置く役割を探そう。",
      ko: "더 외향적이 될 필요는 없다. 핵심은 중요한 순간에 자신의 입장을 명확하게 전달하는 법을 배우는 것 — 전략적 발언이지, 연기된 외향성이 아니다. 지속적으로 높은 사회적 에너지를 요구하는 환경 대신 소그룹이나 깊은 일대일 맥락에 놓이는 역할을 찾아라.",
    },
    advantageousContexts: [
      'Research & analysis',
      'Writing & content strategy',
      'UX research',
      'Individual counseling & coaching',
      'Technical depth roles',
      'Deep consulting & advisory',
      'Documentation & knowledge work',
    ],
    spectrumLowLabel: { zh: '内敛', en: 'Reserve', nl: 'Terughoudend', de: 'Zurückhaltend', fr: 'Réservé', es: 'Reservado', pt: 'Reservado', it: 'Riservato', ru: 'Сдержанность', ja: '内向', ko: '내향' },
    spectrumHighLabel: { zh: '外向', en: 'Expression', nl: 'Expressief', de: 'Ausdrucksstark', fr: 'Expressif', es: 'Expresivo', pt: 'Expressivo', it: 'Espressivo', ru: 'Выразительность', ja: '外向', ko: '표현' },
  },

  agreeableness: {
    shadowLabel: {
      zh: '辨别力的锋芒',
      en: 'The Edge of Discernment',
      nl: 'De Scherpte van Onderscheidingsvermogen',
      de: 'Die Schärfe der Urteilskraft',
      fr: 'Le Tranchant du Discernement',
      es: 'El Filo del Discernimiento',
      pt: 'O Fio do Discernimento',
      it: 'Il Filo del Discernimento',
      ru: 'Острие Проницательности',
      ja: '洞察の鋭さ',
      ko: '분별의 날카로움',
    },
    contextualStrength: {
      zh: '在谈判、对抗性分析、或所有人都为了避免冲突而妥协的环境中，你愿意反驳的勇气是系统性资产。你不会为了被喜欢而扭曲真相——这在需要诚实评估、批判性反馈或竞争性决策的角色中极为稀缺。',
      en: "In negotiations, adversarial analysis, or environments where everyone is agreeing to avoid conflict, your willingness to push back is a systemic asset. You won't distort truth to be liked — a rare quality in roles requiring honest assessment, critical feedback, or competitive positioning.",
      nl: "In onderhandelingen, vijandige analyses of omgevingen waar iedereen instemt om conflicten te vermijden, is jouw bereidheid om terug te duwen een systemisch voordeel. Je zult de waarheid niet vervormen om aardig gevonden te worden — een zeldzame kwaliteit in rollen die eerlijke beoordeling, kritische feedback of concurrentiepositie vereisen.",
      de: "In Verhandlungen, adversarischen Analysen oder Umgebungen, in denen alle zustimmen, um Konflikte zu vermeiden, ist deine Bereitschaft zurückzudrängen ein systemischer Vorteil. Du wirst die Wahrheit nicht verbiegen, um gemocht zu werden — eine seltene Qualität in Rollen, die ehrliche Bewertung, kritisches Feedback oder Wettbewerbspositionierung erfordern.",
      fr: "Dans les négociations, l'analyse adversariale ou les environnements où tout le monde acquiesce pour éviter le conflit, votre volonté de résister est un atout systémique. Vous ne déformerez pas la vérité pour être aimé — une qualité rare dans les rôles exigeant une évaluation honnête, un retour critique ou un positionnement concurrentiel.",
      es: "En negociaciones, análisis adversarial o entornos donde todos están de acuerdo para evitar conflictos, tu disposición a resistir es un activo sistémico. No distorsionarás la verdad para ser agradable — una cualidad rara en roles que requieren evaluación honesta, retroalimentación crítica o posicionamiento competitivo.",
      pt: "Em negociações, análise adversarial ou ambientes onde todos concordam para evitar conflitos, a tua disposição para resistir é um ativo sistémico. Não distorcerás a verdade para ser apreciado — uma qualidade rara em papéis que requerem avaliação honesta, feedback crítico ou posicionamento competitivo.",
      it: "Nelle negoziazioni, nell'analisi avversariale o in ambienti dove tutti concordano per evitare il conflitto, la tua disponibilità a resistere è un asset sistemico. Non distorcerai la verità per piacere — una qualità rara in ruoli che richiedono valutazione onesta, feedback critico o posizionamento competitivo.",
      ru: "В переговорах, состязательном анализе или средах, где все соглашаются, чтобы избежать конфликта, твоя готовность возражать — системный актив. Ты не исказишь правду ради симпатии — редкое качество в ролях, требующих честной оценки, критической обратной связи или конкурентного позиционирования.",
      ja: "交渉、敵対的分析、または全員が衝突を避けるために同意している環境では、あなたの反論する意志はシステム的な資産だ。好かれるために真実を歪めることはない——正直な評価、批判的フィードバック、または競争的ポジショニングを求められる役割で極めて稀な資質だ。",
      ko: "협상, 적대적 분석, 또는 모든 사람이 갈등을 피하기 위해 동의하는 환경에서, 당신의 반박 의지는 체계적 자산이다. 좋아하게 하기 위해 진실을 왜곡하지 않는다 — 정직한 평가, 비판적 피드백, 또는 경쟁적 포지셔닝을 요구하는 역할에서 극히 희귀한 자질이다.",
    },
    integrationHint: {
      zh: '这里的边缘不是学会更随和——而是学会区分：什么时候的异议在服务于集体，什么时候只是在保护自我。你的直接是力量；关键是让对方感受到被尊重，而不只是被纠正。',
      en: "The edge here isn't learning to be more agreeable — it's learning to distinguish when your disagreement serves the group versus when it's protecting the ego. Your directness is a strength; the refinement is ensuring people feel heard, not just corrected.",
      nl: "De sleutel hier is niet leren om meer meegaand te zijn — het is leren onderscheiden wanneer je onenigheid de groep dient versus wanneer het het ego beschermt. Je directheid is een kracht; de verfijning is ervoor zorgen dat mensen zich gehoord voelen, niet alleen gecorrigeerd.",
      de: "Der Schlüssel hier ist nicht, umgänglicher zu werden — sondern zu unterscheiden, wann dein Widerspruch der Gruppe dient und wann er das Ego schützt. Deine Direktheit ist eine Stärke; die Verfeinerung besteht darin, sicherzustellen, dass Menschen sich gehört fühlen, nicht nur korrigiert.",
      fr: "L'avantage ici n'est pas d'apprendre à être plus conciliant — c'est d'apprendre à distinguer quand votre désaccord sert le groupe de quand il protège l'ego. Votre franchise est une force ; la finesse est de s'assurer que les gens se sentent entendus, pas seulement corrigés.",
      es: "La ventaja aquí no es aprender a ser más conciliador — es aprender a distinguir cuándo tu desacuerdo sirve al grupo versus cuándo protege el ego. Tu franqueza es una fortaleza; el refinamiento es asegurar que las personas se sientan escuchadas, no solo corregidas.",
      pt: "A vantagem aqui não é aprender a ser mais conciliador — é aprender a distinguir quando o teu desacordo serve o grupo versus quando protege o ego. A tua franqueza é uma força; o refinamento é garantir que as pessoas se sintam ouvidas, não apenas corrigidas.",
      it: "Il vantaggio qui non è imparare a essere più conciliante — è imparare a distinguere quando il tuo disaccordo serve il gruppo rispetto a quando protegge l'ego. La tua franchezza è una forza; il raffinamento è assicurarsi che le persone si sentano ascoltate, non solo corrette.",
      ru: "Преимущество здесь не в том, чтобы стать более уступчивым — а в том, чтобы научиться различать, когда твоё несогласие служит группе, а когда защищает эго. Твоя прямота — сила; утончённость в том, чтобы люди чувствовали себя услышанными, а не просто исправленными.",
      ja: "ここでのエッジは、より協調的になることではなく、自分の異議がグループに奉仕しているのか、エゴを守っているのかを区別する方法を学ぶことだ。あなたの直接さは強みだ。洗練とは、人々が訂正されただけでなく、聞かれたと感じるようにすることだ。",
      ko: "여기서의 핵심은 더 협조적이 되는 법을 배우는 것이 아니라, 당신의 반대가 그룹에 봉사하는 때와 에고를 보호하는 때를 구별하는 법을 배우는 것이다. 당신의 직접성은 강점이다. 세련됨은 사람들이 교정된 것만이 아니라 들렸다고 느끼게 하는 것이다.",
    },
    advantageousContexts: [
      'Negotiation & deal-making',
      'Legal & compliance',
      'Investigative journalism',
      'Product strategy & prioritization',
      'Venture evaluation & due diligence',
      'Competitive intelligence',
      'Adversarial review (security, audit)',
    ],
    spectrumLowLabel: { zh: '独立', en: 'Independent', nl: 'Onafhankelijk', de: 'Unabhängig', fr: 'Indépendant', es: 'Independiente', pt: 'Independente', it: 'Indipendente', ru: 'Независимый', ja: '独立', ko: '독립' },
    spectrumHighLabel: { zh: '协调', en: 'Harmonious', nl: 'Harmonieus', de: 'Harmonisch', fr: 'Harmonieux', es: 'Armonioso', pt: 'Harmonioso', it: 'Armonioso', ru: 'Гармоничный', ja: '協調', ko: '조화' },
  },

  conscientiousness: {
    shadowLabel: {
      zh: '适应性的流动',
      en: 'Adaptive Fluency',
      nl: 'Adaptieve Vloeiendheid',
      de: 'Adaptive Flüssigkeit',
      fr: 'Fluidité Adaptative',
      es: 'Fluidez Adaptativa',
      pt: 'Fluidez Adaptativa',
      it: 'Fluidità Adattiva',
      ru: 'Адаптивная Гибкость',
      ja: '適応的流動性',
      ko: '적응적 유연성',
    },
    contextualStrength: {
      zh: '在快速变化的环境、创业混乱或约束不断变化的创意工作中，你对模糊性的适应能力是特性，不是缺陷。当别人因计划被打乱而陷入焦虑时，你能重新校准并继续推进。灵活性奖励、程序排后的角色，是你的自然栖息地。',
      en: "In fast-changing environments, startup chaos, or creative work with shifting constraints, your comfort with ambiguity is a feature, not a bug. When others freeze because the plan changed, you recalibrate and move forward. Roles that reward flexibility over procedure are your natural habitat.",
      nl: "In snel veranderende omgevingen, startup-chaos of creatief werk met wisselende beperkingen is jouw comfort met ambiguïteit een feature, geen bug. Wanneer anderen bevriezen omdat het plan veranderde, herkalibreer jij en ga je verder. Rollen die flexibiliteit boven procedure belonen zijn jouw natuurlijke habitat.",
      de: "In sich schnell verändernden Umgebungen, Startup-Chaos oder kreativer Arbeit mit wechselnden Einschränkungen ist dein Wohlbefinden mit Ambiguität ein Feature, kein Bug. Wenn andere einfrieren, weil der Plan sich geändert hat, kalibrierst du neu und gehst weiter. Rollen, die Flexibilität über Verfahren belohnen, sind dein natürlicher Lebensraum.",
      fr: "Dans des environnements en mutation rapide, le chaos des startups ou le travail créatif aux contraintes changeantes, votre aise avec l'ambiguïté est un atout, pas un défaut. Quand les autres se figent parce que le plan a changé, vous recalibrez et avancez. Les rôles qui récompensent la flexibilité plutôt que la procédure sont votre habitat naturel.",
      es: "En entornos de cambio rápido, caos de startups o trabajo creativo con restricciones cambiantes, tu comodidad con la ambigüedad es una característica, no un defecto. Cuando otros se paralizan porque el plan cambió, tú recalibras y avanzas. Los roles que recompensan la flexibilidad sobre el procedimiento son tu hábitat natural.",
      pt: "Em ambientes de mudança rápida, caos de startups ou trabalho criativo com restrições em mudança, o teu conforto com a ambiguidade é uma característica, não um defeito. Quando outros congelam porque o plano mudou, tu recalibras e avanças. Papéis que recompensam flexibilidade sobre procedimento são o teu habitat natural.",
      it: "In ambienti in rapida evoluzione, caos di startup o lavoro creativo con vincoli mutevoli, il tuo comfort con l'ambiguità è una caratteristica, non un difetto. Quando gli altri si bloccano perché il piano è cambiato, tu ricatibri e vai avanti. I ruoli che premiano la flessibilità sulla procedura sono il tuo habitat naturale.",
      ru: "В быстро меняющихся средах, стартап-хаосе или творческой работе с меняющимися ограничениями твой комфорт с неопределённостью — фича, не баг. Когда другие замирают из-за изменения плана, ты перекалибруешься и двигаешься дальше. Роли, вознаграждающие гибкость выше процедур — твоя естественная среда.",
      ja: "急速に変化する環境、スタートアップの混沌、または制約が変動するクリエイティブな仕事では、あなたの曖昧さへの適応力は欠陥ではなく特長だ。計画が変わって他の人がフリーズするとき、あなたは再調整して前に進む。手続きより柔軟性を報いる役割が、あなたの自然な生息地だ。",
      ko: "빠르게 변화하는 환경, 스타트업의 혼돈, 또는 제약이 변동하는 창작 작업에서, 모호함에 대한 당신의 편안함은 결함이 아니라 특성이다. 계획이 바뀌어 다른 사람이 얼어붙을 때, 당신은 재조정하고 전진한다. 절차보다 유연성을 보상하는 역할이 당신의 자연스러운 서식지다.",
    },
    integrationHint: {
      zh: '不是强迫自己进入僵化的常规。关键是建立能释放你能量而不是消耗它的最小结构——是脚手架，不是笼子。寻找有外部结构支撑的角色，让你专注于创造，而不是自我管理。',
      en: "Not about forcing yourself into rigid routines. The edge is building minimal structures that free your energy rather than drain it — scaffolding, not cages. Seek roles with external structure so you can focus on creating rather than self-managing the container.",
      nl: "Het gaat niet om jezelf in rigide routines te dwingen. De sleutel is minimale structuren bouwen die je energie vrijmaken in plaats van uitputten — steigers, geen kooien. Zoek rollen met externe structuur zodat je je kunt richten op creëren in plaats van zelfmanagement.",
      de: "Es geht nicht darum, dich in starre Routinen zu zwingen. Der Schlüssel ist, minimale Strukturen aufzubauen, die deine Energie freisetzen statt sie zu verbrauchen — Gerüst, nicht Käfig. Suche Rollen mit externer Struktur, damit du dich auf das Schaffen konzentrieren kannst statt auf Selbstmanagement.",
      fr: "Il ne s'agit pas de vous forcer dans des routines rigides. L'avantage est de construire des structures minimales qui libèrent votre énergie plutôt que de l'épuiser — un échafaudage, pas une cage. Cherchez des rôles avec une structure externe pour vous concentrer sur la création plutôt que l'autogestion.",
      es: "No se trata de forzarte en rutinas rígidas. La clave es construir estructuras mínimas que liberen tu energía en lugar de drenarla — andamios, no jaulas. Busca roles con estructura externa para concentrarte en crear en lugar de autogestionarte.",
      pt: "Não se trata de te forçar em rotinas rígidas. A vantagem é construir estruturas mínimas que libertem a tua energia em vez de a drenar — andaimes, não jaulas. Procura papéis com estrutura externa para te concentrares em criar em vez de autogerir.",
      it: "Non si tratta di forzarti in routine rigide. Il vantaggio è costruire strutture minime che liberino la tua energia piuttosto che drenarla — impalcature, non gabbie. Cerca ruoli con struttura esterna per concentrarti sulla creazione piuttosto che sull'autogestione.",
      ru: "Дело не в том, чтобы загонять себя в жёсткие рутины. Ключ — построить минимальные структуры, которые высвобождают твою энергию, а не истощают её: леса, а не клетки. Ищи роли с внешней структурой, чтобы сосредоточиться на создании, а не на самоуправлении.",
      ja: "硬直したルーティンに自分を押し込めることではない。エッジは、エネルギーを消耗させるのではなく解放する最小限の構造を構築すること——檻ではなく足場だ。自己管理ではなく創造に集中できるよう、外部構造のある役割を探そう。",
      ko: "경직된 루틴에 자신을 밀어넣는 것이 아니다. 핵심은 에너지를 소모하는 대신 해방하는 최소한의 구조를 만드는 것 — 우리가 아니라 비계다. 자기 관리가 아닌 창작에 집중할 수 있도록 외부 구조가 있는 역할을 찾아라.",
    },
    advantageousContexts: [
      'Entrepreneurship & startups',
      'Creative direction',
      'Crisis response & turnaround',
      'Rapid prototyping & iteration',
      'Freelance & portfolio work',
      'Innovation & R&D',
      'Growth & experimentation roles',
    ],
    spectrumLowLabel: { zh: '流动', en: 'Fluid', nl: 'Vloeiend', de: 'Fließend', fr: 'Fluide', es: 'Fluido', pt: 'Fluido', it: 'Fluido', ru: 'Подвижный', ja: '流動', ko: '유동' },
    spectrumHighLabel: { zh: '有序', en: 'Structured', nl: 'Gestructureerd', de: 'Strukturiert', fr: 'Structuré', es: 'Estructurado', pt: 'Estruturado', it: 'Strutturato', ru: 'Структурный', ja: '秩序', ko: '체계' },
  },

  openness: {
    shadowLabel: {
      zh: '扎根的现实主义',
      en: 'Grounded Realism',
      nl: 'Geworteld Realisme',
      de: 'Verwurzelter Realismus',
      fr: 'Réalisme Ancré',
      es: 'Realismo Arraigado',
      pt: 'Realismo Enraizado',
      it: 'Realismo Radicato',
      ru: 'Укоренённый Реализм',
      ja: '地に足のついたリアリズム',
      ko: '뿌리 내린 현실주의',
    },
    contextualStrength: {
      zh: '在执行、运营和以质量为导向的工作中，你对已验证方法的偏好胜过实验，是一种守护。不是每个团队都需要远见者——有时他们需要一个能在乱中保持方向、真正把事情做完的人。你的深度专注比表面的多样性创造更大的价值。',
      en: "In implementation, operations, and quality-driven work, your preference for the proven over the experimental is a form of stewardship. Not every team needs a visionary — sometimes they need someone who will maintain direction in the chaos and actually finish. Your depth of focus creates more value than surface-level variety.",
      nl: "In implementatie, operaties en kwaliteitsgedreven werk is jouw voorkeur voor het bewezene boven het experimentele een vorm van rentmeesterschap. Niet elk team heeft een visionair nodig — soms hebben ze iemand nodig die richting houdt in de chaos en daadwerkelijk afmaakt. Jouw diepte van focus creëert meer waarde dan oppervlakkige variatie.",
      de: "In der Umsetzung, im Betrieb und in qualitätsgetriebener Arbeit ist deine Vorliebe für Bewährtes gegenüber Experimentellem eine Form der Sorgfalt. Nicht jedes Team braucht einen Visionär — manchmal brauchen sie jemanden, der im Chaos die Richtung hält und tatsächlich zu Ende bringt. Deine Fokustiefe schafft mehr Wert als oberflächliche Vielfalt.",
      fr: "Dans l'exécution, les opérations et le travail axé sur la qualité, votre préférence pour l'éprouvé plutôt que l'expérimental est une forme de gardiennage. Toute équipe n'a pas besoin d'un visionnaire — parfois elle a besoin de quelqu'un qui maintient le cap dans le chaos et finit réellement. Votre profondeur de concentration crée plus de valeur que la variété superficielle.",
      es: "En la implementación, operaciones y trabajo orientado a la calidad, tu preferencia por lo probado sobre lo experimental es una forma de custodia. No todo equipo necesita un visionario — a veces necesitan alguien que mantenga la dirección en el caos y realmente termine. Tu profundidad de enfoque crea más valor que la variedad superficial.",
      pt: "Na implementação, operações e trabalho orientado à qualidade, a tua preferência pelo comprovado sobre o experimental é uma forma de custódia. Nem toda equipa precisa de um visionário — às vezes precisam de alguém que mantenha a direção no caos e realmente termine. A tua profundidade de foco cria mais valor do que variedade superficial.",
      it: "Nell'implementazione, nelle operazioni e nel lavoro guidato dalla qualità, la tua preferenza per il provato rispetto allo sperimentale è una forma di custodia. Non ogni team ha bisogno di un visionario — a volte hanno bisogno di qualcuno che mantenga la direzione nel caos e finisca davvero. La tua profondità di focus crea più valore della varietà superficiale.",
      ru: "В реализации, операциях и работе, ориентированной на качество, твоё предпочтение проверенного перед экспериментальным — форма бережливости. Не каждой команде нужен визионер — иногда им нужен тот, кто удержит направление в хаосе и действительно завершит работу. Твоя глубина фокуса создаёт больше ценности, чем поверхностное разнообразие.",
      ja: "実装、オペレーション、品質重視の仕事では、実証済みの方法を実験的なものより好むあなたの姿勢は守りの力だ。すべてのチームにビジョナリーが必要なわけではない。混沌の中で方向を保ち、実際にやり遂げる人が必要なときもある。あなたの深い集中は、表面的な多様性より大きな価値を生む。",
      ko: "실행, 운영, 품질 중심 업무에서, 실험적인 것보다 검증된 것을 선호하는 당신의 성향은 수호의 한 형태다. 모든 팀에 비전가가 필요한 것은 아니다 — 때로는 혼돈 속에서 방향을 유지하고 실제로 완료하는 사람이 필요하다. 당신의 깊은 집중은 표면적 다양성보다 더 큰 가치를 창출한다.",
    },
    integrationHint: {
      zh: '你不需要变得更有创造力。关键是找到一两个你愿意实验的领域——并保护你在其他领域优化的权利。你的深度专注比什么都更有价值，不必为此道歉。',
      en: "You don't need to become more creative. The edge is identifying one or two domains where you're willing to experiment — and protecting your right to optimize within established patterns elsewhere. Your depth of focus is a genuine asset; don't apologize for it.",
      nl: "Je hoeft niet creatiever te worden. De sleutel is één of twee domeinen identificeren waar je bereid bent te experimenteren — en je recht beschermen om elders binnen gevestigde patronen te optimaliseren. Jouw diepte van focus is een echt voordeel; excuseer je er niet voor.",
      de: "Du musst nicht kreativer werden. Der Schlüssel ist, ein oder zwei Bereiche zu identifizieren, in denen du bereit bist zu experimentieren — und dein Recht zu schützen, anderswo innerhalb etablierter Muster zu optimieren. Deine Fokustiefe ist ein echtes Gut; entschuldige dich nicht dafür.",
      fr: "Vous n'avez pas besoin de devenir plus créatif. L'avantage est d'identifier un ou deux domaines où vous êtes prêt à expérimenter — et de protéger votre droit d'optimiser selon les schémas établis ailleurs. Votre profondeur de concentration est un véritable atout ; ne vous en excusez pas.",
      es: "No necesitas volverte más creativo. La clave es identificar uno o dos dominios donde estés dispuesto a experimentar — y proteger tu derecho a optimizar dentro de patrones establecidos en otros lugares. Tu profundidad de enfoque es un activo genuino; no te disculpes por ello.",
      pt: "Não precisas de te tornar mais criativo. A vantagem é identificar um ou dois domínios onde estejas disposto a experimentar — e proteger o teu direito de otimizar dentro de padrões estabelecidos noutros lugares. A tua profundidade de foco é um ativo genuíno; não te desculpes por isso.",
      it: "Non hai bisogno di diventare più creativo. Il vantaggio è identificare uno o due domini dove sei disposto a sperimentare — e proteggere il tuo diritto di ottimizzare all'interno di schemi consolidati altrove. La tua profondità di focus è un asset genuino; non scusarti per questo.",
      ru: "Тебе не нужно становиться более творческим. Ключ — определить одну-две области, где ты готов экспериментировать, и защитить своё право оптимизировать в рамках устоявшихся паттернов в остальном. Твоя глубина фокуса — настоящий актив; не извиняйся за неё.",
      ja: "より創造的になる必要はない。エッジは、実験に前向きな1つか2つの領域を特定し、他の領域では確立されたパターン内で最適化する権利を守ることだ。あなたの深い集中は本物の資産だ。それを謝る必要はない。",
      ko: "더 창의적이 될 필요는 없다. 핵심은 실험에 기꺼이 나설 한두 가지 영역을 식별하고, 다른 곳에서는 확립된 패턴 내에서 최적화할 권리를 보호하는 것이다. 당신의 깊은 집중은 진정한 자산이다. 그것에 대해 사과하지 마라.",
    },
    advantageousContexts: [
      'Operations & process design',
      'Quality assurance & testing',
      'Implementation & delivery',
      'Standards & compliance',
      'Audit & internal control',
      'Technical execution',
      'Domain expertise & deep specialization',
    ],
    spectrumLowLabel: { zh: '务实', en: 'Pragmatic', nl: 'Pragmatisch', de: 'Pragmatisch', fr: 'Pragmatique', es: 'Pragmático', pt: 'Pragmático', it: 'Pragmatico', ru: 'Прагматичный', ja: '実務的', ko: '실용적' },
    spectrumHighLabel: { zh: '创新', en: 'Exploratory', nl: 'Verkennend', de: 'Erkundend', fr: 'Exploratoire', es: 'Exploratorio', pt: 'Exploratório', it: 'Esplorativo', ru: 'Исследовательский', ja: '探索的', ko: '탐구적' },
  },

  neuroticism: {
    shadowLabel: {
      zh: '感知的深度',
      en: 'Depth of Perception',
      nl: 'Diepte van Waarneming',
      de: 'Tiefe der Wahrnehmung',
      fr: 'Profondeur de Perception',
      es: 'Profundidad de Percepción',
      pt: 'Profundidade de Perceção',
      it: 'Profondità di Percezione',
      ru: 'Глубина Восприятия',
      ja: '知覚の深度',
      ko: '지각의 깊이',
    },
    contextualStrength: {
      zh: '你敏锐的情感感知能察觉他人忽略的信号——人际摩擦升级之前的细微变化、客户动态中的隐藏不满、团队会议中的情绪暗流。在需要情感共鸣、信任建立或冲突调解的角色中，这种感知是不可替代的资产。',
      en: "Your heightened sensitivity registers what others miss — interpersonal friction before it escalates, hidden dissatisfaction in client dynamics, the emotional undercurrent in team meetings. In roles requiring emotional attunement, trust-building, or conflict resolution, this perception is an irreplaceable asset.",
      nl: "Jouw verhoogde gevoeligheid registreert wat anderen missen — interpersoonlijke wrijving voordat het escaleert, verborgen ontevredenheid in klantdynamiek, de emotionele onderstroom in teamvergaderingen. In rollen die emotionele afstemming, vertrouwensopbouw of conflictoplossing vereisen, is deze waarneming een onvervangbaar voordeel.",
      de: "Deine erhöhte Sensibilität registriert, was andere übersehen — zwischenmenschliche Reibung, bevor sie eskaliert, versteckte Unzufriedenheit in Kundendynamiken, die emotionale Unterströmung in Teammeetings. In Rollen, die emotionale Abstimmung, Vertrauensaufbau oder Konfliktlösung erfordern, ist diese Wahrnehmung ein unersetzliches Gut.",
      fr: "Votre sensibilité accrue capte ce que d'autres ratent — les frictions interpersonnelles avant qu'elles n'escaladent, l'insatisfaction cachée dans les dynamiques client, le courant émotionnel sous-jacent dans les réunions d'équipe. Dans les rôles exigeant une syntonie émotionnelle, la construction de confiance ou la résolution de conflits, cette perception est un atout irremplaçable.",
      es: "Tu sensibilidad elevada registra lo que otros pierden — fricción interpersonal antes de que escale, insatisfacción oculta en dinámicas de clientes, la corriente emocional subyacente en reuniones de equipo. En roles que requieren sintonía emocional, construcción de confianza o resolución de conflictos, esta percepción es un activo irremplazable.",
      pt: "A tua sensibilidade elevada regista o que outros perdem — fricção interpessoal antes de escalar, insatisfação oculta nas dinâmicas de clientes, a corrente emocional subjacente nas reuniões de equipa. Em papéis que requerem sintonia emocional, construção de confiança ou resolução de conflitos, esta perceção é um ativo insubstituível.",
      it: "La tua sensibilità elevata registra ciò che gli altri perdono — attrito interpersonale prima che si intensifichi, insoddisfazione nascosta nelle dinamiche dei clienti, la corrente emotiva sottostante nelle riunioni di team. Nei ruoli che richiedono sintonia emotiva, costruzione di fiducia o risoluzione dei conflitti, questa percezione è un asset insostituibile.",
      ru: "Твоя повышенная чувствительность улавливает то, что упускают другие — межличностное трение до его обострения, скрытое недовольство в клиентской динамике, эмоциональное подводное течение на командных встречах. В ролях, требующих эмоциональной настройки, построения доверия или разрешения конфликтов, это восприятие — незаменимый актив.",
      ja: "あなたの高い感受性は、他者が見逃すものを捉える——エスカレートする前の対人摩擦、クライアントダイナミクスに潜む不満、チーム会議の感情的な底流。感情的な同調、信頼構築、または紛争解決を必要とする役割では、この知覚は替えの効かない資産だ。",
      ko: "당신의 높은 감수성은 다른 사람이 놓치는 것을 감지한다 — 격화되기 전의 대인 마찰, 클라이언트 역학에 숨겨진 불만, 팀 회의의 감정적 저류. 감정적 동조, 신뢰 구축, 또는 갈등 해결을 요구하는 역할에서, 이 지각은 대체 불가한 자산이다.",
    },
    integrationHint: {
      zh: '关键不是变得更冷静——而是建立能让你的敏感性发挥作用而不是消耗你的外部结构：清晰的界限、恢复性仪式、与你的内在强度相匹配的角色。你的感知是天赋；容器决定它是资产还是负担。',
      en: "The edge isn't becoming less sensitive — it's building the external structure that lets your sensitivity work for you rather than consume you: clear boundaries, recovery practices, and roles matched to your inner intensity. Your perception is a gift; the container determines whether it's an asset or a drain.",
      nl: "De sleutel is niet minder gevoelig worden — het is de externe structuur bouwen die je gevoeligheid voor je laat werken in plaats van je op te eten: duidelijke grenzen, herstelpraktijken en rollen die passen bij je innerlijke intensiteit. Je waarneming is een gave; de container bepaalt of het een voordeel of een last is.",
      de: "Der Schlüssel ist nicht, weniger sensibel zu werden — sondern die externe Struktur aufzubauen, die deine Sensibilität für dich arbeiten lässt statt dich aufzufressen: klare Grenzen, Erholungspraktiken und Rollen, die zu deiner inneren Intensität passen. Deine Wahrnehmung ist ein Geschenk; der Rahmen bestimmt, ob sie ein Vorteil oder eine Last ist.",
      fr: "L'avantage n'est pas de devenir moins sensible — c'est de construire la structure externe qui permet à votre sensibilité de travailler pour vous plutôt que de vous consumer : des limites claires, des pratiques de récupération et des rôles adaptés à votre intensité intérieure. Votre perception est un don ; le contenant détermine si c'est un atout ou un fardeau.",
      es: "La ventaja no es volverse menos sensible — es construir la estructura externa que permita a tu sensibilidad trabajar a tu favor en lugar de consumirte: límites claros, prácticas de recuperación y roles que coincidan con tu intensidad interior. Tu percepción es un don; el contenedor determina si es un activo o una carga.",
      pt: "A vantagem não é tornar-se menos sensível — é construir a estrutura externa que permita à tua sensibilidade trabalhar a teu favor em vez de te consumir: limites claros, práticas de recuperação e papéis adequados à tua intensidade interior. A tua perceção é um dom; o contentor determina se é um ativo ou um fardo.",
      it: "Il vantaggio non è diventare meno sensibile — è costruire la struttura esterna che permetta alla tua sensibilità di lavorare per te piuttosto che consumarti: confini chiari, pratiche di recupero e ruoli adatti alla tua intensità interiore. La tua percezione è un dono; il contenitore determina se è un asset o un peso.",
      ru: "Преимущество не в том, чтобы стать менее чувствительным — а в том, чтобы построить внешнюю структуру, позволяющую твоей чувствительности работать на тебя, а не пожирать: чёткие границы, практики восстановления и роли, соответствующие твоей внутренней интенсивности. Твоё восприятие — дар; контейнер определяет, станет ли оно активом или обузой.",
      ja: "エッジは感度を下げることではなく、感受性があなたを消耗するのではなく味方にする外部構造を構築することだ。明確な境界、回復の儀式、あなたの内なる強度に合った役割。あなたの知覚は才能だ。器がそれを資産にするか負担にするかを決める。",
      ko: "핵심은 덜 민감해지는 것이 아니라, 당신의 민감성이 당신을 소진시키는 대신 당신을 위해 작동하게 하는 외부 구조를 구축하는 것이다. 명확한 경계, 회복 관행, 그리고 당신의 내적 강도에 맞는 역할. 당신의 지각은 재능이다. 그릇이 그것이 자산인지 부담인지를 결정한다.",
    },
    advantageousContexts: [
      'Counseling & psychotherapy',
      'Conflict mediation',
      'UX research & usability testing',
      'Social work & advocacy',
      'Qualitative research',
      'Customer experience design',
      'Team culture & organizational development',
    ],
    spectrumLowLabel: { zh: '稳定', en: 'Stable', nl: 'Stabiel', de: 'Stabil', fr: 'Stable', es: 'Estable', pt: 'Estável', it: 'Stabile', ru: 'Стабильный', ja: '安定', ko: '안정' },
    spectrumHighLabel: { zh: '敏锐', en: 'Attuned', nl: 'Afgestemd', de: 'Feinfühlig', fr: 'Sensible', es: 'Sintonizado', pt: 'Sintonizado', it: 'Sintonizzato', ru: 'Чуткий', ja: '鋭敏', ko: '민감' },
  },
};

/** Display names for each Big Five domain (multilingual) */
export const DOMAIN_LABELS: Record<BigFiveDimension, ShadowLocaleText> = {
  openness: { zh: '开放性', en: 'Openness', nl: 'Openheid', de: 'Offenheit', fr: 'Ouverture', es: 'Apertura', pt: 'Abertura', it: 'Apertura', ru: 'Открытость', ja: '開放性', ko: '개방성' },
  conscientiousness: { zh: '尽责性', en: 'Conscientiousness', nl: 'Zorgvuldigheid', de: 'Gewissenhaftigkeit', fr: 'Conscienciosité', es: 'Responsabilidad', pt: 'Conscienciosidade', it: 'Coscienziosità', ru: 'Добросовестность', ja: '誠実性', ko: '성실성' },
  extraversion: { zh: '外倾性', en: 'Extraversion', nl: 'Extraversie', de: 'Extraversion', fr: 'Extraversion', es: 'Extraversión', pt: 'Extroversão', it: 'Estroversione', ru: 'Экстраверсия', ja: '外向性', ko: '외향성' },
  agreeableness: { zh: '宜人性', en: 'Agreeableness', nl: 'Vriendelijkheid', de: 'Verträglichkeit', fr: 'Agréabilité', es: 'Amabilidad', pt: 'Amabilidade', it: 'Amabilità', ru: 'Доброжелательность', ja: '協調性', ko: '친화성' },
  neuroticism: { zh: '情绪感知', en: 'Emotional Sensitivity', nl: 'Emotionele Gevoeligheid', de: 'Emotionale Sensibilität', fr: 'Sensibilité Émotionnelle', es: 'Sensibilidad Emocional', pt: 'Sensibilidade Emocional', it: 'Sensibilità Emotiva', ru: 'Эмоциональная Чувствительность', ja: '感情感受性', ko: '감정 민감성' },
};
