// ============================================================
// Proactive Coach Messages — generates context-aware messages
// based on user journey state. Pure algorithmic, 0 LLM calls.
//
// Trigger points:
//   - quick_dive_complete: after Quick Dive results
//   - deep_dive_complete: after Deep Dive 86 questions done
//   - report_viewed: after user views their career report
//   - return_nudge: user hasn't visited in 3+ days
// ============================================================

import type { CreateCoachMessageParams } from "@/lib/db/coach-messages";

// ── Message trigger types ─────

export type MessageTrigger =
  | "welcome"
  | "quick_dive_complete"
  | "deep_dive_complete"
  | "report_generated"
  | "report_viewed"
  | "return_nudge"
  | "profile_generated"
  | "action_plan_created";

// ── Message templates ─────

interface MessageTemplate {
  type: CreateCoachMessageParams["type"];
  content: { en: string; zh: string; [key: string]: string };
  actionUrl?: string;
}

const MESSAGE_TEMPLATES: Record<MessageTrigger, MessageTemplate> = {
  welcome: {
    type: "welcome",
    content: {
      en: "Welcome to Deep Dive. I'm here as a companion on your career exploration — not to give you answers, but to help you discover what you already know about yourself. Ready to start?",
      zh: "欢迎来到 Deep Dive。我是你职业探索路上的伙伴——不是来给你答案的，而是帮你发现你已经知道的关于自己的东西。准备好了吗？",
      nl: "Welkom bij Deep Dive. Ik ben hier als metgezel op je loopbaanverkenning — niet om je antwoorden te geven, maar om je te helpen ontdekken wat je al over jezelf weet. Klaar om te beginnen?",
      de: "Willkommen bei Deep Dive. Ich bin dein Begleiter auf deiner beruflichen Erkundung — nicht um dir Antworten zu geben, sondern um dir zu helfen, das zu entdecken, was du bereits über dich weißt. Bereit loszulegen?",
      fr: "Bienvenue sur Deep Dive. Je suis ici pour t'accompagner dans ton exploration de carrière — non pas pour te donner des réponses, mais pour t'aider à découvrir ce que tu sais déjà sur toi-même. Prêt·e à commencer ?",
      es: "Bienvenido/a a Deep Dive. Estoy aquí como compañero en tu exploración profesional — no para darte respuestas, sino para ayudarte a descubrir lo que ya sabes sobre ti. ¿Listo/a para empezar?",
      pt: "Bem-vindo/a ao Deep Dive. Estou aqui como companheiro na sua exploração de carreira — não para dar respostas, mas para ajudá-lo/a a descobrir o que já sabe sobre si mesmo/a. Pronto/a para começar?",
      it: "Benvenuto/a in Deep Dive. Sono qui come compagno nel tuo percorso di esplorazione professionale — non per darti risposte, ma per aiutarti a scoprire ciò che già sai di te. Pronto/a a iniziare?",
      ru: "Добро пожаловать в Deep Dive. Я здесь как спутник в твоём карьерном исследовании — не чтобы давать ответы, а чтобы помочь обнаружить то, что ты уже знаешь о себе. Готов(а) начать?",
      ja: "Deep Diveへようこそ。私はあなたのキャリア探索の伴走者です。答えを与えるためではなく、すでに自分について知っていることを発見するお手伝いをします。始めましょうか？",
      ko: "Deep Dive에 오신 것을 환영합니다. 저는 당신의 커리어 탐색 여정의 동반자입니다. 답을 주기 위해서가 아니라, 이미 자신에 대해 알고 있는 것을 발견하도록 도와드리겠습니다. 시작할 준비가 되셨나요?",
    },
    actionUrl: "/quick-dive",
  },
  quick_dive_complete: {
    type: "guide",
    content: {
      en: "Your Quick Dive results are in. I noticed something interesting in your RIASEC profile — there's a tension there that most people overlook. Want to take a look?",
      zh: "你的 Quick Dive 结果出来了。我在你的 RIASEC 画像里注意到了一些有意思的东西——有个张力是大多数人会忽略的。想看看吗？",
      nl: "Je Quick Dive-resultaten zijn binnen. Ik zag iets interessants in je RIASEC-profiel — er zit een spanning die de meeste mensen over het hoofd zien. Wil je even kijken?",
      de: "Deine Quick-Dive-Ergebnisse sind da. Mir ist etwas Interessantes in deinem RIASEC-Profil aufgefallen — da gibt es eine Spannung, die die meisten übersehen. Möchtest du einen Blick darauf werfen?",
      fr: "Tes résultats Quick Dive sont arrivés. J'ai remarqué quelque chose d'intéressant dans ton profil RIASEC — il y a une tension que la plupart des gens ne voient pas. Tu veux y jeter un œil ?",
      es: "Tus resultados de Quick Dive están listos. Noté algo interesante en tu perfil RIASEC — hay una tensión que la mayoría pasa por alto. ¿Quieres echar un vistazo?",
      pt: "Seus resultados do Quick Dive chegaram. Notei algo interessante no seu perfil RIASEC — há uma tensão que a maioria das pessoas não percebe. Quer dar uma olhada?",
      it: "I tuoi risultati Quick Dive sono pronti. Ho notato qualcosa di interessante nel tuo profilo RIASEC — c'è una tensione che la maggior parte delle persone ignora. Vuoi dare un'occhiata?",
      ru: "Результаты Quick Dive готовы. Я заметил(а) кое-что интересное в твоём RIASEC-профиле — есть напряжение, которое большинство людей упускает. Хочешь взглянуть?",
      ja: "Quick Diveの結果が出ました。あなたのRIASECプロフィールに興味深いことに気づきました。ほとんどの人が見落とす緊張関係があります。見てみますか？",
      ko: "Quick Dive 결과가 나왔습니다. 당신의 RIASEC 프로필에서 흥미로운 점을 발견했어요. 대부분의 사람들이 간과하는 긴장 관계가 있습니다. 살펴보시겠어요?",
    },
    actionUrl: "/dashboard",
  },
  deep_dive_complete: {
    type: "guide",
    content: {
      en: "All 86 questions complete. Your deep profile is being built now — this is where things get interesting. The patterns across your personality, values, and career orientation tell a story that a quick test never could.",
      zh: "86 题全部完成。你的深度档案正在生成中——这才是真正有意思的地方。你的人格、价值观和职业取向之间的交叉模式，讲述了一个快速测试永远说不出的故事。",
      nl: "Alle 86 vragen voltooid. Je diepteportret wordt nu opgebouwd — hier wordt het pas echt interessant. De patronen in je persoonlijkheid, waarden en loopbaanoriëntatie vertellen een verhaal dat een snelle test nooit kan vertellen.",
      de: "Alle 86 Fragen abgeschlossen. Dein Tiefenprofil wird jetzt erstellt — hier wird es wirklich interessant. Die Muster zwischen deiner Persönlichkeit, deinen Werten und deiner Berufsorientierung erzählen eine Geschichte, die ein schneller Test nie könnte.",
      fr: "Les 86 questions sont terminées. Ton profil approfondi est en cours de création — c'est là que les choses deviennent vraiment intéressantes. Les schémas entre ta personnalité, tes valeurs et ton orientation professionnelle racontent une histoire qu'un test rapide ne pourrait jamais raconter.",
      es: "Las 86 preguntas completadas. Tu perfil profundo se está generando ahora — aquí es donde las cosas se ponen interesantes. Los patrones entre tu personalidad, valores y orientación profesional cuentan una historia que una prueba rápida nunca podría contar.",
      pt: "Todas as 86 perguntas concluídas. Seu perfil profundo está sendo construído agora — é aqui que as coisas ficam interessantes. Os padrões entre sua personalidade, valores e orientação profissional contam uma história que um teste rápido jamais contaria.",
      it: "Tutte le 86 domande completate. Il tuo profilo approfondito è in fase di costruzione — è qui che le cose diventano davvero interessanti. I modelli tra la tua personalità, i tuoi valori e il tuo orientamento professionale raccontano una storia che un test rapido non potrebbe mai raccontare.",
      ru: "Все 86 вопросов завершены. Твой глубинный профиль сейчас формируется — вот тут становится по-настоящему интересно. Закономерности между твоей личностью, ценностями и карьерной ориентацией рассказывают историю, которую быстрый тест никогда не расскажет.",
      ja: "86問すべて完了しました。あなたの深層プロフィールを作成中です。ここからが本当に面白くなります。性格、価値観、キャリア志向の交差パターンが、簡易テストでは決して語れない物語を紡ぎます。",
      ko: "86개의 질문을 모두 완료했습니다. 심층 프로필이 지금 구축되고 있습니다. 여기서부터 정말 흥미로워집니다. 성격, 가치관, 직업 지향성의 교차 패턴이 간단한 테스트로는 절대 전할 수 없는 이야기를 들려줍니다.",
    },
  },
  report_generated: {
    type: "guide",
    content: {
      en: "Your career report is ready. Before you read it, I want you to know: this isn't a verdict on who you are. It's a mirror — and mirrors sometimes show us things we didn't expect. Take your time with it.",
      zh: "你的职业报告已经生成了。在你读之前，我想让你知道：这不是对你是谁的宣判。它是一面镜子——而镜子有时会让我们看到意料之外的东西。慢慢看。",
      nl: "Je loopbaanrapport is klaar. Voordat je het leest, wil ik dat je weet: dit is geen oordeel over wie je bent. Het is een spiegel — en spiegels laten ons soms dingen zien die we niet verwachtten. Neem de tijd.",
      de: "Dein Karrierebericht ist fertig. Bevor du ihn liest, möchte ich, dass du weißt: Das ist kein Urteil darüber, wer du bist. Es ist ein Spiegel — und Spiegel zeigen uns manchmal Dinge, die wir nicht erwartet haben. Nimm dir Zeit dafür.",
      fr: "Ton rapport de carrière est prêt. Avant de le lire, je veux que tu saches : ce n'est pas un verdict sur qui tu es. C'est un miroir — et les miroirs nous montrent parfois des choses inattendues. Prends ton temps.",
      es: "Tu informe de carrera está listo. Antes de leerlo, quiero que sepas: esto no es un veredicto sobre quién eres. Es un espejo — y los espejos a veces nos muestran cosas que no esperábamos. Tómate tu tiempo.",
      pt: "Seu relatório de carreira está pronto. Antes de ler, quero que saiba: isso não é um veredito sobre quem você é. É um espelho — e espelhos às vezes nos mostram coisas que não esperávamos. Leve o tempo que precisar.",
      it: "Il tuo report di carriera è pronto. Prima di leggerlo, voglio che tu sappia: non è un verdetto su chi sei. È uno specchio — e gli specchi a volte ci mostrano cose che non ci aspettavamo. Prenditi il tuo tempo.",
      ru: "Твой карьерный отчёт готов. Прежде чем ты его прочитаешь, хочу, чтобы ты знал(а): это не приговор о том, кто ты. Это зеркало — а зеркала иногда показывают нам то, чего мы не ожидали. Не спеши.",
      ja: "キャリアレポートが完成しました。読む前に知っておいてほしいことがあります。これはあなたが誰であるかの判決ではありません。鏡なのです。そして鏡は時に予想しなかったものを映し出します。ゆっくり読んでください。",
      ko: "커리어 리포트가 완성되었습니다. 읽기 전에 알아두세요: 이것은 당신이 누구인지에 대한 판결이 아닙니다. 거울입니다. 거울은 때로 예상치 못한 것을 보여주기도 합니다. 천천히 살펴보세요.",
    },
    actionUrl: "/report",
  },
  report_viewed: {
    type: "insight",
    content: {
      en: "You've seen your report. Was there anything that surprised you? Anything that felt off? Those reactions are often more revealing than the report itself. I'm here if you want to talk about it.",
      zh: "你看过报告了。有什么让你惊讶的吗？有什么感觉不太对的地方吗？这些反应往往比报告本身更能说明问题。想聊聊的话，我在这里。",
      nl: "Je hebt je rapport gezien. Was er iets dat je verraste? Iets dat niet klopte? Die reacties zeggen vaak meer dan het rapport zelf. Ik ben er als je erover wilt praten.",
      de: "Du hast deinen Bericht gesehen. Gab es etwas, das dich überrascht hat? Etwas, das sich falsch anfühlte? Diese Reaktionen sind oft aufschlussreicher als der Bericht selbst. Ich bin hier, wenn du darüber reden möchtest.",
      fr: "Tu as vu ton rapport. Y a-t-il eu quelque chose qui t'a surpris·e ? Quelque chose qui sonnait faux ? Ces réactions sont souvent plus révélatrices que le rapport lui-même. Je suis là si tu veux en parler.",
      es: "Has visto tu informe. ¿Hubo algo que te sorprendió? ¿Algo que no encajaba? Esas reacciones suelen ser más reveladoras que el informe en sí. Estoy aquí si quieres hablar de ello.",
      pt: "Você viu seu relatório. Houve algo que te surpreendeu? Algo que pareceu errado? Essas reações costumam revelar mais do que o próprio relatório. Estou aqui se quiser conversar sobre isso.",
      it: "Hai visto il tuo report. C'è stato qualcosa che ti ha sorpreso? Qualcosa che non quadrava? Quelle reazioni spesso rivelano più del report stesso. Sono qui se vuoi parlarne.",
      ru: "Ты видел(а) свой отчёт. Было что-то, что удивило? Что-то, что показалось неправильным? Эти реакции часто говорят больше, чем сам отчёт. Я здесь, если хочешь об этом поговорить.",
      ja: "レポートをご覧になりましたね。驚いたことはありましたか？しっくりこなかった部分は？そうした反応は、レポートそのものよりも多くを語ることがよくあります。話したくなったら、いつでもここにいます。",
      ko: "리포트를 보셨군요. 놀라운 점이 있었나요? 맞지 않다고 느낀 부분은요? 그런 반응은 종종 리포트 자체보다 더 많은 것을 드러냅니다. 이야기하고 싶으시면 여기 있을게요.",
    },
    actionUrl: "/coaching",
  },
  return_nudge: {
    type: "nudge",
    content: {
      en: "Haven't seen you in a while. No pressure — career exploration isn't a race. But I've been thinking about something from your profile that might be worth revisiting when you're ready.",
      zh: "有段时间没见到你了。不着急——职业探索不是比赛。不过我一直在想你档案里的一些东西，等你准备好了也许值得重新看看。",
      nl: "Het is een tijdje geleden. Geen druk — loopbaanverkenning is geen wedstrijd. Maar ik heb nagedacht over iets uit je profiel dat misschien de moeite waard is om opnieuw te bekijken wanneer je klaar bent.",
      de: "Lange nicht gesehen. Kein Druck — Karriereerkundung ist kein Wettrennen. Aber ich habe über etwas aus deinem Profil nachgedacht, das es wert sein könnte, noch einmal anzuschauen, wenn du bereit bist.",
      fr: "Ça fait un moment. Pas de pression — l'exploration de carrière n'est pas une course. Mais j'ai réfléchi à quelque chose dans ton profil qui pourrait valoir la peine d'être revisité quand tu seras prêt·e.",
      es: "Hace tiempo que no te veo. Sin presión — la exploración profesional no es una carrera. Pero he estado pensando en algo de tu perfil que podría valer la pena revisitar cuando estés listo/a.",
      pt: "Faz tempo que não te vejo. Sem pressão — exploração de carreira não é uma corrida. Mas estive pensando em algo do seu perfil que talvez valha a pena revisitar quando estiver pronto/a.",
      it: "È passato un po' di tempo. Nessuna fretta — l'esplorazione professionale non è una gara. Ma ho riflettuto su qualcosa del tuo profilo che potrebbe valere la pena rivisitare quando ti sentirai pronto/a.",
      ru: "Давно не виделись. Никакого давления — исследование карьеры — это не гонка. Но я думал(а) о кое-чём из твоего профиля, к чему, возможно, стоит вернуться, когда будешь готов(а).",
      ja: "しばらくお見かけしませんでした。焦る必要はありません。キャリア探索はレースではないのですから。ただ、あなたのプロフィールの中で気になっていることがあります。準備ができたら、もう一度見直してみる価値があるかもしれません。",
      ko: "한동안 뵙지 못했네요. 부담 갖지 마세요. 커리어 탐색은 경쟁이 아니니까요. 다만 당신의 프로필에서 다시 살펴볼 가치가 있을 만한 것이 떠올랐습니다. 준비되시면 알려주세요.",
    },
  },
  profile_generated: {
    type: "insight",
    content: {
      en: "Your personal profile is complete. There's an interesting pattern between your strongest personality traits and your value priorities — they point in the same direction, but with an unexpected twist.",
      zh: "你的个人档案完成了。你最突出的人格特质和价值观优先级之间有一个有意思的模式——它们指向同一个方向，但有一个意想不到的转折。",
      nl: "Je persoonlijk profiel is klaar. Er is een interessant patroon tussen je sterkste persoonlijkheidseigenschappen en je waardeprioreiten — ze wijzen dezelfde richting op, maar met een onverwachte wending.",
      de: "Dein persönliches Profil ist fertig. Es gibt ein interessantes Muster zwischen deinen stärksten Persönlichkeitsmerkmalen und deinen Werteprioritäten — sie zeigen in die gleiche Richtung, aber mit einer unerwarteten Wendung.",
      fr: "Ton profil personnel est terminé. Il y a un schéma intéressant entre tes traits de personnalité les plus forts et tes priorités de valeurs — ils pointent dans la même direction, mais avec un tournant inattendu.",
      es: "Tu perfil personal está completo. Hay un patrón interesante entre tus rasgos de personalidad más fuertes y tus prioridades de valores — apuntan en la misma dirección, pero con un giro inesperado.",
      pt: "Seu perfil pessoal está completo. Há um padrão interessante entre seus traços de personalidade mais fortes e suas prioridades de valores — apontam na mesma direção, mas com uma reviravolta inesperada.",
      it: "Il tuo profilo personale è completo. C'è un pattern interessante tra i tuoi tratti di personalità più forti e le tue priorità di valori — puntano nella stessa direzione, ma con una svolta inaspettata.",
      ru: "Твой личный профиль готов. Между твоими сильнейшими чертами личности и приоритетами ценностей есть интересная закономерность — они указывают в одном направлении, но с неожиданным поворотом.",
      ja: "パーソナルプロフィールが完成しました。あなたの最も強い性格特性と価値観の優先順位の間に興味深いパターンがあります。同じ方向を指しているのですが、予想外のひねりがあります。",
      ko: "개인 프로필이 완성되었습니다. 가장 강한 성격 특성과 가치관 우선순위 사이에 흥미로운 패턴이 있습니다. 같은 방향을 가리키고 있지만, 예상치 못한 반전이 있어요.",
    },
    actionUrl: "/profile",
  },
  action_plan_created: {
    type: "guide",
    content: {
      en: "You've created an action plan — that's a significant step. The gap between insight and action is where most people get stuck. Which item on your list feels most alive to you right now?",
      zh: "你创建了行动计划——这是很重要的一步。从洞察到行动的跨越，是大多数人卡住的地方。你列表里哪一项现在让你最有感觉？",
      nl: "Je hebt een actieplan gemaakt — dat is een belangrijke stap. De kloof tussen inzicht en actie is waar de meeste mensen vastlopen. Welk punt op je lijst voelt op dit moment het meest levendig?",
      de: "Du hast einen Aktionsplan erstellt — das ist ein bedeutender Schritt. Die Lücke zwischen Erkenntnis und Handeln ist der Punkt, an dem die meisten stecken bleiben. Welcher Punkt auf deiner Liste fühlt sich gerade am lebendigsten an?",
      fr: "Tu as créé un plan d'action — c'est une étape importante. L'écart entre la prise de conscience et l'action est l'endroit où la plupart des gens restent bloqués. Quel élément de ta liste te parle le plus en ce moment ?",
      es: "Has creado un plan de acción — es un paso importante. La brecha entre el conocimiento y la acción es donde la mayoría se queda atascada. ¿Qué elemento de tu lista te genera más energía ahora mismo?",
      pt: "Você criou um plano de ação — esse é um passo significativo. A lacuna entre percepção e ação é onde a maioria das pessoas fica presa. Qual item da sua lista parece mais vivo para você agora?",
      it: "Hai creato un piano d'azione — è un passo significativo. Il divario tra consapevolezza e azione è dove la maggior parte delle persone si blocca. Quale punto della tua lista ti sembra più vivo in questo momento?",
      ru: "Ты создал(а) план действий — это важный шаг. Разрыв между осознанием и действием — это то место, где большинство застревает. Какой пункт в твоём списке ощущается сейчас наиболее живым?",
      ja: "アクションプランを作成しましたね。これは大きな一歩です。洞察と行動の間のギャップは、多くの人がつまずくところです。リストの中で、今一番心が動く項目はどれですか？",
      ko: "행동 계획을 만드셨군요. 이것은 의미 있는 한 걸음입니다. 통찰과 행동 사이의 간극이 대부분의 사람들이 막히는 지점입니다. 목록에서 지금 가장 마음이 끌리는 항목은 무엇인가요?",
    },
    actionUrl: "/action-hub",
  },
};

// ── Generator ─────

/**
 * Generate a proactive coach message for a given trigger.
 * Returns params ready for createCoachMessage(), or null if trigger is unknown.
 */
export function generateProactiveMessage(
  userId: string,
  trigger: MessageTrigger,
): CreateCoachMessageParams | null {
  const template = MESSAGE_TEMPLATES[trigger];
  if (!template) return null;

  return {
    userId,
    type: template.type,
    trigger,
    content: template.content,
    actionUrl: template.actionUrl ?? null,
  };
}

/**
 * Get all available trigger types (for admin/debug).
 */
export function getAvailableTriggers(): MessageTrigger[] {
  return Object.keys(MESSAGE_TEMPLATES) as MessageTrigger[];
}
