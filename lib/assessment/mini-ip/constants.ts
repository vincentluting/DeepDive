// ============================================================
// Mini-IP — Constants
//
// Legal attribution, Likert scale labels, and RIASEC dimension
// descriptions required by the O*NET Tools Developer License.
// ============================================================

// O*NET attribution text (legally required)
export const ONET_ATTRIBUTION = {
  en: "This product includes information from the O*NET® Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the O*NET Tools Developer License. O*NET® is a trademark of USDOL/ETA. Deep Dive has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.",
  zh: "本产品包含来自美国劳工部就业和培训管理局 (USDOL/ETA) O*NET® 职业探索工具的信息。根据 O*NET 工具开发者许可使用。O*NET® 是 USDOL/ETA 的商标。Deep Dive 已对该信息进行了部分或全部修改。USDOL/ETA 未批准、认可或测试这些修改。",
  nl: "Dit product bevat informatie uit de O*NET® Career Exploration Tools van het U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Gebruikt onder de O*NET Tools Developer License. O*NET® is een handelsmerk van USDOL/ETA. Deep Dive heeft deze informatie geheel of gedeeltelijk aangepast. USDOL/ETA heeft deze aanpassingen niet goedgekeurd, onderschreven of getest.",
  de: "Dieses Produkt enthält Informationen aus den O*NET® Career Exploration Tools des U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Verwendet unter der O*NET Tools Developer License. O*NET® ist eine Marke von USDOL/ETA. Deep Dive hat diese Informationen ganz oder teilweise angepasst. USDOL/ETA hat diese Änderungen nicht genehmigt, befürwortet oder getestet.",
  es: "Este producto incluye información de las herramientas O*NET® Career Exploration Tools del Departamento de Trabajo de EE.UU. (USDOL/ETA). Usado bajo la O*NET Tools Developer License. O*NET® es una marca registrada de USDOL/ETA. Deep Dive ha modificado total o parcialmente esta información. USDOL/ETA no ha aprobado, respaldado ni probado estas modificaciones.",
  fr: "Ce produit contient des informations issues des O*NET® Career Exploration Tools du U.S. Department of Labor (USDOL/ETA). Utilisé sous la O*NET Tools Developer License. O*NET® est une marque de USDOL/ETA. Deep Dive a modifié tout ou partie de ces informations. USDOL/ETA n'a pas approuvé, cautionné ni testé ces modifications.",
  it: "Questo prodotto include informazioni dagli strumenti O*NET® Career Exploration Tools del U.S. Department of Labor (USDOL/ETA). Utilizzato sotto la O*NET Tools Developer License. O*NET® è un marchio di USDOL/ETA. Deep Dive ha modificato in tutto o in parte queste informazioni. USDOL/ETA non ha approvato, avallato o testato queste modifiche.",
  ja: "本製品には、米国労働省雇用訓練局（USDOL/ETA）のO*NET®キャリア探索ツールの情報が含まれています。O*NETツール開発者ライセンスに基づき使用。O*NET®はUSDOL/ETAの商標です。Deep Diveはこの情報の全部または一部を変更しています。USDOL/ETAはこれらの変更を承認、支持、またはテストしていません。",
  ko: "이 제품은 미국 노동부 고용훈련청(USDOL/ETA)의 O*NET® Career Exploration Tools 정보를 포함합니다. O*NET Tools Developer License에 따라 사용됩니다. O*NET®는 USDOL/ETA의 상표입니다. Deep Dive는 이 정보의 전부 또는 일부를 수정했습니다. USDOL/ETA는 이러한 수정을 승인, 보증 또는 테스트하지 않았습니다.",
  pt: "Este produto inclui informações das ferramentas O*NET® Career Exploration Tools do U.S. Department of Labor (USDOL/ETA). Utilizado sob a O*NET Tools Developer License. O*NET® é uma marca registrada da USDOL/ETA. O Deep Dive modificou total ou parcialmente estas informações. A USDOL/ETA não aprovou, endossou ou testou estas modificações.",
  ru: "Данный продукт содержит информацию из инструментов O*NET® Career Exploration Tools Министерства труда США (USDOL/ETA). Используется по лицензии O*NET Tools Developer License. O*NET® — товарный знак USDOL/ETA. Deep Dive частично или полностью изменил эту информацию. USDOL/ETA не одобряла, не поддерживала и не тестировала эти изменения.",
};

