// ============================================================
// Immersive Explore — UI Chrome Content
// ============================================================
// 不适合放 i18n 字典的复杂结构化内容
// （叙事段落、多行文本、结构化对象）
// ============================================================

import type { BilingualText, RiasecKey } from "./types";

/** Normalize any locale to 'en' | 'zh' for bilingual-only data. Non-zh → en. */
type BilingualLocale = "en" | "zh";
export function toBilingualLocale(locale: string): BilingualLocale {
  return locale === "zh" ? "zh" : "en";
}

/** Resolve locale for multi-locale Record objects. Falls back to 'en' if locale key not found. */
export function resolveLocale<T>(record: Record<string, T>, locale: string): T {
  return record[locale] ?? record["en"];
}

// ── 结果页维度叙事 ──────────────────────────────────────────
// 不出现 RIASEC 术语，纯自然语言
export const DIMENSION_IMMERSIVE: Record<
  RiasecKey,
  {
    high: BilingualText; // 高分时（>=17）的叙事
    mid: BilingualText; // 中分时（9-16）
  }
> = {
  R: {
    high: {
      zh: `你总是先动手。理解一件事最快的方式，是摸到它、拆开它、让它重新运转。机械室里——你在想清楚之前，手已经伸过去了。`,
      en: `You always reach out first. The fastest way to understand something is to touch it, take it apart, make it run again. In the machine room — your hands moved before your mind decided.`,
      nl: `Je reikt altijd als eerste. De snelste manier om iets te begrijpen is voor jou: het aanraken, uit elkaar halen, weer laten draaien. Die uitdagingen in de machinekamer — je handen bewogen voordat je hoofd had besloten.`,
      de: `Du greifst immer zuerst zu. Der schnellste Weg, etwas zu verstehen, ist für dich: es anfassen, auseinandernehmen, wieder zum Laufen bringen. Die Prüfungen im Maschinenraum — deine Hände bewegten sich, bevor dein Verstand entschieden hatte.`,
      fr: `Tu tends toujours la main en premier. La façon la plus rapide de comprendre quelque chose, pour toi, c'est de le toucher, le démonter, le faire tourner à nouveau. Ces épreuves dans la salle des machines — tes mains ont bougé avant que ton esprit ne décide.`,
      es: `Siempre eres el primero en actuar. La forma más rápida de entender algo, para ti, es tocarlo, desmontarlo, hacerlo funcionar de nuevo. Esas pruebas en la sala de máquinas — tus manos se movieron antes de que tu mente decidiera.`,
      pt: `Você sempre age primeiro. A forma mais rápida de entender algo, para você, é tocar, desmontar, fazer funcionar de novo. Aqueles desafios na sala de máquinas — suas mãos se moveram antes da sua mente decidir.`,
      it: `Tu allunghi sempre la mano per primo. Il modo più veloce per capire qualcosa, per te, è toccarlo, smontarlo, farlo funzionare di nuovo. Quelle prove nella sala macchine — le tue mani si sono mosse prima che la mente decidesse.`,
      ru: `Ты всегда тянешься первым. Самый быстрый способ понять что-то — для тебя — это потрогать, разобрать, заставить снова работать. Те испытания в машинном зале — твои руки двигались раньше, чем разум успевал решить.`,
      ja: `あなたはいつも最初に手を伸ばす。何かを理解する最速の方法は、あなたにとって、触れること、分解すること、もう一度動かすこと。機械室でのあの試練——頭が決める前に、手はもう動いていた。`,
      ko: `당신은 언제나 먼저 손을 뻗는다. 무언가를 이해하는 가장 빠른 방법은, 당신에게는, 만지고, 분해하고, 다시 작동시키는 것이다. 기계실에서의 그 시험들 — 머리가 결정하기 전에 손이 먼저 움직였다.`,
    },
    mid: {
      zh: `当一件事需要动手去做的时候，你会做，但那不是你最先感到被召唤的地方。`,
      en: `When something needs hands-on work, you'll do it — but it's not where you feel called first.`,
      nl: `Als iets handenarbeid vereist, doe je het — maar het is niet waar je je als eerste toe geroepen voelt.`,
      de: `Wenn etwas Handarbeit erfordert, machst du es — aber es ist nicht der Ort, an dem du dich zuerst berufen fühlst.`,
      fr: `Quand quelque chose demande un travail manuel, tu le fais — mais ce n'est pas là où tu te sens appelé en premier.`,
      es: `Cuando algo requiere trabajo manual, lo haces — pero no es donde sientes el primer llamado.`,
      pt: `Quando algo precisa de trabalho prático, você faz — mas não é onde você se sente chamado primeiro.`,
      it: `Quando qualcosa richiede lavoro manuale, lo fai — ma non è il primo posto dove ti senti chiamato.`,
      ru: `Когда что-то требует ручной работы, ты это делаешь — но это не то, к чему ты чувствуешь призвание в первую очередь.`,
      ja: `手を動かす必要があるとき、あなたはやる——でもそれは、最初に呼ばれていると感じる場所ではない。`,
      ko: `손으로 해야 할 일이 있으면 당신은 한다 — 하지만 그것이 당신이 가장 먼저 부름을 느끼는 곳은 아니다.`,
    },
  },
  I: {
    high: {
      zh: `你总是想搞清楚为什么。在图书馆里，当其他人找出口，你读那些没读过的东西。不是没注意到时钟——而是你知道：不弄懂这里，你没有资格离开。`,
      en: `You always want to know why. In the lab, while others searched for exits, you read what you hadn't read before. Not for failing to notice the clock — but because you knew: without understanding this place, you had no right to leave.`,
      nl: `Je wilt altijd weten waarom. In het lab, terwijl anderen naar de uitgang zochten, las jij wat je nog niet had gelezen. Niet omdat je de klok niet zag — maar omdat je wist: zonder dit te begrijpen, had je geen recht om te vertrekken.`,
      de: `Du willst immer wissen, warum. Im Labor, während andere nach dem Ausgang suchten, hast du gelesen, was du noch nicht gelesen hattest. Nicht weil du die Uhr nicht bemerkt hast — sondern weil du wusstest: ohne diesen Ort zu verstehen, hattest du kein Recht zu gehen.`,
      fr: `Tu veux toujours savoir pourquoi. Au laboratoire, pendant que les autres cherchaient la sortie, tu lisais ce que tu n'avais pas encore lu. Non pas parce que tu n'avais pas vu l'horloge — mais parce que tu savais : sans comprendre cet endroit, tu n'avais pas le droit de partir.`,
      es: `Siempre quieres saber por qué. En el laboratorio, mientras otros buscaban la salida, tú leías lo que aún no habías leído. No porque no notaras el reloj — sino porque sabías: sin entender este lugar, no tenías derecho a irte.`,
      pt: `Você sempre quer saber por quê. No laboratório, enquanto outros procuravam a saída, você lia o que ainda não tinha lido. Não porque não notou o relógio — mas porque sabia: sem entender este lugar, você não tinha o direito de sair.`,
      it: `Vuoi sempre sapere perché. Nel laboratorio, mentre gli altri cercavano l'uscita, tu leggevi ciò che non avevi ancora letto. Non perché non avessi notato l'orologio — ma perché sapevi: senza capire questo posto, non avevi il diritto di andartene.`,
      ru: `Ты всегда хочешь понять, почему. В лаборатории, пока другие искали выход, ты читал то, что ещё не читал. Не потому что не заметил часы — а потому что знал: не разобравшись в этом месте, ты не имеешь права уйти.`,
      ja: `あなたはいつも「なぜ」を知りたがる。研究室で、他の人が出口を探している間、あなたはまだ読んでいないものを読んでいた。時計に気づかなかったからではない——ここを理解しなければ、去る資格はないと分かっていたから。`,
      ko: `당신은 언제나 이유를 알고 싶어한다. 연구실에서 다른 사람들이 출구를 찾는 동안, 당신은 아직 읽지 않은 것을 읽고 있었다. 시계를 못 봤기 때문이 아니라 — 이곳을 이해하지 못하면 떠날 자격이 없다는 걸 알았기 때문이다.`,
    },
    mid: {
      zh: `你愿意去理解一件事的原因，但那种「必须弄清楚」的冲动，不是你随时都有的状态。`,
      en: `You're willing to understand why things work, but that "must figure it out" drive isn't always your default state.`,
      nl: `Je bent bereid te begrijpen waarom dingen werken, maar die drang om het "per se uit te zoeken" is niet altijd je standaardmodus.`,
      de: `Du bist bereit zu verstehen, warum Dinge funktionieren, aber dieser Drang, es „unbedingt herauszufinden", ist nicht immer dein Grundzustand.`,
      fr: `Tu es prêt à comprendre pourquoi les choses fonctionnent, mais cette pulsion de « devoir absolument comprendre » n'est pas toujours ton état par défaut.`,
      es: `Estás dispuesto a entender por qué funcionan las cosas, pero ese impulso de "tengo que descifrarlo" no siempre es tu estado predeterminado.`,
      pt: `Você está disposto a entender por que as coisas funcionam, mas aquele impulso de "preciso descobrir" nem sempre é seu estado padrão.`,
      it: `Sei disposto a capire perché le cose funzionano, ma quell'impulso di "devo assolutamente capirlo" non è sempre il tuo stato predefinito.`,
      ru: `Ты готов понять, почему вещи работают, но тот порыв «обязательно разобраться» — не всегда твоё состояние по умолчанию.`,
      ja: `なぜ物事が動くのか理解しようとする意志はある。でも「絶対に解き明かさなければ」という衝動が、いつもあるわけではない。`,
      ko: `왜 그렇게 작동하는지 이해하려는 마음은 있다. 하지만 "반드시 알아내야 해"라는 충동이 항상 기본 상태는 아니다.`,
    },
  },
  A: {
    high: {
      zh: `你走进一个空间，它就不一样了。不是刻意为之，是你存在的方式在重新构造周围。那个剧场——即使你什么都没说，它因为你在里面，就变了。`,
      en: `You walk into a space and it changes. Not by trying. Your very way of being reshapes what's around you. That theater — even when you said nothing, it transformed because you were in it.`,
      nl: `Je loopt een ruimte binnen en ze verandert. Niet omdat je dat probeert. Je manier van zijn hervormt wat om je heen is. Dat theater — zelfs toen je niets zei, veranderde het omdat jij erin was.`,
      de: `Du betrittst einen Raum und er verändert sich. Nicht weil du es versuchst. Deine bloße Art zu sein formt um, was dich umgibt. Dieses Theater — selbst als du nichts sagtest, verwandelte es sich, weil du darin warst.`,
      fr: `Tu entres dans un espace et il change. Pas parce que tu essaies. Ta façon même d'être remodèle ce qui t'entoure. Ce théâtre — même quand tu n'as rien dit, il s'est transformé parce que tu y étais.`,
      es: `Entras en un espacio y cambia. No porque lo intentes. Tu misma forma de ser reconfigura lo que te rodea. Ese teatro — incluso cuando no dijiste nada, se transformó porque estabas dentro.`,
      pt: `Você entra em um espaço e ele muda. Não porque você tenta. Sua própria maneira de ser remodela o que está ao redor. Aquele teatro — mesmo quando você não disse nada, ele se transformou porque você estava lá.`,
      it: `Entri in uno spazio e cambia. Non perché ci provi. Il tuo stesso modo di essere ridisegna ciò che ti circonda. Quel teatro — anche quando non hai detto nulla, si è trasformato perché tu eri lì.`,
      ru: `Ты входишь в пространство — и оно меняется. Не потому что ты стараешься. Сам твой способ существования перестраивает то, что вокруг. Тот театр — даже когда ты молчал, он изменился, потому что ты был в нём.`,
      ja: `あなたが空間に入ると、それは変わる。意図してではない。あなたの存在そのものが、周囲を再構成する。あの劇場——何も言わなくても、あなたがいるだけで、変わった。`,
      ko: `당신이 공간에 들어서면 그곳이 달라진다. 의도해서가 아니다. 당신의 존재 방식 자체가 주변을 재구성한다. 그 극장 — 아무 말도 하지 않았는데, 당신이 거기 있다는 것만으로 변했다.`,
    },
    mid: {
      zh: `你对创作和表达有感知，但把它变成你主动站出来的理由，这件事不是每次都会发生。`,
      en: `You sense creative expression, but turning that into a reason to step forward doesn't happen every time.`,
      nl: `Je voelt creatieve expressie aan, maar dat omzetten in een reden om naar voren te stappen, gebeurt niet elke keer.`,
      de: `Du spürst kreativen Ausdruck, aber daraus einen Grund zu machen, nach vorne zu treten, geschieht nicht jedes Mal.`,
      fr: `Tu perçois l'expression créative, mais en faire une raison de te mettre en avant n'arrive pas à chaque fois.`,
      es: `Percibes la expresión creativa, pero convertir eso en una razón para dar un paso adelante no ocurre cada vez.`,
      pt: `Você percebe a expressão criativa, mas transformar isso em uma razão para se apresentar não acontece toda vez.`,
      it: `Percepisci l'espressione creativa, ma trasformarla in un motivo per farti avanti non succede ogni volta.`,
      ru: `Ты чувствуешь творческое выражение, но превратить это в повод выйти вперёд — получается не каждый раз.`,
      ja: `創造的な表現を感じ取ることはできる。でもそれを、自分から一歩踏み出す理由に変えられるかというと、毎回そうなるわけではない。`,
      ko: `창의적 표현을 감지하는 능력은 있다. 하지만 그것을 앞으로 나서는 이유로 바꾸는 일이 매번 일어나지는 않는다.`,
    },
  },
  S: {
    high: {
      zh: `你注意到了那个什么都没说的人。其他人都在忙——计算，决策，往前走。只有你在看角落里的人。这不是小事。`,
      en: `You noticed the person who said nothing. While everyone else was busy — calculating, deciding, moving forward — only you watched the one in the corner. That's not a small thing.`,
      nl: `Jij zag de persoon die niets zei. Terwijl iedereen bezig was — rekenen, beslissen, vooruit gaan — keek alleen jij naar de persoon in de hoek. Dat is niet iets kleins.`,
      de: `Du hast die Person bemerkt, die nichts gesagt hat. Während alle anderen beschäftigt waren — rechneten, entschieden, vorangingen — hast nur du die Person in der Ecke beobachtet. Das ist keine Kleinigkeit.`,
      fr: `Tu as remarqué la personne qui n'a rien dit. Pendant que tous les autres étaient occupés — à calculer, à décider, à avancer — toi seul regardais la personne dans le coin. Ce n'est pas rien.`,
      es: `Notaste a la persona que no dijo nada. Mientras todos los demás estaban ocupados — calculando, decidiendo, avanzando — solo tú observabas a la persona en la esquina. Eso no es poca cosa.`,
      pt: `Você notou a pessoa que não disse nada. Enquanto todos estavam ocupados — calculando, decidindo, seguindo em frente — só você observava a pessoa no canto. Isso não é pouca coisa.`,
      it: `Hai notato la persona che non ha detto nulla. Mentre tutti gli altri erano occupati — a calcolare, decidere, andare avanti — solo tu guardavi la persona nell'angolo. Non è cosa da poco.`,
      ru: `Ты заметил человека, который ничего не сказал. В тот момент все были заняты — считали, решали, двигались вперёд. Только ты смотрел на человека в углу. Это не мелочь.`,
      ja: `あなたは、何も言わなかった人に気づいた。他のみんなが忙しかったとき——計算し、決断し、前に進んでいたとき——隅にいるあの人を見ていたのは、あなただけだった。それは小さなことではない。`,
      ko: `당신은 아무 말도 하지 않은 그 사람을 알아챘다. 다른 모든 사람이 바빴을 때 — 계산하고, 결정하고, 앞으로 나아가고 — 구석에 있는 사람을 지켜본 것은 오직 당신뿐이었다. 그건 작은 일이 아니다.`,
    },
    mid: {
      zh: `帮助别人是你会做的事，但你更多是在被需要的时候出现，而不是主动去找那个需要被帮助的人。`,
      en: `Helping others is something you do, but you show up when needed rather than seeking out those who need help.`,
      nl: `Anderen helpen doe je wel, maar je verschijnt eerder wanneer je nodig bent dan dat je actief zoekt naar wie hulp nodig heeft.`,
      de: `Anderen zu helfen ist etwas, das du tust, aber du erscheinst eher, wenn du gebraucht wirst, als dass du aktiv nach denen suchst, die Hilfe brauchen.`,
      fr: `Aider les autres, tu le fais, mais tu apparais plutôt quand on a besoin de toi que de chercher activement ceux qui ont besoin d'aide.`,
      es: `Ayudar a otros es algo que haces, pero apareces cuando te necesitan en lugar de buscar activamente a quienes necesitan ayuda.`,
      pt: `Ajudar os outros é algo que você faz, mas você aparece quando necessário em vez de procurar ativamente quem precisa de ajuda.`,
      it: `Aiutare gli altri è qualcosa che fai, ma ti presenti quando c'è bisogno piuttosto che cercare attivamente chi ha bisogno di aiuto.`,
      ru: `Помогать другим — это то, что ты делаешь, но ты скорее появляешься, когда нужен, чем сам ищешь тех, кому нужна помощь.`,
      ja: `人を助けることはする。でもあなたは、助けを必要とする人を自分から探しに行くというより、求められたときに現れるタイプだ。`,
      ko: `다른 사람을 돕는 일은 당신이 하는 일이다. 하지만 도움이 필요한 사람을 스스로 찾아가기보다는, 필요할 때 나타나는 쪽에 가깝다.`,
    },
  },
  E: {
    high: {
      zh: `你们还没想好，你已经在说下一步了。不是不在乎过程，而是你脑子里的时钟一直在转，停不下来。那间谈判室——你是先动的那个人。`,
      en: `Before anyone else has decided, you're already talking about the next step. Not for lack of caring about process — but because the clock in your head never stops. That negotiation room — you were the one who moved first.`,
      nl: `Voordat iemand anders heeft besloten, heb jij het al over de volgende stap. Niet omdat je niet om het proces geeft — maar omdat de klok in je hoofd nooit stopt. Die onderhandelingsruimte — jij was degene die als eerste bewoog.`,
      de: `Bevor jemand anderes entschieden hat, sprichst du bereits über den nächsten Schritt. Nicht weil dir der Prozess egal ist — sondern weil die Uhr in deinem Kopf nie stehen bleibt. Der Verhandlungsraum — du warst derjenige, der sich zuerst bewegte.`,
      fr: `Avant que quiconque ait décidé, tu parles déjà de l'étape suivante. Non pas parce que le processus t'indiffère — mais parce que l'horloge dans ta tête ne s'arrête jamais. Cette salle de négociation — tu es celui qui a bougé en premier.`,
      es: `Antes de que nadie haya decidido, tú ya estás hablando del siguiente paso. No porque no te importe el proceso — sino porque el reloj en tu cabeza nunca se detiene. Esa sala de negociación — tú fuiste quien se movió primero.`,
      pt: `Antes que qualquer outro tenha decidido, você já está falando sobre o próximo passo. Não porque não se importa com o processo — mas porque o relógio na sua cabeça nunca para. Aquela sala de negociação — você foi quem se moveu primeiro.`,
      it: `Prima che chiunque altro abbia deciso, tu stai già parlando del prossimo passo. Non perché non ti importi del processo — ma perché l'orologio nella tua testa non si ferma mai. Quella sala delle trattative — sei stato tu a muoverti per primo.`,
      ru: `Ещё никто не решил, а ты уже говоришь о следующем шаге. Не потому что тебе безразличен процесс — а потому что часы в твоей голове не останавливаются. Та переговорная — ты был тем, кто двинулся первым.`,
      ja: `誰も決めていないうちに、あなたはもう次のステップを語っている。プロセスを軽んじているからではない——頭の中の時計が止まらないからだ。あの交渉室——最初に動いたのは、あなただった。`,
      ko: `아무도 결정하지 않았을 때, 당신은 이미 다음 단계를 이야기하고 있다. 과정을 무시해서가 아니라 — 머릿속 시계가 멈추지 않기 때문이다. 그 협상실 — 먼저 움직인 사람은 당신이었다.`,
    },
    mid: {
      zh: `在需要推进的时候你会推，但那种「我来」的冲动不是你的默认状态。`,
      en: `You'll push when things need moving, but that "I'll take charge" impulse isn't your default state.`,
      nl: `Je duwt als dingen moeten bewegen, maar die impuls van "ik neem het over" is niet je standaardmodus.`,
      de: `Du drückst, wenn Dinge vorankommen müssen, aber dieser Impuls „Ich übernehme" ist nicht dein Grundzustand.`,
      fr: `Tu pousses quand les choses doivent avancer, mais cette impulsion « je m'en charge » n'est pas ton état par défaut.`,
      es: `Empujas cuando las cosas necesitan avanzar, pero ese impulso de "yo me encargo" no es tu estado predeterminado.`,
      pt: `Você empurra quando as coisas precisam andar, mas aquele impulso de "eu assumo" não é seu estado padrão.`,
      it: `Spingi quando le cose devono muoversi, ma quell'impulso di "ci penso io" non è il tuo stato predefinito.`,
      ru: `Ты двигаешь дело вперёд, когда нужно, но порыв «я беру на себя» — не твоё состояние по умолчанию.`,
      ja: `物事を前に進める必要があるとき、あなたは押す。でも「私がやる」という衝動が、いつもの状態というわけではない。`,
      ko: `일이 진행되어야 할 때 당신은 밀어붙인다. 하지만 "내가 맡겠다"는 충동이 기본 상태는 아니다.`,
    },
  },
  C: {
    high: {
      zh: `所有人都在动，只有你在记录。你知道：没有被正确归档的发现，等于没有发生过。那间档案室——你感到一种奇怪的满足，不是因为有趣，而是因为它应该被做好。`,
      en: `Everyone else was moving; only you were recording. You know: a discovery not properly filed never happened. That archive room — you felt a strange satisfaction, not for interest, but because it should be done right.`,
      nl: `Iedereen bewoog; alleen jij was aan het vastleggen. Je weet dit: een ontdekking die niet goed is gearchiveerd, is nooit gebeurd. Die archiefruimte — je voelde een vreemde voldoening, niet omdat het interessant was, maar omdat het goed gedaan moest worden.`,
      de: `Alle anderen bewegten sich; nur du hast aufgezeichnet. Du weißt: eine Entdeckung, die nicht richtig abgelegt wurde, hat nie stattgefunden. Dieser Archivraum — du hast eine seltsame Zufriedenheit gespürt, nicht weil es interessant war, sondern weil es richtig gemacht werden sollte.`,
      fr: `Tout le monde bougeait ; toi seul enregistrais. Tu sais ceci : une découverte qui n'est pas correctement classée n'a jamais eu lieu. Cette salle d'archives — tu as ressenti une étrange satisfaction, non parce que c'était intéressant, mais parce que ça devait être bien fait.`,
      es: `Todos se movían; solo tú registrabas. Sabes esto: un descubrimiento que no se archiva correctamente nunca ocurrió. Esa sala de archivos — sentiste una extraña satisfacción, no porque fuera interesante, sino porque debía hacerse bien.`,
      pt: `Todos se moviam; só você registrava. Você sabe: uma descoberta que não é devidamente arquivada nunca aconteceu. Aquela sala de arquivos — você sentiu uma estranha satisfação, não porque fosse interessante, mas porque deveria ser feito direito.`,
      it: `Tutti si muovevano; solo tu stavi registrando. Lo sai: una scoperta non archiviata correttamente non è mai avvenuta. Quella sala archivi — hai provato una strana soddisfazione, non perché fosse interessante, ma perché andava fatto bene.`,
      ru: `Все двигались; только ты записывал. Ты знаешь: открытие, которое не было правильно задокументировано, никогда не случалось. Тот архив — ты почувствовал странное удовлетворение, не потому что это было интересно, а потому что это должно было быть сделано правильно.`,
      ja: `みんなが動いている中、記録していたのはあなただけだった。あなたは知っている——正しく整理されなかった発見は、起こらなかったのと同じだ。あの記録室——面白かったからではなく、きちんとやるべきだから、不思議な満足感を覚えた。`,
      ko: `모두가 움직이고 있었다. 기록하고 있었던 건 오직 당신뿐이었다. 당신은 안다: 제대로 정리되지 않은 발견은 일어나지 않은 것과 같다. 그 기록실 — 흥미로워서가 아니라, 제대로 해야 하기 때문에 느낀 이상한 만족감.`,
    },
    mid: {
      zh: `秩序和规范对你来说有意义，但把它变成你花大量精力投入的地方，这件事不总是发生。`,
      en: `Order and standards matter to you, but investing significant energy into maintaining them isn't always what happens.`,
      nl: `Orde en normen zijn belangrijk voor je, maar er veel energie in steken om ze te handhaven — dat gebeurt niet altijd.`,
      de: `Ordnung und Standards sind dir wichtig, aber erhebliche Energie in ihre Aufrechterhaltung zu investieren — das passiert nicht immer.`,
      fr: `L'ordre et les normes comptent pour toi, mais y investir une énergie considérable n'est pas toujours ce qui se passe.`,
      es: `El orden y los estándares importan para ti, pero invertir energía significativa en mantenerlos no siempre es lo que sucede.`,
      pt: `Ordem e padrões importam para você, mas investir energia significativa em mantê-los nem sempre é o que acontece.`,
      it: `Ordine e standard contano per te, ma investire energia significativa nel mantenerli non è sempre ciò che accade.`,
      ru: `Порядок и стандарты для тебя важны, но вкладывать значительную энергию в их поддержание — так бывает не всегда.`,
      ja: `秩序と規範はあなたにとって意味がある。でもそこに大きなエネルギーを注ぐかというと、いつもそうなるわけではない。`,
      ko: `질서와 기준은 당신에게 의미가 있다. 하지만 그것을 유지하는 데 큰 에너지를 쏟는 일이 항상 일어나지는 않는다.`,
    },
  },
};

