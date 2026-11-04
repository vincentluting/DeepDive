// ============================================================
// SCC-12 (Self-Concept Clarity Scale)
//
// Original English source:
//   Campbell, J. D., Trapnell, P. D., Heine, S. J., Katz, I. M.,
//   Lavallee, L. F., & Lehman, D. R. (1996). Self-concept clarity:
//   Measurement, personality correlates, and cultural boundaries.
//   Journal of Personality and Social Psychology, 70(1), 141–156.
//   https://doi.org/10.1037/0022-3514.70.1.141
//
// Chinese translation (text_zh):
//   One Chinese-language SCC-12 wording candidate, adapted from work by
//   Niu Gengfeng et al. circa 2016 in 心理科学 (Psychological Science,
//   China). The exact source article — author list, volume, issue, page
//   range — has NOT been verified in code review and must be confirmed
//   against the printed journal before quoting in the thesis methods
//   chapter. Treat this comment as a pointer for follow-up, not as a
//   verified citation.
//
// Other 9 locales (nl/de/fr/es/pt/it/ru/ja/ko) translated in-house for this
// study; not formally back-translation validated — flag in thesis Limitations
// if non-en/zh participants exceed a small minority of the sample.
//
// 12-item scale, 5-point Likert:
//   1 = Strongly Disagree / 非常不同意
//   5 = Strongly Agree   / 非常同意
//
// Scoring: items marked isReversed=true are reverse-scored (6 - response).
// Total score range: 12–60. Higher = greater self-concept clarity.
// ============================================================

export interface SCCQuestion {
  id: string;
  text_en: string;
  text_zh: string;
  text_nl: string;
  text_de: string;
  text_fr: string;
  text_es: string;
  text_pt: string;
  text_it: string;
  text_ru: string;
  text_ja: string;
  text_ko: string;
  /** Items where higher agreement indicates LOWER clarity — must be reversed before summing */
  isReversed: boolean;
}

export interface SCCResponses {
  [questionId: string]: number; // raw response 1–5
}

