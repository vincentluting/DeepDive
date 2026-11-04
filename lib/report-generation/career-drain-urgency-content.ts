// ============================================================
// Career Drain — Urgency-aware Framing Variants
//
// Companion to career-drain-content.ts FRAMING_SUMMARIES. The
// existing pool reads "default" — useful for users we have no
// clear urgency signal on.
//
// Urgency thresholds (tightened 2026-05-23 after codex P1 — the
// earlier draft treated willingToRetrain=true alone as a high
// signal, but api-schemas defaults that field to true, so the
// silent default would have mis-classified most users):
//
//   high    = careerChangeUrgency="urgent",
//             OR willingToRetrain=true AND careerChangeUrgency="considering"
//   low     = willingToRetrain=false AND careerChangeUrgency in {"exploring", undefined}
//   default = everything else (includes the schema-default state
//             of willingToRetrain=true with no urgency signal)
//
// High → frame warnings as filters ("treat them as screening
// criteria, not background reading"). Low → frame as long-term
// self-knowledge ("no nudge to change anything"). Default → use
// the pre-existing neutral FRAMING_SUMMARIES pool.
//
// Frozen-area note: career-drain-content.ts is in the project
// freeze list (.claude/hooks/guard-frozen.sh). This file
// deliberately lives outside that file so we can add new
// urgency-aware variants without touching the original pool.
// ============================================================