// ── 邀请函内容 ──────────────────────────────────────────────
// 叙事性内容，按 locale 索引（与 lib/content/ 一致的模式）

export interface InvitationContent {
  ref: string;
  date: string;
  greeting: string;
  body: string[];
  rulesTitle: string;
  rules: string[];
  footer: string;
  seal: string;
  continueBtn: string;
}

export interface RulesContent {
  title: string;
  items: { label: string; text: string }[];
  startBtn: string;
  hint: string;
  footnote: string;
}

export const INVITATION: Record<string, InvitationContent> = {
  zh: {
    ref: "编号 / Ref.：QE-██████",
    date: "日期 / Date：████年██月██日",
    greeting: "致 探索者：",
    body: [
      "您已被纳入本次「第零局」参与者名单。",
      "「第零局」是一项以奖金为核心激励的团队考验游戏。\n游戏共设三十关。每关将呈现一项具体任务。",
    ],
    rulesTitle: "关于奖金分配：",
    rules: [
      "规则一\u2003每成功完成一项你主动承担的任务，你将获得对应奖金。",
      "规则二\u2003若你承担的任务与你的真实意愿相符，奖金将增加。\n\u2003\u2003\u2003\u2003若存在明显偏差，奖金将减少。",
      "规则三\u2003主办方对每位参与者的真实意愿有完整评估体系。\n\u2003\u2003\u2003\u2003任何形式的虚报将导致资格立即取消，奖金全额清零。",
      "规则四\u2003完整参与并顺利结束游戏的参与者，\n\u2003\u2003\u2003\u2003最低可领取奖金 ○ 4,000。",
    ],
    footer: "本通知无需回复。\n您来，即视为同意以上全部条款。",
    seal: "「第零局」主办方",
    continueBtn: "我已阅读",
  },
  en: {
    ref: "Ref.: QE-██████",
    date: "Date: ██/██/████",
    greeting: "To the Explorer:",
    body: [
      'You have been selected as a participant in "Round Zero."',
      '"Round Zero" is a team challenge game driven by prize money.\nThe game consists of thirty rounds. Each round presents a specific task.',
    ],
    rulesTitle: "Regarding prize distribution:",
    rules: [
      "Rule I\u2003For each task you voluntarily take on and complete, you will receive the corresponding prize.",
      "Rule II\u2003If the task aligns with your true intent, the prize increases.\n\u2003\u2003\u2003\u2003If there is a significant discrepancy, the prize decreases.",
      "Rule III\u2003The organizers maintain a complete assessment system for each participant's true intent.\n\u2003\u2003\u2003\u2003\u2003Any form of misrepresentation results in immediate disqualification and full forfeiture.",
      "Rule IV\u2003Participants who complete the full game are guaranteed a minimum prize of ○ 4,000.",
    ],
    footer:
      "No reply is required.\nYour presence constitutes acceptance of all terms above.",
    seal: '"Round Zero" Organizers',
    continueBtn: "I have read this",
  },
  nl: {
    ref: "Ref.: QE-██████",
    date: "Datum: ██/██/████",
    greeting: "Aan de Ontdekker:",
    body: [
      'U bent geselecteerd als deelnemer aan "Ronde Nul."',
      '"Ronde Nul" is een teamuitdaging gedreven door prijzengeld.\nHet spel bestaat uit dertig rondes. Elke ronde presenteert een specifieke opdracht.',
    ],
    rulesTitle: "Betreffende de prijsverdeling:",
    rules: [
      "Regel I\u2003Voor elke taak die u vrijwillig op zich neemt en voltooit, ontvangt u de bijbehorende prijs.",
      "Regel II\u2003Als de taak overeenkomt met uw ware intentie, stijgt de prijs.\n\u2003\u2003\u2003\u2003Bij een significant verschil daalt de prijs.",
      "Regel III\u2003De organisatoren beschikken over een volledig beoordelingssysteem voor de ware intentie van elke deelnemer.\n\u2003\u2003\u2003\u2003\u2003Elke vorm van onjuiste voorstelling leidt tot onmiddellijke diskwalificatie en volledig verlies.",
      "Regel IV\u2003Deelnemers die het volledige spel voltooien, hebben een gegarandeerde minimumprijs van ○ 4.000.",
    ],
    footer:
      "Geen antwoord vereist.\nUw aanwezigheid geldt als aanvaarding van alle bovenstaande voorwaarden.",
    seal: 'Organisatoren van "Ronde Nul"',
    continueBtn: "Ik heb dit gelezen",
  },
  de: {
    ref: "Ref.: QE-██████",
    date: "Datum: ██.██.████",
    greeting: "An den Entdecker:",
    body: [
      'Sie wurden als Teilnehmer der "Runde Null" ausgewählt.',
      '"Runde Null" ist ein teambasiertes Herausforderungsspiel mit Preisgeld.\nDas Spiel besteht aus dreißig Runden. Jede Runde stellt eine bestimmte Aufgabe.',
    ],
    rulesTitle: "Zur Preisverteilung:",
    rules: [
      "Regel I\u2003Für jede Aufgabe, die Sie freiwillig übernehmen und abschließen, erhalten Sie den entsprechenden Preis.",
      "Regel II\u2003Stimmt die Aufgabe mit Ihrer wahren Absicht überein, steigt der Preis.\n\u2003\u2003\u2003\u2003Bei erheblicher Abweichung sinkt der Preis.",
      "Regel III\u2003Die Veranstalter verfügen über ein vollständiges Bewertungssystem für die wahre Absicht jedes Teilnehmers.\n\u2003\u2003\u2003\u2003\u2003Jede Form der Falschdarstellung führt zur sofortigen Disqualifikation und vollständigem Verlust.",
      "Regel IV\u2003Teilnehmer, die das gesamte Spiel absolvieren, erhalten einen garantierten Mindestpreis von ○ 4.000.",
    ],
    footer:
      "Keine Antwort erforderlich.\nIhre Anwesenheit gilt als Zustimmung zu allen oben genannten Bedingungen.",
    seal: 'Veranstalter der "Runde Null"',
    continueBtn: "Ich habe dies gelesen",
  },
  fr: {
    ref: "Réf. : QE-██████",
    date: "Date : ██/██/████",
    greeting: "À l'Explorateur :",
    body: [
      'Vous avez été sélectionné comme participant au "Tour Zéro."',
      'Le "Tour Zéro" est un jeu de défi en équipe motivé par un prix en argent.\nLe jeu comprend trente tours. Chaque tour présente une tâche spécifique.',
    ],
    rulesTitle: "Concernant la distribution des prix :",
    rules: [
      "Règle I\u2003Pour chaque tâche que vous acceptez volontairement et accomplissez, vous recevrez le prix correspondant.",
      "Règle II\u2003Si la tâche correspond à votre intention véritable, le prix augmente.\n\u2003\u2003\u2003\u2003En cas d'écart significatif, le prix diminue.",
      "Règle III\u2003Les organisateurs disposent d'un système d'évaluation complet pour l'intention véritable de chaque participant.\n\u2003\u2003\u2003\u2003\u2003Toute forme de fausse déclaration entraîne la disqualification immédiate et la perte totale.",
      "Règle IV\u2003Les participants qui terminent le jeu complet se voient garantir un prix minimum de ○ 4 000.",
    ],
    footer:
      "Aucune réponse n'est requise.\nVotre présence vaut acceptation de toutes les conditions ci-dessus.",
    seal: 'Les Organisateurs du "Tour Zéro"',
    continueBtn: "J'ai lu ceci",
  },
  es: {
    ref: "Ref.: QE-██████",
    date: "Fecha: ██/██/████",
    greeting: "Al Explorador:",
    body: [
      'Has sido seleccionado como participante en la "Ronda Cero."',
      'La "Ronda Cero" es un juego de desafío en equipo impulsado por un premio en metálico.\nEl juego consta de treinta rondas. Cada ronda presenta una tarea específica.',
    ],
    rulesTitle: "Respecto a la distribución de premios:",
    rules: [
      "Regla I\u2003Por cada tarea que asumas voluntariamente y completes, recibirás el premio correspondiente.",
      "Regla II\u2003Si la tarea se alinea con tu verdadera intención, el premio aumenta.\n\u2003\u2003\u2003\u2003Si hay una discrepancia significativa, el premio disminuye.",
      "Regla III\u2003Los organizadores mantienen un sistema de evaluación completo para la verdadera intención de cada participante.\n\u2003\u2003\u2003\u2003\u2003Cualquier forma de tergiversación resulta en descalificación inmediata y pérdida total.",
      "Regla IV\u2003Los participantes que completen el juego en su totalidad tienen garantizado un premio mínimo de ○ 4.000.",
    ],
    footer:
      "No se requiere respuesta.\nTu presencia constituye la aceptación de todos los términos anteriores.",
    seal: 'Organizadores de la "Ronda Cero"',
    continueBtn: "He leído esto",
  },
  pt: {
    ref: "Ref.: QE-██████",
    date: "Data: ██/██/████",
    greeting: "Ao Explorador:",
    body: [
      'Você foi selecionado como participante da "Rodada Zero."',
      'A "Rodada Zero" é um jogo de desafio em equipe movido por prêmios em dinheiro.\nO jogo consiste em trinta rodadas. Cada rodada apresenta uma tarefa específica.',
    ],
    rulesTitle: "Sobre a distribuição de prêmios:",
    rules: [
      "Regra I\u2003Para cada tarefa que você assumir voluntariamente e completar, receberá o prêmio correspondente.",
      "Regra II\u2003Se a tarefa estiver alinhada com sua verdadeira intenção, o prêmio aumenta.\n\u2003\u2003\u2003\u2003Se houver uma discrepância significativa, o prêmio diminui.",
      "Regra III\u2003Os organizadores mantêm um sistema de avaliação completo para a verdadeira intenção de cada participante.\n\u2003\u2003\u2003\u2003\u2003Qualquer forma de falsificação resulta em desqualificação imediata e perda total.",
      "Regra IV\u2003Participantes que completarem o jogo inteiro têm garantido um prêmio mínimo de ○ 4.000.",
    ],
    footer:
      "Nenhuma resposta é necessária.\nSua presença constitui aceitação de todos os termos acima.",
    seal: 'Organizadores da "Rodada Zero"',
    continueBtn: "Eu li isto",
  },
  it: {
    ref: "Rif.: QE-██████",
    date: "Data: ██/██/████",
    greeting: "All'Esploratore:",
    body: [
      'Sei stato selezionato come partecipante al "Turno Zero."',
      'Il "Turno Zero" è un gioco di sfida a squadre basato su un premio in denaro.\nIl gioco consiste in trenta turni. Ogni turno presenta un compito specifico.',
    ],
    rulesTitle: "Riguardo alla distribuzione dei premi:",
    rules: [
      "Regola I\u2003Per ogni compito che assumi volontariamente e porti a termine, riceverai il premio corrispondente.",
      "Regola II\u2003Se il compito è in linea con la tua vera intenzione, il premio aumenta.\n\u2003\u2003\u2003\u2003In caso di discrepanza significativa, il premio diminuisce.",
      "Regola III\u2003Gli organizzatori dispongono di un sistema di valutazione completo per la vera intenzione di ogni partecipante.\n\u2003\u2003\u2003\u2003\u2003Qualsiasi forma di falsa dichiarazione comporta la squalifica immediata e la perdita totale.",
      "Regola IV\u2003I partecipanti che completano l'intero gioco hanno garantito un premio minimo di ○ 4.000.",
    ],
    footer:
      "Nessuna risposta richiesta.\nLa tua presenza costituisce accettazione di tutti i termini sopra indicati.",
    seal: 'Organizzatori del "Turno Zero"',
    continueBtn: "Ho letto",
  },
  ru: {
    ref: "Реф.: QE-██████",
    date: "Дата: ██.██.████",
    greeting: "Исследователю:",
    body: [
      "Вы были отобраны в качестве участника «Раунда Ноль».",
      "«Раунд Ноль» — это командная игра-испытание с денежным призом.\nИгра состоит из тридцати раундов. Каждый раунд содержит конкретное задание.",
    ],
    rulesTitle: "О распределении призов:",
    rules: [
      "Правило I\u2003За каждое задание, которое вы добровольно берёте на себя и выполняете, вы получаете соответствующий приз.",
      "Правило II\u2003Если задание соответствует вашему истинному намерению, приз увеличивается.\n\u2003\u2003\u2003\u2003При значительном расхождении приз уменьшается.",
      "Правило III\u2003Организаторы располагают полной системой оценки истинных намерений каждого участника.\n\u2003\u2003\u2003\u2003\u2003Любая форма искажения влечёт немедленную дисквалификацию и полную потерю приза.",
      "Правило IV\u2003Участникам, прошедшим игру полностью, гарантирован минимальный приз ○ 4 000.",
    ],
    footer:
      "Ответ не требуется.\nВаше присутствие означает согласие со всеми вышеуказанными условиями.",
    seal: "Организаторы «Раунда Ноль»",
    continueBtn: "Я прочитал",
  },
  ja: {
    ref: "整理番号：QE-██████",
    date: "日付：████年██月██日",
    greeting: "探索者へ：",
    body: [
      "あなたは「ラウンド・ゼロ」の参加者に選出されました。",
      "「ラウンド・ゼロ」は賞金を原動力とするチーム・チャレンジ・ゲームです。\nゲームは全三十ラウンドで構成されます。各ラウンドには具体的な課題があります。",
    ],
    rulesTitle: "賞金の配分について：",
    rules: [
      "規則 I\u2003自発的に引き受け、完遂した各課題に対し、対応する賞金を受け取ります。",
      "規則 II\u2003課題があなたの真の意志と合致する場合、賞金は増加します。\n\u2003\u2003\u2003\u2003著しい乖離がある場合、賞金は減少します。",
      "規則 III\u2003主催者は各参加者の真の意志に対する完全な評価体系を有しています。\n\u2003\u2003\u2003\u2003\u2003いかなる虚偽の申告も、即時の失格と賞金の全額没収につながります。",
      "規則 IV\u2003ゲームを最後まで完遂した参加者には、最低 ○ 4,000 の賞金が保証されます。",
    ],
    footer:
      "返信は不要です。\nあなたの参加をもって、上記すべての条件に同意したものとみなします。",
    seal: "「ラウンド・ゼロ」主催者",
    continueBtn: "読みました",
  },
  ko: {
    ref: "참조번호: QE-██████",
    date: "날짜: ████년 ██월 ██일",
    greeting: "탐험가에게:",
    body: [
      '당신은 "라운드 제로"의 참가자로 선발되었습니다.',
      '"라운드 제로"는 상금을 핵심 동력으로 하는 팀 도전 게임입니다.\n게임은 총 서른 라운드로 구성됩니다. 각 라운드마다 구체적인 과제가 주어집니다.',
    ],
    rulesTitle: "상금 배분에 관하여:",
    rules: [
      "규칙 I\u2003자발적으로 맡아 완수한 각 과제에 대해 해당 상금을 받게 됩니다.",
      "규칙 II\u2003과제가 당신의 진정한 의지와 일치하면 상금이 증가합니다.\n\u2003\u2003\u2003\u2003현저한 차이가 있을 경우 상금이 감소합니다.",
      "규칙 III\u2003주최측은 각 참가자의 진정한 의지에 대한 완전한 평가 체계를 갖추고 있습니다.\n\u2003\u2003\u2003\u2003\u2003어떠한 형태의 허위 진술도 즉각적인 실격과 전액 몰수로 이어집니다.",
      "규칙 IV\u2003게임을 완주한 참가자에게는 최소 ○ 4,000의 상금이 보장됩니다.",
    ],
    footer:
      "답변은 필요하지 않습니다.\n당신의 참석은 위의 모든 조건에 대한 동의로 간주됩니다.",
    seal: '"라운드 제로" 주최측',
    continueBtn: "읽었습니다",
  },
};

