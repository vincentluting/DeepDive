// ════════════════════════════════════════════════════════════
// 第三章：剧场（A型 Q11-Q15）
// 大任务：创造一场完整的演出
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER3_QUESTIONS: ImmersiveQuestion[] = [
  // ── Q11: Write books or plays ──────────────────────────────
  {
    id: 11,
    riasec: "A",
    miniIpCode: "A1",
    miniIpItem: "Write books or plays",
    chapter: "theater",
    chapterIndex: 3,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `聚光灯打在舞台中央那张桌子上。一支笔，一叠白纸。

屏幕上那行字已消失，但它说得很清楚：「这里需要一个故事。先写出来。」

Kai 走向舞台边缘，看着那张空桌子。他没有动。

对面队伍的人也在看。没有人知道这个故事应该是什么——没有主题，没有要求，只有一张空白的纸和一支笔，等着某个人坐下来，从第一个字开始，写出一些之前不存在的东西。

一个故事。一个完整的故事。角色、场景、情节、结局——全部从你脑子里来。`,

      en: `A spotlight finds the table at center stage. A pen. A stack of blank paper.\n\nThe screen text has vanished, but its message lingers: "This place needs a story. Write it first."\n\nYou walk to the stage's edge. Stand. Stare at the empty table. Don't move.\n\nThe other team watches too. No one knows what this story should be — no theme, no brief, just blank paper and a pen, waiting for someone to sit down and, from the first word, write something that didn't exist before.\n\nA story. A complete story. Characters, plot, ending — all of it from your mind.`,

      nl: `Een spotlight valt op de tafel midden op het podium. Een pen. Een stapel blanco papier.\n\nDe tekst op het scherm is verdwenen, maar de boodschap hangt nog na: "Deze plek heeft een verhaal nodig. Schrijf het eerst."\n\nJe loopt naar de rand van het podium, staat daar, staart naar de lege tafel. Je beweegt niet.\n\nHet andere team kijkt ook. Niemand weet wat dit verhaal zou moeten zijn — geen thema, geen opdracht, alleen blanco papier en een pen, wachtend op iemand die gaat zitten en, beginnend bij het eerste woord, iets schrijft dat er nog niet was.\n\nEen verhaal. Een compleet verhaal. Personages, decors, plot, einde — alles uit jouw hoofd.`,

      de: `Ein Scheinwerfer findet den Tisch in der Bühnenmitte. Ein Stift. Ein Stapel leeres Papier.\n\nDer Text auf dem Bildschirm ist verschwunden, doch seine Botschaft bleibt: „Dieser Ort braucht eine Geschichte. Schreib sie zuerst."\n\nDu gehst zum Bühnenrand, stehst dort, starrst auf den leeren Tisch. Du bewegst dich nicht.\n\nAuch das andere Team schaut zu. Niemand weiß, was diese Geschichte sein soll — kein Thema, kein Auftrag, nur leeres Papier und ein Stift, die darauf warten, dass jemand sich hinsetzt und, beginnend mit dem ersten Wort, etwas schreibt, das vorher nicht existierte.\n\nEine Geschichte. Eine vollständige Geschichte. Figuren, Schauplätze, Handlung, Ende — alles aus deinem Kopf.`,

      fr: `Un projecteur éclaire la table au centre de la scène. Un stylo. Une pile de feuilles blanches.\n\nLe texte à l'écran a disparu, mais son message persiste : « Cet endroit a besoin d'une histoire. Écris-la d'abord. »\n\nTu avances vers le bord de la scène, tu restes là, tu fixes la table vide. Tu ne bouges pas.\n\nL'autre équipe regarde aussi. Personne ne sait ce que cette histoire devrait être — pas de thème, pas de consigne, juste du papier blanc et un stylo, attendant que quelqu'un s'assoie et, à partir du premier mot, écrive quelque chose qui n'existait pas avant.\n\nUne histoire. Une histoire complète. Personnages, décors, intrigue, dénouement — tout venant de ton esprit.`,

      es: `Un foco ilumina la mesa en el centro del escenario. Un bolígrafo. Una pila de papel en blanco.\n\nEl texto en la pantalla ha desaparecido, pero su mensaje permanece: "Este lugar necesita una historia. Escríbela primero."\n\nCaminas hasta el borde del escenario, te quedas ahí, miras fijamente la mesa vacía. No te mueves.\n\nEl otro equipo también observa. Nadie sabe cuál debería ser esta historia — sin tema, sin indicaciones, solo papel en blanco y un bolígrafo, esperando a que alguien se siente y, empezando por la primera palabra, escriba algo que antes no existía.\n\nUna historia. Una historia completa. Personajes, escenarios, trama, desenlace — todo desde tu mente.`,

      pt: `Um holofote ilumina a mesa no centro do palco. Uma caneta. Uma pilha de papel em branco.\n\nO texto na tela desapareceu, mas a mensagem persiste: "Este lugar precisa de uma história. Escreva-a primeiro."\n\nVocê caminha até a beira do palco, fica ali, olha fixamente para a mesa vazia. Não se move.\n\nA outra equipa também observa. Ninguém sabe o que esta história deveria ser — sem tema, sem briefing, apenas papel em branco e uma caneta, à espera que alguém se sente e, começando pela primeira palavra, escreva algo que antes não existia.\n\nUma história. Uma história completa. Personagens, cenários, enredo, desfecho — tudo vindo da sua mente.`,

      it: `Un riflettore illumina il tavolo al centro del palco. Una penna. Una pila di fogli bianchi.\n\nIl testo sullo schermo è scomparso, ma il suo messaggio resta: "Questo luogo ha bisogno di una storia. Scrivila prima."\n\nCammini verso il bordo del palco, resti lì, fissi il tavolo vuoto. Non ti muovi.\n\nAnche l'altra squadra osserva. Nessuno sa cosa dovrebbe essere questa storia — nessun tema, nessuna consegna, solo carta bianca e una penna, in attesa che qualcuno si sieda e, partendo dalla prima parola, scriva qualcosa che prima non esisteva.\n\nUna storia. Una storia completa. Personaggi, ambientazioni, trama, finale — tutto dalla tua mente.`,

      ru: `Луч прожектора падает на стол в центре сцены. Ручка. Стопка чистой бумаги.\n\nТекст на экране исчез, но его послание осталось: «Этому месту нужна история. Сначала напиши её».\n\nТы подходишь к краю сцены, стоишь, смотришь на пустой стол. Не двигаешься.\n\nДругая команда тоже наблюдает. Никто не знает, какой должна быть эта история — ни темы, ни задания, только чистая бумага и ручка, ожидающие, что кто-то сядет и, начав с первого слова, напишет то, чего раньше не существовало.\n\nИстория. Цельная история. Персонажи, декорации, сюжет, финал — всё из твоей головы.`,

      ja: `スポットライトがステージ中央のテーブルを照らす。ペンが一本。白紙の束。\n\nスクリーンの文字は消えたが、そのメッセージは残っている：「ここには物語が必要だ。まず書け。」\n\nあなたはステージの端まで歩き、そこに立ち、空のテーブルを見つめる。動かない。\n\n向こうのチームも見ている。誰もこの物語が何であるべきか知らない——テーマもなく、指示もなく、ただ白紙とペンがあるだけ。誰かが座って、最初の一文字から、まだ存在しない何かを書くのを待っている。\n\n物語。完全な物語。登場人物、舞台設定、プロット、結末——すべてあなたの頭の中から。`,

      ko: `스포트라이트가 무대 중앙의 테이블을 비춘다. 펜 한 자루. 빈 종이 한 다발.\n\n화면의 글자는 사라졌지만, 그 메시지는 남아 있다: "이곳에는 이야기가 필요하다. 먼저 써라."\n\n당신은 무대 가장자리까지 걸어가 거기 서서 빈 테이블을 응시한다. 움직이지 않는다.\n\n상대 팀도 지켜보고 있다. 아무도 이 이야기가 무엇이어야 하는지 모른다 — 주제도 없고, 지시도 없고, 오직 빈 종이와 펜만이 누군가 앉아서 첫 글자부터 시작해 이전에 존재하지 않았던 무언가를 쓰기를 기다리고 있다.\n\n이야기. 완전한 이야기. 인물, 배경, 줄거리, 결말 — 모두 당신의 머릿속에서.`,
    },
    taskDescription: {
      zh: "坐下来，写一个原创的故事或剧本——从空白开始，创造角色、构建情节、完成叙事。这项任务需要一个主要负责人。",

      en: `Sit down and write an original story or script—from a blank page, create characters, build a plot, complete a narrative. This task needs one primary person.`,

      nl: `Ga zitten en schrijf een origineel verhaal of script — begin vanaf een blanco pagina, creëer personages, bouw een plot, voltooi een verhaal. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Setz dich hin und schreib eine originelle Geschichte oder ein Drehbuch — von einer leeren Seite aus, erschaffe Figuren, baue eine Handlung auf, vollende eine Erzählung. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Assieds-toi et écris une histoire ou un scénario original — à partir d'une page blanche, crée des personnages, construis une intrigue, achève un récit. Cette tâche nécessite un responsable principal.`,

      es: `Siéntate y escribe una historia o guion original — desde una página en blanco, crea personajes, construye una trama, completa una narrativa. Esta tarea necesita un responsable principal.`,

      pt: `Sente-se e escreva uma história ou roteiro original — a partir de uma página em branco, crie personagens, construa um enredo, complete uma narrativa. Esta tarefa precisa de um responsável principal.`,

      it: `Siediti e scrivi una storia o una sceneggiatura originale — da una pagina bianca, crea personaggi, costruisci una trama, completa una narrazione. Questo compito richiede un responsabile principale.`,

      ru: `Сядь и напиши оригинальную историю или сценарий — с чистого листа создай персонажей, построй сюжет, заверши повествование. Для этой задачи нужен один главный ответственный.`,

      ja: `座って、オリジナルの物語や脚本を書く——白紙から始めて、キャラクターを創り、プロットを組み立て、物語を完成させる。この課題には一人の主担当者が必要だ。`,

      ko: `앉아서 원본 이야기나 대본을 쓰세요 — 빈 페이지에서 시작해 인물을 창조하고, 줄거리를 구축하고, 서사를 완성하세요. 이 과제는 한 명의 주 담당자가 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你看见那张空白的纸，身体里有什么东西安静地动了一下。

不是紧张，不是兴奋——是一种更深的东西。那种「我有话要说」的感觉，你知道它是什么。它一直在那里，只是平时没有出口。

你走上去，坐下来，拿起笔。第一个字还没写，但你已经知道这个故事要从哪里开始了。

Kai 看着你坐下来，退后了一步。他认出了你脸上的那个表情——那是创作开始前的表情。`,

        en: `You see the blank page and something inside you shifts quietly.\n\nNot nervousness, not excitement—something deeper. That "I have something to say" feeling. You know what it is. It's always been there, just without an exit.\n\nYou walk up, sit down, pick up the pen. The first word isn't written yet, but you already know where this story begins.\n\nKai watches you sit down and takes a step back. He recognizes the expression on your face—the one that appears before creation begins.`,

        nl: `Je ziet het blanco papier en iets binnenin je verschuift zachtjes.\n\nGeen zenuwen, geen opwinding — iets diepers. Dat gevoel van "ik heb iets te zeggen". Je weet wat het is. Het is er altijd geweest, alleen zonder uitweg.\n\nJe loopt erheen, gaat zitten, pakt de pen. Het eerste woord is nog niet geschreven, maar je weet al waar dit verhaal begint.\n\nKai kijkt hoe je gaat zitten en doet een stap terug. Hij herkent de uitdrukking op je gezicht — die van vlak voor het scheppen begint.`,

        de: `Du siehst das leere Blatt und etwas in dir verschiebt sich leise.\n\nKeine Nervosität, keine Aufregung — etwas Tieferes. Dieses „Ich habe etwas zu sagen"-Gefühl. Du weißt, was es ist. Es war immer da, nur ohne Ausgang.\n\nDu gehst hin, setzt dich, nimmst den Stift. Das erste Wort ist noch nicht geschrieben, aber du weißt bereits, wo diese Geschichte beginnt.\n\nKai beobachtet, wie du dich hinsetzt, und tritt einen Schritt zurück. Er erkennt den Ausdruck auf deinem Gesicht — den, der erscheint, bevor das Schaffen beginnt.`,

        fr: `Tu vois la page blanche et quelque chose en toi se déplace doucement.\n\nPas de la nervosité, pas de l'excitation — quelque chose de plus profond. Ce sentiment de « j'ai quelque chose à dire ». Tu sais ce que c'est. Il a toujours été là, juste sans issue.\n\nTu t'avances, tu t'assois, tu prends le stylo. Le premier mot n'est pas encore écrit, mais tu sais déjà où cette histoire commence.\n\nKai te regarde t'asseoir et recule d'un pas. Il reconnaît l'expression sur ton visage — celle qui apparaît juste avant que la création commence.`,

        es: `Ves la página en blanco y algo dentro de ti se mueve en silencio.\n\nNo son nervios, no es emoción — es algo más profundo. Esa sensación de "tengo algo que decir". Sabes lo que es. Siempre ha estado ahí, solo que sin salida.\n\nTe acercas, te sientas, tomas el bolígrafo. La primera palabra aún no está escrita, pero ya sabes dónde comienza esta historia.\n\nKai te observa sentarte y da un paso atrás. Reconoce la expresión en tu rostro — la que aparece antes de que la creación comience.`,

        pt: `Você vê a página em branco e algo dentro de si se move em silêncio.\n\nNão é nervosismo, não é entusiasmo — é algo mais profundo. Aquela sensação de "tenho algo a dizer". Você sabe o que é. Sempre esteve lá, apenas sem saída.\n\nVocê se aproxima, senta, pega a caneta. A primeira palavra ainda não foi escrita, mas você já sabe onde esta história começa.\n\nKai observa você sentar-se e dá um passo atrás. Ele reconhece a expressão no seu rosto — aquela que surge antes de a criação começar.`,

        it: `Vedi il foglio bianco e qualcosa dentro di te si muove in silenzio.\n\nNon nervosismo, non eccitazione — qualcosa di più profondo. Quella sensazione di "ho qualcosa da dire". Sai cos'è. È sempre stata lì, solo senza via d'uscita.\n\nTi avvicini, ti siedi, prendi la penna. La prima parola non è ancora scritta, ma sai già dove inizia questa storia.\n\nKai ti guarda sederti e fa un passo indietro. Riconosce l'espressione sul tuo viso — quella che appare prima che la creazione abbia inizio.`,

        ru: `Ты видишь чистый лист, и что-то внутри тебя тихо сдвигается.\n\nНе волнение, не восторг — что-то глубже. Ощущение «мне есть что сказать». Ты знаешь, что это. Оно всегда было здесь, просто без выхода.\n\nТы подходишь, садишься, берёшь ручку. Первое слово ещё не написано, но ты уже знаешь, где начинается эта история.\n\nКай смотрит, как ты садишься, и делает шаг назад. Он узнаёт выражение на твоём лице — то самое, что появляется перед началом творчества.`,

        ja: `白紙を見て、あなたの内側で何かが静かに動く。\n\n緊張ではなく、興奮でもない——もっと深いもの。「伝えたいことがある」というあの感覚。あなたはそれが何か知っている。ずっとそこにあった、ただ出口がなかっただけだ。\n\nあなたは歩み寄り、座り、ペンを取る。最初の一文字はまだ書かれていないが、この物語がどこから始まるかはもうわかっている。\n\nKaiはあなたが座るのを見て、一歩下がる。あなたの顔の表情に見覚えがある——創作が始まる直前の表情だ。`,

        ko: `빈 종이를 보고, 당신 안에서 무언가가 조용히 움직인다.\n\n긴장이 아니라, 흥분도 아니라 — 더 깊은 무언가. "할 말이 있다"는 그 느낌. 당신은 그것이 무엇인지 안다. 항상 거기 있었다, 단지 출구가 없었을 뿐.\n\n다가가서 앉아 펜을 든다. 첫 글자는 아직 쓰지 않았지만, 이 이야기가 어디서 시작되는지는 이미 알고 있다.\n\nKai가 당신이 앉는 것을 보며 한 발 물러선다. 당신 얼굴의 그 표정을 알아본다 — 창작이 시작되기 직전의 표정.`,
      },
      score4: {
        zh: `一张空白的纸。一个完整的故事。

你走上舞台，坐了下来。脑子里不是完全空白——有一些碎片，一些画面，一些可能的开头。不确定最后会变成什么，但你有足够的信心开始。

你写下了第一个句子。然后第二个。故事开始在你的笔下生长。

不完美，但在生长。`,

        en: `A blank page. A complete story.\n\nYou walk onto the stage and sit down. Your mind isn't completely empty—there are fragments, images, possible openings. Not sure what it'll become, but you have enough confidence to start.\n\nYou write the first sentence. Then the second. The story begins growing under your pen.\n\nImperfect, but growing.`,

        nl: `Een blanco pagina. Een compleet verhaal.\n\nJe loopt het podium op en gaat zitten. Je hoofd is niet helemaal leeg — er zijn fragmenten, beelden, mogelijke openingen. Niet zeker wat het wordt, maar je hebt genoeg vertrouwen om te beginnen.\n\nJe schrijft de eerste zin. Dan de tweede. Het verhaal begint te groeien onder je pen.\n\nNiet perfect, maar groeiend.`,

        de: `Ein leeres Blatt. Eine vollständige Geschichte.\n\nDu gehst auf die Bühne und setzt dich. Dein Kopf ist nicht völlig leer — da sind Fragmente, Bilder, mögliche Anfänge. Nicht sicher, was daraus wird, aber du hast genug Vertrauen, um anzufangen.\n\nDu schreibst den ersten Satz. Dann den zweiten. Die Geschichte beginnt unter deinem Stift zu wachsen.\n\nNicht perfekt, aber wachsend.`,

        fr: `Une page blanche. Une histoire complète.\n\nTu montes sur scène et tu t'assois. Ton esprit n'est pas complètement vide — il y a des fragments, des images, des ouvertures possibles. Pas sûr de ce que ça deviendra, mais tu as assez confiance pour commencer.\n\nTu écris la première phrase. Puis la deuxième. L'histoire commence à grandir sous ta plume.\n\nImparfaite, mais en croissance.`,

        es: `Una página en blanco. Una historia completa.\n\nSubes al escenario y te sientas. Tu mente no está completamente vacía — hay fragmentos, imágenes, posibles comienzos. No estás seguro de qué se convertirá, pero tienes confianza suficiente para empezar.\n\nEscribes la primera frase. Luego la segunda. La historia empieza a crecer bajo tu pluma.\n\nImperfecta, pero creciendo.`,

        pt: `Uma página em branco. Uma história completa.\n\nVocê sobe ao palco e senta-se. Sua mente não está completamente vazia — há fragmentos, imagens, possíveis começos. Não sabe no que vai se transformar, mas tem confiança suficiente para começar.\n\nEscreve a primeira frase. Depois a segunda. A história começa a crescer sob a sua caneta.\n\nImperfeita, mas crescendo.`,

        it: `Una pagina bianca. Una storia completa.\n\nSali sul palco e ti siedi. La tua mente non è del tutto vuota — ci sono frammenti, immagini, possibili inizi. Non sai cosa diventerà, ma hai abbastanza fiducia per cominciare.\n\nScrivi la prima frase. Poi la seconda. La storia inizia a crescere sotto la tua penna.\n\nImperfetta, ma in crescita.`,

        ru: `Чистый лист. Цельная история.\n\nТы поднимаешься на сцену и садишься. В голове не совсем пусто — есть обрывки, образы, возможные начала. Не уверен, что получится, но достаточно уверен, чтобы начать.\n\nТы пишешь первое предложение. Потом второе. История начинает расти под твоей ручкой.\n\nНе идеальная, но растущая.`,

        ja: `白紙。完全な物語。\n\nステージに上がり、座る。頭は完全に空白ではない——断片、イメージ、いくつかの出だしがある。最終的にどうなるかはわからないが、始めるだけの自信はある。\n\n最初の一文を書く。次に二文目。物語がペンの下で育ち始める。\n\n完璧ではない。だが、育っている。`,

        ko: `빈 페이지. 완전한 이야기.\n\n무대 위로 올라가 앉는다. 머릿속이 완전히 비어 있지는 않다 — 단편들, 이미지들, 가능한 시작들이 있다. 무엇이 될지 확신은 없지만, 시작할 만큼의 자신감은 있다.\n\n첫 문장을 쓴다. 그다음 두 번째. 이야기가 펜 아래서 자라기 시작한다.\n\n완벽하지 않지만, 자라고 있다.`,
      },
      score3: {
        zh: `空白的纸等着你。

你看着它，有一种矛盾的感觉——你有一些想法，但不确定它们够不够好。写一个完整的故事是一回事，写一个值得被读的故事是另一回事。

你在舞台边站了一会儿。也许后面的任务更适合你——音乐、视觉、表演？你还不确定。`,

        en: `The blank page is waiting.\n\nYou look at it and feel a contradictory pull—you have some ideas, but you're not sure they're good enough. Writing a complete story is one thing; writing one worth reading is another.\n\nYou stand at the edge of the stage for a while. Maybe the later tasks suit you better—music, visuals, performance? You're not sure yet.`,

        nl: `Het blanco papier wacht.\n\nJe kijkt ernaar en voelt een tegenstrijdige aantrekkingskracht — je hebt ideeën, maar je weet niet zeker of ze goed genoeg zijn. Een compleet verhaal schrijven is één ding; eentje schrijven dat het lezen waard is, is iets anders.\n\nJe staat een tijdje aan de rand van het podium. Misschien passen de latere taken beter bij je — muziek, beeld, performance? Je weet het nog niet.`,

        de: `Das leere Blatt wartet.\n\nDu schaust es an und spürst einen widersprüchlichen Zug — du hast einige Ideen, aber du bist nicht sicher, ob sie gut genug sind. Eine vollständige Geschichte zu schreiben ist das eine; eine zu schreiben, die es wert ist, gelesen zu werden, ist etwas anderes.\n\nDu stehst eine Weile am Bühnenrand. Vielleicht passen die späteren Aufgaben besser zu dir — Musik, Visuelles, Performance? Du bist dir noch nicht sicher.`,

        fr: `La page blanche attend.\n\nTu la regardes et ressens une attraction contradictoire — tu as des idées, mais tu n'es pas sûr qu'elles soient assez bonnes. Écrire une histoire complète est une chose ; en écrire une qui mérite d'être lue en est une autre.\n\nTu restes un moment au bord de la scène. Peut-être que les tâches suivantes te conviendraient mieux — musique, visuels, performance ? Tu n'en es pas encore sûr.`,

        es: `La página en blanco espera.\n\nLa miras y sientes una atracción contradictoria — tienes algunas ideas, pero no estás seguro de que sean lo suficientemente buenas. Escribir una historia completa es una cosa; escribir una que valga la pena leer es otra.\n\nTe quedas de pie al borde del escenario un rato. Quizás las tareas posteriores te convengan más — música, efectos visuales, actuación. Aún no estás seguro.`,

        pt: `A página em branco espera.\n\nVocê olha para ela e sente um impulso contraditório — tem algumas ideias, mas não tem certeza se são boas o suficiente. Escrever uma história completa é uma coisa; escrever uma que valha a pena ser lida é outra.\n\nFica de pé na beira do palco por um tempo. Talvez as tarefas seguintes sejam mais adequadas — música, visuais, performance? Ainda não tem certeza.`,

        it: `Il foglio bianco aspetta.\n\nLo guardi e senti un richiamo contraddittorio — hai qualche idea, ma non sei sicuro che siano abbastanza buone. Scrivere una storia completa è una cosa; scriverne una che valga la pena leggere è un'altra.\n\nResti in piedi al bordo del palco per un po'. Forse i compiti successivi ti si addicono meglio — musica, effetti visivi, performance? Non ne sei ancora sicuro.`,

        ru: `Чистый лист ждёт.\n\nТы смотришь на него и чувствуешь противоречивое притяжение — у тебя есть идеи, но ты не уверен, что они достаточно хороши. Написать законченную историю — это одно; написать такую, которую стоит прочесть, — совсем другое.\n\nТы стоишь у края сцены какое-то время. Может, более поздние задания подойдут тебе лучше — музыка, визуальные эффекты, выступление? Ты пока не уверен.`,

        ja: `白紙が待っている。\n\nそれを見て、矛盾した引力を感じる——アイデアはある、でもそれが十分かどうかわからない。完全な物語を書くことと、読む価値のある物語を書くことは別物だ。\n\nしばらくステージの端に立っている。後の課題の方が自分に合っているかもしれない——音楽、ビジュアル、パフォーマンス？まだわからない。`,

        ko: `빈 종이가 기다리고 있다.\n\n그것을 바라보며 모순된 끌림을 느낀다 — 아이디어가 있긴 하지만, 충분히 좋은지 확신이 없다. 완전한 이야기를 쓰는 것은 한 가지이고, 읽을 가치가 있는 이야기를 쓰는 것은 또 다른 일이다.\n\n잠시 무대 가장자리에 서 있는다. 아마 뒤의 과제가 더 맞을지도 모른다 — 음악, 시각 효과, 공연? 아직 확신이 없다.`,
      },
      score2: {
        zh: `从空白开始，写一个完整的故事。

你看着那支笔和那叠白纸，内心的声音很诚实：这不是我擅长的事。创造角色、构建情节……你知道有人天生就能做这件事，而你不是。

你退后了。`,

        en: `Start from blank. Write a complete story.\n\nYou look at the pen and paper, and your inner voice is honest: this isn't what I do. Creating characters, building plots... you know some people are born for this. You're not.\n\nYou step back.`,

        nl: `Begin vanaf nul. Schrijf een compleet verhaal.\n\nJe kijkt naar de pen en het papier, en je innerlijke stem is eerlijk: dit is niet wat ik doe. Personages creëren, plots bouwen... je weet dat sommige mensen hier voor geboren zijn. Jij niet.\n\nJe doet een stap terug.`,

        de: `Von Null anfangen. Eine vollständige Geschichte schreiben.\n\nDu schaust auf den Stift und das Papier, und deine innere Stimme ist ehrlich: Das ist nicht meins. Figuren erschaffen, Handlungen aufbauen... du weißt, manche sind dafür geboren. Du nicht.\n\nDu trittst zurück.`,

        fr: `Partir de rien. Écrire une histoire complète.\n\nTu regardes le stylo et le papier, et ta voix intérieure est honnête : ce n'est pas mon domaine. Créer des personnages, construire des intrigues... tu sais que certains sont nés pour ça. Pas toi.\n\nTu recules.`,

        es: `Empezar de cero. Escribir una historia completa.\n\nMiras el bolígrafo y el papel, y tu voz interior es honesta: esto no es lo mío. Crear personajes, construir tramas... sabes que algunas personas nacieron para esto. Tú no.\n\nDas un paso atrás.`,

        pt: `Começar do zero. Escrever uma história completa.\n\nVocê olha para a caneta e o papel, e a sua voz interior é honesta: isto não é o meu forte. Criar personagens, construir enredos... sabe que algumas pessoas nasceram para isto. Você não.\n\nDá um passo atrás.`,

        it: `Partire dal nulla. Scrivere una storia completa.\n\nGuardi la penna e la carta, e la tua voce interiore è onesta: questo non è il mio campo. Creare personaggi, costruire trame... sai che alcune persone sono nate per questo. Tu no.\n\nFai un passo indietro.`,

        ru: `Начать с нуля. Написать целую историю.\n\nТы смотришь на ручку и бумагу, и внутренний голос честен: это не моё. Создавать персонажей, выстраивать сюжеты... ты знаешь, что некоторые для этого рождены. Ты — нет.\n\nТы отступаешь.`,

        ja: `白紙から始める。完全な物語を書く。\n\nペンと紙を見て、内なる声が正直に言う：これは自分の領域ではない。キャラクターを創り、プロットを組む……そういうことが生まれつきできる人がいる。自分はそうではない。\n\n一歩下がる。`,

        ko: `백지에서 시작한다. 완전한 이야기를 쓴다.\n\n펜과 종이를 바라보며, 내면의 목소리가 솔직하게 말한다: 이건 내 영역이 아니다. 캐릭터를 만들고 줄거리를 짜는 것... 어떤 사람들은 이걸 위해 태어났다는 걸 안다. 당신은 아니다.\n\n한 발 물러선다.`,
      },
      score1: {
        zh: `那张空白的纸对你没有召唤力。

不是因为你不理解故事的价值。是因为「从无到有写出一个故事」这件事，完全不在你的本能里。笔和纸在那里，但你和它们之间没有那条看不见的线。

你站在舞台边缘，等着这场演出推进到你可以参与的环节。`,

        en: `The blank page holds no call for you.\n\nNot because you don't value stories. Because "creating something from nothing on a page" simply isn't part of your instincts. The pen and paper are there, but the invisible thread between them and you doesn't exist.\n\nYou stand at the stage's edge, waiting for this performance to reach a part you can join.`,

        nl: `Het blanco papier roept je niet.\n\nNiet omdat je verhalen niet waardeert. Omdat "iets uit niets creëren op papier" simpelweg geen deel uitmaakt van je instincten. De pen en het papier zijn er, maar de onzichtbare draad tussen hen en jou bestaat niet.\n\nJe staat aan de rand van het podium en wacht tot deze voorstelling een deel bereikt waar jij aan kunt meedoen.`,

        de: `Das leere Blatt übt keinen Ruf auf dich aus.\n\nNicht weil du Geschichten nicht schätzt. Weil „etwas aus dem Nichts auf Papier erschaffen" schlicht nicht Teil deiner Instinkte ist. Stift und Papier sind da, aber der unsichtbare Faden zwischen ihnen und dir existiert nicht.\n\nDu stehst am Bühnenrand und wartest, bis diese Vorstellung einen Teil erreicht, bei dem du mitmachen kannst.`,

        fr: `La page blanche ne t'appelle pas.\n\nPas parce que tu ne valorises pas les histoires. Parce que « créer quelque chose à partir de rien sur une page » ne fait tout simplement pas partie de tes instincts. Le stylo et le papier sont là, mais le fil invisible entre eux et toi n'existe pas.\n\nTu restes au bord de la scène, attendant que ce spectacle atteigne une partie à laquelle tu peux participer.`,

        es: `La página en blanco no te llama.\n\nNo porque no valores las historias. Porque "crear algo de la nada en una página" simplemente no forma parte de tus instintos. El bolígrafo y el papel están ahí, pero el hilo invisible entre ellos y tú no existe.\n\nTe quedas al borde del escenario, esperando a que este espectáculo llegue a una parte en la que puedas participar.`,

        pt: `A página em branco não o chama.\n\nNão porque não valorize histórias. Porque "criar algo do nada numa página" simplesmente não faz parte dos seus instintos. A caneta e o papel estão lá, mas o fio invisível entre eles e você não existe.\n\nFica na beira do palco, esperando que este espetáculo chegue a uma parte em que possa participar.`,

        it: `Il foglio bianco non ti chiama.\n\nNon perché non apprezzi le storie. Perché "creare qualcosa dal nulla su una pagina" semplicemente non fa parte dei tuoi istinti. La penna e la carta ci sono, ma il filo invisibile tra loro e te non esiste.\n\nResti al bordo del palco, aspettando che questo spettacolo raggiunga una parte a cui puoi unirti.`,

        ru: `Чистый лист тебя не зовёт.\n\nНе потому что ты не ценишь истории. Потому что «создать что-то из ничего на бумаге» просто не входит в твои инстинкты. Ручка и бумага на месте, но невидимая нить между ними и тобой не существует.\n\nТы стоишь у края сцены, ожидая, пока это представление дойдёт до части, в которой ты сможешь участвовать.`,

        ja: `白紙はあなたを呼んでいない。\n\n物語を大切に思わないからではない。「ページの上で無から何かを生み出す」ということが、単にあなたの本能にないからだ。ペンと紙はそこにある。でもそれらとあなたの間の見えない糸は存在しない。\n\nステージの端に立ち、この公演が自分が参加できるパートに達するのを待つ。`,

        ko: `빈 종이는 당신을 부르지 않는다.\n\n이야기를 소중히 여기지 않아서가 아니다. "페이지 위에서 무에서 유를 창조하는 것"이 당신의 본능에 없기 때문이다. 펜과 종이는 거기 있지만, 그것들과 당신 사이의 보이지 않는 실은 존재하지 않는다.\n\n무대 가장자리에 서서, 이 공연이 자신이 참여할 수 있는 부분에 도달하기를 기다린다.`,
      },
    },
  },

  // ── Q12: Compose or arrange music ──────────────────────────
  {
    id: 12,
    riasec: "A",
    miniIpCode: "A2",
    miniIpItem: "Compose or arrange music",
    chapter: "theater",
    chapterIndex: 3,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `故事写好了。纸从桌上被取走，送到后台。

然后舞台灯光转向乐池。乐池里有钢琴、吉他、鼓、几件你叫不上名字的乐器，还有空白的乐谱架和铅笔。

屏幕更新：「故事需要音乐。需要有人创作配乐，或编排一段旋律。」

Adrian 看了一眼乐池：「有人会作曲吗？」
Kai 说：「会一点。但不是专业的那种。」
Leila 轻声说：「我不会任何乐器。」

屏幕补充：「不要求专业技能。需要的是：你愿不愿意创造声音。」

乐器在那里。空白乐谱在那里。需要有人走下去，坐在钢琴前，或拿起吉他，开始创作——哪怕只是一段简单的旋律，然后把它编排成这个故事的配乐。`,

      en: `The story is done. The paper is taken from the table to backstage.\n\nThen the lights swing toward the orchestra pit. Inside: a piano, guitars, drums, instruments you can't name, plus blank sheet music stands and pencils.\n\nThe screen updates: "The story needs music. Someone must compose a score, or arrange a melody."\n\nAdrian glances at the pit: "Can anyone compose?"\nKai says: "A little. Not professionally."\nLeila says softly: "I don't play any instruments."\n\nThe screen adds: "Professional skill is not required. What's needed: are you willing to create sound."\n\nThe instruments are there. Blank scores are there. Someone needs to go down, sit at the piano or pick up a guitar, and start creating — even just a simple melody — then arrange it into the story's score.`,

      nl: `Het verhaal is af. Het papier wordt van de tafel meegenomen naar backstage.\n\nDan zwenkt het licht naar de orkestbak. Erin: een piano, gitaren, drums, instrumenten die je niet bij naam kunt noemen, plus blanco bladmuziekstandaards en potloden.\n\nHet scherm wordt bijgewerkt: "Het verhaal heeft muziek nodig. Iemand moet een partituur componeren, of een melodie arrangeren."\n\nAdrian werpt een blik op de bak: "Kan iemand componeren?"\nKai zegt: "Een beetje. Niet professioneel."\nLeila zegt zachtjes: "Ik speel geen enkel instrument."\n\nHet scherm voegt een kleine regel toe: "Professionele vaardigheid is niet vereist. Wat nodig is: ben je bereid geluid te creëren."\n\nDe instrumenten zijn er. Blanco partituren zijn er. Iemand moet naar beneden gaan, achter de piano gaan zitten of een gitaar pakken, en beginnen met creëren — al is het maar een eenvoudige melodie — en het vervolgens arrangeren als de soundtrack van het verhaal.`,

      de: `Die Geschichte ist fertig. Das Papier wird vom Tisch hinter die Bühne gebracht.\n\nDann schwenkt das Licht zum Orchestergraben. Darin: ein Klavier, Gitarren, Schlagzeug, Instrumente, die du nicht benennen kannst, dazu leere Notenständer und Bleistifte.\n\nDer Bildschirm aktualisiert sich: „Die Geschichte braucht Musik. Jemand muss eine Partitur komponieren oder eine Melodie arrangieren."\n\nAdrian blickt in den Graben: „Kann jemand komponieren?"\nKai sagt: „Ein bisschen. Nicht professionell."\nLeila sagt leise: „Ich spiele kein Instrument."\n\nDer Bildschirm fügt eine kleine Zeile hinzu: „Professionelles Können ist nicht erforderlich. Was zählt, ist: Bist du bereit, Klang zu erschaffen."\n\nDie Instrumente sind da. Leere Partituren sind da. Jemand muss hinuntergehen, sich ans Klavier setzen oder eine Gitarre nehmen und anfangen zu schaffen — selbst wenn es nur eine einfache Melodie ist — und sie dann zur Filmmusik der Geschichte arrangieren.`,

      fr: `L'histoire est terminée. Le papier est emporté de la table vers les coulisses.\n\nPuis les lumières se tournent vers la fosse d'orchestre. À l'intérieur : un piano, des guitares, une batterie, des instruments que tu ne saurais nommer, plus des pupitres vierges et des crayons.\n\nL'écran se met à jour : « L'histoire a besoin de musique. Quelqu'un doit composer une partition, ou arranger une mélodie. »\n\nAdrian jette un œil à la fosse : « Quelqu'un sait composer ? »\nKai dit : « Un peu. Pas professionnellement. »\nLeila dit doucement : « Je ne joue d'aucun instrument. »\n\nL'écran ajoute une petite ligne : « Les compétences professionnelles ne sont pas requises. Ce qui compte : êtes-vous prêt à créer du son. »\n\nLes instruments sont là. Les partitions vierges sont là. Quelqu'un doit descendre, s'asseoir au piano ou prendre une guitare, et commencer à créer — même si ce n'est qu'une simple mélodie — puis l'arranger en bande sonore de l'histoire.`,

      es: `La historia está terminada. El papel es llevado de la mesa al backstage.\n\nEntonces las luces giran hacia el foso de la orquesta. Dentro: un piano, guitarras, batería, instrumentos que no puedes nombrar, más atriles con partituras en blanco y lápices.\n\nLa pantalla se actualiza: "La historia necesita música. Alguien debe componer una partitura, o arreglar una melodía."\n\nAdrian echa un vistazo al foso: "¿Alguien sabe componer?"\nKai dice: "Un poco. No profesionalmente."\nLeila dice suavemente: "No toco ningún instrumento."\n\nLa pantalla añade una línea pequeña: "No se requiere habilidad profesional. Lo que se necesita es: ¿estás dispuesto a crear sonido?"\n\nLos instrumentos están ahí. Las partituras en blanco están ahí. Alguien necesita bajar, sentarse al piano o tomar una guitarra, y empezar a crear — aunque sea solo una melodía simple — y luego arreglarla como la banda sonora de la historia.`,

      pt: `A história está pronta. O papel é levado da mesa para os bastidores.\n\nEntão as luzes giram para o fosso da orquestra. Lá dentro: um piano, guitarras, bateria, instrumentos que não consegue nomear, além de estantes de partitura vazias e lápis.\n\nA tela atualiza: "A história precisa de música. Alguém deve compor uma partitura, ou arranjar uma melodia."\n\nAdrian olha para o fosso: "Alguém sabe compor?"\nKai diz: "Um pouco. Não profissionalmente."\nLeila diz suavemente: "Não toco nenhum instrumento."\n\nA tela acrescenta uma linha pequena: "Habilidade profissional não é necessária. O que importa é: você está disposto a criar som."\n\nOs instrumentos estão lá. As partituras em branco estão lá. Alguém precisa descer, sentar ao piano ou pegar um violão, e começar a criar — mesmo que seja apenas uma melodia simples — e depois arranjá-la como trilha sonora da história.`,

      it: `La storia è finita. La carta viene portata dal tavolo al backstage.\n\nPoi le luci si spostano verso la buca dell'orchestra. All'interno: un pianoforte, chitarre, batteria, strumenti che non sai nominare, più leggii vuoti e matite.\n\nLo schermo si aggiorna: "La storia ha bisogno di musica. Qualcuno deve comporre una partitura, o arrangiare una melodia."\n\nAdrian lancia un'occhiata alla buca: "Qualcuno sa comporre?"\nKai dice: "Un po'. Non professionalmente."\nLeila dice piano: "Non suono nessuno strumento."\n\nLo schermo aggiunge una piccola riga: "Non è richiesta abilità professionale. Ciò che serve è: sei disposto a creare suono."\n\nGli strumenti ci sono. Le partiture vuote ci sono. Qualcuno deve scendere, sedersi al pianoforte o prendere una chitarra, e iniziare a creare — anche solo una melodia semplice — e poi arrangiarla come colonna sonora della storia.`,

      ru: `История готова. Бумагу забирают со стола за кулисы.\n\nЗатем свет поворачивается к оркестровой яме. Внутри: рояль, гитары, барабаны, инструменты, названия которых ты не знаешь, плюс чистые нотные пюпитры и карандаши.\n\nНа экране обновление: «Истории нужна музыка. Кто-то должен сочинить партитуру или аранжировать мелодию».\n\nАдриан бросает взгляд на яму: «Кто-нибудь умеет сочинять?»\nКай говорит: «Немного. Не профессионально».\nЛейла тихо говорит: «Я не играю ни на одном инструменте».\n\nНа экране появляется мелкая строчка: «Профессиональные навыки не требуются. Нужно другое: готовы ли вы создавать звук».\n\nИнструменты на месте. Чистые партитуры на месте. Кому-то нужно спуститься, сесть за рояль или взять гитару и начать создавать — пусть даже простую мелодию — а затем аранжировать её в саундтрек истории.`,

      ja: `物語は完成した。紙はテーブルから舞台裏へ運ばれる。\n\nそしてライトがオーケストラピットへ向く。中にはピアノ、ギター、ドラム、名前がわからない楽器、それに空の譜面台と鉛筆。\n\nスクリーンが更新される：「物語に音楽が必要だ。誰かがスコアを作曲するか、メロディーを編曲しなければならない。」\n\nAdrianがピットを見る：「誰か作曲できる？」\nKaiが言う：「少し。プロではないけど。」\nLeilaが小声で言う：「楽器は何も弾けません。」\n\nスクリーンに小さな一行が追加される：「プロの技術は不要。必要なのは：音を創り出す意思があるか。」\n\n楽器はそこにある。白紙の楽譜もそこにある。誰かが降りて行き、ピアノの前に座るかギターを手に取り、創作を始める必要がある——たとえシンプルなメロディーだけでも——そしてそれを物語のスコアに編曲する。`,

      ko: `이야기가 완성됐다. 종이는 테이블에서 무대 뒤로 옮겨진다.\n\n그러자 조명이 오케스트라 피트를 향한다. 안에는 피아노, 기타, 드럼, 이름을 알 수 없는 악기들, 그리고 빈 악보대와 연필들이 있다.\n\n화면이 업데이트된다: "이야기에 음악이 필요하다. 누군가 악보를 작곡하거나, 멜로디를 편곡해야 한다."\n\nAdrian이 피트를 흘끗 본다: "누가 작곡할 수 있어?"\nKai가 말한다: "조금. 전문적이진 않지만."\nLeila가 조용히 말한다: "저는 악기를 하나도 못 해요."\n\n화면에 작은 글이 추가된다: "전문 기술은 필요하지 않습니다. 필요한 것은: 소리를 창조할 의지가 있는가."\n\n악기가 있다. 빈 악보가 있다. 누군가 내려가서 피아노 앞에 앉거나 기타를 들고 창작을 시작해야 한다 — 비록 단순한 멜로디일지라도 — 그리고 그것을 이야기의 스코어로 편곡해야 한다.`,
    },
    taskDescription: {
      zh: "为演出创作或编排一段音乐——选择乐器，构思旋律，完成配乐。这项任务需要一个主要负责人。",

      en: `Create or arrange music for the performance—choose an instrument, conceive a melody, complete a score. This task needs one primary person.`,

      nl: `Creëer of arrangeer muziek voor de voorstelling — kies een instrument, bedenk een melodie, voltooi een partituur. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Erstelle oder arrangiere Musik für die Aufführung — wähle ein Instrument, entwirf eine Melodie, vollende eine Partitur. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Crée ou arrange de la musique pour le spectacle — choisis un instrument, conçois une mélodie, achève une partition. Cette tâche nécessite un responsable principal.`,

      es: `Crea o arregla música para la actuación — elige un instrumento, concibe una melodía, completa una partitura. Esta tarea necesita un responsable principal.`,

      pt: `Crie ou arranje música para a apresentação — escolha um instrumento, conceba uma melodia, complete uma partitura. Esta tarefa precisa de um responsável principal.`,

      it: `Crea o arrangia musica per lo spettacolo — scegli uno strumento, concepisci una melodia, completa una partitura. Questo compito richiede un responsabile principale.`,

      ru: `Создай или аранжируй музыку для представления — выбери инструмент, придумай мелодию, заверши партитуру. Для этой задачи нужен один главный ответственный.`,

      ja: `公演のために音楽を作曲または編曲する——楽器を選び、メロディーを構想し、スコアを完成させる。この課題には一人の主担当者が必要だ。`,

      ko: `공연을 위한 음악을 작곡하거나 편곡하세요 — 악기를 선택하고, 멜로디를 구상하고, 악보를 완성하세요. 이 과제는 한 명의 주 담당자가 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走向乐池。

不是因为你是专业音乐人——也许你是，也许不是。是因为当你看见那些乐器的时候，你脑子里已经有声音了。一段旋律，模糊的，但它在那里。

你坐到钢琴前——或者拿起了吉他。手指触碰到琴键或琴弦的那一刻，声音从想象变成了现实。

第一个音符不完美。但它是真的。`,

        en: `You walk toward the pit.\n\nNot because you're a professional musician—maybe you are, maybe not. Because when you saw those instruments, sound was already in your head. A melody, vague, but there.\n\nYou sit at the piano—or pick up the guitar. The moment your fingers touch the keys or strings, sound transforms from imagination to reality.\n\nThe first note isn't perfect. But it's real.`,

        nl: `Je loopt naar de orkestbak.\n\nNiet omdat je een professioneel muzikant bent — misschien wel, misschien niet. Omdat er al geluid in je hoofd zat toen je die instrumenten zag. Een melodie, vaag, maar aanwezig.\n\nJe gaat achter de piano zitten — of pakt de gitaar. Het moment dat je vingers de toetsen of snaren raken, verandert geluid van verbeelding in werkelijkheid.\n\nDe eerste noot is niet perfect. Maar hij is echt.`,

        de: `Du gehst zum Orchestergraben.\n\nNicht weil du ein professioneller Musiker bist — vielleicht ja, vielleicht nicht. Weil bereits Klang in deinem Kopf war, als du die Instrumente sahst. Eine Melodie, vage, aber da.\n\nDu setzt dich ans Klavier — oder nimmst die Gitarre. In dem Moment, in dem deine Finger die Tasten oder Saiten berühren, verwandelt sich Klang von Vorstellung in Wirklichkeit.\n\nDie erste Note ist nicht perfekt. Aber sie ist echt.`,

        fr: `Tu avances vers la fosse.\n\nPas parce que tu es musicien professionnel — peut-être que oui, peut-être que non. Parce que quand tu as vu ces instruments, le son était déjà dans ta tête. Une mélodie, vague, mais présente.\n\nTu t'assois au piano — ou tu prends la guitare. À l'instant où tes doigts touchent les touches ou les cordes, le son passe de l'imagination à la réalité.\n\nLa première note n'est pas parfaite. Mais elle est vraie.`,

        es: `Caminas hacia el foso.\n\nNo porque seas un músico profesional — quizás lo eres, quizás no. Porque cuando viste esos instrumentos, ya había sonido en tu cabeza. Una melodía, vaga, pero presente.\n\nTe sientas al piano — o tomas la guitarra. En el momento en que tus dedos tocan las teclas o las cuerdas, el sonido se transforma de imaginación a realidad.\n\nLa primera nota no es perfecta. Pero es real.`,

        pt: `Você caminha para o fosso.\n\nNão porque seja músico profissional — talvez seja, talvez não. Porque quando viu aqueles instrumentos, o som já estava na sua cabeça. Uma melodia, vaga, mas presente.\n\nSenta-se ao piano — ou pega o violão. No momento em que os dedos tocam as teclas ou as cordas, o som se transforma de imaginação em realidade.\n\nA primeira nota não é perfeita. Mas é real.`,

        it: `Cammini verso la buca.\n\nNon perché sei un musicista professionista — forse sì, forse no. Perché quando hai visto quegli strumenti, il suono era già nella tua testa. Una melodia, vaga, ma presente.\n\nTi siedi al pianoforte — o prendi la chitarra. Nell'istante in cui le tue dita toccano i tasti o le corde, il suono si trasforma da immaginazione a realtà.\n\nLa prima nota non è perfetta. Ma è reale.`,

        ru: `Ты идёшь к оркестровой яме.\n\nНе потому что ты профессиональный музыкант — может да, может нет. Потому что когда ты увидел эти инструменты, звук уже был в твоей голове. Мелодия, смутная, но она там.\n\nТы садишься за рояль — или берёшь гитару. В тот момент, когда пальцы касаются клавиш или струн, звук превращается из воображения в реальность.\n\nПервая нота несовершенна. Но она настоящая.`,

        ja: `ピットに向かって歩く。\n\nプロの音楽家だからではない——そうかもしれないし、そうでないかもしれない。あの楽器を見た瞬間、頭の中にすでに音があったから。メロディー、漠然としているが、そこにある。\n\nピアノの前に座る——あるいはギターを手に取る。指が鍵盤や弦に触れた瞬間、音が想像から現実に変わる。\n\n最初の音は完璧ではない。だが本物だ。`,

        ko: `피트를 향해 걸어간다.\n\n전문 음악가이기 때문이 아니다 — 그럴 수도 있고 아닐 수도 있다. 그 악기들을 봤을 때, 머릿속에 이미 소리가 있었기 때문이다. 멜로디, 흐릿하지만, 거기 있었다.\n\n피아노 앞에 앉는다 — 혹은 기타를 집는다. 손가락이 건반이나 줄에 닿는 순간, 소리가 상상에서 현실로 바뀐다.\n\n첫 음은 완벽하지 않다. 하지만 진짜다.`,
      },
      score4: {
        zh: `创作一段音乐。

你走下乐池的台阶，环顾了一下那些乐器。你对音乐的理解不一定是理论化的——但你知道什么听起来对，什么不对。

你拿起一件乐器，试了几个音。然后又试了几个。某种旋律开始在你手底下形成。

不确定最后会变成什么样，但你愿意继续。`,

        en: `Create a piece of music.\n\nYou walk down the pit steps and look around at the instruments. Your understanding of music may not be theoretical—but you know what sounds right and what doesn't.\n\nYou pick up an instrument, try a few notes. Then a few more. Something like a melody starts forming under your hands.\n\nNot sure what it'll become, but you're willing to keep going.`,

        nl: `Een stuk muziek creëren.\n\nJe loopt de trap van de orkestbak af en kijkt rond naar de instrumenten. Je begrip van muziek is misschien niet theoretisch — maar je weet wat goed klinkt en wat niet.\n\nJe pakt een instrument, probeert een paar noten. Dan nog een paar. Iets als een melodie begint zich te vormen onder je handen.\n\nNiet zeker wat het wordt, maar je bent bereid door te gaan.`,

        de: `Ein Stück Musik erschaffen.\n\nDu gehst die Stufen zum Orchestergraben hinunter und schaust dich bei den Instrumenten um. Dein Verständnis von Musik mag nicht theoretisch sein — aber du weißt, was richtig klingt und was nicht.\n\nDu nimmst ein Instrument, probierst ein paar Noten. Dann noch ein paar. Etwas wie eine Melodie beginnt unter deinen Händen Gestalt anzunehmen.\n\nNicht sicher, was daraus wird, aber du bist bereit weiterzumachen.`,

        fr: `Créer un morceau de musique.\n\nTu descends les marches de la fosse et tu regardes les instruments autour de toi. Ta compréhension de la musique n'est peut-être pas théorique — mais tu sais ce qui sonne juste et ce qui ne sonne pas.\n\nTu prends un instrument, essaies quelques notes. Puis quelques autres. Quelque chose comme une mélodie commence à se former sous tes mains.\n\nPas sûr de ce que ça deviendra, mais tu es prêt à continuer.`,

        es: `Crear una pieza musical.\n\nBajas los escalones del foso y miras los instrumentos a tu alrededor. Tu comprensión de la música puede no ser teórica — pero sabes lo que suena bien y lo que no.\n\nTomas un instrumento, pruebas unas notas. Luego unas más. Algo como una melodía empieza a formarse bajo tus manos.\n\nNo estás seguro de qué se convertirá, pero estás dispuesto a seguir.`,

        pt: `Criar uma peça musical.\n\nVocê desce os degraus do fosso e olha ao redor para os instrumentos. O seu entendimento de música pode não ser teórico — mas sabe o que soa bem e o que não soa.\n\nPega num instrumento, experimenta algumas notas. Depois mais algumas. Algo como uma melodia começa a formar-se sob as suas mãos.\n\nNão sabe no que vai se transformar, mas está disposto a continuar.`,

        it: `Creare un brano musicale.\n\nScendi i gradini della buca e guardi gli strumenti intorno a te. La tua comprensione della musica potrebbe non essere teorica — ma sai cosa suona giusto e cosa no.\n\nPrendi uno strumento, provi qualche nota. Poi qualcuna in più. Qualcosa simile a una melodia inizia a formarsi sotto le tue mani.\n\nNon sei sicuro di cosa diventerà, ma sei disposto a continuare.`,

        ru: `Создать музыкальное произведение.\n\nТы спускаешься по ступенькам в оркестровую яму и осматриваешь инструменты. Твоё понимание музыки может быть не теоретическим — но ты знаешь, что звучит правильно, а что нет.\n\nТы берёшь инструмент, пробуешь несколько нот. Потом ещё несколько. Что-то вроде мелодии начинает складываться под твоими руками.\n\nНе уверен, что получится, но готов продолжать.`,

        ja: `音楽を一曲つくる。\n\nピットの階段を降りて、楽器を見回す。音楽の理解は理論的ではないかもしれない——でも何が正しく聞こえて何が違うかはわかる。\n\n楽器を一つ手に取り、いくつかの音を試す。それからもう少し。何かメロディーのようなものが手の下で形を成し始める。\n\n最終的にどうなるかはわからないが、続ける気持ちはある。`,

        ko: `음악을 만든다.\n\n피트 계단을 내려가며 악기들을 둘러본다. 음악에 대한 이해가 이론적이지 않을 수도 있다 — 하지만 무엇이 맞게 들리고 무엇이 그렇지 않은지는 안다.\n\n악기를 하나 집어 몇 음을 시도한다. 그리고 몇 음 더. 멜로디 같은 것이 손 아래에서 형성되기 시작한다.\n\n무엇이 될지 확신은 없지만, 계속할 의지가 있다.`,
      },
      score3: {
        zh: `你看了看那些乐器，又看了看空白的乐谱。

作曲……你对音乐有感觉，但把感觉变成可被演奏的旋律——这中间有一段距离。你不确定自己能不能跨过去。

你在乐池边站了一会儿，没有走下去。也许在后面的环节，你能找到更适合自己的参与方式。`,

        en: `You look at the instruments, then at the blank scores.\n\nComposing... you have a feeling for music, but turning feeling into playable melody—there's a gap. You're not sure you can bridge it.\n\nYou stand at the pit's edge for a while, not going down. Maybe in a later part you'll find a better way to participate.`,

        nl: `Je kijkt naar de instrumenten, dan naar de blanco partituren.\n\nComponeren... je hebt gevoel voor muziek, maar gevoel omzetten in speelbare melodie — daar zit een kloof. Je weet niet zeker of je die kunt overbruggen.\n\nJe staat een tijdje aan de rand van de bak, zonder naar beneden te gaan. Misschien vind je in een later onderdeel een betere manier om mee te doen.`,

        de: `Du schaust auf die Instrumente, dann auf die leeren Partituren.\n\nKomponieren... du hast ein Gefühl für Musik, aber Gefühl in spielbare Melodie verwandeln — da klafft eine Lücke. Du bist nicht sicher, ob du sie überbrücken kannst.\n\nDu stehst eine Weile am Rand des Grabens, ohne hinunterzugehen. Vielleicht findest du in einem späteren Teil einen besseren Weg mitzumachen.`,

        fr: `Tu regardes les instruments, puis les partitions vierges.\n\nComposer... tu as le sens de la musique, mais transformer un sentiment en mélodie jouable — il y a un écart. Tu n'es pas sûr de pouvoir le combler.\n\nTu restes un moment au bord de la fosse, sans descendre. Peut-être que dans une partie ultérieure tu trouveras une meilleure façon de participer.`,

        es: `Miras los instrumentos, luego las partituras en blanco.\n\nComponer... tienes sensibilidad musical, pero convertir esa sensibilidad en una melodía tocable — hay una brecha. No estás seguro de poder cerrarla.\n\nTe quedas al borde del foso un rato, sin bajar. Quizás en una parte posterior encuentres una mejor forma de participar.`,

        pt: `Olha para os instrumentos, depois para as partituras em branco.\n\nCompor... tem sensibilidade para música, mas transformar sensibilidade em melodia tocável — há uma lacuna. Não tem certeza se consegue superá-la.\n\nFica na beira do fosso por um tempo, sem descer. Talvez numa parte posterior encontre uma forma melhor de participar.`,

        it: `Guardi gli strumenti, poi le partiture vuote.\n\nComporre... hai sensibilità per la musica, ma trasformare la sensibilità in melodia suonabile — c'è un divario. Non sei sicuro di poterlo colmare.\n\nResti al bordo della buca per un po', senza scendere. Forse in una parte successiva troverai un modo migliore di partecipare.`,

        ru: `Ты смотришь на инструменты, затем на чистые партитуры.\n\nКомпозиция... у тебя есть чувство музыки, но превратить чувство в играемую мелодию — между этим пропасть. Ты не уверен, что сможешь её преодолеть.\n\nТы стоишь у края ямы какое-то время, не спускаясь. Может быть, в более поздней части найдёшь лучший способ участвовать.`,

        ja: `楽器を見る。それから白紙の楽譜を見る。\n\n作曲……音楽への感覚はある。でも感覚を演奏可能なメロディーに変える——そこにはギャップがある。それを埋められるかわからない。\n\nしばらくピットの縁に立っている。降りない。後のパートで、もっと自分に合った参加方法が見つかるかもしれない。`,

        ko: `악기를 보고, 그다음 빈 악보를 본다.\n\n작곡... 음악에 대한 감각은 있지만, 감각을 연주 가능한 멜로디로 바꾸는 것 — 그 사이에 간극이 있다. 그것을 메울 수 있을지 확신이 없다.\n\n잠시 피트 가장자리에 서 있는다. 내려가지 않는다. 아마 나중 파트에서 더 나은 참여 방법을 찾을 수 있을 것이다.`,
      },
      score2: {
        zh: `创造声音。

你看着那些乐器，它们很美，但它们不是你的工具。作曲或编排音乐——这需要一种你此刻感觉不到的创造冲动。

你留在了观众席的位置。`,

        en: `Creating sound.\n\nYou look at the instruments—beautiful, but they're not your tools. Composing or arranging music requires a creative impulse you can't feel right now.\n\nYou stay in the audience's position.`,

        nl: `Geluid creëren.\n\nJe kijkt naar de instrumenten — prachtig, maar het zijn niet jouw gereedschappen. Componeren of arrangeren vereist een creatieve impuls die je nu niet voelt.\n\nJe blijft op de plek van het publiek.`,

        de: `Klang erschaffen.\n\nDu schaust auf die Instrumente — schön, aber es sind nicht deine Werkzeuge. Komponieren oder Arrangieren erfordert einen kreativen Impuls, den du gerade nicht spürst.\n\nDu bleibst auf dem Platz des Publikums.`,

        fr: `Créer du son.\n\nTu regardes les instruments — magnifiques, mais ce ne sont pas tes outils. Composer ou arranger de la musique exige une impulsion créative que tu ne ressens pas en ce moment.\n\nTu restes à la place du public.`,

        es: `Crear sonido.\n\nMiras los instrumentos — hermosos, pero no son tus herramientas. Componer o arreglar música requiere un impulso creativo que ahora mismo no sientes.\n\nTe quedas en la posición del público.`,

        pt: `Criar som.\n\nOlha para os instrumentos — bonitos, mas não são as suas ferramentas. Compor ou arranjar música requer um impulso criativo que não consegue sentir agora.\n\nFica na posição da plateia.`,

        it: `Creare suono.\n\nGuardi gli strumenti — belli, ma non sono i tuoi attrezzi. Comporre o arrangiare musica richiede un impulso creativo che in questo momento non riesci a sentire.\n\nResti nella posizione del pubblico.`,

        ru: `Создавать звук.\n\nТы смотришь на инструменты — красивые, но это не твои инструменты. Сочинение или аранжировка музыки требует творческого порыва, который ты сейчас не чувствуешь.\n\nТы остаёшься на месте зрителя.`,

        ja: `音を創り出す。\n\n楽器を見る——美しいが、自分の道具ではない。作曲や編曲には、今感じられない創造の衝動が必要だ。\n\n観客席の位置にとどまる。`,

        ko: `소리를 창조한다.\n\n악기들을 바라본다 — 아름답지만, 당신의 도구가 아니다. 작곡이나 편곡에는 지금 느낄 수 없는 창작 충동이 필요하다.\n\n관객석 자리에 머문다.`,
      },
      score1: {
        zh: `乐池里的乐器对你来说是陌生的领域。

不是不欣赏音乐——是「创作音乐」这件事和你之间没有任何连接。走下去、拿起乐器、创造旋律——你在心里快速过了一遍这个画面，每一步都让你更确定：这不是你的任务。`,

        en: `The instruments in the pit are foreign territory.\n\nNot that you don't appreciate music—it's that "creating music" has no connection to you. Going down, picking up an instrument, producing melody—you run through the picture in your mind, and each step makes you more certain: not your task.`,

        nl: `De instrumenten in de bak zijn onbekend terrein.\n\nNiet dat je geen muziek waardeert — het is dat "muziek creëren" geen verbinding met jou heeft. Naar beneden gaan, een instrument pakken, melodie produceren — je laat het beeld door je hoofd gaan, en elke stap maakt je zekerder: niet jouw taak.`,

        de: `Die Instrumente im Graben sind fremdes Territorium.\n\nNicht dass du Musik nicht schätzt — es ist, dass „Musik erschaffen" keine Verbindung zu dir hat. Hinuntergehen, ein Instrument nehmen, Melodie erzeugen — du gehst das Bild in deinem Kopf durch, und jeder Schritt macht dich sicherer: nicht deine Aufgabe.`,

        fr: `Les instruments dans la fosse sont un territoire étranger.\n\nCe n'est pas que tu n'apprécies pas la musique — c'est que « créer de la musique » n'a aucune connexion avec toi. Descendre, prendre un instrument, produire une mélodie — tu passes l'image en revue dans ta tête, et chaque étape te rend plus certain : pas ta tâche.`,

        es: `Los instrumentos en el foso son territorio desconocido.\n\nNo es que no aprecies la música — es que "crear música" no tiene conexión contigo. Bajar, tomar un instrumento, producir una melodía — recorres la imagen en tu mente, y cada paso te hace más seguro: no es tu tarea.`,

        pt: `Os instrumentos no fosso são território desconhecido.\n\nNão que não aprecie música — é que "criar música" não tem nenhuma conexão consigo. Descer, pegar um instrumento, produzir melodia — percorre a imagem na mente, e cada passo torna-o mais certo: não é a sua tarefa.`,

        it: `Gli strumenti nella buca sono territorio sconosciuto.\n\nNon che tu non apprezzi la musica — è che "creare musica" non ha alcuna connessione con te. Scendere, prendere uno strumento, produrre melodia — scorri l'immagine nella mente, e ogni passo ti rende più certo: non è il tuo compito.`,

        ru: `Инструменты в яме — чужая территория.\n\nНе то чтобы ты не ценишь музыку — просто «создание музыки» никак с тобой не связано. Спуститься, взять инструмент, создать мелодию — ты прокручиваешь картину в голове, и каждый шаг делает тебя увереннее: не твоя задача.`,

        ja: `ピットの楽器は未知の領域だ。\n\n音楽を理解しないわけではない——「音楽を創る」ということが自分と何のつながりもないのだ。降りていく、楽器を手に取る、メロディーを生み出す——頭の中でその光景を追うと、一歩ごとにより確信が深まる：これは自分の課題ではない。`,

        ko: `피트의 악기들은 낯선 영역이다.\n\n음악을 감상하지 않는 것이 아니다 — "음악을 창작하는 것"이 당신과 아무 연결이 없는 것이다. 내려가서, 악기를 집고, 멜로디를 만드는 것 — 머릿속으로 그 장면을 빠르게 훑어보면, 매 단계가 더 확신하게 만든다: 내 과제가 아니다.`,
      },
    },
  },

  // ── Q13: Create special effects for movies ─────────────────
  {
    id: 13,
    riasec: "A",
    miniIpCode: "A3",
    miniIpItem: "Create special effects for movies",
    chapter: "theater",
    chapterIndex: 3,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `音乐的雏形出来了。剧场里有了声音。

但灯光总监的位置是空的。后台的控制台连着整个剧场的灯光系统——聚光灯、色片、投影仪、烟雾机、还有一台简易全息投影设备。旁边有一份技术清单，列着这些设备的能力。

屏幕更新：「这个故事需要被看见。不只是演员和布景——需要视觉特效：让观众看到不存在的东西。雨、火、星空、另一个世界。」

Kai 的眼睛亮了：「我可以做视觉方向。」但 Nora 指了指控制台：「这些设备需要有人实际操作。编排灯光序列，控制烟雾时机，设计投影内容。想象力是一部分，执行是另一部分。」

需要有人走到后台控制台前，设计并制作这场演出的视觉特效——让灯光、投影、烟雾配合故事和音乐，制造出超越现实的视觉体验。`,

      en: `The music's first draft is done. The theater has sound.\n\nBut the lighting director's seat is empty. The backstage console is connected to the entire theater's lighting system — spotlights, color gels, projectors, a fog machine, even a basic holographic display. A spec sheet lists what each device can do.\n\nThe screen updates: "This story needs to be seen. Not just actors and sets — visual effects. Make the audience see what doesn't exist. Rain, fire, starfields, another world."\n\nKai's eyes light up: "I can handle the visual direction." But Nora points to the console: "These devices need someone to actually operate them. Program the lighting sequences, time the fog, design the projections. Imagination is one part; execution is another."\n\nSomeone needs to go to the backstage console, design and produce this performance's visual effects — make lights, projections, and fog work with the story and music to create an experience beyond reality.`,

      nl: `Het eerste concept van de muziek is klaar. Het theater heeft geluid.\n\nMaar de stoel van de lichtregisseur is leeg. De backstage-bedieningsconsole is verbonden met het complete verlichtingssysteem van het theater — spots, kleurfilters, projectoren, een rookmachine, zelfs een eenvoudig holografisch display. Een technisch specificatieblad beschrijft wat elk apparaat kan.\n\nHet scherm wordt bijgewerkt: "Dit verhaal moet gezien worden. Niet alleen acteurs en decors — visuele effecten. Laat het publiek zien wat niet bestaat. Regen, vuur, sterrenhemel, een andere wereld."\n\nKai's ogen lichten op: "Ik kan de visuele regie doen." Maar Nora wijst naar de console: "Deze apparaten hebben iemand nodig die ze daadwerkelijk bedient. De lichtsequenties programmeren, de rook timen, de projecties ontwerpen. Verbeelding is één ding; uitvoering is iets anders."\n\nIemand moet naar de backstage-console, de visuele effecten van deze voorstelling ontwerpen en produceren — licht, projecties en rook laten samenwerken met het verhaal en de muziek om een ervaring te creëren die de werkelijkheid overstijgt.`,

      de: `Der erste Entwurf der Musik ist fertig. Das Theater hat Klang.\n\nAber der Stuhl des Lichtregisseurs ist leer. Das Backstage-Steuerpult ist mit dem gesamten Lichtsystem des Theaters verbunden — Scheinwerfer, Farbfolien, Projektoren, eine Nebelmaschine, sogar ein einfaches holografisches Display. Ein technisches Datenblatt listet auf, was jedes Gerät kann.\n\nDer Bildschirm aktualisiert sich: „Diese Geschichte muss gesehen werden. Nicht nur Schauspieler und Kulissen — visuelle Effekte. Lass das Publikum sehen, was nicht existiert. Regen, Feuer, Sternenhimmel, eine andere Welt."\n\nKais Augen leuchten auf: „Ich kann die visuelle Regie übernehmen." Aber Nora zeigt auf das Pult: „Diese Geräte brauchen jemanden, der sie tatsächlich bedient. Lichtsequenzen programmieren, den Nebel timen, Projektionen gestalten. Vorstellungskraft ist ein Teil; Umsetzung ein anderer."\n\nJemand muss zum Backstage-Pult, die visuellen Effekte dieser Aufführung entwerfen und produzieren — Licht, Projektionen und Nebel mit Geschichte und Musik zusammenwirken lassen, um ein Erlebnis jenseits der Realität zu schaffen.`,

      fr: `La première ébauche de la musique est terminée. Le théâtre a du son.\n\nMais le siège du directeur de la lumière est vide. La console de contrôle en coulisses est reliée à l'ensemble du système d'éclairage du théâtre — projecteurs, gélatines de couleur, vidéoprojecteurs, machine à brouillard, même un dispositif holographique basique. Une fiche technique liste les capacités de chaque appareil.\n\nL'écran se met à jour : « Cette histoire doit être vue. Pas seulement les acteurs et les décors — des effets visuels. Faites voir au public ce qui n'existe pas. Pluie, feu, champs d'étoiles, un autre monde. »\n\nLes yeux de Kai s'illuminent : « Je peux m'occuper de la direction visuelle. » Mais Nora pointe la console : « Ces appareils ont besoin de quelqu'un pour les manipuler concrètement. Programmer les séquences d'éclairage, synchroniser le brouillard, concevoir les projections. L'imagination est une partie ; l'exécution en est une autre. »\n\nQuelqu'un doit aller à la console en coulisses, concevoir et produire les effets visuels de ce spectacle — faire travailler lumières, projections et brouillard en harmonie avec l'histoire et la musique pour créer une expérience au-delà du réel.`,

      es: `El primer borrador de la música está listo. El teatro tiene sonido.\n\nPero el asiento del director de iluminación está vacío. La consola de control del backstage está conectada a todo el sistema de iluminación del teatro — focos, filtros de color, proyectores, una máquina de humo, incluso un display holográfico básico. Una hoja de especificaciones técnicas lista lo que cada dispositivo puede hacer.\n\nLa pantalla se actualiza: "Esta historia necesita ser vista. No solo actores y escenografía — efectos visuales. Haz que el público vea lo que no existe. Lluvia, fuego, campos de estrellas, otro mundo."\n\nLos ojos de Kai se iluminan: "Yo puedo encargarme de la dirección visual." Pero Nora señala la consola: "Estos dispositivos necesitan a alguien que realmente los opere. Programar las secuencias de iluminación, sincronizar el humo, diseñar las proyecciones. La imaginación es una parte; la ejecución es otra."\n\nAlguien necesita ir a la consola del backstage, diseñar y producir los efectos visuales de esta actuación — hacer que luces, proyecciones y humo trabajen con la historia y la música para crear una experiencia más allá de la realidad.`,

      pt: `O primeiro rascunho da música está pronto. O teatro tem som.\n\nMas o lugar do diretor de iluminação está vazio. A consola de controlo nos bastidores está ligada a todo o sistema de iluminação do teatro — holofotes, filtros de cor, projetores, máquina de fumo, até um display holográfico básico. Uma ficha técnica lista o que cada aparelho pode fazer.\n\nA tela atualiza: "Esta história precisa ser vista. Não apenas atores e cenários — efeitos visuais. Faça o público ver o que não existe. Chuva, fogo, campos de estrelas, outro mundo."\n\nOs olhos de Kai acendem-se: "Posso tratar da direção visual." Mas Nora aponta para a consola: "Estes equipamentos precisam de alguém que realmente os opere. Programar as sequências de luz, cronometrar o fumo, desenhar as projeções. Imaginação é uma parte; execução é outra."\n\nAlguém precisa ir à consola dos bastidores, desenhar e produzir os efeitos visuais deste espetáculo — fazer luzes, projeções e fumo funcionarem com a história e a música para criar uma experiência além da realidade.`,

      it: `La prima bozza della musica è pronta. Il teatro ha il suono.\n\nMa la poltrona del direttore delle luci è vuota. La consolle di controllo nel backstage è collegata all'intero sistema di illuminazione del teatro — riflettori, gelatine colorate, proiettori, una macchina del fumo, persino un display olografico di base. Una scheda tecnica elenca le capacità di ogni dispositivo.\n\nLo schermo si aggiorna: "Questa storia deve essere vista. Non solo attori e scenografia — effetti visivi. Fate vedere al pubblico ciò che non esiste. Pioggia, fuoco, campi stellari, un altro mondo."\n\nGli occhi di Kai si illuminano: "Posso occuparmi della regia visiva." Ma Nora indica la consolle: "Questi dispositivi hanno bisogno di qualcuno che li operi davvero. Programmare le sequenze luci, sincronizzare il fumo, progettare le proiezioni. L'immaginazione è una parte; l'esecuzione è un'altra."\n\nQualcuno deve andare alla consolle del backstage, progettare e produrre gli effetti visivi di questo spettacolo — far lavorare luci, proiezioni e fumo con la storia e la musica per creare un'esperienza oltre la realtà.`,

      ru: `Первый набросок музыки готов. В театре появился звук.\n\nНо кресло светорежиссёра пустует. Пульт за кулисами соединён со всей световой системой театра — прожекторы, цветные фильтры, проекторы, дым-машина, даже простое голографическое устройство. Рядом техническая спецификация с описанием возможностей каждого устройства.\n\nНа экране обновление: «Эту историю нужно увидеть. Не просто актёры и декорации — визуальные эффекты. Покажите зрителям то, чего не существует. Дождь, огонь, звёздное небо, другой мир».\n\nГлаза Кая загораются: «Я могу взять визуальное направление». Но Нора указывает на пульт: «Эти устройства нуждаются в операторе. Запрограммировать световые последовательности, синхронизировать дым, спроектировать проекции. Воображение — это одна часть; исполнение — другая».\n\nКому-то нужно подойти к закулисному пульту, спроектировать и создать визуальные эффекты этого представления — заставить свет, проекции и дым работать вместе с историей и музыкой, создавая опыт за пределами реальности.`,

      ja: `音楽の初稿ができた。劇場に音が生まれた。\n\nしかし照明監督の席は空いている。舞台裏のコントロールコンソールは劇場全体の照明システムにつながっている——スポットライト、カラーフィルター、プロジェクター、スモークマシン、さらには簡易ホログラフィックディスプレイまで。技術仕様書が各機器の能力を記している。\n\nスクリーンが更新される：「この物語は見られる必要がある。俳優とセットだけではなく——視覚効果だ。観客に存在しないものを見せよ。雨、炎、星空、もう一つの世界。」\n\nKaiの目が輝く：「ビジュアルディレクションは僕がやれる。」しかしNoraがコンソールを指す：「この機器は実際に操作する人が必要よ。照明シーケンスのプログラム、スモークのタイミング、プロジェクションのデザイン。想像力は一部。実行はまた別。」\n\n誰かが舞台裏のコンソールに行き、この公演の視覚効果をデザインし制作する必要がある——照明、プロジェクション、スモークを物語と音楽に合わせ、現実を超えた体験を生み出す。`,

      ko: `음악의 초안이 완성됐다. 극장에 소리가 생겼다.\n\n하지만 조명 감독의 자리는 비어 있다. 무대 뒤 조종 콘솔은 극장 전체 조명 시스템에 연결되어 있다 — 스포트라이트, 컬러 필터, 프로젝터, 연무기, 심지어 기본적인 홀로그래픽 디스플레이까지. 기술 사양서가 각 장비의 기능을 나열하고 있다.\n\n화면이 업데이트된다: "이 이야기는 보여져야 한다. 배우와 세트만이 아니라 — 시각 효과. 관객에게 존재하지 않는 것을 보여줘라. 비, 불, 별빛, 또 다른 세계."\n\nKai의 눈이 빛난다: "비주얼 디렉션은 제가 할 수 있어요." 하지만 Nora가 콘솔을 가리킨다: "이 장비들은 실제로 조작할 사람이 필요해요. 조명 시퀀스 프로그래밍, 연무 타이밍 조절, 프로젝션 디자인. 상상력은 한 부분이고, 실행은 또 다른 부분이에요."\n\n누군가 무대 뒤 콘솔로 가서 이 공연의 시각 효과를 디자인하고 제작해야 한다 — 조명, 프로젝션, 연무를 이야기와 음악에 맞춰 현실을 초월하는 시각적 경험을 만들어야 한다.`,
    },
    taskDescription: {
      zh: "设计并制作演出的视觉特效——操作灯光、投影、烟雾等设备，创造超越现实的视觉效果。这项任务需要一个主要负责人。",

      en: `Design and produce the performance's visual effects—operate lights, projections, fog machines, and more to create otherworldly visuals. This task needs one primary person.`,

      nl: `Ontwerp en produceer de visuele effecten van de voorstelling — bedien lichten, projecties, rookmachines en meer om bovennatuurlijke beelden te creëren. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Entwirf und produziere die visuellen Effekte der Aufführung — bediene Lichter, Projektionen, Nebelmaschinen und mehr, um überirdische Bilder zu erzeugen. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Conçois et produis les effets visuels du spectacle — manipule lumières, projections, machines à brouillard et plus pour créer des visuels surnaturels. Cette tâche nécessite un responsable principal.`,

      es: `Diseña y produce los efectos visuales de la actuación — opera luces, proyecciones, máquinas de humo y más para crear imágenes sobrenaturales. Esta tarea necesita un responsable principal.`,

      pt: `Projete e produza os efeitos visuais do espetáculo — opere luzes, projeções, máquinas de fumo e mais para criar visuais sobrenaturais. Esta tarefa precisa de um responsável principal.`,

      it: `Progetta e produci gli effetti visivi dello spettacolo — opera luci, proiezioni, macchine del fumo e altro per creare immagini ultraterrene. Questo compito richiede un responsabile principale.`,

      ru: `Спроектируй и создай визуальные эффекты представления — управляй светом, проекциями, дым-машинами и прочим, чтобы создать потусторонние образы. Для этой задачи нужен один главный ответственный.`,

      ja: `公演の視覚効果をデザインし制作する——照明、プロジェクション、スモークマシンなどを操作して、超現実的なビジュアルを生み出す。この課題には一人の主担当者が必要だ。`,

      ko: `공연의 시각 효과를 디자인하고 제작하세요 — 조명, 프로젝션, 연무기 등을 조작하여 초현실적인 비주얼을 만드세요. 이 과제는 한 명의 주 담당자가 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你走向控制台的速度，让 Kai 侧目了一下。

灯光、投影、烟雾——这些不只是技术设备，它们是你的画笔。你脑子里已经在构想：故事的高潮处需要暴风雨效果，结尾需要星空从地面升起，中间那段安静的戏需要只有一束光。

你开始编排第一个灯光序列。手指在控制台上移动的感觉像是在创作——因为你就是在创作。`,

        en: `The speed at which you walk to the console makes Kai do a double-take.\n\nLights, projections, fog—these aren't just technical equipment. They're your paintbrushes. Your mind is already composing: the climax needs a storm, the ending needs stars rising from the floor, that quiet scene needs a single beam of light.\n\nYou start programming the first lighting sequence. Your fingers on the console feel like creation—because that's exactly what this is.`,

        nl: `De snelheid waarmee je naar de console loopt, doet Kai twee keer kijken.\n\nLichten, projecties, rook — dit is niet zomaar technische apparatuur. Het zijn jouw penselen. Je hoofd componeert al: het hoogtepunt heeft een storm nodig, het einde heeft sterren nodig die van de vloer opstijgen, die stille scène heeft slechts één lichtstraal nodig.\n\nJe begint de eerste lichtsequentie te programmeren. Je vingers op de console voelen als schepping — want dat is precies wat het is.`,

        de: `Die Geschwindigkeit, mit der du zum Pult gehst, lässt Kai zweimal hinschauen.\n\nLichter, Projektionen, Nebel — das ist nicht nur technische Ausrüstung. Es sind deine Pinsel. Dein Kopf komponiert bereits: Der Höhepunkt braucht einen Sturm, das Ende braucht Sterne, die vom Boden aufsteigen, diese ruhige Szene braucht nur einen einzigen Lichtstrahl.\n\nDu beginnst, die erste Lichtsequenz zu programmieren. Deine Finger auf dem Pult fühlen sich an wie Schöpfung — denn genau das ist es.`,

        fr: `La vitesse à laquelle tu te diriges vers la console fait regarder Kai à deux reprises.\n\nLumières, projections, brouillard — ce n'est pas juste de l'équipement technique. Ce sont tes pinceaux. Ton esprit compose déjà : le climax a besoin d'une tempête, la fin a besoin d'étoiles montant du sol, cette scène calme n'a besoin que d'un seul faisceau lumineux.\n\nTu commences à programmer la première séquence d'éclairage. Tes doigts sur la console, c'est de la création — parce que c'est exactement ce que c'est.`,

        es: `La velocidad con la que caminas hacia la consola hace que Kai mire dos veces.\n\nLuces, proyecciones, humo — esto no es solo equipo técnico. Son tus pinceles. Tu mente ya está componiendo: el clímax necesita una tormenta, el final necesita estrellas ascendiendo desde el suelo, esa escena tranquila necesita un solo haz de luz.\n\nEmpiezas a programar la primera secuencia de iluminación. Tus dedos en la consola se sienten como creación — porque es exactamente lo que es.`,

        pt: `A velocidade com que caminha para a consola faz Kai olhar duas vezes.\n\nLuzes, projeções, fumo — isto não é apenas equipamento técnico. São os seus pincéis. A sua mente já está a compor: o clímax precisa de uma tempestade, o final precisa de estrelas a subir do chão, aquela cena calma precisa de apenas um feixe de luz.\n\nComeça a programar a primeira sequência de iluminação. Os dedos na consola parecem criação — porque é exatamente isso.`,

        it: `La velocità con cui cammini verso la consolle fa voltare Kai due volte.\n\nLuci, proiezioni, fumo — non sono solo attrezzatura tecnica. Sono i tuoi pennelli. La tua mente sta già componendo: il climax ha bisogno di una tempesta, il finale ha bisogno di stelle che salgono dal pavimento, quella scena silenziosa ha bisogno di un solo fascio di luce.\n\nInizi a programmare la prima sequenza di luci. Le tue dita sulla consolle sembrano creazione — perché è esattamente ciò che è.`,

        ru: `Скорость, с которой ты идёшь к пульту, заставляет Кая обернуться.\n\nСвет, проекции, дым — это не просто техническое оборудование. Это твои кисти. Твой разум уже сочиняет: кульминации нужна буря, финалу нужны звёзды, поднимающиеся с пола, той тихой сцене нужен единственный луч света.\n\nТы начинаешь программировать первую световую последовательность. Пальцы на пульте ощущаются как творчество — потому что это именно оно.`,

        ja: `コンソールに向かう速さに、Kaiが二度見する。\n\n照明、プロジェクション、スモーク——これらはただの技術機器ではない。あなたの絵筆だ。頭の中ではすでに構成している：クライマックスには嵐が必要、エンディングには床から昇る星空が必要、あの静かなシーンには一筋の光だけが必要。\n\n最初の照明シーケンスのプログラミングを始める。コンソール上の指は創造のように感じる——まさにそれだから。`,

        ko: `콘솔로 향하는 당신의 속도에 Kai가 두 번 쳐다본다.\n\n조명, 프로젝션, 연무 — 이것들은 단순한 기술 장비가 아니다. 당신의 붓이다. 머릿속에서는 이미 구상하고 있다: 클라이맥스에는 폭풍이 필요하고, 엔딩에는 바닥에서 올라오는 별이 필요하고, 그 조용한 장면에는 빛줄기 하나만 있으면 된다.\n\n첫 번째 조명 시퀀스를 프로그래밍하기 시작한다. 콘솔 위의 손가락이 창작처럼 느껴진다 — 정확히 그것이기 때문이다.`,
      },
      score4: {
        zh: `视觉特效。

你走到控制台前面，看了看那些设备。灯光、投影、烟雾——你不一定操作过这些具体的设备，但你对视觉效果有直觉：什么看起来会有冲击力，什么会感动人。

你开始试验。第一个灯光效果出来的时候，你调了调颜色，感觉对了。

Kai 在旁边给出视觉方向，你负责执行。这种配合还不错。`,

        en: `Visual effects.\n\nYou walk to the console and look at the devices. Lights, projections, fog—you may not have operated these exact machines, but you have instinct for visual impact: what looks powerful, what moves people.\n\nYou start experimenting. The first lighting effect comes up. You adjust the color—feels right.\n\nKai provides visual direction from beside you while you execute. The collaboration works.`,

        nl: `Visuele effecten.\n\nJe loopt naar de console en bekijkt de apparaten. Lichten, projecties, rook — je hebt misschien niet precies deze machines bediend, maar je hebt instinct voor visuele impact: wat er krachtig uitziet, wat mensen raakt.\n\nJe begint te experimenteren. Het eerste lichteffect verschijnt. Je past de kleur aan — voelt goed.\n\nKai geeft visuele richting vanuit de zijlijn terwijl jij uitvoert. De samenwerking werkt.`,

        de: `Visuelle Effekte.\n\nDu gehst zum Pult und schaust dir die Geräte an. Lichter, Projektionen, Nebel — du hast vielleicht nicht genau diese Maschinen bedient, aber du hast Instinkt für visuelle Wirkung: was kraftvoll aussieht, was Menschen bewegt.\n\nDu fängst an zu experimentieren. Der erste Lichteffekt erscheint. Du passt die Farbe an — fühlt sich richtig an.\n\nKai gibt von der Seite visuelle Richtung, während du umsetzt. Die Zusammenarbeit funktioniert.`,

        fr: `Effets visuels.\n\nTu vas à la console et tu regardes les appareils. Lumières, projections, brouillard — tu n'as peut-être pas utilisé ces machines précises, mais tu as l'instinct de l'impact visuel : ce qui semble puissant, ce qui touche les gens.\n\nTu commences à expérimenter. Le premier effet lumineux apparaît. Tu ajustes la couleur — ça semble juste.\n\nKai donne la direction visuelle à côté de toi pendant que tu exécutes. La collaboration fonctionne.`,

        es: `Efectos visuales.\n\nCaminas hacia la consola y miras los dispositivos. Luces, proyecciones, humo — quizás no hayas operado estas máquinas exactas, pero tienes instinto para el impacto visual: qué se ve poderoso, qué conmueve.\n\nEmpiezas a experimentar. El primer efecto de luz aparece. Ajustas el color — se siente bien.\n\nKai da la dirección visual desde tu lado mientras tú ejecutas. La colaboración funciona.`,

        pt: `Efeitos visuais.\n\nCaminha até à consola e olha para os equipamentos. Luzes, projeções, fumo — pode não ter operado exatamente estas máquinas, mas tem instinto para impacto visual: o que parece poderoso, o que emociona.\n\nComeça a experimentar. O primeiro efeito de luz aparece. Ajusta a cor — parece certo.\n\nKai dá direção visual ao seu lado enquanto você executa. A colaboração funciona.`,

        it: `Effetti visivi.\n\nVai alla consolle e guardi i dispositivi. Luci, proiezioni, fumo — potresti non aver usato esattamente queste macchine, ma hai istinto per l'impatto visivo: cosa sembra potente, cosa commuove.\n\nInizi a sperimentare. Il primo effetto luce appare. Regoli il colore — sembra giusto.\n\nKai dà la direzione visiva accanto a te mentre tu esegui. La collaborazione funziona.`,

        ru: `Визуальные эффекты.\n\nТы подходишь к пульту и осматриваешь устройства. Свет, проекции, дым — может, ты и не работал именно с этими машинами, но у тебя есть чутьё на визуальное воздействие: что выглядит мощно, что трогает людей.\n\nТы начинаешь экспериментировать. Первый световой эффект появляется. Ты подстраиваешь цвет — чувствуется правильно.\n\nКай даёт визуальное направление рядом с тобой, а ты исполняешь. Сотрудничество работает.`,

        ja: `視覚効果。\n\nコンソールに歩み寄り、機器を見る。照明、プロジェクション、スモーク——これらの機器を操作したことはないかもしれないが、視覚的インパクトへの直感はある：何が力強く見えるか、何が人を動かすか。\n\n実験を始める。最初の照明効果が現れる。色を調整する——しっくりくる。\n\nKaiが横からビジュアルディレクションを出し、あなたが実行する。この連携はうまくいく。`,

        ko: `시각 효과.\n\n콘솔로 걸어가 장비들을 살펴본다. 조명, 프로젝션, 연무 — 이 정확한 기계를 조작해본 적은 없을 수도 있지만, 시각적 임팩트에 대한 직감이 있다: 무엇이 강렬하게 보이는지, 무엇이 사람을 움직이는지.\n\n실험을 시작한다. 첫 번째 조명 효과가 나타난다. 색상을 조정한다 — 맞는 느낌이다.\n\nKai가 옆에서 비주얼 방향을 제시하고 당신이 실행한다. 이 협업이 잘 맞는다.`,
      },
      score3: {
        zh: `你看了看控制台，又看了看那份技术清单。

视觉特效——有意思。但你不确定自己是想「设计」效果还是想「看」效果。两者的区别很大。

你走到控制台前面，翻了翻清单，试了一两个灯光模式。有感觉，但没有到忘我的程度。`,

        en: `You look at the console, then at the spec sheet.\n\nVisual effects—interesting. But you're not sure if you want to "design" effects or just "watch" them. Big difference.\n\nYou walk to the console, flip through the sheet, try one or two lighting modes. There's a feeling, but not to the point of losing yourself in it.`,

        nl: `Je kijkt naar de console, dan naar het specificatieblad.\n\nVisuele effecten — interessant. Maar je weet niet zeker of je effecten wilt "ontwerpen" of alleen "bekijken". Groot verschil.\n\nJe loopt naar de console, bladert door het blad, probeert een of twee lichtmodi. Er is een gevoel, maar niet tot het punt dat je erin verdwijnt.`,

        de: `Du schaust auf das Pult, dann auf das Datenblatt.\n\nVisuelle Effekte — interessant. Aber du bist nicht sicher, ob du Effekte „gestalten" oder nur „anschauen" willst. Großer Unterschied.\n\nDu gehst zum Pult, blätterst durch das Blatt, probierst ein oder zwei Lichtmodi. Da ist ein Gefühl, aber nicht bis zum Punkt des Sich-Verlierens.`,

        fr: `Tu regardes la console, puis la fiche technique.\n\nEffets visuels — intéressant. Mais tu n'es pas sûr de vouloir « concevoir » des effets ou juste les « regarder ». Grande différence.\n\nTu vas à la console, feuilletes la fiche, essaies un ou deux modes d'éclairage. Il y a un ressenti, mais pas au point de t'y perdre.`,

        es: `Miras la consola, luego la hoja de especificaciones.\n\nEfectos visuales — interesante. Pero no estás seguro de si quieres "diseñar" efectos o solo "verlos". Gran diferencia.\n\nCaminas hacia la consola, hojeas la hoja, pruebas uno o dos modos de iluminación. Hay una sensación, pero no al punto de perderte en ella.`,

        pt: `Olha para a consola, depois para a ficha técnica.\n\nEfeitos visuais — interessante. Mas não tem certeza se quer "projetar" efeitos ou apenas "assistir" a eles. Grande diferença.\n\nCaminha até à consola, folheia a ficha, experimenta um ou dois modos de iluminação. Há uma sensação, mas não ao ponto de se perder nela.`,

        it: `Guardi la consolle, poi la scheda tecnica.\n\nEffetti visivi — interessante. Ma non sei sicuro se vuoi "progettare" effetti o solo "guardarli". Grande differenza.\n\nVai alla consolle, sfogli la scheda, provi una o due modalità di illuminazione. C'è una sensazione, ma non fino al punto di perderti.`,

        ru: `Ты смотришь на пульт, потом на спецификацию.\n\nВизуальные эффекты — интересно. Но ты не уверен, хочешь ли «проектировать» эффекты или просто «смотреть» на них. Большая разница.\n\nТы подходишь к пульту, пролистываешь спецификацию, пробуешь один-два световых режима. Чувство есть, но не до степени самозабвения.`,

        ja: `コンソールを見て、それから仕様書を見る。\n\n視覚効果——面白い。でも自分が効果を「デザイン」したいのか「見る」だけなのかわからない。大きな違いだ。\n\nコンソールに歩み寄り、仕様書をめくり、一つ二つの照明モードを試す。感覚はあるが、我を忘れるほどではない。`,

        ko: `콘솔을 보고, 그다음 사양서를 본다.\n\n시각 효과 — 흥미롭다. 하지만 효과를 "디자인"하고 싶은 건지, 그저 "보고" 싶은 건지 확신이 없다. 큰 차이다.\n\n콘솔로 걸어가서, 사양서를 넘기고, 한두 가지 조명 모드를 시도한다. 느낌은 있지만, 빠져들 정도는 아니다.`,
      },
      score2: {
        zh: `灯光、投影、烟雾。

你看了看那些设备和控制台。制作视觉特效需要的那种视觉想象力和技术执行力——你对前者有一点感觉，但后者不是你想投入时间的方向。

你退开了。让更有视觉天赋的人来。`,

        en: `Lights. Projections. Fog.\n\nYou look at the equipment and console. Creating visual effects requires a visual imagination and technical execution—you have a flicker of the former, but the latter isn't where you want to invest.\n\nYou step away. Let someone with more visual talent take it.`,

        nl: `Lichten. Projecties. Rook.\n\nJe kijkt naar de apparatuur en de console. Visuele effecten creëren vereist visuele verbeelding en technische uitvoering — je hebt een vleugje van het eerste, maar het tweede is niet waar je je tijd in wilt steken.\n\nJe stapt weg. Laat iemand met meer visueel talent het overnemen.`,

        de: `Lichter. Projektionen. Nebel.\n\nDu schaust auf die Geräte und das Pult. Visuelle Effekte zu erstellen erfordert visuelle Vorstellungskraft und technische Umsetzung — du hast einen Hauch des Ersten, aber das Zweite ist nicht, wo du investieren willst.\n\nDu trittst weg. Lass jemanden mit mehr visuellem Talent übernehmen.`,

        fr: `Lumières. Projections. Brouillard.\n\nTu regardes l'équipement et la console. Créer des effets visuels exige imagination visuelle et exécution technique — tu as une lueur du premier, mais le second n'est pas là où tu veux investir.\n\nTu t'écartes. Laisse quelqu'un avec plus de talent visuel s'en occuper.`,

        es: `Luces. Proyecciones. Humo.\n\nMiras el equipo y la consola. Crear efectos visuales requiere imaginación visual y ejecución técnica — tienes un destello de lo primero, pero lo segundo no es donde quieres invertir.\n\nTe apartas. Deja que alguien con más talento visual se encargue.`,

        pt: `Luzes. Projeções. Fumo.\n\nOlha para o equipamento e a consola. Criar efeitos visuais requer imaginação visual e execução técnica — tem um lampejo do primeiro, mas o segundo não é onde quer investir.\n\nAfasta-se. Deixe alguém com mais talento visual assumir.`,

        it: `Luci. Proiezioni. Fumo.\n\nGuardi l'attrezzatura e la consolle. Creare effetti visivi richiede immaginazione visiva ed esecuzione tecnica — hai un barlume della prima, ma la seconda non è dove vuoi investire.\n\nTi allontani. Lascia che qualcuno con più talento visivo se ne occupi.`,

        ru: `Свет. Проекции. Дым.\n\nТы смотришь на оборудование и пульт. Создание визуальных эффектов требует визуального воображения и технического исполнения — у тебя есть проблеск первого, но второе — не то, во что ты хочешь вкладываться.\n\nТы отходишь. Пусть кто-то с большим визуальным талантом возьмётся.`,

        ja: `照明。プロジェクション。スモーク。\n\n機材とコンソールを見る。視覚効果の制作にはビジュアルの想像力と技術的実行力が必要だ——前者にはかすかな感覚があるが、後者に時間を投じたいとは思わない。\n\n離れる。もっとビジュアルの才能がある人に任せよう。`,

        ko: `조명. 프로젝션. 연무.\n\n장비와 콘솔을 바라본다. 시각 효과를 만들려면 시각적 상상력과 기술적 실행력이 필요하다 — 전자는 약간 느끼지만, 후자는 투자하고 싶은 방향이 아니다.\n\n물러선다. 더 시각적 재능이 있는 사람에게 맡기자.`,
      },
      score1: {
        zh: `控制台上的那些按钮和推杆，对你来说像另一个世界的语言。

不是因为技术太复杂——是因为「创造视觉体验」这件事，从根本上不在你的兴趣范围内。

你站在后台的角落里，等着这一环节过去。`,

        en: `The buttons and sliders on the console feel like a language from another world.\n\nNot because the technology is too complex—because "creating visual experiences" is fundamentally outside your interest.\n\nYou stand in a backstage corner, waiting for this segment to pass.`,

        nl: `De knoppen en schuifregelaars op de console voelen als een taal uit een andere wereld.\n\nNiet omdat de technologie te complex is — omdat "visuele ervaringen creëren" fundamenteel buiten je interesse ligt.\n\nJe staat in een hoek backstage, wachtend tot dit onderdeel voorbij is.`,

        de: `Die Knöpfe und Regler auf dem Pult fühlen sich an wie eine Sprache aus einer anderen Welt.\n\nNicht weil die Technologie zu komplex ist — weil „visuelle Erlebnisse schaffen" grundsätzlich außerhalb deines Interesses liegt.\n\nDu stehst in einer Ecke hinter der Bühne und wartest, bis dieser Abschnitt vorbei ist.`,

        fr: `Les boutons et curseurs de la console ressemblent à un langage d'un autre monde.\n\nPas parce que la technologie est trop complexe — parce que « créer des expériences visuelles » est fondamentalement en dehors de tes intérêts.\n\nTu restes dans un coin des coulisses, attendant que ce segment se termine.`,

        es: `Los botones y controles deslizantes de la consola se sienten como un idioma de otro mundo.\n\nNo porque la tecnología sea demasiado compleja — porque "crear experiencias visuales" está fundamentalmente fuera de tu interés.\n\nTe quedas en una esquina del backstage, esperando a que este segmento pase.`,

        pt: `Os botões e controles deslizantes na consola parecem uma linguagem de outro mundo.\n\nNão porque a tecnologia seja complexa demais — porque "criar experiências visuais" está fundamentalmente fora do seu interesse.\n\nFica num canto dos bastidores, esperando que este segmento passe.`,

        it: `I pulsanti e i cursori sulla consolle sembrano un linguaggio di un altro mondo.\n\nNon perché la tecnologia sia troppo complessa — perché "creare esperienze visive" è fondamentalmente al di fuori del tuo interesse.\n\nResti in un angolo del backstage, aspettando che questo segmento finisca.`,

        ru: `Кнопки и ползунки на пульте ощущаются как язык из другого мира.\n\nНе потому что технология слишком сложна — потому что «создание визуальных впечатлений» принципиально вне твоих интересов.\n\nТы стоишь в углу за кулисами, ожидая, пока этот этап закончится.`,

        ja: `コンソールのボタンとスライダーが、別世界の言語のように感じる。\n\n技術が複雑すぎるからではない——「視覚体験を創り出す」ということが、根本的に自分の関心の外にあるからだ。\n\n舞台裏の隅に立ち、このセグメントが過ぎるのを待つ。`,

        ko: `콘솔의 버튼과 슬라이더가 다른 세계의 언어처럼 느껴진다.\n\n기술이 너무 복잡해서가 아니다 — "시각적 경험을 창조하는 것"이 근본적으로 관심 밖에 있기 때문이다.\n\n무대 뒤 한구석에 서서 이 구간이 지나가기를 기다린다.`,
      },
    },
  },

  // ── Q14: Write scripts for movies or television shows (高潮题) ──
  {
    id: 14,
    riasec: "A",
    miniIpCode: "A5",
    miniIpItem: "Write scripts for movies or television shows",
    chapter: "theater",
    chapterIndex: 3,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `排练开始了。

演员走上舞台，灯光就位，音乐准备好了——前半段很顺利，故事的框架支撑住了表演。

但走到第三场，一切停了。

这一场是故事里最关键的：两个角色正面冲突，真相揭露，所有情绪汇聚于此。但原来的故事只有情节大纲，没有对白。笼统写着「他们对峙」——但他们说什么？用什么语气？沉默在哪里？爆发在哪里？

屏幕出现一行红字：「这个场景需要剧本。现在。演出不能停。」

演员站在台上，灯光打着，观众在看。需要有人在压力下，现场写出这段剧本——台词、动作指示、情感走向，要能立刻演出来。

这不是从空白纸开始的写作。这是在已经开演的剧里即兴——框架已经在那里，时钟不会等你。`,

      en: `Rehearsal begins.\n\nActors take the stage, lights are in position, music is ready — the first half goes smoothly, the story's framework supports the performance.\n\nBut at the third scene, everything stops.\n\nThis scene is the story's crux: two characters in direct confrontation, truth revealed, all emotions converging. But the original story only has a plot outline — no dialogue. It vaguely says "they confront each other" — but what do they say? In what tone? Where is the silence? Where is the explosion?\n\nRed text appears on screen: "This scene needs a script. Now. The show cannot stop."\n\nActors stand on stage, lights on them, audience watching. Someone must, under this pressure, write the script on the spot — lines, stage directions, emotional arcs — something that can be performed immediately.\n\nThis isn't writing from a blank page. This is improvising into a show already running — the frame is there, the clock does not wait.`,

      nl: `De repetitie begint.\n\nActeurs betreden het podium, lichten staan op hun plek, muziek is klaar — de eerste helft verloopt soepel, het raamwerk van het verhaal draagt de voorstelling.\n\nMaar bij de derde scène stopt alles.\n\nDeze scène is het scharnierpunt van het verhaal: twee personages in directe confrontatie, de waarheid onthuld, alle emoties samenvloeiend. Maar het oorspronkelijke verhaal heeft alleen een plotomschrijving — geen dialoog. Er staat vaag "ze confronteren elkaar" — maar wat zeggen ze? Op welke toon? Waar is de stilte? Waar is de uitbarsting?\n\nRode tekst verschijnt op het scherm: "Deze scène heeft een script nodig. Nu. De show kan niet stoppen."\n\nActeurs staan op het podium, lichten op hen gericht, publiek kijkt. Iemand moet, onder deze druk, ter plekke een script schrijven — tekst, regie-aanwijzingen, emotionele bogen — iets dat onmiddellijk gespeeld kan worden.\n\nDit is geen schrijven vanaf een leeg blad. Dit is improviseren in een voorstelling die al loopt — het kader staat er, de klok wacht niet.`,

      de: `Die Probe beginnt.\n\nSchauspieler betreten die Bühne, Lichter sind in Position, Musik ist bereit — die erste Hälfte läuft glatt, der Rahmen der Geschichte trägt die Aufführung.\n\nAber bei der dritten Szene stoppt alles.\n\nDiese Szene ist der Dreh- und Angelpunkt der Geschichte: zwei Figuren in direkter Konfrontation, die Wahrheit enthüllt, alle Emotionen laufen zusammen. Aber die ursprüngliche Geschichte hat nur einen Handlungsabriss — keinen Dialog. Es steht vage „sie konfrontieren sich" — aber was sagen sie? In welchem Ton? Wo ist die Stille? Wo ist die Explosion?\n\nRoter Text erscheint auf dem Bildschirm: „Diese Szene braucht ein Drehbuch. Jetzt. Die Show darf nicht stoppen."\n\nSchauspieler stehen auf der Bühne, Licht auf ihnen, Publikum schaut zu. Jemand muss unter diesem Druck auf der Stelle ein Drehbuch schreiben — Dialoge, Regieanweisungen, emotionale Bögen — etwas, das sofort aufgeführt werden kann.\n\nDas ist kein Schreiben auf einem leeren Blatt. Das ist Improvisieren in eine bereits laufende Vorstellung hinein — der Rahmen steht, die Uhr wartet nicht.`,

      fr: `La répétition commence.\n\nLes acteurs montent sur scène, les lumières sont en place, la musique est prête — la première moitié se déroule bien, la structure de l'histoire soutient la performance.\n\nMais à la troisième scène, tout s'arrête.\n\nCette scène est le pivot de l'histoire : deux personnages en confrontation directe, la vérité révélée, toutes les émotions convergent. Mais l'histoire originale n'a qu'un synopsis — pas de dialogue. Il est vaguement écrit « ils se confrontent » — mais que disent-ils ? Sur quel ton ? Où est le silence ? Où est l'explosion ?\n\nDu texte rouge apparaît à l'écran : « Cette scène a besoin d'un script. Maintenant. Le spectacle ne peut pas s'arrêter. »\n\nLes acteurs sont debout sur scène, les lumières sur eux, le public regarde. Quelqu'un doit, sous cette pression, écrire un script sur-le-champ — répliques, indications scéniques, arcs émotionnels — quelque chose qui peut être joué immédiatement.\n\nCe n'est pas écrire à partir d'une page blanche. C'est improviser dans un spectacle déjà en cours — le cadre est là, l'horloge n'attend pas.`,

      es: `El ensayo comienza.\n\nLos actores suben al escenario, las luces están en posición, la música está lista — la primera mitad transcurre sin problemas, la estructura de la historia sostiene la actuación.\n\nPero en la tercera escena, todo se detiene.\n\nEsta escena es el punto crucial de la historia: dos personajes en confrontación directa, la verdad revelada, todas las emociones convergiendo. Pero la historia original solo tiene un esquema argumental — sin diálogos. Dice vagamente "se enfrentan" — pero ¿qué dicen? ¿En qué tono? ¿Dónde está el silencio? ¿Dónde está la explosión?\n\nTexto rojo aparece en pantalla: "Esta escena necesita un guion. Ahora. El espectáculo no puede parar."\n\nLos actores están de pie en el escenario, las luces sobre ellos, el público mirando. Alguien debe, bajo esta presión, escribir un guion en el momento — diálogos, indicaciones escénicas, arcos emocionales — algo que pueda ser interpretado de inmediato.\n\nEsto no es escribir desde una página en blanco. Esto es improvisar dentro de un espectáculo ya en marcha — el marco está ahí, el reloj no espera.`,

      pt: `O ensaio começa.\n\nAtores sobem ao palco, luzes estão posicionadas, música está pronta — a primeira metade corre bem, a estrutura da história sustenta a atuação.\n\nMas na terceira cena, tudo para.\n\nEsta cena é o ponto crucial da história: dois personagens em confronto direto, a verdade revelada, todas as emoções convergindo. Mas a história original só tem um esboço do enredo — sem diálogos. Diz vagamente "eles se confrontam" — mas o que dizem? Em que tom? Onde está o silêncio? Onde está a explosão?\n\nTexto vermelho aparece na tela: "Esta cena precisa de um roteiro. Agora. O espetáculo não pode parar."\n\nAtores de pé no palco, luzes sobre eles, público assistindo. Alguém deve, sob esta pressão, escrever um roteiro no momento — falas, marcações, arcos emocionais — algo que possa ser encenado imediatamente.\n\nIsto não é escrever a partir de uma página em branco. Isto é improvisar dentro de um espetáculo já em andamento — o quadro está lá, o relógio não espera.`,

      it: `Le prove iniziano.\n\nGli attori salgono sul palco, le luci sono in posizione, la musica è pronta — la prima metà fila liscia, la struttura della storia sostiene la performance.\n\nMa alla terza scena, tutto si ferma.\n\nQuesta scena è il fulcro della storia: due personaggi in confronto diretto, la verità rivelata, tutte le emozioni convergono. Ma la storia originale ha solo una scaletta — niente dialogo. Dice vagamente "si confrontano" — ma cosa dicono? Con che tono? Dove c'è il silenzio? Dove c'è l'esplosione?\n\nTesto rosso appare sullo schermo: "Questa scena ha bisogno di un copione. Ora. Lo spettacolo non può fermarsi."\n\nGli attori sono in piedi sul palco, le luci su di loro, il pubblico guarda. Qualcuno deve, sotto questa pressione, scrivere un copione sul momento — battute, indicazioni di scena, archi emotivi — qualcosa che possa essere recitato immediatamente.\n\nQuesta non è scrittura da una pagina bianca. Questa è improvvisazione dentro uno spettacolo già in corso — la cornice c'è, l'orologio non aspetta.`,

      ru: `Репетиция начинается.\n\nАктёры выходят на сцену, свет на местах, музыка готова — первая половина идёт гладко, структура истории поддерживает представление.\n\nНо на третьей сцене всё останавливается.\n\nЭта сцена — ключевой момент истории: два персонажа лицом к лицу, правда раскрыта, все эмоции сходятся. Но в оригинальной истории есть только сюжетный план — никаких диалогов. Расплывчато написано «они противостоят друг другу» — но что они говорят? Каким тоном? Где молчание? Где взрыв?\n\nНа экране появляется красный текст: «Этой сцене нужен сценарий. Сейчас. Шоу не может остановиться».\n\nАктёры стоят на сцене, свет на них, зрители смотрят. Кто-то должен, под этим давлением, написать сценарий на месте — реплики, сценические указания, эмоциональные дуги — то, что можно исполнить немедленно.\n\nЭто не письмо с чистого листа. Это импровизация в уже идущем спектакле — рамка есть, часы не ждут.`,

      ja: `リハーサルが始まる。\n\n俳優がステージに立ち、照明が整い、音楽の準備ができた——前半はスムーズに進む。物語の枠組みがパフォーマンスを支えている。\n\nしかし第三場で、すべてが止まる。\n\nこの場面は物語の核心だ：二人の登場人物が直接対峙し、真実が明かされ、すべての感情がここに集まる。しかし元の物語にはプロットの概要しかない——台詞がない。漠然と「彼らは対峙する」とだけ書いてある——しかし何を言う？どんなトーンで？沈黙はどこ？爆発はどこ？\n\nスクリーンに赤い文字が現れる：「このシーンには脚本が必要だ。今すぐ。公演は止められない。」\n\n俳優がステージに立ち、ライトが当たり、観客が見ている。誰かがこのプレッシャーの下、その場で脚本を書かなければならない——台詞、演出指示、感情のアーク——すぐに演じられるものを。\n\nこれは白紙から書き始めるのではない。すでに上演中の劇の中で即興する——枠組みはそこにあり、時計は待ってくれない。`,

      ko: `리허설이 시작된다.\n\n배우들이 무대에 오르고, 조명이 자리 잡고, 음악이 준비됐다 — 전반부는 순조롭게 진행된다. 이야기의 구조가 공연을 지탱한다.\n\n하지만 세 번째 장면에서 모든 것이 멈춘다.\n\n이 장면은 이야기의 핵심이다: 두 인물이 정면으로 대립하고, 진실이 드러나고, 모든 감정이 수렴한다. 그러나 원래 이야기에는 줄거리 개요만 있을 뿐 — 대사가 없다. 막연하게 "그들이 대치한다"고만 적혀 있다 — 하지만 무슨 말을 하는가? 어떤 어조로? 침묵은 어디에? 폭발은 어디에?\n\n화면에 빨간 글자가 나타난다: "이 장면에는 대본이 필요하다. 지금. 공연은 멈출 수 없다."\n\n배우들이 무대 위에 서 있고, 조명이 비추고, 관객이 지켜본다. 누군가가 이 압박 속에서 즉석으로 대본을 써야 한다 — 대사, 무대 지시, 감정 흐름 — 즉시 공연될 수 있는 것을.\n\n이것은 빈 종이에서 시작하는 글쓰기가 아니다. 이미 진행 중인 공연 속에서 즉흥하는 것이다 — 틀은 거기에 있고, 시계는 기다리지 않는다.`,
    },
    taskDescription: {
      zh: "为正在进行的演出即兴编写剧本——对白、动作指示、情感走向——让故事的关键场景能够被立刻演绎。这项任务需要一个主要负责人。",

      en: `Improvise a script for the ongoing performance—dialogue, stage directions, emotional beats—bringing the story's pivotal scene to life for immediate performance. This task needs one primary person.`,

      nl: `Improviseer een script voor de lopende voorstelling — dialoog, regie-aanwijzingen, emotionele wendingen — breng de cruciale scène van het verhaal tot leven voor directe uitvoering. Deze taak heeft één hoofdverantwoordelijke nodig.`,

      de: `Improvisiere ein Drehbuch für die laufende Aufführung — Dialog, Regieanweisungen, emotionale Wendepunkte — bring die entscheidende Szene der Geschichte zum Leben für sofortige Aufführung. Diese Aufgabe braucht eine Hauptperson.`,

      fr: `Improvise un script pour le spectacle en cours — dialogue, indications scéniques, temps émotionnels — donne vie à la scène pivot de l'histoire pour une représentation immédiate. Cette tâche nécessite un responsable principal.`,

      es: `Improvisa un guion para la actuación en curso — diálogos, indicaciones escénicas, ritmos emocionales — dando vida a la escena fundamental de la historia para su representación inmediata. Esta tarea necesita un responsable principal.`,

      pt: `Improvise um roteiro para o espetáculo em andamento — diálogos, marcações, beats emocionais — dando vida à cena crucial da história para encenação imediata. Esta tarefa precisa de um responsável principal.`,

      it: `Improvvisa un copione per lo spettacolo in corso — dialogo, indicazioni di scena, battiti emotivi — dando vita alla scena chiave della storia per una rappresentazione immediata. Questo compito richiede un responsabile principale.`,

      ru: `Импровизируй сценарий для продолжающегося представления — диалоги, сценические ремарки, эмоциональные такты — оживи ключевую сцену истории для немедленного исполнения. Для этой задачи нужен один главный ответственный.`,

      ja: `進行中の公演のために脚本を即興で書く——台詞、演出指示、感情のビート——物語のクライマックスシーンを即座に演じられるよう命を吹き込む。この課題には一人の主担当者が必要だ。`,

      ko: `진행 중인 공연을 위해 대본을 즉흥으로 쓰세요 — 대사, 무대 지시, 감정 비트 — 이야기의 핵심 장면을 즉시 공연할 수 있도록 생명을 불어넣으세요. 이 과제는 한 명의 주 담당자가 필요합니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `红字出现的那一刻，你拿起笔的速度比你想到要拿笔更快。

即兴。有约束。有压力。演员在台上等着。——这些条件没有让你紧张，它们让你清醒。

你脑子里已经有了这场对峙的画面：谁先开口，谁沉默，沉默在哪里被打破，打破的方式是爆发还是崩溃。你写下第一句台词，递到台上。

演员读了，开始说。声音在剧场里回荡的那一刻，你已经在写下一句了。`,

        en: `The moment the red text appears, you pick up the pen faster than your mind decides to.\n\nImprovisation. Constraints. Pressure. Actors waiting onstage. —These conditions don't make you nervous. They make you sharp.\n\nYour mind already has the confrontation: who speaks first, who stays silent, where the silence breaks, whether it breaks with an explosion or a collapse. You write the first line and pass it to the stage.\n\nThe actor reads it, begins to speak. The voice echoes through the theater, and you're already writing the next line.`,

        nl: `Het moment dat de rode tekst verschijnt, pak je de pen sneller dan je geest beslist.\n\nImprovisatie. Beperkingen. Druk. Acteurs die wachten op het podium. — Deze omstandigheden maken je niet nerveus. Ze maken je scherp.\n\nJe hoofd heeft de confrontatie al: wie spreekt eerst, wie zwijgt, waar de stilte breekt, of het breekt met een explosie of een ineenstorting. Je schrijft de eerste regel en geeft hem door naar het podium.\n\nDe acteur leest het, begint te spreken. De stem echoot door het theater, en je bent al de volgende regel aan het schrijven.`,

        de: `In dem Moment, als der rote Text erscheint, greifst du zum Stift, schneller als dein Verstand es beschließt.\n\nImprovisation. Einschränkungen. Druck. Schauspieler warten auf der Bühne. — Diese Bedingungen machen dich nicht nervös. Sie machen dich wach.\n\nDein Kopf hat die Konfrontation bereits: Wer spricht zuerst, wer schweigt, wo die Stille bricht, ob sie mit einer Explosion oder einem Zusammenbruch bricht. Du schreibst die erste Zeile und reichst sie auf die Bühne.\n\nDer Schauspieler liest sie, beginnt zu sprechen. Die Stimme hallt durch das Theater, und du schreibst bereits die nächste Zeile.`,

        fr: `À l'instant où le texte rouge apparaît, tu saisis le stylo plus vite que ton esprit ne le décide.\n\nImprovisation. Contraintes. Pression. Des acteurs qui attendent sur scène. — Ces conditions ne te rendent pas nerveux. Elles te rendent vif.\n\nTon esprit a déjà la confrontation : qui parle en premier, qui reste silencieux, où le silence se brise, s'il se brise avec une explosion ou un effondrement. Tu écris la première réplique et la passes à la scène.\n\nL'acteur la lit, commence à parler. La voix résonne dans le théâtre, et tu écris déjà la réplique suivante.`,

        es: `En el momento en que aparece el texto rojo, tomas el bolígrafo más rápido de lo que tu mente decide.\n\nImprovisación. Restricciones. Presión. Actores esperando en escena. — Estas condiciones no te ponen nervioso. Te agudizan.\n\nTu mente ya tiene la confrontación: quién habla primero, quién calla, dónde se rompe el silencio, si se rompe con una explosión o un derrumbe. Escribes la primera línea y la pasas al escenario.\n\nEl actor la lee, empieza a hablar. La voz resuena por el teatro, y tú ya estás escribiendo la siguiente línea.`,

        pt: `No momento em que o texto vermelho aparece, pega a caneta mais rápido do que a mente decide.\n\nImprovisação. Restrições. Pressão. Atores esperando no palco. — Estas condições não o deixam nervoso. Deixam-no afiado.\n\nA mente já tem o confronto: quem fala primeiro, quem fica em silêncio, onde o silêncio se quebra, se se quebra com uma explosão ou um colapso. Escreve a primeira fala e passa-a ao palco.\n\nO ator lê, começa a falar. A voz ecoa pelo teatro, e já está a escrever a próxima fala.`,

        it: `Nel momento in cui appare il testo rosso, prendi la penna più velocemente di quanto la tua mente decida.\n\nImprovvisazione. Vincoli. Pressione. Attori che aspettano sul palco. — Queste condizioni non ti rendono nervoso. Ti rendono lucido.\n\nLa tua mente ha già il confronto: chi parla per primo, chi tace, dove il silenzio si spezza, se si spezza con un'esplosione o un crollo. Scrivi la prima battuta e la passi al palco.\n\nL'attore la legge, inizia a parlare. La voce riecheggia nel teatro, e tu stai già scrivendo la battuta successiva.`,

        ru: `В тот момент, когда появляется красный текст, ты берёшь ручку быстрее, чем успеваешь об этом подумать.\n\nИмпровизация. Ограничения. Давление. Актёры ждут на сцене. — Эти условия не делают тебя нервным. Они делают тебя острым.\n\nВ твоей голове уже есть противостояние: кто говорит первым, кто молчит, где молчание ломается, ломается оно взрывом или обрушением. Ты пишешь первую реплику и передаёшь на сцену.\n\nАктёр читает, начинает говорить. Голос разносится по театру, а ты уже пишешь следующую реплику.`,

        ja: `赤い文字が現れた瞬間、頭が決める前にペンを手に取っている。\n\n即興。制約。プレッシャー。舞台上で待つ俳優たち。——これらの条件は緊張させない。研ぎ澄まされる。\n\n頭の中にはすでに対峙がある：誰が先に口を開くか、誰が沈黙するか、どこで沈黙が破られるか、爆発で破れるのか崩壊で破れるのか。最初の台詞を書き、ステージに渡す。\n\n俳優がそれを読み、話し始める。声が劇場に響き渡るその瞬間、もう次の台詞を書いている。`,

        ko: `빨간 글자가 나타나는 순간, 머리가 결정하기도 전에 펜을 집어 든다.\n\n즉흥. 제약. 압박. 무대 위에서 기다리는 배우들. — 이 조건들이 긴장시키는 게 아니다. 날카롭게 만든다.\n\n머릿속에는 이미 대치가 있다: 누가 먼저 말하는지, 누가 침묵하는지, 어디서 침묵이 깨지는지, 폭발로 깨지는지 붕괴로 깨지는지. 첫 대사를 쓰고 무대로 넘긴다.\n\n배우가 읽고, 말하기 시작한다. 목소리가 극장에 울려 퍼지는 그 순간, 이미 다음 대사를 쓰고 있다.`,
      },
      score4: {
        zh: `即兴剧本。时间压力。

你深吸一口气，坐了下来。脑子里快速搜索：两个角色的关系是什么？冲突的核心是什么？真相揭露后的第一反应会是什么？

你写了几句试试。不完美，但有方向。递到台上，演员开始说——声音说出来之后，你知道哪里需要调整了。

你改了一行，继续写下一段。这种「边写边改边演」的节奏，你居然觉得还行。`,

        en: `Improvised script. Time pressure.\n\nYou take a deep breath and sit down. Your mind races: what's the relationship between these two characters? What's the core conflict? What would the first reaction be after the truth comes out?\n\nYou write a few lines to test. Imperfect, but directional. Passed to the stage, the actor begins—hearing it spoken aloud, you know where to adjust.\n\nYou revise a line, keep writing. This "write-revise-perform" rhythm... you actually find it manageable.`,

        nl: `Geïmproviseerd script. Tijdsdruk.\n\nJe haalt diep adem en gaat zitten. Je hoofd raast: wat is de relatie tussen deze twee personages? Wat is het kernconflict? Wat zou de eerste reactie zijn nadat de waarheid uitkomt?\n\nJe schrijft een paar regels om te testen. Niet perfect, maar met richting. Doorgegeven aan het podium, de acteur begint — als je het hardop hoort, weet je waar je moet bijstellen.\n\nJe herziet een regel, schrijft verder. Dit "schrijf-herzien-speel" ritme... je vindt het eigenlijk best werkbaar.`,

        de: `Improvisiertes Drehbuch. Zeitdruck.\n\nDu atmest tief ein und setzt dich hin. Dein Kopf rast: Was ist die Beziehung zwischen diesen beiden Figuren? Was ist der Kernkonflikt? Was wäre die erste Reaktion, nachdem die Wahrheit herauskommt?\n\nDu schreibst ein paar Zeilen zum Testen. Nicht perfekt, aber richtungsweisend. Auf die Bühne gereicht, der Schauspieler beginnt — als du es laut hörst, weißt du, wo du nachjustieren musst.\n\nDu überarbeitest eine Zeile, schreibst weiter. Dieser „Schreib-Überarbeite-Spiel"-Rhythmus... du findest ihn tatsächlich machbar.`,

        fr: `Script improvisé. Pression du temps.\n\nTu prends une grande respiration et tu t'assois. Ton esprit s'emballe : quelle est la relation entre ces deux personnages ? Quel est le conflit central ? Quelle serait la première réaction après la révélation de la vérité ?\n\nTu écris quelques lignes pour tester. Imparfait, mais avec une direction. Passé à la scène, l'acteur commence — en l'entendant prononcé à voix haute, tu sais où ajuster.\n\nTu révises une ligne, continues d'écrire. Ce rythme « écrire-réviser-jouer »... tu le trouves en fait gérable.`,

        es: `Guion improvisado. Presión de tiempo.\n\nRespiras hondo y te sientas. Tu mente se acelera: ¿cuál es la relación entre estos dos personajes? ¿Cuál es el conflicto central? ¿Cuál sería la primera reacción tras revelarse la verdad?\n\nEscribes unas líneas de prueba. Imperfectas, pero con dirección. Pasan al escenario, el actor comienza — al oírlo en voz alta, sabes dónde ajustar.\n\nRevisas una línea, sigues escribiendo. Este ritmo de "escribe-revisa-actúa"... de hecho te parece manejable.`,

        pt: `Roteiro improvisado. Pressão de tempo.\n\nRespira fundo e senta-se. A mente dispara: qual é a relação entre esses dois personagens? Qual é o conflito central? Qual seria a primeira reação depois que a verdade vem à tona?\n\nEscreve algumas linhas para testar. Imperfeitas, mas com direção. Passadas ao palco, o ator começa — ao ouvir em voz alta, sabe onde ajustar.\n\nRevisa uma linha, continua escrevendo. Esse ritmo de "escrever-revisar-atuar"... na verdade parece administrável.`,

        it: `Copione improvvisato. Pressione del tempo.\n\nFai un respiro profondo e ti siedi. La tua mente corre: qual è il rapporto tra questi due personaggi? Qual è il conflitto centrale? Quale sarebbe la prima reazione dopo la rivelazione della verità?\n\nScrivi qualche battuta per provare. Imperfette, ma con una direzione. Passate al palco, l'attore inizia — sentendole pronunciate ad alta voce, sai dove aggiustare.\n\nRevisi una riga, continui a scrivere. Questo ritmo "scrivi-rivedi-recita"... lo trovi in realtà gestibile.`,

        ru: `Импровизированный сценарий. Нехватка времени.\n\nТы глубоко вдыхаешь и садишься. Голова работает быстро: какие отношения между этими двумя персонажами? В чём суть конфликта? Какой будет первая реакция после того, как правда откроется?\n\nТы пишешь несколько строк на пробу. Несовершенно, но направление есть. Передано на сцену, актёр начинает — услышав вслух, ты понимаешь, где надо подправить.\n\nТы исправляешь строку, продолжаешь писать. Этот ритм «пиши-правь-играй»... оказывается, тебе по силам.`,

        ja: `即興脚本。時間のプレッシャー。\n\n深呼吸して座る。頭がフル回転する：この二人の関係は？対立の核心は？真実が明かされた後の最初の反応は？\n\n何行か試しに書いてみる。完璧ではないが、方向性はある。ステージに渡すと、俳優が話し始める——声に出されたのを聞いて、どこを直すべきかわかる。\n\n一行直して、次を書き続ける。この「書いて、直して、演じる」リズム……意外と、やれる。`,

        ko: `즉흥 대본. 시간 압박.\n\n깊이 숨을 쉬고 앉는다. 머리가 빠르게 돌아간다: 이 두 인물의 관계는? 핵심 갈등은? 진실이 드러난 후 첫 반응은?\n\n몇 줄 시험 삼아 써본다. 완벽하지 않지만, 방향이 있다. 무대로 넘기면 배우가 시작한다 — 소리 내어 들으니 어디를 조정해야 할지 알겠다.\n\n한 줄 고치고, 다음을 계속 쓴다. 이 "쓰고-고치고-연기하는" 리듬... 의외로 해볼 만하다.`,
      },
      score3: {
        zh: `即兴编剧。有观众。有时间限制。

你看着那行红字，心里有一种拉扯——写东西你可以，但在这种压力下即兴创作……你不确定自己能不能交出足够好的东西。

你站在台侧，脑子里有一些想法，但还没有坐下来写的冲动。也许你可以口头给出一些方向，让别人来写具体的台词。`,

        en: `Improvised scriptwriting. An audience. A time limit.\n\nYou look at the red text and feel a tug—you can write, but improvising under this pressure... you're not sure you can deliver something good enough.\n\nYou stand to the side of the stage, ideas forming but no urge to sit down and write. Maybe you can give verbal direction and let someone else write the actual lines.`,

        nl: `Geïmproviseerd scenarioschrijven. Een publiek. Een tijdslimiet.\n\nJe kijkt naar de rode tekst en voelt een trekkend gevoel — je kunt schrijven, maar improviseren onder deze druk... je weet niet zeker of je iets goed genoeg kunt afleveren.\n\nJe staat aan de zijkant van het podium, ideeën vormen zich maar er is geen drang om te gaan zitten en te schrijven. Misschien kun je mondeling richting geven en iemand anders de daadwerkelijke tekst laten schrijven.`,

        de: `Improvisiertes Drehbuchschreiben. Ein Publikum. Ein Zeitlimit.\n\nDu schaust auf den roten Text und spürst einen Zug — du kannst schreiben, aber unter diesem Druck improvisieren... du bist nicht sicher, ob du etwas Gutes genug liefern kannst.\n\nDu stehst an der Seite der Bühne, Ideen formen sich, aber kein Drang, dich hinzusetzen und zu schreiben. Vielleicht kannst du mündlich Richtung geben und jemand anderen die eigentlichen Zeilen schreiben lassen.`,

        fr: `Écriture de scénario improvisée. Un public. Un temps limité.\n\nTu regardes le texte rouge et ressens une traction — tu sais écrire, mais improviser sous cette pression... tu n'es pas sûr de pouvoir livrer quelque chose d'assez bon.\n\nTu te tiens sur le côté de la scène, des idées se forment mais pas l'envie de t'asseoir et d'écrire. Peut-être que tu peux donner des directions orales et laisser quelqu'un d'autre écrire les répliques.`,

        es: `Escritura de guion improvisada. Un público. Un límite de tiempo.\n\nMiras el texto rojo y sientes un tirón — puedes escribir, pero improvisar bajo esta presión... no estás seguro de poder entregar algo suficientemente bueno.\n\nTe quedas al lado del escenario, ideas formándose pero sin impulso de sentarte a escribir. Quizás puedas dar dirección verbal y dejar que otro escriba las líneas concretas.`,

        pt: `Escrita de roteiro improvisada. Um público. Um limite de tempo.\n\nOlha para o texto vermelho e sente um puxão — sabe escrever, mas improvisar sob esta pressão... não tem certeza se consegue entregar algo bom o suficiente.\n\nFica ao lado do palco, ideias se formando mas sem impulso de sentar e escrever. Talvez possa dar direção verbal e deixar outra pessoa escrever as falas concretas.`,

        it: `Scrittura di copione improvvisata. Un pubblico. Un tempo limite.\n\nGuardi il testo rosso e senti una tensione — sai scrivere, ma improvvisare sotto questa pressione... non sei sicuro di poter consegnare qualcosa di abbastanza buono.\n\nStai in piedi al lato del palco, le idee si formano ma nessun impulso di sederti e scrivere. Forse puoi dare indicazioni verbali e lasciare che qualcun altro scriva le battute vere e proprie.`,

        ru: `Импровизированное написание сценария. Зрители. Ограничение по времени.\n\nТы смотришь на красный текст и чувствуешь тягу — ты умеешь писать, но импровизировать под таким давлением... ты не уверен, что сможешь выдать что-то достаточно хорошее.\n\nТы стоишь сбоку от сцены, идеи формируются, но нет порыва сесть и писать. Может быть, ты можешь устно задать направление, а кто-то другой напишет конкретные реплики.`,

        ja: `即興脚本執筆。観客。時間制限。\n\n赤い文字を見て、引っ張られる感覚——書くことはできる。でもこのプレッシャーの下で即興で……十分なものを出せるか確信がない。\n\nステージの脇に立つ。アイデアは浮かんでいるが、座って書く衝動はない。口頭で方向性を示して、具体的な台詞は誰か他の人に書いてもらえるかもしれない。`,

        ko: `즉흥 대본 쓰기. 관객. 시간 제한.\n\n빨간 글자를 보며 끌리는 느낌 — 쓸 수는 있지만, 이 압박 속에서 즉흥으로... 충분히 좋은 것을 내놓을 수 있을지 확신이 없다.\n\n무대 옆에 서 있는다. 아이디어가 형성되지만 앉아서 쓸 충동은 없다. 구두로 방향을 제시하고 다른 사람이 구체적인 대사를 쓰게 할 수도 있을 것이다.`,
      },
      score2: {
        zh: `现场写剧本。演员在等。观众在看。

你看了看纸和笔，内心的声音很清楚：这种压力下的即兴创作不是你的方式。你可以有想法，但把它们在几分钟内变成可被表演的台词——这个转化过程，你没有信心。

你退后了。让更擅长即兴的人来。`,

        en: `Write a script live. Actors waiting. Audience watching.\n\nYou look at the pen and paper, and your inner voice is clear: improvising under this pressure isn't your way. You might have ideas, but turning them into performable dialogue in minutes—you're not confident about that conversion.\n\nYou step back. Let someone better at improvisation take this.`,

        nl: `Live een script schrijven. Acteurs die wachten. Publiek dat kijkt.\n\nJe kijkt naar pen en papier, en je innerlijke stem is duidelijk: improviseren onder deze druk is niet jouw manier. Je hebt misschien ideeën, maar ze binnen minuten omzetten in speelbare dialoog — je hebt geen vertrouwen in die conversie.\n\nJe doet een stap terug. Laat iemand die beter is in improvisatie dit doen.`,

        de: `Ein Drehbuch live schreiben. Schauspieler warten. Publikum schaut zu.\n\nDu schaust auf Stift und Papier, und deine innere Stimme ist klar: Unter diesem Druck zu improvisieren ist nicht dein Weg. Du magst Ideen haben, aber sie in Minuten in aufführbare Dialoge zu verwandeln — du bist nicht zuversichtlich bei dieser Umwandlung.\n\nDu trittst zurück. Lass jemanden, der besser im Improvisieren ist, das übernehmen.`,

        fr: `Écrire un script en direct. Des acteurs qui attendent. Un public qui regarde.\n\nTu regardes le stylo et le papier, et ta voix intérieure est claire : improviser sous cette pression n'est pas ta façon de faire. Tu peux avoir des idées, mais les transformer en dialogue jouable en quelques minutes — tu n'as pas confiance en cette conversion.\n\nTu recules. Laisse quelqu'un de meilleur en improvisation s'en charger.`,

        es: `Escribir un guion en vivo. Actores esperando. Público mirando.\n\nMiras el bolígrafo y el papel, y tu voz interior es clara: improvisar bajo esta presión no es tu estilo. Puedes tener ideas, pero convertirlas en diálogos interpretables en minutos — no tienes confianza en esa conversión.\n\nDas un paso atrás. Deja que alguien mejor en improvisación se encargue.`,

        pt: `Escrever um roteiro ao vivo. Atores esperando. Público assistindo.\n\nOlha para a caneta e o papel, e a voz interior é clara: improvisar sob esta pressão não é o seu jeito. Pode ter ideias, mas transformá-las em diálogos atuáveis em minutos — não tem confiança nessa conversão.\n\nDá um passo atrás. Deixe alguém melhor em improvisação assumir.`,

        it: `Scrivere un copione dal vivo. Attori che aspettano. Pubblico che guarda.\n\nGuardi penna e carta, e la tua voce interiore è chiara: improvvisare sotto questa pressione non è il tuo modo. Potresti avere idee, ma trasformarle in dialogo recitabile in pochi minuti — non hai fiducia in quella conversione.\n\nFai un passo indietro. Lascia che qualcuno più bravo nell'improvvisazione se ne occupi.`,

        ru: `Писать сценарий вживую. Актёры ждут. Зрители смотрят.\n\nТы смотришь на ручку и бумагу, и внутренний голос ясен: импровизировать под таким давлением — не твой путь. У тебя могут быть идеи, но превратить их в исполнимые реплики за минуты — ты не уверен в этом преобразовании.\n\nТы отступаешь. Пусть кто-то более способный к импровизации возьмётся.`,

        ja: `脚本をライブで書く。俳優が待っている。観客が見ている。\n\nペンと紙を見て、内なる声がはっきり言う：このプレッシャーの下での即興は自分のやり方ではない。アイデアはあるかもしれない。でもそれを数分で演じられる台詞に変える——その変換に自信がない。\n\n一歩下がる。即興がもっと得意な人に任せよう。`,

        ko: `대본을 실시간으로 쓴다. 배우가 기다리고 있다. 관객이 보고 있다.\n\n펜과 종이를 보며, 내면의 목소리가 분명하다: 이 압박 속에서 즉흥으로 쓰는 것은 내 방식이 아니다. 아이디어가 있을 수는 있지만, 그것을 몇 분 만에 연기 가능한 대사로 바꾸는 것 — 그 전환에 자신이 없다.\n\n한 발 물러선다. 즉흥에 더 능한 사람에게 맡기자.`,
      },
      score1: {
        zh: `即兴。压力。观众。

你把这三个条件加在一起，得出一个很清楚的答案：不是我。

不是因为你不懂故事——你可能比很多人更懂什么是好的对白。但「即兴写出来并且让人立刻演」这件事，完全不在你的本能反应里。

你站在台侧，看着这个场景发展。有人会上去的。不是你。`,

        en: `Improvisation. Pressure. Audience.\n\nYou add these three conditions together and arrive at a very clear answer: not me.\n\nNot because you don't understand stories—you might understand good dialogue better than most. But "writing it on the spot and having someone perform it immediately" is simply not in your instinctive repertoire.\n\nYou stand to the side, watching the scene unfold. Someone will step up. Not you.`,

        nl: `Improvisatie. Druk. Publiek.\n\nJe telt deze drie omstandigheden bij elkaar op en komt tot een heel duidelijk antwoord: niet ik.\n\nNiet omdat je geen verhalen begrijpt — je begrijpt goede dialoog misschien beter dan de meesten. Maar "het ter plekke schrijven en iemand het onmiddellijk laten opvoeren" zit simpelweg niet in je instinctieve repertoire.\n\nJe staat opzij en kijkt hoe de scène zich ontvouwt. Iemand zal opstaan. Niet jij.`,

        de: `Improvisation. Druck. Publikum.\n\nDu addierst diese drei Bedingungen und kommst zu einer sehr klaren Antwort: nicht ich.\n\nNicht weil du Geschichten nicht verstehst — du verstehst guten Dialog vielleicht besser als die meisten. Aber „es auf der Stelle schreiben und jemanden es sofort aufführen lassen" ist schlicht nicht in deinem instinktiven Repertoire.\n\nDu stehst daneben und schaust zu, wie sich die Szene entfaltet. Jemand wird vortreten. Nicht du.`,

        fr: `Improvisation. Pression. Public.\n\nTu additionnes ces trois conditions et arrives à une réponse très claire : pas moi.\n\nPas parce que tu ne comprends pas les histoires — tu comprends peut-être le bon dialogue mieux que la plupart. Mais « l'écrire sur-le-champ et faire jouer quelqu'un immédiatement » ne fait simplement pas partie de ton répertoire instinctif.\n\nTu restes sur le côté, regardant la scène se dérouler. Quelqu'un se lèvera. Pas toi.`,

        es: `Improvisación. Presión. Público.\n\nSumas estas tres condiciones y llegas a una respuesta muy clara: yo no.\n\nNo porque no entiendas historias — quizás entiendes los buenos diálogos mejor que la mayoría. Pero "escribirlo en el momento y que alguien lo interprete inmediatamente" simplemente no está en tu repertorio instintivo.\n\nTe quedas a un lado, viendo cómo se desarrolla la escena. Alguien dará el paso. No tú.`,

        pt: `Improvisação. Pressão. Público.\n\nSoma estas três condições e chega a uma resposta muito clara: não sou eu.\n\nNão porque não entenda histórias — talvez entenda bons diálogos melhor que a maioria. Mas "escrever na hora e ter alguém a representar imediatamente" simplesmente não faz parte do seu repertório instintivo.\n\nFica de lado, vendo a cena se desenrolar. Alguém vai dar um passo à frente. Não você.`,

        it: `Improvvisazione. Pressione. Pubblico.\n\nSommi queste tre condizioni e arrivi a una risposta molto chiara: non io.\n\nNon perché non capisci le storie — potresti capire il buon dialogo meglio della maggior parte delle persone. Ma "scriverlo sul momento e farlo recitare immediatamente a qualcuno" semplicemente non è nel tuo repertorio istintivo.\n\nResti di lato, guardando la scena svilupparsi. Qualcuno si farà avanti. Non tu.`,

        ru: `Импровизация. Давление. Зрители.\n\nТы складываешь эти три условия и приходишь к очень ясному ответу: не я.\n\nНе потому что ты не понимаешь истории — возможно, ты понимаешь хороший диалог лучше большинства. Но «написать на месте и заставить кого-то исполнить немедленно» просто не входит в твой инстинктивный репертуар.\n\nТы стоишь в стороне, наблюдая, как разворачивается сцена. Кто-то выйдет вперёд. Не ты.`,

        ja: `即興。プレッシャー。観客。\n\nこの三つの条件を足し合わせて、とても明確な答えにたどり着く：自分ではない。\n\n物語がわからないからではない——良い台詞について、ほとんどの人よりわかっているかもしれない。でも「その場で書いて、すぐに誰かに演じさせる」ということが、単に自分の本能的なレパートリーにない。\n\n脇に立ち、シーンが展開するのを見ている。誰かが出るだろう。自分ではない。`,

        ko: `즉흥. 압박. 관객.\n\n이 세 가지 조건을 더하면 매우 분명한 답이 나온다: 나는 아니다.\n\n이야기를 이해하지 못해서가 아니다 — 좋은 대사를 대부분의 사람보다 더 잘 이해할 수도 있다. 하지만 "그 자리에서 써서 누군가가 바로 연기하게 하는 것"은 단순히 본능적 레퍼토리에 없다.\n\n옆에 서서 장면이 전개되는 것을 지켜본다. 누군가 나설 것이다. 당신은 아니다.`,
      },
    },
  },

  // ── Q15: Paint sets for plays ──────────────────────────────
  {
    id: 15,
    riasec: "A",
    miniIpCode: "A4",
    miniIpItem: "Paint sets for plays",
    chapter: "theater",
    chapterIndex: 3,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `剧本写完了。灯光编好了。音乐就位了。

但舞台上还是空的。

不是缺演员——是缺世界。剧本里的那些场景——森林、废墟城市、暴风雨中的海岸线——现在只存在于文字里。舞台需要看得见的世界：背景、布景、让观众一眼被拉进故事的视觉空间。

舞台两侧靠着几块大型画布面板和木质平板，底漆已刷好，但上面什么都没有。旁边摆着颜料桶、各种尺寸的刷子、滚筒、调色板。剧本里关于场景的笔记散落在一旁。

Kai 翻着剧本笔记，研究每一场戏的视觉基调。「森林那场需要层次感，」他说，「城市那场要冷色调。结尾那场……我不确定，可能需要抽象的。」

画布在等待。颜料准备好了。故事的世界需要被画出来。

所有人都可以拿起画笔，把空白画布变成这部戏的视觉世界。问题是：你有多想成为那个画出这个世界的人？`,

      en: `The script is done. The lights are programmed. The music is set.\n\nBut the stage is still empty.\n\nNot missing actors — missing a world. The scenes in the script — forests, ruined cities, a coastline in a storm — exist only in words right now. The stage needs a visible world: backdrops, set pieces, visual spaces that pull the audience into the story at first glance.\n\nLarge canvas panels and wooden flats lean against the walls, primed but unpainted. Paint cans, brushes of all sizes, rollers, palettes laid out nearby. Script notes about the settings are scattered to the side.\n\nKai flips through the script notes, studying the visual tone for each scene. "The forest scene needs depth and layers," he says. "The city scene needs cool tones. The finale... I'm not sure, maybe something abstract."\n\nThe canvases wait. The paint is ready. The play's world needs to be painted into existence.\n\nEveryone can pick up a brush and transform blank canvas into the visual world of this play. The question is: how much do you want to be the one who paints this world?`,

      nl: `Het script is af. De lichten zijn geprogrammeerd. De muziek staat klaar.\n\nMaar het podium is nog leeg.\n\nGeen ontbrekende acteurs — een ontbrekende wereld. De scènes in het script — bossen, verwoeste steden, een kustlijn in een storm — bestaan nu alleen in woorden. Het podium heeft een zichtbare wereld nodig: achtergronden, decorstukken, visuele ruimtes die het publiek in één oogopslag het verhaal intrekken.\n\nGrote canvaspanelen en houten schermen leunen tegen de muren aan weerszijden van het podium, geprimed maar onbeschilderd. Verfblikken, kwasten in alle maten, rollers en paletten liggen klaar. Scriptnotities over de decorbeschrijvingen liggen verspreid ernaast.\n\nKai bladert door de scriptnotities en bestudeert de visuele toon voor elke scène. "De bosscène heeft diepte en lagen nodig," zegt hij. "De stadsscène heeft koele tinten nodig. De finale... ik weet het niet zeker, misschien iets abstracts."\n\nDe doeken wachten. De verf is klaar. De wereld van het toneelstuk moet tot leven geschilderd worden.\n\nIedereen kan een kwast pakken en leeg canvas omtoveren tot de visuele wereld van dit toneelstuk. De vraag is: hoe graag wil jij degene zijn die deze wereld schildert?`,

      de: `Das Drehbuch ist fertig. Die Lichter sind programmiert. Die Musik steht.\n\nAber die Bühne ist noch leer.\n\nNicht fehlende Schauspieler — eine fehlende Welt. Die Szenen im Skript — Wälder, verfallene Städte, eine Küste im Sturm — existieren gerade nur in Worten. Die Bühne braucht eine sichtbare Welt: Hintergründe, Bühnenbilder, visuelle Räume, die das Publikum auf den ersten Blick in die Geschichte ziehen.\n\nGroße Leinwandpaneele und Holzrahmen lehnen an den Wänden beiderseits der Bühne, grundiert aber unbemalt. Farbeimer, Pinsel aller Größen, Rollen und Paletten sind daneben ausgelegt. Skriptnotizen zu Szenenbeschreibungen liegen verstreut daneben.\n\nKai blättert durch die Skriptnotizen und studiert den visuellen Ton jeder Szene. „Die Waldszene braucht Tiefe und Schichten," sagt er. „Die Stadtszene braucht kühle Töne. Das Finale... bin mir nicht sicher, vielleicht etwas Abstraktes."\n\nDie Leinwände warten. Die Farbe ist bereit. Die Welt des Stücks muss ins Dasein gemalt werden.\n\nJeder kann einen Pinsel nehmen und leere Leinwand in die visuelle Welt dieses Stücks verwandeln. Die Frage ist: Wie sehr willst du derjenige sein, der diese Welt malt?`,

      fr: `Le scénario est terminé. Les lumières sont programmées. La musique est en place.\n\nMais la scène est encore vide.\n\nPas d'acteurs manquants — un monde manquant. Les décors décrits dans le script — forêts, villes en ruines, un littoral dans la tempête — n'existent pour l'instant que dans les mots. La scène a besoin d'un monde visible : des toiles de fond, des éléments de décor, des espaces visuels qui happent le public dans l'histoire au premier regard.\n\nDe grands panneaux de toile et des châssis en bois sont appuyés contre les murs de chaque côté de la scène, apprêtés mais non peints. Des pots de peinture, des pinceaux de toutes tailles, des rouleaux et des palettes sont disposés à côté. Les notes du script sur les descriptions de décors sont éparpillées non loin.\n\nKai feuillette les notes du script, étudiant la tonalité visuelle de chaque scène. « La scène de forêt a besoin de profondeur et de couches, » dit-il. « La scène de ville a besoin de tons froids. Le final... je ne suis pas sûr, peut-être quelque chose d'abstrait. »\n\nLes toiles attendent. La peinture est prête. Le monde de la pièce doit être peint.\n\nTout le monde peut prendre un pinceau et transformer une toile vierge en l'univers visuel de cette pièce. La question est : à quel point veux-tu être celui qui peint ce monde ?`,

      es: `El guion está listo. Las luces están programadas. La música está en su lugar.\n\nPero el escenario sigue vacío.\n\nNo faltan actores — falta un mundo. Las escenas descritas en el guion — bosques, ciudades en ruinas, una costa en la tormenta — solo existen en palabras ahora mismo. El escenario necesita un mundo visible: telones de fondo, decorados, espacios visuales que atrapen al público en la historia a primera vista.\n\nGrandes paneles de lienzo y bastidores de madera se apoyan contra las paredes a ambos lados del escenario, imprimados pero sin pintar. Botes de pintura, pinceles de todos los tamaños, rodillos y paletas están dispuestos cerca. Las notas del guion sobre las descripciones de escenarios están esparcidas a un lado.\n\nKai hojea las notas del guion, estudiando el tono visual de cada escena. "La escena del bosque necesita profundidad y capas," dice. "La escena de la ciudad necesita tonos fríos. El final... no estoy seguro, quizás algo abstracto."\n\nLos lienzos esperan. La pintura está lista. El mundo de la obra necesita ser pintado.\n\nTodos pueden tomar un pincel y transformar un lienzo en blanco en el mundo visual de esta obra. La pregunta es: ¿cuánto quieres ser quien pinte este mundo?`,

      pt: `O guião está pronto. As luzes estão programadas. A música está definida.\n\nMas o palco ainda está vazio.\n\nNão faltam atores — falta um mundo. As cenas descritas no guião — florestas, cidades em ruínas, uma costa em tempestade — existem apenas em palavras neste momento. O palco precisa de um mundo visível: cenários de fundo, elementos de cenário, espaços visuais que puxem o público para dentro da história ao primeiro olhar.\n\nGrandes painéis de tela e estruturas de madeira estão encostados às paredes de ambos os lados do palco, preparados mas por pintar. Latas de tinta, pincéis de todos os tamanhos, rolos e paletas estão dispostos por perto. Notas do guião sobre descrições de cenários estão espalhadas ao lado.\n\nKai folheia as notas do guião, estudando o tom visual de cada cena. "A cena da floresta precisa de profundidade e camadas," diz ele. "A cena da cidade precisa de tons frios. O final... não tenho a certeza, talvez algo abstrato."\n\nAs telas esperam. A tinta está pronta. O mundo da peça precisa de ser pintado.\n\nTodos podem pegar num pincel e transformar tela em branco no mundo visual desta peça. A questão é: o quanto quer ser quem pinta este mundo?`,

      it: `La sceneggiatura è pronta. Le luci sono programmate. La musica è a posto.\n\nMa il palco è ancora vuoto.\n\nNon mancano attori — manca un mondo. Le scene descritte nel copione — foreste, città in rovina, una costa nella tempesta — esistono solo nelle parole in questo momento. Il palco ha bisogno di un mondo visibile: fondali, elementi scenici, spazi visivi che trascinino il pubblico nella storia al primo sguardo.\n\nGrandi pannelli di tela e telai di legno sono appoggiati alle pareti su entrambi i lati del palco, preparati ma non dipinti. Barattoli di vernice, pennelli di tutte le dimensioni, rulli e tavolozze sono disposti accanto. Gli appunti del copione sulle descrizioni delle ambientazioni sono sparsi lì vicino.\n\nKai sfoglia gli appunti del copione, studiando il tono visivo di ogni scena. "La scena della foresta ha bisogno di profondità e strati," dice. "La scena della città ha bisogno di toni freddi. Il finale... non sono sicuro, forse qualcosa di astratto."\n\nLe tele aspettano. La vernice è pronta. Il mondo della pièce deve essere dipinto.\n\nTutti possono prendere un pennello e trasformare tela bianca nel mondo visivo di questa pièce. La domanda è: quanto vuoi essere tu a dipingere questo mondo?`,

      ru: `Сценарий готов. Свет запрограммирован. Музыка на месте.\n\nНо сцена всё ещё пуста.\n\nНе хватает не актёров — не хватает мира. Сцены, описанные в сценарии — леса, разрушенные города, побережье в шторм — пока существуют только в словах. Сцене нужен видимый мир: задники, декорации, визуальные пространства, которые с первого взгляда затянут зрителя в историю.\n\nБольшие холсты и деревянные рамы прислонены к стенам по обе стороны сцены, загрунтованные, но не расписанные. Рядом расставлены банки с краской, кисти всех размеров, валики и палитры. Заметки из сценария с описанием декораций разбросаны рядом.\n\nКай листает заметки к сценарию, изучая визуальный тон каждой сцены. «Лесной сцене нужна глубина и слои,» говорит он. «Городской сцене нужны холодные тона. Финал... не уверен, может что-то абстрактное.»\n\nХолсты ждут. Краска готова. Мир пьесы нужно нарисовать.\n\nКаждый может взять кисть и превратить пустой холст в визуальный мир этой пьесы. Вопрос в том: насколько сильно ты хочешь быть тем, кто нарисует этот мир?`,

      ja: `脚本は完成した。照明はプログラムされた。音楽も準備できた。\n\nしかしステージはまだ空っぽだ。\n\n足りないのは役者ではない——世界だ。脚本に描かれた場面——森、廃墟の都市、嵐の海岸線——は今のところ言葉の中にしか存在しない。ステージには目に見える世界が必要だ：背景画、セット、一目で観客を物語に引き込む視覚空間。\n\n大きなキャンバスパネルと木製のフラットがステージ両側の壁に立てかけられている。下塗りは済んでいるが、まだ何も描かれていない。ペンキの缶、あらゆるサイズの筆、ローラー、パレットがそばに並んでいる。場面描写に関する脚本のメモが散らばっている。\n\nKaiが脚本のメモをめくり、各シーンの視覚的なトーンを研究している。「森のシーンには奥行きと層が必要だ」と彼は言う。「都市のシーンにはクールなトーンが必要。フィナーレは……わからない、たぶん抽象的な何かが。」\n\nキャンバスが待っている。絵の具は準備できている。戯曲の世界を描き出さなければならない。\n\n誰でも筆を取り、白いキャンバスをこの劇の視覚世界に変えることができる。問題は：あなたはどれほどこの世界を描く人になりたいか？`,

      ko: `대본이 완성됐다. 조명이 프로그래밍됐다. 음악도 준비됐다.\n\n하지만 무대는 여전히 비어 있다.\n\n배우가 부족한 게 아니다 — 세계가 없다. 대본에 묘사된 장면들 — 숲, 폐허가 된 도시, 폭풍 속 해안선 — 은 지금 글자 속에만 존재한다. 무대에는 눈에 보이는 세계가 필요하다: 배경막, 세트 조각, 한눈에 관객을 이야기 속으로 끌어당기는 시각적 공간.\n\n커다란 캔버스 패널과 나무 프레임이 무대 양쪽 벽에 기대어 있다. 초벌칠은 되어 있지만 아무것도 그려져 있지 않다. 페인트 통, 다양한 크기의 붓, 롤러, 팔레트가 근처에 놓여 있다. 장면 묘사에 관한 대본 메모가 곁에 흩어져 있다.\n\nKai가 대본 메모를 넘기며 각 장면의 시각적 톤을 연구한다. "숲 장면에는 깊이와 층이 필요해요," 그가 말한다. "도시 장면에는 차가운 톤이 필요하고. 피날레는... 잘 모르겠어요, 아마 추상적인 뭔가가."\n\n캔버스가 기다린다. 페인트가 준비되어 있다. 극의 세계가 그려져야 한다.\n\n누구나 붓을 들고 빈 캔버스를 이 극의 시각적 세계로 바꿀 수 있다. 질문은: 당신은 얼마나 이 세계를 그리는 사람이 되고 싶은가?`,
    },
    taskDescription: {
      zh: "为这部戏绘制舞台布景——把空白画布变成剧本中描述的森林、城市、风暴，让观众走进一个看得见的世界。所有人都可以参与。",

      en: `Paint the stage sets for this play—transform blank canvases into the forests, cities, and storms described in the script, creating a visible world for the audience. Everyone can participate.`,

      nl: `Schilder de decorstukken voor dit toneelstuk — transformeer lege doeken in de bossen, steden en stormen uit het script, en creëer een zichtbare wereld voor het publiek. Iedereen kan meedoen.`,

      de: `Male die Bühnenbilder für dieses Stück — verwandle leere Leinwände in die Wälder, Städte und Stürme aus dem Skript und erschaffe eine sichtbare Welt für das Publikum. Jeder kann mitmachen.`,

      fr: `Peins les décors de scène pour cette pièce — transforme des toiles vierges en forêts, villes et tempêtes décrites dans le script, créant un monde visible pour le public. Tout le monde peut participer.`,

      es: `Pinta los decorados para esta obra — transforma lienzos en blanco en los bosques, ciudades y tormentas descritos en el guion, creando un mundo visible para el público. Todos pueden participar.`,

      pt: `Pinte os cenários para esta peça — transforme telas em branco nas florestas, cidades e tempestades descritas no guião, criando um mundo visível para o público. Todos podem participar.`,

      it: `Dipingi le scenografie per questa pièce — trasforma tele bianche nelle foreste, città e tempeste descritte nel copione, creando un mondo visibile per il pubblico. Tutti possono partecipare.`,

      ru: `Нарисуй декорации для этой пьесы — преврати пустые холсты в леса, города и бури, описанные в сценарии, создавая видимый мир для зрителей. Все могут участвовать.`,

      ja: `この劇の舞台セットを描く——白いキャンバスを脚本に描かれた森、都市、嵐に変え、観客のために目に見える世界を創り出す。全員が参加できる。`,

      ko: `이 극의 무대 세트를 그리세요 — 빈 캔버스를 대본에 묘사된 숲, 도시, 폭풍으로 바꾸어 관객을 위한 눈에 보이는 세계를 만드세요. 모두 참여할 수 있습니다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你已经在走向那些画布了。

不是因为你觉得自己画得好——也许好，也许不好。是因为当你看到那些空白的面板、读到剧本里那些场景描述的时候，你脑子里已经有画面了。森林的层次，城市的冷光，暴风雨中的天空——你看得见它们应该是什么样子。

你拿起一支最大的刷子，蘸上颜料。第一笔落在画布上的时候，你看到它开始变成什么东西——不再是空白，而是一个世界的边缘。

Kai 在旁边看着你。他的表情不是惊讶——是认同。那种「我知道那是什么感觉」的认同。

你继续画。不是为了完成任务，是因为这个世界需要从你手里出来。`,

        en: `You're already walking toward the canvases.\n\nNot because you think you paint well—maybe you do, maybe not. Because when you saw those blank panels and read the scene descriptions in the script, images were already forming in your mind. The layers of a forest, the cold glow of a city, the sky in a storm—you can see what they should look like.\n\nYou pick up the largest brush and dip it in paint. The first stroke hits the canvas, and you watch it start to become something—no longer blank, but the edge of a world.\n\nKai watches you from beside. His expression isn't surprise—it's recognition. The kind that says "I know what that feels like."\n\nYou keep painting. Not to complete a task. Because this world needs to come out through your hands.`,

        nl: `Je loopt al naar de doeken.\n\nNiet omdat je denkt dat je goed schildert — misschien wel, misschien niet. Omdat toen je die lege panelen zag en de scènebeschrijvingen in het script las, er al beelden in je hoofd ontstonden. De lagen van een bos, de koude gloed van een stad, de lucht in een storm — je kunt zien hoe ze eruit moeten zien.\n\nJe pakt de grootste kwast en dompelt hem in de verf. De eerste streek raakt het doek, en je ziet het iets worden — niet meer leeg, maar de rand van een wereld.\n\nKai kijkt naar je vanaf de zijlijn. Zijn uitdrukking is geen verbazing — het is herkenning. Het soort dat zegt "ik weet hoe dat voelt."\n\nJe blijft schilderen. Niet om een taak af te ronden. Omdat deze wereld door jouw handen naar buiten moet komen.`,

        de: `Du gehst bereits auf die Leinwände zu.\n\nNicht weil du denkst, dass du gut malst — vielleicht ja, vielleicht nicht. Weil, als du diese leeren Paneele sahst und die Szenenbeschreibungen im Skript lasest, sich bereits Bilder in deinem Kopf formten. Die Schichten eines Waldes, das kalte Leuchten einer Stadt, der Himmel im Sturm — du kannst sehen, wie sie aussehen sollten.\n\nDu nimmst den größten Pinsel und tauchst ihn in die Farbe. Der erste Strich trifft die Leinwand, und du siehst, wie etwas entsteht — nicht mehr leer, sondern der Rand einer Welt.\n\nKai beobachtet dich von der Seite. Sein Ausdruck ist keine Überraschung — es ist Wiedererkennung. Die Art, die sagt: „Ich weiß, wie sich das anfühlt."\n\nDu malst weiter. Nicht um eine Aufgabe zu erledigen. Weil diese Welt durch deine Hände herauskommen muss.`,

        fr: `Tu marches déjà vers les toiles.\n\nPas parce que tu penses bien peindre — peut-être oui, peut-être non. Parce que quand tu as vu ces panneaux vierges et lu les descriptions de scènes dans le script, des images se formaient déjà dans ta tête. Les couches d'une forêt, la lueur froide d'une ville, le ciel dans une tempête — tu vois à quoi ils devraient ressembler.\n\nTu prends le plus grand pinceau et le trempes dans la peinture. Le premier coup touche la toile, et tu le regardes devenir quelque chose — plus vierge, mais le bord d'un monde.\n\nKai te regarde depuis le côté. Son expression n'est pas de la surprise — c'est de la reconnaissance. Celle qui dit « je sais ce que ça fait ».\n\nTu continues à peindre. Pas pour accomplir une tâche. Parce que ce monde doit sortir de tes mains.`,

        es: `Ya estás caminando hacia los lienzos.\n\nNo porque creas que pintas bien — quizás sí, quizás no. Porque cuando viste esos paneles en blanco y leíste las descripciones de escenas en el guion, ya se estaban formando imágenes en tu mente. Las capas de un bosque, el brillo frío de una ciudad, el cielo en una tormenta — puedes ver cómo deberían lucir.\n\nTomas el pincel más grande y lo sumerges en la pintura. La primera pincelada cae sobre el lienzo, y ves cómo empieza a convertirse en algo — ya no es blanco, sino el borde de un mundo.\n\nKai te observa desde al lado. Su expresión no es sorpresa — es reconocimiento. El tipo que dice "sé cómo se siente eso."\n\nSigues pintando. No para completar una tarea. Porque este mundo necesita salir de tus manos.`,

        pt: `Já está a caminhar para as telas.\n\nNão porque ache que pinta bem — talvez sim, talvez não. Porque quando viu aqueles painéis em branco e leu as descrições de cenas no guião, já se formavam imagens na sua mente. As camadas de uma floresta, o brilho frio de uma cidade, o céu numa tempestade — consegue ver como deviam ser.\n\nPega no maior pincel e mergulha-o na tinta. A primeira pincelada toca a tela, e vê-a começar a tornar-se algo — já não é branco, mas a borda de um mundo.\n\nKai observa-o de lado. A sua expressão não é surpresa — é reconhecimento. O tipo que diz "eu sei como isso se sente."\n\nContinua a pintar. Não para completar uma tarefa. Porque este mundo precisa de sair das suas mãos.`,

        it: `Stai già camminando verso le tele.\n\nNon perché pensi di dipingere bene — forse sì, forse no. Perché quando hai visto quei pannelli vuoti e letto le descrizioni delle scene nel copione, le immagini si stavano già formando nella tua mente. Gli strati di una foresta, il bagliore freddo di una città, il cielo in una tempesta — riesci a vedere come dovrebbero apparire.\n\nPrendi il pennello più grande e lo immergi nella vernice. La prima pennellata colpisce la tela, e la guardi diventare qualcosa — non più vuota, ma il bordo di un mondo.\n\nKai ti guarda da accanto. La sua espressione non è sorpresa — è riconoscimento. Quello che dice "so cosa si prova."\n\nContinui a dipingere. Non per completare un compito. Perché questo mondo deve uscire dalle tue mani.`,

        ru: `Ты уже идёшь к холстам.\n\nНе потому что считаешь, что хорошо рисуешь — может да, может нет. Потому что когда ты увидел эти пустые панели и прочитал описания сцен в сценарии, в голове уже формировались образы. Слои леса, холодное свечение города, небо в шторм — ты видишь, какими они должны быть.\n\nТы берёшь самую большую кисть и окунаешь в краску. Первый мазок ложится на холст, и ты видишь, как он начинает становиться чем-то — уже не пустотой, а краем мира.\n\nКай наблюдает за тобой сбоку. Его выражение — не удивление, а узнавание. Такое, что говорит: «Я знаю, каково это».\n\nТы продолжаешь рисовать. Не ради задания. Потому что этот мир должен выйти из твоих рук.`,

        ja: `もうキャンバスに向かって歩いている。\n\n絵がうまいと思っているからではない——うまいかもしれないし、そうでないかもしれない。あの白いパネルを見て、脚本のシーン描写を読んだとき、頭の中にはすでにイメージが浮かんでいたからだ。森の層、都市の冷たい光、嵐の中の空——それらがどう見えるべきか、見えている。\n\n一番大きな筆を取り、絵の具に浸す。最初の一筆がキャンバスに落ちた瞬間、それが何かになり始めるのが見える——もう空白ではない、世界の端だ。\n\nKaiが横から見ている。驚きではない——共感だ。「その気持ちわかる」という共感。\n\n描き続ける。課題を終わらせるためではない。この世界が自分の手から出てこなければならないから。`,

        ko: `이미 캔버스를 향해 걸어가고 있다.\n\n그림을 잘 그린다고 생각해서가 아니다 — 잘 그릴 수도 있고 아닐 수도 있다. 빈 패널을 보고 대본의 장면 묘사를 읽었을 때, 머릿속에 이미 이미지가 떠올랐기 때문이다. 숲의 층위, 도시의 차가운 빛, 폭풍 속 하늘 — 그것들이 어떤 모습이어야 하는지 보인다.\n\n가장 큰 붓을 집어 페인트에 담근다. 첫 붓질이 캔버스에 닿는 순간, 그것이 무언가가 되기 시작하는 것을 본다 — 더 이상 공백이 아닌, 세계의 가장자리.\n\nKai가 옆에서 지켜본다. 놀라움이 아닌 — 공감의 표정. "그 느낌 알아"라고 말하는 공감.\n\n계속 그린다. 과제를 완수하기 위해서가 아니다. 이 세계가 당신의 손에서 나와야 하기 때문에.`,
      },
      score4: {
        zh: `画布在那里。颜料摆好了。剧本的场景描述展开在旁边。

你走向那些画布，速度不快，但方向确定。画画这件事——你不确定自己画得怎么样，但你想试。那些空白面板在等一个人来赋予它们形状，而你脑子里有一些画面想出来。

你拿起一支刷子，在调色板上调了几个颜色，试了试色调。然后你开始画。

不是完美的作品。但是真实的。`,

        en: `The canvases are there. Paint is set out. The script's scene descriptions are spread open nearby.\n\nYou walk toward the canvases, not fast, but certain. Painting—you're not sure how good you are, but you want to try. Those blank panels are waiting for someone to give them form, and there are images in your mind that want out.\n\nYou pick up a brush, mix a few colors on the palette, test the tones. Then you start painting.\n\nNot a perfect piece. But an honest one.`,

        nl: `De doeken zijn er. De verf staat klaar. De scènebeschrijvingen uit het script liggen opengeslagen ernaast.\n\nJe loopt naar de doeken, niet snel, maar zeker. Schilderen — je weet niet zeker hoe goed je bent, maar je wilt het proberen. Die lege panelen wachten op iemand die ze vorm geeft, en er zijn beelden in je hoofd die naar buiten willen.\n\nJe pakt een kwast, mengt een paar kleuren op het palet, test de tinten. Dan begin je te schilderen.\n\nGeen perfect werk. Maar een eerlijk werk.`,

        de: `Die Leinwände sind da. Die Farbe steht bereit. Die Szenenbeschreibungen aus dem Skript liegen aufgeschlagen daneben.\n\nDu gehst auf die Leinwände zu, nicht schnell, aber bestimmt. Malen — du bist nicht sicher, wie gut du bist, aber du willst es versuchen. Diese leeren Paneele warten darauf, dass jemand ihnen Form gibt, und in deinem Kopf sind Bilder, die herauswollen.\n\nDu nimmst einen Pinsel, mischst ein paar Farben auf der Palette, testest die Töne. Dann fängst du an zu malen.\n\nKein perfektes Werk. Aber ein ehrliches.`,

        fr: `Les toiles sont là. La peinture est disposée. Les descriptions de scènes du script sont étalées à côté.\n\nTu avances vers les toiles, pas vite, mais avec certitude. Peindre — tu n'es pas sûr de ton niveau, mais tu veux essayer. Ces panneaux vierges attendent quelqu'un pour leur donner forme, et il y a des images dans ta tête qui veulent sortir.\n\nTu prends un pinceau, mélanges quelques couleurs sur la palette, testes les tons. Puis tu commences à peindre.\n\nPas une oeuvre parfaite. Mais une oeuvre honnête.`,

        es: `Los lienzos están ahí. La pintura está preparada. Las descripciones de escenas del guion están abiertas al lado.\n\nCaminas hacia los lienzos, no rápido, pero con certeza. Pintar — no estás seguro de qué tan bueno eres, pero quieres intentarlo. Esos paneles en blanco esperan a alguien que les dé forma, y hay imágenes en tu mente que quieren salir.\n\nTomas un pincel, mezclas algunos colores en la paleta, pruebas los tonos. Luego empiezas a pintar.\n\nNo es una obra perfecta. Pero es una honesta.`,

        pt: `As telas estão ali. A tinta está preparada. As descrições de cenas do guião estão abertas ao lado.\n\nCaminha para as telas, não depressa, mas com certeza. Pintar — não tem certeza de quão bom é, mas quer tentar. Aqueles painéis em branco esperam alguém que lhes dê forma, e há imagens na sua mente que querem sair.\n\nPega num pincel, mistura algumas cores na paleta, testa os tons. Depois começa a pintar.\n\nNão é uma obra perfeita. Mas é honesta.`,

        it: `Le tele sono lì. La vernice è pronta. Le descrizioni delle scene del copione sono aperte accanto.\n\nCammini verso le tele, non veloce, ma sicuro. Dipingere — non sei sicuro di quanto sei bravo, ma vuoi provare. Quei pannelli vuoti aspettano qualcuno che dia loro forma, e ci sono immagini nella tua mente che vogliono uscire.\n\nPrendi un pennello, mescoli qualche colore sulla tavolozza, testi i toni. Poi inizi a dipingere.\n\nNon un'opera perfetta. Ma onesta.`,

        ru: `Холсты на месте. Краска разложена. Описания сцен из сценария раскрыты рядом.\n\nТы идёшь к холстам, не быстро, но уверенно. Рисование — ты не уверен, насколько хорошо у тебя получится, но хочешь попробовать. Эти пустые панели ждут того, кто придаст им форму, и в голове есть образы, которые хотят наружу.\n\nТы берёшь кисть, смешиваешь несколько цветов на палитре, пробуешь тона. Потом начинаешь рисовать.\n\nНе идеальная работа. Но честная.`,

        ja: `キャンバスがそこにある。絵の具が並んでいる。脚本のシーン描写がそばに開かれている。\n\nキャンバスに向かって歩く。速くはないが、確かな方向で。絵を描くこと——自分がどれほどうまいかわからないが、試したい。あの白いパネルが誰かに形を与えてもらうのを待っていて、自分の頭の中にも出たがっているイメージがある。\n\n筆を取り、パレットで何色か混ぜ、トーンを試す。それから描き始める。\n\n完璧な作品ではない。でも正直なものだ。`,

        ko: `캔버스가 거기 있다. 페인트가 준비되어 있다. 대본의 장면 묘사가 옆에 펼쳐져 있다.\n\n캔버스를 향해 걸어간다, 빠르지 않지만 확실하게. 그림 — 얼마나 잘 그리는지 확신은 없지만, 시도하고 싶다. 빈 패널들이 누군가가 형태를 부여해주길 기다리고 있고, 머릿속에도 나오고 싶어하는 이미지가 있다.\n\n붓을 잡고, 팔레트에서 몇 가지 색을 섞고, 톤을 시험한다. 그리고 그리기 시작한다.\n\n완벽한 작품이 아니다. 하지만 진실한 것이다.`,
      },
      score3: {
        zh: `画布靠在墙边。颜料和刷子都摆好了。剧本里的场景描述写得很详细。

你看着那些空白的面板，脑子里有一点反应——那些场景描述让你想象了一下画面，森林和城市的轮廓隐约浮现。但从「在脑子里想象」到「拿起刷子真的去画出来」——这中间有一段距离，你不确定今天想不想跨过去。

你站在原地，看着。也许你会帮忙调个颜色，但不会走到画布前面主导整个创作。`,

        en: `The canvases lean against the wall. Paint and brushes are set out. The script's scene descriptions are detailed.\n\nYou look at those blank panels, and your mind responds slightly—the scene descriptions make you imagine the visuals, outlines of forests and cities faintly taking shape. But from "imagining it in your head" to "picking up a brush and actually painting it"—there's a gap, and you're not sure you want to cross it today.\n\nYou stay where you are, watching. Maybe you'll help mix a color. But you won't walk to the canvas to lead the work.`,

        nl: `De doeken leunen tegen de muur. Verf en kwasten liggen klaar. De scènebeschrijvingen in het script zijn gedetailleerd.\n\nJe kijkt naar die lege panelen, en je hoofd reageert licht — de scènebeschrijvingen laten je de beelden voorstellen, contouren van bossen en steden die vaag vorm krijgen. Maar van "het je voorstellen" naar "een kwast pakken en het echt schilderen" — daar zit een kloof, en je weet niet zeker of je die vandaag wilt overbruggen.\n\nJe blijft waar je bent, kijkend. Misschien help je een kleur mengen. Maar je loopt niet naar het doek om het werk te leiden.`,

        de: `Die Leinwände lehnen an der Wand. Farbe und Pinsel sind bereit. Die Szenenbeschreibungen im Skript sind detailliert.\n\nDu schaust auf diese leeren Paneele, und dein Kopf reagiert leicht — die Szenenbeschreibungen lassen dich die Bilder vorstellen, Umrisse von Wäldern und Städten, die vage Form annehmen. Aber von „es sich vorstellen" zu „einen Pinsel nehmen und es wirklich malen" — da klafft eine Lücke, und du bist nicht sicher, ob du sie heute überqueren willst.\n\nDu bleibst, wo du bist, und schaust zu. Vielleicht hilfst du, eine Farbe zu mischen. Aber du gehst nicht zur Leinwand, um die Arbeit zu leiten.`,

        fr: `Les toiles sont appuyées contre le mur. Peinture et pinceaux sont prêts. Les descriptions de scènes dans le script sont détaillées.\n\nTu regardes ces panneaux vierges, et ton esprit réagit légèrement — les descriptions de scènes te font imaginer les visuels, des contours de forêts et de villes qui prennent vaguement forme. Mais de « l'imaginer dans ta tête » à « prendre un pinceau et peindre pour de vrai » — il y a un écart, et tu n'es pas sûr de vouloir le franchir aujourd'hui.\n\nTu restes où tu es, à regarder. Peut-être que tu aideras à mélanger une couleur. Mais tu n'iras pas devant la toile pour diriger le travail.`,

        es: `Los lienzos se apoyan contra la pared. Pintura y pinceles están listos. Las descripciones de escenas en el guion son detalladas.\n\nMiras esos paneles en blanco, y tu mente responde ligeramente — las descripciones de escenas te hacen imaginar los visuales, contornos de bosques y ciudades que toman forma vagamente. Pero de "imaginarlo en tu cabeza" a "tomar un pincel y pintarlo de verdad" — hay una brecha, y no estás seguro de querer cruzarla hoy.\n\nTe quedas donde estás, mirando. Quizás ayudes a mezclar un color. Pero no caminarás al lienzo para liderar el trabajo.`,

        pt: `As telas estão encostadas à parede. Tinta e pincéis estão prontos. As descrições de cenas no guião são detalhadas.\n\nOlha para aqueles painéis em branco, e a mente responde ligeiramente — as descrições de cenas fazem imaginar os visuais, contornos de florestas e cidades vagamente a tomar forma. Mas de "imaginar na cabeça" a "pegar num pincel e realmente pintar" — há uma lacuna, e não tem certeza se quer cruzá-la hoje.\n\nFica onde está, a observar. Talvez ajude a misturar uma cor. Mas não vai até à tela para liderar o trabalho.`,

        it: `Le tele sono appoggiate alla parete. Vernice e pennelli sono pronti. Le descrizioni delle scene nel copione sono dettagliate.\n\nGuardi quei pannelli vuoti, e la tua mente risponde leggermente — le descrizioni delle scene ti fanno immaginare le immagini, contorni di foreste e città che prendono vagamente forma. Ma da "immaginarlo nella testa" a "prendere un pennello e dipingerlo davvero" — c'è un divario, e non sei sicuro di volerlo colmare oggi.\n\nResti dove sei, osservando. Forse aiuterai a mescolare un colore. Ma non andrai alla tela per guidare il lavoro.`,

        ru: `Холсты прислонены к стене. Краска и кисти готовы. Описания сцен в сценарии подробные.\n\nТы смотришь на эти пустые панели, и голова немного откликается — описания сцен заставляют представить образы, очертания лесов и городов, смутно обретающие форму. Но от «представить в голове» до «взять кисть и действительно нарисовать» — есть расстояние, и ты не уверен, что хочешь его преодолеть сегодня.\n\nТы остаёшься на месте, наблюдая. Может, поможешь смешать цвет. Но к холсту, чтобы вести работу, не пойдёшь.`,

        ja: `キャンバスが壁に立てかけられている。絵の具と筆が並んでいる。脚本のシーン描写は詳細だ。\n\nあの白いパネルを見て、頭が少し反応する——シーン描写がビジュアルを想像させ、森や都市の輪郭がぼんやり形を成す。でも「頭の中で想像する」から「筆を取って実際に描く」まで——そこにはギャップがあり、今日それを超えたいかどうかわからない。\n\nその場にとどまり、見ている。色を混ぜるのを手伝うかもしれない。でもキャンバスの前に立って制作を主導することはない。`,

        ko: `캔버스가 벽에 기대어 있다. 페인트와 붓이 준비되어 있다. 대본의 장면 묘사는 상세하다.\n\n빈 패널들을 바라보면, 머리가 살짝 반응한다 — 장면 묘사가 비주얼을 상상하게 만들고, 숲과 도시의 윤곽이 어렴풋이 형태를 갖춘다. 하지만 "머릿속으로 상상하다"에서 "붓을 들고 실제로 그리다"까지 — 간극이 있고, 오늘 그것을 건너고 싶은지 확신이 없다.\n\n제자리에 서서 지켜본다. 색을 섞는 것은 도울 수 있다. 하지만 캔버스 앞에 서서 작업을 이끌지는 않을 것이다.`,
      },
      score2: {
        zh: `画舞台布景。

你看着那些画布和颜料，看着剧本里的场景描述。需要画的东西很明确——但拿起刷子，把脑子里的画面变成墙上的风景？

这不是你会自愿做的事。不是因为害怕——是因为这种表达方式不是你的。你更习惯用其他方式参与创作。

你留在了原地。`,

        en: `Painting stage sets.\n\nYou look at the canvases and the paint, look at the scene descriptions in the script. What needs to be painted is clear—but picking up a brush and turning the images in your head into landscapes on the wall?\n\nNot something you'd volunteer for. Not out of fear—this form of expression just isn't yours. You're more accustomed to contributing in other ways.\n\nYou stay put.`,

        nl: `Decorstukken schilderen.\n\nJe kijkt naar de doeken en de verf, kijkt naar de scènebeschrijvingen in het script. Wat geschilderd moet worden is duidelijk — maar een kwast pakken en de beelden in je hoofd omzetten in landschappen op de muur?\n\nNiet iets waar je je voor zou aanmelden. Niet uit angst — deze uitdrukkingsvorm is gewoon niet de jouwe. Je bent meer gewend om op andere manieren bij te dragen.\n\nJe blijft waar je bent.`,

        de: `Bühnenbilder malen.\n\nDu schaust auf die Leinwände und die Farbe, schaust auf die Szenenbeschreibungen im Skript. Was gemalt werden muss, ist klar — aber einen Pinsel nehmen und die Bilder in deinem Kopf in Landschaften an der Wand verwandeln?\n\nNichts, wozu du dich freiwillig melden würdest. Nicht aus Angst — diese Ausdrucksform ist einfach nicht deine. Du bist es gewöhnt, auf andere Weisen beizutragen.\n\nDu bleibst, wo du bist.`,

        fr: `Peindre des décors de scène.\n\nTu regardes les toiles et la peinture, regardes les descriptions de scènes dans le script. Ce qu'il faut peindre est clair — mais prendre un pinceau et transformer les images dans ta tête en paysages sur le mur ?\n\nPas quelque chose pour lequel tu te porterais volontaire. Pas par peur — cette forme d'expression n'est simplement pas la tienne. Tu es plus habitué à contribuer d'autres façons.\n\nTu restes sur place.`,

        es: `Pintar decorados de escena.\n\nMiras los lienzos y la pintura, miras las descripciones de escenas en el guion. Lo que hay que pintar está claro — pero tomar un pincel y convertir las imágenes en tu cabeza en paisajes en la pared?\n\nNo es algo para lo que te ofrecerías. No por miedo — esta forma de expresión simplemente no es la tuya. Estás más acostumbrado a contribuir de otras maneras.\n\nTe quedas donde estás.`,

        pt: `Pintar cenários de palco.\n\nOlha para as telas e a tinta, olha para as descrições de cenas no guião. O que precisa de ser pintado é claro — mas pegar num pincel e transformar as imagens na sua cabeça em paisagens na parede?\n\nNão é algo para que se voluntariaria. Não por medo — esta forma de expressão simplesmente não é a sua. Está mais acostumado a contribuir de outras formas.\n\nFica onde está.`,

        it: `Dipingere scenografie.\n\nGuardi le tele e la vernice, guardi le descrizioni delle scene nel copione. Cosa deve essere dipinto è chiaro — ma prendere un pennello e trasformare le immagini nella tua testa in paesaggi sulla parete?\n\nNon è qualcosa per cui ti offriresti volontario. Non per paura — questa forma di espressione semplicemente non è la tua. Sei più abituato a contribuire in altri modi.\n\nResti dove sei.`,

        ru: `Рисовать декорации.\n\nТы смотришь на холсты и краску, смотришь на описания сцен в сценарии. Что нужно нарисовать — понятно. Но взять кисть и превратить образы в голове в пейзажи на стене?\n\nНе то, на что ты бы вызвался. Не из страха — просто эта форма выражения не твоя. Ты привык вносить свой вклад иначе.\n\nТы остаёшься на месте.`,

        ja: `舞台セットを描く。\n\nキャンバスと絵の具を見て、脚本のシーン描写を見る。何を描くべきかは明確だ——でも筆を取って、頭の中のイメージを壁の風景に変える？\n\n自ら志願することではない。恐れからではない——この表現方法が自分のものではないだけだ。貢献の仕方は別にある。\n\nその場にとどまる。`,

        ko: `무대 세트를 그리기.\n\n캔버스와 페인트를 보고, 대본의 장면 묘사를 본다. 무엇을 그려야 하는지는 명확하다 — 하지만 붓을 들고 머릿속 이미지를 벽 위의 풍경으로 바꾸는 것?\n\n자원할 일이 아니다. 두려워서가 아니라 — 이 표현 방식이 그냥 내 것이 아니다. 기여하는 다른 방법에 더 익숙하다.\n\n제자리에 머문다.`,
      },
      score1: {
        zh: `画布在那里。颜料摆好了。场景描述写得清清楚楚。

但这些信号加在一起，你身体里没有任何「让我来」的反应。画画这件事——把脑子里的画面用颜料和刷子变成实体的、挂在舞台上的风景——完全不在你的世界里。

你站在后面，安静地看着。布景在别人的笔下完成了。

这一章结束了。五项创造性的任务——写作、作曲、视觉特效、编剧、绘画——你对它们的反应，比任何测试题都更诚实。`,

        en: `The canvases are there. The paint is set out. The scene descriptions are written clear as day.\n\nBut these signals combined produce zero "let me" response in your body. Painting—turning images in your head into physical landscapes on canvas with brushes and pigment—is simply not in your world.\n\nYou stand in the back, watching quietly. The sets are completed by someone else's hand.\n\nThis chapter is over. Five creative tasks—writing, composing, visual effects, scriptwriting, painting—your responses to them were more honest than any test question.`,

        nl: `De doeken zijn er. De verf staat klaar. De scènebeschrijvingen zijn glashelder.\n\nMaar deze signalen samen produceren nul "laat mij" reactie in je lichaam. Schilderen — beelden in je hoofd omzetten in fysieke landschappen op doek met kwasten en pigment — zit simpelweg niet in jouw wereld.\n\nJe staat achterin, stil kijkend. De decorstukken worden door iemand anders' hand voltooid.\n\nDit hoofdstuk is voorbij. Vijf creatieve taken — schrijven, componeren, visuele effecten, scenarioschrijven, schilderen — je reacties erop waren eerlijker dan welke testvraag ook.`,

        de: `Die Leinwände sind da. Die Farbe steht bereit. Die Szenenbeschreibungen sind klar und deutlich.\n\nAber diese Signale zusammen erzeugen null „Lass mich"-Reaktion in deinem Körper. Malen — Bilder im Kopf mit Pinseln und Pigment in physische Landschaften auf Leinwand verwandeln — ist schlicht nicht in deiner Welt.\n\nDu stehst hinten, schaust still zu. Die Bühnenbilder werden von jemand anderes Hand vollendet.\n\nDieses Kapitel ist vorbei. Fünf kreative Aufgaben — Schreiben, Komponieren, visuelle Effekte, Drehbuchschreiben, Malen — deine Reaktionen darauf waren ehrlicher als jede Testfrage.`,

        fr: `Les toiles sont là. La peinture est prête. Les descriptions de scènes sont limpides.\n\nMais ces signaux combinés ne produisent aucune réaction « laissez-moi » dans ton corps. Peindre — transformer les images dans ta tête en paysages physiques sur toile avec des pinceaux et des pigments — n'est tout simplement pas dans ton monde.\n\nTu restes au fond, regardant silencieusement. Les décors sont achevés par la main de quelqu'un d'autre.\n\nCe chapitre est terminé. Cinq tâches créatives — écriture, composition, effets visuels, scénario, peinture — tes réponses étaient plus honnêtes que n'importe quelle question de test.`,

        es: `Los lienzos están ahí. La pintura está lista. Las descripciones de escenas están escritas con total claridad.\n\nPero estas señales combinadas producen cero respuesta de "déjame a mí" en tu cuerpo. Pintar — convertir imágenes en tu cabeza en paisajes físicos sobre lienzo con pinceles y pigmento — simplemente no está en tu mundo.\n\nTe quedas atrás, mirando en silencio. Los decorados se completan por la mano de otra persona.\n\nEste capítulo ha terminado. Cinco tareas creativas — escritura, composición, efectos visuales, guion, pintura — tus respuestas fueron más honestas que cualquier pregunta de test.`,

        pt: `As telas estão ali. A tinta está pronta. As descrições de cenas estão escritas com toda a clareza.\n\nMas estes sinais combinados produzem zero resposta de "deixa-me" no seu corpo. Pintar — transformar imagens na sua cabeça em paisagens físicas em tela com pincéis e pigmento — simplesmente não está no seu mundo.\n\nFica atrás, observando em silêncio. Os cenários são completados pela mão de outra pessoa.\n\nEste capítulo acabou. Cinco tarefas criativas — escrita, composição, efeitos visuais, roteiro, pintura — as suas respostas foram mais honestas que qualquer pergunta de teste.`,

        it: `Le tele sono lì. La vernice è pronta. Le descrizioni delle scene sono scritte chiare come il giorno.\n\nMa questi segnali combinati producono zero reazione di "fammi provare" nel tuo corpo. Dipingere — trasformare le immagini nella tua testa in paesaggi fisici su tela con pennelli e pigmento — semplicemente non è nel tuo mondo.\n\nResti in fondo, osservando in silenzio. Le scenografie sono completate dalla mano di qualcun altro.\n\nQuesto capitolo è finito. Cinque compiti creativi — scrittura, composizione, effetti visivi, sceneggiatura, pittura — le tue risposte sono state più oneste di qualsiasi domanda di un test.`,

        ru: `Холсты на месте. Краска готова. Описания сцен написаны предельно ясно.\n\nНо все эти сигналы вместе не вызывают ни малейшей реакции «дайте мне» в твоём теле. Рисование — превращать образы в голове в физические пейзажи на холсте кистями и пигментом — просто не из твоего мира.\n\nТы стоишь позади, тихо наблюдая. Декорации завершены чьей-то другой рукой.\n\nЭта глава окончена. Пять творческих заданий — письмо, композиция, визуальные эффекты, сценарий, живопись — твои реакции на них были честнее любого тестового вопроса.`,

        ja: `キャンバスがそこにある。絵の具が並んでいる。シーン描写は明確に書かれている。\n\nしかしこれらのシグナルを合わせても、体の中に「やらせて」という反応はゼロだ。絵を描くこと——頭の中のイメージを筆と絵の具でキャンバス上の物理的な風景に変えること——は単に自分の世界にない。\n\n後ろに立ち、静かに見ている。セットは誰か他の人の手で完成した。\n\nこの章は終わった。五つの創造的課題——執筆、作曲、視覚効果、脚本、絵画——それらへの反応は、どんなテスト問題よりも正直だった。`,

        ko: `캔버스가 거기 있다. 페인트가 준비되어 있다. 장면 묘사가 명확하게 적혀 있다.\n\n하지만 이 신호들을 합쳐도 몸속에서 "내가 할게"라는 반응은 제로다. 그림 — 머릿속 이미지를 붓과 물감으로 캔버스 위의 물리적 풍경으로 바꾸는 것 — 은 단순히 당신의 세계에 없다.\n\n뒤에 서서 조용히 지켜본다. 세트는 다른 사람의 손으로 완성된다.\n\n이 장이 끝났다. 다섯 가지 창작 과제 — 글쓰기, 작곡, 시각 효과, 대본 쓰기, 그림 그리기 — 그것들에 대한 당신의 반응은 어떤 시험 문제보다 정직했다.`,
      },
    },
  },
];
