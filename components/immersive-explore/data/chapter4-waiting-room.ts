// ════════════════════════════════════════════════════════════
// 第四章：等候室（S型 Q16-Q20）
// 大任务：这里没有需要被解开的机关，只有需要被帮助的人
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER4_QUESTIONS: ImmersiveQuestion[] = [
  {
    id: 16,
    riasec: "S",
    miniIpCode: "S4",
    miniIpItem: "Do volunteer work at a non-profit organization",
    chapter: "waiting",
    chapterIndex: 4,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `等候室不是你想象的样子——不是一个安静的等待空间。

它更像一个临时服务站。桌椅混乱地摆放着，公告栏上贴满了手写便条，每一条都是一个请求：

「需要有人帮忙分发物资」
「第三排的人需要水和食物」
「信息台没有人值班」
「儿童区没有志愿者」

空间里有十几个人——不是你们，不是另一支队伍，是其他人。有的坐着，有的站着，有的只是在那里。

屏幕上没有出现具体的任务指令。只有一行字：
「这里不是闯关。这里需要帮忙。没有报酬。」

Leila 已经走进人群了。她在做一件你无法用任何策略来解释的事：她在帮忙。纯粹地、无偿地、因为有人需要。

这不是必须做的事。没有惩罚，没有奖励。只是：这里有需要帮助的人，而你在这里。你愿意走进去志愿参与多少？`,

      en: `The waiting room isn't what you imagined — it's not a quiet space for waiting.\n\nIt's more like a makeshift service station. Tables and chairs scattered about. The bulletin board is covered with handwritten notes, each one a request:\n\n"Need someone to help distribute supplies"\n"People in row three need water and food"\n"No one is staffing the information desk"\n"No volunteers in the children's area"\n\nA dozen people are here — not your group, not the other team. Other people. Some sitting, some standing, some just... there.\n\nThe screen shows no specific task. Just one line:\n"This is not a challenge. This place needs help. There is no reward."\n\nLeila has already walked into the crowd. She's doing something no strategy can explain: she's helping. Purely, freely, because someone needs it.\n\nThis isn't required. No penalty, no reward. Simply: there are people who need help, and you're here. How much are you willing to volunteer?`,

      nl: `De wachtkamer is niet wat je je voorstelde — het is geen stille ruimte om te wachten.\n\nHet lijkt meer op een geïmproviseerd servicestation. Tafels en stoelen staan verspreid. Het prikbord hangt vol handgeschreven briefjes, elk een verzoek:\n\n"Iemand nodig om voorraden uit te delen"\n"Mensen in rij drie hebben water en eten nodig"\n"Niemand bemant de informatiebalie"\n"Geen vrijwilligers in de kinderhoek"\n\nEen dozijn mensen zijn hier — niet jullie groep, niet het andere team. Andere mensen. Sommigen zitten, sommigen staan, sommigen zijn er gewoon... aanwezig.\n\nHet scherm toont geen specifieke opdracht. Slechts één regel:\n"Dit is geen uitdaging. Deze plek heeft hulp nodig. Er is geen beloning."\n\nLeila is al de menigte ingelopen. Ze doet iets dat geen strategie kan verklaren: ze helpt. Puur, vrijwillig, omdat iemand het nodig heeft.\n\nDit is niet verplicht. Geen straf, geen beloning. Simpelweg: er zijn mensen die hulp nodig hebben, en jij bent hier. Hoeveel ben je bereid vrijwillig te doen?`,

      de: `Der Warteraum ist nicht, was du dir vorgestellt hast — kein ruhiger Ort zum Warten.\n\nEr gleicht eher einer behelfsmäßigen Hilfsstation. Tische und Stühle stehen verstreut. Die Pinnwand ist mit handgeschriebenen Zetteln bedeckt, jeder eine Bitte:\n\n„Jemand wird gebraucht, um Vorräte zu verteilen"\n„Die Leute in Reihe drei brauchen Wasser und Essen"\n„Niemand besetzt den Informationsschalter"\n„Keine Freiwilligen im Kinderbereich"\n\nEin Dutzend Menschen sind hier — nicht eure Gruppe, nicht das andere Team. Andere Menschen. Manche sitzen, manche stehen, manche sind einfach... da.\n\nAuf dem Bildschirm erscheint keine konkrete Aufgabe. Nur eine Zeile:\n„Das ist keine Herausforderung. Dieser Ort braucht Hilfe. Es gibt keine Belohnung."\n\nLeila ist bereits in die Menge gegangen. Sie tut etwas, das keine Strategie erklären kann: sie hilft. Rein, freiwillig, weil jemand es braucht.\n\nDas ist keine Pflicht. Keine Strafe, keine Belohnung. Einfach: Es gibt Menschen, die Hilfe brauchen, und du bist hier. Wie viel bist du bereit, freiwillig zu geben?`,

      fr: `La salle d'attente n'est pas ce que vous imaginiez — ce n'est pas un espace calme pour patienter.\n\nC'est plutôt un poste de secours improvisé. Tables et chaises sont éparpillées. Le panneau d'affichage est couvert de notes manuscrites, chacune une demande :\n\n« Besoin de quelqu'un pour distribuer les provisions »\n« Les gens au troisième rang ont besoin d'eau et de nourriture »\n« Personne ne tient le bureau d'information »\n« Pas de bénévoles dans l'espace enfants »\n\nUne douzaine de personnes sont là — pas votre groupe, pas l'autre équipe. D'autres gens. Certains assis, certains debout, certains simplement... là.\n\nL'écran n'affiche aucune tâche précise. Juste une ligne :\n« Ceci n'est pas un défi. Cet endroit a besoin d'aide. Il n'y a pas de récompense. »\n\nLeila s'est déjà mêlée à la foule. Elle fait quelque chose qu'aucune stratégie ne peut expliquer : elle aide. Purement, librement, parce que quelqu'un en a besoin.\n\nCe n'est pas obligatoire. Pas de pénalité, pas de récompense. Simplement : il y a des gens qui ont besoin d'aide, et vous êtes là. Jusqu'où êtes-vous prêt à vous porter volontaire ?`,

      es: `La sala de espera no es lo que imaginabas — no es un espacio tranquilo para esperar.\n\nSe parece más a una estación de servicio improvisada. Mesas y sillas dispersas. El tablón de anuncios está cubierto de notas escritas a mano, cada una un pedido:\n\n"Se necesita alguien para distribuir suministros"\n"Las personas en la fila tres necesitan agua y comida"\n"Nadie atiende el puesto de información"\n"No hay voluntarios en el área infantil"\n\nUna docena de personas están aquí — no tu grupo, no el otro equipo. Otras personas. Algunas sentadas, algunas de pie, algunas simplemente... ahí.\n\nLa pantalla no muestra ninguna tarea específica. Solo una línea:\n"Esto no es un desafío. Este lugar necesita ayuda. No hay recompensa."\n\nLeila ya se ha adentrado en la multitud. Está haciendo algo que ninguna estrategia puede explicar: está ayudando. Pura y libremente, porque alguien lo necesita.\n\nNo es obligatorio. Sin castigo, sin recompensa. Simplemente: hay personas que necesitan ayuda, y tú estás aquí. ¿Cuánto estás dispuesto a ofrecerte como voluntario?`,

      pt: `A sala de espera não é o que você imaginou — não é um espaço tranquilo para aguardar.\n\nParece mais uma estação de serviço improvisada. Mesas e cadeiras espalhadas. O quadro de avisos está coberto de bilhetes escritos à mão, cada um um pedido:\n\n"Precisa-se de alguém para distribuir suprimentos"\n"As pessoas na terceira fila precisam de água e comida"\n"Ninguém está no balcão de informações"\n"Sem voluntários na área infantil"\n\nUma dúzia de pessoas está aqui — não o seu grupo, não a outra equipe. Outras pessoas. Algumas sentadas, algumas em pé, algumas apenas... ali.\n\nA tela não mostra nenhuma tarefa específica. Apenas uma linha:\n"Isto não é um desafio. Este lugar precisa de ajuda. Não há recompensa."\n\nLeila já entrou na multidão. Ela está fazendo algo que nenhuma estratégia explica: está ajudando. Pura e livremente, porque alguém precisa.\n\nNão é obrigatório. Sem punição, sem recompensa. Simplesmente: há pessoas que precisam de ajuda, e você está aqui. Quanto você está disposto a se voluntariar?`,

      it: `La sala d'attesa non è come l'avevi immaginata — non è uno spazio tranquillo dove aspettare.\n\nAssomiglia più a una stazione di soccorso improvvisata. Tavoli e sedie sparsi ovunque. La bacheca è coperta di biglietti scritti a mano, ognuno una richiesta:\n\n"Serve qualcuno per distribuire le scorte"\n"Le persone nella terza fila hanno bisogno di acqua e cibo"\n"Nessuno presidia il banco informazioni"\n"Nessun volontario nell'area bambini"\n\nUna dozzina di persone sono qui — non il vostro gruppo, non l'altra squadra. Altre persone. Alcune sedute, alcune in piedi, alcune semplicemente... presenti.\n\nLo schermo non mostra alcun compito specifico. Solo una riga:\n"Questa non è una sfida. Questo posto ha bisogno di aiuto. Non c'è ricompensa."\n\nLeila si è già mescolata alla folla. Sta facendo qualcosa che nessuna strategia può spiegare: sta aiutando. Puramente, liberamente, perché qualcuno ne ha bisogno.\n\nNon è obbligatorio. Nessuna penalità, nessuna ricompensa. Semplicemente: ci sono persone che hanno bisogno di aiuto, e tu sei qui. Quanto sei disposto a offrirti volontario?`,

      ru: `Зал ожидания — не то, что вы себе представляли. Это не тихое пространство для ожидания.\n\nСкорее импровизированный пункт помощи. Столы и стулья расставлены хаотично. Доска объявлений увешана рукописными записками, каждая — просьба:\n\n«Нужен кто-то для раздачи припасов»\n«Людям в третьем ряду нужны вода и еда»\n«Информационную стойку никто не обслуживает»\n«В детской зоне нет добровольцев»\n\nЗдесь около дюжины людей — не ваша группа, не другая команда. Другие люди. Кто-то сидит, кто-то стоит, кто-то просто... здесь.\n\nНа экране нет конкретного задания. Только одна строка:\n«Это не испытание. Этому месту нужна помощь. Награды нет.»\n\nЛейла уже вошла в толпу. Она делает то, что не объяснить никакой стратегией: она помогает. Просто, безвозмездно, потому что кому-то это нужно.\n\nЭто не обязательно. Ни наказания, ни награды. Просто: здесь есть люди, которым нужна помощь, и вы здесь. Насколько вы готовы помочь добровольно?`,

      ja: `待合室はあなたが想像していたものとは違った——静かに待つための空間ではない。\n\nそれは即席のサービスステーションに近かった。テーブルと椅子があちこちに散らばっている。掲示板には手書きのメモがびっしり貼られ、それぞれが一つの要請だった：\n\n「物資の配布を手伝ってくれる人が必要」\n「3列目の人たちに水と食料が必要」\n「案内デスクに誰もいない」\n「子どもエリアにボランティアがいない」\n\n十数人がここにいる——あなたのグループでも、もう一つのチームでもない。別の人たち。座っている人、立っている人、ただ...そこにいる人。\n\nスクリーンには具体的な指示はない。ただ一行：\n「これは試練ではありません。この場所には助けが必要です。報酬はありません。」\n\nレイラはすでに人混みの中に入っていた。戦略では説明できないことをしている：助けている。純粋に、無償で、誰かがそれを必要としているから。\n\nこれは義務ではない。罰則もなければ報酬もない。ただ：助けを必要としている人がいて、あなたはここにいる。どれだけボランティアとして参加する気がありますか？`,

      ko: `대기실은 당신이 상상한 것과 달랐다 — 조용히 기다리는 공간이 아니었다.\n\n임시로 만들어진 서비스 스테이션에 더 가까웠다. 테이블과 의자가 여기저기 흩어져 있고, 게시판에는 손으로 쓴 메모가 가득했다. 각각이 하나의 요청이었다:\n\n"물자 배분을 도와줄 사람이 필요합니다"\n"3번째 줄 사람들에게 물과 음식이 필요합니다"\n"안내 데스크에 아무도 없습니다"\n"어린이 구역에 자원봉사자가 없습니다"\n\n십여 명이 여기에 있다 — 당신의 그룹도, 다른 팀도 아닌. 다른 사람들. 앉아 있는 사람, 서 있는 사람, 그냥... 거기에 있는 사람.\n\n화면에는 구체적인 지시가 없다. 단 한 줄:\n"이것은 도전이 아닙니다. 이곳은 도움이 필요합니다. 보상은 없습니다."\n\n레일라는 이미 사람들 사이로 걸어 들어갔다. 어떤 전략으로도 설명할 수 없는 일을 하고 있다: 돕고 있다. 순수하게, 대가 없이, 누군가가 필요로 하기 때문에.\n\n이것은 의무가 아니다. 벌칙도, 보상도 없다. 단지: 도움이 필요한 사람들이 있고, 당신은 여기에 있다. 얼마나 자원하여 참여할 의향이 있는가?`,
    },
    taskDescription: {
      zh: "这个等候室需要志愿者——无偿地帮忙分发物资、回应需求、服务等候的人。没有报酬。所有人都可以参与。",

      en: `This waiting room needs volunteers — distributing supplies, responding to needs, serving the people waiting. No reward. Everyone can participate.`,

      nl: `Deze wachtkamer heeft vrijwilligers nodig — voorraden uitdelen, op behoeften reageren, de wachtenden helpen. Geen beloning. Iedereen kan meedoen.`,

      de: `Dieser Warteraum braucht Freiwillige — Vorräte verteilen, auf Bedürfnisse eingehen, den Wartenden helfen. Keine Belohnung. Alle können mitmachen.`,

      fr: `Cette salle d'attente a besoin de bénévoles — distribuer des provisions, répondre aux besoins, servir les personnes qui attendent. Pas de récompense. Tout le monde peut participer.`,

      es: `Esta sala de espera necesita voluntarios — distribuir suministros, responder a necesidades, servir a las personas que esperan. Sin recompensa. Todos pueden participar.`,

      pt: `Esta sala de espera precisa de voluntários — distribuir suprimentos, atender necessidades, servir as pessoas que aguardam. Sem recompensa. Todos podem participar.`,

      it: `Questa sala d'attesa ha bisogno di volontari — distribuire scorte, rispondere ai bisogni, servire le persone in attesa. Nessuna ricompensa. Tutti possono partecipare.`,

      ru: `Этому залу ожидания нужны добровольцы — раздавать припасы, откликаться на нужды, помогать ожидающим. Без вознаграждения. Каждый может участвовать.`,

      ja: `この待合室にはボランティアが必要です——物資の配布、ニーズへの対応、待っている人々への奉仕。報酬はありません。誰でも参加できます。`,

      ko: `이 대기실에는 자원봉사자가 필요합니다 — 물자 배분, 요구 대응, 대기 중인 사람들 돕기. 보상은 없습니다. 누구나 참여할 수 있습니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走进去了。

不是因为规则要求你——规则说得很清楚，没有报酬。也不是因为别人在看——没有人在评判你。

你走进去是因为：你看到了那些便条上的请求，看到了坐在那里等待的人，然后你身体里有一个非常简单的反应——去帮忙。

你拿起了第一份物资，走向第三排。Leila 在另一侧，做着同样的事。你们没有对视，但你知道她注意到你了。

「需要有人帮忙分发物资」——那张便条的字迹很潦草，像是很着急才写的。你把物资递到第一个人手里，他说了声谢谢。

你继续走向下一个人。`,

        en: `You walk in.\n\nNot because the rules require it — the rules made it clear, no reward. Not because anyone's watching — no one is judging you.\n\nYou walk in because: you saw the requests on those notes, saw the people sitting there waiting, and your body produced one very simple response — go help.\n\nYou pick up the first batch of supplies and head to row three. Leila is on the other side, doing the same. You don't make eye contact, but you know she noticed you.\n\n"Need someone to help distribute supplies" — the handwriting on that note was rushed, written in urgency. You place the supplies in the first person's hands. They say thank you.\n\nYou move on to the next person.`,

        nl: `Je loopt naar binnen.\n\nNiet omdat de regels het eisen — de regels waren duidelijk, geen beloning. Niet omdat iemand kijkt — niemand beoordeelt je.\n\nJe loopt naar binnen omdat: je de verzoeken op die briefjes zag, de mensen zag zitten wachten, en je lichaam één heel eenvoudige reactie gaf — ga helpen.\n\nJe pakt de eerste lading voorraden op en loopt naar rij drie. Leila is aan de andere kant, doet hetzelfde. Jullie maken geen oogcontact, maar je weet dat ze je opmerkte.\n\n"Iemand nodig om voorraden uit te delen" — het handschrift op dat briefje was gehaast, geschreven in urgentie. Je legt de voorraden in de handen van de eerste persoon. Ze zeggen dank je.\n\nJe loopt door naar de volgende.`,

        de: `Du gehst hinein.\n\nNicht weil die Regeln es verlangen — die Regeln waren deutlich, keine Belohnung. Nicht weil jemand zuschaut — niemand beurteilt dich.\n\nDu gehst hinein, weil: du die Bitten auf den Zetteln gesehen hast, die Menschen dort sitzen und warten sahst, und dein Körper eine ganz einfache Reaktion hervorbrachte — geh helfen.\n\nDu nimmst die ersten Vorräte und gehst zu Reihe drei. Leila ist auf der anderen Seite, tut dasselbe. Ihr seht euch nicht an, aber du weißt, dass sie dich bemerkt hat.\n\n„Jemand wird gebraucht, um Vorräte zu verteilen" — die Handschrift auf dem Zettel war hastig, in Eile geschrieben. Du legst die Vorräte in die Hände der ersten Person. Sie sagt danke.\n\nDu gehst weiter zur nächsten.`,

        fr: `Vous entrez.\n\nPas parce que les règles l'exigent — les règles étaient claires, pas de récompense. Pas parce que quelqu'un regarde — personne ne vous juge.\n\nVous entrez parce que : vous avez vu les demandes sur ces notes, vu les gens assis là à attendre, et votre corps a produit une réponse très simple — aller aider.\n\nVous prenez le premier lot de provisions et vous dirigez vers le troisième rang. Leila est de l'autre côté, fait la même chose. Vous ne croisez pas son regard, mais vous savez qu'elle vous a remarqué.\n\n« Besoin de quelqu'un pour distribuer les provisions » — l'écriture sur cette note était précipitée, écrite dans l'urgence. Vous placez les provisions dans les mains de la première personne. Elle dit merci.\n\nVous passez à la suivante.`,

        es: `Entras.\n\nNo porque las reglas lo exijan — las reglas fueron claras, sin recompensa. No porque alguien te observe — nadie te juzga.\n\nEntras porque: viste las peticiones en esas notas, viste a la gente sentada esperando, y tu cuerpo produjo una respuesta muy simple — ve a ayudar.\n\nTomas el primer lote de suministros y te diriges a la fila tres. Leila está al otro lado, haciendo lo mismo. No cruzáis miradas, pero sabes que te notó.\n\n"Se necesita alguien para distribuir suministros" — la letra en esa nota era apresurada, escrita con urgencia. Colocas los suministros en las manos de la primera persona. Dice gracias.\n\nPasas a la siguiente.`,

        pt: `Você entra.\n\nNão porque as regras exigem — as regras foram claras, sem recompensa. Não porque alguém está olhando — ninguém está te julgando.\n\nVocê entra porque: viu os pedidos naqueles bilhetes, viu as pessoas sentadas ali esperando, e seu corpo produziu uma resposta muito simples — vá ajudar.\n\nVocê pega o primeiro lote de suprimentos e vai para a terceira fila. Leila está do outro lado, fazendo o mesmo. Vocês não trocam olhares, mas você sabe que ela te notou.\n\n"Precisa-se de alguém para distribuir suprimentos" — a caligrafia naquele bilhete era apressada, escrita com urgência. Você coloca os suprimentos nas mãos da primeira pessoa. Ela diz obrigado.\n\nVocê segue para a próxima.`,

        it: `Entri.\n\nNon perché le regole lo richiedano — le regole erano chiare, nessuna ricompensa. Non perché qualcuno guarda — nessuno ti giudica.\n\nEntri perché: hai visto le richieste su quei biglietti, hai visto le persone sedute lì ad aspettare, e il tuo corpo ha prodotto una risposta semplicissima — vai ad aiutare.\n\nPrendi il primo carico di scorte e ti dirigi verso la terza fila. Leila è dall'altra parte, fa la stessa cosa. Non incrociate gli sguardi, ma sai che ti ha notato.\n\n"Serve qualcuno per distribuire le scorte" — la calligrafia su quel biglietto era frettolosa, scritta con urgenza. Metti le scorte nelle mani della prima persona. Dice grazie.\n\nProsegui verso la prossima.`,

        ru: `Вы входите.\n\nНе потому что правила требуют — правила ясно сказали, награды нет. Не потому что кто-то смотрит — никто вас не судит.\n\nВы входите потому что: вы увидели просьбы на этих записках, увидели людей, сидящих в ожидании, и ваше тело выдало одну очень простую реакцию — иди помоги.\n\nВы берёте первую партию припасов и направляетесь к третьему ряду. Лейла на другой стороне, делает то же самое. Вы не встречаетесь взглядами, но знаете, что она вас заметила.\n\n«Нужен кто-то для раздачи припасов» — почерк на записке торопливый, написано в спешке. Вы вкладываете припасы в руки первому человеку. Он говорит спасибо.\n\nВы идёте к следующему.`,

        ja: `あなたは中に入る。\n\nルールが求めているからではない——ルールは明確だった、報酬はないと。誰かが見ているからでもない——誰もあなたを評価していない。\n\n入ったのは：メモに書かれた要請を見たから、座って待っている人々を見たから、そしてあなたの体がとてもシンプルな反応を示したから——助けに行こう。\n\n最初の物資を手に取り、3列目に向かう。レイラは反対側で同じことをしている。目は合わせないが、彼女があなたに気づいたことはわかる。\n\n「物資の配布を手伝ってくれる人が必要」——そのメモの筆跡は急いでいた、切迫感の中で書かれたものだ。最初の人の手に物資を渡す。ありがとう、と言われる。\n\n次の人へ向かう。`,

        ko: `당신은 안으로 들어간다.\n\n규칙이 요구해서가 아니다 — 규칙은 분명했다, 보상은 없다고. 누군가 지켜보고 있어서도 아니다 — 아무도 당신을 판단하지 않는다.\n\n들어간 이유는: 메모에 적힌 요청을 봤고, 앉아서 기다리는 사람들을 봤고, 당신의 몸이 아주 단순한 반응을 보였기 때문이다 — 가서 도와라.\n\n첫 번째 물자를 들고 3번째 줄로 향한다. 레일라는 반대편에서 같은 일을 하고 있다. 눈은 마주치지 않지만, 그녀가 당신을 알아챘다는 걸 안다.\n\n"물자 배분을 도와줄 사람이 필요합니다" — 그 메모의 글씨는 급하게, 절박함 속에 쓰인 것이었다. 첫 번째 사람의 손에 물자를 건넨다. 감사합니다, 라고 말한다.\n\n다음 사람에게로 간다.`,
      },
      score4: {
        zh: `你走进去了，带着一种平静的意愿。

公告栏上的便条你看了，需求是清楚的——有人要水，有人要食物，信息台没人。你不需要别人组织你，你自己能判断从哪里开始。

你走向信息台，坐下来。第一个人走过来问了一个问题，你尽你所能回答了。

志愿服务这件事，你不排斥。做得到的事情就做。`,

        en: `You walk in with a calm willingness.\n\nThe notes on the board — you've read them. The needs are clear: someone needs water, someone needs food, the info desk is empty. You don't need anyone to organize you. You can decide where to start.\n\nYou walk to the information desk and sit down. The first person approaches with a question. You answer as best you can.\n\nVolunteer work — you don't mind. What you can do, you do.`,

        nl: `Je loopt naar binnen met een kalme bereidwilligheid.\n\nDe briefjes op het bord — je hebt ze gelezen. De behoeften zijn duidelijk: iemand heeft water nodig, iemand heeft eten nodig, de informatiebalie is leeg. Je hebt niemand nodig om je te organiseren. Je kunt zelf beslissen waar je begint.\n\nJe loopt naar de informatiebalie en gaat zitten. De eerste persoon komt met een vraag. Je antwoordt zo goed als je kunt.\n\nVrijwilligerswerk — je vindt het niet erg. Wat je kunt doen, doe je.`,

        de: `Du gehst hinein mit einer ruhigen Bereitschaft.\n\nDie Zettel an der Pinnwand — du hast sie gelesen. Die Bedürfnisse sind klar: jemand braucht Wasser, jemand braucht Essen, der Informationsschalter ist leer. Du brauchst niemanden, der dich organisiert. Du kannst selbst entscheiden, wo du anfängst.\n\nDu gehst zum Informationsschalter und setzt dich. Die erste Person kommt mit einer Frage. Du antwortest so gut du kannst.\n\nFreiwilligenarbeit — das stört dich nicht. Was du tun kannst, tust du.`,

        fr: `Vous entrez avec une volonté calme.\n\nLes notes sur le panneau — vous les avez lues. Les besoins sont clairs : quelqu'un a besoin d'eau, quelqu'un a besoin de nourriture, le bureau d'information est vide. Vous n'avez besoin de personne pour vous organiser. Vous pouvez décider par où commencer.\n\nVous marchez jusqu'au bureau d'information et vous asseyez. La première personne s'approche avec une question. Vous répondez du mieux que vous pouvez.\n\nLe bénévolat — ça ne vous dérange pas. Ce que vous pouvez faire, vous le faites.`,

        es: `Entras con una disposición tranquila.\n\nLas notas en el tablón — las has leído. Las necesidades son claras: alguien necesita agua, alguien necesita comida, el puesto de información está vacío. No necesitas que nadie te organice. Puedes decidir por dónde empezar.\n\nCaminas al puesto de información y te sientas. La primera persona se acerca con una pregunta. Respondes lo mejor que puedes.\n\nVoluntariado — no te molesta. Lo que puedes hacer, lo haces.`,

        pt: `Você entra com uma disposição calma.\n\nOs bilhetes no quadro — você os leu. As necessidades são claras: alguém precisa de água, alguém precisa de comida, o balcão de informações está vazio. Você não precisa que ninguém te organize. Pode decidir por onde começar.\n\nVocê vai até o balcão de informações e se senta. A primeira pessoa se aproxima com uma pergunta. Você responde da melhor forma possível.\n\nTrabalho voluntário — não te incomoda. O que você pode fazer, você faz.`,

        it: `Entri con una calma disponibilità.\n\nI biglietti sulla bacheca — li hai letti. I bisogni sono chiari: qualcuno ha bisogno d'acqua, qualcuno di cibo, il banco informazioni è vuoto. Non hai bisogno che qualcuno ti organizzi. Puoi decidere da dove cominciare.\n\nVai al banco informazioni e ti siedi. La prima persona si avvicina con una domanda. Rispondi come meglio puoi.\n\nVolontariato — non ti pesa. Quello che puoi fare, lo fai.`,

        ru: `Вы входите со спокойной готовностью.\n\nЗаписки на доске — вы их прочитали. Потребности ясны: кому-то нужна вода, кому-то еда, информационная стойка пуста. Вам не нужно, чтобы кто-то вас организовывал. Вы сами можете решить, с чего начать.\n\nВы подходите к информационной стойке и садитесь. Первый человек подходит с вопросом. Вы отвечаете как можете.\n\nВолонтёрство — вас это не смущает. Что можете сделать, то делаете.`,

        ja: `穏やかな意志を持って中に入る。\n\n掲示板のメモは読んだ。ニーズは明確だ：誰かが水を必要としている、誰かが食料を必要としている、案内デスクは空いている。誰かに指示される必要はない。どこから始めるか自分で決められる。\n\n案内デスクに歩いて行き、座る。最初の人が質問を持って近づいてくる。できる限り答える。\n\nボランティア活動——嫌ではない。できることは、やる。`,

        ko: `차분한 의지를 가지고 안으로 들어간다.\n\n게시판의 메모는 읽었다. 필요한 것은 분명하다: 누군가는 물이 필요하고, 누군가는 음식이 필요하고, 안내 데스크는 비어 있다. 누가 조직해줄 필요 없다. 어디서 시작할지 스스로 결정할 수 있다.\n\n안내 데스크로 걸어가 앉는다. 첫 번째 사람이 질문을 가지고 다가온다. 할 수 있는 만큼 대답한다.\n\n자원봉사 — 거부감은 없다. 할 수 있는 일은 한다.`,
      },
      score3: {
        zh: `你站在等候室的入口，看着那些便条和那些人。

志愿服务。无偿。没有报酬。

你的心里有一种微妙的拉扯：一方面，这些人确实需要帮助；另一方面，你不确定这是不是你最自然的反应方式。

你走进去了，但速度不快。也许你会帮忙做一些事情，但你不会是第一个冲进去的人。

你在等一个更具体的、你觉得自己能做好的事情出现。`,

        en: `You stand at the entrance to the waiting room, looking at the notes and the people.\n\nVolunteer service. Unpaid. No reward.\n\nA subtle tug inside you: on one hand, these people genuinely need help. On the other, you're not sure this is your most natural response.\n\nYou walk in, but not quickly. Maybe you'll help with something, but you won't be the first to charge in.\n\nYou're waiting for something more specific — something you feel you can do well — to appear.`,

        nl: `Je staat bij de ingang van de wachtkamer, kijkend naar de briefjes en de mensen.\n\nVrijwilligerswerk. Onbetaald. Geen beloning.\n\nEen subtiele spanning in je: enerzijds hebben deze mensen echt hulp nodig. Anderzijds weet je niet zeker of dit je meest natuurlijke reactie is.\n\nJe loopt naar binnen, maar niet snel. Misschien help je ergens mee, maar je zult niet de eerste zijn die naar voren stormt.\n\nJe wacht tot er iets specifiekers verschijnt — iets waarvan je voelt dat je het goed kunt doen.`,

        de: `Du stehst am Eingang des Warteraums und betrachtest die Zettel und die Menschen.\n\nFreiwilligendienst. Unbezahlt. Keine Belohnung.\n\nEin subtiler Zug in dir: einerseits brauchen diese Menschen wirklich Hilfe. Andererseits bist du nicht sicher, ob das deine natürlichste Reaktion ist.\n\nDu gehst hinein, aber nicht schnell. Vielleicht hilfst du bei etwas, aber du wirst nicht der Erste sein, der vorstürmt.\n\nDu wartest auf etwas Konkreteres — etwas, von dem du das Gefühl hast, es gut machen zu können.`,

        fr: `Vous vous tenez à l'entrée de la salle d'attente, regardant les notes et les gens.\n\nService bénévole. Non rémunéré. Pas de récompense.\n\nUne tension subtile en vous : d'un côté, ces gens ont vraiment besoin d'aide. De l'autre, vous n'êtes pas sûr que ce soit votre réaction la plus naturelle.\n\nVous entrez, mais pas vite. Peut-être aiderez-vous pour quelque chose, mais vous ne serez pas le premier à vous précipiter.\n\nVous attendez que quelque chose de plus précis apparaisse — quelque chose que vous sentez pouvoir bien faire.`,

        es: `Estás de pie en la entrada de la sala de espera, mirando las notas y a las personas.\n\nServicio voluntario. Sin paga. Sin recompensa.\n\nUna tensión sutil dentro de ti: por un lado, estas personas realmente necesitan ayuda. Por otro, no estás seguro de que esta sea tu respuesta más natural.\n\nEntras, pero no rápido. Quizás ayudes con algo, pero no serás el primero en lanzarse.\n\nEstás esperando que aparezca algo más específico — algo que sientas que puedes hacer bien.`,

        pt: `Você está na entrada da sala de espera, olhando para os bilhetes e as pessoas.\n\nServiço voluntário. Sem pagamento. Sem recompensa.\n\nUma tensão sutil dentro de você: por um lado, essas pessoas realmente precisam de ajuda. Por outro, você não tem certeza de que esta seja sua resposta mais natural.\n\nVocê entra, mas não rapidamente. Talvez ajude com algo, mas não será o primeiro a se lançar.\n\nVocê está esperando algo mais específico aparecer — algo que sinta que pode fazer bem.`,

        it: `Sei in piedi all'ingresso della sala d'attesa, guardando i biglietti e le persone.\n\nServizio volontario. Non retribuito. Nessuna ricompensa.\n\nUna sottile tensione dentro di te: da un lato, queste persone hanno davvero bisogno di aiuto. Dall'altro, non sei sicuro che questa sia la tua reazione più naturale.\n\nEntri, ma non velocemente. Forse aiuterai con qualcosa, ma non sarai il primo a lanciarsi.\n\nStai aspettando che appaia qualcosa di più specifico — qualcosa che senti di poter fare bene.`,

        ru: `Вы стоите у входа в зал ожидания, глядя на записки и людей.\n\nВолонтёрская помощь. Бесплатно. Без награды.\n\nЛёгкое напряжение внутри: с одной стороны, этим людям действительно нужна помощь. С другой — вы не уверены, что это ваша самая естественная реакция.\n\nВы входите, но не быстро. Может, поможете с чем-то, но первым бросаться не будете.\n\nВы ждёте чего-то более конкретного — того, что, как вам кажется, вы сможете сделать хорошо.`,

        ja: `待合室の入り口に立ち、メモと人々を見ている。\n\nボランティア活動。無報酬。見返りなし。\n\n心の中に微かな引っ張り合い：一方では、この人たちは本当に助けを必要としている。もう一方では、これが自分にとって最も自然な反応なのか確信が持てない。\n\n中に入るが、急がない。何か手伝うかもしれないが、真っ先に飛び込む人にはならない。\n\nもっと具体的な何かが現れるのを待っている——自分がうまくできると感じられる何かを。`,

        ko: `대기실 입구에 서서 메모와 사람들을 바라본다.\n\n자원봉사. 무보수. 보상 없음.\n\n마음속에 미묘한 갈등: 한편으로는 이 사람들이 정말 도움이 필요하다. 다른 한편으로는 이것이 자신의 가장 자연스러운 반응인지 확신이 없다.\n\n안으로 들어가지만, 서두르지는 않는다. 뭔가를 도울 수도 있겠지만, 가장 먼저 뛰어드는 사람은 아닐 것이다.\n\n더 구체적인 무언가가 나타나기를 기다리고 있다 — 자신이 잘 할 수 있다고 느껴지는 무언가를.`,
      },
      score2: {
        zh: `你看了看那些便条，看了看那些等待的人。

你理解这里的需求。但「走进去当志愿者」这个动作，你的身体没有自动发出。

不是冷漠——你知道帮助别人是好事。只是「无偿地、主动地走进一群陌生人中间提供服务」，这不是你最自然的行为模式。

你站在入口处，观察着。`,

        en: `You look at the notes. You look at the people waiting.\n\nYou understand the need. But "walk in and volunteer" — your body doesn't automatically produce that action.\n\nIt's not coldness — you know helping is good. It's just that "freely, proactively walking into a crowd of strangers to provide service" isn't your most natural behavior.\n\nYou stand at the entrance, observing.`,

        nl: `Je kijkt naar de briefjes. Je kijkt naar de wachtende mensen.\n\nJe begrijpt de behoefte. Maar "naar binnen lopen en je aanmelden als vrijwilliger" — je lichaam produceert die actie niet automatisch.\n\nHet is geen kilheid — je weet dat helpen goed is. Het is gewoon dat "vrijwillig, proactief een menigte vreemden inlopen om hulp te bieden" niet je meest natuurlijke gedrag is.\n\nJe staat bij de ingang, observerend.`,

        de: `Du schaust auf die Zettel. Du schaust auf die wartenden Menschen.\n\nDu verstehst den Bedarf. Aber „hineingehen und dich freiwillig melden" — dein Körper produziert diese Handlung nicht automatisch.\n\nEs ist keine Kälte — du weißt, dass Helfen gut ist. Es ist nur, dass „freiwillig und proaktiv in eine Menge Fremder zu gehen, um Hilfe anzubieten" nicht dein natürlichstes Verhalten ist.\n\nDu stehst am Eingang und beobachtest.`,

        fr: `Vous regardez les notes. Vous regardez les gens qui attendent.\n\nVous comprenez le besoin. Mais « entrer et se porter volontaire » — votre corps ne produit pas automatiquement cette action.\n\nCe n'est pas de la froideur — vous savez qu'aider est bien. C'est simplement que « marcher librement et proactivement dans une foule d'inconnus pour offrir ses services » n'est pas votre comportement le plus naturel.\n\nVous restez à l'entrée, observant.`,

        es: `Miras las notas. Miras a las personas esperando.\n\nEntiendes la necesidad. Pero "entrar y ofrecerte como voluntario" — tu cuerpo no produce automáticamente esa acción.\n\nNo es frialdad — sabes que ayudar es bueno. Es solo que "caminar libre y proactivamente hacia una multitud de desconocidos para ofrecer servicio" no es tu comportamiento más natural.\n\nTe quedas en la entrada, observando.`,

        pt: `Você olha para os bilhetes. Olha para as pessoas esperando.\n\nVocê entende a necessidade. Mas "entrar e se voluntariar" — seu corpo não produz automaticamente essa ação.\n\nNão é frieza — você sabe que ajudar é bom. É só que "caminhar livre e proativamente para uma multidão de desconhecidos para oferecer ajuda" não é seu comportamento mais natural.\n\nVocê fica na entrada, observando.`,

        it: `Guardi i biglietti. Guardi le persone in attesa.\n\nCapisci il bisogno. Ma "entrare e offrirti volontario" — il tuo corpo non produce automaticamente quell'azione.\n\nNon è freddezza — sai che aiutare è giusto. È solo che "camminare liberamente e proattivamente in mezzo a una folla di sconosciuti per offrire servizio" non è il tuo comportamento più naturale.\n\nResti all'ingresso, osservando.`,

        ru: `Вы смотрите на записки. Смотрите на ждущих людей.\n\nВы понимаете потребность. Но «войти и вызваться добровольцем» — ваше тело не производит это действие автоматически.\n\nЭто не холодность — вы знаете, что помогать — хорошо. Просто «свободно, по своей инициативе войти в толпу незнакомцев, чтобы оказать помощь» — не ваше самое естественное поведение.\n\nВы стоите у входа, наблюдая.`,

        ja: `メモを見る。待っている人々を見る。\n\nニーズは理解している。しかし「中に入ってボランティアをする」——体が自動的にその行動を起こさない。\n\n冷たさではない——助けることが良いことだとわかっている。ただ「自ら進んで見知らぬ人の群れの中に入り、奉仕を提供する」というのが、最も自然な行動ではないだけだ。\n\n入り口に立ち、観察している。`,

        ko: `메모를 본다. 기다리고 있는 사람들을 본다.\n\n필요를 이해한다. 하지만 "들어가서 자원봉사하기" — 몸이 자동으로 그 행동을 만들어내지 않는다.\n\n냉정함이 아니다 — 돕는 것이 좋다는 건 안다. 단지 "자발적으로, 능동적으로 낯선 사람들 사이로 걸어 들어가 봉사를 제공하는 것"이 가장 자연스러운 행동이 아닐 뿐이다.\n\n입구에 서서 관찰한다.`,
      },
      score1: {
        zh: `「没有报酬。」

你看着那行字，然后看着那些等待的人。你理解他们的需求，但你身体里没有产生走进去的冲动。

这不是关于善良或冷漠——这是关于你对这种活动的本能反应。志愿服务、无偿帮助陌生人——这些词汇在你脑海里是中性的。你不反感，但你也不会因此而行动。

你留在了入口的位置。等候室里有五个阶段的任务。也许后面有一个更能触发你内驱力的。`,

        en: `"There is no reward."\n\nYou read the line, then look at the people waiting. You understand their needs, but nothing in your body produces the impulse to walk in.\n\nThis isn't about kindness or coldness — it's about your instinctive response to this type of activity. Volunteer service, unpaid help for strangers — these concepts sit neutral in your mind. No resistance, but no motivation either.\n\nYou stay near the entrance. The waiting room has five phases. Maybe one ahead triggers something deeper.`,

        nl: `"Er is geen beloning."\n\nJe leest de regel en kijkt dan naar de wachtende mensen. Je begrijpt hun behoeften, maar niets in je lichaam produceert de impuls om naar binnen te lopen.\n\nDit gaat niet over vriendelijkheid of kilheid — het gaat over je instinctieve reactie op dit type activiteit. Vrijwilligerswerk, onbetaalde hulp aan vreemden — deze concepten zijn neutraal in je hoofd. Geen weerstand, maar ook geen motivatie.\n\nJe blijft bij de ingang. De wachtkamer heeft vijf fasen. Misschien triggert er verderop iets diepers.`,

        de: `„Es gibt keine Belohnung."\n\nDu liest die Zeile und schaust dann auf die wartenden Menschen. Du verstehst ihre Bedürfnisse, aber nichts in deinem Körper erzeugt den Impuls hineinzugehen.\n\nDas hat nichts mit Freundlichkeit oder Kälte zu tun — es geht um deine instinktive Reaktion auf diese Art von Aktivität. Freiwilligendienst, unbezahlte Hilfe für Fremde — diese Konzepte sind neutral in deinem Kopf. Kein Widerstand, aber auch keine Motivation.\n\nDu bleibst nahe dem Eingang. Der Warteraum hat fünf Phasen. Vielleicht löst eine der kommenden etwas Tieferes aus.`,

        fr: `« Il n'y a pas de récompense. »\n\nVous lisez la ligne, puis regardez les gens qui attendent. Vous comprenez leurs besoins, mais rien dans votre corps ne produit l'impulsion d'entrer.\n\nCe n'est pas une question de bonté ou de froideur — c'est votre réponse instinctive à ce type d'activité. Service bénévole, aide gratuite à des inconnus — ces concepts restent neutres dans votre esprit. Pas de résistance, mais pas de motivation non plus.\n\nVous restez près de l'entrée. La salle d'attente compte cinq phases. Peut-être que l'une des suivantes déclenchera quelque chose de plus profond.`,

        es: `"No hay recompensa."\n\nLees la línea y luego miras a las personas esperando. Entiendes sus necesidades, pero nada en tu cuerpo produce el impulso de entrar.\n\nNo se trata de amabilidad o frialdad — se trata de tu respuesta instintiva a este tipo de actividad. Servicio voluntario, ayuda gratuita a desconocidos — estos conceptos son neutros en tu mente. Sin resistencia, pero sin motivación tampoco.\n\nTe quedas cerca de la entrada. La sala de espera tiene cinco fases. Quizás alguna más adelante despierte algo más profundo.`,

        pt: `"Não há recompensa."\n\nVocê lê a linha e olha para as pessoas esperando. Entende suas necessidades, mas nada no seu corpo produz o impulso de entrar.\n\nNão é sobre bondade ou frieza — é sobre sua resposta instintiva a esse tipo de atividade. Serviço voluntário, ajuda gratuita a estranhos — esses conceitos são neutros na sua mente. Sem resistência, mas sem motivação também.\n\nVocê fica perto da entrada. A sala de espera tem cinco fases. Talvez uma adiante desperte algo mais profundo.`,

        it: `"Non c'è ricompensa."\n\nLeggi la riga, poi guardi le persone in attesa. Capisci i loro bisogni, ma nulla nel tuo corpo produce l'impulso di entrare.\n\nNon è questione di gentilezza o freddezza — è la tua risposta istintiva a questo tipo di attività. Servizio volontario, aiuto gratuito a sconosciuti — questi concetti restano neutri nella tua mente. Nessuna resistenza, ma nemmeno motivazione.\n\nResti vicino all'ingresso. La sala d'attesa ha cinque fasi. Forse una delle prossime attiverà qualcosa di più profondo.`,

        ru: `«Награды нет.»\n\nВы читаете строку, затем смотрите на ждущих людей. Понимаете их нужды, но ничто в вашем теле не порождает импульс войти.\n\nДело не в доброте или холодности — дело в вашей инстинктивной реакции на этот тип деятельности. Волонтёрство, безвозмездная помощь незнакомцам — эти понятия нейтральны в вашем сознании. Нет сопротивления, но нет и мотивации.\n\nВы остаётесь у входа. В зале ожидания пять этапов. Возможно, один из следующих затронет что-то более глубокое.`,

        ja: `「報酬はありません。」\n\nその一行を読み、待っている人々を見る。彼らのニーズは理解している。しかし体の中に、入っていこうという衝動が生まれない。\n\nこれは優しさや冷たさの問題ではない——この種の活動に対するあなたの本能的な反応の問題だ。ボランティア、見知らぬ人への無償の援助——これらの概念は心の中で中立だ。抵抗はないが、動機もない。\n\n入り口の近くに留まる。待合室には5つの段階がある。先のどこかで、もっと深い何かが触発されるかもしれない。`,

        ko: `"보상은 없습니다."\n\n그 한 줄을 읽고 기다리는 사람들을 본다. 그들의 필요를 이해하지만, 몸 안에서 들어가려는 충동이 일어나지 않는다.\n\n이것은 친절함이나 냉담함의 문제가 아니다 — 이런 유형의 활동에 대한 본능적 반응의 문제다. 자원봉사, 낯선 이들을 위한 무보수 도움 — 이 개념들은 마음속에서 중립적이다. 저항도 없지만, 동기도 없다.\n\n입구 근처에 머문다. 대기실에는 다섯 단계가 있다. 아마 앞으로 더 깊은 무언가를 촉발하는 것이 있을지도 모른다.`,
      },
    },
  },

  {
    id: 17,
    riasec: "S",
    miniIpCode: "S1",
    miniIpItem: "Help people with personal or emotional problems",
    chapter: "waiting",
    chapterIndex: 4,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `你在等候室走了一圈，注意到角落里有一个人。

她坐在那里，双手紧紧攥在一起，肩膀微微发抖。不是冷——是某种更深的东西。她的眼睛红了，但没有哭出来，像是一直在忍着什么。

Leila 走过去轻声问了几句，然后回来说：「她刚收到一个很坏的消息。不是关于游戏的——是她真实生活里的事。她说她觉得自己快撑不住了。」

她需要的不是解决方案，也不是道理。她需要有人坐在她旁边，真正地听她说话，让她知道她不是一个人。帮她把压在心里的东西说出来，帮她在情绪的漩涡里找到可以站稳的地方。

这需要的不是专业技能——是真正的在场、耐心和共情。你愿意走过去，承接别人的痛苦吗？`,

      en: `After walking through the waiting room, you notice someone in the corner.\n\nShe's sitting there, hands clenched tightly together, shoulders trembling slightly. Not from cold — from something deeper. Her eyes are red, but she hasn't cried, as if holding something back.\n\nLeila speaks to her softly, then returns: "She just received terrible news. Not about the game — something from her real life. She says she feels like she can't hold on much longer."\n\nWhat she needs isn't a solution or logic. She needs someone to sit beside her, truly listen, let her know she's not alone. Help her voice what's been crushed inside. Help her find solid ground in the whirlpool of emotion.\n\nThis doesn't require professional skill — it requires genuine presence, patience, and empathy. Are you willing to walk over and hold space for someone else's pain?`,

      nl: `Na een rondje door de wachtkamer merk je iemand op in de hoek.\n\nZe zit daar, handen stijf in elkaar geklemd, schouders licht trillend. Niet van de kou — van iets diepers. Haar ogen zijn rood, maar ze heeft niet gehuild, alsof ze iets binnenhoudt.\n\nLeila spreekt zacht met haar en komt terug: "Ze heeft net vreselijk nieuws gekregen. Niet over het spel — iets uit haar echte leven. Ze zegt dat ze het gevoel heeft dat ze het niet veel langer volhoudt."\n\nWat ze nodig heeft is geen oplossing of logica. Ze heeft iemand nodig die naast haar gaat zitten, echt luistert, haar laat weten dat ze er niet alleen voor staat. Haar helpen te verwoorden wat vanbinnen verpletterd is. Haar helpen vaste grond te vinden in de draaikolk van emoties.\n\nDit vereist geen professionele vaardigheid — het vereist oprechte aanwezigheid, geduld en empathie. Ben je bereid erheen te lopen en ruimte te bieden voor andermans pijn?`,

      de: `Nach einem Rundgang durch den Warteraum fällt dir jemand in der Ecke auf.\n\nSie sitzt da, Hände fest ineinander verkrampft, Schultern leicht zitternd. Nicht vor Kälte — vor etwas Tieferem. Ihre Augen sind rot, aber sie hat nicht geweint, als würde sie etwas zurückhalten.\n\nLeila spricht leise mit ihr und kommt zurück: „Sie hat gerade schreckliche Nachrichten bekommen. Nicht über das Spiel — etwas aus ihrem echten Leben. Sie sagt, sie hat das Gefühl, nicht mehr lange durchhalten zu können."\n\nWas sie braucht, ist keine Lösung und keine Logik. Sie braucht jemanden, der sich neben sie setzt, wirklich zuhört, ihr zeigt, dass sie dem nicht allein gegenübersteht. Ihr helfen auszusprechen, was in ihr zerdrückt wurde. Ihr helfen, im Strudel der Gefühle festen Boden zu finden.\n\nDas erfordert keine professionelle Kompetenz — es erfordert echte Präsenz, Geduld und Empathie. Bist du bereit hinzugehen und den Schmerz eines anderen Menschen auszuhalten?`,

      fr: `Après avoir traversé la salle d'attente, vous remarquez quelqu'un dans le coin.\n\nElle est assise là, mains serrées l'une contre l'autre, épaules tremblant légèrement. Pas de froid — de quelque chose de plus profond. Ses yeux sont rouges, mais elle n'a pas pleuré, comme si elle retenait quelque chose.\n\nLeila lui parle doucement, puis revient : « Elle vient de recevoir une terrible nouvelle. Pas à propos du jeu — quelque chose de sa vraie vie. Elle dit qu'elle a l'impression de ne plus pouvoir tenir. »\n\nCe dont elle a besoin n'est ni une solution ni de la logique. Elle a besoin que quelqu'un s'assoie à côté d'elle, écoute vraiment, lui fasse savoir qu'elle n'est pas seule face à tout cela. L'aider à exprimer ce qui est écrasé à l'intérieur. L'aider à trouver un sol ferme dans le tourbillon des émotions.\n\nCela ne demande pas de compétence professionnelle — cela demande une présence authentique, de la patience et de l'empathie. Êtes-vous prêt à vous approcher et à accueillir la douleur de quelqu'un d'autre ?`,

      es: `Después de recorrer la sala de espera, notas a alguien en la esquina.\n\nEstá sentada ahí, manos fuertemente entrelazadas, hombros temblando ligeramente. No de frío — de algo más profundo. Sus ojos están rojos, pero no ha llorado, como si contuviera algo.\n\nLeila habla con ella suavemente y vuelve: "Acaba de recibir una noticia terrible. No sobre el juego — algo de su vida real. Dice que siente que ya no puede más."\n\nLo que necesita no es una solución ni lógica. Necesita que alguien se siente a su lado, escuche de verdad, le haga saber que no está enfrentando esto sola. Ayudarla a expresar lo que lleva aplastado dentro. Ayudarla a encontrar suelo firme en el remolino de emociones.\n\nEsto no requiere habilidad profesional — requiere presencia genuina, paciencia y empatía. ¿Estás dispuesto a acercarte y sostener el dolor de otra persona?`,

      pt: `Depois de andar pela sala de espera, você nota alguém no canto.\n\nEla está sentada ali, mãos fortemente entrelaçadas, ombros tremendo levemente. Não de frio — de algo mais profundo. Seus olhos estão vermelhos, mas não chorou, como se segurasse algo.\n\nLeila fala com ela suavemente e volta: "Ela acabou de receber uma notícia terrível. Não sobre o jogo — algo da vida real dela. Ela diz que sente que não aguenta mais."\n\nO que ela precisa não é uma solução nem lógica. Ela precisa de alguém que se sente ao lado dela, ouça de verdade, a faça saber que não está enfrentando isso sozinha. Ajudá-la a expressar o que está esmagado dentro dela. Ajudá-la a encontrar chão firme no redemoinho de emoções.\n\nIsso não requer habilidade profissional — requer presença genuína, paciência e empatia. Você está disposto a se aproximar e acolher a dor de outra pessoa?`,

      it: `Dopo aver attraversato la sala d'attesa, noti qualcuno nell'angolo.\n\nÈ seduta lì, mani strette forte l'una nell'altra, spalle che tremano leggermente. Non per il freddo — per qualcosa di più profondo. I suoi occhi sono rossi, ma non ha pianto, come se trattenesse qualcosa.\n\nLeila le parla piano, poi torna: "Ha appena ricevuto una notizia terribile. Non sul gioco — qualcosa dalla sua vita reale. Dice che sente di non farcela più."\n\nCiò di cui ha bisogno non è una soluzione né logica. Ha bisogno che qualcuno si sieda accanto a lei, ascolti davvero, le faccia sapere che non è sola ad affrontare tutto questo. Aiutarla a esprimere ciò che è schiacciato dentro. Aiutarla a trovare un terreno solido nel vortice delle emozioni.\n\nQuesto non richiede competenza professionale — richiede presenza autentica, pazienza ed empatia. Sei disposto ad avvicinarti e accogliere il dolore di qualcun altro?`,

      ru: `Пройдя по залу ожидания, вы замечаете кого-то в углу.\n\nОна сидит, руки крепко сжаты, плечи слегка дрожат. Не от холода — от чего-то более глубокого. Глаза красные, но она не плакала, словно сдерживает что-то внутри.\n\nЛейла тихо говорит с ней и возвращается: «Она только что получила ужасную новость. Не про игру — из её настоящей жизни. Говорит, что чувствует, что больше не выдерживает.»\n\nЕй не нужно решение или логика. Ей нужен кто-то, кто сядет рядом, по-настоящему выслушает, даст понять, что она не одна. Помочь ей высказать то, что раздавлено внутри. Помочь найти твёрдую почву в водовороте эмоций.\n\nЭто не требует профессиональных навыков — это требует подлинного присутствия, терпения и эмпатии. Вы готовы подойти и принять чужую боль?`,

      ja: `待合室を歩き回った後、隅にいる人に気づく。\n\n彼女はそこに座っている。両手をきつく握りしめ、肩がわずかに震えている。寒さからではない——もっと深いところからだ。目は赤いが泣いてはいない、何かを必死にこらえているように。\n\nレイラが彼女に優しく話しかけ、戻ってきた：「ひどい知らせを受けたばかりだそうです。ゲームのことじゃなく——現実の生活のこと。もう持ちこたえられないと言っています。」\n\n彼女が必要としているのは解決策でも理屈でもない。隣に座って、本当に話を聞いて、一人で抱え込まなくていいと伝えてくれる人。心の中で押しつぶされているものを言葉にする手助け。感情の渦の中で足場を見つける手助け。\n\nこれに必要なのは専門技術ではない——本物の寄り添い、忍耐、そして共感だ。あなたは歩み寄って、他人の痛みを受け止める覚悟があるか？`,

      ko: `대기실을 한 바퀴 돌고 나서 구석에 있는 사람을 발견한다.\n\n그녀는 거기 앉아 있다. 두 손을 꽉 쥐고, 어깨가 미세하게 떨리고 있다. 추위 때문이 아니다 — 더 깊은 무언가 때문이다. 눈이 붉지만 울지는 않았다, 무언가를 억누르고 있는 것처럼.\n\n레일라가 그녀에게 부드럽게 말을 건넨 뒤 돌아왔다: "방금 끔찍한 소식을 받았대요. 게임이 아니라 — 실제 삶에서요. 더 이상 버틸 수 없을 것 같다고 해요."\n\n그녀에게 필요한 것은 해결책이나 논리가 아니다. 옆에 앉아서 진심으로 들어주고, 혼자가 아니라는 것을 알게 해줄 사람. 안에서 짓눌린 것을 말로 꺼내도록 도와주는 것. 감정의 소용돌이 속에서 발을 딛고 설 곳을 찾도록 도와주는 것.\n\n이것은 전문 기술이 필요하지 않다 — 진정한 존재감, 인내, 그리고 공감이 필요하다. 다가가서 다른 사람의 고통을 받아줄 의향이 있는가?`,
    },
    taskDescription: {
      zh: "坐在她身边，倾听她正在经历的一切——不需要给出答案，只需要真正地在场，帮助她度过这个情绪上最难的时刻。这项任务需要一个主要负责人。",

      en: `Sit beside her and listen to what she's going through — no answers needed, just genuine presence, helping her through the hardest emotional moment. This task needs one primary person.`,

      nl: `Ga naast haar zitten en luister naar wat ze doormaakt — geen antwoorden nodig, alleen oprechte aanwezigheid, haar helpen door het moeilijkste emotionele moment. Deze taak heeft één hoofdpersoon nodig.`,

      de: `Setz dich neben sie und höre zu, was sie durchmacht — keine Antworten nötig, nur echte Präsenz, ihr durch den schwersten emotionalen Moment helfen. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Asseyez-vous à côté d'elle et écoutez ce qu'elle traverse — pas besoin de réponses, juste une présence authentique, l'aider à traverser le moment émotionnel le plus difficile. Cette tâche nécessite une personne principale.`,

      es: `Siéntate a su lado y escucha lo que está atravesando — no se necesitan respuestas, solo presencia genuina, ayudándola a superar el momento emocional más difícil. Esta tarea necesita una persona principal.`,

      pt: `Sente-se ao lado dela e ouça o que ela está passando — não precisa de respostas, apenas presença genuína, ajudando-a a atravessar o momento emocional mais difícil. Esta tarefa precisa de uma pessoa principal.`,

      it: `Siediti accanto a lei e ascolta ciò che sta attraversando — non servono risposte, solo presenza autentica, aiutandola attraverso il momento emotivo più difficile. Questo compito richiede una persona principale.`,

      ru: `Сядьте рядом с ней и выслушайте, через что она проходит — ответы не нужны, только подлинное присутствие, помогая ей пережить самый тяжёлый эмоциональный момент. Для этой задачи нужен один ответственный.`,

      ja: `彼女のそばに座り、彼女が経験していることに耳を傾けてください——答えは必要ありません、ただ本当にそこにいること、最もつらい感情の瞬間を乗り越える手助けをしましょう。この作業には主担当者が一人必要です。`,

      ko: `그녀 옆에 앉아 그녀가 겪고 있는 것을 들어주세요 — 답이 필요한 게 아닙니다, 진정한 존재감으로 가장 힘든 감정적 순간을 함께 해주세요. 이 작업에는 주 담당자가 한 명 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走过去了。

不是因为你是心理咨询师——也许你是，也许不是。是因为你看到她发抖的肩膀，看到她咬紧的嘴唇，身体里有一种非常清楚的反应——她现在不能一个人待着。

你坐在她旁边，没有紧挨着，但足够近，让她知道有人在。你没有说「会好起来的」——你知道这句话在这个时刻毫无意义。

你只是轻声说：「我在这里。你想说的话，我都听着。」

她沉默了很久。然后她开始说——断断续续的，声音很轻。你没有打断，没有建议，只是听。听她的语气，听她停顿的地方，听她什么时候声音颤了一下。

说完之后，她长长地吐了一口气。肩膀终于松下来了。

她说：「谢谢你没有叫我别难过。」`,

        en: `You walk over.\n\nNot because you're a counselor — maybe you are, maybe not. Because you see her trembling shoulders, her clenched jaw, and something very clear rises inside — she can't be alone right now.\n\nYou sit beside her, not too close, but close enough to let her know someone is here. You don't say "it'll be okay" — you know those words mean nothing in this moment.\n\nYou simply say softly: "I'm here. Whatever you want to say, I'm listening."\n\nShe's silent for a long time. Then she starts talking — haltingly, voice barely above a whisper. You don't interrupt, don't advise, just listen. To her tone, to where she pauses, to where her voice catches.\n\nWhen she finishes, she lets out a long breath. Her shoulders finally release.\n\nShe says: "Thank you for not telling me to cheer up."`,

        nl: `Je loopt erheen.\n\nNiet omdat je hulpverlener bent — misschien wel, misschien niet. Omdat je haar trillende schouders ziet, haar samengeknepen kaken, en er iets heel duidelijks opkomt — ze kan nu niet alleen zijn.\n\nJe gaat naast haar zitten, niet te dichtbij, maar dichtbij genoeg om haar te laten weten dat er iemand is. Je zegt niet "het komt goed" — je weet dat die woorden nu niets betekenen.\n\nJe zegt alleen zacht: "Ik ben hier. Wat je ook wilt zeggen, ik luister."\n\nZe is lang stil. Dan begint ze te praten — aarzelend, stem nauwelijks hoorbaar. Je onderbreekt niet, geeft geen advies, luistert alleen. Naar haar toon, naar waar ze pauzeert, naar waar haar stem hapert.\n\nAls ze klaar is, blaast ze lang uit. Haar schouders ontspannen eindelijk.\n\nZe zegt: "Dank je dat je niet zei dat ik me moest opvrolijken."`,

        de: `Du gehst hinüber.\n\nNicht weil du Berater bist — vielleicht bist du einer, vielleicht nicht. Weil du ihre zitternden Schultern siehst, ihren zusammengepressten Kiefer, und etwas sehr Klares aufsteigt — sie kann jetzt nicht allein sein.\n\nDu setzt dich neben sie, nicht zu nah, aber nah genug, damit sie weiß, dass jemand da ist. Du sagst nicht „es wird schon" — du weißt, dass diese Worte gerade bedeutungslos sind.\n\nDu sagst nur leise: „Ich bin hier. Was immer du sagen willst, ich höre zu."\n\nSie schweigt lange. Dann beginnt sie zu sprechen — stockend, Stimme kaum über einem Flüstern. Du unterbrichst nicht, rätst nicht, hörst nur zu. Auf ihren Ton, wo sie pausiert, wo ihre Stimme bricht.\n\nAls sie fertig ist, atmet sie lang aus. Ihre Schultern lösen sich endlich.\n\nSie sagt: „Danke, dass du mir nicht gesagt hast, ich soll mich zusammenreißen."`,

        fr: `Vous vous approchez.\n\nPas parce que vous êtes thérapeute — peut-être l'êtes-vous, peut-être pas. Parce que vous voyez ses épaules tremblantes, sa mâchoire serrée, et quelque chose de très clair monte en vous — elle ne peut pas être seule en ce moment.\n\nVous vous asseyez à côté d'elle, pas trop près, mais assez pour qu'elle sache que quelqu'un est là. Vous ne dites pas « ça ira » — vous savez que ces mots ne signifient rien en cet instant.\n\nVous dites simplement doucement : « Je suis là. Quoi que vous vouliez dire, je vous écoute. »\n\nElle reste silencieuse longtemps. Puis elle commence à parler — par à-coups, d'une voix à peine audible. Vous n'interrompez pas, ne conseillez pas, écoutez simplement. Son ton, ses pauses, les moments où sa voix tremble.\n\nQuand elle finit, elle expire longuement. Ses épaules se relâchent enfin.\n\nElle dit : « Merci de ne pas m'avoir dit de me ressaisir. »`,

        es: `Te acercas.\n\nNo porque seas terapeuta — quizás lo eres, quizás no. Porque ves sus hombros temblando, su mandíbula apretada, y algo muy claro surge dentro — ella no puede estar sola ahora.\n\nTe sientas a su lado, no demasiado cerca, pero lo suficiente para que sepa que alguien está ahí. No dices "va a estar bien" — sabes que esas palabras no significan nada en este momento.\n\nSimplemente dices en voz baja: "Estoy aquí. Lo que quieras decir, te escucho."\n\nElla guarda silencio por mucho tiempo. Luego empieza a hablar — entrecortadamente, con voz apenas audible. No interrumpes, no aconsejas, solo escuchas. Su tono, dónde hace pausas, dónde se le quiebra la voz.\n\nCuando termina, suelta un largo suspiro. Sus hombros finalmente se relajan.\n\nElla dice: "Gracias por no decirme que me anime."`,

        pt: `Você se aproxima.\n\nNão porque seja terapeuta — talvez seja, talvez não. Porque vê seus ombros tremendo, seu maxilar cerrado, e algo muito claro surge dentro — ela não pode ficar sozinha agora.\n\nVocê se senta ao lado dela, não muito perto, mas perto o bastante para que saiba que alguém está ali. Não diz "vai ficar tudo bem" — sabe que essas palavras não significam nada neste momento.\n\nApenas diz suavemente: "Estou aqui. O que quiser dizer, estou ouvindo."\n\nEla fica em silêncio por muito tempo. Depois começa a falar — hesitante, voz quase inaudível. Você não interrompe, não aconselha, apenas escuta. O tom, onde ela pausa, onde a voz falha.\n\nQuando termina, solta um longo suspiro. Os ombros finalmente relaxam.\n\nEla diz: "Obrigada por não me dizer para ficar bem."`,

        it: `Ti avvicini.\n\nNon perché sei un consulente — forse lo sei, forse no. Perché vedi le sue spalle tremare, la mascella serrata, e qualcosa di molto chiaro sale dentro — non può stare da sola adesso.\n\nTi siedi accanto a lei, non troppo vicino, ma abbastanza perché sappia che qualcuno è lì. Non dici "andrà tutto bene" — sai che quelle parole non significano nulla in questo momento.\n\nDici semplicemente piano: "Sono qui. Qualunque cosa tu voglia dire, ti ascolto."\n\nTace a lungo. Poi comincia a parlare — a tratti, con voce appena udibile. Non interrompi, non consigli, ascolti e basta. Il tono, dove si ferma, dove la voce si incrina.\n\nQuando finisce, espira a lungo. Le spalle finalmente si rilasciano.\n\nDice: "Grazie per non avermi detto di farmi forza."`,

        ru: `Вы подходите.\n\nНе потому что вы психолог — может быть, может нет. Потому что видите её дрожащие плечи, сжатые челюсти, и что-то очень ясное поднимается внутри — ей нельзя сейчас быть одной.\n\nВы садитесь рядом, не слишком близко, но достаточно, чтобы она знала — кто-то здесь. Вы не говорите «всё будет хорошо» — знаете, что эти слова сейчас ничего не значат.\n\nВы просто тихо говорите: «Я здесь. Что бы ты ни хотела сказать, я слушаю.»\n\nОна долго молчит. Потом начинает говорить — прерывисто, голосом едва слышным. Вы не перебиваете, не советуете, просто слушаете. Её тон, где она замолкает, где голос дрожит.\n\nКогда она заканчивает, делает долгий выдох. Плечи наконец расслабляются.\n\nОна говорит: «Спасибо, что не сказали мне взять себя в руки.»`,

        ja: `歩み寄る。\n\nカウンセラーだからではない——そうかもしれないし、そうでないかもしれない。震える肩、食いしばった顎を見て、とても明確な何かが内側から湧き上がるからだ——彼女は今、一人でいてはいけない。\n\n隣に座る。近すぎず、でも誰かがいると伝わるくらいに。「大丈夫だよ」とは言わない——その言葉が今この瞬間、何の意味もないことを知っているから。\n\nただ静かに言う：「ここにいます。話したいことがあれば、聴いています。」\n\n彼女は長い間黙っている。それから話し始める——途切れ途切れに、ささやくような声で。遮らない、助言しない、ただ聴く。声のトーンを、立ち止まるところを、声が震えるところを。\n\n話し終えると、長く息を吐いた。肩がようやく力を抜いた。\n\n彼女は言った：「元気出してって言わないでくれて、ありがとう。」`,

        ko: `다가간다.\n\n상담사이기 때문이 아니다 — 그럴 수도 있고 아닐 수도 있다. 그녀의 떨리는 어깨, 꽉 물린 턱을 보고, 매우 분명한 무언가가 내면에서 올라오기 때문이다 — 지금 혼자 있으면 안 된다.\n\n옆에 앉는다. 너무 가깝지 않게, 하지만 누군가 있다는 걸 알 수 있을 만큼. "괜찮을 거야"라고 말하지 않는다 — 그 말이 이 순간 아무 의미가 없다는 걸 안다.\n\n그저 조용히 말한다: "여기 있어요. 하고 싶은 말이 있으면 듣고 있을게요."\n\n그녀는 오랫동안 침묵한다. 그러고는 말하기 시작한다 — 띄엄띄엄, 겨우 들릴 듯한 목소리로. 끊지 않고, 조언하지 않고, 그냥 듣는다. 목소리 톤을, 멈추는 곳을, 목소리가 갈라지는 순간을.\n\n다 말하고 나서 길게 숨을 내쉰다. 어깨가 마침내 풀린다.\n\n그녀가 말한다: "힘내라고 안 해줘서 고마워요."`,
      },
      score4: {
        zh: `你走过去了，但没有立刻坐下。

你看着她红肿的眼睛、紧攥的双手。你能感觉到她正在经历的东西很重——但你不确定自己能不能真正接住它。

你还是坐下了。没有紧挨着，隔了一个位子的距离。你试着开口：「你还好吗？」——话一出口你就觉得这句话太轻了。但她抬头看了你一眼，似乎并不介意。

她开始断断续续地说了一些。你听着，偶尔点头。你没有那种天生就知道怎么回应的能力，但你在努力——认真地、笨拙地在努力。

这不完美。但她不再是一个人了。`,

        en: `You walk over, but don't sit down right away.\n\nYou see her swollen eyes, her clenched hands. You can feel what she's going through is heavy — but you're not sure you can truly hold it.\n\nYou sit down anyway. Not right next to her, a seat apart. You try: "Are you okay?" — the words feel too light the moment they leave your mouth. But she looks up, and doesn't seem to mind.\n\nShe starts talking, haltingly. You listen, nodding occasionally. You don't have the instinct for knowing exactly what to say, but you're trying — earnestly, clumsily trying.\n\nIt's not perfect. But she's no longer alone.`,

        nl: `Je loopt erheen, maar gaat niet meteen zitten.\n\nJe ziet haar gezwollen ogen, haar gebalde handen. Je voelt dat wat ze doormaakt zwaar is — maar je weet niet zeker of je het echt kunt dragen.\n\nJe gaat toch zitten. Niet direct naast haar, een stoel ertussen. Je probeert: "Gaat het?" — de woorden voelen te licht zodra ze je mond verlaten. Maar ze kijkt op en lijkt het niet erg te vinden.\n\nZe begint aarzelend te praten. Je luistert, knikt af en toe. Je hebt niet het instinct om precies te weten wat je moet zeggen, maar je probeert het — oprecht, onhandig proberend.\n\nHet is niet perfect. Maar ze is niet meer alleen.`,

        de: `Du gehst hin, setzt dich aber nicht sofort.\n\nDu siehst ihre geschwollenen Augen, ihre verkrampften Hände. Du spürst, dass das, was sie durchmacht, schwer wiegt — aber du bist nicht sicher, ob du es wirklich auffangen kannst.\n\nDu setzt dich trotzdem. Nicht direkt neben sie, einen Platz Abstand. Du versuchst: „Geht es dir gut?" — die Worte fühlen sich zu leicht an, kaum ausgesprochen. Aber sie schaut auf und scheint es nicht schlimm zu finden.\n\nSie beginnt stockend zu erzählen. Du hörst zu, nickst gelegentlich. Du hast nicht das natürliche Gespür, genau das Richtige zu sagen, aber du bemühst dich — aufrichtig, unbeholfen bemühst du dich.\n\nEs ist nicht perfekt. Aber sie ist nicht mehr allein.`,

        fr: `Vous vous approchez, mais ne vous asseyez pas tout de suite.\n\nVous voyez ses yeux gonflés, ses mains crispées. Vous sentez que ce qu'elle traverse est lourd — mais vous n'êtes pas sûr de pouvoir vraiment le porter.\n\nVous vous asseyez quand même. Pas juste à côté, un siège d'écart. Vous essayez : « Ça va ? » — les mots semblent trop légers à peine prononcés. Mais elle lève les yeux et ne semble pas s'en offusquer.\n\nElle commence à parler, par bribes. Vous écoutez, hochant la tête de temps en temps. Vous n'avez pas l'instinct de savoir exactement quoi dire, mais vous essayez — sincèrement, maladroitement.\n\nCe n'est pas parfait. Mais elle n'est plus seule.`,

        es: `Te acercas, pero no te sientas de inmediato.\n\nVes sus ojos hinchados, sus manos apretadas. Puedes sentir que lo que atraviesa es pesado — pero no estás seguro de poder sostenerlo realmente.\n\nTe sientas de todos modos. No justo a su lado, un asiento de distancia. Intentas: "¿Estás bien?" — las palabras se sienten demasiado ligeras apenas salen. Pero ella levanta la vista y no parece importarle.\n\nEmpieza a hablar, entrecortadamente. Escuchas, asintiendo de vez en cuando. No tienes el instinto de saber exactamente qué decir, pero lo intentas — sincera, torpemente lo intentas.\n\nNo es perfecto. Pero ya no está sola.`,

        pt: `Você se aproxima, mas não senta imediatamente.\n\nVê os olhos inchados dela, as mãos cerradas. Sente que o que ela está passando é pesado — mas não tem certeza de conseguir realmente acolher.\n\nSenta assim mesmo. Não bem ao lado, um assento de distância. Tenta: "Você está bem?" — as palavras parecem leves demais assim que saem. Mas ela olha para cima e não parece se importar.\n\nEla começa a falar, hesitante. Você escuta, acenando ocasionalmente. Não tem o instinto de saber exatamente o que dizer, mas está tentando — sincera e desajeitadamente tentando.\n\nNão é perfeito. Mas ela não está mais sozinha.`,

        it: `Ti avvicini, ma non ti siedi subito.\n\nVedi i suoi occhi gonfi, le mani serrate. Senti che quello che sta attraversando è pesante — ma non sei sicuro di poterlo davvero reggere.\n\nTi siedi comunque. Non proprio accanto, un posto di distanza. Provi: "Stai bene?" — le parole sembrano troppo leggere appena dette. Ma lei alza lo sguardo e non sembra dispiacerle.\n\nComincia a parlare, a tratti. Ascolti, annuendo ogni tanto. Non hai l'istinto di sapere esattamente cosa dire, ma ci provi — sinceramente, goffamente ci provi.\n\nNon è perfetto. Ma non è più sola.`,

        ru: `Вы подходите, но не садитесь сразу.\n\nВидите её опухшие глаза, сжатые руки. Чувствуете, что то, через что она проходит, тяжело — но не уверены, что сможете по-настоящему это принять.\n\nВсё-таки садитесь. Не вплотную, через одно место. Пробуете: «Ты в порядке?» — слова кажутся слишком лёгкими, едва произнесённые. Но она поднимает взгляд и, кажется, не обижается.\n\nОна начинает говорить, прерывисто. Вы слушаете, изредка кивая. У вас нет врождённого чутья на нужные слова, но вы стараетесь — искренне, неуклюже стараетесь.\n\nНе идеально. Но она больше не одна.`,

        ja: `歩み寄るが、すぐには座らない。\n\n腫れた目、きつく握られた手が見える。彼女が経験していることが重いのは感じる——でも本当にそれを受け止められるか確信がない。\n\nそれでも座る。真横ではなく、一席空けて。試みる：「大丈夫？」——口に出した瞬間、軽すぎる言葉だと感じる。でも彼女は顔を上げ、気にしていないようだった。\n\n彼女がぽつりぽつりと話し始める。聴いている、時々うなずきながら。何を言えばいいか本能的にわかるタイプではないが、努力している——真剣に、不器用に努力している。\n\n完璧ではない。でも彼女はもう一人ではない。`,

        ko: `다가가지만, 바로 앉지는 않는다.\n\n부어오른 눈, 꽉 쥔 두 손이 보인다. 그녀가 겪고 있는 것이 무겁다는 건 느껴진다 — 하지만 정말로 그것을 받아낼 수 있을지 확신이 없다.\n\n그래도 앉는다. 바로 옆은 아니고, 한 자리 띄워서. 시도한다: "괜찮아요?" — 말이 입에서 나오자마자 너무 가볍게 느껴진다. 하지만 그녀가 고개를 들어 바라보고, 개의치 않는 것 같다.\n\n그녀가 띄엄띄엄 말하기 시작한다. 듣고 있다, 가끔 고개를 끄덕이며. 정확히 뭐라고 해야 할지 본능적으로 아는 유형은 아니지만, 노력하고 있다 — 진심으로, 서투르게 노력하고 있다.\n\n완벽하지 않다. 하지만 그녀는 더 이상 혼자가 아니다.`,
      },
      score3: {
        zh: `你看着角落里那个在发抖的人。

坐下来陪她度过一个情绪崩溃的时刻……你理解她需要有人在，但你不确定自己是那个对的人。倾听别人的痛苦——那种深层的、私密的情感——需要一种你不确定今天有没有的承受力。

你站在那里犹豫了一会儿。也许你可以问她需不需要水，但坐下来深入倾听……你等等看。`,

        en: `You look at the person trembling in the corner.\n\nSitting down to be with someone through an emotional breakdown... you understand she needs someone there, but you're not sure you're the right person. Listening to someone's pain — that deep, private kind of anguish — takes a capacity you're not sure you have today.\n\nYou stand there, hesitating. Maybe you can ask if she needs water, but sitting down to really listen... you'll wait and see.`,

        nl: `Je kijkt naar de trillende persoon in de hoek.\n\nGaan zitten om iemand bij te staan tijdens een emotionele instorting... je begrijpt dat ze iemand nodig heeft, maar je weet niet zeker of jij de juiste persoon bent. Luisteren naar iemands pijn — dat diepe, persoonlijke soort lijden — vereist een draagkracht die je niet zeker weet of je die vandaag hebt.\n\nJe staat daar, aarzelend. Misschien kun je vragen of ze water nodig heeft, maar gaan zitten om echt te luisteren... je wacht af.`,

        de: `Du schaust auf die zitternde Person in der Ecke.\n\nDich hinsetzen und jemanden durch einen emotionalen Zusammenbruch begleiten... du verstehst, dass sie jemanden braucht, aber du bist nicht sicher, ob du die richtige Person bist. Dem Schmerz eines anderen zuhören — dieser tiefen, intimen Art von Qual — erfordert eine Belastbarkeit, die du heute nicht sicher hast.\n\nDu stehst da und zögerst. Vielleicht kannst du fragen, ob sie Wasser braucht, aber dich hinsetzen und wirklich zuhören... du wartest ab.`,

        fr: `Vous regardez la personne tremblante dans le coin.\n\nS'asseoir pour accompagner quelqu'un à travers un effondrement émotionnel... vous comprenez qu'elle a besoin de quelqu'un, mais vous n'êtes pas sûr d'être la bonne personne. Écouter la douleur de quelqu'un — cette souffrance profonde et intime — demande une capacité que vous n'êtes pas sûr d'avoir aujourd'hui.\n\nVous restez là, hésitant. Peut-être pouvez-vous demander si elle a besoin d'eau, mais s'asseoir pour vraiment écouter... vous attendez de voir.`,

        es: `Miras a la persona temblando en la esquina.\n\nSentarte para acompañar a alguien a través de un colapso emocional... entiendes que necesita a alguien, pero no estás seguro de ser la persona adecuada. Escuchar el dolor de alguien — ese tipo profundo e íntimo de angustia — requiere una capacidad que no estás seguro de tener hoy.\n\nTe quedas ahí, dudando. Quizás puedas preguntar si necesita agua, pero sentarte a escuchar de verdad... esperarás a ver.`,

        pt: `Você olha para a pessoa tremendo no canto.\n\nSentar para acompanhar alguém através de um colapso emocional... entende que ela precisa de alguém, mas não tem certeza de ser a pessoa certa. Ouvir a dor de alguém — aquele tipo profundo e íntimo de angústia — exige uma capacidade que não tem certeza de ter hoje.\n\nVocê fica ali, hesitando. Talvez possa perguntar se ela precisa de água, mas sentar para realmente ouvir... vai esperar para ver.`,

        it: `Guardi la persona che trema nell'angolo.\n\nSederti per stare con qualcuno durante un crollo emotivo... capisci che ha bisogno di qualcuno, ma non sei sicuro di essere la persona giusta. Ascoltare il dolore di qualcuno — quel tipo profondo e intimo di angoscia — richiede una capacità che non sei sicuro di avere oggi.\n\nResti lì, esitando. Forse puoi chiedere se ha bisogno d'acqua, ma sederti per ascoltare davvero... aspetti e vedi.`,

        ru: `Вы смотрите на дрожащего человека в углу.\n\nСесть и быть рядом с кем-то во время эмоционального срыва... вы понимаете, что ей нужен кто-то, но не уверены, что вы — тот самый человек. Слушать чужую боль — ту глубокую, личную муку — требует выносливости, в которой вы сегодня не уверены.\n\nВы стоите, колеблясь. Может, спросите, нужна ли ей вода, но сесть и по-настоящему слушать... подождёте и посмотрите.`,

        ja: `隅で震えている人を見る。\n\n感情が崩れた瞬間に寄り添うために座る...彼女に誰かが必要だとわかるが、自分がその適任者かどうか確信がない。他人の痛みに耳を傾ける——あの深く、私的な苦悩に——今日の自分にその受容力があるかわからない。\n\nそこに立ち、迷っている。水が必要か聞くくらいはできるかもしれないが、座って本当に聴く...様子を見よう。`,

        ko: `구석에서 떨고 있는 사람을 본다.\n\n감정적 붕괴의 순간을 함께하기 위해 앉기... 그녀에게 누군가가 필요하다는 건 이해하지만, 자신이 그 적합한 사람인지 확신이 없다. 누군가의 고통을 듣기 — 그 깊고 사적인 종류의 괴로움 — 은 오늘 있는지 모를 감당 능력을 요구한다.\n\n거기 서서 망설인다. 물이 필요한지 정도는 물어볼 수 있겠지만, 앉아서 진심으로 듣기는... 지켜보기로 한다.`,
      },
      score2: {
        zh: `坐下来陪一个情绪崩溃的陌生人。

你看着她发抖的肩膀，知道她正在经历很痛苦的事。但走过去、坐在她旁边、成为那个倾听她说出心里最深处东西的人——这种深度的情感在场，不是你会自然去做的事。

你退后了。Leila 在那边，她会比你做得更好。`,

        en: `Sitting with a stranger through an emotional breakdown.\n\nYou see her trembling shoulders, know she's going through something painful. But walking over, sitting beside her, becoming the person who listens as she voices her deepest pain — that depth of emotional presence isn't something you'd naturally do.\n\nYou step back. Leila is over there. She'll do this better than you.`,

        nl: `Bij een vreemde zitten tijdens een emotionele instorting.\n\nJe ziet haar trillende schouders, weet dat ze iets pijnlijks doormaakt. Maar erheen lopen, naast haar gaan zitten, de persoon worden die luistert terwijl ze haar diepste pijn uit — die diepte van emotionele aanwezigheid is niet iets dat je van nature zou doen.\n\nJe doet een stap terug. Leila is daar. Zij zal dit beter doen dan jij.`,

        de: `Bei einer Fremden sitzen während eines emotionalen Zusammenbruchs.\n\nDu siehst ihre zitternden Schultern, weißt dass sie etwas Schmerzhaftes durchmacht. Aber hingehen, dich neben sie setzen, die Person werden die zuhört während sie ihren tiefsten Schmerz ausspricht — diese Tiefe emotionaler Präsenz ist nichts, was du natürlicherweise tun würdest.\n\nDu trittst zurück. Leila ist dort drüben. Sie wird das besser machen als du.`,

        fr: `S'asseoir auprès d'une inconnue en plein effondrement émotionnel.\n\nVous voyez ses épaules tremblantes, savez qu'elle traverse quelque chose de douloureux. Mais s'approcher, s'asseoir à côté d'elle, devenir la personne qui écoute quand elle exprime sa douleur la plus profonde — cette profondeur de présence émotionnelle n'est pas quelque chose que vous feriez naturellement.\n\nVous reculez. Leila est là-bas. Elle fera mieux que vous.`,

        es: `Sentarte con una desconocida durante un colapso emocional.\n\nVes sus hombros temblando, sabes que está pasando por algo doloroso. Pero acercarte, sentarte a su lado, convertirte en la persona que escucha mientras ella expresa su dolor más profundo — esa profundidad de presencia emocional no es algo que harías naturalmente.\n\nDas un paso atrás. Leila está allá. Ella lo hará mejor que tú.`,

        pt: `Sentar com uma desconhecida durante um colapso emocional.\n\nVocê vê seus ombros tremendo, sabe que ela está passando por algo doloroso. Mas ir até lá, sentar ao lado dela, se tornar a pessoa que ouve enquanto ela expressa sua dor mais profunda — essa profundidade de presença emocional não é algo que faria naturalmente.\n\nVocê recua. Leila está lá. Ela fará isso melhor que você.`,

        it: `Sederti con una sconosciuta durante un crollo emotivo.\n\nVedi le sue spalle tremare, sai che sta attraversando qualcosa di doloroso. Ma avvicinarti, sederti accanto a lei, diventare la persona che ascolta mentre esprime il suo dolore più profondo — quella profondità di presenza emotiva non è qualcosa che faresti naturalmente.\n\nFai un passo indietro. Leila è là. Lo farà meglio di te.`,

        ru: `Сидеть рядом с незнакомкой во время эмоционального срыва.\n\nВы видите её дрожащие плечи, понимаете что она переживает что-то мучительное. Но подойти, сесть рядом, стать тем, кто слушает пока она выговаривает самую глубокую боль — такая глубина эмоционального присутствия не то, что вы стали бы делать естественно.\n\nВы отступаете. Лейла там. Она справится лучше.`,

        ja: `感情が崩壊した見知らぬ人のそばに座る。\n\n震える肩を見て、彼女が辛いことを経験しているとわかる。しかし歩み寄り、隣に座り、彼女が心の奥底の痛みを打ち明ける相手になる——そこまで深い感情的な寄り添いは、自然にやることではない。\n\n一歩引く。レイラが向こうにいる。自分より上手くやれるだろう。`,

        ko: `감정적으로 무너진 낯선 사람 옆에 앉기.\n\n떨리는 어깨를 보고, 고통스러운 일을 겪고 있다는 걸 안다. 하지만 다가가서 옆에 앉아, 그녀가 가장 깊은 고통을 말할 때 들어주는 사람이 되기 — 그 정도 깊이의 감정적 존재감은 자연스럽게 할 수 있는 일이 아니다.\n\n한 발 물러선다. 레일라가 저기 있다. 그녀가 더 잘 할 것이다.`,
      },
      score1: {
        zh: `坐下来倾听一个陌生人的情绪崩溃。

你看了她一眼，对她的处境有一些同情，但那种「让我来陪你」的冲动完全不在。一对一的情感支持——倾听、承接、在场——这些动作在你脑海里没有画面。

你转身了。等候室还有更多的任务在等着。`,

        en: `Sitting down to listen to a stranger's emotional breakdown.\n\nYou look at her. You feel some sympathy for her situation, but the "let me be here for you" impulse is entirely absent. One-on-one emotional support — listening, holding space, being present — these actions have no image in your mind.\n\nYou turn away. The waiting room still has more tasks ahead.`,

        nl: `Gaan zitten om naar de emotionele instorting van een vreemde te luisteren.\n\nJe kijkt naar haar. Je voelt enig medeleven met haar situatie, maar de impuls "laat mij er voor je zijn" is volledig afwezig. Een-op-een emotionele steun — luisteren, ruimte bieden, aanwezig zijn — deze handelingen hebben geen beeld in je hoofd.\n\nJe draait je om. De wachtkamer heeft nog meer taken in het verschiet.`,

        de: `Sich hinsetzen und dem emotionalen Zusammenbruch einer Fremden zuhören.\n\nDu siehst sie an. Du empfindest etwas Mitgefühl für ihre Situation, aber der Impuls „lass mich für dich da sein" ist völlig abwesend. Eins-zu-eins emotionale Unterstützung — zuhören, Raum halten, präsent sein — diese Handlungen haben kein Bild in deinem Kopf.\n\nDu wendest dich ab. Der Warteraum hat noch mehr Aufgaben vor sich.`,

        fr: `S'asseoir pour écouter l'effondrement émotionnel d'une inconnue.\n\nVous la regardez. Vous ressentez une certaine sympathie pour sa situation, mais l'impulsion « laissez-moi être là pour vous » est entièrement absente. Soutien émotionnel en tête-à-tête — écouter, accueillir, être présent — ces actions n'ont aucune image dans votre esprit.\n\nVous vous détournez. La salle d'attente a encore d'autres tâches devant elle.`,

        es: `Sentarte a escuchar el colapso emocional de una desconocida.\n\nLa miras. Sientes algo de simpatía por su situación, pero el impulso de "déjame estar aquí para ti" está completamente ausente. Apoyo emocional uno a uno — escuchar, sostener el espacio, estar presente — estas acciones no tienen imagen en tu mente.\n\nTe das la vuelta. La sala de espera aún tiene más tareas por delante.`,

        pt: `Sentar para ouvir o colapso emocional de uma estranha.\n\nVocê olha para ela. Sente alguma simpatia pela situação dela, mas o impulso de "deixa eu estar aqui por você" está completamente ausente. Apoio emocional individual — ouvir, acolher, estar presente — essas ações não têm imagem na sua mente.\n\nVocê se vira. A sala de espera ainda tem mais tarefas pela frente.`,

        it: `Sederti ad ascoltare il crollo emotivo di una sconosciuta.\n\nLa guardi. Provi una certa simpatia per la sua situazione, ma l'impulso "lascia che sia qui per te" è del tutto assente. Supporto emotivo uno a uno — ascoltare, accogliere, essere presente — queste azioni non hanno immagine nella tua mente.\n\nTi giri. La sala d'attesa ha ancora altri compiti davanti.`,

        ru: `Сесть и слушать эмоциональный срыв незнакомки.\n\nВы смотрите на неё. Чувствуете некоторое сочувствие к её ситуации, но импульс «позвольте мне быть рядом» полностью отсутствует. Индивидуальная эмоциональная поддержка — слушать, принимать, присутствовать — эти действия не имеют образа в вашем сознании.\n\nВы отворачиваетесь. В зале ожидания впереди ещё задания.`,

        ja: `見知らぬ人の感情の崩壊に耳を傾けるために座る。\n\n彼女を見る。状況に多少の同情はあるが、「そばにいてあげよう」という衝動はまったくない。一対一の感情サポート——傾聴、受容、寄り添い——これらの行動は頭の中にイメージとして浮かばない。\n\n目を逸らす。待合室にはまだ課題が残っている。`,

        ko: `낯선 사람의 감정적 붕괴를 들으려고 앉기.\n\n그녀를 본다. 상황에 약간의 동정은 느끼지만, "내가 함께 있어줄게"라는 충동은 전혀 없다. 일대일 감정 지원 — 경청, 공간 제공, 존재하기 — 이런 행동들은 머릿속에 그림이 그려지지 않는다.\n\n돌아선다. 대기실에는 아직 더 많은 과제가 남아 있다.`,
      },
    },
  },

  {
    id: 18,
    riasec: "S",
    miniIpCode: "S2",
    miniIpItem: "Give career guidance to people",
    chapter: "waiting",
    chapterIndex: 4,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `等候室中间，坐着一个年轻人。他看起来不像其他人那样焦虑——他只是迷茫。

Leila 和他聊了几句，回来说：「他说他不知道自己应该做什么。不是这个游戏里——是在外面。他不知道自己的方向。」

他说的不是今天的通关策略。他说的是：他不知道自己适合什么工作，不知道优势在哪里，不知道该往哪个方向走。

他需要的不是安慰，也不是鸡汤——他需要有人真的坐下来，听他说自己的情况，然后给出认真的、有针对性的职业建议。帮他看清他自己没看到的东西，帮他理清乱成一团的想法。

Adrian 看了他一眼：「这不是我的领域。」
Leila 说：「我不确定我的建议够不够专业。」`,

      en: `In the middle of the waiting room sits a young man. He doesn't look anxious like the others — he just looks lost.\n\nLeila chats with him briefly, then returns: "He says he doesn't know what he should do. Not in this game — out there. He doesn't know his direction."\n\nHe's not talking about strategy for clearing today's level. He's saying: he doesn't know what career suits him, where his strengths lie, which direction to take.\n\nWhat he needs isn't comfort or platitudes — he needs someone to actually sit down, listen to his situation, and give serious, targeted career advice. Help him see what he can't see in himself. Help him untangle the mess of thoughts.\n\nAdrian glances at him: "Not my domain."\nLeila: "I'm not sure my advice would be professional enough."`,

      nl: `In het midden van de wachtkamer zit een jonge man. Hij ziet er niet angstig uit zoals de anderen — hij ziet er alleen verloren uit.\n\nLeila praat kort met hem en komt terug: "Hij zegt dat hij niet weet wat hij moet doen. Niet in dit spel — daarbuiten. Hij kent zijn richting niet."\n\nHij heeft het niet over strategie om het huidige level te halen. Hij zegt: hij weet niet welke carrière bij hem past, waar zijn sterke punten liggen, welke richting hij op moet.\n\nWat hij nodig heeft is geen troost of gemeenplaatsen — hij heeft iemand nodig die echt gaat zitten, naar zijn situatie luistert, en serieus, gericht loopbaanadvies geeft. Hem helpen te zien wat hij zelf niet kan zien. Hem helpen de wirwar van gedachten te ontwarren.\n\nAdrian werpt een blik op hem: "Niet mijn terrein."\nLeila zegt: "Ik weet niet of mijn advies professioneel genoeg zou zijn."`,

      de: `In der Mitte des Warteraums sitzt ein junger Mann. Er sieht nicht ängstlich aus wie die anderen — er sieht einfach verloren aus.\n\nLeila spricht kurz mit ihm und kommt zurück: „Er sagt, er weiß nicht, was er tun soll. Nicht in diesem Spiel — draußen. Er kennt seine Richtung nicht."\n\nEr spricht nicht über Strategien für das heutige Level. Er sagt: Er weiß nicht, welcher Beruf zu ihm passt, wo seine Stärken liegen, welche Richtung er einschlagen soll.\n\nWas er braucht, ist kein Trost und keine Floskeln — er braucht jemanden, der sich wirklich hinsetzt, ihm zuhört und ernsthafte, gezielte Berufsberatung gibt. Ihm helfen zu sehen, was er selbst nicht sehen kann. Ihm helfen, das Durcheinander der Gedanken zu entwirren.\n\nAdrian wirft ihm einen Blick zu: „Nicht mein Gebiet."\nLeila sagt: „Ich bin nicht sicher, ob mein Rat professionell genug wäre."`,

      fr: `Au milieu de la salle d'attente est assis un jeune homme. Il n'a pas l'air anxieux comme les autres — il a simplement l'air perdu.\n\nLeila discute brièvement avec lui, puis revient : « Il dit qu'il ne sait pas ce qu'il devrait faire. Pas dans ce jeu — dehors. Il ne connaît pas sa direction. »\n\nIl ne parle pas de stratégie pour passer le niveau du jour. Il dit : il ne sait pas quelle carrière lui convient, où sont ses forces, quelle direction prendre.\n\nCe dont il a besoin n'est pas du réconfort ou des platitudes — il a besoin que quelqu'un s'assoie vraiment, écoute sa situation, et donne des conseils de carrière sérieux et ciblés. L'aider à voir ce qu'il ne peut pas voir en lui-même. L'aider à démêler le chaos de ses pensées.\n\nAdrian le regarde : « Ce n'est pas mon domaine. »\nLeila dit : « Je ne suis pas sûre que mes conseils seraient assez professionnels. »`,

      es: `En el centro de la sala de espera hay un joven sentado. No parece ansioso como los demás — simplemente parece perdido.\n\nLeila habla brevemente con él y vuelve: "Dice que no sabe qué debería hacer. No en este juego — afuera. No conoce su dirección."\n\nNo está hablando de estrategia para pasar el nivel de hoy. Está diciendo: no sabe qué carrera le conviene, dónde están sus fortalezas, qué dirección tomar.\n\nLo que necesita no es consuelo ni frases vacías — necesita que alguien se siente de verdad, escuche su situación y dé consejos de carrera serios y específicos. Ayudarle a ver lo que no puede ver en sí mismo. Ayudarle a desenredar la maraña de pensamientos.\n\nAdrian lo mira: "No es mi campo."\nLeila dice: "No estoy segura de que mi consejo sea lo suficientemente profesional."`,

      pt: `No meio da sala de espera está sentado um jovem. Ele não parece ansioso como os outros — apenas parece perdido.\n\nLeila conversa brevemente com ele e volta: "Ele diz que não sabe o que deveria fazer. Não neste jogo — lá fora. Ele não sabe sua direção."\n\nEle não está falando sobre estratégia para passar o nível de hoje. Ele está dizendo: não sabe qual carreira combina com ele, onde estão seus pontos fortes, qual direção seguir.\n\nO que ele precisa não é conforto ou lugares-comuns — ele precisa que alguém realmente se sente, ouça sua situação e dê conselhos de carreira sérios e direcionados. Ajudá-lo a ver o que não consegue ver em si mesmo. Ajudá-lo a desemaranhar a confusão de pensamentos.\n\nAdrian olha para ele: "Não é minha área."\nLeila diz: "Não tenho certeza se meu conselho seria profissional o suficiente."`,

      it: `Al centro della sala d'attesa siede un giovane. Non sembra ansioso come gli altri — sembra semplicemente smarrito.\n\nLeila scambia qualche parola con lui, poi torna: "Dice che non sa cosa dovrebbe fare. Non in questo gioco — là fuori. Non conosce la sua direzione."\n\nNon sta parlando di strategia per superare il livello di oggi. Sta dicendo: non sa quale carriera gli si addice, dove sono i suoi punti di forza, quale direzione prendere.\n\nCiò di cui ha bisogno non è conforto o frasi fatte — ha bisogno che qualcuno si sieda davvero, ascolti la sua situazione e dia consigli di carriera seri e mirati. Aiutarlo a vedere ciò che non riesce a vedere in sé stesso. Aiutarlo a districare il groviglio di pensieri.\n\nAdrian lo guarda: "Non è il mio campo."\nLeila dice: "Non sono sicura che i miei consigli sarebbero abbastanza professionali."`,

      ru: `В центре зала ожидания сидит молодой человек. Он не выглядит тревожным, как остальные — он просто выглядит потерянным.\n\nЛейла недолго говорит с ним и возвращается: «Он говорит, что не знает, что ему делать. Не в этой игре — вообще. Он не знает своего направления.»\n\nОн говорит не о стратегии прохождения сегодняшнего уровня. Он говорит: он не знает, какая карьера ему подходит, в чём его сильные стороны, куда двигаться.\n\nЕму нужен не комфорт и не банальности — ему нужен кто-то, кто действительно сядет, выслушает его ситуацию и даст серьёзный, целенаправленный карьерный совет. Помочь ему увидеть то, что он сам не видит. Помочь распутать клубок мыслей.\n\nАдриан бросает на него взгляд: «Не моя сфера.»\nЛейла говорит: «Я не уверена, что мой совет будет достаточно профессиональным.»`,

      ja: `待合室の真ん中に若い男性が座っている。他の人たちのように不安そうではない——ただ迷っているように見える。\n\nレイラが彼と少し話し、戻ってきた：「自分が何をすべきかわからないと言っています。このゲームの中ではなく——外の世界で。自分の方向がわからないと。」\n\n彼は今日のレベルを攻略する戦略の話をしているのではない。彼が言っているのは：どんな職業が自分に合うのか、自分の強みはどこにあるのか、どの方向に進めばいいのかわからないということだ。\n\n彼が必要としているのは慰めや決まり文句ではない——実際に座って、彼の状況を聞き、真剣で的確なキャリアアドバイスをくれる人だ。自分では見えないものを見る手助け。絡まった思考を解きほぐす手助け。\n\nエイドリアンが彼をちらりと見る：「僕の領域じゃない。」\nレイラは言う：「私のアドバイスが十分に専門的かどうか…」`,

      ko: `대기실 한가운데에 젊은 남자가 앉아 있다. 다른 사람들처럼 불안해 보이지 않는다 — 그저 길을 잃은 것 같다.\n\n레일라가 그와 잠시 이야기하고 돌아왔다: "자신이 무엇을 해야 할지 모르겠다고 해요. 이 게임 안에서가 아니라 — 바깥에서요. 자기 방향을 모른다고요."\n\n그는 오늘의 레벨을 클리어하는 전략을 말하는 게 아니다. 그가 말하는 것은: 어떤 직업이 자신에게 맞는지, 강점이 어디에 있는지, 어느 방향으로 가야 할지 모르겠다는 것이다.\n\n그가 필요한 것은 위로나 빈말이 아니다 — 정말로 앉아서, 그의 상황을 듣고, 진지하고 구체적인 진로 조언을 해줄 사람이다. 자기 자신에게서 보지 못하는 것을 보도록 도와주는 것. 엉킨 생각들을 풀어주는 것.\n\n에이드리안이 그를 흘끗 본다: "내 영역이 아닌데."\n레일라가 말한다: "내 조언이 충분히 전문적일지 모르겠어."`,
    },
    taskDescription: {
      zh: "坐下来为这个迷茫的年轻人提供职业指导——了解他的情况、分析他的优势和兴趣、帮他理清方向和下一步行动。这项任务需要一个主要负责人。",

      en: `Sit down and provide career guidance to this lost young man — understand his situation, analyze his strengths and interests, help him clarify direction and next steps. This task needs one primary person.`,

      nl: `Ga zitten en geef loopbaanbegeleiding aan deze verdwaalde jongeman — begrijp zijn situatie, analyseer zijn sterke punten en interesses, help hem richting en volgende stappen te verduidelijken. Deze taak heeft één hoofdpersoon nodig.`,

      de: `Setz dich hin und biete diesem verlorenen jungen Mann Berufsberatung — verstehe seine Situation, analysiere seine Stärken und Interessen, hilf ihm, Richtung und nächste Schritte zu klären. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Asseyez-vous et offrez des conseils de carrière à ce jeune homme perdu — comprenez sa situation, analysez ses forces et intérêts, aidez-le à clarifier sa direction et ses prochaines étapes. Cette tâche nécessite une personne principale.`,

      es: `Siéntate y ofrece orientación profesional a este joven perdido — comprende su situación, analiza sus fortalezas e intereses, ayúdalo a aclarar dirección y próximos pasos. Esta tarea necesita una persona principal.`,

      pt: `Sente-se e ofereça orientação de carreira a este jovem perdido — entenda sua situação, analise seus pontos fortes e interesses, ajude-o a esclarecer direção e próximos passos. Esta tarefa precisa de uma pessoa principal.`,

      it: `Siediti e offri orientamento professionale a questo giovane smarrito — comprendi la sua situazione, analizza i suoi punti di forza e interessi, aiutalo a chiarire direzione e prossimi passi. Questo compito richiede una persona principale.`,

      ru: `Сядьте и проведите карьерную консультацию для этого растерянного молодого человека — разберитесь в его ситуации, проанализируйте его сильные стороны и интересы, помогите ему определить направление и следующие шаги. Для этой задачи нужен один ответственный.`,

      ja: `座って、この迷っている青年にキャリアガイダンスを提供してください——彼の状況を理解し、強みと興味を分析し、方向性と次のステップを明確にする手助けをしましょう。この作業には主担当者が一人必要です。`,

      ko: `앉아서 이 길을 잃은 청년에게 진로 상담을 해주세요 — 그의 상황을 이해하고, 강점과 관심사를 분석하고, 방향과 다음 단계를 명확히 하도록 도와주세요. 이 작업에는 주 담당자가 한 명 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走过去，坐在他对面。

不是因为你是职业顾问——也许你是，也许不是。是因为你听到「他不知道自己的方向」这句话的时候，你身体里有一种很强烈的反应：我想帮他看清楚。

你开始问他问题。不是那种面试式的问题——是真正的、试图理解他的问题：你喜欢做什么的时候会忘记时间？你小时候想过当什么？你最害怕的职业是什么？

他开始说了。你在听。不只是听字面的意思，是在听他语气里的犹豫、他话题转换的方式、他说到哪里的时候眼睛会亮一下。

你在帮他拼一幅他自己看不见的画。`,

        en: `You walk over and sit across from him.\n\nNot because you're a career counselor — maybe you are, maybe not. Because when you heard "he doesn't know his direction," something strong stirred inside: I want to help him see clearly.\n\nYou start asking questions. Not interview-style questions — real ones, trying to understand: What are you doing when you lose track of time? What did you dream of being as a kid? What career scares you the most?\n\nHe starts talking. You listen. Not just to the words — to the hesitation in his tone, the way he shifts topics, where his eyes light up for a moment.\n\nYou're assembling a picture he can't see himself.`,

        nl: `Je loopt naar hem toe en gaat tegenover hem zitten.\n\nNiet omdat je loopbaanadviseur bent — misschien wel, misschien niet. Omdat toen je hoorde "hij kent zijn richting niet," er iets sterks bewoog vanbinnen: ik wil hem helpen helder te zien.\n\nJe begint vragen te stellen. Geen sollicitatievragen — echte vragen, die proberen te begrijpen: Wat doe je als je de tijd vergeet? Wat droomde je ervan te worden als kind? Welke carrière maakt je het bangst?\n\nHij begint te praten. Je luistert. Niet alleen naar de woorden — naar de aarzeling in zijn toon, de manier waarop hij van onderwerp wisselt, waar zijn ogen even oplichten.\n\nJe bent een beeld aan het samenstellen dat hij zelf niet kan zien.`,

        de: `Du gehst hinüber und setzt dich ihm gegenüber.\n\nNicht weil du Berufsberater bist — vielleicht bist du einer, vielleicht nicht. Weil als du hörtest „er kennt seine Richtung nicht", sich etwas Starkes in dir regte: Ich will ihm helfen, klar zu sehen.\n\nDu fängst an, Fragen zu stellen. Keine Bewerbungsgespräch-Fragen — echte Fragen, die versuchen zu verstehen: Was tust du, wenn du die Zeit vergisst? Was wolltest du als Kind werden? Welcher Beruf macht dir am meisten Angst?\n\nEr fängt an zu reden. Du hörst zu. Nicht nur den Worten — dem Zögern in seinem Ton, der Art wie er Themen wechselt, wo seine Augen für einen Moment aufleuchten.\n\nDu setzt ein Bild zusammen, das er selbst nicht sehen kann.`,

        fr: `Vous vous approchez et vous asseyez en face de lui.\n\nPas parce que vous êtes conseiller en carrière — peut-être l'êtes-vous, peut-être pas. Parce que quand vous avez entendu « il ne connaît pas sa direction », quelque chose de fort s'est agité en vous : je veux l'aider à y voir clair.\n\nVous commencez à poser des questions. Pas des questions d'entretien — de vraies questions, pour comprendre : Que fais-tu quand tu perds la notion du temps ? De quoi rêvais-tu enfant ? Quelle carrière te fait le plus peur ?\n\nIl commence à parler. Vous écoutez. Pas seulement les mots — l'hésitation dans son ton, la façon dont il change de sujet, où ses yeux s'illuminent un instant.\n\nVous assemblez un portrait qu'il ne peut pas voir lui-même.`,

        es: `Te acercas y te sientas frente a él.\n\nNo porque seas consejero de carrera — quizás lo eres, quizás no. Porque cuando escuchaste "no conoce su dirección", algo fuerte se agitó dentro: quiero ayudarle a ver con claridad.\n\nEmpiezas a hacer preguntas. No preguntas tipo entrevista — preguntas reales, intentando entender: ¿Qué haces cuando pierdes la noción del tiempo? ¿Qué soñabas ser de niño? ¿Qué carrera te da más miedo?\n\nEmpieza a hablar. Escuchas. No solo las palabras — la vacilación en su tono, cómo cambia de tema, dónde sus ojos se iluminan por un momento.\n\nEstás armando un retrato que él no puede ver por sí mismo.`,

        pt: `Você se aproxima e se senta diante dele.\n\nNão porque seja orientador de carreira — talvez seja, talvez não. Porque quando ouviu "ele não sabe sua direção", algo forte se agitou dentro de você: quero ajudá-lo a enxergar com clareza.\n\nVocê começa a fazer perguntas. Não perguntas de entrevista — perguntas reais, tentando entender: O que você faz quando perde a noção do tempo? O que sonhava ser quando criança? Qual carreira mais te assusta?\n\nEle começa a falar. Você escuta. Não apenas as palavras — a hesitação no tom, a forma como muda de assunto, onde os olhos se iluminam por um instante.\n\nVocê está montando um retrato que ele mesmo não consegue ver.`,

        it: `Ti avvicini e ti siedi di fronte a lui.\n\nNon perché sei un consulente di carriera — forse lo sei, forse no. Perché quando hai sentito "non conosce la sua direzione", qualcosa di forte si è mosso dentro: voglio aiutarlo a vedere chiaro.\n\nCominci a fare domande. Non domande da colloquio — domande vere, cercando di capire: Cosa fai quando perdi la cognizione del tempo? Cosa sognavi di diventare da bambino? Quale carriera ti spaventa di più?\n\nComincia a parlare. Ascolti. Non solo le parole — l'esitazione nel tono, il modo in cui cambia argomento, dove i suoi occhi si illuminano per un istante.\n\nStai assemblando un ritratto che lui stesso non riesce a vedere.`,

        ru: `Вы подходите и садитесь напротив него.\n\nНе потому что вы карьерный консультант — может быть, может нет. Потому что когда вы услышали «он не знает своего направления», внутри шевельнулось что-то сильное: я хочу помочь ему увидеть ясно.\n\nВы начинаете задавать вопросы. Не вопросы в стиле собеседования — настоящие, пытающиеся понять: Чем ты занимаешься, когда теряешь счёт времени? Кем мечтал быть в детстве? Какая карьера пугает тебя больше всего?\n\nОн начинает говорить. Вы слушаете. Не только слова — колебания в тоне, то, как он меняет тему, где его глаза на мгновение загораются.\n\nВы собираете картину, которую он сам не может увидеть.`,

        ja: `歩み寄り、彼の向かいに座る。\n\nキャリアカウンセラーだからではない——そうかもしれないし、そうでないかもしれない。「自分の方向がわからない」と聞いた時、内側で何か強いものが動いたからだ：彼がはっきり見えるように助けたい。\n\n質問を始める。面接のような質問ではない——本当の質問、理解しようとする質問：時間を忘れるほど夢中になるのは何をしている時？子供の頃何になりたかった？一番怖い職業は？\n\n彼が話し始める。聴く。言葉だけではなく——声のトーンにある躊躇い、話題の変え方、一瞬目が輝くところ。\n\n彼自身には見えない絵を組み立てている。`,

        ko: `다가가 그의 맞은편에 앉는다.\n\n진로 상담사이기 때문이 아니다 — 그럴 수도 있고 아닐 수도 있다. "그는 자기 방향을 모른다"는 말을 들었을 때, 내면에서 강하게 무언가가 움직였기 때문이다: 그가 명확하게 볼 수 있도록 돕고 싶다.\n\n질문을 시작한다. 면접 같은 질문이 아닌 — 진짜 질문, 이해하려는 질문: 시간 가는 줄 모를 때 뭘 하고 있어요? 어릴 때 뭐가 되고 싶었어요? 가장 무서운 직업은 뭐예요?\n\n그가 말하기 시작한다. 듣는다. 말뿐만 아니라 — 목소리의 머뭇거림, 화제를 바꾸는 방식, 잠깐 눈이 빛나는 순간.\n\n그 자신은 볼 수 없는 그림을 맞추고 있다.`,
      },
      score4: {
        zh: `你走过去，坐下来。

他的情况你大致了解了——迷茫、不知道方向、有些能力但不知道怎么用。这种状态你见过，也许你自己也经历过。

你开始和他聊。不是给建议——先是听。听他说了十分钟之后，你心里开始有了一些想法：他其实已经有方向了，只是没人帮他确认过。

你把你的观察告诉了他。他愣了一下，然后慢慢点了点头。

也许你的建议不是最专业的，但你是认真的。`,

        en: `You walk over and sit down.\n\nYou have a rough sense of his situation — lost, directionless, with some abilities but unsure how to use them. A state you've seen before. Maybe experienced yourself.\n\nYou start talking. Not advising — listening first. After ten minutes, ideas form: he actually has a direction. He just needs someone to validate it.\n\nYou share your observations. He pauses, then slowly nods.\n\nMaybe your advice isn't the most professional, but it's sincere.`,

        nl: `Je loopt naar hem toe en gaat zitten.\n\nJe hebt een vaag beeld van zijn situatie — verloren, richtingloos, met enige capaciteiten maar onzeker hoe ze te gebruiken. Een toestand die je eerder hebt gezien. Misschien zelf ervaren.\n\nJe begint te praten. Niet advies geven — eerst luisteren. Na tien minuten vormen zich ideeën: hij heeft eigenlijk al een richting. Hij heeft gewoon iemand nodig die het bevestigt.\n\nJe deelt je observaties. Hij pauzeert, knikt dan langzaam.\n\nMisschien is je advies niet het meest professionele, maar het is oprecht.`,

        de: `Du gehst hinüber und setzt dich.\n\nDu hast eine ungefähre Vorstellung von seiner Situation — verloren, richtungslos, mit einigen Fähigkeiten, aber unsicher, wie er sie einsetzen soll. Ein Zustand, den du schon gesehen hast. Vielleicht selbst erlebt.\n\nDu fängst an zu reden. Nicht beraten — zuerst zuhören. Nach zehn Minuten bilden sich Ideen: er hat eigentlich eine Richtung. Er braucht nur jemanden, der sie bestätigt.\n\nDu teilst deine Beobachtungen mit. Er pausiert, nickt dann langsam.\n\nVielleicht ist dein Rat nicht der professionellste, aber er ist aufrichtig.`,

        fr: `Vous vous approchez et vous asseyez.\n\nVous avez une vague idée de sa situation — perdu, sans direction, avec certaines capacités mais sans savoir comment les utiliser. Un état que vous avez déjà vu. Peut-être vécu vous-même.\n\nVous commencez à parler. Pas conseiller — écouter d'abord. Après dix minutes, des idées se forment : il a en fait une direction. Il a juste besoin que quelqu'un la valide.\n\nVous partagez vos observations. Il fait une pause, puis hoche lentement la tête.\n\nPeut-être que votre conseil n'est pas le plus professionnel, mais il est sincère.`,

        es: `Te acercas y te sientas.\n\nTienes una idea aproximada de su situación — perdido, sin dirección, con algunas capacidades pero sin saber cómo usarlas. Un estado que has visto antes. Quizás experimentado tú mismo.\n\nEmpiezas a hablar. No aconsejando — primero escuchando. Después de diez minutos, se forman ideas: en realidad ya tiene una dirección. Solo necesita que alguien la valide.\n\nCompartes tus observaciones. Hace una pausa, luego asiente lentamente.\n\nQuizás tu consejo no es el más profesional, pero es sincero.`,

        pt: `Você se aproxima e se senta.\n\nTem uma noção geral da situação dele — perdido, sem direção, com algumas habilidades mas sem saber como usá-las. Um estado que já viu antes. Talvez vivenciado pessoalmente.\n\nVocê começa a conversar. Não aconselhar — primeiro ouvir. Depois de dez minutos, ideias se formam: ele na verdade já tem uma direção. Só precisa de alguém que a valide.\n\nVocê compartilha suas observações. Ele faz uma pausa, depois acena lentamente.\n\nTalvez seu conselho não seja o mais profissional, mas é sincero.`,

        it: `Ti avvicini e ti siedi.\n\nHai un'idea approssimativa della sua situazione — perso, senza direzione, con alcune capacità ma senza sapere come usarle. Uno stato che hai già visto. Forse vissuto in prima persona.\n\nCominci a parlare. Non consigliare — prima ascoltare. Dopo dieci minuti, si formano delle idee: in realtà ha già una direzione. Ha solo bisogno che qualcuno la confermi.\n\nCondividi le tue osservazioni. Fa una pausa, poi annuisce lentamente.\n\nForse il tuo consiglio non è il più professionale, ma è sincero.`,

        ru: `Вы подходите и садитесь.\n\nУ вас есть приблизительное представление о его ситуации — потерян, без направления, с некоторыми способностями, но не знает, как их применить. Состояние, которое вы видели раньше. Может, переживали сами.\n\nВы начинаете разговор. Не советовать — сначала слушать. Через десять минут формируются мысли: у него на самом деле есть направление. Ему просто нужен кто-то, кто это подтвердит.\n\nВы делитесь наблюдениями. Он замолкает, затем медленно кивает.\n\nМожет, ваш совет не самый профессиональный, но он искренний.`,

        ja: `歩み寄って座る。\n\n彼の状況はおおよそわかる——迷い、方向性がなく、能力はあるが使い方がわからない。以前見たことのある状態。もしかしたら自分も経験したかもしれない。\n\n話し始める。アドバイスではなく——まず聴く。10分後、考えが形になる：彼には実は方向性がある。ただ誰かにそれを認めてもらう必要があるだけだ。\n\n観察したことを伝える。彼は一瞬止まり、それからゆっくりうなずく。\n\nアドバイスは最も専門的ではないかもしれない。でも、誠実だ。`,

        ko: `다가가 앉는다.\n\n그의 상황을 대략 파악했다 — 길을 잃고, 방향이 없고, 능력은 있지만 어떻게 활용해야 할지 모르는 상태. 전에 본 적 있는 상태다. 어쩌면 직접 겪어본 적도 있을 것이다.\n\n말을 시작한다. 조언이 아닌 — 먼저 듣기. 10분 후, 생각이 형성된다: 그는 사실 방향이 있다. 다만 누군가가 그것을 확인해줄 필요가 있을 뿐이다.\n\n관찰한 바를 나눈다. 그가 잠시 멈추더니, 천천히 고개를 끄덕인다.\n\n조언이 가장 전문적이지는 않을 수 있다. 하지만 진심이다.`,
      },
      score3: {
        zh: `职业指导。

你看着那个年轻人，理解他的迷茫——也许你自己也有过类似的时刻。但坐下来给别人提供职业建议……你不确定自己有这个资格。

你走过去，站在旁边，听了一会儿。他说的一些东西你有共鸣，但要你给出具体的方向建议——你犹豫了。

也许你可以聊聊天，但正式的职业指导不是你现在能做的事。`,

        en: `Career guidance.\n\nYou look at the young man, understanding his confusion — maybe you've felt something similar. But sitting down and giving someone career advice... you're not sure you're qualified.\n\nYou walk over, stand nearby, listen for a while. Some of what he says resonates, but giving specific directional advice — you hesitate.\n\nMaybe you can chat, but formal career guidance isn't something you can offer right now.`,

        nl: `Loopbaanbegeleiding.\n\nJe kijkt naar de jongeman en begrijpt zijn verwarring — misschien heb je zelf iets soortgelijks gevoeld. Maar gaan zitten en iemand loopbaanadvies geven... je weet niet zeker of je daarvoor gekwalificeerd bent.\n\nJe loopt erheen, staat in de buurt, luistert een tijdje. Sommige dingen die hij zegt resoneren, maar specifiek richtingsadvies geven — je aarzelt.\n\nMisschien kun je een praatje maken, maar formele loopbaanbegeleiding kun je nu niet bieden.`,

        de: `Berufsberatung.\n\nDu siehst den jungen Mann an und verstehst seine Verwirrung — vielleicht hast du selbst etwas Ähnliches gefühlt. Aber dich hinsetzen und jemandem Berufsberatung geben... du bist nicht sicher, ob du dafür qualifiziert bist.\n\nDu gehst hin, stehst in der Nähe, hörst eine Weile zu. Einiges von dem, was er sagt, klingt vertraut, aber konkrete Richtungsratschläge geben — du zögerst.\n\nVielleicht kannst du plaudern, aber formelle Berufsberatung ist nichts, was du gerade anbieten kannst.`,

        fr: `Conseils de carrière.\n\nVous regardez le jeune homme, comprenant sa confusion — peut-être avez-vous ressenti quelque chose de similaire. Mais vous asseoir et donner des conseils de carrière... vous n'êtes pas sûr d'être qualifié.\n\nVous vous approchez, restez à proximité, écoutez un moment. Certaines choses qu'il dit trouvent écho, mais donner des conseils directionnels précis — vous hésitez.\n\nPeut-être pouvez-vous discuter, mais un accompagnement formel n'est pas quelque chose que vous pouvez offrir maintenant.`,

        es: `Orientación profesional.\n\nMiras al joven, entendiendo su confusión — quizás tú has sentido algo similar. Pero sentarte y dar consejos de carrera... no estás seguro de estar cualificado.\n\nTe acercas, te quedas cerca, escuchas un rato. Algo de lo que dice resuena, pero dar consejos direccionales específicos — dudas.\n\nQuizás puedas charlar, pero orientación formal no es algo que puedas ofrecer ahora mismo.`,

        pt: `Orientação de carreira.\n\nVocê olha para o jovem, entendendo sua confusão — talvez tenha sentido algo parecido. Mas sentar e dar conselhos de carreira a alguém... não tem certeza se está qualificado.\n\nVocê se aproxima, fica por perto, escuta por um tempo. Algo do que ele diz ressoa, mas dar conselhos direcionais específicos — você hesita.\n\nTalvez possa conversar, mas orientação formal de carreira não é algo que possa oferecer agora.`,

        it: `Orientamento professionale.\n\nGuardi il giovane, comprendi la sua confusione — forse hai provato qualcosa di simile. Ma sederti e dare consigli di carriera a qualcuno... non sei sicuro di essere qualificato.\n\nTi avvicini, resti lì vicino, ascolti per un po'. Alcune cose che dice risuonano, ma dare consigli direzionali specifici — esiti.\n\nForse puoi chiacchierare, ma un orientamento formale non è qualcosa che puoi offrire ora.`,

        ru: `Карьерное консультирование.\n\nВы смотрите на молодого человека, понимая его растерянность — может, вы и сами чувствовали нечто подобное. Но сесть и давать кому-то карьерные советы... вы не уверены в своей квалификации.\n\nВы подходите, стоите рядом, слушаете какое-то время. Кое-что из его слов отзывается, но давать конкретные рекомендации по направлению — вы колеблетесь.\n\nМожет, вы можете поговорить, но формальное карьерное консультирование — не то, что вы можете предложить сейчас.`,

        ja: `キャリアガイダンス。\n\n若い男性を見て、彼の困惑を理解する——自分も似たようなことを感じたことがあるかもしれない。でも座って誰かにキャリアアドバイスをする...自分にその資格があるか確信が持てない。\n\n近づいて、そばに立ち、しばらく聞く。彼が言うことのいくつかは共感できるが、具体的な方向のアドバイスをするのは——躊躇する。\n\n雑談くらいならできるかもしれないが、正式なキャリアガイダンスは今の自分には提供できない。`,

        ko: `진로 상담.\n\n청년을 보며 그의 혼란을 이해한다 — 자신도 비슷한 것을 느껴본 적이 있을지도 모른다. 하지만 앉아서 누군가에게 진로 조언을 하기... 자격이 있는지 확신이 없다.\n\n다가가서 근처에 서서 한동안 듣는다. 그가 하는 말 중 일부는 공감이 가지만, 구체적인 방향 조언을 하기에는 — 망설여진다.\n\n대화 정도는 할 수 있겠지만, 정식 진로 상담은 지금 제공할 수 있는 것이 아니다.`,
      },
      score2: {
        zh: `他不知道自己的方向。

你理解这种感觉。但坐下来，一对一地为别人分析职业方向——这不是你会主动去做的事。

不是因为你不关心——是因为这种深度的个人辅导需要一种你现在没有的能量。倾听、分析、给建议、承担被依赖的感觉——这些加在一起太重了。

你退开了。`,

        en: `He doesn't know his direction.\n\nYou understand the feeling. But sitting down and one-on-one analyzing career direction for someone else — that's not something you'd initiate.\n\nNot because you don't care — because this depth of personal coaching requires an energy you don't have right now. Listening, analyzing, advising, bearing the weight of being depended on — all of it together is too much.\n\nYou step away.`,

        nl: `Hij kent zijn richting niet.\n\nJe begrijpt dat gevoel. Maar gaan zitten en een-op-een de carrièrerichting van iemand anders analyseren — dat is niet iets dat je zou initiëren.\n\nNiet omdat het je niet kan schelen — omdat deze diepte van persoonlijke coaching een energie vereist die je nu niet hebt. Luisteren, analyseren, adviseren, het gewicht dragen van iemands afhankelijkheid — alles samen is te veel.\n\nJe loopt weg.`,

        de: `Er kennt seine Richtung nicht.\n\nDu verstehst das Gefühl. Aber dich hinsetzen und eins zu eins die Berufsrichtung eines anderen analysieren — das würdest du nicht von dir aus tun.\n\nNicht weil es dir egal ist — weil diese Tiefe der persönlichen Beratung eine Energie erfordert, die du gerade nicht hast. Zuhören, analysieren, beraten, das Gewicht tragen, von jemandem gebraucht zu werden — alles zusammen ist zu viel.\n\nDu gehst weg.`,

        fr: `Il ne connaît pas sa direction.\n\nVous comprenez le sentiment. Mais vous asseoir et analyser en tête-à-tête la direction de carrière de quelqu'un d'autre — ce n'est pas quelque chose que vous initieriez.\n\nPas parce que vous ne vous souciez pas — parce que cette profondeur d'accompagnement personnel exige une énergie que vous n'avez pas en ce moment. Écouter, analyser, conseiller, porter le poids d'être celui sur qui on compte — tout cela ensemble est trop.\n\nVous vous éloignez.`,

        es: `No conoce su dirección.\n\nEntiendes el sentimiento. Pero sentarte y analizar uno a uno la dirección profesional de otra persona — no es algo que iniciarías.\n\nNo porque no te importe — porque esta profundidad de coaching personal requiere una energía que no tienes ahora. Escuchar, analizar, aconsejar, cargar con el peso de que alguien dependa de ti — todo junto es demasiado.\n\nTe alejas.`,

        pt: `Ele não sabe sua direção.\n\nVocê entende o sentimento. Mas sentar e analisar individualmente a direção de carreira de outra pessoa — não é algo que iniciaria.\n\nNão porque não se importa — porque essa profundidade de coaching pessoal requer uma energia que você não tem agora. Ouvir, analisar, aconselhar, carregar o peso de ser a pessoa de quem dependem — tudo junto é demais.\n\nVocê se afasta.`,

        it: `Non conosce la sua direzione.\n\nCapisci la sensazione. Ma sederti e analizzare uno a uno la direzione di carriera di qualcun altro — non è qualcosa che inizieresti.\n\nNon perché non ti importi — perché questa profondità di coaching personale richiede un'energia che non hai in questo momento. Ascoltare, analizzare, consigliare, sopportare il peso dell'essere la persona su cui contano — tutto insieme è troppo.\n\nTi allontani.`,

        ru: `Он не знает своего направления.\n\nВы понимаете это чувство. Но сесть и один на один анализировать карьерное направление для другого — не то, что вы стали бы инициировать.\n\nНе потому что вам всё равно — потому что такая глубина личного коучинга требует энергии, которой у вас сейчас нет. Слушать, анализировать, советовать, нести тяжесть того, что на тебя рассчитывают — всё вместе слишком много.\n\nВы отходите.`,

        ja: `彼は自分の方向がわからない。\n\nその感覚は理解できる。しかし座って一対一で他人のキャリアの方向を分析する——自分から始めることではない。\n\n気にしていないからではない——この深さの個人コーチングには、今の自分にないエネルギーが必要だからだ。聴く、分析する、助言する、頼られる重さを引き受ける——全部合わせると重すぎる。\n\n離れる。`,

        ko: `그는 자기 방향을 모른다.\n\n그 감정을 이해한다. 하지만 앉아서 일대일로 다른 사람의 진로 방향을 분석하기 — 자발적으로 시작할 일은 아니다.\n\n신경 쓰지 않아서가 아니다 — 이 깊이의 개인 코칭은 지금 가지고 있지 않은 에너지를 요구하기 때문이다. 듣기, 분석하기, 조언하기, 의지당하는 무게를 감당하기 — 모두 합치면 너무 무겁다.\n\n물러선다.`,
      },
      score1: {
        zh: `给别人做职业指导。

你看了那个年轻人一眼。他的迷茫是真实的，但你和这件事之间没有连接。

不是冷漠——是这种「坐下来帮别人理清人生方向」的活动，完全不在你的本能反应里。你不会因为有人迷茫就想去当他的指南针。

你转身了。等候室里还有别的任务。`,

        en: `Giving someone career guidance.\n\nYou glance at the young man. His confusion is real, but there's no connection between you and this task.\n\nIt's not coldness — it's that "sitting down to help someone figure out their life direction" is simply not in your instinctive repertoire. You won't feel compelled to be someone's compass just because they're lost.\n\nYou turn away. Other tasks remain in the waiting room.`,

        nl: `Iemand loopbaanbegeleiding geven.\n\nJe werpt een blik op de jongeman. Zijn verwarring is echt, maar er is geen verbinding tussen jou en deze taak.\n\nHet is geen kilheid — het is dat "gaan zitten om iemand te helpen zijn levensrichting te bepalen" simpelweg niet in je instinctieve repertoire zit. Je voelt je niet gedwongen iemands kompas te zijn alleen omdat hij verdwaald is.\n\nJe draait je om. Er zijn nog andere taken in de wachtkamer.`,

        de: `Jemandem Berufsberatung geben.\n\nDu wirfst einen Blick auf den jungen Mann. Seine Verwirrung ist echt, aber es gibt keine Verbindung zwischen dir und dieser Aufgabe.\n\nEs ist keine Kälte — es ist, dass „sich hinsetzen und jemandem helfen, seine Lebensrichtung zu finden" einfach nicht in deinem instinktiven Repertoire ist. Du fühlst dich nicht verpflichtet, jemandes Kompass zu sein, nur weil er verloren ist.\n\nDu wendest dich ab. Andere Aufgaben warten im Warteraum.`,

        fr: `Donner des conseils de carrière à quelqu'un.\n\nVous jetez un regard au jeune homme. Sa confusion est réelle, mais il n'y a pas de connexion entre vous et cette tâche.\n\nCe n'est pas de la froideur — c'est que « s'asseoir pour aider quelqu'un à trouver sa direction de vie » n'est tout simplement pas dans votre répertoire instinctif. Vous ne vous sentirez pas obligé d'être la boussole de quelqu'un simplement parce qu'il est perdu.\n\nVous vous détournez. D'autres tâches attendent dans la salle d'attente.`,

        es: `Dar orientación profesional a alguien.\n\nEchas un vistazo al joven. Su confusión es real, pero no hay conexión entre tú y esta tarea.\n\nNo es frialdad — es que "sentarte a ayudar a alguien a descubrir la dirección de su vida" simplemente no está en tu repertorio instintivo. No te sentirás obligado a ser la brújula de alguien solo porque está perdido.\n\nTe das la vuelta. Quedan otras tareas en la sala de espera.`,

        pt: `Dar orientação de carreira a alguém.\n\nVocê olha para o jovem. Sua confusão é real, mas não há conexão entre você e esta tarefa.\n\nNão é frieza — é que "sentar para ajudar alguém a descobrir a direção de sua vida" simplesmente não está no seu repertório instintivo. Você não vai se sentir compelido a ser a bússola de alguém só porque está perdido.\n\nVocê se vira. Outras tarefas permanecem na sala de espera.`,

        it: `Dare orientamento professionale a qualcuno.\n\nDai un'occhiata al giovane. La sua confusione è reale, ma non c'è connessione tra te e questo compito.\n\nNon è freddezza — è che "sedersi ad aiutare qualcuno a capire la direzione della sua vita" semplicemente non è nel tuo repertorio istintivo. Non ti sentirai in dovere di fare da bussola a qualcuno solo perché è perso.\n\nTi volti. Altri compiti restano nella sala d'attesa.`,

        ru: `Давать кому-то карьерные советы.\n\nВы бросаете взгляд на молодого человека. Его растерянность реальна, но связи между вами и этой задачей нет.\n\nЭто не холодность — просто «сесть и помочь кому-то разобраться в направлении жизни» не входит в ваш инстинктивный репертуар. Вы не почувствуете необходимость быть чьим-то компасом только потому, что человек заблудился.\n\nВы отворачиваетесь. В зале ожидания остаются другие задания.`,

        ja: `誰かにキャリアガイダンスをすること。\n\n若い男性をちらりと見る。彼の困惑は本物だが、自分とこの課題との間に繋がりがない。\n\n冷たさではない——「座って誰かの人生の方向を見つける手助けをする」ことが、本能的なレパートリーに入っていないだけだ。誰かが迷っているからといって、その人の羅針盤になろうとは思わない。\n\n目を逸らす。待合室には他の課題が残っている。`,

        ko: `누군가에게 진로 상담을 하기.\n\n청년을 흘끗 본다. 그의 혼란은 진짜지만, 자신과 이 과제 사이에 연결고리가 없다.\n\n냉정함이 아니다 — "앉아서 누군가의 인생 방향을 찾도록 돕기"가 본능적 레퍼토리에 없을 뿐이다. 누군가가 길을 잃었다는 이유만으로 그 사람의 나침반이 되어야 한다는 충동을 느끼지 않는다.\n\n돌아선다. 대기실에는 다른 과제가 남아 있다.`,
      },
    },
  },

  {
    id: 19,
    riasec: "S",
    miniIpCode: "S3",
    miniIpItem: "Perform rehabilitation therapy",
    chapter: "waiting",
    chapterIndex: 4,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `等候室的角落传来一阵低沉的呻吟。几个人围在那里，不知道该怎么办。

你走过去，看见一个中年男人坐在地上，左腿僵直地伸着，旁边放着一根拐杖。他的表情痛苦而沮丧——不是刚受伤的疼痛，而是已经持续了很久的、康复过程中的痛苦。

Leila 蹲下来和他说了几句，然后回来说：「他的腿做过手术，正在康复期。但他说他好几天没做康复训练了——这里没有人帮他，他自己又不敢做，怕动作做错了会更糟。」

他需要有人一对一帮他做康复训练——引导关节活动，支撑他完成那些一个人做不了的动作，在他因为疼痛想放弃的时候鼓励他继续。

这不是简单的任务。它要求你走进别人身体的脆弱里，用你的手和耐心帮他一步步重建对自己身体的信心。`,

      en: `A low groan comes from the corner of the waiting room. Several people are gathered, unsure what to do.\n\nYou walk over and see a middle-aged man sitting on the floor, left leg extended stiffly, a crutch beside him. His expression is pained and frustrated — not the sharp pain of a fresh injury, but the drawn-out suffering of an ongoing recovery.\n\nLeila crouches and speaks with him, then returns: "His leg had surgery. He's in recovery. But he says he hasn't done his rehabilitation exercises in days — no one here to help, and he's afraid to do them alone, worried he'll make it worse."\n\nHe needs someone to guide him through rehabilitation one-on-one — leading joint movements, supporting him through motions he can't do alone, encouraging him to keep going when pain makes him want to quit.\n\nThis isn't simple. It requires you to step into someone else's physical vulnerability, using your hands and patience to help him rebuild confidence in his own body, one step at a time.`,

      nl: `Een laag gekreun vanuit de hoek van de wachtkamer. Enkele mensen staan erbij, niet wetend wat te doen.\n\nJe loopt erheen en ziet een man van middelbare leeftijd op de grond zitten, linkerbeen stijf uitgestrekt, een kruk naast hem. Zijn uitdrukking is pijnlijk en gefrustreerd — niet de scherpe pijn van een verse blessure, maar het langgerekte lijden van een lopend herstel.\n\nLeila hurkt en praat met hem, komt dan terug: "Zijn been is geopereerd. Hij is aan het herstellen. Maar hij zegt dat hij al dagen geen revalidatieoefeningen heeft gedaan — niemand hier om hem te helpen, en hij is bang om ze alleen te doen, bang dat hij het erger maakt."\n\nHij heeft iemand nodig die hem een-op-een door revalidatie begeleidt — gewrichtsbewegingen leiden, hem ondersteunen bij bewegingen die hij niet alleen kan, hem aanmoedigen door te gaan als de pijn hem wil doen stoppen.\n\nDit is geen eenvoudige taak. Het vereist dat je in iemands fysieke kwetsbaarheid stapt, met je handen en je geduld hem helpt het vertrouwen in zijn eigen lichaam stap voor stap te herstellen.`,

      de: `Ein leises Stöhnen aus der Ecke des Warteraums. Mehrere Menschen stehen herum, unsicher, was zu tun ist.\n\nDu gehst hin und siehst einen Mann mittleren Alters auf dem Boden sitzen, linkes Bein steif ausgestreckt, eine Krücke neben ihm. Sein Gesichtsausdruck ist schmerzverzerrt und frustriert — nicht der scharfe Schmerz einer frischen Verletzung, sondern das langwierige Leiden einer laufenden Genesung.\n\nLeila geht in die Hocke und spricht mit ihm, kommt dann zurück: „Sein Bein wurde operiert. Er ist in der Reha. Aber er sagt, er hat seit Tagen keine Rehabilitationsübungen gemacht — hier ist niemand, der ihm hilft, und er traut sich nicht, sie allein zu machen, aus Angst, es schlimmer zu machen."\n\nEr braucht jemanden, der ihn eins zu eins durch die Rehabilitation führt — Gelenkbewegungen anleiten, ihn bei Bewegungen unterstützen, die er allein nicht schafft, ihn ermutigen weiterzumachen, wenn der Schmerz ihn aufgeben lassen will.\n\nDas ist keine einfache Aufgabe. Sie erfordert, in die körperliche Verletzlichkeit eines anderen einzutreten und mit deinen Händen und deiner Geduld ihm zu helfen, Schritt für Schritt das Vertrauen in seinen eigenen Körper wiederzugewinnen.`,

      fr: `Un gémissement sourd vient du coin de la salle d'attente. Plusieurs personnes sont rassemblées, ne sachant que faire.\n\nVous vous approchez et voyez un homme d'âge moyen assis par terre, jambe gauche tendue raidement, une béquille à côté de lui. Son expression est douloureuse et frustrée — pas la douleur vive d'une blessure fraîche, mais la souffrance prolongée d'une convalescence en cours.\n\nLeila s'accroupit et lui parle, puis revient : « Sa jambe a été opérée. Il est en convalescence. Mais il dit qu'il n'a pas fait ses exercices de rééducation depuis des jours — personne ici pour l'aider, et il a peur de les faire seul, craignant d'aggraver les choses. »\n\nIl a besoin que quelqu'un le guide à travers la rééducation en tête-à-tête — diriger les mouvements articulaires, le soutenir dans les mouvements qu'il ne peut pas faire seul, l'encourager à continuer quand la douleur lui donne envie d'abandonner.\n\nCe n'est pas une tâche simple. Elle exige d'entrer dans la vulnérabilité physique de quelqu'un d'autre, utilisant vos mains et votre patience pour l'aider à reconstruire la confiance en son propre corps, pas à pas.`,

      es: `Un quejido bajo llega desde la esquina de la sala de espera. Varias personas están reunidas, sin saber qué hacer.\n\nTe acercas y ves a un hombre de mediana edad sentado en el suelo, pierna izquierda extendida rígidamente, una muleta a su lado. Su expresión es de dolor y frustración — no el dolor agudo de una lesión reciente, sino el sufrimiento prolongado de una recuperación en curso.\n\nLeila se agacha y habla con él, luego vuelve: "Su pierna fue operada. Está en recuperación. Pero dice que lleva días sin hacer sus ejercicios de rehabilitación — aquí no hay nadie que lo ayude, y tiene miedo de hacerlos solo, preocupado de empeorarlo."\n\nNecesita a alguien que lo guíe en la rehabilitación uno a uno — dirigir movimientos articulares, apoyarlo en movimientos que no puede hacer solo, animarlo a seguir cuando el dolor le hace querer rendirse.\n\nNo es una tarea sencilla. Requiere entrar en la vulnerabilidad física de otra persona, usando tus manos y tu paciencia para ayudarle a reconstruir la confianza en su propio cuerpo, paso a paso.`,

      pt: `Um gemido baixo vem do canto da sala de espera. Várias pessoas estão reunidas, sem saber o que fazer.\n\nVocê se aproxima e vê um homem de meia-idade sentado no chão, perna esquerda estendida rigidamente, uma muleta ao lado. Sua expressão é de dor e frustração — não a dor aguda de uma lesão recente, mas o sofrimento prolongado de uma recuperação em andamento.\n\nLeila se abaixa e fala com ele, depois volta: "A perna dele foi operada. Está em recuperação. Mas diz que faz dias que não faz os exercícios de reabilitação — ninguém aqui para ajudar, e tem medo de fazer sozinho, com medo de piorar."\n\nEle precisa de alguém para guiá-lo na reabilitação individualmente — conduzir movimentos articulares, apoiá-lo em movimentos que não consegue fazer sozinho, encorajá-lo a continuar quando a dor faz querer desistir.\n\nNão é uma tarefa simples. Requer entrar na vulnerabilidade física de outra pessoa, usando suas mãos e sua paciência para ajudá-lo a reconstruir a confiança em seu próprio corpo, passo a passo.`,

      it: `Un gemito basso arriva dall'angolo della sala d'attesa. Diverse persone sono radunate, incerte su cosa fare.\n\nTi avvicini e vedi un uomo di mezza età seduto per terra, gamba sinistra tesa rigidamente, una stampella accanto. La sua espressione è di dolore e frustrazione — non il dolore acuto di una ferita fresca, ma la sofferenza prolungata di una riabilitazione in corso.\n\nLeila si accovaccia e parla con lui, poi torna: "La sua gamba è stata operata. È in fase di recupero. Ma dice che sono giorni che non fa gli esercizi di riabilitazione — qui non c'è nessuno che lo aiuti, e ha paura di farli da solo, temendo di peggiorare."\n\nHa bisogno che qualcuno lo guidi nella riabilitazione uno a uno — dirigere i movimenti articolari, sostenerlo nei movimenti che non può fare da solo, incoraggiarlo a continuare quando il dolore lo fa voler rinunciare.\n\nNon è un compito semplice. Richiede di entrare nella vulnerabilità fisica di qualcun altro, usando le tue mani e la tua pazienza per aiutarlo a ricostruire la fiducia nel proprio corpo, un passo alla volta.`,

      ru: `Из угла зала ожидания доносится тихий стон. Несколько человек собрались, не зная, что делать.\n\nВы подходите и видите мужчину средних лет, сидящего на полу — левая нога вытянута негнущейся, рядом костыль. Выражение лица — боль и разочарование. Не острая боль свежей травмы, а затяжное страдание текущего восстановления.\n\nЛейла присаживается и говорит с ним, затем возвращается: «Ему делали операцию на ноге. Он восстанавливается. Но говорит, что уже несколько дней не делал реабилитационных упражнений — здесь некому помочь, а сам боится, что сделает хуже.»\n\nЕму нужен кто-то, кто проведёт с ним реабилитацию один на один — направляя движения суставов, поддерживая в движениях, которые он не может сделать сам, подбадривая, когда боль заставляет сдаться.\n\nЭто непростая задача. Она требует войти в чужую физическую уязвимость, своими руками и терпением помогая ему шаг за шагом восстановить доверие к собственному телу.`,

      ja: `待合室の隅から低い呻き声が聞こえる。数人が集まっているが、どうすればいいかわからない様子だ。\n\n近づくと、中年の男性が床に座っているのが見える。左脚を硬直させて伸ばし、そばに松葉杖が置かれている。表情は苦痛と苛立ち——新しい怪我の鋭い痛みではなく、長く続くリハビリの苦しみだ。\n\nレイラがしゃがんで話しかけ、戻ってきた：「脚の手術をしたそうです。回復中なんですが、もう何日もリハビリの運動をしていないと。ここには手伝ってくれる人がいないし、一人でやるのは怖い——やり方を間違えて悪化させるかもしれないから。」\n\n彼には一対一でリハビリを導いてくれる人が必要だ——関節の動きを誘導し、一人ではできない動作を支え、痛みで諦めたくなった時に励ます人。\n\nこれは簡単な作業ではない。他人の身体的な脆さの中に踏み込み、あなたの手と忍耐で、一歩ずつ自分の体への信頼を取り戻す手助けをすることが求められる。`,

      ko: `대기실 구석에서 낮은 신음소리가 들려온다. 몇 명이 모여 있지만 어찌할 바를 모르고 있다.\n\n다가가 보면 중년 남성이 바닥에 앉아 있다. 왼쪽 다리를 뻣뻣하게 뻗고, 옆에 목발이 놓여 있다. 표정은 고통스럽고 좌절감에 차 있다 — 새 부상의 날카로운 통증이 아니라, 진행 중인 회복 과정의 길고 지루한 고통이다.\n\n레일라가 쪼그려 앉아 그와 이야기하고 돌아왔다: "다리 수술을 했대요. 회복 중인데, 며칠째 재활 운동을 못 하고 있다고 해요 — 여기서 도와줄 사람이 없고, 혼자 하자니 잘못해서 악화될까 봐 무섭다고요."\n\n그에게는 일대일로 재활을 안내해줄 사람이 필요하다 — 관절 움직임을 이끌고, 혼자서는 할 수 없는 동작을 지탱해주고, 통증 때문에 포기하고 싶을 때 격려해주는 사람.\n\n이것은 단순한 과제가 아니다. 다른 사람의 신체적 취약함 속으로 들어가, 당신의 손과 인내로 한 걸음씩 자신의 몸에 대한 신뢰를 다시 세우도록 돕는 것이다.`,
    },
    taskDescription: {
      zh: "一对一地引导这个人完成康复训练——支撑他的关节运动，帮他完成独自做不了的动作，在疼痛中鼓励他坚持。这项任务需要一个主要负责人。",

      en: `Guide this person through rehabilitation exercises one-on-one — support his joint movements, help him through motions he can't do alone, encourage him to persevere through the pain. This task needs one primary person.`,

      nl: `Begeleid deze persoon een-op-een door revalidatieoefeningen — ondersteun zijn gewrichtsbewegingen, help hem door bewegingen die hij niet alleen kan, moedig hem aan vol te houden ondanks de pijn. Deze taak heeft één hoofdpersoon nodig.`,

      de: `Führe diese Person eins zu eins durch Rehabilitationsübungen — unterstütze seine Gelenkbewegungen, hilf ihm bei Bewegungen, die er allein nicht schafft, ermutige ihn, trotz der Schmerzen weiterzumachen. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Guidez cette personne à travers des exercices de rééducation en tête-à-tête — soutenez ses mouvements articulaires, aidez-le dans les mouvements qu'il ne peut pas faire seul, encouragez-le à persévérer malgré la douleur. Cette tâche nécessite une personne principale.`,

      es: `Guía a esta persona en ejercicios de rehabilitación uno a uno — apoya sus movimientos articulares, ayúdalo con movimientos que no puede hacer solo, anímalo a perseverar a pesar del dolor. Esta tarea necesita una persona principal.`,

      pt: `Guie esta pessoa nos exercícios de reabilitação individualmente — apoie seus movimentos articulares, ajude-o com movimentos que não consegue fazer sozinho, encoraje-o a perseverar apesar da dor. Esta tarefa precisa de uma pessoa principal.`,

      it: `Guida questa persona negli esercizi di riabilitazione uno a uno — sostieni i suoi movimenti articolari, aiutalo nei movimenti che non può fare da solo, incoraggialo a perseverare nonostante il dolore. Questo compito richiede una persona principale.`,

      ru: `Проведите этого человека через реабилитационные упражнения один на один — поддерживайте движения суставов, помогайте с движениями, которые он не может сделать сам, подбадривайте, когда боль заставляет сдаться. Для этой задачи нужен один ответственный.`,

      ja: `この人のリハビリテーションをマンツーマンで導いてください——関節の動きを支え、一人ではできない動作を手助けし、痛みの中でも続ける励ましを。この作業には主担当者が一人必要です。`,

      ko: `이 사람의 재활 운동을 일대일로 안내해주세요 — 관절 운동을 지탱하고, 혼자서는 할 수 없는 동작을 도와주고, 통증 속에서도 견디도록 격려해주세요. 이 작업에는 주 담당자가 한 명 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走过去了。

人群让开了一点。你蹲到他面前，看着他的腿。

他的眼睛里有一种你立刻就读懂了的东西——不是恐惧，是无助。一个人的身体不再听从自己的指令时，那种深深的无助。

你把手放在他的膝盖旁边，轻声说：「我来帮你。跟着我的节奏，慢慢来。」

你开始引导他的第一个动作——一个简单的屈伸。你的手托着他的小腿，感受到他肌肉的紧张。他咬着牙，但没有停下来。

第一组做完之后，他长长地呼了一口气。你没有放手，说：「再来一组。这次试试自己控制力量。」

他试了。虽然颤抖，但他的腿动了。他看了你一眼，眼睛里的无助少了一点——取而代之的是一丝微弱的希望。

Leila 在旁边看着你们，她的眼睛湿了。`,

        en: `You walk over.\n\nThe crowd parts slightly. You crouch in front of him, looking at his leg.\n\nIn his eyes you read something instantly — not fear, but helplessness. The deep helplessness of a body that no longer obeys its own commands.\n\nYou place your hand beside his knee, saying softly: "Let me help you. Follow my pace, take it slow."\n\nYou begin guiding the first movement — a simple bend and extend. Your hand supports his calf, feeling the tension in his muscles. He grits his teeth but doesn't stop.\n\nAfter the first set, he lets out a long breath. You don't let go: "One more set. This time, try controlling the force yourself."\n\nHe tries. Trembling, but his leg moves. He glances at you, the helplessness in his eyes fading slightly — replaced by a faint glimmer of hope.\n\nLeila watches from nearby. Her eyes are wet.`,

        nl: `Je loopt erheen.\n\nDe menigte wijkt iets. Je hurkt voor hem neer en kijkt naar zijn been.\n\nIn zijn ogen lees je onmiddellijk iets — geen angst, maar hulpeloosheid. De diepe hulpeloosheid van een lichaam dat niet langer zijn eigen bevelen gehoorzaamt.\n\nJe legt je hand naast zijn knie en zegt zacht: "Ik help je. Volg mijn tempo, rustig aan."\n\nJe begint de eerste beweging te begeleiden — een eenvoudige buig-en-strek. Je hand ondersteunt zijn kuit, voelt de spanning in zijn spieren. Hij klemt zijn kaken op elkaar maar stopt niet.\n\nNa de eerste set blaast hij lang uit. Je laat niet los: "Nog één set. Probeer dit keer zelf de kracht te beheersen."\n\nHij probeert het. Trillend, maar zijn been beweegt. Hij kijkt je even aan, de hulpeloosheid in zijn ogen iets minder — vervangen door een zwak sprankje hoop.\n\nLeila kijkt toe van dichtbij. Haar ogen zijn vochtig.`,

        de: `Du gehst hinüber.\n\nDie Menge weicht etwas zurück. Du gehst vor ihm in die Hocke und betrachtest sein Bein.\n\nIn seinen Augen liest du sofort etwas — keine Angst, sondern Hilflosigkeit. Die tiefe Hilflosigkeit eines Körpers, der seinen eigenen Befehlen nicht mehr gehorcht.\n\nDu legst deine Hand neben sein Knie und sagst leise: „Ich helfe dir. Folge meinem Tempo, langsam."\n\nDu beginnst die erste Bewegung anzuleiten — ein einfaches Beugen und Strecken. Deine Hand stützt seine Wade, du spürst die Spannung in seinen Muskeln. Er beißt die Zähne zusammen, hört aber nicht auf.\n\nNach dem ersten Satz atmet er lang aus. Du lässt nicht los: „Noch einen Satz. Diesmal versuch, die Kraft selbst zu kontrollieren."\n\nEr versucht es. Zitternd, aber sein Bein bewegt sich. Er blickt dich an, die Hilflosigkeit in seinen Augen etwas schwächer — ersetzt durch einen schwachen Hoffnungsschimmer.\n\nLeila schaut von nahem zu. Ihre Augen sind feucht.`,

        fr: `Vous vous approchez.\n\nLa foule s'écarte légèrement. Vous vous accroupissez devant lui, regardant sa jambe.\n\nDans ses yeux, vous lisez instantanément quelque chose — pas de la peur, mais de l'impuissance. L'impuissance profonde d'un corps qui n'obéit plus à ses propres ordres.\n\nVous posez votre main à côté de son genou, disant doucement : « Je vais vous aider. Suivez mon rythme, doucement. »\n\nVous commencez à guider le premier mouvement — une simple flexion-extension. Votre main soutient son mollet, sentant la tension dans ses muscles. Il serre les dents mais ne s'arrête pas.\n\nAprès la première série, il expire longuement. Vous ne lâchez pas : « Encore une série. Cette fois, essayez de contrôler la force vous-même. »\n\nIl essaie. Tremblant, mais sa jambe bouge. Il vous lance un regard, l'impuissance dans ses yeux s'atténuant — remplacée par une faible lueur d'espoir.\n\nLeila observe de près. Ses yeux sont humides.`,

        es: `Te acercas.\n\nLa multitud se abre un poco. Te pones en cuclillas frente a él, mirando su pierna.\n\nEn sus ojos lees algo al instante — no miedo, sino impotencia. La impotencia profunda de un cuerpo que ya no obedece sus propias órdenes.\n\nColocas tu mano junto a su rodilla, diciendo suavemente: "Déjame ayudarte. Sigue mi ritmo, despacio."\n\nComienzas a guiar el primer movimiento — una simple flexión y extensión. Tu mano sostiene su pantorrilla, sintiendo la tensión en sus músculos. Aprieta los dientes pero no se detiene.\n\nDespués de la primera serie, suelta un largo suspiro. No lo sueltas: "Una serie más. Esta vez, intenta controlar la fuerza tú mismo."\n\nLo intenta. Temblando, pero su pierna se mueve. Te mira un instante, la impotencia en sus ojos se atenúa — reemplazada por un tenue destello de esperanza.\n\nLeila observa desde cerca. Sus ojos están húmedos.`,

        pt: `Você se aproxima.\n\nA multidão se abre um pouco. Você se agacha na frente dele, olhando para sua perna.\n\nNos olhos dele você lê algo instantaneamente — não medo, mas impotência. A impotência profunda de um corpo que não obedece mais seus próprios comandos.\n\nVocê coloca a mão ao lado do joelho dele, dizendo suavemente: "Vou te ajudar. Siga meu ritmo, devagar."\n\nVocê começa a guiar o primeiro movimento — uma simples flexão e extensão. Sua mão apoia a panturrilha dele, sentindo a tensão nos músculos. Ele cerra os dentes mas não para.\n\nDepois da primeira série, solta um longo suspiro. Você não solta: "Mais uma série. Dessa vez, tente controlar a força sozinho."\n\nEle tenta. Tremendo, mas a perna se move. Ele olha para você, a impotência nos olhos diminuindo — substituída por um tênue lampejo de esperança.\n\nLeila observa de perto. Seus olhos estão úmidos.`,

        it: `Ti avvicini.\n\nLa folla si apre leggermente. Ti accovacci davanti a lui, guardando la sua gamba.\n\nNei suoi occhi leggi qualcosa all'istante — non paura, ma impotenza. L'impotenza profonda di un corpo che non obbedisce più ai propri comandi.\n\nMetti la mano accanto al suo ginocchio, dicendo piano: "Ti aiuto io. Segui il mio ritmo, con calma."\n\nCominci a guidare il primo movimento — una semplice flessione ed estensione. La tua mano sostiene il suo polpaccio, sentendo la tensione nei muscoli. Stringe i denti ma non si ferma.\n\nDopo la prima serie, espira a lungo. Non lasci la presa: "Un'altra serie. Stavolta, prova a controllare la forza da solo."\n\nCi prova. Tremando, ma la gamba si muove. Ti lancia uno sguardo, l'impotenza nei suoi occhi si attenua — sostituita da un debole barlume di speranza.\n\nLeila osserva da vicino. I suoi occhi sono lucidi.`,

        ru: `Вы подходите.\n\nТолпа слегка расступается. Вы приседаете перед ним, глядя на его ногу.\n\nВ его глазах вы мгновенно читаете кое-что — не страх, а беспомощность. Глубокую беспомощность тела, которое больше не подчиняется собственным командам.\n\nВы кладёте руку рядом с его коленом и тихо говорите: «Я помогу. Следуйте за моим темпом, не торопитесь.»\n\nВы начинаете направлять первое движение — простое сгибание и разгибание. Ваша рука поддерживает его голень, вы чувствуете напряжение в мышцах. Он стискивает зубы, но не останавливается.\n\nПосле первого подхода он делает долгий выдох. Вы не отпускаете: «Ещё один подход. На этот раз попробуйте контролировать силу сами.»\n\nОн пробует. Дрожа, но нога двигается. Он бросает на вас взгляд — беспомощность в глазах чуть отступает, сменяясь слабым проблеском надежды.\n\nЛейла наблюдает рядом. Её глаза влажные.`,

        ja: `歩み寄る。\n\n人垣が少し開く。彼の前にしゃがみ、脚を見る。\n\nその目に瞬時に何かを読み取る——恐怖ではなく、無力感。自分の体が自分の指令に従わなくなった時の、あの深い無力感だ。\n\n膝の横に手を置き、静かに言う：「手伝います。私のペースに合わせて、ゆっくりと。」\n\n最初の動作を導き始める——シンプルな屈伸。手でふくらはぎを支え、筋肉の緊張を感じる。歯を食いしばっているが、止めない。\n\n最初のセットを終えると、長く息を吐いた。手を離さずに言う：「もう一セット。今度は自分で力をコントロールしてみて。」\n\n彼は試みる。震えながらも、脚が動いた。こちらを見る。目の中の無力感が少し薄れ——代わりにかすかな希望の光が宿った。\n\nレイラが近くで見ている。目が潤んでいた。`,

        ko: `다가간다.\n\n사람들이 살짝 비켜선다. 그의 앞에 쪼그려 앉아 다리를 본다.\n\n그의 눈에서 즉시 무언가를 읽는다 — 두려움이 아닌, 무력감. 자신의 몸이 더 이상 자기 명령에 따르지 않을 때의 그 깊은 무력감.\n\n무릎 옆에 손을 놓고 조용히 말한다: "도와드릴게요. 제 속도에 맞춰서, 천천히."\n\n첫 번째 동작을 안내하기 시작한다 — 단순한 굽혔다 펴기. 손으로 종아리를 받쳐주며 근육의 긴장을 느낀다. 이를 악물지만 멈추지 않는다.\n\n첫 세트를 마치고 그는 길게 숨을 내쉰다. 손을 놓지 않고 말한다: "한 세트 더요. 이번에는 스스로 힘을 조절해보세요."\n\n그가 시도한다. 떨리지만, 다리가 움직인다. 당신을 흘끗 본다. 눈 속의 무력감이 조금 옅어지고 — 희미한 희망의 빛이 그 자리를 채운다.\n\n레일라가 가까이서 지켜본다. 그녀의 눈이 촉촉하다.`,
      },
      score4: {
        zh: `你走过去，蹲下来看着他的腿。

你不是专业的康复治疗师——但你大概知道一些基本的。膝盖的屈伸、脚踝的旋转，这些你见过。不一定完全正确，但总比什么都不做好。

你把手放在他的小腿旁边，轻声说：「我不是专业的，但我可以试着帮你做一些简单的动作。你告诉我，哪里疼就停。」

他犹豫了一下，然后点了头。你开始慢慢引导他的第一个动作。他咬着牙，但在跟着你做。

很慢，很小心。不完美的康复训练，但真实的帮助。`,

        en: `You walk over and crouch down, looking at his leg.\n\nYou're not a professional rehabilitation therapist — but you know some basics. Knee bends, ankle rotations, you've seen these before. Maybe not perfectly right, but better than nothing.\n\nYou place your hand beside his calf and say softly: "I'm not a professional, but I can try helping with some simple movements. Tell me if anything hurts and we'll stop."\n\nHe hesitates, then nods. You begin slowly guiding his first movement. He grits his teeth but follows along.\n\nVery slow, very careful. Imperfect rehabilitation, but real help.`,

        nl: `Je loopt erheen en hurkt neer, kijkend naar zijn been.\n\nJe bent geen professionele revalidatietherapeut — maar je kent wat basisprincipes. Kniebuigingen, enkelrotaties, die heb je eerder gezien. Misschien niet helemaal correct, maar beter dan niets.\n\nJe legt je hand naast zijn kuit en zegt zacht: "Ik ben geen professional, maar ik kan proberen te helpen met wat eenvoudige bewegingen. Zeg het als iets pijn doet, dan stoppen we."\n\nHij aarzelt, knikt dan. Je begint langzaam zijn eerste beweging te begeleiden. Hij klemt zijn kaken op elkaar maar doet mee.\n\nHeel langzaam, heel voorzichtig. Onvolmaakte revalidatie, maar echte hulp.`,

        de: `Du gehst hin und gehst in die Hocke, schaust auf sein Bein.\n\nDu bist kein professioneller Rehabilitationstherapeut — aber du kennst einige Grundlagen. Kniebeugen, Knöchelrotationen, die hast du schon gesehen. Vielleicht nicht ganz korrekt, aber besser als nichts.\n\nDu legst deine Hand neben seine Wade und sagst leise: „Ich bin kein Profi, aber ich kann versuchen, bei ein paar einfachen Bewegungen zu helfen. Sag mir, wenn es wehtut, dann hören wir auf."\n\nEr zögert, nickt dann. Du beginnst langsam seine erste Bewegung anzuleiten. Er beißt die Zähne zusammen, macht aber mit.\n\nSehr langsam, sehr vorsichtig. Unvollkommene Rehabilitation, aber echte Hilfe.`,

        fr: `Vous vous approchez et vous accroupissez, regardant sa jambe.\n\nVous n'êtes pas un professionnel de la rééducation — mais vous connaissez quelques bases. Flexions du genou, rotations de cheville, vous avez déjà vu ça. Peut-être pas parfaitement juste, mais mieux que rien.\n\nVous posez votre main à côté de son mollet et dites doucement : « Je ne suis pas professionnel, mais je peux essayer d'aider avec quelques mouvements simples. Dites-moi si ça fait mal et on arrête. »\n\nIl hésite, puis hoche la tête. Vous commencez à guider lentement son premier mouvement. Il serre les dents mais suit.\n\nTrès lent, très prudent. Rééducation imparfaite, mais aide réelle.`,

        es: `Te acercas y te agachas, mirando su pierna.\n\nNo eres un terapeuta de rehabilitación profesional — pero conoces algo de lo básico. Flexiones de rodilla, rotaciones de tobillo, eso lo has visto antes. Quizás no del todo correcto, pero mejor que nada.\n\nColocas tu mano junto a su pantorrilla y dices suavemente: "No soy profesional, pero puedo intentar ayudar con algunos movimientos simples. Dime si algo duele y paramos."\n\nDuda un momento, luego asiente. Empiezas a guiar lentamente su primer movimiento. Aprieta los dientes pero sigue.\n\nMuy lento, muy cuidadoso. Rehabilitación imperfecta, pero ayuda real.`,

        pt: `Você se aproxima e se abaixa, olhando para a perna dele.\n\nVocê não é um profissional de reabilitação — mas conhece o básico. Flexões de joelho, rotações de tornozelo, já viu isso antes. Talvez não perfeitamente correto, mas melhor que nada.\n\nColoca a mão ao lado da panturrilha dele e diz suavemente: "Não sou profissional, mas posso tentar ajudar com alguns movimentos simples. Me diga se doer e paramos."\n\nEle hesita, depois acena. Você começa a guiar lentamente o primeiro movimento. Ele cerra os dentes mas acompanha.\n\nMuito lento, muito cuidadoso. Reabilitação imperfeita, mas ajuda real.`,

        it: `Ti avvicini e ti accovacci, guardando la sua gamba.\n\nNon sei un professionista della riabilitazione — ma conosci qualche base. Flessioni del ginocchio, rotazioni della caviglia, le hai viste prima. Forse non del tutto corretto, ma meglio di niente.\n\nMetti la mano accanto al suo polpaccio e dici piano: "Non sono un professionista, ma posso provare ad aiutare con qualche movimento semplice. Dimmi se fa male e ci fermiamo."\n\nEsita, poi annuisce. Cominci a guidare lentamente il suo primo movimento. Stringe i denti ma segue.\n\nMolto lento, molto attento. Riabilitazione imperfetta, ma aiuto reale.`,

        ru: `Вы подходите и приседаете, глядя на его ногу.\n\nВы не профессиональный реабилитолог — но кое-что базовое знаете. Сгибания колена, вращения голеностопа — такое видели. Может, не совсем правильно, но лучше, чем ничего.\n\nКладёте руку рядом с его голенью и тихо говорите: «Я не профессионал, но могу попробовать помочь с несколькими простыми движениями. Скажите, если будет больно — остановимся.»\n\nОн колеблется, потом кивает. Вы начинаете медленно направлять его первое движение. Он стискивает зубы, но следует за вами.\n\nОчень медленно, очень осторожно. Несовершенная реабилитация, но реальная помощь.`,

        ja: `近づいてしゃがみ、彼の脚を見る。\n\nプロのリハビリ療法士ではない——でも基本的なことはいくつか知っている。膝の屈伸、足首の回転、見たことはある。完全に正しいとは限らないが、何もしないよりましだ。\n\nふくらはぎの横に手を置き、静かに言う：「プロじゃないけど、簡単な動きを手伝ってみます。痛かったら言ってください、止めますから。」\n\n彼は躊躇し、それからうなずいた。最初の動作をゆっくり導き始める。歯を食いしばっているが、ついてきている。\n\nとてもゆっくり、とても慎重に。完璧ではないリハビリ、でも本物の助けだ。`,

        ko: `다가가 쪼그려 앉아 그의 다리를 본다.\n\n전문 재활 치료사는 아니다 — 하지만 기본적인 것은 좀 안다. 무릎 굽힘, 발목 회전, 본 적은 있다. 완벽히 맞지 않을 수 있지만, 아무것도 안 하는 것보단 낫다.\n\n종아리 옆에 손을 놓고 조용히 말한다: "전문가는 아니지만, 간단한 동작 몇 가지를 도와볼 수 있어요. 아프면 말씀하세요, 멈출게요."\n\n그가 잠시 망설이다 고개를 끄덕인다. 첫 번째 동작을 천천히 안내하기 시작한다. 이를 악물지만 따라하고 있다.\n\n아주 느리게, 아주 조심스럽게. 완벽하지 않은 재활이지만, 진짜 도움이다.`,
      },
      score3: {
        zh: `你看着那个人僵硬地坐在地上，腿伸直着。

帮他做康复训练……你心里有一种矛盾：你看得出他需要帮助，但你不确定自己有没有那个能力。万一动作做错了怎么办？万一弄伤他了怎么办？

你站在人群边缘，看着。如果有人先开始了，你可以帮忙扶一下。但主动走过去、承担起引导别人康复的责任——这对你来说太不确定了。

你在观望。`,

        en: `You watch the man sitting stiffly on the floor, leg extended.\n\nHelping him with rehabilitation... a contradictory feeling: you can see he needs help, but you're not sure you have the ability. What if you do the movements wrong? What if you hurt him?\n\nYou stand at the crowd's edge, watching. If someone starts, you can help support. But walking over yourself, taking on the responsibility of guiding someone's physical recovery — that feels too uncertain.\n\nYou're observing.`,

        nl: `Je kijkt naar de man die stijf op de grond zit, been uitgestrekt.\n\nHem helpen met revalidatie... een tegenstrijdig gevoel: je kunt zien dat hij hulp nodig heeft, maar je weet niet zeker of je de capaciteit hebt. Wat als je de bewegingen verkeerd doet? Wat als je hem pijn doet?\n\nJe staat aan de rand van de menigte, kijkend. Als iemand begint, kun je helpen ondersteunen. Maar zelf erheen lopen, de verantwoordelijkheid nemen om iemands fysiek herstel te begeleiden — dat voelt te onzeker.\n\nJe observeert.`,

        de: `Du beobachtest den Mann, der steif auf dem Boden sitzt, Bein ausgestreckt.\n\nIhm bei der Rehabilitation helfen... ein widersprüchliches Gefühl: du siehst, dass er Hilfe braucht, aber du bist nicht sicher, ob du die Fähigkeit hast. Was wenn du die Bewegungen falsch machst? Was wenn du ihn verletzt?\n\nDu stehst am Rand der Menge und schaust zu. Wenn jemand anfängt, kannst du unterstützen. Aber selbst hingehen, die Verantwortung für jemandes körperliche Genesung übernehmen — das fühlt sich zu unsicher an.\n\nDu beobachtest.`,

        fr: `Vous regardez l'homme assis raidement au sol, jambe étendue.\n\nL'aider avec la rééducation... un sentiment contradictoire : vous voyez qu'il a besoin d'aide, mais vous n'êtes pas sûr d'en avoir la capacité. Et si vous faites les mouvements de travers ? Et si vous le blessez ?\n\nVous restez en bordure du groupe, observant. Si quelqu'un commence, vous pouvez aider à soutenir. Mais y aller vous-même, prendre la responsabilité de guider la récupération physique de quelqu'un — cela semble trop incertain.\n\nVous observez.`,

        es: `Observas al hombre sentado rígidamente en el suelo, pierna extendida.\n\nAyudarlo con la rehabilitación... un sentimiento contradictorio: puedes ver que necesita ayuda, pero no estás seguro de tener la capacidad. ¿Y si haces los movimientos mal? ¿Y si lo lastimas?\n\nTe quedas al borde del grupo, mirando. Si alguien empieza, puedes ayudar a sostener. Pero acercarte tú mismo, asumir la responsabilidad de guiar la recuperación física de alguien — eso se siente demasiado incierto.\n\nObservas.`,

        pt: `Você observa o homem sentado rigidamente no chão, perna estendida.\n\nAjudá-lo com a reabilitação... um sentimento contraditório: você vê que ele precisa de ajuda, mas não tem certeza de ter a capacidade. E se fizer os movimentos errados? E se o machucar?\n\nVocê fica na borda do grupo, observando. Se alguém começar, pode ajudar a apoiar. Mas ir até lá sozinho, assumir a responsabilidade de guiar a recuperação física de alguém — isso parece incerto demais.\n\nVocê observa.`,

        it: `Guardi l'uomo seduto rigidamente per terra, gamba distesa.\n\nAiutarlo con la riabilitazione... un sentimento contraddittorio: vedi che ha bisogno di aiuto, ma non sei sicuro di averne la capacità. E se fai i movimenti sbagliati? E se lo ferisci?\n\nResti ai margini del gruppo, osservando. Se qualcuno inizia, puoi dare supporto. Ma andare di persona, assumerti la responsabilità di guidare il recupero fisico di qualcuno — sembra troppo incerto.\n\nOsservi.`,

        ru: `Вы наблюдаете за мужчиной, неподвижно сидящим на полу с вытянутой ногой.\n\nПомочь ему с реабилитацией... противоречивое чувство: видно, что ему нужна помощь, но вы не уверены, что справитесь. А если сделаете движения неправильно? А если навредите?\n\nВы стоите на краю группы, наблюдая. Если кто-то начнёт, можете помочь поддержать. Но подойти самому, взять на себя ответственность за чьё-то физическое восстановление — это кажется слишком неопределённым.\n\nВы наблюдаете.`,

        ja: `床に硬直して座り、脚を伸ばしている男性を見ている。\n\nリハビリを手伝う...矛盾した気持ち：助けが必要だとわかるが、自分にその能力があるか確信がない。動作を間違えたら？彼を傷つけてしまったら？\n\n人垣の端に立って見ている。誰かが始めれば、支えを手伝える。しかし自分から歩み寄り、他人の身体回復を導く責任を引き受ける——それは不確かすぎる。\n\n観察している。`,

        ko: `바닥에 뻣뻣하게 앉아 다리를 뻗고 있는 남자를 지켜본다.\n\n재활을 도와주기... 모순된 감정: 도움이 필요하다는 건 보이지만, 자신에게 그 능력이 있는지 확신이 없다. 동작을 잘못하면? 다치게 하면?\n\n군중 가장자리에 서서 지켜본다. 누군가 시작하면 도울 수 있다. 하지만 직접 다가가 누군가의 신체적 회복을 이끄는 책임을 맡기에는 — 너무 불확실하게 느껴진다.\n\n관찰하고 있다.`,
      },
      score2: {
        zh: `帮一个人做康复训练——扶着他的腿，引导关节运动，一个动作接一个动作。

你看着他坐在地上的样子，理解他的痛苦和无助。但蹲下来、托住他的腿、手把手地引导每一个康复动作——这种身体力行的、需要持续耐心和体力的工作，超出了你此刻的意愿。

你退后了。Leila 和其他人在那里，他们会帮他的。`,

        en: `Helping someone through physical rehabilitation — supporting his leg, guiding joint movements, one motion after another.\n\nYou look at him sitting on the floor, understand his pain and helplessness. But crouching down, holding his leg, guiding each rehabilitation movement hand over hand — this physically demanding work requiring sustained patience and stamina exceeds your current willingness.\n\nYou step back. Leila and the others are there. They'll help him.`,

        nl: `Iemand helpen met fysieke revalidatie — zijn been ondersteunen, gewrichtsbewegingen begeleiden, de ene beweging na de andere.\n\nJe kijkt naar hem op de grond, begrijpt zijn pijn en hulpeloosheid. Maar neerhurken, zijn been vasthouden, elke revalidatiebeweging hand over hand begeleiden — dit fysiek veeleisende werk dat aanhoudend geduld en uithoudingsvermogen vereist, overschrijdt je huidige bereidheid.\n\nJe doet een stap terug. Leila en de anderen zijn er. Zij zullen hem helpen.`,

        de: `Jemandem bei der physischen Rehabilitation helfen — sein Bein stützen, Gelenkbewegungen anleiten, eine Bewegung nach der anderen.\n\nDu siehst ihn auf dem Boden sitzen, verstehst seinen Schmerz und seine Hilflosigkeit. Aber in die Hocke gehen, sein Bein halten, jede Rehabilitationsbewegung Schritt für Schritt anleiten — diese körperlich fordernde Arbeit, die anhaltende Geduld und Ausdauer erfordert, übersteigt deine momentane Bereitschaft.\n\nDu trittst zurück. Leila und die anderen sind da. Sie werden ihm helfen.`,

        fr: `Aider quelqu'un dans sa rééducation physique — soutenir sa jambe, guider les mouvements articulaires, un geste après l'autre.\n\nVous le regardez assis par terre, comprenez sa douleur et son impuissance. Mais s'accroupir, tenir sa jambe, guider chaque mouvement de rééducation pas à pas — ce travail physiquement exigeant nécessitant patience et endurance dépasse votre volonté actuelle.\n\nVous reculez. Leila et les autres sont là. Ils l'aideront.`,

        es: `Ayudar a alguien con rehabilitación física — sostener su pierna, guiar movimientos articulares, un movimiento tras otro.\n\nLo miras sentado en el suelo, entiendes su dolor e impotencia. Pero agacharte, sostener su pierna, guiar cada movimiento de rehabilitación paso a paso — este trabajo físicamente exigente que requiere paciencia y resistencia sostenida excede tu disposición actual.\n\nDas un paso atrás. Leila y los demás están ahí. Ellos lo ayudarán.`,

        pt: `Ajudar alguém com reabilitação física — apoiar sua perna, guiar movimentos articulares, um movimento após o outro.\n\nVocê olha para ele sentado no chão, entende sua dor e impotência. Mas se abaixar, segurar sua perna, guiar cada movimento de reabilitação passo a passo — esse trabalho fisicamente exigente que requer paciência e resistência contínua excede sua disposição atual.\n\nVocê recua. Leila e os outros estão lá. Eles vão ajudá-lo.`,

        it: `Aiutare qualcuno nella riabilitazione fisica — sostenere la sua gamba, guidare i movimenti articolari, un movimento dopo l'altro.\n\nLo guardi seduto per terra, capisci il suo dolore e la sua impotenza. Ma accovacciarsi, tenere la sua gamba, guidare ogni movimento riabilitativo passo dopo passo — questo lavoro fisicamente impegnativo che richiede pazienza e resistenza costante supera la tua disponibilità attuale.\n\nFai un passo indietro. Leila e gli altri sono lì. Lo aiuteranno loro.`,

        ru: `Помочь кому-то с физической реабилитацией — поддерживать ногу, направлять движения суставов, одно движение за другим.\n\nВы смотрите на него, сидящего на полу, понимаете его боль и беспомощность. Но присесть, держать его ногу, направлять каждое реабилитационное движение шаг за шагом — эта физически тяжёлая работа, требующая постоянного терпения и выносливости, превышает вашу нынешнюю готовность.\n\nВы отступаете. Лейла и остальные здесь. Они ему помогут.`,

        ja: `身体的なリハビリを手伝う——脚を支え、関節の動きを導き、一つの動作をまた一つ。\n\n床に座る彼を見て、痛みと無力感を理解する。しかししゃがみ込み、脚を支え、一つ一つのリハビリ動作を手取り足取り導く——この体力と持続的な忍耐を要する仕事は、今の自分の意志を超えている。\n\n一歩引く。レイラと他の人たちがいる。彼らが助けてくれる。`,

        ko: `누군가의 신체 재활을 돕기 — 다리를 받쳐주고, 관절 움직임을 안내하고, 동작 하나하나를.\n\n바닥에 앉아 있는 그를 보고, 고통과 무력감을 이해한다. 하지만 쪼그려 앉아 다리를 잡고, 재활 동작 하나하나를 직접 안내하기 — 이 체력과 지속적인 인내를 요구하는 일은 현재의 의지를 초과한다.\n\n한 발 물러선다. 레일라와 다른 사람들이 있다. 그들이 도울 것이다.`,
      },
      score1: {
        zh: `康复训练。身体支撑。一对一引导。

你看了那个人一眼，理解了他的困境。但你身体里没有走过去的冲动。

这不是关于同情心——你有。这是关于你面对这种具体情境时的本能反应：走进别人身体的脆弱里，用你的手去承托、去引导、去鼓励——这个画面在你脑海里没有引起任何行动的欲望。

你留在了原地。`,

        en: `Rehabilitation therapy. Physical support. One-on-one guidance.\n\nYou look at him once, understanding his situation. But nothing in your body moves toward him.\n\nThis isn't about empathy — you have it. It's about your instinctive response to this specific scenario: stepping into someone else's physical vulnerability, using your hands to support, guide, and encourage — the image stirs no desire to act.\n\nYou stay where you are.`,

        nl: `Revalidatietherapie. Fysieke ondersteuning. Een-op-een begeleiding.\n\nJe kijkt hem één keer aan en begrijpt zijn situatie. Maar niets in je lichaam beweegt richting hem.\n\nDit gaat niet over empathie — die heb je. Het gaat over je instinctieve reactie op dit specifieke scenario: iemands fysieke kwetsbaarheid binnenstappen, je handen gebruiken om te steunen, te begeleiden en aan te moedigen — het beeld wekt geen verlangen om te handelen.\n\nJe blijft waar je bent.`,

        de: `Rehabilitationstherapie. Körperliche Unterstützung. Eins-zu-eins-Anleitung.\n\nDu siehst ihn einmal an und verstehst seine Situation. Aber nichts in deinem Körper bewegt sich zu ihm hin.\n\nDas hat nichts mit Empathie zu tun — die hast du. Es geht um deine instinktive Reaktion auf dieses spezifische Szenario: in die körperliche Verletzlichkeit eines anderen einzutreten, deine Hände zum Stützen, Führen und Ermutigen zu nutzen — das Bild weckt keinen Wunsch zu handeln.\n\nDu bleibst, wo du bist.`,

        fr: `Rééducation. Soutien physique. Accompagnement en tête-à-tête.\n\nVous le regardez une fois, comprenant sa situation. Mais rien dans votre corps ne bouge vers lui.\n\nCe n'est pas une question d'empathie — vous en avez. C'est votre réponse instinctive à ce scénario précis : entrer dans la vulnérabilité physique de quelqu'un d'autre, utiliser vos mains pour soutenir, guider et encourager — l'image ne suscite aucun désir d'agir.\n\nVous restez où vous êtes.`,

        es: `Terapia de rehabilitación. Apoyo físico. Guía uno a uno.\n\nLo miras una vez, entendiendo su situación. Pero nada en tu cuerpo se mueve hacia él.\n\nNo se trata de empatía — la tienes. Se trata de tu respuesta instintiva a este escenario específico: entrar en la vulnerabilidad física de otra persona, usar tus manos para apoyar, guiar y animar — la imagen no despierta deseo de actuar.\n\nTe quedas donde estás.`,

        pt: `Terapia de reabilitação. Apoio físico. Orientação individual.\n\nVocê olha para ele uma vez, entendendo sua situação. Mas nada no seu corpo se move em direção a ele.\n\nNão é questão de empatia — você tem. É sua resposta instintiva a esse cenário específico: entrar na vulnerabilidade física de outra pessoa, usar suas mãos para apoiar, guiar e encorajar — a imagem não desperta desejo de agir.\n\nVocê fica onde está.`,

        it: `Riabilitazione. Supporto fisico. Guida uno a uno.\n\nLo guardi una volta, capendo la sua situazione. Ma nulla nel tuo corpo si muove verso di lui.\n\nNon è questione di empatia — ce l'hai. È la tua risposta istintiva a questo scenario specifico: entrare nella vulnerabilità fisica di qualcun altro, usare le tue mani per sostenere, guidare e incoraggiare — l'immagine non suscita alcun desiderio di agire.\n\nResti dove sei.`,

        ru: `Реабилитационная терапия. Физическая поддержка. Индивидуальное руководство.\n\nВы смотрите на него, понимая его ситуацию. Но ничто в вашем теле не движется к нему.\n\nДело не в эмпатии — она у вас есть. Дело в вашей инстинктивной реакции на этот конкретный сценарий: войти в чужую физическую уязвимость, использовать свои руки для поддержки, направления и подбадривания — этот образ не вызывает желания действовать.\n\nВы остаётесь на месте.`,

        ja: `リハビリテーション。身体的サポート。マンツーマン指導。\n\n一度彼を見て、状況を理解する。しかし体の中に彼に向かう動きは生まれない。\n\nこれは共感の問題ではない——共感はある。この特定のシナリオに対する本能的な反応の問題だ：他人の身体的な脆さの中に踏み込み、手で支え、導き、励ます——そのイメージは行動への欲求を喚起しない。\n\nその場に留まる。`,

        ko: `재활 치료. 신체적 지원. 일대일 안내.\n\n그를 한 번 보고 상황을 이해한다. 하지만 몸 안에서 그를 향해 움직이는 것은 없다.\n\n이것은 공감의 문제가 아니다 — 공감은 있다. 이 특정 상황에 대한 본능적 반응의 문제다: 다른 사람의 신체적 취약함 속으로 들어가, 손으로 지탱하고, 이끌고, 격려하는 것 — 그 이미지는 행동하려는 욕구를 불러일으키지 않는다.\n\n그 자리에 머문다.`,
      },
    },
  },

  {
    id: 20,
    riasec: "S",
    miniIpCode: "S5",
    miniIpItem: "Teach a high-school class",
    chapter: "waiting",
    chapterIndex: 4,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `快要结束的时候，等候室后面的一个区域变得嘈杂起来。

你走过去看——十几个青少年坐在那里，大概十五六岁。他们已经在等候室里待了太久，开始躁动不安。有人在玩手机，有人在大声聊天，有几个在互相推搡。整个区域一片混乱。

Leila 皱眉：「他们已经这样半个小时了。没有人管，没有人组织，也没有人给他们任何有意义的事做。」

公告栏上新贴了一张纸条：「需要有人来给这些等待的年轻人上一堂课——任何主题都可以。给他们一些结构，一些方向，让他们的等待变得有意义。」

这不是简单的陪伴——你需要站在一群半大不小的青少年面前，组织他们的注意力，讲授一些他们能听进去的内容，在他们不配合的时候保持冷静和权威。

所有人都可以帮忙。但问题是：站在一群不认识你的年轻人面前当老师——你有多想做这件事？`,

      en: `Near the end, an area at the back of the waiting room grows noisy.\n\nYou walk over — a dozen teenagers sitting there, around fifteen or sixteen. They've been in the waiting room too long, growing restless. Some on phones, some talking loudly, a few shoving each other. The whole area is chaotic.\n\nLeila frowns: "They've been like this for half an hour. No one's managing them, no one's organizing, no one's giving them anything meaningful to do."\n\nA new note has appeared on the bulletin board: "Someone needed to teach a class for these waiting young people — any topic. Give them structure, direction, make their waiting meaningful."\n\nThis isn't simple companionship — you need to stand before a group of restless teenagers, capture their attention, teach something they'll actually listen to, and stay calm and authoritative when they don't cooperate.\n\nEveryone can help. But the question is: standing before a group of strangers as their teacher — how much do you want to do this?`,

      nl: `Tegen het einde wordt een zone achterin de wachtkamer luidruchtig.\n\nJe loopt erheen — een dozijn tieners zitten daar, rond de vijftien, zestien jaar. Ze zijn te lang in de wachtkamer geweest en worden onrustig. Sommigen op hun telefoon, sommigen luid pratend, een paar die elkaar duwen. Het hele gebied is chaotisch.\n\nLeila fronst: "Ze zijn al een half uur zo. Niemand stuurt ze aan, niemand organiseert, niemand geeft ze iets zinvols te doen."\n\nEen nieuw briefje is op het prikbord verschenen: "Iemand nodig om een les te geven aan deze wachtende jongeren — elk onderwerp. Geef ze structuur, richting, maak hun wachten zinvol."\n\nDit is geen eenvoudig gezelschap — je moet voor een groep onrustige tieners staan, hun aandacht vangen, iets onderwijzen waar ze naar luisteren, en kalm en gezaghebbend blijven als ze niet meewerken.\n\nIedereen kan helpen. Maar de vraag is: voor een groep vreemden staan als hun leraar — hoeveel wil je dit doen?`,

      de: `Gegen Ende wird ein Bereich hinten im Warteraum laut.\n\nDu gehst hin — ein Dutzend Jugendliche sitzen dort, etwa fünfzehn, sechzehn Jahre alt. Sie waren zu lange im Warteraum und werden unruhig. Manche am Handy, manche laut redend, einige schubsen sich gegenseitig. Das ganze Areal ist chaotisch.\n\nLeila runzelt die Stirn: „Die sind seit einer halben Stunde so. Niemand kümmert sich, niemand organisiert, niemand gibt ihnen etwas Sinnvolles zu tun."\n\nEin neuer Zettel hängt an der Pinnwand: „Jemand wird gebraucht, um diesen wartenden Jugendlichen eine Unterrichtsstunde zu geben — jedes Thema. Gebt ihnen Struktur, Richtung, macht ihr Warten sinnvoll."\n\nDas ist keine einfache Begleitung — du musst vor einer Gruppe unruhiger Teenager stehen, ihre Aufmerksamkeit gewinnen, etwas Lehrreiches vermitteln und ruhig und bestimmt bleiben, wenn sie nicht mitmachen.\n\nAlle können helfen. Aber die Frage ist: als Lehrer vor einer Gruppe Fremder stehen — wie sehr willst du das?`,

      fr: `Vers la fin, une zone à l'arrière de la salle d'attente devient bruyante.\n\nVous vous approchez — une douzaine d'adolescents sont assis là, environ quinze ou seize ans. Ils sont dans la salle d'attente depuis trop longtemps et deviennent agités. Certains sur leur téléphone, d'autres parlant fort, quelques-uns se bousculant. Toute la zone est chaotique.\n\nLeila fronce les sourcils : « Ça fait une demi-heure qu'ils sont comme ça. Personne ne les encadre, personne n'organise, personne ne leur donne quoi que ce soit de significatif à faire. »\n\nUne nouvelle note est apparue sur le panneau : « Quelqu'un est nécessaire pour donner un cours à ces jeunes en attente — n'importe quel sujet. Leur donner de la structure, une direction, rendre leur attente significative. »\n\nCe n'est pas un simple accompagnement — vous devez vous tenir devant un groupe d'adolescents agités, capter leur attention, enseigner quelque chose qu'ils écouteront vraiment, et rester calme et assuré quand ils ne coopèrent pas.\n\nTout le monde peut aider. Mais la question est : se tenir devant un groupe d'inconnus comme leur professeur — à quel point voulez-vous le faire ?`,

      es: `Cerca del final, una zona al fondo de la sala de espera se vuelve ruidosa.\n\nTe acercas — una docena de adolescentes están sentados ahí, de unos quince o dieciséis años. Llevan demasiado tiempo en la sala de espera y se están inquietando. Algunos con el teléfono, algunos hablando fuerte, algunos empujándose. Todo el área es caótico.\n\nLeila frunce el ceño: "Llevan así media hora. Nadie los gestiona, nadie organiza, nadie les da nada significativo que hacer."\n\nUna nota nueva ha aparecido en el tablón: "Se necesita alguien para dar una clase a estos jóvenes en espera — cualquier tema. Darles estructura, dirección, hacer su espera significativa."\n\nEsto no es simple compañía — necesitas pararte frente a un grupo de adolescentes inquietos, captar su atención, enseñar algo que realmente escuchen, y mantenerte tranquilo y con autoridad cuando no cooperen.\n\nTodos pueden ayudar. Pero la pregunta es: pararte frente a un grupo de desconocidos como su profesor — ¿cuánto quieres hacer esto?`,

      pt: `Perto do fim, uma área nos fundos da sala de espera fica barulhenta.\n\nVocê se aproxima — uma dúzia de adolescentes estão sentados ali, com cerca de quinze ou dezesseis anos. Estão na sala de espera há tempo demais e ficando inquietos. Alguns no celular, alguns falando alto, alguns se empurrando. Toda a área está caótica.\n\nLeila franze a testa: "Estão assim há meia hora. Ninguém gerencia, ninguém organiza, ninguém dá nada significativo para fazerem."\n\nUma nota nova apareceu no quadro de avisos: "Precisa-se de alguém para dar uma aula para estes jovens em espera — qualquer tema. Dar-lhes estrutura, direção, tornar a espera significativa."\n\nNão é simples companhia — você precisa ficar diante de um grupo de adolescentes inquietos, captar a atenção deles, ensinar algo que realmente ouçam, e manter a calma e autoridade quando não cooperarem.\n\nTodos podem ajudar. Mas a pergunta é: ficar diante de um grupo de estranhos como professor — quanto você quer fazer isso?`,

      it: `Verso la fine, un'area sul retro della sala d'attesa diventa rumorosa.\n\nTi avvicini — una dozzina di adolescenti sono seduti lì, circa quindici o sedici anni. Sono nella sala d'attesa da troppo tempo e diventano irrequieti. Alcuni al telefono, alcuni parlando ad alta voce, alcuni che si spingono. L'intera area è caotica.\n\nLeila aggrotta le sopracciglia: "Sono così da mezz'ora. Nessuno li gestisce, nessuno organizza, nessuno dà loro qualcosa di significativo da fare."\n\nUn nuovo biglietto è apparso in bacheca: "Serve qualcuno per tenere una lezione a questi giovani in attesa — qualsiasi argomento. Dare loro struttura, direzione, rendere la loro attesa significativa."\n\nQuesta non è semplice compagnia — devi stare davanti a un gruppo di adolescenti irrequieti, catturare la loro attenzione, insegnare qualcosa che ascolteranno davvero, e restare calmo e autorevole quando non collaborano.\n\nTutti possono aiutare. Ma la domanda è: stare davanti a un gruppo di sconosciuti come loro insegnante — quanto vuoi farlo?`,

      ru: `Ближе к концу в дальней части зала ожидания становится шумно.\n\nВы подходите — десяток подростков сидят там, лет пятнадцати-шестнадцати. Они слишком долго в зале ожидания и становятся беспокойными. Кто-то в телефоне, кто-то громко разговаривает, некоторые толкаются. Вся зона в хаосе.\n\nЛейла хмурится: «Они так уже полчаса. Никто ими не занимается, никто не организует, никто не даёт им ничего осмысленного.»\n\nНа доске объявлений появилась новая записка: «Нужен кто-то, чтобы провести урок для этих ждущих подростков — любая тема. Дайте им структуру, направление, сделайте их ожидание осмысленным.»\n\nЭто не просто компания — нужно встать перед группой беспокойных подростков, завладеть их вниманием, научить чему-то, что они действительно будут слушать, и сохранять спокойствие и авторитет, когда они не сотрудничают.\n\nКаждый может помочь. Но вопрос: встать перед группой незнакомцев в роли учителя — насколько вы этого хотите?`,

      ja: `終わりが近づいた頃、待合室の奥のエリアが騒がしくなってきた。\n\n歩いて行くと——十数人のティーンエイジャーが座っている。15、16歳くらいだ。待合室に長くいすぎて、落ち着きがなくなっている。スマホをいじる者、大声で話す者、押し合いをする者もいる。エリア全体が混沌としている。\n\nレイラが眉をひそめる：「もう30分もあんな状態です。誰も管理せず、誰も組織せず、何も有意義なことをさせていない。」\n\n掲示板に新しいメモが現れた：「この待っている若者たちに授業をしてくれる人が必要——テーマは何でも。構造と方向を与え、待ち時間を意味あるものにしてほしい。」\n\nこれは単なる付き添いではない——落ち着きのないティーンエイジャーの前に立ち、注意を引き、実際に聞いてもらえる内容を教え、協力しない時も冷静で権威を保つ必要がある。\n\n誰でも手伝える。しかし問題は：知らない若者たちの前に教師として立つこと——どれだけそれをしたいと思うか？`,

      ko: `끝무렵, 대기실 뒤쪽 구역이 시끄러워진다.\n\n다가가 보면 — 십여 명의 청소년이 앉아 있다. 열다섯, 열여섯 살쯤 되어 보인다. 대기실에 너무 오래 있어서 안절부절못하고 있다. 휴대폰을 보는 아이, 크게 떠드는 아이, 서로 밀치는 아이들. 구역 전체가 혼란스럽다.\n\n레일라가 미간을 찌푸린다: "30분째 저래요. 아무도 관리하지 않고, 아무도 조직하지 않고, 의미 있는 할 일을 아무도 주지 않아요."\n\n게시판에 새 메모가 나타났다: "이 기다리는 청소년들에게 수업을 해줄 사람이 필요합니다 — 어떤 주제든. 구조와 방향을 주고, 기다림을 의미 있게 만들어주세요."\n\n이것은 단순한 동행이 아니다 — 안절부절못하는 청소년들 앞에 서서 주의를 끌고, 실제로 들을 만한 것을 가르치고, 협조하지 않을 때도 침착하고 권위 있게 유지해야 한다.\n\n누구나 도울 수 있다. 하지만 문제는: 낯선 젊은이들 앞에 선생님으로 서기 — 얼마나 그것을 하고 싶은가?`,
    },
    taskDescription: {
      zh: "站到这群青少年面前，给他们上一堂课——组织他们的注意力，讲一些有意义的内容，让他们的等待变得不再是浪费时间。所有人都可以参与。",

      en: `Stand before this group of teenagers and teach them a class — organize their attention, deliver meaningful content, make their waiting time worthwhile. Everyone can participate.`,

      nl: `Ga voor deze groep tieners staan en geef ze een les — organiseer hun aandacht, breng zinvolle inhoud, maak hun wachttijd de moeite waard. Iedereen kan meedoen.`,

      de: `Stell dich vor diese Gruppe Jugendlicher und halte eine Unterrichtsstunde — organisiere ihre Aufmerksamkeit, vermittle sinnvolle Inhalte, mach ihre Wartezeit lohnenswert. Alle können mitmachen.`,

      fr: `Tenez-vous devant ce groupe d'adolescents et donnez-leur un cours — organisez leur attention, transmettez un contenu significatif, rendez leur temps d'attente utile. Tout le monde peut participer.`,

      es: `Ponte frente a este grupo de adolescentes y dales una clase — organiza su atención, ofrece contenido significativo, haz que su tiempo de espera valga la pena. Todos pueden participar.`,

      pt: `Fique diante deste grupo de adolescentes e dê uma aula — organize a atenção deles, transmita conteúdo significativo, torne o tempo de espera proveitoso. Todos podem participar.`,

      it: `Mettiti davanti a questo gruppo di adolescenti e tieni una lezione — organizza la loro attenzione, trasmetti contenuti significativi, rendi il loro tempo di attesa utile. Tutti possono partecipare.`,

      ru: `Встаньте перед этой группой подростков и проведите урок — организуйте их внимание, дайте осмысленный контент, сделайте их ожидание полезным. Каждый может участвовать.`,

      ja: `このティーンエイジャーのグループの前に立ち、授業をしてください——注意を組織し、意味のある内容を伝え、待ち時間を有意義にしましょう。誰でも参加できます。`,

      ko: `이 청소년들 앞에 서서 수업을 해주세요 — 주의를 조직하고, 의미 있는 내용을 전달하고, 기다리는 시간을 가치 있게 만들어주세요. 누구나 참여할 수 있습니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你已经站起来了。

你看着那群躁动的青少年，身体的反应比思考更快。你走到他们中间，清了清嗓子，用一种不是命令但也不是请求的声音说：「给我五分钟。」

有几个人抬头看了你一眼。有一个还在玩手机。你没有生气，而是直接开始讲——一个话题，一个故事，一个他们没听过的角度。

两分钟后，玩手机的那个人也抬头了。

你继续讲。你知道怎么抓住一群年轻人的注意力——不是靠音量，是靠内容。你提问，让他们思考。有人回答了，你接着他的回答展开。

十分钟后，最吵的那个人举手问了一个问题。你笑了：「好问题。」

混乱变成了课堂。Leila 在旁边看着你们，微微点头。`,

        en: `You're already on your feet.\n\nYou look at the restless teenagers and your body moves faster than thought. You walk into their midst, clear your throat, and speak in a tone that's neither command nor request: "Give me five minutes."\n\nA few look up. One is still on his phone. You don't get angry — you just start. A topic, a story, an angle they haven't heard before.\n\nTwo minutes in, the one on his phone looks up too.\n\nYou keep going. You know how to hold a group of young people's attention — not through volume, but through content. You ask questions, make them think. Someone answers, and you build from their response.\n\nTen minutes later, the loudest one raises his hand with a question. You smile: "Good question."\n\nChaos has become a classroom. Leila watches from the side, nodding slightly.`,

        nl: `Je staat al overeind.\n\nJe kijkt naar de onrustige tieners en je lichaam beweegt sneller dan je gedachten. Je loopt tussen hen in, schraapt je keel en spreekt in een toon die geen bevel noch verzoek is: "Geef me vijf minuten."\n\nEen paar kijken op. Eén zit nog op zijn telefoon. Je wordt niet boos — je begint gewoon. Een onderwerp, een verhaal, een invalshoek die ze niet eerder gehoord hebben.\n\nTwee minuten later kijkt de telefoongebruiker ook op.\n\nJe gaat door. Je weet hoe je de aandacht van een groep jongeren vasthoudt — niet door volume, maar door inhoud. Je stelt vragen, laat ze nadenken. Iemand antwoordt, en je bouwt verder op hun antwoord.\n\nTien minuten later steekt de luidruchtigste zijn hand op met een vraag. Je glimlacht: "Goede vraag."\n\nChaos is een klaslokaal geworden. Leila kijkt toe van opzij, knikt licht.`,

        de: `Du stehst schon.\n\nDu siehst die unruhigen Teenager und dein Körper bewegt sich schneller als der Gedanke. Du gehst in ihre Mitte, räusperst dich und sprichst in einem Ton, der weder Befehl noch Bitte ist: „Gebt mir fünf Minuten."\n\nEin paar schauen auf. Einer ist noch am Handy. Du wirst nicht ärgerlich — du fängst einfach an. Ein Thema, eine Geschichte, ein Blickwinkel, den sie noch nicht gehört haben.\n\nZwei Minuten später schaut auch der Handynutzer auf.\n\nDu machst weiter. Du weißt, wie man die Aufmerksamkeit einer Gruppe junger Leute hält — nicht durch Lautstärke, sondern durch Inhalt. Du stellst Fragen, bringst sie zum Nachdenken. Jemand antwortet, und du baust auf seiner Antwort auf.\n\nZehn Minuten später hebt der Lauteste die Hand mit einer Frage. Du lächelst: „Gute Frage."\n\nChaos wurde zum Klassenzimmer. Leila schaut von der Seite zu und nickt leicht.`,

        fr: `Vous êtes déjà debout.\n\nVous regardez les adolescents agités et votre corps bouge plus vite que la pensée. Vous marchez au milieu d'eux, vous raclez la gorge et parlez d'un ton qui n'est ni un ordre ni une demande : « Accordez-moi cinq minutes. »\n\nQuelques-uns lèvent les yeux. Un est encore sur son téléphone. Vous ne vous fâchez pas — vous commencez simplement. Un sujet, une histoire, un angle qu'ils n'ont jamais entendu.\n\nDeux minutes plus tard, celui au téléphone lève les yeux aussi.\n\nVous continuez. Vous savez comment capter l'attention d'un groupe de jeunes — pas par le volume, mais par le contenu. Vous posez des questions, les faites réfléchir. Quelqu'un répond, et vous développez à partir de sa réponse.\n\nDix minutes plus tard, le plus bruyant lève la main avec une question. Vous souriez : « Bonne question. »\n\nLe chaos est devenu une salle de classe. Leila observe de côté, hochant légèrement la tête.`,

        es: `Ya estás de pie.\n\nMiras a los adolescentes inquietos y tu cuerpo se mueve más rápido que el pensamiento. Caminas entre ellos, aclaras tu garganta y hablas en un tono que no es orden ni petición: "Denme cinco minutos."\n\nAlgunos levantan la vista. Uno sigue con el teléfono. No te enfadas — simplemente empiezas. Un tema, una historia, un ángulo que no han escuchado antes.\n\nDos minutos después, el del teléfono también levanta la vista.\n\nContinúas. Sabes cómo mantener la atención de un grupo de jóvenes — no con volumen, sino con contenido. Haces preguntas, los haces pensar. Alguien responde, y construyes desde su respuesta.\n\nDiez minutos después, el más ruidoso levanta la mano con una pregunta. Sonríes: "Buena pregunta."\n\nEl caos se ha convertido en un aula. Leila observa desde un lado, asintiendo levemente.`,

        pt: `Você já está de pé.\n\nOlha para os adolescentes inquietos e seu corpo se move mais rápido que o pensamento. Caminha até o meio deles, limpa a garganta e fala em um tom que não é ordem nem pedido: "Me deem cinco minutos."\n\nAlguns olham para cima. Um ainda está no celular. Você não se irrita — simplesmente começa. Um tema, uma história, um ângulo que não ouviram antes.\n\nDois minutos depois, o do celular também olha.\n\nVocê continua. Sabe como prender a atenção de um grupo de jovens — não pelo volume, mas pelo conteúdo. Faz perguntas, faz pensar. Alguém responde, e você constrói a partir da resposta.\n\nDez minutos depois, o mais barulhento levanta a mão com uma pergunta. Você sorri: "Boa pergunta."\n\nO caos virou sala de aula. Leila observa de lado, acenando levemente.`,

        it: `Sei già in piedi.\n\nGuardi gli adolescenti irrequieti e il tuo corpo si muove più veloce del pensiero. Cammini in mezzo a loro, ti schiarisci la voce e parli con un tono che non è né comando né richiesta: "Datemi cinque minuti."\n\nAlcuni alzano lo sguardo. Uno è ancora al telefono. Non ti arrabbi — cominci e basta. Un argomento, una storia, un'angolazione che non hanno mai sentito.\n\nDue minuti dopo, anche quello al telefono alza lo sguardo.\n\nContinui. Sai come tenere l'attenzione di un gruppo di giovani — non con il volume, ma con il contenuto. Fai domande, li fai pensare. Qualcuno risponde, e costruisci dalla sua risposta.\n\nDieci minuti dopo, il più rumoroso alza la mano con una domanda. Sorridi: "Bella domanda."\n\nIl caos è diventato un'aula. Leila osserva da un lato, annuendo leggermente.`,

        ru: `Вы уже стоите.\n\nСмотрите на беспокойных подростков, и тело движется быстрее мысли. Входите в их середину, прочищаете горло и говорите тоном, который не приказ и не просьба: «Дайте мне пять минут.»\n\nНесколько поднимают глаза. Один всё ещё в телефоне. Вы не злитесь — просто начинаете. Тема, история, ракурс, которого они не слышали.\n\nЧерез две минуты и тот, что в телефоне, поднимает глаза.\n\nВы продолжаете. Знаете, как удержать внимание группы молодых людей — не громкостью, а содержанием. Задаёте вопросы, заставляете думать. Кто-то отвечает, и вы развиваете его ответ.\n\nЧерез десять минут самый шумный поднимает руку с вопросом. Вы улыбаетесь: «Хороший вопрос.»\n\nХаос стал классом. Лейла наблюдает сбоку, слегка кивая.`,

        ja: `もう立ち上がっている。\n\n落ち着きのないティーンエイジャーを見て、考えるより先に体が動いた。彼らの中に歩いて行き、咳払いをし、命令でも依頼でもない口調で言う：「5分だけくれ。」\n\n数人が顔を上げる。一人はまだスマホを見ている。怒らない——ただ始める。一つのテーマ、一つの話、彼らが聞いたことのない切り口。\n\n2分後、スマホの彼も顔を上げた。\n\n続ける。若者の注意を引きつける方法を知っている——音量ではなく、内容で。質問を投げ、考えさせる。誰かが答え、その答えから展開する。\n\n10分後、一番騒がしかった子が手を挙げて質問した。笑みを浮かべる：「いい質問だ。」\n\n混沌が教室になった。レイラが横から見ている。小さくうなずいた。`,

        ko: `이미 일어서 있다.\n\n안절부절못하는 청소년들을 보자 생각보다 먼저 몸이 움직였다. 그들 사이로 걸어 들어가, 헛기침을 하고, 명령도 부탁도 아닌 목소리로 말한다: "5분만 주세요."\n\n몇 명이 고개를 든다. 한 명은 아직 폰을 보고 있다. 화내지 않는다 — 그냥 시작한다. 하나의 주제, 하나의 이야기, 들어본 적 없는 관점.\n\n2분 후, 폰을 보던 아이도 고개를 든다.\n\n계속한다. 젊은이들의 주의를 끄는 법을 안다 — 목소리 크기가 아니라 내용으로. 질문을 던지고, 생각하게 한다. 누군가 답하고, 그 대답에서 이어나간다.\n\n10분 후, 가장 시끄럽던 아이가 손을 들고 질문한다. 미소 짓는다: "좋은 질문이야."\n\n혼란이 교실이 되었다. 레일라가 옆에서 지켜보며 살짝 고개를 끄덕인다.`,
      },
      score4: {
        zh: `你走过去了，但没有直接站到最前面。

你在人群边缘找了个位置，开始跟旁边几个人搭话。一个在画画的女生，一个在发呆的男生。你问他们在等什么、平时做什么、觉得无聊的时候怎么办。

几个人开始回应你了。话题慢慢展开——不是一堂正式的课，更像是一场自然的对话。你问了一些让他们思考的问题，有人答了，有人不答，但气氛在变。

你不确定自己能撑起一整堂课，但你确实让这个角落安静了一点。`,

        en: `You walk over, but don't go straight to the front.\n\nYou find a spot at the edge of the group and start talking to a few people nearby. A girl drawing something, a boy staring into space. You ask what they're waiting for, what they usually do, how they deal with boredom.\n\nA few start responding. The conversation unfolds naturally — not a formal class, more like an organic discussion. You ask questions that make them think. Some answer, some don't, but the atmosphere is shifting.\n\nYou're not sure you could carry a whole class, but you've made this corner a little quieter.`,

        nl: `Je loopt erheen, maar gaat niet direct vooraan staan.\n\nJe vindt een plek aan de rand van de groep en begint met een paar mensen in de buurt te praten. Een meisje dat iets tekent, een jongen die voor zich uit staart. Je vraagt waar ze op wachten, wat ze normaal doen, hoe ze met verveling omgaan.\n\nEen paar beginnen te reageren. Het gesprek ontvouwt zich natuurlijk — geen formele les, meer een organische discussie. Je stelt vragen die ze laten nadenken. Sommigen antwoorden, sommigen niet, maar de sfeer verandert.\n\nJe weet niet zeker of je een hele les kunt dragen, maar je hebt deze hoek iets rustiger gemaakt.`,

        de: `Du gehst hin, stellst dich aber nicht direkt nach vorne.\n\nDu findest einen Platz am Rand der Gruppe und fängst an, mit ein paar Leuten in der Nähe zu reden. Ein Mädchen, das etwas zeichnet, ein Junge, der ins Leere starrt. Du fragst, worauf sie warten, was sie normalerweise machen, wie sie mit Langeweile umgehen.\n\nEinige beginnen zu antworten. Das Gespräch entfaltet sich natürlich — kein formeller Unterricht, eher eine organische Diskussion. Du stellst Fragen, die zum Nachdenken anregen. Manche antworten, manche nicht, aber die Atmosphäre verändert sich.\n\nDu bist nicht sicher, ob du eine ganze Stunde durchhalten könntest, aber du hast diese Ecke etwas ruhiger gemacht.`,

        fr: `Vous vous approchez, mais n'allez pas directement devant.\n\nVous trouvez une place en bordure du groupe et commencez à parler avec quelques personnes à proximité. Une fille qui dessine, un garçon qui fixe le vide. Vous demandez ce qu'ils attendent, ce qu'ils font d'habitude, comment ils gèrent l'ennui.\n\nQuelques-uns commencent à répondre. La conversation se déploie naturellement — pas un cours formel, plutôt une discussion organique. Vous posez des questions qui les font réfléchir. Certains répondent, d'autres non, mais l'atmosphère change.\n\nVous n'êtes pas sûr de pouvoir tenir un cours entier, mais vous avez rendu ce coin un peu plus calme.`,

        es: `Te acercas, pero no vas directo al frente.\n\nEncuentras un lugar al borde del grupo y empiezas a hablar con algunos cerca. Una chica dibujando algo, un chico mirando al vacío. Les preguntas qué esperan, qué hacen normalmente, cómo manejan el aburrimiento.\n\nAlgunos empiezan a responder. La conversación se despliega naturalmente — no una clase formal, más bien una discusión orgánica. Haces preguntas que los hacen pensar. Algunos responden, otros no, pero la atmósfera está cambiando.\n\nNo estás seguro de poder sostener toda una clase, pero has hecho esta esquina un poco más tranquila.`,

        pt: `Você se aproxima, mas não vai direto para a frente.\n\nEncontra um lugar na borda do grupo e começa a conversar com alguns por perto. Uma garota desenhando, um garoto olhando para o nada. Pergunta o que estão esperando, o que costumam fazer, como lidam com o tédio.\n\nAlguns começam a responder. A conversa se desenrola naturalmente — não uma aula formal, mais como uma discussão orgânica. Faz perguntas que os fazem pensar. Alguns respondem, outros não, mas a atmosfera está mudando.\n\nNão tem certeza se conseguiria sustentar uma aula inteira, mas tornou este canto um pouco mais calmo.`,

        it: `Ti avvicini, ma non vai direttamente davanti a tutti.\n\nTrovi un posto ai margini del gruppo e cominci a parlare con qualcuno vicino. Una ragazza che disegna, un ragazzo che fissa il vuoto. Chiedi cosa aspettano, cosa fanno di solito, come gestiscono la noia.\n\nAlcuni cominciano a rispondere. La conversazione si sviluppa naturalmente — non una lezione formale, più una discussione spontanea. Fai domande che li fanno riflettere. Qualcuno risponde, qualcuno no, ma l'atmosfera sta cambiando.\n\nNon sei sicuro di riuscire a reggere un'intera lezione, ma hai reso questo angolo un po' più tranquillo.`,

        ru: `Вы подходите, но не встаёте сразу перед всеми.\n\nНаходите место на краю группы и начинаете разговаривать с несколькими ближайшими. Девушка, которая рисует, парень, уставившийся в пустоту. Спрашиваете, чего они ждут, чем обычно занимаются, как справляются со скукой.\n\nНесколько человек начинают отвечать. Разговор разворачивается естественно — не формальный урок, скорее органичная дискуссия. Вы задаёте вопросы, которые заставляют задуматься. Кто-то отвечает, кто-то нет, но атмосфера меняется.\n\nВы не уверены, что смогли бы провести целый урок, но в этом уголке стало чуть тише.`,

        ja: `歩み寄るが、いきなり前には立たない。\n\nグループの端に場所を見つけ、近くの何人かに話しかけ始める。何か描いている女の子、ぼーっとしている男の子。何を待っているのか、普段は何をしているのか、退屈な時はどうするかを聞く。\n\n何人かが答え始めた。会話が自然に広がっていく——正式な授業ではなく、自然発生的な対話のように。考えさせる質問を投げる。答える人もいれば答えない人もいるが、空気が変わっていく。\n\n一コマ丸ごと支える自信はないが、この一角を少し静かにすることはできた。`,

        ko: `다가가지만, 바로 앞에 서지는 않는다.\n\n그룹 가장자리에 자리를 잡고 근처 몇 명에게 말을 건다. 무언가 그리고 있는 여학생, 멍하니 있는 남학생. 뭘 기다리는지, 평소에 뭘 하는지, 지루할 때 어떻게 하는지 묻는다.\n\n몇 명이 대답하기 시작한다. 대화가 자연스럽게 펼쳐진다 — 정식 수업이 아니라, 자연스러운 토론에 가깝다. 생각하게 만드는 질문을 던진다. 대답하는 사람도 있고 안 하는 사람도 있지만, 분위기가 달라지고 있다.\n\n수업 전체를 이끌 수 있을지 확신은 없지만, 이 구석을 조금 더 조용하게 만들었다.`,
      },
      score3: {
        zh: `一群躁动的青少年。

你看着他们，心里有一种犹豫——不是不想帮忙，是不确定自己能不能镇住一群不认识你的年轻人。

你走近了几步，看了看他们。如果有人先开口了，你可以帮忙补充。但独自站到他们面前、组织注意力、撑起一整堂课——你不确定自己有这个自信。

也许你可以在旁边帮忙维持秩序，但要当老师……你犹豫了。`,

        en: `A group of restless teenagers.\n\nYou look at them, hesitating — not because you don't want to help, but because you're not sure you can command the attention of a group of strangers.\n\nYou step closer and look at them. If someone else starts, you can help fill in. But standing before them alone, organizing attention, holding an entire class together — you're not sure you have that confidence.\n\nMaybe you can help maintain order from the side, but being the teacher... you hesitate.`,

        nl: `Een groep onrustige tieners.\n\nJe kijkt naar hen en aarzelt — niet omdat je niet wilt helpen, maar omdat je niet zeker weet of je de aandacht van een groep vreemden kunt opeisen.\n\nJe komt dichterbij en kijkt. Als iemand anders begint, kun je aanvullen. Maar alleen voor hen staan, aandacht organiseren, een hele les dragen — je weet niet zeker of je dat zelfvertrouwen hebt.\n\nMisschien kun je van de zijkant orde helpen bewaren, maar de leraar zijn... je aarzelt.`,

        de: `Eine Gruppe unruhiger Teenager.\n\nDu siehst sie an und zögerst — nicht weil du nicht helfen willst, sondern weil du nicht sicher bist, ob du die Aufmerksamkeit einer Gruppe Fremder gewinnen kannst.\n\nDu kommst näher und schaust. Wenn jemand anderes anfängt, kannst du ergänzen. Aber allein vor ihnen stehen, Aufmerksamkeit organisieren, eine ganze Stunde halten — du bist nicht sicher, ob du das Selbstvertrauen hast.\n\nVielleicht kannst du von der Seite Ordnung halten, aber der Lehrer sein... du zögerst.`,

        fr: `Un groupe d'adolescents agités.\n\nVous les regardez, hésitant — pas parce que vous ne voulez pas aider, mais parce que vous n'êtes pas sûr de pouvoir capter l'attention d'un groupe d'inconnus.\n\nVous vous rapprochez et regardez. Si quelqu'un d'autre commence, vous pouvez compléter. Mais vous tenir seul devant eux, organiser l'attention, tenir un cours entier — vous n'êtes pas sûr d'avoir cette confiance.\n\nPeut-être pouvez-vous aider à maintenir l'ordre depuis le côté, mais être le professeur... vous hésitez.`,

        es: `Un grupo de adolescentes inquietos.\n\nLos miras, dudando — no porque no quieras ayudar, sino porque no estás seguro de poder captar la atención de un grupo de desconocidos.\n\nTe acercas y miras. Si alguien más empieza, puedes complementar. Pero pararte solo frente a ellos, organizar la atención, sostener toda una clase — no estás seguro de tener esa confianza.\n\nQuizás puedas ayudar a mantener el orden desde un lado, pero ser el profesor... dudas.`,

        pt: `Um grupo de adolescentes inquietos.\n\nVocê olha para eles, hesitando — não porque não quer ajudar, mas porque não tem certeza de conseguir prender a atenção de um grupo de estranhos.\n\nSe aproxima e olha. Se alguém começar, pode complementar. Mas ficar sozinho diante deles, organizar a atenção, sustentar uma aula inteira — não tem certeza de ter essa confiança.\n\nTalvez possa ajudar a manter a ordem de lado, mas ser o professor... hesita.`,

        it: `Un gruppo di adolescenti irrequieti.\n\nLi guardi, esitando — non perché non vuoi aiutare, ma perché non sei sicuro di riuscire a catturare l'attenzione di un gruppo di sconosciuti.\n\nTi avvicini e guardi. Se qualcun altro inizia, puoi integrare. Ma stare da solo davanti a loro, organizzare l'attenzione, reggere un'intera lezione — non sei sicuro di avere quella sicurezza.\n\nForse puoi aiutare a mantenere l'ordine da un lato, ma fare l'insegnante... esiti.`,

        ru: `Группа беспокойных подростков.\n\nВы смотрите на них, колеблясь — не потому что не хотите помочь, а потому что не уверены, сможете ли завладеть вниманием группы незнакомцев.\n\nПодходите ближе и смотрите. Если кто-то другой начнёт, можете дополнить. Но встать перед ними одному, организовать внимание, провести целый урок — не уверены, хватит ли уверенности.\n\nМожет, поможете поддерживать порядок сбоку, но быть учителем... вы колеблетесь.`,

        ja: `落ち着きのないティーンエイジャーのグループ。\n\n彼らを見て、躊躇する——手伝いたくないからではなく、見知らぬ人たちの注意を引きつけられるか確信がないからだ。\n\n近づいて見る。誰か他の人が始めれば、補足できる。でも一人で彼らの前に立ち、注意を組織し、授業を丸ごと支える——その自信があるかわからない。\n\n横から秩序を保つ手伝いくらいならできるかもしれないが、教師になるのは...迷っている。`,

        ko: `안절부절못하는 청소년들 무리.\n\n그들을 보며 망설인다 — 돕고 싶지 않아서가 아니라, 낯선 사람들의 주의를 끌 수 있을지 확신이 없어서다.\n\n가까이 다가가 본다. 다른 누군가가 시작하면 보충할 수 있다. 하지만 혼자 그들 앞에 서서 주의를 조직하고 수업 전체를 이끌기에는 — 그만한 자신감이 있는지 모르겠다.\n\n옆에서 질서 유지를 도울 수는 있겠지만, 선생님이 되기는... 망설여진다.`,
      },
      score2: {
        zh: `站到一群青少年面前当老师。

你看着那群吵闹的年轻人，理解他们需要有人来组织和引导。但走过去、站在他们面前、抓住他们的注意力、讲一堂让他们安静下来的课——这种需要权威感、表达力和持续控场能力的工作，不是你的本能。

Leila 在那里。也许她或者别人更适合做这件事。`,

        en: `Standing before a group of teenagers as their teacher.\n\nYou look at the noisy young people, understand they need someone to organize and guide them. But walking over, standing in front of them, capturing their attention, delivering a class that quiets them down — this kind of work requiring authority, expressiveness, and sustained classroom control isn't your instinct.\n\nLeila is there. Maybe she or someone else is better suited for this.`,

        nl: `Voor een groep tieners staan als hun leraar.\n\nJe kijkt naar de luidruchtige jongeren, begrijpt dat ze iemand nodig hebben om te organiseren en begeleiden. Maar erheen lopen, voor hen staan, hun aandacht vangen, een les geven die hen tot rust brengt — dit soort werk dat autoriteit, expressiviteit en aanhoudende controle vereist, is niet je instinct.\n\nLeila is er. Misschien is zij of iemand anders hier beter geschikt voor.`,

        de: `Vor einer Gruppe Teenager als Lehrer stehen.\n\nDu siehst die lauten jungen Leute, verstehst dass sie jemanden brauchen der organisiert und anleitet. Aber hingehen, vor ihnen stehen, ihre Aufmerksamkeit gewinnen, eine Stunde halten die sie beruhigt — diese Art Arbeit die Autorität, Ausdruckskraft und anhaltende Kontrolle erfordert, ist nicht dein Instinkt.\n\nLeila ist da. Vielleicht ist sie oder jemand anderes besser dafür geeignet.`,

        fr: `Se tenir devant un groupe d'adolescents comme leur professeur.\n\nVous regardez les jeunes bruyants, comprenez qu'ils ont besoin de quelqu'un pour les organiser et les guider. Mais s'approcher, se tenir devant eux, capter leur attention, donner un cours qui les calme — ce type de travail exigeant autorité, expressivité et contrôle soutenu n'est pas votre instinct.\n\nLeila est là. Peut-être qu'elle ou quelqu'un d'autre conviendrait mieux.`,

        es: `Pararte frente a un grupo de adolescentes como su profesor.\n\nMiras a los jóvenes ruidosos, entiendes que necesitan a alguien que los organice y guíe. Pero acercarte, pararte frente a ellos, captar su atención, dar una clase que los calme — este tipo de trabajo que requiere autoridad, expresividad y control sostenido no es tu instinto.\n\nLeila está ahí. Quizás ella u otra persona sea más adecuada para esto.`,

        pt: `Ficar diante de um grupo de adolescentes como professor.\n\nVocê olha para os jovens barulhentos, entende que precisam de alguém para organizar e orientar. Mas ir até lá, ficar na frente deles, captar a atenção, dar uma aula que os acalme — esse tipo de trabalho que exige autoridade, expressividade e controle sustentado não é seu instinto.\n\nLeila está lá. Talvez ela ou outra pessoa seja mais adequada para isso.`,

        it: `Stare davanti a un gruppo di adolescenti come loro insegnante.\n\nGuardi i giovani rumorosi, capisci che hanno bisogno di qualcuno che organizzi e guidi. Ma avvicinarsi, stare davanti a loro, catturare la loro attenzione, tenere una lezione che li calmi — questo tipo di lavoro che richiede autorità, espressività e controllo costante non è il tuo istinto.\n\nLeila è lì. Forse lei o qualcun altro è più adatto per questo.`,

        ru: `Встать перед группой подростков в роли учителя.\n\nВы смотрите на шумных молодых людей, понимаете что им нужен кто-то для организации и руководства. Но подойти, встать перед ними, завладеть вниманием, провести урок который их успокоит — такая работа, требующая авторитета, выразительности и постоянного контроля, не ваш инстинкт.\n\nЛейла здесь. Возможно, она или кто-то другой подойдёт лучше.`,

        ja: `ティーンエイジャーのグループの前に教師として立つ。\n\n騒がしい若者たちを見て、誰かが組織し導く必要があると理解する。しかし歩み寄り、彼らの前に立ち、注意を引きつけ、静かにさせる授業をする——権威、表現力、持続的な場のコントロールを要するこの種の仕事は、本能ではない。\n\nレイラがいる。彼女か誰か他の人の方が向いているかもしれない。`,

        ko: `청소년들 앞에 선생님으로 서기.\n\n시끄러운 젊은이들을 보고, 누군가가 조직하고 이끌어야 한다는 걸 이해한다. 하지만 다가가서 그들 앞에 서고, 주의를 끌고, 그들을 진정시킬 수업을 하기 — 권위, 표현력, 지속적인 장악력을 요구하는 이런 일은 본능이 아니다.\n\n레일라가 있다. 그녀나 다른 누군가가 더 적합할 것이다.`,
      },
      score1: {
        zh: `喧闹声传来，你看了一眼。

一群青少年，无人管理，越来越吵。你理解这个情况需要有人处理，但你身体里没有产生走过去当老师的反应。

站在一群年轻人面前教学——组织、讲授、控场——这些活动在你的内心不会引起行动的冲动。不是因为你冷漠。是因为这不是你的方式。

等候室快结束了。也许有别人更适合做这件事。`,

        en: `The noise reaches you. You glance over.\n\nA group of teenagers, unmanaged, growing louder. You understand someone needs to step in, but your body produces no response to walk over and teach.\n\nStanding before a group of young people to teach — organizing, lecturing, managing the room — these activities don't trigger the impulse to act. Not because you're cold. Because this isn't your way.\n\nThe waiting room is almost over. Maybe someone else is better suited for this.`,

        nl: `Het lawaai bereikt je. Je kijkt op.\n\nEen groep tieners, onbeheerd, steeds luidruchtiger. Je begrijpt dat iemand moet ingrijpen, maar je lichaam produceert geen reactie om erheen te lopen en les te geven.\n\nVoor een groep jongeren staan om les te geven — organiseren, doceren, de ruimte beheersen — deze activiteiten triggeren de impuls om te handelen niet. Niet omdat je koud bent. Omdat dit niet jouw manier is.\n\nDe wachtkamer is bijna voorbij. Misschien is iemand anders hier beter geschikt voor.`,

        de: `Der Lärm erreicht dich. Du schaust hinüber.\n\nEine Gruppe Teenager, unbeaufsichtigt, wird lauter. Du verstehst, dass jemand eingreifen muss, aber dein Körper erzeugt keine Reaktion, hinzugehen und zu unterrichten.\n\nVor einer Gruppe junger Menschen stehen und unterrichten — organisieren, vortragen, den Raum managen — diese Aktivitäten lösen keinen Handlungsimpuls aus. Nicht weil du kalt bist. Weil das nicht dein Weg ist.\n\nDer Warteraum ist fast vorbei. Vielleicht ist jemand anderes besser dafür geeignet.`,

        fr: `Le bruit vous parvient. Vous jetez un regard.\n\nUn groupe d'adolescents, sans surveillance, de plus en plus bruyants. Vous comprenez que quelqu'un doit intervenir, mais votre corps ne produit aucune réaction pour y aller et enseigner.\n\nSe tenir devant un groupe de jeunes pour enseigner — organiser, exposer, gérer la salle — ces activités ne déclenchent pas l'impulsion d'agir. Pas parce que vous êtes froid. Parce que ce n'est pas votre manière.\n\nLa salle d'attente touche à sa fin. Peut-être que quelqu'un d'autre est mieux adapté pour cela.`,

        es: `El ruido te alcanza. Echas un vistazo.\n\nUn grupo de adolescentes, sin supervisión, cada vez más ruidosos. Entiendes que alguien necesita intervenir, pero tu cuerpo no produce respuesta para acercarte y enseñar.\n\nPararte frente a un grupo de jóvenes para enseñar — organizar, exponer, manejar el grupo — estas actividades no desencadenan el impulso de actuar. No porque seas frío. Porque esta no es tu manera.\n\nLa sala de espera está por terminar. Quizás alguien más sea más adecuado para esto.`,

        pt: `O barulho chega até você. Você olha.\n\nUm grupo de adolescentes, sem supervisão, ficando mais barulhentos. Entende que alguém precisa intervir, mas seu corpo não produz resposta para ir até lá e ensinar.\n\nFicar diante de um grupo de jovens para ensinar — organizar, lecionar, controlar a sala — essas atividades não disparam o impulso de agir. Não porque seja frio. Porque este não é seu jeito.\n\nA sala de espera está quase acabando. Talvez outra pessoa seja mais adequada para isso.`,

        it: `Il rumore ti raggiunge. Dai un'occhiata.\n\nUn gruppo di adolescenti, senza supervisione, sempre più rumorosi. Capisci che qualcuno deve intervenire, ma il tuo corpo non produce alcuna risposta per andare e insegnare.\n\nStare davanti a un gruppo di giovani per insegnare — organizzare, esporre, gestire il gruppo — queste attività non innescano l'impulso ad agire. Non perché sei freddo. Perché questo non è il tuo modo.\n\nLa sala d'attesa sta quasi finendo. Forse qualcun altro è più adatto per questo.`,

        ru: `Шум доносится до вас. Вы бросаете взгляд.\n\nГруппа подростков, без присмотра, всё громче. Вы понимаете, что кто-то должен вмешаться, но тело не порождает реакции подойти и учить.\n\nВстать перед группой молодых людей и преподавать — организовать, излагать, управлять аудиторией — эти действия не вызывают импульса к действию. Не потому что вы черствы. Потому что это не ваш способ.\n\nЗал ожидания почти закончился. Возможно, кто-то другой подойдёт лучше.`,

        ja: `騒がしさが届く。ちらりと見る。\n\nティーンエイジャーのグループ、管理されておらず、ますます騒がしい。誰かが介入しなければならないとわかっている。しかし体の中に歩み寄って教える反応が生まれない。\n\n若者のグループの前に立って教える——組織する、講義する、場を管理する——これらの活動は行動の衝動を引き起こさない。冷たいからではない。これが自分のやり方ではないからだ。\n\n待合室はもうすぐ終わる。たぶん他の誰かの方が向いている。`,

        ko: `소란이 들려온다. 흘끗 본다.\n\n청소년들 무리가 관리 없이 점점 시끄러워지고 있다. 누군가 나서야 한다는 건 이해하지만, 몸에서 다가가 가르치려는 반응이 일어나지 않는다.\n\n젊은이들 앞에 서서 가르치기 — 조직하고, 강의하고, 분위기를 이끌기 — 이런 활동들은 행동하려는 충동을 일으키지 않는다. 냉정해서가 아니다. 이것이 자신의 방식이 아니기 때문이다.\n\n대기실이 거의 끝나간다. 아마 다른 누군가가 이 일에 더 적합할 것이다.`,
      },
    },
  },
];