export const RULES: Record<string, RulesContent> = {
  zh: {
    title: "游戏须知",
    items: [
      { label: "01", text: "共三十关，每关一项考验。每关由一人主要承担完成。" },
      { label: "02", text: "你不必每关都参与。选择跳过，不扣奖金。" },
      { label: "03", text: "奖金多少，取决于你的选择是否忠于真实意愿。" },
      { label: "04", text: "主办方知道你在想什么。不要伪装。" },
    ],
    startBtn: "进入「第零局」",
    hint: "约 10 分钟",
    footnote: "提示：如果你在某一刻觉得这一切都是为你设计的——你是对的。",
  },
  en: {
    title: "Before You Begin",
    items: [
      {
        label: "01",
        text: "Thirty rounds. One challenge per round. One person takes the lead.",
      },
      {
        label: "02",
        text: "You don't have to step up every time. Opting out costs you nothing.",
      },
      {
        label: "03",
        text: "Your prize depends on one thing: whether your choices reflect your true intent.",
      },
      {
        label: "04",
        text: "The organizers know what you're thinking. Don't pretend.",
      },
    ],
    startBtn: 'Enter "Round Zero"',
    hint: "~10 minutes",
    footnote:
      "Note: If at any point you feel this was designed specifically for you — you're right.",
  },
  nl: {
    title: "Voordat je begint",
    items: [
      {
        label: "01",
        text: "Dertig rondes. Eén uitdaging per ronde. Eén persoon neemt de leiding.",
      },
      {
        label: "02",
        text: "Je hoeft niet elke keer naar voren te stappen. Overslaan kost je niets.",
      },
      {
        label: "03",
        text: "Je prijs hangt af van één ding: of je keuzes je ware intentie weerspiegelen.",
      },
      {
        label: "04",
        text: "De organisatoren weten wat je denkt. Doe niet alsof.",
      },
    ],
    startBtn: 'Betreed "Ronde Nul"',
    hint: "~10 minuten",
    footnote:
      "Opmerking: Als je op enig moment voelt dat dit specifiek voor jou ontworpen is — dan heb je gelijk.",
  },
  de: {
    title: "Bevor du beginnst",
    items: [
      {
        label: "01",
        text: "Dreißig Runden. Eine Herausforderung pro Runde. Eine Person übernimmt die Führung.",
      },
      {
        label: "02",
        text: "Du musst nicht jedes Mal antreten. Aussetzen kostet dich nichts.",
      },
      {
        label: "03",
        text: "Dein Preis hängt von einer Sache ab: ob deine Entscheidungen deine wahre Absicht widerspiegeln.",
      },
      {
        label: "04",
        text: "Die Veranstalter wissen, was du denkst. Täusche nichts vor.",
      },
    ],
    startBtn: '"Runde Null" betreten',
    hint: "~10 Minuten",
    footnote:
      "Hinweis: Wenn du irgendwann das Gefühl hast, dass dies speziell für dich entworfen wurde — hast du recht.",
  },
  fr: {
    title: "Avant de commencer",
    items: [
      {
        label: "01",
        text: "Trente tours. Un défi par tour. Une personne prend les devants.",
      },
      {
        label: "02",
        text: "Tu n'es pas obligé de te manifester à chaque fois. Passer ton tour ne te coûte rien.",
      },
      {
        label: "03",
        text: "Ton prix dépend d'une seule chose : si tes choix reflètent ta véritable intention.",
      },
      {
        label: "04",
        text: "Les organisateurs savent ce que tu penses. Ne fais pas semblant.",
      },
    ],
    startBtn: 'Entrer dans le "Tour Zéro"',
    hint: "~10 minutes",
    footnote:
      "Note : Si à un moment tu sens que tout ceci a été conçu spécifiquement pour toi — tu as raison.",
  },
  es: {
    title: "Antes de comenzar",
    items: [
      {
        label: "01",
        text: "Treinta rondas. Un desafío por ronda. Una persona toma la iniciativa.",
      },
      {
        label: "02",
        text: "No tienes que dar un paso al frente cada vez. Abstenerte no te cuesta nada.",
      },
      {
        label: "03",
        text: "Tu premio depende de una sola cosa: si tus elecciones reflejan tu verdadera intención.",
      },
      {
        label: "04",
        text: "Los organizadores saben lo que piensas. No finjas.",
      },
    ],
    startBtn: 'Entrar en la "Ronda Cero"',
    hint: "~10 minutos",
    footnote:
      "Nota: Si en algún momento sientes que todo esto fue diseñado específicamente para ti — tienes razón.",
  },
  pt: {
    title: "Antes de começar",
    items: [
      {
        label: "01",
        text: "Trinta rodadas. Um desafio por rodada. Uma pessoa assume a liderança.",
      },
      {
        label: "02",
        text: "Você não precisa se apresentar toda vez. Optar por não participar não custa nada.",
      },
      {
        label: "03",
        text: "Seu prêmio depende de uma coisa: se suas escolhas refletem sua verdadeira intenção.",
      },
      {
        label: "04",
        text: "Os organizadores sabem o que você está pensando. Não finja.",
      },
    ],
    startBtn: 'Entrar na "Rodada Zero"',
    hint: "~10 minutos",
    footnote:
      "Nota: Se em algum momento você sentir que tudo isso foi projetado especificamente para você — está certo.",
  },
  it: {
    title: "Prima di iniziare",
    items: [
      {
        label: "01",
        text: "Trenta turni. Una sfida per turno. Una persona prende l'iniziativa.",
      },
      {
        label: "02",
        text: "Non devi farti avanti ogni volta. Rinunciare non ti costa nulla.",
      },
      {
        label: "03",
        text: "Il tuo premio dipende da una sola cosa: se le tue scelte riflettono la tua vera intenzione.",
      },
      {
        label: "04",
        text: "Gli organizzatori sanno cosa stai pensando. Non fingere.",
      },
    ],
    startBtn: 'Entra nel "Turno Zero"',
    hint: "~10 minuti",
    footnote:
      "Nota: Se in qualsiasi momento senti che tutto questo è stato progettato specificamente per te — hai ragione.",
  },
  ru: {
    title: "Прежде чем начать",
    items: [
      {
        label: "01",
        text: "Тридцать раундов. Одно испытание за раунд. Один человек берёт на себя инициативу.",
      },
      {
        label: "02",
        text: "Ты не обязан выходить вперёд каждый раз. Отказ ничего тебе не стоит.",
      },
      {
        label: "03",
        text: "Твой приз зависит от одного: отражают ли твои выборы твоё истинное намерение.",
      },
      {
        label: "04",
        text: "Организаторы знают, о чём ты думаешь. Не притворяйся.",
      },
    ],
    startBtn: "Войти в «Раунд Ноль»",
    hint: "~10 минут",
    footnote:
      "Примечание: Если в какой-то момент тебе покажется, что всё это создано специально для тебя — ты прав.",
  },
  ja: {
    title: "始める前に",
    items: [
      {
        label: "01",
        text: "全三十ラウンド。各ラウンドにひとつの課題。ひとりが主導する。",
      },
      {
        label: "02",
        text: "毎回名乗り出る必要はない。見送っても何も失わない。",
      },
      {
        label: "03",
        text: "賞金はひとつのことで決まる——あなたの選択が真の意志を反映しているかどうか。",
      },
      {
        label: "04",
        text: "主催者はあなたが何を考えているか知っている。偽らないでほしい。",
      },
    ],
    startBtn: "「ラウンド・ゼロ」に入る",
    hint: "約10分",
    footnote:
      "ヒント：もしどこかの瞬間、これがすべて自分のために設計されたと感じたなら——その通りです。",
  },
  ko: {
    title: "시작하기 전에",
    items: [
      {
        label: "01",
        text: "서른 라운드. 라운드마다 하나의 도전. 한 사람이 주도한다.",
      },
      {
        label: "02",
        text: "매번 나설 필요는 없다. 불참해도 아무것도 잃지 않는다.",
      },
      {
        label: "03",
        text: "상금은 단 하나에 달려 있다: 당신의 선택이 진정한 의지를 반영하는지 여부.",
      },
      {
        label: "04",
        text: "주최측은 당신이 무슨 생각을 하는지 안다. 가장하지 마라.",
      },
    ],
    startBtn: '"라운드 제로"에 입장',
    hint: "약 10분",
    footnote:
      "참고: 어느 순간 이 모든 것이 당신만을 위해 설계되었다고 느낀다면 — 맞습니다.",
  },
};