// Modification notice (legally required)
export const ONET_MODIFICATION_NOTICE = {
  en: "Modifications: Items translated to Chinese. Results mapped to Deep Dive 12 career archetypes instead of O*NET occupations. UI adapted for the Deep Dive platform.",
  zh: "修改说明：题目已翻译为中文。结果映射至 Deep Dive 12 种职业原型，而非 O*NET 职业分类。界面已适配 Deep Dive 平台。",
  nl: "Aanpassingen: Items vertaald naar het Nederlands. Resultaten gekoppeld aan Deep Dive 12 loopbaanarchetypen in plaats van O*NET-beroepen. UI aangepast voor het Deep Dive-platform.",
  de: "Änderungen: Items ins Deutsche übersetzt. Ergebnisse auf Deep Dive 12 Karrierearchetypen statt O*NET-Berufe abgebildet. UI für die Deep Dive-Plattform angepasst.",
  es: "Modificaciones: Items traducidos al español. Resultados mapeados a los 12 arquetipos profesionales de Deep Dive en lugar de ocupaciones O*NET. UI adaptada para la plataforma Deep Dive.",
  fr: "Modifications : Items traduits en français. Résultats mappés sur les 12 archétypes de carrière Deep Dive au lieu des professions O*NET. Interface adaptée pour la plateforme Deep Dive.",
  it: "Modifiche: Items tradotti in italiano. Risultati mappati sui 12 archetipi di carriera Deep Dive invece delle professioni O*NET. UI adattata per la piattaforma Deep Dive.",
  ja: "変更点：項目を日本語に翻訳。結果をO*NET職業ではなくDeep Dive 12キャリアアーキタイプにマッピング。UIをDeep Diveプラットフォーム向けに調整。",
  ko: "수정 사항: 항목을 한국어로 번역. 결과를 O*NET 직업 대신 Deep Dive 12 커리어 아키타입에 매핑. Deep Dive 플랫폼에 맞게 UI 조정.",
  pt: "Modificações: Items traduzidos para português. Resultados mapeados para os 12 arquétipos de carreira do Deep Dive em vez de ocupações O*NET. UI adaptada para a plataforma Deep Dive.",
  ru: "Изменения: Вопросы переведены на русский язык. Результаты привязаны к 12 карьерным архетипам Deep Dive вместо профессий O*NET. Интерфейс адаптирован для платформы Deep Dive.",
};

