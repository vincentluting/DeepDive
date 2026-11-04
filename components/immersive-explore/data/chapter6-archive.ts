// ════════════════════════════════════════════════════════════
// 第六章：档案室（C型 Q26-Q30）
// 大任务：让这个档案系统恢复到可以被信赖的状态
// 特殊设定：只有你一个人。Q29 Nora 回归。Q30 镜子结局。
// ════════════════════════════════════════════════════════════

import { ImmersiveQuestion } from "./types";

export const CHAPTER6_QUESTIONS: ImmersiveQuestion[] = [
  {
    id: 26,
    riasec: "C",
    miniIpCode: "C1",
    miniIpItem: "Install software across computers on a large network",
    chapter: "archive",
    chapterIndex: 6,
    questionInChapter: 1,
    isClimax: false,
    scene: {
      zh: `最后一层，只有你。

不是被遗弃——屏幕上说，这是每个人都要独自完成的部分。

你推开门，走进去。门在身后关上。安静得只剩下自己的呼吸。

这是一个档案室。和之前所有空间不同：这里的东西是有序的，被认真整理过，有分类、标签、编号、时间轴。但——不完整。有些架子是空的，有些标签脱落了，有些编号之间有断层。

入口处的桌上，堆着一摞厚厚的纸质档案——手写的、打印的、各种格式混在一起，没有统一结构。

旁边有一台终端，屏幕上是一个空白的表格软件界面。光标在第一格闪烁。

屏幕提示：「系统恢复步骤一：数据结构化。将纸质档案的信息整理到电子表格中——设计列名、确定分类逻辑、输入数据。系统需要一份可搜索、可排序的结构化数据。」

没有人帮你决定列应该怎么设计。没有人帮你判断哪些信息重要。终端前只有你——一堆混乱的数据和一个空白的表格。`,

      en: `The last floor. Just you.\n\nNot abandoned — the screen says this is the part everyone completes alone.\n\nYou push the door open and walk in. It closes behind you. Quiet — nothing but your own breathing.\n\nThis is an archive room. Unlike every space before: things here are orderly, carefully organized, with categories, labels, serial numbers, a timeline. But — incomplete. Some shelves are empty, some labels have fallen off, some numbers have gaps.\n\nOn the table by the entrance, a thick stack of paper files — handwritten, printed, mixed formats, no unified structure.\n\nBeside it, a terminal. The screen shows an empty spreadsheet interface. The cursor blinks in the first cell.\n\nThe screen prompts: "System Restoration Step One: Data Structuring. Organize the paper files into the spreadsheet — design columns, determine classification logic, input data. The system needs searchable, sortable, structured data."\n\nNo one helps you decide how to design the columns. No one helps you judge which information matters. Just you at this terminal — a pile of chaotic data and a blank spreadsheet.`,

      nl: `De laatste verdieping. Alleen jij.\n\nNiet verlaten — het scherm zegt dat dit het deel is dat iedereen alleen voltooit.\n\nJe duwt de deur open en loopt naar binnen. Hij valt achter je dicht. Stil — niets dan je eigen ademhaling.\n\nDit is een archiefkamer. Anders dan elke ruimte hiervoor: de dingen hier zijn ordelijk, zorgvuldig georganiseerd, met categorieën, labels, serienummers, een tijdlijn. Maar — onvolledig. Sommige planken zijn leeg, sommige labels zijn losgeraakt, sommige nummers vertonen gaten.\n\nOp de tafel bij de ingang ligt een dikke stapel papieren dossiers — handgeschreven, geprint, gemengde formats, geen uniforme structuur.\n\nErnaast een terminal. Het scherm toont een lege spreadsheet-interface. De cursor knippert in de eerste cel.\n\nHet scherm meldt: "Systeemherstel Stap Eén: Datastructurering. Organiseer de papieren dossiers in de elektronische spreadsheet — ontwerp kolommen, bepaal de classificatielogica, voer gegevens in. Het systeem heeft doorzoekbare, sorteerbare, gestructureerde data nodig."\n\nNiemand helpt je beslissen hoe je de kolommen moet ontwerpen. Niemand helpt je beoordelen welke informatie belangrijk is. Alleen jij aan deze terminal — een stapel chaotische gegevens en een leeg spreadsheet.`,

      de: `Das letzte Stockwerk. Nur du.\n\nNicht verlassen — der Bildschirm sagt, dies ist der Teil, den jeder allein abschließt.\n\nDu drückst die Tür auf und gehst hinein. Sie schließt sich hinter dir. Stille — nichts als dein eigener Atem.\n\nDies ist ein Archivraum. Anders als jeder Raum zuvor: Die Dinge hier sind geordnet, sorgfältig organisiert, mit Kategorien, Etiketten, Seriennummern, einer Zeitleiste. Aber — unvollständig. Einige Regale sind leer, einige Etiketten abgefallen, einige Nummern weisen Lücken auf.\n\nAuf dem Tisch am Eingang liegt ein dicker Stapel Papierakten — handgeschrieben, gedruckt, gemischte Formate, keine einheitliche Struktur.\n\nDaneben ein Terminal. Der Bildschirm zeigt eine leere Tabellenoberfläche. Der Cursor blinkt in der ersten Zelle.\n\nDer Bildschirm zeigt an: „Systemwiederherstellung Schritt Eins: Datenstrukturierung. Organisieren Sie die Papierakten in der elektronischen Tabelle — entwerfen Sie Spalten, bestimmen Sie die Klassifikationslogik, geben Sie Daten ein. Das System benötigt durchsuchbare, sortierbare, strukturierte Daten."\n\nNiemand hilft dir zu entscheiden, wie die Spalten gestaltet werden sollen. Niemand hilft dir zu beurteilen, welche Informationen wichtig sind. Nur du an diesem Terminal — ein Haufen chaotischer Daten und eine leere Tabelle.`,

      fr: `Le dernier étage. Juste toi.\n\nPas abandonné — l'écran indique que c'est la partie que chacun accomplit seul.\n\nTu pousses la porte et entres. Elle se referme derrière toi. Le silence — rien que ta propre respiration.\n\nC'est une salle d'archives. Contrairement à tous les espaces précédents : les choses ici sont ordonnées, soigneusement organisées, avec des catégories, des étiquettes, des numéros de série, une chronologie. Mais — incomplète. Certaines étagères sont vides, certaines étiquettes sont tombées, certains numéros présentent des lacunes.\n\nSur la table près de l'entrée, une épaisse pile de dossiers papier — manuscrits, imprimés, formats mélangés, aucune structure uniforme.\n\nÀ côté, un terminal. L'écran affiche une interface de tableur vide. Le curseur clignote dans la première cellule.\n\nL'écran indique : « Restauration du Système, Étape Un : Structuration des Données. Organisez les dossiers papier dans le tableur électronique — concevez les colonnes, déterminez la logique de classification, saisissez les données. Le système a besoin de données structurées, consultables et triables. »\n\nPersonne ne t'aide à décider comment concevoir les colonnes. Personne ne t'aide à juger quelles informations comptent. Juste toi devant ce terminal — un tas de données chaotiques et un tableur vide.`,

      es: `La última planta. Solo tú.\n\nNo abandonado — la pantalla dice que esta es la parte que todos completan solos.\n\nEmpujas la puerta y entras. Se cierra detrás de ti. Silencio — nada más que tu propia respiración.\n\nEsta es una sala de archivos. A diferencia de todos los espacios anteriores: las cosas aquí están ordenadas, cuidadosamente organizadas, con categorías, etiquetas, números de serie, una línea temporal. Pero — incompleta. Algunos estantes están vacíos, algunas etiquetas se han caído, algunos números tienen huecos.\n\nSobre la mesa junto a la entrada, un grueso montón de expedientes en papel — manuscritos, impresos, formatos mezclados, sin estructura uniforme.\n\nAl lado, un terminal. La pantalla muestra una interfaz de hoja de cálculo vacía. El cursor parpadea en la primera celda.\n\nLa pantalla indica: "Restauración del Sistema, Paso Uno: Estructuración de Datos. Organiza los expedientes en papel en la hoja de cálculo electrónica — diseña columnas, determina la lógica de clasificación, introduce los datos. El sistema necesita datos estructurados, buscables y ordenables."\n\nNadie te ayuda a decidir cómo diseñar las columnas. Nadie te ayuda a juzgar qué información importa. Solo tú frente a este terminal — un montón de datos caóticos y una hoja de cálculo vacía.`,

      pt: `O último andar. Só você.\n\nNão abandonado — a tela diz que esta é a parte que todos completam sozinhos.\n\nVocê empurra a porta e entra. Ela se fecha atrás de você. Silêncio — nada além da sua própria respiração.\n\nEsta é uma sala de arquivos. Diferente de todos os espaços anteriores: as coisas aqui estão ordenadas, cuidadosamente organizadas, com categorias, etiquetas, números de série, uma linha do tempo. Mas — incompleta. Algumas prateleiras estão vazias, algumas etiquetas caíram, alguns números têm lacunas.\n\nNa mesa junto à entrada, uma pilha grossa de dossiês em papel — manuscritos, impressos, formatos misturados, sem estrutura uniforme.\n\nAo lado, um terminal. A tela mostra uma interface de planilha vazia. O cursor pisca na primeira célula.\n\nA tela indica: "Restauração do Sistema, Passo Um: Estruturação de Dados. Organize os dossiês em papel na planilha eletrônica — projete colunas, determine a lógica de classificação, insira os dados. O sistema precisa de dados estruturados, pesquisáveis e ordenáveis."\n\nNinguém ajuda você a decidir como projetar as colunas. Ninguém ajuda você a julgar quais informações importam. Só você diante deste terminal — uma pilha de dados caóticos e uma planilha vazia.`,

      it: `L'ultimo piano. Solo tu.\n\nNon abbandonato — lo schermo dice che questa è la parte che ognuno completa da solo.\n\nSpingi la porta e entri. Si chiude alle tue spalle. Silenzio — nient'altro che il tuo respiro.\n\nQuesta è una sala archivi. Diversa da ogni spazio precedente: le cose qui sono ordinate, organizzate con cura, con categorie, etichette, numeri di serie, una cronologia. Ma — incompleta. Alcuni scaffali sono vuoti, alcune etichette sono cadute, alcuni numeri presentano lacune.\n\nSul tavolo accanto all'ingresso, una spessa pila di fascicoli cartacei — scritti a mano, stampati, formati misti, nessuna struttura uniforme.\n\nAccanto, un terminale. Lo schermo mostra un'interfaccia di foglio di calcolo vuota. Il cursore lampeggia nella prima cella.\n\nLo schermo indica: "Ripristino del Sistema, Fase Uno: Strutturazione dei Dati. Organizza i fascicoli cartacei nel foglio di calcolo elettronico — progetta le colonne, determina la logica di classificazione, inserisci i dati. Il sistema necessita di dati strutturati, ricercabili e ordinabili."\n\nNessuno ti aiuta a decidere come progettare le colonne. Nessuno ti aiuta a giudicare quali informazioni contano. Solo tu davanti a questo terminale — un mucchio di dati caotici e un foglio di calcolo vuoto.`,

      ru: `Последний этаж. Только ты.\n\nНе заброшен — экран говорит, что эту часть каждый проходит в одиночку.\n\nТы открываешь дверь и входишь. Она закрывается за тобой. Тишина — только твоё дыхание.\n\nЭто архивная комната. В отличие от всех предыдущих пространств: здесь всё упорядочено, тщательно организовано — категории, ярлыки, серийные номера, хронология. Но — не завершено. Некоторые полки пусты, некоторые ярлыки отклеились, между номерами есть пробелы.\n\nНа столе у входа — толстая стопка бумажных дел — рукописных, печатных, разных форматов, без единой структуры.\n\nРядом — терминал. На экране пустой интерфейс электронной таблицы. Курсор мигает в первой ячейке.\n\nНа экране надпись: «Восстановление системы, Шаг первый: Структурирование данных. Организуйте бумажные дела в электронной таблице — спроектируйте столбцы, определите логику классификации, введите данные. Системе нужны структурированные, доступные для поиска и сортировки данные.»\n\nНикто не поможет тебе решить, как проектировать столбцы. Никто не поможет оценить, какая информация важна. Только ты за этим терминалом — куча хаотичных данных и пустая таблица.`,

      ja: `最後のフロア。あなただけ。\n\n見捨てられたのではない——スクリーンには、ここは誰もが一人で完了する部分だと表示されている。\n\nドアを押して中に入る。背後で閉まる。静寂——自分の呼吸だけが聞こえる。\n\nここはアーカイブ室。これまでのどの空間とも違う：ここにあるものは整然としていて、丁寧に整理され、カテゴリー、ラベル、通し番号、タイムラインがある。しかし——不完全だ。空の棚、剥がれたラベル、欠番がある。\n\n入口のテーブルの上に、分厚い紙のファイルの束——手書き、印刷、さまざまなフォーマットが混在し、統一された構造がない。\n\nその隣にターミナル。スクリーンには空のスプレッドシートが表示されている。カーソルが最初のセルで点滅している。\n\nスクリーンの指示：「システム復旧ステップ1：データの構造化。紙のファイルを電子スプレッドシートに整理せよ——列を設計し、分類ロジックを決定し、データを入力する。システムには検索可能でソート可能な構造化データが必要だ。」\n\n列の設計を手伝ってくれる人はいない。どの情報が重要かを判断してくれる人もいない。このターミナルの前にいるのはあなただけ——混沌としたデータの山と、空白のスプレッドシート。`,

      ko: `마지막 층. 당신뿐.\n\n버려진 게 아니다 — 화면에는 이 부분은 모두가 혼자 완수하는 구간이라고 적혀 있다.\n\n문을 밀고 들어간다. 뒤에서 문이 닫힌다. 고요함 — 자신의 숨소리만 들린다.\n\n여기는 기록보관실이다. 이전의 모든 공간과 다르다: 여기 있는 것들은 질서정연하고, 세심하게 정리되어 있으며, 분류, 라벨, 일련번호, 타임라인이 있다. 하지만 — 불완전하다. 빈 선반, 떨어진 라벨, 빠진 번호가 있다.\n\n입구 옆 테이블 위에 두꺼운 종이 서류 묶음 — 손으로 쓴 것, 인쇄된 것, 혼합된 형식, 통일된 구조 없음.\n\n옆에 터미널 하나. 화면에는 빈 스프레드시트 인터페이스가 표시되어 있다. 커서가 첫 번째 셀에서 깜빡이고 있다.\n\n화면 안내: "시스템 복구 1단계: 데이터 구조화. 종이 서류를 전자 스프레드시트로 정리하라 — 열을 설계하고, 분류 논리를 결정하고, 데이터를 입력하라. 시스템에는 검색 가능하고 정렬 가능한 구조화된 데이터가 필요하다."\n\n열을 어떻게 설계할지 도와줄 사람은 없다. 어떤 정보가 중요한지 판단해줄 사람도 없다. 이 터미널 앞에는 당신뿐 — 혼란스러운 데이터 더미와 빈 스프레드시트.`,
    },
    taskDescription: {
      zh: "使用终端的电子表格软件，将纸质档案整理成结构化数据——设计表格结构、分类逻辑，逐条录入信息。",

      en: `Using the terminal's spreadsheet software, organize the paper files into structured data — design the table layout, classification logic, and enter records one by one.`,

      nl: `Gebruik de spreadsheetsoftware van de terminal om de papieren dossiers te ordenen in gestructureerde data — ontwerp de tabelindeling, classificatielogica, en voer records één voor één in.`,

      de: `Verwenden Sie die Tabellensoftware des Terminals, um die Papierakten in strukturierte Daten zu ordnen — entwerfen Sie das Tabellenlayout, die Klassifikationslogik und geben Sie die Einträge einzeln ein.`,

      fr: `En utilisant le tableur du terminal, organisez les dossiers papier en données structurées — concevez la disposition du tableau, la logique de classification, et saisissez les enregistrements un par un.`,

      es: `Usando el software de hoja de cálculo del terminal, organiza los expedientes en papel en datos estructurados — diseña la estructura de la tabla, la lógica de clasificación e introduce los registros uno por uno.`,

      pt: `Usando o software de planilha do terminal, organize os dossiês em papel em dados estruturados — projete o layout da tabela, a lógica de classificação e insira os registros um por um.`,

      it: `Usando il software di foglio di calcolo del terminale, organizza i fascicoli cartacei in dati strutturati — progetta il layout della tabella, la logica di classificazione e inserisci i record uno per uno.`,

      ru: `Используя табличное программное обеспечение терминала, организуйте бумажные дела в структурированные данные — спроектируйте макет таблицы, логику классификации и вводите записи одну за другой.`,

      ja: `ターミナルのスプレッドシートソフトを使って、紙のファイルを構造化データに整理せよ——テーブルレイアウトを設計し、分類ロジックを決め、レコードを一つずつ入力する。`,

      ko: `터미널의 스프레드시트 소프트웨어를 사용하여 종이 서류를 구조화된 데이터로 정리하라 — 테이블 레이아웃을 설계하고, 분류 논리를 결정하고, 기록을 하나씩 입력하라.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `光标在闪烁。你坐了下来。

在你动手之前，你花了几分钟翻了翻那摞纸质档案。不是随便翻——是在理解数据的结构。日期、名称、类别、编号……你在脑子里画出了表格的框架。

然后你开始输入第一个列名。

设计表格的过程让你进入了一种特有的专注状态——每一列的宽度、每一个分类的逻辑、数据格式的统一性。混乱的纸质档案在你手下变成有序的数字行列。

光标在移动。数据在增长。你甚至没有注意到时间过了多久。

这种把混乱变成秩序的过程，是你最安静的兴奋。`,

        en: `The cursor blinks. You sit down.\n\nBefore touching anything, you spend a few minutes leafing through the paper files. Not randomly — reading the data's structure. Dates, names, categories, serial numbers... you're sketching the spreadsheet framework in your head.\n\nThen you type the first column header.\n\nDesigning the table puts you in a distinct state of focus — column widths, classification logic, format consistency. Chaotic paper records transform into ordered digital rows under your hands.\n\nThe cursor moves. Data grows. You haven't even noticed how much time has passed.\n\nTurning chaos into order — this is your quietest form of excitement.`,

        nl: `De cursor knippert. Je gaat zitten.\n\nVoordat je iets aanraakt, blader je een paar minuten door de papieren dossiers. Niet willekeurig — je leest de structuur van de gegevens. Data, namen, categorieën, serienummers... je schetst het spreadsheetkader in je hoofd.\n\nDan typ je de eerste kolomkop.\n\nHet ontwerpen van de tabel brengt je in een bijzondere staat van concentratie — kolombreedte, classificatielogica, formaatconsistentie. Chaotische papieren dossiers veranderen onder je handen in geordende digitale rijen.\n\nDe cursor beweegt. Data groeit. Je hebt niet eens gemerkt hoeveel tijd er verstreken is.\n\nChaos omzetten in orde — dit is je stilste vorm van opwinding.`,

        de: `Der Cursor blinkt. Du setzt dich hin.\n\nBevor du etwas anfasst, blätterst du ein paar Minuten durch die Papierakten. Nicht wahllos — du liest die Struktur der Daten. Daten, Namen, Kategorien, Seriennummern... du skizzierst das Tabellengerüst in deinem Kopf.\n\nDann tippst du die erste Spaltenüberschrift.\n\nDas Entwerfen der Tabelle versetzt dich in einen besonderen Zustand der Konzentration — Spaltenbreiten, Klassifikationslogik, Formatkonsistenz. Chaotische Papierakten verwandeln sich unter deinen Händen in geordnete digitale Zeilen.\n\nDer Cursor bewegt sich. Daten wachsen. Du hast nicht einmal bemerkt, wie viel Zeit vergangen ist.\n\nChaos in Ordnung verwandeln — das ist deine stillste Form der Begeisterung.`,

        fr: `Le curseur clignote. Tu t'assieds.\n\nAvant de toucher quoi que ce soit, tu passes quelques minutes à feuilleter les dossiers papier. Pas au hasard — tu lis la structure des données. Dates, noms, catégories, numéros de série... tu esquisses le cadre du tableur dans ta tête.\n\nPuis tu tapes le premier en-tête de colonne.\n\nConcevoir le tableau te plonge dans un état de concentration particulier — largeur des colonnes, logique de classification, cohérence des formats. Les dossiers papier chaotiques se transforment en lignes numériques ordonnées sous tes mains.\n\nLe curseur se déplace. Les données grandissent. Tu n'as même pas remarqué combien de temps s'est écoulé.\n\nTransformer le chaos en ordre — c'est ta forme d'excitation la plus silencieuse.`,

        es: `El cursor parpadea. Te sientas.\n\nAntes de tocar nada, pasas unos minutos hojeando los expedientes en papel. No al azar — leyendo la estructura de los datos. Fechas, nombres, categorías, números de serie... estás esbozando el marco de la hoja de cálculo en tu cabeza.\n\nLuego escribes el primer encabezado de columna.\n\nDiseñar la tabla te pone en un estado de concentración particular — anchos de columna, lógica de clasificación, consistencia de formato. Los expedientes caóticos se transforman en filas digitales ordenadas bajo tus manos.\n\nEl cursor se mueve. Los datos crecen. Ni siquiera has notado cuánto tiempo ha pasado.\n\nConvertir el caos en orden — esta es tu forma más silenciosa de emoción.`,

        pt: `O cursor pisca. Você se senta.\n\nAntes de tocar em qualquer coisa, você passa alguns minutos folheando os dossiês em papel. Não aleatoriamente — lendo a estrutura dos dados. Datas, nomes, categorias, números de série... você está esboçando o quadro da planilha na sua cabeça.\n\nEntão você digita o primeiro cabeçalho de coluna.\n\nProjetar a tabela coloca você em um estado distinto de foco — largura das colunas, lógica de classificação, consistência de formato. Dossiês caóticos em papel se transformam em linhas digitais ordenadas sob suas mãos.\n\nO cursor se move. Os dados crescem. Você nem percebeu quanto tempo passou.\n\nTransformar caos em ordem — esta é a sua forma mais silenciosa de empolgação.`,

        it: `Il cursore lampeggia. Ti siedi.\n\nPrima di toccare qualsiasi cosa, passi qualche minuto a sfogliare i fascicoli cartacei. Non a caso — stai leggendo la struttura dei dati. Date, nomi, categorie, numeri di serie... stai disegnando il quadro del foglio di calcolo nella tua mente.\n\nPoi digiti la prima intestazione di colonna.\n\nProgettare la tabella ti porta in uno stato di concentrazione particolare — larghezza delle colonne, logica di classificazione, coerenza dei formati. I fascicoli caotici si trasformano in righe digitali ordinate sotto le tue mani.\n\nIl cursore si muove. I dati crescono. Non ti sei nemmeno accorto di quanto tempo è passato.\n\nTrasformare il caos in ordine — questa è la tua forma più silenziosa di eccitazione.`,

        ru: `Курсор мигает. Ты садишься.\n\nПрежде чем что-либо трогать, ты несколько минут листаешь бумажные дела. Не наугад — читаешь структуру данных. Даты, имена, категории, серийные номера... ты рисуешь каркас таблицы в голове.\n\nЗатем набираешь первый заголовок столбца.\n\nПроектирование таблицы погружает тебя в особое состояние сосредоточенности — ширина столбцов, логика классификации, единообразие форматов. Хаотичные бумажные дела превращаются в упорядоченные цифровые строки под твоими руками.\n\nКурсор движется. Данные растут. Ты даже не заметил, сколько времени прошло.\n\nПревращать хаос в порядок — это твоя самая тихая форма восторга.`,

        ja: `カーソルが点滅する。あなたは座る。\n\n何かに触れる前に、数分かけて紙のファイルに目を通す。ランダムではなく——データの構造を読んでいる。日付、名前、カテゴリー、通し番号……頭の中でスプレッドシートの枠組みを描いている。\n\nそして最初の列ヘッダーを入力する。\n\nテーブルを設計することで、独特な集中状態に入る——列幅、分類ロジック、フォーマットの一貫性。混沌とした紙の記録が、あなたの手の下で整然としたデジタルの行に変わっていく。\n\nカーソルが動く。データが増える。どれだけ時間が経ったかさえ気づいていない。\n\n混沌を秩序に変えること——これがあなたの最も静かな興奮の形だ。`,

        ko: `커서가 깜빡인다. 당신은 앉는다.\n\n아무것도 만지기 전에, 몇 분간 종이 서류를 넘겨본다. 무작위가 아니라 — 데이터의 구조를 읽고 있다. 날짜, 이름, 분류, 일련번호... 머릿속으로 스프레드시트의 틀을 그리고 있다.\n\n그리고 첫 번째 열 머리글을 입력한다.\n\n테이블을 설계하는 과정이 당신을 특별한 집중 상태로 이끈다 — 열 너비, 분류 논리, 형식의 일관성. 혼란스러운 종이 기록이 당신의 손 아래에서 질서 정연한 디지털 행으로 변해간다.\n\n커서가 움직인다. 데이터가 늘어난다. 얼마나 시간이 흘렀는지조차 알아차리지 못했다.\n\n혼돈을 질서로 바꾸는 것 — 이것이 당신의 가장 조용한 흥분의 형태다.`,
      },
      score4: {
        zh: `你坐到终端前面，翻了几页档案。

格式混乱，但信息是有的——只是需要有人把它们整理出来。你开始设计表格：日期、编号、分类、备注……基本的框架先搭起来，遇到特殊情况再加列。

你开始逐条录入。速度不快，因为你想确保每一条的分类都是准确的。有些档案的字迹潦草，需要你仔细辨认。

不是最激动人心的工作，但你做得认真。表格在一行一行地增长。`,

        en: `You sit at the terminal and flip through a few pages of files.\n\nThe formats are messy, but the information is there — it just needs someone to sort it. You start designing the table: date, number, category, notes... get the basic framework up, add columns for edge cases as you go.\n\nYou start entering records one by one. Not fast, because you want every classification to be accurate. Some files have illegible handwriting that you need to decipher carefully.\n\nNot the most exhilarating work, but you do it thoroughly. The table grows row by row.`,

        nl: `Je gaat aan de terminal zitten en bladert door een paar pagina's dossiers.\n\nDe formats zijn rommelig, maar de informatie is er — iemand moet het alleen ordenen. Je begint de tabel te ontwerpen: datum, nummer, categorie, notities... eerst het basiskader opzetten, kolommen toevoegen voor uitzonderingen naarmate je vordert.\n\nJe begint records één voor één in te voeren. Niet snel, want je wilt dat elke classificatie klopt. Sommige dossiers hebben onleesbaar handschrift dat je zorgvuldig moet ontcijferen.\n\nNiet het meest opwindende werk, maar je doet het grondig. De tabel groeit rij voor rij.`,

        de: `Du setzt dich an den Terminal und blätterst durch ein paar Seiten Akten.\n\nDie Formate sind unordentlich, aber die Informationen sind da — es braucht nur jemanden, der sie sortiert. Du beginnst die Tabelle zu entwerfen: Datum, Nummer, Kategorie, Anmerkungen... zuerst das Grundgerüst aufbauen, Spalten für Sonderfälle ergänzen, wenn sie auftauchen.\n\nDu fängst an, Einträge einzeln einzugeben. Nicht schnell, denn du willst, dass jede Klassifikation stimmt. Einige Akten haben unleserliche Handschrift, die du sorgfältig entziffern musst.\n\nNicht die aufregendste Arbeit, aber du machst sie gründlich. Die Tabelle wächst Zeile für Zeile.`,

        fr: `Tu t'assieds au terminal et feuilletes quelques pages de dossiers.\n\nLes formats sont désordonnés, mais l'information est là — il faut juste quelqu'un pour la trier. Tu commences à concevoir le tableau : date, numéro, catégorie, notes... d'abord le cadre de base, puis des colonnes supplémentaires pour les cas particuliers.\n\nTu commences à saisir les enregistrements un par un. Pas vite, car tu veux que chaque classification soit exacte. Certains dossiers ont une écriture illisible que tu dois déchiffrer avec soin.\n\nPas le travail le plus exaltant, mais tu le fais minutieusement. Le tableau grandit ligne par ligne.`,

        es: `Te sientas en el terminal y hojeas unas páginas de expedientes.\n\nLos formatos son desordenados, pero la información está ahí — solo necesita que alguien la ordene. Empiezas a diseñar la tabla: fecha, número, categoría, notas... primero el marco básico, añadiendo columnas para casos especiales sobre la marcha.\n\nEmpiezas a introducir registros uno por uno. No rápido, porque quieres que cada clasificación sea precisa. Algunos expedientes tienen letra ilegible que necesitas descifrar con cuidado.\n\nNo es el trabajo más emocionante, pero lo haces a fondo. La tabla crece fila por fila.`,

        pt: `Você se senta no terminal e folheia algumas páginas de dossiês.\n\nOs formatos são bagunçados, mas a informação está lá — só precisa de alguém para organizá-la. Você começa a projetar a tabela: data, número, categoria, notas... primeiro a estrutura básica, adicionando colunas para casos especiais conforme avança.\n\nVocê começa a inserir registros um por um. Não rápido, porque quer que cada classificação esteja correta. Alguns dossiês têm caligrafia ilegível que você precisa decifrar com cuidado.\n\nNão é o trabalho mais empolgante, mas você o faz com rigor. A tabela cresce linha por linha.`,

        it: `Ti siedi al terminale e sfogli qualche pagina di fascicoli.\n\nI formati sono disordinati, ma le informazioni ci sono — servono solo qualcuno che le ordini. Cominci a progettare la tabella: data, numero, categoria, note... prima l'impalcatura di base, aggiungendo colonne per i casi particolari man mano.\n\nCominci a inserire i record uno per uno. Non velocemente, perché vuoi che ogni classificazione sia accurata. Alcuni fascicoli hanno una calligrafia illeggibile che devi decifrare con attenzione.\n\nNon è il lavoro più entusiasmante, ma lo fai con cura. La tabella cresce riga per riga.`,

        ru: `Ты садишься за терминал и листаешь несколько страниц дел.\n\nФорматы хаотичны, но информация есть — её просто нужно упорядочить. Ты начинаешь проектировать таблицу: дата, номер, категория, примечания... сначала базовый каркас, добавляя столбцы для особых случаев по ходу дела.\n\nТы начинаешь вводить записи одну за другой. Не быстро, потому что хочешь, чтобы каждая классификация была точной. У некоторых дел неразборчивый почерк, который приходится тщательно расшифровывать.\n\nНе самая захватывающая работа, но ты делаешь её основательно. Таблица растёт строка за строкой.`,

        ja: `ターミナルに座り、数ページのファイルをめくる。\n\nフォーマットは乱雑だが、情報はある——誰かが整理すればいいだけだ。テーブルの設計を始める：日付、番号、カテゴリー、備考……まず基本の枠組みを作り、進めながら例外用の列を追加していく。\n\nレコードを一つずつ入力し始める。速くはない、すべての分類を正確にしたいから。判読しにくい手書きのファイルもあり、注意深く解読する必要がある。\n\n最もワクワクする仕事ではないが、丁寧にやる。テーブルが一行ずつ成長していく。`,

        ko: `터미널에 앉아 서류 몇 페이지를 넘겨본다.\n\n형식은 엉망이지만 정보는 있다 — 누군가 정리하면 되는 것이다. 테이블 설계를 시작한다: 날짜, 번호, 분류, 비고... 기본 틀을 먼저 세우고, 진행하면서 특수한 경우에 맞는 열을 추가한다.\n\n기록을 하나씩 입력하기 시작한다. 빠르지 않다, 모든 분류가 정확하길 원하기 때문이다. 알아보기 어려운 필체의 서류도 있어 조심스럽게 해독해야 한다.\n\n가장 신나는 일은 아니지만 꼼꼼하게 한다. 테이블이 행 하나씩 늘어간다.`,
      },
      score3: {
        zh: `空白的表格。一堆混乱的纸质档案。

你坐到终端前，看了看那个闪烁的光标。设计一个表格来整理这些数据……你能做，但你不确定自己设计的结构是最优的。

你先翻了翻档案，试着理解数据的类型。然后你在第一格输入了第一个列名。

过程有点慢，因为你每一步都在犹豫——这个分类逻辑对不对？这一列放在这里合适吗？

你在做，但不是最享受的状态。`,

        en: `A blank spreadsheet. A pile of messy paper files.\n\nYou sit at the terminal and look at the blinking cursor. Designing a table to organize this data... you can do it, but you're not confident your structure will be optimal.\n\nYou flip through the files first, trying to understand the data types. Then you type the first column header in the first cell.\n\nThe process is slow — at every step you're second-guessing. Is this classification right? Should this column go here?\n\nYou're doing it, but not in your most comfortable state.`,

        nl: `Een leeg spreadsheet. Een stapel rommelige papieren dossiers.\n\nJe gaat aan de terminal zitten en kijkt naar de knipperende cursor. Een tabel ontwerpen om deze gegevens te ordenen... je kunt het, maar je bent niet zeker dat je structuur optimaal zal zijn.\n\nJe bladert eerst door de dossiers en probeert de datatypes te begrijpen. Dan typ je de eerste kolomkop in de eerste cel.\n\nHet proces is traag — bij elke stap twijfel je. Klopt deze classificatie? Hoort deze kolom hier?\n\nJe doet het, maar niet in je comfortabelste staat.`,

        de: `Eine leere Tabelle. Ein Stapel unordentlicher Papierakten.\n\nDu setzt dich an den Terminal und starrst den blinkenden Cursor an. Eine Tabelle entwerfen, um diese Daten zu ordnen... du kannst es, aber du bist nicht sicher, dass deine Struktur optimal sein wird.\n\nDu blätterst zuerst durch die Akten und versuchst die Datentypen zu verstehen. Dann tippst du die erste Spaltenüberschrift in die erste Zelle.\n\nDer Prozess ist langsam — bei jedem Schritt zweifelst du. Stimmt diese Klassifikation? Gehört diese Spalte hierher?\n\nDu machst es, aber nicht in deinem angenehmsten Zustand.`,

        fr: `Un tableur vide. Une pile de dossiers papier en désordre.\n\nTu t'assieds au terminal et regardes le curseur clignoter. Concevoir un tableau pour organiser ces données... tu peux le faire, mais tu n'es pas sûr que ta structure sera optimale.\n\nTu feuilletes d'abord les dossiers, essayant de comprendre les types de données. Puis tu tapes le premier en-tête de colonne dans la première cellule.\n\nLe processus est lent — à chaque étape tu doutes. Cette classification est-elle correcte ? Cette colonne devrait-elle être ici ?\n\nTu le fais, mais pas dans ton état le plus confortable.`,

        es: `Una hoja de cálculo vacía. Un montón de expedientes desordenados.\n\nTe sientas en el terminal y miras el cursor parpadeante. Diseñar una tabla para organizar estos datos... puedes hacerlo, pero no estás seguro de que tu estructura sea la óptima.\n\nPrimero hojeas los expedientes, intentando entender los tipos de datos. Luego escribes el primer encabezado de columna en la primera celda.\n\nEl proceso es lento — en cada paso dudas. ¿Es correcta esta clasificación? ¿Debería ir esta columna aquí?\n\nLo estás haciendo, pero no en tu estado más cómodo.`,

        pt: `Uma planilha vazia. Uma pilha de dossiês em papel bagunçados.\n\nVocê se senta no terminal e olha para o cursor piscante. Projetar uma tabela para organizar esses dados... você consegue, mas não tem certeza de que sua estrutura será a ideal.\n\nVocê folheia os dossiês primeiro, tentando entender os tipos de dados. Então digita o primeiro cabeçalho de coluna na primeira célula.\n\nO processo é lento — a cada passo você hesita. Essa classificação está certa? Essa coluna deveria estar aqui?\n\nVocê está fazendo, mas não no seu estado mais confortável.`,

        it: `Un foglio di calcolo vuoto. Una pila di fascicoli cartacei disordinati.\n\nTi siedi al terminale e guardi il cursore lampeggiare. Progettare una tabella per organizzare questi dati... puoi farlo, ma non sei sicuro che la tua struttura sarà ottimale.\n\nPrima sfogli i fascicoli, cercando di capire i tipi di dati. Poi digiti la prima intestazione di colonna nella prima cella.\n\nIl processo è lento — a ogni passo ti metti in dubbio. Questa classificazione è giusta? Questa colonna dovrebbe stare qui?\n\nLo stai facendo, ma non nel tuo stato più confortevole.`,

        ru: `Пустая таблица. Куча беспорядочных бумажных дел.\n\nТы садишься за терминал и смотришь на мигающий курсор. Спроектировать таблицу для организации этих данных... ты можешь, но не уверен, что твоя структура будет оптимальной.\n\nСначала листаешь дела, пытаясь понять типы данных. Затем набираешь первый заголовок столбца в первой ячейке.\n\nПроцесс медленный — на каждом шагу сомневаешься. Правильна ли эта классификация? Этот столбец здесь уместен?\n\nТы делаешь, но не в самом комфортном состоянии.`,

        ja: `空白のスプレッドシート。乱雑な紙のファイルの山。\n\nターミナルに座り、点滅するカーソルを見つめる。このデータを整理するテーブルを設計する……できるが、自分の構造が最適かどうか自信がない。\n\nまずファイルに目を通し、データの種類を理解しようとする。それから最初のセルに最初の列ヘッダーを入力する。\n\nプロセスは遅い——一歩ごとに迷う。この分類は正しいか？この列はここでいいのか？\n\nやっている。だが、最も快適な状態ではない。`,

        ko: `빈 스프레드시트. 어지러운 종이 서류 더미.\n\n터미널에 앉아 깜빡이는 커서를 바라본다. 이 데이터를 정리할 테이블을 설계하는 것... 할 수는 있지만, 자신의 구조가 최적일지 확신이 없다.\n\n먼저 서류를 넘겨보며 데이터 유형을 파악하려 한다. 그리고 첫 번째 셀에 첫 번째 열 머리글을 입력한다.\n\n과정은 느리다 — 매 단계마다 망설인다. 이 분류가 맞나? 이 열이 여기 있어야 하나?\n\n하고는 있지만, 가장 편한 상태는 아니다.`,
      },
      score2: {
        zh: `一堆纸质档案。一个空白表格。

你看了看那些纸上的字迹——有些工整，有些潦草，格式各异。要把这些全部整理成结构化的数据……

你对着那个闪烁的光标坐了一会儿。这种工作——数据录入、格式设计、逐条分类——需要一种你此刻不太有的耐心。

你输入了几条，然后停了下来。也许后面的步骤更适合你。`,

        en: `A pile of paper files. A blank spreadsheet.\n\nYou look at the handwriting — some neat, some scrawled, formats all over the place. Organizing all of this into structured data...\n\nYou sit in front of the blinking cursor for a while. This kind of work — data entry, format design, classification one by one — requires a patience you don't quite have right now.\n\nYou enter a few records, then stop. Maybe the next steps suit you better.`,

        nl: `Een stapel papieren dossiers. Een leeg spreadsheet.\n\nJe kijkt naar het handschrift — sommige netjes, sommige krabbelig, formats overal. Dit alles omzetten in gestructureerde data...\n\nJe zit een tijdje voor de knipperende cursor. Dit soort werk — gegevensinvoer, formatontwerp, classificatie één voor één — vereist een geduld dat je nu niet helemaal hebt.\n\nJe voert een paar records in en stopt dan. Misschien passen de volgende stappen beter bij je.`,

        de: `Ein Stapel Papierakten. Eine leere Tabelle.\n\nDu schaust dir die Handschriften an — einige ordentlich, einige gekritzelt, Formate überall verstreut. Das alles in strukturierte Daten umwandeln...\n\nDu sitzt eine Weile vor dem blinkenden Cursor. Diese Art Arbeit — Dateneingabe, Formatgestaltung, Klassifikation Stück für Stück — erfordert eine Geduld, die du gerade nicht ganz aufbringen kannst.\n\nDu gibst ein paar Einträge ein und hörst dann auf. Vielleicht passen die nächsten Schritte besser zu dir.`,

        fr: `Une pile de dossiers papier. Un tableur vide.\n\nTu regardes les écritures — certaines soignées, d'autres griffonnées, des formats dans tous les sens. Organiser tout cela en données structurées...\n\nTu restes un moment devant le curseur clignotant. Ce genre de travail — saisie de données, conception de formats, classification un par un — demande une patience que tu n'as pas tout à fait en ce moment.\n\nTu saisis quelques enregistrements, puis tu t'arrêtes. Peut-être que les prochaines étapes te conviendront mieux.`,

        es: `Un montón de expedientes en papel. Una hoja de cálculo vacía.\n\nMiras la escritura — algunas prolijas, otras garabateadas, formatos por todas partes. Organizar todo esto en datos estructurados...\n\nTe quedas un rato frente al cursor parpadeante. Este tipo de trabajo — entrada de datos, diseño de formatos, clasificación uno por uno — requiere una paciencia que ahora mismo no tienes del todo.\n\nIntroduces unos pocos registros y luego paras. Quizás los siguientes pasos te convengan más.`,

        pt: `Uma pilha de dossiês em papel. Uma planilha vazia.\n\nVocê olha para a caligrafia — algumas legíveis, outras rabiscadas, formatos de todo tipo. Organizar tudo isso em dados estruturados...\n\nVocê fica sentado diante do cursor piscante por um tempo. Esse tipo de trabalho — entrada de dados, design de formato, classificação um por um — requer uma paciência que você não tem bem agora.\n\nVocê insere alguns registros e para. Talvez os próximos passos combinem mais com você.`,

        it: `Una pila di fascicoli cartacei. Un foglio di calcolo vuoto.\n\nGuardi le calligrafie — alcune ordinate, altre scarabocchiate, formati ovunque. Organizzare tutto questo in dati strutturati...\n\nResti seduto davanti al cursore lampeggiante per un po'. Questo tipo di lavoro — inserimento dati, progettazione di formati, classificazione uno per uno — richiede una pazienza che in questo momento non hai del tutto.\n\nInserisci qualche record, poi ti fermi. Forse i prossimi passi sono più adatti a te.`,

        ru: `Куча бумажных дел. Пустая таблица.\n\nТы смотришь на почерки — одни аккуратные, другие каракули, форматы вперемешку. Организовать всё это в структурированные данные...\n\nТы сидишь перед мигающим курсором какое-то время. Такая работа — ввод данных, проектирование форматов, классификация поштучно — требует терпения, которого у тебя сейчас не хватает.\n\nТы вводишь несколько записей и останавливаешься. Возможно, следующие шаги подойдут тебе больше.`,

        ja: `紙のファイルの山。空白のスプレッドシート。\n\n手書きの文字を見る——きれいなものもあれば、走り書きもあり、フォーマットはバラバラ。これをすべて構造化データに整理する……\n\n点滅するカーソルの前にしばらく座っている。この種の作業——データ入力、フォーマット設計、一つずつの分類——には、今の自分にはない忍耐力が必要だ。\n\n数件入力して、止まる。次のステップの方が自分に合っているかもしれない。`,

        ko: `종이 서류 더미. 빈 스프레드시트.\n\n필체를 살펴본다 — 깔끔한 것도 있고, 갈겨쓴 것도 있고, 형식은 제각각이다. 이 모든 것을 구조화된 데이터로 정리하기란...\n\n깜빡이는 커서 앞에 한동안 앉아 있는다. 이런 종류의 작업 — 데이터 입력, 형식 설계, 하나씩 분류 — 에는 지금 자신에게 부족한 인내심이 필요하다.\n\n몇 개 기록을 입력하고 멈춘다. 다음 단계가 더 맞을지도 모른다.`,
      },
      score1: {
        zh: `光标在闪。你看着它。

设计表格、整理数据、逐条录入——这些词在你脑海里形成了一幅很具体的画面：一个人对着屏幕，把混乱变成行列。

你知道这件事有价值，但你身体里没有想做的冲动。

你站起来，看了看档案室的其他部分。这里有五个步骤。也许后面有一个更能触动你的。`,

        en: `The cursor blinks. You stare at it.\n\nDesigning tables, organizing data, entering records one by one — these words paint a very concrete picture: one person at a screen, turning chaos into rows and columns.\n\nYou know this has value. But nothing in your body wants to do it.\n\nYou stand up and look around the archive room. Five steps here. Maybe a later one resonates more.`,

        nl: `De cursor knippert. Je staart ernaar.\n\nTabellen ontwerpen, gegevens ordenen, records één voor één invoeren — deze woorden schilderen een heel concreet beeld: één persoon achter een scherm, chaos omzettend in rijen en kolommen.\n\nJe weet dat dit waarde heeft. Maar niets in je lichaam wil het doen.\n\nJe staat op en kijkt rond in de archiefkamer. Vijf stappen hier. Misschien spreekt een latere je meer aan.`,

        de: `Der Cursor blinkt. Du starrst ihn an.\n\nTabellen entwerfen, Daten ordnen, Einträge einzeln eingeben — diese Worte zeichnen ein sehr konkretes Bild: eine Person vor einem Bildschirm, die Chaos in Zeilen und Spalten verwandelt.\n\nDu weißt, dass das Wert hat. Aber nichts in deinem Körper will es tun.\n\nDu stehst auf und schaust dich im Archivraum um. Fünf Schritte hier. Vielleicht trifft ein späterer dich mehr.`,

        fr: `Le curseur clignote. Tu le fixes.\n\nConcevoir des tableaux, organiser des données, saisir des enregistrements un par un — ces mots peignent une image très concrète : une personne devant un écran, transformant le chaos en lignes et colonnes.\n\nTu sais que cela a de la valeur. Mais rien dans ton corps ne veut le faire.\n\nTu te lèves et regardes autour de la salle d'archives. Cinq étapes ici. Peut-être qu'une suivante résonnera davantage.`,

        es: `El cursor parpadea. Lo miras fijamente.\n\nDiseñar tablas, organizar datos, introducir registros uno por uno — estas palabras pintan una imagen muy concreta: una persona frente a una pantalla, convirtiendo el caos en filas y columnas.\n\nSabes que esto tiene valor. Pero nada en tu cuerpo quiere hacerlo.\n\nTe levantas y miras alrededor de la sala de archivos. Cinco pasos aquí. Quizás uno posterior resuene más.`,

        pt: `O cursor pisca. Você o fita.\n\nProjetar tabelas, organizar dados, inserir registros um por um — essas palavras pintam um quadro muito concreto: uma pessoa diante de uma tela, transformando caos em linhas e colunas.\n\nVocê sabe que isso tem valor. Mas nada no seu corpo quer fazer isso.\n\nVocê se levanta e olha ao redor da sala de arquivos. Cinco passos aqui. Talvez um posterior ressoe mais.`,

        it: `Il cursore lampeggia. Lo fissi.\n\nProgettare tabelle, organizzare dati, inserire record uno per uno — queste parole dipingono un'immagine molto concreta: una persona davanti a uno schermo, che trasforma il caos in righe e colonne.\n\nSai che questo ha valore. Ma niente nel tuo corpo vuole farlo.\n\nTi alzi e guardi intorno alla sala archivi. Cinque passaggi qui. Forse uno successivo ti coinvolgerà di più.`,

        ru: `Курсор мигает. Ты смотришь на него.\n\nПроектировать таблицы, упорядочивать данные, вводить записи одну за другой — эти слова рисуют очень конкретную картину: один человек перед экраном, превращающий хаос в строки и столбцы.\n\nТы знаешь, что в этом есть ценность. Но ничто в твоём теле не хочет этим заниматься.\n\nТы встаёшь и оглядываешь архивную комнату. Пять шагов здесь. Возможно, один из следующих откликнется больше.`,

        ja: `カーソルが点滅する。あなたはそれを見つめる。\n\nテーブルを設計し、データを整理し、レコードを一つずつ入力する——これらの言葉は非常に具体的な絵を描く：画面の前の一人が、混沌を行と列に変えている。\n\nこれに価値があることは分かっている。でも体のどこもそれをしたがらない。\n\n立ち上がって、アーカイブ室を見回す。ここには5つのステップがある。後のステップの方が響くかもしれない。`,

        ko: `커서가 깜빡인다. 당신은 그것을 응시한다.\n\n테이블을 설계하고, 데이터를 정리하고, 기록을 하나씩 입력하기 — 이 단어들은 매우 구체적인 그림을 그린다: 화면 앞의 한 사람이 혼돈을 행과 열로 바꾸고 있다.\n\n이것에 가치가 있다는 걸 안다. 하지만 몸 어디에서도 하고 싶은 충동이 없다.\n\n일어서서 기록보관실을 둘러본다. 여기에 다섯 단계가 있다. 뒤의 단계가 더 와닿을지도 모른다.`,
      },
    },
  },

  {
    id: 27,
    riasec: "C",
    miniIpCode: "C2",
    miniIpItem: "Operate a calculator",
    chapter: "archive",
    chapterIndex: 6,
    questionInChapter: 2,
    isClimax: false,
    scene: {
      zh: `表格完成了。数据有了结构。

但终端屏幕没让你休息。新的提示出现了：

「系统恢复步骤二：财务核验。档案室的运营记录包含大量数值数据——经费支出、物资采购、折旧计算。这些数字在多次转录中已出现偏差。请使用计算器逐项核算，确保每一笔数据的精确性。」

桌上多了一台计算器，旁边是三本厚厚的账簿。每一页都密密麻麻写满数字——金额、日期、百分比、累计总额。有些数字被划掉重写过，有些小计和总计对不上。

你需要逐行核算：重新计算每一笔，用计算器验证，标记错误，修正数据。

精确的、重复的、数字的工作。每一个小数点都不能错。`,

      en: `The spreadsheet is done. The data has structure.\n\nBut the terminal doesn't let you rest. A new prompt appears:\n\n"System Restoration Step Two: Financial Verification. The archive's operational records contain extensive numerical data — expenditures, procurement costs, depreciation calculations. These figures have drifted through multiple transcriptions. Use the calculator to audit each entry, ensuring every number is precise."\n\nA calculator appears on the desk, alongside three thick ledgers. Every page is dense with figures — amounts, dates, percentages, running totals. Some numbers have been crossed out and rewritten. Some subtotals don't match their totals.\n\nYou need to go line by line: recalculate each entry, verify, flag errors, correct the data.\n\nPrecise, repetitive, numerical work. Every decimal point matters.`,

      nl: `Het spreadsheet is klaar. De data heeft structuur.\n\nMaar de terminal laat je niet rusten. Een nieuwe melding verschijnt:\n\n"Systeemherstel Stap Twee: Financiële Verificatie. De operationele archiefrecords bevatten uitgebreide numerieke gegevens — uitgaven, inkoopkosten, afschrijvingsberekeningen. Deze cijfers zijn verschoven door meerdere overschrijvingen. Gebruik de rekenmachine om elke post te controleren en zorg ervoor dat elk getal klopt."\n\nEen rekenmachine verschijnt op het bureau, naast drie dikke kasboeken. Elke pagina staat vol cijfers — bedragen, data, percentages, lopende totalen. Sommige getallen zijn doorgestreept en herschreven. Sommige subtotalen kloppen niet met hun totalen.\n\nJe moet regel voor regel werken: elke post herberekenen, verifiëren met de rekenmachine, fouten markeren, gegevens corrigeren.\n\nPrecies, repetitief, numeriek werk. Elk decimaalteken telt.`,

      de: `Die Tabelle ist fertig. Die Daten haben Struktur.\n\nAber das Terminal lässt dich nicht ruhen. Eine neue Anzeige erscheint:\n\n„Systemwiederherstellung Schritt Zwei: Finanzprüfung. Die betrieblichen Archivaufzeichnungen enthalten umfangreiche numerische Daten — Ausgaben, Beschaffungskosten, Abschreibungsberechnungen. Diese Zahlen sind durch mehrfache Übertragungen ungenau geworden. Verwenden Sie den Taschenrechner, um jeden Eintrag zu prüfen und die Genauigkeit jeder Zahl sicherzustellen."\n\nEin Taschenrechner erscheint auf dem Schreibtisch, daneben drei dicke Kontobücher. Jede Seite ist dicht mit Zahlen gefüllt — Beträge, Daten, Prozentsätze, laufende Summen. Manche Zahlen wurden durchgestrichen und neu geschrieben. Manche Zwischensummen stimmen nicht mit den Endsummen überein.\n\nDu musst Zeile für Zeile vorgehen: jeden Eintrag neu berechnen, mit dem Taschenrechner verifizieren, Fehler markieren, Daten korrigieren.\n\nPräzise, wiederholende, numerische Arbeit. Jede Nachkommastelle zählt.`,

      fr: `Le tableur est terminé. Les données ont une structure.\n\nMais le terminal ne te laisse pas souffler. Un nouveau message apparaît :\n\n« Restauration du Système, Étape Deux : Vérification Financière. Les registres opérationnels des archives contiennent de nombreuses données numériques — dépenses, coûts d'approvisionnement, calculs d'amortissement. Ces chiffres se sont décalés au fil de multiples transcriptions. Utilisez la calculatrice pour auditer chaque entrée, en assurant la précision de chaque nombre. »\n\nUne calculatrice apparaît sur le bureau, à côté de trois épais registres comptables. Chaque page est couverte de chiffres — montants, dates, pourcentages, totaux cumulés. Certains nombres ont été barrés et réécrits. Certains sous-totaux ne correspondent pas aux totaux.\n\nTu dois procéder ligne par ligne : recalculer chaque entrée, vérifier avec la calculatrice, signaler les erreurs, corriger les données.\n\nUn travail précis, répétitif, numérique. Chaque décimale compte.`,

      es: `La hoja de cálculo está lista. Los datos tienen estructura.\n\nPero el terminal no te deja descansar. Aparece un nuevo mensaje:\n\n"Restauración del Sistema, Paso Dos: Verificación Financiera. Los registros operativos del archivo contienen datos numéricos extensos — gastos, costos de adquisición, cálculos de depreciación. Estas cifras se han desviado a través de múltiples transcripciones. Usa la calculadora para auditar cada entrada, asegurando la precisión de cada número."\n\nUna calculadora aparece en el escritorio, junto a tres gruesos libros de contabilidad. Cada página está llena de cifras — montos, fechas, porcentajes, totales acumulados. Algunos números han sido tachados y reescritos. Algunos subtotales no coinciden con sus totales.\n\nDebes ir línea por línea: recalcular cada entrada, verificar con la calculadora, marcar errores, corregir los datos.\n\nTrabajo preciso, repetitivo, numérico. Cada punto decimal importa.`,

      pt: `A planilha está pronta. Os dados têm estrutura.\n\nMas o terminal não deixa você descansar. Um novo aviso aparece:\n\n"Restauração do Sistema, Passo Dois: Verificação Financeira. Os registros operacionais do arquivo contêm dados numéricos extensos — despesas, custos de aquisição, cálculos de depreciação. Esses números se desviaram ao longo de múltiplas transcrições. Use a calculadora para auditar cada entrada, garantindo a precisão de cada número."\n\nUma calculadora aparece na mesa, ao lado de três grossos livros contábeis. Cada página está repleta de números — valores, datas, percentuais, totais acumulados. Alguns números foram riscados e reescritos. Alguns subtotais não batem com seus totais.\n\nVocê precisa ir linha por linha: recalcular cada entrada, verificar com a calculadora, sinalizar erros, corrigir os dados.\n\nTrabalho preciso, repetitivo, numérico. Cada casa decimal importa.`,

      it: `Il foglio di calcolo è pronto. I dati hanno una struttura.\n\nMa il terminale non ti lascia riposare. Appare un nuovo messaggio:\n\n"Ripristino del Sistema, Fase Due: Verifica Finanziaria. I registri operativi dell'archivio contengono numerosi dati numerici — spese, costi di approvvigionamento, calcoli di ammortamento. Queste cifre si sono alterate attraverso molteplici trascrizioni. Usa la calcolatrice per verificare ogni voce, assicurando la precisione di ogni numero."\n\nUna calcolatrice appare sulla scrivania, accanto a tre spessi libri contabili. Ogni pagina è fitta di cifre — importi, date, percentuali, totali progressivi. Alcuni numeri sono stati cancellati e riscritti. Alcuni subtotali non corrispondono ai totali.\n\nDevi procedere riga per riga: ricalcolare ogni voce, verificare con la calcolatrice, segnalare gli errori, correggere i dati.\n\nLavoro preciso, ripetitivo, numerico. Ogni decimale conta.`,

      ru: `Таблица готова. Данные обрели структуру.\n\nНо терминал не даёт передохнуть. Появляется новое сообщение:\n\n«Восстановление системы, Шаг второй: Финансовая проверка. Операционные записи архива содержат обширные числовые данные — расходы, закупочные цены, расчёты амортизации. Эти цифры исказились при многократных переписываниях. Используйте калькулятор для проверки каждой записи, убедитесь в точности каждого числа.»\n\nНа столе появляется калькулятор, рядом — три толстые бухгалтерские книги. Каждая страница испещрена цифрами — суммы, даты, проценты, накопительные итоги. Некоторые числа зачёркнуты и переписаны. Некоторые промежуточные итоги не сходятся с общими.\n\nНужно идти строка за строкой: пересчитать каждую запись, проверить на калькуляторе, отметить ошибки, исправить данные.\n\nТочная, повторяющаяся, числовая работа. Каждый знак после запятой имеет значение.`,

      ja: `スプレッドシートが完成した。データに構造ができた。\n\nしかしターミナルは休ませてくれない。新しい指示が表示される：\n\n「システム復旧ステップ2：財務検証。アーカイブの運営記録には膨大な数値データが含まれている——支出、調達費用、減価償却計算。これらの数字は複数回の転記で誤差が生じている。計算機を使って各項目を監査し、すべての数字の正確性を確認せよ。」\n\n机の上に計算機が現れ、その横に3冊の分厚い帳簿がある。各ページは数字で埋め尽くされている——金額、日付、百分率、累計。取り消し線を引いて書き直された数字もある。小計と合計が合わない箇所もある。\n\n一行ずつ進める必要がある：各項目を再計算し、計算機で検証し、誤りをマークし、データを修正する。\n\n正確で、反復的で、数値的な作業。小数点一つも間違えられない。`,

      ko: `스프레드시트가 완성되었다. 데이터에 구조가 생겼다.\n\n하지만 터미널은 쉬게 해주지 않는다. 새로운 안내가 나타난다:\n\n"시스템 복구 2단계: 재무 검증. 기록보관실의 운영 기록에는 방대한 수치 데이터가 포함되어 있다 — 지출, 조달 비용, 감가상각 계산. 이 숫자들은 여러 번의 전사 과정에서 오차가 발생했다. 계산기를 사용하여 각 항목을 감사하고, 모든 숫자의 정확성을 확인하라."\n\n책상 위에 계산기가 나타나고, 옆에 두꺼운 회계 장부 세 권이 놓여 있다. 각 페이지는 숫자로 빼곡하다 — 금액, 날짜, 백분율, 누계. 지우고 다시 쓴 숫자도 있다. 소계와 합계가 맞지 않는 곳도 있다.\n\n한 줄씩 진행해야 한다: 각 항목을 재계산하고, 계산기로 검증하고, 오류를 표시하고, 데이터를 수정한다.\n\n정밀하고, 반복적이고, 숫자 중심의 작업. 소수점 하나도 틀려서는 안 된다.`,
    },
    taskDescription: {
      zh: "使用计算器逐项核算档案室的财务记录——核对支出、采购成本和折旧数据，标记并修正每一处数字偏差。",

      en: `Use the calculator to audit the archive's financial records line by line — verify expenditures, procurement costs, and depreciation figures, flagging and correcting every numerical discrepancy.`,

      nl: `Gebruik de rekenmachine om de financiële archiefrecords regel voor regel te controleren — verifieer uitgaven, inkoopkosten en afschrijvingscijfers, markeer en corrigeer elke numerieke afwijking.`,

      de: `Verwende den Taschenrechner, um die Finanzunterlagen des Archivs Zeile für Zeile zu prüfen — überprüfe Ausgaben, Beschaffungskosten und Abschreibungszahlen, markiere und korrigiere jede numerische Abweichung.`,

      fr: `Utilise la calculatrice pour auditer les registres financiers des archives ligne par ligne — vérifie les dépenses, les coûts d'approvisionnement et les chiffres d'amortissement, signale et corrige chaque écart numérique.`,

      es: `Usa la calculadora para auditar los registros financieros del archivo línea por línea — verifica gastos, costos de adquisición y cifras de depreciación, marcando y corrigiendo cada discrepancia numérica.`,

      pt: `Use a calculadora para auditar os registros financeiros do arquivo linha por linha — verifique despesas, custos de aquisição e valores de depreciação, sinalizando e corrigindo cada discrepância numérica.`,

      it: `Usa la calcolatrice per verificare i registri finanziari dell'archivio riga per riga — controlla spese, costi di approvvigionamento e cifre di ammortamento, segnalando e correggendo ogni discrepanza numerica.`,

      ru: `Используйте калькулятор для построчной проверки финансовых записей архива — проверьте расходы, закупочные цены и данные амортизации, отмечая и исправляя каждое числовое расхождение.`,

      ja: `計算機を使ってアーカイブの財務記録を一行ずつ監査せよ——支出、調達費用、減価償却の数字を検証し、すべての数値の食い違いを指摘・修正する。`,

      ko: `계산기를 사용하여 기록보관실의 재무 기록을 한 줄씩 감사하라 — 지출, 조달 비용, 감가상각 수치를 검증하고, 모든 수치 불일치를 표시하고 수정하라.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `三本账簿。一台计算器。你的手指。

你翻开第一本账簿，从第一行开始。支出金额、采购单价、数量、小计——你在计算器上逐一敲入，和账簿上的数字比对。

这种工作有一种节奏感：读数、输入、计算、比对、标记。每一行都是一个独立的验证——没有捷径，没有跳过。

第七行，你发现了第一个错误：一笔采购的累计总额多算了0.3%。你标记出来，修正数据，继续。

第二本账簿。第三本。你的手指在计算器键盘上越来越流畅，但注意力从未放松——因为你知道，每一个被忽略的小数点都会在最终汇总时放大成不可接受的偏差。

最后一页核算完毕。三本账簿，每一笔数据都被验证过。数字终于说得通了。

这种把混乱的数字变成可信数据的过程，是你最精确的安静。`,

        en: `Three ledgers. One calculator. Your fingers.\n\nYou open the first ledger and start from line one. Expenditure amount, unit cost, quantity, subtotal — you key each number into the calculator and compare against the ledger.\n\nThis work has a rhythm: read, enter, calculate, compare, mark. Each line is an independent verification — no shortcuts, no skipping.\n\nLine seven, you find the first error: a procurement running total is off by 0.3%. You flag it, correct the data, continue.\n\nSecond ledger. Third. Your fingers move more fluidly across the calculator keys, but your attention never loosens — because you know every overlooked decimal will compound into an unacceptable discrepancy in the final summary.\n\nLast page audited. Three ledgers, every figure verified. The numbers finally make sense.\n\nTurning chaotic figures into trustworthy data — this is your most precise form of quiet.`,

        nl: `Drie kasboeken. Eén rekenmachine. Je vingers.\n\nJe opent het eerste kasboek en begint bij regel één. Uitgavenbedrag, eenheidsprijs, hoeveelheid, subtotaal — je voert elk getal in op de rekenmachine en vergelijkt met het kasboek.\n\nDit werk heeft een ritme: lezen, invoeren, berekenen, vergelijken, markeren. Elke regel is een onafhankelijke verificatie — geen sluiproutes, niet overslaan.\n\nRegel zeven, je vindt de eerste fout: een lopend inkooptotaal wijkt 0,3% af. Je markeert het, corrigeert de gegevens, gaat verder.\n\nTweede kasboek. Derde. Je vingers bewegen vlotter over de rekenmachinetoetsen, maar je aandacht verslapt niet — want je weet dat elk over het hoofd gezien decimaal zich opstapelt tot een onacceptabele afwijking in de eindsamenvatting.\n\nLaatste pagina gecontroleerd. Drie kasboeken, elk cijfer geverifieerd. De getallen kloppen eindelijk.\n\nChaotische cijfers omzetten in betrouwbare data — dit is je meest precieze vorm van stilte.`,

        de: `Drei Kontobücher. Ein Taschenrechner. Deine Finger.\n\nDu öffnest das erste Kontobuch und beginnst bei Zeile eins. Ausgabenbetrag, Stückpreis, Menge, Zwischensumme — du gibst jede Zahl in den Taschenrechner ein und vergleichst mit dem Buch.\n\nDiese Arbeit hat einen Rhythmus: lesen, eingeben, berechnen, vergleichen, markieren. Jede Zeile ist eine eigenständige Prüfung — keine Abkürzungen, kein Überspringen.\n\nZeile sieben, du findest den ersten Fehler: eine laufende Beschaffungssumme weicht um 0,3% ab. Du markierst ihn, korrigierst die Daten, machst weiter.\n\nZweites Kontobuch. Drittes. Deine Finger gleiten flüssiger über die Tasten, aber deine Aufmerksamkeit lässt nie nach — denn du weißt, jede übersehene Nachkommastelle wird sich in der Endsumme zu einer unakzeptablen Abweichung aufschaukeln.\n\nLetzte Seite geprüft. Drei Kontobücher, jede Zahl verifiziert. Die Zahlen ergeben endlich Sinn.\n\nChaotische Zahlen in verlässliche Daten verwandeln — das ist deine präziseste Form der Stille.`,

        fr: `Trois registres. Une calculatrice. Tes doigts.\n\nTu ouvres le premier registre et commences à la première ligne. Montant des dépenses, coût unitaire, quantité, sous-total — tu saisis chaque chiffre dans la calculatrice et compares avec le registre.\n\nCe travail a un rythme : lire, saisir, calculer, comparer, marquer. Chaque ligne est une vérification indépendante — pas de raccourcis, pas d'omissions.\n\nLigne sept, tu trouves la première erreur : un total cumulé d'approvisionnement est décalé de 0,3%. Tu le signales, corriges les données, continues.\n\nDeuxième registre. Troisième. Tes doigts se déplacent plus fluidement sur les touches, mais ton attention ne faiblit jamais — car tu sais que chaque décimale négligée se cumulera en un écart inacceptable dans le résumé final.\n\nDernière page auditée. Trois registres, chaque chiffre vérifié. Les nombres font enfin sens.\n\nTransformer des chiffres chaotiques en données fiables — c'est ta forme de silence la plus précise.`,

        es: `Tres libros de contabilidad. Una calculadora. Tus dedos.\n\nAbres el primer libro y empiezas por la línea uno. Monto del gasto, costo unitario, cantidad, subtotal — introduces cada número en la calculadora y lo comparas con el libro.\n\nEste trabajo tiene un ritmo: leer, introducir, calcular, comparar, marcar. Cada línea es una verificación independiente — sin atajos, sin saltos.\n\nLínea siete, encuentras el primer error: un total acumulado de adquisiciones se desvía un 0,3%. Lo marcas, corriges los datos, continúas.\n\nSegundo libro. Tercero. Tus dedos se mueven con más fluidez sobre las teclas, pero tu atención nunca se relaja — porque sabes que cada decimal pasado por alto se acumulará en una discrepancia inaceptable en el resumen final.\n\nÚltima página auditada. Tres libros, cada cifra verificada. Los números finalmente tienen sentido.\n\nConvertir cifras caóticas en datos confiables — esta es tu forma más precisa de calma.`,

        pt: `Três livros contábeis. Uma calculadora. Seus dedos.\n\nVocê abre o primeiro livro e começa pela linha um. Valor da despesa, custo unitário, quantidade, subtotal — você digita cada número na calculadora e compara com o livro.\n\nEsse trabalho tem um ritmo: ler, digitar, calcular, comparar, marcar. Cada linha é uma verificação independente — sem atalhos, sem pular.\n\nLinha sete, você encontra o primeiro erro: um total acumulado de aquisição está desviado em 0,3%. Você sinaliza, corrige os dados, continua.\n\nSegundo livro. Terceiro. Seus dedos se movem com mais fluidez sobre as teclas, mas sua atenção nunca afrouxa — porque você sabe que cada decimal ignorado se acumulará em uma discrepância inaceitável no resumo final.\n\nÚltima página auditada. Três livros, cada cifra verificada. Os números finalmente fazem sentido.\n\nTransformar números caóticos em dados confiáveis — esta é sua forma mais precisa de silêncio.`,

        it: `Tre libri contabili. Una calcolatrice. Le tue dita.\n\nApri il primo libro e parti dalla riga uno. Importo della spesa, costo unitario, quantità, subtotale — digiti ogni numero nella calcolatrice e confronti con il registro.\n\nQuesto lavoro ha un ritmo: leggere, inserire, calcolare, confrontare, segnare. Ogni riga è una verifica indipendente — nessuna scorciatoia, niente da saltare.\n\nRiga sette, trovi il primo errore: un totale progressivo di approvvigionamento è sfasato dello 0,3%. Lo segnali, correggi i dati, continui.\n\nSecondo libro. Terzo. Le tue dita si muovono più fluide sui tasti, ma la tua attenzione non cala mai — perché sai che ogni decimale trascurato si accumulerà in una discrepanza inaccettabile nel riepilogo finale.\n\nUltima pagina verificata. Tre libri, ogni cifra controllata. I numeri finalmente tornano.\n\nTrasformare cifre caotiche in dati affidabili — questa è la tua forma più precisa di quiete.`,

        ru: `Три бухгалтерские книги. Один калькулятор. Твои пальцы.\n\nТы открываешь первую книгу и начинаешь с первой строки. Сумма расходов, цена за единицу, количество, промежуточный итог — вводишь каждое число в калькулятор и сверяешь с книгой.\n\nЭта работа имеет ритм: прочитать, ввести, посчитать, сравнить, отметить. Каждая строка — независимая проверка. Без сокращений, без пропусков.\n\nСтрока семь — первая ошибка: накопительный итог закупок отклоняется на 0,3%. Отмечаешь, исправляешь данные, продолжаешь.\n\nВторая книга. Третья. Пальцы движутся по клавишам всё увереннее, но внимание не ослабевает — потому что ты знаешь: каждый пропущенный знак после запятой в итоговой сводке обернётся неприемлемым расхождением.\n\nПоследняя страница проверена. Три книги, каждая цифра верифицирована. Числа наконец сходятся.\n\nПревращать хаотичные цифры в достоверные данные — это твоя самая точная форма тишины.`,

        ja: `3冊の帳簿。1台の計算機。あなたの指。\n\n最初の帳簿を開き、1行目から始める。支出金額、単価、数量、小計——一つずつ計算機に入力し、帳簿の数字と照合する。\n\nこの作業にはリズムがある：読む、入力する、計算する、照合する、マークする。各行が独立した検証——近道なし、飛ばしなし。\n\n7行目で最初のエラーを見つける：調達の累計が0.3%ずれている。マークし、データを修正し、続ける。\n\n2冊目。3冊目。計算機のキーの上で指はより滑らかに動くが、注意力は決して緩まない——見落とした小数点一つが最終集計で許容できない誤差に膨らむと分かっているから。\n\n最後のページの監査完了。3冊の帳簿、すべての数字が検証された。数字がついに辻褄が合った。\n\n混沌とした数字を信頼できるデータに変えること——これがあなたの最も精密な静けさだ。`,

        ko: `장부 세 권. 계산기 하나. 당신의 손가락.\n\n첫 번째 장부를 열고 1행부터 시작한다. 지출 금액, 단가, 수량, 소계 — 하나씩 계산기에 입력하고 장부의 숫자와 대조한다.\n\n이 작업에는 리듬이 있다: 읽기, 입력, 계산, 대조, 표시. 각 행은 독립적인 검증이다 — 지름길도, 건너뛰기도 없다.\n\n7행에서 첫 번째 오류를 발견한다: 조달 누계가 0.3% 어긋나 있다. 표시하고, 데이터를 수정하고, 계속한다.\n\n두 번째 장부. 세 번째. 계산기 키 위로 손가락이 점점 유창하게 움직이지만, 주의력은 결코 느슨해지지 않는다 — 간과한 소수점 하나가 최종 요약에서 용납할 수 없는 오차로 불어난다는 걸 알기 때문이다.\n\n마지막 페이지 감사 완료. 장부 세 권, 모든 수치가 검증되었다. 숫자가 마침내 들어맞는다.\n\n혼란스러운 숫자를 신뢰할 수 있는 데이터로 바꾸는 것 — 이것이 당신의 가장 정밀한 고요함이다.`,
      },
      score4: {
        zh: `三本账簿。一台计算器。你坐了下来。

你翻开第一本，从第一行开始核算。流程很清楚——读数、输入、计算、比对。你做得仔细，发现了两处小数点后的偏差，标记修正。

到第二本的时候，节奏已经建立起来了。不算兴奋，但你能感受到这种有条理的工作自有它的道理——每一行数字被验证过后，整个系统就多了一分可信度。

第三本。有一处累计总额和明细对不上，你回翻前面几页，找到了错误源头，修正了。

三本账簿全部核完。不是最有成就感的工作，但你做得完整。数字现在是对的。`,

        en: `Three ledgers. One calculator. You sit down.\n\nYou open the first and start from line one. The process is clear — read, enter, calculate, compare. You work carefully, finding two decimal discrepancies, flagging and correcting them.\n\nBy the second ledger, a rhythm has settled in. Not exactly exciting, but you can feel this methodical work has its own logic — every verified line adds a degree of trustworthiness to the whole system.\n\nThird ledger. One running total doesn't match the line items — you flip back a few pages, trace the error to its source, fix it.\n\nAll three ledgers audited. Not the most rewarding work, but you did it thoroughly. The numbers are right now.`,

        nl: `Drie kasboeken. Eén rekenmachine. Je gaat zitten.\n\nJe opent het eerste en begint bij regel één. Het proces is duidelijk — lezen, invoeren, berekenen, vergelijken. Je werkt zorgvuldig, vindt twee afwijkingen achter de komma, markeert en corrigeert ze.\n\nBij het tweede kasboek heeft zich een ritme gevestigd. Niet bepaald opwindend, maar je voelt dat dit methodische werk zijn eigen logica heeft — elke geverifieerde regel voegt een graad van betrouwbaarheid toe aan het hele systeem.\n\nDerde kasboek. Een lopend totaal klopt niet met de afzonderlijke posten — je bladert een paar pagina's terug, traceert de fout naar de bron, corrigeert het.\n\nAlle drie kasboeken gecontroleerd. Niet het meest bevredigende werk, maar je hebt het grondig gedaan. De getallen kloppen nu.`,

        de: `Drei Kontobücher. Ein Taschenrechner. Du setzt dich hin.\n\nDu öffnest das erste und beginnst bei Zeile eins. Der Prozess ist klar — lesen, eingeben, berechnen, vergleichen. Du arbeitest sorgfältig, findest zwei Abweichungen nach dem Komma, markierst und korrigierst sie.\n\nBeim zweiten Buch hat sich ein Rhythmus eingestellt. Nicht gerade aufregend, aber du spürst, dass diese methodische Arbeit ihre eigene Logik hat — jede verifizierte Zeile fügt dem Gesamtsystem ein Stück Vertrauenswürdigkeit hinzu.\n\nDrittes Buch. Eine laufende Summe stimmt nicht mit den Einzelposten überein — du blätterst ein paar Seiten zurück, verfolgst den Fehler bis zu seiner Quelle, behebst ihn.\n\nAlle drei Kontobücher geprüft. Nicht die befriedigendste Arbeit, aber du hast sie gründlich erledigt. Die Zahlen stimmen jetzt.`,

        fr: `Trois registres. Une calculatrice. Tu t'assieds.\n\nTu ouvres le premier et commences à la ligne un. Le processus est clair — lire, saisir, calculer, comparer. Tu travailles avec soin, trouves deux écarts après la virgule, les signales et les corriges.\n\nAu deuxième registre, un rythme s'est installé. Pas vraiment excitant, mais tu sens que ce travail méthodique a sa propre logique — chaque ligne vérifiée ajoute un degré de fiabilité à l'ensemble du système.\n\nTroisième registre. Un total cumulé ne correspond pas aux lignes détaillées — tu reviens quelques pages en arrière, remontes à la source de l'erreur, la corriges.\n\nLes trois registres sont vérifiés. Pas le travail le plus gratifiant, mais tu l'as fait consciencieusement. Les chiffres sont justes maintenant.`,

        es: `Tres libros de contabilidad. Una calculadora. Te sientas.\n\nAbres el primero y empiezas por la línea uno. El proceso es claro — leer, introducir, calcular, comparar. Trabajas con cuidado, encontrando dos discrepancias decimales, marcándolas y corrigiéndolas.\n\nPara el segundo libro, se ha establecido un ritmo. No es exactamente emocionante, pero puedes sentir que este trabajo metódico tiene su propia lógica — cada línea verificada añade un grado de confiabilidad al sistema completo.\n\nTercer libro. Un total acumulado no coincide con las partidas — retrocedes unas páginas, rastreas el error hasta su origen, lo corriges.\n\nLos tres libros auditados. No el trabajo más gratificante, pero lo hiciste a fondo. Los números ahora están bien.`,

        pt: `Três livros contábeis. Uma calculadora. Você se senta.\n\nVocê abre o primeiro e começa pela linha um. O processo é claro — ler, digitar, calcular, comparar. Você trabalha com cuidado, encontrando duas discrepâncias decimais, sinalizando e corrigindo.\n\nNo segundo livro, um ritmo se estabeleceu. Não é exatamente empolgante, mas você sente que esse trabalho metódico tem sua própria lógica — cada linha verificada acrescenta um grau de confiabilidade ao sistema inteiro.\n\nTerceiro livro. Um total acumulado não bate com os itens — você volta algumas páginas, rastreia o erro até sua origem, corrige.\n\nTrês livros auditados. Não o trabalho mais gratificante, mas você o fez por completo. Os números agora estão certos.`,

        it: `Tre libri contabili. Una calcolatrice. Ti siedi.\n\nApri il primo e parti dalla riga uno. Il processo è chiaro — leggere, inserire, calcolare, confrontare. Lavori con cura, trovi due discrepanze nei decimali, le segnali e le correggi.\n\nAl secondo libro, si è stabilito un ritmo. Non esattamente entusiasmante, ma senti che questo lavoro metodico ha la sua logica — ogni riga verificata aggiunge un grado di affidabilità all'intero sistema.\n\nTerzo libro. Un totale progressivo non corrisponde alle singole voci — torni indietro di qualche pagina, risali alla fonte dell'errore, lo correggi.\n\nTutti e tre i libri verificati. Non il lavoro più gratificante, ma l'hai fatto a fondo. I numeri ora tornano.`,

        ru: `Три бухгалтерские книги. Один калькулятор. Ты садишься.\n\nОткрываешь первую и начинаешь с первой строки. Процесс понятен — прочитать, ввести, посчитать, сравнить. Работаешь аккуратно, находишь два расхождения после запятой, отмечаешь и исправляешь.\n\nКо второй книге выработался ритм. Не то чтобы увлекательно, но ты чувствуешь — у этой методичной работы есть своя логика. Каждая проверенная строка добавляет системе толику достоверности.\n\nТретья книга. Один накопительный итог не сходится с детализацией — листаешь назад на несколько страниц, находишь источник ошибки, исправляешь.\n\nВсе три книги проверены. Не самая вдохновляющая работа, но ты сделал её полностью. Цифры теперь верны.`,

        ja: `3冊の帳簿。1台の計算機。あなたは座る。\n\n1冊目を開き、1行目から始める。プロセスは明確だ——読む、入力する、計算する、照合する。丁寧に作業し、小数点以下の誤差を2箇所見つけ、マークして修正する。\n\n2冊目に入る頃にはリズムができている。特に興奮するわけではないが、この几帳面な作業には独自の道理があると感じられる——検証された1行ごとに、システム全体の信頼性が少し増す。\n\n3冊目。累計が明細と合わない箇所がある——数ページ遡り、エラーの源を突き止め、修正する。\n\n3冊すべて監査完了。最もやりがいのある作業ではないが、きちんとやり遂げた。数字は今、正しい。`,

        ko: `장부 세 권. 계산기 하나. 자리에 앉는다.\n\n첫 번째를 열고 1행부터 시작한다. 과정은 명확하다 — 읽기, 입력, 계산, 대조. 꼼꼼하게 작업하며 소수점 이하 오차 두 곳을 찾아 표시하고 수정한다.\n\n두 번째 장부에 이르자 리듬이 잡혔다. 딱히 흥미진진하지는 않지만, 이 체계적인 작업에는 그 나름의 논리가 있다는 걸 느낀다 — 검증된 한 줄 한 줄이 시스템 전체의 신뢰도를 높인다.\n\n세 번째 장부. 누계가 세부 항목과 맞지 않는 곳이 있다 — 몇 페이지 뒤로 넘겨 오류의 원천을 추적하고 수정한다.\n\n장부 세 권 모두 감사 완료. 가장 보람 있는 작업은 아니었지만, 빈틈없이 해냈다. 숫자가 이제 맞는다.`,
      },
      score3: {
        zh: `三本账簿。密密麻麻的数字。一台计算器。

你看了看那些数字，评估了一下工作量。不算小——每一行都要用计算器重新核算，还要和账簿上的原始数据比对。

你开始了第一本。流程是清楚的，但这种逐行核算的重复让你有点走神。到第二本的时候，你揉了揉眼睛。

你在做，但速度不快，因为数字看久了开始变得模糊。`,

        en: `Three ledgers. Dense rows of figures. A calculator.\n\nYou look at the numbers and estimate the workload. Not small — every line needs recalculation on the calculator and comparison against the original ledger data.\n\nYou start on the first. The process is clear, but the line-by-line repetition makes your mind drift. By the second ledger, you rub your eyes.\n\nYou're doing it, but not fast — the numbers start blurring after a while.`,

        nl: `Drie kasboeken. Dichtbedrukte rijen cijfers. Een rekenmachine.\n\nJe kijkt naar de getallen en schat de werklast in. Niet klein — elke regel moet herberekend worden op de rekenmachine en vergeleken met de originele gegevens.\n\nJe begint aan het eerste. Het proces is duidelijk, maar de regel-voor-regel herhaling laat je gedachten afdwalen. Bij het tweede kasboek wrijf je in je ogen.\n\nJe doet het, maar niet snel — de cijfers beginnen na een tijdje te vervagen.`,

        de: `Drei Kontobücher. Dicht gepackte Zahlenreihen. Ein Taschenrechner.\n\nDu schaust dir die Zahlen an und schätzt den Aufwand. Nicht gering — jede Zeile muss mit dem Taschenrechner nachgerechnet und mit den Originaldaten verglichen werden.\n\nDu beginnst mit dem ersten. Der Prozess ist klar, aber die zeilenweise Wiederholung lässt deine Gedanken abschweifen. Beim zweiten Buch reibst du dir die Augen.\n\nDu machst es, aber nicht schnell — die Zahlen verschwimmen nach einer Weile.`,

        fr: `Trois registres. Des rangées denses de chiffres. Une calculatrice.\n\nTu regardes les nombres et estimes la charge de travail. Pas négligeable — chaque ligne doit être recalculée à la calculatrice et comparée aux données originales.\n\nTu commences par le premier. Le processus est clair, mais la répétition ligne par ligne fait divaguer ton esprit. Au deuxième registre, tu te frottes les yeux.\n\nTu le fais, mais pas vite — les chiffres commencent à devenir flous au bout d'un moment.`,

        es: `Tres libros de contabilidad. Filas densas de cifras. Una calculadora.\n\nMiras los números y estimas la carga de trabajo. No es pequeña — cada línea necesita recálculo en la calculadora y comparación con los datos originales.\n\nEmpiezas con el primero. El proceso es claro, pero la repetición línea por línea hace que tu mente divague. Para el segundo libro, te frotas los ojos.\n\nLo estás haciendo, pero no rápido — los números empiezan a difuminarse después de un rato.`,

        pt: `Três livros contábeis. Fileiras densas de números. Uma calculadora.\n\nVocê olha os números e estima a carga de trabalho. Não é pequena — cada linha precisa ser recalculada na calculadora e comparada com os dados originais.\n\nVocê começa pelo primeiro. O processo é claro, mas a repetição linha por linha faz sua mente divagar. No segundo livro, você esfrega os olhos.\n\nVocê está fazendo, mas não rápido — os números começam a embaçar depois de um tempo.`,

        it: `Tre libri contabili. Righe fitte di cifre. Una calcolatrice.\n\nGuardi i numeri e stimi il carico di lavoro. Non piccolo — ogni riga deve essere ricalcolata con la calcolatrice e confrontata con i dati originali.\n\nCominci dal primo. Il processo è chiaro, ma la ripetizione riga per riga fa vagare la mente. Al secondo libro, ti strofini gli occhi.\n\nLo stai facendo, ma non velocemente — i numeri iniziano a confondersi dopo un po'.`,

        ru: `Три бухгалтерские книги. Плотные ряды цифр. Калькулятор.\n\nТы смотришь на числа и оцениваешь объём работы. Немалый — каждую строку нужно пересчитать на калькуляторе и сверить с исходными данными.\n\nНачинаешь с первой. Процесс понятен, но построчное повторение заставляет мысли блуждать. Ко второй книге потираешь глаза.\n\nТы делаешь, но не быстро — цифры начинают расплываться через какое-то время.`,

        ja: `3冊の帳簿。びっしり並んだ数字。計算機。\n\n数字を見て作業量を見積もる。少なくない——各行を計算機で再計算し、原本のデータと照合する必要がある。\n\n1冊目を始める。プロセスは明確だが、一行ずつの繰り返しが思考を散漫にさせる。2冊目で目をこする。\n\nやっている。だが速くはない——数字がしばらくすると滲んで見え始める。`,

        ko: `장부 세 권. 빼곡한 숫자 행렬. 계산기.\n\n숫자를 보며 작업량을 가늠한다. 적지 않다 — 각 행을 계산기로 재계산하고 원본 데이터와 대조해야 한다.\n\n첫 번째를 시작한다. 과정은 명확하지만 행별 반복이 마음을 흐트러뜨린다. 두 번째 장부에서 눈을 비빈다.\n\n하고는 있지만, 빠르지 않다 — 숫자가 한참 후 흐릿해지기 시작한다.`,
      },
      score2: {
        zh: `三本账簿，逐行核算。

你看了看那些密密麻麻的数字——每一行都要用计算器重新算一遍，还要和原始数据比对。这种工作需要的是对数字的持续耐心。

你核完了第一本的前几页，感觉已经够了。后面还有两本半的工作量，每一页都是同样的流程。

你放下计算器，休息了一会儿。也许后面的任务更适合你。`,

        en: `Three ledgers. Audit line by line.\n\nYou look at the dense rows of figures — every line needs recalculation on the calculator and comparison against the original data. This kind of work demands sustained patience with numbers.\n\nYou finish the first few pages of the first ledger and feel that's enough. Two and a half more ledgers of the same process still wait.\n\nYou set the calculator down and rest a moment. Maybe the next task suits you better.`,

        nl: `Drie kasboeken. Regel voor regel controleren.\n\nJe kijkt naar de dichtbedrukte rijen cijfers — elke regel moet herberekend worden op de rekenmachine en vergeleken met de originele gegevens. Dit soort werk vereist volgehouden geduld met cijfers.\n\nJe maakt de eerste paar pagina's van het eerste kasboek af en voelt dat het genoeg is. Nog tweeënhalf kasboek met hetzelfde proces wacht.\n\nJe legt de rekenmachine neer en rust even. Misschien past de volgende taak beter bij je.`,

        de: `Drei Kontobücher. Zeile für Zeile prüfen.\n\nDu schaust dir die dichten Zahlenreihen an — jede Zeile muss auf dem Taschenrechner nachgerechnet und mit den Originaldaten verglichen werden. Diese Art Arbeit erfordert andauernde Geduld mit Zahlen.\n\nDu schließt die ersten paar Seiten des ersten Buches ab und fühlst, dass es reicht. Noch zweieinhalb Bücher mit demselben Prozess warten.\n\nDu legst den Taschenrechner hin und ruhst einen Moment. Vielleicht passt die nächste Aufgabe besser zu dir.`,

        fr: `Trois registres. Vérifier ligne par ligne.\n\nTu regardes les rangées denses de chiffres — chaque ligne doit être recalculée à la calculatrice et comparée aux données originales. Ce genre de travail exige une patience soutenue avec les nombres.\n\nTu termines les premières pages du premier registre et tu sens que c'est suffisant. Encore deux registres et demi du même processus attendent.\n\nTu poses la calculatrice et te reposes un instant. Peut-être que la prochaine tâche te conviendra mieux.`,

        es: `Tres libros de contabilidad. Auditar línea por línea.\n\nMiras las densas filas de cifras — cada línea necesita recálculo en la calculadora y comparación con los datos originales. Este tipo de trabajo requiere paciencia sostenida con los números.\n\nTerminas las primeras páginas del primer libro y sientes que es suficiente. Dos libros y medio más del mismo proceso todavía esperan.\n\nDejas la calculadora y descansas un momento. Quizás la siguiente tarea te convenga más.`,

        pt: `Três livros contábeis. Auditar linha por linha.\n\nVocê olha as fileiras densas de números — cada linha precisa ser recalculada na calculadora e comparada com os dados originais. Esse tipo de trabalho exige paciência sustentada com números.\n\nVocê termina as primeiras páginas do primeiro livro e sente que é suficiente. Mais dois livros e meio do mesmo processo ainda esperam.\n\nVocê coloca a calculadora de lado e descansa um momento. Talvez a próxima tarefa se encaixe melhor.`,

        it: `Tre libri contabili. Verificare riga per riga.\n\nGuardi le righe fitte di cifre — ogni riga deve essere ricalcolata con la calcolatrice e confrontata con i dati originali. Questo tipo di lavoro richiede pazienza sostenuta con i numeri.\n\nFinisci le prime pagine del primo libro e senti che basta. Altri due libri e mezzo dello stesso processo attendono.\n\nPosi la calcolatrice e riposi un momento. Forse il prossimo compito è più adatto a te.`,

        ru: `Три бухгалтерские книги. Проверять строка за строкой.\n\nТы смотришь на плотные ряды цифр — каждую строку нужно пересчитать на калькуляторе и сверить с исходными данными. Такая работа требует устойчивого терпения к числам.\n\nТы заканчиваешь первые несколько страниц первой книги и чувствуешь — достаточно. Ещё две с половиной книги того же процесса впереди.\n\nТы откладываешь калькулятор и отдыхаешь минуту. Может, следующая задача подойдёт лучше.`,

        ja: `3冊の帳簿。一行ずつ監査。\n\nびっしり並んだ数字を見る——各行を計算機で再計算し、原本のデータと照合する必要がある。この種の作業には数字に対する持続的な忍耐が求められる。\n\n1冊目の最初の数ページを終え、もう十分だと感じる。残り2冊半、同じプロセスが待っている。\n\n計算機を置いて、しばし休む。次のタスクの方が合っているかもしれない。`,

        ko: `장부 세 권. 한 줄씩 감사.\n\n빼곡한 숫자 행렬을 본다 — 각 행을 계산기로 재계산하고 원본 데이터와 대조해야 한다. 이런 종류의 작업은 숫자에 대한 지속적인 인내가 필요하다.\n\n첫 번째 장부의 처음 몇 페이지를 마치고 그것으로 충분하다고 느낀다. 같은 과정의 장부가 두 권 반 더 남아 있다.\n\n계산기를 내려놓고 잠시 쉰다. 다음 과제가 더 맞을지도 모른다.`,
      },
      score1: {
        zh: `核算。逐行。比对。修正。验证。

每一个词都在告诉你同一件事：这是一个需要耐心和精确的数字工作。而你对数字工作的兴趣是零。

你看了那些密密麻麻的账簿一眼，合上了。三本账簿在等着，但你在等下一个步骤。`,

        en: `Audit. Line by line. Compare. Correct. Verify.\n\nEvery word tells you the same thing: this is a patient, precise, numerical job. And your interest in number work is zero.\n\nYou glance at the dense ledgers and close them. Three ledgers are waiting, but you're waiting for the next step.`,

        nl: `Controleren. Regel voor regel. Vergelijken. Corrigeren. Verifiëren.\n\nElk woord vertelt je hetzelfde: dit is een geduldig, precies, numeriek karwei. En jouw interesse in cijferwerk is nul.\n\nJe werpt een blik op de dichtbedrukte kasboeken en sluit ze. Drie kasboeken wachten, maar jij wacht op de volgende stap.`,

        de: `Prüfen. Zeile für Zeile. Vergleichen. Korrigieren. Verifizieren.\n\nJedes Wort sagt dir dasselbe: Das ist eine geduldige, präzise Zahlenarbeit. Und dein Interesse an Zahlenarbeit ist null.\n\nDu wirfst einen Blick auf die dicht beschriebenen Kontobücher und schließt sie. Drei Bücher warten, aber du wartest auf den nächsten Schritt.`,

        fr: `Vérifier. Ligne par ligne. Comparer. Corriger. Valider.\n\nChaque mot te dit la même chose : c'est un travail patient, précis, numérique. Et ton intérêt pour le travail de chiffres est de zéro.\n\nTu jettes un œil aux registres denses et les refermes. Trois registres attendent, mais toi tu attends la prochaine étape.`,

        es: `Auditar. Línea por línea. Comparar. Corregir. Verificar.\n\nCada palabra te dice lo mismo: este es un trabajo paciente, preciso y numérico. Y tu interés en el trabajo con números es cero.\n\nEchas un vistazo a los densos libros de contabilidad y los cierras. Tres libros esperan, pero tú esperas el siguiente paso.`,

        pt: `Auditar. Linha por linha. Comparar. Corrigir. Verificar.\n\nCada palavra diz a mesma coisa: este é um trabalho paciente, preciso e numérico. E seu interesse em trabalho com números é zero.\n\nVocê dá uma olhada nos livros contábeis densos e os fecha. Três livros esperam, mas você espera pelo próximo passo.`,

        it: `Verificare. Riga per riga. Confrontare. Correggere. Validare.\n\nOgni parola ti dice la stessa cosa: questo è un lavoro paziente, preciso, numerico. E il tuo interesse per il lavoro con i numeri è zero.\n\nDai un'occhiata ai fitti libri contabili e li chiudi. Tre libri aspettano, ma tu aspetti il prossimo passo.`,

        ru: `Проверять. Строка за строкой. Сравнивать. Исправлять. Подтверждать.\n\nКаждое слово говорит тебе одно и то же: это терпеливая, точная, числовая работа. А твой интерес к работе с числами — ноль.\n\nТы бросаешь взгляд на исписанные книги и закрываешь их. Три книги ждут, но ты ждёшь следующего шага.`,

        ja: `監査。一行ずつ。照合。修正。検証。\n\nすべての言葉が同じことを告げている：これは忍耐と正確さを要する数字の作業だ。そして数字の作業への興味はゼロだ。\n\nびっしり書かれた帳簿をちらりと見て閉じる。3冊の帳簿が待っているが、あなたは次のステップを待っている。`,

        ko: `감사. 한 줄씩. 대조. 수정. 검증.\n\n모든 단어가 같은 말을 하고 있다: 이것은 인내심 있고, 정밀한 숫자 작업이다. 그리고 숫자 작업에 대한 당신의 관심은 제로다.\n\n빼곡한 장부를 한번 보고 닫는다. 장부 세 권이 기다리고 있지만, 당신은 다음 단계를 기다리고 있다.`,
      },
    },
  },

  {
    id: 28,
    riasec: "C",
    miniIpCode: "C3",
    miniIpItem: "Keep shipping and receiving records",
    chapter: "archive",
    chapterIndex: 6,
    questionInChapter: 3,
    isClimax: false,
    scene: {
      zh: `数字核算全部完成。三本账簿的每一笔数据都已被验证和修正。

但当你打开系统的收发日志时，发现了问题：这个档案室曾有过大量档案进出——新档案存入，旧档案调取——但收发记录簿上有好几段时间的记录是空白的。

档案在，但没有记录谁存入的、什么时候存入的、被谁调取过、什么时候归还的。

屏幕提示：
「系统恢复步骤三：收发记录完整性。核对实物档案与收发记录，补全缺失条目，确保每一份档案的流转历史完整可追溯。」

收发记录簿在桌上，档案在架子上，日期戳在抽屉里。需要你逐一比对、推断缺失的时间线、补录信息。`,

      en: `The financial audit is complete. Every figure across all three ledgers has been verified and corrected.\n\nBut when you open the system's transfer log, you find a problem: this archive room once had heavy file traffic — new files deposited, old ones retrieved — but the ledger has several time periods left completely blank.\n\nFiles exist, but there's no record of who deposited them, when, who retrieved them, or when they were returned.\n\nThe screen prompts:\n"System Restoration Step Three: Transfer Record Integrity. Cross-reference physical files with the transfer ledger, fill in missing entries, ensure every file's circulation history is complete and traceable."\n\nThe ledger is on the desk, files on the shelves, date stamps in the drawer. You need to compare one by one, reconstruct missing timelines, fill in the gaps.`,

      nl: `De financiële controle is voltooid. Elk cijfer in alle drie de kasboeken is geverifieerd en gecorrigeerd.\n\nMaar wanneer je het overdrachtslogboek van het systeem opent, ontdek je een probleem: deze archiefkamer had ooit druk dossierverkeer — nieuwe dossiers gestort, oude opgehaald — maar het overdrachtsregister heeft meerdere periodes die volledig blanco zijn.\n\nDossiers bestaan, maar er is geen registratie van wie ze deponeerde, wanneer, wie ze ophaalde, of wanneer ze werden teruggebracht.\n\nHet scherm meldt:\n"Systeemherstel Stap Drie: Integriteit van Overdrachtsregistratie. Vergelijk fysieke dossiers met het overdrachtsregister, vul ontbrekende gegevens aan, zorg ervoor dat de circulatiegeschiedenis van elk dossier compleet en traceerbaar is."\n\nHet register ligt op het bureau, dossiers staan op de planken, datumstempels liggen in de la. Je moet één voor één vergelijken, ontbrekende tijdlijnen reconstrueren en de gaten opvullen.`,

      de: `Die Finanzprüfung ist abgeschlossen. Jede Zahl in allen drei Kontobüchern wurde verifiziert und korrigiert.\n\nAber als du das Übergabeprotokoll des Systems öffnest, findest du ein Problem: Dieser Archivraum hatte einst regen Aktenverkehr — neue Akten eingelagert, alte abgerufen — aber das Übergaberegister hat mehrere Zeiträume, die vollständig leer sind.\n\nAkten existieren, aber es gibt keine Aufzeichnung darüber, wer sie hinterlegte, wann, wer sie abrief oder wann sie zurückgebracht wurden.\n\nDer Bildschirm zeigt an:\n„Systemwiederherstellung Schritt Drei: Integrität der Übergabeaufzeichnungen. Gleichen Sie physische Akten mit dem Übergaberegister ab, füllen Sie fehlende Einträge auf, stellen Sie sicher, dass die Umlaufgeschichte jeder Akte vollständig und nachvollziehbar ist."\n\nDas Register liegt auf dem Schreibtisch, Akten stehen in den Regalen, Datumsstempel liegen in der Schublade. Du musst einzeln vergleichen, fehlende Zeitlinien rekonstruieren und die Lücken füllen.`,

      fr: `L'audit financier est terminé. Chaque chiffre des trois registres a été vérifié et corrigé.\n\nMais quand tu ouvres le journal des transferts du système, tu découvres un problème : cette salle d'archives connaissait autrefois un trafic intense — nouveaux dossiers déposés, anciens récupérés — mais le registre des transferts comporte plusieurs périodes entièrement vides.\n\nLes dossiers existent, mais il n'y a aucune trace de qui les a déposés, quand, qui les a récupérés, ni quand ils ont été rendus.\n\nL'écran indique :\n« Restauration du Système, Étape Trois : Intégrité des Registres de Transfert. Croisez les dossiers physiques avec le registre des transferts, complétez les entrées manquantes, assurez-vous que l'historique de circulation de chaque dossier est complet et traçable. »\n\nLe registre est sur le bureau, les dossiers sur les étagères, les tampons de date dans le tiroir. Tu dois comparer un par un, reconstituer les chronologies manquantes et combler les lacunes.`,

      es: `La auditoría financiera está completa. Cada cifra en los tres libros de contabilidad ha sido verificada y corregida.\n\nPero cuando abres el registro de transferencias del sistema, encuentras un problema: esta sala de archivos alguna vez tuvo mucho tráfico — archivos nuevos depositados, antiguos recuperados — pero el libro de transferencias tiene varios períodos completamente en blanco.\n\nLos archivos existen, pero no hay registro de quién los depositó, cuándo, quién los recuperó ni cuándo fueron devueltos.\n\nLa pantalla indica:\n"Restauración del Sistema, Paso Tres: Integridad de los Registros de Transferencia. Cruza los archivos físicos con el libro de transferencias, completa las entradas faltantes, asegura que el historial de circulación de cada archivo sea completo y rastreable."\n\nEl libro está en el escritorio, los archivos en los estantes, los sellos de fecha en el cajón. Necesitas comparar uno por uno, reconstruir líneas de tiempo faltantes y llenar los vacíos.`,

      pt: `A auditoria financeira está completa. Cada número nos três livros contábeis foi verificado e corrigido.\n\nMas quando você abre o registro de transferências do sistema, encontra um problema: esta sala de arquivos teve um tráfego intenso — novos dossiês depositados, antigos recuperados — mas o livro de transferências tem vários períodos completamente em branco.\n\nOs dossiês existem, mas não há registro de quem os depositou, quando, quem os recuperou ou quando foram devolvidos.\n\nA tela indica:\n"Restauração do Sistema, Passo Três: Integridade dos Registros de Transferência. Cruze os dossiês físicos com o livro de transferências, preencha as entradas ausentes, garanta que o histórico de circulação de cada dossiê seja completo e rastreável."\n\nO livro está na mesa, os dossiês nas prateleiras, os carimbos de data na gaveta. Você precisa comparar um por um, reconstruir linhas do tempo ausentes e preencher as lacunas.`,

      it: `La verifica finanziaria è completata. Ogni cifra nei tre libri contabili è stata verificata e corretta.\n\nMa quando apri il registro dei trasferimenti del sistema, trovi un problema: questa sala archivi aveva un tempo un intenso traffico di fascicoli — nuovi depositati, vecchi prelevati — ma il registro dei trasferimenti ha diversi periodi completamente vuoti.\n\nI fascicoli esistono, ma non c'è traccia di chi li ha depositati, quando, chi li ha prelevati, o quando sono stati restituiti.\n\nLo schermo indica:\n"Ripristino del Sistema, Fase Tre: Integrità dei Registri di Trasferimento. Incrocia i fascicoli fisici con il registro dei trasferimenti, completa le voci mancanti, assicurati che la storia di circolazione di ogni fascicolo sia completa e tracciabile."\n\nIl registro è sulla scrivania, i fascicoli sugli scaffali, i timbri con la data nel cassetto. Devi confrontare uno per uno, ricostruire le cronologie mancanti e colmare le lacune.`,

      ru: `Финансовая проверка завершена. Каждая цифра во всех трёх бухгалтерских книгах проверена и исправлена.\n\nНо когда ты открываешь журнал передач системы, обнаруживаешь проблему: в этой архивной комнате когда-то был активный оборот дел — новые поступали, старые извлекались — но в журнале передач несколько временных периодов остались полностью пустыми.\n\nДела существуют, но нет записей о том, кто их сдал, когда, кто забирал, или когда они были возвращены.\n\nНа экране:\n«Восстановление системы, Шаг третий: Целостность записей о передачах. Сверьте физические дела с журналом передач, заполните недостающие записи, убедитесь, что история обращения каждого дела полна и прослеживаема.»\n\nЖурнал на столе, дела на полках, штампы с датами в ящике. Нужно сверять по одному, восстанавливать недостающие хронологии и заполнять пробелы.`,

      ja: `財務監査が完了した。3冊の帳簿のすべての数字が検証・修正された。\n\nしかしシステムの転送ログを開くと、問題が見つかる：このアーカイブ室ではかつて大量のファイルが行き来していた——新しいファイルの保管、古いファイルの取り出し——だが転送台帳にはいくつかの期間がまったくの空白のままだ。\n\nファイルは存在するが、誰が保管したのか、いつ、誰が取り出したのか、いつ返却されたのかの記録がない。\n\nスクリーンの指示：\n「システム復旧ステップ3：転送記録の完全性。物理ファイルと転送台帳を照合し、欠落した項目を補完し、すべてのファイルの流通履歴が完全で追跡可能であることを確認せよ。」\n\n台帳はデスクの上、ファイルは棚の上、日付スタンプは引き出しの中。一つずつ照合し、欠落した時系列を再構築し、空白を埋める必要がある。`,

      ko: `재무 감사가 완료되었다. 장부 세 권의 모든 수치가 검증되고 수정되었다.\n\n하지만 시스템의 이관 로그를 열었을 때 문제를 발견한다: 이 기록보관실은 한때 서류 이동이 빈번했다 — 새 서류의 보관, 오래된 서류의 인출 — 그러나 이관 대장에는 몇몇 기간이 완전히 공백으로 남아 있다.\n\n서류는 존재하지만, 누가 보관했는지, 언제, 누가 인출했는지, 언제 반납했는지에 대한 기록이 없다.\n\n화면 안내:\n"시스템 복구 3단계: 이관 기록 무결성. 실물 서류와 이관 대장을 대조하고, 누락된 항목을 보충하며, 모든 서류의 유통 이력이 완전하고 추적 가능하도록 하라."\n\n대장은 책상 위에, 서류는 선반 위에, 날짜 도장은 서랍 안에 있다. 하나씩 대조하고, 누락된 타임라인을 재구성하고, 빈칸을 채워야 한다.`,
    },
    taskDescription: {
      zh: "核对并维护档案的收发记录——比对实物与记录，补全缺失条目，确保所有档案的进出历史完整准确。",

      en: `Audit and maintain the archive transfer records — cross-reference physical files with the ledger, fill in missing entries, ensure all circulation history is complete and accurate.`,

      nl: `Controleer en onderhoud de overdrachtsregistratie van het archief — vergelijk fysieke dossiers met het register, vul ontbrekende gegevens aan, zorg ervoor dat alle circulatiegeschiedenis compleet en accuraat is.`,

      de: `Prüfen und pflegen Sie die Übergabeaufzeichnungen des Archivs — gleichen Sie physische Akten mit dem Register ab, füllen Sie fehlende Einträge auf, stellen Sie sicher, dass die gesamte Umlaufgeschichte vollständig und korrekt ist.`,

      fr: `Vérifiez et maintenez les registres de transfert des archives — croisez les dossiers physiques avec le registre, complétez les entrées manquantes, assurez-vous que tout l'historique de circulation est complet et exact.`,

      es: `Audita y mantén los registros de transferencia del archivo — cruza los archivos físicos con el libro, completa las entradas faltantes, asegura que todo el historial de circulación sea completo y preciso.`,

      pt: `Audite e mantenha os registros de transferência do arquivo — cruze os dossiês físicos com o livro, preencha as entradas ausentes, garanta que todo o histórico de circulação esteja completo e preciso.`,

      it: `Verifica e mantieni i registri di trasferimento dell'archivio — incrocia i fascicoli fisici con il registro, completa le voci mancanti, assicurati che tutta la storia di circolazione sia completa e accurata.`,

      ru: `Проверьте и ведите записи о передачах архива — сверьте физические дела с журналом, заполните недостающие записи, убедитесь, что вся история обращения полна и точна.`,

      ja: `アーカイブの転送記録を監査し維持せよ——物理ファイルと台帳を照合し、欠落した項目を補完し、すべての流通履歴が完全で正確であることを確認する。`,

      ko: `기록 이관 대장을 감사하고 유지하라 — 실물 서류와 대장을 대조하고, 누락된 항목을 보충하며, 모든 유통 이력이 완전하고 정확하도록 하라.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你打开了收发记录簿，开始逐页核对。

这种工作需要的不只是耐心——还需要推理能力。有些缺失的条目可以从相邻的记录中推断出来：如果这份档案在3月15日被调取了，但归还记录是空的，而3月22日另一条记录引用了同一份档案——那它至少在22日之前已经回来了。

你一条一条地核对。每补全一个缺失的条目，记录簿就完整了一点。时间线从断裂变成连续。

这是一种安静的成就感——没有人会看见你做了什么，但系统因为你变得可信了。`,

        en: `You open the transfer ledger and begin cross-referencing page by page.\n\nThis work demands more than patience — it demands reasoning. Some missing entries can be inferred from adjacent records: if this file was retrieved on March 15 but has no return record, and another entry on March 22 references the same file — then it was back by at least the 22nd.\n\nYou verify entry by entry. Each gap filled makes the ledger more complete. The timeline shifts from fractured to continuous.\n\nA quiet sense of achievement — no one will see what you've done, but the system is trustworthy because of you.`,

        nl: `Je opent het overdrachtsregister en begint pagina voor pagina te vergelijken.\n\nDit werk vereist meer dan geduld — het vereist redeneervermogen. Sommige ontbrekende gegevens kunnen worden afgeleid uit aangrenzende records: als dit dossier op 15 maart werd opgehaald maar geen retourregistratie heeft, en een andere vermelding op 22 maart naar hetzelfde dossier verwijst — dan was het minstens op de 22e terug.\n\nJe verifieert regel voor regel. Elke opgevulde leemte maakt het register completer. De tijdlijn verschuift van gebroken naar doorlopend.\n\nEen stil gevoel van voldoening — niemand zal zien wat je hebt gedaan, maar het systeem is betrouwbaar dankzij jou.`,

        de: `Du öffnest das Übergaberegister und beginnst Seite für Seite abzugleichen.\n\nDiese Arbeit erfordert mehr als Geduld — sie erfordert Schlussfolgerungen. Einige fehlende Einträge lassen sich aus benachbarten Aufzeichnungen ableiten: Wenn diese Akte am 15. März abgerufen wurde, aber keine Rückgabeaufzeichnung hat, und ein anderer Eintrag am 22. März dieselbe Akte referenziert — dann war sie spätestens am 22. zurück.\n\nDu überprüfst Eintrag für Eintrag. Jede gefüllte Lücke macht das Register vollständiger. Die Zeitleiste wandelt sich von zerklüftet zu durchgängig.\n\nEin stilles Erfolgserlebnis — niemand wird sehen, was du getan hast, aber das System ist vertrauenswürdig deinetwegen.`,

        fr: `Tu ouvres le registre des transferts et commences à croiser les informations page par page.\n\nCe travail exige plus que de la patience — il exige du raisonnement. Certaines entrées manquantes peuvent être déduites des enregistrements adjacents : si ce dossier a été récupéré le 15 mars mais n'a pas de registre de retour, et qu'une autre entrée du 22 mars fait référence au même dossier — alors il était de retour au plus tard le 22.\n\nTu vérifies entrée par entrée. Chaque lacune comblée rend le registre plus complet. La chronologie passe de fracturée à continue.\n\nUn sentiment d'accomplissement discret — personne ne verra ce que tu as fait, mais le système est fiable grâce à toi.`,

        es: `Abres el libro de transferencias y empiezas a cruzar información página por página.\n\nEste trabajo exige más que paciencia — exige razonamiento. Algunas entradas faltantes pueden inferirse de registros adyacentes: si este archivo fue recuperado el 15 de marzo pero no tiene registro de devolución, y otra entrada del 22 de marzo referencia el mismo archivo — entonces estaba de vuelta al menos el 22.\n\nVerificas entrada por entrada. Cada vacío llenado hace el libro más completo. La línea de tiempo pasa de fracturada a continua.\n\nUna sensación tranquila de logro — nadie verá lo que hiciste, pero el sistema es confiable gracias a ti.`,

        pt: `Você abre o livro de transferências e começa a cruzar referências página por página.\n\nEsse trabalho exige mais que paciência — exige raciocínio. Algumas entradas ausentes podem ser inferidas de registros adjacentes: se este dossiê foi retirado em 15 de março mas não tem registro de devolução, e outra entrada de 22 de março faz referência ao mesmo dossiê — então ele voltou pelo menos até o dia 22.\n\nVocê verifica entrada por entrada. Cada lacuna preenchida torna o livro mais completo. A linha do tempo passa de fraturada a contínua.\n\nUma sensação silenciosa de realização — ninguém verá o que você fez, mas o sistema é confiável por sua causa.`,

        it: `Apri il registro dei trasferimenti e cominci a incrociare i dati pagina per pagina.\n\nQuesto lavoro richiede più che pazienza — richiede ragionamento. Alcune voci mancanti possono essere dedotte da registrazioni adiacenti: se questo fascicolo è stato prelevato il 15 marzo ma non ha registrazione di restituzione, e un'altra voce del 22 marzo fa riferimento allo stesso fascicolo — allora era tornato almeno entro il 22.\n\nVerifichi voce per voce. Ogni lacuna colmata rende il registro più completo. La cronologia passa da frammentata a continua.\n\nUna silenziosa sensazione di realizzazione — nessuno vedrà cosa hai fatto, ma il sistema è affidabile grazie a te.`,

        ru: `Ты открываешь журнал передач и начинаешь сверять страницу за страницей.\n\nЭта работа требует не только терпения — она требует логики. Некоторые недостающие записи можно вывести из соседних: если это дело было взято 15 марта, но нет записи о возврате, а другая запись от 22 марта ссылается на то же дело — значит, оно вернулось как минимум к 22-му числу.\n\nТы проверяешь запись за записью. Каждый заполненный пробел делает журнал полнее. Хронология из разорванной становится непрерывной.\n\nТихое чувство достижения — никто не увидит, что ты сделал, но система заслуживает доверия благодаря тебе.`,

        ja: `転送台帳を開き、ページごとに照合を始める。\n\nこの作業には忍耐以上のもの——推論力が求められる。いくつかの欠落した項目は隣接する記録から推測できる：このファイルが3月15日に取り出されたが返却記録がなく、3月22日の別の記録が同じファイルを参照している——なら少なくとも22日までには戻っていたはずだ。\n\n一項目ずつ検証する。埋められた空白一つごとに台帳がより完全になる。時系列が断片的なものから連続的なものへと変わっていく。\n\n静かな達成感——誰もあなたがしたことを見ないだろう。でもシステムはあなたのおかげで信頼できるものになった。`,

        ko: `이관 대장을 열고 페이지별로 대조를 시작한다.\n\n이 작업은 인내 이상의 것을 요구한다 — 추론력이다. 일부 누락된 항목은 인접한 기록에서 추론할 수 있다: 이 서류가 3월 15일에 인출되었지만 반납 기록이 없고, 3월 22일의 다른 기록이 같은 서류를 참조한다면 — 적어도 22일까지는 돌아왔다는 뜻이다.\n\n한 항목씩 검증한다. 채워진 빈칸 하나마다 대장이 더 완전해진다. 타임라인이 끊어진 것에서 연속적인 것으로 바뀌어간다.\n\n조용한 성취감 — 아무도 당신이 한 일을 보지 못할 것이다. 하지만 시스템은 당신 덕분에 신뢰할 수 있게 되었다.`,
      },
      score4: {
        zh: `收发记录。缺失条目。逐一比对。

你拿起记录簿，开始和架子上的档案对照。第一个缺失的条目你花了几分钟找到了对应的档案——日期戳上有线索。

你把缺失的信息补上了，然后继续下一个。工作量不小，但每一个被补全的条目都让你觉得——这个系统更完整了。

不是最轻松的工作，但你做得仔细。`,

        en: `Transfer records. Missing entries. One-by-one comparison.\n\nYou pick up the ledger and start cross-referencing against the shelves. The first missing entry takes a few minutes to locate — the date stamp holds clues.\n\nYou fill in the missing information, then move to the next. The workload isn't small, but each completed entry makes you feel — this system is more whole now.\n\nNot the lightest work, but you do it carefully.`,

        nl: `Overdrachtsregistratie. Ontbrekende gegevens. Vergelijking één voor één.\n\nJe pakt het register en begint te vergelijken met de planken. De eerste ontbrekende vermelding kost je een paar minuten om te vinden — de datumstempel bevat aanwijzingen.\n\nJe vult de ontbrekende informatie aan en gaat verder met de volgende. De werklast is niet gering, maar elke aangevulde vermelding geeft je het gevoel — dit systeem is nu completer.\n\nNiet het lichtste werk, maar je doet het zorgvuldig.`,

        de: `Übergabeaufzeichnungen. Fehlende Einträge. Einzelvergleich.\n\nDu nimmst das Register und beginnst es mit den Regalen abzugleichen. Der erste fehlende Eintrag braucht ein paar Minuten zum Auffinden — der Datumsstempel liefert Hinweise.\n\nDu füllst die fehlenden Informationen ein und gehst zum nächsten über. Die Arbeitslast ist nicht gering, aber jeder vervollständigte Eintrag gibt dir das Gefühl — dieses System ist jetzt vollständiger.\n\nNicht die leichteste Arbeit, aber du machst sie sorgfältig.`,

        fr: `Registres de transfert. Entrées manquantes. Comparaison une par une.\n\nTu prends le registre et commences à croiser les données avec les étagères. La première entrée manquante prend quelques minutes à localiser — le tampon de date contient des indices.\n\nTu complètes l'information manquante, puis passes à la suivante. La charge de travail n'est pas légère, mais chaque entrée complétée te donne le sentiment que — ce système est plus entier maintenant.\n\nPas le travail le plus léger, mais tu le fais avec soin.`,

        es: `Registros de transferencia. Entradas faltantes. Comparación una por una.\n\nTomas el libro y empiezas a cruzar datos con los estantes. La primera entrada faltante te lleva unos minutos encontrarla — el sello de fecha tiene pistas.\n\nCompletas la información faltante y pasas a la siguiente. La carga de trabajo no es pequeña, pero cada entrada completada te hace sentir que — este sistema es más completo ahora.\n\nNo es el trabajo más liviano, pero lo haces con cuidado.`,

        pt: `Registros de transferência. Entradas ausentes. Comparação uma por uma.\n\nVocê pega o livro e começa a cruzar dados com as prateleiras. A primeira entrada ausente leva alguns minutos para localizar — o carimbo de data tem pistas.\n\nVocê preenche a informação ausente e passa para a próxima. A carga de trabalho não é pequena, mas cada entrada completada faz você sentir que — este sistema está mais inteiro agora.\n\nNão é o trabalho mais leve, mas você o faz com cuidado.`,

        it: `Registri di trasferimento. Voci mancanti. Confronto uno per uno.\n\nPrendi il registro e cominci a incrociare i dati con gli scaffali. La prima voce mancante richiede qualche minuto per essere localizzata — il timbro della data contiene indizi.\n\nCompili l'informazione mancante, poi passi alla successiva. Il carico di lavoro non è leggero, ma ogni voce completata ti fa sentire che — questo sistema è più completo ora.\n\nNon è il lavoro più leggero, ma lo fai con attenzione.`,

        ru: `Записи о передачах. Пропущенные записи. Сверка по одной.\n\nТы берёшь журнал и начинаешь сверять с полками. Поиск первой недостающей записи занимает несколько минут — штамп с датой содержит подсказки.\n\nТы заполняешь недостающую информацию и переходишь к следующей. Объём работы немалый, но каждая заполненная запись даёт ощущение — эта система теперь более целостна.\n\nНе самая лёгкая работа, но ты делаешь её аккуратно.`,

        ja: `転送記録。欠落した項目。一つずつの照合。\n\n台帳を手に取り、棚との照合を始める。最初の欠落項目を見つけるのに数分かかる——日付スタンプに手がかりがある。\n\n欠落した情報を補填し、次に移る。作業量は少なくないが、一つ完了するたびに感じる——このシステムはより完全になった。\n\n最も楽な作業ではないが、丁寧にやる。`,

        ko: `이관 기록. 누락된 항목. 하나씩 대조.\n\n대장을 들고 선반과 대조를 시작한다. 첫 번째 누락 항목을 찾는 데 몇 분이 걸린다 — 날짜 도장에 단서가 있다.\n\n누락된 정보를 채우고 다음으로 넘어간다. 작업량은 적지 않지만, 완성된 항목 하나하나가 느끼게 한다 — 이 시스템이 이제 더 완전해졌다고.\n\n가장 가벼운 작업은 아니지만 꼼꼼하게 한다.`,
      },
      score3: {
        zh: `核对记录、补全缺失、确保完整。

你翻了翻收发记录簿，看到了那些空白的段落。补全它们需要你在档案和记录之间来回比对，推断时间线。

你开始了。但做了几条之后，你发现这个过程比你想的更费心力——不是难，是每一条都需要仔细的比对和判断。

你的专注力开始波动。你做了一些，但不确定能做完全部。`,

        en: `Checking records, filling gaps, ensuring completeness.\n\nYou flip through the ledger and see the blank sections. Filling them requires back-and-forth comparison between files and records, reconstructing timelines.\n\nYou start. But after a few entries, you realize this process is more draining than expected — not hard, just each one requiring careful comparison and judgment.\n\nYour focus starts to fluctuate. You do some, but you're not sure you can finish all of them.`,

        nl: `Records controleren, leemtes opvullen, volledigheid waarborgen.\n\nJe bladert door het register en ziet de lege secties. Ze opvullen vereist heen-en-weer vergelijken tussen dossiers en registraties, tijdlijnen reconstrueren.\n\nJe begint. Maar na een paar vermeldingen merk je dat dit proces vermoeiender is dan verwacht — niet moeilijk, alleen vereist elke vermelding zorgvuldige vergelijking en beoordeling.\n\nJe concentratie begint te schommelen. Je doet er een paar, maar je weet niet zeker of je ze allemaal kunt afmaken.`,

        de: `Aufzeichnungen prüfen, Lücken füllen, Vollständigkeit sicherstellen.\n\nDu blätterst durch das Register und siehst die leeren Abschnitte. Sie zu füllen erfordert Hin-und-her-Vergleiche zwischen Akten und Aufzeichnungen, Rekonstruktion von Zeitlinien.\n\nDu beginnst. Aber nach ein paar Einträgen merkst du, dass dieser Prozess ermüdender ist als erwartet — nicht schwer, aber jeder einzelne erfordert sorgfältiges Vergleichen und Urteilen.\n\nDeine Konzentration beginnt zu schwanken. Du erledigst einige, bist aber nicht sicher, ob du alle schaffen kannst.`,

        fr: `Vérifier les registres, combler les lacunes, assurer la complétude.\n\nTu feuilletes le registre et vois les sections vides. Les remplir nécessite des allers-retours entre les dossiers et les registres, la reconstruction de chronologies.\n\nTu commences. Mais après quelques entrées, tu réalises que ce processus est plus épuisant que prévu — pas difficile, juste que chacune requiert une comparaison et un jugement minutieux.\n\nTa concentration commence à fluctuer. Tu en fais quelques-unes, mais tu n'es pas sûr de pouvoir toutes les terminer.`,

        es: `Verificar registros, llenar vacíos, asegurar la completitud.\n\nHojeas el libro y ves las secciones en blanco. Llenarlas requiere ir y venir entre archivos y registros, reconstruyendo líneas de tiempo.\n\nEmpiezas. Pero después de unas pocas entradas, te das cuenta de que este proceso es más agotador de lo esperado — no difícil, solo que cada una requiere comparación y juicio cuidadosos.\n\nTu concentración empieza a fluctuar. Haces algunas, pero no estás seguro de poder terminarlas todas.`,

        pt: `Verificar registros, preencher lacunas, garantir a completude.\n\nVocê folheia o livro e vê as seções em branco. Preenchê-las requer idas e vindas entre dossiês e registros, reconstruindo linhas do tempo.\n\nVocê começa. Mas após algumas entradas, percebe que esse processo é mais desgastante do que esperava — não difícil, apenas cada uma exigindo comparação e julgamento cuidadosos.\n\nSeu foco começa a oscilar. Você faz algumas, mas não tem certeza de que consegue terminar todas.`,

        it: `Controllare i registri, colmare le lacune, assicurare la completezza.\n\nSfogli il registro e vedi le sezioni vuote. Riempirle richiede confronti continui tra fascicoli e registrazioni, ricostruendo cronologie.\n\nCominci. Ma dopo qualche voce, realizzi che questo processo è più estenuante del previsto — non difficile, solo che ognuna richiede confronto e giudizio attenti.\n\nLa tua concentrazione comincia a oscillare. Ne fai alcune, ma non sei sicuro di riuscire a finirle tutte.`,

        ru: `Проверить записи, заполнить пробелы, обеспечить полноту.\n\nТы листаешь журнал и видишь пустые разделы. Заполнить их — это сверка туда-сюда между делами и записями, восстановление хронологий.\n\nТы начинаешь. Но после нескольких записей понимаешь, что этот процесс утомительнее, чем ожидалось — не сложно, просто каждая требует внимательного сравнения и суждения.\n\nКонцентрация начинает плавать. Ты делаешь несколько, но не уверен, что сможешь закончить все.`,

        ja: `記録を確認し、空白を埋め、完全性を確保する。\n\n台帳をめくり、空白のセクションを見つける。それらを埋めるにはファイルと記録の間を行き来して照合し、タイムラインを再構築する必要がある。\n\n始める。だが数件の後、このプロセスが予想以上に消耗することに気づく——難しくはない、ただ一つ一つに慎重な照合と判断が必要なのだ。\n\n集中力が揺らぎ始める。いくつかはやった。だが全部終えられるかは分からない。`,

        ko: `기록을 확인하고, 빈칸을 채우고, 완전성을 보장한다.\n\n대장을 넘기며 공백 구간을 본다. 그것을 채우려면 서류와 기록 사이를 오가며 대조하고 타임라인을 재구성해야 한다.\n\n시작한다. 하지만 몇 항목 후, 이 과정이 예상보다 더 소모적이라는 걸 깨닫는다 — 어렵지는 않지만, 각각이 신중한 대조와 판단을 요한다.\n\n집중력이 흔들리기 시작한다. 몇 개는 했지만, 전부 끝낼 수 있을지 확신이 없다.`,
      },
      score2: {
        zh: `记录簿上的空白段落。架子上的档案。需要逐一比对。

你看了看工作量，再看了看那些需要推断的缺失条目。这种需要长时间细致比对的工作……

你做了两三条，然后停了下来。不是做不了——是不想继续了。每一条都需要翻阅、比对、推断、记录，这种循环让你疲惫。`,

        en: `Blank sections in the ledger. Files on the shelves. Need to compare one by one.\n\nYou look at the workload, then at the entries requiring reconstruction. This kind of extended, meticulous comparison...\n\nYou do two or three, then stop. Not that you can't — you just don't want to continue. Each one requires flipping, comparing, inferring, recording. The loop exhausts you.`,

        nl: `Lege secties in het register. Dossiers op de planken. Één voor één vergelijken.\n\nJe kijkt naar de werklast, dan naar de vermeldingen die reconstructie vereisen. Dit soort langdurige, nauwgezette vergelijking...\n\nJe doet er twee of drie, dan stop je. Niet dat je niet kunt — je wilt gewoon niet doorgaan. Elke vermelding vereist bladeren, vergelijken, afleiden, registreren. De cyclus put je uit.`,

        de: `Leere Abschnitte im Register. Akten in den Regalen. Einzeln vergleichen.\n\nDu schaust dir den Arbeitsumfang an, dann die Einträge, die Rekonstruktion erfordern. Diese Art von ausgedehntem, akribischem Vergleich...\n\nDu erledigst zwei oder drei und hörst dann auf. Nicht, weil du nicht kannst — du willst einfach nicht weitermachen. Jeder erfordert Blättern, Vergleichen, Schlussfolgern, Aufzeichnen. Die Schleife erschöpft dich.`,

        fr: `Des sections vides dans le registre. Des dossiers sur les étagères. Comparer un par un.\n\nTu regardes la charge de travail, puis les entrées nécessitant une reconstruction. Ce genre de comparaison prolongée et méticuleuse...\n\nTu en fais deux ou trois, puis tu t'arrêtes. Pas que tu ne puisses pas — tu ne veux simplement pas continuer. Chacune exige de feuilleter, comparer, déduire, enregistrer. Le cycle t'épuise.`,

        es: `Secciones en blanco en el libro. Archivos en los estantes. Comparar uno por uno.\n\nMiras la carga de trabajo, luego las entradas que requieren reconstrucción. Este tipo de comparación extensa y meticulosa...\n\nHaces dos o tres, luego paras. No es que no puedas — simplemente no quieres continuar. Cada una requiere hojear, comparar, inferir, registrar. El ciclo te agota.`,

        pt: `Seções em branco no livro. Dossiês nas prateleiras. Comparar um por um.\n\nVocê olha a carga de trabalho, depois as entradas que precisam de reconstrução. Esse tipo de comparação prolongada e meticulosa...\n\nVocê faz duas ou três, depois para. Não que não consiga — simplesmente não quer continuar. Cada uma requer folhear, comparar, inferir, registrar. O ciclo te esgota.`,

        it: `Sezioni vuote nel registro. Fascicoli sugli scaffali. Confrontare uno per uno.\n\nGuardi il carico di lavoro, poi le voci che richiedono ricostruzione. Questo tipo di confronto prolungato e meticoloso...\n\nNe fai due o tre, poi ti fermi. Non che non puoi — semplicemente non vuoi continuare. Ognuna richiede sfogliare, confrontare, dedurre, registrare. Il ciclo ti esaurisce.`,

        ru: `Пустые разделы в журнале. Дела на полках. Нужно сверять по одному.\n\nТы смотришь на объём работы, потом на записи, требующие восстановления. Такое долгое, скрупулёзное сравнение...\n\nТы делаешь две-три и останавливаешься. Не потому что не можешь — просто не хочешь продолжать. Каждая требует листания, сравнения, умозаключения, записи. Этот цикл выматывает.`,

        ja: `台帳の空白セクション。棚の上のファイル。一つずつ照合する必要がある。\n\n作業量を見て、それから再構築が必要な項目を見る。この種の長時間にわたる、細心の照合……\n\n2つか3つやって、止まる。できないわけではない——ただ続けたくないのだ。一つ一つに、めくり、照合し、推論し、記録する作業が必要。このループが疲弊させる。`,

        ko: `대장의 공백 구간. 선반 위의 서류. 하나씩 대조해야 한다.\n\n작업량을 보고, 재구성이 필요한 항목을 본다. 이런 종류의 장시간에 걸친, 꼼꼼한 대조란...\n\n두세 개를 하고 멈춘다. 못하는 게 아니라 — 그냥 계속하고 싶지 않다. 각각이 넘기고, 비교하고, 추론하고, 기록하는 과정을 요한다. 이 순환이 지치게 한다.`,
      },
      score1: {
        zh: `逐一比对。补全缺失。确保可追溯。

你翻了一页记录簿，看着那些空白。你知道它们需要被填上，但你没有填它们的冲动。

核对记录这种工作——反复的、细致的、安静的——和你之间有一道很明确的边界。

你合上了记录簿。还有两个步骤。`,

        en: `One-by-one comparison. Fill the gaps. Ensure traceability.\n\nYou turn a page of the ledger and look at the blanks. You know they need filling, but you have no urge to fill them.\n\nRecord-checking — repetitive, meticulous, quiet work — sits firmly on the other side of a clear boundary between it and you.\n\nYou close the ledger. Two steps remain.`,

        nl: `Vergelijking één voor één. Leemtes opvullen. Traceerbaarheid garanderen.\n\nJe slaat een pagina van het register om en kijkt naar de lege plekken. Je weet dat ze ingevuld moeten worden, maar je hebt geen drang om ze in te vullen.\n\nRegisters controleren — repetitief, nauwgezet, stil werk — staat stevig aan de andere kant van een duidelijke grens tussen het en jou.\n\nJe sluit het register. Twee stappen nog.`,

        de: `Einzelvergleich. Lücken füllen. Nachvollziehbarkeit sicherstellen.\n\nDu schlägst eine Seite des Registers um und schaust auf die leeren Stellen. Du weißt, dass sie gefüllt werden müssen, aber du hast keinen Drang, sie zu füllen.\n\nAufzeichnungen prüfen — wiederholende, sorgfältige, stille Arbeit — liegt fest auf der anderen Seite einer klaren Grenze zwischen ihr und dir.\n\nDu schließt das Register. Zwei Schritte bleiben.`,

        fr: `Comparaison une par une. Combler les lacunes. Garantir la traçabilité.\n\nTu tournes une page du registre et regardes les blancs. Tu sais qu'ils doivent être remplis, mais tu n'as aucune envie de les remplir.\n\nVérifier des registres — un travail répétitif, méticuleux, silencieux — se situe fermement de l'autre côté d'une frontière claire entre lui et toi.\n\nTu refermes le registre. Il reste deux étapes.`,

        es: `Comparación una por una. Llenar los vacíos. Garantizar la trazabilidad.\n\nPasas una página del libro y miras los espacios en blanco. Sabes que necesitan ser llenados, pero no tienes impulso de llenarlos.\n\nVerificar registros — trabajo repetitivo, meticuloso, silencioso — se sitúa firmemente al otro lado de una frontera clara entre él y tú.\n\nCierras el libro. Quedan dos pasos.`,

        pt: `Comparação uma por uma. Preencher as lacunas. Garantir a rastreabilidade.\n\nVocê vira uma página do livro e olha para os espaços em branco. Sabe que precisam ser preenchidos, mas não tem nenhum impulso para preenchê-los.\n\nVerificar registros — trabalho repetitivo, meticuloso, silencioso — fica firmemente do outro lado de uma fronteira clara entre ele e você.\n\nVocê fecha o livro. Dois passos restam.`,

        it: `Confronto uno per uno. Colmare le lacune. Garantire la tracciabilità.\n\nGiri una pagina del registro e guardi gli spazi vuoti. Sai che devono essere riempiti, ma non hai nessun impulso a farlo.\n\nControllare registri — lavoro ripetitivo, meticoloso, silenzioso — sta saldamente dall'altra parte di un confine netto tra esso e te.\n\nChiudi il registro. Due passaggi rimangono.`,

        ru: `Сверка по одной. Заполнить пробелы. Обеспечить прослеживаемость.\n\nТы переворачиваешь страницу журнала и смотришь на пустые места. Ты знаешь, что их нужно заполнить, но у тебя нет порыва это делать.\n\nПроверка записей — повторяющаяся, скрупулёзная, тихая работа — твёрдо стоит по ту сторону чёткой границы между ней и тобой.\n\nТы закрываешь журнал. Остаётся два шага.`,

        ja: `一つずつの照合。空白を埋める。追跡可能性を確保する。\n\n台帳のページをめくり、空欄を見つめる。埋める必要があることは分かっている。でも埋めたいという衝動がない。\n\n記録の確認——反復的で、細心で、静かな作業——は、自分との間にある明確な境界線の向こう側にしっかりと位置している。\n\n台帳を閉じる。残り2ステップ。`,

        ko: `하나씩 대조. 빈칸을 채운다. 추적 가능성을 보장한다.\n\n대장의 한 페이지를 넘기고 공백을 바라본다. 채워야 한다는 걸 안다. 하지만 채우고 싶은 충동이 없다.\n\n기록 확인 — 반복적이고, 세심하고, 조용한 작업 — 은 자신과의 명확한 경계선 저편에 단단히 자리 잡고 있다.\n\n대장을 닫는다. 두 단계가 남았다.`,
      },
    },
  },

  {
    id: 29,
    riasec: "C",
    miniIpCode: "C4",
    miniIpItem: "Inventory supplies using a hand-held computer",
    chapter: "archive",
    chapterIndex: 6,
    questionInChapter: 4,
    isClimax: true,
    scene: {
      zh: `收发记录补全了。纸上的数字终于说得通。

但纸上说得通不够——系统需要实物验证。每一份档案的记录要和它在架子上的实际位置完全对应。

你正准备开始的时候，档案室侧面的一扇门开了。

Nora 走了进来。

她手里拿着那个小本子——从第一层开始就在写的那个。她看了你一眼，没有打招呼，径直走到档案架前。

然后她把本子翻到最新的一页，上面是一份手写的清单——她在之前的每一层都记录了什么。不只是游戏进度。她记录了每个人的选择、反应、犹豫、表情。

她说：「我有清单。你有扫描设备。我们一起盘。」

桌上有一台手持扫描仪。你扫实物，她对清单。每一份档案，逐一核对。

屏幕提示：「系统恢复步骤四：实物盘点。使用手持设备扫描每份档案，与系统记录比对。两人协作完成。」`,

      en: `Transfer records are complete. The numbers on paper finally make sense.\n\nBut paper making sense isn't enough — the system needs physical verification. Every file's record must match its actual location on the shelf.\n\nYou're about to begin when a side door opens.\n\nNora walks in.\n\nShe's holding that small notebook — the one she's been writing in since the first floor. She glances at you, skips the greeting, walks straight to the file shelves.\n\nThen she flips to the latest page — a handwritten checklist. She recorded something at every floor. Not just game progress. She recorded everyone's choices, reactions, hesitations, expressions.\n\nShe says: "I have the checklist. You have the scanner. We do this together."\n\nA handheld scanner sits on the desk. You scan the physical files, she checks the list. Every file, one by one.\n\nThe screen prompts: "System Restoration Step Four: Physical Inventory. Use the handheld device to scan each file and cross-reference system records. Two-person collaboration required."`,

      nl: `De overdrachtsregistratie is compleet. De cijfers op papier kloppen eindelijk.\n\nMaar kloppende cijfers zijn niet genoeg — het systeem heeft fysieke verificatie nodig. Van elk dossier moet de registratie overeenkomen met de werkelijke positie op de plank.\n\nJe staat op het punt te beginnen wanneer een zijdeur van de archiefkamer opengaat.\n\nNora loopt binnen.\n\nZe houdt dat kleine notitieboekje vast — het boekje waarin ze schrijft sinds de eerste verdieping. Ze kijkt je even aan, slaat de begroeting over en loopt recht naar de dossierplanken.\n\nDan slaat ze haar notitieboekje open op de nieuwste pagina — een handgeschreven checklist. Ze heeft op elke verdieping iets opgeschreven. Niet alleen spelvoortgang. Ze heeft ieders keuzes, reacties, aarzelingen, gezichtsuitdrukkingen vastgelegd.\n\nZe zegt: "Ik heb de checklist. Jij hebt de scanner. We doen dit samen."\n\nOp het bureau staat een handscanner. Jij scant de fysieke dossiers, zij controleert de lijst. Elk dossier, één voor één.\n\nHet scherm meldt: "Systeemherstel Stap Vier: Fysieke Inventarisatie. Gebruik het draagbare apparaat om elk dossier te scannen en met de systeemregistratie te vergelijken. Samenwerking van twee personen vereist."`,

      de: `Die Übergabeaufzeichnungen sind vollständig. Die Zahlen auf dem Papier ergeben endlich Sinn.\n\nAber Sinn auf dem Papier reicht nicht — das System braucht physische Verifizierung. Die Aufzeichnung jeder Akte muss mit ihrem tatsächlichen Standort im Regal übereinstimmen.\n\nDu willst gerade anfangen, als sich eine Seitentür des Archivraums öffnet.\n\nNora tritt ein.\n\nSie hält das kleine Notizbuch in der Hand — dasselbe, in das sie seit dem ersten Stock schreibt. Sie wirft dir einen Blick zu, überspringt die Begrüßung und geht direkt zu den Aktenregalen.\n\nDann schlägt sie ihr Notizbuch auf der neuesten Seite auf — eine handgeschriebene Checkliste. Sie hat auf jeder Etage etwas aufgezeichnet. Nicht nur den Spielfortschritt. Sie hat die Entscheidungen, Reaktionen, Zögerungen, Gesichtsausdrücke aller festgehalten.\n\nSie sagt: „Ich habe die Checkliste. Du hast den Scanner. Wir machen das zusammen."\n\nAuf dem Schreibtisch liegt ein Handscanner. Du scannst die physischen Akten, sie prüft die Liste. Jede Akte, eine nach der anderen.\n\nDer Bildschirm zeigt an: „Systemwiederherstellung Schritt Vier: Physische Bestandsaufnahme. Verwenden Sie das Handgerät zum Scannen jeder Akte und zum Abgleich mit den Systemaufzeichnungen. Zusammenarbeit zweier Personen erforderlich."`,

      fr: `Les registres de transfert sont complets. Les chiffres sur le papier ont enfin un sens.\n\nMais que le papier ait un sens ne suffit pas — le système a besoin d'une vérification physique. Le dossier de chaque fichier doit correspondre à son emplacement réel sur l'étagère.\n\nTu es sur le point de commencer quand une porte latérale de la salle d'archives s'ouvre.\n\nNora entre.\n\nElle tient ce petit carnet — celui dans lequel elle écrit depuis le premier étage. Elle te lance un regard, passe le salut, et va droit aux étagères de dossiers.\n\nPuis elle ouvre son carnet à la dernière page — une liste de vérification manuscrite. Elle a noté quelque chose à chaque étage. Pas seulement la progression du jeu. Elle a enregistré les choix de chacun, les réactions, les hésitations, les expressions.\n\nElle dit : « J'ai la liste. Tu as le scanner. On fait ça ensemble. »\n\nUn scanner portable est posé sur le bureau. Tu scannes les dossiers physiques, elle vérifie la liste. Chaque dossier, un par un.\n\nL'écran indique : « Restauration du Système, Étape Quatre : Inventaire Physique. Utilisez l'appareil portable pour scanner chaque dossier et le confronter aux enregistrements du système. Collaboration de deux personnes requise. »`,

      es: `Los registros de transferencia están completos. Los números en el papel finalmente tienen sentido.\n\nPero que el papel tenga sentido no es suficiente — el sistema necesita verificación física. El registro de cada archivo debe coincidir con su ubicación real en el estante.\n\nEstás a punto de comenzar cuando una puerta lateral de la sala de archivos se abre.\n\nNora entra.\n\nSostiene ese pequeño cuaderno — el que ha estado escribiendo desde el primer piso. Te mira brevemente, se salta el saludo y camina directamente hacia los estantes de archivos.\n\nLuego abre su cuaderno en la última página — una lista de verificación manuscrita. Anotó algo en cada piso. No solo el progreso del juego. Registró las elecciones, reacciones, dudas y expresiones de todos.\n\nDice: "Yo tengo la lista. Tú tienes el escáner. Hacemos esto juntos."\n\nUn escáner portátil está sobre el escritorio. Tú escaneas los archivos físicos, ella revisa la lista. Cada archivo, uno por uno.\n\nLa pantalla indica: "Restauración del Sistema, Paso Cuatro: Inventario Físico. Usa el dispositivo portátil para escanear cada archivo y cruzarlo con los registros del sistema. Colaboración de dos personas requerida."`,

      pt: `Os registros de transferência estão completos. Os números no papel finalmente fazem sentido.\n\nMas números no papel não bastam — o sistema precisa de verificação física. O registro de cada dossiê deve corresponder à sua localização real na prateleira.\n\nVocê está prestes a começar quando uma porta lateral da sala de arquivos se abre.\n\nNora entra.\n\nEla segura aquele pequeno caderno — o mesmo em que escreve desde o primeiro andar. Olha para você, pula a saudação e vai direto às prateleiras de dossiês.\n\nEntão abre o caderno na última página — uma lista de verificação manuscrita. Ela anotou algo em cada andar. Não apenas o progresso do jogo. Registrou as escolhas, reações, hesitações e expressões de todos.\n\nEla diz: "Eu tenho a lista. Você tem o scanner. Fazemos isso juntos."\n\nUm scanner portátil está sobre a mesa. Você escaneia os dossiês físicos, ela confere a lista. Cada dossiê, um por um.\n\nA tela indica: "Restauração do Sistema, Passo Quatro: Inventário Físico. Use o dispositivo portátil para escanear cada dossiê e cruzar com os registros do sistema. Colaboração de duas pessoas necessária."`,

      it: `I registri di trasferimento sono completi. I numeri sulla carta finalmente hanno senso.\n\nMa che la carta abbia senso non basta — il sistema ha bisogno di verifica fisica. Il record di ogni fascicolo deve corrispondere alla sua posizione effettiva sullo scaffale.\n\nStai per cominciare quando una porta laterale della sala archivi si apre.\n\nNora entra.\n\nTiene in mano quel piccolo taccuino — quello su cui scrive dal primo piano. Ti lancia un'occhiata, salta il saluto e va dritta agli scaffali dei fascicoli.\n\nPoi apre il taccuino all'ultima pagina — una checklist scritta a mano. Ha annotato qualcosa a ogni piano. Non solo i progressi del gioco. Ha registrato le scelte di tutti, le reazioni, le esitazioni, le espressioni.\n\nDice: "Io ho la checklist. Tu hai lo scanner. Lo facciamo insieme."\n\nUno scanner portatile è sulla scrivania. Tu scannerizzi i fascicoli fisici, lei controlla la lista. Ogni fascicolo, uno per uno.\n\nLo schermo indica: "Ripristino del Sistema, Fase Quattro: Inventario Fisico. Usa il dispositivo portatile per scansionare ogni fascicolo e confrontarlo con i record di sistema. Collaborazione tra due persone richiesta."`,

      ru: `Записи о передачах завершены. Цифры на бумаге наконец обрели смысл.\n\nНо смысл на бумаге — недостаточно. Системе нужна физическая верификация. Запись каждого дела должна совпадать с его фактическим местоположением на полке.\n\nТы собираешься начать, когда боковая дверь архивной комнаты открывается.\n\nВходит Нора.\n\nОна держит тот маленький блокнот — тот самый, в который пишет с первого этажа. Она бросает на тебя взгляд, пропускает приветствие и идёт прямо к полкам с делами.\n\nЗатем открывает блокнот на последней странице — рукописный контрольный список. Она записывала что-то на каждом этаже. Не только ход игры. Она фиксировала выбор каждого, реакции, колебания, выражения лиц.\n\nОна говорит: «У меня список. У тебя сканер. Делаем вместе.»\n\nНа столе лежит ручной сканер. Ты сканируешь физические дела, она сверяет по списку. Каждое дело, одно за другим.\n\nНа экране: «Восстановление системы, Шаг четвёртый: Физическая инвентаризация. Используйте ручное устройство для сканирования каждого дела и сверки с записями системы. Требуется совместная работа двух человек.»`,

      ja: `転送記録が完了した。紙の上の数字がようやく意味をなす。\n\nだが紙の上で意味をなすだけでは足りない——システムには物理的な検証が必要だ。すべてのファイルの記録が、棚上の実際の位置と一致しなければならない。\n\n始めようとしたとき、アーカイブ室の側面のドアが開く。\n\nノラが入ってくる。\n\n彼女はあの小さなノートを持っている——1階からずっと書き続けているあのノート。あなたをちらりと見て、挨拶を飛ばし、まっすぐファイル棚に向かう。\n\nそしてノートの最新ページを開く——手書きのチェックリスト。彼女はすべてのフロアで何かを記録していた。ゲームの進行だけではない。全員の選択、反応、ためらい、表情を記録していた。\n\n彼女は言う：「チェックリストは私が持ってる。スキャナーはあなた。一緒にやろう。」\n\nデスクの上にハンドヘルドスキャナーがある。あなたが実物をスキャンし、彼女がリストを確認する。すべてのファイルを、一つずつ。\n\nスクリーンの指示：「システム復旧ステップ4：実物棚卸し。ハンドヘルドデバイスを使って各ファイルをスキャンし、システム記録と照合せよ。2人の共同作業が必要。」`,

      ko: `이관 기록이 완료되었다. 종이 위의 숫자가 마침내 의미를 가진다.\n\n하지만 종이 위에서 의미를 갖는 것만으로는 부족하다 — 시스템에는 실물 검증이 필요하다. 모든 서류의 기록이 선반 위의 실제 위치와 일치해야 한다.\n\n시작하려는 순간 기록보관실의 옆문이 열린다.\n\n노라가 들어온다.\n\n그녀는 그 작은 노트를 들고 있다 — 1층부터 계속 써온 바로 그 노트. 당신을 한번 쳐다보고, 인사를 건너뛰고, 곧장 서류 선반으로 걸어간다.\n\n그리고 노트의 가장 최근 페이지를 펼친다 — 손으로 쓴 체크리스트. 그녀는 모든 층에서 무언가를 기록했다. 게임 진행만이 아니다. 모든 사람의 선택, 반응, 망설임, 표정을 기록했다.\n\n그녀가 말한다: "체크리스트는 내가 있어. 스캐너는 네가 있고. 같이 하자."\n\n책상 위에 핸드헬드 스캐너가 놓여 있다. 당신이 실물 서류를 스캔하고, 그녀가 리스트를 확인한다. 모든 서류를, 하나씩.\n\n화면 안내: "시스템 복구 4단계: 실물 재고조사. 핸드헬드 장치를 사용하여 각 서류를 스캔하고 시스템 기록과 대조하라. 2인 협업 필요."`,
    },
    taskDescription: {
      zh: "使用手持扫描设备逐一盘点档案室中的实物，与系统记录进行比对核实——和 Nora 一起，确保每一份档案的实物与记录完全一致。",

      en: `Use the handheld scanner to inventory every physical file in the archive, cross-referencing against system records — together with Nora, ensuring every file's physical presence matches its digital record.`,

      nl: `Gebruik de handscanner om elk fysiek dossier in het archief te inventariseren en met systeemregistraties te vergelijken — samen met Nora, zodat de fysieke aanwezigheid van elk dossier overeenkomt met het digitale record.`,

      de: `Verwenden Sie den Handscanner, um jede physische Akte im Archiv zu inventarisieren und mit den Systemaufzeichnungen abzugleichen — zusammen mit Nora, um sicherzustellen, dass die physische Anwesenheit jeder Akte mit ihrem digitalen Eintrag übereinstimmt.`,

      fr: `Utilise le scanner portable pour inventorier chaque dossier physique de l'archive, en croisant les données avec les enregistrements du système — avec Nora, en s'assurant que la présence physique de chaque dossier correspond à son enregistrement numérique.`,

      es: `Usa el escáner portátil para inventariar cada archivo físico del depósito, cruzándolo con los registros del sistema — junto con Nora, asegurando que la presencia física de cada archivo coincida con su registro digital.`,

      pt: `Use o scanner portátil para inventariar cada dossiê físico no arquivo, cruzando com os registros do sistema — junto com Nora, garantindo que a presença física de cada dossiê corresponda ao seu registro digital.`,

      it: `Usa lo scanner portatile per inventariare ogni fascicolo fisico nell'archivio, incrociando i dati con i record di sistema — insieme a Nora, assicurandoti che la presenza fisica di ogni fascicolo corrisponda al suo record digitale.`,

      ru: `Используйте ручной сканер для инвентаризации каждого физического дела в архиве, сверяя с записями системы — вместе с Норой, обеспечивая соответствие физического наличия каждого дела его цифровой записи.`,

      ja: `ハンドヘルドスキャナーを使って、アーカイブ内のすべての実物ファイルを棚卸しし、システム記録と照合せよ——ノラと共に、すべてのファイルの実物がデジタル記録と一致することを確認する。`,

      ko: `핸드헬드 스캐너를 사용하여 기록보관실의 모든 실물 서류를 재고조사하고 시스템 기록과 대조하라 — 노라와 함께, 모든 서류의 실물이 디지털 기록과 일치하도록 하라.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `你拿起扫描仪的时候，手感意外地好。

重量适中，握把的弧度正好。你扫了第一份档案——屏幕上跳出了对应的记录，绿色的勾。匹配。

Nora 在旁边，翻了一页，报下一个编号。你走到对应的架子前，找到了那份档案，扫。又一个绿色的勾。

你们的节奏慢慢同步了。她报编号，你找档案，扫描，确认。偶尔有一份档案不在应该的位置——你停下来，找到它，放回正确的格子，再扫。

这种精确的、有节奏的协作，让你进入了一种近乎冥想的状态。每一个绿色的勾都是一个确认：系统可以被信赖。

Nora 在对完最后一条记录后，合上了本子。她看了你一眼，什么都没说，但她的眼神里有一种东西——不是感谢，是认可。一个同类对另一个同类的认可。`,

        en: `You pick up the scanner and it feels unexpectedly right.\n\nGood weight, grip contoured just so. You scan the first file — the screen flashes a green check. Match.\n\nNora flips a page, reads the next number. You walk to the corresponding shelf, find the file, scan. Another green check.\n\nYour rhythm gradually syncs. She calls the number, you find the file, scan, confirm. Occasionally one isn't where it should be — you pause, locate it, return it to the correct slot, scan again.\n\nThis precise, rhythmic collaboration puts you in a near-meditative state. Each green check is a confirmation: the system can be trusted.\n\nAfter Nora verifies the final entry, she closes her notebook. She looks at you, says nothing, but her eyes hold something — not gratitude. Recognition. One of a kind acknowledging another.`,

        nl: `Je pakt de scanner op en hij voelt onverwacht goed aan.\n\nGoed gewicht, greep precies goed gevormd. Je scant het eerste dossier — het scherm flitst een groen vinkje. Match.\n\nNora slaat een pagina om, leest het volgende nummer. Je loopt naar de bijbehorende plank, vindt het dossier, scant. Nog een groen vinkje.\n\nJullie ritme synchroniseert geleidelijk. Zij noemt het nummer, jij vindt het dossier, scant, bevestigt. Af en toe staat er eentje niet waar het hoort — je pauzeert, zoekt het, plaatst het terug in het juiste vak, scant opnieuw.\n\nDeze precieze, ritmische samenwerking brengt je in een bijna meditatieve staat. Elk groen vinkje is een bevestiging: het systeem is te vertrouwen.\n\nNadat Nora de laatste vermelding verifieert, sluit ze haar notitieboekje. Ze kijkt je aan, zegt niets, maar haar ogen bevatten iets — geen dankbaarheid. Erkenning. Een gelijkgestemde die een andere erkent.`,

        de: `Du nimmst den Scanner und er fühlt sich unerwartet richtig an.\n\nGutes Gewicht, Griff genau passend konturiert. Du scannst die erste Akte — der Bildschirm zeigt ein grünes Häkchen. Übereinstimmung.\n\nNora blättert eine Seite um, liest die nächste Nummer. Du gehst zum entsprechenden Regal, findest die Akte, scannst. Noch ein grünes Häkchen.\n\nEuer Rhythmus synchronisiert sich allmählich. Sie ruft die Nummer, du findest die Akte, scannst, bestätigst. Gelegentlich ist eine nicht dort, wo sie sein sollte — du hältst inne, findest sie, legst sie ins richtige Fach, scannst erneut.\n\nDiese präzise, rhythmische Zusammenarbeit versetzt dich in einen fast meditativen Zustand. Jedes grüne Häkchen ist eine Bestätigung: Dem System kann vertraut werden.\n\nNachdem Nora den letzten Eintrag überprüft hat, schließt sie ihr Notizbuch. Sie sieht dich an, sagt nichts, aber in ihren Augen liegt etwas — nicht Dankbarkeit. Anerkennung. Eine Gleichgesinnte, die eine andere anerkennt.`,

        fr: `Tu prends le scanner et il tient étonnamment bien en main.\n\nBon poids, prise parfaitement ergonomique. Tu scannes le premier dossier — l'écran affiche une coche verte. Correspondance.\n\nNora tourne une page, lit le numéro suivant. Tu marches vers l'étagère correspondante, trouves le dossier, scannes. Encore une coche verte.\n\nVotre rythme se synchronise progressivement. Elle annonce le numéro, tu trouves le dossier, scannes, confirmes. Parfois l'un n'est pas à sa place — tu fais une pause, le localises, le remets dans le bon compartiment, rescanne.\n\nCette collaboration précise et rythmée te plonge dans un état quasi méditatif. Chaque coche verte est une confirmation : le système est digne de confiance.\n\nAprès que Nora a vérifié la dernière entrée, elle ferme son carnet. Elle te regarde, ne dit rien, mais ses yeux contiennent quelque chose — pas de la gratitude. De la reconnaissance. Un semblable qui en reconnaît un autre.`,

        es: `Tomas el escáner y se siente inesperadamente bien.\n\nBuen peso, agarre contorneado justo. Escaneas el primer archivo — la pantalla muestra una marca verde. Coincidencia.\n\nNora pasa una página, lee el siguiente número. Caminas al estante correspondiente, encuentras el archivo, escaneas. Otra marca verde.\n\nVuestro ritmo se sincroniza gradualmente. Ella dice el número, tú encuentras el archivo, escaneas, confirmas. Ocasionalmente uno no está donde debería — te detienes, lo localizas, lo devuelves al lugar correcto, escaneas de nuevo.\n\nEsta colaboración precisa y rítmica te pone en un estado casi meditativo. Cada marca verde es una confirmación: se puede confiar en el sistema.\n\nDespués de que Nora verifica la última entrada, cierra su cuaderno. Te mira, no dice nada, pero sus ojos contienen algo — no gratitud. Reconocimiento. Un igual reconociendo a otro.`,

        pt: `Você pega o scanner e a sensação é inesperadamente boa.\n\nPeso adequado, empunhadura perfeitamente contornada. Você escaneia o primeiro dossiê — a tela exibe uma marca verde. Correspondência.\n\nNora vira uma página, lê o próximo número. Você caminha até a prateleira correspondente, encontra o dossiê, escaneia. Mais uma marca verde.\n\nO ritmo de vocês se sincroniza gradualmente. Ela diz o número, você encontra o dossiê, escaneia, confirma. Ocasionalmente um não está onde deveria — você pausa, localiza, devolve ao lugar correto, escaneia novamente.\n\nEssa colaboração precisa e rítmica coloca você em um estado quase meditativo. Cada marca verde é uma confirmação: o sistema pode ser confiável.\n\nDepois que Nora verifica a última entrada, fecha seu caderno. Olha para você, não diz nada, mas seus olhos contêm algo — não gratidão. Reconhecimento. Um semelhante reconhecendo outro.`,

        it: `Prendi lo scanner e la sensazione è inaspettatamente giusta.\n\nBuon peso, impugnatura sagomata perfettamente. Scannerizzi il primo fascicolo — lo schermo mostra una spunta verde. Corrispondenza.\n\nNora gira una pagina, legge il prossimo numero. Cammini verso lo scaffale corrispondente, trovi il fascicolo, scannerizzi. Un'altra spunta verde.\n\nIl vostro ritmo si sincronizza gradualmente. Lei chiama il numero, tu trovi il fascicolo, scannerizzi, confermi. A volte uno non è dove dovrebbe — ti fermi, lo localizzi, lo rimetti nello slot corretto, scannerizzi di nuovo.\n\nQuesta collaborazione precisa e ritmica ti porta in uno stato quasi meditativo. Ogni spunta verde è una conferma: il sistema può essere considerato affidabile.\n\nDopo che Nora verifica l'ultima voce, chiude il taccuino. Ti guarda, non dice nulla, ma i suoi occhi contengono qualcosa — non gratitudine. Riconoscimento. Un simile che riconosce un altro.`,

        ru: `Ты берёшь сканер, и он неожиданно хорошо ложится в руку.\n\nПравильный вес, эргономичная рукоятка. Ты сканируешь первое дело — на экране зелёная галочка. Совпадение.\n\nНора перелистывает страницу, называет следующий номер. Ты подходишь к нужной полке, находишь дело, сканируешь. Ещё одна зелёная галочка.\n\nВаш ритм постепенно синхронизируется. Она называет номер, ты находишь дело, сканируешь, подтверждаешь. Иногда одно оказывается не на месте — ты останавливаешься, находишь его, возвращаешь в правильную ячейку, сканируешь снова.\n\nЭта точная, ритмичная совместная работа погружает тебя в почти медитативное состояние. Каждая зелёная галочка — подтверждение: системе можно доверять.\n\nПосле того как Нора проверяет последнюю запись, она закрывает блокнот. Смотрит на тебя, ничего не говорит, но в её глазах что-то есть — не благодарность. Признание. Один свой узнаёт другого.`,

        ja: `スキャナーを手に取ると、意外なほどしっくりくる。\n\nちょうどいい重さ、手に馴染むグリップ。最初のファイルをスキャンする——画面に緑のチェックマークが表示される。一致。\n\nノラがページをめくり、次の番号を読み上げる。対応する棚に歩いていき、ファイルを見つけ、スキャン。また緑のチェック。\n\n二人のリズムが徐々に同期していく。彼女が番号を呼び、あなたがファイルを見つけ、スキャンし、確認する。時々あるべき場所にないものがある——立ち止まり、探し出し、正しいスロットに戻し、再スキャン。\n\nこの精密でリズミカルな共同作業が、ほとんど瞑想的な状態に導く。緑のチェック一つ一つが確認だ：このシステムは信頼できる。\n\nノラが最後の項目を検証した後、ノートを閉じる。あなたを見る。何も言わない。だが彼女の目には何かがある——感謝ではない。認知だ。同類が同類を認めるということ。`,

        ko: `스캐너를 집어 들자 의외로 손에 잘 맞는다.\n\n적당한 무게, 딱 맞는 그립감. 첫 번째 서류를 스캔한다 — 화면에 녹색 체크 표시가 뜬다. 일치.\n\n노라가 페이지를 넘기고 다음 번호를 읽는다. 해당 선반으로 걸어가 서류를 찾고 스캔한다. 또 하나의 녹색 체크.\n\n둘의 리듬이 점차 맞아간다. 그녀가 번호를 부르고, 당신이 서류를 찾고, 스캔하고, 확인한다. 가끔 있어야 할 자리에 없는 것이 있다 — 멈추고, 찾아내고, 올바른 칸에 돌려놓고, 다시 스캔한다.\n\n이 정밀하고 리듬감 있는 협업이 거의 명상적인 상태로 이끈다. 녹색 체크 하나하나가 확인이다: 이 시스템은 신뢰할 수 있다.\n\n노라가 마지막 항목을 확인한 후 노트를 닫는다. 당신을 바라본다. 아무 말도 하지 않지만, 그녀의 눈에는 무언가가 있다 — 감사가 아니다. 인정이다. 같은 부류가 같은 부류를 알아보는 것.`,
      },
      score4: {
        zh: `手持扫描仪。实物盘点。和 Nora 协作。

你拿起扫描仪，试了试。操作很简单——对准条码，按键，等结果。

Nora 开始报编号了。你走到架子前，找到第一份档案，扫了。匹配。第二份。匹配。第三份——不匹配。你看了看记录，档案放错了位置。你找到了正确的格子，放回去，重新扫。

工作的节奏不快不慢，每一步都有确认。Nora 的效率很高——她几乎不需要查找，因为她的清单已经提前整理好了。

你们在沉默中完成了大部分盘点。偶尔交换一两句确认的话。

这种安静的、有序的协作，你觉得还不错。`,

        en: `Handheld scanner. Physical inventory. Working with Nora.\n\nYou pick up the scanner and try it. Simple operation — aim at the barcode, press, wait for result.\n\nNora starts reading numbers. You walk to the shelf, find the first file, scan. Match. Second. Match. Third — mismatch. You check the record. Wrong location. You find the correct slot, return it, rescan.\n\nThe pace is steady, each step confirmed. Nora is efficient — she barely needs to look things up because her list is already organized.\n\nYou complete most of the inventory in silence, exchanging an occasional confirmation.\n\nThis quiet, orderly collaboration — you find it rather nice.`,

        nl: `Handscanner. Fysieke inventarisatie. Samenwerken met Nora.\n\nJe pakt de scanner en probeert hem. Eenvoudige bediening — richten op de barcode, drukken, wachten op resultaat.\n\nNora begint nummers voor te lezen. Je loopt naar de plank, vindt het eerste dossier, scant. Match. Tweede. Match. Derde — geen match. Je controleert de registratie. Verkeerde locatie. Je vindt het juiste vak, plaatst het terug, scant opnieuw.\n\nHet tempo is gestaag, elke stap bevestigd. Nora is efficiënt — ze hoeft nauwelijks iets op te zoeken omdat haar lijst al georganiseerd is.\n\nJe voltooit het grootste deel van de inventarisatie in stilte, met af en toe een bevestiging.\n\nDeze stille, ordelijke samenwerking — je vindt het best prettig.`,

        de: `Handscanner. Physische Bestandsaufnahme. Zusammenarbeit mit Nora.\n\nDu nimmst den Scanner und probierst ihn aus. Einfache Bedienung — auf den Barcode zielen, drücken, auf das Ergebnis warten.\n\nNora beginnt Nummern vorzulesen. Du gehst zum Regal, findest die erste Akte, scannst. Übereinstimmung. Zweite. Übereinstimmung. Dritte — keine Übereinstimmung. Du prüfst den Eintrag. Falscher Standort. Du findest das richtige Fach, legst sie zurück, scannst erneut.\n\nDas Tempo ist gleichmäßig, jeder Schritt bestätigt. Nora ist effizient — sie muss kaum etwas nachschlagen, weil ihre Liste bereits organisiert ist.\n\nIhr erledigt den größten Teil der Inventur schweigend, mit gelegentlicher Bestätigung.\n\nDiese ruhige, geordnete Zusammenarbeit — du findest sie ziemlich angenehm.`,

        fr: `Scanner portable. Inventaire physique. Travailler avec Nora.\n\nTu prends le scanner et l'essaies. Fonctionnement simple — viser le code-barres, appuyer, attendre le résultat.\n\nNora commence à lire les numéros. Tu marches vers l'étagère, trouves le premier dossier, scannes. Correspondance. Deuxième. Correspondance. Troisième — pas de correspondance. Tu vérifies l'enregistrement. Mauvais emplacement. Tu trouves le bon compartiment, le remets, rescannes.\n\nLe rythme est régulier, chaque étape confirmée. Nora est efficace — elle a à peine besoin de chercher car sa liste est déjà organisée.\n\nVous complétez la majeure partie de l'inventaire en silence, échangeant une confirmation occasionnelle.\n\nCette collaboration calme et ordonnée — tu la trouves plutôt agréable.`,

        es: `Escáner portátil. Inventario físico. Trabajar con Nora.\n\nTomas el escáner y lo pruebas. Operación simple — apuntar al código de barras, presionar, esperar resultado.\n\nNora empieza a leer números. Caminas al estante, encuentras el primer archivo, escaneas. Coincidencia. Segundo. Coincidencia. Tercero — no coincide. Verificas el registro. Ubicación incorrecta. Encuentras el lugar correcto, lo devuelves, reescaneas.\n\nEl ritmo es constante, cada paso confirmado. Nora es eficiente — apenas necesita buscar porque su lista ya está organizada.\n\nCompletan la mayor parte del inventario en silencio, intercambiando una confirmación ocasional.\n\nEsta colaboración silenciosa y ordenada — la encuentras bastante agradable.`,

        pt: `Scanner portátil. Inventário físico. Trabalhando com Nora.\n\nVocê pega o scanner e experimenta. Operação simples — apontar para o código de barras, pressionar, esperar o resultado.\n\nNora começa a ler números. Você caminha até a prateleira, encontra o primeiro dossiê, escaneia. Correspondência. Segundo. Correspondência. Terceiro — não corresponde. Você verifica o registro. Localização errada. Encontra o lugar correto, devolve, escaneia novamente.\n\nO ritmo é constante, cada passo confirmado. Nora é eficiente — mal precisa consultar porque sua lista já está organizada.\n\nVocês completam a maior parte do inventário em silêncio, trocando uma confirmação ocasional.\n\nEssa colaboração silenciosa e ordenada — você a acha bastante agradável.`,

        it: `Scanner portatile. Inventario fisico. Lavorare con Nora.\n\nPrendi lo scanner e lo provi. Funzionamento semplice — puntare al codice a barre, premere, attendere il risultato.\n\nNora comincia a leggere numeri. Cammini verso lo scaffale, trovi il primo fascicolo, scannerizzi. Corrispondenza. Secondo. Corrispondenza. Terzo — nessuna corrispondenza. Controlli il record. Posizione sbagliata. Trovi lo slot corretto, lo rimetti, riscannerizzi.\n\nIl ritmo è costante, ogni passo confermato. Nora è efficiente — non ha quasi bisogno di cercare perché la sua lista è già organizzata.\n\nCompletate la maggior parte dell'inventario in silenzio, scambiando una conferma occasionale.\n\nQuesta collaborazione silenziosa e ordinata — la trovi piuttosto piacevole.`,

        ru: `Ручной сканер. Физическая инвентаризация. Работа с Норой.\n\nТы берёшь сканер и пробуешь. Простое управление — навести на штрих-код, нажать, ждать результат.\n\nНора начинает называть номера. Ты подходишь к полке, находишь первое дело, сканируешь. Совпадение. Второе. Совпадение. Третье — несовпадение. Проверяешь запись. Неправильное расположение. Находишь нужную ячейку, возвращаешь, сканируешь снова.\n\nТемп ровный, каждый шаг подтверждён. Нора эффективна — ей почти не нужно ничего искать, потому что её список уже организован.\n\nВы завершаете большую часть инвентаризации в тишине, лишь изредка обмениваясь подтверждениями.\n\nЭта тихая, упорядоченная совместная работа — тебе она нравится.`,

        ja: `ハンドヘルドスキャナー。実物棚卸し。ノラとの共同作業。\n\nスキャナーを手に取って試す。操作は簡単——バーコードに向けて、押して、結果を待つ。\n\nノラが番号を読み上げ始める。棚に向かい、最初のファイルを見つけ、スキャン。一致。2番目。一致。3番目——不一致。記録を確認する。場所が違う。正しいスロットを見つけ、戻し、再スキャン。\n\nペースは安定しており、一歩ごとに確認される。ノラは効率的だ——リストがすでに整理されているので、ほとんど調べる必要がない。\n\n棚卸しの大部分を沈黙の中で終える。時折確認を交わすだけだ。\n\nこの静かで秩序ある共同作業——なかなか心地いいと思う。`,

        ko: `핸드헬드 스캐너. 실물 재고조사. 노라와의 협업.\n\n스캐너를 집어 들고 시도한다. 간단한 조작 — 바코드에 겨냥, 누르기, 결과 대기.\n\n노라가 번호를 읽기 시작한다. 선반으로 걸어가 첫 번째 서류를 찾고 스캔한다. 일치. 두 번째. 일치. 세 번째 — 불일치. 기록을 확인한다. 잘못된 위치. 올바른 칸을 찾아 돌려놓고 다시 스캔한다.\n\n속도는 일정하고, 각 단계가 확인된다. 노라는 효율적이다 — 리스트가 이미 정리되어 있어 거의 찾아볼 필요가 없다.\n\n대부분의 재고조사를 침묵 속에서 완료하며, 가끔 확인만 주고받는다.\n\n이 조용하고 질서 있는 협업 — 꽤 괜찮다고 느낀다.`,
      },
      score3: {
        zh: `Nora 来了。扫描仪在桌上。逐一盘点。

你拿起扫描仪，开始操作。找档案、扫码、确认——流程是清楚的。但档案架上的东西很多，一份一份地盘点需要时间。

Nora 报编号的速度比你找档案的速度快一点。你有时候需要在架子上翻找一会儿才能定位到正确的那一份。

你在做，但过程不是特别流畅。有些地方你走了弯路——找错架子，扫错档案。Nora 没有催你，但她的效率给了你一些无形的压力。

盘点在进行中。不是最顺畅的体验，但在推进。`,

        en: `Nora's here. Scanner on the desk. Inventory one by one.\n\nYou pick up the scanner and start. Find file, scan, confirm — the process is clear. But the shelves hold a lot, and going through one by one takes time.\n\nNora reads numbers faster than you can locate files. Sometimes you need to search a shelf before finding the right one.\n\nYou're doing it, but the process isn't perfectly smooth. Some wrong turns — wrong shelf, wrong file. Nora doesn't rush you, but her efficiency creates unspoken pressure.\n\nInventory continues. Not the smoothest experience, but it's moving.`,

        nl: `Nora is er. Scanner op het bureau. Inventarisatie één voor één.\n\nJe pakt de scanner en begint. Dossier zoeken, scannen, bevestigen — het proces is duidelijk. Maar de planken zijn vol, en ze één voor één doorlopen kost tijd.\n\nNora leest nummers sneller voor dan jij dossiers kunt vinden. Soms moet je een plank doorzoeken voordat je de juiste vindt.\n\nJe doet het, maar het proces verloopt niet helemaal soepel. Wat verkeerde afslagen — verkeerde plank, verkeerd dossier. Nora jaagt je niet op, maar haar efficiëntie creëert onuitgesproken druk.\n\nDe inventarisatie gaat verder. Niet de soepelste ervaring, maar het vordert.`,

        de: `Nora ist da. Scanner auf dem Schreibtisch. Inventur Stück für Stück.\n\nDu nimmst den Scanner und fängst an. Akte finden, scannen, bestätigen — der Prozess ist klar. Aber die Regale sind voll, und einzeln durchzugehen braucht Zeit.\n\nNora liest Nummern schneller, als du Akten finden kannst. Manchmal musst du ein Regal durchsuchen, bevor du die richtige findest.\n\nDu machst es, aber der Ablauf ist nicht ganz reibungslos. Einige Fehlgriffe — falsches Regal, falsche Akte. Nora drängt dich nicht, aber ihre Effizienz erzeugt unausgesprochenen Druck.\n\nDie Inventur geht weiter. Nicht die reibungsloseste Erfahrung, aber es bewegt sich.`,

        fr: `Nora est là. Le scanner sur le bureau. Inventaire un par un.\n\nTu prends le scanner et commences. Trouver le dossier, scanner, confirmer — le processus est clair. Mais les étagères contiennent beaucoup, et les parcourir un par un prend du temps.\n\nNora lit les numéros plus vite que tu ne peux localiser les dossiers. Parfois tu dois fouiller une étagère avant de trouver le bon.\n\nTu le fais, mais le processus n'est pas parfaitement fluide. Quelques erreurs de parcours — mauvaise étagère, mauvais dossier. Nora ne te presse pas, mais son efficacité crée une pression tacite.\n\nL'inventaire continue. Pas l'expérience la plus fluide, mais ça avance.`,

        es: `Nora está aquí. Escáner sobre el escritorio. Inventario uno por uno.\n\nTomas el escáner y empiezas. Encontrar archivo, escanear, confirmar — el proceso es claro. Pero los estantes tienen mucho, y recorrerlos uno por uno lleva tiempo.\n\nNora lee números más rápido de lo que tú puedes localizar archivos. A veces necesitas buscar en un estante antes de encontrar el correcto.\n\nLo estás haciendo, pero el proceso no es perfectamente fluido. Algunos giros equivocados — estante equivocado, archivo equivocado. Nora no te apura, pero su eficiencia crea presión tácita.\n\nEl inventario continúa. No la experiencia más fluida, pero avanza.`,

        pt: `Nora está aqui. Scanner na mesa. Inventário um por um.\n\nVocê pega o scanner e começa. Encontrar dossiê, escanear, confirmar — o processo é claro. Mas as prateleiras estão cheias, e percorrer uma por uma leva tempo.\n\nNora lê números mais rápido do que você consegue localizar dossiês. Às vezes precisa vasculhar uma prateleira antes de encontrar o certo.\n\nVocê está fazendo, mas o processo não é perfeitamente fluido. Alguns desvios — prateleira errada, dossiê errado. Nora não te apressa, mas sua eficiência cria uma pressão tácita.\n\nO inventário continua. Não a experiência mais fluida, mas está andando.`,

        it: `Nora è qui. Scanner sulla scrivania. Inventario uno per uno.\n\nPrendi lo scanner e cominci. Trovare il fascicolo, scansionare, confermare — il processo è chiaro. Ma gli scaffali contengono molto, e percorrerli uno per uno richiede tempo.\n\nNora legge i numeri più velocemente di quanto tu riesca a localizzare i fascicoli. A volte devi cercare in uno scaffale prima di trovare quello giusto.\n\nLo stai facendo, ma il processo non è perfettamente fluido. Qualche svolta sbagliata — scaffale sbagliato, fascicolo sbagliato. Nora non ti mette fretta, ma la sua efficienza crea una pressione implicita.\n\nL'inventario continua. Non l'esperienza più fluida, ma procede.`,

        ru: `Нора здесь. Сканер на столе. Инвентаризация по одному.\n\nТы берёшь сканер и начинаешь. Найти дело, отсканировать, подтвердить — процесс понятен. Но полки вмещают много, и перебирать по одному требует времени.\n\nНора называет номера быстрее, чем ты находишь дела. Иногда приходится перебирать полку, прежде чем найти нужное.\n\nТы делаешь, но процесс не идеально гладкий. Пара промахов — не та полка, не то дело. Нора не торопит, но её эффективность создаёт невысказанное давление.\n\nИнвентаризация продолжается. Не самый гладкий опыт, но движется.`,

        ja: `ノラが来た。デスクの上にスキャナー。一つずつ棚卸し。\n\nスキャナーを手に取って始める。ファイルを見つけ、スキャンし、確認——プロセスは明確だ。だが棚には大量にあり、一つずつ進めるには時間がかかる。\n\nノラの番号読み上げの速度が、ファイルを探す速度より速い。正しいものを見つける前に棚を探し回ることもある。\n\nやっている。だがプロセスは完全にスムーズではない。間違いもある——違う棚、違うファイル。ノラは急かさないが、彼女の効率が無言のプレッシャーを生む。\n\n棚卸しは続く。最もスムーズな体験ではないが、進んでいる。`,

        ko: `노라가 왔다. 책상 위에 스캐너. 하나씩 재고조사.\n\n스캐너를 집어 들고 시작한다. 서류 찾기, 스캔, 확인 — 과정은 명확하다. 하지만 선반에 양이 많아 하나씩 진행하려면 시간이 걸린다.\n\n노라가 번호를 읽는 속도가 서류를 찾는 속도보다 빠르다. 때로는 올바른 것을 찾기 전에 선반을 뒤져야 한다.\n\n하고 있지만, 과정이 완벽히 매끄럽지는 않다. 몇 가지 실수 — 잘못된 선반, 잘못된 서류. 노라는 재촉하지 않지만, 그녀의 효율성이 무언의 압박을 만든다.\n\n재고조사가 계속된다. 가장 매끄러운 경험은 아니지만, 진행되고 있다.`,
      },
      score2: {
        zh: `逐一盘点。手持扫描仪。每份档案。

你拿起扫描仪，扫了几份。流程你懂了，但工作量让你有些退缩——那些档案架从地板到天花板，密密麻麻。

你扫了十几份之后，开始放慢速度。不是因为累——是因为这种逐一扫描、逐一确认的重复性工作，对你来说缺少吸引力。

Nora 看了你一眼，没有说什么。她继续翻着她的清单。`,

        en: `One-by-one inventory. Handheld scanner. Every file.\n\nYou pick up the scanner and scan a dozen or so. You understand the process, but the volume makes you pull back — shelves stretching floor to ceiling, packed tight.\n\nAfter a dozen, you start slowing. Not from fatigue — because this repetitive scan-and-confirm work lacks appeal.\n\nNora glances at you, says nothing. She keeps turning pages of her checklist.`,

        nl: `Inventarisatie één voor één. Handscanner. Elk dossier.\n\nJe pakt de scanner en scant een stuk of tien. Je begrijpt het proces, maar de hoeveelheid doet je terugdeinzen — planken van vloer tot plafond, volgepakt.\n\nNa een tiental begin je te vertragen. Niet door vermoeidheid — maar omdat dit repetitieve scan-en-bevestig-werk weinig aantrekkingskracht heeft.\n\nNora kijkt je even aan, zegt niets. Ze blijft pagina's van haar checklist omslaan.`,

        de: `Einzelinventur. Handscanner. Jede Akte.\n\nDu nimmst den Scanner und scannst etwa ein Dutzend. Du verstehst den Prozess, aber die Menge lässt dich zurückschrecken — Regale vom Boden bis zur Decke, dicht gepackt.\n\nNach einem Dutzend wirst du langsamer. Nicht vor Müdigkeit — weil diese wiederholende Scan-und-Bestätigen-Arbeit keinen Reiz hat.\n\nNora wirft dir einen Blick zu, sagt nichts. Sie blättert weiter in ihrer Checkliste.`,

        fr: `Inventaire un par un. Scanner portable. Chaque dossier.\n\nTu prends le scanner et en scannes une douzaine. Tu comprends le processus, mais le volume te fait reculer — des étagères du sol au plafond, serrées.\n\nAprès une douzaine, tu ralentis. Pas par fatigue — parce que ce travail répétitif de scan et confirmation manque d'attrait.\n\nNora te jette un coup d'œil, ne dit rien. Elle continue de tourner les pages de sa liste.`,

        es: `Inventario uno por uno. Escáner portátil. Cada archivo.\n\nTomas el escáner y escaneas una docena más o menos. Entiendes el proceso, pero el volumen te hace retroceder — estantes del suelo al techo, apretados.\n\nDespués de una docena, empiezas a ralentizar. No por fatiga — porque este trabajo repetitivo de escanear y confirmar carece de atractivo.\n\nNora te mira, no dice nada. Sigue pasando páginas de su lista.`,

        pt: `Inventário um por um. Scanner portátil. Cada dossiê.\n\nVocê pega o scanner e escaneia cerca de uma dúzia. Entende o processo, mas o volume faz você recuar — prateleiras do chão ao teto, compactadas.\n\nDepois de uma dúzia, começa a desacelerar. Não por cansaço — porque esse trabalho repetitivo de escanear e confirmar não tem apelo.\n\nNora olha para você, não diz nada. Continua virando páginas de sua lista.`,

        it: `Inventario uno per uno. Scanner portatile. Ogni fascicolo.\n\nPrendi lo scanner e ne scannerizzi una dozzina circa. Capisci il processo, ma il volume ti fa arretrare — scaffali dal pavimento al soffitto, fitti.\n\nDopo una dozzina, cominci a rallentare. Non per stanchezza — perché questo lavoro ripetitivo di scansionare e confermare manca di attrattiva.\n\nNora ti lancia un'occhiata, non dice nulla. Continua a sfogliare la sua checklist.`,

        ru: `Инвентаризация по одному. Ручной сканер. Каждое дело.\n\nТы берёшь сканер и сканируешь с десяток. Процесс понятен, но объём заставляет отступить — полки от пола до потолка, плотно заставлены.\n\nПосле десятка начинаешь замедляться. Не от усталости — потому что эта повторяющаяся работа «скан-подтверждение» лишена привлекательности.\n\nНора бросает на тебя взгляд, ничего не говорит. Продолжает листать свой список.`,

        ja: `一つずつ棚卸し。ハンドヘルドスキャナー。すべてのファイル。\n\nスキャナーを手に取り、十数件スキャンする。プロセスは分かったが、その量に気が引ける——床から天井まで、ぎっしり詰まった棚。\n\n十数件後、ペースが落ち始める。疲れたからではない——この反復的なスキャンと確認の作業に魅力がないからだ。\n\nノラがちらりとこちらを見る。何も言わない。チェックリストのページをめくり続けている。`,

        ko: `하나씩 재고조사. 핸드헬드 스캐너. 모든 서류.\n\n스캐너를 집어 들고 십여 개를 스캔한다. 과정은 이해했지만, 그 양에 주춤한다 — 바닥부터 천장까지 빽빽한 선반.\n\n십여 개 후 속도가 느려지기 시작한다. 피로 때문이 아니라 — 이 반복적인 스캔과 확인 작업에 매력이 없기 때문이다.\n\n노라가 한번 쳐다보고 아무 말 하지 않는다. 계속 체크리스트 페이지를 넘기고 있다.`,
      },
      score1: {
        zh: `扫描仪在桌上。档案架在面前。Nora 在等着。

你看了看那台设备，又看了看那些密密麻麻的档案。

逐一盘点。每一份都要扫、确认、核对。这种工作的本质是：重复。精确的重复。长时间的精确重复。

你拿起了扫描仪，但你的心不在这里。你在心里计算还剩多少步骤——就一步了。

你想做完这最后一章。但不是通过这种方式。`,

        en: `Scanner on the desk. Shelves before you. Nora is waiting.\n\nYou look at the device, then at the dense rows of files.\n\nOne-by-one inventory. Each one scanned, confirmed, checked. The essence of this work is: repetition. Precise repetition. Extended precise repetition.\n\nYou pick up the scanner, but your heart isn't in it. Mentally you calculate how many steps remain — just one more.\n\nYou want to finish this final chapter. But not through this.`,

        nl: `Scanner op het bureau. Planken voor je. Nora wacht.\n\nJe kijkt naar het apparaat, dan naar de dichte rijen dossiers.\n\nInventarisatie één voor één. Elk gescand, bevestigd, gecontroleerd. De essentie van dit werk is: herhaling. Precieze herhaling. Langdurige precieze herhaling.\n\nJe pakt de scanner op, maar je hart is er niet bij. In gedachten bereken je hoeveel stappen er nog zijn — nog maar één.\n\nJe wilt dit laatste hoofdstuk afronden. Maar niet op deze manier.`,

        de: `Scanner auf dem Schreibtisch. Regale vor dir. Nora wartet.\n\nDu schaust auf das Gerät, dann auf die dichten Reihen von Akten.\n\nEinzelinventur. Jede gescannt, bestätigt, geprüft. Das Wesen dieser Arbeit ist: Wiederholung. Präzise Wiederholung. Langanhaltende präzise Wiederholung.\n\nDu nimmst den Scanner, aber dein Herz ist nicht dabei. Im Kopf rechnest du, wie viele Schritte noch bleiben — nur noch einer.\n\nDu willst dieses letzte Kapitel abschließen. Aber nicht so.`,

        fr: `Scanner sur le bureau. Étagères devant toi. Nora attend.\n\nTu regardes l'appareil, puis les rangées denses de dossiers.\n\nInventaire un par un. Chacun scanné, confirmé, vérifié. L'essence de ce travail est : la répétition. La répétition précise. La répétition précise prolongée.\n\nTu prends le scanner, mais ton cœur n'y est pas. Mentalement, tu calcules combien d'étapes restent — juste une de plus.\n\nTu veux terminer ce dernier chapitre. Mais pas de cette façon.`,

        es: `Escáner sobre el escritorio. Estantes frente a ti. Nora espera.\n\nMiras el dispositivo, luego las filas densas de archivos.\n\nInventario uno por uno. Cada uno escaneado, confirmado, verificado. La esencia de este trabajo es: repetición. Repetición precisa. Repetición precisa prolongada.\n\nTomas el escáner, pero tu corazón no está en ello. Mentalmente calculas cuántos pasos quedan — solo uno más.\n\nQuieres terminar este último capítulo. Pero no así.`,

        pt: `Scanner na mesa. Prateleiras diante de você. Nora está esperando.\n\nVocê olha para o dispositivo, depois para as fileiras densas de dossiês.\n\nInventário um por um. Cada um escaneado, confirmado, verificado. A essência deste trabalho é: repetição. Repetição precisa. Repetição precisa prolongada.\n\nVocê pega o scanner, mas seu coração não está nisso. Mentalmente calcula quantos passos restam — só mais um.\n\nVocê quer terminar este capítulo final. Mas não assim.`,

        it: `Scanner sulla scrivania. Scaffali davanti a te. Nora aspetta.\n\nGuardi il dispositivo, poi le file fitte di fascicoli.\n\nInventario uno per uno. Ognuno scansionato, confermato, controllato. L'essenza di questo lavoro è: ripetizione. Ripetizione precisa. Ripetizione precisa prolungata.\n\nPrendi lo scanner, ma il tuo cuore non c'è. Mentalmente calcoli quanti passaggi restano — solo uno in più.\n\nVuoi finire quest'ultimo capitolo. Ma non così.`,

        ru: `Сканер на столе. Полки перед тобой. Нора ждёт.\n\nТы смотришь на устройство, потом на плотные ряды дел.\n\nИнвентаризация по одному. Каждое отсканировано, подтверждено, проверено. Суть этой работы: повторение. Точное повторение. Длительное точное повторение.\n\nТы берёшь сканер, но душа не лежит. Мысленно считаешь, сколько шагов осталось — всего один.\n\nТы хочешь завершить эту последнюю главу. Но не таким путём.`,

        ja: `デスクの上にスキャナー。目の前に棚。ノラが待っている。\n\nデバイスを見て、それから密集したファイルの列を見る。\n\n一つずつ棚卸し。すべてスキャンし、確認し、チェックする。この作業の本質は：反復。正確な反復。長時間の正確な反復。\n\nスキャナーを手に取るが、気持ちが入らない。残りのステップを心の中で数える——あと1つだけ。\n\nこの最後の章を終えたい。だが、このやり方ではなく。`,

        ko: `책상 위의 스캐너. 눈앞의 선반. 노라가 기다리고 있다.\n\n장치를 보고, 빽빽한 서류 행렬을 본다.\n\n하나씩 재고조사. 각각 스캔하고, 확인하고, 점검한다. 이 작업의 본질은: 반복. 정밀한 반복. 장시간의 정밀한 반복.\n\n스캐너를 집어 들지만, 마음이 담기지 않는다. 남은 단계가 몇 개인지 머릿속으로 계산한다 — 딱 하나.\n\n이 마지막 장을 끝내고 싶다. 하지만 이 방법으로는 아니다.`,
      },
    },
  },

  {
    id: 30,
    riasec: "C",
    miniIpCode: "C5",
    miniIpItem: "Stamp, sort, and distribute mail for an organization",
    chapter: "archive",
    chapterIndex: 6,
    questionInChapter: 5,
    isClimax: false,
    scene: {
      zh: `盘点完成。系统确认：所有档案实物与记录一致。

Nora 合上了本子。她看了你一眼，什么都没说，走向了她的出口。

你面前还剩最后一件事。

出口旁的桌上，堆着一大摞刚整理好的文件——通知函、调阅回执、归档确认单、跨部门的协调备忘。档案室恢复运作后，这些文件需要被盖章、分类、投递到对应的收件格里。

墙上挂着一张分发图：每个格子对应一个部门或楼层，有明确的编号和路由规则。桌上有日期戳、部门章、一叠信封。

屏幕提示：「系统恢复步骤五：文件分发。将所有待发文件逐一盖章、按部门分拣、投入对应的收件格。确保每一份文件到达正确的目的地。」

这是最后一步。让这些信息流动起来——从档案室，到它们应该去的地方。`,

      en: `Inventory complete. System confirms: all physical files match their records.\n\nNora closes her notebook. She looks at you, says nothing, walks toward her exit.\n\nOne last thing in front of you.\n\nOn the table by the exit, a large stack of freshly organized documents — notification letters, retrieval receipts, archival confirmations, interdepartmental coordination memos. Now that the archive is operational again, these documents need to be stamped, sorted, and delivered to the correct mailboxes.\n\nA distribution chart hangs on the wall: each slot corresponds to a department or floor, with clear numbers and routing rules. On the desk: date stamps, department seals, a stack of envelopes.\n\nThe screen prompts: "System Restoration Step Five: Document Distribution. Stamp each outgoing document, sort by department, place into the correct mailbox. Ensure every document reaches its proper destination."\n\nThis is the final step. Get this information flowing — from the archive, to where it needs to go.`,

      nl: `Inventarisatie voltooid. Systeem bevestigt: alle fysieke dossiers komen overeen met hun registraties.\n\nNora sluit haar notitieboekje. Ze kijkt je aan, zegt niets en loopt naar haar uitgang.\n\nEr is nog één ding voor je.\n\nOp de tafel bij de uitgang ligt een grote stapel net geordende documenten — kennisgevingsbrieven, ophaalbewijzen, archiveringsbevestigingen, interdepartementale coördinatiememo's. Nu het archief weer operationeel is, moeten deze documenten worden gestempeld, gesorteerd en in de juiste postvakken bezorgd.\n\nAan de muur hangt een distributieschema: elk vakje correspondeert met een afdeling of verdieping, met duidelijke nummers en routeringsregels. Op het bureau liggen datumstempels, afdelingsstempels, een stapel enveloppen.\n\nHet scherm meldt: "Systeemherstel Stap Vijf: Documentdistributie. Stempel elk uitgaand document, sorteer per afdeling en plaats in het juiste postvak. Zorg ervoor dat elk document zijn juiste bestemming bereikt."\n\nDit is de laatste stap. Laat deze informatie stromen — van het archief, naar waar het heen moet.`,

      de: `Inventur abgeschlossen. System bestätigt: Alle physischen Akten stimmen mit ihren Einträgen überein.\n\nNora schließt ihr Notizbuch. Sie sieht dich an, sagt nichts und geht zu ihrem Ausgang.\n\nNoch eine letzte Sache vor dir.\n\nAuf dem Tisch neben dem Ausgang liegt ein großer Stapel frisch sortierter Dokumente — Benachrichtigungsschreiben, Entnahmebelege, Archivierungsbestätigungen, abteilungsübergreifende Koordinationsvermerke. Da das Archiv wieder betriebsbereit ist, müssen diese Dokumente gestempelt, sortiert und in die richtigen Postfächer gelegt werden.\n\nAn der Wand hängt ein Verteilungsplan: Jedes Fach entspricht einer Abteilung oder Etage, mit klaren Nummern und Zustellregeln. Auf dem Schreibtisch liegen Datumsstempel, Abteilungsstempel, ein Stapel Umschläge.\n\nDer Bildschirm zeigt an: „Systemwiederherstellung Schritt Fünf: Dokumentverteilung. Stempeln Sie jedes ausgehende Dokument, sortieren Sie nach Abteilung und legen Sie es in das richtige Postfach. Stellen Sie sicher, dass jedes Dokument sein Ziel erreicht."\n\nDas ist der letzte Schritt. Bringe diese Informationen in Fluss — vom Archiv dorthin, wo sie hingehören.`,

      fr: `Inventaire terminé. Le système confirme : tous les dossiers physiques correspondent à leurs enregistrements.\n\nNora ferme son carnet. Elle te regarde, ne dit rien et se dirige vers sa sortie.\n\nUne dernière chose devant toi.\n\nSur la table près de la sortie, une grande pile de documents fraîchement organisés — lettres de notification, accusés de réception, confirmations d'archivage, mémos de coordination interdépartementale. Maintenant que les archives sont de nouveau opérationnelles, ces documents doivent être tamponnés, triés et distribués dans les bonnes boîtes aux lettres.\n\nUn tableau de distribution est accroché au mur : chaque case correspond à un département ou un étage, avec des numéros et des règles de routage clairs. Sur le bureau, des tampons de date, des cachets de département, une pile d'enveloppes.\n\nL'écran indique : « Restauration du Système, Étape Cinq : Distribution des Documents. Tamponnez chaque document sortant, triez par département et placez dans la boîte aux lettres correspondante. Assurez-vous que chaque document atteigne sa destination. »\n\nC'est la dernière étape. Fais circuler cette information — des archives vers là où elle doit aller.`,

      es: `Inventario completo. El sistema confirma: todos los archivos físicos coinciden con sus registros.\n\nNora cierra su cuaderno. Te mira, no dice nada y camina hacia su salida.\n\nUna última cosa frente a ti.\n\nSobre la mesa junto a la salida, una gran pila de documentos recién organizados — cartas de notificación, acuses de recibo, confirmaciones de archivo, memorandos de coordinación interdepartamental. Ahora que el archivo vuelve a funcionar, estos documentos necesitan ser sellados, clasificados y entregados en las casillas correctas.\n\nEn la pared hay un diagrama de distribución: cada casilla corresponde a un departamento o piso, con números claros y reglas de enrutamiento. En el escritorio hay sellos de fecha, sellos departamentales, una pila de sobres.\n\nLa pantalla indica: "Restauración del Sistema, Paso Cinco: Distribución de Documentos. Sella cada documento saliente, clasifica por departamento y coloca en la casilla correcta. Asegura que cada documento llegue a su destino."\n\nEste es el paso final. Haz que esta información fluya — del archivo, hacia donde necesita ir.`,

      pt: `Inventário completo. Sistema confirma: todos os dossiês físicos correspondem aos seus registros.\n\nNora fecha seu caderno. Olha para você, não diz nada e caminha em direção à sua saída.\n\nUma última coisa diante de você.\n\nNa mesa junto à saída, uma grande pilha de documentos recém-organizados — cartas de notificação, recibos de retirada, confirmações de arquivamento, memorandos de coordenação interdepartamental. Agora que o arquivo está operacional novamente, esses documentos precisam ser carimbados, classificados e entregues nas caixas de correio corretas.\n\nUm quadro de distribuição está pendurado na parede: cada escaninho corresponde a um departamento ou andar, com números claros e regras de roteamento. Na mesa, carimbos de data, carimbos departamentais, uma pilha de envelopes.\n\nA tela indica: "Restauração do Sistema, Passo Cinco: Distribuição de Documentos. Carimbe cada documento de saída, classifique por departamento e coloque no escaninho correto. Garanta que cada documento chegue ao destino certo."\n\nEste é o passo final. Faça essa informação circular — do arquivo, para onde precisa ir.`,

      it: `Inventario completato. Il sistema conferma: tutti i fascicoli fisici corrispondono ai loro record.\n\nNora chiude il taccuino. Ti guarda, non dice nulla e si dirige verso la sua uscita.\n\nUn'ultima cosa davanti a te.\n\nSul tavolo vicino all'uscita, una grande pila di documenti appena organizzati — lettere di notifica, ricevute di prelievo, conferme di archiviazione, promemoria di coordinamento interdipartimentale. Ora che l'archivio è di nuovo operativo, questi documenti devono essere timbrati, smistati e consegnati nelle caselle postali corrette.\n\nUna mappa di distribuzione è appesa alla parete: ogni casella corrisponde a un reparto o piano, con numeri chiari e regole di instradamento. Sulla scrivania, timbri con data, timbri di reparto, una pila di buste.\n\nLo schermo indica: "Ripristino del Sistema, Fase Cinque: Distribuzione Documenti. Timbra ogni documento in uscita, smista per reparto e inserisci nella casella postale corretta. Assicurati che ogni documento raggiunga la destinazione giusta."\n\nQuesto è l'ultimo passaggio. Fai circolare queste informazioni — dall'archivio, verso dove devono andare.`,

      ru: `Инвентаризация завершена. Система подтверждает: все физические дела соответствуют своим записям.\n\nНора закрывает блокнот. Смотрит на тебя, ничего не говорит и идёт к своему выходу.\n\nПеред тобой последнее дело.\n\nНа столе у выхода — большая стопка только что упорядоченных документов: уведомительные письма, квитанции о выдаче, подтверждения архивирования, межведомственные координационные записки. Теперь, когда архив снова работает, эти документы нужно проштамповать, рассортировать и разложить по нужным ячейкам.\n\nНа стене висит схема рассылки: каждая ячейка соответствует отделу или этажу, с чёткими номерами и правилами маршрутизации. На столе — штампы с датой, ведомственные печати, стопка конвертов.\n\nНа экране: «Восстановление системы, Шаг пятый: Рассылка документов. Проштампуйте каждый исходящий документ, рассортируйте по отделам и вложите в соответствующую ячейку. Убедитесь, что каждый документ дойдёт до правильного адресата.»\n\nЭто последний шаг. Пусть эта информация начнёт движение — из архива туда, куда ей нужно.`,

      ja: `棚卸し完了。システム確認：すべての実物ファイルが記録と一致している。\n\nノラがノートを閉じる。あなたを見て、何も言わず、自分の出口に向かって歩いていく。\n\n目の前に最後の一つが残っている。\n\n出口横のテーブルに、整理されたばかりの大量の書類が積まれている——通知状、取り出し受領書、アーカイブ確認書、部門間調整メモ。アーカイブが再稼働した今、これらの書類にスタンプを押し、分類し、正しいメールボックスに届ける必要がある。\n\n壁に配送図が掛かっている：各スロットが部門やフロアに対応し、明確な番号とルーティングルールがある。デスクには日付スタンプ、部門印、封筒の束。\n\nスクリーンの指示：「システム復旧ステップ5：書類配布。各送付書類にスタンプを押し、部門別に仕分けし、正しいメールボックスに投函せよ。すべての書類が正しい宛先に届くことを確認せよ。」\n\nこれが最後のステップ。この情報を流し始める——アーカイブから、届くべき場所へ。`,

      ko: `재고조사 완료. 시스템 확인: 모든 실물 서류가 기록과 일치한다.\n\n노라가 노트를 닫는다. 당신을 보고, 아무 말 없이, 자신의 출구를 향해 걸어간다.\n\n눈앞에 마지막 한 가지가 남아 있다.\n\n출구 옆 테이블 위에 막 정리된 서류 더미가 쌓여 있다 — 통지서, 인출 영수증, 보관 확인서, 부서 간 조율 메모. 기록보관실이 다시 가동되면서, 이 서류들에 도장을 찍고, 분류하고, 올바른 수신함에 넣어야 한다.\n\n벽에 배분도가 걸려 있다: 각 칸이 부서나 층에 대응하며, 명확한 번호와 라우팅 규칙이 있다. 책상 위에는 날짜 도장, 부서 인장, 봉투 묶음.\n\n화면 안내: "시스템 복구 5단계: 문서 배분. 각 발송 문서에 도장을 찍고, 부서별로 분류하고, 올바른 수신함에 넣으라. 모든 문서가 올바른 목적지에 도달하도록 하라."\n\n이것이 마지막 단계. 이 정보가 흐르게 하라 — 기록보관실에서, 가야 할 곳으로.`,
    },
    taskDescription: {
      zh: "将所有待发文件逐一盖章、按部门分拣、投入对应的收件格——确保每一份文件到达正确的目的地。这是最后一步。",

      en: `Stamp, sort, and distribute all outgoing documents — organize by department, place each into the correct mailbox, ensuring every document reaches its proper destination. This is the final step.`,

      nl: `Stempel, sorteer en distribueer alle uitgaande documenten — organiseer per afdeling, plaats elk in het juiste postvak en zorg ervoor dat elk document zijn bestemming bereikt. Dit is de laatste stap.`,

      de: `Stempeln, sortieren und verteilen Sie alle ausgehenden Dokumente — ordnen Sie nach Abteilung, legen Sie jedes in das richtige Postfach und stellen Sie sicher, dass jedes Dokument sein Ziel erreicht. Dies ist der letzte Schritt.`,

      fr: `Tamponne, trie et distribue tous les documents sortants — organise par département, place chacun dans la bonne boîte aux lettres, en t'assurant que chaque document atteigne sa destination. C'est la dernière étape.`,

      es: `Sella, clasifica y distribuye todos los documentos salientes — organiza por departamento, coloca cada uno en la casilla correcta, asegurando que cada documento llegue a su destino. Este es el paso final.`,

      pt: `Carimbe, classifique e distribua todos os documentos de saída — organize por departamento, coloque cada um no escaninho correto, garantindo que cada documento chegue ao destino certo. Este é o passo final.`,

      it: `Timbra, smista e distribuisci tutti i documenti in uscita — organizza per reparto, inserisci ciascuno nella casella postale corretta, assicurandoti che ogni documento raggiunga la giusta destinazione. Questo è il passaggio finale.`,

      ru: `Проштампуйте, рассортируйте и разошлите все исходящие документы — распределите по отделам, вложите каждый в нужную ячейку, убедившись, что каждый документ дойдёт до правильного адресата. Это последний шаг.`,

      ja: `すべての送付書類にスタンプを押し、仕分けし、配布せよ——部門別に整理し、各書類を正しいメールボックスに投函し、すべてが正しい宛先に届くことを確認する。これが最後のステップだ。`,

      ko: `모든 발송 문서에 도장을 찍고, 분류하고, 배분하라 — 부서별로 정리하고, 각각을 올바른 수신함에 넣어, 모든 문서가 올바른 목적지에 도달하도록 하라. 이것이 마지막 단계다.`,
    },
    mirrorFeedback: {
      score5: {
        zh: `一大摞文件。分发图。日期戳和部门章。

你拿起第一份文件——一封调阅回执。你查看分发图：三楼，资料管理部，格子编号 3-07。盖上日期戳，压上部门章，装入信封，投入 3-07。

下一份。跨部门协调备忘。两个收件方——你各复印了一份，分别盖章，分别投递。

这种工作有一种流水线般的节奏感：阅读、判断、盖章、分拣、投递。每一份文件都是一个小小的路由决策——不能送错，不能遗漏。

文件一份一份减少。收件格一个一个被填满。你的动作越来越流畅，但判断从未变得马虎。

最后一份投递完毕。所有文件都到了它们该去的地方。档案室的信息，重新开始流动了。

你走向出口。门的另一边是一面镜子——落地的，大到可以照见你整个人。

镜子的左下角，有几行字：

「你一直在选。不是选对错。是选你自己。」

字的旁边有一个印章。和邀请函上的那个，一模一样。

你看着镜子里的自己。六层空间，三十个选择。每一个选择都不是对错——是你。

你深吸一口气，推开了最后的门。`,

        en: `A big stack of documents. The distribution chart. Date stamps and department seals.\n\nYou pick up the first document — a retrieval receipt. You check the chart: third floor, Records Management, slot 3-07. Date stamp, department seal, into the envelope, into slot 3-07.\n\nNext. An interdepartmental coordination memo. Two recipients — you make a copy for each, stamp both, deliver both.\n\nThis work has an assembly-line rhythm: read, decide, stamp, sort, deliver. Each document is a small routing decision — no wrong deliveries, no omissions.\n\nThe stack shrinks one by one. Mailboxes fill up one by one. Your movements grow more fluid, but your judgment never gets sloppy.\n\nLast document delivered. Every piece of paper has reached where it needs to be. The archive's information is flowing again.\n\nYou walk toward the exit. On the other side is a mirror — floor-to-ceiling, large enough to reflect all of you.\n\nIn the mirror's lower left corner, a few lines of text, as if handwritten:\n\n"You've been choosing all along. Not between right and wrong. Between you and yourself."\n\nBeside the words, a seal. Identical to the one on the invitation letter.\n\nYou look at yourself in the mirror. Six floors, thirty choices. None of them were about right or wrong — they were about you.\n\nYou take a deep breath and push open the final door.`,

        nl: `Een grote stapel documenten. Het distributieschema. Datumstempels en afdelingsstempels.\n\nJe pakt het eerste document — een ophaalbewijs. Je controleert het schema: derde verdieping, Dossierbeheer, vak 3-07. Datumstempel, afdelingsstempel, in de envelop, in vak 3-07.\n\nVolgende. Een interdepartementaal coördinatiememo. Twee ontvangers — je maakt van elk een kopie, stempelt beide, bezorgt beide.\n\nDit werk heeft een lopendebandritme: lezen, beslissen, stempelen, sorteren, bezorgen. Elk document is een kleine routeringsbeslissing — geen verkeerde bezorging, geen omissies.\n\nDe stapel slinkt één voor één. Postvakken vullen zich één voor één. Je bewegingen worden vloeiender, maar je oordeel wordt nooit slordig.\n\nLaatste document bezorgd. Elk stuk papier is waar het moet zijn. De informatie van het archief stroomt weer.\n\nJe loopt naar de uitgang. Aan de andere kant staat een spiegel — van vloer tot plafond, groot genoeg om je helemaal te weerspiegelen.\n\nIn de linkeronderhoek van de spiegel, een paar regels tekst, alsof met de hand geschreven:\n\n"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."\n\nNaast de woorden, een zegel. Identiek aan die op de uitnodigingsbrief.\n\nJe kijkt naar jezelf in de spiegel. Zes verdiepingen, dertig keuzes. Geen ervan ging over goed of fout — ze gingen over jou.\n\nJe haalt diep adem en duwt de laatste deur open.`,

        de: `Ein großer Stapel Dokumente. Der Verteilungsplan. Datumsstempel und Abteilungsstempel.\n\nDu nimmst das erste Dokument — einen Entnahmebeleg. Du prüfst den Plan: dritter Stock, Aktenverwaltung, Fach 3-07. Datumsstempel, Abteilungsstempel, in den Umschlag, in Fach 3-07.\n\nWeiter. Ein abteilungsübergreifender Koordinationsvermerk. Zwei Empfänger — du erstellst je eine Kopie, stempelst beide, lieferst beide.\n\nDiese Arbeit hat einen Fließband-Rhythmus: lesen, entscheiden, stempeln, sortieren, zustellen. Jedes Dokument ist eine kleine Zustellentscheidung — keine Fehllieferung, kein Versäumnis.\n\nDer Stapel schrumpft Stück für Stück. Postfächer füllen sich eines nach dem anderen. Deine Bewegungen werden flüssiger, aber dein Urteil wird nie nachlässig.\n\nLetztes Dokument zugestellt. Jedes Blatt Papier ist dort angekommen, wo es hingehört. Die Informationen des Archivs fließen wieder.\n\nDu gehst zum Ausgang. Auf der anderen Seite ein Spiegel — vom Boden bis zur Decke, groß genug, um dich ganz zu reflektieren.\n\nIn der unteren linken Ecke des Spiegels, ein paar handschriftliche Zeilen:\n\n„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."\n\nNeben den Worten ein Siegel. Identisch mit dem auf dem Einladungsschreiben.\n\nDu betrachtest dich im Spiegel. Sechs Stockwerke, dreißig Entscheidungen. Keine davon ging um richtig oder falsch — sie handelten von dir.\n\nDu atmest tief ein und stößt die letzte Tür auf.`,

        fr: `Une grande pile de documents. Le tableau de distribution. Tampons de date et cachets de département.\n\nTu prends le premier document — un accusé de réception de prélèvement. Tu consultes le tableau : troisième étage, Gestion des Dossiers, case 3-07. Tampon de date, cachet de département, dans l'enveloppe, dans la case 3-07.\n\nSuivant. Un mémo de coordination interdépartementale. Deux destinataires — tu fais une copie pour chacun, tamponnes les deux, distribues les deux.\n\nCe travail a un rythme de chaîne de montage : lire, décider, tamponner, trier, distribuer. Chaque document est une petite décision de routage — pas d'erreur de livraison, pas d'omission.\n\nLa pile diminue un par un. Les boîtes aux lettres se remplissent une par une. Tes gestes deviennent plus fluides, mais ton jugement ne devient jamais négligent.\n\nDernier document distribué. Chaque feuille est arrivée là où elle devait aller. L'information des archives circule à nouveau.\n\nTu marches vers la sortie. De l'autre côté, un miroir — du sol au plafond, assez grand pour te refléter tout entier.\n\nDans le coin inférieur gauche du miroir, quelques lignes de texte, comme écrites à la main :\n\n« Tu as choisi tout du long. Pas entre bien et mal. Entre toi et toi-même. »\n\nÀ côté des mots, un sceau. Identique à celui de la lettre d'invitation.\n\nTu te regardes dans le miroir. Six étages, trente choix. Aucun ne concernait le bien ou le mal — ils te concernaient, toi.\n\nTu inspires profondément et pousses la dernière porte.`,

        es: `Una gran pila de documentos. El diagrama de distribución. Sellos de fecha y sellos departamentales.\n\nTomas el primer documento — un acuse de recibo de consulta. Revisas el diagrama: tercer piso, Gestión de Registros, casilla 3-07. Sello de fecha, sello departamental, al sobre, a la casilla 3-07.\n\nSiguiente. Un memorando de coordinación interdepartamental. Dos destinatarios — haces una copia para cada uno, sellas ambas, entregas ambas.\n\nEste trabajo tiene un ritmo de línea de montaje: leer, decidir, sellar, clasificar, entregar. Cada documento es una pequeña decisión de enrutamiento — sin entregas erróneas, sin omisiones.\n\nLa pila disminuye uno por uno. Las casillas se llenan una por una. Tus movimientos se vuelven más fluidos, pero tu juicio nunca se descuida.\n\nÚltimo documento entregado. Cada papel ha llegado donde necesita estar. La información del archivo vuelve a fluir.\n\nCaminas hacia la salida. Al otro lado hay un espejo — del suelo al techo, lo suficientemente grande como para reflejarte por completo.\n\nEn la esquina inferior izquierda del espejo, unas líneas de texto, como escritas a mano:\n\n"Has estado eligiendo todo el tiempo. No entre bien y mal. Entre tú y tú mismo."\n\nJunto a las palabras, un sello. Idéntico al de la carta de invitación.\n\nTe miras en el espejo. Seis pisos, treinta elecciones. Ninguna fue sobre bien o mal — fueron sobre ti.\n\nRespiras hondo y empujas la última puerta.`,

        pt: `Uma grande pilha de documentos. O quadro de distribuição. Carimbos de data e carimbos departamentais.\n\nVocê pega o primeiro documento — um recibo de retirada. Confere o quadro: terceiro andar, Gestão de Registros, escaninho 3-07. Carimbo de data, carimbo departamental, no envelope, no escaninho 3-07.\n\nPróximo. Um memorando de coordenação interdepartamental. Dois destinatários — você faz uma cópia para cada, carimba ambos, entrega ambos.\n\nEsse trabalho tem um ritmo de linha de montagem: ler, decidir, carimbar, classificar, entregar. Cada documento é uma pequena decisão de roteamento — sem entregas erradas, sem omissões.\n\nA pilha diminui um por um. Os escaninhos se preenchem um por um. Seus movimentos ficam mais fluidos, mas seu julgamento nunca fica desleixado.\n\nÚltimo documento entregue. Cada papel chegou onde precisava estar. A informação do arquivo está fluindo novamente.\n\nVocê caminha para a saída. Do outro lado, um espelho — do chão ao teto, grande o suficiente para refletir todo você.\n\nNo canto inferior esquerdo do espelho, algumas linhas de texto, como se manuscritas:\n\n"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."\n\nAo lado das palavras, um selo. Idêntico ao da carta-convite.\n\nVocê se olha no espelho. Seis andares, trinta escolhas. Nenhuma era sobre certo ou errado — eram sobre você.\n\nVocê respira fundo e empurra a última porta.`,

        it: `Una grande pila di documenti. La mappa di distribuzione. Timbri con data e timbri di reparto.\n\nPrendi il primo documento — una ricevuta di prelievo. Controlli la mappa: terzo piano, Gestione Archivi, casella 3-07. Timbro data, timbro reparto, nella busta, nella casella 3-07.\n\nSuccessivo. Un promemoria di coordinamento interdipartimentale. Due destinatari — fai una copia per ciascuno, timbri entrambi, consegni entrambi.\n\nQuesto lavoro ha un ritmo da catena di montaggio: leggere, decidere, timbrare, smistare, consegnare. Ogni documento è una piccola decisione di instradamento — nessuna consegna errata, nessuna omissione.\n\nLa pila si riduce uno per uno. Le caselle postali si riempiono una per una. I tuoi movimenti diventano più fluidi, ma il tuo giudizio non diventa mai sciatto.\n\nUltimo documento consegnato. Ogni foglio è arrivato dove doveva. Le informazioni dell'archivio circolano di nuovo.\n\nCammini verso l'uscita. Dall'altra parte, uno specchio — dal pavimento al soffitto, abbastanza grande da riflettere tutta la tua figura.\n\nNell'angolo in basso a sinistra dello specchio, alcune righe di testo, come scritte a mano:\n\n"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."\n\nAccanto alle parole, un sigillo. Identico a quello sulla lettera d'invito.\n\nTi guardi nello specchio. Sei piani, trenta scelte. Nessuna riguardava il giusto o lo sbagliato — riguardavano te.\n\nFai un respiro profondo e spingi l'ultima porta.`,

        ru: `Большая стопка документов. Схема рассылки. Штампы с датой и ведомственные печати.\n\nТы берёшь первый документ — квитанцию о выдаче. Проверяешь схему: третий этаж, Управление записями, ячейка 3-07. Штамп с датой, ведомственная печать, в конверт, в ячейку 3-07.\n\nСледующий. Межведомственная координационная записка. Два адресата — делаешь копию для каждого, штампуешь оба, доставляешь оба.\n\nЭта работа имеет конвейерный ритм: прочитать, решить, проштамповать, рассортировать, доставить. Каждый документ — маленькое решение о маршрутизации. Без ошибочных доставок, без пропусков.\n\nСтопка уменьшается по одному. Ячейки заполняются одна за другой. Движения становятся всё более плавными, но суждение никогда не становится небрежным.\n\nПоследний документ доставлен. Каждый лист бумаги оказался там, где нужно. Информация из архива снова движется.\n\nТы идёшь к выходу. По ту сторону — зеркало. От пола до потолка, достаточно большое, чтобы отразить тебя целиком.\n\nВ левом нижнем углу зеркала несколько строк, будто написанных от руки:\n\n«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и собой.»\n\nРядом со словами — печать. Такая же, как на пригласительном письме.\n\nТы смотришь на своё отражение. Шесть этажей, тридцать выборов. Ни один не был о том, что правильно или нет — все были о тебе.\n\nТы делаешь глубокий вдох и открываешь последнюю дверь.`,

        ja: `大量の書類の山。配送図。日付スタンプと部門印。\n\n最初の書類を手に取る——取り出し受領書。配送図を確認する：3階、記録管理部、スロット3-07。日付スタンプ、部門印、封筒に入れ、3-07に投函。\n\n次。部門間調整メモ。宛先が2つ——それぞれにコピーを作り、両方にスタンプを押し、両方を届ける。\n\nこの作業には組み立てラインのリズムがある：読む、判断する、スタンプを押す、仕分ける、届ける。各書類は小さなルーティング判断——誤配なし、漏れなし。\n\n山が一つずつ減っていく。メールボックスが一つずつ埋まっていく。動きはどんどん滑らかになるが、判断が雑になることはない。\n\n最後の書類を届け終わる。すべての紙が届くべき場所に届いた。アーカイブの情報が再び流れ始めた。\n\n出口に向かう。向こう側に鏡がある——床から天井まで、全身が映るほど大きい。\n\n鏡の左下に、手書きのような数行の文字：\n\n「あなたはずっと選んでいた。正しいか間違いかではなく。あなたと、あなた自身との間で。」\n\n文字の横に印章。招待状のものとまったく同じ。\n\n鏡の中の自分を見る。6つのフロア、30の選択。どれも正解か不正解かの話ではなかった——すべてあなた自身の話だった。\n\n深く息を吸い、最後の扉を押し開ける。`,

        ko: `커다란 서류 더미. 배분도. 날짜 도장과 부서 인장.\n\n첫 번째 서류를 집어든다 — 인출 영수증. 배분도를 확인한다: 3층, 기록관리부, 칸 3-07. 날짜 도장, 부서 인장, 봉투에 넣고, 3-07에 투입.\n\n다음. 부서 간 조율 메모. 수신자가 둘 — 각각 사본을 만들어, 둘 다 도장을 찍고, 둘 다 배달한다.\n\n이 작업에는 조립라인 같은 리듬이 있다: 읽기, 판단, 도장, 분류, 배달. 각 서류는 작은 라우팅 결정이다 — 오배달도, 누락도 없어야 한다.\n\n더미가 하나씩 줄어든다. 수신함이 하나씩 채워진다. 동작은 점점 유창해지지만, 판단은 결코 허술해지지 않는다.\n\n마지막 서류 배달 완료. 모든 종이가 있어야 할 곳에 도착했다. 기록보관실의 정보가 다시 흐르기 시작했다.\n\n출구를 향해 걸어간다. 반대편에 거울이 있다 — 바닥에서 천장까지, 온몸이 비칠 만큼 크다.\n\n거울의 왼쪽 아래 구석에, 손으로 쓴 듯한 몇 줄의 글:\n\n"당신은 계속 선택해왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."\n\n글 옆에 도장. 초대장에 있던 것과 똑같다.\n\n거울 속의 자신을 바라본다. 여섯 개의 층, 서른 번의 선택. 어느 것도 옳고 그름에 관한 것이 아니었다 — 모두 당신에 관한 것이었다.\n\n깊이 숨을 들이쉬고, 마지막 문을 밀어 연다.`,
      },
      score4: {
        zh: `一大摞文件。分发图。日期戳和部门章。

你拿起第一份，查了查分发图——三楼，格子编号 3-07。盖章，装入信封，投进去。下一份。你又查了查收件部门，盖章，分拣，投递。

流程很清楚，你跟着走。有一两份需要多看一眼分发图才能确定该投哪个格子，但总体不难。不是最刺激的工作，但你做得仔细，没有跳过任何一份。

文件越来越少。所有收件格都被填上了。

你走向出口。镜子在那里等着你。

「你一直在选。不是选对错。是选你自己。」

你看着镜子里的自己，心里有一种安静的东西在沉淀。三十个选择——你对哪些说了「是」，对哪些说了「不」——它们画出了一个你自己可能没完全看清的轮廓。

但镜子看清了。`,

        en: `A big stack of documents. The distribution chart. Date stamps and department seals.\n\nYou pick up the first, check the chart — third floor, slot 3-07. Stamp, into the envelope, drop it in. Next one. You check the destination department again, stamp, sort, deliver.\n\nThe process is clear and you follow it. One or two require an extra look at the chart to confirm the right slot, but overall not difficult. Not the most exciting work, but you do it carefully, not skipping a single one.\n\nThe stack shrinks. All mailboxes have been filled.\n\nYou walk to the exit. The mirror waits there.\n\n"You've been choosing all along. Not between right and wrong. Between you and yourself."\n\nYou look at yourself in the mirror, and something quiet settles inside. Thirty choices — which ones you said yes to, which ones you said no to — they've drawn an outline you might not have fully seen.\n\nBut the mirror sees it.`,

        nl: `Een grote stapel documenten. Het distributieschema. Datumstempels en afdelingsstempels.\n\nJe pakt het eerste, controleert het schema — derde verdieping, vak 3-07. Stempelen, in de envelop, erin. Volgende. Je controleert opnieuw de ontvangende afdeling, stempelt, sorteert, bezorgt.\n\nHet proces is duidelijk en je volgt het. Eén of twee vereisen een extra blik op het schema om het juiste vak te bevestigen, maar over het geheel niet moeilijk. Niet het meest opwindende werk, maar je doet het zorgvuldig, zonder er één over te slaan.\n\nDe stapel slinkt. Alle postvakken zijn gevuld.\n\nJe loopt naar de uitgang. De spiegel wacht daar.\n\n"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."\n\nJe kijkt naar jezelf in de spiegel, en er daalt iets stils in je neer. Dertig keuzes — welke je ja tegen zei, welke je nee tegen zei — ze hebben een contour getekend die je misschien niet volledig had gezien.\n\nMaar de spiegel ziet het.`,

        de: `Ein großer Stapel Dokumente. Der Verteilungsplan. Datumsstempel und Abteilungsstempel.\n\nDu nimmst das erste, prüfst den Plan — dritter Stock, Fach 3-07. Stempeln, in den Umschlag, einwerfen. Nächstes. Du prüfst erneut die Zielabteilung, stempelst, sortierst, lieferst.\n\nDer Prozess ist klar und du folgst ihm. Ein oder zwei erfordern einen zusätzlichen Blick auf den Plan, um das richtige Fach zu bestätigen, aber insgesamt nicht schwer. Nicht die aufregendste Arbeit, aber du machst sie sorgfältig, ohne ein einziges zu überspringen.\n\nDer Stapel schrumpft. Alle Postfächer sind gefüllt.\n\nDu gehst zum Ausgang. Der Spiegel wartet dort.\n\n„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."\n\nDu betrachtest dich im Spiegel, und etwas Stilles legt sich in dir nieder. Dreißig Entscheidungen — zu welchen du ja gesagt hast, zu welchen nein — sie haben eine Kontur gezeichnet, die du vielleicht nicht ganz gesehen hast.\n\nAber der Spiegel sieht es.`,

        fr: `Une grande pile de documents. Le tableau de distribution. Tampons de date et cachets de département.\n\nTu prends le premier, consultes le tableau — troisième étage, case 3-07. Tamponner, dans l'enveloppe, déposer. Suivant. Tu vérifies à nouveau le département destinataire, tamponnes, tries, distribues.\n\nLe processus est clair et tu le suis. Un ou deux nécessitent un regard supplémentaire au tableau pour confirmer la bonne case, mais dans l'ensemble pas difficile. Pas le travail le plus excitant, mais tu le fais avec soin, sans en sauter un seul.\n\nLa pile diminue. Toutes les boîtes aux lettres sont remplies.\n\nTu marches vers la sortie. Le miroir t'attend là.\n\n« Tu as choisi tout du long. Pas entre bien et mal. Entre toi et toi-même. »\n\nTu te regardes dans le miroir, et quelque chose de calme se dépose en toi. Trente choix — à lesquels tu as dit oui, à lesquels tu as dit non — ils ont dessiné un contour que tu n'avais peut-être pas entièrement vu.\n\nMais le miroir le voit.`,

        es: `Una gran pila de documentos. El diagrama de distribución. Sellos de fecha y sellos departamentales.\n\nTomas el primero, revisas el diagrama — tercer piso, casilla 3-07. Sellar, al sobre, depositar. Siguiente. Verificas de nuevo el departamento destinatario, sellas, clasificas, entregas.\n\nEl proceso es claro y lo sigues. Uno o dos requieren una mirada extra al diagrama para confirmar la casilla correcta, pero en general no es difícil. No el trabajo más emocionante, pero lo haces con cuidado, sin saltarte ninguno.\n\nLa pila disminuye. Todas las casillas están llenas.\n\nCaminas hacia la salida. El espejo espera allí.\n\n"Has estado eligiendo todo el tiempo. No entre bien y mal. Entre tú y tú mismo."\n\nTe miras en el espejo y algo tranquilo se asienta en tu interior. Treinta elecciones — a cuáles dijiste sí, a cuáles dijiste no — han dibujado un contorno que quizás no habías visto del todo.\n\nPero el espejo lo ve.`,

        pt: `Uma grande pilha de documentos. O quadro de distribuição. Carimbos de data e carimbos departamentais.\n\nVocê pega o primeiro, confere o quadro — terceiro andar, escaninho 3-07. Carimbar, no envelope, depositar. Próximo. Você verifica novamente o departamento destinatário, carimba, classifica, entrega.\n\nO processo é claro e você o segue. Um ou dois exigem uma olhada extra no quadro para confirmar o escaninho certo, mas no geral não é difícil. Não o trabalho mais empolgante, mas você o faz com cuidado, sem pular nenhum.\n\nA pilha diminui. Todos os escaninhos foram preenchidos.\n\nVocê caminha para a saída. O espelho espera lá.\n\n"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."\n\nVocê se olha no espelho, e algo silencioso se acomoda dentro de você. Trinta escolhas — para quais disse sim, para quais disse não — desenharam um contorno que talvez você não tivesse visto por completo.\n\nMas o espelho vê.`,

        it: `Una grande pila di documenti. La mappa di distribuzione. Timbri con data e timbri di reparto.\n\nPrendi il primo, controlli la mappa — terzo piano, casella 3-07. Timbrare, nella busta, inserire. Successivo. Controlli di nuovo il reparto destinatario, timbri, smisti, consegni.\n\nIl processo è chiaro e lo segui. Uno o due richiedono un'occhiata in più alla mappa per confermare la casella giusta, ma nel complesso non è difficile. Non il lavoro più emozionante, ma lo fai con attenzione, senza saltarne nemmeno uno.\n\nLa pila si riduce. Tutte le caselle postali sono state riempite.\n\nCammini verso l'uscita. Lo specchio ti aspetta là.\n\n"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."\n\nTi guardi nello specchio, e qualcosa di quieto si deposita dentro di te. Trenta scelte — a quali hai detto sì, a quali hai detto no — hanno disegnato un contorno che forse non avevi visto del tutto.\n\nMa lo specchio lo vede.`,

        ru: `Большая стопка документов. Схема рассылки. Штампы с датой и ведомственные печати.\n\nТы берёшь первый, проверяешь схему — третий этаж, ячейка 3-07. Штамп, в конверт, опустить. Следующий. Снова проверяешь отдел-получатель, штампуешь, сортируешь, доставляешь.\n\nПроцесс понятен, и ты ему следуешь. Один-два документа требуют дополнительного взгляда на схему, чтобы уточнить ячейку, но в целом несложно. Не самая захватывающая работа, но ты делаешь её аккуратно, не пропуская ни одного.\n\nСтопка уменьшается. Все ячейки заполнены.\n\nТы идёшь к выходу. Там ждёт зеркало.\n\n«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и собой.»\n\nТы смотришь на себя в зеркало, и внутри оседает что-то тихое. Тридцать выборов — на какие ты сказал «да», на какие «нет» — они нарисовали контур, который ты, возможно, не видел целиком.\n\nНо зеркало видит.`,

        ja: `大量の書類の山。配送図。日付スタンプと部門印。\n\n最初の一枚を手に取り、配送図を確認する——3階、スロット3-07。スタンプ、封筒に入れ、投函。次。もう一度宛先部門を確認し、スタンプ、仕分け、配達。\n\nプロセスは明確で、それに従う。一つ二つは配送図をもう一度見て正しいスロットを確かめる必要があるが、全体的には難しくない。最もワクワクする作業ではないが、一つも飛ばさず丁寧にやる。\n\n山が減っていく。すべてのメールボックスが埋まった。\n\n出口に向かう。鏡がそこで待っている。\n\n「あなたはずっと選んでいた。正しいか間違いかではなく。あなたと、あなた自身との間で。」\n\n鏡の中の自分を見つめると、何か静かなものが内側に沈殿する。30の選択——どれにイエスと言い、どれにノーと言ったか——それらが、自分でも完全には見えていなかった輪郭を描いた。\n\nでも鏡には見えている。`,

        ko: `커다란 서류 더미. 배분도. 날짜 도장과 부서 인장.\n\n첫 번째를 집어들고 배분도를 확인한다 — 3층, 칸 3-07. 도장, 봉투에 넣고, 투입. 다음. 다시 수신 부서를 확인하고, 도장을 찍고, 분류하고, 배달한다.\n\n과정은 명확하고 그대로 따른다. 한두 건은 배분도를 한 번 더 봐야 올바른 칸을 확인할 수 있지만, 전반적으로 어렵지 않다. 가장 흥미로운 작업은 아니지만, 하나도 빠뜨리지 않고 꼼꼼하게 한다.\n\n더미가 줄어든다. 모든 수신함이 채워졌다.\n\n출구를 향해 걸어간다. 거울이 거기서 기다리고 있다.\n\n"당신은 계속 선택해왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."\n\n거울 속의 자신을 바라보면, 무언가 고요한 것이 내면에 가라앉는다. 서른 번의 선택 — 어떤 것에 예라고 했고, 어떤 것에 아니라고 했는지 — 그것들이 스스로도 완전히 보지 못했을 윤곽을 그렸다.\n\n하지만 거울은 보고 있다.`,
      },
      score3: {
        zh: `一摞文件。分发图。盖章、分拣、投递。

你看了看分发图上的规则，大致明白了逻辑。拿起第一份文件，查了查收件部门……应该是这个格子？

你犹豫了一会儿，选了一个看起来最接近的格子，投了进去。不确定是不是最精确的路由，但应该不会差太远。

你继续处理下面的文件，速度不快，因为每一份都要重新查一遍分发图。

处理完了。你走向出口。镜子。那几行字。

「你一直在选。不是选对错。是选你自己。」

你看着镜子里的自己。三十个选择——有些你确定，有些你犹豫。这也是你。`,

        en: `A stack of documents. The distribution chart. Stamp, sort, deliver.\n\nYou look at the rules on the chart, roughly understanding the logic. You pick up the first document, check the destination department... this slot?\n\nYou hesitate for a moment, pick the slot that seems closest, and drop it in. Not sure it's the most precise route, but it shouldn't be far off.\n\nYou continue with the remaining documents, not fast — each one requires checking the chart again.\n\nDone. You walk to the exit. The mirror. Those lines.\n\n"You've been choosing all along. Not between right and wrong. Between you and yourself."\n\nYou look at yourself in the mirror. Thirty choices — some you were sure about, some you wavered on. That's also you.`,

        nl: `Een stapel documenten. Het distributieschema. Stempelen, sorteren, bezorgen.\n\nJe kijkt naar de regels op het schema, begrijpt ruwweg de logica. Je pakt het eerste document, controleert de ontvangende afdeling... dit vakje?\n\nJe aarzelt even, kiest het vakje dat het dichtst in de buurt lijkt en stopt het erin. Niet zeker of het de meest precieze route is, maar het zou niet ver ernaast moeten zijn.\n\nJe gaat verder met de rest, niet snel — elk document vereist opnieuw het schema te controleren.\n\nKlaar. Je loopt naar de uitgang. De spiegel. Die regels.\n\n"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."\n\nJe kijkt naar jezelf in de spiegel. Dertig keuzes — bij sommige was je zeker, bij andere twijfelde je. Dat ben jij ook.`,

        de: `Ein Stapel Dokumente. Der Verteilungsplan. Stempeln, sortieren, zustellen.\n\nDu schaust dir die Regeln auf dem Plan an und verstehst grob die Logik. Du nimmst das erste Dokument, prüfst die Zielabteilung... dieses Fach?\n\nDu zögerst kurz, wählst das Fach, das am nächsten erscheint, und wirfst es ein. Nicht sicher, ob es die präziseste Route ist, aber weit daneben dürfte es nicht sein.\n\nDu machst mit den restlichen weiter, nicht schnell — jedes erfordert erneutes Prüfen des Plans.\n\nFertig. Du gehst zum Ausgang. Der Spiegel. Diese Zeilen.\n\n„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."\n\nDu betrachtest dich im Spiegel. Dreißig Entscheidungen — bei manchen warst du sicher, bei anderen hast du geschwankt. Das bist auch du.`,

        fr: `Une pile de documents. Le tableau de distribution. Tamponner, trier, distribuer.\n\nTu regardes les règles sur le tableau, comprenant vaguement la logique. Tu prends le premier document, vérifies le département destinataire... cette case ?\n\nTu hésites un instant, choisis la case qui semble la plus proche et le déposes dedans. Pas sûr que ce soit l'itinéraire le plus précis, mais ça ne devrait pas être loin.\n\nTu continues avec le reste, pas vite — chaque document nécessite de reconsulter le tableau.\n\nTerminé. Tu marches vers la sortie. Le miroir. Ces lignes.\n\n« Tu as choisi tout du long. Pas entre bien et mal. Entre toi et toi-même. »\n\nTu te regardes dans le miroir. Trente choix — certains dont tu étais sûr, d'autres où tu as hésité. C'est aussi toi.`,

        es: `Una pila de documentos. El diagrama de distribución. Sellar, clasificar, entregar.\n\nMiras las reglas del diagrama, entendiendo vagamente la lógica. Tomas el primer documento, verificas el departamento destinatario... ¿esta casilla?\n\nDudas un momento, eliges la casilla que parece más cercana y lo depositas. No estás seguro de que sea la ruta más precisa, pero no debería estar lejos.\n\nContinúas con el resto, no rápido — cada documento requiere volver a consultar el diagrama.\n\nTerminado. Caminas hacia la salida. El espejo. Esas líneas.\n\n"Has estado eligiendo todo el tiempo. No entre bien y mal. Entre tú y tú mismo."\n\nTe miras en el espejo. Treinta elecciones — algunas de las que estabas seguro, otras en las que dudaste. Eso también eres tú.`,

        pt: `Uma pilha de documentos. O quadro de distribuição. Carimbar, classificar, entregar.\n\nVocê olha as regras no quadro, entendendo vagamente a lógica. Pega o primeiro documento, verifica o departamento destinatário... este escaninho?\n\nVocê hesita um momento, escolhe o escaninho que parece mais próximo e deposita. Não tem certeza de que seja a rota mais precisa, mas não deve estar longe.\n\nVocê continua com o restante, não rápido — cada documento exige consultar o quadro novamente.\n\nTerminou. Você caminha para a saída. O espelho. Aquelas linhas.\n\n"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."\n\nVocê se olha no espelho. Trinta escolhas — algumas das quais tinha certeza, outras nas quais hesitou. Isso também é você.`,

        it: `Una pila di documenti. La mappa di distribuzione. Timbrare, smistare, consegnare.\n\nGuardi le regole sulla mappa, capendo vagamente la logica. Prendi il primo documento, controlli il reparto destinatario... questa casella?\n\nEsiti un momento, scegli la casella che sembra più vicina e lo inserisci. Non sei sicuro che sia il percorso più preciso, ma non dovrebbe essere lontano.\n\nContinui con il resto, non velocemente — ogni documento richiede di ricontrollare la mappa.\n\nFinito. Cammini verso l'uscita. Lo specchio. Quelle righe.\n\n"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."\n\nTi guardi nello specchio. Trenta scelte — alcune di cui eri sicuro, altre su cui hai vacillato. Anche questo sei tu.`,

        ru: `Стопка документов. Схема рассылки. Штамповать, сортировать, доставлять.\n\nТы смотришь на правила на схеме, приблизительно понимая логику. Берёшь первый документ, проверяешь отдел-получатель... эта ячейка?\n\nТы на мгновение колеблешься, выбираешь ячейку, которая кажется ближайшей, и опускаешь. Не уверен, что это самый точный маршрут, но не должно быть далеко.\n\nПродолжаешь с остальными, не быстро — каждый документ требует повторной проверки схемы.\n\nГотово. Ты идёшь к выходу. Зеркало. Те строки.\n\n«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и собой.»\n\nТы смотришь на себя в зеркало. Тридцать выборов — в некоторых ты был уверен, в других колебался. Это тоже ты.`,

        ja: `書類の山。配送図。スタンプ、仕分け、配達。\n\n配送図のルールを見て、大まかにロジックを理解する。最初の書類を手に取り、宛先部門を確認する……このスロット？\n\n少し迷い、最も近そうなスロットを選んで入れる。最も正確なルートかどうかは分からないが、大きく外れてはいないはずだ。\n\n残りの書類を続ける。速くはない——各書類で配送図を再確認する必要がある。\n\n終わった。出口に向かう。鏡。あの言葉。\n\n「あなたはずっと選んでいた。正しいか間違いかではなく。あなたと、あなた自身との間で。」\n\n鏡の中の自分を見る。30の選択——確信があったものもあれば、迷ったものもある。それもまた自分だ。`,

        ko: `서류 더미. 배분도. 도장, 분류, 배달.\n\n배분도의 규칙을 보며 대략적인 논리를 파악한다. 첫 번째 서류를 집어들고 수신 부서를 확인한다... 이 칸?\n\n잠시 망설이다가, 가장 가까워 보이는 칸을 골라 넣는다. 가장 정확한 경로인지는 모르겠지만, 크게 벗어나지는 않을 것이다.\n\n나머지 서류를 계속 처리한다. 빠르지 않다 — 각 서류마다 배분도를 다시 확인해야 하니까.\n\n끝났다. 출구를 향해 걸어간다. 거울. 그 글귀.\n\n"당신은 계속 선택해왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."\n\n거울 속의 자신을 바라본다. 서른 번의 선택 — 확신했던 것도 있고, 망설였던 것도 있다. 그것도 당신이다.`,
      },
      score2: {
        zh: `盖章。分拣。投递。最后一步。

你看了看分发图——格子很多，路由规则密密麻麻。要把每一份都准确投递到对应的格子，需要你逐一查阅。

你盖了几份的章，大致按区域分了分，投进了几个看起来对的格子。不是最精确的路由，但够了。

你想结束了。

镜子在出口的另一边。那几行字你看到了。

「你一直在选。不是选对错。是选你自己。」

你点了点头。是的。你一直在选。`,

        en: `Stamp. Sort. Deliver. The last step.\n\nYou look at the distribution chart — many slots, routing rules packed tight. Delivering each document precisely to the right slot means checking them one by one.\n\nYou stamp a few, sort them roughly by area, and drop them into slots that look right. Not the most precise routing, but close enough.\n\nYou want this to be over.\n\nThe mirror is on the other side of the exit. Those lines, you see them.\n\n"You've been choosing all along. Not between right and wrong. Between you and yourself."\n\nYou nod. Yes. You've been choosing.`,

        nl: `Stempelen. Sorteren. Bezorgen. De laatste stap.\n\nJe kijkt naar het distributieschema — veel vakjes, routeringsregels dicht op elkaar. Elk document precies in het juiste vakje bezorgen betekent ze één voor één controleren.\n\nJe stempelt er een paar, sorteert ze ruwweg per zone en stopt ze in vakjes die er goed uitzien. Niet de meest precieze route, maar dichtbij genoeg.\n\nJe wilt dat het voorbij is.\n\nDe spiegel is aan de andere kant van de uitgang. Die regels, je ziet ze.\n\n"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."\n\nJe knikt. Ja. Je hebt gekozen.`,

        de: `Stempeln. Sortieren. Zustellen. Der letzte Schritt.\n\nDu schaust den Verteilungsplan an — viele Fächer, Zustellregeln dicht gedrängt. Jedes Dokument präzise in das richtige Fach zu legen bedeutet, sie einzeln zu prüfen.\n\nDu stempelst ein paar, sortierst sie grob nach Bereich und wirfst sie in Fächer, die richtig aussehen. Nicht die präziseste Zustellung, aber nah genug.\n\nDu willst, dass es vorbei ist.\n\nDer Spiegel ist auf der anderen Seite des Ausgangs. Diese Zeilen, du siehst sie.\n\n„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."\n\nDu nickst. Ja. Du hast gewählt.`,

        fr: `Tamponner. Trier. Distribuer. La dernière étape.\n\nTu regardes le tableau de distribution — beaucoup de cases, règles de routage serrées. Livrer chaque document précisément dans la bonne case signifie les vérifier un par un.\n\nTu tamponnes quelques-uns, les tries vaguement par zone et les déposes dans des cases qui semblent correctes. Pas le routage le plus précis, mais assez proche.\n\nTu veux que ce soit fini.\n\nLe miroir est de l'autre côté de la sortie. Ces lignes, tu les vois.\n\n« Tu as choisi tout du long. Pas entre bien et mal. Entre toi et toi-même. »\n\nTu acquiesces. Oui. Tu as choisi.`,

        es: `Sellar. Clasificar. Entregar. El último paso.\n\nMiras el diagrama de distribución — muchas casillas, reglas de enrutamiento apretadas. Entregar cada documento precisamente en la casilla correcta significa revisarlos uno por uno.\n\nSellas unos cuantos, los clasificas vagamente por zona y los depositas en casillas que parecen correctas. No el enrutamiento más preciso, pero lo suficientemente cerca.\n\nQuieres que esto termine.\n\nEl espejo está al otro lado de la salida. Esas líneas, las ves.\n\n"Has estado eligiendo todo el tiempo. No entre bien y mal. Entre tú y tú mismo."\n\nAsientes. Sí. Has estado eligiendo.`,

        pt: `Carimbar. Classificar. Entregar. O último passo.\n\nVocê olha o quadro de distribuição — muitos escaninhos, regras de roteamento apertadas. Entregar cada documento precisamente no escaninho certo significa verificá-los um por um.\n\nVocê carimba alguns, classifica vagamente por área e deposita em escaninhos que parecem certos. Não o roteamento mais preciso, mas perto o suficiente.\n\nVocê quer que isso acabe.\n\nO espelho está do outro lado da saída. Aquelas linhas, você as vê.\n\n"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."\n\nVocê acena com a cabeça. Sim. Você esteve escolhendo.`,

        it: `Timbrare. Smistare. Consegnare. L'ultimo passaggio.\n\nGuardi la mappa di distribuzione — molte caselle, regole di instradamento fitte. Consegnare ogni documento precisamente nella casella giusta significa controllarli uno per uno.\n\nNe timbri alcuni, li smisti vagamente per zona e li inserisci in caselle che sembrano giuste. Non l'instradamento più preciso, ma abbastanza vicino.\n\nVuoi che finisca.\n\nLo specchio è dall'altra parte dell'uscita. Quelle righe, le vedi.\n\n"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."\n\nAnnuisci. Sì. Hai scelto.`,

        ru: `Штамповать. Сортировать. Доставлять. Последний шаг.\n\nТы смотришь на схему рассылки — много ячеек, правила маршрутизации теснятся. Доставить каждый документ точно в нужную ячейку — значит проверить их по одному.\n\nТы штампуешь несколько, раскладываешь примерно по зонам и опускаешь в ячейки, которые выглядят правильно. Не самый точный маршрут, но достаточно близко.\n\nТы хочешь, чтобы это закончилось.\n\nЗеркало по ту сторону выхода. Те строки — ты их видишь.\n\n«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и собой.»\n\nТы киваешь. Да. Ты выбирал.`,

        ja: `スタンプ。仕分け。配達。最後のステップ。\n\n配送図を見る——スロットがたくさんあり、ルーティングルールがぎっしり詰まっている。各書類を正確に正しいスロットに届けるには、一つずつ確認する必要がある。\n\n何枚かにスタンプを押し、大まかにエリアごとに分け、正しそうなスロットに投函する。最も正確なルーティングではないが、十分に近い。\n\nこれを終わらせたい。\n\n鏡が出口の向こうにある。あの言葉が見える。\n\n「あなたはずっと選んでいた。正しいか間違いかではなく。あなたと、あなた自身との間で。」\n\nうなずく。そう。ずっと選んでいた。`,

        ko: `도장. 분류. 배달. 마지막 단계.\n\n배분도를 본다 — 칸이 많고, 라우팅 규칙이 빽빽하다. 각 서류를 정확히 올바른 칸에 넣으려면 하나씩 확인해야 한다.\n\n몇 장에 도장을 찍고, 대략 구역별로 나누어, 맞아 보이는 칸에 넣는다. 가장 정확한 라우팅은 아니지만, 충분히 가깝다.\n\n이것이 끝나길 원한다.\n\n거울이 출구 반대편에 있다. 그 글귀가 보인다.\n\n"당신은 계속 선택해왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."\n\n고개를 끄덕인다. 그렇다. 계속 선택해왔다.`,
      },
      score1: {
        zh: `最后一步。盖章、分拣、投递。

你看了一眼那些文件和分发图。要把每一份都准确投递到对应的格子，需要你逐一查阅路由规则——但你想结束了。

你快速地把文件分成几堆，大致按楼层投进了对应的区域。

收件格接受了。

你走向出口。镜子里，是你。

「你一直在选。不是选对错。是选你自己。」

三十个选择结束了。不是每一个都让你兴奋，不是每一个都让你犹豫。但每一个都是真实的。

这就够了。`,

        en: `The last step. Stamp, sort, deliver.\n\nYou glance at the documents and the distribution chart. Delivering each one precisely to the right slot would mean checking routing rules one by one — but you want to be done.\n\nYou quickly sort the documents into rough piles by floor and drop them into the general areas.\n\nThe mailboxes accept them.\n\nYou walk to the exit. In the mirror, it's you.\n\n"You've been choosing all along. Not between right and wrong. Between you and yourself."\n\nThirty choices are behind you. Not every one excited you. Not every one made you hesitate. But every one was real.\n\nThat's enough.`,

        nl: `De laatste stap. Stempelen, sorteren, bezorgen.\n\nJe werpt een blik op de documenten en het distributieschema. Elk document precies in het juiste vakje bezorgen zou betekenen dat je de routeringsregels één voor één moet controleren — maar je wilt klaar zijn.\n\nJe sorteert de documenten snel in ruwe stapels per verdieping en stopt ze in de algemene zones.\n\nDe postvakken accepteren ze.\n\nJe loopt naar de uitgang. In de spiegel, ben jij het.\n\n"Je hebt de hele tijd gekozen. Niet tussen goed en fout. Tussen jou en jezelf."\n\nDertig keuzes liggen achter je. Niet elke keuze maakte je enthousiast. Niet elke keuze deed je aarzelen. Maar elke keuze was echt.\n\nDat is genoeg.`,

        de: `Der letzte Schritt. Stempeln, sortieren, zustellen.\n\nDu wirfst einen Blick auf die Dokumente und den Verteilungsplan. Jedes einzelne präzise in das richtige Fach zu legen würde bedeuten, die Zustellregeln einzeln zu prüfen — aber du willst fertig sein.\n\nDu sortierst die Dokumente schnell in grobe Stapel nach Stockwerk und wirfst sie in die ungefähren Bereiche.\n\nDie Postfächer akzeptieren sie.\n\nDu gehst zum Ausgang. Im Spiegel bist du es.\n\n„Du hast die ganze Zeit gewählt. Nicht zwischen richtig und falsch. Zwischen dir und dir selbst."\n\nDreißig Entscheidungen liegen hinter dir. Nicht jede hat dich begeistert. Nicht jede hat dich zögern lassen. Aber jede war echt.\n\nDas genügt.`,

        fr: `La dernière étape. Tamponner, trier, distribuer.\n\nTu jettes un coup d'œil aux documents et au tableau de distribution. Livrer chacun précisément dans la bonne case signifierait vérifier les règles de routage une par une — mais tu veux en finir.\n\nTu tries rapidement les documents en piles approximatives par étage et les déposes dans les zones générales.\n\nLes boîtes aux lettres les acceptent.\n\nTu marches vers la sortie. Dans le miroir, c'est toi.\n\n« Tu as choisi tout du long. Pas entre bien et mal. Entre toi et toi-même. »\n\nTrente choix sont derrière toi. Tous ne t'ont pas enthousiasmé. Tous ne t'ont pas fait hésiter. Mais chacun était réel.\n\nC'est suffisant.`,

        es: `El último paso. Sellar, clasificar, entregar.\n\nEchas un vistazo a los documentos y al diagrama de distribución. Entregar cada uno precisamente en la casilla correcta significaría revisar las reglas de enrutamiento una por una — pero quieres terminar.\n\nClasificas rápidamente los documentos en pilas aproximadas por piso y los depositas en las áreas generales.\n\nLas casillas los aceptan.\n\nCaminas hacia la salida. En el espejo, eres tú.\n\n"Has estado eligiendo todo el tiempo. No entre bien y mal. Entre tú y tú mismo."\n\nTreinta elecciones quedan atrás. No todas te emocionaron. No todas te hicieron dudar. Pero todas fueron reales.\n\nEso basta.`,

        pt: `O último passo. Carimbar, classificar, entregar.\n\nVocê olha para os documentos e o quadro de distribuição. Entregar cada um precisamente no escaninho certo significaria verificar as regras de roteamento uma por uma — mas você quer terminar.\n\nVocê separa rapidamente os documentos em pilhas aproximadas por andar e os deposita nas áreas gerais.\n\nOs escaninhos aceitam.\n\nVocê caminha para a saída. No espelho, é você.\n\n"Você esteve escolhendo o tempo todo. Não entre certo e errado. Entre você e você mesmo."\n\nTrinta escolhas ficaram para trás. Nem todas empolgaram. Nem todas fizeram hesitar. Mas todas foram reais.\n\nIsso basta.`,

        it: `L'ultimo passaggio. Timbrare, smistare, consegnare.\n\nDai un'occhiata ai documenti e alla mappa di distribuzione. Consegnare ciascuno precisamente nella casella giusta significherebbe controllare le regole di instradamento una per una — ma vuoi finire.\n\nSmisti rapidamente i documenti in pile approssimative per piano e li depositi nelle zone generali.\n\nLe caselle postali li accettano.\n\nCammini verso l'uscita. Nello specchio, sei tu.\n\n"Hai scelto per tutto il tempo. Non tra giusto e sbagliato. Tra te e te stesso."\n\nTrenta scelte sono alle tue spalle. Non tutte ti hanno entusiasmato. Non tutte ti hanno fatto esitare. Ma ognuna era reale.\n\nQuesto basta.`,

        ru: `Последний шаг. Штамповать, сортировать, доставлять.\n\nТы бросаешь взгляд на документы и схему рассылки. Доставить каждый точно в нужную ячейку — значит проверить правила маршрутизации по одному. Но ты хочешь закончить.\n\nТы быстро раскладываешь документы в приблизительные стопки по этажам и опускаешь в общие зоны.\n\nЯчейки принимают.\n\nТы идёшь к выходу. В зеркале — ты.\n\n«Ты выбирал всё это время. Не между правильным и неправильным. Между собой и собой.»\n\nТридцать выборов позади. Не каждый воодушевил. Не каждый заставил колебаться. Но каждый был настоящим.\n\nЭтого достаточно.`,

        ja: `最後のステップ。スタンプ、仕分け、配達。\n\n書類と配送図をちらりと見る。各書類を正確に正しいスロットに届けるにはルーティングルールを一つずつ確認する必要があるが——もう終わりにしたい。\n\n書類をフロアごとに大まかな山に分け、おおよそのエリアに投函する。\n\nメールボックスが受け入れた。\n\n出口に向かう。鏡の中にいるのは、自分だ。\n\n「あなたはずっと選んでいた。正しいか間違いかではなく。あなたと、あなた自身との間で。」\n\n30の選択が背後にある。すべてがワクワクさせたわけではない。すべてが迷わせたわけでもない。でもすべてが本物だった。\n\nそれで十分だ。`,

        ko: `마지막 단계. 도장, 분류, 배달.\n\n서류와 배분도를 한번 본다. 각 서류를 정확히 올바른 칸에 넣으려면 라우팅 규칙을 하나씩 확인해야 하겠지만 — 이제 끝내고 싶다.\n\n서류를 층별로 대략적인 더미로 빠르게 나누어 대략적인 구역에 넣는다.\n\n수신함이 받아들인다.\n\n출구를 향해 걸어간다. 거울 속에, 당신이 있다.\n\n"당신은 계속 선택해왔다. 옳고 그름 사이가 아니라. 당신과 당신 자신 사이에서."\n\n서른 번의 선택이 뒤에 있다. 모든 것이 흥분시킨 건 아니다. 모든 것이 망설이게 한 것도 아니다. 하지만 모든 것이 진짜였다.\n\n그것으로 충분하다.`,
      },
    },
  },
];
