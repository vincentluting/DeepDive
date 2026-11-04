// ════════════════════════════════════════════════════════════
// 第二章：研究空间（I型 Q6-Q10）
// 大任务：完成一个被中断的研究项目
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER2_QUESTIONS: ImmersiveQuestion[] = [
  // ── Q6: Conduct chemical experiments ───────────────────────
  {
    id: 6,
    riasec: "I",
    miniIpCode: "I3",
    miniIpItem: "Conduct chemical experiments",
    chapter: "laboratory",
    chapterIndex: 2,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `研究空间的左侧是实验区：化学实验台、试剂架、通风橱、量筒烧杯整齐排列——但不是新的，上面有使用过的痕迹。

Mia 第一个走过去。她拿起一本实验笔记翻了翻：「上一批人做了一组实验，数据记录了，但最后几组的结果标注了问号。他们不确定自己做的对不对。」

屏幕显示：「研究阶段一：实验验证。上一批参与者的结论需被重新验证。按实验方案重做关键步骤，记录结果，与原始数据对比。」

实验台上摆好了试剂和器材，实验方案在笔记本第12页。需要有人按步骤——称量、混合、加热、观察、记录——完整做一遍化学实验，确认之前的结果是否可靠。

Mia 已经戴上了护目镜。`,

      en: `The left side of the research space is the experimental area: chemistry bench, reagent rack, fume hood, graduated cylinders and beakers neatly arranged — but not new. Everything shows traces of use.

Mia walks over first. She picks up a lab notebook and flips through it: "The last group ran a set of experiments. Data was recorded, but the final few results are marked with question marks. They weren't sure if they got it right."

The screen reads: "Research Phase One: Experimental Verification. The previous group's conclusions require re-verification. Repeat the critical steps per the protocol, record results, compare with original data."

Reagents and equipment are set up on the bench. The protocol is on page 12 of the notebook. Someone needs to follow the steps — weigh, mix, heat, observe, record — and run the full experiment to confirm whether the previous results are reliable.

Mia has already put on her goggles.`,

      nl: `De linkerzijde van de onderzoeksruimte is het experimenteergebied: chemische werktafel, reagensrek, zuurkast, maatcilinders en bekers netjes opgesteld — maar niet nieuw. Alles vertoont sporen van gebruik.

Mia is de eerste die erheen loopt. Ze pakt een laboratoriumlogboek en bladert erdoorheen: "De vorige groep heeft een reeks experimenten uitgevoerd. De gegevens zijn vastgelegd, maar de laatste resultaten zijn gemarkeerd met vraagtekens. Ze wisten niet zeker of ze het goed hadden gedaan."

Het scherm leest: "Onderzoeksfase één: Experimentele verificatie. De conclusies van de vorige groep moeten opnieuw worden geverifieerd. Herhaal de kritische stappen volgens het protocol, noteer de resultaten en vergelijk met de oorspronkelijke gegevens."

Reagentia en apparatuur staan klaar op de werktafel. Het experimentele protocol staat op pagina 12 van het logboek. Iemand moet de stappen volgen — wegen, mengen, verhitten, observeren, noteren — en het volledige experiment uitvoeren om te bevestigen of de eerdere resultaten betrouwbaar zijn.

Mia heeft haar veiligheidsbril al opgezet.`,

      de: `Die linke Seite des Forschungsraums ist der Experimentierbereich: Chemielabortisch, Reagenzienregal, Abzugshaube, Messzylinder und Bechergläser ordentlich aufgereiht — aber nicht neu. Alles zeigt Gebrauchsspuren.

Mia ist die Erste, die hinübergeht. Sie nimmt ein Labornotizbuch und blättert es durch: „Die letzte Gruppe hat eine Reihe von Experimenten durchgeführt. Die Daten wurden festgehalten, aber die letzten Ergebnisse sind mit Fragezeichen markiert. Sie waren sich nicht sicher, ob sie es richtig gemacht hatten."

Auf dem Bildschirm steht: „Forschungsphase Eins: Experimentelle Verifizierung. Die Schlussfolgerungen der vorherigen Gruppe müssen erneut überprüft werden. Wiederholen Sie die kritischen Schritte gemäß dem Protokoll, notieren Sie die Ergebnisse und vergleichen Sie sie mit den Originaldaten."

Reagenzien und Ausrüstung stehen auf dem Labortisch bereit. Das Experimentierprotokoll befindet sich auf Seite 12 des Notizbuchs. Jemand muss die Schritte befolgen — wiegen, mischen, erhitzen, beobachten, protokollieren — und das vollständige Experiment durchführen, um zu bestätigen, ob die früheren Ergebnisse zuverlässig sind.

Mia hat ihre Schutzbrille bereits aufgesetzt.`,

      fr: `Le côté gauche de l'espace de recherche est la zone expérimentale : paillasse de chimie, étagère à réactifs, hotte aspirante, éprouvettes graduées et béchers soigneusement alignés — mais pas neufs. Tout porte des traces d'utilisation.

Mia est la première à s'y rendre. Elle prend un cahier de laboratoire et le feuillette : « Le groupe précédent a mené une série d'expériences. Les données ont été enregistrées, mais les derniers résultats sont marqués de points d'interrogation. Ils n'étaient pas sûrs d'avoir fait juste. »

L'écran affiche : « Phase de recherche un : Vérification expérimentale. Les conclusions du groupe précédent doivent être revérifiées. Répétez les étapes critiques selon le protocole, notez les résultats et comparez-les aux données d'origine. »

Les réactifs et l'équipement sont prêts sur la paillasse. Le protocole expérimental se trouve à la page 12 du cahier. Quelqu'un doit suivre les étapes — peser, mélanger, chauffer, observer, noter — et réaliser l'expérience complète pour confirmer si les résultats précédents sont fiables.

Mia a déjà mis ses lunettes de protection.`,

      es: `El lado izquierdo del espacio de investigación es el área experimental: mesa de química, estante de reactivos, campana extractora, probetas y vasos de precipitados ordenados — pero no nuevos. Todo muestra huellas de uso.

Mia es la primera en acercarse. Toma un cuaderno de laboratorio y lo hojea: "El grupo anterior realizó una serie de experimentos. Los datos se registraron, pero los últimos resultados están marcados con signos de interrogación. No estaban seguros de si lo habían hecho bien."

La pantalla dice: "Fase de investigación uno: Verificación experimental. Las conclusiones del grupo anterior necesitan ser reverificadas. Repita los pasos críticos según el protocolo, registre los resultados y compárelos con los datos originales."

Los reactivos y el equipo están dispuestos en la mesa. El protocolo experimental está en la página 12 del cuaderno. Alguien necesita seguir los pasos — pesar, mezclar, calentar, observar, registrar — y realizar el experimento completo para confirmar si los resultados anteriores son fiables.

Mia ya se ha puesto las gafas protectoras.`,

      pt: `O lado esquerdo do espaço de pesquisa é a área experimental: bancada de química, estante de reagentes, capela de exaustão, provetas e béqueres organizados — mas não novos. Tudo mostra marcas de uso.

Mia é a primeira a se aproximar. Ela pega um caderno de laboratório e o folheia: "O grupo anterior realizou uma série de experimentos. Os dados foram registrados, mas os últimos resultados estão marcados com pontos de interrogação. Eles não tinham certeza se acertaram."

A tela exibe: "Fase de pesquisa um: Verificação experimental. As conclusões do grupo anterior precisam ser reverificadas. Repita as etapas críticas de acordo com o protocolo, registre os resultados e compare com os dados originais."

Reagentes e equipamentos estão dispostos na bancada. O protocolo experimental está na página 12 do caderno. Alguém precisa seguir os passos — pesar, misturar, aquecer, observar, registrar — e conduzir o experimento completo para confirmar se os resultados anteriores são confiáveis.

Mia já colocou seus óculos de proteção.`,

      it: `Il lato sinistro dello spazio di ricerca è l'area sperimentale: banco di chimica, scaffale dei reagenti, cappa aspirante, cilindri graduati e becher ordinatamente disposti — ma non nuovi. Tutto mostra tracce d'uso.

Mia è la prima ad avvicinarsi. Prende un quaderno di laboratorio e lo sfoglia: "Il gruppo precedente ha condotto una serie di esperimenti. I dati sono stati registrati, ma gli ultimi risultati sono contrassegnati con punti interrogativi. Non erano sicuri di aver fatto giusto."

Lo schermo riporta: "Fase di ricerca uno: Verifica sperimentale. Le conclusioni del gruppo precedente devono essere riverificate. Ripetere i passaggi critici secondo il protocollo, registrare i risultati e confrontarli con i dati originali."

Reagenti e attrezzature sono pronti sul banco. Il protocollo sperimentale è a pagina 12 del quaderno. Qualcuno deve seguire i passaggi — pesare, miscelare, riscaldare, osservare, registrare — ed eseguire l'intero esperimento per confermare se i risultati precedenti sono affidabili.

Mia ha già indossato gli occhiali protettivi.`,

      ru: `Левая часть исследовательского пространства — экспериментальная зона: химический стол, стеллаж с реактивами, вытяжной шкаф, мерные цилиндры и стаканы аккуратно расставлены — но не новые. На всём следы использования.

Мия первой подходит. Она берёт лабораторный журнал и листает: «Прошлая группа провела серию экспериментов. Данные записаны, но последние результаты отмечены вопросительными знаками. Они не были уверены, что сделали правильно.»

На экране: «Фаза исследования первая: Экспериментальная верификация. Выводы предыдущей группы требуют повторной проверки. Повторите ключевые этапы по протоколу, запишите результаты и сравните с исходными данными.»

Реактивы и оборудование разложены на столе. Протокол эксперимента — на странице 12 журнала. Кому-то нужно следовать шагам — взвесить, смешать, нагреть, наблюдать, записать — и провести полный эксперимент, чтобы подтвердить, надёжны ли предыдущие результаты.

Мия уже надела защитные очки.`,

      ja: `研究空間の左側は実験エリアだ。化学実験台、試薬棚、ドラフトチャンバー、メスシリンダーとビーカーがきちんと並んでいる——ただし新品ではない。すべてに使用の痕跡がある。

ミアが最初に歩み寄る。実験ノートを手に取り、めくっていく。「前のグループが一連の実験を行ったわ。データは記録されているけど、最後のいくつかの結果に疑問符がついている。正しくできたか確信がなかったみたい。」

スクリーンに表示される：「研究フェーズ1：実験的検証。前グループの結論は再検証が必要です。プロトコルに従って重要なステップを繰り返し、結果を記録し、元のデータと比較してください。」

試薬と器具は実験台に準備されている。実験プロトコルはノートの12ページにある。誰かが手順に従う必要がある——計量、混合、加熱、観察、記録——そして実験を完全に行い、以前の結果が信頼できるかどうかを確認する。

ミアはもう保護メガネをかけている。`,

      ko: `연구 공간의 왼쪽은 실험 구역이다: 화학 실험대, 시약 선반, 흄후드, 메스실린더와 비커가 정돈되어 있다 — 하지만 새것은 아니다. 모든 것에 사용 흔적이 있다.

미아가 가장 먼저 다가간다. 실험 노트를 집어 들고 넘긴다: "이전 그룹이 일련의 실험을 수행했어. 데이터는 기록되어 있지만, 마지막 몇 개 결과에 물음표가 표시되어 있어. 제대로 했는지 확신이 없었나 봐."

화면에 표시된다: "연구 1단계: 실험적 검증. 이전 그룹의 결론은 재검증이 필요합니다. 프로토콜에 따라 핵심 단계를 반복하고, 결과를 기록하고, 원본 데이터와 비교하십시오."

시약과 장비가 실험대 위에 준비되어 있다. 실험 프로토콜은 노트 12페이지에 있다. 누군가가 단계를 따라야 한다 — 계량, 혼합, 가열, 관찰, 기록 — 그리고 전체 실험을 수행하여 이전 결과가 신뢰할 수 있는지 확인해야 한다.

미아는 이미 보호 안경을 쓰고 있다.`,
    },
    taskDescription: {
      zh: "按照实验方案进行一组化学实验——称量试剂、操作仪器、观察反应、记录结果。这项任务需要一个主要负责人。",

      en: `Follow the experimental protocol to conduct a set of chemical experiments — weigh reagents, operate instruments, observe reactions, record results. This task needs one primary person.`,

      nl: "Volg het experimentele protocol om een reeks chemische experimenten uit te voeren — weeg reagentia, bedien instrumenten, observeer reacties, noteer resultaten. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Führen Sie gemäß dem Experimentierprotokoll eine Reihe chemischer Experimente durch — Reagenzien wiegen, Instrumente bedienen, Reaktionen beobachten, Ergebnisse protokollieren. Diese Aufgabe braucht eine hauptverantwortliche Person.",

      fr: "Suivez le protocole expérimental pour mener une série d'expériences chimiques — peser les réactifs, manipuler les instruments, observer les réactions, noter les résultats. Cette tâche nécessite un responsable principal.",

      es: "Siga el protocolo experimental para realizar una serie de experimentos químicos — pesar reactivos, operar instrumentos, observar reacciones, registrar resultados. Esta tarea necesita una persona responsable principal.",

      pt: "Siga o protocolo experimental para conduzir uma série de experimentos químicos — pesar reagentes, operar instrumentos, observar reações, registrar resultados. Esta tarefa precisa de uma pessoa principal responsável.",

      it: "Seguite il protocollo sperimentale per condurre una serie di esperimenti chimici — pesare reagenti, operare strumenti, osservare reazioni, registrare risultati. Questo compito richiede un responsabile principale.",

      ru: "Следуйте протоколу эксперимента для проведения серии химических опытов — взвесить реактивы, работать с приборами, наблюдать реакции, записывать результаты. Для этой задачи нужен один главный ответственный.",

      ja: "実験プロトコルに従い、一連の化学実験を行う——試薬を計量し、器具を操作し、反応を観察し、結果を記録する。この作業には主担当者が一人必要です。",

      ko: "실험 프로토콜에 따라 일련의 화학 실험을 수행한다 — 시약 계량, 기구 조작, 반응 관찰, 결과 기록. 이 작업에는 주 담당자 한 명이 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你戴上护目镜的速度和 Mia 差不多。

实验方案翻开在第12页，步骤是清晰的。但你知道真正的挑战不在步骤本身——而在于每一步的细微观察：溶液的颜色变化是否和记录一致，温度曲线是否偏移，反应速率有没有异常。

你拿起了量筒。称量的时候，手很稳。

Mia 在你旁边，做的是另一组实验。你们没有交谈，但你知道她在做什么，她也知道你在做什么。两组独立验证，比一组更可靠。`,

        en: `You put on your goggles almost as fast as Mia.

The protocol is open to page 12, steps clear. But you know the real challenge isn't the steps themselves — it's the subtle observation at every stage: whether the solution's color change matches the records, whether the temperature curve drifts, whether the reaction rate shows anomalies.

You pick up the graduated cylinder. Your hand is steady as you measure.

Mia is beside you, running a different set. You don't speak, but you know what she's doing, and she knows what you're doing. Two independent verifications are more reliable than one.`,

        nl: `Je zet je veiligheidsbril bijna net zo snel op als Mia.

Het protocol staat open op pagina 12, de stappen zijn duidelijk. Maar je weet dat de echte uitdaging niet in de stappen zelf zit — het zit in de subtiele observatie bij elke fase: of de kleurverandering van de oplossing overeenkomt met de gegevens, of de temperatuurcurve afwijkt, of de reactiesnelheid afwijkingen vertoont.

Je pakt de maatcilinder. Je hand is vast bij het meten.

Mia zit naast je, bezig met een andere reeks. Jullie spreken niet, maar je weet wat zij doet, en zij weet wat jij doet. Twee onafhankelijke verificaties zijn betrouwbaarder dan één.`,

        de: `Du setzt deine Schutzbrille fast so schnell auf wie Mia.

Das Protokoll liegt aufgeschlagen auf Seite 12, die Schritte sind klar. Aber du weißt, dass die eigentliche Herausforderung nicht in den Schritten selbst liegt — sondern in der subtilen Beobachtung bei jedem Stadium: ob die Farbveränderung der Lösung mit den Aufzeichnungen übereinstimmt, ob die Temperaturkurve abweicht, ob die Reaktionsgeschwindigkeit Anomalien zeigt.

Du nimmst den Messzylinder. Deine Hand ist ruhig beim Abmessen.

Mia sitzt neben dir und führt eine andere Reihe durch. Ihr sprecht nicht, aber du weißt, was sie tut, und sie weiß, was du tust. Zwei unabhängige Verifizierungen sind zuverlässiger als eine.`,

        fr: `Tu enfiles tes lunettes de protection presque aussi vite que Mia.

Le protocole est ouvert à la page 12, les étapes sont claires. Mais tu sais que le véritable défi ne réside pas dans les étapes elles-mêmes — c'est dans l'observation subtile à chaque stade : la couleur de la solution change-t-elle comme prévu, la courbe de température dérive-t-elle, la vitesse de réaction montre-t-elle des anomalies.

Tu saisis l'éprouvette graduée. Ta main est stable pendant que tu mesures.

Mia est à côté de toi, travaillant sur une autre série. Vous ne parlez pas, mais tu sais ce qu'elle fait, et elle sait ce que tu fais. Deux vérifications indépendantes sont plus fiables qu'une seule.`,

        es: `Te pones las gafas protectoras casi tan rápido como Mia.

El protocolo está abierto en la página 12, los pasos son claros. Pero sabes que el verdadero desafío no está en los pasos mismos — está en la observación sutil en cada etapa: si el cambio de color de la solución coincide con los registros, si la curva de temperatura se desvía, si la velocidad de reacción muestra anomalías.

Tomas la probeta graduada. Tu mano está firme al medir.

Mia está a tu lado, ejecutando una serie diferente. No hablan, pero sabes lo que ella hace, y ella sabe lo que tú haces. Dos verificaciones independientes son más fiables que una.`,

        pt: `Você coloca seus óculos de proteção quase tão rápido quanto Mia.

O protocolo está aberto na página 12, os passos são claros. Mas você sabe que o verdadeiro desafio não está nos passos em si — está na observação sutil em cada etapa: se a mudança de cor da solução corresponde aos registros, se a curva de temperatura desvia, se a taxa de reação mostra anomalias.

Você pega a proveta. Sua mão está firme ao medir.

Mia está ao seu lado, conduzindo uma série diferente. Vocês não falam, mas você sabe o que ela está fazendo, e ela sabe o que você está fazendo. Duas verificações independentes são mais confiáveis do que uma.`,

        it: `Indossi gli occhiali protettivi quasi alla stessa velocità di Mia.

Il protocollo è aperto a pagina 12, i passaggi sono chiari. Ma sai che la vera sfida non sta nei passaggi stessi — sta nell'osservazione sottile a ogni fase: se il cambiamento di colore della soluzione corrisponde ai registri, se la curva di temperatura devia, se la velocità di reazione mostra anomalie.

Prendi il cilindro graduato. La tua mano è ferma mentre misuri.

Mia è accanto a te, lavorando su una serie diversa. Non parlate, ma sai cosa sta facendo lei, e lei sa cosa stai facendo tu. Due verifiche indipendenti sono più affidabili di una.`,

        ru: `Ты надеваешь защитные очки почти так же быстро, как Мия.

Протокол открыт на странице 12, шаги понятны. Но ты знаешь, что настоящий вызов не в самих шагах — а в тонком наблюдении на каждом этапе: совпадает ли изменение цвета раствора с записями, отклоняется ли температурная кривая, есть ли аномалии в скорости реакции.

Ты берёшь мерный цилиндр. Рука при измерении не дрожит.

Мия рядом, проводит другую серию. Вы не разговариваете, но ты знаешь, что она делает, и она знает, что делаешь ты. Две независимые проверки надёжнее одной.`,

        ja: `ミアとほぼ同じ速さで保護メガネをかける。

プロトコルは12ページに開かれ、手順は明確だ。しかし本当の挑戦は手順そのものではないことを知っている——各段階での繊細な観察にある：溶液の色の変化が記録と一致するか、温度曲線がずれていないか、反応速度に異常がないか。

メスシリンダーを手に取る。計量する手は安定している。

ミアは隣で別のセットを実施している。言葉は交わさないが、彼女が何をしているかは分かっているし、彼女もあなたが何をしているか分かっている。二つの独立した検証は、一つより信頼性が高い。`,

        ko: `미아만큼이나 빠르게 보호 안경을 쓴다.

프로토콜은 12페이지에 펼쳐져 있고, 단계는 명확하다. 하지만 진짜 도전은 단계 자체가 아니라는 걸 안다 — 매 단계마다의 섬세한 관찰에 있다: 용액의 색 변화가 기록과 일치하는지, 온도 곡선이 벗어나는지, 반응 속도에 이상이 있는지.

메스실린더를 집어 든다. 계량하는 손이 흔들리지 않는다.

미아가 옆에서 다른 세트를 진행하고 있다. 대화는 없지만, 그녀가 무엇을 하는지 알고, 그녀도 당신이 무엇을 하는지 안다. 두 개의 독립적인 검증이 하나보다 더 신뢰할 수 있다.`,
      },
      score4: {
        zh: `你走到实验台前，翻开了笔记本。

步骤一、步骤二……逻辑是清楚的。化学实验这件事，你不排斥——称量、混合、等待、观察。有一种按部就班的踏实感。

你拿起了试剂瓶，开始按照配方称量。第一步完成了，你在记录本上写下了数据。

Mia 看了你一眼，点了点头。你们继续各自的工作。`,

        en: `You walk to the bench and open the notebook.

Step one, step two... the logic is clear. Chemistry experiments — you don't mind. Weighing, mixing, waiting, observing. There's a steady, methodical comfort to it.

You pick up the reagent bottle and start measuring according to the formula. First step done. You write the data in the record book.

Mia glances at you and nods. You both continue your work.`,

        nl: `Je loopt naar de werktafel en opent het notitieboek.

Stap één, stap twee... de logica is duidelijk. Chemische experimenten — je hebt er niets op tegen. Wegen, mengen, wachten, observeren. Er zit een gestage, methodische geruststelling in.

Je pakt de reagensfles en begint te meten volgens de formule. Eerste stap klaar. Je schrijft de gegevens in het logboek.

Mia werpt een blik op je en knikt. Jullie gaan beiden verder met je werk.`,

        de: `Du gehst zum Labortisch und öffnest das Notizbuch.

Schritt eins, Schritt zwei... die Logik ist klar. Chemische Experimente — du hast nichts dagegen. Wiegen, mischen, warten, beobachten. Es hat eine stetige, methodische Behaglichkeit.

Du nimmst die Reagenzflasche und beginnst nach der Formel abzumessen. Erster Schritt erledigt. Du schreibst die Daten ins Protokollbuch.

Mia wirft dir einen Blick zu und nickt. Ihr arbeitet beide weiter.`,

        fr: `Tu t'approches de la paillasse et ouvres le cahier.

Étape un, étape deux... la logique est claire. Les expériences chimiques — tu n'es pas contre. Peser, mélanger, attendre, observer. Il y a un confort méthodique et régulier.

Tu prends la bouteille de réactif et commences à mesurer selon la formule. Première étape terminée. Tu notes les données dans le cahier de suivi.

Mia te jette un regard et hoche la tête. Vous continuez chacun votre travail.`,

        es: `Caminas hacia la mesa y abres el cuaderno.

Paso uno, paso dos... la lógica es clara. Experimentos químicos — no te molestan. Pesar, mezclar, esperar, observar. Hay una comodidad metódica y constante.

Tomas el frasco de reactivo y empiezas a medir según la fórmula. Primer paso completado. Escribes los datos en el libro de registro.

Mia te echa un vistazo y asiente. Ambos continúan con su trabajo.`,

        pt: `Você vai até a bancada e abre o caderno.

Passo um, passo dois... a lógica é clara. Experimentos químicos — você não se importa. Pesar, misturar, esperar, observar. Há um conforto metódico e constante nisso.

Você pega o frasco de reagente e começa a medir de acordo com a fórmula. Primeiro passo concluído. Você anota os dados no livro de registro.

Mia olha para você e acena. Ambos continuam seus trabalhos.`,

        it: `Ti avvicini al banco e apri il quaderno.

Primo passaggio, secondo passaggio... la logica è chiara. Esperimenti chimici — non ti dispiacciono. Pesare, miscelare, attendere, osservare. C'è un comfort metodico e costante.

Prendi la bottiglia di reagente e inizi a misurare secondo la formula. Primo passaggio completato. Annoti i dati nel libro dei registri.

Mia ti guarda e annuisce. Entrambi continuate il vostro lavoro.`,

        ru: `Ты подходишь к столу и открываешь тетрадь.

Шаг первый, шаг второй... логика ясна. Химические эксперименты — ты не против. Взвесить, смешать, подождать, наблюдать. В этом есть методичное, размеренное спокойствие.

Берёшь бутылку с реактивом и начинаешь отмерять по формуле. Первый шаг готов. Записываешь данные в журнал.

Мия бросает на тебя взгляд и кивает. Вы оба продолжаете работу.`,

        ja: `実験台に向かい、ノートを開く。

ステップ1、ステップ2……ロジックは明確だ。化学実験——嫌ではない。計量、混合、待機、観察。着実で体系的な安心感がある。

試薬瓶を手に取り、処方に従って計量を始める。第一ステップ完了。記録帳にデータを書き込む。

ミアがちらりとこちらを見て、うなずく。二人とも作業を続ける。`,

        ko: `실험대로 걸어가 노트를 펼친다.

1단계, 2단계... 논리는 명확하다. 화학 실험 — 싫지 않다. 계량, 혼합, 대기, 관찰. 꾸준하고 체계적인 안정감이 있다.

시약병을 들고 공식에 따라 계량을 시작한다. 첫 번째 단계 완료. 기록장에 데이터를 적는다.

미아가 한 번 쳐다보고 고개를 끄덕인다. 둘 다 각자의 작업을 계속한다.`,
      },
      score3: {
        zh: `你看了看实验台上的那些器材。

化学实验——称量、混合、观察、记录。你能做。但要说有多大热情……你环顾了一下研究空间的其他区域。右边的数据分析区看起来也有东西等着做。

你站在实验台前，还没有动手。也许先看看其他任务是什么再说。`,

        en: `You look at the equipment on the bench.

Chemical experiments — weighing, mixing, observing, recording. You could do it. But as for enthusiasm... you look around the rest of the research space. The data analysis area on the right also seems to have things waiting.

You stand at the bench, not yet starting. Maybe see what the other tasks are first.`,

        nl: `Je kijkt naar de apparatuur op de werktafel.

Chemische experimenten — wegen, mengen, observeren, noteren. Je zou het kunnen. Maar qua enthousiasme... je kijkt rond in de rest van de onderzoeksruimte. Het data-analysegebied aan de rechterkant lijkt ook dingen te hebben die wachten.

Je staat bij de werktafel, nog niet begonnen. Misschien eerst kijken wat de andere taken zijn.`,

        de: `Du schaust dir die Ausrüstung auf dem Labortisch an.

Chemische Experimente — wiegen, mischen, beobachten, protokollieren. Du könntest es. Aber was Begeisterung angeht... du schaust dich im Rest des Forschungsraums um. Der Datenanalysebereich auf der rechten Seite scheint auch Aufgaben bereitzuhalten.

Du stehst am Labortisch, hast aber noch nicht angefangen. Vielleicht erst mal sehen, was die anderen Aufgaben sind.`,

        fr: `Tu regardes l'équipement sur la paillasse.

Expériences chimiques — peser, mélanger, observer, noter. Tu pourrais le faire. Mais quant à l'enthousiasme... tu regardes autour dans le reste de l'espace de recherche. La zone d'analyse de données à droite semble aussi avoir des choses en attente.

Tu te tiens devant la paillasse, sans avoir encore commencé. Peut-être voir d'abord quelles sont les autres tâches.`,

        es: `Miras el equipo sobre la mesa.

Experimentos químicos — pesar, mezclar, observar, registrar. Podrías hacerlo. Pero en cuanto a entusiasmo... miras alrededor del resto del espacio de investigación. El área de análisis de datos a la derecha también parece tener cosas pendientes.

Estás de pie frente a la mesa, sin haber empezado aún. Quizás primero ver qué son las otras tareas.`,

        pt: `Você olha para os equipamentos na bancada.

Experimentos químicos — pesar, misturar, observar, registrar. Você conseguiria. Mas quanto ao entusiasmo... você olha ao redor do resto do espaço de pesquisa. A área de análise de dados à direita também parece ter coisas esperando.

Você está parado na bancada, sem começar ainda. Talvez ver primeiro quais são as outras tarefas.`,

        it: `Guardi l'attrezzatura sul banco.

Esperimenti chimici — pesare, miscelare, osservare, registrare. Potresti farlo. Ma quanto a entusiasmo... guardi intorno nel resto dello spazio di ricerca. L'area di analisi dati sulla destra sembra avere anche cose in attesa.

Sei in piedi al banco, senza aver ancora iniziato. Forse prima vedere quali sono gli altri compiti.`,

        ru: `Ты смотришь на оборудование на столе.

Химические эксперименты — взвешивать, смешивать, наблюдать, записывать. Ты мог бы. Но что касается энтузиазма... ты оглядываешь остальное пространство. Зона анализа данных справа тоже, похоже, ждёт работы.

Ты стоишь у стола, ещё не начав. Может, сначала посмотреть, что за остальные задачи.`,

        ja: `実験台の上の器具を見る。

化学実験——計量、混合、観察、記録。できなくはない。でも熱意があるかと言えば……研究空間の他のエリアを見回す。右側のデータ分析エリアにも何か待っているようだ。

実験台の前に立っているが、まだ手をつけていない。他のタスクが何か、先に見てみるか。`,

        ko: `실험대 위의 장비를 바라본다.

화학 실험 — 계량, 혼합, 관찰, 기록. 할 수는 있다. 하지만 열의라고 하면... 연구 공간의 나머지를 둘러본다. 오른쪽의 데이터 분석 구역에도 할 일이 있어 보인다.

실험대 앞에 서 있지만, 아직 시작하지 않았다. 다른 작업이 뭔지 먼저 보는 게 나을지도 모른다.`,
      },
      score2: {
        zh: `试剂瓶、量筒、酒精灯。

你看着这些东西，内心没有产生「让我来」的冲动。化学实验需要的是耐心和精确的手动操作——这些你可以做，但你不想做。

你退后了一步。Mia 已经在称量了，她看起来很享受。让她去。`,

        en: `Reagent bottles, graduated cylinders, Bunsen burners.

You look at these things and feel no "let me handle this" impulse. Chemistry experiments require patience and precise manual work — things you can do, but don't want to.

You step back. Mia is already measuring, and she looks like she's enjoying it. Let her.`,

        nl: `Reagensflessen, maatcilinders, bunsenbranders.

Je kijkt naar deze dingen en voelt geen "laat mij dit doen"-impuls. Chemische experimenten vereisen geduld en nauwkeurig handwerk — dingen die je kunt doen, maar niet wilt.

Je doet een stap terug. Mia is al aan het meten, en ze lijkt ervan te genieten. Laat haar.`,

        de: `Reagenzflaschen, Messzylinder, Bunsenbrenner.

Du schaust diese Dinge an und spürst keinen „Lass mich das machen"-Impuls. Chemische Experimente erfordern Geduld und präzise Handarbeit — Dinge, die du tun kannst, aber nicht willst.

Du trittst zurück. Mia misst bereits ab, und sie sieht aus, als würde sie es genießen. Lass sie.`,

        fr: `Flacons de réactifs, éprouvettes graduées, becs Bunsen.

Tu regardes ces objets et ne ressens aucune impulsion « laisse-moi m'en charger ». Les expériences chimiques demandent de la patience et un travail manuel précis — des choses que tu peux faire, mais ne veux pas.

Tu recules d'un pas. Mia est déjà en train de mesurer, et elle a l'air d'apprécier. Laisse-la faire.`,

        es: `Frascos de reactivos, probetas graduadas, mecheros Bunsen.

Miras estas cosas y no sientes ningún impulso de "déjame encargarme". Los experimentos químicos requieren paciencia y trabajo manual preciso — cosas que puedes hacer, pero no quieres.

Das un paso atrás. Mia ya está midiendo, y parece disfrutarlo. Déjala.`,

        pt: `Frascos de reagentes, provetas, bicos de Bunsen.

Você olha para essas coisas e não sente nenhum impulso de "deixe-me cuidar disso". Experimentos químicos exigem paciência e trabalho manual preciso — coisas que você pode fazer, mas não quer.

Você recua um passo. Mia já está medindo, e parece estar gostando. Deixe-a.`,

        it: `Bottiglie di reagenti, cilindri graduati, becchi Bunsen.

Guardi queste cose e non senti alcun impulso del tipo "lascia fare a me". Gli esperimenti chimici richiedono pazienza e lavoro manuale preciso — cose che puoi fare, ma non vuoi.

Fai un passo indietro. Mia sta già misurando e sembra divertirsi. Lascia fare a lei.`,

        ru: `Бутылки с реактивами, мерные цилиндры, горелки Бунзена.

Ты смотришь на всё это и не чувствуешь порыва «дайте мне». Химические эксперименты требуют терпения и точной ручной работы — ты можешь это делать, но не хочешь.

Ты отступаешь. Мия уже отмеряет, и ей, похоже, нравится. Пусть она.`,

        ja: `試薬瓶、メスシリンダー、バーナー。

これらを見ても「自分がやる」という衝動は湧かない。化学実験には忍耐と精密な手作業が必要だ——できなくはないが、やりたくない。

一歩下がる。ミアはもう計量を始めていて、楽しそうだ。彼女に任せよう。`,

        ko: `시약병, 메스실린더, 분젠 버너.

이것들을 보지만 "내가 할게"라는 충동은 느껴지지 않는다. 화학 실험에는 인내심과 정밀한 수작업이 필요하다 — 할 수는 있지만, 하고 싶지 않다.

한 걸음 물러선다. 미아가 이미 계량하고 있고, 즐기는 것 같다. 그녀에게 맡기자.`,
      },
      score1: {
        zh: `你和那张实验台之间有一道看不见的线。

不是距离——是兴趣的边界。称量试剂、控制温度、观察颜色变化……这些活动在你的内心没有激起任何涟漪。

你走向了研究空间的另一侧，看看那边有什么。这里有五个阶段，实验不是你的那一个。`,

        en: `There's an invisible line between you and that bench.

Not distance — interest boundary. Weighing reagents, controlling temperature, observing color changes... these activities stir no ripple in you.

You walk toward the other side of the research space, to see what's there. Five phases here — the experiment isn't your one.`,

        nl: `Er is een onzichtbare lijn tussen jou en die werktafel.

Geen afstand — een interessegrens. Reagentia wegen, temperatuur controleren, kleurveranderingen observeren... deze activiteiten veroorzaken geen enkele rimpeling in je.

Je loopt naar de andere kant van de onderzoeksruimte om te zien wat daar is. Vijf fasen hier — het experiment is niet jouw fase.`,

        de: `Zwischen dir und diesem Labortisch verläuft eine unsichtbare Linie.

Keine Distanz — eine Interessensgrenze. Reagenzien wiegen, Temperatur kontrollieren, Farbveränderungen beobachten... diese Aktivitäten lösen keinerlei Regung in dir aus.

Du gehst zur anderen Seite des Forschungsraums, um zu sehen, was dort ist. Fünf Phasen hier — das Experiment ist nicht deine.`,

        fr: `Il y a une ligne invisible entre toi et cette paillasse.

Pas une distance — une frontière d'intérêt. Peser des réactifs, contrôler la température, observer les changements de couleur... ces activités ne provoquent aucune ondulation en toi.

Tu te diriges vers l'autre côté de l'espace de recherche pour voir ce qu'il y a. Cinq phases ici — l'expérience n'est pas la tienne.`,

        es: `Hay una línea invisible entre tú y esa mesa.

No es distancia — es una frontera de interés. Pesar reactivos, controlar temperatura, observar cambios de color... estas actividades no generan ninguna onda en ti.

Caminas hacia el otro lado del espacio de investigación para ver qué hay allí. Cinco fases aquí — el experimento no es la tuya.`,

        pt: `Há uma linha invisível entre você e aquela bancada.

Não é distância — é uma fronteira de interesse. Pesar reagentes, controlar temperatura, observar mudanças de cor... essas atividades não provocam nenhuma ondulação em você.

Você caminha para o outro lado do espaço de pesquisa para ver o que há lá. Cinco fases aqui — o experimento não é a sua.`,

        it: `C'è una linea invisibile tra te e quel banco.

Non è distanza — è un confine di interesse. Pesare reagenti, controllare la temperatura, osservare i cambiamenti di colore... queste attività non suscitano alcuna increspatura in te.

Ti dirigi verso l'altro lato dello spazio di ricerca per vedere cosa c'è. Cinque fasi qui — l'esperimento non è la tua.`,

        ru: `Между тобой и этим столом — невидимая черта.

Не расстояние — граница интереса. Взвешивать реактивы, контролировать температуру, наблюдать изменения цвета... эти действия не вызывают в тебе ни малейшего отклика.

Ты идёшь к другой стороне исследовательского пространства, посмотреть, что там. Пять фаз — эксперимент не твоя.`,

        ja: `あなたとあの実験台の間には見えない線がある。

距離ではない——興味の境界線だ。試薬を計量し、温度を管理し、色の変化を観察する……これらの活動はあなたの心にさざ波すら起こさない。

研究空間の反対側へ歩いていく。何があるか見に行こう。ここには五つのフェーズがある——実験はあなたのものではない。`,

        ko: `당신과 저 실험대 사이에 보이지 않는 선이 있다.

거리가 아니라 — 관심의 경계선이다. 시약을 계량하고, 온도를 조절하고, 색 변화를 관찰하는 것... 이 활동들은 당신 안에 어떤 파문도 일으키지 않는다.

연구 공간의 반대편으로 걸어간다, 그쪽에 뭐가 있는지 보려고. 다섯 단계가 있다 — 실험은 당신의 것이 아니다.`,
      },
    },
  },

  // ── Q7: Examine blood samples using a microscope ───────────
  {
    id: 7,
    riasec: "I",
    miniIpCode: "I4",
    miniIpItem: "Examine blood samples using a microscope",
    chapter: "laboratory",
    chapterIndex: 2,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `化学实验的结果和上一批人的记录基本一致——除了一个数据点。

Mia 追溯偏差的来源，在笔记本最后几页找到了一段潦草的字：「第7组样本在常规检测中显示正常，但我觉得有问题。需要显微镜进一步检查。没来得及。」

实验台另一端，显微镜已经摆在那里，旁边放着几组载玻片样本，编号和笔记一致。

屏幕更新：「研究阶段二：微观验证。使用显微镜检查标记样本，识别常规检测未能发现的异常。」

这需要耐心和精确眼力：调节焦距，逐一观察每组样本的微观结构，在它们看起来都差不多的情况下找出那个「不对」的。

Mia 把位置让出来：「我做实验比较好，显微镜这种需要耐心盯着看的，谁来？」`,

      en: `The chemical experiment results mostly match the previous group's records — except for one data point.

Mia traces the anomaly back through the notebook and finds a scrawled note on the last pages: "Sample group 7 showed normal in standard testing, but I think something's off. Needs microscopic examination. Didn't have time."

At the far end of the bench, a microscope is already set up, with several slide samples beside it, numbered to match the notebook.

The screen updates: "Research Phase Two: Microscopic Verification. Examine flagged samples under the microscope. Identify anomalies standard testing missed."

This requires patience and sharp eyes: adjust the focus, examine each sample's microstructure one by one, find the one that's "off" when they all look nearly the same.

Mia steps aside: "I'm better at running experiments. The microscope — the kind that needs patient staring — who's up for it?"`,

      nl: `De resultaten van het chemische experiment komen grotendeels overeen met de gegevens van de vorige groep — behalve één datapunt.

Mia traceert de anomalie terug door het notitieboek en vindt een gekrabbelde notitie op de laatste pagina's: "Monstergroep 7 was normaal bij standaardtests, maar ik denk dat er iets niet klopt. Moet microscopisch onderzocht worden. Had geen tijd."

Aan het uiteinde van de werktafel staat al een microscoop, met daarnaast enkele objectglaasjes, genummerd volgens het notitieboek.

Het scherm wordt bijgewerkt: "Onderzoeksfase twee: Microscopische verificatie. Onderzoek gemarkeerde monsters onder de microscoop. Identificeer afwijkingen die standaardtests hebben gemist."

Dit is werk dat geduld en scherpe ogen vereist: de scherpstelling aanpassen, elk monster één voor één bekijken, en degene vinden die "afwijkt" terwijl ze er allemaal bijna hetzelfde uitzien.

Mia doet een stap opzij: "Ik ben beter in het uitvoeren van experimenten. De microscoop — het soort dat geduldig staren vereist — wie neemt het op zich?"`,

      de: `Die Ergebnisse des chemischen Experiments stimmen größtenteils mit den Aufzeichnungen der vorherigen Gruppe überein — bis auf einen Datenpunkt.

Mia verfolgt die Anomalie im Notizbuch zurück und findet eine krakelige Notiz auf den letzten Seiten: „Probengruppe 7 zeigte bei Standardtests normale Werte, aber ich glaube, etwas stimmt nicht. Braucht mikroskopische Untersuchung. Hatte keine Zeit."

Am anderen Ende des Labortisches steht bereits ein Mikroskop, daneben mehrere Objektträgerpräparate, nummeriert passend zum Notizbuch.

Der Bildschirm aktualisiert sich: „Forschungsphase Zwei: Mikroskopische Verifizierung. Untersuchen Sie markierte Proben unter dem Mikroskop. Identifizieren Sie Anomalien, die Standardtests übersehen haben."

Diese Arbeit erfordert Geduld und scharfe Augen: Fokus justieren, jede Probe einzeln untersuchen und diejenige finden, die „abweicht", wenn alle fast gleich aussehen.

Mia tritt zur Seite: „Ich bin besser im Experimentieren. Das Mikroskop — das geduldige Starren — wer übernimmt?"`,

      fr: `Les résultats de l'expérience chimique correspondent globalement aux données du groupe précédent — sauf pour un point.

Mia remonte l'anomalie dans le cahier et trouve une note griffonnée sur les dernières pages : « Le groupe d'échantillons 7 était normal aux tests standard, mais je pense que quelque chose cloche. Nécessite un examen microscopique. Pas eu le temps. »

À l'autre bout de la paillasse, un microscope est déjà installé, avec plusieurs lames d'échantillons numérotées selon le cahier.

L'écran se met à jour : « Phase de recherche deux : Vérification microscopique. Examinez les échantillons signalés au microscope. Identifiez les anomalies que les tests standard ont manquées. »

C'est un travail qui demande patience et regard aiguisé : ajuster la mise au point, examiner chaque échantillon un par un, et trouver celui qui « cloche » quand tous se ressemblent.

Mia s'écarte : « Je suis meilleure pour mener les expériences. Le microscope — le genre qui demande de fixer patiemment — qui s'y colle ? »`,

      es: `Los resultados del experimento químico coinciden mayormente con los registros del grupo anterior — excepto un punto de datos.

Mia rastrea la anomalía en el cuaderno y encuentra una nota garabateada en las últimas páginas: "El grupo de muestras 7 mostró resultados normales en las pruebas estándar, pero creo que algo no cuadra. Necesita examen microscópico. No tuve tiempo."

Al extremo de la mesa, ya hay un microscopio instalado, con varias muestras en portaobjetos numeradas según el cuaderno.

La pantalla se actualiza: "Fase de investigación dos: Verificación microscópica. Examine las muestras marcadas bajo el microscopio. Identifique anomalías que las pruebas estándar pasaron por alto."

Este es un trabajo que requiere paciencia y ojos agudos: ajustar el enfoque, examinar cada muestra una por una, y encontrar la que "no cuadra" cuando todas parecen casi iguales.

Mia se aparta: "Yo soy mejor ejecutando experimentos. El microscopio — ese que necesita mirar pacientemente — ¿quién se anima?"`,

      pt: `Os resultados do experimento químico coincidem em grande parte com os registros do grupo anterior — exceto por um ponto de dados.

Mia rastreia a anomalia pelo caderno e encontra uma nota rabiscada nas últimas páginas: "O grupo de amostras 7 mostrou normal nos testes padrão, mas acho que algo está errado. Precisa de exame microscópico. Não deu tempo."

Na outra extremidade da bancada, um microscópio já está instalado, com várias lâminas de amostras numeradas de acordo com o caderno.

A tela atualiza: "Fase de pesquisa dois: Verificação microscópica. Examine as amostras sinalizadas sob o microscópio. Identifique anomalias que os testes padrão não detectaram."

Este é um trabalho que requer paciência e olhos aguçados: ajustar o foco, examinar cada amostra uma por uma, e encontrar a que está "errada" quando todas parecem quase iguais.

Mia se afasta: "Eu sou melhor conduzindo experimentos. O microscópio — daqueles que precisam de observação paciente — quem topa?"`,

      it: `I risultati dell'esperimento chimico corrispondono in gran parte ai dati del gruppo precedente — tranne un punto.

Mia ripercorre l'anomalia nel quaderno e trova una nota scarabocchiata sulle ultime pagine: "Il gruppo di campioni 7 risultava normale nei test standard, ma credo che qualcosa non vada. Serve un esame microscopico. Non ho fatto in tempo."

All'altra estremità del banco, un microscopio è già pronto, con diversi vetrini numerati in corrispondenza del quaderno.

Lo schermo si aggiorna: "Fase di ricerca due: Verifica microscopica. Esaminate i campioni segnalati al microscopio. Identificate le anomalie che i test standard non hanno rilevato."

Questo è un lavoro che richiede pazienza e occhi acuti: regolare la messa a fuoco, esaminare ogni campione uno per uno, e trovare quello "sbagliato" quando sembrano tutti quasi uguali.

Mia si fa da parte: "Io sono più brava a condurre esperimenti. Il microscopio — quello che richiede di fissare pazientemente — chi ci si mette?"`,

      ru: `Результаты химического эксперимента в основном совпадают с записями предыдущей группы — кроме одной точки данных.

Мия прослеживает аномалию по тетради и находит торопливую запись на последних страницах: «Группа образцов 7 показала норму при стандартном тестировании, но мне кажется, что-то не так. Нужна микроскопия. Не успели.»

В дальнем конце стола уже установлен микроскоп, рядом несколько предметных стёкол с образцами, пронумерованных по тетради.

Экран обновляется: «Фаза исследования вторая: Микроскопическая верификация. Исследуйте отмеченные образцы под микроскопом. Выявите аномалии, которые стандартное тестирование пропустило.»

Это работа, требующая терпения и острого глаза: настроить фокус, рассмотреть каждый образец по очереди и найти тот, что «не так», когда все выглядят почти одинаково.

Мия отступает: «Мне лучше удаются эксперименты. Микроскоп — тот, что требует терпеливого вглядывания — кто возьмётся?»`,

      ja: `化学実験の結果は前のグループの記録とほぼ一致した——一つのデータポイントを除いて。

ミアがノートを遡ってその異常の出所を追い、最後のページにたどり着くと走り書きのメモがあった：「サンプルグループ7は標準検査では正常だったが、何かおかしいと思う。顕微鏡検査が必要。時間がなかった。」

実験台の奥に顕微鏡がすでにセットされていて、横にはノートの番号と一致するスライドサンプルが数組置かれている。

スクリーンが更新される：「研究フェーズ2：顕微鏡検証。フラグ付きサンプルを顕微鏡で検査してください。標準検査で見逃された異常を特定してください。」

これは忍耐力と鋭い目を必要とする作業だ：焦点を合わせ、各サンプルの微細構造を一つずつ観察し、ほとんど同じに見えるものの中から「おかしい」ものを見つける。

ミアが場所を譲る：「私は実験を実行する方が得意。顕微鏡——辛抱強くじっと見るタイプの——誰がやる？」`,

      ko: `화학 실험 결과는 이전 그룹의 기록과 대체로 일치했다 — 한 데이터 포인트를 제외하고.

미아가 노트를 거슬러 올라가 이상의 원인을 추적하고, 마지막 페이지에서 휘갈겨 쓴 메모를 발견한다: "샘플 그룹 7은 표준 검사에서 정상이었지만, 뭔가 이상한 것 같다. 현미경 검사 필요. 시간이 없었다."

실험대 끝에 현미경이 이미 설치되어 있고, 옆에는 노트와 번호가 일치하는 슬라이드 샘플이 몇 개 놓여 있다.

화면이 업데이트된다: "연구 2단계: 현미경 검증. 표시된 샘플을 현미경으로 검사하십시오. 표준 검사에서 놓친 이상을 식별하십시오."

이 작업에는 인내심과 예리한 눈이 필요하다: 초점을 맞추고, 각 샘플의 미세 구조를 하나씩 관찰하며, 거의 같아 보이는 것들 중에서 "이상한" 것을 찾아야 한다.

미아가 비켜선다: "나는 실험 실행이 더 잘 맞아. 현미경 — 인내심 있게 들여다봐야 하는 종류 — 누가 할래?"`,
    },
    taskDescription: {
      zh: "使用显微镜逐一检查样本，在微观层面观察和分析，识别其中的异常。这项任务需要一个主要负责人。",

      en: `Use the microscope to examine samples one by one, observing and analyzing at the microscopic level to identify anomalies. This task needs one primary person.`,

      nl: "Gebruik de microscoop om monsters één voor één te onderzoeken, observeer en analyseer op microscopisch niveau om afwijkingen te identificeren. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Untersuchen Sie die Proben einzeln unter dem Mikroskop, beobachten und analysieren Sie auf mikroskopischer Ebene, um Anomalien zu identifizieren. Diese Aufgabe braucht eine hauptverantwortliche Person.",

      fr: "Utilisez le microscope pour examiner les échantillons un par un, en observant et analysant au niveau microscopique pour identifier les anomalies. Cette tâche nécessite un responsable principal.",

      es: "Use el microscopio para examinar las muestras una por una, observando y analizando a nivel microscópico para identificar anomalías. Esta tarea necesita una persona responsable principal.",

      pt: "Use o microscópio para examinar as amostras uma por uma, observando e analisando no nível microscópico para identificar anomalias. Esta tarefa precisa de uma pessoa principal responsável.",

      it: "Usate il microscopio per esaminare i campioni uno per uno, osservando e analizzando a livello microscopico per identificare anomalie. Questo compito richiede un responsabile principale.",

      ru: "Используйте микроскоп для поочерёдного исследования образцов, наблюдая и анализируя на микроскопическом уровне для выявления аномалий. Для этой задачи нужен один главный ответственный.",

      ja: "顕微鏡を使ってサンプルを一つずつ検査し、微視的レベルで観察・分析して異常を特定する。この作業には主担当者が一人必要です。",

      ko: "현미경을 사용하여 샘플을 하나씩 검사하고, 미시적 수준에서 관찰·분석하여 이상을 식별한다. 이 작업에는 주 담당자 한 명이 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你坐到了显微镜前面。

调焦的时候，你屏住了呼吸。第一组样本出现在镜头里——微观的世界展开了，结构清晰，纹理可读。你慢慢移动载玻片，每一个细胞、每一条纤维都在你的注意力之下。

你知道自己在找什么：不一样的那个。可能是一个形态的偏差，可能是一个密度的异常，可能是一个别人用肉眼永远看不到的线索。

时间消失了。只剩下镜头里的世界和你。`,

        en: `You sit down in front of the microscope.

As you adjust the focus, you hold your breath. The first sample appears in the lens — the microscopic world opens up, structures clear, textures readable. You slowly move the slide, every cell, every fiber under your attention.

You know what you're looking for: the one that's different. Maybe a shape deviation, maybe a density anomaly, maybe a clue invisible to the naked eye.

Time disappears. Only the world in the lens and you.`,

        nl: `Je gaat voor de microscoop zitten.

Terwijl je de scherpstelling aanpast, houd je je adem in. Het eerste monster verschijnt in de lens — de microscopische wereld opent zich, structuren helder, texturen leesbaar. Je schuift het objectglaasje langzaam, elke cel, elke vezel onder je aandacht.

Je weet wat je zoekt: degene die anders is. Misschien een vormafwijking, misschien een dichtheidsanomalie, misschien een aanwijzing die met het blote oog onzichtbaar is.

De tijd verdwijnt. Alleen de wereld in de lens en jij.`,

        de: `Du setzt dich vor das Mikroskop.

Beim Justieren des Fokus hältst du den Atem an. Die erste Probe erscheint in der Linse — die mikroskopische Welt öffnet sich, Strukturen klar, Texturen lesbar. Du bewegst den Objektträger langsam, jede Zelle, jede Faser unter deiner Aufmerksamkeit.

Du weißt, wonach du suchst: das eine, das anders ist. Vielleicht eine Formabweichung, vielleicht eine Dichteanomalie, vielleicht ein Hinweis, der mit bloßem Auge unsichtbar ist.

Die Zeit verschwindet. Nur die Welt in der Linse und du.`,

        fr: `Tu t'assieds devant le microscope.

En ajustant la mise au point, tu retiens ton souffle. Le premier échantillon apparaît dans l'objectif — le monde microscopique s'ouvre, structures nettes, textures lisibles. Tu déplaces lentement la lame, chaque cellule, chaque fibre sous ton attention.

Tu sais ce que tu cherches : celui qui est différent. Peut-être une déviation de forme, peut-être une anomalie de densité, peut-être un indice invisible à l'œil nu.

Le temps disparaît. Plus que le monde dans l'objectif et toi.`,

        es: `Te sientas frente al microscopio.

Al ajustar el enfoque, contienes la respiración. La primera muestra aparece en la lente — el mundo microscópico se abre, estructuras claras, texturas legibles. Mueves lentamente el portaobjetos, cada célula, cada fibra bajo tu atención.

Sabes lo que buscas: el que es diferente. Tal vez una desviación de forma, tal vez una anomalía de densidad, tal vez una pista invisible a simple vista.

El tiempo desaparece. Solo el mundo en la lente y tú.`,

        pt: `Você se senta diante do microscópio.

Ao ajustar o foco, prende a respiração. A primeira amostra aparece na lente — o mundo microscópico se abre, estruturas nítidas, texturas legíveis. Você move a lâmina lentamente, cada célula, cada fibra sob sua atenção.

Você sabe o que procura: o que é diferente. Talvez um desvio de forma, talvez uma anomalia de densidade, talvez uma pista invisível a olho nu.

O tempo desaparece. Só o mundo na lente e você.`,

        it: `Ti siedi davanti al microscopio.

Mentre regoli la messa a fuoco, trattieni il respiro. Il primo campione appare nell'obiettivo — il mondo microscopico si apre, strutture nitide, texture leggibili. Muovi lentamente il vetrino, ogni cellula, ogni fibra sotto la tua attenzione.

Sai cosa cerchi: quello diverso. Forse una deviazione nella forma, forse un'anomalia di densità, forse un indizio invisibile a occhio nudo.

Il tempo scompare. Solo il mondo nell'obiettivo e tu.`,

        ru: `Ты садишься перед микроскопом.

Настраивая фокус, задерживаешь дыхание. Первый образец появляется в линзе — микроскопический мир раскрывается, структуры чёткие, текстуры читаемые. Медленно двигаешь предметное стекло, каждая клетка, каждое волокно — под твоим вниманием.

Ты знаешь, что ищешь: тот, который отличается. Возможно, отклонение формы, возможно, аномалия плотности, возможно, подсказка, невидимая невооружённым глазом.

Время исчезает. Только мир в линзе и ты.`,

        ja: `顕微鏡の前に座る。

焦点を合わせながら息を止める。最初のサンプルがレンズに現れる——微視の世界が開け、構造は鮮明で、テクスチャは読み取れる。スライドをゆっくり動かし、すべての細胞、すべての繊維に注意を向ける。

何を探しているか分かっている：異なるもの。形の偏差かもしれない、密度の異常かもしれない、肉眼では見えない手がかりかもしれない。

時間が消える。レンズの中の世界と自分だけが残る。`,

        ko: `현미경 앞에 앉는다.

초점을 맞추면서 숨을 멈춘다. 첫 번째 샘플이 렌즈에 나타난다 — 미시 세계가 펼쳐지고, 구조는 선명하고, 질감은 읽을 수 있다. 슬라이드를 천천히 움직이며, 모든 세포, 모든 섬유에 주의를 기울인다.

무엇을 찾고 있는지 안다: 다른 것. 형태의 편차일 수도, 밀도의 이상일 수도, 육안으로는 보이지 않는 단서일 수도 있다.

시간이 사라진다. 렌즈 속 세계와 나만 남는다.`,
      },
      score4: {
        zh: `你走过去，坐下来，调整了显微镜的焦距。

第一组样本看起来正常。你记录了观察结果，换了第二组。微观世界里的信息量很大，需要你保持专注——但这种专注对你来说不是负担。

你一组一组地看下去。也许找得到异常，也许找不到。但你愿意认真地看完每一组。`,

        en: `You walk over, sit down, and adjust the microscope's focus.

The first sample looks normal. You record your observations and switch to the second. The microscopic world holds a lot of information, requiring you to stay focused — but that focus doesn't feel like a burden.

You go through them one by one. Maybe you'll find the anomaly, maybe not. But you're willing to look at each one carefully.`,

        nl: `Je loopt erheen, gaat zitten en stelt de microscoop scherp.

Het eerste monster ziet er normaal uit. Je noteert je observaties en schakelt over naar het tweede. De microscopische wereld bevat veel informatie, het vereist dat je gefocust blijft — maar die focus voelt niet als een last.

Je bekijkt ze één voor één. Misschien vind je de afwijking, misschien niet. Maar je bent bereid elk monster zorgvuldig te bekijken.`,

        de: `Du gehst hin, setzt dich und justierst den Fokus des Mikroskops.

Die erste Probe sieht normal aus. Du notierst deine Beobachtungen und wechselst zur zweiten. Die mikroskopische Welt enthält viele Informationen und erfordert Konzentration — aber diese Konzentration fühlt sich nicht wie eine Last an.

Du gehst sie einzeln durch. Vielleicht findest du die Anomalie, vielleicht nicht. Aber du bist bereit, jede sorgfältig zu betrachten.`,

        fr: `Tu t'approches, t'assieds et ajustes la mise au point du microscope.

Le premier échantillon a l'air normal. Tu notes tes observations et passes au deuxième. Le monde microscopique contient beaucoup d'informations, il faut rester concentré — mais cette concentration ne te pèse pas.

Tu les examines un par un. Peut-être trouveras-tu l'anomalie, peut-être pas. Mais tu es prêt à regarder chacun attentivement.`,

        es: `Te acercas, te sientas y ajustas el enfoque del microscopio.

La primera muestra parece normal. Registras tus observaciones y pasas a la segunda. El mundo microscópico contiene mucha información, requiere que te mantengas enfocado — pero esa concentración no se siente como una carga.

Las revisas una por una. Quizás encuentres la anomalía, quizás no. Pero estás dispuesto a examinar cada una con cuidado.`,

        pt: `Você se aproxima, senta e ajusta o foco do microscópio.

A primeira amostra parece normal. Você registra suas observações e passa para a segunda. O mundo microscópico contém muita informação, exige que você mantenha o foco — mas essa concentração não pesa.

Você as examina uma por uma. Talvez encontre a anomalia, talvez não. Mas está disposto a olhar cada uma com cuidado.`,

        it: `Ti avvicini, ti siedi e regoli la messa a fuoco del microscopio.

Il primo campione sembra normale. Annoti le osservazioni e passi al secondo. Il mondo microscopico contiene molte informazioni, richiede concentrazione — ma quella concentrazione non ti pesa.

Li esamini uno per uno. Forse troverai l'anomalia, forse no. Ma sei disposto a guardare ognuno con attenzione.`,

        ru: `Ты подходишь, садишься и настраиваешь фокус микроскопа.

Первый образец выглядит нормально. Записываешь наблюдения и переходишь ко второму. Микроскопический мир содержит много информации, нужно сохранять сосредоточенность — но эта сосредоточенность не ощущается бременем.

Просматриваешь их по одному. Может, найдёшь аномалию, может, нет. Но ты готов внимательно рассмотреть каждый.`,

        ja: `近づいて座り、顕微鏡の焦点を調整する。

最初のサンプルは正常に見える。観察結果を記録し、二つ目に切り替える。微視の世界には情報量が多く、集中力が必要だ——しかしその集中は負担には感じない。

一つずつ見ていく。異常が見つかるかもしれないし、見つからないかもしれない。でも一つ一つ丁寧に見る意志がある。`,

        ko: `다가가 앉아서 현미경의 초점을 맞춘다.

첫 번째 샘플은 정상으로 보인다. 관찰 결과를 기록하고 두 번째로 넘어간다. 미시 세계에는 정보가 많아 집중을 유지해야 하지만 — 그 집중이 부담으로 느껴지지는 않는다.

하나씩 살펴본다. 이상을 발견할 수도, 못할 수도 있다. 하지만 각각을 신중하게 볼 의향이 있다.`,
      },
      score3: {
        zh: `显微镜在那里。你走过去看了一眼目镜里的世界。

有意思。微观结构比你想象的更复杂。但要你坐在这里，一组一组、一帧一帧地耐心比对……你不确定自己能保持多久的专注。

你看了两组，记下了一些东西，然后把位置让给了别人。参与了，但不是深入。`,

        en: `The microscope is there. You walk over and peer through the eyepiece.

Interesting. The microstructure is more complex than you expected. But to sit here, one sample at a time, frame by frame, patiently comparing... you're not sure how long you can maintain that focus.

You look at two samples, jot down some notes, then give the seat to someone else. Involved, but not deeply.`,

        nl: `De microscoop staat daar. Je loopt erheen en kijkt door het oculair.

Interessant. De microstructuur is complexer dan je verwachtte. Maar hier zitten, één monster tegelijk, beeld voor beeld, geduldig vergelijken... je weet niet zeker hoe lang je die focus kunt vasthouden.

Je bekijkt twee monsters, maakt wat aantekeningen en geeft de plek aan iemand anders. Betrokken, maar niet diep.`,

        de: `Das Mikroskop steht dort. Du gehst hin und schaust durch das Okular.

Interessant. Die Mikrostruktur ist komplexer als erwartet. Aber hier zu sitzen, eine Probe nach der anderen, Bild für Bild, geduldig vergleichend... du bist nicht sicher, wie lange du diese Konzentration halten kannst.

Du schaust dir zwei Proben an, notierst einiges und überlässt den Platz jemand anderem. Beteiligt, aber nicht vertieft.`,

        fr: `Le microscope est là. Tu t'approches et regardes dans l'oculaire.

Intéressant. La microstructure est plus complexe que prévu. Mais rester assis là, un échantillon à la fois, image par image, en comparant patiemment... tu n'es pas sûr de pouvoir maintenir cette concentration longtemps.

Tu regardes deux échantillons, griffonnes quelques notes, puis laisses la place à quelqu'un d'autre. Impliqué, mais pas en profondeur.`,

        es: `El microscopio está ahí. Te acercas y miras por el ocular.

Interesante. La microestructura es más compleja de lo esperado. Pero sentarte aquí, una muestra a la vez, cuadro por cuadro, comparando pacientemente... no estás seguro de cuánto tiempo puedes mantener esa concentración.

Miras dos muestras, anotas algo y cedes el asiento a otra persona. Involucrado, pero no profundamente.`,

        pt: `O microscópio está ali. Você se aproxima e olha pela ocular.

Interessante. A microestrutura é mais complexa do que esperava. Mas ficar sentado aqui, uma amostra por vez, quadro por quadro, comparando pacientemente... você não sabe por quanto tempo consegue manter esse foco.

Você olha duas amostras, anota algumas coisas e cede o lugar para outra pessoa. Envolvido, mas não profundamente.`,

        it: `Il microscopio è lì. Ti avvicini e guardi attraverso l'oculare.

Interessante. La microstruttura è più complessa del previsto. Ma restare seduto qui, un campione alla volta, fotogramma dopo fotogramma, confrontando pazientemente... non sei sicuro di quanto a lungo puoi mantenere quella concentrazione.

Guardi due campioni, annoti qualcosa, poi cedi il posto a qualcun altro. Coinvolto, ma non in profondità.`,

        ru: `Микроскоп стоит. Подходишь и заглядываешь в окуляр.

Интересно. Микроструктура сложнее, чем ты думал. Но сидеть здесь, образец за образцом, кадр за кадром, терпеливо сравнивая... ты не уверен, надолго ли хватит сосредоточенности.

Рассматриваешь два образца, делаешь пару заметок и уступаешь место кому-то другому. Участвовал, но не глубоко.`,

        ja: `顕微鏡がそこにある。近づいて接眼レンズを覗く。

面白い。微細構造は思ったより複雑だ。でもここに座って、一つずつ、一コマずつ、辛抱強く比較し続けるとなると……集中力がどれくらい持つか自信がない。

二つのサンプルを見て、いくつかメモを取り、席を他の人に譲る。関わったが、深くはない。`,

        ko: `현미경이 거기 있다. 다가가서 접안렌즈를 들여다본다.

흥미롭다. 미세 구조가 예상보다 복잡하다. 하지만 여기 앉아서, 하나씩, 프레임별로, 인내심 있게 비교하는 것은... 그 집중을 얼마나 유지할 수 있을지 확신이 없다.

두 개의 샘플을 보고, 몇 가지를 메모하고, 자리를 다른 사람에게 양보한다. 참여했지만, 깊지는 않았다.`,
      },
      score2: {
        zh: `显微镜。样本。逐一检查。

你知道这件事需要什么——耐心。很多的耐心。长时间盯着一个小小的镜头，在几乎看不出区别的东西里找区别。

这不是你的方式。你退开了，让更有耐心的人来。`,

        en: `Microscope. Samples. Examine one by one.

You know what this requires — patience. A lot of patience. Staring through a tiny lens for a long time, finding differences in things that look nearly identical.

That's not your way. You step aside and let someone more patient take over.`,

        nl: `Microscoop. Monsters. Eén voor één onderzoeken.

Je weet wat dit vereist — geduld. Heel veel geduld. Lang door een klein lensje staren, verschillen vinden in dingen die er bijna identiek uitzien.

Dat is niet jouw manier. Je doet een stap opzij en laat iemand met meer geduld het overnemen.`,

        de: `Mikroskop. Proben. Einzeln untersuchen.

Du weißt, was das erfordert — Geduld. Sehr viel Geduld. Lange durch eine kleine Linse starren und Unterschiede in Dingen finden, die fast identisch aussehen.

Das ist nicht deine Art. Du trittst zur Seite und lässt jemand Geduldigeren übernehmen.`,

        fr: `Microscope. Échantillons. Examiner un par un.

Tu sais ce que cela demande — de la patience. Beaucoup de patience. Fixer longtemps à travers un petit objectif, trouver des différences dans des choses qui se ressemblent presque.

Ce n'est pas ta façon de faire. Tu t'écartes et laisses quelqu'un de plus patient prendre le relais.`,

        es: `Microscopio. Muestras. Examinar una por una.

Sabes lo que esto requiere — paciencia. Mucha paciencia. Mirar a través de una lente diminuta durante mucho tiempo, encontrar diferencias en cosas que parecen casi idénticas.

Esa no es tu manera. Te apartas y dejas que alguien más paciente se haga cargo.`,

        pt: `Microscópio. Amostras. Examinar uma por uma.

Você sabe o que isso requer — paciência. Muita paciência. Olhar por uma lente minúscula por muito tempo, encontrar diferenças em coisas que parecem quase idênticas.

Esse não é o seu jeito. Você se afasta e deixa alguém mais paciente assumir.`,

        it: `Microscopio. Campioni. Esaminare uno per uno.

Sai cosa richiede — pazienza. Molta pazienza. Fissare a lungo attraverso un piccolo obiettivo, trovare differenze in cose che sembrano quasi identiche.

Non è il tuo modo. Ti fai da parte e lasci che qualcuno con più pazienza prenda il posto.`,

        ru: `Микроскоп. Образцы. Рассматривать по одному.

Ты знаешь, что для этого нужно — терпение. Много терпения. Долго смотреть через маленькую линзу, находить различия в том, что выглядит почти одинаково.

Это не твой подход. Ты отходишь и уступаешь место кому-то более терпеливому.`,

        ja: `顕微鏡。サンプル。一つずつ検査。

これに何が必要か分かっている——忍耐だ。大量の忍耐。小さなレンズを長時間覗き込み、ほとんど同じに見えるものの中から違いを見つける。

自分のやり方ではない。脇に退いて、もっと忍耐強い人に譲る。`,

        ko: `현미경. 샘플. 하나씩 검사.

이것이 뭘 필요로 하는지 안다 — 인내심. 엄청난 인내심. 작은 렌즈를 오랫동안 들여다보며, 거의 같아 보이는 것들 속에서 차이를 찾는 것.

당신의 방식이 아니다. 비켜서서 더 인내심 있는 사람이 맡도록 한다.`,
      },
      score1: {
        zh: `你看了一眼显微镜，没有坐下来。

微观世界可能很精彩，但透过一个小镜头、一帧一帧地观察——这不是你会自愿做的事。

你走开了。研究空间还有三个阶段，也许后面有一个更适合你的节奏。`,

        en: `You glance at the microscope but don't sit down.

The microscopic world might be fascinating, but peering through a small lens, frame by frame — that's not something you'd volunteer for.

You walk away. The research space has three more phases. Maybe one ahead matches your rhythm better.`,

        nl: `Je werpt een blik op de microscoop maar gaat niet zitten.

De microscopische wereld is misschien fascinerend, maar door een klein lensje turen, beeld voor beeld — dat is niet iets waar je je vrijwillig voor zou melden.

Je loopt weg. De onderzoeksruimte heeft nog drie fasen. Misschien past er verderop één beter bij jouw ritme.`,

        de: `Du wirfst einen Blick auf das Mikroskop, setzt dich aber nicht.

Die mikroskopische Welt mag faszinierend sein, aber durch eine kleine Linse spähen, Bild für Bild — das ist nichts, wofür du dich freiwillig melden würdest.

Du gehst weiter. Der Forschungsraum hat noch drei Phasen. Vielleicht passt eine davon besser zu deinem Rhythmus.`,

        fr: `Tu jettes un œil au microscope mais ne t'assieds pas.

Le monde microscopique est peut-être fascinant, mais fixer à travers un petit objectif, image par image — ce n'est pas quelque chose pour lequel tu te porterais volontaire.

Tu t'éloignes. L'espace de recherche a encore trois phases. Peut-être qu'une suivante correspondra mieux à ton rythme.`,

        es: `Echas un vistazo al microscopio pero no te sientas.

El mundo microscópico puede ser fascinante, pero mirar a través de una lente pequeña, cuadro por cuadro — no es algo para lo que te ofrecerías voluntariamente.

Te alejas. El espacio de investigación tiene tres fases más. Quizás una más adelante se ajuste mejor a tu ritmo.`,

        pt: `Você olha para o microscópio mas não senta.

O mundo microscópico pode ser fascinante, mas olhar através de uma lente pequena, quadro por quadro — não é algo para o qual você se voluntariaria.

Você se afasta. O espaço de pesquisa tem mais três fases. Talvez uma adiante combine melhor com o seu ritmo.`,

        it: `Dai un'occhiata al microscopio ma non ti siedi.

Il mondo microscopico potrebbe essere affascinante, ma scrutare attraverso un piccolo obiettivo, fotogramma dopo fotogramma — non è qualcosa per cui ti offriesti volontario.

Ti allontani. Lo spazio di ricerca ha altre tre fasi. Forse una più avanti si adatta meglio al tuo ritmo.`,

        ru: `Ты бросаешь взгляд на микроскоп, но не садишься.

Микроскопический мир, возможно, увлекателен, но вглядываться через маленькую линзу, кадр за кадром — не то, на что ты добровольно подпишешься.

Ты уходишь. В исследовательском пространстве ещё три фазы. Может, одна из следующих лучше подойдёт твоему ритму.`,

        ja: `顕微鏡をちらりと見るが、座らない。

微視の世界は魅力的かもしれないが、小さなレンズを覗いて一コマずつ観察する——それは自ら志願してやることではない。

歩き去る。研究空間にはあと三つのフェーズがある。先に自分のリズムに合うものがあるかもしれない。`,

        ko: `현미경을 한 번 쳐다보지만 앉지 않는다.

미시 세계는 매혹적일 수 있지만, 작은 렌즈를 통해 프레임별로 들여다보는 것 — 자원해서 할 일은 아니다.

걸어서 떠난다. 연구 공간에는 세 단계가 더 있다. 앞으로 당신의 리듬에 맞는 것이 있을지 모른다.`,
      },
    },
  },

  // ── Q8: Develop a way to better predict the weather ────────
  {
    id: 8,
    riasec: "I",
    miniIpCode: "I5",
    miniIpItem: "Develop a way to better predict the weather",
    chapter: "laboratory",
    chapterIndex: 2,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `显微镜下的发现印证了上一批人的直觉——确实有异常。

但这个异常意味着什么？研究空间中央的大屏幕亮了，显示了一组庞大的数据集：上一批人在实验中收集的所有环境数据——温度、湿度、气压、化学浓度，按时间轴排列。

笔记本倒数第二页写着：「这些变量之间有某种规律。我以为我找到了，但模型不够好。如果有人能建一个更好的预测模型，也许就能解释那个异常。」

屏幕更新：「研究阶段三：模式识别。分析环境数据集，建立预测模型。现有模型准确率 62%，需提升。」

数据都在屏幕上，工具也有——计算终端、绘图软件、统计参考手册。需要有人坐下来，从大量数据中找出变量之间的关系，建立一个比上一批人更好的预测方法。

Nora 走过去，看了几秒：「数据量很大。需要有人真的去看每一列，才能找到规律。」她停了停：「不是我。我只是在说事实。」`,

      en: `The microscopic finding confirms the previous group's intuition — there is an anomaly.

But what does it mean? The large screen in the center lights up, displaying a massive dataset: all environmental data collected during the experiments — temperature, humidity, pressure, chemical concentrations, arranged along a timeline.

The second-to-last page reads: "There's a pattern in these variables. I thought I found it, but my model wasn't good enough. If someone can build a better prediction model, maybe it explains the anomaly."

The screen updates: "Research Phase Three: Pattern Recognition. Analyze the dataset and build a prediction model. Current accuracy: 62%. Improvement needed."

The data is on screen. Tools are available — computing terminal, graphing software, statistical reference manual. Someone needs to sit down, find relationships between variables in the vast data, and build a better prediction method than the last group's.

Nora walks over, looks for a few seconds: "The data volume is large. Someone needs to actually look at every column to find the pattern." She pauses. "Not me. I'm just stating facts."`,

      nl: `De microscopische ontdekking bevestigt het vermoeden van de vorige groep — er is inderdaad een anomalie.

Maar wat betekent het? Het grote scherm in het midden van de onderzoeksruimte licht op en toont een enorme dataset: alle omgevingsgegevens die tijdens de experimenten zijn verzameld — temperatuur, vochtigheid, luchtdruk, chemische concentraties, gerangschikt langs een tijdlijn.

Op de voorlaatste pagina van het notitieboek staat: "Er zit een patroon in deze variabelen. Ik dacht dat ik het had gevonden, maar mijn model was niet goed genoeg. Als iemand een beter voorspellingsmodel kan bouwen, verklaart dat misschien de anomalie."

Het scherm wordt bijgewerkt: "Onderzoeksfase drie: Patroonherkenning. Analyseer de omgevingsdataset en bouw een voorspellingsmodel. Nauwkeurigheid huidig model: 62%. Verbetering nodig."

De gegevens staan op het scherm. Hulpmiddelen zijn beschikbaar — rekenterminal, grafische software, statistisch naslagwerk. Iemand moet gaan zitten, relaties tussen variabelen in de enorme data vinden, en een betere voorspellingsmethode bouwen dan de vorige groep.

Nora loopt erheen, kijkt een paar seconden, en zegt: "Het datavolume is groot. Iemand moet echt elke kolom bekijken om het patroon te vinden." Ze pauzeert. "Niet ik. Ik constateer alleen feiten."`,

      de: `Der mikroskopische Befund bestätigt die Intuition der vorherigen Gruppe — es gibt tatsächlich eine Anomalie.

Aber was bedeutet sie? Der große Bildschirm in der Mitte des Forschungsraums leuchtet auf und zeigt einen riesigen Datensatz: alle Umweltdaten, die während der Experimente gesammelt wurden — Temperatur, Luftfeuchtigkeit, Luftdruck, chemische Konzentrationen, entlang einer Zeitachse angeordnet.

Auf der vorletzten Seite des Notizbuchs steht: „Es gibt ein Muster in diesen Variablen. Ich dachte, ich hätte es gefunden, aber mein Modell war nicht gut genug. Wenn jemand ein besseres Vorhersagemodell bauen kann, erklärt es vielleicht die Anomalie."

Der Bildschirm aktualisiert sich: „Forschungsphase Drei: Mustererkennung. Analysieren Sie den Umweltdatensatz und erstellen Sie ein Vorhersagemodell. Aktuelle Modellgenauigkeit: 62%. Verbesserung erforderlich."

Die Daten sind alle auf dem Bildschirm. Werkzeuge stehen bereit — Computerterminal, Grafiksoftware, statistisches Nachschlagewerk. Jemand muss sich hinsetzen, Zusammenhänge zwischen Variablen in den umfangreichen Daten finden und eine bessere Vorhersagemethode als die der letzten Gruppe entwickeln.

Nora geht hin, schaut ein paar Sekunden und sagt: „Die Datenmenge ist groß. Jemand muss wirklich jede Spalte ansehen, um das Muster zu finden." Sie pausiert. „Nicht ich. Ich stelle nur Fakten fest."`,

      fr: `La découverte microscopique confirme l'intuition du groupe précédent — il y a bien une anomalie.

Mais qu'est-ce que ça signifie ? Le grand écran au centre de l'espace de recherche s'allume et affiche un jeu de données massif : toutes les données environnementales collectées pendant les expériences — température, humidité, pression atmosphérique, concentrations chimiques, disposées sur une chronologie.

L'avant-dernière page du cahier indique : « Il y a un schéma dans ces variables. Je pensais l'avoir trouvé, mais mon modèle n'était pas assez bon. Si quelqu'un peut construire un meilleur modèle prédictif, cela expliquera peut-être l'anomalie. »

L'écran se met à jour : « Phase de recherche trois : Reconnaissance de schémas. Analysez le jeu de données environnementales et construisez un modèle prédictif. Précision du modèle actuel : 62%. Amélioration nécessaire. »

Les données sont toutes à l'écran. Les outils sont disponibles — terminal de calcul, logiciel graphique, manuel de référence statistique. Quelqu'un doit s'asseoir, trouver des relations entre les variables dans les vastes données, et construire une meilleure méthode de prédiction que celle du groupe précédent.

Nora s'approche, regarde quelques secondes et dit : « Le volume de données est important. Quelqu'un doit vraiment examiner chaque colonne pour trouver le schéma. » Elle s'arrête. « Pas moi. Je ne fais que constater. »`,

      es: `El hallazgo microscópico confirma la intuición del grupo anterior — hay una anomalía.

¿Pero qué significa? La gran pantalla en el centro del espacio de investigación se enciende, mostrando un conjunto masivo de datos: todos los datos ambientales recopilados durante los experimentos — temperatura, humedad, presión atmosférica, concentraciones químicas, dispuestos a lo largo de una línea temporal.

La penúltima página del cuaderno dice: "Hay un patrón en estas variables. Creí haberlo encontrado, pero mi modelo no era lo suficientemente bueno. Si alguien puede construir un mejor modelo predictivo, quizás explique la anomalía."

La pantalla se actualiza: "Fase de investigación tres: Reconocimiento de patrones. Analice el conjunto de datos ambientales y construya un modelo predictivo. Precisión del modelo actual: 62%. Se necesita mejora."

Los datos están todos en pantalla. Las herramientas están disponibles — terminal de cómputo, software de gráficos, manual de referencia estadística. Alguien necesita sentarse, encontrar relaciones entre variables en los vastos datos, y construir un método de predicción mejor que el del grupo anterior.

Nora se acerca, mira unos segundos y dice: "El volumen de datos es grande. Alguien necesita realmente mirar cada columna para encontrar el patrón." Hace una pausa. "Yo no. Solo estoy constatando hechos."`,

      pt: `A descoberta microscópica confirma a intuição do grupo anterior — há uma anomalia.

Mas o que isso significa? A tela grande no centro do espaço de pesquisa se ilumina, exibindo um conjunto massivo de dados: todos os dados ambientais coletados durante os experimentos — temperatura, umidade, pressão atmosférica, concentrações químicas, organizados ao longo de uma linha do tempo.

A penúltima página do caderno diz: "Há um padrão nestas variáveis. Achei que tinha encontrado, mas meu modelo não era bom o suficiente. Se alguém puder construir um modelo preditivo melhor, talvez explique a anomalia."

A tela atualiza: "Fase de pesquisa três: Reconhecimento de padrões. Analise o conjunto de dados ambientais e construa um modelo preditivo. Precisão do modelo atual: 62%. Melhoria necessária."

Os dados estão todos na tela. Ferramentas disponíveis — terminal de computação, software de gráficos, manual de referência estatística. Alguém precisa sentar, encontrar relações entre variáveis nos vastos dados, e construir um método de previsão melhor que o do grupo anterior.

Nora se aproxima, olha por alguns segundos e diz: "O volume de dados é grande. Alguém precisa realmente olhar cada coluna para encontrar o padrão." Ela pausa. "Não eu. Só estou constatando fatos."`,

      it: `La scoperta microscopica conferma l'intuizione del gruppo precedente — c'è davvero un'anomalia.

Ma cosa significa? Il grande schermo al centro dello spazio di ricerca si illumina, mostrando un dataset enorme: tutti i dati ambientali raccolti durante gli esperimenti — temperatura, umidità, pressione atmosferica, concentrazioni chimiche, disposti lungo una linea temporale.

La penultima pagina del quaderno riporta: "C'è uno schema in queste variabili. Pensavo di averlo trovato, ma il mio modello non era abbastanza buono. Se qualcuno riesce a costruire un modello predittivo migliore, forse spiega l'anomalia."

Lo schermo si aggiorna: "Fase di ricerca tre: Riconoscimento di schemi. Analizzate il dataset ambientale e costruite un modello predittivo. Accuratezza del modello attuale: 62%. Miglioramento necessario."

I dati sono tutti sullo schermo. Gli strumenti sono disponibili — terminale di calcolo, software grafico, manuale di riferimento statistico. Qualcuno deve sedersi, trovare relazioni tra le variabili nei vasti dati e costruire un metodo predittivo migliore di quello del gruppo precedente.

Nora si avvicina, guarda per qualche secondo e dice: "Il volume di dati è grande. Qualcuno deve davvero guardare ogni colonna per trovare lo schema." Si ferma. "Non io. Sto solo esponendo i fatti."`,

      ru: `Находка под микроскопом подтверждает интуицию предыдущей группы — аномалия действительно есть.

Но что она означает? Большой экран в центре исследовательского пространства загорается, показывая огромный набор данных: все экологические данные, собранные в ходе экспериментов — температура, влажность, атмосферное давление, концентрации веществ, выстроенные вдоль временной оси.

На предпоследней странице тетради: «В этих переменных есть закономерность. Я думал, что нашёл её, но моя модель была недостаточно хороша. Если кто-то сможет построить лучшую прогностическую модель, возможно, она объяснит аномалию.»

Экран обновляется: «Фаза исследования третья: Распознавание закономерностей. Проанализируйте набор экологических данных и постройте прогностическую модель. Точность текущей модели: 62%. Требуется улучшение.»

Данные на экране. Инструменты доступны — вычислительный терминал, программа для графиков, статистический справочник. Кому-то нужно сесть, найти связи между переменными в огромных данных и построить метод прогнозирования лучше, чем у прошлой группы.

Нора подходит, смотрит несколько секунд и говорит: «Данных много. Кому-то нужно реально просмотреть каждый столбец, чтобы найти закономерность.» Пауза. «Не мне. Я просто констатирую.»`,

      ja: `顕微鏡での発見が前のグループの直感を裏付けた——確かに異常がある。

しかしそれは何を意味するのか？研究空間中央の大スクリーンが点灯し、膨大なデータセットが表示される：実験中に収集されたすべての環境データ——温度、湿度、気圧、化学物質の濃度が時系列に沿って並んでいる。

ノートの最後から二番目のページにはこう書かれている：「これらの変数にはパターンがある。見つけたと思ったが、モデルが十分ではなかった。もし誰かがより良い予測モデルを構築できれば、異常の説明がつくかもしれない。」

スクリーンが更新される：「研究フェーズ3：パターン認識。環境データセットを分析し、予測モデルを構築してください。現在のモデル精度：62%。改善が必要です。」

データはすべてスクリーン上にある。ツールも揃っている——計算端末、グラフ作成ソフト、統計参考書。誰かが座って、膨大なデータの中から変数間の関係を見つけ、前のグループより優れた予測手法を構築する必要がある。

ノラが近づき、数秒見て言う：「データ量が多い。パターンを見つけるには、誰かが本当にすべての列を見る必要がある。」一拍置いて：「私じゃないけど。事実を述べているだけ。」`,

      ko: `현미경 발견이 이전 그룹의 직감을 확인시켜 준다 — 이상이 있다.

하지만 그것이 무엇을 의미하는가? 연구 공간 중앙의 대형 스크린이 켜지며 방대한 데이터셋을 보여준다: 실험 중 수집된 모든 환경 데이터 — 온도, 습도, 기압, 화학 농도가 타임라인에 따라 배열되어 있다.

노트 끝에서 두 번째 페이지에 적혀 있다: "이 변수들 사이에 패턴이 있다. 찾았다고 생각했지만, 내 모델이 충분히 좋지 않았다. 누군가 더 나은 예측 모델을 만들 수 있다면, 그 이상을 설명할 수 있을지도 모른다."

화면이 업데이트된다: "연구 3단계: 패턴 인식. 환경 데이터셋을 분석하고 예측 모델을 구축하십시오. 현재 모델 정확도: 62%. 개선 필요."

데이터는 모두 화면에 있다. 도구도 있다 — 컴퓨팅 터미널, 그래프 소프트웨어, 통계 참고 매뉴얼. 누군가가 앉아서, 방대한 데이터에서 변수 간의 관계를 찾고, 이전 그룹보다 더 나은 예측 방법을 구축해야 한다.

노라가 다가가 몇 초간 보더니 말한다: "데이터 양이 많아. 누군가 정말 모든 열을 살펴봐야 패턴을 찾을 수 있어." 잠시 멈춘다. "나는 아니야. 사실을 말하는 것뿐이야."`,
    },
    taskDescription: {
      zh: "分析大量环境数据，从中发现变量之间的规律，建立一个更准确的预测模型。这项任务需要一个主要负责人。",

      en: `Analyze large volumes of environmental data, discover patterns between variables, and build a more accurate prediction model. This task needs one primary person.`,

      nl: "Analyseer grote hoeveelheden omgevingsgegevens, ontdek patronen tussen variabelen, en bouw een nauwkeuriger voorspellingsmodel. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Analysieren Sie große Mengen an Umweltdaten, entdecken Sie Muster zwischen Variablen und erstellen Sie ein genaueres Vorhersagemodell. Diese Aufgabe braucht eine hauptverantwortliche Person.",

      fr: "Analysez de grands volumes de données environnementales, découvrez des schémas entre les variables et construisez un modèle prédictif plus précis. Cette tâche nécessite un responsable principal.",

      es: "Analice grandes volúmenes de datos ambientales, descubra patrones entre variables y construya un modelo predictivo más preciso. Esta tarea necesita una persona responsable principal.",

      pt: "Analise grandes volumes de dados ambientais, descubra padrões entre variáveis e construa um modelo preditivo mais preciso. Esta tarefa precisa de uma pessoa principal responsável.",

      it: "Analizzate grandi volumi di dati ambientali, scoprite schemi tra le variabili e costruite un modello predittivo più accurato. Questo compito richiede un responsabile principale.",

      ru: "Проанализируйте большие объёмы экологических данных, выявите закономерности между переменными и постройте более точную прогностическую модель. Для этой задачи нужен один главный ответственный.",

      ja: "大量の環境データを分析し、変数間のパターンを発見し、より正確な予測モデルを構築する。この作業には主担当者が一人必要です。",

      ko: "대량의 환경 데이터를 분석하고, 변수 간 패턴을 발견하고, 더 정확한 예측 모델을 구축한다. 이 작업에는 주 담당자 한 명이 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `你坐到了计算终端前面。

数据开始在屏幕上流动——数字、图表、趋势线。你的眼睛在扫描，但不只是在看——是在思考。温度和化学浓度之间，是不是有一个延迟的相关性？气压的变化是不是触发了某个连锁反应？

62%的准确率。上一批人用的是线性模型——你觉得可以做得更好。你开始在纸上画出你的假设框架。

这是你最舒服的地方：大量的数据，一个待解的问题，以及足够的时间让你去想。`,

        en: `You sit down at the computing terminal.

Data begins flowing across the screen — numbers, charts, trend lines. Your eyes are scanning, but not just looking — thinking. Is there a delayed correlation between temperature and chemical concentration? Does atmospheric pressure change trigger a chain reaction?

62% accuracy. The last group used a linear model — you think you can do better. You start sketching your hypothesis framework on paper.

This is where you're most comfortable: massive data, an unsolved problem, and enough time to think.`,

        nl: `Je gaat zitten achter de rekenterminal.

Data begint over het scherm te stromen — cijfers, grafieken, trendlijnen. Je ogen scannen, maar kijken niet alleen — ze denken. Is er een vertraagde correlatie tussen temperatuur en chemische concentratie? Veroorzaakt een luchtdrukverandering een kettingreactie?

62% nauwkeurigheid. De vorige groep gebruikte een lineair model — jij denkt dat je het beter kunt. Je begint je hypothesekader op papier te schetsen.

Dit is waar je je het prettigst voelt: enorme hoeveelheden data, een onopgelost probleem, en genoeg tijd om na te denken.`,

        de: `Du setzt dich an das Computerterminal.

Daten beginnen über den Bildschirm zu fließen — Zahlen, Diagramme, Trendlinien. Deine Augen scannen, aber schauen nicht nur — sie denken. Gibt es eine verzögerte Korrelation zwischen Temperatur und chemischer Konzentration? Löst eine Luftdruckänderung eine Kettenreaktion aus?

62% Genauigkeit. Die letzte Gruppe verwendete ein lineares Modell — du glaubst, du kannst es besser. Du beginnst dein Hypothesengerüst auf Papier zu skizzieren.

Das ist dein Wohlfühlbereich: riesige Datenmengen, ein ungelöstes Problem und genug Zeit zum Nachdenken.`,

        fr: `Tu t'assieds devant le terminal de calcul.

Les données commencent à défiler sur l'écran — chiffres, graphiques, lignes de tendance. Tes yeux balayent, mais ne font pas que regarder — ils réfléchissent. Y a-t-il une corrélation décalée entre température et concentration chimique ? Un changement de pression atmosphérique déclenche-t-il une réaction en chaîne ?

62% de précision. Le groupe précédent utilisait un modèle linéaire — tu penses pouvoir faire mieux. Tu commences à esquisser ton cadre d'hypothèses sur papier.

C'est là que tu es le plus à l'aise : des données massives, un problème non résolu, et assez de temps pour réfléchir.`,

        es: `Te sientas en el terminal de cómputo.

Los datos comienzan a fluir por la pantalla — números, gráficos, líneas de tendencia. Tus ojos escanean, pero no solo miran — piensan. ¿Hay una correlación diferida entre temperatura y concentración química? ¿Un cambio en la presión atmosférica desencadena una reacción en cadena?

62% de precisión. El grupo anterior usó un modelo lineal — crees que puedes hacerlo mejor. Empiezas a esbozar tu marco de hipótesis en papel.

Este es tu lugar más cómodo: datos masivos, un problema sin resolver, y tiempo suficiente para pensar.`,

        pt: `Você senta no terminal de computação.

Os dados começam a fluir pela tela — números, gráficos, linhas de tendência. Seus olhos escaneiam, mas não apenas olham — pensam. Há uma correlação atrasada entre temperatura e concentração química? Uma mudança na pressão atmosférica desencadeia uma reação em cadeia?

62% de precisão. O grupo anterior usou um modelo linear — você acha que pode fazer melhor. Começa a esboçar seu quadro de hipóteses no papel.

Aqui é onde você se sente mais confortável: dados massivos, um problema não resolvido, e tempo suficiente para pensar.`,

        it: `Ti siedi al terminale di calcolo.

I dati iniziano a scorrere sullo schermo — numeri, grafici, linee di tendenza. I tuoi occhi scansionano, ma non guardano soltanto — pensano. C'è una correlazione ritardata tra temperatura e concentrazione chimica? Un cambiamento di pressione atmosferica innesca una reazione a catena?

62% di accuratezza. Il gruppo precedente ha usato un modello lineare — pensi di poter fare meglio. Inizi a schizzare il tuo quadro ipotetico su carta.

Questo è dove ti senti più a tuo agio: dati enormi, un problema irrisolto, e abbastanza tempo per pensare.`,

        ru: `Ты садишься за вычислительный терминал.

Данные потекли по экрану — числа, графики, линии трендов. Глаза сканируют, но не просто смотрят — думают. Есть ли запаздывающая корреляция между температурой и концентрацией? Вызывает ли изменение давления цепную реакцию?

62% точности. Прошлая группа использовала линейную модель — ты считаешь, что сможешь лучше. Начинаешь набрасывать свою гипотезную рамку на бумаге.

Это твоё самое комфортное место: огромные данные, нерешённая задача и достаточно времени, чтобы думать.`,

        ja: `計算端末の前に座る。

データがスクリーンを流れ始める——数字、グラフ、トレンドライン。目はスキャンしているが、ただ見ているのではない——考えている。温度と化学濃度の間に遅延相関はあるか？気圧の変化が連鎖反応を引き起こすのか？

精度62%。前のグループは線形モデルを使った——もっとうまくできると思う。紙に仮説の枠組みを描き始める。

ここが一番居心地がいい場所だ：膨大なデータ、未解決の問題、そして考えるための十分な時間。`,

        ko: `컴퓨팅 터미널 앞에 앉는다.

데이터가 화면을 가로질러 흐르기 시작한다 — 숫자, 차트, 추세선. 눈이 스캔하지만, 단순히 보는 게 아니라 — 생각하고 있다. 온도와 화학 농도 사이에 지연된 상관관계가 있는가? 기압 변화가 연쇄 반응을 촉발하는가?

정확도 62%. 이전 그룹은 선형 모델을 사용했다 — 더 잘할 수 있다고 생각한다. 종이에 가설 프레임워크를 스케치하기 시작한다.

여기가 가장 편한 곳이다: 방대한 데이터, 미해결 문제, 그리고 생각할 충분한 시간.`,
      },
      score4: {
        zh: `你走到屏幕前，开始浏览数据。

变量很多，时间跨度不短，但数据的结构是清楚的。你拿起统计参考手册翻了翻，心里大概有了一个思路——先看相关性矩阵，再找异常值的分布模式。

62%的准确率不算高。你觉得可以试试不同的方法。

你打开了计算终端，开始输入第一组公式。`,

        en: `You walk to the screen and start browsing the data.

Many variables, long time span, but the data structure is clear. You flip through the statistics manual and form a rough approach — start with a correlation matrix, then look for the anomaly distribution pattern.

62% isn't great. You think it's worth trying different methods.

You open the computing terminal and start entering the first set of formulas.`,

        nl: `Je loopt naar het scherm en begint de gegevens te bekijken.

Veel variabelen, lange tijdspanne, maar de datastructuur is duidelijk. Je bladert door het statistiekhandboek en vormt een ruwe aanpak — begin met een correlatiematrix, zoek dan naar het verdelingspatroon van de anomalieën.

62% is niet geweldig. Je denkt dat het de moeite waard is om andere methoden te proberen.

Je opent de rekenterminal en begint de eerste reeks formules in te voeren.`,

        de: `Du gehst zum Bildschirm und beginnst, die Daten zu durchsuchen.

Viele Variablen, langer Zeitraum, aber die Datenstruktur ist klar. Du blätterst durch das Statistik-Handbuch und bildest einen groben Ansatz — beginne mit einer Korrelationsmatrix, dann suche nach dem Verteilungsmuster der Anomalien.

62% ist nicht großartig. Du denkst, es lohnt sich, verschiedene Methoden auszuprobieren.

Du öffnest das Computerterminal und gibst die ersten Formeln ein.`,

        fr: `Tu t'approches de l'écran et commences à parcourir les données.

Beaucoup de variables, longue période, mais la structure des données est claire. Tu feuillettes le manuel de statistiques et formes une approche approximative — commencer par une matrice de corrélation, puis chercher le schéma de distribution des anomalies.

62% n'est pas formidable. Tu penses que ça vaut la peine d'essayer d'autres méthodes.

Tu ouvres le terminal de calcul et commences à saisir la première série de formules.`,

        es: `Caminas hacia la pantalla y comienzas a explorar los datos.

Muchas variables, largo período de tiempo, pero la estructura de datos es clara. Hojeas el manual de estadística y formas un enfoque aproximado — empezar con una matriz de correlación, luego buscar el patrón de distribución de la anomalía.

62% no está muy bien. Crees que vale la pena probar diferentes métodos.

Abres el terminal de cómputo y comienzas a ingresar la primera serie de fórmulas.`,

        pt: `Você vai até a tela e começa a navegar pelos dados.

Muitas variáveis, longo período de tempo, mas a estrutura dos dados é clara. Folheia o manual de estatística e forma uma abordagem aproximada — começar com uma matriz de correlação, depois procurar o padrão de distribuição da anomalia.

62% não é ótimo. Você acha que vale a pena tentar métodos diferentes.

Abre o terminal de computação e começa a inserir a primeira série de fórmulas.`,

        it: `Ti avvicini allo schermo e inizi a sfogliare i dati.

Molte variabili, lungo arco temporale, ma la struttura dei dati è chiara. Scorri il manuale di statistica e formi un approccio approssimativo — iniziare con una matrice di correlazione, poi cercare il pattern di distribuzione delle anomalie.

62% non è granché. Pensi che valga la pena provare metodi diversi.

Apri il terminale di calcolo e inizi a inserire la prima serie di formule.`,

        ru: `Ты подходишь к экрану и начинаешь просматривать данные.

Много переменных, длинный временной отрезок, но структура данных ясна. Листаешь статистический справочник и формируешь примерный подход — начать с корреляционной матрицы, потом искать паттерн распределения аномалий.

62% — не впечатляет. Стоит попробовать другие методы.

Открываешь вычислительный терминал и вводишь первую серию формул.`,

        ja: `スクリーンに近づき、データを閲覧し始める。

変数は多く、時間軸も長いが、データ構造は明確だ。統計参考書をめくり、大まかなアプローチを組み立てる——まず相関行列から始めて、異常値の分布パターンを探す。

62%は高くない。別の方法を試す価値があると思う。

計算端末を開き、最初の数式を入力し始める。`,

        ko: `화면으로 다가가 데이터를 탐색하기 시작한다.

변수가 많고 시간 범위가 길지만 데이터 구조는 명확하다. 통계 참고서를 넘기며 대략적인 접근법을 구상한다 — 상관 행렬부터 시작해서, 이상치의 분포 패턴을 찾는다.

62%는 높지 않다. 다른 방법을 시도해 볼 가치가 있다고 생각한다.

컴퓨팅 터미널을 열고 첫 번째 공식 세트를 입력하기 시작한다.`,
      },
      score3: {
        zh: `数据集很大。

你看了看那些数字、那些图表，有一种「有意思但不确定要不要深入」的感觉。建模需要时间，需要你真的坐在那里一列一列地分析——这不是你没有能力做的事，但你不确定这是不是你最想做的事。

你看了一会儿，记下了几个观察，然后等着看接下来的任务是什么。`,

        en: `The dataset is large.

You look at the numbers, the charts, and feel something between "interesting" and "not sure I want to go deep." Modeling takes time — it requires you to actually sit there and analyze column by column. Not something you lack the ability for, but you're not sure it's what you most want to do.

You look for a while, jot down a few observations, then wait to see what the next task brings.`,

        nl: `De dataset is groot.

Je kijkt naar de cijfers, de grafieken, en voelt iets tussen "interessant" en "niet zeker of ik diep wil gaan." Modelleren kost tijd — het vereist dat je echt gaat zitten en kolom voor kolom analyseert. Niet iets waarvoor je het vermogen mist, maar je weet niet zeker of het is wat je het liefst doet.

Je kijkt een tijdje, noteert een paar observaties, en wacht af wat de volgende taak brengt.`,

        de: `Der Datensatz ist groß.

Du schaust dir die Zahlen an, die Diagramme, und fühlst etwas zwischen „interessant" und „nicht sicher, ob ich tiefer gehen will." Modellieren braucht Zeit — du musst dich wirklich hinsetzen und Spalte für Spalte analysieren. Nicht etwas, wofür dir die Fähigkeit fehlt, aber du bist nicht sicher, ob es das ist, was du am meisten tun willst.

Du schaust eine Weile, notierst ein paar Beobachtungen und wartest ab, was die nächste Aufgabe bringt.`,

        fr: `Le jeu de données est volumineux.

Tu regardes les chiffres, les graphiques, et ressens quelque chose entre « intéressant » et « pas sûr de vouloir approfondir ». La modélisation prend du temps — elle exige de s'asseoir et d'analyser colonne par colonne. Pas quelque chose dont tu manques la capacité, mais tu n'es pas sûr que ce soit ce que tu veux le plus faire.

Tu regardes un moment, notes quelques observations, puis attends de voir ce que la prochaine tâche apporte.`,

        es: `El conjunto de datos es grande.

Miras los números, los gráficos, y sientes algo entre "interesante" y "no estoy seguro de querer profundizar." Modelar lleva tiempo — requiere sentarse y analizar columna por columna. No es algo para lo que te falte capacidad, pero no estás seguro de que sea lo que más quieres hacer.

Miras un rato, anotas algunas observaciones y esperas a ver qué trae la siguiente tarea.`,

        pt: `O conjunto de dados é grande.

Você olha os números, os gráficos, e sente algo entre "interessante" e "não tenho certeza se quero ir fundo." Modelagem leva tempo — exige realmente sentar e analisar coluna por coluna. Não é algo para o qual lhe falte capacidade, mas você não tem certeza se é o que mais quer fazer.

Olha por um tempo, anota algumas observações e espera para ver o que a próxima tarefa traz.`,

        it: `Il dataset è grande.

Guardi i numeri, i grafici, e provi qualcosa tra "interessante" e "non sono sicuro di voler approfondire." La modellazione richiede tempo — devi davvero sederti e analizzare colonna per colonna. Non ti manca la capacità, ma non sei sicuro che sia quello che vuoi fare di più.

Guardi per un po', annoti alcune osservazioni, poi aspetti di vedere cosa porta il prossimo compito.`,

        ru: `Набор данных большой.

Ты смотришь на цифры, на графики и чувствуешь что-то среднее между «интересно» и «не уверен, что хочу углубляться». Моделирование требует времени — нужно реально сесть и анализировать столбец за столбцом. Не то чтобы тебе не хватает способностей, но ты не уверен, что это то, чем больше всего хочешь заниматься.

Смотришь какое-то время, записываешь несколько наблюдений и ждёшь, что принесёт следующая задача.`,

        ja: `データセットは大きい。

数字やグラフを見て、「面白い」と「深入りしたいかどうか分からない」の間の感覚がある。モデリングには時間がかかる——本当に座って列ごとに分析する必要がある。能力がないわけではないが、最もやりたいことかどうか確信がない。

しばらく見て、いくつか観察を書き留め、次のタスクが何かを待つ。`,

        ko: `데이터셋이 크다.

숫자와 차트를 보며 "흥미롭다"와 "깊이 들어가고 싶은지 모르겠다" 사이의 감정을 느낀다. 모델링에는 시간이 걸린다 — 정말 앉아서 열 하나하나를 분석해야 한다. 능력이 부족한 것은 아니지만, 가장 하고 싶은 일인지는 확신이 없다.

잠시 보고, 몇 가지 관찰을 적고, 다음 작업이 뭔지 기다린다.`,
      },
      score2: {
        zh: `大量数据。预测模型。62%的准确率需要提升。

你看着那个屏幕，内心的声音很清楚：这不是我。

数据分析和建模需要你坐下来、沉进去、在数字的世界里待很久。你尊重能做这件事的人，但你不是他们中的一个。`,

        en: `Massive data. Prediction model. 62% accuracy needs improvement.

You look at the screen, and your inner voice is clear: this isn't me.

Data analysis and modeling require you to sit down, sink in, and spend a long time in the world of numbers. You respect those who can do this. You're not one of them.`,

        nl: `Enorme hoeveelheden data. Voorspellingsmodel. 62% nauwkeurigheid moet omhoog.

Je kijkt naar het scherm, en je innerlijke stem is duidelijk: dit ben ik niet.

Data-analyse en modelleren vereisen dat je gaat zitten, je erin verdiept, en lang in de wereld van cijfers doorbrengt. Je respecteert degenen die dit kunnen. Je bent er niet een van.`,

        de: `Riesige Datenmengen. Vorhersagemodell. 62% Genauigkeit muss verbessert werden.

Du schaust auf den Bildschirm, und deine innere Stimme ist klar: das bin nicht ich.

Datenanalyse und Modellierung erfordern, dass du dich hinsetzt, eintauchst und lange in der Welt der Zahlen verbringst. Du respektierst die, die das können. Du gehörst nicht zu ihnen.`,

        fr: `Données massives. Modèle prédictif. 62% de précision à améliorer.

Tu regardes l'écran, et ta voix intérieure est claire : ce n'est pas moi.

L'analyse de données et la modélisation demandent de s'asseoir, de s'immerger, et de passer longtemps dans le monde des chiffres. Tu respectes ceux qui en sont capables. Tu n'en fais pas partie.`,

        es: `Datos masivos. Modelo predictivo. 62% de precisión necesita mejorar.

Miras la pantalla, y tu voz interior es clara: esto no soy yo.

El análisis de datos y la modelización requieren sentarse, sumergirse y pasar mucho tiempo en el mundo de los números. Respetas a quienes pueden hacerlo. No eres uno de ellos.`,

        pt: `Dados massivos. Modelo preditivo. 62% de precisão precisa melhorar.

Você olha para a tela, e sua voz interior é clara: isso não sou eu.

Análise de dados e modelagem exigem sentar, mergulhar e passar muito tempo no mundo dos números. Você respeita quem consegue fazer isso. Você não é um deles.`,

        it: `Dati enormi. Modello predittivo. L'accuratezza del 62% deve migliorare.

Guardi lo schermo, e la tua voce interiore è chiara: questo non sono io.

L'analisi dati e la modellazione richiedono di sedersi, immergersi e passare molto tempo nel mondo dei numeri. Rispetti chi riesce a farlo. Non sei uno di loro.`,

        ru: `Огромные данные. Прогностическая модель. 62% точности нужно повысить.

Смотришь на экран, и внутренний голос ясен: это не я.

Анализ данных и моделирование требуют сесть, погрузиться и долго пробыть в мире чисел. Ты уважаешь тех, кто на это способен. Ты не из них.`,

        ja: `大量のデータ。予測モデル。62%の精度を改善する必要がある。

スクリーンを見て、内なる声ははっきりしている：これは自分じゃない。

データ分析とモデリングには、座って、没頭して、数字の世界に長い時間を過ごすことが必要だ。それができる人を尊敬する。でも自分はその一人ではない。`,

        ko: `방대한 데이터. 예측 모델. 62% 정확도를 높여야 한다.

화면을 보며, 내면의 목소리가 명확하다: 이건 내가 아니다.

데이터 분석과 모델링은 앉아서, 빠져들고, 숫자의 세계에서 오랜 시간을 보내야 한다. 이것을 할 수 있는 사람들을 존경한다. 하지만 나는 그 중 하나가 아니다.`,
      },
      score1: {
        zh: `你看了那个大屏幕一眼。数据、变量、模型——这些词对你来说是中性的，没有吸引力，也没有排斥感。

但「坐下来建模」这件事？完全不在你的雷达上。

你转身了。研究空间还有两个阶段。你在等一个让你真正想参与的任务。`,

        en: `You glance at the large screen. Data, variables, models — these words feel neutral to you. No pull, no push.

But "sit down and build a model"? Completely off your radar.

You turn away. The research space has two more phases. You're waiting for a task that genuinely makes you want to participate.`,

        nl: `Je werpt een blik op het grote scherm. Data, variabelen, modellen — deze woorden voelen neutraal voor je. Geen aantrekkingskracht, geen afstoting.

Maar "ga zitten en bouw een model"? Totaal niet op je radar.

Je draait je om. De onderzoeksruimte heeft nog twee fasen. Je wacht op een taak die je echt doet willen deelnemen.`,

        de: `Du wirfst einen Blick auf den großen Bildschirm. Daten, Variablen, Modelle — diese Wörter fühlen sich neutral an. Kein Sog, kein Abstoß.

Aber „hinsetzen und ein Modell bauen"? Völlig außerhalb deines Radars.

Du wendest dich ab. Der Forschungsraum hat noch zwei Phasen. Du wartest auf eine Aufgabe, bei der du wirklich mitmachen willst.`,

        fr: `Tu jettes un œil au grand écran. Données, variables, modèles — ces mots te semblent neutres. Ni attraction, ni rejet.

Mais « s'asseoir et construire un modèle » ? Complètement hors de ton radar.

Tu te détournes. L'espace de recherche a encore deux phases. Tu attends une tâche qui te donne véritablement envie de participer.`,

        es: `Echas un vistazo a la gran pantalla. Datos, variables, modelos — estas palabras te resultan neutras. Sin atracción, sin rechazo.

¿Pero "sentarse y construir un modelo"? Completamente fuera de tu radar.

Te das la vuelta. El espacio de investigación tiene dos fases más. Esperas una tarea que genuinamente te haga querer participar.`,

        pt: `Você olha para a tela grande. Dados, variáveis, modelos — essas palavras soam neutras. Sem atração, sem repulsa.

Mas "sentar e construir um modelo"? Completamente fora do seu radar.

Você se vira. O espaço de pesquisa tem mais duas fases. Você está esperando uma tarefa que genuinamente faça você querer participar.`,

        it: `Dai un'occhiata al grande schermo. Dati, variabili, modelli — queste parole ti sembrano neutre. Nessuna attrazione, nessuna repulsione.

Ma "sedersi e costruire un modello"? Completamente fuori dal tuo radar.

Ti volti. Lo spazio di ricerca ha ancora due fasi. Aspetti un compito che ti faccia davvero venire voglia di partecipare.`,

        ru: `Бросаешь взгляд на большой экран. Данные, переменные, модели — эти слова для тебя нейтральны. Ни тяги, ни отторжения.

Но «сесть и построить модель»? Полностью за пределами твоего внимания.

Отворачиваешься. В исследовательском пространстве ещё две фазы. Ты ждёшь задачу, которая по-настоящему заставит хотеть участвовать.`,

        ja: `大スクリーンをちらりと見る。データ、変数、モデル——これらの言葉は中立的に感じる。引きつけもしないし、押し返しもしない。

でも「座ってモデルを構築する」？完全にレーダーの外だ。

目を逸らす。研究空間にはあと二つのフェーズがある。本当に参加したいと思わせるタスクを待っている。`,

        ko: `대형 스크린을 흘끗 본다. 데이터, 변수, 모델 — 이 단어들은 중립적으로 느껴진다. 끌림도 없고, 밀침도 없다.

하지만 "앉아서 모델을 만들라"? 완전히 레이더 밖이다.

돌아선다. 연구 공간에는 두 단계가 더 있다. 진정으로 참여하고 싶게 만드는 작업을 기다리고 있다.`,
      },
    },
  },

  // ── Q9: Develop a new medicine (高潮题) ────────────────────
  {
    id: 9,
    riasec: "I",
    miniIpCode: "I1",
    miniIpItem: "Develop a new medicine",
    chapter: "laboratory",
    chapterIndex: 2,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `你建立的模型给出了一个出乎意料的预测：那个异常不是错误——它指向一种尚未被发现的反应路径。如果条件控制得当，有可能合成一种全新的化合物。

上一批人没有走到这一步。他们的研究停在数据分析。你们比他们更进了一步。

屏幕出现了一条新指令，字体比之前更大：
「研究阶段四：核心突破。基于已有实验数据和预测模型，设计并尝试合成一种新化合物。这是本研究项目的最终目标。」

实验台上，所有原料和设备都准备好了。但没有配方——因为这是一种从未被合成过的东西。需要有人基于之前所有的研究成果，设计配方、计算比例、选择合成路径、实际操作，尝试创造一种新的东西。

Mia 转过身，看着所有人：「这不是重复实验了。这是发明。不一样。」

她眼里有某种你之前没见过的光。也有某种你之前没见过的犹豫。`,

      en: `The model you built yields a surprising prediction: the anomaly isn't an error — it points to an undiscovered reaction pathway. Under the right conditions, it might be possible to synthesize an entirely new compound.

The last group never got this far. Their research stopped at data analysis. You've gone one step further.

A new instruction appears on screen, in larger font:
"Research Phase Four: Core Breakthrough. Based on the existing data and prediction model, design and attempt to synthesize a new compound. This is the ultimate goal of this research project."

All necessary materials and equipment are ready on the bench. But there's no formula — this substance has never been synthesized before. Someone needs to take everything learned so far, design a formula, calculate ratios, choose a synthesis path, and actually try to create something new.

Mia turns to face everyone: "This isn't just repeating experiments anymore. This is invention. Different."

Her eyes hold a light you haven't seen before. And a hesitation you haven't seen before.`,

      nl: `Het model dat je hebt gebouwd geeft een verrassende voorspelling: de anomalie is geen fout — het wijst naar een nog niet ontdekt reactiepad. Onder de juiste omstandigheden zou het mogelijk zijn om een geheel nieuwe verbinding te synthetiseren.

De vorige groep is hier nooit gekomen. Hun onderzoek stopte bij de data-analyse. Jullie zijn een stap verder.

Een nieuwe instructie verschijnt op het scherm, in groter lettertype:
"Onderzoeksfase vier: Kerndoorbraak. Ontwerp en probeer een nieuwe verbinding te synthetiseren op basis van bestaande experimentele gegevens en het voorspellingsmodel. Dit is het uiteindelijke doel van dit onderzoeksproject."

Alle benodigde materialen en apparatuur staan klaar op de werktafel. Maar er is geen formule — want deze stof is nog nooit gesynthetiseerd. Iemand moet alles wat tot nu toe geleerd is gebruiken, een formule ontwerpen, verhoudingen berekenen, een syntheseroute kiezen en echt proberen iets nieuws te creëren.

Mia draait zich om naar iedereen: "Dit is niet langer experimenten herhalen. Dit is uitvinding. Anders."

Haar ogen hebben een licht dat je eerder niet hebt gezien. En een aarzeling die je eerder niet hebt gezien.`,

      de: `Das Modell, das du gebaut hast, liefert eine überraschende Vorhersage: Die Anomalie ist kein Fehler — sie weist auf einen unentdeckten Reaktionsweg hin. Unter den richtigen Bedingungen könnte es möglich sein, eine völlig neue Verbindung zu synthetisieren.

Die letzte Gruppe kam nie so weit. Ihre Forschung endete bei der Datenanalyse. Ihr seid einen Schritt weiter.

Eine neue Anweisung erscheint auf dem Bildschirm, in größerer Schrift:
„Forschungsphase Vier: Kerndurchbruch. Entwerfen und versuchen Sie auf Grundlage bestehender Experimentaldaten und des Vorhersagemodells eine neue Verbindung zu synthetisieren. Dies ist das ultimative Ziel dieses Forschungsprojekts."

Alle notwendigen Materialien und Geräte stehen auf dem Labortisch bereit. Aber es gibt keine Formel — denn diese Substanz wurde noch nie synthetisiert. Jemand muss alles Gelernte zusammennehmen, eine Formel entwerfen, Verhältnisse berechnen, einen Syntheseweg wählen und tatsächlich versuchen, etwas Neues zu schaffen.

Mia dreht sich zu allen um: „Das ist nicht mehr nur Experimente wiederholen. Das ist Erfindung. Anders."

Ihre Augen zeigen ein Licht, das du vorher nicht gesehen hast. Und ein Zögern, das du vorher nicht gesehen hast.`,

      fr: `Le modèle que tu as construit donne une prédiction surprenante : l'anomalie n'est pas une erreur — elle pointe vers une voie réactionnelle encore inconnue. Dans les bonnes conditions, il serait possible de synthétiser un composé entièrement nouveau.

Le groupe précédent n'est jamais allé aussi loin. Leur recherche s'est arrêtée à l'analyse de données. Vous êtes allés un pas plus loin.

Une nouvelle instruction apparaît à l'écran, en plus gros caractères :
« Phase de recherche quatre : Percée fondamentale. Sur la base des données expérimentales existantes et du modèle prédictif, concevez et tentez de synthétiser un nouveau composé. C'est l'objectif ultime de ce projet de recherche. »

Tous les matériaux et équipements nécessaires sont prêts sur la paillasse. Mais il n'y a pas de formule — car cette substance n'a jamais été synthétisée. Quelqu'un doit prendre tout ce qui a été appris, concevoir une formule, calculer les proportions, choisir une voie de synthèse et essayer réellement de créer quelque chose de nouveau.

Mia se tourne vers tout le monde : « Ce n'est plus simplement répéter des expériences. C'est de l'invention. Différent. »

Ses yeux portent une lumière que tu n'avais jamais vue. Et une hésitation que tu n'avais jamais vue.`,

      es: `El modelo que construiste arroja una predicción sorprendente: la anomalía no es un error — señala una ruta de reacción aún no descubierta. Bajo las condiciones correctas, podría ser posible sintetizar un compuesto completamente nuevo.

El grupo anterior nunca llegó tan lejos. Su investigación se detuvo en el análisis de datos. Ustedes han ido un paso más allá.

Una nueva instrucción aparece en pantalla, en letra más grande:
"Fase de investigación cuatro: Avance fundamental. Basándose en los datos experimentales existentes y el modelo predictivo, diseñe e intente sintetizar un nuevo compuesto. Este es el objetivo final de este proyecto de investigación."

Todos los materiales y equipos necesarios están listos en la mesa. Pero no hay fórmula — porque esta sustancia nunca ha sido sintetizada. Alguien necesita tomar todo lo aprendido, diseñar una fórmula, calcular proporciones, elegir una ruta de síntesis e intentar realmente crear algo nuevo.

Mia se vuelve hacia todos: "Esto ya no es repetir experimentos. Esto es invención. Diferente."

Sus ojos tienen una luz que no habías visto antes. Y una vacilación que no habías visto antes.`,

      pt: `O modelo que você construiu produz uma previsão surpreendente: a anomalia não é um erro — aponta para uma via de reação ainda não descoberta. Sob as condições certas, pode ser possível sintetizar um composto inteiramente novo.

O grupo anterior nunca chegou tão longe. A pesquisa deles parou na análise de dados. Vocês foram um passo além.

Uma nova instrução aparece na tela, em fonte maior:
"Fase de pesquisa quatro: Avanço fundamental. Com base nos dados experimentais existentes e no modelo preditivo, projete e tente sintetizar um novo composto. Este é o objetivo final deste projeto de pesquisa."

Todos os materiais e equipamentos necessários estão prontos na bancada. Mas não há fórmula — porque esta substância nunca foi sintetizada. Alguém precisa pegar tudo que foi aprendido, projetar uma fórmula, calcular proporções, escolher uma rota de síntese e realmente tentar criar algo novo.

Mia se vira para todos: "Isso não é mais repetir experimentos. Isso é invenção. Diferente."

Seus olhos carregam uma luz que você não tinha visto antes. E uma hesitação que você não tinha visto antes.`,

      it: `Il modello che hai costruito produce una previsione sorprendente: l'anomalia non è un errore — punta verso un percorso di reazione non ancora scoperto. Nelle condizioni giuste, potrebbe essere possibile sintetizzare un composto del tutto nuovo.

Il gruppo precedente non è mai arrivato così lontano. La loro ricerca si è fermata all'analisi dei dati. Voi siete andati un passo oltre.

Una nuova istruzione appare sullo schermo, in caratteri più grandi:
"Fase di ricerca quattro: Svolta fondamentale. Sulla base dei dati sperimentali esistenti e del modello predittivo, progettate e tentate di sintetizzare un nuovo composto. Questo è l'obiettivo finale di questo progetto di ricerca."

Tutti i materiali e le attrezzature necessari sono pronti sul banco. Ma non c'è formula — perché questa sostanza non è mai stata sintetizzata. Qualcuno deve prendere tutto ciò che è stato appreso, progettare una formula, calcolare le proporzioni, scegliere un percorso di sintesi e provare davvero a creare qualcosa di nuovo.

Mia si volta verso tutti: "Questo non è più ripetere esperimenti. Questo è invenzione. Diverso."

I suoi occhi hanno una luce che non avevi visto prima. E un'esitazione che non avevi visto prima.`,

      ru: `Модель, которую ты построил, даёт неожиданный прогноз: аномалия — не ошибка, она указывает на ещё не открытый реакционный путь. При правильных условиях возможно синтезировать совершенно новое соединение.

Прошлая группа до этого не дошла. Их исследование остановилось на анализе данных. Вы продвинулись на шаг дальше.

На экране появляется новая инструкция, крупным шрифтом:
«Фаза исследования четвёртая: Ключевой прорыв. На основе имеющихся экспериментальных данных и прогностической модели спроектируйте и попытайтесь синтезировать новое соединение. Это конечная цель данного исследовательского проекта.»

Все необходимые материалы и оборудование готовы на столе. Но формулы нет — потому что это вещество никогда не синтезировалось. Кому-то нужно взять всё, что было изучено, разработать формулу, рассчитать пропорции, выбрать путь синтеза и реально попытаться создать что-то новое.

Мия поворачивается ко всем: «Это уже не повторение экспериментов. Это изобретение. Другое дело.»

В её глазах свет, которого ты раньше не видел. И нерешительность, которой раньше не видел.`,

      ja: `構築したモデルが驚くべき予測を導き出す：異常はエラーではない——まだ発見されていない反応経路を示している。条件を正しく制御すれば、まったく新しい化合物を合成できるかもしれない。

前のグループはここまで来なかった。彼らの研究はデータ分析の段階で止まっていた。あなたたちは一歩先に進んだ。

スクリーンに新しい指示が、より大きなフォントで現れる：
「研究フェーズ4：核心的突破。既存の実験データと予測モデルに基づき、新しい化合物の合成を設計し試みてください。これがこの研究プロジェクトの最終目標です。」

必要な材料と機器はすべて実験台に準備されている。しかしレシピはない——この物質はこれまで一度も合成されたことがないからだ。誰かがこれまでの研究成果をすべて踏まえ、配合を設計し、比率を計算し、合成ルートを選び、実際に新しいものを作り出す必要がある。

ミアが全員の方を向く：「もう実験の繰り返しじゃない。これは発明。別物よ。」

彼女の目には見たことのない光がある。そして見たことのない躊躇もある。`,

      ko: `당신이 구축한 모델이 놀라운 예측을 내놓는다: 이상은 오류가 아니라 — 아직 발견되지 않은 반응 경로를 가리킨다. 적절한 조건 하에서, 완전히 새로운 화합물을 합성할 수 있을지도 모른다.

이전 그룹은 여기까지 오지 못했다. 그들의 연구는 데이터 분석 단계에서 멈췄다. 당신들은 한 걸음 더 나아갔다.

더 큰 글씨로 새로운 지시가 화면에 나타난다:
"연구 4단계: 핵심 돌파. 기존 실험 데이터와 예측 모델을 기반으로, 새로운 화합물의 합성을 설계하고 시도하십시오. 이것이 이 연구 프로젝트의 궁극적 목표입니다."

필요한 모든 재료와 장비가 실험대에 준비되어 있다. 하지만 배합은 없다 — 이 물질은 한 번도 합성된 적이 없기 때문이다. 누군가가 지금까지 배운 모든 것을 가져다가, 배합을 설계하고, 비율을 계산하고, 합성 경로를 선택하고, 실제로 새로운 것을 만들어 보아야 한다.

미아가 모두를 돌아본다: "이건 더 이상 실험을 반복하는 게 아니야. 이건 발명이야. 달라."

그녀의 눈에 전에는 보지 못한 빛이 있다. 그리고 전에는 보지 못한 망설임도 있다.`,
    },
    taskDescription: {
      zh: "基于研究成果设计配方，尝试研发和合成一种全新的化合物。没有现成的方案可参考——这是一次原创研究。这项任务需要一个主要负责人。",

      en: `Based on the research findings, design a formula and attempt to develop and synthesize an entirely new compound. No existing protocol to reference — this is original research. This task needs one primary person.`,

      nl: "Ontwerp op basis van de onderzoeksresultaten een formule en probeer een geheel nieuwe verbinding te ontwikkelen en synthetiseren. Geen bestaand protocol als referentie — dit is origineel onderzoek. Deze taak heeft één hoofdverantwoordelijke nodig.",

      de: "Entwerfen Sie auf Grundlage der Forschungsergebnisse eine Formel und versuchen Sie, eine völlig neue Verbindung zu entwickeln und zu synthetisieren. Kein bestehendes Protokoll als Referenz — dies ist Originalforschung. Diese Aufgabe braucht eine hauptverantwortliche Person.",

      fr: "Sur la base des résultats de recherche, concevez une formule et tentez de développer et synthétiser un composé entièrement nouveau. Aucun protocole existant comme référence — c'est de la recherche originale. Cette tâche nécessite un responsable principal.",

      es: "Basándose en los hallazgos de investigación, diseñe una fórmula e intente desarrollar y sintetizar un compuesto completamente nuevo. Sin protocolo existente como referencia — esto es investigación original. Esta tarea necesita una persona responsable principal.",

      pt: "Com base nos resultados da pesquisa, projete uma fórmula e tente desenvolver e sintetizar um composto inteiramente novo. Sem protocolo existente como referência — esta é pesquisa original. Esta tarefa precisa de uma pessoa principal responsável.",

      it: "Sulla base dei risultati della ricerca, progettate una formula e tentate di sviluppare e sintetizzare un composto del tutto nuovo. Nessun protocollo esistente come riferimento — questa è ricerca originale. Questo compito richiede un responsabile principale.",

      ru: "На основе результатов исследования разработайте формулу и попытайтесь создать и синтезировать совершенно новое соединение. Нет готового протокола — это оригинальное исследование. Для этой задачи нужен один главный ответственный.",

      ja: "研究成果に基づき、配合を設計し、まったく新しい化合物の開発と合成を試みる。参照できる既存のプロトコルはない——これはオリジナル研究です。この作業には主担当者が一人必要です。",

      ko: "연구 결과를 바탕으로 배합을 설계하고, 완전히 새로운 화합물의 개발과 합성을 시도한다. 참고할 기존 프로토콜 없음 — 이것은 독창적 연구입니다. 이 작업에는 주 담당자 한 명이 필요합니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `「发明。」Mia 说出这个词的时候，你脑子里已经在运转了。

之前所有的数据、实验、模型——它们在你脑海里重新排列组合，指向一个尚未成型但隐约可见的方向。反应路径有几种可能，你需要选一条最有希望的，然后设计实验来验证。

没有配方。没有先例。只有你、数据、和一个假说。

这是你等了最久的时刻。你走向实验台，开始在白纸上画出你的合成路径。`,

        en: `"Invention." The moment Mia says the word, your mind is already running.

All the previous data, experiments, models — they're rearranging themselves in your head, pointing toward a direction that's not yet formed but faintly visible. Several possible reaction pathways exist. You need to pick the most promising one and design an experiment to verify it.

No formula. No precedent. Just you, the data, and a hypothesis.

This is the moment you've been waiting for the longest. You walk to the bench and start sketching your synthesis pathway on blank paper.`,

        nl: `"Uitvinding." Op het moment dat Mia het woord uitspreekt, draait je hoofd al op volle toeren.

Alle eerdere data, experimenten, modellen — ze herrangschikken zich in je hoofd, wijzend naar een richting die nog niet gevormd is maar vaag zichtbaar. Meerdere mogelijke reactiepaden bestaan. Je moet het meest veelbelovende kiezen en een experiment ontwerpen om het te verifiëren.

Geen formule. Geen precedent. Alleen jij, de gegevens, en een hypothese.

Dit is het moment waar je het langst op hebt gewacht. Je loopt naar de werktafel en begint je syntheseroute op blanco papier te schetsen.`,

        de: `„Erfindung." In dem Moment, als Mia das Wort sagt, läuft dein Kopf bereits.

Alle bisherigen Daten, Experimente, Modelle — sie ordnen sich in deinem Kopf neu an, deuten auf eine Richtung hin, die noch nicht geformt, aber vage sichtbar ist. Mehrere mögliche Reaktionswege existieren. Du musst den vielversprechendsten wählen und ein Experiment zu seiner Verifizierung entwerfen.

Keine Formel. Kein Präzedenzfall. Nur du, die Daten und eine Hypothese.

Das ist der Moment, auf den du am längsten gewartet hast. Du gehst zum Labortisch und beginnst deinen Syntheseweg auf leeres Papier zu skizzieren.`,

        fr: `« Invention. » Au moment où Mia prononce le mot, ton esprit tourne déjà.

Toutes les données précédentes, expériences, modèles — ils se réorganisent dans ta tête, pointant vers une direction pas encore formée mais vaguement visible. Plusieurs voies réactionnelles possibles existent. Tu dois choisir la plus prometteuse et concevoir une expérience pour la vérifier.

Pas de formule. Pas de précédent. Juste toi, les données et une hypothèse.

C'est le moment que tu attendais depuis le plus longtemps. Tu vas à la paillasse et commences à esquisser ta voie de synthèse sur du papier vierge.`,

        es: `"Invención." En el momento en que Mia dice la palabra, tu mente ya está funcionando.

Todos los datos anteriores, experimentos, modelos — se reorganizan en tu cabeza, apuntando hacia una dirección aún no formada pero vagamente visible. Varias rutas de reacción posibles existen. Necesitas elegir la más prometedora y diseñar un experimento para verificarla.

Sin fórmula. Sin precedente. Solo tú, los datos y una hipótesis.

Este es el momento que más tiempo has estado esperando. Caminas hacia la mesa y comienzas a esbozar tu ruta de síntesis en papel en blanco.`,

        pt: `"Invenção." No momento em que Mia diz a palavra, sua mente já está rodando.

Todos os dados anteriores, experimentos, modelos — estão se reorganizando na sua cabeça, apontando para uma direção ainda não formada mas vagamente visível. Várias rotas de reação possíveis existem. Você precisa escolher a mais promissora e projetar um experimento para verificá-la.

Sem fórmula. Sem precedente. Apenas você, os dados e uma hipótese.

Este é o momento que você esperou por mais tempo. Você vai até a bancada e começa a esboçar sua rota de síntese em papel em branco.`,

        it: `"Invenzione." Nel momento in cui Mia dice la parola, la tua mente è già in moto.

Tutti i dati precedenti, esperimenti, modelli — si riorganizzano nella tua testa, puntando verso una direzione non ancora formata ma vagamente visibile. Esistono diversi possibili percorsi di reazione. Devi scegliere il più promettente e progettare un esperimento per verificarlo.

Nessuna formula. Nessun precedente. Solo tu, i dati e un'ipotesi.

Questo è il momento che aspettavi da più tempo. Ti avvicini al banco e inizi a schizzare il tuo percorso di sintesi su carta bianca.`,

        ru: `«Изобретение.» В тот момент, когда Мия произносит это слово, твой разум уже работает.

Все предыдущие данные, эксперименты, модели — они перестраиваются в голове, указывая на направление, ещё не оформившееся, но смутно видимое. Несколько возможных реакционных путей. Нужно выбрать самый перспективный и спроектировать эксперимент для проверки.

Нет формулы. Нет прецедента. Только ты, данные и гипотеза.

Это момент, которого ты ждал дольше всего. Ты подходишь к столу и начинаешь чертить путь синтеза на чистом листе.`,

        ja: `「発明。」ミアがその言葉を口にした瞬間、頭はすでに動いている。

これまでのすべてのデータ、実験、モデル——それらが頭の中で再配列され、まだ形になっていないが微かに見える方向を示す。いくつかの反応経路が考えられる。最も有望なものを選び、検証する実験を設計する必要がある。

配合はない。前例もない。あるのは自分とデータと仮説だけ。

これが最も長く待っていた瞬間だ。実験台に向かい、白紙に合成ルートを描き始める。`,

        ko: `"발명." 미아가 그 단어를 말하는 순간, 머릿속은 이미 돌아가고 있다.

이전의 모든 데이터, 실험, 모델 — 그것들이 머릿속에서 재배열되며, 아직 형성되지 않았지만 희미하게 보이는 방향을 가리킨다. 여러 가능한 반응 경로가 있다. 가장 유망한 것을 선택하고, 이를 검증할 실험을 설계해야 한다.

배합 없음. 선례 없음. 오직 나, 데이터, 그리고 가설뿐.

가장 오래 기다려 온 순간이다. 실험대로 걸어가 빈 종이에 합성 경로를 스케치하기 시작한다.`,
      },
      score4: {
        zh: `从重复到发明——这个跨越让你停了一秒。

但只是一秒。你回头看了看之前的数据和模型，心里开始构建一条可能的路径。不确定能不能成功，但方向是有的。

你走到实验台前，拿起笔，开始画配方的草案。Mia 在旁边看着，偶尔指出一个你没注意到的变量。

原创研究。不确定性很高。但你想试。`,

        en: `From repetition to invention — the leap gives you a one-second pause.

But only one second. You look back at the earlier data and models, and a possible path starts forming in your mind. Not certain it'll work, but there's a direction.

You walk to the bench, pick up a pen, and start drafting a formula. Mia is beside you, occasionally pointing out a variable you'd missed.

Original research. High uncertainty. But you want to try.`,

        nl: `Van herhaling naar uitvinding — die sprong geeft je een seconde pauze.

Maar slechts één seconde. Je kijkt terug naar de eerdere gegevens en modellen, en een mogelijk pad begint zich te vormen in je hoofd. Niet zeker dat het zal werken, maar er is een richting.

Je loopt naar de werktafel, pakt een pen en begint een conceptformule te schetsen. Mia staat naast je en wijst af en toe op een variabele die je had gemist.

Origineel onderzoek. Grote onzekerheid. Maar je wilt het proberen.`,

        de: `Von Wiederholung zu Erfindung — der Sprung lässt dich eine Sekunde innehalten.

Aber nur eine Sekunde. Du schaust auf die früheren Daten und Modelle zurück, und ein möglicher Weg formt sich in deinem Kopf. Nicht sicher, ob es funktioniert, aber es gibt eine Richtung.

Du gehst zum Labortisch, nimmst einen Stift und beginnst einen Formelentwurf zu skizzieren. Mia steht neben dir und weist gelegentlich auf eine Variable hin, die du übersehen hattest.

Originalforschung. Hohe Unsicherheit. Aber du willst es versuchen.`,

        fr: `De la répétition à l'invention — ce saut te fait marquer une pause d'une seconde.

Mais une seconde seulement. Tu regardes en arrière les données et modèles précédents, et un chemin possible commence à se former dans ta tête. Pas certain que ça marchera, mais il y a une direction.

Tu vas à la paillasse, prends un stylo et commences à ébaucher une formule. Mia est à côté, signalant de temps en temps une variable que tu avais manquée.

Recherche originale. Grande incertitude. Mais tu veux essayer.`,

        es: `De repetición a invención — el salto te detiene un segundo.

Pero solo un segundo. Miras hacia atrás los datos y modelos anteriores, y un camino posible empieza a formarse en tu mente. No estás seguro de que funcione, pero hay una dirección.

Caminas hacia la mesa, tomas un bolígrafo y empiezas a esbozar una fórmula. Mia está a tu lado, señalando ocasionalmente una variable que habías pasado por alto.

Investigación original. Alta incertidumbre. Pero quieres intentarlo.`,

        pt: `De repetição a invenção — o salto te faz parar por um segundo.

Mas apenas um segundo. Você olha para os dados e modelos anteriores, e um caminho possível começa a se formar na sua mente. Não tem certeza se vai funcionar, mas há uma direção.

Você vai até a bancada, pega uma caneta e começa a esboçar uma fórmula. Mia está ao lado, ocasionalmente apontando uma variável que você não tinha notado.

Pesquisa original. Alta incerteza. Mas você quer tentar.`,

        it: `Dalla ripetizione all'invenzione — il salto ti fa fermare per un secondo.

Ma solo un secondo. Guardi indietro ai dati e modelli precedenti, e un possibile percorso inizia a formarsi nella tua mente. Non sei certo che funzionerà, ma c'è una direzione.

Ti avvicini al banco, prendi una penna e inizi a schizzare una formula. Mia è accanto a te, indicando occasionalmente una variabile che ti era sfuggita.

Ricerca originale. Alta incertezza. Ma vuoi provare.`,

        ru: `От повторения к изобретению — этот скачок заставляет тебя замереть на секунду.

Но только на секунду. Ты оглядываешься на предыдущие данные и модели, и возможный путь начинает формироваться в голове. Не уверен, сработает ли, но направление есть.

Идёшь к столу, берёшь ручку и начинаешь набрасывать черновик формулы. Мия рядом, иногда указывает на переменную, которую ты упустил.

Оригинальное исследование. Высокая неопределённость. Но ты хочешь попробовать.`,

        ja: `繰り返しから発明へ——この飛躍に一秒だけ立ち止まる。

でも一秒だけ。以前のデータとモデルを振り返ると、可能な道筋が頭の中で形成され始める。うまくいくか確信はないが、方向性はある。

実験台に向かい、ペンを取り、配合の草案を描き始める。ミアが隣にいて、時折見落としていた変数を指摘する。

オリジナル研究。不確実性が高い。でもやってみたい。`,

        ko: `반복에서 발명으로 — 이 도약에 1초 멈춘다.

하지만 1초뿐이다. 이전의 데이터와 모델을 돌아보면, 가능한 경로가 머릿속에서 형성되기 시작한다. 성공할지 확신은 없지만, 방향은 있다.

실험대로 걸어가 펜을 들고 배합 초안을 그리기 시작한다. 미아가 옆에서 때때로 놓친 변수를 지적한다.

독창적 연구. 높은 불확실성. 하지만 시도하고 싶다.`,
      },
      score3: {
        zh: `原创研究。没有配方。

你站在实验台前，感觉和之前几项任务不一样了。之前的工作都有参考——实验方案、数据、手册。但这次什么都没有。

你对这件事不排斥，但也不确定自己是不是合适的人选。你看了看 Mia，又看了看那些原料。

也许你可以辅助，提供一些想法。但主导……你需要再想想。`,

        en: `Original research. No formula.

You stand at the bench, feeling different from the previous tasks. Before, there were always references — protocols, data, manuals. This time, nothing.

You're not averse to this, but you're not sure you're the right person. You look at Mia, then at the materials.

Maybe you can assist, contribute some ideas. But take the lead... you need to think about it.`,

        nl: `Origineel onderzoek. Geen formule.

Je staat bij de werktafel en voelt dat dit anders is dan de vorige taken. Eerder waren er altijd referenties — protocollen, gegevens, handboeken. Dit keer niets.

Je bent er niet afkerig van, maar je weet niet zeker of jij de juiste persoon bent. Je kijkt naar Mia, dan naar de materialen.

Misschien kun je assisteren, wat ideeën aandragen. Maar de leiding nemen... daar moet je over nadenken.`,

        de: `Originalforschung. Keine Formel.

Du stehst am Labortisch und spürst, dass dies anders ist als die vorherigen Aufgaben. Zuvor gab es immer Referenzen — Protokolle, Daten, Handbücher. Diesmal nichts.

Du bist nicht abgeneigt, aber nicht sicher, ob du die richtige Person bist. Du schaust Mia an, dann die Materialien.

Vielleicht kannst du unterstützen, ein paar Ideen beisteuern. Aber die Führung übernehmen... das musst du dir überlegen.`,

        fr: `Recherche originale. Pas de formule.

Tu te tiens devant la paillasse, sentant que c'est différent des tâches précédentes. Avant, il y avait toujours des références — protocoles, données, manuels. Cette fois, rien.

Tu n'es pas contre, mais tu n'es pas sûr d'être la bonne personne. Tu regardes Mia, puis les matériaux.

Peut-être peux-tu assister, contribuer quelques idées. Mais prendre la direction... il faut y réfléchir.`,

        es: `Investigación original. Sin fórmula.

Estás de pie frente a la mesa, sintiendo que esto es diferente de las tareas anteriores. Antes siempre había referencias — protocolos, datos, manuales. Esta vez, nada.

No te opones, pero no estás seguro de ser la persona adecuada. Miras a Mia, luego los materiales.

Quizás puedas asistir, aportar algunas ideas. Pero tomar el liderazgo... necesitas pensarlo.`,

        pt: `Pesquisa original. Sem fórmula.

Você está de pé na bancada, sentindo que isso é diferente das tarefas anteriores. Antes, sempre havia referências — protocolos, dados, manuais. Desta vez, nada.

Você não é avesso, mas não tem certeza de ser a pessoa certa. Olha para Mia, depois para os materiais.

Talvez possa ajudar, contribuir com algumas ideias. Mas liderar... precisa pensar sobre isso.`,

        it: `Ricerca originale. Nessuna formula.

Sei in piedi al banco, sentendo che è diverso dai compiti precedenti. Prima c'erano sempre riferimenti — protocolli, dati, manuali. Questa volta, niente.

Non sei contrario, ma non sei sicuro di essere la persona giusta. Guardi Mia, poi i materiali.

Forse puoi assistere, contribuire con qualche idea. Ma prendere la guida... devi pensarci.`,

        ru: `Оригинальное исследование. Нет формулы.

Стоишь у стола и чувствуешь, что это отличается от предыдущих задач. Раньше всегда были ориентиры — протоколы, данные, справочники. На этот раз — ничего.

Ты не против, но не уверен, что ты подходящий человек. Смотришь на Мию, потом на материалы.

Может, можешь помочь, подкинуть идей. Но взять на себя ведущую роль... нужно подумать.`,

        ja: `オリジナル研究。配合なし。

実験台の前に立つと、これまでのタスクとは違うと感じる。以前は常に参照があった——プロトコル、データ、マニュアル。今回は何もない。

嫌ではないが、自分が適任かどうか確信がない。ミアを見て、それから材料を見る。

サポートならできるかもしれない、いくつかアイデアを出すことも。でもリードを取るのは……考える必要がある。`,

        ko: `독창적 연구. 배합 없음.

실험대 앞에 서면, 이전 작업들과는 다르다는 걸 느낀다. 전에는 항상 참고할 것이 있었다 — 프로토콜, 데이터, 매뉴얼. 이번에는 아무것도 없다.

반감은 없지만, 자신이 적임자인지 확신이 없다. 미아를 보고, 재료를 본다.

보조할 수는 있을 것이다, 아이디어를 몇 가지 내놓는 것도. 하지만 주도하는 것은... 생각해 봐야 한다.`,
      },
      score2: {
        zh: `「这是发明。不一样。」

Mia 说的没错。这确实不一样——不一样到你很清楚这不是你的领域。设计一个从未存在过的配方，在不确定性中做判断……这种工作需要的那种智识上的冒险精神，你此刻感觉不到。

你退后了。让真正兴奋的人去做。`,

        en: `"This is invention. Different."

Mia's right. It is different — different enough that you're certain it's not your domain. Designing a formula that's never existed, making judgments in uncertainty... this requires an intellectual adventurousness that you can't feel right now.

You step back. Let the truly excited ones take this.`,

        nl: `"Dit is uitvinding. Anders."

Mia heeft gelijk. Het is anders — anders genoeg dat je zeker weet dat het niet jouw domein is. Een formule ontwerpen die nooit heeft bestaan, oordelen vormen in onzekerheid... dit vereist een intellectuele avontuurlijkheid die je nu niet voelt.

Je doet een stap terug. Laat degenen die echt enthousiast zijn dit doen.`,

        de: `„Das ist Erfindung. Anders."

Mia hat recht. Es ist anders — anders genug, dass du sicher bist, dass es nicht dein Gebiet ist. Eine Formel zu entwerfen, die nie existiert hat, Urteile unter Unsicherheit zu fällen... das erfordert einen intellektuellen Abenteuersinn, den du gerade nicht spürst.

Du trittst zurück. Lass die wirklich Begeisterten das übernehmen.`,

        fr: `« C'est de l'invention. Différent. »

Mia a raison. C'est différent — suffisamment différent pour que tu sois certain que ce n'est pas ton domaine. Concevoir une formule qui n'a jamais existé, porter des jugements dans l'incertitude... cela demande une audace intellectuelle que tu ne ressens pas en ce moment.

Tu recules. Laisse les véritablement enthousiastes s'en charger.`,

        es: `"Esto es invención. Diferente."

Mia tiene razón. Es diferente — lo suficientemente diferente como para que estés seguro de que no es tu dominio. Diseñar una fórmula que nunca ha existido, tomar decisiones en la incertidumbre... esto requiere un espíritu aventurero intelectual que no puedes sentir ahora mismo.

Das un paso atrás. Deja que los verdaderamente entusiasmados se encarguen.`,

        pt: `"Isso é invenção. Diferente."

Mia está certa. É diferente — diferente o suficiente para você ter certeza de que não é seu domínio. Projetar uma fórmula que nunca existiu, fazer julgamentos na incerteza... isso requer um espírito aventureiro intelectual que você não consegue sentir agora.

Você recua. Deixe os verdadeiramente empolgados assumirem.`,

        it: `"Questo è invenzione. Diverso."

Mia ha ragione. È diverso — abbastanza diverso da farti capire che non è il tuo campo. Progettare una formula mai esistita, prendere decisioni nell'incertezza... questo richiede un'audacia intellettuale che in questo momento non riesci a sentire.

Fai un passo indietro. Lascia che siano i veramente entusiasti a occuparsene.`,

        ru: `«Это изобретение. Другое дело.»

Мия права. Это действительно другое — настолько, что ты уверен: это не твоя область. Проектировать формулу, которой никогда не существовало, принимать решения в условиях неопределённости... для этого нужен интеллектуальный авантюризм, которого ты сейчас не чувствуешь.

Ты отступаешь. Пусть те, кого это действительно зажигает, берутся.`,

        ja: `「これは発明。別物よ。」

ミアは正しい。確かに別物だ——自分の領域ではないと確信するほどに。存在したことのない配合を設計し、不確実性の中で判断を下す……今の自分にはその知的冒険心が感じられない。

一歩退く。本当に興奮している人に任せよう。`,

        ko: `"이건 발명이야. 달라."

미아가 맞다. 정말 다르다 — 이것이 자기 영역이 아니라는 확신이 들 만큼. 존재한 적 없는 배합을 설계하고, 불확실성 속에서 판단을 내리는 것... 지금은 그런 지적 모험 정신이 느껴지지 않는다.

한 걸음 물러선다. 진정으로 흥분한 사람들이 맡도록 하자.`,
      },
      score1: {
        zh: `从研究成果到原创发明——这个距离，对你来说太远了。

不是能力的问题。是那种「想去探索未知」的驱动力，你在自己身上找不到。

Mia 的眼睛在发光。你看着她，知道这件事应该是她的——或者是任何一个被这种挑战点燃的人的。不是你。`,

        en: `From research findings to original invention — that distance is too far for you.

It's not about ability. It's that the drive to "explore the unknown" simply can't be found in yourself.

Mia's eyes are shining. You watch her and know this should be hers — or anyone else ignited by this kind of challenge. Not you.`,

        nl: `Van onderzoeksresultaten naar originele uitvinding — die afstand is te ver voor jou.

Het gaat niet om vermogen. Het is dat de drang om "het onbekende te verkennen" simpelweg niet in jezelf te vinden is.

Mia's ogen stralen. Je kijkt naar haar en weet dat dit van haar zou moeten zijn — of van iedereen die door dit soort uitdaging wordt aangestoken. Niet van jou.`,

        de: `Von Forschungsergebnissen zu origineller Erfindung — diese Distanz ist zu weit für dich.

Es geht nicht um Fähigkeit. Es ist, dass der Antrieb, „das Unbekannte zu erforschen", in dir einfach nicht zu finden ist.

Mias Augen leuchten. Du beobachtest sie und weißt, das sollte ihres sein — oder das von jedem, der von dieser Art Herausforderung entfacht wird. Nicht deines.`,

        fr: `Des résultats de recherche à l'invention originale — cette distance est trop grande pour toi.

Ce n'est pas une question de capacité. C'est que l'élan d'« explorer l'inconnu » est tout simplement introuvable en toi.

Les yeux de Mia brillent. Tu la regardes et sais que cela devrait être pour elle — ou pour quiconque s'enflamme face à ce genre de défi. Pas pour toi.`,

        es: `De los hallazgos de investigación a la invención original — esa distancia es demasiado grande para ti.

No se trata de capacidad. Es que el impulso de "explorar lo desconocido" simplemente no se encuentra en ti.

Los ojos de Mia brillan. La observas y sabes que esto debería ser suyo — o de cualquier otro encendido por este tipo de desafío. No tuyo.`,

        pt: `De resultados de pesquisa a invenção original — essa distância é grande demais para você.

Não é sobre capacidade. É que o impulso de "explorar o desconhecido" simplesmente não se encontra em você.

Os olhos de Mia brilham. Você a observa e sabe que isso deveria ser dela — ou de qualquer pessoa inflamada por esse tipo de desafio. Não seu.`,

        it: `Dai risultati della ricerca all'invenzione originale — quella distanza è troppo grande per te.

Non è questione di capacità. È che la spinta a "esplorare l'ignoto" semplicemente non si trova in te.

Gli occhi di Mia brillano. La guardi e sai che questo dovrebbe essere suo — o di chiunque venga acceso da questo tipo di sfida. Non tuo.`,

        ru: `От результатов исследования до оригинального изобретения — эта дистанция слишком велика для тебя.

Дело не в способностях. Просто стремление «исследовать неизведанное» в тебе не находится.

Глаза Мии сияют. Ты смотришь на неё и понимаешь: это должно быть её — или чьим-то ещё, кого зажигает такой вызов. Не твоим.`,

        ja: `研究成果からオリジナルの発明へ——その距離は自分には遠すぎる。

能力の問題ではない。「未知を探求したい」という駆動力が、自分の中に見つからないのだ。

ミアの目が輝いている。彼女を見て、これは彼女のものであるべきだと分かる——あるいはこの種の挑戦に火がつく誰かの。自分のではない。`,

        ko: `연구 결과에서 독창적 발명으로 — 그 거리가 너무 멀다.

능력의 문제가 아니다. "미지를 탐구하고 싶다"는 동력이 자신 안에서 찾아지지 않는 것이다.

미아의 눈이 빛나고 있다. 그녀를 바라보며 이것은 그녀의 것이어야 한다고 안다 — 아니면 이런 도전에 불이 붙는 다른 누군가의. 당신의 것은 아니다.`,
      },
    },
  },

  // ── Q10: Study ways to reduce water pollution ──────────────
  {
    id: 10,
    riasec: "I",
    miniIpCode: "I2",
    miniIpItem: "Study ways to reduce water pollution",
    chapter: "laboratory",
    chapterIndex: 2,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `合成成功。但新化合物的初步检测揭示了一个意外发现——它对某些常见水污染物表现出极强的吸附特性。

Mia 盯着数据看了很久，然后调出了一组对照资料：「这种吸附能力……如果能搞清楚作用机制，可能对水污染治理有实际意义。」

屏幕上出现了最后一条研究任务：
「研究阶段五：环境应用研究。利用已合成化合物的特性，研究减少水污染的可行方案——测试水样、分析污染物成分、评估处理效果。成功则本研究项目标记为完成。」

实验台一端摆出了一排水样瓶，标签上写着不同的污染源：工业废水、农业径流、城市排水。旁边是过滤装置、光谱分析仪和一叠环境监测标准文件。

所有人都可参与这最后一步。Mia 已经在配制不同浓度的测试溶液了。

问题是：你对这种「研究如何减少水污染」的过程，有多大兴趣？`,

      en: `The synthesis succeeded. But preliminary testing of the new compound revealed an unexpected finding — it shows remarkably strong adsorption against certain common water pollutants.

Mia stares at the data for a long time, then pulls up reference materials: "This adsorption capacity... if we can figure out the mechanism, it could have real implications for water pollution treatment."

The final research task appears on screen:
"Research Phase Five: Environmental Application. Using the synthesized compound's properties, study feasible approaches to reducing water pollution — test water samples, analyze contaminant composition, evaluate treatment effectiveness. If successful, this research project will be marked complete."

At one end of the bench: a row of water sample bottles labeled with different pollution sources — industrial wastewater, agricultural runoff, urban drainage. Beside them: filtration equipment, a spectrometer, environmental monitoring standards.

Everyone can participate in this final step. Mia is already preparing test solutions.

The question is: how much interest do you have in this process of "studying ways to reduce water pollution"?`,

      nl: `De synthese is geslaagd. Maar voorlopige tests van de nieuwe verbinding onthulden een onverwachte bevinding — het vertoont opmerkelijk sterke adsorptie-eigenschappen tegen bepaalde veelvoorkomende waterverontreinigingen.

Mia staart lang naar de gegevens en haalt dan een reeks referentiematerialen op: "Dit adsorptievermogen... als we het mechanisme kunnen achterhalen, kan het echte implicaties hebben voor de behandeling van waterverontreiniging."

De laatste onderzoeksopdracht verschijnt op het scherm:
"Onderzoeksfase vijf: Milieutechnische toepassing. Gebruik de eigenschappen van de gesynthetiseerde verbinding om haalbare benaderingen te onderzoeken voor het verminderen van waterverontreiniging — test watermonsters, analyseer de samenstelling van verontreinigingen, evalueer de effectiviteit van behandeling. Als het lukt, wordt dit onderzoeksproject als voltooid gemarkeerd."

Aan het uiteinde van de werktafel staat een rij watermonsterflessen, gelabeld met verschillende vervuilingsbronnen: industrieel afvalwater, agrarische afspoeling, stedelijke afvoer. Ernaast staan filtratie-apparatuur, een spectrometer en een stapel milieubewakingsnormen.

Iedereen kan deelnemen aan deze laatste stap. Mia is al testoplossingen aan het bereiden in verschillende concentraties.

De vraag is: hoeveel interesse heb je in dit proces van "onderzoeken hoe waterverontreiniging verminderd kan worden"?`,

      de: `Die Synthese war erfolgreich. Aber vorläufige Tests der neuen Verbindung offenbarten einen unerwarteten Befund — sie zeigt bemerkenswert starke Adsorptionseigenschaften gegenüber bestimmten häufigen Wasserverschmutzungen.

Mia starrt lange auf die Daten und ruft dann eine Reihe von Referenzmaterialien auf: „Diese Adsorptionsfähigkeit... wenn wir den Mechanismus herausfinden können, könnte das echte Auswirkungen auf die Behandlung von Wasserverschmutzung haben."

Die letzte Forschungsaufgabe erscheint auf dem Bildschirm:
„Forschungsphase Fünf: Umweltanwendung. Nutzen Sie die Eigenschaften der synthetisierten Verbindung, um machbare Ansätze zur Reduzierung von Wasserverschmutzung zu erforschen — testen Sie Wasserproben, analysieren Sie die Zusammensetzung der Schadstoffe, bewerten Sie die Wirksamkeit der Behandlung. Bei Erfolg wird dieses Forschungsprojekt als abgeschlossen markiert."

Am Ende des Labortisches steht eine Reihe von Wasserprobenflaschen, beschriftet mit verschiedenen Verschmutzungsquellen: Industrieabwasser, landwirtschaftlicher Abfluss, städtische Entwässerung. Daneben stehen Filtrationsgeräte, ein Spektrometer und ein Stapel Umweltüberwachungsstandards.

Alle können an diesem letzten Schritt teilnehmen. Mia bereitet bereits Testlösungen in verschiedenen Konzentrationen vor.

Die Frage ist: Wie viel Interesse hast du an diesem Prozess, „Wege zur Reduzierung von Wasserverschmutzung zu erforschen"?`,

      fr: `La synthèse a réussi. Mais les tests préliminaires du nouveau composé ont révélé une découverte inattendue — il présente des propriétés d'adsorption remarquablement fortes contre certains polluants aquatiques courants.

Mia fixe les données longtemps, puis consulte un ensemble de documents de référence : « Cette capacité d'adsorption... si on peut comprendre le mécanisme, ça pourrait avoir de vraies implications pour le traitement de la pollution de l'eau. »

La dernière tâche de recherche apparaît à l'écran :
« Phase de recherche cinq : Application environnementale. En utilisant les propriétés du composé synthétisé, étudiez des approches réalisables pour réduire la pollution de l'eau — testez des échantillons d'eau, analysez la composition des contaminants, évaluez l'efficacité du traitement. En cas de succès, ce projet de recherche sera marqué comme terminé. »

À une extrémité de la paillasse, une rangée de flacons d'échantillons d'eau est disposée, étiquetés avec différentes sources de pollution : eaux usées industrielles, ruissellement agricole, drainage urbain. À côté se trouvent un équipement de filtration, un spectromètre et une pile de normes de surveillance environnementale.

Tout le monde peut participer à cette étape finale. Mia prépare déjà des solutions de test à différentes concentrations.

La question est : quel intérêt portes-tu à ce processus d'« étudier comment réduire la pollution de l'eau » ?`,

      es: `La síntesis tuvo éxito. Pero las pruebas preliminares del nuevo compuesto revelaron un hallazgo inesperado — muestra propiedades de adsorción notablemente fuertes contra ciertos contaminantes acuáticos comunes.

Mia observa los datos durante un largo rato, luego consulta un conjunto de materiales de referencia: "Esta capacidad de adsorción... si podemos descifrar el mecanismo, podría tener implicaciones reales para el tratamiento de la contaminación del agua."

La última tarea de investigación aparece en pantalla:
"Fase de investigación cinco: Aplicación ambiental. Usando las propiedades del compuesto sintetizado, estudie enfoques viables para reducir la contaminación del agua — pruebe muestras de agua, analice la composición de contaminantes, evalúe la efectividad del tratamiento. Si tiene éxito, este proyecto de investigación será marcado como completo."

En un extremo de la mesa, hay una fila de botellas de muestras de agua, etiquetadas con diferentes fuentes de contaminación: aguas residuales industriales, escorrentía agrícola, drenaje urbano. Al lado hay equipos de filtración, un espectrómetro y un montón de normas de monitoreo ambiental.

Todos pueden participar en este paso final. Mia ya está preparando soluciones de prueba a diferentes concentraciones.

La pregunta es: ¿cuánto interés tienes en este proceso de "estudiar formas de reducir la contaminación del agua"?`,

      pt: `A síntese foi bem-sucedida. Mas os testes preliminares do novo composto revelaram uma descoberta inesperada — ele apresenta propriedades de adsorção notavelmente fortes contra certos poluentes aquáticos comuns.

Mia fica olhando os dados por um longo tempo, depois consulta um conjunto de materiais de referência: "Essa capacidade de adsorção... se conseguirmos entender o mecanismo, pode ter implicações reais para o tratamento da poluição da água."

A tarefa final de pesquisa aparece na tela:
"Fase de pesquisa cinco: Aplicação ambiental. Usando as propriedades do composto sintetizado, estude abordagens viáveis para reduzir a poluição da água — teste amostras de água, analise a composição dos contaminantes, avalie a eficácia do tratamento. Se bem-sucedido, este projeto de pesquisa será marcado como concluído."

Em uma extremidade da bancada, uma fileira de frascos de amostras de água está disposta, rotulados com diferentes fontes de poluição: efluentes industriais, escoamento agrícola, drenagem urbana. Ao lado estão equipamentos de filtração, um espectrômetro e uma pilha de padrões de monitoramento ambiental.

Todos podem participar desta etapa final. Mia já está preparando soluções de teste em diferentes concentrações.

A pergunta é: quanto interesse você tem nesse processo de "estudar formas de reduzir a poluição da água"?`,

      it: `La sintesi ha avuto successo. Ma i test preliminari del nuovo composto hanno rivelato una scoperta inaspettata — mostra proprietà di adsorbimento notevolmente forti contro certi inquinanti idrici comuni.

Mia fissa i dati a lungo, poi consulta una serie di materiali di riferimento: "Questa capacità di adsorbimento... se riusciamo a capire il meccanismo, potrebbe avere implicazioni reali per il trattamento dell'inquinamento idrico."

L'ultimo compito di ricerca appare sullo schermo:
"Fase di ricerca cinque: Applicazione ambientale. Utilizzando le proprietà del composto sintetizzato, studiate approcci praticabili per ridurre l'inquinamento idrico — testate campioni d'acqua, analizzate la composizione dei contaminanti, valutate l'efficacia del trattamento. In caso di successo, questo progetto di ricerca sarà contrassegnato come completato."

A un'estremità del banco, è disposta una fila di flaconi con campioni d'acqua, etichettati con diverse fonti di inquinamento: acque reflue industriali, deflusso agricolo, scarichi urbani. Accanto ci sono attrezzature di filtrazione, uno spettrometro e una pila di standard di monitoraggio ambientale.

Tutti possono partecipare a questa fase finale. Mia sta già preparando soluzioni di test a diverse concentrazioni.

La domanda è: quanto interesse hai in questo processo di "studiare modi per ridurre l'inquinamento idrico"?`,

      ru: `Синтез удался. Но предварительные тесты нового соединения выявили неожиданную находку — оно демонстрирует исключительно сильные адсорбционные свойства против определённых распространённых загрязнителей воды.

Мия долго смотрит на данные, затем открывает набор справочных материалов: «Эта адсорбционная способность… если разобраться в механизме, это может иметь реальное значение для очистки воды от загрязнений.»

На экране появляется последнее исследовательское задание:
«Фаза исследования пятая: Экологическое применение. Используя свойства синтезированного соединения, исследуйте осуществимые подходы к снижению загрязнения воды — протестируйте образцы воды, проанализируйте состав загрязнителей, оцените эффективность очистки. В случае успеха проект будет помечен как завершённый.»

На краю стола выставлен ряд бутылок с образцами воды, подписанных по источникам загрязнения: промышленные стоки, сельскохозяйственный сток, городской дренаж. Рядом — фильтрационное оборудование, спектрометр и стопка стандартов экологического мониторинга.

В этом последнем шаге могут участвовать все. Мия уже готовит тестовые растворы разных концентраций.

Вопрос в том: насколько тебе интересен этот процесс «изучения способов снижения загрязнения воды»?`,

      ja: `合成は成功した。しかし新しい化合物の予備テストで意外な発見があった——一般的な水質汚染物質に対して、驚くほど強い吸着特性を示したのだ。

ミアはデータを長い間見つめてから、参考資料を引き出す：「この吸着能力……メカニズムを解明できれば、水質汚染の処理に実際的な意味を持つかもしれない。」

最後の研究タスクがスクリーンに現れる：
「研究フェーズ5：環境応用研究。合成した化合物の特性を活用し、水質汚染を減少させる実現可能な方法を研究してください——水サンプルのテスト、汚染物質の成分分析、処理効果の評価。成功すれば、この研究プロジェクトは完了としてマークされます。」

実験台の端に、異なる汚染源のラベルが貼られた水サンプルボトルが一列に並べられている：工業排水、農業流出水、都市排水。その横にはろ過装置、分光計、そして環境モニタリング基準の書類の山がある。

全員がこの最終ステップに参加できる。ミアはすでに異なる濃度のテスト溶液を調製している。

問題は：この「水質汚染を減らす方法を研究する」プロセスに、どれほどの興味があるか？`,

      ko: `합성이 성공했다. 그러나 새 화합물의 예비 테스트에서 예상치 못한 발견이 있었다 — 특정 일반적인 수질 오염 물질에 대해 놀라울 정도로 강한 흡착 특성을 보인 것이다.

미아가 데이터를 오랫동안 응시하다가 참고 자료를 꺼낸다: "이 흡착 능력은... 메커니즘을 밝혀낼 수 있다면, 수질 오염 처리에 실질적인 의미가 있을 수 있어."

마지막 연구 과제가 화면에 나타난다:
"연구 5단계: 환경 응용 연구. 합성한 화합물의 특성을 활용하여, 수질 오염을 줄이는 실현 가능한 방안을 연구하십시오 — 수질 샘플 테스트, 오염 물질 성분 분석, 처리 효과 평가. 성공하면 이 연구 프로젝트는 완료로 표시됩니다."

실험대 한쪽 끝에 다양한 오염원이 표시된 수질 샘플 병이 한 줄로 놓여 있다: 산업 폐수, 농업 유출수, 도시 배수. 옆에는 여과 장비, 분광기, 그리고 환경 모니터링 기준 문서 더미가 있다.

모든 사람이 이 마지막 단계에 참여할 수 있다. 미아는 이미 다양한 농도의 테스트 용액을 준비하고 있다.

질문은: 이 "수질 오염을 줄이는 방법을 연구하는" 과정에 얼마나 관심이 있는가?`,
    },
    taskDescription: {
      zh: "利用合成化合物的特性，测试水样、分析污染物、评估处理效果，研究减少水污染的可行方案。这是研究的最后一步。所有人都可以参与。",

      en: `Using the synthesized compound's properties, test water samples, analyze contaminants, and evaluate treatment effectiveness to study feasible approaches to reducing water pollution. This is the final research step. Everyone can participate.`,

      nl: "Gebruik de eigenschappen van de gesynthetiseerde verbinding om watermonsters te testen, verontreinigingen te analyseren en de effectiviteit van behandeling te evalueren, om haalbare benaderingen te onderzoeken voor het verminderen van waterverontreiniging. Dit is de laatste onderzoeksstap. Iedereen kan deelnemen.",

      de: "Nutzen Sie die Eigenschaften der synthetisierten Verbindung, um Wasserproben zu testen, Schadstoffe zu analysieren und die Wirksamkeit der Behandlung zu bewerten, um machbare Ansätze zur Reduzierung von Wasserverschmutzung zu erforschen. Dies ist der letzte Forschungsschritt. Alle können teilnehmen.",

      fr: "En utilisant les propriétés du composé synthétisé, testez des échantillons d'eau, analysez les contaminants et évaluez l'efficacité du traitement pour étudier des approches réalisables de réduction de la pollution de l'eau. C'est la dernière étape de recherche. Tout le monde peut participer.",

      es: "Usando las propiedades del compuesto sintetizado, pruebe muestras de agua, analice contaminantes y evalúe la efectividad del tratamiento para estudiar enfoques viables de reducción de la contaminación del agua. Este es el paso final de investigación. Todos pueden participar.",

      pt: "Usando as propriedades do composto sintetizado, teste amostras de água, analise contaminantes e avalie a eficácia do tratamento para estudar abordagens viáveis de redução da poluição da água. Este é o passo final da pesquisa. Todos podem participar.",

      it: "Utilizzando le proprietà del composto sintetizzato, testate campioni d'acqua, analizzate i contaminanti e valutate l'efficacia del trattamento per studiare approcci praticabili alla riduzione dell'inquinamento idrico. Questo è l'ultimo passo della ricerca. Tutti possono partecipare.",

      ru: "Используя свойства синтезированного соединения, протестируйте образцы воды, проанализируйте загрязнители и оцените эффективность очистки для изучения осуществимых подходов к снижению загрязнения воды. Это последний шаг исследования. Участвовать могут все.",

      ja: "合成した化合物の特性を活用し、水サンプルのテスト、汚染物質の分析、処理効果の評価を行い、水質汚染を減少させる実現可能な方法を研究する。これは研究の最後のステップです。全員が参加できます。",

      ko: "합성한 화합물의 특성을 활용하여, 수질 샘플 테스트, 오염 물질 분석, 처리 효과 평가를 통해 수질 오염을 줄이는 실현 가능한 방안을 연구한다. 이것은 연구의 마지막 단계입니다. 모두 참여할 수 있습니다.",
    },
    mirrorFeedback: {
      score5: {
        zh: `水污染——这个课题让你一下子来了精神。

不是因为它听起来崇高，而是因为研究路径清晰而具体：不同污染源的水样成分差异、化合物的吸附选择性、处理前后的对比数据。每一步都有可以验证的结果。

你坐到 Mia 旁边，拿起第一瓶水样开始检测。她在旁边调整过滤装置的参数，你们交换分析思路——哪种污染物浓度下降最快，为什么农业径流的处理效果和工业废水不同。

研究一个有实际意义的环境问题。这是你在研究空间里最享受的一刻。`,

        en: `Water pollution — this topic energizes you immediately.

Not because it sounds noble, but because the research path is clear and concrete: the compositional differences between water samples from different pollution sources, the compound's adsorption selectivity, the before-and-after comparison data. Every step produces verifiable results.

You sit beside Mia and pick up the first water sample for testing. She adjusts the filtration parameters beside you, and you exchange analytical insights — which contaminant concentration drops fastest, why agricultural runoff responds differently from industrial wastewater.

Studying an environmental problem with real-world significance. This is your most enjoyable moment in the research space.`,

        nl: `Waterverontreiniging — dit onderwerp geeft je meteen energie.

Niet omdat het nobel klinkt, maar omdat het onderzoekspad helder en concreet is: de samenstellingsverschillen tussen watermonsters van verschillende vervuilingsbronnen, de adsorptieselectiviteit van de verbinding, de vergelijkingsgegevens voor en na behandeling. Elke stap levert verifieerbare resultaten op.

Je gaat naast Mia zitten en pakt het eerste watermonster om te testen. Zij past de filtratieparameters aan, en jullie wisselen analytische inzichten uit — welke verontreinigingsconcentratie het snelst daalt, waarom agrarische afspoeling anders reageert dan industrieel afvalwater.

Een milieuprobleem met echte betekenis bestuderen. Dit is je meest plezierige moment in de onderzoeksruimte.`,

        de: `Wasserverschmutzung — dieses Thema gibt dir sofort Energie.

Nicht weil es edel klingt, sondern weil der Forschungsweg klar und konkret ist: die Zusammensetzungsunterschiede zwischen Wasserproben verschiedener Verschmutzungsquellen, die Adsorptionsselektivität der Verbindung, die Vorher-Nachher-Vergleichsdaten. Jeder Schritt liefert überprüfbare Ergebnisse.

Du setzt dich neben Mia und nimmst die erste Wasserprobe zum Testen. Sie justiert die Filtrationsparameter neben dir, und ihr tauscht analytische Erkenntnisse aus — welche Schadstoffkonzentration am schnellsten sinkt, warum landwirtschaftlicher Abfluss anders reagiert als Industrieabwasser.

Ein Umweltproblem mit realer Bedeutung erforschen. Das ist dein angenehmster Moment im Forschungsraum.`,

        fr: `La pollution de l'eau — ce sujet te donne immédiatement de l'énergie.

Non parce que ça semble noble, mais parce que le chemin de recherche est clair et concret : les différences de composition entre les échantillons d'eau de différentes sources de pollution, la sélectivité d'adsorption du composé, les données comparatives avant et après traitement. Chaque étape produit des résultats vérifiables.

Tu t'assieds à côté de Mia et prends le premier échantillon d'eau pour le tester. Elle ajuste les paramètres de filtration à côté de toi, et vous échangez des analyses — quelle concentration de contaminant diminue le plus vite, pourquoi le ruissellement agricole réagit différemment des eaux usées industrielles.

Étudier un problème environnemental ayant une signification réelle. C'est ton moment le plus agréable dans l'espace de recherche.`,

        es: `Contaminación del agua — este tema te da energía de inmediato.

No porque suene noble, sino porque el camino de investigación es claro y concreto: las diferencias de composición entre muestras de agua de distintas fuentes de contaminación, la selectividad de adsorción del compuesto, los datos comparativos antes y después del tratamiento. Cada paso produce resultados verificables.

Te sientas junto a Mia y tomas la primera muestra de agua para analizarla. Ella ajusta los parámetros de filtración a tu lado, e intercambian perspectivas analíticas — qué concentración de contaminante disminuye más rápido, por qué la escorrentía agrícola responde diferente que las aguas residuales industriales.

Estudiar un problema ambiental con significado real. Este es tu momento más disfrutable en el espacio de investigación.`,

        pt: `Poluição da água — esse tema te energiza imediatamente.

Não porque parece nobre, mas porque o caminho de pesquisa é claro e concreto: as diferenças de composição entre amostras de água de diferentes fontes de poluição, a seletividade de adsorção do composto, os dados comparativos antes e depois do tratamento. Cada etapa produz resultados verificáveis.

Você senta ao lado de Mia e pega a primeira amostra de água para testar. Ela ajusta os parâmetros de filtração ao seu lado, e vocês trocam insights analíticos — qual concentração de contaminante diminui mais rápido, por que o escoamento agrícola responde diferentemente dos efluentes industriais.

Estudar um problema ambiental com significado real. Este é seu momento mais prazeroso no espaço de pesquisa.`,

        it: `Inquinamento idrico — questo argomento ti dà immediatamente energia.

Non perché suona nobile, ma perché il percorso di ricerca è chiaro e concreto: le differenze di composizione tra campioni d'acqua di diverse fonti di inquinamento, la selettività di adsorbimento del composto, i dati comparativi prima e dopo il trattamento. Ogni passaggio produce risultati verificabili.

Ti siedi accanto a Mia e prendi il primo campione d'acqua per testarlo. Lei regola i parametri di filtrazione accanto a te, e vi scambiate intuizioni analitiche — quale concentrazione di contaminante diminuisce più velocemente, perché il deflusso agricolo risponde diversamente dalle acque reflue industriali.

Studiare un problema ambientale con significato reale. Questo è il tuo momento più piacevole nello spazio di ricerca.`,

        ru: `Загрязнение воды — эта тема сразу тебя заряжает.

Не потому что звучит благородно, а потому что путь исследования ясен и конкретен: различия в составе образцов воды из разных источников загрязнения, избирательность адсорбции соединения, сравнительные данные до и после обработки. Каждый шаг даёт проверяемые результаты.

Садишься рядом с Мией и берёшь первый образец воды для тестирования. Она настраивает параметры фильтрации рядом, вы обмениваетесь аналитическими наблюдениями — какая концентрация загрязнителя снижается быстрее всего, почему сельскохозяйственный сток реагирует иначе, чем промышленные стоки.

Изучать экологическую проблему с реальным значением. Это твой самый приятный момент в исследовательском пространстве.`,

        ja: `水質汚染——このテーマにすぐにエネルギーが湧く。

崇高に聞こえるからではない。研究の道筋が明確で具体的だからだ：異なる汚染源からの水サンプルの成分の違い、化合物の吸着選択性、処理前後の比較データ。一歩ごとに検証可能な結果が得られる。

ミアの隣に座り、最初の水サンプルを手に取ってテストを始める。彼女は横でろ過パラメータを調整し、分析的な知見を交換する——どの汚染物質の濃度が最も速く低下するか、なぜ農業流出水は工業排水と異なる反応を示すのか。

現実的な意義のある環境問題を研究する。研究空間で最も楽しい瞬間だ。`,

        ko: `수질 오염 — 이 주제가 즉시 활력을 준다.

고상하게 들려서가 아니라, 연구 경로가 명확하고 구체적이기 때문이다: 서로 다른 오염원에서 온 수질 샘플의 성분 차이, 화합물의 흡착 선택성, 처리 전후 비교 데이터. 매 단계마다 검증 가능한 결과가 나온다.

미아 옆에 앉아 첫 번째 수질 샘플을 들고 테스트를 시작한다. 그녀가 옆에서 여과 파라미터를 조정하고, 분석적 통찰을 교환한다 — 어떤 오염 물질 농도가 가장 빨리 감소하는지, 왜 농업 유출수가 산업 폐수와 다르게 반응하는지.

현실적 의미가 있는 환경 문제를 연구하기. 연구 공간에서 가장 즐거운 순간이다.`,
      },
      score4: {
        zh: `用研究成果解决环境问题——这一步你有兴趣。

你走过去，看了看 Mia 的测试方案，提了几个想法：不同浓度下的处理效率差异可能值得关注。她听了，调整了一组实验参数。你们开始一起分析第一批水样数据。

不确定性还在——哪种处理方案最有效还不清楚。但到了这个阶段，有数据在手里，感觉踏实。`,

        en: `Using research to address an environmental problem — this step interests you.

You walk over and review Mia's test plan. You offer a few ideas: the treatment efficiency differences at various concentrations might be worth noting. She listens and adjusts one set of parameters. Together you begin analyzing the first batch of water sample data.

Uncertainty remains — which treatment approach works best isn't clear yet. But at this stage, with data in hand, it feels grounded.`,

        nl: `Onderzoek gebruiken om een milieuprobleem aan te pakken — deze stap interesseert je.

Je loopt erheen en bekijkt Mia's testplan. Je deelt een paar ideeën: de verschillen in behandelingsefficiëntie bij verschillende concentraties zijn misschien het vermelden waard. Ze luistert en past één set parameters aan. Samen beginnen jullie de eerste reeks watermonstergegevens te analyseren.

De onzekerheid blijft — welke behandelingsaanpak het beste werkt, is nog niet duidelijk. Maar in dit stadium, met gegevens in de hand, voelt het stevig.`,

        de: `Forschung nutzen, um ein Umweltproblem anzugehen — dieser Schritt interessiert dich.

Du gehst hin und siehst dir Mias Testplan an. Du bietest ein paar Ideen an: die Unterschiede in der Behandlungseffizienz bei verschiedenen Konzentrationen könnten bemerkenswert sein. Sie hört zu und passt einen Parametersatz an. Gemeinsam beginnt ihr die ersten Wasserproben-Daten zu analysieren.

Unsicherheit bleibt — welcher Behandlungsansatz am besten funktioniert, ist noch nicht klar. Aber in diesem Stadium, mit Daten in der Hand, fühlt es sich solide an.`,

        fr: `Utiliser la recherche pour résoudre un problème environnemental — cette étape t'intéresse.

Tu t'approches et examines le plan de test de Mia. Tu proposes quelques idées : les différences d'efficacité de traitement à différentes concentrations méritent peut-être attention. Elle écoute et ajuste un ensemble de paramètres. Ensemble, vous commencez à analyser les données du premier lot d'échantillons d'eau.

L'incertitude demeure — quelle approche de traitement fonctionne le mieux n'est pas encore clair. Mais à ce stade, avec des données en main, ça donne un sentiment d'ancrage.`,

        es: `Usar la investigación para abordar un problema ambiental — este paso te interesa.

Te acercas y revisas el plan de pruebas de Mia. Ofreces algunas ideas: las diferencias de eficiencia del tratamiento a varias concentraciones podrían ser relevantes. Ella escucha y ajusta un conjunto de parámetros. Juntos comienzan a analizar los datos del primer lote de muestras de agua.

La incertidumbre permanece — qué enfoque de tratamiento funciona mejor aún no está claro. Pero en esta etapa, con datos en mano, se siente sólido.`,

        pt: `Usar a pesquisa para abordar um problema ambiental — esse passo te interessa.

Você se aproxima e revisa o plano de testes de Mia. Oferece algumas ideias: as diferenças de eficiência do tratamento em várias concentrações podem valer a pena observar. Ela ouve e ajusta um conjunto de parâmetros. Juntos começam a analisar os dados do primeiro lote de amostras de água.

A incerteza permanece — qual abordagem de tratamento funciona melhor ainda não está claro. Mas nesta fase, com dados em mãos, a sensação é de firmeza.`,

        it: `Usare la ricerca per affrontare un problema ambientale — questo passo ti interessa.

Ti avvicini e esamini il piano di test di Mia. Offri qualche idea: le differenze di efficienza del trattamento a varie concentrazioni potrebbero essere degne di nota. Lei ascolta e regola un set di parametri. Insieme cominciate ad analizzare i dati del primo lotto di campioni d'acqua.

L'incertezza rimane — quale approccio di trattamento funzioni meglio non è ancora chiaro. Ma a questo stadio, con i dati in mano, la sensazione è solida.`,

        ru: `Использовать исследование для решения экологической проблемы — этот шаг тебе интересен.

Подходишь и смотришь план тестирования Мии. Предлагаешь несколько идей: различия в эффективности обработки при разных концентрациях, возможно, стоит отметить. Она слушает и корректирует один набор параметров. Вместе начинаете анализировать данные первой партии водных образцов.

Неопределённость остаётся — какой подход к обработке работает лучше всего, пока неясно. Но на этом этапе, с данными на руках, чувствуется твёрдая почва.`,

        ja: `研究を環境問題の解決に活かす——このステップには興味がある。

近づいてミアのテスト計画を見る。いくつかアイデアを出す：さまざまな濃度での処理効率の差が注目に値するかもしれない。彼女は聞いて、パラメータセットを一つ調整する。二人で最初の水サンプルデータの分析を始める。

不確実性は残る——どの処理アプローチが最も効果的かはまだ分からない。でもこの段階では、データが手元にあるから地に足がついた感覚がある。`,

        ko: `연구를 환경 문제 해결에 활용하기 — 이 단계에 관심이 있다.

다가가서 미아의 테스트 계획을 검토한다. 몇 가지 아이디어를 제안한다: 다양한 농도에서의 처리 효율 차이를 주목할 만하다고. 그녀가 듣고 파라미터 세트 하나를 조정한다. 함께 첫 번째 수질 샘플 데이터 분석을 시작한다.

불확실성은 남아 있다 — 어떤 처리 접근법이 가장 효과적인지 아직 불분명하다. 하지만 이 단계에서는, 데이터가 손에 있으니 안정감이 있다.`,
      },
      score3: {
        zh: `最后一步了。

研究水污染的治理方案——听起来有意义，但你不确定自己能贡献多少。你走过去看了看那排水样瓶和 Mia 的测试记录，大致理解了方向，但没有涌出想参与的冲动。

你站在旁边，听他们讨论不同污染源的处理效果。如果他们需要帮忙做某个具体的步骤，你可以搭把手。但主动推进……不是现在。`,

        en: `The last step.

Studying water pollution treatment approaches — it sounds meaningful, but you're not sure how much you can contribute. You walk over, look at the row of water sample bottles and Mia's test records, roughly grasp the direction, but no surge of wanting to participate.

You stand to the side, listening to them discuss treatment effects across different pollution sources. If they need help with a specific step, you can pitch in. But actively driving it... not right now.`,

        nl: `De laatste stap.

Benaderingen voor waterverontreinigingsbehandeling onderzoeken — het klinkt zinvol, maar je weet niet zeker hoeveel je kunt bijdragen. Je loopt erheen, bekijkt de rij watermonsterflessen en Mia's testgegevens, begrijpt de richting globaal, maar voelt geen opwelling om mee te doen.

Je staat terzijde en luistert naar hun discussie over behandelingseffecten bij verschillende vervuilingsbronnen. Als ze hulp nodig hebben bij een specifieke stap, kun je bijspringen. Maar actief aansturen... niet nu.`,

        de: `Der letzte Schritt.

Ansätze zur Wasserverschmutzungsbehandlung erforschen — klingt sinnvoll, aber du bist nicht sicher, wie viel du beitragen kannst. Du gehst hin, siehst dir die Reihe der Wasserprobenflaschen und Mias Testaufzeichnungen an, verstehst die Richtung ungefähr, aber es kommt kein Drang zum Mitmachen.

Du stehst daneben und hörst ihrer Diskussion über Behandlungseffekte bei verschiedenen Verschmutzungsquellen zu. Wenn sie Hilfe bei einem bestimmten Schritt brauchen, kannst du einspringen. Aber aktiv vorantreiben... nicht jetzt.`,

        fr: `La dernière étape.

Étudier des approches de traitement de la pollution de l'eau — ça semble avoir du sens, mais tu n'es pas sûr de pouvoir contribuer beaucoup. Tu t'approches, regardes la rangée de flacons d'échantillons d'eau et les notes de test de Mia, comprends la direction en gros, mais aucune envie de participer ne monte en toi.

Tu restes à côté, écoutant leur discussion sur les effets du traitement selon les différentes sources de pollution. S'ils ont besoin d'aide pour une étape précise, tu peux donner un coup de main. Mais mener activement... pas maintenant.`,

        es: `El último paso.

Estudiar enfoques de tratamiento de contaminación del agua — suena significativo, pero no estás seguro de cuánto puedes contribuir. Te acercas, miras la fila de botellas de muestras de agua y los registros de pruebas de Mia, entiendes la dirección aproximadamente, pero no surge ningún impulso de participar.

Te quedas a un lado, escuchando su discusión sobre los efectos del tratamiento en diferentes fuentes de contaminación. Si necesitan ayuda con un paso específico, puedes echar una mano. Pero impulsar activamente... no ahora.`,

        pt: `O último passo.

Estudar abordagens de tratamento de poluição da água — parece significativo, mas você não tem certeza de quanto pode contribuir. Você se aproxima, olha a fileira de frascos de amostras de água e os registros de teste de Mia, entende a direção em linhas gerais, mas não sente impulso de participar.

Você fica de lado, ouvindo a discussão sobre efeitos do tratamento em diferentes fontes de poluição. Se precisarem de ajuda com um passo específico, pode contribuir. Mas conduzir ativamente... não agora.`,

        it: `L'ultimo passo.

Studiare approcci di trattamento dell'inquinamento idrico — sembra significativo, ma non sei sicuro di quanto puoi contribuire. Ti avvicini, guardi la fila di flaconi con campioni d'acqua e gli appunti dei test di Mia, capisci la direzione a grandi linee, ma non emerge nessun impulso a partecipare.

Resti in disparte, ascoltando la loro discussione sugli effetti del trattamento su diverse fonti di inquinamento. Se hanno bisogno di aiuto con un passaggio specifico, puoi dare una mano. Ma guidare attivamente... non ora.`,

        ru: `Последний шаг.

Изучать подходы к очистке воды от загрязнений — звучит осмысленно, но ты не уверен, насколько можешь помочь. Подходишь, смотришь на ряд бутылок с образцами воды и записи Мии, в общих чертах понимаешь направление, но порыва участвовать не возникает.

Стоишь в стороне, слушая их обсуждение эффектов обработки при разных источниках загрязнения. Если понадобится помощь с конкретным шагом, можешь подключиться. Но активно двигать вперёд... не сейчас.`,

        ja: `最後のステップだ。

水質汚染の処理方法を研究する——意義がありそうだが、自分がどれだけ貢献できるか分からない。近づいて水サンプルボトルの列とミアのテスト記録を見て、方向性は大まかに理解するが、参加したいという衝動は湧かない。

脇に立って、異なる汚染源での処理効果についての議論を聞いている。特定のステップで助けが必要なら手を貸せる。でも能動的に推進するのは……今ではない。`,

        ko: `마지막 단계다.

수질 오염 처리 방안을 연구하기 — 의미 있게 들리지만, 얼마나 기여할 수 있을지 확신이 없다. 다가가서 수질 샘플 병 줄과 미아의 테스트 기록을 보고, 대략적인 방향은 이해하지만, 참여하고 싶다는 충동이 솟아오르지 않는다.

옆에 서서 서로 다른 오염원에서의 처리 효과에 대한 토론을 듣는다. 특정 단계에서 도움이 필요하면 거들 수 있다. 하지만 능동적으로 추진하는 것은... 지금은 아니다.`,
      },
      score2: {
        zh: `研究的最后一步。

你看了看屏幕上的任务描述，又看了看 Mia 忙碌的身影。研究水污染治理——这已经完全超出了你的兴趣范围。

你退到了后面。这一章快结束了。`,

        en: `The research's final step.

You look at the task description on screen, then at Mia working intently. Studying water pollution treatment — this has completely left your sphere of interest.

You retreat to the back. This chapter is nearly over.`,

        nl: `De laatste stap van het onderzoek.

Je kijkt naar de taakbeschrijving op het scherm, dan naar Mia die geconcentreerd werkt. Waterverontreinigingsbehandeling bestuderen — dit is volledig buiten je interessegebied.

Je trekt je terug naar achteren. Dit hoofdstuk is bijna voorbij.`,

        de: `Der letzte Schritt der Forschung.

Du schaust auf die Aufgabenbeschreibung auf dem Bildschirm, dann auf Mia, die konzentriert arbeitet. Wasserverschmutzungsbehandlung erforschen — das hat dein Interessengebiet vollständig verlassen.

Du ziehst dich nach hinten zurück. Dieses Kapitel ist fast vorbei.`,

        fr: `La dernière étape de la recherche.

Tu regardes la description de la tâche à l'écran, puis Mia qui travaille avec concentration. Étudier le traitement de la pollution de l'eau — c'est complètement sorti de ta sphère d'intérêt.

Tu te retires vers le fond. Ce chapitre est presque terminé.`,

        es: `El paso final de la investigación.

Miras la descripción de la tarea en pantalla, luego a Mia trabajando intensamente. Estudiar el tratamiento de la contaminación del agua — esto ha abandonado completamente tu esfera de interés.

Te retiras hacia atrás. Este capítulo está casi terminado.`,

        pt: `O passo final da pesquisa.

Você olha a descrição da tarefa na tela, depois Mia trabalhando intensamente. Estudar o tratamento da poluição da água — isso saiu completamente da sua esfera de interesse.

Você recua para o fundo. Este capítulo está quase no fim.`,

        it: `Il passo finale della ricerca.

Guardi la descrizione del compito sullo schermo, poi Mia che lavora con concentrazione. Studiare il trattamento dell'inquinamento idrico — questo ha completamente lasciato la tua sfera di interesse.

Ti ritiri verso il fondo. Questo capitolo è quasi finito.`,

        ru: `Последний шаг исследования.

Смотришь на описание задачи на экране, потом на Мию, работающую сосредоточенно. Изучать очистку воды от загрязнений — это полностью за пределами твоего интереса.

Отступаешь назад. Эта глава почти закончена.`,

        ja: `研究の最終ステップ。

スクリーンのタスク説明を見て、それから懸命に作業するミアを見る。水質汚染の処理を研究する——これは完全に興味の範囲外だ。

後ろに退く。この章はもうすぐ終わる。`,

        ko: `연구의 마지막 단계.

화면의 작업 설명을 보고, 열심히 작업하는 미아를 본다. 수질 오염 처리를 연구하기 — 이것은 완전히 관심 영역을 벗어났다.

뒤로 물러난다. 이 장은 거의 끝나간다.`,
      },
      score1: {
        zh: `从合成到环境应用，从实验台到水样瓶——每一步都在离你更远。

不是因为你不理解。是因为整个「研究-分析-解决污染问题」的链条，从头到尾都不是你会自愿参与的过程。

你站在研究空间的边缘，等着出口开启。这一章不是你的。但这不是遗憾——这是信息。`,

        en: `From synthesis to environmental application, from the bench to water sample bottles — each step takes you further away.

Not because you don't understand. Because the entire "research-analyze-solve pollution" chain, from start to finish, is not a process you would voluntarily join.

You stand at the edge of the research space, waiting for the exit to open. This chapter wasn't yours. But that's not regret — it's information.`,

        nl: `Van synthese naar milieutechnische toepassing, van de werktafel naar watermonsterflessen — elke stap brengt je verder weg.

Niet omdat je het niet begrijpt. Omdat de hele "onderzoek-analyseer-los vervuiling op"-keten, van begin tot eind, geen proces is waar je vrijwillig aan zou deelnemen.

Je staat aan de rand van de onderzoeksruimte en wacht tot de uitgang opengaat. Dit hoofdstuk was niet van jou. Maar dat is geen spijt — het is informatie.`,

        de: `Von der Synthese zur Umweltanwendung, vom Labortisch zu Wasserprobenflaschen — jeder Schritt entfernt dich weiter.

Nicht weil du es nicht verstehst. Weil die gesamte „Forschen-Analysieren-Verschmutzung-lösen"-Kette, von Anfang bis Ende, kein Prozess ist, an dem du freiwillig teilnehmen würdest.

Du stehst am Rand des Forschungsraums und wartest, bis der Ausgang sich öffnet. Dieses Kapitel war nicht deines. Aber das ist kein Bedauern — es ist Information.`,

        fr: `De la synthèse à l'application environnementale, de la paillasse aux flacons d'échantillons d'eau — chaque étape t'éloigne davantage.

Non parce que tu ne comprends pas. Parce que toute la chaîne « rechercher-analyser-résoudre la pollution », du début à la fin, n'est pas un processus auquel tu participerais volontairement.

Tu te tiens au bord de l'espace de recherche, attendant que la sortie s'ouvre. Ce chapitre n'était pas le tien. Mais ce n'est pas du regret — c'est de l'information.`,

        es: `De la síntesis a la aplicación ambiental, de la mesa a las botellas de muestras de agua — cada paso te aleja más.

No porque no entiendas. Porque toda la cadena "investigar-analizar-resolver la contaminación", de principio a fin, no es un proceso en el que participarías voluntariamente.

Estás de pie al borde del espacio de investigación, esperando que la salida se abra. Este capítulo no fue tuyo. Pero eso no es lamento — es información.`,

        pt: `Da síntese à aplicação ambiental, da bancada aos frascos de amostras de água — cada passo te afasta mais.

Não porque você não entende. Porque toda a cadeia "pesquisar-analisar-resolver a poluição", do início ao fim, não é um processo do qual você participaria voluntariamente.

Você está na borda do espaço de pesquisa, esperando a saída abrir. Este capítulo não foi seu. Mas isso não é arrependimento — é informação.`,

        it: `Dalla sintesi all'applicazione ambientale, dal banco ai flaconi di campioni d'acqua — ogni passo ti allontana di più.

Non perché non capisci. Perché l'intera catena "ricercare-analizzare-risolvere l'inquinamento", dall'inizio alla fine, non è un processo a cui parteciperesti volontariamente.

Sei al bordo dello spazio di ricerca, aspettando che l'uscita si apra. Questo capitolo non era il tuo. Ma non è rimpianto — è informazione.`,

        ru: `От синтеза к экологическому применению, от лабораторного стола к бутылкам с образцами воды — каждый шаг уводит тебя дальше.

Не потому что ты не понимаешь. Потому что вся цепочка «исследовать-анализировать-решать проблему загрязнения», от начала до конца, — не тот процесс, к которому ты присоединился бы добровольно.

Стоишь на краю исследовательского пространства, ожидая, когда откроется выход. Эта глава была не твоя. Но это не сожаление — это информация.`,

        ja: `合成から環境応用へ、実験台から水サンプルボトルへ——一歩ごとに遠ざかっていく。

理解できないからではない。「研究し、分析し、汚染問題を解決する」という一連の流れ全体が、最初から最後まで、自分が自発的に参加するプロセスではないからだ。

研究空間の端に立ち、出口が開くのを待つ。この章は自分のものではなかった。でもそれは後悔ではない——情報だ。`,

        ko: `합성에서 환경 응용으로, 실험대에서 수질 샘플 병으로 — 매 단계가 더 멀어지게 한다.

이해하지 못해서가 아니다. "연구하고-분석하고-오염 문제를 해결하는" 전체 사슬이, 처음부터 끝까지, 자발적으로 참여할 과정이 아니기 때문이다.

연구 공간의 가장자리에 서서, 출구가 열리기를 기다린다. 이 장은 당신의 것이 아니었다. 하지만 그것은 후회가 아니다 — 정보다.`,
      },
    },
  },
];
