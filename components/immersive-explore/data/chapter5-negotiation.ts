// ════════════════════════════════════════════════════════════
// 第五章：谈判层（E型 Q21-Q25）
// 大任务：两支队伍，有限资源，从零建立合作秩序
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER5_QUESTIONS: ImmersiveQuestion[] = [
  {
    id: 21,
    riasec: "E",
    miniIpCode: "E1",
    miniIpItem: "Manage a department within a large company",
    chapter: "negotiation",
    chapterIndex: 5,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `第五层，你们和另一支队伍再次相遇。

谈判层中央升起一面巨大的组织架构图——两支队伍合并后的虚拟部门：生产、后勤、情报、对外联络。每个部门下面都有人员名额、资源预算和待办任务。

屏幕解释规则：
「两支队伍临时合并为一个组织。需指定一位部门主管，全权负责其中一个部门——协调成员、分配预算、制定优先级、处理跨部门请求。」

Adrian 皱眉：「这不是谈判——是管理。有人需要坐到那个位置上，把一整个部门运转起来。」

对面队伍也在看。他们知道这决定了接下来的资源效率。

需要有人接管一个完整的部门——不是做某件事，而是让所有事情同时运转：人员、优先级、资源、沟通。每一个管理决策都会影响全局。`,

      en: `Fifth floor. You meet the other team again.

A massive organizational chart rises from the center of the negotiation floor — departments for the two teams' merged operation: Production, Logistics, Intelligence, External Relations. Each with personnel slots, resource budgets, and task backlogs.

The screen explains:
"The two teams will temporarily merge into one organization. A department head must be appointed to take full charge — coordinating members, allocating budgets, setting priorities, handling cross-department requests."

Adrian frowns: "This isn't negotiation — this is management. Someone needs to sit in that seat and make a whole department run."

The other team is watching too. They know this determines resource efficiency going forward.

This needs someone to take over a full department — not doing one task, but keeping everything running at once: scheduling, prioritization, allocation, communication. Every management decision affects the bigger picture.`,

      nl: `Vijfde verdieping. Je ontmoet het andere team weer.

Een enorm organogram rijst op uit het midden van de onderhandelingsvloer. Het toont afdelingen voor de samengevoegde operatie van beide teams — Productie, Logistiek, Inlichtingen, Externe Betrekkingen — elk met personeelsplaatsen, grondstofbudgetten en takenlijsten.

Het scherm legt de regels uit:
"De twee teams worden tijdelijk samengevoegd tot één organisatie. Er moet een afdelingshoofd worden aangewezen dat de volledige verantwoordelijkheid draagt voor één afdeling — teamleden coördineren, budgetten toewijzen, werkprioriteiten stellen, afdelingsoverschrijdende verzoeken afhandelen."

Adrian bestudeert het schema en fronst: "Dit is geen onderhandeling — dit is management. Iemand moet in die stoel gaan zitten en een hele afdeling laten draaien."

Het andere team kijkt ook. Ze weten dat dit de grondstofefficiëntie bepaalt.

Er is iemand nodig die een volledige afdeling overneemt — niet één taak uitvoeren, maar alles tegelijk draaiende houden: personeelsplanning, taakprioritering, budgetverdeling, communicatie tussen teams. Elke managementbeslissing beïnvloedt het geheel.`,

      de: `Fünfte Etage. Du triffst das andere Team wieder.

Ein riesiges Organigramm erhebt sich aus der Mitte des Verhandlungsbodens. Es zeigt Abteilungen für den zusammengelegten Betrieb beider Teams — Produktion, Logistik, Aufklärung, Außenbeziehungen — jede mit Personalstellen, Ressourcenbudgets und Aufgabenlisten.

Der Bildschirm erklärt die Regeln:
„Die zwei Teams werden vorübergehend zu einer Organisation zusammengelegt. Ein Abteilungsleiter muss ernannt werden, der die volle Verantwortung für eine Abteilung übernimmt — Teammitglieder koordinieren, Ressourcenbudgets verteilen, Arbeitsprioritäten setzen, abteilungsübergreifende Anfragen bearbeiten."

Adrian studiert das Diagramm und runzelt die Stirn: „Das ist keine Verhandlung — das ist Management. Jemand muss auf diesen Stuhl und eine ganze Abteilung zum Laufen bringen."

Das andere Team schaut ebenfalls. Sie wissen, dass dies die Ressourceneffizienz bestimmt.

Es braucht jemanden, der eine komplette Abteilung übernimmt — nicht eine Aufgabe erledigen, sondern alles gleichzeitig am Laufen halten: Personalplanung, Aufgabenpriorisierung, Ressourcenverteilung, teamübergreifende Kommunikation. Jede Managemententscheidung beeinflusst das Gesamtbild.`,

      fr: `Cinquième étage. Vous retrouvez l'autre équipe.

Un immense organigramme émerge du centre de la salle de négociation. Il affiche les départements de l'opération fusionnée des deux équipes — Production, Logistique, Renseignement, Relations Extérieures — chacun avec des postes, des budgets de ressources et des listes de tâches.

L'écran explique les règles :
« Les deux équipes fusionneront temporairement en une seule organisation. Un chef de département doit être désigné pour prendre en charge un département — coordonner les membres de l'équipe, allouer les budgets, définir les priorités de travail, gérer les demandes interdépartementales. »

Adrian étudie le schéma et fronce les sourcils : « Ce n'est pas de la négociation — c'est du management. Quelqu'un doit s'asseoir à cette place et faire tourner un département entier. »

L'autre équipe regarde aussi. Ils savent que cela détermine l'efficacité des ressources.

Il faut quelqu'un pour prendre en charge un département complet — pas une seule tâche, mais tout maintenir en marche simultanément : planning du personnel, priorisation des tâches, allocation des ressources, communication inter-équipes. Chaque décision managériale affecte l'ensemble.`,

      es: `Quinto piso. Te encuentras con el otro equipo de nuevo.

Un enorme organigrama emerge del centro de la sala de negociación. Muestra los departamentos de la operación fusionada de ambos equipos — Producción, Logística, Inteligencia, Relaciones Exteriores — cada uno con puestos de personal, presupuestos de recursos y listas de tareas pendientes.

La pantalla explica las reglas:
"Los dos equipos se fusionarán temporalmente en una organización. Se debe designar un jefe de departamento que asuma la responsabilidad total de un departamento — coordinar miembros del equipo, asignar presupuestos, establecer prioridades de trabajo, gestionar solicitudes interdepartamentales."

Adrian estudia el diagrama y frunce el ceño: "Esto no es negociación — es gestión. Alguien necesita sentarse en esa silla y hacer funcionar un departamento entero."

El otro equipo también observa. Saben que esto determina la eficiencia de recursos.

Se necesita a alguien que tome el control de un departamento completo — no hacer una tarea, sino mantener todo funcionando simultáneamente: programación de personal, priorización de tareas, asignación de recursos, comunicación entre equipos. Cada decisión gerencial afecta el panorama general.`,

      pt: `Quinto andar. Vocês encontram a outra equipe novamente.

Um enorme organograma emerge do centro do piso de negociação. Mostra os departamentos da operação unificada das duas equipes — Produção, Logística, Inteligência, Relações Externas — cada um com vagas de pessoal, orçamentos de recursos e listas de tarefas pendentes.

A tela explica as regras:
"As duas equipes se fundirão temporariamente em uma organização. Um chefe de departamento deve ser designado para assumir total responsabilidade por um departamento — coordenar membros da equipe, alocar orçamentos, definir prioridades de trabalho, lidar com solicitações interdepartamentais."

Adrian estuda o diagrama e franze a testa: "Isso não é negociação — é gestão. Alguém precisa sentar naquela cadeira e fazer um departamento inteiro funcionar."

A outra equipe também está observando. Sabem que isso determina a eficiência dos recursos.

Alguém precisa assumir um departamento completo — não fazer uma tarefa, mas manter tudo funcionando simultaneamente: escalas de pessoal, priorização de tarefas, alocação de recursos, comunicação entre equipes. Cada decisão gerencial afeta o quadro geral.`,

      it: `Quinto piano. Incontrate di nuovo l'altra squadra.

Un enorme organigramma emerge dal centro della sala di negoziazione. Mostra i dipartimenti dell'operazione unificata delle due squadre — Produzione, Logistica, Intelligence, Relazioni Esterne — ciascuno con posti di personale, budget di risorse e liste di compiti arretrati.

Lo schermo spiega le regole:
"Le due squadre si fonderanno temporaneamente in un'unica organizzazione. Deve essere nominato un capo dipartimento che assuma la piena responsabilità di un dipartimento — coordinare i membri del team, allocare i budget, stabilire le priorità di lavoro, gestire le richieste interdipartimentali."

Adrian studia il diagramma e aggrotta la fronte: "Questa non è negoziazione — è management. Qualcuno deve sedersi in quella posizione e far funzionare un intero dipartimento."

Anche l'altra squadra osserva. Sanno che questo determina l'efficienza delle risorse.

Serve qualcuno che prenda in carico un dipartimento completo — non svolgere un compito, ma tenere tutto in funzione contemporaneamente: pianificazione del personale, prioritizzazione dei compiti, allocazione delle risorse, comunicazione tra team. Ogni decisione gestionale influenza il quadro complessivo.`,

      ru: `Пятый этаж. Вы снова встречаете другую команду.

Из центра переговорного зала поднимается огромная организационная схема. На ней отображены отделы объединённой операции двух команд — Производство, Логистика, Разведка, Внешние Связи — каждый со штатными позициями, бюджетами ресурсов и списками задач.

Экран объясняет правила:
«Две команды временно объединяются в одну организацию. Необходимо назначить руководителя отдела, который возьмёт на себя полную ответственность за один отдел — координацию членов команды, распределение бюджетов, установку рабочих приоритетов, обработку межотдельских запросов.»

Адриан изучает схему и хмурится: «Это не переговоры — это управление. Кому-то нужно сесть на это место и заставить целый отдел работать.»

Другая команда тоже наблюдает. Они знают, что от этого зависит эффективность использования ресурсов.

Нужен тот, кто возьмёт на себя полноценный отдел — не выполнять одну задачу, а поддерживать работу всего одновременно: расписание персонала, приоритизация задач, распределение ресурсов, межкомандная коммуникация. Каждое управленческое решение влияет на общую картину.`,

      ja: `五階。もう一つのチームと再び出会う。

交渉フロアの中央から巨大な組織図がせり上がってくる。両チームの統合作戦における部門が表示されている——生産部、兵站部、情報部、渉外部——それぞれに人員枠、資源予算、未処理タスクの一覧がある。

画面がルールを説明する：
「2つのチームは一時的に1つの組織に統合されます。部門長を1名任命し、1つの部門の運営を全面的に担当してください——チームメンバーの調整、資源予算の配分、作業優先順位の設定、部門間の依頼対応。」

エイドリアンが図を見つめ、眉をひそめる：「これは交渉じゃない——マネジメントだ。誰かがあの席に座って、部門全体を回す必要がある。」

相手チームも見ている。これが今後の資源効率を左右することを分かっている。

誰かが完全な部門を引き受ける必要がある——一つの仕事をこなすのではなく、すべてを同時に回す：人員配置、タスクの優先順位付け、資源配分、チーム間コミュニケーション。すべてのマネジメント判断が全体に影響する。`,

      ko: `5층. 다른 팀과 다시 만난다.

협상 층 중앙에서 거대한 조직도가 솟아오른다. 두 팀의 통합 운영을 위한 부서들이 표시되어 있다 — 생산부, 병참부, 정보부, 대외 연락부 — 각각 인원 배정, 자원 예산, 미처리 업무 목록이 있다.

화면이 규칙을 설명한다:
"두 팀은 임시로 하나의 조직으로 통합됩니다. 부서장 한 명을 지정하여 한 부서의 운영을 전담해야 합니다 — 팀원 조율, 자원 예산 배분, 업무 우선순위 설정, 부서 간 요청 처리."

에이드리안이 조직도를 살피며 미간을 찌푸린다: "이건 협상이 아니야 — 관리야. 누군가 저 자리에 앉아서 부서 전체를 돌려야 해."

상대 팀도 지켜보고 있다. 이것이 향후 자원 효율을 결정한다는 걸 알고 있다.

누군가 완전한 부서를 맡아야 한다 — 하나의 일을 하는 게 아니라, 모든 것을 동시에 돌리는 것이다: 인력 배치, 업무 우선순위, 자원 배분, 팀 간 소통. 모든 관리 결정이 전체 그림에 영향을 미친다.`,
    },
    taskDescription: {
      zh: "接管一个完整部门的管理工作——协调团队成员、分配资源预算、设定工作优先级、处理跨部门请求。这项任务需要一个主要负责人。",

      en: `Take charge of managing a full department — coordinate team members, allocate resource budgets, set work priorities, handle cross-department requests. This task needs one primary person.`,

      nl: "Neem de leiding over het beheer van een volledige afdeling — coördineer teamleden, wijs budgetten toe, stel werkprioriteiten, handel afdelingsoverschrijdende verzoeken af. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Übernimm die Leitung einer vollständigen Abteilung — koordiniere Teammitglieder, verteile Ressourcenbudgets, setze Arbeitsprioritäten, bearbeite abteilungsübergreifende Anfragen. Diese Aufgabe braucht eine Hauptperson.",

      fr: "Prenez en charge la gestion d'un département complet — coordonnez les membres de l'équipe, allouez les budgets, définissez les priorités de travail, gérez les demandes interdépartementales. Cette tâche nécessite un responsable principal.",

      es: "Asume la gestión de un departamento completo — coordina a los miembros del equipo, asigna presupuestos de recursos, establece prioridades de trabajo, gestiona solicitudes interdepartamentales. Esta tarea necesita un responsable principal.",

      pt: "Assuma a gestão de um departamento completo — coordene membros da equipe, aloque orçamentos de recursos, defina prioridades de trabalho, lide com solicitações interdepartamentais. Esta tarefa precisa de um responsável principal.",

      it: "Assumi la gestione di un dipartimento completo — coordina i membri del team, alloca i budget, stabilisci le priorità di lavoro, gestisci le richieste interdipartimentali. Questo compito richiede un responsabile principale.",

      ru: "Возьмите на себя управление полноценным отделом — координируйте членов команды, распределяйте бюджеты ресурсов, устанавливайте рабочие приоритеты, обрабатывайте межотдельские запросы. Для этой задачи нужен один главный ответственный.",

      ja: "部門全体の管理を引き受ける——チームメンバーを調整し、資源予算を配分し、作業優先順位を設定し、部門間の依頼に対応する。この任務には主担当者が一人必要です。",

      ko: "한 부서의 전체 관리를 맡으세요 — 팀원을 조율하고, 자원 예산을 배분하고, 업무 우선순위를 설정하고, 부서 간 요청을 처리하세요. 이 임무에는 한 명의 주 담당자가 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你已经在看那张组织图了。

四个部门、十几个人、有限的资源预算——你的大脑在自动建模：谁擅长什么，哪些任务有前后依赖关系，哪些可以并行。你看到了瓶颈在哪里——后勤组的人手不够，但情报组有冗余。

你走到部门主管的位置，坐下了。Adrian 在你旁边，但没有抢位置——他看到了你眼睛里的那种全局感，那是管理者才有的表情。

你开始分派任务。第一条指令发出去了。

不是紧张——是掌控感。把一个部门从零运转起来，这是你的节奏。`,

        en: `You're already reading the chart.

Four departments, a dozen people, limited budgets — your mind builds a model automatically: who's good at what, which tasks have dependencies, which can run in parallel. You spot the bottleneck — Logistics is understaffed, but Intelligence has surplus.

You walk to the department head's seat and sit down. Adrian is beside you but doesn't contest the seat — he sees the big-picture awareness in your eyes, the look of a manager.

You start assigning tasks. The first directive goes out.

Not anxiety — control. Spinning up a department from zero, this is your rhythm.`,

        nl: `Je leest het schema al.

Vier afdelingen, een dozijn mensen, beperkte budgetten — je brein bouwt automatisch een model: wie is waar goed in, welke taken hebben afhankelijkheden, welke kunnen parallel lopen. Je ziet het knelpunt — Logistiek heeft te weinig mensen, maar Inlichtingen heeft overschot.

Je loopt naar de stoel van het afdelingshoofd en gaat zitten. Adrian zit naast je maar betwist de plek niet — hij ziet het overzicht in je ogen, de blik van een manager.

Je begint taken toe te wijzen. De eerste instructie gaat uit.

Geen angst — controle. Een afdeling vanuit nul opstarten, dit is jouw ritme.`,

        de: `Du liest bereits das Organigramm.

Vier Abteilungen, ein Dutzend Leute, begrenzte Budgets — dein Verstand baut automatisch ein Modell: Wer kann was, welche Aufgaben haben Abhängigkeiten, welche können parallel laufen. Du erkennst den Engpass — Logistik ist unterbesetzt, aber Aufklärung hat Überschuss.

Du gehst zum Stuhl des Abteilungsleiters und setzt dich. Adrian sitzt neben dir, beansprucht den Platz aber nicht — er sieht das Gesamtbewusstsein in deinen Augen, den Blick eines Managers.

Du fängst an, Aufgaben zu verteilen. Die erste Anweisung geht raus.

Keine Angst — Kontrolle. Eine Abteilung von null hochfahren, das ist dein Rhythmus.`,

        fr: `Tu lis déjà l'organigramme.

Quatre départements, une douzaine de personnes, des budgets limités — ton esprit construit automatiquement un modèle : qui excelle en quoi, quelles tâches ont des dépendances, lesquelles peuvent tourner en parallèle. Tu repères le goulot d'étranglement — la Logistique manque de personnel, mais le Renseignement a du surplus.

Tu marches vers le siège du chef de département et tu t'assieds. Adrian est à côté mais ne conteste pas la place — il voit la vision d'ensemble dans tes yeux, le regard d'un manager.

Tu commences à distribuer les tâches. La première directive part.

Pas de l'anxiété — de la maîtrise. Faire tourner un département à partir de zéro, c'est ton rythme.`,

        es: `Ya estás leyendo el organigrama.

Cuatro departamentos, una docena de personas, presupuestos limitados — tu mente construye un modelo automáticamente: quién es bueno en qué, qué tareas tienen dependencias, cuáles pueden correr en paralelo. Detectas el cuello de botella — Logística tiene poco personal, pero Inteligencia tiene excedente.

Caminas al asiento del jefe de departamento y te sientas. Adrian está a tu lado pero no disputa el asiento — ve la visión de conjunto en tus ojos, la mirada de un gerente.

Empiezas a asignar tareas. La primera directiva sale.

No es ansiedad — es control. Poner en marcha un departamento desde cero, este es tu ritmo.`,

        pt: `Você já está lendo o organograma.

Quatro departamentos, uma dúzia de pessoas, orçamentos limitados — sua mente constrói um modelo automaticamente: quem é bom em quê, quais tarefas têm dependências, quais podem rodar em paralelo. Você identifica o gargalo — Logística está com pouco pessoal, mas Inteligência tem excedente.

Você caminha até a cadeira do chefe de departamento e senta. Adrian está ao lado, mas não disputa o lugar — ele vê a visão de conjunto nos seus olhos, o olhar de um gestor.

Você começa a distribuir tarefas. A primeira diretriz sai.

Não é ansiedade — é controle. Colocar um departamento para funcionar do zero, este é o seu ritmo.`,

        it: `Stai già leggendo l'organigramma.

Quattro dipartimenti, una dozzina di persone, budget limitati — la tua mente costruisce automaticamente un modello: chi è bravo in cosa, quali compiti hanno dipendenze, quali possono procedere in parallelo. Individui il collo di bottiglia — la Logistica è sotto organico, ma l'Intelligence ha un surplus.

Cammini fino alla sedia del capo dipartimento e ti siedi. Adrian è accanto a te ma non contesta il posto — vede la visione d'insieme nei tuoi occhi, lo sguardo di un manager.

Cominci ad assegnare compiti. La prima direttiva parte.

Non ansia — controllo. Far partire un dipartimento da zero, questo è il tuo ritmo.`,

        ru: `Ты уже читаешь организационную схему.

Четыре отдела, дюжина людей, ограниченные бюджеты — твой разум автоматически строит модель: кто в чём силён, какие задачи зависят друг от друга, какие можно запустить параллельно. Ты видишь узкое место — в Логистике не хватает людей, но в Разведке есть излишек.

Ты подходишь к креслу руководителя отдела и садишься. Адриан рядом, но не оспаривает место — он видит в твоих глазах системное мышление, взгляд управленца.

Ты начинаешь раздавать задания. Первая директива уходит.

Не тревога — контроль. Запустить отдел с нуля — это твой ритм.`,

        ja: `もう組織図を読んでいる。

4つの部門、十数人、限られた予算——頭が自動的にモデルを構築する：誰が何を得意としているか、どのタスクに依存関係があるか、どれを並行して走らせられるか。ボトルネックが見える——兵站部は人手不足だが、情報部には余剰がある。

部門長の席まで歩き、座る。エイドリアンは隣にいるが、席を争わない——彼にはあなたの目の中の全体把握力が見える。マネージャーの表情だ。

タスクの割り振りを始める。最初の指示が出る。

不安ではない——統制感だ。部門をゼロから回す、これがあなたのリズムだ。`,

        ko: `이미 조직도를 읽고 있다.

4개 부서, 십여 명, 제한된 예산 — 머리가 자동으로 모델을 구축한다: 누가 무엇을 잘하는지, 어떤 업무에 선후 관계가 있는지, 어떤 것을 병렬로 돌릴 수 있는지. 병목을 발견한다 — 병참부는 인력이 부족하지만 정보부에는 여유가 있다.

부서장 자리로 걸어가 앉는다. 에이드리안이 옆에 있지만 자리를 다투지 않는다 — 그는 당신의 눈 속 전체적 시야를 본다. 관리자의 표정이다.

업무 배정을 시작한다. 첫 번째 지시가 나간다.

불안이 아니다 — 통제감이다. 부서를 처음부터 돌리는 것, 이것이 당신의 리듬이다.`,
      },
      score4: {
        zh: `组织架构图。部门名单。待办任务列表。

你走到主管位旁边，花了三十秒看清了整体结构。四个部门各有侧重，资源分配不均，但不是没有优化空间。

你开始整理思路：先理清各部门当前的优先事项，然后找出人员配置不合理的地方，最后草拟一个初步的协调方案。不一定是最优解，但能让部门先转起来。

第一个调度指令发了出去。效果还行。你微调了一下分工方案，继续推进。

你不是天生的管理者，但你能把事情理顺。`,

        en: `Organizational chart. Department roster. Task backlog.

You walk to the manager's seat and spend thirty seconds reading the full structure. Four departments with different priorities, resources unevenly distributed, but there's room to optimize.

You start organizing your thoughts: first clarify each department's current priorities, then identify where staffing doesn't match needs, then draft an initial coordination plan. Maybe not the optimal solution, but enough to get the department running.

The first scheduling directive goes out. Results are decent. You tweak the division of labor and keep pushing forward.

You're not a born manager, but you can get things organized.`,

        nl: `Organogram. Afdelingslijst. Takenlijst.

Je loopt naar de stoel van het afdelingshoofd en besteedt dertig seconden aan het lezen van de hele structuur. Vier afdelingen met verschillende prioriteiten, ongelijk verdeelde middelen, maar er is ruimte om te optimaliseren.

Je begint je gedachten te ordenen: eerst de huidige prioriteiten van elke afdeling verduidelijken, dan identificeren waar de bezetting niet aansluit bij de behoeften, dan een eerste coördinatieplan opstellen. Misschien niet de optimale oplossing, maar genoeg om de afdeling te laten draaien.

De eerste planningsinstructie gaat uit. Resultaten zijn redelijk. Je past de taakverdeling aan en gaat verder.

Je bent geen geboren manager, maar je kunt de boel georganiseerd krijgen.`,

        de: `Organigramm. Abteilungsliste. Aufgabenliste.

Du gehst zum Stuhl des Leiters und verbringst dreißig Sekunden damit, die gesamte Struktur zu erfassen. Vier Abteilungen mit unterschiedlichen Schwerpunkten, Ressourcen ungleich verteilt, aber es gibt Optimierungspotenzial.

Du fängst an, deine Gedanken zu ordnen: erst die aktuellen Prioritäten jeder Abteilung klären, dann herausfinden, wo die Personalbesetzung nicht zu den Anforderungen passt, dann einen ersten Koordinationsplan entwerfen. Vielleicht nicht die optimale Lösung, aber genug, um die Abteilung zum Laufen zu bringen.

Die erste Planungsanweisung geht raus. Die Ergebnisse sind ordentlich. Du passt die Aufgabenverteilung an und machst weiter.

Du bist kein geborener Manager, aber du kannst Dinge organisieren.`,

        fr: `Organigramme. Liste des départements. Tâches en attente.

Tu t'approches du siège du responsable et passes trente secondes à lire toute la structure. Quatre départements avec des priorités différentes, des ressources inégalement réparties, mais il y a de la marge pour optimiser.

Tu commences à organiser tes pensées : d'abord clarifier les priorités actuelles de chaque département, puis identifier où l'effectif ne correspond pas aux besoins, puis rédiger un premier plan de coordination. Peut-être pas la solution optimale, mais suffisant pour faire tourner le département.

La première directive de planification part. Les résultats sont corrects. Tu ajustes la répartition du travail et continues.

Tu n'es pas un manager né, mais tu sais organiser les choses.`,

        es: `Organigrama. Lista de departamentos. Tareas pendientes.

Caminas hasta el asiento del responsable y dedicas treinta segundos a leer toda la estructura. Cuatro departamentos con prioridades distintas, recursos distribuidos desigualmente, pero hay margen para optimizar.

Empiezas a organizar tus ideas: primero aclarar las prioridades actuales de cada departamento, luego identificar dónde la dotación de personal no se ajusta a las necesidades, luego redactar un plan de coordinación inicial. Quizá no sea la solución óptima, pero suficiente para poner en marcha el departamento.

La primera directiva de planificación sale. Los resultados son aceptables. Ajustas la división del trabajo y sigues adelante.

No eres un gerente nato, pero puedes organizar las cosas.`,

        pt: `Organograma. Lista de departamentos. Tarefas pendentes.

Você caminha até a cadeira do responsável e gasta trinta segundos lendo toda a estrutura. Quatro departamentos com prioridades diferentes, recursos distribuídos desigualmente, mas há espaço para otimizar.

Você começa a organizar seus pensamentos: primeiro esclarecer as prioridades atuais de cada departamento, depois identificar onde a equipe não corresponde às necessidades, depois rascunhar um plano de coordenação inicial. Talvez não a solução ótima, mas suficiente para colocar o departamento em funcionamento.

A primeira diretriz de planejamento sai. Os resultados são razoáveis. Você ajusta a divisão de trabalho e segue em frente.

Você não é um gestor nato, mas consegue organizar as coisas.`,

        it: `Organigramma. Lista dei dipartimenti. Compiti arretrati.

Ti avvicini alla sedia del responsabile e dedichi trenta secondi a leggere l'intera struttura. Quattro dipartimenti con priorità diverse, risorse distribuite in modo disuguale, ma c'è margine per ottimizzare.

Cominci a organizzare i pensieri: prima chiarire le priorità attuali di ogni dipartimento, poi identificare dove il personale non corrisponde alle esigenze, poi abbozzare un piano di coordinamento iniziale. Forse non la soluzione ottimale, ma sufficiente per far girare il dipartimento.

La prima direttiva di pianificazione parte. I risultati sono discreti. Aggiusti la divisione del lavoro e vai avanti.

Non sei un manager nato, ma sai mettere ordine nelle cose.`,

        ru: `Организационная схема. Список отделов. Список задач.

Ты подходишь к креслу руководителя и тратишь тридцать секунд, чтобы разобраться в общей структуре. Четыре отдела с разными приоритетами, ресурсы распределены неравномерно, но есть пространство для оптимизации.

Начинаешь упорядочивать мысли: сначала прояснить текущие приоритеты каждого отдела, затем найти, где распределение персонала не соответствует потребностям, затем набросать первоначальный план координации. Может, не оптимальное решение, но достаточное, чтобы отдел заработал.

Первая плановая директива уходит. Результаты приемлемые. Ты корректируешь распределение обязанностей и продолжаешь.

Ты не прирождённый управленец, но можешь навести порядок.`,

        ja: `組織図。部門一覧。未処理タスクリスト。

管理者の席に歩み寄り、30秒かけて全体構造を把握する。4つの部門にそれぞれ異なる優先事項があり、リソース配分は不均等だが、最適化の余地はある。

思考を整理し始める：まず各部門の現在の優先事項を明確にし、次に人員配置が需要に合っていない箇所を見つけ、そして初期の調整計画を起案する。最適解ではないかもしれないが、部門を回し始めるには十分だ。

最初の配置指示が出る。結果はまずまず。分担を微調整し、前に進む。

生まれながらのマネージャーではないが、物事を整理することはできる。`,

        ko: `조직도. 부서 목록. 미처리 업무 목록.

관리자 자리로 걸어가서 30초 동안 전체 구조를 파악한다. 4개 부서가 각기 다른 우선순위를 가지고 있고, 자원은 불균등하게 배분되어 있지만 최적화할 여지가 있다.

생각을 정리하기 시작한다: 먼저 각 부서의 현재 우선순위를 명확히 하고, 그다음 인력 배치가 필요에 맞지 않는 곳을 찾고, 초기 조율 계획을 작성한다. 최적의 해결책은 아닐 수 있지만, 부서를 돌리기엔 충분하다.

첫 번째 배치 지시가 나간다. 결과는 괜찮다. 역할 분담을 조정하고 계속 진행한다.

타고난 관리자는 아니지만, 일을 정리할 수는 있다.`,
      },
      score3: {
        zh: `组织架构图在屏幕上展开。

你看了一会儿，大致理解了规则。部门管理——这件事你不排斥，但也不觉得特别兴奋。协调人员和分配资源对你来说是一种技能，不是一种冲动。

你站在部门主管的位置旁边，看了看那些待办任务。也许你可以提供一些建议，但全面接管一个部门的日常运转——你不确定自己有那个热情。

Adrian 问：「你来吗？」你犹豫了一下。`,

        en: `The organizational chart unfolds on the screen.

You watch for a while and roughly understand the rules. Department management — you don't resist, but you're not particularly excited either. Coordinating people and allocating resources is a skill to you, not an impulse.

You stand beside the department head's seat, looking at the task backlog. Maybe you can offer some advice, but taking over a department's daily operations — you're not sure you have that passion.

Adrian asks: "You in?" You hesitate.`,

        nl: `Het organogram ontvouwt zich op het scherm.

Je kijkt een tijdje en begrijpt de regels min of meer. Afdelingsbeheer — je verzet je er niet tegen, maar je bent ook niet bijzonder enthousiast. Mensen coördineren en middelen verdelen is een vaardigheid voor je, geen impuls.

Je staat naast de stoel van het afdelingshoofd en bekijkt de takenlijst. Misschien kun je wat advies geven, maar de dagelijkse gang van een afdeling overnemen — je weet niet zeker of je die passie hebt.

Adrian vraagt: "Doe je mee?" Je aarzelt.`,

        de: `Das Organigramm entfaltet sich auf dem Bildschirm.

Du beobachtest eine Weile und verstehst die Regeln ungefähr. Abteilungsleitung — du wehrst dich nicht dagegen, aber besonders aufregend findest du es auch nicht. Leute koordinieren und Ressourcen verteilen ist eine Fähigkeit für dich, kein Drang.

Du stehst neben dem Stuhl des Abteilungsleiters und schaust dir die Aufgabenliste an. Vielleicht kannst du Ratschläge beisteuern, aber den Tagesbetrieb einer Abteilung zu übernehmen — du bist nicht sicher, ob du die nötige Leidenschaft hast.

Adrian fragt: „Bist du dabei?" Du zögerst.`,

        fr: `L'organigramme se déploie sur l'écran.

Tu regardes un moment et comprends à peu près les règles. Gérer un département — tu n'y résistes pas, mais tu n'es pas particulièrement enthousiaste non plus. Coordonner des gens et allouer des ressources est une compétence pour toi, pas une impulsion.

Tu te tiens à côté du siège du chef de département, observant la liste des tâches. Peut-être peux-tu offrir des conseils, mais prendre en charge le fonctionnement quotidien d'un département — tu n'es pas sûr d'avoir cette passion.

Adrian demande : « Tu y vas ? » Tu hésites.`,

        es: `El organigrama se despliega en la pantalla.

Observas un rato y entiendes más o menos las reglas. Gestión de departamento — no te resistes, pero tampoco te entusiasma especialmente. Coordinar personas y asignar recursos es una habilidad para ti, no un impulso.

Estás de pie junto al asiento del jefe de departamento, mirando la lista de tareas pendientes. Tal vez puedas ofrecer algún consejo, pero hacerte cargo de las operaciones diarias de un departamento — no estás seguro de tener esa pasión.

Adrian pregunta: "¿Te animas?" Dudas.`,

        pt: `O organograma se desdobra na tela.

Você observa por um tempo e entende mais ou menos as regras. Gestão de departamento — você não resiste, mas também não se sente particularmente empolgado. Coordenar pessoas e alocar recursos é uma habilidade para você, não um impulso.

Você fica ao lado da cadeira do chefe de departamento, olhando a lista de tarefas pendentes. Talvez possa oferecer conselhos, mas assumir as operações diárias de um departamento — você não tem certeza de que tem essa paixão.

Adrian pergunta: "Você topa?" Você hesita.`,

        it: `L'organigramma si apre sullo schermo.

Guardi per un po' e capisci più o meno le regole. Gestione di dipartimento — non ti opponi, ma non sei nemmeno particolarmente entusiasta. Coordinare persone e allocare risorse è un'abilità per te, non un impulso.

Stai in piedi accanto alla sedia del capo dipartimento, guardando la lista dei compiti arretrati. Forse puoi offrire qualche consiglio, ma assumere le operazioni quotidiane di un dipartimento — non sei sicuro di avere quella passione.

Adrian chiede: "Ci stai?" Esiti.`,

        ru: `Организационная схема разворачивается на экране.

Ты наблюдаешь некоторое время и примерно понимаешь правила. Управление отделом — ты не против, но и не особо воодушевлён. Координировать людей и распределять ресурсы для тебя — навык, не порыв.

Ты стоишь рядом с креслом руководителя отдела, рассматривая список задач. Может быть, ты можешь дать совет, но взять на себя повседневную работу отдела — ты не уверен, что у тебя есть для этого страсть.

Адриан спрашивает: «Ты в деле?» Ты колеблешься.`,

        ja: `組織図が画面に展開される。

しばらく見て、おおよそルールを理解した。部門管理——嫌ではないが、特に興奮するわけでもない。人を調整し資源を配分することはスキルであり、衝動ではない。

部門長の席の横に立ち、未処理タスクの一覧を見ている。助言はできるかもしれないが、部門の日常運営を丸ごと引き受ける——そこまでの情熱があるか確信がない。

エイドリアンが聞く：「やる？」あなたは迷う。`,

        ko: `조직도가 화면에 펼쳐진다.

잠시 지켜보며 대략적인 규칙을 파악한다. 부서 관리 — 거부감은 없지만 특별히 흥분되지도 않는다. 사람을 조율하고 자원을 배분하는 것은 당신에게 기술이지 충동이 아니다.

부서장 자리 옆에 서서 미처리 업무 목록을 본다. 조언을 해줄 수는 있겠지만, 부서의 일상 운영을 통째로 맡는 것은 — 그런 열정이 있는지 확신이 없다.

에이드리안이 묻는다: "할 거야?" 당신은 망설인다.`,
      },
      score2: {
        zh: `部门管理。人员协调。资源分配。

你看着那张组织架构图和下面的人员名单，内心没有什么兴奋感。

管理一个部门——安排人员调度、处理跨组协作、平衡预算——这些事情对你来说不难理解，但真正做起来会消耗你很多能量。你不想把精力花在这上面。

你退后了。让更有管理欲望的人去坐那个位置。`,

        en: `Department management. Personnel coordination. Resource allocation.

You look at the organizational chart and the staffing roster beneath it. No excitement.

Managing a department — scheduling personnel, handling cross-team coordination, balancing budgets — these things aren't hard to understand, but actually doing them would drain a lot of your energy. You'd rather not invest here.

You step back. Let someone with more managerial drive take that seat.`,

        nl: `Afdelingsbeheer. Personeelscoördinatie. Middelenverdeling.

Je kijkt naar het organogram en de personeelslijst eronder. Geen opwinding.

Een afdeling leiden — personeel plannen, afdelingsoverschrijdende samenwerking afhandelen, budgetten balanceren — deze dingen zijn niet moeilijk te begrijpen, maar ze daadwerkelijk doen zou veel van je energie vergen. Je wilt die hier liever niet investeren.

Je stapt achteruit. Laat iemand met meer managementdrive die stoel innemen.`,

        de: `Abteilungsleitung. Personalkoordination. Ressourcenverteilung.

Du schaust auf das Organigramm und die Personalliste darunter. Keine Aufregung.

Eine Abteilung leiten — Personal einplanen, abteilungsübergreifende Zusammenarbeit handhaben, Budgets ausbalancieren — diese Dinge sind nicht schwer zu verstehen, aber sie tatsächlich zu tun würde viel Energie kosten. Du möchtest hier lieber nicht investieren.

Du trittst zurück. Lass jemanden mit mehr Managementantrieb diesen Platz einnehmen.`,

        fr: `Gestion de département. Coordination du personnel. Allocation de ressources.

Tu regardes l'organigramme et la liste du personnel en dessous. Aucune excitation.

Gérer un département — planifier le personnel, gérer la coordination interservices, équilibrer les budgets — ces choses ne sont pas difficiles à comprendre, mais les faire réellement drainerait beaucoup de ton énergie. Tu préfères ne pas investir ici.

Tu recules. Laisse quelqu'un avec plus d'élan managérial prendre ce siège.`,

        es: `Gestión de departamento. Coordinación de personal. Asignación de recursos.

Miras el organigrama y la lista de personal debajo. Sin emoción.

Dirigir un departamento — programar personal, gestionar la coordinación entre equipos, equilibrar presupuestos — estas cosas no son difíciles de entender, pero hacerlas realmente consumiría mucha de tu energía. Preferirías no invertir aquí.

Te retiras. Que alguien con más impulso gerencial ocupe ese asiento.`,

        pt: `Gestão de departamento. Coordenação de pessoal. Alocação de recursos.

Você olha o organograma e a lista de pessoal abaixo. Nenhuma empolgação.

Gerenciar um departamento — escalar pessoal, coordenar entre equipes, equilibrar orçamentos — essas coisas não são difíceis de entender, mas fazê-las de fato drenaria muita energia. Você prefere não investir aqui.

Você recua. Deixe alguém com mais impulso gerencial ocupar aquele lugar.`,

        it: `Gestione del dipartimento. Coordinamento del personale. Allocazione delle risorse.

Guardi l'organigramma e la lista del personale sotto. Nessuna eccitazione.

Gestire un dipartimento — programmare il personale, gestire il coordinamento tra team, bilanciare i budget — queste cose non sono difficili da capire, ma farle davvero prosciugherebbe molta della tua energia. Preferisci non investire qui.

Ti fai indietro. Lascia che qualcuno con più spinta manageriale occupi quel posto.`,

        ru: `Управление отделом. Координация персонала. Распределение ресурсов.

Ты смотришь на организационную схему и список сотрудников под ней. Никакого воодушевления.

Управлять отделом — составлять графики персонала, координировать межкомандное взаимодействие, балансировать бюджеты — всё это не сложно понять, но реальное выполнение отнимет много энергии. Ты предпочитаешь не вкладываться сюда.

Ты отступаешь. Пусть тот, у кого больше управленческого драйва, займёт это место.`,

        ja: `部門管理。人員調整。資源配分。

組織図とその下の人員リストを見る。興奮はない。

部門を管理する——人員のスケジュール調整、チーム間の連携対応、予算のバランス取り——これらは理解するのは難しくないが、実際にやるとエネルギーを大量に消耗する。ここに力を注ぎたくない。

一歩下がる。管理への意欲がもっとある人にあの席を任せよう。`,

        ko: `부서 관리. 인원 조율. 자원 배분.

조직도와 그 아래 인원 명단을 본다. 흥분은 없다.

부서를 관리하는 것 — 인력 스케줄링, 팀 간 조율, 예산 균형 맞추기 — 이해하기 어렵지 않지만, 실제로 하면 에너지가 많이 소모된다. 여기에 투자하고 싶지 않다.

뒤로 물러난다. 관리에 더 의욕이 있는 사람에게 저 자리를 맡기자.`,
      },
      score1: {
        zh: `组织架构图。部门管理。人员协调。

你看了一眼那张图，没有产生任何想坐到主管位置的冲动。

协调团队、分配预算、设定优先级——这些活动和你之间没有连接。不是你不懂管理——是这种「对一整个部门的运转负全责」的角色，完全不在你的兴趣范围内。

你站在后面。Adrian 或者别人会去做这件事。`,

        en: `Organizational chart. Department management. Personnel coordination.

You glance at the chart and feel zero impulse to take the seat.

Coordinating teams, allocating budgets, setting priorities — these activities have no connection to you. Not that you can't understand management — it's that "being fully responsible for running a department" is simply outside your interest.

You stand in the back. Adrian or someone else will take this.`,

        nl: `Organogram. Afdelingsbeheer. Personeelscoördinatie.

Je werpt een blik op het schema en voelt nul aandrang om in die stoel te gaan zitten.

Teams coördineren, budgetten verdelen, prioriteiten stellen — deze activiteiten hebben geen connectie met jou. Niet dat je management niet begrijpt — het is dat "de volledige verantwoordelijkheid dragen voor het runnen van een afdeling" simpelweg buiten je interesse valt.

Je staat achterin. Adrian of iemand anders zal dit op zich nemen.`,

        de: `Organigramm. Abteilungsleitung. Personalkoordination.

Du wirfst einen Blick auf das Diagramm und verspürst null Impuls, dich auf den Stuhl zu setzen.

Teams koordinieren, Budgets verteilen, Prioritäten setzen — diese Aktivitäten haben keine Verbindung zu dir. Nicht dass du Management nicht verstehst — es ist, dass „die volle Verantwortung für den Betrieb einer Abteilung tragen" schlicht außerhalb deines Interesses liegt.

Du stehst hinten. Adrian oder jemand anderes wird das übernehmen.`,

        fr: `Organigramme. Gestion de département. Coordination du personnel.

Tu jettes un œil au schéma et ne ressens aucune envie de t'asseoir à cette place.

Coordonner des équipes, allouer des budgets, définir des priorités — ces activités n'ont aucun lien avec toi. Ce n'est pas que tu ne comprends pas le management — c'est que « assumer la pleine responsabilité du fonctionnement d'un département » est simplement hors de ton intérêt.

Tu restes au fond. Adrian ou quelqu'un d'autre s'en chargera.`,

        es: `Organigrama. Gestión de departamento. Coordinación de personal.

Echas un vistazo al diagrama y sientes cero impulso de sentarte en esa silla.

Coordinar equipos, asignar presupuestos, establecer prioridades — estas actividades no tienen conexión contigo. No es que no entiendas la gestión — es que "asumir la responsabilidad total de dirigir un departamento" simplemente está fuera de tu interés.

Te quedas al fondo. Adrian o alguien más se encargará de esto.`,

        pt: `Organograma. Gestão de departamento. Coordenação de pessoal.

Você olha o diagrama e sente zero impulso de sentar naquela cadeira.

Coordenar equipes, alocar orçamentos, definir prioridades — essas atividades não têm conexão com você. Não é que você não entenda gestão — é que "assumir total responsabilidade pelo funcionamento de um departamento" simplesmente está fora do seu interesse.

Você fica no fundo. Adrian ou outra pessoa vai assumir isso.`,

        it: `Organigramma. Gestione del dipartimento. Coordinamento del personale.

Dai un'occhiata al diagramma e non senti nessun impulso di sederti su quella sedia.

Coordinare team, allocare budget, stabilire priorità — queste attività non hanno connessione con te. Non che tu non capisca il management — è che "assumersi la piena responsabilità di far funzionare un dipartimento" è semplicemente fuori dal tuo interesse.

Resti in fondo. Adrian o qualcun altro se ne occuperà.`,

        ru: `Организационная схема. Управление отделом. Координация персонала.

Ты бросаешь взгляд на схему и не чувствуешь ни малейшего желания сесть в это кресло.

Координировать команды, распределять бюджеты, устанавливать приоритеты — эти действия не имеют к тебе никакого отношения. Не то чтобы ты не понимал управление — просто «нести полную ответственность за работу отдела» находится за пределами твоих интересов.

Ты стоишь позади. Адриан или кто-то другой займётся этим.`,

        ja: `組織図。部門管理。人員調整。

図をちらりと見て、あの席に座りたいという衝動をまったく感じない。

チームの調整、予算配分、優先順位の設定——これらの活動はあなたとは無縁だ。マネジメントが理解できないわけではない。「部門全体の運営に全責任を負う」ということ自体が、単に興味の範囲外なのだ。

後ろに立っている。エイドリアンか他の誰かがやるだろう。`,

        ko: `조직도. 부서 관리. 인원 조율.

도표를 흘끗 보지만 저 자리에 앉고 싶은 충동은 전혀 없다.

팀 조율, 예산 배분, 우선순위 설정 — 이런 활동들은 당신과 연결점이 없다. 관리를 이해 못하는 게 아니다 — "부서 전체의 운영에 전적인 책임을 지는 것" 자체가 관심 밖이다.

뒤에 서 있는다. 에이드리안이나 다른 누군가가 할 것이다.`,
      },
    },
  },

  {
    id: 22,
    riasec: "E",
    miniIpCode: "E3",
    miniIpItem: "Negotiate business contracts",
    chapter: "negotiation",
    chapterIndex: 5,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `部门运转起来了。资源开始流动。

然后屏幕出现了一条没人预料到的新规则：
「第二轮：合同谈判。两支队伍需就一份资源共享合同达成协议。条款包括：分配比例、合作期限、违约责任、争议解决。双方必须在限定时间内签署，否则都失去本轮奖励。」

一张谈判桌从地面升起，两侧各有座位。桌上是一份空白合同模板，条款栏里全是待填写的数字和选项。

这不是讨价还价——需要有人代表己方谈判每一个条款：什么对我们有利，什么可以让步，什么是底线，怎么在对方满意的前提下最大化己方利益。

Adrian 说：「这是正式谈判。不是聊天。」他转头：「谁去谈？」`,

      en: `The departments are running. Resources are flowing.

Then the screen shows a rule no one expected:
"Round Two: Contract Negotiation. The two teams must reach agreement on a resource-sharing contract. Terms include: allocation ratios, cooperation duration, breach penalties, dispute resolution. Both sides must sign within the time limit, or both teams forfeit this round's bonus."

A negotiation table rises from the floor, seats on both sides. On the table sits a blank contract template — the clause fields are empty numbers and options waiting to be filled.

This isn't haggling — someone needs to negotiate every clause on behalf of your side: what benefits us, what we can concede, where the bottom line is, how to maximize our interests while keeping the other side satisfied enough to sign.

Adrian says: "Formal negotiation. Not small talk." He turns: "Who's going to the table?"`,

      nl: `De afdelingen draaien. Grondstoffen stromen.

Dan toont het scherm een regel die niemand verwachtte:
"Ronde Twee: Contractonderhandeling. De twee teams moeten overeenstemming bereiken over een grondstofdeelcontract. Contractvoorwaarden omvatten: verdeelratio's, samenwerkingsduur, boeteclausules, geschillenbeslechting. Beide partijen moeten binnen de tijdslimiet tekenen, anders verliezen beide teams de bonus van deze ronde."

Een onderhandelingstafel rijst op uit de vloer, stoelen aan beide kanten. Op de tafel ligt een blanco contractsjabloon — de clausulevelden zijn allemaal lege cijfers en opties die ingevuld moeten worden.

Dit is geen simpel onderhandelen — iemand moet elke clausule namens jouw kant bespreken: wat ons ten goede komt, wat we kunnen toegeven, waar de bodem ligt, hoe we onze belangen maximaliseren terwijl de andere partij tevreden genoeg blijft om te tekenen.

Adrian zegt: "Dit is formele onderhandeling. Geen praatje." Hij draait zich om: "Wie gaat aan tafel?"`,

      de: `Die Abteilungen laufen. Ressourcen fließen.

Dann zeigt der Bildschirm eine Regel, die niemand erwartet hat:
„Runde Zwei: Vertragsverhandlung. Die zwei Teams müssen sich auf einen Ressourcenteilungsvertrag einigen. Vertragsbedingungen umfassen: Verteilungsquoten, Kooperationsdauer, Vertragsstrafen, Streitbeilegungsmechanismen. Beide Seiten müssen innerhalb des Zeitlimits unterschreiben, sonst verlieren beide Teams den Bonus dieser Runde."

Ein Verhandlungstisch erhebt sich aus dem Boden, Stühle auf beiden Seiten. Auf dem Tisch liegt eine leere Vertragsvorlage — die Klauselfelder sind alles leere Zahlen und Optionen, die ausgefüllt werden müssen.

Das ist kein einfaches Feilschen — jemand muss jede Klausel im Namen eurer Seite verhandeln: Was nützt uns, was können wir zugestehen, wo ist die Untergrenze, wie maximieren wir unsere Interessen, während die andere Seite zufrieden genug bleibt, um zu unterschreiben.

Adrian sagt: „Das ist eine formelle Verhandlung. Kein Smalltalk." Er dreht sich um: „Wer geht an den Tisch?"`,

      fr: `Les départements tournent. Les ressources circulent.

Puis l'écran affiche une règle que personne n'attendait :
« Deuxième tour : Négociation de contrat. Les deux équipes doivent parvenir à un accord sur un contrat de partage de ressources. Les termes incluent : ratios d'allocation, durée de coopération, pénalités de rupture, mécanismes de résolution des litiges. Les deux parties doivent signer dans le temps imparti, sinon les deux équipes perdent le bonus de ce tour. »

Une table de négociation émerge du sol, des sièges de chaque côté. Sur la table repose un modèle de contrat vierge — les champs des clauses sont tous des chiffres et options vides à remplir.

Ce n'est pas du simple marchandage — quelqu'un doit négocier chaque clause au nom de votre camp : ce qui nous avantage, ce qu'on peut concéder, où se trouve la ligne rouge, comment maximiser nos intérêts tout en gardant l'autre partie suffisamment satisfaite pour signer.

Adrian dit : « C'est une négociation formelle. Pas de la causette. » Il se tourne : « Qui va à la table ? »`,

      es: `Los departamentos funcionan. Los recursos fluyen.

Entonces la pantalla muestra una regla que nadie esperaba:
"Ronda Dos: Negociación de Contrato. Los dos equipos deben llegar a un acuerdo sobre un contrato de distribución de recursos. Los términos incluyen: ratios de asignación, duración de la cooperación, penalizaciones por incumplimiento, mecanismos de resolución de disputas. Ambas partes deben firmar dentro del límite de tiempo, o ambos equipos pierden el bono de esta ronda."

Una mesa de negociación se alza del suelo, asientos a ambos lados. Sobre la mesa hay una plantilla de contrato en blanco — los campos de las cláusulas son todos números y opciones vacías esperando ser completados.

Esto no es simple regateo — alguien necesita negociar cada cláusula en nombre de tu lado: qué nos beneficia, qué podemos ceder, dónde está la línea roja, cómo maximizar nuestros intereses manteniendo al otro lado suficientemente satisfecho para firmar.

Adrian dice: "Esto es negociación formal. No charla." Se vuelve: "¿Quién va a la mesa?"`,

      pt: `Os departamentos estão funcionando. Os recursos estão fluindo.

Então a tela mostra uma regra que ninguém esperava:
"Segunda Rodada: Negociação de Contrato. As duas equipes devem chegar a um acordo sobre um contrato de compartilhamento de recursos. Os termos incluem: proporções de alocação, duração da cooperação, penalidades por descumprimento, mecanismos de resolução de disputas. Ambos os lados devem assinar dentro do limite de tempo, ou ambas as equipes perdem o bônus desta rodada."

Uma mesa de negociação emerge do chão, assentos dos dois lados. Sobre a mesa está um modelo de contrato em branco — os campos das cláusulas são todos números e opções vazios esperando para serem preenchidos.

Isso não é simples pechincha — alguém precisa negociar cada cláusula em nome do seu lado: o que nos beneficia, o que podemos ceder, onde está a linha de fundo, como maximizar nossos interesses mantendo o outro lado satisfeito o suficiente para assinar.

Adrian diz: "Isso é negociação formal. Não é conversa fiada." Ele se vira: "Quem vai à mesa?"`,

      it: `I dipartimenti funzionano. Le risorse fluiscono.

Poi lo schermo mostra una regola che nessuno si aspettava:
"Secondo turno: Negoziazione del contratto. Le due squadre devono raggiungere un accordo su un contratto di condivisione delle risorse. I termini includono: rapporti di allocazione, durata della cooperazione, penali per inadempimento, meccanismi di risoluzione delle controversie. Entrambe le parti devono firmare entro il limite di tempo, altrimenti entrambe le squadre perdono il bonus di questo turno."

Un tavolo negoziale emerge dal pavimento, posti a sedere su entrambi i lati. Sul tavolo c'è un modello di contratto vuoto — i campi delle clausole sono tutti numeri e opzioni vuote da compilare.

Non è semplice contrattazione — qualcuno deve negoziare ogni clausola per conto del proprio schieramento: cosa ci avvantaggia, cosa possiamo concedere, dov'è il limite, come massimizzare i nostri interessi mantenendo l'altra parte abbastanza soddisfatta da firmare.

Adrian dice: "Questa è negoziazione formale. Non chiacchiere." Si gira: "Chi va al tavolo?"`,

      ru: `Отделы работают. Ресурсы текут.

Затем на экране появляется правило, которого никто не ожидал:
«Второй раунд: Переговоры по контракту. Две команды должны договориться о контракте совместного использования ресурсов. Условия включают: пропорции распределения, срок сотрудничества, штрафные санкции, механизмы разрешения споров. Обе стороны должны подписать в отведённое время, иначе обе команды теряют бонус этого раунда.»

Из пола поднимается стол переговоров, стулья с обеих сторон. На столе лежит пустой шаблон контракта — поля условий заполнены пустыми цифрами и вариантами, ждущими заполнения.

Это не простой торг — кто-то должен обсудить каждое условие от имени своей стороны: что нам выгодно, в чём можно уступить, где красная линия, как максимизировать наши интересы, сохраняя другую сторону достаточно довольной для подписания.

Адриан говорит: «Это формальные переговоры. Не болтовня.» Он оборачивается: «Кто идёт за стол?»`,

      ja: `部門が稼働し始めた。資源が流れている。

すると画面に、誰も予想していなかったルールが表示される：
「第2ラウンド：契約交渉。2つのチームは資源共有契約について合意に達する必要があります。契約条件には、配分比率、協力期間、違約罰則、紛争解決メカニズムが含まれます。制限時間内に両者が署名しなければ、両チームとも本ラウンドのボーナスを失います。」

床から交渉テーブルがせり上がる、両側に席がある。テーブルの上には白紙の契約テンプレート——条項欄はすべて空白の数字と選択肢が記入を待っている。

これは単純な値引き交渉ではない——誰かが自チーム側を代表してすべての条項を交渉する必要がある：何が我々に有利か、何を譲歩できるか、最低ラインはどこか、相手側が署名に満足する範囲で自チームの利益をどう最大化するか。

エイドリアンが言う：「これは正式な交渉だ。雑談じゃない。」彼は振り返る：「誰がテーブルに行く？」`,

      ko: `부서들이 돌아가고 있다. 자원이 흐르고 있다.

그러자 화면에 아무도 예상하지 못한 규칙이 표시된다:
"2라운드: 계약 협상. 두 팀은 자원 공유 계약에 합의해야 합니다. 계약 조건에는 배분 비율, 협력 기간, 위약 벌칙, 분쟁 해결 메커니즘이 포함됩니다. 제한 시간 내에 양측이 서명하지 않으면 두 팀 모두 이번 라운드 보너스를 잃습니다."

바닥에서 협상 테이블이 솟아오른다, 양쪽에 자리가 있다. 테이블 위에는 빈 계약서 템플릿이 놓여 있다 — 조항 칸에는 채워야 할 빈 숫자와 옵션만 있다.

이것은 단순한 흥정이 아니다 — 누군가 자기 팀을 대표하여 모든 조항을 협상해야 한다: 무엇이 우리에게 유리한지, 무엇을 양보할 수 있는지, 최저선은 어디인지, 상대가 서명할 만큼 만족하면서도 우리의 이익을 어떻게 극대화할 것인지.

에이드리안이 말한다: "이건 정식 협상이야. 잡담이 아니라." 그가 돌아본다: "누가 테이블에 갈 거야?"`,
    },
    taskDescription: {
      zh: "代表你的队伍与对方谈判资源共享合同——分析条款利弊、提出方案、处理分歧、争取最有利的合同条件。这项任务需要一个主要负责人。",

      en: `Negotiate the resource-sharing contract on behalf of your team — analyze clause trade-offs, propose terms, handle disagreements, secure the most favorable contract conditions. This task needs one primary person.`,

      nl: "Onderhandel het grondstofdeelcontract namens je team — analyseer de voor- en nadelen van elke clausule, stel voorwaarden voor, behandel meningsverschillen, zeker de gunstigste contractvoorwaarden. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Verhandle den Ressourcenteilungsvertrag im Namen deines Teams — analysiere Klausel-Abwägungen, schlage Bedingungen vor, bearbeite Meinungsverschiedenheiten, sichere die günstigsten Vertragsbedingungen. Diese Aufgabe braucht eine Hauptperson.",

      fr: "Négociez le contrat de partage de ressources au nom de votre équipe — analysez les compromis de chaque clause, proposez des termes, gérez les désaccords, obtenez les conditions contractuelles les plus favorables. Cette tâche nécessite un responsable principal.",

      es: "Negocia el contrato de distribución de recursos en nombre de tu equipo — analiza las ventajas y desventajas de cada cláusula, propón términos, maneja los desacuerdos, asegura las condiciones contractuales más favorables. Esta tarea necesita un responsable principal.",

      pt: "Negocie o contrato de compartilhamento de recursos em nome da sua equipe — analise as vantagens e desvantagens de cada cláusula, proponha termos, lide com divergências, garanta as condições contratuais mais favoráveis. Esta tarefa precisa de um responsável principal.",

      it: "Negozia il contratto di condivisione delle risorse per conto della tua squadra — analizza i compromessi di ogni clausola, proponi condizioni, gestisci i disaccordi, assicura le condizioni contrattuali più favorevoli. Questo compito richiede un responsabile principale.",

      ru: "Ведите переговоры по контракту совместного использования ресурсов от имени вашей команды — анализируйте компромиссы каждого условия, предлагайте условия, разрешайте разногласия, обеспечьте наиболее выгодные контрактные условия. Для этой задачи нужен один главный ответственный.",

      ja: "チームを代表して資源共有契約を交渉する——各条項の得失を分析し、条件を提案し、意見の相違に対処し、最も有利な契約条件を確保する。この任務には主担当者が一人必要です。",

      ko: "팀을 대표하여 자원 공유 계약을 협상하세요 — 각 조항의 득실을 분석하고, 조건을 제안하고, 이견을 처리하고, 가장 유리한 계약 조건을 확보하세요. 이 임무에는 한 명의 주 담당자가 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `「谁去谈？」

你的回答不是一个词——是一个动作。你直接走到谈判桌前，拿起合同模板，快速浏览了所有条款栏。

你的大脑已经在分析：分配比例这里可以让步一点，但合作期限是我们的核心利益——必须坚守。违约条款对双方要对称，这是说服对方的筹码。

你坐下了。对面的代表也坐下了。你开口了——语气不急不缓，但每一句话都在推进你的立场。

商业谈判——分析条款、权衡利弊、在对抗中找到合作空间——这正好是你最擅长的组合。`,

        en: `"Who's going to the table?"

Your answer isn't a word — it's an action. You walk directly to the negotiation table, pick up the contract template, and scan every clause field.

Your mind is already analyzing: the allocation ratio — room to concede a little here. But cooperation duration is our core interest — must hold firm. Breach penalties should be symmetrical — that's leverage to persuade the other side.

You sit down. The opposing representative sits too. You open — tone measured but deliberate, every sentence advancing your position.

Contract negotiation — analyzing clauses, weighing trade-offs, finding cooperation space within competition — these things combined are exactly your strongest suite.`,

        nl: `"Wie gaat aan tafel?"

Je antwoord is geen woord — het is een actie. Je loopt direct naar de onderhandelingstafel, pakt het contractsjabloon en scant elke clausule.

Je brein analyseert al: de verdeelratio — hier wat ruimte om toe te geven. Maar samenwerkingsduur is ons kernbelang — moet standhouden. Boeteclausules moeten symmetrisch zijn — dat is hefboom om de andere kant te overtuigen.

Je gaat zitten. De vertegenwoordiger aan de overkant ook. Je opent — toon beheerst maar doelgericht, elke zin schuift je positie vooruit.

Contractonderhandeling — clausules analyseren, afwegingen maken, samenwerkingsruimte vinden binnen competitie — deze dingen samen zijn precies jouw sterkste combinatie.`,

        de: `„Wer geht an den Tisch?"

Deine Antwort ist kein Wort — es ist eine Handlung. Du gehst direkt zum Verhandlungstisch, nimmst die Vertragsvorlage und überfliegst jede Klausel.

Dein Verstand analysiert bereits: die Verteilungsquote — hier etwas Spielraum zum Zugestehen. Aber die Kooperationsdauer ist unser Kerninteresse — muss gehalten werden. Vertragsstrafen sollten symmetrisch sein — das ist Verhandlungsmasse.

Du setzt dich. Der Vertreter der Gegenseite auch. Du eröffnest — Ton beherrscht aber zielgerichtet, jeder Satz rückt deine Position vor.

Vertragsverhandlung — Klauseln analysieren, Abwägungen treffen, Kooperationsraum im Wettbewerb finden — diese Dinge zusammen sind genau deine stärkste Kombination.`,

        fr: `« Qui va à la table ? »

Ta réponse n'est pas un mot — c'est une action. Tu marches directement vers la table de négociation, prends le modèle de contrat et parcours chaque clause.

Ton esprit analyse déjà : le ratio d'allocation — de la marge pour concéder ici. Mais la durée de coopération est notre intérêt fondamental — il faut tenir bon. Les pénalités de rupture doivent être symétriques — c'est un levier pour convaincre l'autre côté.

Tu t'assieds. Le représentant adverse aussi. Tu ouvres — ton mesuré mais délibéré, chaque phrase fait avancer ta position.

Négociation de contrat — analyser les clauses, peser les compromis, trouver un espace de coopération dans la compétition — ces choses combinées sont exactement ta plus grande force.`,

        es: `"¿Quién va a la mesa?"

Tu respuesta no es una palabra — es una acción. Caminas directamente a la mesa de negociación, tomas la plantilla del contrato y escaneas cada cláusula.

Tu mente ya está analizando: el ratio de asignación — aquí hay margen para ceder un poco. Pero la duración de la cooperación es nuestro interés central — hay que mantenerlo firme. Las penalizaciones por incumplimiento deben ser simétricas — eso es palanca para convencer al otro lado.

Te sientas. El representante contrario también. Abres — tono mesurado pero deliberado, cada frase avanzando tu posición.

Negociación de contratos — analizar cláusulas, sopesar compromisos, encontrar espacio de cooperación dentro de la competencia — estas cosas combinadas son exactamente tu mayor fortaleza.`,

        pt: `"Quem vai à mesa?"

Sua resposta não é uma palavra — é uma ação. Você vai direto à mesa de negociação, pega o modelo de contrato e passa os olhos por cada cláusula.

Sua mente já está analisando: a proporção de alocação — margem para ceder um pouco aqui. Mas a duração da cooperação é nosso interesse central — deve ser mantida firme. Penalidades por descumprimento devem ser simétricas — isso é poder de barganha para convencer o outro lado.

Você senta. O representante adversário também. Você abre — tom medido mas deliberado, cada frase avançando sua posição.

Negociação de contrato — analisar cláusulas, pesar compromissos, encontrar espaço de cooperação na competição — essas coisas combinadas são exatamente sua maior força.`,

        it: `"Chi va al tavolo?"

La tua risposta non è una parola — è un'azione. Vai direttamente al tavolo negoziale, prendi il modello di contratto e scorri ogni clausola.

La tua mente sta già analizzando: il rapporto di allocazione — qui c'è margine per concedere un po'. Ma la durata della cooperazione è il nostro interesse fondamentale — va tenuto fermo. Le penali per inadempimento devono essere simmetriche — questa è leva per convincere l'altra parte.

Ti siedi. Il rappresentante avversario anche. Apri — tono misurato ma deliberato, ogni frase fa avanzare la tua posizione.

Negoziazione contrattuale — analizzare clausole, soppesare compromessi, trovare spazio di cooperazione nella competizione — queste cose insieme sono esattamente la tua combinazione più forte.`,

        ru: `«Кто идёт за стол?»

Твой ответ — не слово, а действие. Ты идёшь прямо к столу переговоров, берёшь шаблон контракта и пробегаешь глазами каждое условие.

Твой разум уже анализирует: пропорция распределения — здесь есть пространство для уступки. Но срок сотрудничества — наш ключевой интерес, его надо отстоять. Штрафные санкции должны быть симметричными — это рычаг для убеждения другой стороны.

Ты садишься. Представитель другой стороны тоже. Ты начинаешь — тон выверенный, но целенаправленный, каждая фраза продвигает твою позицию.

Переговоры по контракту — анализировать условия, взвешивать компромиссы, находить пространство для сотрудничества в конкуренции — всё это вместе и есть твоя сильнейшая комбинация.`,

        ja: `「誰がテーブルに行く？」

あなたの答えは言葉ではない——行動だ。直接交渉テーブルに歩み寄り、契約テンプレートを手に取り、すべての条項欄をスキャンする。

頭はもう分析を始めている：配分比率——ここは少し譲歩する余地がある。だが協力期間は我々の核心利益——堅持しなければならない。違約罰則は対称的であるべき——それが相手を説得するための切り札だ。

座る。相手側の代表も座る。口を開く——トーンは落ち着いているが意図的で、一言一句が自分の立場を前進させる。

契約交渉——条項の分析、トレードオフの評価、競争の中に協力の余地を見出す——これらが組み合わさったものが、まさにあなたの最強の組み合わせだ。`,

        ko: `"누가 테이블에 갈 거야?"

당신의 대답은 말이 아니라 행동이다. 곧바로 협상 테이블로 가서 계약서 템플릿을 집어 들고 모든 조항을 훑는다.

머리가 이미 분석하고 있다: 배분 비율 — 여기서 조금 양보할 여지가 있다. 하지만 협력 기간은 우리의 핵심 이익 — 반드시 지켜야 한다. 위약 벌칙은 대칭적이어야 한다 — 그것이 상대를 설득하는 지렛대다.

앉는다. 상대 대표도 앉는다. 입을 연다 — 톤은 절제되어 있지만 의도적이며, 모든 문장이 자신의 입장을 전진시킨다.

계약 협상 — 조항 분석, 득실 저울질, 경쟁 속에서 협력 공간 찾기 — 이것들이 합쳐진 것이 바로 당신의 최강 조합이다.`,
      },
      score4: {
        zh: `合同谈判。条款分析。利益博弈。

你深吸一口气，走到谈判桌前。不是因为你觉得自己最合适——是因为你觉得你做得了。

你拿起合同模板，花了十秒浏览条款栏。然后你开始和对方代表交涉。

第一个条款谈下来的时候，你感觉到了一种确定感——你知道哪里可以让步，哪里必须坚守。对方提出了反条件，你听完了，找到了可以交换的筹码，回应了。

不是最完美的谈判，但足够有效。Adrian 在后面微微点了点头。`,

        en: `Contract negotiation. Clause analysis. Strategic trade-offs.

You take a deep breath and walk to the negotiation table. Not because you think you're the best fit — because you think you can handle it.

You pick up the contract template and spend ten seconds scanning the clause fields. Then you begin negotiating with the opposing representative.

When the first clause is settled, you feel certainty — you know where to concede and where to hold firm. The other side proposes counter-terms. You listen through, find tradeable leverage, and respond.

Not the most polished negotiation, but effective enough. Adrian behind you gives a slight nod.`,

        nl: `Contractonderhandeling. Clausule-analyse. Strategische afwegingen.

Je haalt diep adem en loopt naar de onderhandelingstafel. Niet omdat je denkt dat je het best past — omdat je denkt dat je het aankunt.

Je pakt het contractsjabloon en besteedt tien seconden aan het scannen van de clausulevelden. Dan begin je te onderhandelen met de vertegenwoordiger aan de overkant.

Als de eerste clausule is afgehandeld, voel je zekerheid — je weet waar je kunt toegeven en waar je moet vasthouden. De andere kant stelt tegenvoorwaarden voor. Je luistert, vindt verhandelbare hefbomen, en reageert.

Niet de meest gepolijste onderhandeling, maar effectief genoeg. Adrian achter je knikt licht.`,

        de: `Vertragsverhandlung. Klauselanalyse. Strategische Abwägungen.

Du atmest tief ein und gehst zum Verhandlungstisch. Nicht weil du denkst, du passt am besten — weil du denkst, du schaffst das.

Du nimmst die Vertragsvorlage und verbringst zehn Sekunden damit, die Klauselfelder zu überfliegen. Dann fängst du an, mit dem Vertreter der Gegenseite zu verhandeln.

Als die erste Klausel steht, spürst du Gewissheit — du weißt, wo du nachgeben kannst und wo du standhalten musst. Die andere Seite schlägt Gegenbedingungen vor. Du hörst zu, findest verhandelbare Hebel und antwortest.

Nicht die eleganteste Verhandlung, aber effektiv genug. Adrian hinter dir nickt leicht.`,

        fr: `Négociation de contrat. Analyse des clauses. Compromis stratégiques.

Tu inspires profondément et marches vers la table de négociation. Pas parce que tu penses être le plus adapté — parce que tu penses pouvoir y arriver.

Tu prends le modèle de contrat et passes dix secondes à scanner les champs de clauses. Puis tu commences à négocier avec le représentant adverse.

Quand la première clause est réglée, tu ressens de la certitude — tu sais où céder et où tenir bon. L'autre côté propose des contre-conditions. Tu écoutes, trouves des leviers négociables, et réponds.

Pas la négociation la plus raffinée, mais assez efficace. Adrian derrière toi hoche légèrement la tête.`,

        es: `Negociación de contratos. Análisis de cláusulas. Concesiones estratégicas.

Respiras hondo y caminas a la mesa de negociación. No porque creas que eres el más adecuado — porque crees que puedes manejarlo.

Tomas la plantilla del contrato y dedicas diez segundos a escanear los campos de cláusulas. Luego comienzas a negociar con el representante contrario.

Cuando la primera cláusula queda cerrada, sientes certeza — sabes dónde ceder y dónde mantener la posición. El otro lado propone contracondiciones. Escuchas, encuentras palancas negociables y respondes.

No la negociación más pulida, pero suficientemente efectiva. Adrian detrás de ti asiente ligeramente.`,

        pt: `Negociação de contrato. Análise de cláusulas. Concessões estratégicas.

Você respira fundo e caminha até a mesa de negociação. Não porque acha que é o mais adequado — porque acha que consegue lidar com isso.

Pega o modelo de contrato e gasta dez segundos escaneando os campos de cláusulas. Então começa a negociar com o representante adversário.

Quando a primeira cláusula é fechada, você sente certeza — sabe onde ceder e onde manter firme. O outro lado propõe contra-termos. Você ouve, encontra alavancas negociáveis e responde.

Não a negociação mais polida, mas eficaz o bastante. Adrian atrás de você dá um leve aceno.`,

        it: `Negoziazione contrattuale. Analisi delle clausole. Compromessi strategici.

Fai un respiro profondo e cammini verso il tavolo negoziale. Non perché pensi di essere il più adatto — perché pensi di potercela fare.

Prendi il modello di contratto e dedichi dieci secondi a scorrere i campi delle clausole. Poi cominci a negoziare con il rappresentante avversario.

Quando la prima clausola è definita, senti certezza — sai dove concedere e dove tenere duro. L'altra parte propone controcondizioni. Ascolti, trovi leve negoziabili e rispondi.

Non la negoziazione più raffinata, ma abbastanza efficace. Adrian dietro di te annuisce leggermente.`,

        ru: `Переговоры по контракту. Анализ условий. Стратегические уступки.

Ты глубоко вдыхаешь и подходишь к столу переговоров. Не потому что считаешь себя лучшим кандидатом — потому что считаешь, что справишься.

Берёшь шаблон контракта и тратишь десять секунд, пробегая глазами условия. Потом начинаешь переговоры с представителем другой стороны.

Когда первое условие согласовано, ты чувствуешь уверенность — знаешь, где можно уступить и где нужно стоять твёрдо. Другая сторона выдвигает встречные условия. Ты слушаешь, находишь рычаги для обмена и отвечаешь.

Не самые отточенные переговоры, но достаточно результативные. Адриан за тобой слегка кивает.`,

        ja: `契約交渉。条項分析。戦略的トレードオフ。

深呼吸して交渉テーブルに歩み寄る。自分が最適だと思うからではない——やれると思うからだ。

契約テンプレートを手に取り、10秒かけて条項欄をスキャンする。そして相手側の代表と交渉を始める。

最初の条項がまとまったとき、確信を感じる——どこで譲歩でき、どこで堅持すべきか分かっている。相手が対案を出す。最後まで聞き、交換可能なカードを見つけ、応じる。

最も洗練された交渉ではないが、十分に効果的だ。後ろのエイドリアンがわずかにうなずく。`,

        ko: `계약 협상. 조항 분석. 전략적 트레이드오프.

깊이 숨을 쉬고 협상 테이블로 걸어간다. 자신이 가장 적합하다고 생각해서가 아니라 — 해낼 수 있다고 생각하기 때문이다.

계약서 템플릿을 집어 들고 10초 동안 조항 칸을 훑는다. 그리고 상대 대표와 협상을 시작한다.

첫 번째 조항이 합의됐을 때, 확신을 느낀다 — 어디서 양보하고 어디서 버텨야 하는지 안다. 상대가 반대 조건을 제시한다. 끝까지 듣고, 교환할 수 있는 카드를 찾아, 대응한다.

가장 세련된 협상은 아니지만, 충분히 효과적이다. 뒤의 에이드리안이 살짝 고개를 끄덕인다.`,
      },
      score3: {
        zh: `谈判合同条款。

你看了看那张合同模板、那些等待填写的条款栏，心里有一种「这件事我能做但不是最想做」的感觉。

分析条款、权衡利弊、在对手面前据理力争——每一项你都可以参与，但要你全面负责一场正式的合同谈判……你不确定这是你最有热情的事。

你走到谈判桌旁边，准备帮忙。但你不会主动坐下。`,

        en: `Negotiating contract terms.

You look at the contract template, the blank clause fields waiting to be filled, and feel "I could do this but it's not what I most want to do."

Analyzing clauses, weighing trade-offs, arguing your case against an opponent — you could participate in any of these. But taking full responsibility for a formal contract negotiation... you're not sure that's where your passion is.

You walk to the table's edge, ready to help. But you won't take the seat.`,

        nl: `Contractvoorwaarden onderhandelen.

Je kijkt naar het contractsjabloon, de lege clausulevelden, en voelt "ik zou dit kunnen maar het is niet wat ik het liefste doe."

Clausules analyseren, afwegingen maken, je zaak bepleiten tegenover een tegenstander — je zou aan elk ervan kunnen deelnemen. Maar de volledige verantwoordelijkheid nemen voor een formele contractonderhandeling... je weet niet zeker of dat is waar je passie ligt.

Je loopt naar de rand van de tafel, klaar om te helpen. Maar je zult niet gaan zitten.`,

        de: `Vertragsbedingungen verhandeln.

Du schaust auf die Vertragsvorlage, die leeren Klauselfelder, und fühlst: „Ich könnte das, aber es ist nicht das, was ich am meisten will."

Klauseln analysieren, Abwägungen treffen, deine Sache gegen einen Gegner vertreten — du könntest bei jedem davon mitmachen. Aber die volle Verantwortung für eine formelle Vertragsverhandlung übernehmen... du bist nicht sicher, ob das deine Leidenschaft ist.

Du gehst zum Rand des Tisches, bereit zu helfen. Aber du wirst dich nicht setzen.`,

        fr: `Négocier des termes contractuels.

Tu regardes le modèle de contrat, les champs vides des clauses, et tu ressens « je pourrais le faire mais ce n'est pas ce que je veux le plus faire. »

Analyser les clauses, peser les compromis, défendre ta position face à un adversaire — tu pourrais participer à chacun de ces aspects. Mais prendre l'entière responsabilité d'une négociation contractuelle formelle... tu n'es pas sûr que ta passion soit là.

Tu t'approches du bord de la table, prêt à aider. Mais tu ne t'assiéras pas.`,

        es: `Negociar términos contractuales.

Miras la plantilla del contrato, los campos vacíos de las cláusulas, y sientes "podría hacerlo pero no es lo que más quiero hacer."

Analizar cláusulas, sopesar compromisos, defender tu caso frente a un oponente — podrías participar en cualquiera de estos aspectos. Pero asumir la responsabilidad total de una negociación contractual formal... no estás seguro de que ahí esté tu pasión.

Te acercas al borde de la mesa, listo para ayudar. Pero no te sentarás.`,

        pt: `Negociar termos contratuais.

Você olha o modelo de contrato, os campos vazios das cláusulas, e sente "eu poderia fazer isso, mas não é o que mais quero fazer."

Analisar cláusulas, pesar compromissos, defender seu caso contra um oponente — você poderia participar de qualquer um desses aspectos. Mas assumir total responsabilidade por uma negociação contratual formal... você não tem certeza de que é aí que está sua paixão.

Você vai até a borda da mesa, pronto para ajudar. Mas não vai sentar.`,

        it: `Negoziare termini contrattuali.

Guardi il modello di contratto, i campi vuoti delle clausole, e senti "potrei farlo ma non è quello che più voglio fare."

Analizzare clausole, soppesare compromessi, difendere la tua posizione contro un avversario — potresti partecipare a ognuno di questi aspetti. Ma assumerti la piena responsabilità di una negoziazione contrattuale formale... non sei sicuro che sia lì la tua passione.

Ti avvicini al bordo del tavolo, pronto ad aiutare. Ma non ti siederai.`,

        ru: `Обсуждать условия контракта.

Ты смотришь на шаблон контракта, на пустые поля условий, и чувствуешь: «Я мог бы это сделать, но это не то, что мне больше всего хочется.»

Анализировать условия, взвешивать компромиссы, отстаивать свою позицию перед оппонентом — ты мог бы участвовать в любом из этих аспектов. Но взять на себя полную ответственность за формальные переговоры по контракту... ты не уверен, что именно здесь твоя страсть.

Ты подходишь к краю стола, готовый помочь. Но садиться не станешь.`,

        ja: `契約条項の交渉。

契約テンプレート、記入を待つ空白の条項欄を見て、「できるけど、一番やりたいことではない」と感じる。

条項の分析、トレードオフの評価、相手に対して自分の主張を通す——どれにも参加はできる。だが正式な契約交渉の全責任を負う……そこに情熱があるかは確信がない。

テーブルの端まで歩く、手伝う準備はできている。だが席に座ることはしない。`,

        ko: `계약 조건 협상.

계약서 템플릿과 채워야 할 빈 조항 칸을 보며, "할 수는 있지만 가장 하고 싶은 일은 아니다"라고 느낀다.

조항 분석, 득실 저울질, 상대에게 자기 주장 펼치기 — 어느 것이든 참여할 수 있다. 하지만 정식 계약 협상의 전체 책임을 맡는 것은... 거기에 열정이 있는지 확신이 없다.

테이블 가장자리로 걸어간다, 도울 준비는 되어 있다. 하지만 자리에 앉지는 않을 것이다.`,
      },
      score2: {
        zh: `合同条款。利益分配。谈判桌。

你看着那份空白合同和对面等待的代表，内心没有什么兴奋感。

谈判合同条款——分析每一条的得失、据理力争、在对抗中找平衡——这些事情对你来说不难理解，但做起来会消耗你很多能量。你不想把精力花在这上面。

你退后了。让更有谈判欲望的人去坐那个位置。`,

        en: `Contract terms. Benefit allocation. The negotiation table.

You look at the blank contract and the representative waiting across the table. No excitement.

Negotiating contract terms — analyzing the gains and losses of each clause, arguing your position, finding balance through confrontation — these things aren't hard to understand, but doing them would drain a lot of your energy. You'd rather not invest here.

You step back. Let someone with more negotiation drive take that seat.`,

        nl: `Contractvoorwaarden. Verdeling van belangen. De onderhandelingstafel.

Je kijkt naar het lege contract en de vertegenwoordiger die aan de overkant wacht. Geen opwinding.

Contractvoorwaarden onderhandelen — de winst en het verlies van elke clausule analyseren, je standpunt verdedigen, balans vinden door confrontatie — deze dingen zijn niet moeilijk te begrijpen, maar ze zouden veel van je energie vergen. Je wilt die hier liever niet investeren.

Je stapt achteruit. Laat iemand met meer onderhandelingsdrive die plek innemen.`,

        de: `Vertragsbedingungen. Interessenverteilung. Der Verhandlungstisch.

Du schaust auf den leeren Vertrag und den wartenden Vertreter auf der anderen Seite. Keine Aufregung.

Vertragsbedingungen verhandeln — Gewinn und Verlust jeder Klausel analysieren, deine Position vertreten, Balance durch Konfrontation finden — diese Dinge sind nicht schwer zu verstehen, aber sie würden viel Energie kosten. Du möchtest hier lieber nicht investieren.

Du trittst zurück. Lass jemanden mit mehr Verhandlungsantrieb diesen Platz einnehmen.`,

        fr: `Termes contractuels. Répartition des intérêts. La table de négociation.

Tu regardes le contrat vierge et le représentant qui attend de l'autre côté. Aucune excitation.

Négocier des termes contractuels — analyser les gains et les pertes de chaque clause, défendre ta position, trouver l'équilibre par la confrontation — ces choses ne sont pas difficiles à comprendre, mais les faire drainerait beaucoup de ton énergie. Tu préfères ne pas investir ici.

Tu recules. Laisse quelqu'un avec plus d'élan négociateur prendre ce siège.`,

        es: `Términos contractuales. Distribución de intereses. La mesa de negociación.

Miras el contrato en blanco y al representante que espera al otro lado. Sin emoción.

Negociar términos contractuales — analizar las ganancias y pérdidas de cada cláusula, defender tu posición, encontrar equilibrio a través de la confrontación — estas cosas no son difíciles de entender, pero hacerlas consumiría mucha de tu energía. Preferirías no invertir aquí.

Te retiras. Que alguien con más impulso negociador ocupe ese asiento.`,

        pt: `Termos contratuais. Distribuição de interesses. A mesa de negociação.

Você olha o contrato em branco e o representante esperando do outro lado. Nenhuma empolgação.

Negociar termos contratuais — analisar os ganhos e perdas de cada cláusula, defender sua posição, encontrar equilíbrio por meio da confrontação — essas coisas não são difíceis de entender, mas fazê-las drenaria muita energia. Você prefere não investir aqui.

Você recua. Deixe alguém com mais impulso negociador ocupar aquele lugar.`,

        it: `Termini contrattuali. Distribuzione degli interessi. Il tavolo negoziale.

Guardi il contratto vuoto e il rappresentante che aspetta dall'altra parte. Nessuna eccitazione.

Negoziare termini contrattuali — analizzare guadagni e perdite di ogni clausola, difendere la propria posizione, trovare equilibrio attraverso il confronto — queste cose non sono difficili da capire, ma farle prosciugherebbe molta della tua energia. Preferisci non investire qui.

Ti fai indietro. Lascia che qualcuno con più spinta negoziale occupi quel posto.`,

        ru: `Условия контракта. Распределение интересов. Стол переговоров.

Ты смотришь на пустой контракт и представителя, ожидающего по другую сторону. Никакого воодушевления.

Вести переговоры по условиям контракта — анализировать выгоды и потери каждого пункта, отстаивать свою позицию, находить баланс через противостояние — всё это не сложно понять, но выполнение отнимет много энергии. Ты предпочитаешь не вкладываться сюда.

Ты отступаешь. Пусть тот, у кого больше переговорного драйва, займёт это место.`,

        ja: `契約条項。利益配分。交渉テーブル。

空白の契約書と向かい側で待つ代表者を見る。興奮はない。

契約条項の交渉——各条項の損得を分析し、自分の立場を主張し、対立を通じてバランスを見つける——これらは理解するのは難しくないが、実行するとエネルギーを大量に消耗する。ここに力を注ぎたくない。

一歩下がる。交渉への意欲がもっとある人にあの席を任せよう。`,

        ko: `계약 조건. 이익 배분. 협상 테이블.

빈 계약서와 맞은편에서 기다리는 대표를 본다. 흥분은 없다.

계약 조건 협상 — 각 조항의 득실을 분석하고, 자기 입장을 주장하고, 대립을 통해 균형을 찾기 — 이해하기 어렵지 않지만, 실행하면 에너지가 많이 소모된다. 여기에 투자하고 싶지 않다.

뒤로 물러난다. 협상에 더 의욕이 있는 사람에게 저 자리를 맡기자.`,
      },
      score1: {
        zh: `「谁去谈？」

不是你。

合同谈判——分析条款、讨价还价、在对抗中寻找平衡——这些词汇在你脑海里是灰色的。你知道它们很重要，但它们和你之间没有火花。

你站在谈判桌的最远处，等这一轮过去。`,

        en: `"Who's going to the table?"

Not you.

Contract negotiation — analyzing clauses, haggling over terms, finding balance through confrontation — these words sit gray in your mind. You know they matter, but there's no spark between them and you.

You stand at the far end of the room, waiting for this round to pass.`,

        nl: `"Wie gaat aan tafel?"

Jij niet.

Contractonderhandeling — clausules analyseren, over voorwaarden onderhandelen, balans vinden door confrontatie — deze woorden zitten grijs in je hoofd. Je weet dat ze belangrijk zijn, maar er is geen vonk tussen hen en jou.

Je staat aan het verste uiteinde van de kamer, wachtend tot deze ronde voorbij is.`,

        de: `„Wer geht an den Tisch?"

Nicht du.

Vertragsverhandlung — Klauseln analysieren, über Bedingungen feilschen, Balance durch Konfrontation finden — diese Worte sitzen grau in deinem Kopf. Du weißt, dass sie wichtig sind, aber es gibt keinen Funken zwischen ihnen und dir.

Du stehst am anderen Ende des Raumes und wartest, bis diese Runde vorbei ist.`,

        fr: `« Qui va à la table ? »

Pas toi.

Négociation de contrat — analyser les clauses, marchander les termes, trouver l'équilibre par la confrontation — ces mots restent gris dans ton esprit. Tu sais qu'ils comptent, mais aucune étincelle ne jaillit entre eux et toi.

Tu te tiens à l'extrémité de la salle, attendant que ce tour passe.`,

        es: `"¿Quién va a la mesa?"

Tú no.

Negociación de contratos — analizar cláusulas, regatear términos, encontrar equilibrio a través de la confrontación — estas palabras son grises en tu mente. Sabes que importan, pero no hay chispa entre ellas y tú.

Te quedas en el extremo más lejano de la sala, esperando que pase esta ronda.`,

        pt: `"Quem vai à mesa?"

Você não.

Negociação de contrato — analisar cláusulas, pechinchar termos, encontrar equilíbrio através da confrontação — essas palavras ficam cinzas na sua mente. Você sabe que importam, mas não há faísca entre elas e você.

Você fica no canto mais distante da sala, esperando essa rodada passar.`,

        it: `"Chi va al tavolo?"

Non tu.

Negoziazione contrattuale — analizzare clausole, contrattare sui termini, trovare equilibrio attraverso il confronto — queste parole restano grigie nella tua mente. Sai che contano, ma non c'è scintilla tra loro e te.

Ti metti all'estremità più lontana della sala, aspettando che questo turno finisca.`,

        ru: `«Кто идёт за стол?»

Не ты.

Переговоры по контракту — анализировать условия, торговаться по пунктам, находить баланс через противостояние — эти слова сидят серыми в твоей голове. Ты знаешь, что они важны, но между ними и тобой нет искры.

Ты стоишь в дальнем конце комнаты, ожидая, пока этот раунд закончится.`,

        ja: `「誰がテーブルに行く？」

あなたではない。

契約交渉——条項の分析、条件の駆け引き、対立を通じてバランスを見つける——これらの言葉は頭の中で灰色だ。重要だとは分かっている。でもそれらとあなたの間には火花がない。

部屋の一番遠い端に立ち、このラウンドが終わるのを待つ。`,

        ko: `"누가 테이블에 갈 거야?"

당신이 아니다.

계약 협상 — 조항 분석, 조건 흥정, 대립을 통한 균형 찾기 — 이 단어들은 머릿속에서 회색이다. 중요하다는 건 안다. 하지만 그것들과 당신 사이에 불꽃은 없다.

방의 가장 먼 끝에 서서 이 라운드가 지나가길 기다린다.`,
      },
    },
  },

  {
    id: 23,
    riasec: "E",
    miniIpCode: "E2",
    miniIpItem: "Start your own business",
    chapter: "negotiation",
    chapterIndex: 5,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `服务竞赛结束，结果出来了。但胜负不重要——屏幕随后显示了一个没人想看到的数字：即使加上竞赛奖励，两队的资源总和仍不够通关。

沉默了十秒。

Adrian 第一个开口：「那就不能各自为战了。」
对面队伍有人说：「但你们凭什么拿我们的资源？」

需要有人站出来，提出一个全新的方案——不是分配现有资源，而是创造新价值。从零构想：两队合作做什么、怎么分工、怎么分成果。

本质上是在两个互不信任的团体之间创办一个合作体——你的想法、说服力、执行方案，全部从头建起。

没有模板。没有先例。你来定义这个「企业」是什么。`,

      en: `The service competition ends. Results are in. But winning or losing doesn't matter — the screen displays a number no one wanted to see: even with the competition bonus, the combined resources still aren't enough to clear the floor.

Ten seconds of silence.

Adrian is the first to speak: "Then we can't go it alone."
Someone from the other team: "But why should we give you our resources?"

Someone needs to step forward with an entirely new proposal — not dividing existing resources, but creating new value. Conceived from scratch: what the two teams do together, how to divide labor, how to split the results.

Essentially, founding a joint venture between two groups that don't trust each other — your idea, your persuasion, your execution plan, all built from nothing.

No template. No precedent. You define what this "enterprise" is.`,

      nl: `De servicecompetitie is voorbij. De resultaten zijn binnen. Maar winnen of verliezen doet er niet toe — want het scherm toont vervolgens een getal dat niemand wilde zien: zelfs met de competitiebonus zijn de gecombineerde grondstoffen van beide teams nog steeds niet genoeg om de verdieping te halen.

Tien seconden stilte.

Adrian spreekt als eerste: "Dan kunnen we het niet alleen doen."
Iemand van het andere team: "Maar waarom zouden we jullie onze grondstoffen geven?"

Iemand moet naar voren stappen met een geheel nieuw voorstel — niet over het verdelen van bestaande grondstoffen, maar over het creëren van nieuwe waarde. Uit het niets bedacht: wat de twee teams samen doen, hoe de taken verdelen, hoe de resultaten splitsen.

In wezen een joint venture oprichten tussen twee groepen die elkaar niet vertrouwen — jouw idee, jouw overtuigingskracht, jouw uitvoeringsplan, alles vanuit niets opgebouwd.

Geen sjabloon. Geen precedent. Jij definieert wat deze "onderneming" is.`,

      de: `Der Service-Wettbewerb ist vorbei. Die Ergebnisse stehen fest. Aber Gewinnen oder Verlieren spielt keine Rolle — denn der Bildschirm zeigt dann eine Zahl, die niemand sehen wollte: Selbst mit dem Wettbewerbsbonus reichen die kombinierten Ressourcen beider Teams immer noch nicht aus, um die Etage zu schaffen.

Zehn Sekunden Stille.

Adrian spricht als Erster: „Dann können wir es nicht alleine schaffen."
Jemand vom anderen Team: „Aber warum sollten wir euch unsere Ressourcen geben?"

Jemand muss mit einem völlig neuen Vorschlag hervortreten — nicht über die Aufteilung vorhandener Ressourcen, sondern über die Schaffung neuen Werts. Von Grund auf konzipiert: was die beiden Teams gemeinsam tun, wie die Arbeit aufgeteilt wird, wie die Ergebnisse verteilt werden.

Im Wesentlichen ein Joint Venture zwischen zwei Gruppen gründen, die sich nicht vertrauen — deine Idee, deine Überzeugungskraft, dein Umsetzungsplan, alles aus dem Nichts aufgebaut.

Keine Vorlage. Kein Präzedenzfall. Du definierst, was dieses „Unternehmen" ist.`,

      fr: `La compétition de service est terminée. Les résultats sont là. Mais victoire ou défaite importe peu — car l'écran affiche ensuite un chiffre que personne ne voulait voir : même avec le bonus de la compétition, les ressources combinées des deux équipes ne suffisent toujours pas pour franchir l'étage.

Dix secondes de silence.

Adrian parle le premier : « Alors on ne peut pas y arriver seuls. »
Quelqu'un de l'autre équipe : « Mais pourquoi on vous donnerait nos ressources ? »

Quelqu'un doit proposer un plan entièrement nouveau — non pas pour diviser les ressources existantes, mais pour créer de la valeur nouvelle. Conçu de zéro : ce que les deux équipes font ensemble, comment répartir le travail, comment partager les résultats.

En substance, fonder une coentreprise entre deux groupes qui ne se font pas confiance — ton idée, ta force de persuasion, ton plan d'exécution, tout construit à partir de rien.

Pas de modèle. Pas de précédent. C'est toi qui définis ce qu'est cette « entreprise ».`,

      es: `La competencia de servicio termina. Los resultados están. Pero ganar o perder no importa — porque la pantalla muestra entonces un número que nadie quería ver: incluso con el bono de la competencia, los recursos combinados de ambos equipos aún no son suficientes para superar el piso.

Diez segundos de silencio.

Adrian habla primero: "Entonces no podemos ir solos."
Alguien del otro equipo: "¿Pero por qué deberíamos darles nuestros recursos?"

Alguien necesita dar un paso adelante con una propuesta completamente nueva — no sobre dividir los recursos existentes, sino sobre crear valor nuevo. Concebido desde cero: qué hacen los dos equipos juntos, cómo dividir el trabajo, cómo repartir los resultados.

Esencialmente, fundar una empresa conjunta entre dos grupos que no confían el uno en el otro — tu idea, tu poder de persuasión, tu plan de ejecución, todo construido desde la nada.

Sin plantilla. Sin precedente. Tú defines qué es esta "empresa".`,

      pt: `A competição de serviço termina. Os resultados saíram. Mas ganhar ou perder não importa — porque a tela mostra um número que ninguém queria ver: mesmo com o bônus da competição, os recursos combinados das duas equipes ainda não são suficientes para passar o andar.

Dez segundos de silêncio.

Adrian é o primeiro a falar: "Então não podemos ir sozinhos."
Alguém da outra equipe: "Mas por que daríamos nossos recursos a vocês?"

Alguém precisa dar um passo à frente com uma proposta inteiramente nova — não sobre dividir recursos existentes, mas sobre criar valor novo. Concebida do zero: o que as duas equipes fazem juntas, como dividir o trabalho, como repartir os resultados.

Essencialmente, fundar uma joint venture entre dois grupos que não confiam um no outro — sua ideia, seu poder de persuasão, seu plano de execução, tudo construído do nada.

Sem modelo. Sem precedente. Você define o que é essa "empresa".`,

      it: `La competizione di servizio è finita. I risultati sono arrivati. Ma vincere o perdere non conta — perché lo schermo mostra un numero che nessuno voleva vedere: anche con il bonus della competizione, le risorse combinate di entrambe le squadre non bastano ancora per superare il piano.

Dieci secondi di silenzio.

Adrian parla per primo: "Allora non possiamo farcela da soli."
Qualcuno dell'altra squadra: "Ma perché dovremmo darvi le nostre risorse?"

Qualcuno deve farsi avanti con una proposta completamente nuova — non sulla divisione delle risorse esistenti, ma sulla creazione di nuovo valore. Concepita da zero: cosa fanno le due squadre insieme, come dividere il lavoro, come spartire i risultati.

In sostanza, fondare una joint venture tra due gruppi che non si fidano l'uno dell'altro — la tua idea, la tua capacità di persuasione, il tuo piano d'esecuzione, tutto costruito dal nulla.

Nessun modello. Nessun precedente. Sei tu a definire cos'è questa "impresa".`,

      ru: `Конкурс обслуживания закончился. Результаты объявлены. Но победа или поражение не имеют значения — потому что экран показывает число, которое никто не хотел видеть: даже с бонусом за конкурс, суммарных ресурсов обеих команд всё равно не хватает для прохождения этажа.

Десять секунд тишины.

Адриан говорит первым: «Значит, поодиночке не пройдём.»
Кто-то из другой команды: «А с чего бы нам отдавать вам свои ресурсы?»

Кто-то должен выступить с совершенно новым предложением — не о разделе существующих ресурсов, а о создании новой ценности. Задуманным с нуля: что две команды делают вместе, как разделить труд, как поделить результаты.

По сути — основать совместное предприятие между двумя группами, которые не доверяют друг другу. Твоя идея, твоя убедительность, твой план реализации — всё с нуля.

Нет шаблона. Нет прецедента. Ты определяешь, что такое это «предприятие».`,

      ja: `サービス競争が終わった。結果が出た。だが勝ち負けは関係ない——画面に、誰も見たくなかった数字が表示されたからだ：競争ボーナスを加えても、両チームの資源の合計はまだフロア突破に足りない。

10秒の沈黙。

エイドリアンが最初に口を開く：「なら、単独では無理だ。」
相手チームの誰かが言う：「でも、なんで俺たちの資源をお前らに渡さなきゃならないんだ？」

誰かが全く新しい提案を持って前に出る必要がある——既存の資源を分配するのではなく、新しい価値を創造する提案を。ゼロから構想する：2つのチームが一緒に何をするか、どう分業するか、どう成果を分けるか。

本質的には、互いを信頼していない2つのグループの間にジョイントベンチャーを立ち上げること——あなたのアイデア、あなたの説得力、あなたの実行計画、すべてゼロから構築する。

テンプレートはない。前例もない。この「事業」が何かを定義するのは、あなただ。`,

      ko: `서비스 경쟁이 끝났다. 결과가 나왔다. 하지만 승패는 중요하지 않다 — 화면에 아무도 보고 싶지 않았던 숫자가 표시되었기 때문이다: 경쟁 보너스를 더해도 두 팀의 자원 합계는 여전히 층 통과에 부족하다.

10초의 침묵.

에이드리안이 먼저 입을 연다: "그러면 각자 갈 수는 없어."
상대 팀 누군가가 말한다: "근데 왜 우리 자원을 너희한테 줘야 하지?"

누군가 완전히 새로운 제안을 들고 나서야 한다 — 기존 자원을 나누는 것이 아니라, 새로운 가치를 만드는 제안을. 처음부터 구상한다: 두 팀이 함께 무엇을 할 것인지, 어떻게 분업할 것인지, 어떻게 성과를 나눌 것인지.

본질적으로 서로 신뢰하지 않는 두 집단 사이에 합작 기업을 세우는 것이다 — 당신의 아이디어, 당신의 설득력, 당신의 실행 계획, 모두 무에서 세워야 한다.

템플릿은 없다. 선례도 없다. 이 "기업"이 무엇인지는 당신이 정의한다.`,
    },
    taskDescription: {
      zh: "从零开始构想并发起一个全新的合作方案——定义目标、设计架构、组建团队、制定执行计划。这项任务需要一个主要负责人。",

      en: `Conceive and launch an entirely new cooperation proposal from scratch — define objectives, design structure, assemble teams, create an execution plan. This task needs one primary person.`,

      nl: "Bedenk en lanceer een geheel nieuw samenwerkingsvoorstel vanuit het niets — definieer doelen, ontwerp structuur, stel teams samen, maak een uitvoeringsplan. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Konzipiere und starte einen völlig neuen Kooperationsvorschlag von Grund auf — definiere Ziele, entwirf eine Struktur, stelle Teams zusammen, erstelle einen Umsetzungsplan. Diese Aufgabe braucht eine Hauptperson.",

      fr: "Concevez et lancez une proposition de coopération entièrement nouvelle à partir de zéro — définissez les objectifs, concevez la structure, assemblez les équipes, créez un plan d'exécution. Cette tâche nécessite un responsable principal.",

      es: "Concibe y lanza una propuesta de cooperación completamente nueva desde cero — define objetivos, diseña la estructura, reúne equipos, crea un plan de ejecución. Esta tarea necesita un responsable principal.",

      pt: "Conceba e lance uma proposta de cooperação inteiramente nova do zero — defina objetivos, projete a estrutura, monte equipes, crie um plano de execução. Esta tarefa precisa de um responsável principal.",

      it: "Concepisci e lancia una proposta di cooperazione completamente nuova da zero — definisci gli obiettivi, progetta la struttura, assembla i team, crea un piano d'esecuzione. Questo compito richiede un responsabile principale.",

      ru: "Придумайте и запустите совершенно новое предложение о сотрудничестве с нуля — определите цели, спроектируйте структуру, соберите команды, создайте план реализации. Для этой задачи нужен один главный ответственный.",

      ja: "ゼロから全く新しい協力提案を構想し発起する——目標を定義し、構造を設計し、チームを編成し、実行計画を策定する。この任務には主担当者が一人必要です。",

      ko: "처음부터 완전히 새로운 협력 제안을 구상하고 시작하세요 — 목표를 정의하고, 구조를 설계하고, 팀을 구성하고, 실행 계획을 만드세요. 이 임무에는 한 명의 주 담당자가 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `十秒的沉默里，你的脑子在飞速运转。

不是在想「怎么办」——是在想「怎么做」。两支队伍，各有什么资源，各擅长什么，如果合作的话，能创造出什么新的东西。

你站出来了。

「听我说。」你面对着两支队伍的所有人。你开始画一个方案——从目标、到架构、到分工、到利益分配。你的声音不大，但你的逻辑让所有人安静下来了。

这不是一个完美的方案。但它是一个开始。而你，是那个开始的人。

Adrian 看着你，表情从惊讶变成了点头。对面队伍的人在交头接耳，但他们在听。`,

        en: `In those ten seconds of silence, your mind is in overdrive.

Not thinking "what now" — thinking "how." Two teams. What resources does each have. What is each good at. If they combine, what new thing could they create.

You step forward.

"Listen." You face everyone from both teams. You begin sketching a plan — objectives, structure, division of labor, benefit allocation. Your voice isn't loud, but your logic silences the room.

This isn't a perfect plan. But it's a beginning. And you are the one who began it.

Adrian looks at you, expression shifting from surprise to a nod. The other team is whispering, but they're listening.`,

        nl: `In die tien seconden stilte draait je brein op volle toeren.

Niet denkend "wat nu" — denkend "hoe." Twee teams. Welke grondstoffen heeft elk team. Waar is elk team goed in. Als ze combineren, wat voor nieuws kunnen ze dan creëren.

Je stapt naar voren.

"Luister." Je staat tegenover iedereen van beide teams. Je begint een plan te schetsen — doelen, structuur, taakverdeling, verdeling van opbrengsten. Je stem is niet luid, maar je logica brengt iedereen tot stilte.

Dit is geen perfect plan. Maar het is een begin. En jij bent degene die het begon.

Adrian kijkt naar je, zijn uitdrukking verandert van verbazing in een knik. Het andere team fluistert, maar ze luisteren.`,

        de: `In diesen zehn Sekunden Stille läuft dein Verstand auf Hochtouren.

Nicht „was jetzt" denkend — sondern „wie." Zwei Teams. Welche Ressourcen hat jedes. Worin ist jedes gut. Wenn sie sich zusammentun, was Neues könnte dabei entstehen.

Du trittst vor.

„Hört zu." Du stehst vor allen aus beiden Teams. Du beginnst einen Plan zu skizzieren — Ziele, Struktur, Arbeitsteilung, Gewinnverteilung. Deine Stimme ist nicht laut, aber deine Logik bringt den Raum zum Schweigen.

Das ist kein perfekter Plan. Aber es ist ein Anfang. Und du bist derjenige, der angefangen hat.

Adrian schaut dich an, sein Ausdruck wechselt von Überraschung zu einem Nicken. Das andere Team flüstert, aber sie hören zu.`,

        fr: `Dans ces dix secondes de silence, ton esprit tourne à plein régime.

Tu ne penses pas « et maintenant » — tu penses « comment. » Deux équipes. Quelles ressources chacune possède. En quoi chacune excelle. Si elles se combinent, quelle nouveauté pourraient-elles créer.

Tu fais un pas en avant.

« Écoutez. » Tu fais face à tout le monde des deux équipes. Tu commences à esquisser un plan — objectifs, structure, répartition du travail, partage des bénéfices. Ta voix n'est pas forte, mais ta logique fait taire la salle.

Ce n'est pas un plan parfait. Mais c'est un début. Et c'est toi qui l'as initié.

Adrian te regarde, son expression passant de la surprise à un hochement de tête. L'autre équipe chuchote, mais elle écoute.`,

        es: `En esos diez segundos de silencio, tu mente está a toda marcha.

No piensas "qué hacer" — piensas "cómo." Dos equipos. Qué recursos tiene cada uno. En qué es bueno cada uno. Si se combinan, qué cosa nueva podrían crear.

Das un paso adelante.

"Escuchen." Enfrentas a todos de ambos equipos. Empiezas a trazar un plan — objetivos, estructura, división del trabajo, distribución de beneficios. Tu voz no es alta, pero tu lógica silencia la sala.

No es un plan perfecto. Pero es un comienzo. Y tú eres quien lo empezó.

Adrian te mira, su expresión cambia de sorpresa a un asentimiento. El otro equipo susurra, pero están escuchando.`,

        pt: `Naqueles dez segundos de silêncio, sua mente está em velocidade máxima.

Não pensando "e agora" — pensando "como." Duas equipes. Que recursos cada uma tem. No que cada uma é boa. Se se combinarem, que coisa nova poderiam criar.

Você dá um passo à frente.

"Ouçam." Você enfrenta todos de ambas as equipes. Começa a esboçar um plano — objetivos, estrutura, divisão de trabalho, alocação de benefícios. Sua voz não é alta, mas sua lógica silencia a sala.

Não é um plano perfeito. Mas é um começo. E você é quem começou.

Adrian olha para você, expressão mudando de surpresa para um aceno. A outra equipe sussurra, mas está ouvindo.`,

        it: `In quei dieci secondi di silenzio, la tua mente è in sovraccarico.

Non pensi "e adesso" — pensi "come." Due squadre. Quali risorse ha ciascuna. In cosa eccelle ciascuna. Se si uniscono, che cosa nuova potrebbero creare.

Fai un passo avanti.

"Ascoltate." Sei di fronte a tutti di entrambe le squadre. Cominci a delineare un piano — obiettivi, struttura, divisione del lavoro, ripartizione dei benefici. La tua voce non è alta, ma la tua logica zittisce la sala.

Non è un piano perfetto. Ma è un inizio. E tu sei quello che lo ha iniziato.

Adrian ti guarda, l'espressione passa dalla sorpresa a un cenno del capo. L'altra squadra sussurra, ma sta ascoltando.`,

        ru: `В эти десять секунд тишины твой мозг работает на предельных оборотах.

Ты думаешь не «что теперь» — а «как.» Две команды. Какие ресурсы у каждой. В чём каждая сильна. Если объединиться, что нового можно создать.

Ты выходишь вперёд.

«Послушайте.» Ты стоишь лицом ко всем из обеих команд. Начинаешь набрасывать план — цели, структура, разделение труда, распределение выгод. Твой голос негромкий, но твоя логика заставляет всех замолчать.

Это не идеальный план. Но это начало. И ты — тот, кто его начал.

Адриан смотрит на тебя, выражение лица меняется от удивления к кивку. Другая команда шепчется, но они слушают.`,

        ja: `10秒の沈黙の間、頭はフル回転している。

「どうしよう」ではなく——「どうやるか」を考えている。2つのチーム。それぞれどんな資源を持っているか。それぞれ何が得意か。合わされば、どんな新しいものを生み出せるか。

前に出る。

「聞いてくれ。」両チーム全員に向き合う。計画を描き始める——目標、構造、分業、利益配分。声は大きくないが、ロジックが部屋を静まらせる。

完璧な計画ではない。だが始まりだ。そしてそれを始めたのは、あなただ。

エイドリアンがこちらを見ている。驚きの表情がうなずきに変わる。相手チームはひそひそ話しているが、聞いている。`,

        ko: `10초의 침묵 속에서 머리가 전력 가동한다.

"어쩌지"가 아니라 — "어떻게"를 생각하고 있다. 두 팀. 각각 어떤 자원을 가지고 있는지. 각각 무엇을 잘하는지. 합치면 어떤 새로운 것을 만들 수 있을지.

앞으로 나선다.

"들어봐." 양 팀 모두를 마주한다. 계획을 그리기 시작한다 — 목표, 구조, 역할 분담, 이익 배분. 목소리는 크지 않지만, 논리가 방을 조용하게 만든다.

완벽한 계획이 아니다. 하지만 시작이다. 그리고 그것을 시작한 사람은 당신이다.

에이드리안이 바라본다. 놀라움에서 고개 끄덕임으로 표정이 바뀐다. 상대 팀이 속삭이고 있지만, 듣고 있다.`,
      },
      score4: {
        zh: `资源不够。各自为战不行。

你开始想：如果两支队伍合作……合作做什么？你心里有一个模糊的框架开始成型——不是分蛋糕，是把蛋糕做大。

你开口了：「如果我们把两边的资源整合起来，做一个双方都能受益的事情呢？」

想法还不完整，但方向有了。你开始和 Adrian 以及对面的人讨论细节。每说一轮，方案就清晰一点。

从零开始构想一个合作方案——有压力，但你觉得自己做得了。`,

        en: `Not enough resources. Going alone won't work.

You start thinking: if both teams cooperate... cooperate on what? A fuzzy framework begins forming — not splitting the pie, but making it bigger.

You speak up: "What if we pool both sides' resources and do something that benefits everyone?"

The idea isn't complete, but there's a direction. You start discussing details with Adrian and the other team. Each round of conversation sharpens the plan.

Conceiving a cooperation proposal from scratch — there's pressure, but you feel you can do it.`,

        nl: `Niet genoeg grondstoffen. Alleen gaan werkt niet.

Je begint na te denken: als beide teams samenwerken… samenwerken waaraan? Een vaag kader begint vorm te krijgen — niet de taart verdelen, maar hem groter maken.

Je spreekt: "Wat als we de grondstoffen van beide kanten bundelen en iets doen waar iedereen baat bij heeft?"

Het idee is niet compleet, maar er is een richting. Je begint details te bespreken met Adrian en het andere team. Elke gespreksronde scherpt het plan aan.

Een samenwerkingsvoorstel bedenken vanuit het niets — er is druk, maar je voelt dat je het kunt.`,

        de: `Nicht genug Ressourcen. Alleine geht nicht.

Du fängst an nachzudenken: Wenn beide Teams kooperieren… kooperieren woran? Ein vages Rahmenwerk nimmt Form an — nicht den Kuchen teilen, sondern ihn größer machen.

Du sprichst: „Was wäre, wenn wir die Ressourcen beider Seiten bündeln und etwas tun, das allen zugutekommt?"

Die Idee ist nicht komplett, aber die Richtung stimmt. Du beginnst Details mit Adrian und dem anderen Team zu besprechen. Jede Gesprächsrunde schärft den Plan.

Einen Kooperationsvorschlag von Grund auf konzipieren — es gibt Druck, aber du fühlst, dass du es schaffst.`,

        fr: `Pas assez de ressources. Agir seuls ne fonctionnera pas.

Tu commences à réfléchir : si les deux équipes coopèrent… coopèrent sur quoi ? Un cadre flou commence à se former — pas partager le gâteau, mais le faire grandir.

Tu prends la parole : « Et si on mettait en commun les ressources des deux côtés pour faire quelque chose qui profite à tout le monde ? »

L'idée n'est pas complète, mais il y a une direction. Tu commences à discuter des détails avec Adrian et l'autre équipe. Chaque tour de conversation affine le plan.

Concevoir une proposition de coopération à partir de rien — il y a de la pression, mais tu sens que tu peux le faire.`,

        es: `No hay suficientes recursos. Ir solos no funcionará.

Empiezas a pensar: si ambos equipos cooperan… ¿cooperan en qué? Un marco difuso empieza a formarse — no dividir el pastel, sino hacerlo más grande.

Hablas: "¿Y si combinamos los recursos de ambos lados y hacemos algo que beneficie a todos?"

La idea no está completa, pero hay una dirección. Empiezas a discutir detalles con Adrian y el otro equipo. Cada ronda de conversación afina el plan.

Concebir una propuesta de cooperación desde cero — hay presión, pero sientes que puedes hacerlo.`,

        pt: `Recursos insuficientes. Ir sozinhos não vai funcionar.

Você começa a pensar: se as duas equipes cooperarem... cooperarem em quê? Um quadro vago começa a se formar — não dividir o bolo, mas fazê-lo maior.

Você fala: "E se juntarmos os recursos dos dois lados e fizermos algo que beneficie todos?"

A ideia não está completa, mas há uma direção. Você começa a discutir detalhes com Adrian e a outra equipe. Cada rodada de conversa refina o plano.

Conceber uma proposta de cooperação do zero — há pressão, mas você sente que consegue.`,

        it: `Risorse insufficienti. Andare da soli non funzionerà.

Cominci a pensare: se entrambe le squadre cooperano… cooperano su cosa? Un quadro vago comincia a prendere forma — non dividere la torta, ma farla più grande.

Parli: "E se unissimo le risorse di entrambi i lati e facessimo qualcosa che beneficia tutti?"

L'idea non è completa, ma c'è una direzione. Cominci a discutere i dettagli con Adrian e l'altra squadra. Ogni giro di conversazione affina il piano.

Concepire una proposta di cooperazione da zero — c'è pressione, ma senti di potercela fare.`,

        ru: `Ресурсов не хватает. Поодиночке не получится.

Ты начинаешь думать: если обе команды объединятся… объединятся для чего? В голове начинает формироваться размытая схема — не делить пирог, а сделать его больше.

Ты говоришь: «А что, если мы объединим ресурсы обеих сторон и сделаем что-то, что принесёт пользу всем?»

Идея ещё не целостная, но направление есть. Ты начинаешь обсуждать детали с Адрианом и другой командой. С каждым кругом обсуждения план становится чётче.

Создать предложение о сотрудничестве с нуля — давление есть, но ты чувствуешь, что справишься.`,

        ja: `資源が足りない。単独では無理だ。

考え始める：もし両チームが協力するなら……何に協力するのか？ ぼんやりとしたフレームワークが形成され始める——パイを分けるのではなく、パイを大きくする。

口を開く：「もし双方の資源を合わせて、全員にメリットのあることをしたら？」

アイデアはまだ不完全だが、方向性はある。エイドリアンや相手チームと詳細を議論し始める。会話のラウンドを重ねるたびに、計画が明確になる。

ゼロから協力提案を構想する——プレッシャーはあるが、自分にはできると感じる。`,

        ko: `자원이 부족하다. 각자 가는 건 안 된다.

생각하기 시작한다: 두 팀이 협력한다면... 무엇에 협력하지? 흐릿한 프레임워크가 형성되기 시작한다 — 파이를 나누는 게 아니라 키우는 것이다.

입을 연다: "양쪽의 자원을 합쳐서 모두에게 이익이 되는 일을 하면 어떨까?"

아이디어는 아직 완전하지 않지만 방향은 있다. 에이드리안과 상대 팀과 세부 사항을 논의하기 시작한다. 대화를 거듭할수록 계획이 선명해진다.

처음부터 협력 제안을 구상하기 — 압박은 있지만, 할 수 있다고 느낀다.`,
      },
      score3: {
        zh: `两支队伍，资源不够，需要全新方案。

你听着 Adrian 和对面队伍的人交谈，心里在思考。你有一些想法——模糊的、不完整的——但要你站到所有人面前，提出一个完整的合作方案……

你不确定。

你决定先把想法告诉 Adrian，让他来判断可不可行。你更愿意做方案的贡献者，而不是发起人。`,

        en: `Two teams. Not enough resources. A new plan needed.

You listen to Adrian and the other team talk. You're thinking. You have some ideas — vague, incomplete — but standing in front of everyone and presenting a full cooperation plan...

You're not sure.

You decide to share your thoughts with Adrian first, let him judge feasibility. You'd rather be a contributor to the plan than its initiator.`,

        nl: `Twee teams. Niet genoeg grondstoffen. Een nieuw plan nodig.

Je luistert naar Adrian en het andere team terwijl ze praten. Je denkt na. Je hebt wat ideeën — vaag, onvolledig — maar voor iedereen gaan staan en een volledig samenwerkingsplan presenteren...

Je bent er niet zeker van.

Je besluit je gedachten eerst met Adrian te delen, hem te laten beoordelen of het haalbaar is. Je bent liever een bijdrager aan het plan dan de initiatiefnemer.`,

        de: `Zwei Teams. Nicht genug Ressourcen. Ein neuer Plan wird gebraucht.

Du hörst Adrian und dem anderen Team beim Reden zu. Du denkst nach. Du hast einige Ideen — vage, unvollständig — aber vor allen aufzutreten und einen kompletten Kooperationsplan zu präsentieren...

Du bist dir nicht sicher.

Du beschließt, deine Gedanken erst Adrian mitzuteilen, ihn die Machbarkeit beurteilen zu lassen. Du wärst lieber ein Beitragender zum Plan als sein Initiator.`,

        fr: `Deux équipes. Pas assez de ressources. Un nouveau plan nécessaire.

Tu écoutes Adrian et l'autre équipe discuter. Tu réfléchis. Tu as quelques idées — vagues, incomplètes — mais te lever devant tout le monde et présenter un plan de coopération complet...

Tu n'es pas sûr.

Tu décides de partager d'abord tes réflexions avec Adrian, de le laisser juger la faisabilité. Tu préfères être un contributeur au plan plutôt que son initiateur.`,

        es: `Dos equipos. Recursos insuficientes. Se necesita un plan nuevo.

Escuchas a Adrian y al otro equipo hablar. Piensas. Tienes algunas ideas — vagas, incompletas — pero ponerte de pie frente a todos y presentar un plan completo de cooperación...

No estás seguro.

Decides compartir tus ideas primero con Adrian, dejar que él juzgue la viabilidad. Preferirías ser un contribuyente al plan que su iniciador.`,

        pt: `Duas equipes. Recursos insuficientes. Um novo plano é necessário.

Você ouve Adrian e a outra equipe conversando. Está pensando. Tem algumas ideias — vagas, incompletas — mas levantar na frente de todos e apresentar um plano completo de cooperação...

Você não tem certeza.

Decide compartilhar seus pensamentos primeiro com Adrian, deixar ele julgar a viabilidade. Prefere ser um contribuidor ao plano do que seu iniciador.`,

        it: `Due squadre. Risorse insufficienti. Serve un nuovo piano.

Ascolti Adrian e l'altra squadra parlare. Stai pensando. Hai qualche idea — vaga, incompleta — ma alzarti di fronte a tutti e presentare un piano di cooperazione completo...

Non sei sicuro.

Decidi di condividere prima i tuoi pensieri con Adrian, lasciare che lui giudichi la fattibilità. Preferisci essere un contributore al piano piuttosto che il suo iniziatore.`,

        ru: `Две команды. Ресурсов не хватает. Нужен новый план.

Ты слушаешь, как Адриан и другая команда разговаривают. Ты думаешь. У тебя есть идеи — размытые, незавершённые — но встать перед всеми и представить полный план сотрудничества...

Ты не уверен.

Ты решаешь сначала поделиться мыслями с Адрианом, пусть он оценит реализуемость. Ты предпочитаешь быть участником плана, а не его инициатором.`,

        ja: `2つのチーム。資源が足りない。新しい計画が必要だ。

エイドリアンと相手チームの会話を聞いている。考えている。いくつかのアイデアがある——漠然としていて、不完全な——だが全員の前に立って、完全な協力計画を提示するとなると……

確信が持てない。

まずエイドリアンに考えを伝え、実現可能性を判断してもらうことにする。計画の発起人より、貢献者でありたい。`,

        ko: `두 팀. 자원이 부족하다. 새로운 계획이 필요하다.

에이드리안과 상대 팀의 대화를 듣고 있다. 생각하고 있다. 몇 가지 아이디어가 있다 — 모호하고 불완전한 — 하지만 모두 앞에 서서 완전한 협력 계획을 발표하는 것은...

확신이 없다.

먼저 에이드리안에게 생각을 공유하고, 그가 실현 가능성을 판단하게 하기로 한다. 계획의 발기인보다는 기여자가 되고 싶다.`,
      },
      score2: {
        zh: `从零创办一个合作体。

你听着两边的争论，理解了问题的本质。但「站出来提出全新方案」这件事——你没有那种冲动。

这需要的不只是想法——还有说服力、承受被质疑的勇气、和把模糊的构想变成可执行计划的能力。此刻这些加在一起，超出了你的意愿。

你留在了队伍里，听着别人提方案。`,

        en: `Founding a joint venture from scratch.

You listen to both sides argue and understand the core problem. But "stepping up with a brand-new proposal" — you don't have that impulse.

This requires more than ideas — it needs persuasive power, the courage to face challenges, and the ability to turn a vague concept into an executable plan. All of that together exceeds your current willingness.

You stay in the group, listening to others propose.`,

        nl: `Een joint venture oprichten vanuit niets.

Je luistert naar beide kanten argumenteren en begrijpt het kernprobleem. Maar "opstaan met een gloednieuw voorstel" — die impuls heb je niet.

Dit vereist meer dan ideeën — het vraagt overtuigingskracht, de moed om uitdagingen het hoofd te bieden, en het vermogen om een vaag concept om te zetten in een uitvoerbaar plan. Dat alles samen overstijgt je huidige bereidheid.

Je blijft in de groep, luisterend naar de voorstellen van anderen.`,

        de: `Ein Joint Venture aus dem Nichts gründen.

Du hörst beide Seiten streiten und verstehst das Kernproblem. Aber „mit einem brandneuen Vorschlag hervortreten" — diesen Impuls hast du nicht.

Das erfordert mehr als Ideen — es braucht Überzeugungskraft, den Mut, Herausforderungen zu begegnen, und die Fähigkeit, ein vages Konzept in einen umsetzbaren Plan zu verwandeln. All das zusammen übersteigt deine aktuelle Bereitschaft.

Du bleibst in der Gruppe und hörst den Vorschlägen anderer zu.`,

        fr: `Fonder une coentreprise à partir de rien.

Tu écoutes les deux côtés argumenter et comprends le problème de fond. Mais « se lever avec une proposition toute neuve » — tu n'as pas cette impulsion.

Cela demande plus que des idées — il faut de la force de persuasion, le courage de faire face aux objections, et la capacité de transformer un concept flou en plan exécutable. Tout cela ensemble dépasse ta volonté actuelle.

Tu restes dans le groupe, écoutant les propositions des autres.`,

        es: `Fundar una empresa conjunta desde cero.

Escuchas argumentar a ambos lados y entiendes el problema central. Pero "dar un paso adelante con una propuesta completamente nueva" — no tienes ese impulso.

Esto requiere más que ideas — necesita poder de persuasión, coraje para enfrentar objeciones, y la capacidad de convertir un concepto vago en un plan ejecutable. Todo eso junto supera tu disposición actual.

Te quedas en el grupo, escuchando las propuestas de otros.`,

        pt: `Fundar uma joint venture do nada.

Você ouve ambos os lados argumentarem e entende o problema central. Mas "dar um passo à frente com uma proposta totalmente nova" — você não tem esse impulso.

Isso requer mais do que ideias — precisa de poder de persuasão, coragem para enfrentar desafios, e capacidade de transformar um conceito vago em um plano executável. Tudo isso junto excede sua disposição atual.

Você fica no grupo, ouvindo outros proporem.`,

        it: `Fondare una joint venture dal nulla.

Ascolti entrambi i lati discutere e capisci il problema di fondo. Ma "farsi avanti con una proposta completamente nuova" — non hai quell'impulso.

Questo richiede più che idee — serve capacità di persuasione, coraggio di affrontare le sfide, e l'abilità di trasformare un concetto vago in un piano eseguibile. Tutto questo insieme supera la tua attuale disponibilità.

Resti nel gruppo, ascoltando le proposte degli altri.`,

        ru: `Основать совместное предприятие с нуля.

Ты слушаешь, как обе стороны спорят, и понимаешь суть проблемы. Но «выступить с совершенно новым предложением» — такого порыва у тебя нет.

Для этого нужны не только идеи — нужна убедительность, смелость встретить возражения, способность превратить размытую концепцию в исполнимый план. Всё вместе это превышает твою нынешнюю готовность.

Ты остаёшься в группе, слушая, как предлагают другие.`,

        ja: `ゼロからジョイントベンチャーを立ち上げる。

両方の議論を聞き、問題の本質を理解している。だが「全く新しい提案を持って前に出る」——その衝動がない。

これにはアイデア以上のものが必要だ——説得力、異議に向き合う勇気、漠然とした構想を実行可能な計画に変える能力。そのすべてを合わせると、今の自分の意欲を超えている。

グループの中にとどまり、他の人の提案を聞いている。`,

        ko: `처음부터 합작 기업을 세우기.

양쪽의 논쟁을 듣고 핵심 문제를 이해한다. 하지만 "완전히 새로운 제안을 들고 나서는 것" — 그런 충동이 없다.

이것은 아이디어 이상이 필요하다 — 설득력, 도전에 맞설 용기, 모호한 구상을 실행 가능한 계획으로 바꾸는 능력. 이 모든 것을 합치면 현재의 의지를 초과한다.

그룹에 남아서 다른 사람들의 제안을 듣고 있다.`,
      },
      score1: {
        zh: `创办新事物。定义目标。组建团队。制定计划。

每一个词你都理解，但它们加在一起的意思是——你要当那个发起者，那个承担一切的人。

这不是你。你不是那个会在两支互不信任的队伍面前站出来说「我有个主意」的人。不是因为你没有想法——是因为这种角色本身对你没有吸引力。

你站在人群里。看着。等着。`,

        en: `Found something new. Define objectives. Build a team. Create a plan.

You understand every word, but together they mean — you'd be the initiator, the one bearing everything.

That's not you. You're not the person who stands up between two distrustful teams and says "I have an idea." Not because you lack ideas — because the role itself holds no appeal.

You stand in the crowd. Watching. Waiting.`,

        nl: `Iets nieuws oprichten. Doelen definiëren. Een team bouwen. Een plan maken.

Je begrijpt elk woord, maar samen betekenen ze — jij zou de initiatiefnemer zijn, degene die alles draagt.

Dat ben jij niet. Je bent niet degene die opstaat tussen twee wantrouwende teams en zegt "ik heb een idee." Niet omdat je geen ideeën hebt — omdat de rol zelf je niet aanspreekt.

Je staat in de menigte. Kijkend. Wachtend.`,

        de: `Etwas Neues gründen. Ziele definieren. Ein Team aufbauen. Einen Plan erstellen.

Du verstehst jedes Wort, aber zusammen bedeuten sie — du wärst der Initiator, derjenige, der alles trägt.

Das bist nicht du. Du bist nicht die Person, die zwischen zwei misstrauischen Teams aufsteht und sagt „Ich habe eine Idee." Nicht weil dir Ideen fehlen — weil die Rolle selbst dich nicht anspricht.

Du stehst in der Menge. Beobachtend. Wartend.`,

        fr: `Fonder quelque chose de nouveau. Définir des objectifs. Bâtir une équipe. Créer un plan.

Tu comprends chaque mot, mais ensemble ils signifient — tu serais l'initiateur, celui qui porte tout.

Ce n'est pas toi. Tu n'es pas la personne qui se lève entre deux équipes méfiantes et dit « j'ai une idée. » Pas parce que tu manques d'idées — parce que le rôle en lui-même ne t'attire pas.

Tu restes dans la foule. Regardant. Attendant.`,

        es: `Fundar algo nuevo. Definir objetivos. Construir un equipo. Crear un plan.

Entiendes cada palabra, pero juntas significan — tú serías el iniciador, el que carga con todo.

Ese no eres tú. No eres la persona que se levanta entre dos equipos desconfiados y dice "tengo una idea." No porque te falten ideas — porque el rol en sí no te atrae.

Te quedas entre la multitud. Observando. Esperando.`,

        pt: `Fundar algo novo. Definir objetivos. Montar uma equipe. Criar um plano.

Você entende cada palavra, mas juntas significam — você seria o iniciador, aquele que carrega tudo.

Esse não é você. Você não é a pessoa que se levanta entre duas equipes desconfiadas e diz "eu tenho uma ideia." Não porque lhe faltem ideias — porque o papel em si não lhe atrai.

Você fica na multidão. Observando. Esperando.`,

        it: `Fondare qualcosa di nuovo. Definire obiettivi. Costruire un team. Creare un piano.

Capisci ogni parola, ma insieme significano — saresti l'iniziatore, quello che porta tutto sulle spalle.

Non sei tu. Non sei la persona che si alza tra due squadre diffidenti e dice "ho un'idea." Non perché ti manchino le idee — perché il ruolo in sé non ti attrae.

Resti tra la folla. Guardando. Aspettando.`,

        ru: `Создать что-то новое. Определить цели. Собрать команду. Составить план.

Ты понимаешь каждое слово, но вместе они означают — ты будешь инициатором, тем, кто несёт всё на себе.

Это не ты. Ты не тот человек, который встаёт между двумя недоверчивыми командами и говорит «у меня есть идея.» Не потому что у тебя нет идей — потому что сама эта роль тебя не привлекает.

Ты стоишь в толпе. Наблюдаешь. Ждёшь.`,

        ja: `新しいものを創る。目標を定義する。チームを組む。計画を立てる。

すべての言葉は理解できる。だがそれらが合わさると——あなたが発起人になる、すべてを背負う人間になるということだ。

それはあなたではない。互いを信頼していない2つのチームの間に立って「アイデアがある」と言う人間ではない。アイデアがないからではない——その役割自体に惹かれないからだ。

群衆の中に立っている。見ている。待っている。`,

        ko: `새로운 것을 만들기. 목표 정의. 팀 구성. 계획 수립.

모든 단어를 이해한다. 하지만 합쳐지면 — 당신이 발기인이 되어, 모든 것을 짊어지는 사람이 된다는 뜻이다.

그건 당신이 아니다. 서로 불신하는 두 팀 사이에서 일어나 "아이디어가 있어"라고 말하는 사람이 아니다. 아이디어가 없어서가 아니다 — 그 역할 자체에 끌리지 않기 때문이다.

군중 속에 서 있다. 지켜보고 있다. 기다리고 있다.`,
      },
    },
  },

  {
    id: 24,
    riasec: "E",
    miniIpCode: "E4",
    miniIpItem: "Market a new line of clothing",
    chapter: "negotiation",
    chapterIndex: 5,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `合同签了。合作框架搭好了。但系统没有让你们休息。

屏幕出现了一条没人预料到的规则：
「第四轮：市场推广挑战。两支合并的队伍获得一批全新的虚拟产品——一个服装品牌系列。你们需为这个品牌制定完整的市场推广策略：品牌定位、目标人群、推广渠道、促销方案。系统将根据策略的完整性和说服力评分。」

墙上出现了产品样板——风格各异的服装，从休闲到正式，从年轻到成熟。旁边是虚拟市场数据：消费者画像、竞品分析、预算约束。

这不是「想个广告语」——需要有人从零搭建完整的营销方案：这个品牌卖给谁，怎么让目标客户知道它，怎么在竞品中突围，预算怎么分配到不同渠道。

那个背对着所有人的女人说了一句：「你们以为你们在一起。但每个人看见的游戏，是不同的。」

然后她坐到了评审的位置。

需要有人主导这个营销策划——定义品牌故事、选择推广策略、说服所有人这个方案能打动市场。这是谈判层最考验商业直觉的一刻。`,

      en: `The contract is signed. The cooperation framework is set. But the system doesn't let you rest.

The screen displays a rule no one expected:
"Round Four: Market Launch Challenge. The merged teams receive a batch of new virtual products — a clothing brand line. You must develop a complete marketing strategy: brand positioning, target audience, promotion channels, promotional campaigns. The system scores based on completeness and persuasiveness."

Product samples appear on the wall — clothing styles from casual to formal, young to mature. Beside them: virtual market data — consumer profiles, competitor analysis, budget constraints.

This isn't "come up with a tagline" — someone needs to build a complete marketing plan from scratch: who does this brand sell to, how to reach the target customers, how to stand out from competitors, how to allocate budget across channels.

The woman who keeps her back to everyone says a single sentence: "You think you're together. But each person sees a different game."

Then she takes the judge's seat.

Someone needs to lead this — define the brand story, choose promotion tactics, convince everyone this plan can win the market. This is the moment on the negotiation floor that tests commercial instinct most.`,

      nl: `Het contract is getekend. Het samenwerkingskader staat. Maar het systeem laat je niet rusten.

Het scherm toont een regel die niemand verwachtte:
"Ronde Vier: Marktlanceringsuitdaging. De samengevoegde teams ontvangen een partij nieuwe virtuele producten — een kledingmerklijn. Jullie moeten een complete marketingstrategie ontwikkelen: merkpositionering, doelgroep, promotiekanalen, promotiecampagnes. Het systeem scoort op basis van strategiecompleetheid en overtuigingskracht."

Productsamples verschijnen op de muur — een reeks kledingstijlen, van casual tot formeel, jong tot volwassen. Ernaast: virtuele marktgegevens met consumentenprofielen, concurrentieanalyse, budgetbeperkingen.

Dit is niet gewoon "bedenk een slogan" — iemand moet een compleet marketingplan vanuit het niets opbouwen: aan wie verkoopt dit merk, hoe bereik je de doelklant, hoe onderscheid je je van concurrenten, hoe verdeel je het budget over kanalen.

De vrouw die met haar rug naar iedereen staat, zegt één zin: "Jullie denken dat jullie samen zijn. Maar iedereen ziet een ander spel."

Dan neemt ze de stoel van de beoordelaar.

Iemand moet deze marketingstrategie leiden — het merkverhaal definiëren, promotietactieken kiezen, iedereen overtuigen dat dit plan de markt kan winnen. Dit is het moment op de onderhandelingsverdieping dat commercieel instinct het meest op de proef stelt.`,

      de: `Der Vertrag ist unterschrieben. Das Kooperationsgerüst steht. Aber das System lässt euch nicht ruhen.

Der Bildschirm zeigt eine Regel, die niemand erwartet hat:
„Runde Vier: Markteinführungs-Challenge. Die fusionierten Teams erhalten eine Charge neuer virtueller Produkte — eine Bekleidungsmarken-Linie. Ihr müsst eine vollständige Marketingstrategie entwickeln: Markenpositionierung, Zielgruppe, Werbekanäle, Promotionskampagnen. Das System bewertet nach Strategievollständigkeit und Überzeugungskraft."

Produktmuster erscheinen an der Wand — eine Reihe von Kleidungsstilen, von lässig bis formell, jung bis reif. Daneben: virtuelle Marktdaten mit Konsumentenprofilen, Wettbewerbsanalyse, Budgetbeschränkungen.

Das ist nicht einfach „denk dir einen Slogan aus" — jemand muss einen kompletten Marketingplan von Grund auf erstellen: An wen verkauft diese Marke, wie erreicht man die Zielkunden, wie hebt man sich von Wettbewerbern ab, wie verteilt man das Budget auf Kanäle.

Die Frau, die allen den Rücken zuwendet, sagt einen einzigen Satz: „Ihr denkt, ihr seid zusammen. Aber jeder sieht ein anderes Spiel."

Dann nimmt sie den Platz der Bewerterin ein.

Jemand muss diese Marketingstrategie führen — die Markengeschichte definieren, Promotionstaktiken wählen, alle überzeugen, dass dieser Plan den Markt gewinnen kann. Das ist der Moment auf der Verhandlungsetage, der kommerziellen Instinkt am meisten auf die Probe stellt.`,

      fr: `Le contrat est signé. Le cadre de coopération est en place. Mais le système ne vous laisse pas souffler.

L'écran affiche une règle que personne n'attendait :
« Quatrième tour : Défi de lancement marché. Les équipes fusionnées reçoivent un lot de nouveaux produits virtuels — une ligne de marque de vêtements. Vous devez développer une stratégie marketing complète : positionnement de marque, cible, canaux de promotion, campagnes promotionnelles. Le système notera selon la complétude et la force de persuasion de la stratégie. »

Des échantillons de produits apparaissent sur le mur — une gamme de styles vestimentaires, du décontracté au formel, du jeune au mature. À côté : des données de marché virtuelles montrant profils de consommateurs, analyse concurrentielle, contraintes budgétaires.

Ce n'est pas juste « trouve un slogan » — quelqu'un doit construire un plan marketing complet à partir de rien : à qui cette marque vend-elle, comment faire connaître le produit aux clients cibles, comment se démarquer de la concurrence, comment répartir le budget entre les canaux.

La femme qui tourne le dos à tout le monde prononce une seule phrase : « Vous croyez être ensemble. Mais chacun voit un jeu différent. »

Puis elle prend le siège du jury.

Quelqu'un doit mener cette stratégie marketing — définir l'histoire de la marque, choisir les tactiques de promotion, convaincre tout le monde que ce plan peut conquérir le marché. C'est le moment de l'étage de négociation qui met le plus à l'épreuve l'instinct commercial.`,

      es: `El contrato está firmado. El marco de cooperación está listo. Pero el sistema no te deja descansar.

La pantalla muestra una regla que nadie esperaba:
"Ronda Cuatro: Desafío de Lanzamiento al Mercado. Los equipos fusionados reciben un lote de nuevos productos virtuales — una línea de marca de ropa. Deben desarrollar una estrategia de marketing completa: posicionamiento de marca, público objetivo, canales de promoción, campañas promocionales. El sistema puntuará según la integridad y persuasión de la estrategia."

Muestras de productos aparecen en la pared — una gama de estilos de ropa, de casual a formal, de joven a maduro. Al lado: datos de mercado virtuales con perfiles de consumidores, análisis de competencia, restricciones de presupuesto.

Esto no es solo "piensa en un eslogan" — alguien necesita construir un plan de marketing completo desde cero: a quién vende esta marca, cómo hacer que los clientes objetivo la conozcan, cómo diferenciarse de la competencia, cómo distribuir el presupuesto entre canales.

La mujer que siempre da la espalda a todos dice una sola frase: "Creen que están juntos. Pero cada uno ve un juego diferente."

Luego toma el asiento del jurado.

Alguien debe liderar esta estrategia de marketing — definir la historia de la marca, elegir tácticas de promoción, convencer a todos de que este plan puede conquistar el mercado. Este es el momento del piso de negociación que más pone a prueba el instinto comercial.`,

      pt: `O contrato está assinado. A estrutura de cooperação está pronta. Mas o sistema não deixa vocês descansarem.

A tela mostra uma regra que ninguém esperava:
"Quarta Rodada: Desafio de Lançamento no Mercado. As equipes unificadas recebem um lote de novos produtos virtuais — uma linha de marca de roupas. Vocês devem desenvolver uma estratégia de marketing completa: posicionamento de marca, público-alvo, canais de promoção, campanhas promocionais. O sistema avaliará com base na completude e poder de persuasão da estratégia."

Amostras de produtos aparecem na parede — uma gama de estilos de roupa, do casual ao formal, do jovem ao maduro. Ao lado: dados de mercado virtuais com perfis de consumidores, análise de concorrência, restrições orçamentárias.

Isso não é apenas "pense em um slogan" — alguém precisa construir um plano de marketing completo do zero: para quem essa marca vende, como fazer os clientes-alvo conhecerem ela, como se destacar dos concorrentes, como alocar o orçamento entre os canais.

A mulher que mantém as costas viradas para todos diz uma única frase: "Vocês acham que estão juntos. Mas cada um vê um jogo diferente."

Então ela toma o assento de juíza.

Alguém precisa liderar essa estratégia de marketing — definir a história da marca, escolher táticas de promoção, convencer todos de que este plano pode conquistar o mercado. Este é o momento do andar de negociação que mais testa o instinto comercial.`,

      it: `Il contratto è firmato. La struttura di cooperazione è pronta. Ma il sistema non vi lascia riposare.

Lo schermo mostra una regola che nessuno si aspettava:
"Quarto turno: Sfida di Lancio sul Mercato. Le squadre unite ricevono un lotto di nuovi prodotti virtuali — una linea di marca di abbigliamento. Dovete sviluppare una strategia di marketing completa: posizionamento del marchio, target di riferimento, canali di promozione, campagne promozionali. Il sistema valuterà in base alla completezza e alla forza persuasiva della strategia."

Campioni di prodotto appaiono sulla parete — una gamma di stili di abbigliamento, dal casual al formale, dal giovane al maturo. Accanto: dati di mercato virtuali con profili dei consumatori, analisi della concorrenza, vincoli di budget.

Non si tratta solo di "inventare uno slogan" — qualcuno deve costruire un piano di marketing completo da zero: a chi vende questo marchio, come far conoscere il prodotto ai clienti target, come distinguersi dalla concorrenza, come allocare il budget tra i canali.

La donna che tiene le spalle rivolte a tutti pronuncia una sola frase: "Credete di essere insieme. Ma ciascuno vede un gioco diverso."

Poi prende il posto del giudice.

Qualcuno deve guidare questa strategia di marketing — definire la storia del marchio, scegliere le tattiche promozionali, convincere tutti che questo piano può vincere il mercato. Questo è il momento del piano di negoziazione che mette più alla prova l'istinto commerciale.`,

      ru: `Контракт подписан. Рамки сотрудничества установлены. Но система не даёт передышки.

На экране появляется правило, которого никто не ожидал:
«Четвёртый раунд: Вызов по выводу на рынок. Объединённые команды получают партию новых виртуальных продуктов — линейку одежного бренда. Вам нужно разработать полную маркетинговую стратегию: позиционирование бренда, целевую аудиторию, каналы продвижения, промо-кампании. Система оценит полноту стратегии и её убедительность.»

На стене появляются образцы продукции — ряд стилей одежды, от повседневной до формальной, от молодёжной до зрелой. Рядом: виртуальные рыночные данные с профилями потребителей, анализом конкурентов, бюджетными ограничениями.

Это не просто «придумайте слоган» — кто-то должен с нуля построить полный маркетинговый план: кому продаёт этот бренд, как донести до целевых клиентов, как выделиться среди конкурентов, как распределить бюджет по каналам.

Женщина, стоящая спиной ко всем, произносит одну фразу: «Вы думаете, что вы вместе. Но каждый видит свою игру.»

Затем она садится в кресло судьи.

Кто-то должен возглавить эту маркетинговую стратегию — определить историю бренда, выбрать тактику продвижения, убедить всех, что этот план может покорить рынок. Это момент на переговорном этаже, который больше всего проверяет коммерческую интуицию.`,

      ja: `契約が署名された。協力の枠組みが出来上がった。だがシステムは休ませてくれない。

画面に、誰も予想していなかったルールが表示される：
「第4ラウンド：市場投入チャレンジ。統合チームは新しい仮想製品のバッチを受け取ります——アパレルブランドのラインナップです。完全なマーケティング戦略を策定してください：ブランドポジショニング、ターゲット層、プロモーションチャネル、販促キャンペーン。システムは戦略の完成度と説得力に基づいて評価します。」

壁に製品サンプルが現れる——カジュアルからフォーマル、若者向けから大人向けまで、さまざまなスタイルの服。隣には仮想市場データ：消費者プロフィール、競合分析、予算制約。

これは単に「キャッチコピーを考える」ではない——誰かがゼロから完全なマーケティングプランを構築する必要がある：このブランドは誰に売るのか、ターゲット顧客にどう認知させるか、競合からどう差別化するか、予算をチャネル間でどう配分するか。

いつも背を向けている女性が一言だけ言う：「あなたたちは一緒にいると思っている。でも、一人一人が見ているゲームは違う。」

そして彼女は審査員の席に座る。

誰かがこのマーケティング戦略をリードしなければならない——ブランドストーリーを定義し、プロモーション戦術を選び、このプランが市場を制覇できると全員を説得する。これは交渉フロア全体で最もビジネス直感が試される瞬間だ。`,

      ko: `계약이 서명됐다. 협력 틀이 갖춰졌다. 하지만 시스템은 쉬게 해주지 않는다.

화면에 아무도 예상하지 못한 규칙이 표시된다:
"4라운드: 시장 출시 챌린지. 통합된 팀은 새로운 가상 제품 — 의류 브랜드 라인을 받습니다. 완전한 마케팅 전략을 수립해야 합니다: 브랜드 포지셔닝, 타겟 고객, 홍보 채널, 프로모션 캠페인. 시스템이 전략의 완성도와 설득력을 기준으로 평가합니다."

벽에 제품 샘플이 나타난다 — 캐주얼부터 포멀까지, 젊은 층부터 성숙한 층까지 다양한 스타일의 옷. 옆에는 가상 시장 데이터: 소비자 프로필, 경쟁사 분석, 예산 제약.

이것은 단순히 "광고 문구를 생각하라"가 아니다 — 누군가 처음부터 완전한 마케팅 계획을 세워야 한다: 이 브랜드는 누구에게 파는지, 타겟 고객에게 어떻게 알리는지, 경쟁사에서 어떻게 돋보이는지, 예산을 채널별로 어떻게 배분하는지.

모두에게 등을 돌린 채 있던 여자가 한마디를 한다: "당신들은 함께라고 생각하지. 하지만 각자가 보는 게임은 다르다."

그러고 나서 그녀는 심사위원 자리에 앉는다.

누군가 이 마케팅 전략을 주도해야 한다 — 브랜드 스토리를 정의하고, 홍보 전술을 선택하고, 이 계획이 시장을 정복할 수 있다고 모두를 설득해야 한다. 이것은 전체 협상 층에서 가장 비즈니스 감각을 시험하는 순간이다.`,
    },
    taskDescription: {
      zh: "为新服装品牌制定完整的市场推广策略——品牌定位、目标客群分析、渠道选择、促销方案设计。这项任务需要一个主要负责人。",

      en: `Develop a complete marketing strategy for the new clothing brand — brand positioning, target audience analysis, channel selection, promotional campaign design. This task needs one primary person.`,

      nl: "Ontwikkel een complete marketingstrategie voor het nieuwe kledingmerk — merkpositionering, doelgroepanalyse, kanaalkeuze, promotiecampagne-ontwerp. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Entwickle eine vollständige Marketingstrategie für die neue Bekleidungsmarke — Markenpositionierung, Zielgruppenanalyse, Kanalauswahl, Werbekampagnendesign. Diese Aufgabe braucht eine Hauptperson.",

      fr: "Développez une stratégie marketing complète pour la nouvelle marque de vêtements — positionnement de marque, analyse du public cible, choix des canaux, conception de campagne promotionnelle. Cette tâche nécessite un responsable principal.",

      es: "Desarrolla una estrategia de marketing completa para la nueva marca de ropa — posicionamiento de marca, análisis del público objetivo, selección de canales, diseño de campaña promocional. Esta tarea necesita un responsable principal.",

      pt: "Desenvolva uma estratégia de marketing completa para a nova marca de roupas — posicionamento de marca, análise do público-alvo, seleção de canais, design de campanha promocional. Esta tarefa precisa de um responsável principal.",

      it: "Sviluppa una strategia di marketing completa per il nuovo marchio di abbigliamento — posizionamento del marchio, analisi del target, scelta dei canali, progettazione della campagna promozionale. Questo compito richiede un responsabile principale.",

      ru: "Разработайте полную маркетинговую стратегию для нового бренда одежды — позиционирование бренда, анализ целевой аудитории, выбор каналов, дизайн промо-кампании. Для этой задачи нужен один главный ответственный.",

      ja: "新しいアパレルブランドの完全なマーケティング戦略を策定する——ブランドポジショニング、ターゲット層分析、チャネル選択、プロモーションキャンペーン設計。この任務には主担当者が一人必要です。",

      ko: "새로운 의류 브랜드의 완전한 마케팅 전략을 수립하세요 — 브랜드 포지셔닝, 타겟 고객 분석, 채널 선택, 프로모션 캠페인 설계. 이 임무에는 한 명의 주 담당자가 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你站出来了。

不是犹豫之后——是看到那些产品样板和市场数据的瞬间，你就知道这个人是你。

市场推广。把一个品牌从无到有地推入消费者心智。分析目标人群、选择触达渠道、设计能引发行动的促销方案——这些东西在你脑子里自动组装成了一套完整的策略。

你走到展示墙前，拿起一支笔，开始画框架。品牌定位、目标客群画像、渠道矩阵、营销日历。

Adrian 在旁边看着你的框架成型，他的表情从困惑变成了点头。对面队伍的人也凑过来看——你的逻辑让他们安静了。

那个坐在评审位的女人在看着你。你感觉到了她的目光，但你没有分神。

这是你的战场。`,

        en: `You step forward.

Not after hesitation — the moment you see those product samples and market data, you know this person is you.

Marketing. Building a brand from nothing into consumers' minds. Analyzing the target audience, selecting reach channels, designing promotions that drive action — these things auto-assemble in your head into a complete strategy.

You walk to the display wall, pick up a marker, and start drawing the framework. Brand positioning, target customer profiles, channel matrix, marketing calendar.

Adrian watches your framework take shape, his expression shifting from confusion to a nod. People from the other team come over to look too — your logic silences them.

The woman in the judge's seat is watching you. You feel her gaze, but you don't lose focus.

This is your arena.`,

        nl: `Je stapt naar voren.

Niet na aarzeling — op het moment dat je die productsamples en marktgegevens ziet, weet je dat dit jouw moment is.

Marketing. Een merk vanuit het niets in het bewustzijn van consumenten bouwen. De doelgroep analyseren, bereikkanalen selecteren, promoties ontwerpen die actie stimuleren — deze dingen assembleren automatisch in je hoofd tot een complete strategie.

Je loopt naar de displaymuur, pakt een stift en begint het kader te tekenen. Merkpositionering, doelklantprofielen, kanaalmatrix, marketingkalender.

Adrian kijkt hoe je kader vorm krijgt, zijn uitdrukking verandert van verwarring in een knik. Mensen van het andere team komen ook kijken — je logica brengt hen tot stilte.

De vrouw op de beoordelaarsstoel kijkt naar je. Je voelt haar blik, maar verliest je focus niet.

Dit is jouw arena.`,

        de: `Du trittst vor.

Nicht nach Zögern — in dem Moment, als du die Produktmuster und Marktdaten siehst, weißt du, dass du dran bist.

Marketing. Eine Marke aus dem Nichts in die Köpfe der Verbraucher bringen. Die Zielgruppe analysieren, Reichweitenkanäle wählen, Aktionen entwerfen, die zum Handeln bewegen — diese Dinge setzen sich in deinem Kopf automatisch zu einer vollständigen Strategie zusammen.

Du gehst zur Displaywand, nimmst einen Marker und beginnst das Gerüst zu zeichnen. Markenpositionierung, Zielkundenprofile, Kanalmatrix, Marketingkalender.

Adrian beobachtet, wie dein Gerüst Gestalt annimmt, sein Ausdruck wechselt von Verwirrung zu einem Nicken. Leute vom anderen Team kommen auch schauen — deine Logik bringt sie zum Schweigen.

Die Frau auf dem Bewertungsstuhl beobachtet dich. Du spürst ihren Blick, verlierst aber nicht den Fokus.

Das ist deine Arena.`,

        fr: `Tu fais un pas en avant.

Pas après hésitation — à l'instant où tu vois les échantillons et les données de marché, tu sais que c'est toi.

Marketing. Construire une marque à partir de rien dans l'esprit des consommateurs. Analyser le public cible, sélectionner les canaux de diffusion, concevoir des promotions qui déclenchent l'action — ces éléments s'assemblent automatiquement dans ta tête en une stratégie complète.

Tu marches vers le mur d'affichage, prends un feutre et commences à dessiner le cadre. Positionnement de marque, profils clients cibles, matrice de canaux, calendrier marketing.

Adrian regarde ton cadre prendre forme, son expression passant de la confusion à un hochement de tête. Des gens de l'autre équipe viennent regarder aussi — ta logique les fait taire.

La femme sur le siège du jury te regarde. Tu sens son regard, mais tu ne perds pas ta concentration.

C'est ton arène.`,

        es: `Das un paso adelante.

No después de dudar — en el instante en que ves las muestras de productos y los datos de mercado, sabes que eres tú.

Marketing. Construir una marca de la nada en la mente de los consumidores. Analizar el público objetivo, seleccionar canales de alcance, diseñar promociones que impulsen la acción — estos elementos se ensamblan automáticamente en tu cabeza en una estrategia completa.

Caminas al muro de exhibición, tomas un marcador y empiezas a dibujar el marco. Posicionamiento de marca, perfiles del cliente objetivo, matriz de canales, calendario de marketing.

Adrian observa cómo tu marco toma forma, su expresión cambia de confusión a un asentimiento. Gente del otro equipo también se acerca a mirar — tu lógica los silencia.

La mujer en el asiento del jurado te observa. Sientes su mirada, pero no pierdes el foco.

Esta es tu arena.`,

        pt: `Você dá um passo à frente.

Não após hesitação — no momento em que vê as amostras de produtos e os dados de mercado, você sabe que é você.

Marketing. Construir uma marca do nada na mente dos consumidores. Analisar o público-alvo, selecionar canais de alcance, criar promoções que impulsionem ação — esses elementos se montam automaticamente na sua cabeça numa estratégia completa.

Você vai até o mural de exibição, pega um marcador e começa a desenhar a estrutura. Posicionamento de marca, perfis do cliente-alvo, matriz de canais, calendário de marketing.

Adrian observa sua estrutura tomar forma, sua expressão mudando de confusão para um aceno. Pessoas da outra equipe também se aproximam para ver — sua lógica os silencia.

A mulher no assento de juíza está observando. Você sente seu olhar, mas não perde o foco.

Esta é sua arena.`,

        it: `Fai un passo avanti.

Non dopo esitazione — nel momento in cui vedi i campioni di prodotto e i dati di mercato, sai che tocca a te.

Marketing. Costruire un marchio dal nulla nella mente dei consumatori. Analizzare il target, selezionare i canali di diffusione, progettare promozioni che spingano all'azione — questi elementi si assemblano automaticamente nella tua testa in una strategia completa.

Cammini fino alla parete espositiva, prendi un pennarello e cominci a disegnare lo schema. Posizionamento del marchio, profili del cliente target, matrice dei canali, calendario di marketing.

Adrian osserva il tuo schema prendere forma, la sua espressione passa dalla confusione a un cenno del capo. Persone dell'altra squadra si avvicinano a guardare — la tua logica li zittisce.

La donna sul seggio del giudice ti osserva. Senti il suo sguardo, ma non perdi la concentrazione.

Questa è la tua arena.`,

        ru: `Ты выходишь вперёд.

Не после колебаний — в тот момент, когда ты видишь образцы продукции и рыночные данные, ты знаешь: это твой выход.

Маркетинг. Построить бренд с нуля в сознании потребителей. Проанализировать целевую аудиторию, выбрать каналы охвата, спроектировать промо-акции, побуждающие к действию — эти элементы автоматически собираются в голове в цельную стратегию.

Ты подходишь к демонстрационной стене, берёшь маркер и начинаешь рисовать каркас. Позиционирование бренда, профили целевых клиентов, матрица каналов, маркетинговый календарь.

Адриан наблюдает, как твой каркас обретает форму, выражение лица меняется от растерянности к кивку. Люди из другой команды тоже подходят посмотреть — твоя логика заставляет их замолчать.

Женщина в кресле судьи наблюдает за тобой. Ты чувствуешь её взгляд, но не теряешь фокус.

Это твоя арена.`,

        ja: `前に出る。

躊躇の後ではない——製品サンプルと市場データを見た瞬間、これは自分だと分かる。

マーケティング。ブランドをゼロから消費者の意識に構築する。ターゲット層の分析、リーチチャネルの選択、行動を促すプロモーションの設計——これらが頭の中で自動的に完全な戦略に組み上がる。

ディスプレイ壁に歩み寄り、マーカーを取ってフレームワークを描き始める。ブランドポジショニング、ターゲット顧客プロフィール、チャネルマトリックス、マーケティングカレンダー。

エイドリアンがフレームワークの形成を見ている。困惑の表情がうなずきに変わる。相手チームの人たちも見に来る——あなたのロジックが彼らを黙らせる。

審査員の席の女性がこちらを見ている。その視線を感じるが、集中は切れない。

ここがあなたのアリーナだ。`,

        ko: `앞으로 나선다.

망설임 뒤가 아니다 — 제품 샘플과 시장 데이터를 보는 순간, 이 사람은 자신이라는 걸 안다.

마케팅. 브랜드를 무에서 소비자의 마음에 구축하기. 타겟 고객 분석, 도달 채널 선택, 행동을 유발하는 프로모션 설계 — 이것들이 머릿속에서 자동으로 완전한 전략으로 조립된다.

전시벽으로 걸어가 마커를 집어 들고 프레임워크를 그리기 시작한다. 브랜드 포지셔닝, 타겟 고객 프로필, 채널 매트릭스, 마케팅 캘린더.

에이드리안이 프레임워크가 형성되는 것을 지켜본다. 당혹에서 고개 끄덕임으로 표정이 바뀐다. 상대 팀 사람들도 보러 온다 — 당신의 논리가 그들을 조용하게 만든다.

심사위원 자리의 여자가 지켜보고 있다. 그녀의 시선을 느끼지만 집중을 잃지 않는다.

여기가 당신의 경기장이다.`,
      },
      score4: {
        zh: `市场推广。品牌策略。产品定位。

你深吸一口气，站了出来。不是因为你觉得自己最合适——是因为你觉得你做得了。

你走到展示墙前，花了十秒浏览那些产品样板和市场数据。然后你开始梳理策略。

第一个方案框架出来的时候，你感觉到了一种确定感——你知道目标客群是谁，渠道选择的逻辑也站得住。Adrian 提了个问题，你想了一下，调整了推广节奏的优先级。

不是最完美的营销方案，但足够清晰。审判席的女人在看着你——你没有回避她的目光。`,

        en: `Marketing. Brand strategy. Product positioning.

You take a deep breath and step forward. Not because you think you're the best fit — because you think you can handle it.

You walk to the display wall and spend ten seconds scanning the product samples and market data. Then you start building a strategy.

When the first framework takes shape, you feel certainty — you know who the target audience is, and your channel logic holds. Adrian raises a question. You think for a moment, adjust the promotion timeline priorities.

Not the most polished marketing plan, but clear enough. The woman at the judge's seat is watching — you don't avoid her gaze.`,

        nl: `Marketing. Merkstrategie. Productpositionering.

Je haalt diep adem en stapt naar voren. Niet omdat je denkt dat je het best past — omdat je denkt dat je het aankunt.

Je loopt naar de displaymuur en besteedt tien seconden aan het scannen van de productsamples en marktgegevens. Dan begin je een strategie op te bouwen.

Als het eerste raamwerk vorm krijgt, voel je zekerheid — je weet wie de doelgroep is en je kanaallogica houdt stand. Adrian stelt een vraag. Je denkt even na en past de prioriteiten van het promotietijdlijn aan.

Niet het meest gepolijste marketingplan, maar helder genoeg. De vrouw op de beoordelaarsstoel kijkt — je vermijdt haar blik niet.`,

        de: `Marketing. Markenstrategie. Produktpositionierung.

Du atmest tief ein und trittst vor. Nicht weil du denkst, du passt am besten — weil du denkst, du schaffst das.

Du gehst zur Displaywand und verbringst zehn Sekunden damit, die Produktmuster und Marktdaten zu überfliegen. Dann fängst du an, eine Strategie aufzubauen.

Als das erste Framework Form annimmt, spürst du Gewissheit — du weißt, wer die Zielgruppe ist, und deine Kanallogik hält stand. Adrian stellt eine Frage. Du denkst kurz nach und passt die Prioritäten der Werbezeitplanung an.

Nicht der eleganteste Marketingplan, aber klar genug. Die Frau auf dem Bewertungsstuhl schaut — du weichst ihrem Blick nicht aus.`,

        fr: `Marketing. Stratégie de marque. Positionnement produit.

Tu inspires profondément et fais un pas en avant. Pas parce que tu penses être le plus adapté — parce que tu penses pouvoir y arriver.

Tu marches vers le mur d'affichage et passes dix secondes à scanner les échantillons de produits et les données de marché. Puis tu commences à construire une stratégie.

Quand le premier cadre prend forme, tu ressens de la certitude — tu sais qui est le public cible et ta logique de canaux tient. Adrian pose une question. Tu réfléchis un instant et ajustes les priorités du calendrier promotionnel.

Pas le plan marketing le plus raffiné, mais assez clair. La femme au siège du jury regarde — tu ne détournes pas le regard.`,

        es: `Marketing. Estrategia de marca. Posicionamiento de producto.

Respiras hondo y das un paso adelante. No porque creas que eres el más adecuado — porque crees que puedes manejarlo.

Caminas hasta el muro de exhibición y dedicas diez segundos a escanear las muestras de producto y los datos de mercado. Luego empiezas a armar una estrategia.

Cuando el primer marco toma forma, sientes certeza — sabes quién es el público objetivo y tu lógica de canales se sostiene. Adrian plantea una pregunta. Piensas un momento y ajustas las prioridades del calendario de promoción.

No el plan de marketing más pulido, pero suficientemente claro. La mujer en el asiento del jurado observa — no evitas su mirada.`,

        pt: `Marketing. Estratégia de marca. Posicionamento de produto.

Você respira fundo e dá um passo à frente. Não porque acha que é o mais adequado — porque acha que consegue lidar com isso.

Caminha até o mural de exibição e gasta dez segundos escaneando as amostras de produtos e dados de mercado. Então começa a construir uma estratégia.

Quando o primeiro framework ganha forma, você sente certeza — sabe quem é o público-alvo e sua lógica de canais se sustenta. Adrian faz uma pergunta. Você pensa um momento e ajusta as prioridades do cronograma de promoção.

Não o plano de marketing mais polido, mas claro o bastante. A mulher na cadeira do júri está olhando — você não desvia o olhar.`,

        it: `Marketing. Strategia di marchio. Posizionamento prodotto.

Fai un respiro profondo e fai un passo avanti. Non perché pensi di essere il più adatto — perché pensi di potercela fare.

Cammini verso la parete espositiva e dedichi dieci secondi a scorrere i campioni di prodotto e i dati di mercato. Poi cominci a costruire una strategia.

Quando il primo framework prende forma, senti certezza — sai chi è il target e la tua logica dei canali regge. Adrian fa una domanda. Pensi un momento e aggiusti le priorità del calendario promozionale.

Non il piano di marketing più raffinato, ma abbastanza chiaro. La donna sulla sedia del giudice osserva — non eviti il suo sguardo.`,

        ru: `Маркетинг. Стратегия бренда. Позиционирование продукта.

Ты глубоко вдыхаешь и выходишь вперёд. Не потому что считаешь себя лучшим кандидатом — потому что считаешь, что справишься.

Ты подходишь к выставочной стене и тратишь десять секунд на осмотр образцов продукции и рыночных данных. Потом начинаешь выстраивать стратегию.

Когда первый каркас обретает форму, ты чувствуешь уверенность — ты знаешь, кто целевая аудитория, и логика каналов выдерживает. Адриан задаёт вопрос. Ты думаешь секунду и корректируешь приоритеты графика продвижения.

Не самый отточенный маркетинговый план, но достаточно ясный. Женщина в кресле судьи наблюдает — ты не отводишь взгляд.`,

        ja: `マーケティング。ブランド戦略。商品ポジショニング。

深呼吸して前に出る。自分が最適だと思うからではない——やれると思うからだ。

展示壁に歩み寄り、10秒かけて製品サンプルと市場データをスキャンする。そして戦略を組み立て始める。

最初のフレームワークが形になったとき、確信を感じる——ターゲット層が誰か分かっている、チャネルのロジックも成立している。エイドリアンが質問する。少し考え、プロモーションスケジュールの優先順位を調整する。

最も洗練されたマーケティングプランではないが、十分に明確だ。審査員席の女性が見ている——視線を逸らさない。`,

        ko: `마케팅. 브랜드 전략. 제품 포지셔닝.

깊이 숨을 쉬고 앞으로 나선다. 자신이 가장 적합하다고 생각해서가 아니라 — 해낼 수 있다고 생각하기 때문이다.

전시벽으로 걸어가서 10초 동안 제품 샘플과 시장 데이터를 훑는다. 그리고 전략을 세우기 시작한다.

첫 번째 프레임워크가 형태를 갖출 때, 확신을 느낀다 — 타겟 고객이 누구인지 알고, 채널 논리가 성립한다. 에이드리안이 질문한다. 잠시 생각한 뒤 프로모션 일정의 우선순위를 조정한다.

가장 세련된 마케팅 계획은 아니지만, 충분히 명확하다. 심사위원 자리의 여자가 보고 있다 — 그녀의 시선을 피하지 않는다.`,
      },
      score3: {
        zh: `市场推广策略。品牌定位。评审在看。

你站在原地，心里在权衡。你有一些想法——产品不错，市场数据也有参考价值。但制定一整套营销方案、定义品牌故事、选择推广渠道——你不确定自己对这些有足够的热情。

Adrian 又看了一圈。你犹豫了几秒，然后说了句：「我可以帮忙分析市场数据，但主导营销策略的人……也许你更合适。」`,

        en: `Marketing strategy. Brand positioning. The judge is watching.

You stand still, weighing. You have some ideas — the products are decent, the market data has reference value. But building a complete marketing plan, defining the brand story, selecting promotion channels — you're not sure you have enough passion for all of that.

Adrian scans the group again. You hesitate a few seconds, then say: "I can help analyze the market data, but the one leading the marketing strategy... maybe you're better suited."`,

        nl: `Marketingstrategie. Merkpositionering. De beoordelaar kijkt.

Je staat stil, aan het afwegen. Je hebt wat ideeën — de producten zijn prima, de marktgegevens hebben referentiewaarde. Maar een compleet marketingplan opzetten, het merkverhaal definiëren, promotiekanalen kiezen — je weet niet zeker of je daar genoeg passie voor hebt.

Adrian kijkt de groep weer rond. Je aarzelt een paar seconden en zegt: "Ik kan helpen de marktgegevens te analyseren, maar degene die de marketingstrategie leidt... misschien ben jij meer geschikt."`,

        de: `Marketingstrategie. Markenpositionierung. Die Bewerterin schaut zu.

Du stehst still und wägst ab. Du hast einige Ideen — die Produkte sind okay, die Marktdaten haben Referenzwert. Aber einen kompletten Marketingplan aufstellen, die Markengeschichte definieren, Werbekanäle wählen — du bist nicht sicher, ob du dafür genug Leidenschaft hast.

Adrian blickt erneut durch die Gruppe. Du zögerst ein paar Sekunden und sagst: „Ich kann bei der Analyse der Marktdaten helfen, aber wer die Marketingstrategie führt... vielleicht bist du besser geeignet."`,

        fr: `Stratégie marketing. Positionnement de marque. Le jury regarde.

Tu restes immobile, pesant le pour et le contre. Tu as quelques idées — les produits sont corrects, les données de marché ont de la valeur. Mais construire un plan marketing complet, définir l'histoire de la marque, choisir les canaux de promotion — tu n'es pas sûr d'avoir assez de passion pour tout ça.

Adrian parcourt le groupe du regard. Tu hésites quelques secondes, puis dis : « Je peux aider à analyser les données de marché, mais celui qui mène la stratégie marketing... tu es peut-être mieux placé. »`,

        es: `Estrategia de marketing. Posicionamiento de marca. El jurado mira.

Te quedas quieto, sopesando. Tienes algunas ideas — los productos están bien, los datos de mercado tienen valor de referencia. Pero construir un plan de marketing completo, definir la historia de la marca, seleccionar canales de promoción — no estás seguro de tener suficiente pasión para todo eso.

Adrian recorre al grupo con la mirada. Dudas unos segundos y dices: "Puedo ayudar a analizar los datos de mercado, pero quien lidere la estrategia de marketing... quizá tú seas más adecuado."`,

        pt: `Estratégia de marketing. Posicionamento de marca. A juíza está olhando.

Você fica parado, ponderando. Tem algumas ideias — os produtos são bons, os dados de mercado têm valor de referência. Mas construir um plano de marketing completo, definir a história da marca, selecionar canais de promoção — você não tem certeza de ter paixão suficiente para tudo isso.

Adrian percorre o grupo novamente. Você hesita alguns segundos e diz: "Posso ajudar a analisar os dados de mercado, mas quem lidera a estratégia de marketing... talvez você seja mais adequado."`,

        it: `Strategia di marketing. Posizionamento del marchio. Il giudice osserva.

Resti fermo, soppesando. Hai qualche idea — i prodotti sono buoni, i dati di mercato hanno valore di riferimento. Ma costruire un piano di marketing completo, definire la storia del marchio, scegliere i canali di promozione — non sei sicuro di avere abbastanza passione per tutto questo.

Adrian scruta di nuovo il gruppo. Esiti qualche secondo, poi dici: "Posso aiutare ad analizzare i dati di mercato, ma chi guida la strategia di marketing... forse sei più adatto tu."`,

        ru: `Маркетинговая стратегия. Позиционирование бренда. Судья наблюдает.

Ты стоишь на месте, взвешивая. У тебя есть идеи — продукты неплохие, рыночные данные имеют референтную ценность. Но выстроить полный маркетинговый план, определить историю бренда, выбрать каналы продвижения — ты не уверен, что у тебя достаточно страсти для всего этого.

Адриан снова оглядывает группу. Ты колеблешься несколько секунд, потом говоришь: «Я могу помочь проанализировать рыночные данные, но тот, кто поведёт маркетинговую стратегию... может, ты лучше подходишь.»`,

        ja: `マーケティング戦略。ブランドポジショニング。審査員が見ている。

じっと立って、考えている。いくつかアイデアはある——製品は悪くないし、市場データにも参考価値がある。だが完全なマーケティングプランを構築し、ブランドストーリーを定義し、プロモーションチャネルを選ぶ——そこまでの情熱があるか確信がない。

エイドリアンがもう一度グループを見回す。数秒迷った後、言う：「市場データの分析は手伝える。でもマーケティング戦略を主導するのは……君の方が向いているかもしれない。」`,

        ko: `마케팅 전략. 브랜드 포지셔닝. 심사위원이 지켜보고 있다.

가만히 서서 저울질한다. 몇 가지 아이디어는 있다 — 제품은 괜찮고, 시장 데이터도 참고 가치가 있다. 하지만 완전한 마케팅 계획을 세우고, 브랜드 스토리를 정의하고, 홍보 채널을 선택하는 것 — 그 모든 것에 충분한 열정이 있는지 확신이 없다.

에이드리안이 다시 그룹을 둘러본다. 몇 초 망설이다가 말한다: "시장 데이터 분석은 도와줄 수 있어. 하지만 마케팅 전략을 주도하는 건... 네가 더 적합할 수도 있어."`,
      },
      score2: {
        zh: `市场推广。品牌策划。营销渠道。

你看着那些产品样板和消费者数据，内心的声音很明确：这不是我的战场。

制定营销策略需要的那种对市场的敏感度和对品牌故事的热情——你此刻感觉不到。选错了定位意味着浪费资源，而你不想为一个不确定的判断承担这个责任。

你退后了。让更有营销直觉的人去主导。`,

        en: `Marketing. Brand planning. Promotional channels.

You look at the product samples and consumer data. Your inner voice is definitive: this isn't my battlefield.

Building a marketing strategy requires sensitivity to markets and passion for brand storytelling — you can't feel that right now. Picking the wrong positioning means wasted resources, and you don't want to bear that responsibility for an uncertain call.

You step back. Let someone with better marketing instincts take the lead.`,

        nl: `Marketing. Merkplanning. Promotiekanalen.

Je kijkt naar de productsamples en consumentengegevens. Je innerlijke stem is duidelijk: dit is niet mijn slagveld.

Een marketingstrategie opzetten vereist gevoeligheid voor markten en passie voor merkverhalen — dat voel je nu niet. De verkeerde positionering kiezen betekent verspilde middelen, en je wilt die verantwoordelijkheid niet dragen voor een onzekere inschatting.

Je stapt achteruit. Laat iemand met betere marketinginstincten het voortouw nemen.`,

        de: `Marketing. Markenplanung. Werbekanäle.

Du schaust auf die Produktmuster und Verbraucherdaten. Deine innere Stimme ist eindeutig: Das ist nicht mein Schlachtfeld.

Eine Marketingstrategie aufzubauen erfordert Gespür für Märkte und Leidenschaft für Markengeschichten — das spürst du gerade nicht. Die falsche Positionierung wählen bedeutet verschwendete Ressourcen, und du willst diese Verantwortung nicht für eine unsichere Einschätzung tragen.

Du trittst zurück. Lass jemanden mit besserem Marketinginstinkt die Führung übernehmen.`,

        fr: `Marketing. Planification de marque. Canaux promotionnels.

Tu regardes les échantillons de produits et les données consommateurs. Ta voix intérieure est catégorique : ce n'est pas mon terrain.

Construire une stratégie marketing exige une sensibilité au marché et une passion pour le storytelling de marque — tu ne ressens pas ça en ce moment. Choisir le mauvais positionnement signifie des ressources gaspillées, et tu ne veux pas assumer cette responsabilité pour un pari incertain.

Tu recules. Laisse quelqu'un avec un meilleur instinct marketing prendre les rênes.`,

        es: `Marketing. Planificación de marca. Canales de promoción.

Miras las muestras de producto y los datos de consumidores. Tu voz interior es definitiva: este no es mi campo de batalla.

Construir una estrategia de marketing requiere sensibilidad al mercado y pasión por el storytelling de marca — ahora mismo no lo sientes. Elegir mal el posicionamiento significa recursos desperdiciados, y no quieres cargar con esa responsabilidad por una apuesta incierta.

Te retiras. Que alguien con mejor instinto de marketing tome el liderazgo.`,

        pt: `Marketing. Planejamento de marca. Canais de promoção.

Você olha as amostras de produto e os dados de consumidores. Sua voz interior é definitiva: este não é meu campo de batalha.

Construir uma estratégia de marketing exige sensibilidade ao mercado e paixão pelo storytelling de marca — você não sente isso agora. Escolher o posicionamento errado significa recursos desperdiçados, e você não quer assumir essa responsabilidade por uma aposta incerta.

Você recua. Deixe alguém com melhores instintos de marketing assumir a liderança.`,

        it: `Marketing. Pianificazione del marchio. Canali promozionali.

Guardi i campioni di prodotto e i dati dei consumatori. La tua voce interiore è definitiva: questo non è il mio campo di battaglia.

Costruire una strategia di marketing richiede sensibilità al mercato e passione per il brand storytelling — ora non le senti. Scegliere il posizionamento sbagliato significa risorse sprecate, e non vuoi assumerti quella responsabilità per una scommessa incerta.

Ti fai indietro. Lascia che qualcuno con migliori istinti di marketing prenda il comando.`,

        ru: `Маркетинг. Планирование бренда. Каналы продвижения.

Ты смотришь на образцы продукции и данные о потребителях. Внутренний голос однозначен: это не моё поле боя.

Построение маркетинговой стратегии требует чутья к рынку и страсти к созданию истории бренда — сейчас ты этого не чувствуешь. Ошибиться с позиционированием — значит потерять ресурсы, а ты не хочешь нести эту ответственность за неуверенное решение.

Ты отступаешь. Пусть тот, у кого лучше маркетинговая интуиция, возьмёт на себя лидерство.`,

        ja: `マーケティング。ブランド企画。販促チャネル。

製品サンプルと消費者データを見つめる。内なる声ははっきりしている：これは自分の戦場ではない。

マーケティング戦略の構築には市場への感度とブランドストーリーへの情熱が必要だ——今はそれを感じない。ポジショニングを間違えればリソースの無駄になる。不確かな判断にその責任を負いたくない。

一歩下がる。マーケティングの直感に優れた人にリードを任せよう。`,

        ko: `마케팅. 브랜드 기획. 홍보 채널.

제품 샘플과 소비자 데이터를 바라본다. 내면의 목소리는 단호하다: 이건 내 전장이 아니다.

마케팅 전략 수립에는 시장에 대한 감수성과 브랜드 스토리텔링에 대한 열정이 필요하다 — 지금은 그걸 느낄 수 없다. 포지셔닝을 잘못 잡으면 자원 낭비다. 불확실한 판단에 그 책임을 지고 싶지 않다.

뒤로 물러난다. 마케팅 감각이 더 뛰어난 사람에게 리드를 맡기자.`,
      },
      score1: {
        zh: `市场推广。品牌策划。营销方案。

你看了看那些产品样板和市场数据，然后把目光收回来。

这种场景——分析消费者、构建品牌故事、设计推广渠道——对你来说不只是不擅长，是不感兴趣。

你不想当那个定义品牌方向的人。你留在队伍里。`,

        en: `Marketing. Brand strategy. Promotional planning.

You look at the product samples and market data, then look away.

This scenario — analyzing consumers, building brand stories, designing promotion channels — isn't just "not your strength." It's "not your interest."

You don't want to be the one defining the brand direction. You stay in the group.`,

        nl: `Marketing. Merkstrategie. Promotionele planning.

Je kijkt naar de productsamples en marktgegevens, en kijkt dan weg.

Dit scenario — consumenten analyseren, merkverhalen opbouwen, promotiekanalen ontwerpen — is niet alleen "niet je sterke punt." Het is "niet je interesse."

Je wilt niet degene zijn die de merkrichting bepaalt. Je blijft in de groep.`,

        de: `Marketing. Markenstrategie. Werbeplanung.

Du schaust auf die Produktmuster und Marktdaten und wendest dann den Blick ab.

Dieses Szenario — Verbraucher analysieren, Markengeschichten aufbauen, Werbekanäle gestalten — ist nicht nur „nicht deine Stärke." Es ist „nicht dein Interesse."

Du willst nicht derjenige sein, der die Markenrichtung definiert. Du bleibst in der Gruppe.`,

        fr: `Marketing. Stratégie de marque. Planification promotionnelle.

Tu regardes les échantillons de produits et les données de marché, puis tu détournes le regard.

Ce scénario — analyser les consommateurs, construire des histoires de marque, concevoir des canaux de promotion — ce n'est pas juste « pas ta force. » C'est « pas ton intérêt. »

Tu ne veux pas être celui qui définit la direction de la marque. Tu restes dans le groupe.`,

        es: `Marketing. Estrategia de marca. Planificación promocional.

Miras las muestras de productos y los datos de mercado, luego desvías la mirada.

Este escenario — analizar consumidores, construir historias de marca, diseñar canales de promoción — no es solo "no es tu fortaleza." Es "no es tu interés."

No quieres ser quien defina la dirección de la marca. Te quedas en el grupo.`,

        pt: `Marketing. Estratégia de marca. Planejamento promocional.

Você olha as amostras de produtos e os dados de mercado, depois desvia o olhar.

Este cenário — analisar consumidores, construir histórias de marca, projetar canais de promoção — não é apenas "não é sua força." É "não é seu interesse."

Você não quer ser quem define a direção da marca. Fica no grupo.`,

        it: `Marketing. Strategia di marchio. Pianificazione promozionale.

Guardi i campioni di prodotto e i dati di mercato, poi distogli lo sguardo.

Questo scenario — analizzare consumatori, costruire storie di marchio, progettare canali di promozione — non è solo "non è il tuo forte." È "non è il tuo interesse."

Non vuoi essere quello che definisce la direzione del marchio. Resti nel gruppo.`,

        ru: `Маркетинг. Стратегия бренда. Планирование продвижения.

Ты смотришь на образцы продукции и рыночные данные, потом отводишь взгляд.

Этот сценарий — анализировать потребителей, строить истории бренда, проектировать каналы продвижения — это не просто «не твоя сильная сторона». Это «не твой интерес».

Ты не хочешь быть тем, кто определяет направление бренда. Ты остаёшься в группе.`,

        ja: `マーケティング。ブランド戦略。プロモーション企画。

製品サンプルと市場データを見て、目をそらす。

このシナリオ——消費者の分析、ブランドストーリーの構築、プロモーションチャネルの設計——「得意でない」だけではない。「興味がない」のだ。

ブランドの方向性を定義する人にはなりたくない。グループの中にとどまる。`,

        ko: `마케팅. 브랜드 전략. 프로모션 기획.

제품 샘플과 시장 데이터를 보고, 시선을 돌린다.

이 시나리오 — 소비자를 분석하고, 브랜드 스토리를 구축하고, 홍보 채널을 설계하는 것 — "잘 못하는 것"이 아니다. "관심이 없는 것"이다.

브랜드 방향을 정의하는 사람이 되고 싶지 않다. 그룹에 남는다.`,
      },
    },
  },

  {
    id: 25,
    riasec: "E",
    miniIpCode: "E5",
    miniIpItem: "Sell merchandise at a department store",
    chapter: "negotiation",
    chapterIndex: 5,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `裁决结束。系统给出了基础分配方案。但还有一个附加条件：
「可选交易窗口：两队在最终确认前，可向对方推销附加方案。被对方接受的方案将为推销方带来额外资源。」

你们队有几个「产品」——之前积累的信息、策略、方案——可以打包成对对方有价值的东西。但对方不一定想要。你需要说服他们。

这就是推销：把你手里的东西包装成对方需要的东西，走过去，当面说服他们接受。

每个人都可以参与。问题是：你有多想站出来，向别人推销你手里的东西？`,

      en: `The adjudication ends. The system delivers a baseline allocation. But there's an additional condition:
"Optional Trading Window: Before final confirmation, either team may pitch supplementary proposals to the other. Accepted proposals earn the pitching team bonus resources."

Your team has a few "products" — information, strategies, plans accumulated earlier — that can be packaged as something valuable to the other side. But they may not want it. You need to convince them.

This is sales: package what's in your hands as something the other side needs, walk over, persuade them face to face.

Everyone can participate. The question is: how much do you want to stand up and sell what you've got?`,

      nl: `De arbitrage is voorbij. Het systeem levert een basisverdeling. Maar er is een aanvullende voorwaarde:
"Optioneel Handelsvenster: Voor de definitieve bevestiging mag elk team aanvullende voorstellen pitchen aan de ander. Geaccepteerde voorstellen leveren het pitchende team bonusgrondstoffen op."

Jullie team heeft een paar "producten" — informatie, strategieën, plannen die eerder zijn verzameld — die kunnen worden verpakt als iets waardevols voor de andere kant. Maar ze willen het misschien niet. Je moet ze overtuigen.

Dit is verkoop: verpak wat je hebt als iets dat de andere kant nodig heeft, loop erheen, en overtuig ze face to face.

Iedereen kan meedoen. De vraag is: hoeveel wil jij opstaan en verkopen wat je hebt?`,

      de: `Die Schiedsverhandlung ist vorbei. Das System liefert eine Grundverteilung. Aber es gibt eine zusätzliche Bedingung:
„Optionales Handelsfenster: Vor der endgültigen Bestätigung darf jedes Team dem anderen Zusatzvorschläge präsentieren. Angenommene Vorschläge bringen dem präsentierenden Team Bonusressourcen."

Euer Team hat ein paar „Produkte" — Informationen, Strategien, Pläne, die vorher angesammelt wurden — die als etwas Wertvolles für die andere Seite verpackt werden können. Aber sie wollen es vielleicht nicht. Du musst sie überzeugen.

Das ist Verkauf: Verpacke, was du hast, als etwas, das die andere Seite braucht, geh rüber und überzeuge sie von Angesicht zu Angesicht.

Jeder kann mitmachen. Die Frage ist: Wie sehr willst du aufstehen und verkaufen, was du hast?`,

      fr: `L'arbitrage est terminé. Le système livre une allocation de base. Mais il y a une condition supplémentaire :
« Fenêtre de Trading Optionnelle : Avant la confirmation finale, chaque équipe peut proposer des offres complémentaires à l'autre. Les propositions acceptées rapportent des ressources bonus à l'équipe qui les présente. »

Votre équipe a quelques « produits » — informations, stratégies, plans accumulés plus tôt — qui peuvent être empaquetés en quelque chose de précieux pour l'autre côté. Mais ils n'en veulent peut-être pas. Tu dois les convaincre.

C'est de la vente : emballe ce que tu as comme quelque chose dont l'autre côté a besoin, va les voir, et convaincs-les en personne.

Tout le monde peut participer. La question est : à quel point veux-tu te lever et vendre ce que tu as ?`,

      es: `La adjudicación termina. El sistema entrega una asignación base. Pero hay una condición adicional:
"Ventana de Trading Opcional: Antes de la confirmación final, cualquier equipo puede presentar propuestas complementarias al otro. Las propuestas aceptadas otorgan recursos extra al equipo que las presenta."

Tu equipo tiene algunos "productos" — información, estrategias, planes acumulados antes — que pueden empaquetarse como algo valioso para el otro lado. Pero tal vez no lo quieran. Necesitas convencerlos.

Esto es venta: empaqueta lo que tienes como algo que el otro lado necesita, ve allá y convéncelos cara a cara.

Todos pueden participar. La pregunta es: ¿cuánto quieres levantarte y vender lo que tienes?`,

      pt: `A adjudicação termina. O sistema entrega uma alocação base. Mas há uma condição adicional:
"Janela de Negociação Opcional: Antes da confirmação final, qualquer equipe pode apresentar propostas suplementares à outra. Propostas aceitas rendem recursos bônus à equipe que apresenta."

Sua equipe tem alguns "produtos" — informações, estratégias, planos acumulados antes — que podem ser empacotados como algo valioso para o outro lado. Mas eles podem não querer. Você precisa convencê-los.

Isso é venda: empacote o que tem como algo que o outro lado precisa, vá até eles e convença-os pessoalmente.

Todos podem participar. A pergunta é: quanto você quer se levantar e vender o que tem?`,

      it: `L'arbitrato è finito. Il sistema consegna un'allocazione di base. Ma c'è una condizione aggiuntiva:
"Finestra di Trading Opzionale: Prima della conferma finale, ogni squadra può proporre offerte supplementari all'altra. Le proposte accettate fruttano risorse bonus alla squadra proponente."

La tua squadra ha alcuni "prodotti" — informazioni, strategie, piani accumulati prima — che possono essere confezionati come qualcosa di valore per l'altra parte. Ma potrebbero non volerli. Devi convincerli.

Questo è vendere: confeziona ciò che hai come qualcosa di cui l'altra parte ha bisogno, vai da loro e convincili di persona.

Tutti possono partecipare. La domanda è: quanto vuoi alzarti e vendere ciò che hai?`,

      ru: `Арбитраж закончился. Система выдаёт базовое распределение. Но есть дополнительное условие:
«Необязательное торговое окно: До финального подтверждения любая команда может предложить другой дополнительные предложения. Принятые предложения принесут предлагающей команде бонусные ресурсы.»

У вашей команды есть несколько «продуктов» — информация, стратегии, планы, накопленные ранее — которые можно упаковать как нечто ценное для другой стороны. Но они могут не захотеть. Тебе нужно их убедить.

Это продажи: упакуй то, что у тебя есть, как то, что нужно другой стороне, подойди и убеди их лично.

Каждый может участвовать. Вопрос в том: насколько ты хочешь встать и продать то, что у тебя есть?`,

      ja: `裁定が終わった。システムが基本配分を出す。だが追加条件がある：
「オプション取引ウィンドウ：最終確認前に、いずれかのチームが相手に追加提案をピッチできます。受け入れられた提案は、ピッチしたチームにボーナス資源をもたらします。」

あなたのチームにはいくつかの「製品」がある——以前蓄積した情報、戦略、計画——それらを相手側にとって価値あるものとしてパッケージングできる。だが相手は欲しがらないかもしれない。説得する必要がある。

これはセールスだ：手持ちのものを相手が必要とするものとしてパッケージし、歩いていき、対面で説得する。

全員参加可能。問題は：どれだけ立ち上がって手持ちのものを売りたいか？`,

      ko: `판정이 끝났다. 시스템이 기본 배분을 내린다. 하지만 추가 조건이 있다:
"선택적 거래 창: 최종 확인 전, 어느 팀이든 상대에게 추가 제안을 피칭할 수 있습니다. 수락된 제안은 피칭한 팀에게 보너스 자원을 제공합니다."

당신의 팀에는 몇 가지 "제품"이 있다 — 이전에 축적한 정보, 전략, 계획 — 상대측에 가치 있는 것으로 포장할 수 있다. 하지만 상대가 원하지 않을 수도 있다. 설득해야 한다.

이것은 세일즈다: 손에 있는 것을 상대가 필요로 하는 것으로 포장하고, 걸어가서, 대면으로 설득한다.

모두 참여할 수 있다. 질문은: 얼마나 일어서서 가진 것을 팔고 싶은가?`,
    },
    taskDescription: {
      zh: "向对方队伍推销你们的方案和资源——呈现价值、处理异议、说服对方接受。所有人都可以参与。",

      en: `Pitch your team's proposals and resources to the opposing team — present value, handle objections, persuade them to accept. Everyone can participate.`,

      nl: "Pitch de voorstellen en grondstoffen van je team aan het tegengestelde team — presenteer waarde, behandel bezwaren, overtuig ze om te accepteren. Iedereen kan meedoen.",

      de: "Präsentiere die Vorschläge und Ressourcen deines Teams dem gegnerischen Team — zeige den Wert, gehe auf Einwände ein, überzeuge sie zur Annahme. Jeder kann mitmachen.",

      fr: "Proposez les plans et ressources de votre équipe à l'équipe adverse — présentez la valeur, traitez les objections, persuadez-les d'accepter. Tout le monde peut participer.",

      es: "Presenta las propuestas y recursos de tu equipo al equipo contrario — muestra el valor, maneja las objeciones, convéncelos de aceptar. Todos pueden participar.",

      pt: "Apresente as propostas e recursos da sua equipe para a equipe adversária — demonstre valor, lide com objeções, convença-os a aceitar. Todos podem participar.",

      it: "Presenta le proposte e le risorse della tua squadra alla squadra avversaria — mostra il valore, gestisci le obiezioni, convincili ad accettare. Tutti possono partecipare.",

      ru: "Представьте предложения и ресурсы вашей команды противоположной команде — продемонстрируйте ценность, обработайте возражения, убедите их принять. Все могут участвовать.",

      ja: "相手チームにチームの提案とリソースをピッチする——価値を提示し、異議に対処し、受け入れるよう説得する。全員参加可能。",

      ko: "상대 팀에게 팀의 제안과 자원을 피칭하세요 — 가치를 제시하고, 이의를 처리하고, 수락하도록 설득하세요. 모두 참여할 수 있습니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你整理好了你们的「产品」，走向对面队伍。

推销对你来说不是一个让人不适的词——它是一种能力。你知道怎么把一个东西变成对方想要的东西：先理解他们需要什么，然后展示你手里的东西怎么满足那个需求。

你站到对面队伍的人面前，开始说。你的语气不是推销员式的热情——是一种自信的、清楚的、「这东西对你有用，让我告诉你为什么」的态度。

他们在听。有人提了异议，你回应了。有人开始感兴趣了。

Adrian 在你身后看着，他的嘴角有一个很小的弧度——那是欣赏。`,

        en: `You've organized your team's "products" and walk toward the other team.

Selling isn't an uncomfortable word for you — it's a capability. You know how to turn something into what the other side wants: first understand what they need, then show how what you have meets that need.

You stand before the other team and begin. Your tone isn't salesperson-eager — it's confident, clear, a "this is useful to you, let me tell you why" attitude.

They're listening. Someone raises an objection. You respond. Someone starts showing interest.

Adrian watches from behind. The corner of his mouth carries a small curve — that's appreciation.`,

        nl: `Je hebt de "producten" van je team georganiseerd en loopt naar het andere team.

Verkopen is geen oncomfortabel woord voor je — het is een vaardigheid. Je weet hoe je iets kunt veranderen in wat de andere kant wil: eerst begrijpen wat ze nodig hebben, dan laten zien hoe wat jij hebt aan die behoefte voldoet.

Je staat voor het andere team en begint. Je toon is niet verkopers-enthousiast — het is zelfverzekerd, helder, een "dit is nuttig voor jullie, laat me uitleggen waarom"-houding.

Ze luisteren. Iemand maakt een bezwaar. Je reageert. Iemand begint interesse te tonen.

Adrian kijkt toe van achteren. Zijn mondhoek vertoont een kleine boog — dat is waardering.`,

        de: `Du hast die „Produkte" deines Teams zusammengestellt und gehst zum anderen Team.

Verkaufen ist kein unangenehmes Wort für dich — es ist eine Fähigkeit. Du weißt, wie man etwas in das verwandelt, was die andere Seite will: erst verstehen, was sie brauchen, dann zeigen, wie das, was du hast, dieses Bedürfnis erfüllt.

Du stehst vor dem anderen Team und beginnst. Dein Ton ist nicht verkäuferisch-enthusiastisch — er ist selbstbewusst, klar, eine „das ist nützlich für euch, lasst mich erklären warum"-Haltung.

Sie hören zu. Jemand erhebt einen Einwand. Du reagierst. Jemand zeigt Interesse.

Adrian beobachtet von hinten. Sein Mundwinkel zeigt eine kleine Kurve — das ist Anerkennung.`,

        fr: `Tu as organisé les « produits » de ton équipe et tu marches vers l'autre équipe.

Vendre n'est pas un mot inconfortable pour toi — c'est une compétence. Tu sais comment transformer quelque chose en ce que l'autre côté veut : d'abord comprendre ce dont ils ont besoin, puis montrer comment ce que tu as répond à ce besoin.

Tu te tiens devant l'autre équipe et tu commences. Ton ton n'est pas celui d'un vendeur enthousiaste — il est confiant, clair, une attitude « ceci vous est utile, laissez-moi vous expliquer pourquoi ».

Ils écoutent. Quelqu'un soulève une objection. Tu réponds. Quelqu'un commence à s'intéresser.

Adrian regarde de derrière. Le coin de sa bouche dessine une petite courbe — c'est de l'admiration.`,

        es: `Has organizado los "productos" de tu equipo y caminas hacia el otro equipo.

Vender no es una palabra incómoda para ti — es una capacidad. Sabes cómo convertir algo en lo que el otro lado quiere: primero entender qué necesitan, luego mostrar cómo lo que tienes satisface esa necesidad.

Te paras frente al otro equipo y comienzas. Tu tono no es el entusiasmo de vendedor — es confiado, claro, una actitud de "esto les es útil, déjenme explicarles por qué."

Están escuchando. Alguien pone una objeción. Respondes. Alguien empieza a mostrar interés.

Adrian observa desde atrás. La comisura de su boca traza una pequeña curva — eso es aprecio.`,

        pt: `Você organizou os "produtos" da sua equipe e caminha em direção ao outro time.

Vender não é uma palavra desconfortável para você — é uma capacidade. Você sabe como transformar algo no que o outro lado quer: primeiro entender o que precisam, depois mostrar como o que você tem atende essa necessidade.

Você fica diante do outro time e começa. Seu tom não é entusiasmo de vendedor — é confiante, claro, uma atitude de "isto é útil para vocês, deixem-me explicar por quê."

Eles estão ouvindo. Alguém levanta uma objeção. Você responde. Alguém começa a mostrar interesse.

Adrian observa de trás. O canto de sua boca faz uma pequena curva — isso é apreço.`,

        it: `Hai organizzato i "prodotti" della tua squadra e ti dirigi verso l'altra squadra.

Vendere non è una parola scomoda per te — è una capacità. Sai come trasformare qualcosa in ciò che l'altra parte vuole: prima capire di cosa hanno bisogno, poi mostrare come ciò che hai soddisfa quel bisogno.

Ti piazzi davanti all'altra squadra e cominci. Il tuo tono non è l'entusiasmo da venditore — è sicuro, chiaro, un atteggiamento "questo vi è utile, lasciate che vi spieghi perché."

Stanno ascoltando. Qualcuno solleva un'obiezione. Rispondi. Qualcuno comincia a mostrarsi interessato.

Adrian osserva da dietro. L'angolo della sua bocca disegna una piccola curva — è apprezzamento.`,

        ru: `Ты подготовил «продукты» своей команды и идёшь к другой команде.

Продажа — не неудобное слово для тебя, это навык. Ты знаешь, как превратить что-то в то, что хочет другая сторона: сначала понять, что им нужно, затем показать, как то, что у тебя есть, удовлетворяет эту потребность.

Ты встаёшь перед другой командой и начинаешь. Твой тон — не показной энтузиазм продавца, а уверенный, ясный, «это полезно для вас, позвольте объяснить почему».

Они слушают. Кто-то высказывает возражение. Ты отвечаешь. Кто-то начинает проявлять интерес.

Адриан наблюдает сзади. Уголок его рта слегка изогнут — это признание.`,

        ja: `チームの「製品」を整理し、相手チームに向かって歩く。

セールスはあなたにとって不快な言葉ではない——それは能力だ。あるものを相手が欲しいものに変える方法を知っている：まず彼らが何を必要としているか理解し、次に手持ちのものがそのニーズをどう満たすかを示す。

相手チームの前に立ち、話し始める。トーンはセールスマン的な熱意ではない——自信に満ちた、明快な、「これはあなたたちに役立つ、理由を説明させてほしい」という態度だ。

彼らは聞いている。誰かが異議を唱える。あなたは応答する。誰かが興味を示し始める。

エイドリアンが後ろから見ている。口角にわずかな弧がある——それは賞賛だ。`,

        ko: `팀의 "제품"을 정리하고 상대 팀을 향해 걸어간다.

세일즈는 당신에게 불편한 단어가 아니다 — 그것은 능력이다. 무언가를 상대방이 원하는 것으로 바꾸는 방법을 안다: 먼저 그들이 무엇을 필요로 하는지 이해하고, 그다음 내가 가진 것이 어떻게 그 필요를 충족시키는지 보여준다.

상대 팀 앞에 서서 시작한다. 톤은 세일즈맨식 열정이 아니다 — 자신감 있고, 명확한, "이건 당신들에게 유용합니다, 왜 그런지 설명하겠습니다"라는 태도다.

그들이 듣고 있다. 누군가 이의를 제기한다. 응답한다. 누군가 관심을 보이기 시작한다.

에이드리안이 뒤에서 지켜본다. 입꼬리에 작은 호가 있다 — 그것은 감탄이다.`,
      },
      score4: {
        zh: `推销方案。说服对方。

你想了想你们手里有什么可以卖的，然后走过去了。

你不是天生的推销员，但你知道怎么把话说清楚。你把方案的价值简明扼要地呈现了出来，然后等对方反应。

有人提问，你回答了。有人犹豫，你补充了一个他们没想到的好处。

推销不是你最喜欢的事，但你做得不差。至少有一两个附加方案被接受了。`,

        en: `Pitch the proposal. Convince the other side.

You think about what's sellable, then walk over.

You're not a born salesperson, but you know how to communicate clearly. You present the proposal's value concisely, then wait for reactions.

Someone asks a question. You answer. Someone's on the fence. You add a benefit they hadn't considered.

Selling isn't your favorite thing, but you're not bad at it. At least one or two proposals get accepted.`,

        nl: `Het voorstel pitchen. De andere kant overtuigen.

Je denkt na over wat verkoopbaar is en loopt dan erheen.

Je bent geen geboren verkoper, maar je weet hoe je helder communiceert. Je presenteert de waarde van het voorstel beknopt en wacht dan op reacties.

Iemand stelt een vraag. Je antwoordt. Iemand twijfelt. Je voegt een voordeel toe waar ze niet aan hadden gedacht.

Verkopen is niet je favoriete bezigheid, maar je bent er niet slecht in. Minstens één of twee voorstellen worden geaccepteerd.`,

        de: `Den Vorschlag präsentieren. Die andere Seite überzeugen.

Du überlegst, was verkaufbar ist, und gehst dann rüber.

Du bist kein geborener Verkäufer, aber du weißt, wie man klar kommuniziert. Du präsentierst den Wert des Vorschlags prägnant und wartest auf Reaktionen.

Jemand stellt eine Frage. Du antwortest. Jemand ist unentschlossen. Du fügst einen Vorteil hinzu, an den sie nicht gedacht hatten.

Verkaufen ist nicht dein Lieblingsbeschäftigung, aber du bist nicht schlecht darin. Mindestens ein oder zwei Vorschläge werden angenommen.`,

        fr: `Présenter la proposition. Convaincre l'autre côté.

Tu réfléchis à ce qui est vendable, puis tu y vas.

Tu n'es pas un vendeur né, mais tu sais communiquer clairement. Tu présentes la valeur de la proposition de manière concise, puis tu attends les réactions.

Quelqu'un pose une question. Tu réponds. Quelqu'un hésite. Tu ajoutes un avantage auquel il n'avait pas pensé.

Vendre n'est pas ton activité préférée, mais tu ne t'en sors pas mal. Au moins une ou deux propositions sont acceptées.`,

        es: `Presentar la propuesta. Convencer al otro lado.

Piensas en qué es vendible y luego vas.

No eres un vendedor nato, pero sabes comunicar con claridad. Presentas el valor de la propuesta de forma concisa y esperas reacciones.

Alguien hace una pregunta. Respondes. Alguien duda. Añades un beneficio que no habían considerado.

Vender no es tu actividad favorita, pero no se te da mal. Al menos una o dos propuestas son aceptadas.`,

        pt: `Apresentar a proposta. Convencer o outro lado.

Você pensa no que é vendível e então vai.

Não é um vendedor nato, mas sabe se comunicar com clareza. Apresenta o valor da proposta de forma concisa e espera reações.

Alguém faz uma pergunta. Você responde. Alguém está em dúvida. Você acrescenta um benefício que não tinham considerado.

Vender não é sua coisa favorita, mas você não é ruim nisso. Pelo menos uma ou duas propostas são aceitas.`,

        it: `Presentare la proposta. Convincere l'altra parte.

Pensi a cosa è vendibile, poi vai.

Non sei un venditore nato, ma sai comunicare chiaramente. Presenti il valore della proposta in modo conciso, poi aspetti le reazioni.

Qualcuno fa una domanda. Rispondi. Qualcuno esita. Aggiungi un vantaggio a cui non avevano pensato.

Vendere non è la tua attività preferita, ma non sei male. Almeno una o due proposte vengono accettate.`,

        ru: `Презентовать предложение. Убедить другую сторону.

Ты думаешь, что можно продать, и идёшь.

Ты не прирождённый продавец, но умеешь ясно общаться. Ты лаконично представляешь ценность предложения и ждёшь реакции.

Кто-то задаёт вопрос. Ты отвечаешь. Кто-то колеблется. Ты добавляешь преимущество, о котором они не подумали.

Продажи — не твоё любимое занятие, но ты не плох в этом. Как минимум одно-два предложения приняты.`,

        ja: `提案をピッチする。相手側を説得する。

何が売れるか考えてから、歩いていく。

生まれながらのセールスマンではないが、明確にコミュニケーションする方法は知っている。提案の価値を簡潔に提示し、反応を待つ。

誰かが質問する。答える。誰かが迷っている。彼らが考えていなかったメリットを付け加える。

セールスは一番好きなことではないが、下手でもない。少なくとも1つか2つの提案が受け入れられた。`,

        ko: `제안을 피칭한다. 상대측을 설득한다.

무엇이 팔릴 수 있을지 생각하고, 걸어간다.

타고난 세일즈맨은 아니지만, 명확하게 소통하는 방법은 안다. 제안의 가치를 간결하게 제시하고 반응을 기다린다.

누군가 질문한다. 답한다. 누군가 망설인다. 그들이 생각하지 못한 이점을 추가한다.

세일즈가 가장 좋아하는 일은 아니지만, 못하는 것도 아니다. 적어도 한두 가지 제안이 수락된다.`,
      },
      score3: {
        zh: `推销。说服。

你看了看对面队伍的人，又看了看你手里的方案。你知道这些东西有价值，但走过去「卖」给别人……

你不排斥，但你也不觉得兴奋。推销需要的那种主动出击的能量，你今天的存量不太够。

你在旁边准备着。如果有人开了头，你可以帮忙补充。但第一个走过去的人不会是你。`,

        en: `Pitching. Persuading.

You look at the other team, then at the proposals in your hand. You know these have value, but walking over and "selling" them...

You don't resist, but you're not excited either. The proactive energy that sales demands — your reserves are running low today.

You stand by, prepared. If someone opens, you can back them up. But you won't be the first to walk over.`,

        nl: `Pitchen. Overtuigen.

Je kijkt naar het andere team, dan naar de voorstellen in je hand. Je weet dat ze waarde hebben, maar erheen lopen en ze "verkopen"...

Je verzet je er niet tegen, maar je bent ook niet enthousiast. De proactieve energie die verkoop vraagt — je reserves zijn vandaag bijna op.

Je staat klaar aan de zijkant. Als iemand begint, kun je ondersteunen. Maar de eerste die oversteekt, ben jij niet.`,

        de: `Pitchen. Überzeugen.

Du schaust das andere Team an, dann die Vorschläge in deiner Hand. Du weißt, dass sie Wert haben, aber rübergehen und sie „verkaufen"...

Du wehrst dich nicht, aber du bist auch nicht begeistert. Die proaktive Energie, die Verkaufen erfordert — deine Reserven sind heute fast aufgebraucht.

Du stehst bereit an der Seite. Wenn jemand anfängt, kannst du unterstützen. Aber der Erste, der rübergeht, wirst du nicht sein.`,

        fr: `Pitcher. Persuader.

Tu regardes l'autre équipe, puis les propositions dans ta main. Tu sais qu'elles ont de la valeur, mais aller les « vendre »...

Tu ne résistes pas, mais tu n'es pas enthousiaste non plus. L'énergie proactive que la vente exige — tes réserves sont presque à sec aujourd'hui.

Tu restes en retrait, prêt. Si quelqu'un ouvre, tu peux le soutenir. Mais le premier à traverser, ce ne sera pas toi.`,

        es: `Presentar. Persuadir.

Miras al otro equipo, luego a las propuestas en tu mano. Sabes que tienen valor, pero ir allá y "venderlas"...

No te resistes, pero tampoco te entusiasma. La energía proactiva que la venta exige — tus reservas están casi agotadas hoy.

Te quedas preparado al lado. Si alguien abre, puedes apoyar. Pero el primero en cruzar no serás tú.`,

        pt: `Fazer pitch. Persuadir.

Você olha o outro time, depois as propostas na sua mão. Sabe que têm valor, mas ir lá e "vendê-las"...

Não resiste, mas também não está empolgado. A energia proativa que vendas exige — suas reservas estão quase esgotadas hoje.

Fica preparado ao lado. Se alguém começar, pode dar apoio. Mas o primeiro a ir não será você.`,

        it: `Fare pitch. Persuadere.

Guardi l'altra squadra, poi le proposte nella tua mano. Sai che hanno valore, ma andare là e "venderle"...

Non ti opponi, ma non sei neanche entusiasta. L'energia proattiva che la vendita richiede — le tue riserve sono quasi esaurite oggi.

Resti pronto al lato. Se qualcuno apre, puoi supportarlo. Ma il primo ad attraversare non sarai tu.`,

        ru: `Питчить. Убеждать.

Ты смотришь на другую команду, потом на предложения в своих руках. Знаешь, что они ценны, но пойти туда и «продать» их...

Ты не против, но и не в восторге. Проактивная энергия, которой требуют продажи — твои запасы на сегодня почти исчерпаны.

Ты стоишь наготове сбоку. Если кто-то начнёт, ты можешь поддержать. Но первым пойти — не ты.`,

        ja: `ピッチング。説得。

相手チームを見て、次に手元の提案を見る。価値があることは分かっている。でも向こうに行って「売る」となると……

拒否はしない。でも興奮もしない。セールスに必要なプロアクティブなエネルギー——今日はもう残量が少ない。

横で準備して待つ。誰かが口火を切れば、サポートできる。でも最初に歩いていく人にはならない。`,

        ko: `피칭. 설득.

상대 팀을 보고, 손에 든 제안을 본다. 가치가 있다는 건 안다. 하지만 가서 "파는" 것은...

거부감은 없지만 흥분도 없다. 세일즈가 요구하는 능동적 에너지 — 오늘은 잔량이 거의 없다.

옆에서 준비하며 대기한다. 누군가 시작하면 도울 수 있다. 하지만 먼저 건너가는 사람은 아닐 것이다.`,
      },
      score2: {
        zh: `向别人推销你手里的东西。

你看着那个「交易窗口」，心里的反应是：这件事有人比我更想做、也会做得更好。

推销需要的那种——走到陌生人面前、主动展示、处理拒绝——你在今天的五层游戏之后，已经没有这种能量了。

你留在了己方这边。`,

        en: `Selling what you've got to others.

You look at the trading window and think: someone wants this more than I do, and would do it better.

Sales requires — walking up to strangers, actively showcasing, handling rejection — after five floors, you've run out of that kind of energy.

You stay on your side.`,

        nl: `Aan anderen verkopen wat je hebt.

Je kijkt naar het handelsvenster en denkt: iemand wil dit meer dan ik, en zou het beter doen.

Verkopen vereist — naar vreemden lopen, actief presenteren, afwijzing verwerken — na vijf verdiepingen heb je dat soort energie niet meer.

Je blijft aan je eigen kant.`,

        de: `Verkaufen, was du hast, an andere.

Du schaust auf das Handelsfenster und denkst: Jemand will das mehr als ich und würde es besser machen.

Verkaufen erfordert — auf Fremde zugehen, aktiv präsentieren, Ablehnung verarbeiten — nach fünf Etagen hast du keine solche Energie mehr.

Du bleibst auf deiner Seite.`,

        fr: `Vendre ce que tu as aux autres.

Tu regardes la fenêtre de trading et penses : quelqu'un le veut plus que moi, et le ferait mieux.

Vendre exige — aller vers des inconnus, présenter activement, encaisser le rejet — après cinq étages, tu n'as plus ce genre d'énergie.

Tu restes de ton côté.`,

        es: `Vender lo que tienes a otros.

Miras la ventana de trading y piensas: alguien quiere esto más que yo, y lo haría mejor.

Vender requiere — acercarse a extraños, presentar activamente, manejar el rechazo — después de cinco pisos, ya no tienes ese tipo de energía.

Te quedas en tu lado.`,

        pt: `Vender o que tem para outros.

Você olha a janela de negociação e pensa: alguém quer isso mais do que eu, e faria melhor.

Vender requer — ir até estranhos, apresentar ativamente, lidar com rejeição — depois de cinco andares, você não tem mais esse tipo de energia.

Fica do seu lado.`,

        it: `Vendere ciò che hai agli altri.

Guardi la finestra di trading e pensi: qualcuno lo vuole più di me, e lo farebbe meglio.

Vendere richiede — avvicinarsi a sconosciuti, presentare attivamente, gestire il rifiuto — dopo cinque piani, non hai più quel tipo di energia.

Resti dalla tua parte.`,

        ru: `Продавать то, что у тебя есть, другим.

Ты смотришь на торговое окно и думаешь: кто-то хочет этого больше, чем я, и справится лучше.

Продажи требуют — подходить к незнакомым людям, активно презентовать, принимать отказы — после пяти этажей у тебя закончилась такая энергия.

Ты остаёшься на своей стороне.`,

        ja: `手持ちのものを他人に売る。

取引ウィンドウを見て思う：誰かの方がこれをやりたがっているし、うまくやるだろう。

セールスには——見知らぬ人のところに歩いていき、能動的にアピールし、拒否を受け止めること——が必要だ。5フロアを経て、そういうエネルギーはもう残っていない。

自分の側にとどまる。`,

        ko: `가진 것을 남에게 파는 것.

거래 창을 보며 생각한다: 누군가 나보다 이것을 더 원하고, 더 잘할 것이다.

세일즈에는 — 모르는 사람에게 다가가고, 적극적으로 어필하고, 거절을 감당하는 것이 — 필요하다. 5개 층을 거친 후, 그런 에너지는 바닥났다.

자기 쪽에 머문다.`,
      },
      score1: {
        zh: `推销。

这个词在你脑海里引起的反应是中性偏冷的。把东西包装好，走到别人面前，说服他们接受——这整个过程和你之间没有火花。

不是因为你社恐或者害怕被拒绝。是因为「向别人推销」这个活动本身，对你来说没有内驱力。

你站在最后面。这一层要结束了。`,

        en: `Sales.

The word produces a cool-neutral reaction in your mind. Packaging things, presenting to strangers, persuading them to accept — the entire process has no spark between it and you.

Not because you're shy or afraid of rejection. Because "selling to others" as an activity holds zero intrinsic drive for you.

You stand at the very back. This floor is about to end.`,

        nl: `Verkoop.

Het woord wekt een koel-neutrale reactie in je geest. Dingen verpakken, presenteren aan vreemden, ze overtuigen om te accepteren — het hele proces heeft geen vonk tussen het en jou.

Niet omdat je verlegen bent of bang voor afwijzing. Omdat "verkopen aan anderen" als activiteit nul intrinsieke drijfveer voor je heeft.

Je staat helemaal achterin. Deze verdieping loopt ten einde.`,

        de: `Verkauf.

Das Wort erzeugt eine kühl-neutrale Reaktion in deinem Kopf. Dinge verpacken, Fremden präsentieren, sie zum Akzeptieren überreden — der ganze Prozess hat keinen Funken zwischen sich und dir.

Nicht weil du schüchtern bist oder Angst vor Ablehnung hast. Weil „an andere verkaufen" als Aktivität null intrinsischen Antrieb für dich hat.

Du stehst ganz hinten. Diese Etage neigt sich dem Ende zu.`,

        fr: `Vente.

Le mot produit une réaction froide et neutre dans ton esprit. Empaqueter des choses, les présenter à des inconnus, les persuader d'accepter — le processus entier n'a aucune étincelle entre lui et toi.

Pas parce que tu es timide ou crains le rejet. Parce que « vendre aux autres » en tant qu'activité n'a zéro motivation intrinsèque pour toi.

Tu te tiens tout au fond. Cet étage touche à sa fin.`,

        es: `Ventas.

La palabra produce una reacción fría y neutral en tu mente. Empaquetar cosas, presentarlas a extraños, persuadirlos de aceptar — todo el proceso no tiene chispa entre él y tú.

No porque seas tímido o tengas miedo al rechazo. Porque "vender a otros" como actividad tiene cero motivación intrínseca para ti.

Te quedas al fondo. Este piso está por terminar.`,

        pt: `Vendas.

A palavra produz uma reação fria e neutra na sua mente. Empacotar coisas, apresentar a estranhos, persuadi-los a aceitar — o processo inteiro não tem faísca entre ele e você.

Não porque é tímido ou tem medo de rejeição. Porque "vender para outros" como atividade tem zero motivação intrínseca para você.

Você fica lá no fundo. Este andar está prestes a terminar.`,

        it: `Vendita.

La parola produce una reazione fredda e neutra nella tua mente. Confezionare cose, presentarle a sconosciuti, persuaderli ad accettare — l'intero processo non ha scintilla tra sé e te.

Non perché sei timido o hai paura del rifiuto. Perché "vendere agli altri" come attività ha zero motivazione intrinseca per te.

Ti metti in fondo a tutto. Questo piano sta per finire.`,

        ru: `Продажи.

Слово вызывает прохладно-нейтральную реакцию в голове. Упаковывать вещи, презентовать незнакомцам, убеждать их принять — во всём этом процессе нет ни искры между ним и тобой.

Не потому что ты стеснительный или боишься отказа. Потому что «продавать другим» как деятельность не несёт для тебя никакой внутренней мотивации.

Ты стоишь в самом конце. Этот этаж вот-вот закончится.`,

        ja: `セールス。

この言葉は頭の中で冷ややかに中立的な反応を引き起こす。ものをパッケージして、見知らぬ人に提示して、受け入れるよう説得する——そのプロセス全体と自分の間に火花がない。

内気だからでも、拒否が怖いからでもない。「他人に売る」という活動自体に、内的な原動力がゼロだからだ。

一番後ろに立っている。このフロアがもうすぐ終わる。`,

        ko: `세일즈.

이 단어는 머릿속에서 차갑고 중립적인 반응을 일으킨다. 물건을 포장하고, 모르는 사람에게 제시하고, 수락하도록 설득하는 — 전체 과정과 당신 사이에 불꽃이 없다.

수줍어서도, 거절이 두려워서도 아니다. "남에게 파는 것"이라는 활동 자체에 내적 동력이 전혀 없기 때문이다.

맨 뒤에 서 있다. 이 층이 곧 끝난다.`,
      },
    },
  },
];