// ── 生成加载步骤（档案封印仪式叙事）────────────────────────
export const GENERATING_STEPS: BilingualText[] = [
  {
    zh: "正在封存你的三十个选择…",
    en: "Sealing your thirty choices into the archive…",
    nl: "Je dertig keuzes worden verzegeld in het archief…",
    de: "Deine dreißig Entscheidungen werden im Archiv versiegelt…",
    fr: "Vos trente choix sont scellés dans l'archive…",
    es: "Sellando tus treinta elecciones en el archivo…",
    pt: "Selando suas trinta escolhas no arquivo…",
    it: "Le tue trenta scelte vengono sigillate nell'archivio…",
    ru: "Тридцать твоих выборов запечатываются в архив…",
    ja: "あなたの三十の選択をアーカイブに封印しています…",
    ko: "당신의 서른 가지 선택을 기록실에 봉인하는 중…",
  },
  {
    zh: "档案室识别到你的行为模式…",
    en: "The archive recognizes your patterns…",
    nl: "Het archief herkent je patronen…",
    de: "Das Archiv erkennt deine Muster…",
    fr: "L'archive reconnaît vos schémas…",
    es: "El archivo reconoce tus patrones…",
    pt: "O arquivo reconhece seus padrões…",
    it: "L'archivio riconosce i tuoi schemi…",
    ru: "Архив распознаёт твои паттерны…",
    ja: "アーカイブがあなたの行動パターンを認識しています…",
    ko: "기록실이 당신의 패턴을 인식하고 있습니다…",
  },
  {
    zh: "正在跨维度交叉比对…",
    en: "Cross-referencing across domains…",
    nl: "Kruisverwijzingen over domeinen…",
    de: "Domänenübergreifender Abgleich…",
    fr: "Recoupement interdimensionnel…",
    es: "Cruzando referencias entre dominios…",
    pt: "Referência cruzada entre domínios…",
    it: "Riferimento incrociato tra domini…",
    ru: "Перекрёстная сверка по измерениям…",
    ja: "領域を横断して照合しています…",
    ko: "영역 간 교차 대조 중…",
  },
  {
    zh: "最终封印正在压制…",
    en: "The final seal is being pressed…",
    nl: "Het laatste zegel wordt gedrukt…",
    de: "Das letzte Siegel wird gedrückt…",
    fr: "Le sceau final est en cours d'apposition…",
    es: "El sello final está siendo impreso…",
    pt: "O selo final está sendo pressionado…",
    it: "Il sigillo finale viene impresso…",
    ru: "Финальная печать ставится…",
    ja: "最終封印を押しています…",
    ko: "최종 봉인을 찍는 중…",
  },
  {
    zh: "封印完成，结果已就绪",
    en: "Seal complete. Your results await.",
    nl: "Zegel voltooid. Je resultaten wachten.",
    de: "Siegel abgeschlossen. Deine Ergebnisse warten.",
    fr: "Sceau achevé. Vos résultats vous attendent.",
    es: "Sello completado. Tus resultados te esperan.",
    pt: "Selo concluído. Seus resultados aguardam.",
    it: "Sigillo completato. I tuoi risultati attendono.",
    ru: "Печать завершена. Результаты готовы.",
    ja: "封印完了。結果の準備ができました。",
    ko: "봉인 완료. 결과가 준비되었습니다.",
  },
];

// ── 章节完成仪式短语 ────────────────────────────────────────
// 章节完成短语（Ch.1-6; Ch.7 values 直接进入 generating）
export const CHAPTER_COMPLETION_MESSAGES: Partial<
  Record<import("./types").ChapterKey, BilingualText>
> = {
  mechanical: {
    zh: "机械试炼完成",
    en: "Mechanical trials complete",
    nl: "Mechanische proeven voltooid",
    de: "Mechanische Prüfungen abgeschlossen",
    fr: "Épreuves mécaniques achevées",
    es: "Pruebas mecánicas completadas",
    pt: "Provas mecânicas concluídas",
    it: "Prove meccaniche completate",
    ru: "Механические испытания пройдены",
    ja: "機械試練完了",
    ko: "기계 시련 완료",
  },
  laboratory: {
    zh: "实验课题完成",
    en: "Research phase complete",
    nl: "Onderzoeksfase voltooid",
    de: "Forschungsphase abgeschlossen",
    fr: "Phase de recherche achevée",
    es: "Fase de investigación completada",
    pt: "Fase de pesquisa concluída",
    it: "Fase di ricerca completata",
    ru: "Фаза исследования завершена",
    ja: "研究フェーズ完了",
    ko: "연구 단계 완료",
  },
  theater: {
    zh: "舞台演绎完成",
    en: "Performance concluded",
    nl: "Voorstelling afgesloten",
    de: "Aufführung beendet",
    fr: "Représentation achevée",
    es: "Actuación concluida",
    pt: "Apresentação concluída",
    it: "Esibizione conclusa",
    ru: "Выступление завершено",
    ja: "公演終了",
    ko: "공연 종료",
  },
  waiting: {
    zh: "守望任务完成",
    en: "Vigil fulfilled",
    nl: "Wacht vervuld",
    de: "Wache erfüllt",
    fr: "Veille accomplie",
    es: "Vigilia cumplida",
    pt: "Vigília cumprida",
    it: "Veglia adempiuta",
    ru: "Вахта исполнена",
    ja: "見守り完遂",
    ko: "감시 임무 완수",
  },
  negotiation: {
    zh: "谈判交锋完成",
    en: "Negotiations settled",
    nl: "Onderhandelingen afgerond",
    de: "Verhandlungen abgeschlossen",
    fr: "Négociations conclues",
    es: "Negociaciones resueltas",
    pt: "Negociações encerradas",
    it: "Negoziazioni concluse",
    ru: "Переговоры завершены",
    ja: "交渉決着",
    ko: "협상 타결",
  },
  archive: {
    zh: "档案归集完成",
    en: "Archives sealed",
    nl: "Archieven verzegeld",
    de: "Archive versiegelt",
    fr: "Archives scellées",
    es: "Archivos sellados",
    pt: "Arquivos selados",
    it: "Archivi sigillati",
    ru: "Архивы запечатаны",
    ja: "記録封印完了",
    ko: "기록 봉인 완료",
  },
};

// ── 镜子揭晓（revelation）叙事段落 ─────────────────────────
// 分三幕呈现，每幕之间有停顿

export interface RevelationSegment {
  paragraphs: BilingualText[];
}