export const SCC_QUESTIONS: SCCQuestion[] = [
  {
    id: "scc1",
    text_en: "My beliefs about myself often conflict with one another.",
    text_zh: "我对自己的一些看法经常互相矛盾。",
    text_nl: "Mijn overtuigingen over mezelf zijn vaak tegenstrijdig.",
    text_de:
      "Meine Überzeugungen über mich selbst stehen oft im Widerspruch zueinander.",
    text_fr: "Mes convictions sur moi-même sont souvent contradictoires.",
    text_es:
      "Mis creencias sobre mí mismo/a a menudo entran en conflicto entre sí.",
    text_pt:
      "Minhas crenças sobre mim mesmo/a frequentemente entram em conflito umas com as outras.",
    text_it:
      "Le mie convinzioni su me stesso/a sono spesso in conflitto tra loro.",
    text_ru: "Мои представления о себе часто противоречат друг другу.",
    text_ja: "自分に対する信念がしばしば互いに矛盾する。",
    text_ko: "나 자신에 대한 믿음이 종종 서로 충돌한다.",
    isReversed: true,
  },
  {
    id: "scc2",
    text_en:
      "On one day I might have one opinion of myself and on another day I might have a different opinion.",
    text_zh: "有时我对自己持有一种看法，另一些时候我又会有另一种不同的看法。",
    text_nl:
      "De ene dag heb ik misschien de ene mening over mezelf en de andere dag een andere mening.",
    text_de:
      "An einem Tag habe ich vielleicht eine Meinung über mich und an einem anderen Tag eine andere.",
    text_fr:
      "Un jour je peux avoir une opinion de moi-même et un autre jour une opinion différente.",
    text_es:
      "Un día puedo tener una opinión de mí mismo/a y otro día una opinión diferente.",
    text_pt:
      "Num dia posso ter uma opinião sobre mim e noutro dia posso ter uma opinião diferente.",
    text_it:
      "Un giorno potrei avere un'opinione di me stesso/a e un altro giorno un'opinione diversa.",
    text_ru:
      "В один день я могу иметь одно мнение о себе, а в другой день — другое.",
    text_ja:
      "ある日は自分についてある意見を持ち、別の日には違う意見を持つことがある。",
    text_ko:
      "어떤 날은 나 자신에 대해 한 가지 의견을 가지고, 다른 날은 다른 의견을 가질 수 있다.",
    isReversed: true,
  },
  {
    id: "scc3",
    text_en:
      "I spend a lot of time wondering about what kind of person I really am.",
    text_zh: "我花很长时间来思索我究竟是什么样的一种人。",
    text_nl:
      "Ik besteed veel tijd aan het nadenken over wat voor persoon ik werkelijk ben.",
    text_de:
      "Ich verbringe viel Zeit damit, mich zu fragen, was für ein Mensch ich wirklich bin.",
    text_fr:
      "Je passe beaucoup de temps à me demander quel genre de personne je suis vraiment.",
    text_es:
      "Paso mucho tiempo preguntándome qué tipo de persona soy realmente.",
    text_pt:
      "Passo muito tempo me perguntando que tipo de pessoa eu realmente sou.",
    text_it: "Passo molto tempo a chiedermi che tipo di persona sono davvero.",
    text_ru:
      "Я трачу много времени, размышляя о том, что я за человек на самом деле.",
    text_ja: "自分が本当にどんな人間なのか考えることに多くの時間を費やす。",
    text_ko: "내가 정말로 어떤 사람인지 궁금해하며 많은 시간을 보낸다.",
    isReversed: true,
  },
  {
    id: "scc4",
    text_en:
      "Sometimes I feel that I am not really the person that I appear to be.",
    text_zh: "有时候我感觉我不全是我看起来的那个样子。",
    text_nl:
      "Soms heb ik het gevoel dat ik niet echt de persoon ben die ik lijk te zijn.",
    text_de:
      "Manchmal habe ich das Gefühl, dass ich nicht wirklich die Person bin, die ich zu sein scheine.",
    text_fr:
      "Parfois, j'ai l'impression de ne pas être vraiment la personne que je semble être.",
    text_es: "A veces siento que no soy realmente la persona que aparento ser.",
    text_pt: "Às vezes sinto que não sou realmente a pessoa que aparento ser.",
    text_it:
      "A volte sento di non essere veramente la persona che sembro essere.",
    text_ru:
      "Иногда я чувствую, что на самом деле я не тот человек, которым кажусь.",
    text_ja: "自分が見せている姿は本当の自分ではないと感じることがある。",
    text_ko: "때때로 내가 보이는 모습이 진짜 내가 아닌 것 같다고 느낀다.",
    isReversed: true,
  },
  {
    id: "scc5",
    text_en:
      "When I think about the kind of person I have been in the past, I'm not sure what I was really like.",
    text_zh: "回想过去，我不确定我到底是什么样的人。",
    text_nl:
      "Als ik nadenk over wat voor persoon ik in het verleden was, weet ik niet zeker hoe ik echt was.",
    text_de:
      "Wenn ich darüber nachdenke, was für ein Mensch ich in der Vergangenheit war, bin ich mir nicht sicher, wie ich wirklich war.",
    text_fr:
      "Quand je pense au genre de personne que j'ai été dans le passé, je ne suis pas sûr(e) de ce que j'étais vraiment.",
    text_es:
      "Cuando pienso en el tipo de persona que he sido en el pasado, no estoy seguro/a de cómo era realmente.",
    text_pt:
      "Quando penso no tipo de pessoa que fui no passado, não tenho certeza de como eu realmente era.",
    text_it:
      "Quando penso al tipo di persona che sono stato/a in passato, non sono sicuro/a di come fossi davvero.",
    text_ru:
      "Когда я думаю о том, каким человеком я был(а) в прошлом, я не уверен(а), каким(ой) я был(а) на самом деле.",
    text_ja:
      "過去の自分がどんな人間だったか考えると、本当はどうだったのかよく分からない。",
    text_ko:
      "과거에 어떤 사람이었는지 생각해보면, 실제로 어떤 사람이었는지 확신이 없다.",
    isReversed: true,
  },
  {
    id: "scc6",
    text_en:
      "I seldom experience conflict between the different aspects of my personality.",
    text_zh: "我很少体验到我性格不同方面的冲突。",
    text_nl:
      "Ik ervaar zelden conflicten tussen de verschillende aspecten van mijn persoonlijkheid.",
    text_de:
      "Ich erlebe selten Konflikte zwischen den verschiedenen Aspekten meiner Persönlichkeit.",
    text_fr:
      "Je vis rarement des conflits entre les différents aspects de ma personnalité.",
    text_es:
      "Rara vez experimento conflictos entre los diferentes aspectos de mi personalidad.",
    text_pt:
      "Raramente vivencio conflitos entre os diferentes aspectos da minha personalidade.",
    text_it:
      "Raramente vivo conflitti tra i diversi aspetti della mia personalità.",
    text_ru:
      "Я редко испытываю конфликт между различными сторонами своей личности.",
    text_ja: "自分の性格の異なる側面の間で葛藤を感じることはめったにない。",
    text_ko: "내 성격의 다양한 측면들 사이에서 갈등을 거의 겪지 않는다.",
    isReversed: false,
  },
  {
    id: "scc7",
    text_en: "Sometimes I think I know other people better than I know myself.",
    text_zh: "有时候我觉得我对别人的了解好于对自己的了解。",
    text_nl: "Soms denk ik dat ik andere mensen beter ken dan mezelf.",
    text_de:
      "Manchmal denke ich, dass ich andere Menschen besser kenne als mich selbst.",
    text_fr: "Parfois, je pense que je connais mieux les autres que moi-même.",
    text_es:
      "A veces creo que conozco a otras personas mejor que a mí mismo/a.",
    text_pt:
      "Às vezes acho que conheço outras pessoas melhor do que a mim mesmo/a.",
    text_it:
      "A volte penso di conoscere gli altri meglio di quanto conosca me stesso/a.",
    text_ru: "Иногда мне кажется, что я знаю других людей лучше, чем себя.",
    text_ja: "他の人のことは自分自身よりもよく知っていると思うことがある。",
    text_ko: "때때로 다른 사람들을 나 자신보다 더 잘 알고 있다고 생각한다.",
    isReversed: true,
  },
  {
    id: "scc8",
    text_en: "My beliefs about myself seem to change very frequently.",
    text_zh: "我对自己的看法似乎比较频繁的变化。",
    text_nl: "Mijn overtuigingen over mezelf lijken heel vaak te veranderen.",
    text_de:
      "Meine Überzeugungen über mich selbst scheinen sich sehr häufig zu ändern.",
    text_fr: "Mes convictions sur moi-même semblent changer très fréquemment.",
    text_es:
      "Mis creencias sobre mí mismo/a parecen cambiar con mucha frecuencia.",
    text_pt:
      "Minhas crenças sobre mim mesmo/a parecem mudar com muita frequência.",
    text_it:
      "Le mie convinzioni su me stesso/a sembrano cambiare molto frequentemente.",
    text_ru: "Мои представления о себе, похоже, меняются очень часто.",
    text_ja: "自分に対する信念がとても頻繁に変わるように思う。",
    text_ko: "나 자신에 대한 믿음이 매우 자주 바뀌는 것 같다.",
    isReversed: true,
  },
  {
    id: "scc9",
    text_en:
      "If I were asked to describe my personality, my description might end up being different from one day to another day.",
    text_zh: "如果让我来描述自己的性格，或许每天我的描述都不一样。",
    text_nl:
      "Als mij gevraagd werd mijn persoonlijkheid te beschrijven, zou mijn beschrijving van de ene dag op de andere kunnen verschillen.",
    text_de:
      "Wenn ich meine Persönlichkeit beschreiben sollte, könnte meine Beschreibung von einem Tag zum nächsten unterschiedlich ausfallen.",
    text_fr:
      "Si on me demandait de décrire ma personnalité, ma description pourrait être différente d'un jour à l'autre.",
    text_es:
      "Si me pidieran describir mi personalidad, mi descripción podría ser diferente de un día para otro.",
    text_pt:
      "Se me pedissem para descrever minha personalidade, minha descrição poderia ser diferente de um dia para o outro.",
    text_it:
      "Se mi chiedessero di descrivere la mia personalità, la mia descrizione potrebbe essere diversa da un giorno all'altro.",
    text_ru:
      "Если бы меня попросили описать мою личность, мое описание могло бы отличаться от одного дня к другому.",
    text_ja:
      "自分の性格を描写するよう求められたら、日によって違う答えになるかもしれない。",
    text_ko: "내 성격을 묘사해 달라고 하면, 그 설명이 하루하루 달라질 수 있다.",
    isReversed: true,
  },
  {
    id: "scc10",
    text_en:
      "Even if I wanted to, I don't think I could tell someone what I'm really like.",
    text_zh: "即使是想告诉别人我真正是什么样子的，我认为我也做不到。",
    text_nl:
      "Zelfs als ik het zou willen, denk ik niet dat ik iemand zou kunnen vertellen hoe ik werkelijk ben.",
    text_de:
      "Selbst wenn ich wollte, glaube ich nicht, dass ich jemandem sagen könnte, wie ich wirklich bin.",
    text_fr:
      "Même si je le voulais, je ne pense pas que je pourrais dire à quelqu'un comment je suis vraiment.",
    text_es:
      "Aunque quisiera, no creo que pudiera decirle a alguien cómo soy realmente.",
    text_pt:
      "Mesmo que eu quisesse, não acho que conseguiria dizer a alguém como eu realmente sou.",
    text_it:
      "Anche se volessi, non credo che potrei dire a qualcuno come sono davvero.",
    text_ru:
      "Даже если бы я захотел(а), я не думаю, что смог(ла) бы рассказать кому-то, какой(ая) я на самом деле.",
    text_ja:
      "たとえ望んだとしても、自分が本当にどんな人間かを誰かに伝えられるとは思えない。",
    text_ko:
      "원한다 해도, 내가 진짜 어떤 사람인지 누군가에게 말할 수 없을 것 같다.",
    isReversed: true,
  },
  {
    id: "scc11",
    text_en: "In general, I have a clear sense of who I am and what I am.",
    text_zh: "一般来说，我能清晰地知道我是谁，我是什么样的人。",
    text_nl:
      "Over het algemeen heb ik een duidelijk beeld van wie ik ben en wat ik ben.",
    text_de:
      "Im Allgemeinen habe ich ein klares Bild davon, wer und was ich bin.",
    text_fr:
      "En général, j'ai une idée claire de qui je suis et de ce que je suis.",
    text_es: "En general, tengo una idea clara de quién soy y lo que soy.",
    text_pt: "De modo geral, tenho uma noção clara de quem sou e o que sou.",
    text_it: "In generale, ho un'idea chiara di chi sono e cosa sono.",
    text_ru:
      "В целом, у меня есть четкое представление о том, кто я и какой я.",
    text_ja: "全体的に、自分が誰で何者であるかについて明確な感覚を持っている。",
    text_ko:
      "전반적으로, 나는 내가 누구이고 어떤 사람인지에 대해 명확한 인식을 가지고 있다.",
    isReversed: false,
  },
  {
    id: "scc12",
    text_en:
      "It is often hard for me to make up my mind about things because I don't really know what I want.",
    text_zh: "因为不知道自己真正想要什么，因此对我来说下定决心做一件事很难。",
    text_nl:
      "Het is vaak moeilijk voor mij om een beslissing te nemen omdat ik niet echt weet wat ik wil.",
    text_de:
      "Es fällt mir oft schwer, mich zu entscheiden, weil ich nicht wirklich weiß, was ich will.",
    text_fr:
      "Il m'est souvent difficile de me décider car je ne sais pas vraiment ce que je veux.",
    text_es:
      "A menudo me resulta difícil tomar decisiones porque realmente no sé lo que quiero.",
    text_pt:
      "Muitas vezes é difícil para mim tomar decisões porque eu realmente não sei o que quero.",
    text_it:
      "Spesso mi è difficile prendere decisioni perché non so davvero cosa voglio.",
    text_ru:
      "Мне часто трудно принимать решения, потому что я не знаю, чего на самом деле хочу.",
    text_ja:
      "自分が本当に何を望んでいるか分からないので、物事を決めるのが難しいことが多い。",
    text_ko:
      "내가 정말로 원하는 것이 무엇인지 모르기 때문에, 결정을 내리기가 어려운 경우가 많다.",
    isReversed: true,
  },
];