// 5-point Likert scale options (O*NET Mini-IP official: 0-4)
export const MINI_IP_LIKERT_OPTIONS = {
  en: [
    { value: 0, label: "Strongly Dislike" },
    { value: 1, label: "Dislike" },
    { value: 2, label: "Unsure" },
    { value: 3, label: "Like" },
    { value: 4, label: "Strongly Like" },
  ],
  zh: [
    { value: 0, label: "非常不喜欢" },
    { value: 1, label: "不喜欢" },
    { value: 2, label: "不确定" },
    { value: 3, label: "喜欢" },
    { value: 4, label: "非常喜欢" },
  ],
  nl: [
    { value: 0, label: "Helemaal niet leuk" },
    { value: 1, label: "Niet leuk" },
    { value: 2, label: "Niet zeker" },
    { value: 3, label: "Leuk" },
    { value: 4, label: "Heel erg leuk" },
  ],
  de: [
    { value: 0, label: "Sehr ungern" },
    { value: 1, label: "Ungern" },
    { value: 2, label: "Unsicher" },
    { value: 3, label: "Gern" },
    { value: 4, label: "Sehr gern" },
  ],
  es: [
    { value: 0, label: "Me desagrada mucho" },
    { value: 1, label: "Me desagrada" },
    { value: 2, label: "No estoy seguro/a" },
    { value: 3, label: "Me agrada" },
    { value: 4, label: "Me agrada mucho" },
  ],
  fr: [
    { value: 0, label: "Fortement déplaisant" },
    { value: 1, label: "Déplaisant" },
    { value: 2, label: "Incertain" },
    { value: 3, label: "Plaisant" },
    { value: 4, label: "Très plaisant" },
  ],
  it: [
    { value: 0, label: "Non mi piace affatto" },
    { value: 1, label: "Non mi piace" },
    { value: 2, label: "Incerto" },
    { value: 3, label: "Mi piace" },
    { value: 4, label: "Mi piace molto" },
  ],
  ja: [
    { value: 0, label: "とても嫌い" },
    { value: 1, label: "嫌い" },
    { value: 2, label: "わからない" },
    { value: 3, label: "好き" },
    { value: 4, label: "とても好き" },
  ],
  ko: [
    { value: 0, label: "매우 싫음" },
    { value: 1, label: "싫음" },
    { value: 2, label: "잘 모르겠음" },
    { value: 3, label: "좋음" },
    { value: 4, label: "매우 좋음" },
  ],
  pt: [
    { value: 0, label: "Não gosto nada" },
    { value: 1, label: "Não gosto" },
    { value: 2, label: "Não tenho certeza" },
    { value: 3, label: "Gosto" },
    { value: 4, label: "Gosto muito" },
  ],
  ru: [
    { value: 0, label: "Совсем не нравится" },
    { value: 1, label: "Не нравится" },
    { value: 2, label: "Не уверен(а)" },
    { value: 3, label: "Нравится" },
    { value: 4, label: "Очень нравится" },
  ],
} as const;

