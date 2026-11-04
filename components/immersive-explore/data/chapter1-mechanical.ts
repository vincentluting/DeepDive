// ════════════════════════════════════════════════════════════
// 第一章：机械室（R型 Q1-Q5）
// 大任务：系统修复——恢复五个子系统
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER1_QUESTIONS: ImmersiveQuestion[] = [
  // ── Q1: Assemble electronic parts ──────────────────────────
  {
    id: 1,
    riasec: "R",
    miniIpCode: "R3",
    miniIpItem: "Assemble electronic parts",
    chapter: "mechanical",
    chapterIndex: 1,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `进入机械室后，Marcus 直奔最近的工作台。

你注意到房间中央的主控制面板——它被拆开了。不是损坏，是被有意拆解的：电路板从插槽里抽出来，连接线被整齐剪断，十几个元件散落在防静电垫上，按某种顺序排列。

像是有人在说：「想通过这里，先把我装回去。」

旁边有一张折叠的电路图，展开后有报纸那么大，标注了每个元件的位置和连接方式。工具箱里有焊接工具、镊子、万用表、热缩管。

Marcus 蹲下来，拿起一块电路板，研究了几秒焊点，然后放下。「几十个元件，几百个连接点。一个人能做，但两个人会更快，也更不容易出错。」

他没有转头，但停顿了一下。

那个停顿的意思是：如果有人想来，现在就是时候。`,

      en: `After entering the machine room, Marcus heads straight for the nearest workbench.

You notice the main control panel in the center — it's been taken apart. Not damaged, but deliberately disassembled: circuit boards pulled from their slots, wires neatly severed, a dozen components scattered across an anti-static mat in some deliberate order.

As if someone is saying: "Want to get through here? Put me back together first."

Beside it, a folded circuit diagram — newspaper-sized when unfolded — marks the position and connections of every component. The toolbox holds soldering tools, tweezers, a multimeter, heat-shrink tubing.

Marcus crouches, picks up a circuit board, studies the solder joints for a few seconds, then sets it down. "Dozens of components. Hundreds of connection points. One person can do it, but two would be faster and less error-prone."

He doesn't turn his head, but he pauses for a beat.

That pause means: if someone wants to join, now is the time.`,

      nl: `Na het betreden van de machinekamer loopt Marcus rechtstreeks naar de dichtstbijzijnde werkbank.

Je ziet het hoofdbedieningspaneel in het midden van de ruimte — het is uit elkaar gehaald. Niet beschadigd, maar doelbewust gedemonteerd: printplaten uit hun sleuven getrokken, draden netjes doorgeknipt, een dozijn elektronische componenten verspreid over een antistatische mat, in een bepaalde volgorde gerangschikt.

Alsof iemand zegt: "Wil je hier doorheen? Zet me eerst weer in elkaar."

Ernaast ligt een opgevouwen schakelschema — zo groot als een krant wanneer uitgevouwen — met de positie en verbindingen van elk onderdeel. De gereedschapskist bevat soldeerspullen, pincetten, een multimeter, krimpkous.

Marcus hurkt neer, pakt een printplaat op, bestudeert de soldeerverbindingen een paar seconden en legt hem dan neer. "Tientallen componenten. Honderden verbindingspunten. Eén persoon kan het, maar met z'n tweeën gaat het sneller en nauwkeuriger."

Hij draait zijn hoofd niet om, maar hij pauzeert even.

Die pauze betekent: als iemand mee wil doen, is dit het moment.`,

      de: `Nach dem Betreten des Maschinenraums steuert Marcus direkt auf die nächste Werkbank zu.

Dir fällt das Hauptbedienfeld in der Mitte des Raums auf — es wurde auseinandergenommen. Nicht beschädigt, sondern absichtlich zerlegt: Platinen aus ihren Steckplätzen gezogen, Kabel sauber durchtrennt, ein Dutzend elektronischer Bauteile über eine antistatische Matte verstreut, in einer bestimmten Reihenfolge angeordnet.

Als würde jemand sagen: „Willst du hier durch? Dann setz mich erst wieder zusammen."

Daneben ein gefalteter Schaltplan — ausgefaltet so groß wie eine Zeitung — mit der Position und den Verbindungen jedes Bauteils. Der Werkzeugkasten enthält Lötwerkzeug, Pinzetten, ein Multimeter, Schrumpfschlauch.

Marcus geht in die Hocke, nimmt eine Platine auf, studiert die Lötstellen ein paar Sekunden und legt sie dann ab. „Dutzende Bauteile. Hunderte Verbindungspunkte. Einer kann es schaffen, aber zu zweit geht es schneller und fehlerfreier."

Er dreht den Kopf nicht, aber er hält kurz inne.

Diese Pause bedeutet: Wer mitmachen will — jetzt ist der Moment.`,

      fr: `En entrant dans la salle des machines, Marcus se dirige droit vers l'établi le plus proche.

Tu remarques le panneau de contrôle principal au centre de la pièce — il a été démonté. Pas endommagé, mais délibérément désassemblé : les cartes de circuits retirées de leurs emplacements, les fils soigneusement coupés, une douzaine de composants électroniques dispersés sur un tapis antistatique, disposés dans un ordre précis.

Comme si quelqu'un disait : « Tu veux passer ? Remonte-moi d'abord. »

À côté, un schéma de circuit plié — de la taille d'un journal une fois déplié — indique la position et les connexions de chaque composant. La boîte à outils contient un fer à souder, des pinces, un multimètre, de la gaine thermorétractable.

Marcus s'accroupit, saisit une carte de circuit, étudie les points de soudure quelques secondes, puis la repose. « Des dizaines de composants. Des centaines de points de connexion. Une personne peut le faire, mais à deux, ce sera plus rapide et moins risqué. »

Il ne tourne pas la tête, mais il marque une pause.

Cette pause signifie : si quelqu'un veut se joindre, c'est maintenant.`,

      es: `Al entrar en la sala de máquinas, Marcus se dirige directo al banco de trabajo más cercano.

Notas el panel de control principal en el centro de la sala: está desmontado. No dañado, sino deliberadamente desarmado: las placas de circuito extraídas de sus ranuras, los cables cortados con precisión, una docena de componentes electrónicos dispersos sobre una alfombrilla antiestática, dispuestos en un orden particular.

Como si alguien dijera: "¿Quieres pasar? Primero vuelve a armarme."

Junto a él, un diagrama de circuito plegado — del tamaño de un periódico al desplegarse — marca la posición y las conexiones de cada componente. La caja de herramientas contiene soldador, pinzas, un multímetro, tubo termorretráctil.

Marcus se agacha, toma una placa de circuito, estudia los puntos de soldadura unos segundos y la deja. "Decenas de componentes. Cientos de puntos de conexión. Una persona puede hacerlo, pero dos serían más rápidos y cometerían menos errores."

No gira la cabeza, pero hace una pausa.

Esa pausa significa: si alguien quiere unirse, ahora es el momento.`,

      pt: `Ao entrar na sala de máquinas, Marcus vai direto para a bancada mais próxima.

Você nota o painel de controle principal no centro da sala — foi desmontado. Não danificado, mas deliberadamente desassemblado: placas de circuito retiradas dos encaixes, fios cortados com precisão, uma dúzia de componentes eletrônicos espalhados sobre uma manta antiestática, dispostos em uma ordem específica.

Como se alguém dissesse: "Quer passar por aqui? Primeiro me monte de volta."

Ao lado, um diagrama de circuito dobrado — do tamanho de um jornal quando aberto — marca a posição e as conexões de cada componente. A caixa de ferramentas contém equipamento de solda, pinças, um multímetro, tubos termorretráteis.

Marcus se agacha, pega uma placa de circuito, estuda os pontos de solda por alguns segundos e a coloca de volta. "Dezenas de componentes. Centenas de pontos de conexão. Uma pessoa consegue, mas duas seriam mais rápidas e menos propensas a erros."

Ele não vira a cabeça, mas faz uma pausa.

Essa pausa significa: se alguém quer participar, agora é a hora.`,

      it: `Entrando nella sala macchine, Marcus si dirige dritto verso il banco da lavoro più vicino.

Noti il pannello di controllo principale al centro della stanza — è stato smontato. Non danneggiato, ma deliberatamente disassemblato: le schede elettroniche estratte dai loro alloggiamenti, i cavi tagliati con precisione, una dozzina di componenti elettronici sparsi su un tappetino antistatico, disposti in un ordine preciso.

Come se qualcuno dicesse: "Vuoi passare? Prima rimontami."

Accanto, uno schema circuitale piegato — grande come un giornale una volta aperto — segna la posizione e i collegamenti di ogni componente. La cassetta degli attrezzi contiene saldatore, pinzette, un multimetro, guaina termorestringente.

Marcus si accovaccia, prende una scheda, studia i punti di saldatura per qualche secondo, poi la posa. "Decine di componenti. Centinaia di punti di connessione. Uno ce la può fare, ma in due sarebbe più veloce e con meno errori."

Non gira la testa, ma si ferma un istante.

Quella pausa significa: se qualcuno vuole unirsi, questo è il momento.`,

      ru: `Войдя в машинный зал, Маркус направляется прямо к ближайшему рабочему столу.

Ты замечаешь главную панель управления в центре комнаты — она разобрана. Не повреждена, а намеренно демонтирована: печатные платы извлечены из разъёмов, провода аккуратно перерезаны, дюжина электронных компонентов разложена на антистатическом коврике в определённом порядке.

Словно кто-то говорит: «Хочешь пройти? Сначала собери меня обратно.»

Рядом — сложенная принципиальная схема, размером с газету в развёрнутом виде, с обозначением положения и соединений каждого компонента. В ящике с инструментами — паяльник, пинцеты, мультиметр, термоусадочная трубка.

Маркус приседает, берёт печатную плату, несколько секунд изучает точки пайки и кладёт обратно. «Десятки компонентов. Сотни точек соединения. Один справится, но вдвоём быстрее и точнее.»

Он не поворачивает головы, но делает паузу.

Эта пауза означает: если кто-то хочет присоединиться — сейчас самое время.`,

      ja: `機械室に入ると、マーカスはまっすぐ最寄りの作業台に向かった。

部屋の中央にあるメインコントロールパネルに目が留まる——分解されている。壊れたのではなく、意図的に解体されたのだ。回路基板がスロットから引き抜かれ、配線はきれいに切断され、十数個の電子部品が帯電防止マットの上に、ある秩序をもって並べられている。

まるで誰かがこう言っているかのように——「ここを通りたければ、まず私を組み立て直せ。」

そばには折りたたまれた回路図があり、広げると新聞紙ほどの大きさで、各部品の位置と接続が記されている。工具箱にははんだ付け道具、ピンセット、マルチメーター、熱収縮チューブが入っている。

マーカスはしゃがみ込み、回路基板を一枚手に取り、はんだ接合部を数秒間観察してから置いた。「数十の部品。数百の接続点。一人でもできるが、二人の方が速いし、ミスも減る。」

振り向きはしないが、一瞬動きを止めた。

その間は、こういう意味だ——誰か参加したいなら、今がその時だ。`,

      ko: `기계실에 들어서자, 마커스는 곧장 가장 가까운 작업대로 향했다.

방 한가운데 있는 메인 제어 패널이 눈에 들어온다 — 분해되어 있다. 파손된 게 아니라 의도적으로 해체된 것이다: 회로 기판이 슬롯에서 빠져 있고, 전선은 깔끔하게 잘려 있으며, 십여 개의 전자 부품이 정전기 방지 매트 위에 일정한 순서로 놓여 있다.

마치 누군가 이렇게 말하는 것 같다: "여기를 통과하고 싶으면, 먼저 나를 다시 조립해."

옆에는 접힌 회로도가 있다 — 펼치면 신문지만 한 크기로, 각 부품의 위치와 연결 방식이 표시되어 있다. 공구함에는 납땜 도구, 핀셋, 멀티미터, 수축 튜브가 들어 있다.

마커스가 쪼그려 앉아 회로 기판 하나를 집어 들고 납땜 지점을 몇 초간 살펴본 뒤 내려놓는다. "수십 개의 부품. 수백 개의 연결 지점. 혼자서도 할 수 있지만, 둘이 하면 더 빠르고 실수도 줄어들지."

고개를 돌리지 않지만, 잠시 멈춘다.

그 멈춤의 의미는: 누군가 합류하고 싶다면, 지금이 바로 그 순간이라는 것이다.`,
    },
    taskDescription: {
      zh: "将散落的电子元件按照电路图重新组装到控制面板上，恢复电气系统的运行。这项任务需要一个主要负责人。",

      en: `Reassemble the scattered electronic components onto the control panel according to the circuit diagram, restoring the electrical system. This task needs one primary person.`,

      nl: `Monteer de verspreide elektronische componenten volgens het schakelschema terug op het bedieningspaneel om het elektrische systeem te herstellen. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Baue die verstreuten elektronischen Bauteile gemäß dem Schaltplan wieder auf das Bedienfeld ein und stelle das elektrische System wieder her. Diese Aufgabe braucht eine hauptverantwortliche Person.`,

      fr: `Réassemblez les composants électroniques dispersés sur le panneau de contrôle selon le schéma du circuit pour restaurer le système électrique. Cette tâche nécessite un responsable principal.`,

      es: `Reensambla los componentes electrónicos dispersos en el panel de control siguiendo el diagrama de circuito para restaurar el sistema eléctrico. Esta tarea necesita un responsable principal.`,

      pt: `Reassemble os componentes eletrônicos espalhados no painel de controle de acordo com o diagrama de circuito, restaurando o sistema elétrico. Esta tarefa precisa de um responsável principal.`,

      it: `Riassembla i componenti elettronici sparsi sul pannello di controllo seguendo lo schema circuitale, ripristinando il sistema elettrico. Questo compito richiede un responsabile principale.`,

      ru: `Соберите разбросанные электронные компоненты обратно на панель управления по принципиальной схеме, восстановив электрическую систему. Для этой задачи нужен один ответственный.`,

      ja: `回路図に従い、散らばった電子部品をコントロールパネルに再組み立てし、電気系統を復旧させる。この作業には主担当者が一人必要だ。`,

      ko: `회로도에 따라 흩어진 전자 부품을 제어 패널에 다시 조립하여 전기 시스템을 복구하라. 이 작업에는 주 담당자가 한 명 필요하다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你的手已经伸过去了。

不是犹豫之后的决定——是你还没想好要不要做的时候，手已经拿起了第一块电路板。你翻过来看焊点的动作和 Marcus 刚才一模一样，但你没有注意到，因为你的注意力全在那张电路图上。

元件的排列方式有逻辑，连接点的布局有规律。你在心里已经开始规划装配顺序了——先电源模块，再信号通路，最后传感器接口。

Marcus 侧过头看了你一眼。他没有让开，而是往另一侧挪了一点。

那个动作的意思是：这块面板够大，容得下两个想做这件事的人。`,

        en: `Your hand is already reaching out.

Not a decision after deliberation — your hand picked up the first circuit board before your mind decided whether to do this. The way you flip it to check the solder joints is identical to what Marcus just did, but you don't notice, because your attention is locked on the circuit diagram.

The component layout has logic. The connection points follow a pattern. You're already planning the assembly sequence in your head — power module first, then signal paths, then sensor interfaces.

Marcus glances at you. He doesn't step aside — he shifts to the other end.

That gesture means: this panel is big enough for two people who want to do this.`,

        nl: `Je hand reikt al.

Geen beslissing na overleg — je hand pakte de eerste printplaat op voordat je hoofd had besloten of je dit wilde doen. De manier waarop je hem omdraait om de soldeerverbindingen te bekijken is identiek aan wat Marcus net deed, maar je merkt het niet, want je aandacht zit vast aan het schakelschema.

De componentenindeling heeft logica. De verbindingspunten volgen een patroon. In je hoofd plan je al de montagevolgorde — eerst de voedingsmodule, dan de signaalroutes, dan de sensoraansluitingen.

Marcus werpt je een blik toe. Hij gaat niet opzij — hij schuift naar het andere uiteinde.

Dat gebaar betekent: dit paneel is groot genoeg voor twee mensen die dit willen doen.`,

        de: `Deine Hand greift schon zu.

Keine Entscheidung nach reiflicher Überlegung — deine Hand hat die erste Platine aufgenommen, bevor dein Kopf entschieden hatte, ob du das willst. Wie du sie umdrehst, um die Lötstellen zu prüfen, ist identisch mit dem, was Marcus gerade getan hat, aber du merkst es nicht, weil deine Aufmerksamkeit auf dem Schaltplan liegt.

Die Bauteilanordnung hat Logik. Die Verbindungspunkte folgen einem Muster. Du planst im Kopf bereits die Montagereihenfolge — zuerst das Netzteilmodul, dann die Signalwege, dann die Sensorschnittstellen.

Marcus wirft dir einen Blick zu. Er tritt nicht zur Seite — er rückt ans andere Ende.

Diese Geste bedeutet: Dieses Panel ist groß genug für zwei Leute, die das machen wollen.`,

        fr: `Ta main s'avance déjà.

Pas une décision mûrement réfléchie — ta main a saisi la première carte de circuit avant que ton esprit ne décide si tu voulais le faire. La façon dont tu la retournes pour vérifier les points de soudure est identique à ce que Marcus vient de faire, mais tu ne le remarques pas, car ton attention est verrouillée sur le schéma.

La disposition des composants a une logique. Les points de connexion suivent un schéma. Tu planifies déjà la séquence d'assemblage dans ta tête — d'abord le module d'alimentation, puis les chemins de signal, puis les interfaces de capteurs.

Marcus te jette un coup d'œil. Il ne s'écarte pas — il se décale vers l'autre bout.

Ce geste signifie : ce panneau est assez grand pour deux personnes qui veulent le faire.`,

        es: `Tu mano ya se está extendiendo.

No es una decisión tras deliberar — tu mano tomó la primera placa de circuito antes de que tu mente decidiera si querías hacerlo. La forma en que la giras para revisar los puntos de soldadura es idéntica a lo que Marcus acaba de hacer, pero no lo notas, porque tu atención está fija en el diagrama del circuito.

La disposición de los componentes tiene lógica. Los puntos de conexión siguen un patrón. Ya estás planificando la secuencia de ensamblaje en tu cabeza — primero el módulo de alimentación, luego las rutas de señal, después las interfaces de sensores.

Marcus te mira de reojo. No se aparta — se desplaza al otro extremo.

Ese gesto significa: este panel es suficientemente grande para dos personas que quieren hacer esto.`,

        pt: `Sua mão já está se estendendo.

Não é uma decisão após deliberação — sua mão pegou a primeira placa de circuito antes de sua mente decidir se queria fazer isso. A forma como você a vira para verificar os pontos de solda é idêntica ao que Marcus acabou de fazer, mas você não percebe, porque sua atenção está presa no diagrama de circuito.

A disposição dos componentes tem lógica. Os pontos de conexão seguem um padrão. Você já está planejando a sequência de montagem na sua cabeça — primeiro o módulo de alimentação, depois os caminhos de sinal, depois as interfaces de sensores.

Marcus olha para você de relance. Ele não sai do lugar — se desloca para a outra ponta.

Esse gesto significa: este painel é grande o suficiente para duas pessoas que querem fazer isso.`,

        it: `La tua mano si sta già muovendo.

Non una decisione presa dopo averci riflettuto — la tua mano ha afferrato la prima scheda prima che la mente decidesse se volevi farlo. Il modo in cui la giri per controllare i punti di saldatura è identico a quello che Marcus ha appena fatto, ma non te ne accorgi, perché la tua attenzione è incollata allo schema circuitale.

La disposizione dei componenti ha una logica. I punti di connessione seguono uno schema. Stai già pianificando la sequenza di montaggio nella tua testa — prima il modulo di alimentazione, poi i percorsi del segnale, poi le interfacce dei sensori.

Marcus ti lancia un'occhiata. Non si fa da parte — si sposta all'altro capo.

Quel gesto significa: questo pannello è abbastanza grande per due persone che vogliono farlo.`,

        ru: `Твоя рука уже тянется.

Не решение после раздумий — рука взяла первую плату раньше, чем разум решил, хочешь ли ты это делать. То, как ты переворачиваешь её, проверяя точки пайки, в точности повторяет движения Маркуса, но ты не замечаешь этого — всё внимание приковано к принципиальной схеме.

Расположение компонентов подчинено логике. Точки соединения следуют закономерности. Ты уже выстраиваешь в голове порядок сборки — сначала модуль питания, потом сигнальные цепи, потом интерфейсы датчиков.

Маркус бросает на тебя взгляд. Он не отходит — сдвигается к другому краю.

Этот жест означает: эта панель достаточно велика для двоих, кто хочет этим заняться.`,

        ja: `もう手が伸びている。

熟考の末の決断ではない——やるかどうか頭が決める前に、手が最初の回路基板を拾い上げていた。はんだ接合部を確認するために裏返す仕草はマーカスとまったく同じだが、気づかない。注意は回路図に釘付けだから。

部品の配置には論理がある。接続点にはパターンがある。頭の中ではもう組み立て順序を計画している——まず電源モジュール、次に信号経路、そしてセンサーインターフェース。

マーカスがちらりとこちらを見る。場所を譲るのではなく、反対側にずれる。

その仕草の意味は——このパネルは、やりたい人間が二人いても十分な大きさだということ。`,

        ko: `손이 이미 뻗어 있다.

숙고 끝의 결정이 아니다 — 머리가 할지 말지 결정하기 전에 손이 먼저 첫 번째 회로 기판을 집어 들었다. 납땜 지점을 확인하려고 뒤집는 동작은 마커스가 방금 한 것과 똑같지만, 넌 알아채지 못한다. 시선은 회로도에 고정되어 있으니까.

부품 배치에는 논리가 있다. 연결 지점은 패턴을 따른다. 머릿속으로 이미 조립 순서를 계획하고 있다 — 먼저 전원 모듈, 그다음 신호 경로, 마지막으로 센서 인터페이스.

마커스가 슬쩍 쳐다본다. 비켜서는 게 아니라, 반대쪽 끝으로 자리를 옮긴다.

그 움직임의 의미는: 이 패널은 이걸 하고 싶은 두 사람이 함께할 만큼 충분히 크다는 것이다.`,
      },
      score4: {
        zh: `你走过去了，速度不快，但方向没有犹豫。

电路图展开在面板旁边，你扫了一遍，识别出了大致的结构——不算简单，但有章法。你拿起一块元件，和图上的位置对了一下，确认了对应关系。

组装这件事，你不抗拒。甚至有一点想动手的感觉——那种「可以搞定」的预感，不是百分之百的把握，但足够让你坐下来开始。

你拿起了焊接工具。Marcus 在另一侧，已经开始了。你们没有商量分工，但你自然地选了面板的另一半。`,

        en: `You walk over. Not fast, but your direction doesn't waver.

The circuit diagram is spread open beside the panel. You scan it once, picking up the general structure — not simple, but systematic. You pick up a component, match it against the diagram, confirm the correspondence.

Assembly is something you don't resist. There's even a slight itch to get your hands on it — that "I can handle this" hunch. Not complete certainty, but enough to make you sit down and start.

You pick up the soldering tool. Marcus is on the other side, already working. You didn't discuss division of labor, but you naturally chose the other half of the panel.`,

        nl: `Je loopt ernaartoe. Niet snel, maar je richting wankelt niet.

Het schakelschema ligt opengevouwen naast het paneel. Je scant het één keer en vangt de globale structuur op — niet simpel, maar systematisch. Je pakt een component op, vergelijkt het met het schema, bevestigt de overeenkomst.

Montage is iets waar je geen weerstand tegen voelt. Er is zelfs een lichte kriebel om eraan te beginnen — dat gevoel van "dit kan ik." Geen volledige zekerheid, maar genoeg om te gaan zitten en te beginnen.

Je pakt het soldeerapparaat. Marcus zit aan de andere kant, al aan het werk. Jullie hebben de taakverdeling niet besproken, maar je koos vanzelf de andere helft van het paneel.`,

        de: `Du gehst hinüber. Nicht schnell, aber deine Richtung schwankt nicht.

Der Schaltplan liegt aufgefaltet neben dem Panel. Du überfliegst ihn einmal und erfasst die Grundstruktur — nicht einfach, aber systematisch. Du nimmst ein Bauteil, vergleichst es mit dem Plan, bestätigst die Zuordnung.

Montage ist nichts, wogegen du dich sträubst. Da ist sogar ein leichtes Kribbeln, Hand anzulegen — dieses „Ich krieg das hin"-Gefühl. Keine absolute Sicherheit, aber genug, um dich hinzusetzen und anzufangen.

Du nimmst das Lötwerkzeug. Marcus ist auf der anderen Seite, arbeitet bereits. Ihr habt die Arbeitsteilung nicht besprochen, aber du hast ganz natürlich die andere Hälfte des Panels gewählt.`,

        fr: `Tu t'approches. Pas vite, mais ta direction ne vacille pas.

Le schéma est déplié à côté du panneau. Tu le parcours une fois, saisissant la structure générale — pas simple, mais méthodique. Tu prends un composant, le compares au schéma, confirmes la correspondance.

L'assemblage est quelque chose qui ne te rebute pas. Il y a même une légère envie de mettre la main à la pâte — cette intuition du « je peux gérer ça ». Pas une certitude absolue, mais suffisante pour t'asseoir et commencer.

Tu prends le fer à souder. Marcus est de l'autre côté, déjà au travail. Vous n'avez pas discuté de la répartition des tâches, mais tu as naturellement choisi l'autre moitié du panneau.`,

        es: `Caminas hacia allí. No rápido, pero sin vacilar en la dirección.

El diagrama de circuito está desplegado junto al panel. Lo recorres con la vista una vez y captas la estructura general — no es simple, pero es sistemático. Tomas un componente, lo comparas con el diagrama, confirmas la correspondencia.

El ensamblaje es algo que no te genera rechazo. Incluso hay un leve impulso de poner manos a la obra — esa corazonada de "puedo con esto". No es certeza total, pero basta para sentarte y empezar.

Tomas el soldador. Marcus está al otro lado, ya trabajando. No discutieron la división del trabajo, pero elegiste naturalmente la otra mitad del panel.`,

        pt: `Você se aproxima. Não rápido, mas sem hesitar na direção.

O diagrama de circuito está aberto ao lado do painel. Você o percorre uma vez e capta a estrutura geral — não é simples, mas é sistemático. Pega um componente, compara com o diagrama, confirma a correspondência.

Montagem é algo que você não resiste. Há até uma leve coceira para colocar a mão na massa — aquele pressentimento de "eu dou conta". Não é certeza total, mas o suficiente para sentar e começar.

Você pega a ferramenta de solda. Marcus está do outro lado, já trabalhando. Vocês não discutiram divisão de trabalho, mas você naturalmente escolheu a outra metade do painel.`,

        it: `Ti avvicini. Non veloce, ma senza esitare nella direzione.

Lo schema circuitale è aperto accanto al pannello. Lo scorri una volta, cogliendo la struttura generale — non semplice, ma sistematica. Prendi un componente, lo confronti con lo schema, confermi la corrispondenza.

L'assemblaggio è qualcosa che non ti respinge. C'è persino un leggero prurito di metterci le mani — quell'intuizione del "ce la posso fare". Non certezza assoluta, ma sufficiente per sederti e cominciare.

Prendi il saldatore. Marcus è dall'altra parte, già al lavoro. Non avete discusso la divisione dei compiti, ma hai scelto naturalmente l'altra metà del pannello.`,

        ru: `Ты подходишь. Не быстро, но направление не колеблется.

Принципиальная схема разложена рядом с панелью. Ты пробегаешь её взглядом и схватываешь общую структуру — не простая, но системная. Берёшь компонент, сверяешь со схемой, подтверждаешь соответствие.

Сборка — это то, чему ты не сопротивляешься. Есть даже лёгкий зуд взяться — ощущение «я справлюсь». Не полная уверенность, но достаточно, чтобы сесть и начать.

Ты берёшь паяльник. Маркус на другой стороне, уже работает. Вы не обсуждали разделение задач, но ты естественным образом выбрал вторую половину панели.`,

        ja: `歩み寄る。速くはないが、方向に迷いはない。

回路図がパネルの横に広げられている。一度目を通し、全体の構造を把握する——単純ではないが、体系的だ。部品を一つ手に取り、図面と照合し、対応を確認する。

組み立てに抵抗はない。むしろ少し手を動かしたくなる——「これはやれる」という予感。確信とまではいかないが、座って始めるには十分だ。

はんだ付け道具を手に取る。マーカスは反対側でもう作業を始めている。分担を相談したわけではないが、自然とパネルのもう半分を選んだ。`,

        ko: `다가간다. 빠르지는 않지만, 방향에 망설임이 없다.

회로도가 패널 옆에 펼쳐져 있다. 한 번 훑어보며 전체 구조를 파악한다 — 단순하지는 않지만 체계적이다. 부품 하나를 집어 도면과 대조하고 대응 관계를 확인한다.

조립은 거부감이 드는 일이 아니다. 오히려 약간 손이 근질거린다 — "이건 할 수 있어"라는 직감. 완전한 확신은 아니지만, 앉아서 시작하기엔 충분하다.

납땜 도구를 집는다. 마커스는 반대편에서 이미 작업 중이다. 역할 분담을 의논하지 않았지만, 자연스럽게 패널의 나머지 반쪽을 선택했다.`,
      },
      score3: {
        zh: `你在面板旁边站了一会儿。

那张电路图你看了，能看懂大致的逻辑。元件的排列有意思，但还没有意思到让你想蹲下来。

你环顾了一下机械室的其他部分。进度环上还有四个未亮的段——后面还有四项任务。也许后面有一项更适合你。

Marcus 已经在装了。你看了他几秒，然后把视线收回来。

不是退缩，只是这一题没有特别呼唤你。你把这种感觉记住了。`,

        en: `You stand near the panel for a while.

You looked at the circuit diagram. You can read the general logic. The component arrangement is interesting, but not interesting enough to make you crouch down.

You glance around the rest of the machine room. The progress ring still has four unlit segments — four more tasks ahead. Maybe one of them suits you better.

Marcus is already assembling. You watch him for a few seconds, then look away.

Not retreat — just this particular task didn't call to you. You note the feeling.`,

        nl: `Je staat een tijdje bij het paneel.

Je hebt het schakelschema bekeken. Je kunt de globale logica lezen. De componentenrangschikking is interessant, maar niet interessant genoeg om je te laten hurken.

Je kijkt rond in de rest van de machinekamer. De voortgangsring heeft nog vier onverlichte segmenten — vier taken te gaan. Misschien past een ervan beter bij je.

Marcus is al aan het monteren. Je kijkt een paar seconden naar hem en wendt dan je blik af.

Geen terugtrekking — alleen deze specifieke taak riep je niet. Je noteert het gevoel.`,

        de: `Du stehst eine Weile am Panel.

Du hast dir den Schaltplan angesehen. Die allgemeine Logik kannst du lesen. Die Bauteilanordnung ist interessant, aber nicht interessant genug, um dich in die Hocke gehen zu lassen.

Du schaust dich im Rest des Maschinenraums um. Am Fortschrittsring sind noch vier Segmente dunkel — vier Aufgaben liegen vor dir. Vielleicht passt eine davon besser zu dir.

Marcus montiert schon. Du beobachtest ihn ein paar Sekunden, dann wendest du den Blick ab.

Kein Rückzug — nur diese bestimmte Aufgabe hat dich nicht angesprochen. Du merkst dir das Gefühl.`,

        fr: `Tu restes près du panneau un moment.

Tu as regardé le schéma de circuit. Tu peux en lire la logique générale. La disposition des composants est intéressante, mais pas assez pour te faire accroupir.

Tu jettes un coup d'œil au reste de la salle des machines. L'anneau de progression a encore quatre segments éteints — quatre tâches à venir. Peut-être que l'une d'elles te conviendra mieux.

Marcus est déjà en train d'assembler. Tu le regardes quelques secondes, puis tu détournes les yeux.

Pas un recul — simplement cette tâche précise ne t'a pas appelé. Tu notes le ressenti.`,

        es: `Te quedas cerca del panel un rato.

Miraste el diagrama del circuito. Puedes leer la lógica general. La disposición de los componentes es interesante, pero no lo suficiente como para hacerte agachar.

Miras alrededor del resto de la sala de máquinas. El anillo de progreso aún tiene cuatro segmentos apagados — cuatro tareas más por delante. Quizás una de ellas te convenga más.

Marcus ya está ensamblando. Lo observas unos segundos y luego apartas la mirada.

No es retroceso — simplemente esta tarea en particular no te llamó. Tomas nota de la sensación.`,

        pt: `Você fica perto do painel por um tempo.

Olhou o diagrama de circuito. Consegue ler a lógica geral. A disposição dos componentes é interessante, mas não interessante o bastante para te fazer agachar.

Olha ao redor do resto da sala de máquinas. O anel de progresso ainda tem quatro segmentos apagados — mais quatro tarefas pela frente. Talvez uma delas combine mais com você.

Marcus já está montando. Você o observa por alguns segundos e depois desvia o olhar.

Não é recuo — apenas esta tarefa específica não chamou você. Você registra a sensação.`,

        it: `Resti vicino al pannello per un po'.

Hai guardato lo schema circuitale. Riesci a leggerne la logica generale. La disposizione dei componenti è interessante, ma non abbastanza da farti accovacciare.

Dai un'occhiata al resto della sala macchine. L'anello di progresso ha ancora quattro segmenti spenti — quattro compiti da affrontare. Forse uno di quelli ti si addice di più.

Marcus sta già assemblando. Lo guardi per qualche secondo, poi distogli lo sguardo.

Non una ritirata — semplicemente questo compito specifico non ti ha chiamato. Registri la sensazione.`,

        ru: `Ты стоишь у панели какое-то время.

Ты посмотрел на принципиальную схему. Общую логику можешь прочесть. Расположение компонентов любопытно, но не настолько, чтобы присесть.

Оглядываешь остальную часть машинного зала. На кольце прогресса ещё четыре тёмных сегмента — впереди четыре задачи. Может, одна из них подойдёт тебе больше.

Маркус уже собирает. Ты смотришь на него несколько секунд, затем отводишь взгляд.

Не отступление — просто эта конкретная задача тебя не позвала. Ты запоминаешь это чувство.`,

        ja: `パネルのそばにしばらく立っている。

回路図は見た。大まかな論理は読み取れる。部品の配置は興味深いが、しゃがみ込むほどではない。

機械室の他の部分を見回す。進捗リングにはまだ四つの暗いセグメントがある——残りあと四つのタスク。そのうちの一つの方が自分に合っているかもしれない。

マーカスはもう組み立てている。数秒見つめてから、視線をそらした。

後退ではない——ただ、この特定のタスクが自分を呼ばなかった。その感覚を心に留めておく。`,

        ko: `패널 근처에 한동안 서 있는다.

회로도를 봤다. 대략적인 논리는 읽을 수 있다. 부품 배치가 흥미롭긴 하지만, 쪼그려 앉을 만큼은 아니다.

기계실의 나머지 부분을 둘러본다. 진행 링에는 아직 네 개의 꺼진 구간이 남아 있다 — 앞으로 네 가지 과제가 더 있다. 그중 하나가 더 잘 맞을지도 모른다.

마커스는 이미 조립하고 있다. 몇 초간 지켜보다가 시선을 거둔다.

후퇴가 아니다 — 단지 이 특정 과제가 나를 부르지 않았을 뿐이다. 그 느낌을 기억해 둔다.`,
      },
      score2: {
        zh: `你看了那些元件一眼，然后把视线移开了。

不是看不懂——电路图在那里，逻辑是清楚的。但那种想伸手的冲动没有来。焊接工具、电路板、连接线——它们是真实的物件，但和你之间有一段距离，你不打算假装这段距离不存在。

你退后一步，看了看房间的全貌。五个子系统，后面还有四个。

总有一个是你的。不是这个。`,

        en: `You glance at the components, then look away.

It's not that you can't understand — the circuit diagram is right there, the logic is clear. But the urge to reach out doesn't come. Soldering tools, circuit boards, wires — they're real objects, but there's a distance between them and you, and you're not going to pretend it doesn't exist.

You step back and take in the full room. Five subsystems. Four more ahead.

One of them will be yours. Not this one.`,

        nl: `Je werpt een blik op de componenten en kijkt dan weg.

Het is niet dat je het niet begrijpt — het schakelschema ligt er, de logica is helder. Maar de drang om je hand uit te steken komt niet. Soldeerspullen, printplaten, draden — het zijn echte voorwerpen, maar er zit afstand tussen hen en jou, en je gaat niet doen alsof die er niet is.

Je doet een stap terug en overziet de hele ruimte. Vijf subsystemen. Nog vier te gaan.

Eentje wordt de jouwe. Deze niet.`,

        de: `Du wirfst einen Blick auf die Bauteile und schaust dann weg.

Es ist nicht so, dass du es nicht verstehen könntest — der Schaltplan liegt da, die Logik ist klar. Aber der Drang, zuzugreifen, kommt nicht. Lötwerkzeug, Platinen, Kabel — reale Gegenstände, aber zwischen ihnen und dir liegt eine Distanz, und du wirst nicht so tun, als gäbe es sie nicht.

Du trittst zurück und nimmst den ganzen Raum in den Blick. Fünf Subsysteme. Vier weitere vor dir.

Eines davon wird deines sein. Dieses nicht.`,

        fr: `Tu jettes un œil aux composants, puis tu détournes le regard.

Ce n'est pas que tu ne comprends pas — le schéma est là, la logique est claire. Mais l'envie de tendre la main ne vient pas. Fer à souder, cartes de circuit, fils — ce sont des objets réels, mais il y a une distance entre eux et toi, et tu ne vas pas prétendre qu'elle n'existe pas.

Tu recules d'un pas et embrasses la pièce du regard. Cinq sous-systèmes. Quatre encore à venir.

L'un d'eux sera le tien. Pas celui-ci.`,

        es: `Echas un vistazo a los componentes y luego apartas la mirada.

No es que no puedas entender — el diagrama está ahí, la lógica es clara. Pero el impulso de alargar la mano no llega. Soldador, placas de circuito, cables — son objetos reales, pero hay una distancia entre ellos y tú, y no vas a fingir que no existe.

Retrocedes un paso y abarcas toda la sala. Cinco subsistemas. Cuatro más por delante.

Uno de ellos será el tuyo. Este no.`,

        pt: `Você olha para os componentes e depois desvia o olhar.

Não é que não consiga entender — o diagrama está ali, a lógica é clara. Mas o impulso de estender a mão não vem. Ferramentas de solda, placas de circuito, fios — são objetos reais, mas há uma distância entre eles e você, e você não vai fingir que ela não existe.

Dá um passo atrás e observa a sala inteira. Cinco subsistemas. Mais quatro pela frente.

Um deles será o seu. Este não.`,

        it: `Dai un'occhiata ai componenti, poi distogli lo sguardo.

Non è che non capisci — lo schema è lì, la logica è chiara. Ma lo stimolo di allungare la mano non arriva. Saldatore, schede, cavi — sono oggetti reali, ma tra loro e te c'è una distanza, e non hai intenzione di fingere che non esista.

Fai un passo indietro e abbracci l'intera stanza con lo sguardo. Cinque sottosistemi. Ancora quattro da affrontare.

Uno di essi sarà il tuo. Non questo.`,

        ru: `Ты бросаешь взгляд на компоненты, затем отводишь глаза.

Не то чтобы ты не понимаешь — схема перед тобой, логика ясна. Но порыва протянуть руку нет. Паяльник, платы, провода — реальные предметы, но между ними и тобой есть дистанция, и ты не собираешься делать вид, что её нет.

Ты отступаешь на шаг и охватываешь взглядом всю комнату. Пять подсистем. Ещё четыре впереди.

Одна из них будет твоей. Не эта.`,

        ja: `部品にちらりと目をやり、そして視線をそらす。

理解できないわけではない——回路図はそこにあり、論理は明確だ。だが、手を伸ばしたいという衝動が来ない。はんだ付け道具、回路基板、配線——実在する物体だが、それらと自分の間には距離があり、その距離がないふりをするつもりはない。

一歩下がって、部屋全体を見渡す。五つのサブシステム。あと四つ。

そのうちの一つが自分のものになる。これではない。`,

        ko: `부품들을 흘끗 보고 시선을 돌린다.

이해하지 못하는 게 아니다 — 회로도가 거기 있고, 논리는 명확하다. 하지만 손을 뻗고 싶은 충동이 오지 않는다. 납땜 도구, 회로 기판, 전선 — 실재하는 물건들이지만, 그것들과 나 사이에는 거리가 있고, 그 거리가 없는 척할 생각은 없다.

한 걸음 물러서서 방 전체를 바라본다. 다섯 개의 하위 시스템. 앞으로 네 개가 더 남았다.

그중 하나가 내 것이 될 것이다. 이건 아니다.`,
      },
      score1: {
        zh: `你退后了一步。不是一大步，只是身体自然地离那张工作台远了一点。

电路板、焊点、连接线——你知道它们是什么，你知道有人会把它们装好。但那个人不是你。这种事情没有在你身上引起任何想动手的反应，你不打算为了礼貌或者参与感去假装有。

Marcus 蹲下了，手指已经在元件上了。

你站在后面，看着他开始工作。不是旁观——是确认。确认这件事有人在做，确认你的位置不在这里，确认这种诚实没有什么需要道歉的。

这个空间有五项任务。你在等属于你的那一项。`,

        en: `You take a step back. Not a big step — just your body naturally drifting away from the workbench.

Circuit boards, solder joints, wires — you know what they are, and you know someone will put them together. But that someone isn't you. This kind of work doesn't trigger any desire to act, and you're not going to fake it for the sake of politeness or team spirit.

Marcus is crouching down, fingers already on the components.

You stand behind, watching him begin. Not spectating — confirming. Confirming that this task has someone on it, confirming your place isn't here, confirming this kind of honesty doesn't need an apology.

This space has five tasks. You're waiting for the one that's yours.`,

        nl: `Je doet een stap terug. Geen grote stap — je lichaam drijft gewoon vanzelf weg van de werkbank.

Printplaten, soldeerverbindingen, draden — je weet wat het is, en je weet dat iemand ze in elkaar zet. Maar die iemand ben jij niet. Dit soort werk roept geen enkele drang op om te handelen, en je gaat het niet veinzen uit beleefdheid of teamgeest.

Marcus hurkt al neer, zijn vingers op de componenten.

Je staat erachter en kijkt hoe hij begint. Niet toeschouwer — bevestiger. Bevestigen dat deze taak iemand heeft, bevestigen dat jouw plek niet hier is, bevestigen dat dit soort eerlijkheid geen excuus nodig heeft.

Deze ruimte heeft vijf taken. Je wacht op degene die van jou is.`,

        de: `Du machst einen Schritt zurück. Keinen großen Schritt — nur dein Körper, der sich ganz natürlich von der Werkbank entfernt.

Platinen, Lötstellen, Kabel — du weißt, was das ist, und du weißt, dass jemand sie zusammenbauen wird. Aber dieser Jemand bist nicht du. Diese Art Arbeit löst keinen Handlungsdrang aus, und du wirst es nicht aus Höflichkeit oder Teamgeist vortäuschen.

Marcus ist schon in der Hocke, Finger bereits auf den Bauteilen.

Du stehst dahinter und siehst zu, wie er beginnt. Nicht zuschauen — bestätigen. Bestätigen, dass sich jemand um diese Aufgabe kümmert, bestätigen, dass dein Platz nicht hier ist, bestätigen, dass diese Art von Ehrlichkeit keine Entschuldigung braucht.

Dieser Raum hat fünf Aufgaben. Du wartest auf die, die dir gehört.`,

        fr: `Tu fais un pas en arrière. Pas un grand pas — juste ton corps qui s'éloigne naturellement de l'établi.

Cartes de circuit, points de soudure, fils — tu sais ce que c'est, et tu sais que quelqu'un les assemblera. Mais ce quelqu'un n'est pas toi. Ce type de travail ne déclenche aucune envie d'agir, et tu ne vas pas faire semblant par politesse ou esprit d'équipe.

Marcus est accroupi, les doigts déjà sur les composants.

Tu te tiens derrière, le regardant commencer. Pas en spectateur — en confirmant. Confirmer que cette tâche a quelqu'un dessus, confirmer que ta place n'est pas ici, confirmer que ce genre d'honnêteté n'a pas besoin d'excuses.

Cet espace a cinq tâches. Tu attends celle qui est la tienne.`,

        es: `Das un paso atrás. No un gran paso — solo tu cuerpo alejándose naturalmente del banco de trabajo.

Placas de circuito, puntos de soldadura, cables — sabes lo que son, y sabes que alguien los ensamblará. Pero ese alguien no eres tú. Este tipo de trabajo no despierta ningún deseo de actuar, y no vas a fingir que sí por cortesía o espíritu de equipo.

Marcus se agacha, los dedos ya sobre los componentes.

Te quedas atrás, observándolo empezar. No como espectador — como confirmación. Confirmar que esta tarea tiene a alguien, confirmar que tu lugar no está aquí, confirmar que este tipo de honestidad no necesita disculpas.

Este espacio tiene cinco tareas. Estás esperando la que sea tuya.`,

        pt: `Você dá um passo para trás. Não um grande passo — apenas seu corpo se afastando naturalmente da bancada.

Placas de circuito, pontos de solda, fios — você sabe o que são, e sabe que alguém vai montá-los. Mas esse alguém não é você. Esse tipo de trabalho não desperta nenhum desejo de agir, e você não vai fingir que sim por educação ou espírito de equipe.

Marcus se agacha, dedos já sobre os componentes.

Você fica atrás, observando-o começar. Não como espectador — como confirmação. Confirmar que essa tarefa tem alguém nela, confirmar que seu lugar não é aqui, confirmar que esse tipo de honestidade não precisa de desculpas.

Este espaço tem cinco tarefas. Você está esperando a que é sua.`,

        it: `Fai un passo indietro. Non un gran passo — solo il tuo corpo che si allontana naturalmente dal banco da lavoro.

Schede, punti di saldatura, cavi — sai cosa sono, e sai che qualcuno li assemblerà. Ma quel qualcuno non sei tu. Questo tipo di lavoro non attiva alcun desiderio di agire, e non hai intenzione di fingere per cortesia o spirito di squadra.

Marcus è già accovacciato, le dita sui componenti.

Stai dietro, guardandolo iniziare. Non da spettatore — da conferma. Confermare che qualcuno si occupa di questo compito, confermare che il tuo posto non è qui, confermare che questo tipo di onestà non ha bisogno di scuse.

Questo spazio ha cinque compiti. Stai aspettando quello che è tuo.`,

        ru: `Ты делаешь шаг назад. Не большой шаг — просто тело естественно отодвигается от рабочего стола.

Печатные платы, точки пайки, провода — ты знаешь, что это, и знаешь, что кто-то их соберёт. Но этот кто-то — не ты. Такая работа не вызывает никакого желания действовать, и ты не собираешься притворяться ради вежливости или командного духа.

Маркус уже присел, пальцы на компонентах.

Ты стоишь позади, наблюдая, как он начинает. Не наблюдение — подтверждение. Подтверждение, что за эту задачу кто-то взялся, подтверждение, что твоё место не здесь, подтверждение, что такая честность не требует извинений.

В этом пространстве пять задач. Ты ждёшь ту, что принадлежит тебе.`,

        ja: `一歩後ろに下がる。大きな一歩ではない——ただ体が自然と作業台から離れただけだ。

回路基板、はんだ接合部、配線——それが何かは分かっているし、誰かがそれを組み立てることも分かっている。だがその誰かは自分ではない。この種の作業は行動したいという欲求を一切引き起こさないし、礼儀やチームワークのためにそのふりをするつもりもない。

マーカスはもうしゃがんでいる。指はすでに部品の上だ。

後ろに立ち、彼が始めるのを見ている。傍観ではない——確認だ。この作業には担当者がいることの確認。自分の居場所はここではないという確認。この種の正直さに謝罪は不要だという確認。

この空間には五つのタスクがある。自分のものを待っている。`,

        ko: `한 걸음 물러선다. 큰 걸음이 아니라 — 몸이 자연스럽게 작업대에서 멀어지는 것이다.

회로 기판, 납땜 지점, 전선 — 그것들이 뭔지 알고, 누군가 조립할 거라는 것도 안다. 하지만 그 누군가는 내가 아니다. 이런 종류의 일은 행동하고 싶은 욕구를 전혀 일으키지 않으며, 예의나 팀워크를 위해 그런 척할 생각도 없다.

마커스가 이미 쪼그려 앉아 있다. 손가락이 부품 위에 있다.

뒤에 서서 그가 시작하는 것을 지켜본다. 구경이 아니다 — 확인이다. 이 과제에 누군가 있다는 확인. 내 자리가 여기가 아니라는 확인. 이런 솔직함에는 사과가 필요 없다는 확인.

이 공간에는 다섯 가지 과제가 있다. 나의 것을 기다리고 있다.`,
      },
    },
  },

  // ── Q2: Repair household appliances ────────────────────────
  {
    id: 2,
    riasec: "R",
    miniIpCode: "R2",
    miniIpItem: "Repair household appliances",
    chapter: "mechanical",
    chapterIndex: 1,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `控制面板恢复供电后，机械室亮了起来——但只亮了一半。

进度环的第一段亮了。房间深处几台设备开始运转，但其中一台发出不对劲的声音：嗡嗡声里夹着一种金属摩擦的刺耳频率，然后整台设备停了。

屏幕更新：「子系统二：设备运行。状态：1台故障。需要维修。」

Adrian 皱眉：「有人懂修这个吗？」

Marcus 已经在走过去了。他蹲下来看了一眼，回头说了今天最长的一句话：「电机烧了。可以换，但得先把外壳拆开。」

工具台上有各种维修工具——螺丝刀、万用表、备用电机零件。Marcus 一个人能搞定，但如果有人想一起修，也有得做。`,

      en: `After the control panel comes back online, the machine room lights up — but only halfway.

The first segment of the progress ring glows. In the far end, several machines start running, but one makes a wrong sound: a hum laced with a metallic grinding frequency, then the whole unit stops.

The screen updates: "Subsystem two: Equipment Operation. Status: 1 unit failed. Repair needed."

Adrian frowns: "Anyone know how to fix this?"

Marcus is already walking over. He crouches, takes one look, and delivers the longest sentence he's said all day: "Motor's burned out. Can be replaced, but the casing needs to come off first."

The tool bench has everything — screwdrivers, multimeter, spare motor parts. Marcus can handle it alone, but there's room for a second pair of hands.`,

      nl: `Nadat het bedieningspaneel weer online komt, licht de machinekamer op — maar slechts half.

Het eerste segment van de voortgangsring gloeit op. Achterin beginnen meerdere machines te draaien, maar eentje maakt een verkeerd geluid: een zoemen doorspekt met een metaalachtig schurend geluid, waarna het hele apparaat stopt.

Het scherm wordt bijgewerkt: "Subsysteem twee: Apparatuurbeheer. Status: 1 apparaat defect. Reparatie nodig."

Adrian fronst: "Weet iemand hoe je dit repareert?"

Marcus loopt er al naartoe. Hij hurkt, werpt één blik en levert de langste zin van de dag: "Motor is doorgebrand. Kan vervangen worden, maar de behuizing moet er eerst af."

De werkbank heeft alles — schroevendraaiers, een multimeter, reserve motoronderdelen. Marcus kan het alleen af, maar er is ruimte voor een extra paar handen.`,

      de: `Nachdem das Bedienfeld wieder online ist, leuchtet der Maschinenraum auf — aber nur zur Hälfte.

Das erste Segment des Fortschrittsrings glüht. Am hinteren Ende beginnen mehrere Maschinen zu laufen, doch eine macht ein falsches Geräusch: ein Brummen, durchsetzt mit einer metallischen Schleiffrequenz, dann stoppt die ganze Einheit.

Der Bildschirm aktualisiert: „Subsystem zwei: Gerätebetrieb. Status: 1 Einheit ausgefallen. Reparatur erforderlich."

Adrian runzelt die Stirn: „Kann das jemand reparieren?"

Marcus ist schon auf dem Weg. Er geht in die Hocke, wirft einen Blick darauf und spricht den längsten Satz des Tages: „Motor durchgebrannt. Kann ausgetauscht werden, aber das Gehäuse muss erst ab."

Die Werkbank hat alles — Schraubenzieher, ein Multimeter, Ersatz-Motorteile. Marcus schafft es allein, aber es ist Platz für ein zweites Paar Hände.`,

      fr: `Quand le panneau de contrôle revient en ligne, la salle des machines s'illumine — mais seulement à moitié.

Le premier segment de l'anneau de progression s'allume. Au fond, plusieurs machines démarrent, mais l'une d'elles émet un bruit anormal : un bourdonnement mêlé d'une fréquence métallique grinçante, puis l'unité entière s'arrête.

L'écran se met à jour : « Sous-système deux : Fonctionnement des équipements. Statut : 1 unité en panne. Réparation nécessaire. »

Adrian fronce les sourcils : « Quelqu'un sait comment réparer ça ? »

Marcus est déjà en chemin. Il s'accroupit, jette un œil et prononce la plus longue phrase de la journée : « Le moteur a grillé. On peut le remplacer, mais il faut d'abord retirer le carter. »

L'établi a tout — tournevis, multimètre, pièces de moteur de rechange. Marcus peut s'en charger seul, mais il y a de la place pour une deuxième paire de mains.`,

      es: `Cuando el panel de control vuelve a funcionar, la sala de máquinas se ilumina — pero solo a medias.

El primer segmento del anillo de progreso se enciende. Al fondo, varias máquinas comienzan a funcionar, pero una emite un sonido extraño: un zumbido mezclado con una frecuencia de chirrido metálico, y luego toda la unidad se detiene.

La pantalla se actualiza: "Subsistema dos: Operación de Equipos. Estado: 1 unidad fallida. Se necesita reparación."

Adrian frunce el ceño: "¿Alguien sabe cómo arreglar esto?"

Marcus ya está caminando hacia allá. Se agacha, echa un vistazo y pronuncia la frase más larga del día: "El motor se quemó. Se puede reemplazar, pero primero hay que quitar la carcasa."

El banco de herramientas tiene todo — destornilladores, un multímetro, piezas de motor de repuesto. Marcus puede hacerlo solo, pero hay espacio para un segundo par de manos.`,

      pt: `Quando o painel de controle volta a funcionar, a sala de máquinas se ilumina — mas apenas pela metade.

O primeiro segmento do anel de progresso acende. Ao fundo, várias máquinas começam a funcionar, mas uma emite um som errado: um zumbido misturado com uma frequência metálica rangente, e então a unidade inteira para.

A tela atualiza: "Subsistema dois: Operação de Equipamentos. Status: 1 unidade com falha. Reparo necessário."

Adrian franze a testa: "Alguém sabe consertar isso?"

Marcus já está indo. Se agacha, dá uma olhada e profere a frase mais longa do dia: "Motor queimou. Pode ser trocado, mas a carcaça precisa sair primeiro."

A bancada tem tudo — chaves de fenda, um multímetro, peças sobressalentes de motor. Marcus consegue sozinho, mas há espaço para um segundo par de mãos.`,

      it: `Quando il pannello di controllo torna in funzione, la sala macchine si illumina — ma solo a metà.

Il primo segmento dell'anello di progresso si accende. In fondo alla sala, diverse macchine iniziano a funzionare, ma una emette un suono sbagliato: un ronzio intrecciato con una frequenza metallica stridula, poi l'intera unità si ferma.

Lo schermo si aggiorna: "Sottosistema due: Funzionamento Apparecchiature. Stato: 1 unità guasta. Riparazione necessaria."

Adrian aggrotta le sopracciglia: "Qualcuno sa come ripararlo?"

Marcus si sta già avvicinando. Si accovaccia, dà un'occhiata e pronuncia la frase più lunga della giornata: "Motore bruciato. Si può sostituire, ma prima bisogna togliere il carter."

Il banco degli attrezzi ha tutto — cacciaviti, un multimetro, pezzi di ricambio del motore. Marcus può farcela da solo, ma c'è spazio per un secondo paio di mani.`,

      ru: `После восстановления панели управления машинный зал освещается — но лишь наполовину.

Первый сегмент кольца прогресса загорается. В дальнем конце несколько машин запускаются, но одна издаёт неправильный звук: гул, перемежающийся с металлическим скрежетом, а затем вся установка останавливается.

Экран обновляется: «Подсистема два: Работа оборудования. Статус: 1 единица вышла из строя. Требуется ремонт.»

Адриан хмурится: «Кто-нибудь умеет это чинить?»

Маркус уже идёт туда. Приседает, бросает один взгляд и произносит самую длинную фразу за день: «Мотор сгорел. Можно заменить, но сначала нужно снять корпус.»

На рабочем столе есть всё — отвёртки, мультиметр, запасные детали мотора. Маркус справится один, но для второй пары рук место найдётся.`,

      ja: `制御パネルが復旧すると、機械室が明るくなった——だが半分だけ。

進捗リングの最初のセグメントが点灯する。奥の方で数台の機械が動き始めるが、一台が異音を発した——低い唸りに金属の擦れるような耳障りな周波数が混じり、そして装置全体が停止した。

画面が更新される：「サブシステム2：設備稼働。ステータス：1台故障。修理が必要。」

エイドリアンが眉をひそめる：「誰か直せる人いる？」

マーカスはもう歩き出している。しゃがみ込み、一目見て、今日一番長い文を口にした：「モーターが焼けた。交換はできるが、まず外装を外す必要がある。」

工具台にはすべて揃っている——ドライバー、マルチメーター、予備のモーター部品。マーカス一人でもやれるが、もう一人分の余地はある。`,

      ko: `제어 패널이 복구되자 기계실에 불이 켜졌다 — 하지만 절반만.

진행 링의 첫 번째 구간이 빛난다. 방 안쪽에서 몇 대의 기계가 작동하기 시작하지만, 한 대가 이상한 소리를 낸다: 윙윙거림에 금속이 마찰하는 날카로운 주파수가 섞이더니, 장치 전체가 멈춰 버렸다.

화면이 갱신된다: "서브시스템 2: 장비 운영. 상태: 1대 고장. 수리 필요."

에이드리언이 미간을 찌푸린다: "이거 고칠 줄 아는 사람 있어?"

마커스는 이미 걸어가고 있다. 쪼그려 앉아 한 번 살피고는, 오늘 중 가장 긴 문장을 내뱉는다: "모터가 탔어. 교체할 수 있지만, 먼저 외부 케이싱을 벗겨야 해."

공구대에는 모든 게 있다 — 드라이버, 멀티미터, 예비 모터 부품. 마커스 혼자서도 해결할 수 있지만, 두 번째 손이 들어갈 자리는 있다.`,
    },
    taskDescription: {
      zh: "诊断设备的故障原因，使用工具维修这台损坏的设备，使其恢复正常运转。这项任务需要一个主要负责人。",

      en: `Diagnose the equipment failure, use the available tools to repair the damaged machine and restore it to working order. This task needs one primary person.`,

      nl: `Stel de oorzaak van de storing vast, gebruik het beschikbare gereedschap om de beschadigde machine te repareren en weer werkend te krijgen. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Diagnostiziere den Geräteausfall, nutze die verfügbaren Werkzeuge, um die beschädigte Maschine zu reparieren und wieder in Betrieb zu nehmen. Diese Aufgabe braucht eine hauptverantwortliche Person.`,

      fr: `Diagnostiquez la panne de l'équipement, utilisez les outils disponibles pour réparer la machine endommagée et la remettre en état de marche. Cette tâche nécessite un responsable principal.`,

      es: `Diagnostica la falla del equipo, usa las herramientas disponibles para reparar la máquina dañada y restaurar su funcionamiento. Esta tarea necesita un responsable principal.`,

      pt: `Diagnostique a falha do equipamento, use as ferramentas disponíveis para reparar a máquina danificada e restaurar seu funcionamento. Esta tarefa precisa de um responsável principal.`,

      it: `Diagnostica il guasto dell'apparecchiatura, usa gli strumenti disponibili per riparare la macchina danneggiata e ripristinarne il funzionamento. Questo compito richiede un responsabile principale.`,

      ru: `Определите причину поломки, используйте имеющиеся инструменты для ремонта повреждённой машины и восстановления её работы. Для этой задачи нужен один ответственный.`,

      ja: `設備の故障原因を診断し、利用可能な工具を使って損傷した機械を修理し、正常な稼働状態に戻す。この作業には主担当者が一人必要だ。`,

      ko: `장비 고장 원인을 진단하고, 사용 가능한 도구로 손상된 기계를 수리하여 정상 작동 상태로 복구하라. 이 작업에는 주 담당자가 한 명 필요하다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `那声异响还在空气里的时候，你已经在走了。

不是因为没人动——是因为你比别人更快地感到那种东西：某个部件出了问题，而你想知道是哪里，想亲手把它弄好。

Marcus 看见你走过来，让开了一点。两个人，一个故障，这就够了。

你拿起螺丝刀，开始拆外壳。金属摩擦的声音停了，但你脑子里已经在推测故障点了。`,

        en: `The abnormal sound is still hanging in the air when you're already moving.

Not because no one else is stepping up — because you felt it faster than anyone: something is broken, and you want to know what, and you want to fix it with your own hands.

Marcus sees you coming and shifts to make room. Two people, one fault. That's enough.

You pick up the screwdriver and start removing the casing. The grinding noise has stopped, but your mind is already mapping the failure point.`,

        nl: `Het abnormale geluid hangt nog in de lucht wanneer je al in beweging bent.

Niet omdat niemand anders in actie komt — omdat jij het sneller voelde dan wie dan ook: er is iets kapot, en je wilt weten wat, en je wilt het eigenhandig repareren.

Marcus ziet je aankomen en schuift opzij. Twee mensen, één storing. Dat is genoeg.

Je pakt de schroevendraaier en begint de behuizing te verwijderen. Het schurende geluid is gestopt, maar in je hoofd breng je het storingspunt al in kaart.`,

        de: `Das abnormale Geräusch hängt noch in der Luft, als du dich schon bewegst.

Nicht weil niemand sonst handelt — weil du es schneller gespürt hast als alle anderen: Etwas ist kaputt, und du willst wissen was, und du willst es eigenhändig reparieren.

Marcus sieht dich kommen und rückt zur Seite. Zwei Leute, ein Fehler. Das reicht.

Du nimmst den Schraubenzieher und fängst an, das Gehäuse abzunehmen. Das Schleifgeräusch hat aufgehört, aber dein Kopf kartiert bereits die Fehlerstelle.`,

        fr: `Le bruit anormal flotte encore dans l'air quand tu es déjà en mouvement.

Pas parce que personne d'autre ne réagit — parce que tu l'as senti plus vite que quiconque : quelque chose est cassé, et tu veux savoir quoi, et tu veux le réparer de tes propres mains.

Marcus te voit arriver et se décale pour faire de la place. Deux personnes, une panne. Ça suffit.

Tu saisis le tournevis et commences à retirer le carter. Le bruit de friction s'est arrêté, mais ton esprit cartographie déjà le point de défaillance.`,

        es: `El sonido anormal aún flota en el aire cuando ya te estás moviendo.

No porque nadie más actúe — porque lo sentiste más rápido que nadie: algo está roto, y quieres saber qué, y quieres arreglarlo con tus propias manos.

Marcus te ve acercarte y se mueve para hacer espacio. Dos personas, una falla. Eso basta.

Tomas el destornillador y comienzas a quitar la carcasa. El chirrido se detuvo, pero tu mente ya está mapeando el punto de falla.`,

        pt: `O som anormal ainda paira no ar quando você já está se movendo.

Não porque ninguém mais está agindo — porque você sentiu mais rápido que qualquer um: algo está quebrado, e você quer saber o quê, e quer consertar com suas próprias mãos.

Marcus vê você chegando e se desloca para abrir espaço. Duas pessoas, uma falha. É o suficiente.

Você pega a chave de fenda e começa a remover a carcaça. O ruído de fricção parou, mas sua mente já está mapeando o ponto de falha.`,

        it: `Il suono anomalo è ancora sospeso nell'aria quando ti stai già muovendo.

Non perché nessun altro si faccia avanti — perché l'hai percepito più velocemente di chiunque: qualcosa è rotto, vuoi sapere cosa, e vuoi ripararlo con le tue mani.

Marcus ti vede arrivare e si sposta per fare spazio. Due persone, un guasto. Basta così.

Prendi il cacciavite e inizi a rimuovere il carter. Il rumore di sfregamento si è fermato, ma la tua mente sta già mappando il punto di rottura.`,

        ru: `Аномальный звук ещё висит в воздухе, а ты уже двигаешься.

Не потому, что никто другой не реагирует — потому что ты почувствовал это быстрее всех: что-то сломано, и ты хочешь знать что, и хочешь починить это своими руками.

Маркус видит, что ты подходишь, и сдвигается, освобождая место. Двое людей, одна поломка. Этого достаточно.

Ты берёшь отвёртку и начинаешь снимать корпус. Скрежет прекратился, но в голове ты уже составляешь карту точки отказа.`,

        ja: `異音がまだ空気中に残っているとき、もう動き出している。

誰も動かないからではない——誰よりも早く感じ取ったからだ：何かが壊れている、何かを知りたい、自分の手で直したい。

マーカスがこちらを見て、場所を空ける。二人、一つの故障。それで十分だ。

ドライバーを手に取り、外装の取り外しを始める。摩擦音は止まったが、頭の中では故障箇所の特定がもう始まっている。`,

        ko: `이상한 소리가 아직 공기 중에 남아 있을 때, 이미 움직이고 있다.

다른 누구도 나서지 않아서가 아니다 — 누구보다 빨리 느꼈기 때문이다: 무언가 고장 났고, 뭔지 알고 싶고, 직접 손으로 고치고 싶다.

마커스가 다가오는 걸 보고 자리를 비켜 준다. 두 사람, 하나의 고장. 그걸로 충분하다.

드라이버를 집어 들고 케이싱 제거를 시작한다. 마찰음은 멈췄지만, 머릿속에서는 이미 고장 지점을 파악하고 있다.`,
      },
      score4: {
        zh: `你走过去，速度算不上快，但你没有犹豫。

你在旁边站了一秒，看了看那台停下来的设备，听 Marcus 说了电机的判断，觉得有点眉目。

维修这件事，你不抗拒。甚至有一点点想试试。

你蹲下来，Marcus 没有阻止你。你们开始一起拆外壳。`,

        en: `You walk over. Not the fastest, but you don't hesitate.

You stand beside the unit for a second, look at the stalled machine, hear Marcus's diagnosis about the motor, and something clicks.

Repair work — you don't resist it. There's even a slight pull to give it a try.

You crouch down. Marcus doesn't stop you. Together, you start removing the casing.`,

        nl: `Je loopt ernaartoe. Niet de snelste, maar je aarzelt niet.

Je staat een seconde naast het apparaat, kijkt naar de stilgevallen machine, hoort Marcus' diagnose over de motor, en er klikt iets.

Reparatiewerk — je verzet je er niet tegen. Er is zelfs een lichte aantrekkingskracht om het te proberen.

Je hurkt neer. Marcus houdt je niet tegen. Samen beginnen jullie de behuizing te verwijderen.`,

        de: `Du gehst hin. Nicht der Schnellste, aber du zögerst nicht.

Du stehst eine Sekunde neben der Einheit, schaust die stillstehende Maschine an, hörst Marcus' Diagnose zum Motor, und etwas macht klick.

Reparaturarbeit — du sträubst dich nicht dagegen. Da ist sogar ein leichter Sog, es zu versuchen.

Du gehst in die Hocke. Marcus hält dich nicht auf. Gemeinsam beginnt ihr, das Gehäuse zu entfernen.`,

        fr: `Tu t'approches. Pas le plus rapide, mais sans hésiter.

Tu te tiens une seconde à côté de l'appareil, tu regardes la machine en panne, tu entends le diagnostic de Marcus sur le moteur, et quelque chose fait tilt.

Le travail de réparation — tu ne le rejettes pas. Il y a même une légère envie d'essayer.

Tu t'accroupis. Marcus ne t'arrête pas. Ensemble, vous commencez à retirer le carter.`,

        es: `Caminas hacia allá. No eres el más rápido, pero no dudas.

Te paras un segundo junto a la unidad, miras la máquina detenida, escuchas el diagnóstico de Marcus sobre el motor, y algo encaja.

El trabajo de reparación — no te genera rechazo. Incluso hay un leve impulso de intentarlo.

Te agachas. Marcus no te detiene. Juntos, comienzan a quitar la carcasa.`,

        pt: `Você se aproxima. Não o mais rápido, mas sem hesitar.

Fica um segundo ao lado da unidade, olha para a máquina parada, ouve o diagnóstico de Marcus sobre o motor, e algo faz sentido.

Trabalho de reparo — não te gera resistência. Há até uma leve atração para tentar.

Você se agacha. Marcus não te impede. Juntos, começam a remover a carcaça.`,

        it: `Ti avvicini. Non il più veloce, ma senza esitare.

Resti un secondo accanto all'unità, guardi la macchina ferma, senti la diagnosi di Marcus sul motore, e qualcosa scatta.

Lavoro di riparazione — non lo rifiuti. C'è persino una leggera attrazione a provarci.

Ti accovacci. Marcus non ti ferma. Insieme, iniziate a rimuovere il carter.`,

        ru: `Ты подходишь. Не быстрее всех, но без колебаний.

Стоишь секунду рядом с установкой, смотришь на остановившуюся машину, слышишь диагноз Маркуса про мотор, и что-то щёлкает.

Ремонт — ты не противишься этому. Есть даже лёгкое притяжение попробовать.

Приседаешь. Маркус не останавливает. Вместе вы начинаете снимать корпус.`,

        ja: `歩み寄る。一番速いわけではないが、迷いはない。

装置の横に一秒立ち、止まった機械を見て、マーカスのモーターに関する診断を聞き、何かが腑に落ちる。

修理作業——抵抗はない。むしろ少しやってみたいという引力がある。

しゃがみ込む。マーカスは止めない。二人で外装の取り外しを始める。`,

        ko: `다가간다. 가장 빠르지는 않지만, 망설이지 않는다.

장치 옆에 1초간 서서, 멈춘 기계를 보고, 모터에 대한 마커스의 진단을 듣고, 무언가 맞아떨어진다.

수리 작업 — 거부감은 없다. 오히려 해보고 싶은 약간의 끌림이 있다.

쪼그려 앉는다. 마커스가 막지 않는다. 함께 케이싱을 벗기기 시작한다.`,
      },
      score3: {
        zh: `你看了那台装置一会儿。

异响是真实的，故障也是真实的，但你和它之间的关系……说不准。你没有主动走过去，但你也没有走开。

你就站在那里，看着，等待着，也许有什么会变得更清楚一点。

Marcus 已经蹲下去了。这台设备有人在处理。`,

        en: `You look at the machine for a while.

The abnormal sound was real. The failure is real. But the connection between you and it... uncertain. You don't walk over, but you don't walk away either.

You stand there, watching, waiting. Maybe something will become clearer.

Marcus is already crouched down. Someone's on it.`,

        nl: `Je kijkt een tijdje naar de machine.

Het abnormale geluid was echt. De storing is echt. Maar de verbinding tussen jou en dit... onzeker. Je loopt er niet naartoe, maar je loopt ook niet weg.

Je staat daar, kijkt, wacht. Misschien wordt iets duidelijker.

Marcus is al gehurkt. Iemand is ermee bezig.`,

        de: `Du betrachtest die Maschine eine Weile.

Das abnormale Geräusch war real. Der Defekt ist real. Aber die Verbindung zwischen dir und dem Ganzen... ungewiss. Du gehst nicht hin, aber du gehst auch nicht weg.

Du stehst da, schaust, wartest. Vielleicht wird etwas klarer.

Marcus ist schon in der Hocke. Jemand kümmert sich darum.`,

        fr: `Tu regardes la machine un moment.

Le bruit anormal était réel. La panne est réelle. Mais le lien entre toi et tout ça... incertain. Tu ne t'approches pas, mais tu ne t'éloignes pas non plus.

Tu restes là, à observer, à attendre. Peut-être que quelque chose deviendra plus clair.

Marcus est déjà accroupi. Quelqu'un s'en occupe.`,

        es: `Miras la máquina un rato.

El sonido anormal era real. La falla es real. Pero la conexión entre tú y esto... incierta. No te acercas, pero tampoco te alejas.

Te quedas ahí, observando, esperando. Tal vez algo se aclare.

Marcus ya está agachado. Alguien se está encargando.`,

        pt: `Você olha para a máquina por um tempo.

O som anormal era real. A falha é real. Mas a conexão entre você e isso... incerta. Você não se aproxima, mas também não se afasta.

Fica ali, observando, esperando. Talvez algo fique mais claro.

Marcus já está agachado. Alguém está cuidando disso.`,

        it: `Guardi la macchina per un po'.

Il suono anomalo era reale. Il guasto è reale. Ma la connessione tra te e tutto questo... incerta. Non ti avvicini, ma non te ne vai nemmeno.

Resti lì, a guardare, ad aspettare. Forse qualcosa diventerà più chiaro.

Marcus è già accovacciato. Qualcuno ci sta lavorando.`,

        ru: `Ты какое-то время смотришь на машину.

Аномальный звук был реальным. Поломка реальна. Но связь между тобой и всем этим... неопределённая. Ты не подходишь, но и не уходишь.

Стоишь, наблюдаешь, ждёшь. Может, что-то прояснится.

Маркус уже присел. Кто-то этим занимается.`,

        ja: `しばらく機械を見つめている。

異音は本物だった。故障も本物だ。だが、自分とこの装置との関係は……不確かだ。近づきもしないが、離れもしない。

そこに立って、見て、待っている。何かがもう少しはっきりするかもしれない。

マーカスはもうしゃがんでいる。誰かが対応している。`,

        ko: `한동안 기계를 바라본다.

이상한 소리는 진짜였다. 고장도 진짜다. 하지만 나와 이것 사이의 연결은... 불확실하다. 다가가지도, 물러서지도 않는다.

거기 서서, 지켜보고, 기다린다. 어쩌면 무언가 더 명확해질지도 모른다.

마커스는 이미 쪼그려 앉아 있다. 누군가 맡고 있다.`,
      },
      score2: {
        zh: `你看向声音的来源，确认了故障大概在哪里。然后你退了回来。

不是你做不到，只是那种「我来」的冲动没有出现。

你决定让更有动力的人去处理这件事——有时候知道自己不是那个人，也是一种判断。`,

        en: `You look toward the sound, roughly locate the failure. Then you step back.

Not that you couldn't do it — just that the "let me handle this" impulse didn't appear.

You decide to let someone more motivated take care of it. Sometimes knowing you're not the right person is its own form of judgment.`,

        nl: `Je kijkt in de richting van het geluid, lokaliseert de storing globaal. Dan doe je een stap terug.

Niet dat je het niet zou kunnen — alleen dat het "laat mij dit maar doen"-gevoel niet verscheen.

Je besluit het aan iemand met meer motivatie over te laten. Soms is weten dat jij niet de juiste persoon bent ook een vorm van oordeelsvermogen.`,

        de: `Du blickst in Richtung des Geräuschs, lokalisierst den Defekt ungefähr. Dann trittst du zurück.

Nicht dass du es nicht könntest — nur dass der Impuls „Lass mich das machen" nicht aufgetaucht ist.

Du überlässt es jemandem mit mehr Antrieb. Manchmal ist es auch ein Urteilsvermögen, zu wissen, dass man nicht die richtige Person ist.`,

        fr: `Tu regardes dans la direction du bruit, localises approximativement la panne. Puis tu recules.

Ce n'est pas que tu ne pourrais pas — c'est juste que l'impulsion « laissez-moi m'en charger » n'est pas apparue.

Tu décides de laisser quelqu'un de plus motivé s'en occuper. Parfois, savoir que tu n'es pas la bonne personne est déjà une forme de jugement.`,

        es: `Miras hacia el sonido, localizas aproximadamente la falla. Luego retrocedes.

No es que no pudieras — es que el impulso de "déjame encargarme" no apareció.

Decides dejar que alguien con más motivación se ocupe. A veces saber que no eres la persona adecuada es en sí una forma de juicio.`,

        pt: `Você olha na direção do som, localiza aproximadamente a falha. Depois recua.

Não é que não conseguiria — é que o impulso de "deixa comigo" não apareceu.

Decide deixar alguém mais motivado cuidar disso. Às vezes, saber que você não é a pessoa certa já é uma forma de discernimento.`,

        it: `Guardi nella direzione del suono, localizzi approssimativamente il guasto. Poi fai un passo indietro.

Non che non potresti — solo che l'impulso "lascia fare a me" non è comparso.

Decidi di lasciare che qualcuno più motivato se ne occupi. A volte sapere di non essere la persona giusta è già una forma di giudizio.`,

        ru: `Ты смотришь в направлении звука, примерно определяешь место поломки. Затем отступаешь.

Не то чтобы ты не смог — просто порыв «дай я сам» не появился.

Ты решаешь уступить тому, у кого больше мотивации. Иногда знать, что ты не тот человек — тоже своего рода суждение.`,

        ja: `音のする方を見て、おおよその故障箇所を特定する。そして一歩引く。

できないわけではない——ただ「自分がやる」という衝動が現れなかっただけだ。

もっとやる気のある人に任せることにする。自分が適任ではないと知ることも、一つの判断力だ。`,

        ko: `소리가 나는 쪽을 보며 대략적인 고장 위치를 파악한다. 그리고 물러선다.

할 수 없어서가 아니다 — 단지 "내가 하겠다"는 충동이 나타나지 않았을 뿐이다.

더 의욕이 있는 사람에게 맡기기로 한다. 자신이 적임자가 아님을 아는 것도 하나의 판단력이다.`,
      },
      score1: {
        zh: `那声异响让你的目光扫过去，确认没有危险。然后你收回了视线。

机械故障这件事，修好当然好，但那种想亲手去修的感觉，你身上没有。

Marcus 已经在那边了。这件事有人做，这就够了。`,

        en: `The grinding sound draws your glance — you confirm there's no danger. Then you look away.

Mechanical failure is something that should be fixed, sure. But the urge to fix it yourself doesn't exist in you.

Marcus is already over there. Someone's on it. That's enough.`,

        nl: `Het schurende geluid trekt je blik — je bevestigt dat er geen gevaar is. Dan kijk je weg.

Mechanische storingen moeten natuurlijk gerepareerd worden. Maar de drang om het zelf te doen bestaat niet in jou.

Marcus is al daar. Iemand doet het. Dat is genoeg.`,

        de: `Das Schleifgeräusch zieht deinen Blick an — du vergewisserst dich, dass keine Gefahr besteht. Dann schaust du weg.

Mechanische Defekte sollte man reparieren, klar. Aber der Drang, es selbst zu tun, existiert in dir nicht.

Marcus ist schon drüben. Jemand kümmert sich. Das reicht.`,

        fr: `Le bruit de friction attire ton regard — tu confirmes qu'il n'y a pas de danger. Puis tu détournes les yeux.

Une panne mécanique, ça doit être réparé, bien sûr. Mais l'envie de le faire toi-même n'existe pas en toi.

Marcus est déjà là-bas. Quelqu'un s'en occupe. Ça suffit.`,

        es: `El chirrido atrae tu mirada — confirmas que no hay peligro. Luego apartas la vista.

Una falla mecánica es algo que hay que reparar, claro. Pero el impulso de repararla tú mismo no existe en ti.

Marcus ya está allí. Alguien se está encargando. Eso basta.`,

        pt: `O som de fricção atrai seu olhar — você confirma que não há perigo. Depois desvia o olhar.

Uma falha mecânica é algo que precisa ser consertado, claro. Mas a vontade de consertar você mesmo não existe em você.

Marcus já está lá. Alguém está cuidando disso. Isso basta.`,

        it: `Il rumore di sfregamento attira il tuo sguardo — confermi che non c'è pericolo. Poi distogli lo sguardo.

Un guasto meccanico va riparato, certo. Ma lo stimolo di ripararlo tu stesso non esiste in te.

Marcus è già lì. Qualcuno ci sta lavorando. Basta così.`,

        ru: `Скрежет привлекает твой взгляд — ты убеждаешься, что опасности нет. Затем отводишь глаза.

Механическую поломку, конечно, нужно чинить. Но желания чинить её самому в тебе нет.

Маркус уже там. Кто-то этим занимается. Этого достаточно.`,

        ja: `摩擦音に視線が引かれる——危険がないことを確認し、目をそらす。

機械の故障は直すべきもの、確かに。だが、自分で直したいという衝動は存在しない。

マーカスはもうあちらにいる。誰かがやっている。それで十分だ。`,

        ko: `마찰음에 시선이 끌린다 — 위험이 없음을 확인한다. 그리고 시선을 거둔다.

기계 고장은 당연히 고쳐야 할 일이다. 하지만 직접 고치고 싶다는 충동은 나에게 존재하지 않는다.

마커스가 이미 저쪽에 있다. 누군가 하고 있다. 그걸로 충분하다.`,
      },
    },
  },

  // ── Q3: Drive a truck to deliver packages to offices and homes ───────
  {
    id: 3,
    riasec: "R",
    miniIpCode: "R4",
    miniIpItem: "Drive a truck to deliver packages to offices and homes",
    chapter: "mechanical",
    chapterIndex: 1,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `维修完成后，机械室运转频率恢复了。但屏幕上的进度条只到了 40%。

你们在房间另一侧发现了原因：一辆重型运输车停在装卸平台旁，货舱门敞开着。平台上堆着几十个零件箱，每个贴着不同的目的地编号——分布在设施各处的验证站。

屏幕更新：「子系统三：物流配送。状态：停滞。已生产零件需运送至各验证站完成检测。需驾驶运输车按路线完成配送。」

Nora 查看配送清单：「十二个验证站，分布在三层楼。路线图在驾驶座旁边。」她看了一眼车厢，补了一句：「我可以帮忙装货和核对清单，但开车的人不是我。」

这辆运输车需要有人来驾驶——熟悉操控、按路线行驶、在每个站点卸货——把零件准确送到该去的地方。`,

      en: `After the repair, the machine room's running frequency is restored. But the progress bar only reads 40%.

On the far side of the room, you find the reason: a heavy transport vehicle parked beside a loading dock, its cargo doors wide open. Dozens of labeled parts crates are stacked on the platform, each marked with a different destination number — verification stations scattered throughout the facility.

The screen updates: "Subsystem three: Logistics Distribution. Status: Stalled. Manufactured parts must be delivered to verification stations for testing. Driver needed to complete delivery route."

Nora checks the manifest: "Twelve verification stations across three floors. The route map is next to the driver's seat." She glances at the cargo bay and adds: "I can help load and check off the manifest, but the one driving isn't me."

This vehicle needs someone to drive it — learn the controls, follow the route, unload at each station — and get these parts exactly where they need to go.`,

      nl: `Na de reparatie is de draaifrequentie van de machinekamer hersteld. Maar de voortgangsbalk op het scherm staat op slechts 40%.

Aan de andere kant van de ruimte vind je de reden: een zwaar transportvoertuig geparkeerd naast een laadperron, de vrachtdeuren wijd open. Tientallen gelabelde onderdelen-kratten staan opgestapeld op het platform, elk gemarkeerd met een ander bestemmingsnummer — verificatiestations verspreid over de hele faciliteit.

Het scherm wordt bijgewerkt: "Subsysteem drie: Logistieke Distributie. Status: Vastgelopen. Geproduceerde onderdelen moeten naar verificatiestations worden geleverd voor testen. Chauffeur nodig om de leveringsroute te voltooien."

Nora bekijkt de leveringslijst en zegt: "Twaalf verificatiestations, verspreid over drie verdiepingen. De routekaart ligt naast de bestuurdersstoel." Ze werpt een blik op het vrachtruim en voegt toe: "Ik kan helpen met laden en de lijst afvinken, maar degene die rijdt ben ik niet."

Dit voertuig heeft iemand nodig om het te besturen — de bediening leren, de route volgen, bij elk station lossen — en deze onderdelen precies daar krijgen waar ze moeten zijn.`,

      de: `Nach der Reparatur ist die Betriebsfrequenz des Maschinenraums wiederhergestellt. Aber der Fortschrittsbalken auf dem Bildschirm zeigt nur 40%.

Auf der anderen Seite des Raums findest du den Grund: ein schweres Transportfahrzeug, geparkt neben einer Laderampe, die Frachttüren weit offen. Dutzende beschriftete Teilekisten stehen auf der Plattform gestapelt, jede mit einer anderen Zielnummer versehen — Prüfstationen, verteilt über die gesamte Anlage.

Der Bildschirm aktualisiert: „Subsystem drei: Logistikverteilung. Status: Stillstand. Hergestellte Teile müssen zur Prüfung an Verifikationsstationen geliefert werden. Fahrer benötigt, um die Lieferroute zu absolvieren."

Nora prüft die Lieferliste und sagt: „Zwölf Prüfstationen, verteilt auf drei Stockwerke. Die Routenkarte liegt neben dem Fahrersitz." Sie wirft einen Blick auf den Frachtraum und fügt hinzu: „Ich kann beim Beladen helfen und die Liste abhaken, aber die, die fährt, bin ich nicht."

Dieses Fahrzeug braucht jemanden, der es fährt — die Steuerung lernen, der Route folgen, an jeder Station entladen — und diese Teile genau dorthin bringen, wo sie hinmüssen.`,

      fr: `Après la réparation, la fréquence de fonctionnement de la salle des machines est rétablie. Mais la barre de progression à l'écran n'affiche que 40%.

De l'autre côté de la salle, vous trouvez la raison : un véhicule de transport lourd stationné à côté d'un quai de chargement, ses portes de fret grandes ouvertes. Des dizaines de caisses de pièces étiquetées sont empilées sur la plateforme, chacune marquée d'un numéro de destination différent — des stations de vérification réparties dans toute l'installation.

L'écran se met à jour : « Sous-système trois : Distribution logistique. Statut : À l'arrêt. Les pièces fabriquées doivent être livrées aux stations de vérification pour les tests. Un conducteur est nécessaire pour compléter le circuit de livraison. »

Nora consulte le manifeste de livraison et dit : « Douze stations de vérification, réparties sur trois étages. Le plan de route est à côté du siège conducteur. » Elle jette un œil à la soute et ajoute : « Je peux aider à charger et cocher le manifeste, mais celui qui conduit, ce n'est pas moi. »

Ce véhicule a besoin de quelqu'un pour le conduire — apprendre les commandes, suivre l'itinéraire, décharger à chaque station — et amener ces pièces exactement là où elles doivent aller.`,

      es: `Tras la reparación, la frecuencia de operación de la sala de máquinas se ha restaurado. Pero la barra de progreso en pantalla solo marca 40%.

Al otro lado de la sala, encuentras la razón: un vehículo de transporte pesado estacionado junto a un muelle de carga, con las puertas del compartimento abiertas de par en par. Decenas de cajas de piezas etiquetadas están apiladas en la plataforma, cada una marcada con un número de destino diferente — estaciones de verificación distribuidas por toda la instalación.

La pantalla se actualiza: "Subsistema tres: Distribución Logística. Estado: Detenida. Las piezas fabricadas deben ser entregadas a las estaciones de verificación para pruebas. Se necesita un conductor para completar la ruta de entrega."

Nora revisa el manifiesto de entrega y dice: "Doce estaciones de verificación, distribuidas en tres pisos. El mapa de ruta está junto al asiento del conductor." Mira el compartimento de carga y agrega: "Puedo ayudar a cargar y verificar el manifiesto, pero quien conduce no soy yo."

Este vehículo necesita a alguien que lo conduzca — aprender los controles, seguir la ruta, descargar en cada estación — y llevar estas piezas exactamente a donde deben ir.`,

      pt: `Após o reparo, a frequência de operação da sala de máquinas foi restaurada. Mas a barra de progresso na tela mostra apenas 40%.

Do outro lado da sala, você encontra a razão: um veículo de transporte pesado estacionado ao lado de uma doca de carga, com as portas do compartimento abertas. Dezenas de caixas de peças etiquetadas estão empilhadas na plataforma, cada uma marcada com um número de destino diferente — estações de verificação espalhadas por toda a instalação.

A tela atualiza: "Subsistema três: Distribuição Logística. Status: Paralisada. Peças fabricadas devem ser entregues às estações de verificação para testes. Motorista necessário para completar a rota de entrega."

Nora confere o manifesto de entrega e diz: "Doze estações de verificação, distribuídas em três andares. O mapa da rota está ao lado do banco do motorista." Ela olha para o compartimento de carga e acrescenta: "Eu posso ajudar a carregar e conferir o manifesto, mas quem dirige não sou eu."

Este veículo precisa de alguém para dirigi-lo — aprender os controles, seguir a rota, descarregar em cada estação — e levar essas peças exatamente aonde precisam ir.`,

      it: `Dopo la riparazione, la frequenza operativa della sala macchine è stata ripristinata. Ma la barra di progresso sullo schermo segna solo il 40%.

Dall'altro lato della sala, trovi il motivo: un veicolo da trasporto pesante parcheggiato accanto a una rampa di carico, i portelloni del vano merci spalancati. Decine di casse di pezzi etichettate sono impilate sulla piattaforma, ognuna contrassegnata con un numero di destinazione diverso — stazioni di verifica sparse per tutta la struttura.

Lo schermo si aggiorna: "Sottosistema tre: Distribuzione Logistica. Stato: Bloccata. I pezzi fabbricati devono essere consegnati alle stazioni di verifica per i test. Serve un conducente per completare il percorso di consegna."

Nora controlla il manifesto di consegna e dice: "Dodici stazioni di verifica, distribuite su tre piani. La mappa del percorso è accanto al sedile del conducente." Lancia un'occhiata al vano di carico e aggiunge: "Posso aiutare a caricare e spuntare il manifesto, ma chi guida non sono io."

Questo veicolo ha bisogno di qualcuno che lo guidi — imparare i comandi, seguire il percorso, scaricare a ogni stazione — e portare questi pezzi esattamente dove devono andare.`,

      ru: `После ремонта рабочая частота машинного зала восстановлена. Но индикатор прогресса на экране показывает лишь 40%.

На дальней стороне комнаты ты находишь причину: тяжёлый транспортный автомобиль припаркован у погрузочной платформы, грузовые двери распахнуты. На платформе сложены десятки маркированных ящиков с деталями, каждый помечен номером назначения — станции верификации, разбросанные по всему объекту.

Экран обновляется: «Подсистема три: Логистическая доставка. Статус: Приостановлена. Произведённые детали необходимо доставить на станции верификации для тестирования. Нужен водитель для завершения маршрута доставки.»

Нора проверяет накладную и говорит: «Двенадцать станций верификации, на трёх этажах. Карта маршрута рядом с водительским сиденьем.» Она смотрит на грузовой отсек и добавляет: «Я могу помочь с загрузкой и сверкой списка, но за руль сяду не я.»

Этому транспорту нужен кто-то за рулём — освоить управление, следовать маршруту, разгружать на каждой станции — и доставить эти детали точно туда, куда нужно.`,

      ja: `修理後、機械室の稼働周波数は回復した。だが画面上の進捗バーは40%しか示していない。

部屋の反対側に原因があった：重量物運搬車が荷積みドックの横に停まっており、貨物ドアが大きく開いている。プラットフォームにはラベル付きの部品箱が何十個も積まれ、それぞれに異なる宛先番号が記されている——施設全体に点在する検証ステーションだ。

画面が更新される：「サブシステム3：物流配送。ステータス：停滞。製造済み部品を検証ステーションに配送し、テストを受ける必要がある。配送ルートを完了するドライバーが必要。」

ノラが配送伝票を確認して言う：「検証ステーションは12か所、3フロアに分散しているわ。ルートマップは運転席の横にある。」貨物室を一瞥してから付け加える：「積み込みとリスト照合は手伝えるけど、運転する人は私じゃない。」

この車両には誰かが必要だ——操作を覚え、ルートに従い、各ステーションで荷下ろしし——これらの部品を正確に届けるべき場所へ届ける。`,

      ko: `수리 후, 기계실의 작동 주파수가 복원되었다. 하지만 화면의 진행 바는 40%에 불과하다.

방 반대편에서 이유를 발견한다: 중량 운반차가 적재 플랫폼 옆에 세워져 있고, 화물문이 활짝 열려 있다. 플랫폼 위에는 라벨이 붙은 부품 상자 수십 개가 쌓여 있으며, 각 상자에는 서로 다른 목적지 번호가 적혀 있다 — 시설 곳곳에 흩어진 검증 스테이션이다.

화면이 갱신된다: "서브시스템 3: 물류 배송. 상태: 정체. 생산된 부품을 검증 스테이션으로 운송하여 테스트해야 함. 배송 경로를 완료할 운전자 필요."

노라가 배송 목록을 확인하며 말한다: "검증 스테이션이 12곳, 3개 층에 걸쳐 분포해 있어. 경로 지도는 운전석 옆에 있어." 화물칸을 훑어보며 덧붙인다: "적재와 목록 확인은 도울 수 있지만, 운전하는 사람은 내가 아니야."

이 차량에는 누군가가 필요하다 — 조작법을 익히고, 경로를 따라 운행하고, 각 스테이션에서 하역하여 — 이 부품들을 정확히 가야 할 곳으로 배달해야 한다.`,
    },
    taskDescription: {
      zh: "驾驶运输车按照路线图将零件箱配送到十二个验证站，在每个站点完成卸货确认。这项任务需要一个主要负责人。",

      en: `Drive the transport vehicle along the route map to deliver parts crates to twelve verification stations, completing unloading confirmation at each stop. This task needs one primary person.`,

      nl: `Bestuur het transportvoertuig langs de routekaart om onderdelen-kratten bij twaalf verificatiestations af te leveren en bevestig de lossing bij elke halte. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Fahre das Transportfahrzeug entlang der Routenkarte, um Teilekisten an zwölf Prüfstationen zu liefern, und bestätige die Entladung an jeder Haltestelle. Diese Aufgabe braucht eine hauptverantwortliche Person.`,

      fr: `Conduisez le véhicule de transport le long du plan de route pour livrer les caisses de pièces aux douze stations de vérification, en confirmant le déchargement à chaque arrêt. Cette tâche nécessite un responsable principal.`,

      es: `Conduce el vehículo de transporte siguiendo el mapa de ruta para entregar las cajas de piezas en doce estaciones de verificación, confirmando la descarga en cada parada. Esta tarea necesita un responsable principal.`,

      pt: `Dirija o veículo de transporte seguindo o mapa da rota para entregar as caixas de peças em doze estações de verificação, confirmando a descarga em cada parada. Esta tarefa precisa de um responsável principal.`,

      it: `Guida il veicolo da trasporto lungo la mappa del percorso per consegnare le casse di pezzi a dodici stazioni di verifica, confermando lo scarico a ogni fermata. Questo compito richiede un responsabile principale.`,

      ru: `Управляйте транспортным средством по карте маршрута для доставки ящиков с деталями на двенадцать станций верификации, подтверждая разгрузку на каждой остановке. Для этой задачи нужен один ответственный.`,

      ja: `ルートマップに沿って運搬車を運転し、部品箱を12か所の検証ステーションに配送し、各停車地点で荷下ろし確認を行う。この作業には主担当者が一人必要だ。`,

      ko: `경로 지도를 따라 운반차를 운전하여 부품 상자를 12개 검증 스테이션에 배송하고, 각 정차지에서 하역 확인을 완료하라. 이 작업에는 주 담당자가 한 명 필요하다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `十二个站点？你在心里快速过了一遍路线图的结构。

不是被数量吓到——是开始兴奋。驾驶这辆运输车穿过整个设施，按照路线一站一站地把零件送到位，亲手确认每一箱货物到达正确的地方——这种掌控方向盘、让一切各归其位的过程，让你身体里某个开关自动打开了。

你走过去，拉开驾驶座的门。Nora 在副驾驶座上展开了配送清单。

「第一站，二楼东侧。」她说。

你已经发动了引擎。`,

        en: `Twelve stations? You're already tracing the route map in your head.

Not daunted by the number — excited. Driving this transport vehicle through the entire facility, delivering parts station by station along the route, personally confirming each crate reaches the right place — this process of gripping the wheel and putting everything where it belongs flips a switch inside you.

You walk over and pull open the driver's door. Nora unfolds the delivery manifest in the passenger seat.

"First stop, east side, second floor," she says.

You've already started the engine.`,

        nl: `Twaalf stations? In je hoofd volg je de routekaart al.

Niet afgeschrikt door het aantal — opgewonden. Dit transportvoertuig door de hele faciliteit rijden, onderdelen station voor station afleveren langs de route, persoonlijk bevestigen dat elke krat op de juiste plek komt — dit proces van het stuur vastgrijpen en alles op z'n plek brengen zet een schakelaar in je om.

Je loopt ernaartoe en trekt het bestuurdersportier open. Nora vouwt de leveringslijst open op de passagiersstoel.

"Eerste halte, oostkant, tweede verdieping," zegt ze.

Je hebt de motor al gestart.`,

        de: `Zwölf Stationen? In deinem Kopf folgst du bereits der Routenkarte.

Nicht eingeschüchtert von der Zahl — begeistert. Dieses Transportfahrzeug durch die gesamte Anlage fahren, Station für Station Teile liefern, persönlich bestätigen, dass jede Kiste am richtigen Ort ankommt — dieser Prozess, das Steuer zu greifen und alles dorthin zu bringen, wo es hingehört, legt einen Schalter in dir um.

Du gehst hin und ziehst die Fahrertür auf. Nora faltet die Lieferliste auf dem Beifahrersitz auf.

„Erste Haltestelle, Ostseite, zweiter Stock", sagt sie.

Du hast den Motor schon gestartet.`,

        fr: `Douze stations ? Tu traces déjà l'itinéraire dans ta tête.

Pas intimidé par le nombre — excité. Conduire ce véhicule à travers toute l'installation, livrer les pièces station par station le long du parcours, confirmer personnellement que chaque caisse arrive au bon endroit — ce processus de saisir le volant et de mettre chaque chose à sa place actionne un interrupteur en toi.

Tu t'approches et ouvres la portière du conducteur. Nora déplie le manifeste sur le siège passager.

« Premier arrêt, côté est, deuxième étage, » dit-elle.

Tu as déjà démarré le moteur.`,

        es: `¿Doce estaciones? Ya estás trazando el mapa de ruta en tu cabeza.

No intimidado por el número — emocionado. Conducir este vehículo por toda la instalación, entregar piezas estación por estación a lo largo de la ruta, confirmar personalmente que cada caja llega al lugar correcto — este proceso de agarrar el volante y poner todo en su sitio activa un interruptor dentro de ti.

Caminas y abres la puerta del conductor. Nora despliega el manifiesto en el asiento del copiloto.

"Primera parada, lado este, segundo piso," dice ella.

Ya has arrancado el motor.`,

        pt: `Doze estações? Você já está traçando o mapa da rota na cabeça.

Não intimidado pelo número — empolgado. Dirigir este veículo por toda a instalação, entregar peças estação por estação ao longo da rota, confirmar pessoalmente que cada caixa chega ao lugar certo — esse processo de segurar o volante e colocar tudo no lugar certo aciona um interruptor dentro de você.

Você se aproxima e abre a porta do motorista. Nora desdobra o manifesto no banco do passageiro.

"Primeira parada, lado leste, segundo andar," ela diz.

Você já ligou o motor.`,

        it: `Dodici stazioni? Stai già tracciando la mappa del percorso nella tua testa.

Non intimidito dal numero — eccitato. Guidare questo veicolo attraverso tutta la struttura, consegnare i pezzi stazione per stazione lungo il percorso, confermare personalmente che ogni cassa arrivi al posto giusto — questo processo di afferrare il volante e mettere tutto al suo posto attiva un interruttore dentro di te.

Ti avvicini e apri la portiera del conducente. Nora apre il manifesto sul sedile del passeggero.

"Prima fermata, lato est, secondo piano," dice.

Hai già avviato il motore.`,

        ru: `Двенадцать станций? Ты уже прокладываешь маршрут в голове.

Не испуган числом — воодушевлён. Вести этот транспорт через весь объект, доставлять детали станция за станцией по маршруту, лично подтверждать, что каждый ящик прибыл на место — этот процесс «взяться за руль и расставить всё по местам» щёлкает переключателем внутри тебя.

Ты подходишь и открываешь водительскую дверь. Нора раскладывает накладную на пассажирском сиденье.

«Первая остановка, восточная сторона, второй этаж», — говорит она.

Ты уже завёл двигатель.`,

        ja: `12ステーション？ 頭の中ではもうルートマップをたどっている。

数字に怯んでいるのではない——ワクワクしている。この運搬車で施設全体を走り、ルートに沿ってステーションごとに部品を届け、自分の手で各箱が正しい場所に届いたことを確認する——ハンドルを握り、すべてをあるべき場所に届けるこの過程が、体の中のスイッチを入れた。

歩み寄り、運転席のドアを開ける。ノラが助手席で配送伝票を広げる。

「最初の停車地点、2階東側」と彼女が言う。

もうエンジンをかけている。`,

        ko: `12개 스테이션? 머릿속으로 이미 경로 지도를 따라가고 있다.

숫자에 겁먹은 게 아니다 — 흥분한 것이다. 이 운반차를 몰고 시설 전체를 누비며, 경로를 따라 스테이션마다 부품을 배달하고, 각 상자가 정확한 곳에 도착했음을 직접 확인하는 것 — 핸들을 잡고 모든 것을 제자리에 놓는 이 과정이 내 안의 스위치를 켰다.

다가가서 운전석 문을 연다. 노라가 조수석에서 배송 목록을 펼친다.

"첫 번째 정차지, 2층 동쪽," 그녀가 말한다.

이미 엔진을 걸었다.`,
      },
      score4: {
        zh: `你走向运输车，拉开驾驶座的门，看了看仪表盘。

路线图的逻辑是清楚的，站点的顺序是有序的。这不是一个需要灵感的任务——它需要的是稳定和专注，这些你有。

你发动引擎，开始按照路线出发。每到一站，Nora 会核对清单报下一站。你们形成了一种节奏。`,

        en: `You walk to the transport vehicle, pull open the driver's door, and look over the dashboard.

The route map's logic is clear. The station sequence is orderly. This isn't a task that requires inspiration — it requires steadiness and focus. Those, you have.

You start the engine and begin following the route. At each station, Nora checks off the manifest and calls the next. A rhythm forms between you.`,

        nl: `Je loopt naar het transportvoertuig, trekt het bestuurdersportier open en bekijkt het dashboard.

De logica van de routekaart is helder. De stationsvolgorde is geordend. Dit is geen taak die inspiratie vereist — het vereist stabiliteit en concentratie. Die heb je.

Je start de motor en begint de route te volgen. Bij elk station vinkt Nora de lijst af en roept de volgende. Er ontstaat een ritme tussen jullie.`,

        de: `Du gehst zum Transportfahrzeug, ziehst die Fahrertür auf und schaust auf das Armaturenbrett.

Die Logik der Routenkarte ist klar. Die Stationsreihenfolge ist geordnet. Das ist keine Aufgabe, die Inspiration braucht — sie braucht Beständigkeit und Fokus. Die hast du.

Du startest den Motor und folgst der Route. An jeder Station hakt Nora die Liste ab und ruft die nächste. Ein Rhythmus entsteht zwischen euch.`,

        fr: `Tu t'approches du véhicule, ouvres la portière du conducteur et examines le tableau de bord.

La logique du plan de route est claire. La séquence des stations est ordonnée. Ce n'est pas une tâche qui demande de l'inspiration — elle demande de la constance et de la concentration. Ça, tu l'as.

Tu démarres le moteur et commences à suivre l'itinéraire. À chaque station, Nora coche le manifeste et annonce la suivante. Un rythme s'installe entre vous.`,

        es: `Caminas hacia el vehículo, abres la puerta del conductor y miras el tablero.

La lógica del mapa de ruta es clara. La secuencia de estaciones es ordenada. Esta no es una tarea que requiera inspiración — requiere estabilidad y concentración. Eso lo tienes.

Arrancas el motor y comienzas a seguir la ruta. En cada estación, Nora marca el manifiesto y anuncia la siguiente. Se forma un ritmo entre ustedes.`,

        pt: `Você vai até o veículo, abre a porta do motorista e olha o painel.

A lógica do mapa da rota é clara. A sequência das estações é ordenada. Esta não é uma tarefa que exige inspiração — exige estabilidade e foco. Isso você tem.

Liga o motor e começa a seguir a rota. Em cada estação, Nora confere o manifesto e anuncia a próxima. Um ritmo se forma entre vocês.`,

        it: `Ti avvicini al veicolo, apri la portiera del conducente e guardi il cruscotto.

La logica della mappa del percorso è chiara. La sequenza delle stazioni è ordinata. Questo non è un compito che richiede ispirazione — richiede stabilità e concentrazione. Quelle, le hai.

Avvii il motore e inizi a seguire il percorso. A ogni stazione, Nora spunta il manifesto e annuncia la successiva. Si forma un ritmo tra voi.`,

        ru: `Ты подходишь к транспорту, открываешь водительскую дверь и осматриваешь приборную панель.

Логика маршрутной карты понятна. Порядок станций упорядочен. Это не задача, требующая вдохновения — она требует стабильности и сосредоточенности. Это у тебя есть.

Ты заводишь двигатель и начинаешь следовать маршруту. На каждой станции Нора отмечает список и объявляет следующую. Между вами складывается ритм.`,

        ja: `運搬車に歩み寄り、運転席のドアを開け、ダッシュボードを見る。

ルートマップの論理は明確だ。ステーションの順序は整然としている。これはひらめきを要する作業ではない——安定感と集中力を要するものだ。それなら持っている。

エンジンをかけ、ルートに沿って出発する。各ステーションに着くたびに、ノラがリストを照合して次を読み上げる。二人の間にリズムが生まれる。`,

        ko: `운반차로 다가가 운전석 문을 열고 계기판을 살펴본다.

경로 지도의 논리는 명확하다. 스테이션 순서는 정돈되어 있다. 이건 영감이 필요한 작업이 아니다 — 안정감과 집중력이 필요하다. 그건 갖고 있다.

엔진을 걸고 경로를 따라 출발한다. 각 스테이션에 도착할 때마다 노라가 목록을 확인하고 다음을 알려준다. 둘 사이에 리듬이 형성된다.`,
      },
      score3: {
        zh: `十二个验证站的配送路线。你看了看路线图，扫了几个站点编号，放下了。

不是不能开，是这种按路线跑完全程的配送工作，对你来说既没有特别的排斥，也没有特别的吸引。你可以帮忙装货、核对清单，但坐到驾驶座上主导这件事……你等等看。

也许后面两项任务更适合你。`,

        en: `A delivery route across twelve verification stations. You glance at the route map, scan a few station numbers, set it down.

Not that you can't — it's that this kind of drive-the-route, complete-the-deliveries work neither particularly repels nor attracts you. You could help load crates, check off the manifest, but getting behind the wheel to lead this... you'll wait and see.

Maybe the last two tasks are a better fit.`,

        nl: `Een leveringsroute langs twaalf verificatiestations. Je werpt een blik op de routekaart, scant een paar stationnummers, legt hem neer.

Niet dat je het niet kunt — het is dat dit soort rijd-de-route, voltooi-de-leveringen werk je niet bijzonder afstoot noch aantrekt. Je zou kunnen helpen met laden, de lijst afvinken, maar achter het stuur gaan zitten om dit te leiden... je wacht af.

Misschien passen de laatste twee taken beter bij je.`,

        de: `Eine Lieferroute über zwölf Prüfstationen. Du wirfst einen Blick auf die Routenkarte, überfliegst ein paar Stationsnummern, legst sie weg.

Nicht dass du es nicht könntest — es ist nur so, dass diese Art von Fahr-die-Route, erledige-die-Lieferungen-Arbeit dich weder besonders abstößt noch anzieht. Du könntest beim Beladen helfen, die Liste abhaken, aber dich ans Steuer setzen und die Führung übernehmen... du wartest ab.

Vielleicht passen die letzten zwei Aufgaben besser zu dir.`,

        fr: `Un circuit de livraison à travers douze stations de vérification. Tu jettes un œil au plan de route, parcours quelques numéros de stations, le reposes.

Ce n'est pas que tu ne puisses pas — c'est que ce genre de travail de conduite et de livraison ne te repousse ni ne t'attire particulièrement. Tu pourrais aider à charger, cocher le manifeste, mais te mettre au volant pour mener ça... tu vas attendre et voir.

Peut-être que les deux dernières tâches te conviendront mieux.`,

        es: `Una ruta de entrega por doce estaciones de verificación. Echas un vistazo al mapa de ruta, escaneas algunos números de estación, lo dejas.

No es que no puedas — es que este tipo de trabajo de conducir la ruta y completar las entregas ni te repele ni te atrae particularmente. Podrías ayudar a cargar, verificar el manifiesto, pero sentarte al volante para liderar esto... vas a esperar.

Quizás las dos últimas tareas sean más adecuadas para ti.`,

        pt: `Uma rota de entrega por doze estações de verificação. Você olha o mapa da rota, percorre alguns números de estação, coloca de lado.

Não é que não possa — é que esse tipo de trabalho de dirigir a rota e completar as entregas nem te repele nem te atrai particularmente. Poderia ajudar a carregar, conferir o manifesto, mas sentar no banco do motorista para liderar isso... vai esperar para ver.

Talvez as duas últimas tarefas combinem melhor com você.`,

        it: `Un percorso di consegna attraverso dodici stazioni di verifica. Lanci un'occhiata alla mappa del percorso, scorri qualche numero di stazione, la posi.

Non che non puoi — è che questo tipo di lavoro di guida e consegna non ti respinge né ti attrae particolarmente. Potresti aiutare a caricare, spuntare il manifesto, ma metterti al volante per guidare il tutto... aspetti e vedi.

Forse gli ultimi due compiti si adattano meglio a te.`,

        ru: `Маршрут доставки через двенадцать станций верификации. Ты бросаешь взгляд на карту маршрута, пробегаешь глазами несколько номеров станций, откладываешь.

Не то чтобы не можешь — просто такая работа «проехать маршрут, выполнить доставки» тебя ни особо не отталкивает, ни притягивает. Можешь помочь с погрузкой, сверить список, но сесть за руль и взять на себя ведущую роль... подождёшь и посмотришь.

Может быть, последние две задачи подойдут лучше.`,

        ja: `12か所の検証ステーションへの配送ルート。ルートマップを眺め、いくつかのステーション番号に目を通し、置く。

できないわけではない——この種のルートを走って配送を完了する作業が、特に嫌でも特に魅力的でもないだけだ。積み込みを手伝ったり、リストを照合したりはできるが、運転席に座って主導する……様子を見る。

残り二つのタスクの方が合っているかもしれない。`,

        ko: `12개 검증 스테이션을 도는 배송 경로. 경로 지도를 훑어보고, 몇 개 스테이션 번호를 스캔하고, 내려놓는다.

못 하는 게 아니다 — 이런 경로를 따라 배송을 완료하는 작업이 특별히 싫지도, 끌리지도 않을 뿐이다. 적재를 돕거나 목록을 확인할 수는 있지만, 운전석에 앉아 주도권을 잡는 건... 두고 보겠다.

마지막 두 가지 과제가 더 맞을지도 모른다.`,
      },
      score2: {
        zh: `一辆运输车，十二个站点的配送路线。

你看了一眼驾驶座和那堆零件箱，本能地知道这不是你会投入的事情。上车、开车、一站一站地卸货——整个过程都是重复的、机械的、需要长时间集中注意力在路线上的工作。

你退后了。让想开的人去开。`,

        en: `A transport vehicle. A twelve-station delivery route.

You look at the driver's seat and the stacked crates and instinctively know this isn't where you'll invest. Getting in, driving, unloading station by station — the whole process is repetitive, mechanical, requiring long stretches of focus on the road.

You step back. Let someone who wants it take the wheel.`,

        nl: `Een transportvoertuig. Een leveringsroute van twaalf stations.

Je kijkt naar de bestuurdersstoel en de gestapelde kratten en weet instinctief dat dit niet is waar je je energie in steekt. Instappen, rijden, station voor station lossen — het hele proces is repetitief, mechanisch, vereist lange periodes van concentratie op de weg.

Je doet een stap terug. Laat iemand die het wil achter het stuur.`,

        de: `Ein Transportfahrzeug. Eine Lieferroute mit zwölf Stationen.

Du schaust auf den Fahrersitz und die gestapelten Kisten und weißt instinktiv, dass dies nicht der Ort ist, an dem du dich investieren wirst. Einsteigen, fahren, Station für Station entladen — der ganze Prozess ist repetitiv, mechanisch, erfordert lange Phasen der Konzentration auf die Strecke.

Du trittst zurück. Lass jemanden, der es will, ans Steuer.`,

        fr: `Un véhicule de transport. Un circuit de livraison de douze stations.

Tu regardes le siège conducteur et les caisses empilées et tu sais instinctivement que ce n'est pas là que tu investiras ton énergie. Monter, conduire, décharger station par station — tout le processus est répétitif, mécanique, demande de longues heures de concentration sur la route.

Tu recules. Laisse quelqu'un qui le veut prendre le volant.`,

        es: `Un vehículo de transporte. Una ruta de entrega de doce estaciones.

Miras el asiento del conductor y las cajas apiladas y sabes instintivamente que no es aquí donde invertirás. Subir, conducir, descargar estación por estación — todo el proceso es repetitivo, mecánico, requiere largos ratos concentrado en la ruta.

Retrocedes. Deja que alguien que lo quiera tome el volante.`,

        pt: `Um veículo de transporte. Uma rota de entrega de doze estações.

Olha para o banco do motorista e as caixas empilhadas e sabe instintivamente que não é aqui que vai investir. Subir, dirigir, descarregar estação por estação — todo o processo é repetitivo, mecânico, exige longos períodos focado na rota.

Dá um passo atrás. Deixe alguém que queira assumir o volante.`,

        it: `Un veicolo da trasporto. Un percorso di consegna di dodici stazioni.

Guardi il sedile del conducente e le casse impilate e sai istintivamente che non è qui che investirai. Salire, guidare, scaricare stazione per stazione — tutto il processo è ripetitivo, meccanico, richiede lunghi periodi di concentrazione sul percorso.

Fai un passo indietro. Lascia che qualcuno che lo vuole prenda il volante.`,

        ru: `Транспортное средство. Маршрут доставки на двенадцать станций.

Ты смотришь на водительское сиденье и штабеля ящиков и инстинктивно понимаешь, что не сюда ты вложишь свои силы. Сесть, вести, разгружать станция за станцией — весь процесс повторяющийся, механический, требующий длительной концентрации на дороге.

Ты отступаешь. Пусть тот, кто хочет, сядет за руль.`,

        ja: `運搬車。12ステーションの配送ルート。

運転席と積まれた箱を見て、ここに自分を投じる場所ではないと本能的に分かる。乗り込み、運転し、ステーションごとに荷下ろしする——全過程が反復的で、機械的で、長時間ルートに集中し続ける必要がある。

一歩引く。やりたい人に任せる。`,

        ko: `운반차. 12개 스테이션 배송 경로.

운전석과 쌓인 상자들을 보며 본능적으로 안다 — 여기에 에너지를 쏟을 곳이 아니라는 것을. 타고, 운전하고, 스테이션마다 하역하는 것 — 전 과정이 반복적이고, 기계적이며, 오랜 시간 경로에 집중해야 한다.

한 걸음 물러선다. 원하는 사람이 운전하게 두자.`,
      },
      score1: {
        zh: `这辆运输车和你之间没有连接。

驾驶座在那里，路线图在那里，但它们对你没有召唤力。不是因为十二个站点太多，是因为驾驶和配送这种工作从根本上不会让你产生「我要来」的念头。

你站在远处，看着别人走向驾驶座。你在这个房间里的任务不在这里。`,

        en: `There's no connection between you and this vehicle.

Driver's seat right there. Route map right there. But they hold no pull for you. Not because twelve stations is too many — because driving and delivering fundamentally doesn't trigger "let me do it" in you.

You stand at a distance, watching someone else head for the driver's seat. Your task in this room isn't here.`,

        nl: `Er is geen verbinding tussen jou en dit voertuig.

Bestuurdersstoel daar. Routekaart daar. Maar ze trekken niet aan je. Niet omdat twaalf stations te veel is — omdat rijden en bezorgen fundamenteel geen "laat mij het doen" in je opwekt.

Je staat op afstand en kijkt hoe iemand anders naar de bestuurdersstoel loopt. Jouw taak in deze ruimte is niet hier.`,

        de: `Zwischen dir und diesem Fahrzeug gibt es keine Verbindung.

Fahrersitz da. Routenkarte da. Aber sie üben keinen Sog auf dich aus. Nicht weil zwölf Stationen zu viele wären — weil Fahren und Ausliefern grundsätzlich kein „Lass mich das machen" in dir auslöst.

Du stehst in einiger Entfernung und siehst zu, wie jemand anderes zum Fahrersitz geht. Deine Aufgabe in diesem Raum liegt nicht hier.`,

        fr: `Il n'y a aucune connexion entre toi et ce véhicule.

Le siège conducteur est là. Le plan de route est là. Mais ils n'exercent aucune attraction sur toi. Pas parce que douze stations, c'est trop — parce que conduire et livrer ne déclenche fondamentalement pas de « laissez-moi faire » en toi.

Tu te tiens à distance, regardant quelqu'un d'autre se diriger vers le siège conducteur. Ta tâche dans cette salle n'est pas ici.`,

        es: `No hay conexión entre tú y este vehículo.

El asiento del conductor ahí. El mapa de ruta ahí. Pero no ejercen atracción sobre ti. No porque doce estaciones sean demasiadas — porque conducir y entregar fundamentalmente no genera un "déjame hacerlo" en ti.

Te quedas a distancia, viendo cómo alguien más se dirige al asiento del conductor. Tu tarea en esta sala no está aquí.`,

        pt: `Não há conexão entre você e este veículo.

Banco do motorista ali. Mapa da rota ali. Mas não exercem atração sobre você. Não porque doze estações sejam demais — porque dirigir e entregar fundamentalmente não gera um "deixa eu fazer" em você.

Você fica à distância, observando outra pessoa ir para o banco do motorista. Sua tarefa nesta sala não está aqui.`,

        it: `Non c'è connessione tra te e questo veicolo.

Sedile del conducente lì. Mappa del percorso lì. Ma non esercitano alcuna attrazione su di te. Non perché dodici stazioni siano troppe — perché guidare e consegnare fondamentalmente non attiva un "lascia fare a me" in te.

Resti a distanza, guardando qualcun altro dirigersi al sedile del conducente. Il tuo compito in questa stanza non è qui.`,

        ru: `Между тобой и этим транспортом нет связи.

Водительское сиденье вот оно. Карта маршрута вот она. Но они не притягивают тебя. Не потому что двенадцать станций — слишком много, а потому что вождение и доставка принципиально не вызывают в тебе «дай я сделаю».

Ты стоишь на расстоянии, наблюдая, как кто-то другой идёт к водительскому сиденью. Твоя задача в этой комнате — не здесь.`,

        ja: `この車両と自分の間にはつながりがない。

運転席はそこにある。ルートマップもそこにある。だがどちらも自分を引きつけない。12ステーションが多すぎるからではない——運転と配送という作業が根本的に「やらせてくれ」を引き起こさないからだ。

離れた場所に立ち、他の誰かが運転席に向かうのを見ている。この部屋での自分のタスクはここではない。`,

        ko: `나와 이 차량 사이에는 연결이 없다.

운전석이 저기 있다. 경로 지도가 저기 있다. 하지만 어떤 끌림도 느끼지 못한다. 12개 스테이션이 너무 많아서가 아니라 — 운전과 배달이라는 작업이 근본적으로 "내가 하겠다"를 일으키지 않기 때문이다.

멀찍이 서서 다른 누군가가 운전석으로 향하는 것을 지켜본다. 이 방에서의 내 과제는 여기가 아니다.`,
      },
    },
  },

  // ── Q4: Build kitchen cabinets (高潮题) ────────────────────
  {
    id: 4,
    riasec: "R",
    miniIpCode: "R1",
    miniIpItem: "Build kitchen cabinets",
    chapter: "mechanical",
    chapterIndex: 1,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `机器运转了。第一批产品出来了。
但问题立刻出现——放哪？

机械室角落的储物区被彻底摧毁了。金属架子扭曲变形，木制柜体碎裂，抽屉散落一地。之前的参与者留下的痕迹说明：不是自然损坏，是某一关的游戏机制造成的。

屏幕更新，比之前更紧迫：
「子系统四：仓储基础设施。状态：已损毁。需重建。材料已提供。时间限制：开始。」

倒计时出现了。第一次有时间限制。

工作台上多了一批新材料：木板、合页、螺丝、L型支架、锯子、尺子、砂纸。没有现成的——需要有人从切割木板开始，测量、锯切、组装、安装，从零建一个储物柜。

Marcus 已经在量木板了。但这个工程量不小，他一个人来不及。`,

      en: `The machine is running. The first batch of products has come out.
But a problem surfaces immediately — where do you put them?

The storage area in the corner has been completely destroyed. Metal shelving warped, wooden cabinets shattered, drawers scattered everywhere. Traces from previous participants suggest this wasn't natural damage — it was caused by a game mechanism from a previous round.

The screen updates, more urgent than before:
"Subsystem four: Storage Infrastructure. Status: Destroyed. Rebuild required. Materials provided. Time limit: begins now."

A countdown appears. The first time limit.

New materials on the workbench: wood planks, hinges, screws, L-brackets, a saw, a ruler, sandpaper. Nothing prefabricated — someone needs to start from cutting planks: measure, saw, assemble, install. Build a functional cabinet from scratch.

Marcus is already measuring planks. But this job is too large for one person to finish in time.`,

      nl: `De machine draait. De eerste lading producten is eruit gekomen.
Maar er doemt meteen een probleem op — waar leg je ze neer?

Het opslaggedeelte in de hoek van de machinekamer is volledig vernield. Metalen stellingen zijn verbogen, houten kasten aan diggelen, laden overal verspreid. Sporen van eerdere deelnemers suggereren dat dit geen natuurlijke schade was — het was veroorzaakt door een spelmechanisme uit een eerdere ronde.

Het scherm wordt bijgewerkt, dringender dan voorheen:
"Subsysteem vier: Opslaginfrastructuur. Status: Vernietigd. Herbouw nodig. Materialen beschikbaar. Tijdslimiet: begint nu."

Er verschijnt een aftelling. Dit is de eerste keer dat er een tijdslimiet is.

Nieuwe materialen verschijnen op de werkbank: houten planken, scharnieren, schroeven, L-steunen, een zaag, een liniaal, schuurpapier. Niets prefab — iemand moet beginnen met planken zagen, meten, zagen, monteren, installeren. Bouw een functionele opslagkast van de grond af aan.

Marcus is al planken aan het meten. Maar deze klus is te groot voor één persoon om op tijd af te krijgen.`,

      de: `Die Maschine läuft. Die erste Charge Produkte ist herausgekommen.
Aber sofort taucht ein Problem auf — wohin damit?

Der Lagerbereich in der Ecke des Maschinenraums ist völlig zerstört. Metallregale sind verbogen, Holzschränke zertrümmert, Schubladen überall verstreut. Spuren früherer Teilnehmer deuten darauf hin, dass dies kein natürlicher Schaden war — er wurde durch einen Spielmechanismus einer früheren Runde verursacht.

Der Bildschirm aktualisiert sich, dringender als zuvor:
„Subsystem vier: Lagerinfrastruktur. Status: Zerstört. Wiederaufbau erforderlich. Material bereitgestellt. Zeitlimit: beginnt jetzt."

Ein Countdown erscheint. Das ist das erste Mal mit Zeitlimit.

Neue Materialien erscheinen auf der Werkbank: Holzbretter, Scharniere, Schrauben, Winkelverbinder, eine Säge, ein Lineal, Schleifpapier. Nichts Vorgefertigtes — jemand muss mit dem Zuschneiden der Bretter beginnen, messen, sägen, zusammenbauen, installieren. Einen funktionsfähigen Schrank von Grund auf bauen.

Marcus misst schon Bretter ab. Aber der Auftrag ist zu groß für eine Person allein.`,

      fr: `La machine tourne. Le premier lot de produits est sorti.
Mais un problème surgit immédiatement — où les mettre ?

La zone de stockage dans le coin de la salle des machines a été complètement détruite. Les étagères métalliques sont tordues, les armoires en bois fracassées, les tiroirs éparpillés partout. Les traces laissées par les participants précédents suggèrent que ce n'est pas un dommage naturel — c'est le résultat d'un mécanisme de jeu d'une manche précédente.

L'écran se met à jour, plus urgent qu'avant :
« Sous-système quatre : Infrastructure de stockage. Statut : Détruit. Reconstruction requise. Matériaux fournis. Limite de temps : commence maintenant. »

Un compte à rebours apparaît. C'est la première fois qu'il y a une limite de temps.

De nouveaux matériaux apparaissent sur l'établi : planches de bois, charnières, vis, équerres, une scie, une règle, du papier de verre. Rien de préfabriqué — quelqu'un doit commencer par découper les planches, mesurer, scier, assembler, installer. Construire un meuble de rangement fonctionnel à partir de rien.

Marcus mesure déjà des planches. Mais le travail est trop important pour qu'une seule personne le finisse à temps.`,

      es: `La máquina está funcionando. El primer lote de productos ha salido.
Pero surge un problema inmediato: ¿dónde los pones?

El área de almacenamiento en la esquina de la sala de máquinas ha sido completamente destruida. Los estantes metálicos están deformados, los gabinetes de madera destrozados, los cajones dispersos por todas partes. Las huellas dejadas por participantes anteriores sugieren que no fue daño natural — fue causado por un mecanismo del juego de una ronda anterior.

La pantalla se actualiza, más urgente que antes:
"Subsistema cuatro: Infraestructura de Almacenamiento. Estado: Destruida. Se requiere reconstrucción. Materiales proporcionados. Límite de tiempo: comienza ahora."

Aparece una cuenta regresiva. Es la primera vez que hay límite de tiempo.

Nuevos materiales aparecen en el banco de trabajo: tablas de madera, bisagras, tornillos, escuadras en L, una sierra, una regla, papel de lija. Nada prefabricado — alguien necesita empezar cortando tablas, midiendo, serrando, ensamblando, instalando. Construir un gabinete de almacenamiento funcional desde cero.

Marcus ya está midiendo tablas. Pero este trabajo es demasiado grande para que una sola persona lo termine a tiempo.`,

      pt: `A máquina está funcionando. O primeiro lote de produtos saiu.
Mas um problema surge imediatamente — onde colocá-los?

A área de armazenamento no canto da sala de máquinas foi completamente destruída. Prateleiras de metal estão retorcidas, armários de madeira despedaçados, gavetas espalhadas por toda parte. Vestígios deixados por participantes anteriores sugerem que não foi dano natural — foi causado por um mecanismo do jogo de uma rodada anterior.

A tela atualiza, mais urgente que antes:
"Subsistema quatro: Infraestrutura de Armazenamento. Status: Destruída. Reconstrução necessária. Materiais fornecidos. Limite de tempo: começa agora."

Uma contagem regressiva aparece. Esta é a primeira vez com limite de tempo.

Novos materiais aparecem na bancada: tábuas de madeira, dobradiças, parafusos, cantoneiras em L, um serrote, uma régua, lixa. Nada pré-fabricado — alguém precisa começar cortando tábuas, medindo, serrando, montando, instalando. Construir um armário funcional do zero.

Marcus já está medindo tábuas. Mas o trabalho é grande demais para uma pessoa terminar a tempo.`,

      it: `La macchina è in funzione. Il primo lotto di prodotti è uscito.
Ma un problema emerge subito — dove li metti?

L'area di stoccaggio nell'angolo della sala macchine è stata completamente distrutta. Le scaffalature metalliche sono piegate, gli armadi in legno in frantumi, i cassetti sparsi ovunque. Le tracce lasciate dai partecipanti precedenti suggeriscono che non si tratta di danni naturali — sono stati causati da un meccanismo di gioco di un turno precedente.

Lo schermo si aggiorna, più urgente di prima:
"Sottosistema quattro: Infrastruttura di Stoccaggio. Stato: Distrutta. Ricostruzione necessaria. Materiali forniti. Limite di tempo: inizia ora."

Appare un conto alla rovescia. È la prima volta che c'è un limite di tempo.

Nuovi materiali appaiono sul banco da lavoro: assi di legno, cerniere, viti, staffe a L, una sega, un righello, carta vetrata. Niente di prefabbricato — qualcuno deve partire dal taglio delle assi, misurare, segare, assemblare, installare. Costruire un armadio funzionale da zero.

Marcus sta già misurando le assi. Ma il lavoro è troppo grande perché una sola persona finisca in tempo.`,

      ru: `Машина работает. Первая партия продукции вышла.
Но сразу же возникает проблема — куда её девать?

Складская зона в углу машинного зала полностью разрушена. Металлические стеллажи погнуты, деревянные шкафы разбиты, ящики разбросаны повсюду. Следы предыдущих участников говорят о том, что это не естественное повреждение — оно было вызвано игровым механизмом предыдущего раунда.

Экран обновляется, тон более настоятельный:
«Подсистема четыре: Складская инфраструктура. Статус: Уничтожена. Требуется восстановление. Материалы предоставлены. Ограничение по времени: начинается сейчас.»

Появляется обратный отсчёт. Впервые — с ограничением по времени.

На рабочем столе появляются новые материалы: доски, петли, шурупы, Г-образные кронштейны, пила, линейка, наждачная бумага. Ничего готового — кому-то нужно начать с распила досок, измерений, сборки, установки. Построить функциональный шкаф с нуля.

Маркус уже замеряет доски. Но объём работы слишком велик для одного человека.`,

      ja: `機械が稼働した。最初の製品が出てきた。
だがすぐに問題が浮上する——どこに置く？

機械室の隅にある保管エリアが完全に破壊されている。金属製の棚は歪み、木製のキャビネットは粉々、引き出しが散乱している。以前の参加者が残した痕跡から、これは自然な損傷ではなく、前のラウンドのゲーム機構によるものだと分かる。

画面が更新される。以前より緊迫した調子で：
「サブシステム4：保管インフラ。ステータス：破壊済み。再建が必要。資材提供済み。制限時間：開始。」

カウントダウンが現れた。時間制限があるのは初めてだ。

作業台に新しい資材が現れる：木板、蝶番、ねじ、L字金具、のこぎり、定規、紙やすり。既製品はない——誰かが木板の切り出しから始め、測定し、切断し、組み立て、設置する必要がある。機能する収納キャビネットをゼロから作る。

マーカスはもう木板を測っている。だがこの作業量は一人では時間内に終わらない。`,

      ko: `기계가 가동되고 있다. 첫 번째 제품이 나왔다.
하지만 즉시 문제가 떠오른다 — 어디에 놓지?

기계실 구석의 보관 구역이 완전히 파괴되어 있다. 금속 선반은 뒤틀리고, 나무 캐비닛은 산산조각이 나 있으며, 서랍이 사방에 흩어져 있다. 이전 참가자들이 남긴 흔적에 따르면 자연적인 손상이 아니라 — 이전 라운드의 게임 메커니즘이 초래한 것이다.

화면이 갱신된다, 이전보다 더 긴박한 어조로:
"서브시스템 4: 보관 인프라. 상태: 파괴됨. 재건 필요. 재료 제공됨. 시간 제한: 지금 시작."

카운트다운이 나타난다. 시간 제한은 처음이다.

작업대에 새 재료가 등장한다: 나무 판재, 경첩, 나사, L자 브래킷, 톱, 자, 사포. 기성품은 없다 — 누군가 판재 자르기부터 시작하여 측정, 절단, 조립, 설치를 해야 한다. 기능적인 수납 캐비닛을 처음부터 만드는 것이다.

마커스가 이미 판재를 재고 있다. 하지만 이 작업량은 한 사람이 시간 안에 끝내기엔 너무 크다.`,
    },
    taskDescription: {
      zh: "使用提供的木材和工具，从零开始建造一个功能性的储物柜——测量、切割、组装、安装。时间有限。这项任务需要一个主要负责人。",

      en: `Using the provided wood and tools, build a functional storage cabinet from scratch — measure, cut, assemble, install. Time is limited. This task needs one primary person.`,

      nl: `Gebruik het beschikbare hout en gereedschap om een functionele opslagkast van de grond af op te bouwen — meten, zagen, monteren, installeren. De tijd is beperkt. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Baue mit dem bereitgestellten Holz und Werkzeug einen funktionsfähigen Lagerschrank von Grund auf — messen, sägen, zusammenbauen, installieren. Die Zeit ist begrenzt. Diese Aufgabe braucht eine hauptverantwortliche Person.`,

      fr: `En utilisant le bois et les outils fournis, construisez un meuble de rangement fonctionnel à partir de zéro — mesurez, coupez, assemblez, installez. Le temps est limité. Cette tâche nécessite un responsable principal.`,

      es: `Usando la madera y herramientas proporcionadas, construye un gabinete de almacenamiento funcional desde cero — medir, cortar, ensamblar, instalar. El tiempo es limitado. Esta tarea necesita un responsable principal.`,

      pt: `Usando a madeira e ferramentas fornecidas, construa um armário de armazenamento funcional do zero — medir, cortar, montar, instalar. O tempo é limitado. Esta tarefa precisa de um responsável principal.`,

      it: `Usando il legno e gli strumenti forniti, costruisci un armadio funzionale da zero — misurare, tagliare, assemblare, installare. Il tempo è limitato. Questo compito richiede un responsabile principale.`,

      ru: `Используя предоставленные древесину и инструменты, постройте функциональный шкаф с нуля — измерьте, отрежьте, соберите, установите. Время ограничено. Для этой задачи нужен один ответственный.`,

      ja: `提供された木材と工具を使い、機能する収納キャビネットをゼロから作る——測定、切断、組み立て、設置。時間は限られている。この作業には主担当者が一人必要だ。`,

      ko: `제공된 목재와 도구를 사용하여 처음부터 기능적인 수납 캐비닛을 만들어라 — 측정, 절단, 조립, 설치. 시간이 제한되어 있다. 이 작업에는 주 담당자가 한 명 필요하다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `倒计时一出来，你的身体就进入了一种状态。

不是紧张——是聚焦。木板、锯子、尺子——你脑子里已经有了一个粗略的结构：多宽、多高、几层、哪里需要加固。你拿起尺子，在木板上画了第一条线。

Marcus 在另一边，也在量。你们对视了一秒，不需要说话，分工自然形成：他切，你装，或者反过来。

时间在走，但你不觉得紧迫。你觉得……终于有一件事的节奏和你是匹配的。`,

        en: `The moment the countdown appears, your body shifts into a state.

Not tension — focus. Planks, saw, ruler — your mind already has a rough structure: width, height, shelves, where reinforcement is needed. You pick up the ruler and draw the first line on the plank.

Marcus is on the other end, also measuring. You lock eyes for one second. No words needed — the division of labor forms naturally: he cuts, you assemble, or the reverse.

The clock is running, but you don't feel rushed. You feel... finally, something whose rhythm matches yours.`,

        nl: `Het moment dat de aftelling verschijnt, schakelt je lichaam over naar een andere staat.

Geen spanning — focus. Planken, zaag, liniaal — in je hoofd heb je al een ruwe structuur: breedte, hoogte, planken, waar versteviging nodig is. Je pakt de liniaal en tekent de eerste lijn op de plank.

Marcus staat aan de andere kant, ook aan het meten. Jullie blikken kruisen voor één seconde. Geen woorden nodig — de taakverdeling vormt zich vanzelf: hij zaagt, jij monteert, of andersom.

De klok tikt, maar je voelt je niet gehaast. Je voelt... eindelijk iets waarvan het ritme bij het jouwe past.`,

        de: `In dem Moment, als der Countdown erscheint, schaltet dein Körper in einen Zustand um.

Keine Anspannung — Fokus. Bretter, Säge, Lineal — dein Kopf hat schon eine grobe Struktur: Breite, Höhe, Regalböden, wo Verstärkung nötig ist. Du nimmst das Lineal und zeichnest die erste Linie auf das Brett.

Marcus ist am anderen Ende, misst ebenfalls. Eure Blicke treffen sich für eine Sekunde. Keine Worte nötig — die Arbeitsteilung entsteht von selbst: Er sägt, du baust zusammen, oder umgekehrt.

Die Uhr läuft, aber du fühlst dich nicht gehetzt. Du fühlst... endlich etwas, dessen Rhythmus zu deinem passt.`,

        fr: `À l'instant où le compte à rebours apparaît, ton corps bascule dans un état.

Pas de tension — de la concentration. Planches, scie, règle — ton esprit a déjà une structure approximative : largeur, hauteur, étagères, où les renforts sont nécessaires. Tu prends la règle et traces la première ligne sur la planche.

Marcus est à l'autre bout, mesurant aussi. Vos regards se croisent une seconde. Pas besoin de mots — la répartition du travail se forme naturellement : il coupe, tu assembles, ou l'inverse.

L'horloge tourne, mais tu ne te sens pas pressé. Tu ressens... enfin, quelque chose dont le rythme correspond au tien.`,

        es: `En el momento en que aparece la cuenta regresiva, tu cuerpo cambia a un estado.

No tensión — enfoque. Tablas, sierra, regla — tu mente ya tiene una estructura aproximada: ancho, alto, estantes, dónde se necesita refuerzo. Tomas la regla y trazas la primera línea en la tabla.

Marcus está en el otro extremo, también midiendo. Se cruzan las miradas por un segundo. No hacen falta palabras — la división del trabajo se forma naturalmente: él corta, tú ensamblas, o al revés.

El reloj avanza, pero no te sientes apresurado. Sientes... finalmente, algo cuyo ritmo coincide con el tuyo.`,

        pt: `No momento em que a contagem regressiva aparece, seu corpo muda para um estado.

Não tensão — foco. Tábuas, serrote, régua — sua mente já tem uma estrutura aproximada: largura, altura, prateleiras, onde é preciso reforço. Você pega a régua e traça a primeira linha na tábua.

Marcus está na outra ponta, também medindo. Os olhares se cruzam por um segundo. Sem palavras necessárias — a divisão do trabalho se forma naturalmente: ele corta, você monta, ou o contrário.

O relógio corre, mas você não se sente pressionado. Sente... finalmente, algo cujo ritmo combina com o seu.`,

        it: `Nell'istante in cui appare il conto alla rovescia, il tuo corpo passa a un altro stato.

Non tensione — concentrazione. Assi, sega, righello — la tua mente ha già una struttura approssimativa: larghezza, altezza, ripiani, dove serve rinforzo. Prendi il righello e tracci la prima linea sull'asse.

Marcus è dall'altra parte, anche lui a misurare. I vostri sguardi si incrociano per un secondo. Nessuna parola necessaria — la divisione del lavoro si forma naturalmente: lui taglia, tu assembli, o il contrario.

L'orologio scorre, ma non ti senti frettoloso. Senti... finalmente, qualcosa il cui ritmo corrisponde al tuo.`,

        ru: `В тот миг, когда появляется обратный отсчёт, твоё тело переключается в другое состояние.

Не напряжение — сосредоточенность. Доски, пила, линейка — в голове уже есть черновая конструкция: ширина, высота, полки, где нужно усиление. Ты берёшь линейку и проводишь первую линию на доске.

Маркус на другом конце, тоже замеряет. Вы встречаетесь взглядами на секунду. Слова не нужны — разделение труда складывается само: он пилит, ты собираешь, или наоборот.

Часы идут, но ты не чувствуешь спешки. Ты чувствуешь... наконец-то что-то, чей ритм совпадает с твоим.`,

        ja: `カウントダウンが現れた瞬間、体がある状態に切り替わった。

緊張ではない——集中だ。板材、のこぎり、定規——頭の中にはもう大まかな構造がある：幅、高さ、棚板、補強が必要な箇所。定規を手に取り、板に最初の線を引く。

マーカスが反対側で、同じく測っている。一秒だけ目が合う。言葉は要らない——役割分担は自然に生まれる：彼が切り、自分が組む、あるいはその逆。

時計は進んでいるが、焦りは感じない。感じるのは……やっとリズムが合うものに出会えた、という感覚。`,

        ko: `카운트다운이 나타나는 순간, 몸이 하나의 상태로 전환된다.

긴장이 아니다 — 집중이다. 판재, 톱, 자 — 머릿속에는 이미 대략적인 구조가 있다: 폭, 높이, 선반, 보강이 필요한 곳. 자를 집어 들고 판재에 첫 번째 선을 긋는다.

마커스가 반대편에서 역시 재고 있다. 1초간 눈이 마주친다. 말은 필요 없다 — 역할 분담이 자연스럽게 형성된다: 그가 자르고, 내가 조립하거나, 그 반대이거나.

시계는 가고 있지만, 서두르는 느낌은 없다. 느끼는 것은... 드디어 리듬이 나와 맞는 무언가를 만났다는 감각.`,
      },
      score4: {
        zh: `你走到工作台前，看了看那些材料。

木板、锯子、合页——这些东西对你来说不陌生。不一定做过储物柜，但你知道这件事的基本逻辑：先测量，再切割，最后组装。

时间限制让你加快了脚步。你拿起锯子，走向 Marcus。两个人干比一个人快。

你不确定最终会做得多好看，但功能性——你有信心。`,

        en: `You walk to the workbench and look at the materials.

Planks, saw, hinges — these aren't unfamiliar to you. You may not have built a cabinet before, but you know the basic logic: measure first, then cut, then assemble.

The time limit quickens your pace. You pick up the saw and head toward Marcus. Two people are faster than one.

You're not sure how good it'll look in the end, but functionality — you're confident about that.`,

        nl: `Je loopt naar de werkbank en bekijkt de materialen.

Planken, zaag, scharnieren — niet onbekend voor je. Misschien heb je nog nooit een kast gebouwd, maar je kent de basislogica: eerst meten, dan zagen, dan monteren.

De tijdslimiet versnelt je pas. Je pakt de zaag en loopt naar Marcus. Twee mensen zijn sneller dan één.

Je weet niet zeker hoe mooi het er uiteindelijk uitziet, maar functionaliteit — daar heb je vertrouwen in.`,

        de: `Du gehst zur Werkbank und betrachtest die Materialien.

Bretter, Säge, Scharniere — nicht unbekannt für dich. Vielleicht hast du noch nie einen Schrank gebaut, aber die Grundlogik kennst du: erst messen, dann sägen, dann zusammenbauen.

Das Zeitlimit beschleunigt deinen Schritt. Du nimmst die Säge und gehst zu Marcus. Zu zweit geht es schneller.

Du weißt nicht, wie gut es am Ende aussehen wird, aber die Funktionalität — da bist du zuversichtlich.`,

        fr: `Tu t'approches de l'établi et regardes les matériaux.

Planches, scie, charnières — rien d'inconnu pour toi. Tu n'as peut-être jamais construit de meuble, mais tu connais la logique de base : mesurer d'abord, couper ensuite, assembler enfin.

La limite de temps accélère ton pas. Tu prends la scie et te diriges vers Marcus. Deux personnes vont plus vite qu'une.

Tu ne sais pas à quoi ça ressemblera au final, mais la fonctionnalité — ça, tu en es sûr.`,

        es: `Caminas al banco de trabajo y miras los materiales.

Tablas, sierra, bisagras — no te son desconocidas. Quizás nunca hayas construido un gabinete, pero conoces la lógica básica: primero medir, luego cortar, después ensamblar.

El límite de tiempo acelera tu paso. Tomas la sierra y te diriges hacia Marcus. Dos personas son más rápidas que una.

No estás seguro de qué tan bien se verá al final, pero la funcionalidad — de eso tienes confianza.`,

        pt: `Você vai até a bancada e olha os materiais.

Tábuas, serrote, dobradiças — não são estranhos para você. Talvez nunca tenha construído um armário, mas conhece a lógica básica: primeiro medir, depois cortar, depois montar.

O limite de tempo acelera seu passo. Pega o serrote e vai em direção a Marcus. Dois são mais rápidos que um.

Não tem certeza de como vai ficar no final, mas funcionalidade — disso tem confiança.`,

        it: `Ti avvicini al banco da lavoro e guardi i materiali.

Assi, sega, cerniere — non ti sono estranee. Forse non hai mai costruito un armadio, ma conosci la logica di base: prima misurare, poi tagliare, poi assemblare.

Il limite di tempo accelera il tuo passo. Prendi la sega e ti dirigi verso Marcus. In due è più veloce.

Non sei sicuro di quanto sarà bello alla fine, ma sulla funzionalità — sei fiducioso.`,

        ru: `Ты подходишь к рабочему столу и осматриваешь материалы.

Доски, пила, петли — тебе это не чуждо. Может, ты никогда не строил шкаф, но базовую логику знаешь: сначала замерить, потом отпилить, потом собрать.

Ограничение по времени ускоряет шаг. Ты берёшь пилу и направляешься к Маркусу. Вдвоём быстрее.

Не уверен, насколько хорошо это будет выглядеть в итоге, но функциональность — в этом ты уверен.`,

        ja: `作業台に歩み寄り、材料を見る。

板材、のこぎり、蝶番——見慣れないものではない。キャビネットを作った経験はないかもしれないが、基本的な論理は分かる：まず測定、次に切断、そして組み立て。

制限時間が足を速める。のこぎりを手に取り、マーカスの方へ向かう。二人の方が一人より速い。

最終的な見栄えがどうなるかは分からないが、機能性には——自信がある。`,

        ko: `작업대로 걸어가 재료를 살핀다.

판재, 톱, 경첩 — 낯설지 않다. 캐비닛을 만들어 본 적은 없을지 모르지만, 기본적인 논리는 안다: 먼저 측정, 다음에 절단, 그리고 조립.

시간 제한이 발걸음을 빠르게 한다. 톱을 집어 들고 마커스 쪽으로 간다. 두 사람이 한 사람보다 빠르다.

최종적으로 얼마나 보기 좋을지는 모르겠지만, 기능성에는 — 자신이 있다.`,
      },
      score3: {
        zh: `倒计时在屏幕上跳动着。

你看了看那些材料——木板、工具、螺丝。建造一个储物柜……你能做，但你没有那种立刻冲过去的冲动。

你犹豫了几秒。时间限制给了你一点压力，但不足以改变你的核心感觉：这件事不是特别呼唤你。

你走过去帮忙扶木板。参与了，但不是主力。`,

        en: `The countdown ticks on the screen.

You look at the materials — planks, tools, screws. Building a storage cabinet... you could do it, but you don't feel the rush to charge over.

You hesitate for a few seconds. The time pressure creates some urgency, but not enough to override your core feeling: this task doesn't particularly call to you.

You walk over to help hold a plank. Involved, but not the main force.`,

        nl: `De aftelling tikt op het scherm.

Je kijkt naar de materialen — planken, gereedschap, schroeven. Een opslagkast bouwen... je zou het kunnen, maar je voelt niet de drang om ernaartoe te rennen.

Je aarzelt een paar seconden. De tijdsdruk creëert enige urgentie, maar niet genoeg om je kerngevoel te overrulen: deze taak roept je niet bijzonder.

Je loopt erheen om een plank vast te houden. Betrokken, maar niet de hoofdkracht.`,

        de: `Der Countdown tickt auf dem Bildschirm.

Du schaust auf die Materialien — Bretter, Werkzeug, Schrauben. Einen Schrank bauen... du könntest es, aber der Drang, sofort loszulegen, fehlt.

Du zögerst ein paar Sekunden. Der Zeitdruck erzeugt etwas Dringlichkeit, aber nicht genug, um dein Grundgefühl zu überstimmen: Diese Aufgabe ruft dich nicht besonders.

Du gehst hin, um ein Brett zu halten. Beteiligt, aber nicht die treibende Kraft.`,

        fr: `Le compte à rebours défile à l'écran.

Tu regardes les matériaux — planches, outils, vis. Construire un meuble de rangement... tu pourrais, mais tu ne ressens pas l'urgence de foncer.

Tu hésites quelques secondes. La pression du temps crée un certain sentiment d'urgence, mais pas assez pour supplanter ton ressenti profond : cette tâche ne t'appelle pas particulièrement.

Tu t'approches pour aider à tenir une planche. Impliqué, mais pas la force principale.`,

        es: `La cuenta regresiva avanza en la pantalla.

Miras los materiales — tablas, herramientas, tornillos. Construir un gabinete de almacenamiento... podrías hacerlo, pero no sientes la urgencia de lanzarte.

Dudas unos segundos. La presión del tiempo genera cierta urgencia, pero no la suficiente para anular tu sentimiento esencial: esta tarea no te llama particularmente.

Te acercas para ayudar a sujetar una tabla. Involucrado, pero no la fuerza principal.`,

        pt: `A contagem regressiva avança na tela.

Você olha os materiais — tábuas, ferramentas, parafusos. Construir um armário... poderia fazer, mas não sente a urgência de se lançar.

Hesita por alguns segundos. A pressão do tempo gera certa urgência, mas não o suficiente para sobrepor seu sentimento central: esta tarefa não te chama particularmente.

Vai até lá ajudar a segurar uma tábua. Envolvido, mas não a força principal.`,

        it: `Il conto alla rovescia scorre sullo schermo.

Guardi i materiali — assi, attrezzi, viti. Costruire un armadio... potresti, ma non senti l'impulso di buttarti.

Esiti per qualche secondo. La pressione del tempo crea un po' di urgenza, ma non abbastanza da sovrascrivere la tua sensazione di fondo: questo compito non ti chiama particolarmente.

Ti avvicini per aiutare a tenere un'asse. Coinvolto, ma non la forza principale.`,

        ru: `Обратный отсчёт тикает на экране.

Ты смотришь на материалы — доски, инструменты, шурупы. Построить шкаф... ты мог бы, но порыва броситься туда нет.

Колеблешься несколько секунд. Давление времени создаёт некоторую срочность, но недостаточную, чтобы перебить глубинное чувство: эта задача тебя не особо зовёт.

Подходишь, помогаешь держать доску. Участвуешь, но не как основная сила.`,

        ja: `画面でカウントダウンが刻まれている。

材料を見る——板材、工具、ねじ。収納キャビネットを作る……やれはする。だが駆け寄りたいという衝動がない。

数秒ためらう。時間的プレッシャーは多少の緊迫感を生むが、核心の感覚を覆すほどではない：この作業は特に自分を呼んでいない。

歩み寄って板材を押さえる手伝いをする。関わっているが、主力ではない。`,

        ko: `카운트다운이 화면에서 흘러간다.

재료를 본다 — 판재, 도구, 나사. 수납 캐비닛을 만드는 것... 할 수는 있지만, 달려가고 싶은 충동은 없다.

몇 초간 망설인다. 시간 압박이 어느 정도의 긴박함을 만들지만, 핵심적인 느낌을 덮어쓸 만큼은 아니다: 이 과제가 특별히 나를 부르지 않는다.

다가가서 판재를 잡아주는 것을 돕는다. 참여하지만, 주력은 아니다.`,
      },
      score2: {
        zh: `倒计时出来了。你看了一眼那些木板和工具。

从零建造一个柜子——测量、锯切、组装。你知道怎么做，大概。但那种想动手的感觉不在。时间限制制造了紧迫感，但紧迫感不等于意愿。

Marcus 一个人在那边忙了。你在旁边，做一些能帮上忙的小事。但这件事的主人不是你。`,

        en: `The countdown starts. You look at the planks and tools.

Building a cabinet from scratch — measuring, sawing, assembling. You roughly know how. But the desire to get your hands on it isn't there. The time limit creates urgency, but urgency isn't the same as willingness.

Marcus is busy on his own. You're nearby, doing small things that help. But this task's owner isn't you.`,

        nl: `De aftelling begint. Je kijkt naar de planken en het gereedschap.

Een kast bouwen van de grond af — meten, zagen, monteren. Je weet ruwweg hoe. Maar het verlangen om je handen erin te steken ontbreekt. De tijdslimiet creëert urgentie, maar urgentie is niet hetzelfde als bereidheid.

Marcus is op zichzelf bezig. Je bent in de buurt, doet kleine dingen die helpen. Maar de eigenaar van deze taak ben jij niet.`,

        de: `Der Countdown beginnt. Du schaust auf die Bretter und Werkzeuge.

Einen Schrank von Grund auf bauen — messen, sägen, zusammenbauen. Ungefähr weißt du, wie es geht. Aber das Verlangen, Hand anzulegen, ist nicht da. Das Zeitlimit erzeugt Dringlichkeit, aber Dringlichkeit ist nicht dasselbe wie Bereitschaft.

Marcus ist allein beschäftigt. Du bist in der Nähe, erledigst kleine hilfreiche Dinge. Aber der Eigentümer dieser Aufgabe bist du nicht.`,

        fr: `Le compte à rebours démarre. Tu regardes les planches et les outils.

Construire un meuble à partir de rien — mesurer, scier, assembler. Tu sais à peu près comment. Mais l'envie de t'y mettre n'est pas là. La limite de temps crée de l'urgence, mais l'urgence n'est pas la même chose que la volonté.

Marcus s'affaire seul. Tu es à proximité, faisant de petites choses utiles. Mais le propriétaire de cette tâche, ce n'est pas toi.`,

        es: `La cuenta regresiva comienza. Miras las tablas y las herramientas.

Construir un gabinete desde cero — medir, serrar, ensamblar. Sabes más o menos cómo. Pero el deseo de poner manos a la obra no está ahí. El límite de tiempo genera urgencia, pero urgencia no es lo mismo que voluntad.

Marcus está ocupado por su cuenta. Estás cerca, haciendo pequeñas cosas que ayudan. Pero el dueño de esta tarea no eres tú.`,

        pt: `A contagem regressiva começa. Você olha as tábuas e ferramentas.

Construir um armário do zero — medir, serrar, montar. Sabe mais ou menos como. Mas a vontade de colocar a mão na massa não está lá. O limite de tempo cria urgência, mas urgência não é o mesmo que disposição.

Marcus está ocupado sozinho. Você está por perto, fazendo pequenas coisas que ajudam. Mas o dono desta tarefa não é você.`,

        it: `Il conto alla rovescia parte. Guardi le assi e gli strumenti.

Costruire un armadio da zero — misurare, segare, assemblare. Sai più o meno come si fa. Ma la voglia di metterci le mani non c'è. Il limite di tempo crea urgenza, ma l'urgenza non è la stessa cosa della volontà.

Marcus è impegnato per conto suo. Sei lì vicino, fai piccole cose utili. Ma il proprietario di questo compito non sei tu.`,

        ru: `Обратный отсчёт начался. Ты смотришь на доски и инструменты.

Построить шкаф с нуля — замерить, отпилить, собрать. Примерно знаешь как. Но желания взяться нет. Ограничение времени создаёт срочность, но срочность — не то же самое, что готовность.

Маркус занят сам. Ты рядом, делаешь мелкие полезные вещи. Но хозяин этой задачи — не ты.`,

        ja: `カウントダウンが始まった。板材と道具を見る。

キャビネットをゼロから作る——測定、切断、組み立て。大まかなやり方は分かる。だが手を動かしたいという欲求がない。制限時間は緊迫感を生むが、緊迫感は意欲とは違う。

マーカスは一人で忙しくしている。近くにいて、ちょっとした手伝いをする。だがこの作業の主は自分ではない。`,

        ko: `카운트다운이 시작된다. 판재와 도구를 본다.

캐비닛을 처음부터 만드는 것 — 측정, 절단, 조립. 대략 어떻게 하는지 안다. 하지만 손을 대고 싶은 욕구가 없다. 시간 제한이 긴박함을 만들지만, 긴박함은 의지와 같지 않다.

마커스가 혼자 바쁘게 하고 있다. 곁에 있으면서 작은 도움을 준다. 하지만 이 과제의 주인은 내가 아니다.`,
      },
      score1: {
        zh: `木板、锯子、螺丝。倒计时。

所有这些信号加在一起，你身体里没有产生任何「我要去」的反应。建造这件事——物理的、手动的、从零开始的——完全不在你的本能范围内。

时间在走，但你不打算因为时间压力而做一件你完全没有内驱力的事。Marcus 在那边，速度很快。你确认他能搞定。

你在这个空间里，还剩最后一项任务。也许那个才是你的。`,

        en: `Planks. Saw. Screws. Countdown.

All these signals combined produce zero "let me do it" response in your body. Building — physical, manual, from-scratch — is simply not in your instinct range.

The clock is running, but you're not going to do something you have zero drive for just because of time pressure. Marcus is over there, moving fast. You confirm he can handle it.

One task left in this space. Maybe that one is yours.`,

        nl: `Planken. Zaag. Schroeven. Aftelling.

Al deze signalen samen produceren nul "laat mij het doen"-reactie in je lichaam. Bouwen — fysiek, handmatig, vanaf nul — zit simpelweg niet in je instinctbereik.

De klok tikt, maar je gaat niet iets doen waarvoor je nul motivatie hebt alleen vanwege tijdsdruk. Marcus is daar, beweegt snel. Je bevestigt dat hij het aankan.

Nog één taak in deze ruimte. Misschien is die van jou.`,

        de: `Bretter. Säge. Schrauben. Countdown.

Alle diese Signale zusammen erzeugen null „Lass mich das machen"-Reaktion in deinem Körper. Bauen — physisch, manuell, von Grund auf — liegt schlicht nicht in deinem Instinktbereich.

Die Uhr läuft, aber du wirst nichts tun, wofür du null Antrieb hast, nur wegen Zeitdruck. Marcus ist drüben, arbeitet schnell. Du stellst fest, dass er es schafft.

Eine Aufgabe noch in diesem Raum. Vielleicht ist die deine.`,

        fr: `Planches. Scie. Vis. Compte à rebours.

Tous ces signaux combinés ne produisent aucune réaction « laissez-moi faire » dans ton corps. Construire — physiquement, manuellement, à partir de rien — n'est tout simplement pas dans ton registre instinctif.

L'horloge tourne, mais tu ne vas pas faire quelque chose pour lequel tu n'as aucune motivation juste à cause de la pression du temps. Marcus est là-bas, rapide. Tu confirmes qu'il peut gérer.

Il reste une tâche dans cet espace. Peut-être que celle-là est la tienne.`,

        es: `Tablas. Sierra. Tornillos. Cuenta regresiva.

Todas estas señales combinadas producen cero respuesta de "déjame hacerlo" en tu cuerpo. Construir — físico, manual, desde cero — simplemente no está en tu rango instintivo.

El reloj avanza, pero no vas a hacer algo para lo que tienes cero motivación solo por presión de tiempo. Marcus está allí, moviéndose rápido. Confirmas que puede manejarlo.

Queda una tarea en este espacio. Quizás esa sea la tuya.`,

        pt: `Tábuas. Serrote. Parafusos. Contagem regressiva.

Todos esses sinais combinados produzem zero resposta de "deixa eu fazer" no seu corpo. Construir — físico, manual, do zero — simplesmente não está na sua faixa instintiva.

O relógio corre, mas você não vai fazer algo para o qual tem zero motivação só por pressão de tempo. Marcus está lá, se movendo rápido. Você confirma que ele dá conta.

Resta uma tarefa neste espaço. Talvez aquela seja a sua.`,

        it: `Assi. Sega. Viti. Conto alla rovescia.

Tutti questi segnali messi insieme producono zero reazione "lascia fare a me" nel tuo corpo. Costruire — fisico, manuale, da zero — semplicemente non rientra nel tuo raggio istintivo.

L'orologio scorre, ma non farai qualcosa per cui hai zero motivazione solo per la pressione del tempo. Marcus è lì, si muove veloce. Confermi che ce la può fare.

Un compito rimane in questo spazio. Forse quello è il tuo.`,

        ru: `Доски. Пила. Шурупы. Обратный отсчёт.

Все эти сигналы вместе дают ноль реакции «дай я сделаю» в твоём теле. Строить — физически, руками, с нуля — просто не в твоём инстинктивном диапазоне.

Часы идут, но ты не собираешься делать то, к чему у тебя нулевая тяга, лишь из-за давления времени. Маркус там, работает быстро. Ты убеждаешься, что он справится.

Осталась одна задача в этом пространстве. Может, она — твоя.`,

        ja: `板材。のこぎり。ねじ。カウントダウン。

これらのシグナルがすべて合わさっても、体の中に「やらせてくれ」という反応はゼロだ。建造する——物理的、手作業、ゼロから——は単純に自分の本能の範囲にない。

時計は進んでいるが、時間的プレッシャーだけでまったく動力のないことをするつもりはない。マーカスはあちらで、速く動いている。彼がやれると確認する。

この空間に残るタスクはあと一つ。もしかしたらそれが自分のものかもしれない。`,

        ko: `판재. 톱. 나사. 카운트다운.

이 모든 신호가 합쳐져도 몸에서 "내가 하겠다"는 반응은 제로다. 건축 — 물리적이고, 수작업이며, 처음부터 — 는 단순히 내 본능의 범위에 없다.

시계는 가고 있지만, 시간 압박 때문에 동력이 전혀 없는 일을 할 생각은 없다. 마커스가 저쪽에서 빠르게 움직이고 있다. 그가 해낼 수 있음을 확인한다.

이 공간에 남은 과제가 하나. 어쩌면 그것이 나의 것일지도 모른다.`,
      },
    },
  },

  // ── Q5: Test the quality of parts before shipment ──────────
  {
    id: 5,
    riasec: "R",
    miniIpCode: "R5",
    miniIpItem: "Test the quality of parts before shipment",
    chapter: "mechanical",
    chapterIndex: 1,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `储物柜装好了。机器在运转，产品在储存，一切看起来已经就位。

但屏幕上的进度环还差最后一截。

最后一条指令：
「子系统五：质量验证。系统确认完成前，所有已生产的产品和已修复的部件需通过质量检测。不合格品必须标记。」

工作台上出现了检测工具：卡尺、测试仪、标准样品、检测表格。一批零件和产品整齐摆在那里，等待逐一检验。

这是最后一步。不需要创造力，不需要大动作——只需要有人认真地、仔细地、一个一个检测，确保每一件东西都达标。

Marcus 退后了一步。他已经做了太多了。
Nora 拿着本子，准备记录结果。
现在需要的是：有人拿起检测工具，开始工作。`,

      en: `The cabinet is built. The machine is running, products are being stored, everything seems in place.

But the progress ring is still missing its final segment.

The last instruction:
"Subsystem five: Quality Verification. Before the system confirms completion, all manufactured products and repaired parts must pass quality inspection. Non-conforming items must be flagged."

Inspection tools appear on the workbench: calipers, a testing unit, reference samples, inspection forms. A batch of parts and products is laid out, waiting to be checked one by one.

This is the final step. No creativity, no big moves — just someone who will carefully, meticulously, one by one, test every item to make sure it meets the standard.

Marcus steps back. He's done too much already.
Nora holds her notebook, ready to record.
What's needed now: someone to pick up the inspection tools and get to work.`,

      nl: `De kast is gebouwd. De machine draait, producten worden opgeslagen, alles lijkt op z'n plek.

Maar de voortgangsring mist nog zijn laatste segment.

De laatste instructie verschijnt:
"Subsysteem vijf: Kwaliteitsverificatie. Voordat het systeem voltooiing bevestigt, moeten alle geproduceerde producten en gerepareerde onderdelen de kwaliteitscontrole doorstaan. Afgekeurde items moeten worden gemarkeerd."

Inspectie-instrumenten verschijnen op de werkbank: schuifmaat, testapparaat, referentiemonsters, inspectieformulieren. Een partij onderdelen en producten ligt netjes klaar, wachtend om één voor één gecontroleerd te worden.

Dit is de laatste stap. Geen creativiteit nodig, geen grote bewegingen — alleen iemand die zorgvuldig, nauwgezet, stuk voor stuk elk item test om er zeker van te zijn dat het aan de norm voldoet.

Marcus doet een stap terug. Hij heeft al te veel gedaan.
Nora houdt haar notitieboekje vast, klaar om resultaten te noteren.
Wat nu nodig is: iemand die de inspectie-instrumenten oppakt en aan het werk gaat.`,

      de: `Der Schrank steht. Die Maschine läuft, Produkte werden eingelagert, alles scheint an seinem Platz.

Doch dem Fortschrittsring fehlt noch das letzte Segment.

Die letzte Anweisung erscheint:
„Subsystem fünf: Qualitätsprüfung. Bevor das System den Abschluss bestätigt, müssen alle hergestellten Produkte und reparierten Teile die Qualitätskontrolle bestehen. Fehlerhafte Teile müssen markiert werden."

Prüfwerkzeuge erscheinen auf der Werkbank: Messschieber, ein Testgerät, Referenzproben, Prüfformulare. Eine Charge Teile und Produkte liegt ordentlich bereit, wartet darauf, Stück für Stück geprüft zu werden.

Das ist der letzte Schritt. Keine Kreativität nötig, keine großen Aktionen — nur jemand, der sorgfältig, gewissenhaft, eines nach dem anderen jedes Teil prüft, um sicherzustellen, dass es dem Standard entspricht.

Marcus tritt zurück. Er hat schon zu viel gemacht.
Nora hält ihr Notizbuch, bereit, Ergebnisse zu notieren.
Was jetzt gebraucht wird: jemand, der die Prüfwerkzeuge nimmt und anfängt.`,

      fr: `Le meuble est construit. La machine tourne, les produits sont stockés, tout semble en place.

Mais l'anneau de progression n'a toujours pas son dernier segment.

La dernière instruction apparaît :
« Sous-système cinq : Vérification qualité. Avant que le système ne confirme l'achèvement, tous les produits fabriqués et les pièces réparées doivent passer le contrôle qualité. Les éléments non conformes doivent être signalés. »

Des outils d'inspection apparaissent sur l'établi : un pied à coulisse, un appareil de test, des échantillons de référence, des formulaires d'inspection. Un lot de pièces et de produits est soigneusement disposé, en attente d'être vérifié un par un.

C'est la dernière étape. Pas besoin de créativité, pas de grands gestes — juste quelqu'un qui, soigneusement, méticuleusement, un par un, testera chaque élément pour s'assurer qu'il est conforme.

Marcus recule. Il en a déjà fait trop.
Nora tient son carnet, prête à noter les résultats.
Ce qu'il faut maintenant : quelqu'un pour prendre les outils d'inspection et se mettre au travail.`,

      es: `El gabinete está construido. La máquina funciona, los productos se almacenan, todo parece en orden.

Pero al anillo de progreso aún le falta el último segmento.

La última instrucción aparece:
"Subsistema cinco: Verificación de Calidad. Antes de que el sistema confirme la finalización, todos los productos fabricados y las piezas reparadas deben pasar la inspección de calidad. Los artículos no conformes deben ser marcados."

Herramientas de inspección aparecen en el banco de trabajo: calibrador, unidad de prueba, muestras de referencia, formularios de inspección. Un lote de piezas y productos está pulcramente dispuesto, esperando ser revisado uno por uno.

Este es el último paso. No se necesita creatividad, ni grandes movimientos — solo alguien que, cuidadosa y meticulosamente, uno por uno, pruebe cada artículo para asegurar que cumple con el estándar.

Marcus retrocede. Ya ha hecho demasiado.
Nora sostiene su libreta, lista para registrar resultados.
Lo que se necesita ahora: alguien que tome las herramientas de inspección y se ponga a trabajar.`,

      pt: `O armário está construído. A máquina funciona, os produtos estão sendo armazenados, tudo parece em ordem.

Mas o anel de progresso ainda está sem seu segmento final.

A última instrução aparece:
"Subsistema cinco: Verificação de Qualidade. Antes que o sistema confirme a conclusão, todos os produtos fabricados e peças reparadas devem passar pela inspeção de qualidade. Itens não conformes devem ser sinalizados."

Ferramentas de inspeção aparecem na bancada: paquímetro, unidade de teste, amostras de referência, formulários de inspeção. Um lote de peças e produtos está cuidadosamente disposto, esperando ser verificado um por um.

Este é o último passo. Sem necessidade de criatividade, sem grandes movimentos — apenas alguém que, cuidadosa e meticulosamente, um por um, teste cada item para garantir que atende ao padrão.

Marcus recua. Já fez demais.
Nora segura seu caderno, pronta para registrar resultados.
O que é preciso agora: alguém para pegar as ferramentas de inspeção e começar a trabalhar.`,

      it: `L'armadio è costruito. La macchina funziona, i prodotti vengono stoccati, tutto sembra a posto.

Ma all'anello di progresso manca ancora l'ultimo segmento.

L'ultima istruzione appare:
"Sottosistema cinque: Verifica Qualità. Prima che il sistema confermi il completamento, tutti i prodotti fabbricati e i pezzi riparati devono superare l'ispezione qualità. Gli articoli non conformi devono essere contrassegnati."

Strumenti di ispezione appaiono sul banco da lavoro: calibro, unità di test, campioni di riferimento, moduli di ispezione. Un lotto di pezzi e prodotti è disposto ordinatamente, in attesa di essere controllato uno per uno.

Questo è l'ultimo passaggio. Nessuna creatività necessaria, nessun grande gesto — solo qualcuno che, con cura e meticolosità, uno per uno, testi ogni articolo per assicurarsi che sia conforme allo standard.

Marcus fa un passo indietro. Ha già fatto troppo.
Nora tiene il suo quaderno, pronta a registrare i risultati.
Ciò che serve ora: qualcuno che prenda gli strumenti di ispezione e si metta al lavoro.`,

      ru: `Шкаф построен. Машина работает, продукция складируется, всё, кажется, на месте.

Но кольцу прогресса всё ещё не хватает последнего сегмента.

Появляется последняя инструкция:
«Подсистема пять: Проверка качества. До подтверждения системой завершения все произведённые продукты и отремонтированные детали должны пройти контроль качества. Несоответствующие изделия должны быть отмечены.»

На рабочем столе появляются инструменты контроля: штангенциркуль, тестовое устройство, эталонные образцы, бланки проверки. Партия деталей и продуктов аккуратно разложена, ожидая поштучной проверки.

Это последний шаг. Не нужна креативность, не нужны масштабные действия — нужен лишь кто-то, кто аккуратно, скрупулёзно, одну за другой проверит каждую деталь на соответствие стандарту.

Маркус отступает. Он уже сделал слишком много.
Нора держит блокнот, готовая записывать результаты.
Сейчас нужно: кто-то, кто возьмёт инструменты контроля и приступит к работе.`,

      ja: `キャビネットができた。機械は稼働し、製品は保管され、すべて整ったように見える。

だが進捗リングにはまだ最後のセグメントが足りない。

最後の指示が現れる：
「サブシステム5：品質検証。システムが完了を確認する前に、すべての製造品と修理部品が品質検査に合格する必要がある。不合格品にはフラグを付けること。」

作業台に検査道具が現れる：ノギス、テスター、基準サンプル、検査表。一連の部品と製品が整然と並べられ、一つずつ検査されるのを待っている。

これが最後のステップだ。創造力は不要、大きな動きも不要——ただ丁寧に、几帳面に、一つずつ、すべての品目が基準を満たしているか確認する人が必要なだけだ。

マーカスが一歩引く。彼はもう十分すぎるほどやった。
ノラがノートを持ち、結果の記録に備えている。
今必要なのは：検査道具を手に取り、作業を始める人だ。`,

      ko: `캐비닛이 완성됐다. 기계가 돌아가고, 제품이 보관되고, 모든 것이 제자리에 있는 것 같다.

하지만 진행 링에는 아직 마지막 구간이 빠져 있다.

마지막 지시가 나타난다:
"서브시스템 5: 품질 검증. 시스템이 완료를 확인하기 전에, 모든 제조 제품과 수리된 부품이 품질 검사를 통과해야 한다. 부적합 항목은 표시해야 한다."

작업대에 검사 도구가 나타난다: 캘리퍼스, 테스트 장치, 기준 샘플, 검사 양식. 부품과 제품 한 묶음이 깔끔하게 놓여 있어, 하나씩 검사받기를 기다리고 있다.

이것이 마지막 단계다. 창의력도 필요 없고, 큰 움직임도 필요 없다 — 그저 꼼꼼하게, 세심하게, 하나씩 모든 항목을 테스트하여 기준을 충족하는지 확인할 사람이 필요할 뿐이다.

마커스가 한 걸음 물러선다. 이미 너무 많이 했다.
노라가 노트를 들고, 결과를 기록할 준비를 한다.
지금 필요한 것: 누군가 검사 도구를 집어 들고 작업을 시작하는 것이다.`,
    },
    taskDescription: {
      zh: "使用检测工具逐一检验已生产的零件和产品的质量，标记不合格品，确保所有部件达到出货标准。所有人都可以参与。",

      en: `Use the inspection tools to test every part and product for quality, flag non-conforming items, and ensure all components meet shipping standards. Everyone can participate.`,

      nl: `Gebruik de inspectie-instrumenten om elk onderdeel en product op kwaliteit te testen, markeer afgekeurde items en zorg dat alle componenten aan de verzendstandaarden voldoen. Iedereen kan meedoen.`,

      de: `Nutze die Prüfwerkzeuge, um jedes Teil und Produkt auf Qualität zu testen, markiere fehlerhafte Teile und stelle sicher, dass alle Komponenten den Versandstandards entsprechen. Alle können mitmachen.`,

      fr: `Utilisez les outils d'inspection pour tester la qualité de chaque pièce et produit, signalez les éléments non conformes et assurez-vous que tous les composants répondent aux normes d'expédition. Tout le monde peut participer.`,

      es: `Usa las herramientas de inspección para probar la calidad de cada pieza y producto, marca los artículos no conformes y asegúrate de que todos los componentes cumplan los estándares de envío. Todos pueden participar.`,

      pt: `Use as ferramentas de inspeção para testar a qualidade de cada peça e produto, sinalize itens não conformes e garanta que todos os componentes atendam aos padrões de expedição. Todos podem participar.`,

      it: `Usa gli strumenti di ispezione per testare la qualità di ogni pezzo e prodotto, contrassegna gli articoli non conformi e assicurati che tutti i componenti soddisfino gli standard di spedizione. Tutti possono partecipare.`,

      ru: `Используйте инструменты контроля для проверки качества каждой детали и продукта, отметьте несоответствующие изделия и убедитесь, что все компоненты соответствуют стандартам отгрузки. Участвовать могут все.`,

      ja: `検査道具を使い、すべての部品と製品の品質をテストし、不合格品にフラグを付け、すべての部品が出荷基準を満たしていることを確認する。全員が参加可能。`,

      ko: `검사 도구를 사용하여 모든 부품과 제품의 품질을 테스트하고, 부적합 항목을 표시하며, 모든 부품이 출하 기준을 충족하는지 확인하라. 모두 참여할 수 있다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你拿起了卡尺。

这个环节对你来说有一种奇特的舒适感——不是兴奋，是安定。每一个零件拿起来，量，对比标准值，记录，放下，拿起下一个。重复、精确、有确定性。

你能感觉到自己进入了一种状态：每一次测量都让你更确定，每一个合格都让系统更完整。

Nora 在旁边记录，你们的速度慢慢同步了。两个人，一套流程，不需要多余的话。`,

        en: `You pick up the calipers.

This stage brings a peculiar comfort — not excitement, but calm. Pick up each part, measure, compare to the standard, record, set down, pick up the next. Repetitive, precise, certain.

You feel yourself entering a state: each measurement makes you more sure, each pass makes the system more complete.

Nora records beside you. Your speeds gradually sync. Two people, one process, no unnecessary words.`,

        nl: `Je pakt de schuifmaat op.

Deze fase brengt een eigenaardig comfort — geen opwinding, maar kalmte. Elk onderdeel oppakken, meten, vergelijken met de standaard, noteren, neerleggen, het volgende pakken. Herhalend, precies, zeker.

Je voelt jezelf in een staat komen: elke meting maakt je zekerder, elke goedkeuring maakt het systeem completer.

Nora noteert naast je. Jullie snelheden synchroniseren geleidelijk. Twee mensen, één proces, geen overbodige woorden.`,

        de: `Du nimmst den Messschieber.

Diese Phase bringt einen eigentümlichen Komfort — keine Aufregung, sondern Ruhe. Jedes Teil aufnehmen, messen, mit dem Standard vergleichen, notieren, ablegen, das nächste nehmen. Wiederholt, präzise, sicher.

Du spürst, wie du in einen Zustand eintauchst: Jede Messung macht dich sicherer, jede Freigabe macht das System vollständiger.

Nora notiert neben dir. Eure Geschwindigkeiten synchronisieren sich allmählich. Zwei Leute, ein Prozess, keine überflüssigen Worte.`,

        fr: `Tu prends le pied à coulisse.

Cette étape apporte un confort particulier — pas de l'excitation, mais du calme. Prendre chaque pièce, mesurer, comparer au standard, noter, reposer, prendre la suivante. Répétitif, précis, certain.

Tu te sens entrer dans un état : chaque mesure te rend plus sûr, chaque validation rend le système plus complet.

Nora note à côté de toi. Vos vitesses se synchronisent progressivement. Deux personnes, un processus, aucun mot superflu.`,

        es: `Tomas el calibrador.

Esta etapa trae una comodidad peculiar — no emoción, sino calma. Tomar cada pieza, medir, comparar con el estándar, registrar, dejar, tomar la siguiente. Repetitivo, preciso, cierto.

Sientes que entras en un estado: cada medición te da más seguridad, cada aprobación hace el sistema más completo.

Nora registra a tu lado. Sus velocidades se sincronizan gradualmente. Dos personas, un proceso, sin palabras innecesarias.`,

        pt: `Você pega o paquímetro.

Esta etapa traz um conforto peculiar — não empolgação, mas calma. Pegar cada peça, medir, comparar com o padrão, registrar, colocar de volta, pegar a próxima. Repetitivo, preciso, certo.

Você se sente entrando em um estado: cada medição te deixa mais seguro, cada aprovação torna o sistema mais completo.

Nora registra ao seu lado. Seus ritmos gradualmente se sincronizam. Duas pessoas, um processo, nenhuma palavra desnecessária.`,

        it: `Prendi il calibro.

Questa fase porta un comfort peculiare — non eccitazione, ma calma. Prendere ogni pezzo, misurare, confrontare con lo standard, registrare, posare, prendere il successivo. Ripetitivo, preciso, certo.

Senti di entrare in uno stato: ogni misurazione ti rende più sicuro, ogni approvazione rende il sistema più completo.

Nora registra accanto a te. Le vostre velocità si sincronizzano gradualmente. Due persone, un processo, nessuna parola superflua.`,

        ru: `Ты берёшь штангенциркуль.

Этот этап приносит своеобразный комфорт — не возбуждение, а спокойствие. Взять каждую деталь, измерить, сравнить со стандартом, записать, отложить, взять следующую. Повторяемость, точность, определённость.

Ты чувствуешь, как входишь в состояние: каждое измерение делает тебя увереннее, каждое «годен» делает систему полнее.

Нора записывает рядом. Ваши темпы постепенно синхронизируются. Двое людей, один процесс, ни одного лишнего слова.`,

        ja: `ノギスを手に取る。

この段階には独特の安らぎがある——興奮ではなく、静けさだ。部品を一つ拾い、測定し、基準と比較し、記録し、置き、次を拾う。反復的で、正確で、確実。

ある状態に入っていくのを感じる：測定のたびに確信が増し、合格のたびにシステムが完全に近づく。

ノラが横で記録している。二人の速度が徐々に同期する。二人、一つのプロセス、余分な言葉はない。`,

        ko: `캘리퍼스를 집는다.

이 단계에는 독특한 편안함이 있다 — 흥분이 아닌 고요함. 부품을 하나씩 집고, 측정하고, 기준과 비교하고, 기록하고, 내려놓고, 다음 것을 집는다. 반복적이고, 정밀하며, 확실하다.

어떤 상태에 들어가는 것을 느낀다: 측정할 때마다 확신이 커지고, 합격할 때마다 시스템이 더 완전해진다.

노라가 옆에서 기록한다. 둘의 속도가 점차 동기화된다. 두 사람, 하나의 프로세스, 불필요한 말은 없다.`,
      },
      score4: {
        zh: `你走过去，拿起检测表格看了一遍。

标准是清楚的，流程是明确的。一个一个检测——这种工作你可以做，而且可以做得仔细。

你拿起第一个零件，用卡尺量了尺寸，对了一下标准值。合格。你在表格上打了个勾，拿起第二个。

不是最刺激的工作，但你愿意把它做好。`,

        en: `You walk over and pick up the inspection form for a read-through.

Standards are clear. Process is defined. Testing one by one — this kind of work you can do, and do thoroughly.

You pick up the first part, measure with the calipers, check against the standard. Pass. You mark the form and pick up the second.

Not the most thrilling work, but you're willing to do it well.`,

        nl: `Je loopt ernaartoe en pakt het inspectieformulier om het door te lezen.

Normen zijn helder. Het proces is vastgelegd. Stuk voor stuk testen — dit soort werk kun je, en grondig ook.

Je pakt het eerste onderdeel, meet met de schuifmaat, controleert tegen de standaard. Goedgekeurd. Je vinkt het formulier aan en pakt het tweede.

Niet het meest opwindende werk, maar je bent bereid het goed te doen.`,

        de: `Du gehst hin und nimmst das Prüfformular zum Durchlesen.

Standards sind klar. Der Prozess ist definiert. Eins nach dem anderen testen — diese Art Arbeit kannst du, und zwar gründlich.

Du nimmst das erste Teil, misst mit dem Messschieber, vergleichst mit dem Standard. Bestanden. Du markierst das Formular und nimmst das zweite.

Nicht die aufregendste Arbeit, aber du bist bereit, sie gut zu machen.`,

        fr: `Tu t'approches et prends le formulaire d'inspection pour le parcourir.

Les normes sont claires. Le processus est défini. Tester un par un — ce genre de travail, tu peux le faire, et le faire à fond.

Tu prends la première pièce, mesures avec le pied à coulisse, compares au standard. Conforme. Tu coches le formulaire et prends la deuxième.

Pas le travail le plus passionnant, mais tu es disposé à bien le faire.`,

        es: `Caminas y tomas el formulario de inspección para revisarlo.

Los estándares son claros. El proceso está definido. Probar uno por uno — este tipo de trabajo puedes hacerlo, y hacerlo a fondo.

Tomas la primera pieza, mides con el calibrador, comparas con el estándar. Aprobada. Marcas el formulario y tomas la segunda.

No es el trabajo más emocionante, pero estás dispuesto a hacerlo bien.`,

        pt: `Você se aproxima e pega o formulário de inspeção para ler.

Os padrões são claros. O processo está definido. Testar um por um — esse tipo de trabalho você consegue, e com rigor.

Pega a primeira peça, mede com o paquímetro, confere com o padrão. Aprovada. Marca o formulário e pega a segunda.

Não é o trabalho mais empolgante, mas está disposto a fazê-lo bem.`,

        it: `Ti avvicini e prendi il modulo di ispezione per una lettura.

Gli standard sono chiari. Il processo è definito. Testare uno per uno — questo tipo di lavoro lo sai fare, e con accuratezza.

Prendi il primo pezzo, misuri con il calibro, confronti con lo standard. Conforme. Segni il modulo e prendi il secondo.

Non il lavoro più entusiasmante, ma sei disposto a farlo bene.`,

        ru: `Ты подходишь и берёшь бланк проверки, чтобы прочитать.

Стандарты понятны. Процесс определён. Проверять по одному — такую работу ты можешь выполнять, и тщательно.

Берёшь первую деталь, измеряешь штангенциркулем, сверяешь со стандартом. Годна. Отмечаешь в бланке и берёшь вторую.

Не самая захватывающая работа, но ты готов сделать её хорошо.`,

        ja: `歩み寄り、検査表を手に取って目を通す。

基準は明確だ。プロセスは定義されている。一つずつテストする——この種の作業はできるし、しっかりやれる。

最初の部品を手に取り、ノギスで測定し、基準と照合する。合格。表に印をつけ、二つ目を手に取る。

最も刺激的な作業ではないが、きちんとやる意志がある。`,

        ko: `다가가서 검사 양식을 집어 읽어본다.

기준은 명확하다. 프로세스는 정의되어 있다. 하나씩 테스트하는 것 — 이런 종류의 작업은 할 수 있고, 꼼꼼하게 할 수 있다.

첫 번째 부품을 집고, 캘리퍼스로 측정하고, 기준과 대조한다. 합격. 양식에 표시하고 두 번째를 집는다.

가장 짜릿한 일은 아니지만, 잘 해낼 의지가 있다.`,
      },
      score3: {
        zh: `你看了看那些等待检测的零件，又看了看检测工具。

质检这件事……你可以做。但说实话，一个一个地量、一个一个地记，这种重复性的工作不是你最有热情的类型。

你拿起了一个零件，看了看，放下了。也许你会帮忙检测几个，但你不会是主力。`,

        en: `You look at the parts waiting for inspection, then at the testing tools.

Quality control... you could do it. But honestly, measuring one by one, recording one by one — this kind of repetitive work isn't what you're most passionate about.

You pick up one part, look at it, set it down. Maybe you'll test a few, but you won't be the main force.`,

        nl: `Je kijkt naar de onderdelen die wachten op inspectie, dan naar het testgereedschap.

Kwaliteitscontrole... je zou het kunnen. Maar eerlijk gezegd, stuk voor stuk meten, stuk voor stuk noteren — dit soort repetitief werk is niet waar je het meest gepassioneerd over bent.

Je pakt één onderdeel op, bekijkt het, legt het neer. Misschien test je er een paar, maar de hoofdkracht word je niet.`,

        de: `Du schaust auf die Teile, die auf Prüfung warten, dann auf die Testgeräte.

Qualitätskontrolle... du könntest es. Aber ehrlich gesagt, eins nach dem anderen messen, eins nach dem anderen notieren — diese Art repetitiver Arbeit ist nicht das, wofür du am meisten brennst.

Du nimmst ein Teil, schaust es an, legst es ab. Vielleicht prüfst du ein paar, aber die treibende Kraft wirst du nicht sein.`,

        fr: `Tu regardes les pièces en attente d'inspection, puis les outils de test.

Le contrôle qualité... tu pourrais. Mais honnêtement, mesurer un par un, noter un par un — ce genre de travail répétitif n'est pas ce qui te passionne le plus.

Tu prends une pièce, la regardes, la reposes. Peut-être que tu en testeras quelques-unes, mais tu ne seras pas la force principale.`,

        es: `Miras las piezas esperando inspección, luego las herramientas de prueba.

Control de calidad... podrías hacerlo. Pero honestamente, medir uno por uno, registrar uno por uno — este tipo de trabajo repetitivo no es lo que más te apasiona.

Tomas una pieza, la miras, la dejas. Quizás pruebes unas cuantas, pero no serás la fuerza principal.`,

        pt: `Você olha as peças esperando inspeção, depois as ferramentas de teste.

Controle de qualidade... poderia fazer. Mas honestamente, medir um por um, registrar um por um — esse tipo de trabalho repetitivo não é o que mais te apaixona.

Pega uma peça, olha, coloca de volta. Talvez teste algumas, mas não será a força principal.`,

        it: `Guardi i pezzi in attesa di ispezione, poi gli strumenti di test.

Controllo qualità... potresti. Ma onestamente, misurare uno per uno, registrare uno per uno — questo tipo di lavoro ripetitivo non è ciò che ti appassiona di più.

Prendi un pezzo, lo guardi, lo posi. Forse ne testerai qualcuno, ma non sarai la forza principale.`,

        ru: `Ты смотришь на детали, ожидающие проверки, затем на инструменты контроля.

Контроль качества... ты мог бы. Но, честно говоря, измерять по одной, записывать по одной — этот вид повторяющейся работы не то, к чему у тебя больше всего страсти.

Берёшь одну деталь, смотришь на неё, кладёшь обратно. Может, проверишь несколько, но основной силой не станешь.`,

        ja: `検査を待つ部品を見て、次に検査道具を見る。

品質検査……やれはする。だが正直なところ、一つずつ測定し、一つずつ記録する——こういう反復作業は最も情熱を傾けるタイプではない。

部品を一つ拾い、見て、置く。いくつかはテストするかもしれないが、主力にはならない。`,

        ko: `검사를 기다리는 부품들을 보고, 그다음 검사 도구를 본다.

품질 관리... 할 수는 있다. 하지만 솔직히, 하나씩 측정하고 하나씩 기록하는 — 이런 반복적인 작업은 가장 열정을 느끼는 유형이 아니다.

부품 하나를 집어 들고, 보고, 내려놓는다. 몇 개 정도는 테스트하겠지만, 주력은 되지 않을 것이다.`,
      },
      score2: {
        zh: `逐一检测所有零件。

你看了看那个工作量，再看了看那套检测工具。这是一个需要耐心和细致的工作——而此刻你的耐心不在这里。

你后退了一步。质检对你来说是「该做」的事，不是「想做」的事。这个区别你很清楚。`,

        en: `Testing every single part.

You look at the workload, then at the inspection tools. This requires patience and meticulousness — and right now, your patience isn't here.

You step back. Quality control is something that "should be done," not something you "want to do." You're very clear on that difference.`,

        nl: `Elk afzonderlijk onderdeel testen.

Je kijkt naar de hoeveelheid werk, dan naar de inspectie-instrumenten. Dit vereist geduld en nauwgezetheid — en op dit moment is je geduld er niet.

Je doet een stap terug. Kwaliteitscontrole is iets dat "gedaan moet worden," niet iets dat je "wilt doen." Dat verschil is je heel duidelijk.`,

        de: `Jedes einzelne Teil testen.

Du schaust auf den Arbeitsumfang, dann auf die Prüfwerkzeuge. Das erfordert Geduld und Sorgfalt — und gerade ist deine Geduld nicht hier.

Du trittst zurück. Qualitätskontrolle ist etwas, das „gemacht werden sollte", nicht etwas, das du „machen willst". Dieser Unterschied ist dir sehr klar.`,

        fr: `Tester chaque pièce, une par une.

Tu regardes la charge de travail, puis les outils d'inspection. Cela demande de la patience et de la minutie — et en ce moment, ta patience n'est pas là.

Tu recules. Le contrôle qualité est quelque chose qui « doit être fait », pas quelque chose que tu « veux faire ». Cette différence est très claire pour toi.`,

        es: `Probar cada pieza individual.

Miras la cantidad de trabajo, luego las herramientas de inspección. Esto requiere paciencia y meticulosidad — y ahora mismo, tu paciencia no está aquí.

Retrocedes. El control de calidad es algo que "debe hacerse", no algo que "quieres hacer". Esa diferencia la tienes muy clara.`,

        pt: `Testar cada peça individual.

Olha para o volume de trabalho, depois para as ferramentas de inspeção. Isso requer paciência e meticulosidade — e agora, sua paciência não está aqui.

Dá um passo atrás. Controle de qualidade é algo que "deve ser feito", não algo que "quer fazer". Essa diferença está muito clara para você.`,

        it: `Testare ogni singolo pezzo.

Guardi il carico di lavoro, poi gli strumenti di ispezione. Questo richiede pazienza e meticolosità — e in questo momento, la tua pazienza non è qui.

Fai un passo indietro. Il controllo qualità è qualcosa che "va fatto", non qualcosa che "vuoi fare". Questa differenza ti è molto chiara.`,

        ru: `Проверить каждую деталь.

Ты смотришь на объём работы, затем на инструменты контроля. Это требует терпения и скрупулёзности — а сейчас твоё терпение не здесь.

Отступаешь. Контроль качества — это то, что «надо сделать», а не то, что ты «хочешь делать». Эта разница для тебя очень ясна.`,

        ja: `すべての部品を一つずつテストする。

作業量を見て、次に検査道具を見る。これには忍耐力と几帳面さが必要だ——そして今、自分の忍耐力はここにない。

一歩引く。品質検査は「やるべきこと」であって、「やりたいこと」ではない。その違いは非常に明確だ。`,

        ko: `모든 부품을 하나씩 테스트하는 것.

작업량을 보고, 검사 도구를 본다. 이건 인내와 꼼꼼함이 필요하다 — 그리고 지금, 내 인내심은 여기에 없다.

한 걸음 물러선다. 품질 관리는 "해야 하는 일"이지, "하고 싶은 일"이 아니다. 그 차이를 아주 분명히 안다.`,
      },
      score1: {
        zh: `最后一步了。但这个「最后一步」和你之间，依然没有连接。

逐一检测、标记、记录——每一个动作都是明确的，但你身体里没有任何想去做这件事的信号。

你站在后面。这是一个所有人都可以参与的任务，但你选择不参与。不是因为懒，是因为你对这类工作的兴趣是真实的零。

这一章结束了。你在五项任务里的反应，比你以为的更诚实。`,

        en: `The final step. But this "final step" still has no connection to you.

Testing one by one, flagging, recording — every action is clear, but nothing in your body signals any desire to do it.

You stay in the back. This is a task anyone can join, but you choose not to. Not laziness — your interest in this type of work is a genuine zero.

This chapter is over. Your responses across five tasks were more honest than you expected.`,

        nl: `De laatste stap. Maar deze "laatste stap" heeft nog steeds geen verbinding met jou.

Stuk voor stuk testen, markeren, noteren — elke handeling is duidelijk, maar niets in je lichaam geeft enig signaal van verlangen om het te doen.

Je blijft achterin. Dit is een taak waar iedereen aan mee kan doen, maar jij kiest ervoor om niet mee te doen. Niet uit luiheid — je interesse in dit type werk is een oprechte nul.

Dit hoofdstuk is voorbij. Je reacties bij vijf taken waren eerlijker dan je had verwacht.`,

        de: `Der letzte Schritt. Aber dieser „letzte Schritt" hat immer noch keine Verbindung zu dir.

Eins nach dem anderen testen, markieren, notieren — jede Handlung ist klar, aber nichts in deinem Körper signalisiert irgendein Verlangen, es zu tun.

Du bleibst im Hintergrund. Das ist eine Aufgabe, bei der jeder mitmachen kann, aber du entscheidest dich dagegen. Nicht Faulheit — dein Interesse an dieser Art Arbeit ist eine ehrliche Null.

Dieses Kapitel ist vorbei. Deine Reaktionen bei fünf Aufgaben waren ehrlicher, als du erwartet hattest.`,

        fr: `La dernière étape. Mais cette « dernière étape » n'a toujours aucun lien avec toi.

Tester un par un, signaler, noter — chaque action est claire, mais rien dans ton corps ne signale le moindre désir de le faire.

Tu restes en retrait. C'est une tâche à laquelle tout le monde peut participer, mais tu choisis de ne pas le faire. Pas par paresse — ton intérêt pour ce type de travail est un zéro authentique.

Ce chapitre est terminé. Tes réponses à travers cinq tâches étaient plus honnêtes que tu ne l'avais prévu.`,

        es: `El último paso. Pero este "último paso" sigue sin tener conexión contigo.

Probar uno por uno, marcar, registrar — cada acción es clara, pero nada en tu cuerpo señala deseo alguno de hacerlo.

Te quedas atrás. Esta es una tarea en la que todos pueden participar, pero tú eliges no hacerlo. No es pereza — tu interés en este tipo de trabajo es un cero genuino.

Este capítulo terminó. Tus respuestas a lo largo de cinco tareas fueron más honestas de lo que esperabas.`,

        pt: `O último passo. Mas este "último passo" ainda não tem conexão com você.

Testar um por um, sinalizar, registrar — cada ação é clara, mas nada no seu corpo sinaliza qualquer desejo de fazê-lo.

Você fica atrás. Esta é uma tarefa em que todos podem participar, mas você escolhe não participar. Não é preguiça — seu interesse neste tipo de trabalho é um zero genuíno.

Este capítulo acabou. Suas respostas ao longo de cinco tarefas foram mais honestas do que você esperava.`,

        it: `L'ultimo passaggio. Ma questo "ultimo passaggio" non ha ancora alcuna connessione con te.

Testare uno per uno, contrassegnare, registrare — ogni azione è chiara, ma nulla nel tuo corpo segnala alcun desiderio di farlo.

Resti in fondo. Questo è un compito a cui tutti possono partecipare, ma tu scegli di non farlo. Non pigrizia — il tuo interesse per questo tipo di lavoro è uno zero genuino.

Questo capitolo è finito. Le tue risposte attraverso cinque compiti sono state più oneste di quanto ti aspettassi.`,

        ru: `Последний шаг. Но этот «последний шаг» всё ещё не имеет к тебе отношения.

Проверять по одной, отмечать, записывать — каждое действие понятно, но ничто в теле не подаёт сигнала желания это делать.

Ты остаёшься позади. Это задача, к которой может присоединиться каждый, но ты выбираешь не участвовать. Не лень — твой интерес к этому виду работы — настоящий ноль.

Эта глава окончена. Твои реакции на пять задач оказались честнее, чем ты ожидал.`,

        ja: `最後のステップ。だがこの「最後のステップ」もまだ自分とのつながりがない。

一つずつテストし、フラグを付け、記録する——どの動作も明確だが、体の中にそれをやりたいという信号は何もない。

後方にいる。これは誰でも参加できるタスクだが、参加しないことを選ぶ。怠惰ではない——この種の作業への関心が、正真正銘のゼロなのだ。

この章は終わった。五つのタスクでの自分の反応は、思っていたより正直だった。`,

        ko: `마지막 단계. 하지만 이 "마지막 단계"도 여전히 나와 연결이 없다.

하나씩 테스트하고, 표시하고, 기록하는 것 — 모든 행동이 명확하지만, 그것을 하고 싶다는 신호가 몸에서 전혀 오지 않는다.

뒤에 남는다. 이것은 누구나 참여할 수 있는 과제지만, 참여하지 않기를 선택한다. 게으름이 아니다 — 이런 유형의 작업에 대한 관심이 진정한 제로다.

이 장이 끝났다. 다섯 가지 과제에 걸친 나의 반응은 예상보다 더 솔직했다.`,
      },
    },
  },
];