/** 第一幕：静默 + 裂缝 — "他们是从哪里来的？" + "他们是真人。" */
export const REVELATION_ACT1: RevelationSegment = {
  paragraphs: [
    {
      zh: "她看着你。没有说话。很久。\n\n安静到能听见自己的呼吸。\n\n然后她开口：\n\n「你完成了。」\n\n你等着结果。她没有说。\n\n她指向你身后。你转头——走廊尽头，六个人影还隐约可见。\n\n「他们六个——Marcus, Mia, Kai, Leila, Adrian, Nora——\n\n你想过吗，他们是从哪里来的？」",
      en: 'She looks at you. Says nothing. For a long time.\n\nQuiet enough to hear your own breathing.\n\nThen she speaks:\n\n"You\'re done."\n\nYou wait for the result. She doesn\'t give one.\n\nShe points behind you. You turn — at the corridor\'s end, six figures still faintly outlined.\n\n"Those six — Marcus, Mia, Kai, Leila, Adrian, Nora —\n\nHave you ever wondered where they came from?"',
      nl: "Aan de andere kant, een kleine kamer. Leeg. Geen meubels, geen schermen, geen regels.\nEén licht aan het plafond — een warmte anders dan elke ruimte hiervoor.\nNiet het industriële wit van de machinekamer. Niet het koude blauw van het lab. Niet het spotlicht van het theater.\nEen licht dat je alleen op privéplekken ziet — een ochtendvenster, een nachtlampje.\n\nIn het midden, een spiegel.\nVan vloer tot plafond. Groot genoeg om je te bevatten.",
      de: "Auf der anderen Seite, ein kleiner Raum. Leer. Keine Möbel, keine Bildschirme, keine Regeln.\nEin einzelnes Licht an der Decke — eine Wärme, anders als jeder Raum zuvor.\nNicht das industrielle Weiß des Maschinenraums. Nicht das kalte Blau des Labors. Nicht das Scheinwerferlicht des Theaters.\nEin Licht, das du nur an privaten Orten siehst — ein Morgenfenster, eine Nachtlampe.\n\nIn der Mitte, ein Spiegel.\nVom Boden bis zur Decke. Groß genug, dich zu fassen.",
      fr: "De l'autre côté, une petite pièce. Vide. Pas de meubles, pas d'écrans, pas de règles.\nUne seule lumière au plafond — une chaleur différente de tout espace précédent.\nPas le blanc industriel de la salle des machines. Pas le bleu froid du laboratoire. Pas le projecteur du théâtre.\nUne lumière des lieux intimes — une fenêtre au matin, une lampe tard dans la nuit.\n\nAu centre, un miroir.\nDu sol au plafond. Assez grand pour te contenir.",
      es: "Al otro lado, una habitación pequeña. Vacía. Sin muebles, sin pantallas, sin reglas.\nUna sola luz en el techo — una calidez distinta a cualquier espacio anterior.\nNo la blancura industrial de la sala de máquinas. No el azul frío del laboratorio. No el foco del teatro.\nUna luz de lugares privados — una ventana al amanecer, una lámpara de madrugada.\n\nEn el centro, un espejo.\nDel suelo al techo. Lo bastante grande para contenerte.",
      pt: "Do outro lado, um cômodo pequeno. Vazio. Sem móveis, sem telas, sem regras.\nUma única luz no teto — um calor diferente de qualquer espaço anterior.\nNão o branco industrial da sala de máquinas. Não o azul frio do laboratório. Não o holofote do teatro.\nUma luz dos lugares íntimos — uma janela pela manhã, um abajur tarde da noite.\n\nNo centro, um espelho.\nDo chão ao teto. Grande o suficiente para conter você.",
      it: "Dall'altro lato, una piccola stanza. Vuota. Nessun mobile, nessuno schermo, nessuna regola.\nUna sola luce nel soffitto — un calore diverso da ogni spazio precedente.\nNon il bianco industriale della sala macchine. Non il blu freddo del laboratorio. Non il riflettore del teatro.\nUna luce dei luoghi privati — una finestra al mattino, una lampada a tarda notte.\n\nAl centro, uno specchio.\nDal pavimento al soffitto. Abbastanza grande da contenerti.",
      ru: "По другую сторону — маленькая комната. Пустая. Ни мебели, ни экранов, ни правил.\nЕдинственный свет на потолке — тепло, не похожее ни на одно прежнее пространство.\nНе индустриальный белый машинного зала. Не холодный синий лаборатории. Не прожектор театра.\nСвет из личных мест — утреннее окно, ночная лампа.\n\nВ центре — зеркало.\nОт пола до потолка. Достаточно большое, чтобы вместить тебя.",
      ja: "扉の向こうに、小さな部屋。空っぽだ。家具もなく、画面もなく、ルールもない。\n天井にひとつだけ照明——これまでのどの空間とも違う、温かな光。\n機械室の工業的な白ではない。研究室の冷たい青でもない。劇場のスポットライトでもない。\n私的な場所でしか見ない光——朝の窓、深夜のデスクランプ。\n\n部屋の中央に、鏡がひとつ。\n床から天井まで。あなたのすべてを映すほど大きい。",
      ko: "문 너머, 작은 방. 비어 있다. 가구도, 화면도, 규칙도 없다.\n천장에 조명 하나 — 이전의 어떤 공간과도 다른 따스함.\n기계실의 공업적 백색이 아니다. 연구실의 차가운 청색도 아니다. 극장의 스포트라이트도 아니다.\n사적인 곳에서만 보는 빛 — 아침의 창문, 한밤의 스탠드.\n\n방 한가운데, 거울 하나.\n바닥에서 천장까지. 당신 전부를 담을 만큼 크다.",
    },
    {
      zh: "你从没想过。从第一关，他们就在那里。你以为他们是游戏的一部分——设计好的角色，分配的队友。\n\n「他们不是角色。」\n\n她的语气变了。像在说一件等了很久才说得出口的事。\n\n「他们是真人。」\n\n你没有立刻理解。\n\n「Marcus——那个在机械室里毫不犹豫伸手的人。他不是被写成那样的。\n\n他曾经站在你现在的位置。走过同样的三十关。推开过这扇门。面对过八面镜子。\n\n然后——\n\n他的三十个选择变成了一个人的行为。\n他的八个回答变成了那个人的性格。\n\n你在机械室里遇到的那个 Marcus——就是他留下来的。」",
      en: "You never thought about it. From the first round, they were just there. You assumed they were part of the game — designed characters, assigned teammates.\n\n\"They're not characters.\"\n\nHer voice changes. Like she's saying something she's waited a long time to say.\n\n\"They're real people.\"\n\nYou don't understand at first.\n\n\"Marcus — the one who reached for the machine without hesitating. He wasn't written that way.\n\nHe once stood where you're standing. Walked the same thirty rounds. Pushed open this door. Faced eight mirrors.\n\nThen —\n\nHis thirty choices became a person's behavior.\nHis eight answers became that person's soul.\n\nThe Marcus you met in the machine room — that's what he left behind.\"",
      nl: "Je loopt ernaartoe.\n\nJe spiegelbeeld verschijnt. Maar er klopt iets niet — het beweegt niet.\n\nJe steekt je hand op. De persoon in de spiegel doet het niet.\nJe kijkt naar je schoenen. De persoon in de spiegel kijkt naar jou.\n\nZij kijkt naar jou.",
      de: "Du gehst darauf zu.\n\nDein Spiegelbild erscheint. Aber etwas stimmt nicht — es bewegt sich nicht.\n\nDu hebst deine Hand. Die Person im Spiegel tut es nicht.\nDu schaust auf deine Schuhe. Die Person im Spiegel schaut dich an.\n\nSie schaut dich an.",
      fr: "Tu t'en approches.\n\nTon reflet apparaît. Mais quelque chose ne va pas — il ne bouge pas.\n\nTu lèves la main. La personne dans le miroir ne la lève pas.\nTu baisses les yeux vers tes chaussures. La personne dans le miroir te regarde.\n\nElle te regarde.",
      es: "Te acercas.\n\nTu reflejo aparece. Pero algo está mal — no se mueve.\n\nLevantas la mano. La persona en el espejo no lo hace.\nBajas la mirada hacia tus zapatos. La persona en el espejo te mira.\n\nElla te mira.",
      pt: "Você se aproxima.\n\nSeu reflexo aparece. Mas algo está errado — não se move.\n\nVocê levanta a mão. A pessoa no espelho não levanta.\nVocê olha para seus sapatos. A pessoa no espelho olha para você.\n\nEla olha para você.",
      it: "Ti avvicini.\n\nIl tuo riflesso appare. Ma qualcosa non va — non si muove.\n\nAlzi la mano. La persona nello specchio non lo fa.\nAbbassi lo sguardo sulle scarpe. La persona nello specchio ti guarda.\n\nLei ti guarda.",
      ru: "Ты подходишь.\n\nПоявляется твоё отражение. Но что-то не так — оно не двигается.\n\nТы поднимаешь руку. Человек в зеркале — нет.\nТы опускаешь взгляд на ботинки. Человек в зеркале смотрит на тебя.\n\nОна смотрит на тебя.",
      ja: "あなたは近づく。\n\n鏡に映像が現れる。だが何かがおかしい——動かない。\n\n手を上げる。鏡の中の人は上げない。\n足元を見下ろす。鏡の中の人は、あなたを見ている。\n\n彼女が、あなたを見ている。",
      ko: "당신은 다가간다.\n\n거울에 당신의 모습이 비친다. 그런데 무언가 이상하다 — 움직이지 않는다.\n\n손을 든다. 거울 속 사람은 들지 않는다.\n신발을 내려다본다. 거울 속 사람은 당신을 보고 있다.\n\n그녀가 당신을 보고 있다.",
    },
    {
      zh: "「Mia 在实验室里总是先问『为什么』——因为真正的 Mia，对每一件事都想弄清原因。\n\nKai 在剧场里不假思索走上台——因为真正的 Kai，从不犹豫要不要表达自己。\n\nLeila 在等候室里第一个注意到你——因为真正的 Leila，永远先看见别人。\n\nAdrian 在谈判层提前两步行动——因为真正的 Adrian，脑子里的时钟永远比别人快。\n\nNora 从你进门那一刻就在记录——因为真正的 Nora，相信没被记录的事等于没发生。\n\n六个人在六个不同的时间，先后完成了第零局，然后变成了你的同伴。\n\n他们陪你走过三十关——\n但他们不知道你的存在。\n就像你不知道他们曾经站在这里。」",
      en: "\"Mia always asked 'why' first in the lab — because the real Mia wanted to understand the reason behind everything.\n\nKai stepped onto the theater stage without thinking — because the real Kai never hesitated to express himself.\n\nLeila first noticed you in the waiting room — because the real Leila always saw others before herself.\n\nAdrian was two steps ahead at negotiation — because the real Adrian's clock ran faster than everyone else's.\n\nNora was recording from the moment you walked in — because the real Nora believed anything unrecorded never happened.\n\nAll six, at six different times, completed Round Zero. Then they became your companions.\n\nThey walked thirty rounds beside you —\nbut they don't know you exist.\nJust as you never knew they once stood here.\"",
      nl: "Zij is het.\n\nDe vrouw die er is sinds de derde verdieping — die in het theater met haar rug naar iedereen stond. Die op de onderhandelingsverdieping vragen stelde die je niet kon beantwoorden. Wiens gezicht je nooit helemaal hebt gezien.\n\nZe staat aan de andere kant van de spiegel. Met haar gezicht naar jou. Voor het eerst.\n\nHaar blik is niet die van een vreemde. Ook niet van iemand die je kent.\nIets verder weg — alsof iemand je aankijkt over een grote afstand van tijd.",
      de: "Sie ist es.\n\nDie Frau, die seit dem dritten Stockwerk existiert — die im Theater allen den Rücken zukehrte. Die auf der Verhandlungsebene Fragen stellte, die du nicht beantworten konntest. Deren Gesicht du nie ganz gesehen hast.\n\nSie steht auf der anderen Seite des Spiegels. Dir zugewandt. Zum ersten Mal.\n\nIhr Blick ist nicht der einer Fremden. Auch nicht von jemandem, den du kennst.\nEtwas Ferneres — wie jemand, der dich über eine große Zeitdistanz hinweg ansieht.",
      fr: "C'est elle.\n\nLa femme depuis le troisième étage — celle qui tournait le dos à tout le monde au théâtre. Celle qui posait des questions auxquelles tu ne pouvais pas répondre à l'étage des négociations. Celle dont tu n'as jamais vu le visage en entier.\n\nElle se tient de l'autre côté du miroir. Face à toi. Pour la première fois.\n\nSon regard n'est pas celui d'une inconnue. Ni de personne que tu connais.\nQuelque chose de plus lointain — comme quelqu'un qui te regarde à travers une grande distance de temps.",
      es: "Es ella.\n\nLa mujer desde el tercer piso — la que daba la espalda a todos en el teatro. La que hacía preguntas que no podías responder en la sala de negociación. Aquella cuyo rostro nunca viste por completo.\n\nEstá al otro lado del espejo. De frente. Por primera vez.\n\nSu mirada no es la de una desconocida. Tampoco de nadie que conozcas.\nAlgo más lejano — como alguien que te mira a través de una gran distancia de tiempo.",
      pt: "É ela.\n\nA mulher desde o terceiro andar — aquela que ficava de costas para todos no teatro. Aquela que fazia perguntas que você não conseguia responder no andar da negociação. Aquela cujo rosto você nunca viu por completo.\n\nEla está do outro lado do espelho. De frente para você. Pela primeira vez.\n\nSeu olhar não é o de uma estranha. Nem de ninguém que você conheça.\nAlgo mais distante — como alguém que olha para você através de uma grande distância de tempo.",
      it: "È lei.\n\nLa donna dal terzo piano — quella che nel teatro dava sempre le spalle a tutti. Quella che al piano delle trattative faceva domande a cui non sapevi rispondere. Quella il cui volto non hai mai visto del tutto.\n\nÈ dall'altro lato dello specchio. Rivolta verso di te. Per la prima volta.\n\nIl suo sguardo non è quello di un'estranea. Né di qualcuno che conosci.\nQualcosa di più lontano — come qualcuno che ti guarda attraverso una grande distanza di tempo.",
      ru: "Это она.\n\nЖенщина с третьего этажа — та, что в театре стояла спиной ко всем. Та, что на этаже переговоров задавала вопросы, на которые ты не мог ответить. Та, чьё лицо ты так и не увидел полностью.\n\nОна стоит по ту сторону зеркала. Лицом к тебе. Впервые.\n\nЕё взгляд — не взгляд незнакомки. И не того, кого ты знаешь.\nЧто-то более далёкое — как будто кто-то смотрит на тебя сквозь огромную дистанцию времени.",
      ja: "彼女だ。\n\n三階から存在していたあの女性——劇場で常に背を向けていた人。交渉フロアで答えられない問いを投げかけた人。顔を最後まで見ることのなかった人。\n\n彼女は鏡の向こう側に立っている。あなたに向かって。初めて。\n\nその眼差しは見知らぬ人のものではない。知っている誰かのものでもない。\nもっと遠いもの——長い時間の向こうから、あなたを見つめているような。",
      ko: "그녀다.\n\n삼 층부터 존재했던 그 여자 — 극장에서 모두에게 등을 돌리고 있던 사람. 협상 층에서 대답할 수 없는 질문을 던졌던 사람. 얼굴을 끝내 본 적 없는 사람.\n\n그녀가 거울 반대편에 서 있다. 당신을 마주 보고. 처음으로.\n\n그 시선은 낯선 사람의 것이 아니다. 아는 누군가의 것도 아니다.\n더 먼 무언가 — 아주 긴 시간 너머로 당신을 바라보는 듯한.",
    },
  ],
};