// RIASEC dimension descriptions (for result pages)
export const RIASEC_DESCRIPTIONS = {
  R: {
    en: "People with Realistic interests like work that includes practical, hands-on problems and answers. They enjoy dealing with plants, animals, and real-world materials like wood, tools, and machinery.",
    zh: "具有现实型兴趣的人喜欢涉及实际动手解决问题的工作。他们喜欢与植物、动物以及木材、工具和机械等实物打交道。",
    nl: "Mensen met Realistische interesses houden van werk met praktische, hands-on problemen en oplossingen. Ze werken graag met planten, dieren en tastbare materialen zoals hout, gereedschap en machines.",
    de: "Menschen mit realistischen Interessen mögen Arbeit mit praktischen, hands-on Problemen und Lösungen. Sie arbeiten gern mit Pflanzen, Tieren und realen Materialien wie Holz, Werkzeugen und Maschinen.",
    es: "Las personas con intereses Realistas disfrutan del trabajo que incluye problemas prácticos y soluciones concretas. Les gusta trabajar con plantas, animales y materiales reales como madera, herramientas y maquinaria.",
    fr: "Les personnes à intérêts Réalistes aiment le travail pratique et concret. Elles apprécient de travailler avec des plantes, des animaux et des matériaux comme le bois, les outils et les machines.",
    it: "Le persone con interessi Realistici amano il lavoro pratico e concreto. Apprezzano lavorare con piante, animali e materiali come legno, strumenti e macchinari.",
    ja: "現実型の興味を持つ人は、実践的で手を動かす仕事を好みます。植物、動物、木材、工具、機械などの実物を扱うことを楽しみます。",
    ko: "현실형 흥미를 가진 사람은 실용적이고 직접 손으로 하는 문제 해결을 좋아합니다. 식물, 동물, 목재, 도구, 기계 등 실제 재료를 다루는 것을 즐깁니다.",
    pt: "Pessoas com interesses Realistas gostam de trabalho prático e hands-on. Apreciam lidar com plantas, animais e materiais reais como madeira, ferramentas e máquinas.",
    ru: "Люди с реалистическими интересами любят работу с практическими задачами и конкретными решениями. Им нравится работать с растениями, животными и реальными материалами — деревом, инструментами и механизмами.",
  },
  I: {
    en: "People with Investigative interests like work that has to do with ideas and thinking rather than physical activity or leading people.",
    zh: "具有研究型兴趣的人喜欢与理念和思考相关的工作，而非体力活动或领导他人。",
    nl: "Mensen met Onderzoekende interesses houden van werk dat te maken heeft met ideeën en nadenken, in plaats van fysieke activiteit of het leiden van mensen.",
    de: "Menschen mit forschenden Interessen mögen Arbeit, die mit Ideen und Nachdenken zu tun hat, statt mit körperlicher Aktivität oder dem Führen von Menschen.",
    es: "Las personas con intereses Investigadores disfrutan del trabajo relacionado con ideas y pensamiento, más que con actividad física o liderazgo.",
    fr: "Les personnes à intérêts Investigateurs aiment le travail intellectuel et la réflexion, plutôt que l'activité physique ou la direction de personnes.",
    it: "Le persone con interessi Investigativi amano il lavoro legato alle idee e al pensiero, piuttosto che all'attività fisica o alla guida di persone.",
    ja: "探究型の興味を持つ人は、身体活動や人の指導よりも、アイデアや思考に関わる仕事を好みます。",
    ko: "탐구형 흥미를 가진 사람은 신체 활동이나 사람을 이끄는 것보다 아이디어와 사고에 관련된 일을 좋아합니다.",
    pt: "Pessoas com interesses Investigativos gostam de trabalho relacionado a ideias e reflexão, em vez de atividade física ou liderança.",
    ru: "Люди с исследовательскими интересами любят работу, связанную с идеями и размышлениями, а не с физической активностью или руководством людьми.",
  },
  A: {
    en: "People with Artistic interests like work that deals with the artistic side of things, such as acting, music, art, and design.",
    zh: "具有艺术型兴趣的人喜欢涉及艺术方面的工作，如表演、音乐、美术和设计。",
    nl: "Mensen met Artistieke interesses houden van werk dat te maken heeft met de creatieve kant, zoals acteren, muziek, kunst en design.",
    de: "Menschen mit künstlerischen Interessen mögen Arbeit, die sich mit der kreativen Seite befasst, wie Schauspiel, Musik, Kunst und Design.",
    es: "Las personas con intereses Artísticos disfrutan del trabajo creativo, como actuación, música, arte y diseño.",
    fr: "Les personnes à intérêts Artistiques aiment le travail créatif : théâtre, musique, art et design.",
    it: "Le persone con interessi Artistici amano il lavoro creativo, come recitazione, musica, arte e design.",
    ja: "芸術型の興味を持つ人は、演技、音楽、美術、デザインなどの創造的な仕事を好みます。",
    ko: "예술형 흥미를 가진 사람은 연기, 음악, 미술, 디자인 등 창작 관련 일을 좋아합니다.",
    pt: "Pessoas com interesses Artísticos gostam de trabalho criativo, como atuação, música, arte e design.",
    ru: "Люди с артистическими интересами любят творческую работу — актёрское мастерство, музыку, искусство и дизайн.",
  },
  S: {
    en: "People with Social interests like work that assists others and promotes learning and personal development.",
    zh: "具有社会型兴趣的人喜欢帮助他人、促进学习和个人成长的工作。",
    nl: "Mensen met Sociale interesses houden van werk waarbij ze anderen helpen en leren en persoonlijke ontwikkeling bevorderen.",
    de: "Menschen mit sozialen Interessen mögen Arbeit, bei der sie anderen helfen und Lernen und persönliche Entwicklung fördern.",
    es: "Las personas con intereses Sociales disfrutan del trabajo que ayuda a otros y promueve el aprendizaje y el desarrollo personal.",
    fr: "Les personnes à intérêts Sociaux aiment le travail qui aide les autres et favorise l'apprentissage et le développement personnel.",
    it: "Le persone con interessi Sociali amano il lavoro che aiuta gli altri e promuove l'apprendimento e lo sviluppo personale.",
    ja: "社会型の興味を持つ人は、他者を助け、学習と個人の成長を促進する仕事を好みます。",
    ko: "사회형 흥미를 가진 사람은 다른 사람을 돕고 학습과 개인 발전을 촉진하는 일을 좋아합니다.",
    pt: "Pessoas com interesses Sociais gostam de trabalho que ajuda os outros e promove aprendizagem e desenvolvimento pessoal.",
    ru: "Люди с социальными интересами любят работу, помогающую другим и способствующую обучению и личностному развитию.",
  },
  E: {
    en: "People with Enterprising interests like work that has to do with starting up and carrying out business projects, leading people, and making decisions.",
    zh: "具有企业型兴趣的人喜欢与发起和推进商业项目、领导他人及做出决策相关的工作。",
    nl: "Mensen met Ondernemende interesses houden van werk dat te maken heeft met het opzetten en uitvoeren van zakelijke projecten, het leiden van mensen en het nemen van beslissingen.",
    de: "Menschen mit unternehmerischen Interessen mögen Arbeit, die mit dem Aufbau und der Durchführung von Geschäftsprojekten, der Führung von Menschen und dem Treffen von Entscheidungen zu tun hat.",
    es: "Las personas con intereses Emprendedores disfrutan del trabajo relacionado con iniciar y desarrollar proyectos empresariales, liderar personas y tomar decisiones.",
    fr: "Les personnes à intérêts Entreprenants aiment le travail lié au lancement et à la conduite de projets, à la direction de personnes et à la prise de décisions.",
    it: "Le persone con interessi Intraprendenti amano il lavoro legato all'avvio e alla gestione di progetti, alla guida di persone e alle decisioni.",
    ja: "企業型の興味を持つ人は、ビジネスプロジェクトの立ち上げ・推進、リーダーシップ、意思決定に関わる仕事を好みます。",
    ko: "기업형 흥미를 가진 사람은 비즈니스 프로젝트 시작과 수행, 사람 이끌기, 의사결정에 관련된 일을 좋아합니다.",
    pt: "Pessoas com interesses Empreendedores gostam de trabalho relacionado a iniciar e executar projetos de negócios, liderar pessoas e tomar decisões.",
    ru: "Люди с предприимчивыми интересами любят работу, связанную с запуском бизнес-проектов, руководством людьми и принятием решений.",
  },
  C: {
    en: "People with Conventional interests like work that follows set procedures and routines. They prefer working with data and detail rather than ideas.",
    zh: "具有常规型兴趣的人喜欢遵循既定程序和例行工作。他们更偏好处理数据和细节而非创意。",
    nl: "Mensen met Conventionele interesses houden van werk dat vaste procedures en routines volgt. Ze werken liever met gegevens en details dan met ideeën.",
    de: "Menschen mit konventionellen Interessen mögen Arbeit, die festen Abläufen und Routinen folgt. Sie arbeiten lieber mit Daten und Details als mit Ideen.",
    es: "Las personas con intereses Convencionales disfrutan del trabajo con procedimientos establecidos y rutinas. Prefieren trabajar con datos y detalles en lugar de ideas.",
    fr: "Les personnes à intérêts Conventionnels aiment le travail qui suit des procédures établies et des routines. Elles préfèrent travailler avec des données et des détails plutôt qu'avec des idées.",
    it: "Le persone con interessi Convenzionali amano il lavoro che segue procedure stabilite e routine. Preferiscono lavorare con dati e dettagli piuttosto che con idee.",
    ja: "慣習型の興味を持つ人は、決められた手順やルーティンに従う仕事を好みます。アイデアよりもデータや細部を扱うことを好みます。",
    ko: "관습형 흥미를 가진 사람은 정해진 절차와 루틴을 따르는 일을 좋아합니다. 아이디어보다 데이터와 세부사항을 다루는 것을 선호합니다.",
    pt: "Pessoas com interesses Convencionais gostam de trabalho com procedimentos estabelecidos e rotinas. Preferem trabalhar com dados e detalhes em vez de ideias.",
    ru: "Люди с конвенциональными интересами любят работу с установленными процедурами и рутиной. Они предпочитают работать с данными и деталями, а не с идеями.",
  },
} as const;