interface UrgencyFraming {
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

// ── High urgency: user wants to move and is willing to retrain ──
// Tone: directive, present-tense, encourages preemptive avoidance.

export const URGENCY_HIGH_FRAMING: UrgencyFraming[] = [
  {
    zh: `你已经准备好转向新方向——下面的能量预警就更重要了。这些不是"参考信息"，而是你在筛选目标岗位时必须主动避开或制定明确应对策略的方向。带着这份清单去看招聘 JD，能帮你避免把热情错配到长期会消耗你的环境里。`,
    en: `Since you're actively moving toward a new direction, these drain warnings carry extra weight — treat them as filters, not background reading. Bring this list when scanning job descriptions so you can pre-screen out environments that will quietly cost you energy, before commitment forecloses your options.`,
    nl: `Omdat je actief op zoek bent naar een nieuwe richting, wegen deze waarschuwingen extra zwaar — behandel ze als filters, niet als achtergrondinformatie. Neem deze lijst mee bij het scannen van vacatures, zodat je vooraf omgevingen kunt uitsluiten die je stilletjes energie zullen kosten.`,
    de: `Da du aktiv eine neue Richtung anstrebst, wiegen diese Warnungen besonders schwer — behandle sie als Filter, nicht als Hintergrundlektüre. Nimm diese Liste mit, wenn du Stellenanzeigen prüfst, damit du Umgebungen vorab ausschließen kannst, die dich leise Energie kosten.`,
    fr: `Puisque vous évoluez activement vers une nouvelle direction, ces avertissements pèsent davantage — traitez-les comme des filtres, pas comme une lecture de fond. Apportez cette liste lorsque vous examinez les offres d'emploi pour pré-écarter les environnements qui vous coûteraient discrètement de l'énergie.`,
    es: `Como estás avanzando activamente hacia una nueva dirección, estas advertencias pesan más — trátalas como filtros, no como información de fondo. Lleva esta lista cuando revises descripciones de puestos para descartar de antemano entornos que silenciosamente te costarán energía.`,
    pt: `Como estás a avançar ativamente para uma nova direção, estes avisos pesam mais — trata-os como filtros, não como leitura de fundo. Leva esta lista quando analisares descrições de cargos para excluir antecipadamente ambientes que te custarão energia silenciosamente.`,
    it: `Poiché ti stai muovendo attivamente verso una nuova direzione, questi avvisi pesano di più — trattali come filtri, non come lettura di sfondo. Porta questa lista quando esamini le descrizioni di lavoro per escludere in anticipo ambienti che ti costeranno energia silenziosamente.`,
    ru: `Поскольку вы активно движетесь к новому направлению, эти предупреждения имеют дополнительный вес — относитесь к ним как к фильтрам, а не фоновому чтению. Берите этот список при просмотре вакансий, чтобы заранее исключить среды, которые будут тихо забирать вашу энергию.`,
    ja: `あなたは積極的に新しい方向に動いているため、これらの警告はより重みを持ちます——背景情報ではなく、フィルターとして扱ってください。求人票を見るときにこのリストを持参すれば、あなたのエネルギーを静かに奪う環境を事前に除外できます。`,
    ko: `당신은 적극적으로 새로운 방향으로 움직이고 있기 때문에 이 경고는 더 큰 무게를 가집니다 — 배경 정보가 아닌 필터로 다루세요. 채용 공고를 검토할 때 이 목록을 가져가면 당신의 에너지를 조용히 소모시킬 환경을 미리 걸러낼 수 있습니다.`,
  },
  {
    zh: `你正处于职业转折点，下面这些能量黑洞值得你比平时更认真对待。在与潜在雇主谈话时，主动验证这些消耗点是否存在——一次面试问得清楚，胜过入职后再后悔。把"避开消耗"当成"找到契合"的同等重要的筛选条件。`,
    en: `You're at a career inflection point, so treat these energy black holes as more urgent than usual. When talking with prospective employers, actively verify whether these drain points exist — one clear interview question saves you months of post-hire regret. Make "avoiding drain" as much a screening criterion as "finding fit."`,
    nl: `Je staat op een carrièrekantelpunt, dus behandel deze energetische zwarte gaten urgenter dan normaal. Verifieer actief in gesprekken met potentiële werkgevers of deze uitputtingspunten aanwezig zijn — één heldere interviewvraag bespaart je maanden van spijt na indiensttreding.`,
    de: `Du befindest dich an einem Karrierewendepunkt — behandle diese Energie-Schwarzen-Löcher dringender als sonst. Verifiziere aktiv in Gesprächen mit potenziellen Arbeitgebern, ob diese Erschöpfungspunkte existieren — eine klare Interviewfrage erspart dir monatelange Reue nach der Einstellung.`,
    fr: `Vous êtes à un tournant de carrière, traitez donc ces trous noirs énergétiques avec plus d'urgence que d'habitude. Vérifiez activement dans les entretiens avec les employeurs potentiels si ces points d'épuisement existent — une question d'entretien claire vous évite des mois de regret après l'embauche.`,
    es: `Estás en un punto de inflexión profesional, así que trata estos agujeros negros de energía como más urgentes de lo habitual. Verifica activamente en conversaciones con posibles empleadores si existen estos puntos de desgaste — una pregunta clara en la entrevista te ahorra meses de arrepentimiento post-contratación.`,
    pt: `Estás num ponto de viragem da carreira, por isso trata estes buracos negros energéticos como mais urgentes do que o habitual. Verifica ativamente nas conversas com potenciais empregadores se estes pontos de desgaste existem — uma pergunta clara na entrevista poupa-te meses de arrependimento após a contratação.`,
    it: `Sei a un punto di svolta nella carriera, quindi tratta questi buchi neri energetici come più urgenti del solito. Verifica attivamente nei colloqui con potenziali datori di lavoro se questi punti di esaurimento esistono — una domanda chiara durante il colloquio ti risparmia mesi di rimpianto post-assunzione.`,
    ru: `Вы на переломном этапе карьеры — относитесь к этим энергетическим чёрным дырам с большей срочностью, чем обычно. Активно проверяйте на собеседованиях с потенциальными работодателями, существуют ли эти точки истощения — один чёткий вопрос на интервью избавит вас от месяцев сожалений после найма.`,
    ja: `あなたはキャリアの転換点にいるので、これらのエネルギーブラックホールを通常より緊急なものとして扱ってください。潜在的な雇用主との会話で、これらの消耗ポイントが存在するかを積極的に確認してください——明確な面接質問1つが、入社後の数ヶ月の後悔を救います。`,
    ko: `당신은 커리어 전환점에 있으므로 이 에너지 블랙홀을 평소보다 더 긴급하게 다루세요. 잠재적 고용주와의 대화에서 이러한 소진 포인트가 존재하는지 적극적으로 확인하세요 — 명확한 면접 질문 하나가 채용 후 몇 달간의 후회를 막아줍니다.`,
  },
  {
    zh: `既然你愿意接受新培训、积极探索新方向，下面这份预警就是你的"选择优先级"——而不是"参考列表"。如果某个看似有吸引力的方向同时踩中两条以上的消耗点，建议优先考虑其他选项；如果你已经在这类环境中，把这份清单作为下一步行动的依据。`,
    en: `Since you're willing to retrain and actively exploring new directions, treat this list as your "selection priority" — not "reference reading." If a seemingly attractive direction triggers two or more drain points, deprioritize it in favor of alternatives. If you're already in such an environment, use this list as the basis for your next move.`,
    nl: `Aangezien je bereid bent bij te scholen en actief nieuwe richtingen verkent, behandel deze lijst dan als je "selectieprioriteit" — niet als "referentielezing." Als een ogenschijnlijk aantrekkelijke richting twee of meer uitputtingspunten raakt, geef dan voorrang aan alternatieven. Bevind je je al in zo'n omgeving, gebruik deze lijst dan als basis voor je volgende stap.`,
    de: `Da du bereit bist umzulernen und aktiv neue Richtungen erkundest, behandle diese Liste als deine „Auswahlpriorität" — nicht als „Referenzlektüre." Wenn eine scheinbar attraktive Richtung zwei oder mehr Erschöpfungspunkte trifft, priorisiere Alternativen. Bist du bereits in einer solchen Umgebung, nutze diese Liste als Grundlage für deinen nächsten Schritt.`,
    fr: `Puisque vous êtes prêt à vous reconvertir et explorez activement de nouvelles directions, traitez cette liste comme votre « priorité de sélection » — pas comme une « lecture de référence ». Si une direction apparemment attrayante déclenche deux points d'épuisement ou plus, dépriorisez-la au profit d'alternatives. Si vous êtes déjà dans un tel environnement, utilisez cette liste comme base de votre prochain mouvement.`,
    es: `Como estás dispuesto a recapacitarte y explorar activamente nuevas direcciones, trata esta lista como tu "prioridad de selección" — no como "lectura de referencia." Si una dirección aparentemente atractiva activa dos o más puntos de desgaste, despriorízala a favor de alternativas. Si ya estás en tal entorno, usa esta lista como base para tu próximo movimiento.`,
    pt: `Como estás disposto a requalificar-te e a explorar ativamente novas direções, trata esta lista como a tua "prioridade de seleção" — não como "leitura de referência." Se uma direção aparentemente atraente acionar dois ou mais pontos de desgaste, despriorizá-a a favor de alternativas. Se já estás nesse ambiente, usa esta lista como base para o teu próximo passo.`,
    it: `Poiché sei disposto a riqualificarti ed esplori attivamente nuove direzioni, tratta questa lista come la tua "priorità di selezione" — non come "lettura di riferimento." Se una direzione apparentemente attraente attiva due o più punti di esaurimento, declassala a favore di alternative. Se sei già in tale ambiente, usa questa lista come base per la tua prossima mossa.`,
    ru: `Поскольку вы готовы переучиваться и активно ищете новые направления, относитесь к этому списку как к «приоритету выбора» — а не «справочному чтению». Если внешне привлекательное направление задевает две или более точки истощения, отдайте приоритет альтернативам. Если вы уже находитесь в такой среде, используйте этот список как основу для следующего шага.`,
    ja: `あなたは再訓練を受ける意欲があり、積極的に新しい方向を探索しているので、このリストを「参考資料」ではなく「選択の優先順位」として扱ってください。表面的に魅力的な方向が2つ以上の消耗ポイントに該当する場合は、代替案を優先してください。すでにそのような環境にいる場合は、このリストを次の行動の根拠としてください。`,
    ko: `당신은 재교육을 받을 의지가 있고 적극적으로 새로운 방향을 탐색하고 있으므로 이 목록을 "참고 자료"가 아닌 "선택 우선순위"로 다루세요. 표면적으로 매력적인 방향이 두 개 이상의 소진 포인트를 자극한다면, 대안을 우선시하세요. 이미 그런 환경에 있다면, 이 목록을 다음 행동의 근거로 사용하세요.`,
  },
];

// ── Low urgency: user is not planning to move and unwilling to retrain ──
// Tone: long-term, observational, no implicit "you should act."

export const URGENCY_LOW_FRAMING: UrgencyFraming[] = [
  {
    zh: `你目前没有强烈的转行意愿，下面这份能量预警就把它当作"长期自我了解"来读——不是要催促你做出改变，而是帮你在当前环境里识别那些可能慢性消耗你的因素。看到了，未必要立刻行动；下次机会自然出现时，你已经知道自己该避开什么。`,
    en: `Since you're not actively planning a move, read this drain warning as long-term self-knowledge — not as a nudge to change anything. The value is in recognizing which factors in your current environment might be quietly costing you energy. Seeing them doesn't require acting on them; when the next natural opportunity arises, you'll already know what to steer clear of.`,
    nl: `Omdat je niet actief van plan bent om te bewegen, lees deze uitputtingswaarschuwing als langetermijn-zelfkennis — niet als een duwtje om iets te veranderen. De waarde zit in het herkennen van welke factoren in je huidige omgeving je stilletjes energie kunnen kosten. Ze zien vereist niet dat je erop reageert; wanneer de volgende natuurlijke kans zich voordoet, weet je al wat je moet vermijden.`,
    de: `Da du derzeit keinen Umzug planst, lies diese Erschöpfungswarnung als langfristige Selbsterkenntnis — nicht als Anstoß, etwas zu ändern. Der Wert liegt darin zu erkennen, welche Faktoren in deiner aktuellen Umgebung dich leise Energie kosten könnten. Sie zu sehen erfordert nicht, danach zu handeln; wenn sich die nächste natürliche Gelegenheit ergibt, weißt du bereits, was du vermeiden solltest.`,
    fr: `Puisque vous n'envisagez pas activement de bouger, lisez cet avertissement d'épuisement comme une connaissance de soi à long terme — pas comme une incitation à changer. La valeur réside dans la reconnaissance des facteurs de votre environnement actuel qui pourraient discrètement vous coûter de l'énergie. Les voir n'exige pas d'agir ; lorsque la prochaine opportunité naturelle se présentera, vous saurez déjà ce qu'il faut éviter.`,
    es: `Como no estás planeando activamente un cambio, lee esta advertencia de desgaste como autoconocimiento a largo plazo — no como un empujón para cambiar algo. El valor está en reconocer qué factores en tu entorno actual podrían estar costándote energía silenciosamente. Verlos no requiere actuar sobre ellos; cuando surja la próxima oportunidad natural, ya sabrás qué evitar.`,
    pt: `Como não estás a planear ativamente uma mudança, lê este aviso de desgaste como autoconhecimento de longo prazo — não como um empurrão para mudar algo. O valor está em reconhecer que fatores no teu ambiente atual podem estar a custar-te energia silenciosamente. Vê-los não exige agir sobre eles; quando surgir a próxima oportunidade natural, já saberás o que evitar.`,
    it: `Poiché non stai pianificando attivamente un cambiamento, leggi questo avviso di esaurimento come autoconsapevolezza a lungo termine — non come una spinta a cambiare qualcosa. Il valore sta nel riconoscere quali fattori nel tuo ambiente attuale potrebbero costarti energia silenziosamente. Vederli non richiede di agire; quando si presenterà la prossima opportunità naturale, saprai già cosa evitare.`,
    ru: `Поскольку вы сейчас активно не планируете перемен, читайте это предупреждение об истощении как долгосрочное самопознание — а не как побуждение что-то менять. Ценность в том, чтобы распознать факторы в вашей текущей среде, которые могут тихо забирать у вас энергию. Видеть их не требует действовать; когда возникнет следующая естественная возможность, вы уже будете знать, чего избегать.`,
    ja: `現在積極的に移動を計画していないので、この消耗警告は長期的な自己認識として読んでください——何かを変えるための後押しではありません。価値は、現在の環境のどの要因があなたのエネルギーを静かに奪っている可能性があるかを認識することにあります。見ることは行動を必要としません。次の自然な機会が訪れたとき、あなたはすでに何を避けるべきかを知っているでしょう。`,
    ko: `현재 적극적으로 이동을 계획하고 있지 않으므로 이 소진 경고를 장기적인 자기 인식으로 읽으세요 — 무언가를 바꾸라는 자극이 아닙니다. 가치는 현재 환경의 어떤 요소가 당신의 에너지를 조용히 소모시킬 수 있는지를 인식하는 데 있습니다. 그것을 보는 것이 행동을 요구하지는 않습니다. 다음 자연스러운 기회가 올 때, 당신은 이미 무엇을 피해야 할지 알게 될 것입니다.`,
  },
  {
    zh: `你倾向于在当前轨道上深耕，那么下面这份清单就当作"环境地图"——帮你识别身边哪些因素长期累积起来可能让你耗竭。不需要立刻调整方向，但可以用它来评估：当下能减少接触哪些消耗点？哪些是结构性无法避开、需要靠恢复策略来对冲的？`,
    en: `Since you're inclined to deepen your current path rather than pivot, treat this list as an "environmental map" — helping you identify which surrounding factors could accumulate into burnout over time. No course correction needed; use it to assess: which drain points can you reduce contact with day-to-day? Which are structural and require recovery strategies to offset?`,
    nl: `Omdat je geneigd bent je huidige pad te verdiepen in plaats van te kantelen, behandel deze lijst dan als een "omgevingskaart" — die je helpt te herkennen welke omringende factoren op termijn tot burn-out kunnen leiden. Geen koerswijziging nodig; gebruik het om te beoordelen: met welke uitputtingspunten kun je dagelijks minder contact maken? Welke zijn structureel en vereisen herstelstrategieën om te compenseren?`,
    de: `Da du dazu neigst, deinen aktuellen Weg zu vertiefen statt zu wechseln, behandle diese Liste als „Umgebungskarte" — sie hilft dir zu erkennen, welche umliegenden Faktoren sich im Laufe der Zeit zu Burnout summieren könnten. Kein Kurswechsel nötig; nutze sie zur Bewertung: mit welchen Erschöpfungspunkten kannst du täglich weniger Kontakt haben? Welche sind strukturell und erfordern Erholungsstrategien als Ausgleich?`,
    fr: `Puisque vous êtes enclin à approfondir votre voie actuelle plutôt qu'à pivoter, traitez cette liste comme une « carte environnementale » — qui vous aide à identifier quels facteurs environnants pourraient s'accumuler en burnout avec le temps. Aucune correction de cap nécessaire ; utilisez-la pour évaluer : avec quels points d'épuisement pouvez-vous réduire le contact quotidien ? Lesquels sont structurels et nécessitent des stratégies de récupération pour compenser ?`,
    es: `Como tiendes a profundizar en tu camino actual en lugar de pivotar, trata esta lista como un "mapa ambiental" — que te ayuda a identificar qué factores circundantes podrían acumularse en agotamiento con el tiempo. No se necesita corrección de rumbo; úsalo para evaluar: ¿con qué puntos de desgaste puedes reducir el contacto diario? ¿Cuáles son estructurales y requieren estrategias de recuperación para compensar?`,
    pt: `Como tendes a aprofundar o teu caminho atual em vez de pivotar, trata esta lista como um "mapa ambiental" — que te ajuda a identificar que fatores circundantes podem acumular-se em burnout ao longo do tempo. Sem necessidade de correção de rumo; usa-o para avaliar: com que pontos de desgaste podes reduzir o contacto diário? Quais são estruturais e exigem estratégias de recuperação para compensar?`,
    it: `Poiché sei incline ad approfondire il tuo percorso attuale piuttosto che cambiare, tratta questa lista come una "mappa ambientale" — che ti aiuta a identificare quali fattori circostanti potrebbero accumularsi in burnout nel tempo. Nessuna correzione di rotta necessaria; usala per valutare: con quali punti di esaurimento puoi ridurre il contatto quotidiano? Quali sono strutturali e richiedono strategie di recupero per compensare?`,
    ru: `Поскольку вы склонны углублять текущий путь, а не разворачиваться, относитесь к этому списку как к «карте окружения» — он помогает определить, какие окружающие факторы могут со временем привести к выгоранию. Корректировка курса не нужна; используйте его для оценки: с какими точками истощения вы можете ежедневно меньше контактировать? Какие из них структурные и требуют стратегий восстановления для компенсации?`,
    ja: `あなたは方向転換よりも現在の道を深めることを好むので、このリストを「環境地図」として扱ってください——時間とともに燃え尽きにつながる可能性のある周囲の要因を特定するのに役立ちます。コース修正は必要ありません。これを使って評価してください——日々どの消耗ポイントとの接触を減らせるか？どれが構造的で、相殺するために回復戦略が必要か？`,
    ko: `당신은 방향 전환보다는 현재 길을 깊게 가는 것을 선호하므로 이 목록을 "환경 지도"로 다루세요 — 시간이 지남에 따라 번아웃으로 누적될 수 있는 주변 요인을 식별하는 데 도움이 됩니다. 경로 수정은 필요하지 않습니다. 이것을 사용하여 평가하세요: 어떤 소진 포인트와 일상적 접촉을 줄일 수 있는가? 어떤 것이 구조적이며 상쇄하기 위해 회복 전략이 필요한가?`,
  },
  {
    zh: `你现在并不打算做大的职业改变，那这份能量预警就更像是一份"风险背景"——把它存档，定期回看。当某天身体或情绪开始持续抗议时，重新打开这份清单，对照看哪条已经在影响你。提前识别比事后补救成本低很多。`,
    en: `Since you're not planning a major career change right now, treat this drain warning as "risk background" — file it away and revisit periodically. When your body or mood starts protesting persistently someday, reopen this list and check which items have been wearing on you. Spotting it early costs far less than course-correcting after the fact.`,
    nl: `Omdat je momenteel geen grote carrièreswitch plant, behandel deze uitputtingswaarschuwing dan als "risico-achtergrond" — archiveer het en bekijk het periodiek opnieuw. Wanneer je lichaam of stemming op een dag aanhoudend gaat protesteren, open deze lijst opnieuw en kijk welke items je hebben uitgeput. Het vroeg herkennen kost veel minder dan achteraf bijsturen.`,
    de: `Da du derzeit keinen großen Karrierewechsel planst, behandle diese Erschöpfungswarnung als „Risiko-Hintergrund" — archiviere sie und sieh sie periodisch wieder durch. Wenn dein Körper oder deine Stimmung eines Tages anhaltend protestiert, öffne diese Liste erneut und prüfe, welche Punkte dich belastet haben. Es früh zu erkennen kostet weit weniger als nachträglich zu korrigieren.`,
    fr: `Puisque vous ne planifiez pas un changement de carrière majeur en ce moment, traitez cet avertissement d'épuisement comme un « arrière-plan de risque » — archivez-le et revisitez-le périodiquement. Quand votre corps ou votre humeur commencera à protester de manière persistante un jour, rouvrez cette liste et vérifiez quels éléments vous ont usé. Le détecter tôt coûte bien moins que de corriger après coup.`,
    es: `Como no estás planeando un cambio profesional importante ahora, trata esta advertencia de desgaste como "fondo de riesgo" — archívala y revísala periódicamente. Cuando tu cuerpo o estado de ánimo comience a protestar persistentemente algún día, reabre esta lista y verifica qué elementos te han estado afectando. Detectarlo temprano cuesta mucho menos que corregir el rumbo después.`,
    pt: `Como não estás a planear uma grande mudança de carreira agora, trata este aviso de desgaste como "fundo de risco" — arquiva-o e revê-o periodicamente. Quando o teu corpo ou humor começar a protestar persistentemente um dia, reabre esta lista e verifica que itens te têm afetado. Detetá-lo cedo custa muito menos do que corrigir o rumo depois.`,
    it: `Poiché non stai pianificando un grande cambiamento di carriera ora, tratta questo avviso di esaurimento come "sfondo di rischio" — archivialo e rivedilo periodicamente. Quando un giorno il tuo corpo o umore inizierà a protestare persistentemente, riapri questa lista e controlla quali elementi ti hanno logorato. Individuarlo presto costa molto meno che correggere la rotta dopo.`,
    ru: `Поскольку сейчас вы не планируете крупных карьерных изменений, относитесь к этому предупреждению об истощении как к «фоновому риску» — отложите его и периодически перечитывайте. Когда однажды ваше тело или настроение начнёт стойко протестовать, снова откройте этот список и проверьте, какие пункты вас изматывали. Заметить это рано стоит гораздо меньше, чем корректировать курс постфактум.`,
    ja: `現在大きなキャリア変更を計画していないので、この消耗警告を「リスク背景」として扱ってください——ファイルに保管し、定期的に見直してください。いつか身体や気分が持続的に抗議し始めたとき、このリストを再び開いて、どの項目があなたを摩耗させてきたかを確認してください。早期に発見することは、事後に軌道修正するよりもはるかにコストが低くなります。`,
    ko: `현재 큰 커리어 변경을 계획하고 있지 않으므로 이 소진 경고를 "위험 배경"으로 다루세요 — 보관하고 주기적으로 다시 살펴보세요. 언젠가 몸이나 기분이 지속적으로 저항하기 시작할 때, 이 목록을 다시 열고 어떤 항목이 당신을 마모시켜 왔는지 확인하세요. 일찍 발견하는 것이 사후에 경로를 수정하는 것보다 훨씬 적은 비용이 듭니다.`,
  },
];

// ── Urgency selector ──

export type DrainUrgency = "high" | "low" | "default";

// We deliberately do NOT depend on the full RealConditions type here — only
// on the two fields that matter for urgency. This keeps the helper testable
// without a giant fixture and avoids coupling to the upstream type's nested
// shape changing. The caller passes a slice via the shape below.
interface UrgencyRealConditionsLike {
  // RealConditions.economicConstraints.willingToRetrain (boolean, required upstream)
  willingToRetrain?: boolean;
  // RealConditions.careerChangeUrgency (optional upstream enum)
  careerChangeUrgency?: "exploring" | "considering" | "urgent";
}

// Type guard to detect when the caller passed the full RealConditions
// (which nests willingToRetrain inside economicConstraints).
function isFullRealConditions(
  rc: unknown,
): rc is { economicConstraints: { willingToRetrain?: boolean } } {
  return (
    !!rc &&
    typeof rc === "object" &&
    "economicConstraints" in (rc as Record<string, unknown>) &&
    typeof (rc as { economicConstraints?: unknown }).economicConstraints ===
      "object"
  );
}

/**
 * Derive drain framing urgency from RealConditions (or a minimal slice).
 *
 * Signal model (tightened 2026-05-23 after codex P1 review — earlier draft
 * treated `willingToRetrain === true` as a sufficient high signal, but
 * api-schemas defaults that field to `true`, so the silent default would
 * have mis-classified most users as "high"):
 *
 * - high: explicit careerChangeUrgency="urgent", OR willingToRetrain=true
 *   combined with a non-exploratory urgency signal ("considering" or
 *   "urgent"). Pure willingness without urgency stays "default."
 * - low: user has explicitly signaled they don't intend to move
 *   (willingToRetrain=false AND careerChangeUrgency is "exploring" or
 *   undefined).
 * - default: anything in between (most users), or no RealConditions at all.
 *
 * Default is the safe choice — when in doubt, use the same neutral framing
 * the report has always used. Accepts either the full RealConditions object
 * (digging into economicConstraints.willingToRetrain) or a flat slice for
 * testability.
 */
export function deriveDrainUrgency(
  rc: UrgencyRealConditionsLike | unknown | null | undefined,
): DrainUrgency {
  if (!rc) return "default";

  let willingToRetrain: boolean | undefined;
  let careerChangeUrgency: "exploring" | "considering" | "urgent" | undefined;

  if (isFullRealConditions(rc)) {
    willingToRetrain = rc.economicConstraints?.willingToRetrain;
    careerChangeUrgency = (
      rc as { careerChangeUrgency?: typeof careerChangeUrgency }
    ).careerChangeUrgency;
  } else {
    const slice = rc as UrgencyRealConditionsLike;
    willingToRetrain = slice.willingToRetrain;
    careerChangeUrgency = slice.careerChangeUrgency;
  }

  // High urgency requires explicit intent — either careerChangeUrgency is
  // "urgent" outright, or willingToRetrain=true AND the user has at least
  // moved beyond pure exploration ("considering"/"urgent"). Pure
  // willingToRetrain=true with no urgency signal stays "default" because
  // that's the schema-default state for users who haven't actively opted
  // into "I'm trying to move."
  if (careerChangeUrgency === "urgent") return "high";
  // At this point careerChangeUrgency narrowed to "exploring" | "considering"
  // | undefined. willingToRetrain alone is insufficient — require at least
  // "considering" to combine with willingness as a high signal.
  if (willingToRetrain === true && careerChangeUrgency === "considering") {
    return "high";
  }

  const lowSignal =
    willingToRetrain === false &&
    (careerChangeUrgency === "exploring" || careerChangeUrgency === undefined);
  if (lowSignal) return "low";

  return "default";
}
