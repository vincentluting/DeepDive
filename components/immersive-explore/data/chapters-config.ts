// ============================================================
// Immersive Explore「第零局」2.0 — Chapter Configurations
// ============================================================

import { ChapterKey, ChapterConfig } from "./types";

export const CHAPTERS: Record<ChapterKey, ChapterConfig> = {
  mechanical: {
    key: "mechanical",
    index: 1,
    riasec: "R",
    title: {
      zh: "机械室",
      en: "The Machine Room",
      nl: "De Machinekamer",
      de: "Der Maschinenraum",
      fr: "La Salle des Machines",
      es: "La Sala de Máquinas",
      pt: "A Sala de Máquinas",
      it: "La Sala Macchine",
      ru: "Машинный зал",
      ja: "機械室",
      ko: "기계실",
    },
    missionBrief: {
      zh: "系统修复——恢复这个空间的完整功能",
      en: "System restoration — bring this space back to full operation",
      nl: "Systeemherstel — breng deze ruimte weer volledig in bedrijf",
      de: "Systemwiederherstellung — bringen Sie diesen Raum wieder voll in Betrieb",
      fr: "Restauration du système — remettre cet espace en plein fonctionnement",
      es: "Restauración del sistema — devolver este espacio a pleno funcionamiento",
      pt: "Restauração do sistema — trazer este espaço de volta à operação completa",
      it: "Ripristino del sistema — riportare questo spazio alla piena operatività",
      ru: "Восстановление системы — вернуть это пространство к полной работоспособности",
      ja: "システム復旧——この空間を完全稼働状態に戻す",
      ko: "시스템 복구 — 이 공간을 완전한 가동 상태로 되돌리기",
    },
    subTasks: [
      {
        zh: "电气控制",
        en: "Electrical Control",
        nl: "Elektrische Besturing",
        de: "Elektrische Steuerung",
        fr: "Contrôle Électrique",
        es: "Control Eléctrico",
        pt: "Controle Elétrico",
        it: "Controllo Elettrico",
        ru: "Электрическое управление",
        ja: "電気制御",
        ko: "전기 제어",
      },
      {
        zh: "设备运行",
        en: "Equipment Operation",
        nl: "Apparatuurbediening",
        de: "Gerätebetrieb",
        fr: "Exploitation des Équipements",
        es: "Operación de Equipos",
        pt: "Operação de Equipamentos",
        it: "Funzionamento delle Attrezzature",
        ru: "Эксплуатация оборудования",
        ja: "設備運転",
        ko: "장비 운영",
      },
      {
        zh: "生产线",
        en: "Production Line",
        nl: "Productielijn",
        de: "Produktionslinie",
        fr: "Ligne de Production",
        es: "Línea de Producción",
        pt: "Linha de Produção",
        it: "Linea di Produzione",
        ru: "Производственная линия",
        ja: "生産ライン",
        ko: "생산 라인",
      },
      {
        zh: "仓储基础设施",
        en: "Storage Infrastructure",
        nl: "Opslaginfrastructuur",
        de: "Lagerinfrastruktur",
        fr: "Infrastructure de Stockage",
        es: "Infraestructura de Almacenamiento",
        pt: "Infraestrutura de Armazenamento",
        it: "Infrastruttura di Stoccaggio",
        ru: "Складская инфраструктура",
        ja: "倉庫インフラ",
        ko: "창고 인프라",
      },
      {
        zh: "质量验证",
        en: "Quality Verification",
        nl: "Kwaliteitsverificatie",
        de: "Qualitätsprüfung",
        fr: "Vérification de Qualité",
        es: "Verificación de Calidad",
        pt: "Verificação de Qualidade",
        it: "Verifica della Qualità",
        ru: "Проверка качества",
        ja: "品質検証",
        ko: "품질 검증",
      },
    ],
    entryNarrative: {
      zh: `你走进去的时候，第一反应是安静。

不对——这里不应该是安静的。

这是一个巨大的机械空间。齿轮、传动轴、嵌在天花板上的管道系统——它们都在，但没有一个在动。干燥的管道，静止的齿轮，悬停的传动轴。空气里有金属和润滑油的气味，但没有运转的声音。

地板上有脚印。不是你们的——是之前某批人留下的。他们走到了这里，开始了某些工作，但没有完成。

房间中央的地面上，嵌着一个五段式进度环，目前全部未亮：

 电气控制 · 设备运行 · 生产线 · 仓储基础设施 · 质量验证

屏幕亮了，出现规则说明：「本空间处于系统瘫痪状态。恢复全部五个子系统后，出口开启。」

Marcus 走向最近的工作台，手指划过台面上的工具，像在清点武器。

Adrian 看了一圈，说：「五个系统。六个人。够了。」`,

      en: `Your first thought when you walk in is: quiet.

No — it shouldn't be quiet here.

This is a vast mechanical space. Gears, drive shafts, pipe systems embedded in the ceiling — they're all here, but none of them are moving. Dry pipes, still gears, suspended drive shafts. The air smells of metal and lubricant, but there's no sound of anything running.

There are footprints on the floor. Not yours — left by a previous group. They made it this far, started some work, but didn't finish.

In the center of the floor, a five-segment progress ring is embedded, all segments dark:

 Electrical Control · Equipment Operation · Production Line · Storage Infrastructure · Quality Verification

The screen lights up with a rule: "This space is in full system failure. Restore all five subsystems to unlock the exit."

Marcus walks to the nearest workbench, fingers running across the tools on the surface like he's taking inventory of weapons.

Adrian glances around and says: "Five systems. Six people. That's enough."`,

      nl: `Je eerste gedachte als je binnenloopt is: stilte.

Nee — het hoort hier niet stil te zijn.

Dit is een enorme mechanische ruimte. Tandwielen, aandrijfassen, leidingsystemen ingebed in het plafond — ze zijn er allemaal, maar niets beweegt. Droge leidingen, stilstaande tandwielen, hangende aandrijfassen. De lucht ruikt naar metaal en smeerolie, maar er is geen geluid van iets dat draait.

Er zijn voetafdrukken op de vloer. Niet van jullie — achtergelaten door een vorige groep. Ze zijn tot hier gekomen, begonnen met werk, maar hebben het niet afgemaakt.

In het midden van de vloer zit een vijfdelige voortgangsring ingebed, alle segmenten donker:

 Elektrische Besturing · Apparatuurbediening · Productielijn · Opslaginfrastructuur · Kwaliteitsverificatie

Het scherm licht op met een regel: "Deze ruimte bevindt zich in volledige systeemstoring. Herstel alle vijf subsystemen om de uitgang te ontgrendelen."

Marcus loopt naar de dichtstbijzijnde werkbank, zijn vingers glijden over het gereedschap alsof hij wapens inventariseert.

Adrian kijkt rond en zegt: "Vijf systemen. Zes mensen. Genoeg."`,

      de: `Dein erster Gedanke, als du hineingehst, ist: Stille.

Nein — hier sollte es nicht still sein.

Dies ist ein gewaltiger mechanischer Raum. Zahnräder, Antriebswellen, Rohrsysteme in der Decke eingelassen — alles ist da, aber nichts bewegt sich. Trockene Rohre, stille Zahnräder, schwebende Antriebswellen. Die Luft riecht nach Metall und Schmiermittel, doch kein Geräusch einer laufenden Maschine.

Auf dem Boden sind Fußspuren. Nicht eure — hinterlassen von einer früheren Gruppe. Sie sind bis hierher gekommen, haben angefangen zu arbeiten, aber nicht zu Ende gebracht.

In der Mitte des Bodens ist ein fünfteiliger Fortschrittsring eingelassen, alle Segmente dunkel:

 Elektrische Steuerung · Gerätebetrieb · Produktionslinie · Lagerinfrastruktur · Qualitätsprüfung

Der Bildschirm leuchtet auf: „Dieser Raum befindet sich im vollständigen Systemausfall. Stellen Sie alle fünf Subsysteme wieder her, um den Ausgang freizuschalten."

Marcus geht zur nächsten Werkbank, seine Finger gleiten über das Werkzeug, als würde er Waffen inventarisieren.

Adrian blickt sich um und sagt: „Fünf Systeme. Sechs Leute. Das reicht."`,

      fr: `Votre première pensée en entrant : le silence.

Non — il ne devrait pas y avoir de silence ici.

C'est un vaste espace mécanique. Engrenages, arbres de transmission, systèmes de tuyauterie encastrés dans le plafond — tout est là, mais rien ne bouge. Tuyaux secs, engrenages immobiles, arbres de transmission suspendus. L'air sent le métal et le lubrifiant, mais aucun bruit de machine en marche.

Il y a des empreintes sur le sol. Pas les vôtres — laissées par un groupe précédent. Ils sont arrivés jusqu'ici, ont commencé un travail, mais ne l'ont pas terminé.

Au centre du sol, un anneau de progression à cinq segments est encastré, tous les segments éteints :

 Contrôle Électrique · Exploitation des Équipements · Ligne de Production · Infrastructure de Stockage · Vérification de Qualité

L'écran s'allume avec une règle : « Cet espace est en panne système totale. Restaurez les cinq sous-systèmes pour déverrouiller la sortie. »

Marcus se dirige vers l'établi le plus proche, ses doigts glissent sur les outils comme s'il inventoriait des armes.

Adrian jette un coup d'œil autour et dit : « Cinq systèmes. Six personnes. Ça suffira. »`,

      es: `Tu primer pensamiento al entrar es: silencio.

No — aquí no debería haber silencio.

Es un vasto espacio mecánico. Engranajes, ejes de transmisión, sistemas de tuberías empotrados en el techo — todo está aquí, pero nada se mueve. Tuberías secas, engranajes inmóviles, ejes de transmisión suspendidos. El aire huele a metal y lubricante, pero no hay sonido de nada funcionando.

Hay huellas en el suelo. No son las tuyas — las dejó un grupo anterior. Llegaron hasta aquí, comenzaron algún trabajo, pero no lo terminaron.

En el centro del suelo, un anillo de progreso de cinco segmentos está empotrado, todos los segmentos apagados:

 Control Eléctrico · Operación de Equipos · Línea de Producción · Infraestructura de Almacenamiento · Verificación de Calidad

La pantalla se enciende con una regla: "Este espacio se encuentra en fallo total del sistema. Restaura los cinco subsistemas para desbloquear la salida."

Marcus camina hacia el banco de trabajo más cercano, sus dedos recorren las herramientas como si inventariara armas.

Adrian mira alrededor y dice: "Cinco sistemas. Seis personas. Suficiente."`,

      pt: `Seu primeiro pensamento ao entrar é: silêncio.

Não — não deveria haver silêncio aqui.

Este é um vasto espaço mecânico. Engrenagens, eixos de transmissão, sistemas de tubulação embutidos no teto — tudo está aqui, mas nada se move. Tubulações secas, engrenagens paradas, eixos de transmissão suspensos. O ar cheira a metal e lubrificante, mas não há som de nada funcionando.

Há pegadas no chão. Não são suas — foram deixadas por um grupo anterior. Eles chegaram até aqui, começaram algum trabalho, mas não terminaram.

No centro do chão, um anel de progresso de cinco segmentos está embutido, todos os segmentos escuros:

 Controle Elétrico · Operação de Equipamentos · Linha de Produção · Infraestrutura de Armazenamento · Verificação de Qualidade

A tela acende com uma regra: "Este espaço está em falha total do sistema. Restaure todos os cinco subsistemas para desbloquear a saída."

Marcus caminha até a bancada mais próxima, seus dedos deslizam pelas ferramentas como se inventariasse armas.

Adrian olha ao redor e diz: "Cinco sistemas. Seis pessoas. Suficiente."`,

      it: `Il primo pensiero entrando è: silenzio.

No — qui non dovrebbe esserci silenzio.

È un vasto spazio meccanico. Ingranaggi, alberi di trasmissione, sistemi di tubature incassati nel soffitto — sono tutti qui, ma nulla si muove. Tubi asciutti, ingranaggi fermi, alberi di trasmissione sospesi. L'aria sa di metallo e lubrificante, ma non c'è alcun suono di macchinari in funzione.

Ci sono impronte sul pavimento. Non le vostre — lasciate da un gruppo precedente. Sono arrivati fin qui, hanno iniziato qualche lavoro, ma non l'hanno completato.

Al centro del pavimento, un anello di progresso a cinque segmenti è incassato, tutti i segmenti spenti:

 Controllo Elettrico · Funzionamento delle Attrezzature · Linea di Produzione · Infrastruttura di Stoccaggio · Verifica della Qualità

Lo schermo si illumina con una regola: "Questo spazio è in guasto totale del sistema. Ripristinare tutti e cinque i sottosistemi per sbloccare l'uscita."

Marcus si dirige verso il banco da lavoro più vicino, le dita scorrono sugli attrezzi come se stesse inventariando armi.

Adrian si guarda intorno e dice: "Cinque sistemi. Sei persone. Abbastanza."`,

      ru: `Первая мысль, когда входишь: тишина.

Нет — здесь не должно быть тишины.

Это огромное механическое пространство. Шестерни, приводные валы, трубопроводы, встроенные в потолок — всё на месте, но ничего не движется. Сухие трубы, неподвижные шестерни, застывшие приводные валы. Воздух пахнет металлом и смазкой, но нет ни звука работающих механизмов.

На полу следы. Не ваши — оставленные предыдущей группой. Они добрались сюда, начали какую-то работу, но не закончили.

В центре пола встроено пятисегментное кольцо прогресса, все сегменты тёмные:

 Электрическое управление · Эксплуатация оборудования · Производственная линия · Складская инфраструктура · Проверка качества

Экран загорается с правилом: «Это пространство находится в состоянии полного отказа системы. Восстановите все пять подсистем, чтобы открыть выход.»

Маркус подходит к ближайшему верстаку, пальцы скользят по инструментам, словно он инвентаризирует оружие.

Адриан оглядывается и говорит: «Пять систем. Шесть человек. Достаточно.»`,

      ja: `中に入った瞬間、最初に感じたのは——静寂。

いや——ここは静かであってはならない場所だ。

巨大な機械空間。歯車、駆動軸、天井に埋め込まれた配管システム——すべて揃っているが、何ひとつ動いていない。乾いた配管、静止した歯車、宙に浮いた駆動軸。空気には金属と潤滑油の匂いがするが、何かが稼働する音はない。

床には足跡がある。あなたたちのものではない——以前のグループが残したものだ。彼らはここまで来て、何かの作業を始めたが、完了させなかった。

床の中央に、五段階の進捗リングが埋め込まれている。すべてのセグメントが消灯している：

 電気制御 · 設備運転 · 生産ライン · 倉庫インフラ · 品質検証

スクリーンにルールが表示される：「この空間はシステム全面停止状態にあります。五つのサブシステムをすべて復旧させると、出口が開きます。」

マーカスが一番近い作業台に歩み寄り、工具の上を指でなぞる——まるで武器を点検するように。

エイドリアンが見回して言う：「五つのシステム。六人。十分だ。」`,

      ko: `안으로 들어서는 순간, 첫 번째 느낌은: 고요함.

아니 — 여기는 고요해선 안 되는 곳이다.

거대한 기계 공간이다. 톱니바퀴, 구동축, 천장에 매립된 배관 시스템 — 모두 있지만 아무것도 움직이지 않는다. 마른 배관, 멈춰 선 톱니바퀴, 정지된 구동축. 공기에서 금속과 윤활유 냄새가 나지만, 작동하는 소리는 없다.

바닥에 발자국이 있다. 당신들의 것이 아니다 — 이전 그룹이 남긴 것이다. 그들은 여기까지 와서 작업을 시작했지만 끝내지 못했다.

바닥 중앙에 다섯 구간으로 된 진행 링이 매립되어 있고, 모든 구간이 꺼져 있다:

 전기 제어 · 장비 운영 · 생산 라인 · 창고 인프라 · 품질 검증

화면에 규칙이 표시된다: "이 공간은 전면 시스템 장애 상태입니다. 다섯 개의 하위 시스템을 모두 복구하면 출구가 열립니다."

마커스가 가장 가까운 작업대로 걸어가 도구 위로 손가락을 훑는다 — 마치 무기를 점검하듯.

에이드리안이 주위를 둘러보며 말한다: "다섯 시스템. 여섯 명. 충분해."`,
    },
    transitionNarrative: {
      zh: `进度环的最后一段亮了。

五段全亮的一瞬间，整个机械室发出一声深沉的震动——不是故障，是启动。所有被修复的系统同时开始运转，齿轮咬合，管道里有液体开始流动，空气里的温度微微上升。

这个空间活了。

出口的门缓缓开启。Marcus 最后回头看了一眼那台他修好的设备，然后转身，什么也没说，第一个走了出去。

Mia 在走向出口的路上，轻声说了一句：
「主办方知道我们在想什么。」

没有人问她什么意思。因为你们都有点明白她的意思。

你在走出门的时候，低头看了一眼地上那些脚印。
你突然注意到一个奇怪的细节：那些脚印的大小——和你的鞋码完全一样。`,

      en: `The last segment of the progress ring lights up.

The instant all five glow, a deep vibration runs through the machine room — not a malfunction, but an ignition. Every repaired system starts running at once. Gears mesh, liquid begins flowing through the pipes, the air temperature rises slightly.

This space is alive.

The exit door opens slowly. Marcus looks back one last time at the machine he fixed, then turns without a word and walks out first.

On her way to the exit, Mia says softly:
"The organizers know what we're thinking."

No one asks what she means. Because you all sort of understand.

On your way out, you glance down at the footprints on the floor.
You notice something strange: those footprints are exactly your shoe size.`,

      nl: `Het laatste segment van de voortgangsring licht op.

Op het moment dat alle vijf oplichten, trilt de hele machinekamer diep — geen storing, maar een ontsteking. Elk hersteld systeem begint tegelijk te draaien. Tandwielen grijpen in, vloeistof stroomt door de leidingen, de luchttemperatuur stijgt licht.

Deze ruimte leeft.

De uitgangsdeur gaat langzaam open. Marcus kijkt nog één keer om naar de machine die hij repareerde, draait zich dan zonder een woord om en loopt als eerste naar buiten.

Op weg naar de uitgang zegt Mia zachtjes:
"De organisatoren weten wat we denken."

Niemand vraagt wat ze bedoelt. Want jullie begrijpen het allemaal een beetje.

Op weg naar buiten kijk je omlaag naar de voetafdrukken op de vloer.
Je merkt iets vreemds op: die voetafdrukken hebben precies jouw schoenmaat.`,

      de: `Das letzte Segment des Fortschrittsrings leuchtet auf.

In dem Moment, als alle fünf leuchten, geht ein tiefes Vibrieren durch den Maschinenraum — kein Defekt, sondern eine Zündung. Jedes reparierte System beginnt gleichzeitig zu laufen. Zahnräder greifen ineinander, Flüssigkeit fließt durch die Rohre, die Lufttemperatur steigt leicht.

Dieser Raum lebt.

Die Ausgangstür öffnet sich langsam. Marcus blickt ein letztes Mal zurück auf die Maschine, die er repariert hat, dreht sich dann wortlos um und geht als Erster hinaus.

Auf dem Weg zum Ausgang sagt Mia leise:
„Die Organisatoren wissen, was wir denken."

Niemand fragt, was sie meint. Weil ihr alle irgendwie versteht.

Auf dem Weg hinaus blickst du auf die Fußspuren am Boden.
Dir fällt etwas Seltsames auf: Diese Fußspuren haben genau deine Schuhgröße.`,

      fr: `Le dernier segment de l'anneau de progression s'illumine.

À l'instant où les cinq brillent, une vibration profonde parcourt la salle des machines — pas une panne, mais une ignition. Chaque système réparé se met en marche simultanément. Les engrenages s'engrènent, du liquide commence à couler dans les tuyaux, la température de l'air monte légèrement.

Cet espace est vivant.

La porte de sortie s'ouvre lentement. Marcus jette un dernier regard à la machine qu'il a réparée, puis se retourne sans un mot et sort le premier.

En se dirigeant vers la sortie, Mia dit doucement :
« Les organisateurs savent ce que nous pensons. »

Personne ne demande ce qu'elle veut dire. Parce que vous comprenez tous un peu.

En sortant, vous baissez les yeux vers les empreintes sur le sol.
Vous remarquez quelque chose d'étrange : ces empreintes correspondent exactement à votre pointure.`,

      es: `El último segmento del anillo de progreso se ilumina.

En el instante en que los cinco brillan, una vibración profunda recorre la sala de máquinas — no es un fallo, es un encendido. Cada sistema reparado comienza a funcionar a la vez. Los engranajes se acoplan, el líquido comienza a fluir por las tuberías, la temperatura del aire sube ligeramente.

Este espacio está vivo.

La puerta de salida se abre lentamente. Marcus mira por última vez la máquina que reparó, luego se da la vuelta sin decir nada y sale primero.

De camino a la salida, Mia dice en voz baja:
"Los organizadores saben lo que estamos pensando."

Nadie pregunta qué quiere decir. Porque todos lo entienden un poco.

Al salir, miras hacia abajo a las huellas en el suelo.
Notas algo extraño: esas huellas son exactamente de tu talla de zapato.`,

      pt: `O último segmento do anel de progresso se acende.

No instante em que todos os cinco brilham, uma vibração profunda percorre a sala de máquinas — não é uma falha, mas uma ignição. Cada sistema reparado começa a funcionar ao mesmo tempo. Engrenagens se acoplam, líquido começa a fluir pelas tubulações, a temperatura do ar sobe levemente.

Este espaço está vivo.

A porta de saída se abre lentamente. Marcus olha uma última vez para a máquina que consertou, então se vira sem dizer nada e sai primeiro.

A caminho da saída, Mia diz em voz baixa:
"Os organizadores sabem o que estamos pensando."

Ninguém pergunta o que ela quer dizer. Porque todos entendem um pouco.

Ao sair, você olha para baixo, para as pegadas no chão.
Você nota algo estranho: aquelas pegadas são exatamente do seu número de sapato.`,

      it: `L'ultimo segmento dell'anello di progresso si accende.

Nell'istante in cui tutti e cinque brillano, una vibrazione profonda attraversa la sala macchine — non un guasto, ma un'accensione. Ogni sistema riparato inizia a funzionare simultaneamente. Gli ingranaggi si ingranano, il liquido comincia a scorrere nei tubi, la temperatura dell'aria sale leggermente.

Questo spazio è vivo.

La porta d'uscita si apre lentamente. Marcus guarda un'ultima volta la macchina che ha riparato, poi si volta senza dire nulla ed esce per primo.

Dirigendosi verso l'uscita, Mia dice piano:
"Gli organizzatori sanno cosa stiamo pensando."

Nessuno chiede cosa intenda. Perché tutti capiscono un po'.

Uscendo, abbassi lo sguardo sulle impronte sul pavimento.
Noti qualcosa di strano: quelle impronte sono esattamente del tuo numero di scarpe.`,

      ru: `Последний сегмент кольца прогресса загорается.

В тот миг, когда все пять засияли, по машинному залу прокатилась глубокая вибрация — не поломка, а запуск. Каждая восстановленная система начинает работать одновременно. Шестерни сцепляются, жидкость течёт по трубам, температура воздуха слегка повышается.

Это пространство ожило.

Дверь к выходу медленно открывается. Маркус в последний раз оглядывается на машину, которую починил, затем разворачивается без слов и выходит первым.

По пути к выходу Миа тихо произносит:
«Организаторы знают, о чём мы думаем.»

Никто не спрашивает, что она имеет в виду. Потому что все как-то понимают.

На выходе ты бросаешь взгляд на следы на полу.
Ты замечаешь нечто странное: эти следы точно твоего размера обуви.`,

      ja: `進捗リングの最後のセグメントが点灯する。

五つすべてが輝いた瞬間、機械室全体に深い振動が走る——故障ではない、起動だ。修復されたすべてのシステムが一斉に動き出す。歯車が噛み合い、配管に液体が流れ始め、空気の温度がわずかに上がる。

この空間が生き返った。

出口の扉がゆっくりと開く。マーカスが自分の直した機械を最後に一度振り返り、何も言わずに背を向けて、最初に出て行った。

出口に向かう途中、ミアが小さな声で言った：
「主催者は私たちが何を考えているか知っている。」

誰もその意味を尋ねない。なぜなら、みんななんとなく分かっているから。

出口に向かいながら、床の足跡に目を落とす。
奇妙なことに気づく：あの足跡は——あなたの靴のサイズとぴったり同じだ。`,

      ko: `진행 링의 마지막 구간이 켜진다.

다섯 구간 모두 빛나는 순간, 기계실 전체에 깊은 진동이 울린다 — 고장이 아니라 점화다. 복구된 모든 시스템이 동시에 가동하기 시작한다. 톱니바퀴가 맞물리고, 배관에 액체가 흐르기 시작하고, 공기의 온도가 약간 올라간다.

이 공간이 살아났다.

출구 문이 천천히 열린다. 마커스가 자신이 고친 기계를 마지막으로 한 번 돌아보고, 말없이 돌아서서 가장 먼저 나간다.

출구로 향하는 길에 미아가 조용히 말한다:
"주최 측은 우리가 무슨 생각을 하는지 알고 있어."

아무도 무슨 뜻이냐고 묻지 않는다. 모두 어렴풋이 이해하니까.

나가면서 바닥의 발자국을 내려다본다.
이상한 점을 발견한다: 그 발자국의 크기가 — 당신의 신발 사이즈와 정확히 같다.`,
    },
    accentColor: "#8B6040",
    bgGradient: "radial-gradient(ellipse at 50% 30%, #1C1208 0%, #0E0A06 100%)",
    sceneImageUrl: "/immersive/scenes/mechanical.webp",
    decorCSS:
      "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(139,96,64,0.04) 39px, rgba(139,96,64,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(139,96,64,0.04) 39px, rgba(139,96,64,0.04) 40px)",
  },

  laboratory: {
    key: "laboratory",
    index: 2,
    riasec: "I",
    title: {
      zh: "研究空间",
      en: "The Research Lab",
      nl: "Het Onderzoekslab",
      de: "Das Forschungslabor",
      fr: "Le Laboratoire de Recherche",
      es: "El Laboratorio de Investigación",
      pt: "O Laboratório de Pesquisa",
      it: "Il Laboratorio di Ricerca",
      ru: "Исследовательская лаборатория",
      ja: "研究室",
      ko: "연구실",
    },
    missionBrief: {
      zh: "完成一个被中断的研究项目",
      en: "Complete a research project that was abandoned midway",
      nl: "Voltooi een onderzoeksproject dat halverwege werd afgebroken",
      de: "Schließen Sie ein Forschungsprojekt ab, das mittendrin abgebrochen wurde",
      fr: "Terminer un projet de recherche abandonné en cours de route",
      es: "Completar un proyecto de investigación abandonado a mitad de camino",
      pt: "Concluir um projeto de pesquisa que foi abandonado no meio do caminho",
      it: "Completare un progetto di ricerca abbandonato a metà strada",
      ru: "Завершить исследовательский проект, прерванный на полпути",
      ja: "途中で中断された研究プロジェクトを完成させる",
      ko: "중도에 중단된 연구 프로젝트를 완성하기",
    },
    subTasks: [
      {
        zh: "实验验证",
        en: "Experimental Verification",
        nl: "Experimentele Verificatie",
        de: "Experimentelle Überprüfung",
        fr: "Vérification Expérimentale",
        es: "Verificación Experimental",
        pt: "Verificação Experimental",
        it: "Verifica Sperimentale",
        ru: "Экспериментальная проверка",
        ja: "実験検証",
        ko: "실험 검증",
      },
      {
        zh: "微观检验",
        en: "Microscopic Examination",
        nl: "Microscopisch Onderzoek",
        de: "Mikroskopische Untersuchung",
        fr: "Examen Microscopique",
        es: "Examen Microscópico",
        pt: "Exame Microscópico",
        it: "Esame Microscopico",
        ru: "Микроскопическое исследование",
        ja: "顕微鏡検査",
        ko: "현미경 검사",
      },
      {
        zh: "模式识别",
        en: "Pattern Recognition",
        nl: "Patroonherkenning",
        de: "Mustererkennung",
        fr: "Reconnaissance de Formes",
        es: "Reconocimiento de Patrones",
        pt: "Reconhecimento de Padrões",
        it: "Riconoscimento di Pattern",
        ru: "Распознавание паттернов",
        ja: "パターン認識",
        ko: "패턴 인식",
      },
      {
        zh: "核心突破",
        en: "Core Breakthrough",
        nl: "Kerndoorbraak",
        de: "Kerndurchbruch",
        fr: "Percée Fondamentale",
        es: "Avance Fundamental",
        pt: "Avanço Fundamental",
        it: "Svolta Fondamentale",
        ru: "Ключевой прорыв",
        ja: "核心的突破",
        ko: "핵심 돌파",
      },
      {
        zh: "应用发明",
        en: "Applied Invention",
        nl: "Toegepaste Uitvinding",
        de: "Angewandte Erfindung",
        fr: "Invention Appliquée",
        es: "Invención Aplicada",
        pt: "Invenção Aplicada",
        it: "Invenzione Applicata",
        ru: "Прикладное изобретение",
        ja: "応用発明",
        ko: "응용 발명",
      },
    ],
    entryNarrative: {
      zh: `这是一个研究空间。

左侧是实验区：化学实验台、试剂架、通风橱、量筒烧杯整齐排列——但不是新的，上面有使用过的痕迹。

右侧是数据分析区：大屏幕、计算终端、堆成小山的打印纸。屏幕上有一个进度条，停在 43%。

空气里有一种混合的气味：化学试剂、打印纸、还有咖啡——有人在这里待了很久。

中央的桌子上，有一本摊开的实验笔记。字迹从工整变潦草，最后几页写着：「没时间了。留给下一批人。」

屏幕亮了：「上一批参与者的研究项目在关键阶段中断。将本研究推进到产出成果的阶段，出口开启。」

Mia 是第一个走向实验台的人。她拿起那本笔记翻了翻，眼睛在快速扫描。

然后她抬起头，对所有人说：「他们做了很多了。我们从这里接手。」`,

      en: `This is a research space.

On the left is the experimental area: chemistry bench, reagent rack, fume hood, graduated cylinders and beakers neatly arranged — but not new. There are traces of use on everything.

On the right is the data analysis area: a large screen, computing terminals, mountains of printed paper. A progress bar on the screen, frozen at 43%.

The air carries a mixed scent: chemical reagents, printer paper, and coffee — someone spent a long time here.

On the central table, a lab notebook lies open. The handwriting starts neat and turns illegible. The last few pages read: "No time left. Leaving this for the next group."

The screen updates: "The previous group's research project was interrupted at a critical stage. Advance the research to the output phase to unlock the exit."

Mia is the first to walk to the bench. She picks up the notebook and flips through it, eyes scanning rapidly.

Then she looks up at everyone: "They did a lot. We pick up from here."`,

      nl: `Dit is een onderzoeksruimte.

Links is het experimenteergebied: chemisch werkbank, reagentiarek, zuurkast, maatcilinders en bekers netjes opgesteld — maar niet nieuw. Overal sporen van gebruik.

Rechts is het data-analysegebied: een groot scherm, computerterminals, bergen geprint papier. Een voortgangsbalk op het scherm, bevroren op 43%.

De lucht draagt een gemengde geur: chemische reagentia, printpapier en koffie — iemand heeft hier lang doorgebracht.

Op de centrale tafel ligt een laboratoriumnotebook open. Het handschrift begint netjes en wordt onleesbaar. De laatste pagina's lezen: "Geen tijd meer. Dit is voor de volgende groep."

Het scherm meldt: "Het onderzoeksproject van de vorige groep werd in een kritieke fase onderbroken. Breng het onderzoek naar de outputfase om de uitgang te ontgrendelen."

Mia is de eerste die naar de werkbank loopt. Ze pakt het notebook en bladert erdoorheen, ogen snel scannend.

Dan kijkt ze op naar iedereen: "Ze hebben veel gedaan. Wij nemen het hier over."`,

      de: `Dies ist ein Forschungsraum.

Links ist der Experimentierbereich: Chemie-Werkbank, Reagenzienregal, Abzugshaube, Messzylinder und Becher ordentlich aufgereiht — aber nicht neu. Überall Gebrauchsspuren.

Rechts ist der Datenanalysebereich: ein großer Bildschirm, Computerterminals, Berge von Ausdrucken. Ein Fortschrittsbalken auf dem Bildschirm, eingefroren bei 43%.

Die Luft trägt einen gemischten Geruch: chemische Reagenzien, Druckerpapier und Kaffee — jemand war lange hier.

Auf dem zentralen Tisch liegt ein Laborheft aufgeschlagen. Die Handschrift beginnt ordentlich und wird unleserlich. Die letzten Seiten: „Keine Zeit mehr. Hinterlassen für die nächste Gruppe."

Der Bildschirm meldet: „Das Forschungsprojekt der vorherigen Gruppe wurde in einer kritischen Phase unterbrochen. Bringen Sie die Forschung in die Ergebnisphase, um den Ausgang freizuschalten."

Mia geht als Erste zur Werkbank. Sie nimmt das Heft und blättert hindurch, ihre Augen scannen schnell.

Dann blickt sie auf: „Sie haben viel geschafft. Wir machen von hier weiter."`,

      fr: `C'est un espace de recherche.

À gauche, la zone expérimentale : paillasse de chimie, étagère à réactifs, hotte aspirante, éprouvettes graduées et béchers soigneusement alignés — mais pas neufs. Il y a des traces d'utilisation partout.

À droite, la zone d'analyse de données : un grand écran, des terminaux informatiques, des montagnes de papier imprimé. Une barre de progression sur l'écran, figée à 43 %.

L'air porte un mélange d'odeurs : réactifs chimiques, papier d'imprimante et café — quelqu'un a passé beaucoup de temps ici.

Sur la table centrale, un cahier de laboratoire est ouvert. L'écriture commence soignée et devient illisible. Les dernières pages disent : « Plus de temps. Je laisse ça au prochain groupe. »

L'écran affiche : « Le projet de recherche du groupe précédent a été interrompu à un stade critique. Faites avancer la recherche jusqu'à la phase de résultats pour déverrouiller la sortie. »

Mia est la première à se diriger vers la paillasse. Elle prend le cahier et le feuillette, les yeux balayant rapidement.

Puis elle lève les yeux vers tout le monde : « Ils ont fait beaucoup. On reprend à partir d'ici. »`,

      es: `Este es un espacio de investigación.

A la izquierda está el área experimental: mesa de química, estante de reactivos, campana de extracción, probetas y vasos de precipitados ordenados — pero no nuevos. Hay rastros de uso en todo.

A la derecha está el área de análisis de datos: una pantalla grande, terminales de computación, montañas de papel impreso. Una barra de progreso en la pantalla, congelada en el 43%.

El aire tiene una mezcla de olores: reactivos químicos, papel de impresora y café — alguien pasó mucho tiempo aquí.

En la mesa central, un cuaderno de laboratorio yace abierto. La escritura comienza pulcra y se vuelve ilegible. Las últimas páginas dicen: "No queda tiempo. Esto es para el siguiente grupo."

La pantalla muestra: "El proyecto de investigación del grupo anterior se interrumpió en una etapa crítica. Lleva la investigación a la fase de resultados para desbloquear la salida."

Mia es la primera en caminar hacia la mesa. Toma el cuaderno y lo hojea, con los ojos escaneando rápidamente.

Luego mira a todos: "Hicieron mucho. Nosotros seguimos desde aquí."`,

      pt: `Este é um espaço de pesquisa.

À esquerda fica a área experimental: bancada de química, estante de reagentes, capela de exaustão, provetas e béqueres organizados — mas não novos. Há vestígios de uso em tudo.

À direita fica a área de análise de dados: uma tela grande, terminais de computação, montanhas de papel impresso. Uma barra de progresso na tela, congelada em 43%.

O ar carrega uma mistura de cheiros: reagentes químicos, papel de impressora e café — alguém passou muito tempo aqui.

Na mesa central, um caderno de laboratório está aberto. A caligrafia começa organizada e se torna ilegível. As últimas páginas dizem: "Sem tempo. Deixando isto para o próximo grupo."

A tela mostra: "O projeto de pesquisa do grupo anterior foi interrompido em uma fase crítica. Avance a pesquisa até a fase de resultados para desbloquear a saída."

Mia é a primeira a ir até a bancada. Ela pega o caderno e o folheia, os olhos escaneando rapidamente.

Então olha para todos: "Eles fizeram muito. Nós continuamos daqui."`,

      it: `Questo è uno spazio di ricerca.

A sinistra c'è l'area sperimentale: banco di chimica, scaffale dei reagenti, cappa aspirante, cilindri graduati e becher ordinatamente allineati — ma non nuovi. Ci sono tracce di utilizzo ovunque.

A destra c'è l'area di analisi dati: un grande schermo, terminali informatici, montagne di carta stampata. Una barra di progresso sullo schermo, ferma al 43%.

L'aria porta un odore misto: reagenti chimici, carta da stampante e caffè — qualcuno ha trascorso molto tempo qui.

Sul tavolo centrale, un quaderno di laboratorio è aperto. La grafia inizia ordinata e diventa illeggibile. Le ultime pagine dicono: "Non c'è più tempo. Lo lascio al prossimo gruppo."

Lo schermo mostra: "Il progetto di ricerca del gruppo precedente è stato interrotto in una fase critica. Portare la ricerca alla fase di risultati per sbloccare l'uscita."

Mia è la prima a dirigersi verso il banco. Prende il quaderno e lo sfoglia, gli occhi che scorrono rapidamente.

Poi alza lo sguardo verso tutti: "Hanno fatto molto. Noi riprendiamo da qui."`,

      ru: `Это исследовательское пространство.

Слева — экспериментальная зона: химический стол, стеллаж с реактивами, вытяжной шкаф, мерные цилиндры и стаканы аккуратно расставлены — но не новые. На всём следы использования.

Справа — зона анализа данных: большой экран, вычислительные терминалы, горы распечаток. Полоса прогресса на экране, застывшая на 43%.

В воздухе смешанный запах: химические реактивы, бумага для принтера и кофе — кто-то провёл здесь много времени.

На центральном столе лежит раскрытый лабораторный журнал. Почерк начинается аккуратно и становится нечитаемым. На последних страницах: «Времени не осталось. Оставляю следующей группе.»

Экран сообщает: «Исследовательский проект предыдущей группы был прерван на критической стадии. Продвиньте исследование до стадии результатов, чтобы открыть выход.»

Миа первой подходит к лабораторному столу. Берёт журнал и листает, глаза быстро сканируют.

Затем поднимает взгляд на всех: «Они сделали многое. Мы продолжаем отсюда.»`,

      ja: `ここは研究空間だ。

左側は実験エリア：化学実験台、試薬棚、ドラフトチャンバー、メスシリンダーとビーカーが整然と並んでいる——ただし新品ではない。すべてに使用の痕跡がある。

右側はデータ分析エリア：大型スクリーン、計算端末、山のように積まれた印刷物。スクリーンにはプログレスバーがあり、43%で止まっている。

空気には混合した匂いが漂う：化学試薬、プリンター用紙、そしてコーヒー——誰かがここに長い間いた。

中央のテーブルの上に、実験ノートが開いたまま置かれている。筆跡は整然としたものから判読不能に変わっていく。最後の数ページにはこう書かれている：「時間切れ。次のグループに託す。」

スクリーンが更新される：「前のグループの研究プロジェクトは重要な段階で中断されました。研究を成果段階まで進めると、出口が開きます。」

ミアが最初に実験台に向かう。ノートを手に取り、ページをめくる。目が素早く走査している。

そして全員を見上げて言う：「彼らはかなりやった。ここから私たちが引き継ぐ。」`,

      ko: `여기는 연구 공간이다.

왼쪽은 실험 구역: 화학 실험대, 시약 선반, 흄 후드, 메스실린더와 비커가 정돈되어 있다 — 하지만 새것이 아니다. 모든 곳에 사용 흔적이 있다.

오른쪽은 데이터 분석 구역: 대형 스크린, 컴퓨터 터미널, 산더미 같은 인쇄물. 스크린에 진행 바가 43%에서 멈춰 있다.

공기에는 혼합된 냄새가 감돈다: 화학 시약, 인쇄 용지, 그리고 커피 — 누군가 이곳에서 오랜 시간을 보냈다.

중앙 테이블 위에 실험 노트가 펼쳐져 있다. 필체가 깔끔하다가 점점 읽을 수 없게 변한다. 마지막 몇 페이지에는 이렇게 적혀 있다: "시간이 없다. 다음 그룹에게 맡긴다."

스크린이 표시한다: "이전 그룹의 연구 프로젝트가 중요한 단계에서 중단되었습니다. 연구를 결과 단계까지 진행하면 출구가 열립니다."

미아가 가장 먼저 실험대로 걸어간다. 노트를 집어 들고 넘기며, 눈이 빠르게 훑는다.

그리고 모두를 올려다보며 말한다: "그들이 많이 해놨어. 우리가 여기서 이어받자."`,
    },
    transitionNarrative: {
      zh: `研究完成了。

屏幕上的进度条从 43% 一路走到了 100%。

新化合物的数据被系统记录了，替代材料的配方被存入了数据库。上一批人开始的工作，你们做完了。

Mia 站在实验台前，摘下护目镜，看着那本笔记。她翻到最后一页，在那句「留给下一批人」的下面，写了一行字：

「完成了。——下一批人。」

你最后看了一眼那本笔记。翻回第一页。
那句「没时间了。留给下一批人」的字迹——你看了好一会儿。
不是因为字迹潦草。
是因为它长得有点像你自己的字。

出口开启了。`,

      en: `The research is complete.

The progress bar on the screen climbs from 43% all the way to 100%.

The new compound's data has been recorded by the system. The replacement material's formula has been saved to the database. The work the last group started — you finished it.

Mia stands at the bench, removes her goggles, and looks at the notebook. She turns to the last page and writes a line beneath "Leaving this for the next group":

"Done. — The next group."

You take one last look at the notebook. Flip back to the first page.
That line — "No time left. Leaving this for the next group" — you stare at it for a long moment.
Not because the handwriting is illegible.
Because it looks a little like your own.

The exit opens.`,

      nl: `Het onderzoek is voltooid.

De voortgangsbalk op het scherm klimt van 43% helemaal naar 100%.

De data van de nieuwe verbinding zijn door het systeem geregistreerd. De formule van het vervangend materiaal is opgeslagen in de database. Het werk dat de vorige groep begon — jullie hebben het afgemaakt.

Mia staat bij de werkbank, zet haar veiligheidsbril af en kijkt naar het notebook. Ze slaat de laatste pagina op en schrijft een regel onder "Dit is voor de volgende groep":

"Gedaan. — De volgende groep."

Je werpt een laatste blik op het notebook. Slaat terug naar de eerste pagina.
Die regel — "Geen tijd meer. Dit is voor de volgende groep" — je staart er lang naar.
Niet omdat het handschrift onleesbaar is.
Omdat het een beetje op je eigen handschrift lijkt.

De uitgang opent.`,

      de: `Die Forschung ist abgeschlossen.

Der Fortschrittsbalken auf dem Bildschirm steigt von 43% bis auf 100%.

Die Daten der neuen Verbindung wurden vom System erfasst. Die Formel des Ersatzmaterials wurde in der Datenbank gespeichert. Die Arbeit, die die letzte Gruppe begonnen hatte — ihr habt sie zu Ende gebracht.

Mia steht an der Werkbank, nimmt ihre Schutzbrille ab und betrachtet das Heft. Sie schlägt die letzte Seite auf und schreibt eine Zeile unter „Hinterlassen für die nächste Gruppe":

„Erledigt. — Die nächste Gruppe."

Du wirfst einen letzten Blick auf das Heft. Blätterst zurück zur ersten Seite.
Diese Zeile — „Keine Zeit mehr. Hinterlassen für die nächste Gruppe" — du starrst sie lange an.
Nicht weil die Handschrift unleserlich ist.
Weil sie ein wenig wie deine eigene aussieht.

Der Ausgang öffnet sich.`,

      fr: `La recherche est terminée.

La barre de progression sur l'écran grimpe de 43 % jusqu'à 100 %.

Les données du nouveau composé ont été enregistrées par le système. La formule du matériau de substitution a été sauvegardée dans la base de données. Le travail commencé par le dernier groupe — vous l'avez terminé.

Mia se tient devant la paillasse, retire ses lunettes de protection et regarde le cahier. Elle tourne la dernière page et écrit une ligne sous « Je laisse ça au prochain groupe » :

« Fait. — Le prochain groupe. »

Vous jetez un dernier regard au cahier. Retournez à la première page.
Cette ligne — « Plus de temps. Je laisse ça au prochain groupe » — vous la fixez longuement.
Pas parce que l'écriture est illisible.
Parce qu'elle ressemble un peu à la vôtre.

La sortie s'ouvre.`,

      es: `La investigación está completa.

La barra de progreso en la pantalla sube del 43% hasta el 100%.

Los datos del nuevo compuesto han sido registrados por el sistema. La fórmula del material sustituto ha sido guardada en la base de datos. El trabajo que el último grupo comenzó — lo terminaron ustedes.

Mia está de pie ante la mesa, se quita las gafas protectoras y mira el cuaderno. Pasa a la última página y escribe una línea debajo de "Esto es para el siguiente grupo":

"Hecho. — El siguiente grupo."

Echas un último vistazo al cuaderno. Vuelves a la primera página.
Esa línea — "No queda tiempo. Esto es para el siguiente grupo" — la miras por un largo momento.
No porque la escritura sea ilegible.
Porque se parece un poco a la tuya.

La salida se abre.`,

      pt: `A pesquisa está completa.

A barra de progresso na tela sobe de 43% até 100%.

Os dados do novo composto foram registrados pelo sistema. A fórmula do material substituto foi salva no banco de dados. O trabalho que o último grupo começou — vocês terminaram.

Mia está de pé na bancada, remove os óculos de proteção e olha para o caderno. Vira até a última página e escreve uma linha abaixo de "Deixando isto para o próximo grupo":

"Feito. — O próximo grupo."

Você dá uma última olhada no caderno. Volta à primeira página.
Aquela linha — "Sem tempo. Deixando isto para o próximo grupo" — você a encara por um longo momento.
Não porque a caligrafia é ilegível.
Porque se parece um pouco com a sua.

A saída se abre.`,

      it: `La ricerca è completata.

La barra di progresso sullo schermo sale dal 43% fino al 100%.

I dati del nuovo composto sono stati registrati dal sistema. La formula del materiale sostitutivo è stata salvata nel database. Il lavoro che l'ultimo gruppo aveva iniziato — voi l'avete completato.

Mia è in piedi al banco, si toglie gli occhiali protettivi e guarda il quaderno. Gira all'ultima pagina e scrive una riga sotto "Lo lascio al prossimo gruppo":

"Fatto. — Il prossimo gruppo."

Dai un'ultima occhiata al quaderno. Torni alla prima pagina.
Quella riga — "Non c'è più tempo. Lo lascio al prossimo gruppo" — la fissi a lungo.
Non perché la grafia è illeggibile.
Perché assomiglia un po' alla tua.

L'uscita si apre.`,

      ru: `Исследование завершено.

Полоса прогресса на экране поднимается с 43% до 100%.

Данные нового соединения записаны системой. Формула заменяющего материала сохранена в базе данных. Работу, начатую прошлой группой — вы завершили.

Миа стоит у лабораторного стола, снимает защитные очки и смотрит на журнал. Переворачивает последнюю страницу и пишет строку под «Оставляю следующей группе»:

«Сделано. — Следующая группа.»

Ты бросаешь последний взгляд на журнал. Возвращаешься к первой странице.
Та строка — «Времени не осталось. Оставляю следующей группе» — ты долго на неё смотришь.
Не потому что почерк неразборчив.
Потому что он немного похож на твой.

Выход открывается.`,

      ja: `研究が完了した。

スクリーンのプログレスバーが43%から100%まで上昇する。

新しい化合物のデータがシステムに記録された。代替材料の配合がデータベースに保存された。前のグループが始めた仕事を——あなたたちが完成させた。

ミアが実験台の前に立ち、ゴーグルを外してノートを見つめる。最後のページをめくり、「次のグループに託す」の下に一行書き加える：

「完了。——次のグループより。」

最後にもう一度ノートを見る。最初のページに戻る。
あの一行——「時間切れ。次のグループに託す」——しばらく見つめる。
筆跡が判読できないからではない。
自分の字に少し似ているからだ。

出口が開く。`,

      ko: `연구가 완료되었다.

스크린의 진행 바가 43%에서 100%까지 올라간다.

새로운 화합물의 데이터가 시스템에 기록되었다. 대체 재료의 배합이 데이터베이스에 저장되었다. 지난 그룹이 시작한 작업을 — 당신들이 끝냈다.

미아가 실험대 앞에 서서 보호 안경을 벗고 노트를 바라본다. 마지막 페이지로 넘겨 "다음 그룹에게 맡긴다" 아래에 한 줄을 쓴다:

"완료. — 다음 그룹."

마지막으로 노트를 한 번 더 본다. 첫 페이지로 돌아간다.
그 문장 — "시간이 없다. 다음 그룹에게 맡긴다" — 한참을 응시한다.
필체가 읽기 어려워서가 아니다.
자신의 글씨와 조금 닮았기 때문이다.

출구가 열린다.`,
    },
    accentColor: "#4080A0",
    bgGradient: "radial-gradient(ellipse at 50% 20%, #0A1520 0%, #050C14 100%)",
    sceneImageUrl: "/immersive/scenes/laboratory.webp",
    decorCSS:
      "radial-gradient(circle at 20% 30%, rgba(64,128,160,0.03) 1px, transparent 1px), radial-gradient(circle at 60% 70%, rgba(64,128,160,0.025) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(64,128,160,0.03) 1px, transparent 1px)",
  },

  theater: {
    key: "theater",
    index: 3,
    riasec: "A",
    title: {
      zh: "剧场",
      en: "The Theater",
      nl: "Het Theater",
      de: "Das Theater",
      fr: "Le Théâtre",
      es: "El Teatro",
      pt: "O Teatro",
      it: "Il Teatro",
      ru: "Театр",
      ja: "劇場",
      ko: "극장",
    },
    missionBrief: {
      zh: "创造一场完整的演出",
      en: "Create a complete performance",
      nl: "Creëer een complete voorstelling",
      de: "Erschaffen Sie eine vollständige Aufführung",
      fr: "Créer un spectacle complet",
      es: "Crear una actuación completa",
      pt: "Criar uma apresentação completa",
      it: "Creare uno spettacolo completo",
      ru: "Создать полноценное представление",
      ja: "完全な公演を創り上げる",
      ko: "완전한 공연을 창조하기",
    },
    subTasks: [
      {
        zh: "故事创作",
        en: "Story Writing",
        nl: "Verhaal Schrijven",
        de: "Geschichten Schreiben",
        fr: "Écriture de Récit",
        es: "Escritura de Historia",
        pt: "Escrita de História",
        it: "Scrittura di Storie",
        ru: "Написание истории",
        ja: "ストーリー執筆",
        ko: "스토리 집필",
      },
      {
        zh: "音乐配乐",
        en: "Musical Score",
        nl: "Muzikale Partituur",
        de: "Musikpartitur",
        fr: "Partition Musicale",
        es: "Partitura Musical",
        pt: "Partitura Musical",
        it: "Partitura Musicale",
        ru: "Музыкальная партитура",
        ja: "音楽スコア",
        ko: "음악 스코어",
      },
      {
        zh: "视觉特效",
        en: "Visual Effects",
        nl: "Visuele Effecten",
        de: "Visuelle Effekte",
        fr: "Effets Visuels",
        es: "Efectos Visuales",
        pt: "Efeitos Visuais",
        it: "Effetti Visivi",
        ru: "Визуальные эффекты",
        ja: "視覚効果",
        ko: "시각 효과",
      },
      {
        zh: "即兴剧本",
        en: "Improvised Script",
        nl: "Geïmproviseerd Script",
        de: "Improvisiertes Drehbuch",
        fr: "Script Improvisé",
        es: "Guión Improvisado",
        pt: "Roteiro Improvisado",
        it: "Copione Improvvisato",
        ru: "Импровизированный сценарий",
        ja: "即興脚本",
        ko: "즉흥 대본",
      },
      {
        zh: "人声演唱",
        en: "Vocal Performance",
        nl: "Vocale Uitvoering",
        de: "Gesangsdarbietung",
        fr: "Performance Vocale",
        es: "Interpretación Vocal",
        pt: "Performance Vocal",
        it: "Esibizione Vocale",
        ru: "Вокальное выступление",
        ja: "ボーカルパフォーマンス",
        ko: "보컬 퍼포먼스",
      },
    ],
    entryNarrative: {
      zh: `剧场大幕拉开。

舞台上什么都没有——空旷、黑暗、安静。只有聚光灯打下来的一个光圈，光圈中央放着一张桌子，桌上有一支笔和一叠白纸。

你们的对面，另一支队伍也走了进来。他们站在舞台的另一侧，和你们之间有大约二十米的距离，没有人开口说话。

屏幕上出现了一行字，停留了五秒，然后消失：
「创造一场完整的演出——从文字到声音，从构想到呈现。」

Kai 走向舞台边缘，站在那里，看着那张空桌子。他的眼睛里有某种东西在聚焦。

Adrian 率先打破了沉默，但不是跟对方说，是跟你们说：「竞争还是合作？」

屏幕亮起，打断了这个问题。`,

      en: `The theater curtain rises.

The stage is empty — vast, dark, silent. Only a spotlight casting a circle of light, and in its center, a table with a pen and a stack of blank paper.

Across from you, another team has also entered. They stand on the far side of the stage, about twenty meters away. No one speaks.

A line of text appears on the screen, lingers for five seconds, then vanishes:
"Create a complete performance — from words to sound, from concept to presentation."

Kai walks to the edge of the stage and stands there, looking at the empty table. Something in his eyes is focusing.

Adrian breaks the silence first — not to the other team, but to yours: "Competition or collaboration?"

The screen lights up, cutting the question short.`,

      nl: `Het theaterdoek gaat open.

Het podium is leeg — uitgestrekt, donker, stil. Alleen een spotlight die een cirkel van licht werpt, en in het midden een tafel met een pen en een stapel blanco papier.

Tegenover jullie is ook een ander team binnengekomen. Ze staan aan de andere kant van het podium, ongeveer twintig meter verderop. Niemand spreekt.

Een regel tekst verschijnt op het scherm, blijft vijf seconden hangen en verdwijnt dan:
"Creëer een complete voorstelling — van woorden tot geluid, van concept tot presentatie."

Kai loopt naar de rand van het podium en blijft staan, kijkend naar de lege tafel. Iets in zijn ogen focust.

Adrian verbreekt als eerste de stilte — niet tegen het andere team, maar tegen jullie: "Competitie of samenwerking?"

Het scherm licht op en onderbreekt de vraag.`,

      de: `Der Theatervorhang hebt sich.

Die Bühne ist leer — weit, dunkel, still. Nur ein Scheinwerfer wirft einen Lichtkreis, und in dessen Mitte ein Tisch mit einem Stift und einem Stapel weißem Papier.

Gegenüber ist ein anderes Team ebenfalls eingetreten. Sie stehen auf der anderen Seite der Bühne, etwa zwanzig Meter entfernt. Niemand spricht.

Eine Textzeile erscheint auf dem Bildschirm, verweilt fünf Sekunden, dann verschwindet sie:
„Erschaffen Sie eine vollständige Aufführung — von Worten zu Klang, vom Konzept zur Darbietung."

Kai geht zum Rand der Bühne und steht dort, den leeren Tisch betrachtend. Etwas in seinen Augen fokussiert sich.

Adrian bricht als Erster das Schweigen — nicht zum anderen Team, sondern zu eurem: „Wettbewerb oder Zusammenarbeit?"

Der Bildschirm leuchtet auf und unterbricht die Frage.`,

      fr: `Le rideau du théâtre se lève.

La scène est vide — vaste, sombre, silencieuse. Seul un projecteur dessine un cercle de lumière, et en son centre, une table avec un stylo et une pile de papier blanc.

Face à vous, une autre équipe est également entrée. Ils se tiennent de l'autre côté de la scène, à environ vingt mètres. Personne ne parle.

Une ligne de texte apparaît sur l'écran, s'attarde cinq secondes, puis disparaît :
« Créez un spectacle complet — des mots au son, du concept à la présentation. »

Kai marche jusqu'au bord de la scène et s'y tient, regardant la table vide. Quelque chose dans ses yeux se concentre.

Adrian rompt le silence en premier — pas vers l'autre équipe, mais vers la vôtre : « Compétition ou collaboration ? »

L'écran s'allume, interrompant la question.`,

      es: `El telón del teatro se levanta.

El escenario está vacío — vasto, oscuro, silencioso. Solo un foco proyectando un círculo de luz, y en su centro, una mesa con un bolígrafo y una pila de papel en blanco.

Frente a ustedes, otro equipo también ha entrado. Están al otro lado del escenario, a unos veinte metros de distancia. Nadie habla.

Una línea de texto aparece en la pantalla, permanece cinco segundos y luego desaparece:
"Crea una actuación completa — de las palabras al sonido, del concepto a la presentación."

Kai camina hasta el borde del escenario y se queda allí, mirando la mesa vacía. Algo en sus ojos se está enfocando.

Adrian rompe el silencio primero — no hacia el otro equipo, sino hacia el suyo: "¿Competencia o colaboración?"

La pantalla se enciende, cortando la pregunta.`,

      pt: `A cortina do teatro se abre.

O palco está vazio — vasto, escuro, silencioso. Apenas um holofote projetando um círculo de luz, e no centro, uma mesa com uma caneta e uma pilha de papel em branco.

Do lado oposto, outra equipe também entrou. Estão do outro lado do palco, a cerca de vinte metros de distância. Ninguém fala.

Uma linha de texto aparece na tela, permanece por cinco segundos e depois desaparece:
"Crie uma apresentação completa — das palavras ao som, do conceito à apresentação."

Kai caminha até a borda do palco e fica ali, olhando para a mesa vazia. Algo em seus olhos está se focando.

Adrian quebra o silêncio primeiro — não para a outra equipe, mas para a sua: "Competição ou colaboração?"

A tela se acende, interrompendo a pergunta.`,

      it: `Il sipario del teatro si alza.

Il palco è vuoto — vasto, scuro, silenzioso. Solo un riflettore che proietta un cerchio di luce, e al centro un tavolo con una penna e una pila di fogli bianchi.

Di fronte a voi, un'altra squadra è entrata. Sono dall'altra parte del palco, a circa venti metri di distanza. Nessuno parla.

Una riga di testo appare sullo schermo, rimane per cinque secondi, poi svanisce:
"Create uno spettacolo completo — dalle parole al suono, dal concetto alla presentazione."

Kai cammina fino al bordo del palco e resta lì, guardando il tavolo vuoto. Qualcosa nei suoi occhi si sta focalizzando.

Adrian rompe il silenzio per primo — non verso l'altra squadra, ma verso la vostra: "Competizione o collaborazione?"

Lo schermo si illumina, interrompendo la domanda.`,

      ru: `Театральный занавес поднимается.

Сцена пуста — просторная, тёмная, безмолвная. Только прожектор бросает круг света, а в центре — стол с ручкой и стопкой чистой бумаги.

Напротив вас вошла ещё одна команда. Они стоят на дальней стороне сцены, примерно в двадцати метрах. Никто не говорит.

На экране появляется строка текста, задерживается на пять секунд, затем исчезает:
«Создайте полноценное представление — от слов к звуку, от замысла к воплощению.»

Кай подходит к краю сцены и стоит, глядя на пустой стол. Что-то в его глазах фокусируется.

Адриан первым нарушает тишину — не обращаясь к другой команде, а к своей: «Соревнование или сотрудничество?»

Экран загорается, прерывая вопрос.`,

      ja: `劇場の幕が上がる。

舞台には何もない——広大で、暗く、静寂。スポットライトだけが光の輪を投げかけ、その中央にテーブルが一つ、ペンと白紙の束が置かれている。

正面から、もう一つのチームも入ってきた。舞台の反対側、約二十メートル離れた場所に立っている。誰も話さない。

スクリーンに一行のテキストが現れ、五秒間留まり、消える：
「完全な公演を創り上げよ——言葉から音へ、構想から表現へ。」

カイが舞台の端まで歩き、そこに立って空のテーブルを見つめる。彼の目の中で何かが焦点を結んでいる。

エイドリアンが最初に沈黙を破る——相手チームにではなく、自分のチームに：「競争か、協力か？」

スクリーンが点灯し、その問いを遮る。`,

      ko: `극장의 막이 올라간다.

무대 위에는 아무것도 없다 — 광활하고, 어둡고, 고요하다. 스포트라이트만이 빛의 원을 드리우고, 그 중앙에 테이블 하나, 펜과 백지 한 묶음이 놓여 있다.

맞은편에서 또 다른 팀이 들어왔다. 무대 반대편, 약 이십 미터 떨어진 곳에 서 있다. 아무도 말하지 않는다.

화면에 한 줄의 글이 나타나 다섯 초간 머물다 사라진다:
"완전한 공연을 창조하라 — 말에서 소리로, 구상에서 표현으로."

카이가 무대 가장자리로 걸어가 서서, 빈 테이블을 바라본다. 그의 눈에서 무언가가 초점을 맞추고 있다.

에이드리안이 먼저 침묵을 깬다 — 상대 팀이 아닌 자기 팀에게: "경쟁인가, 협력인가?"

화면이 켜지며 질문을 끊는다.`,
    },
    transitionNarrative: {
      zh: `演出结束了。

最后一个音符消散之后，剧场里很安静。然后对面队伍里，那个一直背对着所有人的女人，终于转过身来了。

她看了你们一眼，然后说了一句话，说完转身走向她们那边的出口：

「你们选择参与的那些任务，和你们选择旁观的那些任务，背后的原因是一样的——你们只是还不知道那个原因是什么。」

她走向出口的时候，你第一次看清了她的侧脸。

一个不合理的念头闪过你的脑海——但你没有说出来，因为它太不合理了。`,

      en: `The performance is over.

After the last note fades, the theater goes quiet. Then, from the other team, the woman who had been facing away from everyone finally turns around.

She looks at your group, says one sentence, then turns and walks toward her team's exit:

"The tasks you chose to take on and the tasks you chose to watch — the reason behind both is the same. You just don't know what that reason is yet."

As she walks toward the exit, you catch her profile for the first time.

An impossible thought flashes through your mind — but you don't say it, because it's too impossible.`,

      nl: `De voorstelling is voorbij.

Nadat de laatste noot is weggestorven, wordt het stil in het theater. Dan, van het andere team, draait de vrouw die de hele tijd met haar rug naar iedereen stond eindelijk om.

Ze kijkt naar jullie groep, zegt één zin, draait zich dan om en loopt naar de uitgang van haar team:

"De taken die jullie kozen om aan te pakken en de taken die jullie kozen om te bekijken — de reden achter beide is dezelfde. Jullie weten alleen nog niet welke."

Terwijl ze naar de uitgang loopt, vang je voor het eerst haar profiel op.

Een onmogelijke gedachte flitst door je hoofd — maar je zegt het niet, want het is te onmogelijk.`,

      de: `Die Aufführung ist vorbei.

Nachdem die letzte Note verklingt, wird es still im Theater. Dann, vom anderen Team, dreht sich die Frau, die allen den Rücken zugewandt hatte, endlich um.

Sie blickt eure Gruppe an, sagt einen Satz, dreht sich dann um und geht zum Ausgang ihres Teams:

„Die Aufgaben, die ihr übernehmen wolltet, und die Aufgaben, die ihr nur beobachtet habt — der Grund für beides ist derselbe. Ihr wisst nur noch nicht, welcher."

Als sie zum Ausgang geht, siehst du zum ersten Mal ihr Profil.

Ein unmöglicher Gedanke blitzt durch deinen Kopf — aber du sagst ihn nicht, weil er zu unmöglich ist.`,

      fr: `Le spectacle est terminé.

Après que la dernière note s'estompe, le théâtre devient silencieux. Puis, de l'autre équipe, la femme qui tournait le dos à tout le monde se retourne enfin.

Elle regarde votre groupe, dit une phrase, puis se retourne et marche vers la sortie de son équipe :

« Les tâches que vous avez choisi d'assumer et celles que vous avez choisi de regarder — la raison derrière les deux est la même. Vous ne savez simplement pas encore laquelle. »

Tandis qu'elle marche vers la sortie, vous apercevez son profil pour la première fois.

Une pensée impossible traverse votre esprit — mais vous ne la dites pas, parce qu'elle est trop impossible.`,

      es: `La actuación ha terminado.

Después de que la última nota se desvanece, el teatro queda en silencio. Entonces, del otro equipo, la mujer que había estado de espaldas a todos finalmente se da la vuelta.

Mira a tu grupo, dice una frase, y luego se gira y camina hacia la salida de su equipo:

"Las tareas que eligieron asumir y las tareas que eligieron observar — la razón detrás de ambas es la misma. Solo que aún no saben cuál es."

Mientras camina hacia la salida, captas su perfil por primera vez.

Un pensamiento imposible cruza tu mente — pero no lo dices, porque es demasiado imposible.`,

      pt: `A apresentação acabou.

Depois que a última nota se dissipa, o teatro fica em silêncio. Então, da outra equipe, a mulher que estava de costas para todos finalmente se vira.

Ela olha para o seu grupo, diz uma frase, depois se vira e caminha para a saída de sua equipe:

"As tarefas que vocês escolheram assumir e as tarefas que escolheram apenas assistir — a razão por trás de ambas é a mesma. Vocês apenas ainda não sabem qual é."

Enquanto ela caminha para a saída, você vê seu perfil pela primeira vez.

Um pensamento impossível passa pela sua mente — mas você não diz, porque é impossível demais.`,

      it: `Lo spettacolo è finito.

Dopo che l'ultima nota svanisce, il teatro diventa silenzioso. Poi, dall'altra squadra, la donna che era rimasta di spalle a tutti si volta finalmente.

Guarda il vostro gruppo, dice una frase, poi si gira e cammina verso l'uscita della sua squadra:

"I compiti che avete scelto di affrontare e quelli che avete scelto di guardare — la ragione dietro entrambi è la stessa. Solo che non sapete ancora quale sia."

Mentre cammina verso l'uscita, per la prima volta ne intravedi il profilo.

Un pensiero impossibile lampeggia nella tua mente — ma non lo dici, perché è troppo impossibile.`,

      ru: `Представление окончено.

После того как стихает последняя нота, в театре воцаряется тишина. Затем из другой команды женщина, стоявшая спиной ко всем, наконец поворачивается.

Она смотрит на вашу группу, произносит одну фразу, затем разворачивается и идёт к выходу своей команды:

«Задачи, которые вы решили взять на себя, и задачи, которые вы решили наблюдать — причина у обоих одна и та же. Вы просто ещё не знаете, какая.»

Когда она идёт к выходу, вы впервые видите её профиль.

Невозможная мысль вспыхивает в вашем сознании — но вы не произносите её, потому что она слишком невозможна.`,

      ja: `公演が終わった。

最後の音が消えた後、劇場は静まり返る。すると、相手チームの中で、ずっと背を向けていた女性がついに振り返った。

あなたたちのグループを見て、一言だけ言い、そして向きを変えて自分のチームの出口へ歩き出す：

「あなたたちが引き受けることを選んだ課題と、見ているだけを選んだ課題——その背後にある理由は同じ。ただ、その理由が何なのか、まだ知らないだけ。」

彼女が出口に向かう途中、初めてその横顔が見えた。

ありえない考えが頭をよぎる——だが口には出さない。あまりにもありえないから。`,

      ko: `공연이 끝났다.

마지막 음이 사라진 뒤, 극장이 조용해진다. 그러자 상대 팀에서, 줄곧 모두에게 등을 돌리고 있던 여자가 마침내 돌아선다.

당신의 그룹을 바라보며, 한마디를 하고, 돌아서서 자기 팀의 출구로 걸어간다:

"당신들이 맡기로 한 과제와 지켜보기로 한 과제 — 그 뒤에 있는 이유는 같아요. 다만 그 이유가 무엇인지 아직 모를 뿐."

그녀가 출구로 걸어가는 동안, 처음으로 그녀의 옆모습이 보인다.

불가능한 생각이 머릿속을 스친다 — 하지만 말하지 않는다, 너무 불가능하니까.`,
    },
    accentColor: "#B06040",
    bgGradient: "radial-gradient(ellipse at 50% 60%, #200E06 0%, #100806 100%)",
    sceneImageUrl: "/immersive/scenes/theater.webp",
    decorCSS:
      "radial-gradient(ellipse at 50% 15%, rgba(176,96,64,0.06) 0%, transparent 50%)",
  },

  waiting: {
    key: "waiting",
    index: 4,
    riasec: "S",
    title: {
      zh: "等候室",
      en: "The Waiting Room",
      nl: "De Wachtkamer",
      de: "Der Warteraum",
      fr: "La Salle d'Attente",
      es: "La Sala de Espera",
      pt: "A Sala de Espera",
      it: "La Sala d'Attesa",
      ru: "Зал ожидания",
      ja: "待合室",
      ko: "대기실",
    },
    missionBrief: {
      zh: "这里没有需要被解开的机关，只有需要被帮助的人",
      en: "There are no puzzles to solve here — only people who need help",
      nl: "Hier zijn geen puzzels op te lossen — alleen mensen die hulp nodig hebben",
      de: "Hier gibt es keine Rätsel zu lösen — nur Menschen, die Hilfe brauchen",
      fr: "Il n'y a pas d'énigmes à résoudre ici — seulement des gens qui ont besoin d'aide",
      es: "Aquí no hay acertijos que resolver — solo personas que necesitan ayuda",
      pt: "Não há quebra-cabeças para resolver aqui — apenas pessoas que precisam de ajuda",
      it: "Qui non ci sono enigmi da risolvere — solo persone che hanno bisogno di aiuto",
      ru: "Здесь нет головоломок — только люди, которым нужна помощь",
      ja: "ここには解くべき仕掛けはない——助けを必要とする人がいるだけだ",
      ko: "여기에는 풀어야 할 퍼즐이 없다 — 도움이 필요한 사람들만 있을 뿐",
    },
    subTasks: [
      {
        zh: "志愿服务",
        en: "Volunteer Service",
        nl: "Vrijwilligerswerk",
        de: "Freiwilligenarbeit",
        fr: "Service Bénévole",
        es: "Servicio Voluntario",
        pt: "Serviço Voluntário",
        it: "Servizio Volontario",
        ru: "Волонтёрская служба",
        ja: "ボランティア活動",
        ko: "자원봉사",
      },
      {
        zh: "身体指导",
        en: "Physical Guidance",
        nl: "Fysieke Begeleiding",
        de: "Körperliche Anleitung",
        fr: "Guidage Physique",
        es: "Orientación Física",
        pt: "Orientação Física",
        it: "Guida Fisica",
        ru: "Физическое сопровождение",
        ja: "身体的ガイダンス",
        ko: "신체 지도",
      },
      {
        zh: "职业引导",
        en: "Career Counseling",
        nl: "Loopbaanbegeleiding",
        de: "Berufsberatung",
        fr: "Orientation Professionnelle",
        es: "Orientación Profesional",
        pt: "Orientação de Carreira",
        it: "Orientamento Professionale",
        ru: "Карьерное консультирование",
        ja: "キャリアカウンセリング",
        ko: "진로 상담",
      },
      {
        zh: "手语沟通",
        en: "Sign Language Communication",
        nl: "Gebarentaalcommunicatie",
        de: "Gebärdensprachkommunikation",
        fr: "Communication en Langue des Signes",
        es: "Comunicación en Lengua de Señas",
        pt: "Comunicação em Língua de Sinais",
        it: "Comunicazione nella Lingua dei Segni",
        ru: "Общение на жестовом языке",
        ja: "手話コミュニケーション",
        ko: "수화 소통",
      },
      {
        zh: "儿童看护",
        en: "Childcare",
        nl: "Kinderopvang",
        de: "Kinderbetreuung",
        fr: "Garde d'Enfants",
        es: "Cuidado Infantil",
        pt: "Cuidado Infantil",
        it: "Assistenza all'Infanzia",
        ru: "Уход за детьми",
        ja: "保育",
        ko: "보육",
      },
    ],
    entryNarrative: {
      zh: `等候室不像你想象的那样——不是一个安静的等待空间。

它更像一个临时搭建的服务站。桌椅混乱地摆放着，公告栏上贴满了手写的便条，每一条都是一个请求。空间里有十几个人——不是你们，不是另一支队伍，是其他人。他们有的坐着，有的站着，有的只是在那里。

公告栏上方的屏幕显示了通关条件：
「这里不是闯关。这里需要帮忙。没有报酬。每一个在这里等待的人都得到了他们需要的回应，出口开启。」

Leila 没有等屏幕出现任何进一步的说明。她已经走进人群了。

她在做一件你无法用任何策略来解释的事：她在帮忙。纯粹地、无偿地、因为有人需要。`,

      en: `The waiting room isn't what you imagined — it's not a quiet space for waiting.

It's more like a makeshift service station. Tables and chairs are scattered about. A bulletin board is plastered with handwritten notes, each one a request. A dozen or so people are here — not your group, not the other team. Other people. Some sitting, some standing, some just... there.

The screen doesn't show a specific task. Just one line:
"This is not a challenge. This place needs help. There is no reward."

Leila has already walked into the crowd. She's doing something you can't explain with any strategy: she's helping. Purely, freely, because someone needs it.`,

      nl: `De wachtkamer is niet wat je je voorstelde — het is geen rustige ruimte om te wachten.

Het lijkt meer op een geïmproviseerd servicestation. Tafels en stoelen staan willekeurig verspreid. Een prikbord hangt vol met handgeschreven briefjes, elk een verzoek. Een dozijn mensen zijn hier — niet jullie groep, niet het andere team. Andere mensen. Sommigen zitten, sommigen staan, sommigen zijn er gewoon... aanwezig.

Het scherm toont geen specifieke taak. Slechts één regel:
"Dit is geen uitdaging. Deze plek heeft hulp nodig. Er is geen beloning."

Leila is al de menigte ingelopen. Ze doet iets wat je met geen enkele strategie kunt verklaren: ze helpt. Puur, vrijwillig, omdat iemand het nodig heeft.`,

      de: `Der Warteraum ist nicht, was du dir vorgestellt hast — kein ruhiger Raum zum Warten.

Er gleicht eher einer provisorischen Hilfsstation. Tische und Stühle stehen durcheinander. Ein schwarzes Brett ist mit handgeschriebenen Zetteln bedeckt, jeder eine Bitte. Ein Dutzend Menschen sind hier — nicht eure Gruppe, nicht das andere Team. Andere Menschen. Manche sitzen, manche stehen, manche sind einfach... da.

Der Bildschirm zeigt keine bestimmte Aufgabe. Nur eine Zeile:
„Das ist keine Herausforderung. Dieser Ort braucht Hilfe. Es gibt keine Belohnung."

Leila ist bereits in die Menge gegangen. Sie tut etwas, das du mit keiner Strategie erklären kannst: Sie hilft. Rein, frei, weil jemand es braucht.`,

      fr: `La salle d'attente n'est pas ce que vous imaginiez — ce n'est pas un espace calme pour attendre.

C'est plutôt une station de service improvisée. Tables et chaises sont dispersées. Un panneau d'affichage est couvert de notes manuscrites, chacune une demande. Une douzaine de personnes sont ici — pas votre groupe, pas l'autre équipe. D'autres personnes. Certaines assises, certaines debout, certaines juste... là.

L'écran n'affiche pas de tâche spécifique. Juste une ligne :
« Ce n'est pas un défi. Cet endroit a besoin d'aide. Il n'y a pas de récompense. »

Leila est déjà entrée dans la foule. Elle fait quelque chose qu'aucune stratégie ne peut expliquer : elle aide. Purement, librement, parce que quelqu'un en a besoin.`,

      es: `La sala de espera no es lo que imaginabas — no es un espacio tranquilo para esperar.

Es más como una estación de servicio improvisada. Mesas y sillas están dispersas. Un tablón de anuncios está cubierto de notas escritas a mano, cada una un pedido. Una docena de personas están aquí — no tu grupo, no el otro equipo. Otras personas. Algunas sentadas, algunas de pie, algunas simplemente... ahí.

La pantalla no muestra una tarea específica. Solo una línea:
"Esto no es un desafío. Este lugar necesita ayuda. No hay recompensa."

Leila ya se ha adentrado entre la gente. Está haciendo algo que no puedes explicar con ninguna estrategia: está ayudando. Pura y libremente, porque alguien lo necesita.`,

      pt: `A sala de espera não é o que você imaginou — não é um espaço tranquilo para esperar.

É mais como uma estação de serviço improvisada. Mesas e cadeiras estão espalhadas. Um quadro de avisos está coberto de bilhetes manuscritos, cada um um pedido. Cerca de uma dúzia de pessoas estão aqui — não o seu grupo, não a outra equipe. Outras pessoas. Algumas sentadas, algumas de pé, algumas apenas... ali.

A tela não mostra uma tarefa específica. Apenas uma linha:
"Isto não é um desafio. Este lugar precisa de ajuda. Não há recompensa."

Leila já entrou no meio das pessoas. Ela está fazendo algo que nenhuma estratégia pode explicar: está ajudando. Pura e livremente, porque alguém precisa.`,

      it: `La sala d'attesa non è quello che immaginavi — non è uno spazio tranquillo per aspettare.

Somiglia più a una stazione di servizio improvvisata. Tavoli e sedie sono sparsi ovunque. Una bacheca è coperta di biglietti scritti a mano, ognuno una richiesta. Una dozzina di persone sono qui — non il vostro gruppo, non l'altra squadra. Altre persone. Alcune sedute, alcune in piedi, alcune semplicemente... lì.

Lo schermo non mostra un compito specifico. Solo una riga:
"Questa non è una sfida. Questo posto ha bisogno di aiuto. Non c'è ricompensa."

Leila è già entrata nella folla. Sta facendo qualcosa che nessuna strategia può spiegare: sta aiutando. Puramente, liberamente, perché qualcuno ne ha bisogno.`,

      ru: `Зал ожидания не такой, как ты себе представлял — это не тихое место для ожидания.

Это скорее импровизированная станция помощи. Столы и стулья расставлены хаотично. Доска объявлений увешана рукописными записками, каждая — просьба. Здесь около дюжины людей — не ваша группа, не другая команда. Другие люди. Кто-то сидит, кто-то стоит, кто-то просто... здесь.

Экран не показывает конкретного задания. Только одна строка:
«Это не испытание. Этому месту нужна помощь. Награды нет.»

Лейла уже вошла в толпу. Она делает то, что нельзя объяснить никакой стратегией: она помогает. Чисто, безвозмездно, потому что кому-то это нужно.`,

      ja: `待合室は想像していたのとは違った——静かに待つための空間ではない。

むしろ即席の支援ステーションのようだ。テーブルと椅子が雑然と並び、掲示板には手書きのメモがびっしり貼られている。一枚一枚がひとつの頼みごとだ。十数人がここにいる——あなたのグループでも、もう一つのチームでもない。別の人々だ。座っている人、立っている人、ただ……そこにいる人。

スクリーンには具体的な課題は表示されない。一行だけ：
「これは試練ではない。この場所は助けを必要としている。報酬はない。」

レイラはもう人々の中に入っていた。どんな戦略でも説明できないことをしている：助けている。純粋に、無償で、誰かがそれを必要としているから。`,

      ko: `대기실은 상상했던 것과 다르다 — 조용히 기다리는 공간이 아니다.

오히려 임시로 세운 서비스 스테이션에 가깝다. 테이블과 의자가 어지럽게 놓여 있다. 게시판에는 손으로 쓴 메모가 빼곡하다, 하나하나가 부탁이다. 십여 명이 여기 있다 — 당신 그룹도, 상대 팀도 아닌 다른 사람들이다. 앉아 있는 사람, 서 있는 사람, 그저... 거기 있는 사람.

화면에는 구체적인 과제가 표시되지 않는다. 한 줄만:
"이것은 도전이 아닙니다. 이곳은 도움이 필요합니다. 보상은 없습니다."

레일라는 이미 사람들 사이로 들어갔다. 어떤 전략으로도 설명할 수 없는 일을 하고 있다: 돕고 있다. 순수하게, 아무 대가 없이, 누군가가 필요로 하기에.`,
    },
    transitionNarrative: {
      zh: `等候室里所有的人，一个接一个，消失了。

不是离开，只是——不见了。

公告栏上只剩下一行字，是新出现的：「被看见，是一件比被帮助更难得到的事。」

Leila 站在原地，看着那行字，没有说话。Marcus 在她旁边站了一会儿，然后向前走了。

你最后看了一眼公告栏。
那些手写的便条——需要水的、需要食物的、需要帮助的——每一张的笔迹都不同。
但有一张便条，你之前没有注意到，贴在最角落：

「我需要有人告诉我，我是谁。」

那张便条的字迹，你认得。`,

      en: `Everyone in the waiting room, one by one, disappears.

Not leaving — just... gone.

On the bulletin board, only one line remains, newly appeared: "Being seen is rarer than being helped."

Leila stands where she is, reading those words, saying nothing. Marcus stands beside her for a moment, then walks on.

You take one last look at the bulletin board.
The handwritten notes — water needed, food needed, help needed — each in a different hand.
But one note, in the farthest corner, you hadn't noticed before:

"I need someone to tell me who I am."

You recognize the handwriting.`,

      nl: `Iedereen in de wachtkamer verdwijnt, één voor één.

Niet vertrokken — gewoon... weg.

Op het prikbord blijft slechts één regel over, pas verschenen: "Gezien worden is zeldzamer dan geholpen worden."

Leila staat waar ze stond, leest die woorden, zegt niets. Marcus staat even naast haar, loopt dan door.

Je werpt een laatste blik op het prikbord.
De handgeschreven briefjes — water nodig, eten nodig, hulp nodig — elk in een ander handschrift.
Maar één briefje, in de verste hoek, was je eerder niet opgevallen:

"Ik heb iemand nodig die me vertelt wie ik ben."

Je herkent het handschrift.`,

      de: `Alle im Warteraum verschwinden, einer nach dem anderen.

Nicht gegangen — einfach... weg.

Am schwarzen Brett bleibt nur eine Zeile, neu erschienen: „Gesehen zu werden ist seltener als Hilfe zu bekommen."

Leila steht, wo sie steht, liest die Worte, sagt nichts. Marcus steht einen Moment neben ihr, geht dann weiter.

Du wirfst einen letzten Blick auf das schwarze Brett.
Die handgeschriebenen Zettel — Wasser gebraucht, Essen gebraucht, Hilfe gebraucht — jeder in einer anderen Handschrift.
Aber ein Zettel, in der entferntesten Ecke, den du vorher nicht bemerkt hattest:

„Ich brauche jemanden, der mir sagt, wer ich bin."

Du erkennst die Handschrift.`,

      fr: `Tout le monde dans la salle d'attente disparaît, un par un.

Pas partis — juste... disparus.

Sur le panneau d'affichage, il ne reste qu'une seule ligne, nouvellement apparue : « Être vu est plus rare qu'être aidé. »

Leila reste là où elle est, lisant ces mots, ne disant rien. Marcus se tient à côté d'elle un instant, puis avance.

Vous jetez un dernier regard au panneau d'affichage.
Les notes manuscrites — besoin d'eau, besoin de nourriture, besoin d'aide — chacune d'une écriture différente.
Mais une note, dans le coin le plus éloigné, que vous n'aviez pas remarquée :

« J'ai besoin que quelqu'un me dise qui je suis. »

Vous reconnaissez l'écriture.`,

      es: `Todos en la sala de espera, uno por uno, desaparecen.

No se van — simplemente... se desvanecen.

En el tablón de anuncios solo queda una línea, recién aparecida: "Ser visto es más raro que ser ayudado."

Leila permanece donde está, leyendo esas palabras, sin decir nada. Marcus se queda junto a ella un momento, luego sigue adelante.

Echas un último vistazo al tablón de anuncios.
Las notas escritas a mano — necesitan agua, necesitan comida, necesitan ayuda — cada una con letra diferente.
Pero hay una nota, en la esquina más lejana, que no habías notado antes:

"Necesito que alguien me diga quién soy."

Reconoces la letra.`,

      pt: `Todos na sala de espera, um por um, desaparecem.

Não saíram — apenas... sumiram.

No quadro de avisos, resta apenas uma linha, recém-aparecida: "Ser visto é mais raro do que ser ajudado."

Leila permanece onde está, lendo aquelas palavras, sem dizer nada. Marcus fica ao lado dela por um momento, depois segue em frente.

Você dá uma última olhada no quadro de avisos.
Os bilhetes manuscritos — precisa de água, precisa de comida, precisa de ajuda — cada um com uma caligrafia diferente.
Mas um bilhete, no canto mais distante, que você não havia notado antes:

"Preciso que alguém me diga quem eu sou."

Você reconhece a caligrafia.`,

      it: `Tutti nella sala d'attesa, uno dopo l'altro, scompaiono.

Non se ne sono andati — semplicemente... spariti.

Sulla bacheca rimane solo una riga, appena apparsa: "Essere visti è più raro che essere aiutati."

Leila resta dov'è, legge quelle parole, non dice nulla. Marcus resta accanto a lei per un momento, poi prosegue.

Dai un'ultima occhiata alla bacheca.
I biglietti scritti a mano — serve acqua, serve cibo, serve aiuto — ognuno con una grafia diversa.
Ma un biglietto, nell'angolo più lontano, che non avevi notato prima:

"Ho bisogno che qualcuno mi dica chi sono."

Riconosci la grafia.`,

      ru: `Все в зале ожидания, один за другим, исчезают.

Не уходят — просто... пропадают.

На доске объявлений осталась лишь одна строка, только что появившаяся: «Быть увиденным — реже, чем получить помощь.»

Лейла стоит на месте, читает эти слова, молчит. Маркус стоит рядом с ней мгновение, потом идёт дальше.

Ты бросаешь последний взгляд на доску объявлений.
Рукописные записки — нужна вода, нужна еда, нужна помощь — каждая написана разным почерком.
Но одна записка, в самом дальнем углу, которую ты раньше не замечал:

«Мне нужно, чтобы кто-нибудь сказал мне, кто я.»

Ты узнаёшь этот почерк.`,

      ja: `待合室にいた全員が、一人ずつ、消えていった。

立ち去ったのではない——ただ……いなくなった。

掲示板には一行だけが残っている。新しく現れた文字：「見てもらえることは、助けてもらうことよりも稀なことだ。」

レイラはその場に立ち、その言葉を読んでいる。何も言わない。マーカスが隣にしばらく立ち、そして先に進んだ。

最後にもう一度掲示板を見る。
手書きのメモ——水が必要、食べ物が必要、助けが必要——どれも筆跡が違う。
しかし一枚のメモ、一番奥の隅にあって、前には気づかなかったもの：

「誰か、私が誰なのか教えてほしい。」

その筆跡に、見覚えがある。`,

      ko: `대기실의 모든 사람이, 한 명씩, 사라진다.

떠난 게 아니다 — 그냥... 없어졌다.

게시판에는 한 줄만 남아 있다, 새로 나타난 글씨: "보여지는 것은 도움받는 것보다 더 드문 일이다."

레일라가 그 자리에 서서 그 말을 읽고 있다. 아무 말도 하지 않는다. 마커스가 그녀 옆에 잠시 서 있다가 앞으로 걸어간다.

마지막으로 게시판을 한 번 더 본다.
손으로 쓴 메모들 — 물이 필요해, 음식이 필요해, 도움이 필요해 — 저마다 다른 필체.
하지만 한 장의 메모, 가장 먼 구석에 있어서 전에는 눈에 띄지 않았던 것:

"누군가 나에게 내가 누구인지 말해줬으면 좋겠다."

그 필체를 알아본다.`,
    },
    accentColor: "#608060",
    bgGradient: "radial-gradient(ellipse at 50% 40%, #0A1410 0%, #060C08 100%)",
    sceneImageUrl: "/immersive/scenes/waiting.webp",
    decorCSS:
      "repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(96,128,96,0.03) 59px, rgba(96,128,96,0.03) 60px)",
  },

  negotiation: {
    key: "negotiation",
    index: 5,
    riasec: "E",
    title: {
      zh: "谈判层",
      en: "The Negotiation Floor",
      nl: "De Onderhandelingsvloer",
      de: "Die Verhandlungsebene",
      fr: "L'Étage de Négociation",
      es: "La Planta de Negociación",
      pt: "O Andar de Negociação",
      it: "Il Piano delle Trattative",
      ru: "Переговорный этаж",
      ja: "交渉フロア",
      ko: "협상의 장",
    },
    missionBrief: {
      zh: "两支队伍，有限资源，从零建立合作秩序",
      en: "Two teams, limited resources, build a cooperative order from nothing",
      nl: "Twee teams, beperkte middelen, bouw een samenwerkingsorde op vanuit niets",
      de: "Zwei Teams, begrenzte Ressourcen, eine kooperative Ordnung aus dem Nichts aufbauen",
      fr: "Deux équipes, ressources limitées, construire un ordre coopératif à partir de rien",
      es: "Dos equipos, recursos limitados, construir un orden cooperativo desde cero",
      pt: "Duas equipes, recursos limitados, construir uma ordem cooperativa do zero",
      it: "Due squadre, risorse limitate, costruire un ordine cooperativo dal nulla",
      ru: "Две команды, ограниченные ресурсы, построить порядок сотрудничества с нуля",
      ja: "二つのチーム、限られた資源、ゼロから協力秩序を築く",
      ko: "두 팀, 제한된 자원, 아무것도 없는 데서 협력 질서를 구축하기",
    },
    subTasks: [
      {
        zh: "资源交易",
        en: "Resource Trading",
        nl: "Grondstoffenhandel",
        de: "Ressourcenhandel",
        fr: "Commerce de Ressources",
        es: "Comercio de Recursos",
        pt: "Comércio de Recursos",
        it: "Scambio di Risorse",
        ru: "Торговля ресурсами",
        ja: "資源取引",
        ko: "자원 거래",
      },
      {
        zh: "服务运营",
        en: "Service Operations",
        nl: "Dienstverleningsactiviteiten",
        de: "Dienstleistungsbetrieb",
        fr: "Opérations de Service",
        es: "Operaciones de Servicio",
        pt: "Operações de Serviço",
        it: "Operazioni di Servizio",
        ru: "Операции по обслуживанию",
        ja: "サービス運営",
        ko: "서비스 운영",
      },
      {
        zh: "合作创建",
        en: "Venture Creation",
        nl: "Ondernemingscreatie",
        de: "Unternehmensgründung",
        fr: "Création d'Entreprise",
        es: "Creación de Empresa",
        pt: "Criação de Empreendimento",
        it: "Creazione di Impresa",
        ru: "Создание предприятия",
        ja: "事業創出",
        ko: "벤처 창출",
      },
      {
        zh: "争议辩护",
        en: "Dispute Advocacy",
        nl: "Geschillenbehartiging",
        de: "Streitvertretung",
        fr: "Défense en Litige",
        es: "Defensa de Disputas",
        pt: "Advocacia de Disputas",
        it: "Difesa nelle Controversie",
        ru: "Представительство в спорах",
        ja: "紛争弁護",
        ko: "분쟁 변호",
      },
      {
        zh: "方案推销",
        en: "Pitch Selling",
        nl: "Pitch Verkoop",
        de: "Pitch-Verkauf",
        fr: "Vente de Propositions",
        es: "Venta de Propuestas",
        pt: "Venda de Propostas",
        it: "Vendita di Proposte",
        ru: "Презентация и продажа",
        ja: "ピッチセリング",
        ko: "피치 세일링",
      },
    ],
    entryNarrative: {
      zh: `第五层，你们和另一支队伍再次相遇。

但这一次不一样。场地中央的地面升起了一个交易台，台上显示着各种资源的名称和实时价格——它们在波动。

屏幕上的规则说明比之前任何一层都更简短：
「本层可用资源总量有限。两支队伍若各自独立推进，均无法完成通关。规则制定由参与者自行完成。」

那个背对着所有人的女人，就站在对面队伍中间。

Adrian 扫了一遍屏幕，表情比之前严肃了：「那我们谈。」`,

      en: `Fifth floor. You meet the other team again.

But this time it's different. A trading console rises from the center of the floor, displaying resource names and live prices — fluctuating. Every few seconds, some values climb while others drop.

The screen explains the rules in fewer words than any floor before:
"Total available resources are limited. Neither team can clear the floor independently. Rule-making is up to the participants."

The woman who keeps her back to everyone is standing in the middle of the other team.

Adrian scans the screen, his expression more serious than before: "Then we negotiate."`,

      nl: `Vijfde verdieping. Jullie ontmoeten het andere team opnieuw.

Maar dit keer is het anders. Een handelsconsole rijst op uit het midden van de vloer, met resourcenamen en live prijzen — fluctuerend. Elke paar seconden stijgen sommige waarden terwijl andere dalen.

Het scherm legt de regels uit in minder woorden dan welke verdieping ook:
"De totaal beschikbare middelen zijn beperkt. Geen van beide teams kan de verdieping zelfstandig voltooien. Regelgeving is aan de deelnemers."

De vrouw die haar rug naar iedereen keert staat midden in het andere team.

Adrian scant het scherm, zijn uitdrukking serieuzer dan voorheen: "Dan onderhandelen we."`,

      de: `Fünfte Etage. Ihr trefft das andere Team wieder.

Aber diesmal ist es anders. Eine Handelskonsole erhebt sich aus der Mitte des Bodens und zeigt Ressourcennamen und Echtzeitpreise — schwankend. Alle paar Sekunden steigen einige Werte, während andere fallen.

Der Bildschirm erklärt die Regeln in weniger Worten als jede Etage zuvor:
„Die verfügbaren Gesamtressourcen sind begrenzt. Kein Team kann die Etage allein abschließen. Die Regelgestaltung liegt bei den Teilnehmern."

Die Frau, die allen den Rücken zukehrt, steht in der Mitte des anderen Teams.

Adrian scannt den Bildschirm, sein Ausdruck ernster als zuvor: „Dann verhandeln wir."`,

      fr: `Cinquième étage. Vous retrouvez l'autre équipe.

Mais cette fois, c'est différent. Une console de trading s'élève du centre du sol, affichant des noms de ressources et des prix en direct — fluctuants. Toutes les quelques secondes, certaines valeurs montent tandis que d'autres chutent.

L'écran explique les règles en moins de mots que jamais :
« Les ressources totales disponibles sont limitées. Aucune des deux équipes ne peut terminer l'étage seule. L'établissement des règles appartient aux participants. »

La femme qui tourne le dos à tout le monde se tient au milieu de l'autre équipe.

Adrian balaye l'écran du regard, son expression plus grave qu'avant : « Alors on négocie. »`,

      es: `Quinto piso. Se encuentran con el otro equipo otra vez.

Pero esta vez es diferente. Una consola de comercio se eleva del centro del suelo, mostrando nombres de recursos y precios en vivo — fluctuando. Cada pocos segundos, algunos valores suben mientras otros bajan.

La pantalla explica las reglas con menos palabras que nunca:
"Los recursos totales disponibles son limitados. Ningún equipo puede completar este piso de forma independiente. Las reglas las establecen los participantes."

La mujer que mantiene su espalda hacia todos está en el centro del otro equipo.

Adrian escanea la pantalla, su expresión más seria que antes: "Entonces negociamos."`,

      pt: `Quinto andar. Vocês encontram a outra equipe novamente.

Mas desta vez é diferente. Um console de negociação se ergue do centro do chão, exibindo nomes de recursos e preços ao vivo — flutuando. A cada poucos segundos, alguns valores sobem enquanto outros caem.

A tela explica as regras com menos palavras do que qualquer andar anterior:
"O total de recursos disponíveis é limitado. Nenhuma equipe pode completar o andar independentemente. A criação de regras cabe aos participantes."

A mulher que mantém as costas viradas para todos está no meio da outra equipe.

Adrian examina a tela, sua expressão mais séria do que antes: "Então negociamos."`,

      it: `Quinto piano. Incontrate di nuovo l'altra squadra.

Ma questa volta è diverso. Una console di scambio si alza dal centro del pavimento, mostrando nomi di risorse e prezzi in tempo reale — fluttuanti. Ogni pochi secondi, alcuni valori salgono mentre altri scendono.

Lo schermo spiega le regole con meno parole di qualsiasi piano precedente:
"Le risorse totali disponibili sono limitate. Nessuna delle due squadre può completare il piano indipendentemente. La definizione delle regole spetta ai partecipanti."

La donna che tiene le spalle rivolte a tutti è in piedi al centro dell'altra squadra.

Adrian scorre lo schermo con lo sguardo, la sua espressione più seria di prima: "Allora trattamo."`,

      ru: `Пятый этаж. Вы снова встречаете другую команду.

Но на этот раз всё иначе. Из центра пола поднимается торговая консоль, отображающая названия ресурсов и цены в реальном времени — колеблющиеся. Каждые несколько секунд одни значения растут, другие падают.

Экран объясняет правила лаконичнее, чем на любом этаже до этого:
«Общий объём доступных ресурсов ограничен. Ни одна из команд не может пройти этаж самостоятельно. Установление правил — задача участников.»

Женщина, стоящая спиной ко всем, находится в центре другой команды.

Адриан окидывает взглядом экран, выражение лица серьёзнее, чем раньше: «Тогда ведём переговоры.»`,

      ja: `五階。もう一つのチームと再会する。

だが今回は違う。フロアの中央から取引コンソールがせり上がり、資源名とリアルタイム価格が表示されている——変動している。数秒ごとに、ある値が上がり、別の値が下がる。

スクリーンはこれまでのどのフロアよりも少ない言葉でルールを説明する：
「利用可能な資源の総量は限られています。どちらのチームも単独ではこのフロアをクリアできません。ルール策定は参加者自身が行ってください。」

あの、すべての人に背を向けている女性が、相手チームの真ん中に立っている。

エイドリアンがスクリーンを見渡す。表情がこれまでより真剣だ：「なら、交渉しよう。」`,

      ko: `다섯 번째 층. 상대 팀과 다시 만난다.

하지만 이번에는 다르다. 바닥 중앙에서 거래 콘솔이 올라오며, 자원 이름과 실시간 가격을 표시한다 — 변동하고 있다. 몇 초마다 어떤 값은 오르고 어떤 값은 내린다.

화면이 이전 어느 층보다 짧은 말로 규칙을 설명한다:
"사용 가능한 총 자원은 제한되어 있습니다. 어느 팀도 독립적으로 이 층을 클리어할 수 없습니다. 규칙 제정은 참가자의 몫입니다."

모두에게 등을 돌리고 있는 그 여자가 상대 팀 한가운데 서 있다.

에이드리안이 화면을 훑으며, 이전보다 진지한 표정으로 말한다: "그러면 협상하자."`,
    },
    transitionNarrative: {
      zh: `两支队伍都通过了这一层。

谈判结束的时候，那个女人在走向她们出口的途中，转头说了一句话，没有停步，声音不大，但你听清楚了：

「你们知道为什么你们是第几批到这里来的人吗？」

没有人回答，因为没有人知道。

她的话留在房间里，像一块石头沉进水里，往下沉，往下沉，还没有到底。

你走向档案室的入口。门上有一块铭牌，字很小，你凑近了才看清：

「档案室仅限本人使用。
每位参与者独自完成最终步骤。
注意：此空间中储存的所有档案
均来自同一位参与者。」

你愣了一秒。
同一位参与者？

你推开了门。`,

      en: `Both teams made it through this floor.

As the negotiation ends, the woman pauses on her way to her team's exit and says — without stopping, not loudly, but you hear every word:

"Do you know why you're the nth group to arrive here?"

No one answers. Because no one knows.

Her words stay in the room, like a stone sinking into water — down, down, not yet reaching the bottom.

You walk toward the archive room entrance. A small plaque on the door, text so fine you have to lean close:

"Archive room: authorized personnel only.
Each participant completes the final steps alone.
Note: all files stored in this space
belong to a single participant."

You pause for a second.
A single participant?

You push the door open.`,

      nl: `Beide teams haalden deze verdieping.

Als de onderhandeling eindigt, stopt de vrouw even op weg naar de uitgang van haar team en zegt — zonder te stoppen, niet luid, maar je hoort elk woord:

"Weten jullie waarom jullie de zoveelste groep zijn die hier aankomt?"

Niemand antwoordt. Omdat niemand het weet.

Haar woorden blijven in de kamer hangen, als een steen die in water zinkt — naar beneden, naar beneden, de bodem nog niet bereikt.

Je loopt naar de ingang van de archiefkamer. Een klein plaatje op de deur, tekst zo fijn dat je dichtbij moet komen:

"Archiefkamer: alleen bevoegd personeel.
Elke deelnemer voltooit de laatste stappen alleen.
Let op: alle dossiers in deze ruimte
behoren tot één enkele deelnemer."

Je aarzelt een seconde.
Eén enkele deelnemer?

Je duwt de deur open.`,

      de: `Beide Teams haben diese Etage geschafft.

Als die Verhandlung endet, hält die Frau auf dem Weg zum Ausgang ihres Teams inne und sagt — ohne stehenzubleiben, nicht laut, aber du hörst jedes Wort:

„Wisst ihr, warum ihr die x-te Gruppe seid, die hier ankommt?"

Niemand antwortet. Weil niemand es weiß.

Ihre Worte bleiben im Raum, wie ein Stein, der ins Wasser sinkt — tiefer, tiefer, den Grund noch nicht erreichend.

Du gehst zum Eingang des Archivraums. Ein kleines Schild an der Tür, die Schrift so fein, dass du dich vorbeugen musst:

„Archivraum: nur für autorisierte Personen.
Jeder Teilnehmer schließt die letzten Schritte allein ab.
Hinweis: Alle in diesem Raum gespeicherten Akten
gehören einem einzigen Teilnehmer."

Du hältst eine Sekunde inne.
Einem einzigen Teilnehmer?

Du drückst die Tür auf.`,

      fr: `Les deux équipes ont réussi cet étage.

Alors que la négociation se termine, la femme s'arrête en se dirigeant vers la sortie de son équipe et dit — sans s'arrêter, pas fort, mais vous entendez chaque mot :

« Savez-vous pourquoi vous êtes le énième groupe à arriver ici ? »

Personne ne répond. Parce que personne ne sait.

Ses mots restent dans la pièce, comme une pierre qui coule dans l'eau — vers le bas, vers le bas, n'ayant pas encore atteint le fond.

Vous marchez vers l'entrée de la salle des archives. Une petite plaque sur la porte, le texte si fin qu'il faut se pencher :

« Salle des archives : personnel autorisé uniquement.
Chaque participant effectue les dernières étapes seul.
Note : tous les dossiers stockés dans cet espace
appartiennent à un seul participant. »

Vous marquez une pause.
Un seul participant ?

Vous poussez la porte.`,

      es: `Ambos equipos pasaron este piso.

Cuando la negociación termina, la mujer se detiene camino a la salida de su equipo y dice — sin detenerse, no en voz alta, pero escuchas cada palabra:

"¿Saben por qué son el enésimo grupo en llegar aquí?"

Nadie responde. Porque nadie lo sabe.

Sus palabras se quedan en la habitación, como una piedra hundiéndose en el agua — hacia abajo, hacia abajo, sin tocar fondo aún.

Caminas hacia la entrada de la sala de archivos. Una pequeña placa en la puerta, texto tan fino que debes acercarte:

"Sala de archivos: solo personal autorizado.
Cada participante completa los pasos finales a solas.
Nota: todos los archivos almacenados en este espacio
pertenecen a un único participante."

Te detienes un segundo.
¿Un único participante?

Empujas la puerta.`,

      pt: `Ambas as equipes passaram por este andar.

Quando a negociação termina, a mulher para no caminho para a saída de sua equipe e diz — sem parar, não alto, mas você ouve cada palavra:

"Vocês sabem por que são o enésimo grupo a chegar aqui?"

Ninguém responde. Porque ninguém sabe.

Suas palavras ficam na sala, como uma pedra afundando na água — para baixo, para baixo, sem ainda tocar o fundo.

Você caminha em direção à entrada da sala de arquivos. Uma pequena placa na porta, texto tão fino que é preciso se aproximar:

"Sala de arquivos: apenas pessoal autorizado.
Cada participante completa os passos finais sozinho.
Nota: todos os arquivos armazenados neste espaço
pertencem a um único participante."

Você hesita por um segundo.
Um único participante?

Você empurra a porta.`,

      it: `Entrambe le squadre hanno superato questo piano.

Quando la trattativa finisce, la donna si ferma sulla strada verso l'uscita della sua squadra e dice — senza fermarsi, non ad alta voce, ma senti ogni parola:

"Sapete perché siete l'ennesimo gruppo ad arrivare qui?"

Nessuno risponde. Perché nessuno lo sa.

Le sue parole restano nella stanza, come una pietra che affonda nell'acqua — giù, giù, senza aver ancora raggiunto il fondo.

Cammini verso l'ingresso della sala archivi. Una piccola targa sulla porta, testo così fine che devi avvicinarti:

"Sala archivi: solo personale autorizzato.
Ogni partecipante completa gli ultimi passaggi da solo.
Nota: tutti i fascicoli conservati in questo spazio
appartengono a un unico partecipante."

Ti fermi per un secondo.
Un unico partecipante?

Spingi la porta.`,

      ru: `Обе команды прошли этот этаж.

Когда переговоры заканчиваются, женщина останавливается по пути к выходу своей команды и говорит — не останавливаясь, негромко, но ты слышишь каждое слово:

«Вы знаете, почему вы очередная группа, пришедшая сюда?»

Никто не отвечает. Потому что никто не знает.

Её слова остаются в комнате, как камень, тонущий в воде — вниз, вниз, ещё не достигнув дна.

Ты идёшь к входу в архив. На двери маленькая табличка, текст настолько мелкий, что нужно наклониться:

«Архив: только для уполномоченных лиц.
Каждый участник выполняет последние шаги в одиночку.
Внимание: все файлы, хранящиеся в этом пространстве,
принадлежат одному участнику.»

Ты замираешь на секунду.
Одному участнику?

Ты толкаешь дверь.`,

      ja: `両チームともこのフロアを通過した。

交渉が終わると、あの女性が自分のチームの出口に向かう途中で立ち止まり、言った——歩みを止めずに、大きな声ではなく、だがすべての言葉が聞こえた：

「あなたたちがここに来た何番目のグループか、知っていますか？」

誰も答えない。誰も知らないから。

彼女の言葉が部屋に残る。水の中に沈む石のように——下へ、下へ、まだ底に届いていない。

アーカイブ室の入り口に向かう。ドアに小さな銘板があり、文字が細かくて近づかないと読めない：

「アーカイブ室：本人のみ入室可。
各参加者は最終ステップを一人で完了すること。
注：この空間に保管されているすべてのファイルは
一人の参加者のものです。」

一秒、立ち止まる。
一人の参加者？

ドアを押し開ける。`,

      ko: `두 팀 모두 이 층을 통과했다.

협상이 끝나자, 그 여자가 자기 팀의 출구로 향하는 길에 멈춰 서며 말한다 — 멈추지 않고, 크지 않은 목소리로, 하지만 모든 단어가 들린다:

"당신들이 여기에 도착한 몇 번째 그룹인지 알고 있나요?"

아무도 대답하지 않는다. 아무도 모르니까.

그녀의 말이 방에 남아 있다. 물속에 가라앉는 돌처럼 — 아래로, 아래로, 아직 바닥에 닿지 않았다.

기록 보관실 입구로 걸어간다. 문에 작은 명패가 있고, 글씨가 너무 작아 가까이 다가가야 읽을 수 있다:

"기록 보관실: 본인만 입장 가능.
각 참가자는 최종 단계를 혼자 완료합니다.
주의: 이 공간에 보관된 모든 파일은
단일 참가자의 것입니다."

일 초간 멈칫한다.
단일 참가자?

문을 밀고 들어간다.`,
    },
    accentColor: "#A06030",
    bgGradient: "radial-gradient(ellipse at 50% 30%, #1A0E06 0%, #0C0804 100%)",
    sceneImageUrl: "/immersive/scenes/negotiation.webp",
    decorCSS:
      "repeating-linear-gradient(135deg, transparent, transparent 29px, rgba(160,96,48,0.03) 29px, rgba(160,96,48,0.03) 30px)",
  },

  archive: {
    key: "archive",
    index: 6,
    riasec: "C",
    title: {
      zh: "档案室",
      en: "The Final Archive",
      nl: "Het Laatste Archief",
      de: "Das Letzte Archiv",
      fr: "Les Archives Finales",
      es: "El Archivo Final",
      pt: "O Arquivo Final",
      it: "L'Archivio Finale",
      ru: "Последний архив",
      ja: "最終アーカイブ",
      ko: "최종 기록 보관실",
    },
    missionBrief: {
      zh: "让这个档案系统恢复到可以被信赖的状态",
      en: "Restore this archive system to a state that can be trusted",
      nl: "Herstel dit archiefsysteem tot een staat die vertrouwd kan worden",
      de: "Stellen Sie dieses Archivsystem in einen vertrauenswürdigen Zustand wieder her",
      fr: "Restaurer ce système d'archives à un état digne de confiance",
      es: "Restaurar este sistema de archivos a un estado en el que se pueda confiar",
      pt: "Restaurar este sistema de arquivo a um estado confiável",
      it: "Ripristinare questo sistema di archiviazione a uno stato affidabile",
      ru: "Восстановить эту архивную систему до состояния, которому можно доверять",
      ja: "このアーカイブシステムを信頼できる状態に復元する",
      ko: "이 기록 보관 시스템을 신뢰할 수 있는 상태로 복원하기",
    },
    subTasks: [
      {
        zh: "数据结构化",
        en: "Data Structuring",
        nl: "Datastructurering",
        de: "Datenstrukturierung",
        fr: "Structuration des Données",
        es: "Estructuración de Datos",
        pt: "Estruturação de Dados",
        it: "Strutturazione dei Dati",
        ru: "Структурирование данных",
        ja: "データ構造化",
        ko: "데이터 구조화",
      },
      {
        zh: "系统统一",
        en: "System Unification",
        nl: "Systeemunificatie",
        de: "Systemvereinheitlichung",
        fr: "Unification du Système",
        es: "Unificación del Sistema",
        pt: "Unificação do Sistema",
        it: "Unificazione del Sistema",
        ru: "Унификация системы",
        ja: "システム統一",
        ko: "시스템 통합",
      },
      {
        zh: "收发记录",
        en: "Transfer Records",
        nl: "Overdrachtsregistratie",
        de: "Übertragungsprotokolle",
        fr: "Registres de Transfert",
        es: "Registros de Transferencia",
        pt: "Registros de Transferência",
        it: "Registri di Trasferimento",
        ru: "Записи передачи",
        ja: "送受記録",
        ko: "이관 기록",
      },
      {
        zh: "实物盘点",
        en: "Physical Inventory",
        nl: "Fysieke Inventaris",
        de: "Physische Bestandsaufnahme",
        fr: "Inventaire Physique",
        es: "Inventario Físico",
        pt: "Inventário Físico",
        it: "Inventario Fisico",
        ru: "Физическая инвентаризация",
        ja: "実物棚卸",
        ko: "실물 재고 조사",
      },
      {
        zh: "最终归档",
        en: "Final Archival",
        nl: "Definitieve Archivering",
        de: "Endgültige Archivierung",
        fr: "Archivage Final",
        es: "Archivado Final",
        pt: "Arquivamento Final",
        it: "Archiviazione Finale",
        ru: "Финальная архивация",
        ja: "最終保管",
        ko: "최종 보관",
      },
    ],
    entryNarrative: {
      zh: `最后一层，只有你。

不是被遗弃——屏幕上说，这是每个人都要独自完成的部分。

你推开门，走进去。门在身后关上。安静得只剩下你自己的呼吸。

这是一个档案室。和之前所有空间不同：这里的东西是有序的，被认真整理过的，有分类，有标签，有编号，有时间轴。但——不完整。有些架子是空的，有些标签脱落了，有些编号之间有断层。

入口处的桌上，堆着一摞厚厚的纸质档案——手写的、打印的、各种格式混在一起，没有统一的结构。

旁边有一台终端，屏幕上是一个空白的表格软件界面。光标在第一格闪烁着。

屏幕提示：「让这个档案系统恢复到可以被信赖的状态。五个步骤。一个人。」

你深吸一口气，走向那张桌子。`,

      en: `The last floor. Just you.

Not abandoned — the screen says this is the part everyone completes alone.

You push the door open and walk in. It closes behind you. Quiet — nothing but your own breathing.

This is an archive room. Unlike every space before: things here are orderly, carefully organized, with categories, labels, numbers, a timeline. But — incomplete. Some shelves are empty, some labels have fallen off, some numbers have gaps between them.

On the table by the entrance, a thick stack of paper files — handwritten, printed, mixed formats, no unified structure.

Beside it, a terminal. On the screen, a blank spreadsheet interface. The cursor blinks in the first cell.

The screen prompts: "Restore this archive system to a state that can be trusted. Five steps. One person."

You take a deep breath and walk to the table.`,

      nl: `De laatste verdieping. Alleen jij.

Niet verlaten — het scherm zegt dat dit het deel is dat iedereen alleen voltooit.

Je duwt de deur open en loopt naar binnen. Hij sluit achter je. Stil — niets dan je eigen ademhaling.

Dit is een archiefkamer. Anders dan elke ruimte ervoor: dingen hier zijn ordelijk, zorgvuldig georganiseerd, met categorieën, labels, nummers, een tijdlijn. Maar — onvolledig. Sommige planken zijn leeg, sommige labels zijn losgekomen, sommige nummers hebben gaten ertussen.

Op de tafel bij de ingang een dikke stapel papieren dossiers — handgeschreven, geprint, gemengde formaten, geen uniforme structuur.

Ernaast een terminal. Op het scherm een blanco spreadsheet-interface. De cursor knippert in de eerste cel.

Het scherm meldt: "Herstel dit archiefsysteem tot een staat die vertrouwd kan worden. Vijf stappen. Eén persoon."

Je haalt diep adem en loopt naar de tafel.`,

      de: `Die letzte Etage. Nur du.

Nicht verlassen — der Bildschirm sagt, dies ist der Teil, den jeder allein abschließt.

Du drückst die Tür auf und gehst hinein. Sie schließt sich hinter dir. Stille — nichts als dein eigenes Atmen.

Dies ist ein Archivraum. Anders als jeder Raum zuvor: Dinge hier sind ordentlich, sorgfältig organisiert, mit Kategorien, Etiketten, Nummern, einer Zeitachse. Aber — unvollständig. Einige Regale sind leer, einige Etiketten sind abgefallen, zwischen einigen Nummern gibt es Lücken.

Auf dem Tisch am Eingang ein dicker Stapel Papierakten — handgeschrieben, gedruckt, gemischte Formate, keine einheitliche Struktur.

Daneben ein Terminal. Auf dem Bildschirm eine leere Tabellenkalkulationsoberfläche. Der Cursor blinkt in der ersten Zelle.

Der Bildschirm zeigt: „Stellen Sie dieses Archivsystem in einen vertrauenswürdigen Zustand wieder her. Fünf Schritte. Eine Person."

Du holst tief Luft und gehst zum Tisch.`,

      fr: `Le dernier étage. Juste vous.

Pas abandonné — l'écran dit que c'est la partie que chacun effectue seul.

Vous poussez la porte et entrez. Elle se ferme derrière vous. Le silence — rien que votre propre respiration.

C'est une salle d'archives. Contrairement à tous les espaces précédents : les choses ici sont ordonnées, soigneusement organisées, avec des catégories, des étiquettes, des numéros, une chronologie. Mais — incomplètes. Certaines étagères sont vides, certaines étiquettes sont tombées, certains numéros ont des lacunes.

Sur la table près de l'entrée, une épaisse pile de dossiers papier — manuscrits, imprimés, formats mélangés, pas de structure unifiée.

À côté, un terminal. Sur l'écran, une interface de tableur vierge. Le curseur clignote dans la première cellule.

L'écran indique : « Restaurez ce système d'archives à un état digne de confiance. Cinq étapes. Une personne. »

Vous prenez une profonde inspiration et marchez vers la table.`,

      es: `El último piso. Solo tú.

No abandonado — la pantalla dice que esta es la parte que todos completan solos.

Empujas la puerta y entras. Se cierra detrás de ti. Silencio — nada más que tu propia respiración.

Es una sala de archivos. A diferencia de todos los espacios anteriores: las cosas aquí están ordenadas, cuidadosamente organizadas, con categorías, etiquetas, números, una línea temporal. Pero — incompleta. Algunos estantes están vacíos, algunas etiquetas se han caído, algunos números tienen vacíos entre ellos.

En la mesa junto a la entrada, un grueso montón de archivos en papel — escritos a mano, impresos, formatos mezclados, sin estructura unificada.

Al lado, una terminal. En la pantalla, una interfaz de hoja de cálculo en blanco. El cursor parpadea en la primera celda.

La pantalla indica: "Restaura este sistema de archivos a un estado en el que se pueda confiar. Cinco pasos. Una persona."

Tomas un respiro profundo y caminas hacia la mesa.`,

      pt: `O último andar. Apenas você.

Não abandonado — a tela diz que esta é a parte que todos completam sozinhos.

Você empurra a porta e entra. Ela se fecha atrás de você. Silêncio — nada além da sua própria respiração.

Este é uma sala de arquivo. Diferente de todos os espaços anteriores: as coisas aqui estão ordenadas, cuidadosamente organizadas, com categorias, etiquetas, números, uma linha do tempo. Mas — incompleta. Algumas prateleiras estão vazias, algumas etiquetas caíram, alguns números têm lacunas entre eles.

Na mesa junto à entrada, uma grossa pilha de arquivos em papel — manuscritos, impressos, formatos misturados, sem estrutura unificada.

Ao lado, um terminal. Na tela, uma interface de planilha em branco. O cursor pisca na primeira célula.

A tela indica: "Restaure este sistema de arquivo a um estado confiável. Cinco passos. Uma pessoa."

Você respira fundo e caminha até a mesa.`,

      it: `L'ultimo piano. Solo tu.

Non abbandonato — lo schermo dice che questa è la parte che ognuno completa da solo.

Spingi la porta ed entri. Si chiude alle tue spalle. Silenzio — nient'altro che il tuo respiro.

Questa è una sala archivi. Diversa da ogni spazio precedente: le cose qui sono ordinate, organizzate con cura, con categorie, etichette, numeri, una linea temporale. Ma — incompleta. Alcuni scaffali sono vuoti, alcune etichette sono cadute, alcuni numeri hanno lacune tra loro.

Sul tavolo accanto all'ingresso, una spessa pila di fascicoli cartacei — scritti a mano, stampati, formati misti, nessuna struttura uniforme.

Accanto, un terminale. Sullo schermo, un'interfaccia di foglio di calcolo vuota. Il cursore lampeggia nella prima cella.

Lo schermo indica: "Ripristinare questo sistema di archiviazione a uno stato affidabile. Cinque passaggi. Una persona."

Fai un respiro profondo e cammini verso il tavolo.`,

      ru: `Последний этаж. Только ты.

Не брошен — экран говорит, что это часть, которую каждый проходит в одиночку.

Ты толкаешь дверь и входишь. Она закрывается за тобой. Тишина — ничего, кроме твоего собственного дыхания.

Это архивная комната. В отличие от всех предыдущих пространств: здесь всё упорядочено, тщательно организовано, с категориями, ярлыками, номерами, хронологией. Но — неполно. Некоторые полки пусты, некоторые ярлыки отпали, между некоторыми номерами — пробелы.

На столе у входа толстая стопка бумажных файлов — рукописных, печатных, смешанных форматов, без единой структуры.

Рядом терминал. На экране — пустой интерфейс электронной таблицы. Курсор мигает в первой ячейке.

Экран сообщает: «Восстановите эту архивную систему до состояния, которому можно доверять. Пять шагов. Один человек.»

Ты делаешь глубокий вдох и подходишь к столу.`,

      ja: `最後のフロア。あなただけ。

放棄されたのではない——スクリーンには、これは全員が一人で完了する部分だと表示されている。

ドアを押して入る。後ろでドアが閉まる。静寂——自分の呼吸だけ。

ここはアーカイブ室。これまでのすべての空間とは違う：ここにあるものは整然として、丁寧に整理されている。カテゴリー、ラベル、番号、タイムライン。だが——不完全だ。空の棚がある、剥がれたラベルがある、番号の間に空白がある。

入り口のテーブルの上に、分厚い紙のファイルの山——手書き、印刷、様々なフォーマットが混在し、統一された構造はない。

隣にはターミナル。スクリーンには空白のスプレッドシートのインターフェース。カーソルが最初のセルで点滅している。

スクリーンが促す：「このアーカイブシステムを信頼できる状態に復元せよ。五つのステップ。一人で。」

深呼吸をして、テーブルに向かう。`,

      ko: `마지막 층. 당신 혼자다.

버려진 게 아니다 — 화면에는 이것이 모든 사람이 혼자 완료하는 부분이라고 표시되어 있다.

문을 밀고 들어간다. 문이 뒤에서 닫힌다. 고요함 — 자신의 숨소리만 있다.

여기는 기록 보관실이다. 이전의 모든 공간과 다르다: 여기 있는 것들은 정돈되어 있고, 세심하게 조직되어 있다. 분류, 라벨, 번호, 타임라인이 있다. 하지만 — 불완전하다. 빈 선반이 있고, 떨어진 라벨이 있고, 번호 사이에 빈틈이 있다.

입구 옆 테이블 위에 두꺼운 종이 파일 더미가 있다 — 손으로 쓴 것, 인쇄된 것, 다양한 형식이 섞여 있고, 통일된 구조가 없다.

옆에 터미널이 있다. 화면에는 빈 스프레드시트 인터페이스. 커서가 첫 번째 셀에서 깜박이고 있다.

화면이 표시한다: "이 기록 보관 시스템을 신뢰할 수 있는 상태로 복원하십시오. 다섯 단계. 한 사람."

깊이 숨을 쉬고 테이블로 걸어간다.`,
    },
    transitionNarrative: {
      zh: `你把档案放进了归档装置。

装置发出一声轻响。系统确认：所有档案完整。

出口的门开了。你走出去。

走廊应该到这里就结束了。三十关。六个空间。邀请函上说的数字，一个不差。

但走廊没有结束。

尽头出现了一扇你之前没有注意到的门。没有编号。没有标识。门缝透出一种不同于之前所有空间的光——不是工业白光，不是冷蓝光，不是聚光灯。是一种你只在很私人的地方才会见到的光。

你回头看了一眼。六个人，一个都不在了。

Nora 在走之前，把那本一直在写的笔记本放在了地上。翻开的那一页，你瞥了一眼——

她的字迹，和你的字迹，一模一样。

你还没来得及想这是什么意思，门缝的光变亮了一瞬。

像是在催你。`,

      en: `You place the file into the archival device.

A soft chime. System confirms: all archives complete.

The exit door opens. You walk out.

The corridor should end here. Thirty rounds. Six spaces. The exact number on the invitation.

But the corridor doesn't end.

At the far end, a door you hadn't noticed before. No number. No label. Light bleeds through the gap — not the industrial white of the machine room, not the cold blue of the lab, not the spotlight of the theater. A light you only see in private places.

You glance back. All six companions — gone.

Nora, before leaving, set her notebook on the floor. The open page — you catch a glimpse.

Her handwriting is identical to yours.

Before you can think about what that means, the light through the door brightens for a moment.

As if it's urging you forward.`,

      nl: `Je plaatst het dossier in het archiveringsapparaat.

Een zachte toon. Systeem bevestigt: alle archieven compleet.

De uitgangsdeur gaat open.

Aan de andere kant is een kleine kamer, leeg op één ding na — een spiegel. Van vloer tot plafond, groot genoeg om je helemaal te weerspiegelen.

Dan merk je op, in de linkerbenedenhoek van de spiegel, enkele regels tekst, alsof met de hand geschreven:

"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."

Naast de woorden, een zegel. Identiek aan het zegel op de uitnodigingsbrief.`,

      de: `Du legst die Akte in das Archivierungsgerät.

Ein sanfter Klang. System bestätigt: Alle Archive vollständig.

Die Ausgangstür öffnet sich.

Auf der anderen Seite ist ein kleiner Raum, leer bis auf eines — ein Spiegel. Vom Boden bis zur Decke, groß genug, um dich ganz zu spiegeln.

Dann bemerkst du, in der unteren linken Ecke des Spiegels, einige Zeilen Text, wie handgeschrieben:

„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."

Neben den Worten ein Siegel. Identisch mit dem auf dem Einladungsschreiben.`,

      fr: `Vous placez le dossier dans le dispositif d'archivage.

Un carillon doux. Le système confirme : toutes les archives sont complètes.

La porte de sortie s'ouvre.

De l'autre côté, une petite pièce, vide sauf une chose — un miroir. Du sol au plafond, assez grand pour vous refléter entièrement.

Puis vous remarquez, dans le coin inférieur gauche du miroir, quelques lignes de texte, comme écrites à la main :

« Vous avez choisi tout du long. Pas entre le bien et le mal. Entre vous et vous-même. »

À côté des mots, un sceau. Identique à celui de la lettre d'invitation.`,

      es: `Colocas el archivo en el dispositivo de archivado.

Un suave tintineo. El sistema confirma: todos los archivos completos.

La puerta de salida se abre.

Al otro lado hay una pequeña habitación, vacía excepto por una cosa — un espejo. Del suelo al techo, lo suficientemente grande como para reflejarte por completo.

Entonces notas, en la esquina inferior izquierda del espejo, unas líneas de texto, como escritas a mano:

"Has estado eligiendo todo el tiempo. No entre lo correcto y lo incorrecto. Entre tú y tú mismo."

Junto a las palabras, un sello. Idéntico al de la carta de invitación.`,

      pt: `Você coloca o arquivo no dispositivo de arquivamento.

Um toque suave. Sistema confirma: todos os arquivos completos.

A porta de saída se abre.

Do outro lado há uma pequena sala, vazia exceto por uma coisa — um espelho. Do chão ao teto, grande o suficiente para refletir você inteiro.

Então você nota, no canto inferior esquerdo do espelho, algumas linhas de texto, como se escritas à mão:

"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."

Ao lado das palavras, um selo. Idêntico ao da carta de convite.`,

      it: `Inserisci il fascicolo nel dispositivo di archiviazione.

Un suono delicato. Il sistema conferma: tutti gli archivi completi.

La porta d'uscita si apre.

Dall'altra parte c'è una piccola stanza, vuota tranne per una cosa — uno specchio. Dal pavimento al soffitto, abbastanza grande da riflettere tutto di te.

Poi noti, nell'angolo in basso a sinistra dello specchio, alcune righe di testo, come scritte a mano:

"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."

Accanto alle parole, un sigillo. Identico a quello sulla lettera di invito.`,

      ru: `Ты помещаешь файл в архивное устройство.

Мягкий звон. Система подтверждает: все архивы укомплектованы.

Дверь к выходу открывается.

По другую сторону — маленькая комната, пустая, кроме одного — зеркала. От пола до потолка, достаточно большого, чтобы отразить тебя целиком.

Затем ты замечаешь, в нижнем левом углу зеркала, несколько строк текста, будто написанных от руки:

«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и самим собой.»

Рядом со словами — печать. Идентичная той, что на пригласительном письме.`,

      ja: `ファイルをアーカイブ装置に入れる。

柔らかなチャイム音。システムが確認する：すべてのアーカイブ完了。

出口の扉が開く。

その向こうは小さな部屋で、一つのものを除いて何もない——鏡だ。床から天井まで、あなたの全身を映すのに十分な大きさ。

そして気づく。鏡の左下隅に、手書きのような数行の文字：

「ずっと選んでいた。正しいか間違いかではなく。あなた自身と、あなた自身の間で。」

文字の隣に、印章。招待状のものと、まったく同じ。`,

      ko: `파일을 보관 장치에 넣는다.

부드러운 차임 소리. 시스템이 확인한다: 모든 기록 보관 완료.

출구 문이 열린다.

반대편에는 작은 방이 있고, 한 가지를 제외하면 비어 있다 — 거울. 바닥에서 천장까지, 당신의 전신을 비추기에 충분한 크기.

그리고 거울의 왼쪽 하단 구석에, 손으로 쓴 듯한 몇 줄의 글씨를 발견한다:

"계속 선택해 왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."

글씨 옆에 도장 하나. 초대장에 있던 것과 똑같다.`,
    },
    accentColor: "#706050",
    bgGradient: "radial-gradient(ellipse at 50% 50%, #141008 0%, #0A0806 100%)",
    sceneImageUrl: "/immersive/scenes/archive.webp",
    decorCSS:
      "repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(112,96,80,0.035) 23px, rgba(112,96,80,0.035) 24px)",
  },

  // ── Chapter 7: 零号房间 The Zero Room (TwIVI Values) ────────
  values: {
    key: "values",
    index: 7,
    title: {
      zh: "零号房间",
      en: "The Zero Room",
    },
    missionBrief: {
      zh: "最终考验——面对八面镜子",
      en: "The final test — face the eight mirrors",
    },
    subTasks: [
      { zh: "近处 · 一", en: "The Near · I" },
      { zh: "近处 · 二", en: "The Near · II" },
      { zh: "远方 · 一", en: "The Far · I" },
      { zh: "远方 · 二", en: "The Far · II" },
      { zh: "攀升 · 一", en: "The Ascent · I" },
      { zh: "攀升 · 二", en: "The Ascent · II" },
      { zh: "权座 · 一", en: "The Throne · I" },
      { zh: "权座 · 二", en: "The Throne · II" },
    ],
    entryNarrative: {
      zh: `你推开门。

房间很空。没有工作台，没有试管，没有舞台，没有椅子，没有谈判桌，没有档案架。正中央，八面落地镜围成一个半圆。全部是暗的。

然后你看到了她。

就是那个人。从第三章开始就存在的那个女人——在剧场里始终背对着所有人的人。在谈判层你只看见过侧脸的人。在等候室角落贴了一张你读不懂的便条的人。

她站在八面镜子的中央。面朝你。

第一次，面朝你。

她开口了。声音比你想象中更近。

「三十关你都走过了。我知道你被什么吸引，知道你在哪里会伸出手，在哪里会退后。

但我还不知道你最终会成为什么样的人。

这取决于你看重什么。

八面镜子。每面映出一种可能的你。我需要你看清楚每一面，然后告诉我——那个人像你吗。

诚实回答。因为你的答案，会决定我是谁。」`,

      en: `You push the door open.

The room is empty. No workbench, no test tubes, no stage, no chairs, no negotiation table, no filing cabinets. In the center, eight floor-length mirrors form a semicircle. All of them dark.

Then you see her.

The woman who has existed since the third floor. The one who kept her back to everyone in the theater. The one whose face you only glimpsed from the side in the negotiation room. The one who left a note in the corner of the waiting room that you couldn't understand.

She stands at the center of the eight mirrors. Facing you.

For the first time, facing you.

She speaks. Her voice is closer than you expected.

"You've walked through all thirty rounds. I know what draws you, where you'd step forward, where you'd step back.

But I still don't know who you'll become.

That depends on what you value.

Eight mirrors. Each one shows a possible version of you. I need you to look at each one carefully and tell me — does that person resemble you?

Answer honestly. Because your answer determines who I am."`,
    },
    transitionNarrative: {
      zh: `最后一面镜子暗了。八面镜子全部黑下来。房间重新变得空旷。

她看着你。没有说话。很久。

安静到你能听见自己的呼吸。`,
      en: `The last mirror goes dark. All eight mirrors black out. The room empties again.

She looks at you. Says nothing. For a long time.

Quiet enough that you can hear your own breathing.`,
    },
    accentColor: "#2A2A2A",
    bgGradient: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
    sceneImageUrl: "/immersive/scenes/zeroroom.webp",
  },
};