export const SCC_SCALE_LABELS = {
  en: [
    { value: 1, label: "Strongly Disagree" },
    { value: 2, label: "Disagree" },
    { value: 3, label: "Neither Agree nor Disagree" },
    { value: 4, label: "Agree" },
    { value: 5, label: "Strongly Agree" },
  ],
  zh: [
    { value: 1, label: "非常不同意" },
    { value: 2, label: "不同意" },
    { value: 3, label: "既不同意也不反对" },
    { value: 4, label: "同意" },
    { value: 5, label: "非常同意" },
  ],
  nl: [
    { value: 1, label: "Helemaal mee oneens" },
    { value: 2, label: "Mee oneens" },
    { value: 3, label: "Niet mee eens, niet mee oneens" },
    { value: 4, label: "Mee eens" },
    { value: 5, label: "Helemaal mee eens" },
  ],
  de: [
    { value: 1, label: "Stimme überhaupt nicht zu" },
    { value: 2, label: "Stimme nicht zu" },
    { value: 3, label: "Weder noch" },
    { value: 4, label: "Stimme zu" },
    { value: 5, label: "Stimme voll zu" },
  ],
  fr: [
    { value: 1, label: "Tout à fait en désaccord" },
    { value: 2, label: "En désaccord" },
    { value: 3, label: "Ni en accord ni en désaccord" },
    { value: 4, label: "D'accord" },
    { value: 5, label: "Tout à fait d'accord" },
  ],
  es: [
    { value: 1, label: "Totalmente en desacuerdo" },
    { value: 2, label: "En desacuerdo" },
    { value: 3, label: "Ni de acuerdo ni en desacuerdo" },
    { value: 4, label: "De acuerdo" },
    { value: 5, label: "Totalmente de acuerdo" },
  ],
  pt: [
    { value: 1, label: "Discordo totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Nem concordo nem discordo" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo totalmente" },
  ],
  it: [
    { value: 1, label: "Fortemente in disaccordo" },
    { value: 2, label: "In disaccordo" },
    { value: 3, label: "Né d'accordo né in disaccordo" },
    { value: 4, label: "D'accordo" },
    { value: 5, label: "Fortemente d'accordo" },
  ],
  ru: [
    { value: 1, label: "Совершенно не согласен(на)" },
    { value: 2, label: "Не согласен(на)" },
    { value: 3, label: "Ни то, ни другое" },
    { value: 4, label: "Согласен(на)" },
    { value: 5, label: "Полностью согласен(на)" },
  ],
  ja: [
    { value: 1, label: "全くそう思わない" },
    { value: 2, label: "そう思わない" },
    { value: 3, label: "どちらともいえない" },
    { value: 4, label: "そう思う" },
    { value: 5, label: "非常にそう思う" },
  ],
  ko: [
    { value: 1, label: "전혀 동의하지 않음" },
    { value: 2, label: "동의하지 않음" },
    { value: 3, label: "동의도 비동의도 아님" },
    { value: 4, label: "동의함" },
    { value: 5, label: "매우 동의함" },
  ],
} as const;

/**
 * Compute the SCC total score.
 * Reverse-scored items are transformed as: 6 - rawResponse.
 * Total range: 12–60. Higher score = greater self-concept clarity.
 */
export function computeSCCTotalScore(responses: SCCResponses): number {
  return SCC_QUESTIONS.reduce((sum, q) => {
    const raw = responses[q.id];
    if (raw === undefined || raw < 1 || raw > 5) return sum;
    return sum + (q.isReversed ? 6 - raw : raw);
  }, 0);
}