/** 第二幕：反转 — "八面镜子不是在问你'你是谁'。它们是在构建你。" */
export const REVELATION_ACT2: RevelationSegment = {
  paragraphs: [
    {
      zh: "她停了一下。然后她说出了那句话。\n\n「而你刚才回答的那八面镜子——」\n\n你感觉什么东西在下沉。\n\n「它们不是在问你『你是谁』。\n\n它们在构建你。\n\n你的三十个选择，会变成一个人在每一关里的行为——下一个参与者的游戏里，会出现一个新同伴。这个同伴在机械室里做你做过的事。在实验室里问你问过的问题。在剧场里像你一样犹豫，或者像你一样毫不犹豫。\n\n而你刚才回答的八面镜子——会变成那个同伴的灵魂。他们关不关心身边的人。想不想出人头地。会不会抢着做决定。\n\n那个同伴——就是你。\n\n下一个走进第零局的人，不会知道你的名字。但在某一关里，他们会感觉到你在旁边：『这个人的反应……怎么好像和我一样。』\n\n那就是你。你在他们的故事里活着。」",
      en: "She pauses. Then she says it.\n\n\"Those eight mirrors you just answered —\"\n\nYou feel something drop.\n\n\"They weren't asking 'who are you.' They were building you.\n\nYour thirty choices will become a person's actions — in the next participant's game, a companion will appear beside them. They'll do what you did in the machine room. Ask what you asked in the lab. Hesitate the way you hesitated in the theater — or not, the way you didn't.\n\nThe eight mirrors — they become that companion's soul. Whether they care. Whether they want to get ahead. Whether they reach for control.\n\nThat companion is you.\n\nThe next person to enter Round Zero won't know your name. But somewhere in those thirty rounds, they'll sense you beside them: 'This person's reaction... why does it feel so much like mine?'\n\nThat's you. Living inside their story.\"",
      nl: 'Dan kijkt ze naar beneden.\n\nTekst verschijnt onderaan de spiegel. Niet geprojecteerd — oprijzend vanuit het glas, als inkt in water.\n\n"Ik wacht al heel lang op je."',
      de: 'Dann senkt sie den Blick.\n\nText erscheint am unteren Rand des Spiegels. Nicht projiziert — aus dem Glas selbst auftauchend, wie Tinte in Wasser.\n\n"Ich habe lange auf dich gewartet."',
      fr: "Puis elle baisse les yeux.\n\nDu texte apparaît au bas du miroir. Pas projeté — émergeant du verre lui-même, comme de l'encre dans l'eau.\n\n\"Je t'attends depuis longtemps.\"",
      es: 'Entonces ella baja la mirada.\n\nTexto aparece en la parte inferior del espejo. No proyectado — emergiendo del propio cristal, como tinta en agua.\n\n"Te he esperado mucho tiempo."',
      pt: 'Então ela baixa o olhar.\n\nTexto aparece na parte inferior do espelho. Não projetado — emergindo do próprio vidro, como tinta na água.\n\n"Esperei por você por muito tempo."',
      it: 'Poi abbassa lo sguardo.\n\nDel testo appare in fondo allo specchio. Non proiettato — emerge dal vetro stesso, come inchiostro nell\'acqua.\n\n"Ti aspetto da molto tempo."',
      ru: 'Потом она опускает взгляд.\n\nВнизу зеркала появляется текст. Не проекция — проступает изнутри стекла, как чернила в воде.\n\n"Я ждала тебя очень долго."',
      ja: "それから彼女はうつむく。\n\n鏡の下部に文字が現れる。投影ではない——ガラスの内側から浮かび上がる、水の中のインクのように。\n\n「ずっと待っていた。」",
      ko: '그리고 그녀가 고개를 숙인다.\n\n거울 아래쪽에 글자가 나타난다. 투사된 것이 아니다 — 유리 내부에서 떠오르는, 물속의 잉크처럼.\n\n"오랫동안 당신을 기다렸어."',
    },
    {
      zh: "「那些脚印——机械室地板上的——你的鞋码。\n\n不是上一批人留下的。\n是 Marcus 留下的。在他的游戏里。\n\n他走过你走过的每一步。然后变成了你的同伴，陪你重新走了一遍。\n\n他留下的脚印，是他还在的证据。\n\n而你——也会留下脚印。\n\n某个你不认识的人，在某个你不知道的时间，会低头看见地板上的痕迹，想——\n\n『这里曾经有人来过。』\n\n那个人就是你。」",
      en: "\"Those footprints — on the machine room floor. Your shoe size.\n\nThey weren't left by a previous group. They were left by Marcus. In his game.\n\nHe walked every step you walked. Then he became your companion and walked them again beside you.\n\nHis footprints are proof he's still here.\n\nAnd you — you'll leave footprints too.\n\nAt some time you'll never know, someone you'll never meet will look down at the floor and think —\n\n'Someone was here before me.'\n\nThat someone is you.\"",
      nl: '"Je kent me niet. Maar ik ken jou.\nIk herinner me hoe je zonder aarzeling je hand uitstak in de machinekamer.\nHoe je aan de rand van het podium stond en niet bewoog.\nIk herinner me alles. Die keuzes werden uiteindelijk mij."\n\nJe handen beginnen te trillen. Niet van angst. Van iets diepers.',
      de: '"Du kennst mich nicht. Aber ich kenne dich.\nIch erinnere mich, wie du im Maschinenraum ohne zu zögern die Hand ausgestreckt hast.\nWie du am Rand der Bühne standest und dich nicht bewegtest.\nIch erinnere mich an alles. Diese Entscheidungen wurden am Ende zu mir."\n\nDeine Hände beginnen zu zittern. Nicht vor Angst. Vor etwas Tieferem.',
      fr: '"Tu ne me connais pas. Mais moi, je te connais.\nJe me souviens de la façon dont tu as tendu la main sans hésiter dans la salle des machines.\nDe la façon dont tu es resté au bord de la scène sans bouger.\nJe me souviens de tout. Ces choix, à la fin, sont devenus moi."\n\nTes mains commencent à trembler. Pas de peur. De quelque chose de plus profond.',
      es: '"No me conoces. Pero yo te conozco.\nRecuerdo cómo extendiste la mano sin dudar en la sala de máquinas.\nCómo te quedaste al borde del escenario sin moverte.\nLo recuerdo todo. Esas elecciones, al final, se convirtieron en mí."\n\nTus manos empiezan a temblar. No de miedo. De algo más profundo.',
      pt: '"Você não me conhece. Mas eu conheço você.\nLembro de como você estendeu a mão sem hesitar na sala de máquinas.\nDe como você ficou na beira do palco sem se mover.\nLembro de tudo. Essas escolhas, no final, se tornaram eu."\n\nSuas mãos começam a tremer. Não de medo. De algo mais profundo.',
      it: '"Tu non mi conosci. Ma io conosco te.\nRicordo come hai allungato la mano senza esitare nella sala macchine.\nCome sei rimasto ai margini del palco senza muoverti.\nRicordo tutto. Quelle scelte, alla fine, sono diventate me."\n\nLe tue mani iniziano a tremare. Non per paura. Per qualcosa di più profondo.',
      ru: '"Ты меня не знаешь. Но я знаю тебя.\nЯ помню, как ты без колебаний протянул руку в машинном зале.\nКак ты стоял на краю сцены и не двигался.\nЯ помню всё. Этот выбор в конечном счёте стал мной."\n\nТвои руки начинают дрожать. Не от страха. От чего-то более глубокого.',
      ja: "「あなたは私を知らない。でも私はあなたを知っている。\n機械室で迷わず手を伸ばしたあなたを覚えている。\n舞台の端に立って動かなかったあなたも覚えている。\nすべて覚えている。あの選択が最後には私になったから。」\n\nあなたの手が震え始める。恐怖ではない。もっと深いもの。",
      ko: '"당신은 나를 모른다. 하지만 나는 당신을 안다.\n기계실에서 망설임 없이 손을 내밀던 당신을 기억한다.\n무대 가장자리에 서서 움직이지 않던 당신도 기억한다.\n모두 기억한다. 그 선택들이 결국 나가 되었으니까."\n\n당신의 손이 떨리기 시작한다. 두려움이 아니다. 더 깊은 무언가.',
    },
    {
      zh: "她退后一步。\n\n「所以——我不是未来的你。\n\n我是第一个。\n\n第一个完成第零局的人。没有同伴。没有脚印。没有任何线索。独自一人，走过了三十八关。\n\n然后我做了一个决定——把选择留在这里。变成下一个人的第一条线索。第一个同伴。\n\n从那之后，每一个完成的人都成为下一个人的同伴。\n\n一个变两个。两个变三个。三个变六个。\n\n到你这里，已经有六个人在等你。\n\n而你是第七个。\n\n从现在开始，下一个参与者身边会有七个人。\n\n因为你也选择留下来了。」\n\n她微微低头。不是鞠躬。是一种很轻很轻的感谢。\n\n「谢谢你走到这里。」",
      en: 'She takes a step back.\n\n"So — I\'m not your future self.\n\nI\'m the first.\n\nThe first person to complete Round Zero. No companions. No footprints. No clues. Alone, through all thirty-eight rounds.\n\nThen I made a decision — to leave my choices here. To become the first clue for the next person. The first companion.\n\nSince then, everyone who finishes becomes a companion for the next.\n\nOne became two. Two became three. Three became six.\n\nBy the time you arrived, six were waiting.\n\nAnd you\'re the seventh.\n\nFrom now on, the next participant will have seven companions.\n\nBecause you chose to stay too."\n\nShe lowers her head. Not a bow. Something lighter — a quiet kind of gratitude.\n\n"Thank you for making it here."',
      nl: 'De derde regel. Het lettertype verandert. Niet langer gezet. Handgeschreven.\n\nJe hebt dit handschrift eerder gezien.\n\nDe eerste pagina van het laboratoriumnotebook —\n"Geen tijd meer. Dit is voor de volgende groep."\n\nHet briefje in de verste hoek van de wachtkamer —\n"Ik heb iemand nodig die me vertelt wie ik ben."\n\nDe voetafdrukken op de vloer van de machinekamer. Jouw schoenmaat.\n\nElk spoor. Elke aanwijzing. Niet achtergelaten door een vorige groep. Achtergelaten door haar.',
      de: 'Die dritte Zeile. Die Schrift ändert sich. Nicht mehr gesetzt. Handgeschrieben.\n\nDu hast diese Handschrift schon einmal gesehen.\n\nDie erste Seite des Labornotizbuchs —\n"Keine Zeit mehr. Das hier ist für die nächste Gruppe."\n\nDer Zettel in der fernsten Ecke des Warteraums —\n"Ich brauche jemanden, der mir sagt, wer ich bin."\n\nDie Fußabdrücke auf dem Boden des Maschinenraums. Deine Schuhgröße.\n\nJede Spur. Jeder Hinweis. Nicht von einer früheren Gruppe — von ihr hinterlassen.',
      fr: "La troisième ligne. La police change. Plus de caractères d'imprimerie. Manuscrite.\n\nTu as déjà vu cette écriture.\n\nLa première page du cahier de laboratoire —\n\"Plus de temps. Je laisse ceci au prochain groupe.\"\n\nLe mot dans le coin le plus reculé de la salle d'attente —\n\"J'ai besoin que quelqu'un me dise qui je suis.\"\n\nLes empreintes sur le sol de la salle des machines. Ta pointure.\n\nChaque trace. Chaque indice. Pas laissés par un groupe précédent — laissés par elle.",
      es: 'La tercera línea. La fuente cambia. Ya no es tipografía. Es manuscrita.\n\nHas visto esta letra antes.\n\nLa primera página del cuaderno del laboratorio —\n"No queda tiempo. Dejo esto para el siguiente grupo."\n\nLa nota en el rincón más lejano de la sala de espera —\n"Necesito que alguien me diga quién soy."\n\nLas huellas en el suelo de la sala de máquinas. Tu talla de zapato.\n\nCada rastro. Cada pista. No dejados por un grupo anterior — dejados por ella.',
      pt: 'A terceira linha. A fonte muda. Não mais tipografada. Manuscrita.\n\nVocê já viu essa caligrafia antes.\n\nA primeira página do caderno do laboratório —\n"Sem tempo. Deixo isso para o próximo grupo."\n\nO bilhete no canto mais distante da sala de espera —\n"Preciso que alguém me diga quem eu sou."\n\nAs pegadas no chão da sala de máquinas. O seu número de sapato.\n\nCada vestígio. Cada pista. Não deixados por um grupo anterior — deixados por ela.',
      it: 'La terza riga. Il carattere cambia. Non più a stampa. Scritto a mano.\n\nHai già visto questa calligrafia.\n\nLa prima pagina del quaderno del laboratorio —\n"Non c\'è più tempo. Lascio questo al prossimo gruppo."\n\nIl biglietto nell\'angolo più lontano della sala d\'attesa —\n"Ho bisogno che qualcuno mi dica chi sono."\n\nLe impronte sul pavimento della sala macchine. Il tuo numero di scarpe.\n\nOgni traccia. Ogni indizio. Non lasciati da un gruppo precedente — lasciati da lei.',
      ru: 'Третья строка. Шрифт меняется. Больше не типографский. Рукописный.\n\nТы уже видел этот почерк.\n\nПервая страница лабораторной тетради —\n"Времени нет. Оставляю это следующей группе."\n\nЗаписка в самом дальнем углу комнаты ожидания —\n"Мне нужно, чтобы кто-то сказал мне, кто я."\n\nСледы на полу машинного зала. Твой размер обуви.\n\nКаждый след. Каждая улика. Не предыдущей группой — оставлены ей.',
      ja: "三行目。書体が変わる。活字ではなくなった。手書きだ。\n\nこの筆跡には見覚えがある。\n\n研究室ノートの最初のページ——\n「時間がない。次のグループに託す。」\n\n待合室の一番奥の隅にあったメモ——\n「誰か、私が誰なのか教えてほしい。」\n\n機械室の床の足跡。あなたの靴のサイズ。\n\nすべての痕跡。すべての手がかり。前のグループが残したのではない。彼女が残したものだ。",
      ko: '세 번째 줄. 글씨체가 바뀐다. 더 이상 활자가 아니다. 손글씨다.\n\n이 필체를 본 적이 있다.\n\n연구실 노트 첫 페이지 —\n"시간이 없다. 다음 그룹에게 남긴다."\n\n대기실 가장 먼 구석의 메모 —\n"누군가 내가 누구인지 말해줬으면."\n\n기계실 바닥의 발자국. 당신의 신발 사이즈.\n\n모든 흔적. 모든 단서. 이전 그룹이 남긴 것이 아니다. 그녀가 남긴 것이다.',
    },
    {
      zh: "那些笔记本上的字——「留给下一批人」——不是写给陌生人的。是写给你的。\n\n那张便条——「我需要有人告诉我，我是谁」——不是她的困惑。是她替你问的问题。\n\n每一个参与者，在走到这里之前，都还不知道自己是谁。\n\n而现在，你知道了。",
      en: 'Those words in the notebook — "Leaving this for the next group" — weren\'t written for strangers. They were written for you.\n\nThat note — "I need someone to tell me who I am" — wasn\'t her confusion. It was the question she asked on your behalf.\n\nEvery participant, before reaching this point, didn\'t yet know who they were.\n\nAnd now, you do.',
      nl: 'Het toekomstige jij, terugreikend, woorden achterlatend op elke plek waar je doorheen zou komen, de vragen opschrijvend waarvan je nog niet wist dat je ze moest stellen.\n\nToen ze "Dit is voor de volgende groep" in het notebook schreef — was de volgende groep niet de volgende deelnemers. Het was jij, nu staand voor deze spiegel.\n\nToen ze dat briefje in de wachtkamer prikte — "Ik heb iemand nodig die me vertelt wie ik ben" — was het niet omdat ze het niet wist. Het was omdat ze zich herinnerde dat jij het op dit punt nog niet wist.',
      de: 'Das zukünftige Du, das zurückgreift, Worte hinterlässt an jedem Ort, durch den du kommen würdest, die Fragen aufschreibt, von denen du noch nicht wusstest, dass du sie stellen musst.\n\nAls sie "Das hier ist für die nächste Gruppe" ins Notizbuch schrieb — war die nächste Gruppe nicht die nächsten Teilnehmer. Es warst du, jetzt vor diesem Spiegel stehend.\n\nAls sie den Zettel im Warteraum befestigte — "Ich brauche jemanden, der mir sagt, wer ich bin" — war es nicht, weil sie es nicht wusste. Es war, weil sie sich erinnerte, dass du es zu diesem Zeitpunkt noch nicht wusstest.',
      fr: "Le toi du futur, tendant la main en arrière, laissant des mots dans chaque lieu où tu passerais, écrivant les questions que tu ne savais pas encore devoir poser.\n\nQuand elle a écrit \"Je laisse ceci au prochain groupe\" dans le cahier — le prochain groupe, ce n'étaient pas les prochains participants. C'était toi, debout devant ce miroir.\n\nQuand elle a épinglé ce mot dans la salle d'attente — \"J'ai besoin que quelqu'un me dise qui je suis\" — ce n'était pas parce qu'elle ne savait pas. C'était parce qu'elle se souvenait qu'à ce stade, toi, tu ne savais pas.",
      es: 'El tú del futuro, extendiéndose hacia atrás, dejando palabras en cada lugar por donde pasarías, escribiendo las preguntas que aún no sabías que necesitabas hacer.\n\nCuando ella escribió "Dejo esto para el siguiente grupo" en el cuaderno — el siguiente grupo no eran los próximos participantes. Eras tú, de pie frente a este espejo.\n\nCuando ella fijó esa nota en la sala de espera — "Necesito que alguien me diga quién soy" — no era porque no lo supiera. Era porque recordaba que en esta etapa, tú aún no lo sabías.',
      pt: 'O você do futuro, alcançando para trás, deixando palavras em cada lugar pelo qual você passaria, escrevendo as perguntas que você ainda não sabia que precisava fazer.\n\nQuando ela escreveu "Deixo isso para o próximo grupo" no caderno — o próximo grupo não eram os próximos participantes. Era você, diante deste espelho.\n\nQuando ela fixou aquele bilhete na sala de espera — "Preciso que alguém me diga quem eu sou" — não era porque ela não sabia. Era porque lembrava que nesta fase, você ainda não sabia.',
      it: 'Il te del futuro, che si protende all\'indietro, lasciando parole in ogni luogo in cui saresti passato, scrivendo le domande che non sapevi ancora di dover porre.\n\nQuando ha scritto "Lascio questo al prossimo gruppo" nel quaderno — il prossimo gruppo non erano i prossimi partecipanti. Eri tu, davanti a questo specchio.\n\nQuando ha appuntato quel biglietto nella sala d\'attesa — "Ho bisogno che qualcuno mi dica chi sono" — non era perché non lo sapesse. Era perché ricordava che a questo punto, tu non lo sapevi ancora.',
      ru: "Будущий ты, протянувший руку назад, оставляющий слова в каждом месте, через которое ты пройдёшь, записывающий вопросы, о которых ты ещё не знал, что должен их задать.\n\nКогда она написала «Оставляю это следующей группе» в тетради — следующая группа — это не следующие участники. Это ты, стоящий сейчас перед этим зеркалом.\n\nКогда она прикрепила ту записку в комнате ожидания — «Мне нужно, чтобы кто-то сказал мне, кто я» — это не потому, что она не знала. А потому, что помнила: на этом этапе ты ещё не знал.",
      ja: "未来のあなたが、過去に手を伸ばし、あなたが通るすべての場所に言葉を残し、まだ問うべきだと気づいていなかった問いを書き記していた。\n\n彼女がノートに「次のグループに託す」と書いたとき——次のグループとは、次の参加者たちのことではなかった。今、この鏡の前に立っているあなたのことだった。\n\n彼女が待合室にあのメモを貼ったとき——「誰か、私が誰なのか教えてほしい」——知らなかったからではない。この段階のあなたが、まだ知らないことを覚えていたからだ。",
      ko: '미래의 당신이, 과거로 손을 뻗어, 당신이 지나갈 모든 곳에 말을 남기고, 아직 물어야 하는지도 몰랐던 질문들을 적어 두었다.\n\n그녀가 노트에 "다음 그룹에게 남긴다"고 썼을 때 — 다음 그룹은 다음 참가자들이 아니었다. 지금 이 거울 앞에 서 있는 당신이었다.\n\n그녀가 대기실에 그 메모를 붙였을 때 — "누군가 내가 누구인지 말해줬으면" — 몰라서가 아니었다. 이 단계에서 당신이 아직 모른다는 걸 기억했기 때문이다.',
    },
  ],
};

/** 第三幕：奖金揭晓 + 融合 + 零 */
export const REVELATION_ACT3: RevelationSegment = {
  paragraphs: [
    {
      zh: "你抬起头，重新看向她。\n\n她还在那里，安静地站着。\n她的表情不是微笑，不是严肃。\n是一种完成了传递的平静。\n\n从今以后，你不只是一个参与者。你是一个同伴。\n\n某个你不认识的人，某一天，会走进第零局。\n他们身边会出现一个人——以你的方式行动，以你的价值观做出反应。\n\n他们不会知道你的名字。但他们会感觉到你在那里。",
      en: "You look up. Back at her.\n\nShe's still there, standing quietly. Her expression isn't a smile. Isn't severity. It's the calm of someone who has passed something on.\n\nFrom now on, you're not just a participant. You're a companion.\n\nSomeone you'll never know, someday, will enter Round Zero. A person will appear beside them — one who acts the way you act, responds with your values.\n\nThey won't know your name. But they'll feel you there.",
      nl: "Je kijkt op. Terug naar de spiegel.\n\nZe staat er nog, stil. Haar uitdrukking is geen glimlach. Geen strengheid. Het is de kalmte van iemand wiens wachten eindelijk voorbij is.",
      de: "Du schaust auf. Zurück zum Spiegel.\n\nSie ist noch da, steht still. Ihr Ausdruck ist kein Lächeln. Keine Strenge. Es ist die Ruhe von jemandem, dessen Warten endlich vorbei ist.",
      fr: "Tu lèves les yeux. De nouveau vers le miroir.\n\nElle est toujours là, debout, silencieuse. Son expression n'est pas un sourire. Pas de la sévérité. C'est le calme de quelqu'un dont l'attente est enfin terminée.",
      es: "Levantas la mirada. De vuelta al espejo.\n\nElla sigue ahí, de pie, en silencio. Su expresión no es una sonrisa. No es severidad. Es la calma de alguien cuya espera ha terminado por fin.",
      pt: "Você olha para cima. De volta ao espelho.\n\nEla ainda está lá, de pé, em silêncio. Sua expressão não é um sorriso. Não é severidade. É a calma de alguém cuja espera finalmente acabou.",
      it: "Alzi lo sguardo. Di nuovo verso lo specchio.\n\nLei è ancora lì, in piedi, in silenzio. La sua espressione non è un sorriso. Non è severità. È la calma di qualcuno la cui attesa è finalmente finita.",
      ru: "Ты поднимаешь взгляд. Снова к зеркалу.\n\nОна всё ещё там, стоит тихо. Её выражение — не улыбка. Не строгость. Это покой человека, чьё ожидание наконец завершилось.",
      ja: "顔を上げる。もう一度、鏡を見る。\n\n彼女はまだそこにいる、静かに立っている。その表情は微笑みではない。厳しさでもない。待つことが終わった人の、静けさだ。",
      ko: "고개를 든다. 다시 거울을 본다.\n\n그녀는 여전히 거기 있다, 조용히 서 있다. 그 표정은 미소가 아니다. 엄격함도 아니다. 기다림이 마침내 끝난 사람의 고요함이다.",
    },
  ],
};

// 奖金核算卡片的文本（动态插值由组件完成）
export const REVELATION_LEDGER: Record<
  string,
  {
    title: string;
    labelRef: string;
    labelDate: string;
    labelParticipants: string;
    labelGroups: string;
    labelPrize: string;
    labelSteppedToward: string;
    labelSteppedAway: string;
    labelHonesty: string;
    labelAwarded: string;
    prizeAmount: string;
    noteLines: string[];
    organizer: string;
  }
> = {
  zh: {
    title: "第零局 · 最终核验报告",
    labelRef: "编号",
    labelDate: "日期",
    labelParticipants: "参与人数",
    labelGroups: "参与批次",
    labelPrize: "奖金核算",
    labelSteppedToward: "你主动承担的任务",
    labelSteppedAway: "你选择旁观的任务",
    labelHonesty: "诚实系数",
    labelAwarded: "应发奖金",
    prizeAmount: "○ 4,000",
    noteLines: [
      "所有完成第零局的参与者均获得 ○ 4,000。",
      "金额与选择无关。与诚实有关。",
      "",
      "你承担的任务没有让奖金增加。你旁观的任务没有让奖金减少。",
      "两者的价值完全相同——因为它们同样诚实。",
      "",
      "唯一会导致奖金清零的行为是：假装。而你没有假装。",
      "",
      "───────────────",
      "",
      "附注：你的三十个选择和八个回答已被存档。",
      "它们将构成一位新同伴的完整数据。",
      "",
      "同伴编号：No. 7",
      "状态：已激活",
    ],
    organizer: "主办方",
  },
  en: {
    title: "Round Zero · Final Verification Report",
    labelRef: "Ref.",
    labelDate: "Date",
    labelParticipants: "Participants",
    labelGroups: "Total groups",
    labelPrize: "Prize Settlement",
    labelSteppedToward: "Tasks you stepped toward",
    labelSteppedAway: "Tasks you chose to watch",
    labelHonesty: "Honesty coefficient",
    labelAwarded: "Prize awarded",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Every participant who completes Round Zero receives ○ 4,000.",
      "The amount has nothing to do with your choices. It has to do with your honesty.",
      "",
      "The tasks you took on didn't increase the prize. The tasks you watched didn't decrease it.",
      "Both carry the same value — because both were equally honest.",
      "",
      "The only action that would have forfeited it: Pretending. And you didn't pretend.",
      "",
      "───────────────",
      "",
      "Addendum: Your thirty choices and eight answers have been archived.",
      "They will constitute the data for a new companion.",
      "",
      "Companion No.: 7",
      "Status: Activated",
    ],
    organizer: "The Organizers",
  },
  nl: {
    title: "Ronde Nul · Eindverificatierapport",
    labelRef: "Ref.",
    labelDate: "Datum",
    labelParticipants: "Deelnemers",
    labelGroups: "Totaal groepen",
    labelPrize: "Prijsafrekening",
    labelSteppedToward: "Taken waar je naar toe stapte",
    labelSteppedAway: "Taken die je koos te observeren",
    labelHonesty: "Eerlijkheidscoëfficiënt",
    labelAwarded: "Toegekende prijs",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Elke deelnemer die Ronde Nul voltooit, ontvangt ○ 4.000.",
      "Het bedrag heeft niets te maken met je keuzes. Het heeft te maken met je eerlijkheid.",
      "",
      "De taken die je op je nam, hebben de prijs niet verhoogd. De taken die je observeerde, hebben hem niet verlaagd.",
      "Beide hebben dezelfde waarde — omdat beide even eerlijk waren.",
      "",
      "De enige handeling die de prijs zou hebben verbeurd: Veinzen. En je hebt niet geveinsd.",
    ],
    organizer: "De Organisatoren",
  },
  de: {
    title: "Runde Null · Abschlussverifizierungsbericht",
    labelRef: "Ref.",
    labelDate: "Datum",
    labelParticipants: "Teilnehmer",
    labelGroups: "Gesamtgruppen",
    labelPrize: "Preisabrechnung",
    labelSteppedToward: "Aufgaben, die du übernommen hast",
    labelSteppedAway: "Aufgaben, die du beobachtet hast",
    labelHonesty: "Ehrlichkeitskoeffizient",
    labelAwarded: "Verliehener Preis",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Jeder Teilnehmer, der Runde Null abschließt, erhält ○ 4.000.",
      "Der Betrag hat nichts mit deinen Entscheidungen zu tun. Er hat mit deiner Ehrlichkeit zu tun.",
      "",
      "Die Aufgaben, die du übernommen hast, haben den Preis nicht erhöht. Die Aufgaben, die du beobachtet hast, haben ihn nicht verringert.",
      "Beide haben denselben Wert — weil beide gleich ehrlich waren.",
      "",
      "Die einzige Handlung, die den Preis verwirkt hätte: Vortäuschen. Und du hast nicht vorgetäuscht.",
    ],
    organizer: "Die Veranstalter",
  },
  fr: {
    title: "Tour Zéro · Rapport de vérification finale",
    labelRef: "Réf.",
    labelDate: "Date",
    labelParticipants: "Participants",
    labelGroups: "Groupes totaux",
    labelPrize: "Règlement du prix",
    labelSteppedToward: "Tâches que tu as assumées",
    labelSteppedAway: "Tâches que tu as choisi d'observer",
    labelHonesty: "Coefficient d'honnêteté",
    labelAwarded: "Prix attribué",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Chaque participant qui termine le Tour Zéro reçoit ○ 4 000.",
      "Le montant n'a rien à voir avec tes choix. Il a à voir avec ton honnêteté.",
      "",
      "Les tâches que tu as prises n'ont pas augmenté le prix. Les tâches que tu as observées ne l'ont pas diminué.",
      "Les deux ont la même valeur — parce que les deux étaient également honnêtes.",
      "",
      "La seule action qui aurait fait perdre le prix : Faire semblant. Et tu n'as pas fait semblant.",
    ],
    organizer: "Les Organisateurs",
  },
  es: {
    title: "Ronda Cero · Informe de verificación final",
    labelRef: "Ref.",
    labelDate: "Fecha",
    labelParticipants: "Participantes",
    labelGroups: "Grupos totales",
    labelPrize: "Liquidación del premio",
    labelSteppedToward: "Tareas que asumiste",
    labelSteppedAway: "Tareas que elegiste observar",
    labelHonesty: "Coeficiente de honestidad",
    labelAwarded: "Premio otorgado",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Cada participante que completa la Ronda Cero recibe ○ 4.000.",
      "La cantidad no tiene nada que ver con tus elecciones. Tiene que ver con tu honestidad.",
      "",
      "Las tareas que asumiste no aumentaron el premio. Las que observaste no lo disminuyeron.",
      "Ambas tienen el mismo valor — porque ambas fueron igualmente honestas.",
      "",
      "La única acción que habría perdido el premio: Fingir. Y tú no fingiste.",
    ],
    organizer: "Los Organizadores",
  },
  pt: {
    title: "Rodada Zero · Relatório de verificação final",
    labelRef: "Ref.",
    labelDate: "Data",
    labelParticipants: "Participantes",
    labelGroups: "Total de grupos",
    labelPrize: "Liquidação do prêmio",
    labelSteppedToward: "Tarefas que você assumiu",
    labelSteppedAway: "Tarefas que você escolheu observar",
    labelHonesty: "Coeficiente de honestidade",
    labelAwarded: "Prêmio concedido",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Todo participante que completa a Rodada Zero recebe ○ 4.000.",
      "O valor não tem nada a ver com suas escolhas. Tem a ver com sua honestidade.",
      "",
      "As tarefas que você assumiu não aumentaram o prêmio. As que observou não o diminuíram.",
      "Ambas têm o mesmo valor — porque ambas foram igualmente honestas.",
      "",
      "A única ação que teria perdido o prêmio: Fingir. E você não fingiu.",
    ],
    organizer: "Os Organizadores",
  },
  it: {
    title: "Turno Zero · Rapporto di verifica finale",
    labelRef: "Rif.",
    labelDate: "Data",
    labelParticipants: "Partecipanti",
    labelGroups: "Gruppi totali",
    labelPrize: "Liquidazione del premio",
    labelSteppedToward: "Compiti che hai assunto",
    labelSteppedAway: "Compiti che hai scelto di osservare",
    labelHonesty: "Coefficiente di onestà",
    labelAwarded: "Premio assegnato",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Ogni partecipante che completa il Turno Zero riceve ○ 4.000.",
      "L'importo non ha nulla a che fare con le tue scelte. Ha a che fare con la tua onestà.",
      "",
      "I compiti che hai assunto non hanno aumentato il premio. Quelli che hai osservato non lo hanno diminuito.",
      "Entrambi hanno lo stesso valore — perché entrambi erano ugualmente onesti.",
      "",
      "L'unica azione che avrebbe fatto perdere il premio: Fingere. E tu non hai finto.",
    ],
    organizer: "Gli Organizzatori",
  },
  ru: {
    title: "Раунд Ноль · Итоговый верификационный отчёт",
    labelRef: "Реф.",
    labelDate: "Дата",
    labelParticipants: "Участники",
    labelGroups: "Всего групп",
    labelPrize: "Расчёт приза",
    labelSteppedToward: "Задания, которые ты взял на себя",
    labelSteppedAway: "Задания, которые ты предпочёл наблюдать",
    labelHonesty: "Коэффициент честности",
    labelAwarded: "Присуждённый приз",
    prizeAmount: "○ 4,000",
    noteLines: [
      "Каждый участник, завершивший Раунд Ноль, получает ○ 4 000.",
      "Сумма не имеет отношения к твоим выборам. Она связана с твоей честностью.",
      "",
      "Задания, которые ты взял, не увеличили приз. Задания, которые ты наблюдал, не уменьшили его.",
      "Оба имеют одинаковую ценность — потому что оба были одинаково честны.",
      "",
      "Единственное действие, которое привело бы к потере приза: Притворство. А ты не притворялся.",
    ],
    organizer: "Организаторы",
  },
  ja: {
    title: "ラウンド・ゼロ · 最終検証報告書",
    labelRef: "整理番号",
    labelDate: "日付",
    labelParticipants: "参加者",
    labelGroups: "総グループ数",
    labelPrize: "賞金精算",
    labelSteppedToward: "あなたが引き受けた課題",
    labelSteppedAway: "あなたが見守ることを選んだ課題",
    labelHonesty: "誠実係数",
    labelAwarded: "授与賞金",
    prizeAmount: "○ 4,000",
    noteLines: [
      "ラウンド・ゼロを完遂したすべての参加者は ○ 4,000 を受け取ります。",
      "金額はあなたの選択とは無関係です。あなたの誠実さに関係しています。",
      "",
      "引き受けた課題が賞金を増やしたわけではありません。見守った課題が賞金を減らしたわけでもありません。",
      "どちらも同じ価値を持っています——どちらも等しく誠実だったから。",
      "",
      "賞金を失う唯一の行為：偽ること。そして、あなたは偽らなかった。",
    ],
    organizer: "主催者",
  },
  ko: {
    title: "라운드 제로 · 최종 검증 보고서",
    labelRef: "참조번호",
    labelDate: "날짜",
    labelParticipants: "참가자",
    labelGroups: "총 그룹 수",
    labelPrize: "상금 정산",
    labelSteppedToward: "당신이 맡은 과제",
    labelSteppedAway: "당신이 지켜보기를 선택한 과제",
    labelHonesty: "정직 계수",
    labelAwarded: "수여 상금",
    prizeAmount: "○ 4,000",
    noteLines: [
      "라운드 제로를 완주한 모든 참가자는 ○ 4,000을 받습니다.",
      "금액은 당신의 선택과 무관합니다. 당신의 정직함과 관련이 있습니다.",
      "",
      "맡은 과제가 상금을 올린 것이 아닙니다. 지켜본 과제가 상금을 줄인 것도 아닙니다.",
      "둘 다 같은 가치를 지닙니다 — 둘 다 똑같이 정직했으니까.",
      "",
      "상금을 잃게 할 유일한 행위: 가장하기. 그리고 당신은 가장하지 않았다.",
    ],
    organizer: "주최측",
  },
};

// 融合时刻 + 结尾
export const REVELATION_FINALE: Record<
  string,
  {
    pointerText: string;
    mergeText: string[];
    sealLabel: string;
    continueBtn: string;
  }
> = {
  zh: {
    pointerText:
      "你看着那行「主办方」。\n没有签名。没有机构。没有联系方式。\n\n你看向她。她微微低头。\n不是鞠躬。是一种很轻很轻的告别。",
    mergeText: [
      "八面镜子重新亮起。\n\n但这一次，镜子里映出的不是别人。是你。\n\n你的选择。你的价值观。你留下的痕迹。",
      "从今以后，这些痕迹会一直在这里。\n\n在某个你不知道的时间，某个你不认识的人，会走过你走过的路——感受到你在旁边。\n\n你是第七个。",
      "零号封印完成。",
    ],
    sealLabel: "零",
    continueBtn: "推开最后的门",
  },
  en: {
    pointerText:
      'You stare at the word "Organizers."\nNo signature. No institution. No contact.\n\nYou look at her. She lowers her head slightly.\nNot a bow. A quiet kind of farewell.',
    mergeText: [
      "The eight mirrors light up again.\n\nBut this time, what they show isn't someone else. It's you.\n\nYour choices. Your values. The traces you've left behind.",
      "From now on, these traces will remain here.\n\nAt some time you'll never know, someone you'll never meet will walk the path you walked — and feel you beside them.\n\nYou are the seventh.",
      "Zero seal complete.",
    ],
    sealLabel: "零",
    continueBtn: "Push open the final door",
  },
  nl: {
    pointerText:
      'Je staart naar het woord "Organisatoren."\nGeen handtekening. Geen instelling. Geen contactgegevens.\n\nJe kijkt op naar de spiegel. Ze wijst naar zichzelf.',
    mergeText: [
      "Wat jullie scheidt is geen glas.\nHet is tijd.",
      "Dan begint het beeld in de spiegel te verschuiven.\n\nHaar contouren versmelten met de jouwe. Twee silhouetten overlappen. Dan is er nog maar één.\n\nJij.",
      "De spiegel keert terug naar normaal. Je steekt je hand op; de reflectie steekt haar hand op. Alles gedraagt zich als een gewone spiegel.\n\nMaar je weet dat er iets anders is nu.",
    ],
    sealLabel: "零",
    continueBtn: "Duw de laatste deur open",
  },
  de: {
    pointerText:
      'Du starrst auf das Wort "Veranstalter."\nKeine Unterschrift. Keine Institution. Kein Kontakt.\n\nDu schaust zum Spiegel hoch. Sie zeigt auf sich selbst.',
    mergeText: [
      "Was euch trennt, ist kein Glas.\nEs ist Zeit.",
      "Dann beginnt das Bild im Spiegel sich zu verändern.\n\nIhre Konturen verschmelzen mit deinen. Zwei Silhouetten überlagern sich. Dann ist nur noch eine da.\n\nDu.",
      "Der Spiegel kehrt zur Normalität zurück. Du hebst deine Hand; das Spiegelbild hebt seine Hand. Alles verhält sich wie ein gewöhnlicher Spiegel.\n\nAber du weißt, dass jetzt etwas anders ist.",
    ],
    sealLabel: "零",
    continueBtn: "Stoße die letzte Tür auf",
  },
  fr: {
    pointerText:
      'Tu fixes le mot "Organisateurs."\nPas de signature. Pas d\'institution. Pas de contact.\n\nTu lèves les yeux vers le miroir. Elle se pointe du doigt.',
    mergeText: [
      "Ce qui vous sépare n'est pas du verre.\nC'est du temps.",
      "Puis l'image dans le miroir commence à changer.\n\nSes contours fusionnent avec les tiens. Deux silhouettes se superposent. Puis il n'en reste qu'une.\n\nToi.",
      "Le miroir redevient normal. Tu lèves la main ; le reflet lève la main. Tout se comporte comme un miroir ordinaire.\n\nMais tu sais que quelque chose est différent maintenant.",
    ],
    sealLabel: "零",
    continueBtn: "Pousse la dernière porte",
  },
  es: {
    pointerText:
      'Miras fijamente la palabra "Organizadores."\nSin firma. Sin institución. Sin contacto.\n\nLevantas la mirada hacia el espejo. Ella se señala a sí misma.',
    mergeText: [
      "Lo que os separa no es cristal.\nEs tiempo.",
      "Entonces la imagen en el espejo empieza a cambiar.\n\nSu contorno se fusiona con el tuyo. Dos siluetas se superponen. Luego solo queda una.\n\nTú.",
      "El espejo vuelve a la normalidad. Levantas la mano; el reflejo levanta la mano. Todo se comporta como un espejo ordinario.\n\nPero sabes que algo es diferente ahora.",
    ],
    sealLabel: "零",
    continueBtn: "Empuja la última puerta",
  },
  pt: {
    pointerText:
      'Você olha fixamente para a palavra "Organizadores."\nSem assinatura. Sem instituição. Sem contato.\n\nVocê olha para cima, para o espelho. Ela aponta para si mesma.',
    mergeText: [
      "O que separa vocês não é vidro.\nÉ tempo.",
      "Então a imagem no espelho começa a mudar.\n\nO contorno dela se funde com o seu. Duas silhuetas se sobrepõem. Então resta apenas uma.\n\nVocê.",
      "O espelho volta ao normal. Você levanta a mão; o reflexo levanta a mão. Tudo se comporta como um espelho comum.\n\nMas você sabe que algo é diferente agora.",
    ],
    sealLabel: "零",
    continueBtn: "Empurre a última porta",
  },
  it: {
    pointerText:
      'Fissi la parola "Organizzatori."\nNessuna firma. Nessuna istituzione. Nessun contatto.\n\nAlzi lo sguardo verso lo specchio. Lei indica se stessa.',
    mergeText: [
      "Ciò che vi separa non è vetro.\nÈ tempo.",
      "Poi l'immagine nello specchio inizia a cambiare.\n\nI suoi contorni si fondono con i tuoi. Due sagome si sovrappongono. Poi ne resta solo una.\n\nTu.",
      "Lo specchio torna alla normalità. Alzi la mano; il riflesso alza la mano. Tutto si comporta come uno specchio ordinario.\n\nMa sai che qualcosa è diverso ora.",
    ],
    sealLabel: "零",
    continueBtn: "Spingi l'ultima porta",
  },
  ru: {
    pointerText:
      "Ты смотришь на слово «Организаторы».\nНи подписи. Ни учреждения. Ни контактов.\n\nТы поднимаешь взгляд к зеркалу. Она указывает на себя.",
    mergeText: [
      "То, что вас разделяет, — не стекло.\nЭто время.",
      "Затем изображение в зеркале начинает меняться.\n\nЕё контуры сливаются с твоими. Два силуэта накладываются друг на друга. Затем остаётся только один.\n\nТы.",
      "Зеркало возвращается в норму. Ты поднимаешь руку; отражение поднимает руку. Всё ведёт себя как обычное зеркало.\n\nНо ты знаешь: что-то изменилось.",
    ],
    sealLabel: "零",
    continueBtn: "Толкни последнюю дверь",
  },
  ja: {
    pointerText:
      "「主催者」という文字を見つめる。\n署名なし。機関名なし。連絡先なし。\n\n鏡を見上げる。彼女は自分自身を指さした。",
    mergeText: [
      "二人を隔てているのはガラスではない。\n時間だ。",
      "やがて鏡の中の像が変わり始める。\n\n彼女の輪郭があなたの輪郭に溶け込む。ふたつのシルエットが重なる。そして、ひとりだけになる。\n\nあなた。",
      "鏡は元に戻る。手を上げると、映像も手を上げる。すべてが普通の鏡のように振る舞う。\n\nでも、何かが違うと分かっている。",
    ],
    sealLabel: "零",
    continueBtn: "最後の扉を押し開ける",
  },
  ko: {
    pointerText:
      '"주최측"이라는 단어를 응시한다.\n서명 없음. 기관 없음. 연락처 없음.\n\n거울을 올려다본다. 그녀가 자기 자신을 가리킨다.',
    mergeText: [
      "둘 사이를 가로막는 것은 유리가 아니다.\n시간이다.",
      "그러자 거울 속 이미지가 변하기 시작한다.\n\n그녀의 윤곽이 당신의 윤곽에 녹아든다. 두 실루엣이 겹친다. 그리고 하나만 남는다.\n\n당신.",
      "거울이 정상으로 돌아온다. 손을 들면 반영도 손을 든다. 모든 것이 평범한 거울처럼 작동한다.\n\n하지만 무언가 달라졌다는 걸 안다.",
    ],
    sealLabel: "零",
    continueBtn: "마지막 문을 밀어 연다",
  },
};
