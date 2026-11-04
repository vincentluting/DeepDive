// ============================================================
// Module B: TwIVI (Twenty Item Values Inventory)
// ============================================================
// Adapted from PVQ-40 by Sandy, Gosling, Schwartz & Koelkebeck (2017).
// Published in Journal of Personality Assessment, 99(5), 545-555.
// Free for any purpose — no permission required (per Gosling Lab).
// Schwartz is a co-author; validated on N=38,049 (derivation) + N=29,143 (evaluation).
//
// 20 items, 6-point Likert scale, ipsative centering.
// Produces: Schwartz 10 Basic Human Values (2 items each).
//
// Pronouns adapted to gender-neutral "This person" / "They" per developer guidance.
// Chinese translations by Deep Dive, following PVQ-40 Chinese version style.
//
// NOTE: Export names kept as DDVQ21_* for backward compatibility across the codebase.
// ============================================================

import type { SchwartzValue } from "@/lib/types/dimensions";

// ============================================================
// Item Type
// ============================================================

export interface DDVQItem {
  id: number; // 1-20
  valueType: SchwartzValue; // mapped Schwartz value type
  higherOrder: string; // higher-order value dimension
  text: { en: string; zh: string; [locale: string]: string }; // gender-neutral ("This person" / "They")
}

// ============================================================
// Instructions
// ============================================================

export const DDVQ_INSTRUCTIONS = {
  en: "Below are descriptions of different people. Please read each description and think about how much each person is or is not like you. Select the option that best describes how similar this person is to you.",
  zh: "以下是对不同人的描述。请阅读每段描述，想想这个人与你有多相似。选择最能描述这个人与你相似程度的选项。",
  nl: "Hieronder staan beschrijvingen van verschillende mensen. Lees elke beschrijving en denk na over hoeveel elke persoon wel of niet op u lijkt. Kies de optie die het beste beschrijft hoe vergelijkbaar deze persoon met u is.",
  de: "Im Folgenden finden Sie Beschreibungen verschiedener Personen. Bitte lesen Sie jede Beschreibung und überlegen Sie, wie sehr jede Person Ihnen ähnelt oder nicht ähnelt. Wählen Sie die Option, die am besten beschreibt, wie ähnlich Ihnen diese Person ist.",
  fr: "Voici des descriptions de différentes personnes. Veuillez lire chaque description et réfléchir à quel point chaque personne vous ressemble ou non. Sélectionnez l'option qui décrit le mieux à quel point cette personne vous ressemble.",
  es: "A continuación se presentan descripciones de diferentes personas. Lea cada descripción y piense en qué medida cada persona se parece o no a usted. Seleccione la opción que mejor describa cuán similar es esta persona a usted.",
  pt: "Abaixo estão descrições de diferentes pessoas. Leia cada descrição e pense em quanto cada pessoa se parece ou não com você. Selecione a opção que melhor descreve o quão semelhante essa pessoa é a você.",
  it: "Di seguito sono riportate descrizioni di persone diverse. Legga ogni descrizione e pensi a quanto ogni persona le somiglia o meno. Selezioni l'opzione che descrive meglio quanto questa persona è simile a lei.",
  ru: "Ниже приведены описания разных людей. Прочитайте каждое описание и подумайте, насколько каждый человек похож или не похож на вас. Выберите вариант, который лучше всего описывает, насколько этот человек похож на вас.",
  ja: "以下はさまざまな人の説明です。各説明を読み、その人があなたにどれくらい似ているか、似ていないかを考えてください。その人があなたにどの程度似ているかを最もよく表す選択肢を選んでください。",
  ko: "아래는 다양한 사람들에 대한 설명입니다. 각 설명을 읽고 각 사람이 자신과 얼마나 비슷한지 또는 다른지 생각해 보세요. 이 사람이 자신과 얼마나 비슷한지를 가장 잘 설명하는 옵션을 선택하세요.",
};

// ============================================================
// Response Scale Labels
// ============================================================

export const DDVQ_SCALE_LABELS = {
  6: {
    en: "Very much like me",
    zh: "非常像我",
    nl: "Lijkt heel erg op mij",
    de: "Ist mir sehr ähnlich",
    fr: "Tout à fait comme moi",
    es: "Muy parecido a mí",
    pt: "Muito parecido comigo",
    it: "Molto simile a me",
    ru: "Очень похож на меня",
    ja: "非常に自分に似ている",
    ko: "나와 매우 비슷하다",
  },
  5: {
    en: "Like me",
    zh: "像我",
    nl: "Lijkt op mij",
    de: "Ist mir ähnlich",
    fr: "Comme moi",
    es: "Parecido a mí",
    pt: "Parecido comigo",
    it: "Simile a me",
    ru: "Похож на меня",
    ja: "自分に似ている",
    ko: "나와 비슷하다",
  },
  4: {
    en: "Somewhat like me",
    zh: "比较像我",
    nl: "Lijkt enigszins op mij",
    de: "Ist mir etwas ähnlich",
    fr: "Un peu comme moi",
    es: "Algo parecido a mí",
    pt: "Um pouco parecido comigo",
    it: "Un po' simile a me",
    ru: "Немного похож на меня",
    ja: "やや自分に似ている",
    ko: "나와 다소 비슷하다",
  },
  3: {
    en: "A little like me",
    zh: "有一点像我",
    nl: "Lijkt een beetje op mij",
    de: "Ist mir ein wenig ähnlich",
    fr: "Un petit peu comme moi",
    es: "Un poco parecido a mí",
    pt: "Um pouco parecido comigo",
    it: "Un poco simile a me",
    ru: "Немного похож на меня",
    ja: "少し自分に似ている",
    ko: "나와 약간 비슷하다",
  },
  2: {
    en: "Not like me",
    zh: "不像我",
    nl: "Lijkt niet op mij",
    de: "Ist mir nicht ähnlich",
    fr: "Pas comme moi",
    es: "No se parece a mí",
    pt: "Não parecido comigo",
    it: "Non simile a me",
    ru: "Не похож на меня",
    ja: "自分に似ていない",
    ko: "나와 비슷하지 않다",
  },
  1: {
    en: "Not like me at all",
    zh: "完全不像我",
    nl: "Lijkt helemaal niet op mij",
    de: "Ist mir überhaupt nicht ähnlich",
    fr: "Pas du tout comme moi",
    es: "No se parece en nada a mí",
    pt: "Nada parecido comigo",
    it: "Per niente simile a me",
    ru: "Совсем не похож на меня",
    ja: "まったく自分に似ていない",
    ko: "나와 전혀 비슷하지 않다",
  },
} as const;

// ============================================================
// 20 TwIVI Items (Sandy, Gosling, Schwartz & Koelkebeck, 2017)
// ============================================================

export const DDVQ21_ITEMS: DDVQItem[] = [
  // ---- Conformity (Items 1, 11) — Conservation ----
  {
    id: 1,
    valueType: "conformity",
    higherOrder: "conservation",
    text: {
      en: "This person believes they should always show respect to their parents and to older people. It is important to them to be obedient.",
      zh: "这个人认为应该始终尊重父母和长辈。听从长辈对他们来说很重要。",
      nl: "Deze persoon vindt dat ze altijd respect moeten tonen aan hun ouders en aan oudere mensen. Het is belangrijk voor hen om gehoorzaam te zijn.",
      de: "Diese Person glaubt, dass sie ihren Eltern und älteren Menschen immer Respekt zeigen sollte. Es ist ihr wichtig, gehorsam zu sein.",
      fr: "Cette personne croit qu'elle devrait toujours montrer du respect à ses parents et aux personnes plus âgées. Il est important pour elle d'être obéissante.",
      es: "Esta persona cree que siempre debe mostrar respeto a sus padres y a las personas mayores. Es importante para ella ser obediente.",
      pt: "Esta pessoa acredita que deve sempre mostrar respeito aos pais e às pessoas mais velhas. É importante para ela ser obediente.",
      it: "Questa persona crede di dover sempre mostrare rispetto ai propri genitori e alle persone più anziane. Per lei è importante essere obbediente.",
      ru: "Этот человек считает, что всегда нужно проявлять уважение к родителям и старшим. Для него важно быть послушным.",
      ja: "この人は、両親や年上の人に常に敬意を示すべきだと考えています。従順であることがこの人にとって重要です。",
      ko: "이 사람은 부모님과 어른들에게 항상 존경을 표해야 한다고 믿습니다. 순종하는 것이 이 사람에게 중요합니다.",
    },
  },
  {
    id: 11,
    valueType: "conformity",
    higherOrder: "conservation",
    text: {
      en: "It is important to this person to always behave properly. They want to avoid doing anything people would say is wrong.",
      zh: "始终举止得体对这个人很重要。他们想避免做任何别人会认为不对的事情。",
      nl: "Het is belangrijk voor deze persoon om zich altijd correct te gedragen. Ze willen vermijden iets te doen waarvan mensen zouden zeggen dat het verkeerd is.",
      de: "Es ist dieser Person wichtig, sich immer korrekt zu verhalten. Sie möchte vermeiden, etwas zu tun, das andere als falsch bezeichnen würden.",
      fr: "Il est important pour cette personne de toujours se comporter correctement. Elle veut éviter de faire quoi que ce soit que les gens considéreraient comme mal.",
      es: "Es importante para esta persona comportarse siempre correctamente. Quiere evitar hacer cualquier cosa que la gente considere incorrecta.",
      pt: "É importante para esta pessoa sempre se comportar adequadamente. Ela quer evitar fazer qualquer coisa que as pessoas diriam estar errado.",
      it: "È importante per questa persona comportarsi sempre in modo corretto. Vuole evitare di fare qualsiasi cosa che la gente considererebbe sbagliata.",
      ru: "Этому человеку важно всегда вести себя правильно. Он хочет избежать того, что люди сочли бы неправильным.",
      ja: "この人にとって、常に適切に振る舞うことが重要です。人々が間違っていると言うようなことはしたくありません。",
      ko: "이 사람에게는 항상 올바르게 행동하는 것이 중요합니다. 사람들이 잘못되었다고 말할 만한 일은 피하고 싶어 합니다.",
    },
  },

  // ---- Tradition (Items 2, 12) — Conservation ----
  {
    id: 2,
    valueType: "tradition",
    higherOrder: "conservation",
    text: {
      en: "Religious belief is important to this person. They try hard to do what their religion requires.",
      zh: "宗教信仰对这个人很重要。他们努力遵循宗教的要求。",
      nl: "Religieus geloof is belangrijk voor deze persoon. Ze doen hun best om te doen wat hun religie vereist.",
      de: "Religiöser Glaube ist dieser Person wichtig. Sie bemüht sich, das zu tun, was ihre Religion verlangt.",
      fr: "La croyance religieuse est importante pour cette personne. Elle s'efforce de faire ce que sa religion exige.",
      es: "La creencia religiosa es importante para esta persona. Se esfuerza por hacer lo que su religión requiere.",
      pt: "A crença religiosa é importante para esta pessoa. Ela se esforça para fazer o que sua religião exige.",
      it: "La fede religiosa è importante per questa persona. Si impegna a fare ciò che la sua religione richiede.",
      ru: "Религиозная вера важна для этого человека. Он старается делать то, что требует его религия.",
      ja: "この人にとって宗教的信仰は重要です。宗教が求めることを一生懸命実践しようとしています。",
      ko: "이 사람에게 종교적 믿음은 중요합니다. 종교가 요구하는 것을 열심히 실천하려고 합니다.",
    },
  },
  {
    id: 12,
    valueType: "tradition",
    higherOrder: "conservation",
    text: {
      en: "This person thinks it is best to do things in traditional ways. It is important to them to keep up the customs they have learned.",
      zh: "这个人认为按传统方式做事最好。坚持从小学到的习俗对他们很重要。",
      nl: "Deze persoon vindt het het beste om dingen op traditionele wijze te doen. Het is belangrijk voor hen om de gebruiken die ze hebben geleerd in stand te houden.",
      de: "Diese Person findet es am besten, Dinge auf traditionelle Weise zu tun. Es ist ihr wichtig, die Bräuche beizubehalten, die sie gelernt hat.",
      fr: "Cette personne pense qu'il est préférable de faire les choses de manière traditionnelle. Il est important pour elle de maintenir les coutumes qu'elle a apprises.",
      es: "Esta persona piensa que es mejor hacer las cosas de manera tradicional. Es importante para ella mantener las costumbres que ha aprendido.",
      pt: "Esta pessoa acha que é melhor fazer as coisas de maneira tradicional. É importante para ela manter os costumes que aprendeu.",
      it: "Questa persona pensa che sia meglio fare le cose nel modo tradizionale. Per lei è importante mantenere le usanze che ha imparato.",
      ru: "Этот человек считает, что лучше всего делать вещи традиционным способом. Для него важно сохранять обычаи, которые он усвоил.",
      ja: "この人は伝統的なやり方で物事を行うのが最善だと考えています。学んだ慣習を守ることがこの人にとって重要です。",
      ko: "이 사람은 전통적인 방식으로 일하는 것이 가장 좋다고 생각합니다. 배운 관습을 유지하는 것이 이 사람에게 중요합니다.",
    },
  },

  // ---- Benevolence (Items 3, 13) — Self-Transcendence ----
  {
    id: 3,
    valueType: "benevolence",
    higherOrder: "self-transcendence",
    text: {
      en: "It's very important to this person to help the people around them. They want to care for their well-being.",
      zh: "帮助周围的人对这个人非常重要。他们想要关心身边人过得好不好。",
      nl: "Het is voor deze persoon heel belangrijk om de mensen om hen heen te helpen. Ze willen zorgen voor hun welzijn.",
      de: "Es ist dieser Person sehr wichtig, den Menschen in ihrer Umgebung zu helfen. Sie möchte sich um deren Wohlergehen kümmern.",
      fr: "Il est très important pour cette personne d'aider les gens autour d'elle. Elle veut prendre soin de leur bien-être.",
      es: "Es muy importante para esta persona ayudar a las personas que la rodean. Quiere cuidar de su bienestar.",
      pt: "É muito importante para esta pessoa ajudar as pessoas ao seu redor. Ela quer cuidar do bem-estar delas.",
      it: "È molto importante per questa persona aiutare le persone intorno a sé. Vuole prendersi cura del loro benessere.",
      ru: "Для этого человека очень важно помогать окружающим. Он хочет заботиться об их благополучии.",
      ja: "この人にとって、周りの人を助けることはとても重要です。周りの人の幸福を気にかけたいと思っています。",
      ko: "이 사람에게 주변 사람들을 돕는 것은 매우 중요합니다. 그들의 안녕을 돌보고 싶어 합니다.",
    },
  },
  {
    id: 13,
    valueType: "benevolence",
    higherOrder: "self-transcendence",
    text: {
      en: "It is important to this person to respond to the needs of others. They try to support those they know.",
      zh: "回应他人的需求对这个人很重要。他们尽力帮助自己认识的人。",
      nl: "Het is belangrijk voor deze persoon om te reageren op de behoeften van anderen. Ze proberen degenen die ze kennen te ondersteunen.",
      de: "Es ist dieser Person wichtig, auf die Bedürfnisse anderer einzugehen. Sie versucht, die Menschen zu unterstützen, die sie kennt.",
      fr: "Il est important pour cette personne de répondre aux besoins des autres. Elle essaie de soutenir ceux qu'elle connaît.",
      es: "Es importante para esta persona responder a las necesidades de los demás. Intenta apoyar a quienes conoce.",
      pt: "É importante para esta pessoa responder às necessidades dos outros. Ela tenta apoiar aqueles que conhece.",
      it: "È importante per questa persona rispondere ai bisogni degli altri. Cerca di sostenere le persone che conosce.",
      ru: "Этому человеку важно откликаться на потребности других. Он старается поддерживать тех, кого знает.",
      ja: "この人にとって、他の人のニーズに応えることは重要です。知り合いをサポートしようとしています。",
      ko: "이 사람에게 다른 사람들의 필요에 응답하는 것은 중요합니다. 아는 사람들을 지원하려고 노력합니다.",
    },
  },

  // ---- Universalism (Items 4, 14) — Self-Transcendence ----
  {
    id: 4,
    valueType: "universalism",
    higherOrder: "self-transcendence",
    text: {
      en: "This person thinks it is important that every person in the world be treated equally. They believe everyone should have equal opportunities in life.",
      zh: "这个人认为世界上每个人都应该被平等对待。他们相信每个人都应该拥有平等的机会。",
      nl: "Deze persoon vindt het belangrijk dat ieder mens op de wereld gelijk behandeld wordt. Ze geloven dat iedereen gelijke kansen in het leven moet hebben.",
      de: "Diese Person findet es wichtig, dass jeder Mensch auf der Welt gleich behandelt wird. Sie glaubt, dass jeder gleiche Chancen im Leben haben sollte.",
      fr: "Cette personne pense qu'il est important que chaque personne dans le monde soit traitée de manière égale. Elle croit que chacun devrait avoir des chances égales dans la vie.",
      es: "Esta persona piensa que es importante que todas las personas del mundo sean tratadas por igual. Cree que todos deberían tener igualdad de oportunidades en la vida.",
      pt: "Esta pessoa acha que é importante que todas as pessoas do mundo sejam tratadas igualmente. Ela acredita que todos devem ter oportunidades iguais na vida.",
      it: "Questa persona pensa che sia importante che ogni persona al mondo sia trattata in modo uguale. Crede che tutti dovrebbero avere pari opportunità nella vita.",
      ru: "Этот человек считает, что важно, чтобы каждый человек в мире был равным. Он верит, что у каждого должны быть равные возможности в жизни.",
      ja: "この人は、世界中のすべての人が平等に扱われることが重要だと考えています。誰もが人生で平等な機会を持つべきだと信じています。",
      ko: "이 사람은 세상의 모든 사람이 평등하게 대우받는 것이 중요하다고 생각합니다. 모든 사람이 삶에서 동등한 기회를 가져야 한다고 믿습니다.",
    },
  },
  {
    id: 14,
    valueType: "universalism",
    higherOrder: "self-transcendence",
    text: {
      en: "This person believes all the world's people should live in harmony. Promoting peace among all groups in the world is important to them.",
      zh: "这个人相信世界上所有人都应该和谐相处。促进世界各群体之间的和平对他们很重要。",
      nl: "Deze persoon gelooft dat alle mensen op de wereld in harmonie zouden moeten leven. Het bevorderen van vrede tussen alle groepen in de wereld is belangrijk voor hen.",
      de: "Diese Person glaubt, dass alle Menschen auf der Welt in Harmonie leben sollten. Die Förderung des Friedens zwischen allen Gruppen der Welt ist ihr wichtig.",
      fr: "Cette personne croit que tous les peuples du monde devraient vivre en harmonie. Promouvoir la paix entre tous les groupes du monde est important pour elle.",
      es: "Esta persona cree que todos los pueblos del mundo deberían vivir en armonía. Promover la paz entre todos los grupos del mundo es importante para ella.",
      pt: "Esta pessoa acredita que todos os povos do mundo deveriam viver em harmonia. Promover a paz entre todos os grupos do mundo é importante para ela.",
      it: "Questa persona crede che tutti i popoli del mondo dovrebbero vivere in armonia. Promuovere la pace tra tutti i gruppi del mondo è importante per lei.",
      ru: "Этот человек верит, что все народы мира должны жить в гармонии. Содействие миру между всеми группами в мире важно для него.",
      ja: "この人は、世界中のすべての人々が調和して暮らすべきだと信じています。世界中のすべてのグループ間の平和を促進することがこの人にとって重要です。",
      ko: "이 사람은 세상의 모든 사람들이 조화롭게 살아야 한다고 믿습니다. 세계의 모든 집단 간 평화를 증진하는 것이 이 사람에게 중요합니다.",
    },
  },

  // ---- Self-Direction (Items 5, 15) — Openness to Change ----
  {
    id: 5,
    valueType: "self-direction",
    higherOrder: "openness-to-change",
    text: {
      en: "This person thinks it's important to be interested in things. They like to be curious and to try to understand all sorts of things.",
      zh: "这个人认为对事物保持兴趣很重要。他们喜欢保持好奇心，努力理解各种各样的事物。",
      nl: "Deze persoon vindt het belangrijk om geïnteresseerd te zijn in dingen. Ze zijn graag nieuwsgierig en proberen allerlei dingen te begrijpen.",
      de: "Diese Person findet es wichtig, sich für Dinge zu interessieren. Sie ist gerne neugierig und versucht, alle möglichen Dinge zu verstehen.",
      fr: "Cette personne pense qu'il est important de s'intéresser aux choses. Elle aime être curieuse et essayer de comprendre toutes sortes de choses.",
      es: "Esta persona piensa que es importante interesarse por las cosas. Le gusta ser curiosa e intentar comprender todo tipo de cosas.",
      pt: "Esta pessoa acha que é importante se interessar pelas coisas. Gosta de ser curiosa e tentar entender todo tipo de coisas.",
      it: "Questa persona pensa che sia importante interessarsi alle cose. Le piace essere curiosa e cercare di capire ogni tipo di cosa.",
      ru: "Этот человек считает, что важно интересоваться разными вещами. Ему нравится быть любознательным и пытаться понять самые разные вещи.",
      ja: "この人は、物事に興味を持つことが重要だと考えています。好奇心を持ち、あらゆることを理解しようとするのが好きです。",
      ko: "이 사람은 사물에 관심을 갖는 것이 중요하다고 생각합니다. 호기심을 갖고 온갖 것들을 이해하려고 노력하는 것을 좋아합니다.",
    },
  },
  {
    id: 15,
    valueType: "self-direction",
    higherOrder: "openness-to-change",
    text: {
      en: "Thinking up new ideas and being creative is important to this person. They like to do things in their own original way.",
      zh: "想出新点子和发挥创造力对这个人很重要。他们喜欢用自己独特的方式做事。",
      nl: "Nieuwe ideeën bedenken en creatief zijn is belangrijk voor deze persoon. Ze doen dingen graag op hun eigen originele manier.",
      de: "Neue Ideen zu entwickeln und kreativ zu sein ist dieser Person wichtig. Sie macht Dinge gerne auf ihre eigene originelle Art.",
      fr: "Inventer de nouvelles idées et être créatif est important pour cette personne. Elle aime faire les choses à sa propre manière originale.",
      es: "Pensar nuevas ideas y ser creativo es importante para esta persona. Le gusta hacer las cosas a su propia manera original.",
      pt: "Pensar em novas ideias e ser criativo é importante para esta pessoa. Ela gosta de fazer as coisas do seu próprio jeito original.",
      it: "Pensare nuove idee ed essere creativo è importante per questa persona. Le piace fare le cose a modo suo in modo originale.",
      ru: "Придумывать новые идеи и быть творческим важно для этого человека. Ему нравится делать вещи по-своему, оригинально.",
      ja: "新しいアイデアを考え出し、創造的であることがこの人にとって重要です。自分だけの独創的な方法で物事を行うのが好きです。",
      ko: "새로운 아이디어를 떠올리고 창의적인 것은 이 사람에게 중요합니다. 자신만의 독창적인 방식으로 일하는 것을 좋아합니다.",
    },
  },

  // ---- Stimulation (Items 6, 16) — Openness to Change ----
  {
    id: 6,
    valueType: "stimulation",
    higherOrder: "openness-to-change",
    text: {
      en: "This person likes to take risks. They are always looking for adventures.",
      zh: "这个人喜欢冒险。他们总是在寻找新的冒险经历。",
      nl: "Deze persoon neemt graag risico's. Ze zijn altijd op zoek naar avonturen.",
      de: "Diese Person geht gerne Risiken ein. Sie ist immer auf der Suche nach Abenteuern.",
      fr: "Cette personne aime prendre des risques. Elle est toujours à la recherche d'aventures.",
      es: "A esta persona le gusta correr riesgos. Siempre está buscando aventuras.",
      pt: "Esta pessoa gosta de correr riscos. Está sempre em busca de aventuras.",
      it: "A questa persona piace correre rischi. È sempre alla ricerca di avventure.",
      ru: "Этот человек любит рисковать. Он всегда ищет приключения.",
      ja: "この人はリスクを冒すのが好きです。いつも冒険を探しています。",
      ko: "이 사람은 위험을 감수하는 것을 좋아합니다. 항상 모험을 찾고 있습니다.",
    },
  },
  {
    id: 16,
    valueType: "stimulation",
    higherOrder: "openness-to-change",
    text: {
      en: "This person thinks it is important to do lots of different things in life. They always look for new things to try.",
      zh: "这个人认为在生活中做很多不同的事情很重要。他们总是在寻找新事物去尝试。",
      nl: "Deze persoon vindt het belangrijk om veel verschillende dingen in het leven te doen. Ze zijn altijd op zoek naar nieuwe dingen om te proberen.",
      de: "Diese Person findet es wichtig, viele verschiedene Dinge im Leben zu tun. Sie sucht immer nach neuen Dingen zum Ausprobieren.",
      fr: "Cette personne pense qu'il est important de faire beaucoup de choses différentes dans la vie. Elle cherche toujours de nouvelles choses à essayer.",
      es: "Esta persona piensa que es importante hacer muchas cosas diferentes en la vida. Siempre busca cosas nuevas para probar.",
      pt: "Esta pessoa acha que é importante fazer muitas coisas diferentes na vida. Está sempre procurando coisas novas para experimentar.",
      it: "Questa persona pensa che sia importante fare molte cose diverse nella vita. Cerca sempre cose nuove da provare.",
      ru: "Этот человек считает, что важно делать много разных вещей в жизни. Он всегда ищет что-то новое, чтобы попробовать.",
      ja: "この人は、人生でたくさんの異なることをすることが重要だと考えています。いつも新しいことを試そうとしています。",
      ko: "이 사람은 인생에서 다양한 일을 하는 것이 중요하다고 생각합니다. 항상 새로운 것을 시도하려고 합니다.",
    },
  },

  // ---- Hedonism (Items 7, 17) — Openness to Change / Self-Enhancement ----
  {
    id: 7,
    valueType: "hedonism",
    higherOrder: "openness-to-change / self-enhancement",
    text: {
      en: "This person seeks every chance they can to have fun. It is important to them to do things that give them pleasure.",
      zh: "这个人抓住每个机会去寻找乐趣。做让自己开心的事对他们很重要。",
      nl: "Deze persoon grijpt elke kans om plezier te hebben. Het is belangrijk voor hen om dingen te doen die hun plezier geven.",
      de: "Diese Person sucht jede Gelegenheit, Spaß zu haben. Es ist ihr wichtig, Dinge zu tun, die ihr Freude bereiten.",
      fr: "Cette personne saisit chaque occasion de s'amuser. Il est important pour elle de faire des choses qui lui procurent du plaisir.",
      es: "Esta persona busca cada oportunidad para divertirse. Es importante para ella hacer cosas que le den placer.",
      pt: "Esta pessoa busca cada oportunidade para se divertir. É importante para ela fazer coisas que lhe deem prazer.",
      it: "Questa persona cerca ogni occasione per divertirsi. È importante per lei fare cose che le diano piacere.",
      ru: "Этот человек ищет любую возможность повеселиться. Для него важно делать то, что доставляет удовольствие.",
      ja: "この人は楽しめるあらゆるチャンスを探しています。喜びを与えてくれることをすることがこの人にとって重要です。",
      ko: "이 사람은 즐길 수 있는 모든 기회를 찾습니다. 즐거움을 주는 일을 하는 것이 이 사람에게 중요합니다.",
    },
  },
  {
    id: 17,
    valueType: "hedonism",
    higherOrder: "openness-to-change / self-enhancement",
    text: {
      en: "This person really wants to enjoy life. Having a good time is very important to them.",
      zh: "这个人真的很想享受生活。过得开心对他们非常重要。",
      nl: "Deze persoon wil echt van het leven genieten. Het hebben van een goede tijd is heel belangrijk voor hen.",
      de: "Diese Person möchte das Leben wirklich genießen. Eine gute Zeit zu haben ist ihr sehr wichtig.",
      fr: "Cette personne veut vraiment profiter de la vie. Passer du bon temps est très important pour elle.",
      es: "Esta persona realmente quiere disfrutar de la vida. Pasarla bien es muy importante para ella.",
      pt: "Esta pessoa realmente quer aproveitar a vida. Passar bons momentos é muito importante para ela.",
      it: "Questa persona vuole davvero godersi la vita. Divertirsi è molto importante per lei.",
      ru: "Этот человек действительно хочет наслаждаться жизнью. Хорошо проводить время для него очень важно.",
      ja: "この人は本当に人生を楽しみたいと思っています。楽しい時間を過ごすことがこの人にとってとても重要です。",
      ko: "이 사람은 정말로 인생을 즐기고 싶어 합니다. 즐거운 시간을 보내는 것이 이 사람에게 매우 중요합니다.",
    },
  },

  // ---- Achievement (Items 8, 18) — Self-Enhancement ----
  {
    id: 8,
    valueType: "achievement",
    higherOrder: "self-enhancement",
    text: {
      en: "Getting ahead in life is important to this person. They strive to do better than others.",
      zh: "出人头地对这个人很重要。他们努力比别人做得更好。",
      nl: "Vooruitkomen in het leven is belangrijk voor deze persoon. Ze streven ernaar het beter te doen dan anderen.",
      de: "Im Leben voranzukommen ist dieser Person wichtig. Sie strebt danach, besser zu sein als andere.",
      fr: "Réussir dans la vie est important pour cette personne. Elle s'efforce de faire mieux que les autres.",
      es: "Salir adelante en la vida es importante para esta persona. Se esfuerza por hacerlo mejor que los demás.",
      pt: "Progredir na vida é importante para esta pessoa. Ela se esforça para ser melhor que os outros.",
      it: "Andare avanti nella vita è importante per questa persona. Si impegna a fare meglio degli altri.",
      ru: "Продвижение в жизни важно для этого человека. Он стремится быть лучше других.",
      ja: "人生で成功することがこの人にとって重要です。他の人よりも上手くやろうと努力しています。",
      ko: "인생에서 앞서 나가는 것이 이 사람에게 중요합니다. 다른 사람들보다 더 잘하려고 노력합니다.",
    },
  },
  {
    id: 18,
    valueType: "achievement",
    higherOrder: "self-enhancement",
    text: {
      en: "Being very successful is important to this person. They like to impress other people.",
      zh: "取得很大的成功对这个人很重要。他们喜欢给别人留下深刻印象。",
      nl: "Zeer succesvol zijn is belangrijk voor deze persoon. Ze maken graag indruk op andere mensen.",
      de: "Sehr erfolgreich zu sein ist dieser Person wichtig. Sie beeindruckt gerne andere Menschen.",
      fr: "Avoir beaucoup de succès est important pour cette personne. Elle aime impressionner les autres.",
      es: "Tener mucho éxito es importante para esta persona. Le gusta impresionar a los demás.",
      pt: "Ser muito bem-sucedido é importante para esta pessoa. Ela gosta de impressionar as outras pessoas.",
      it: "Avere molto successo è importante per questa persona. Le piace fare colpo sugli altri.",
      ru: "Быть очень успешным важно для этого человека. Ему нравится производить впечатление на других.",
      ja: "大きな成功を収めることがこの人にとって重要です。他の人に感銘を与えるのが好きです。",
      ko: "매우 성공적인 것이 이 사람에게 중요합니다. 다른 사람들에게 인상을 남기는 것을 좋아합니다.",
    },
  },

  // ---- Power (Items 9, 19) — Self-Enhancement ----
  {
    id: 9,
    valueType: "power",
    higherOrder: "self-enhancement",
    text: {
      en: "This person always wants to be the one who makes the decisions. They like to be the leader.",
      zh: "这个人总想成为做决定的那个人。他们喜欢当领导者。",
      nl: "Deze persoon wil altijd degene zijn die de beslissingen neemt. Ze zijn graag de leider.",
      de: "Diese Person möchte immer diejenige sein, die Entscheidungen trifft. Sie ist gerne der Anführer.",
      fr: "Cette personne veut toujours être celle qui prend les décisions. Elle aime être le leader.",
      es: "Esta persona siempre quiere ser quien tome las decisiones. Le gusta ser el líder.",
      pt: "Esta pessoa sempre quer ser quem toma as decisões. Gosta de ser o líder.",
      it: "Questa persona vuole sempre essere quella che prende le decisioni. Le piace essere il leader.",
      ru: "Этот человек всегда хочет быть тем, кто принимает решения. Ему нравится быть лидером.",
      ja: "この人はいつも決定を下す人でありたいと思っています。リーダーであることが好きです。",
      ko: "이 사람은 항상 결정을 내리는 사람이 되고 싶어 합니다. 리더가 되는 것을 좋아합니다.",
    },
  },
  {
    id: 19,
    valueType: "power",
    higherOrder: "self-enhancement",
    text: {
      en: "It is important to this person to be in charge and tell others what to do. They want people to do what they say.",
      zh: "对这个人来说，掌控局面并告诉别人该怎么做很重要。他们想让别人按他们说的做。",
      nl: "Het is belangrijk voor deze persoon om de leiding te hebben en anderen te vertellen wat ze moeten doen. Ze willen dat mensen doen wat zij zeggen.",
      de: "Es ist dieser Person wichtig, das Sagen zu haben und anderen zu sagen, was sie tun sollen. Sie möchte, dass die Leute tun, was sie sagt.",
      fr: "Il est important pour cette personne d'être aux commandes et de dire aux autres quoi faire. Elle veut que les gens fassent ce qu'elle dit.",
      es: "Es importante para esta persona estar al mando y decirles a los demás qué hacer. Quiere que la gente haga lo que dice.",
      pt: "É importante para esta pessoa estar no comando e dizer aos outros o que fazer. Ela quer que as pessoas façam o que ela diz.",
      it: "È importante per questa persona essere al comando e dire agli altri cosa fare. Vuole che le persone facciano quello che dice.",
      ru: "Этому человеку важно быть главным и указывать другим, что делать. Он хочет, чтобы люди делали то, что он говорит.",
      ja: "この人にとって、主導権を握り、他の人に何をすべきか指示することが重要です。人々が自分の言うことに従うことを望んでいます。",
      ko: "이 사람에게 책임자가 되어 다른 사람들에게 무엇을 해야 하는지 말하는 것은 중요합니다. 사람들이 자신의 말에 따르기를 원합니다.",
    },
  },

  // ---- Security (Items 10, 20) — Conservation ----
  {
    id: 10,
    valueType: "security",
    higherOrder: "conservation",
    text: {
      en: "It is important to this person that things be organized and clean. They really do not like things to be a mess.",
      zh: "对这个人来说，事物有条理和整洁很重要。他们真的不喜欢杂乱无章。",
      nl: "Het is belangrijk voor deze persoon dat dingen georganiseerd en schoon zijn. Ze houden echt niet van rommel.",
      de: "Es ist dieser Person wichtig, dass Dinge organisiert und sauber sind. Sie mag es wirklich nicht, wenn Dinge unordentlich sind.",
      fr: "Il est important pour cette personne que les choses soient organisées et propres. Elle n'aime vraiment pas le désordre.",
      es: "Es importante para esta persona que las cosas estén organizadas y limpias. Realmente no le gusta el desorden.",
      pt: "É importante para esta pessoa que as coisas estejam organizadas e limpas. Ela realmente não gosta de bagunça.",
      it: "È importante per questa persona che le cose siano organizzate e pulite. Non sopporta proprio il disordine.",
      ru: "Этому человеку важно, чтобы всё было организовано и чисто. Ему действительно не нравится беспорядок.",
      ja: "この人にとって、物事が整理整頓されていることが重要です。散らかっていることが本当に嫌いです。",
      ko: "이 사람에게 물건이 정리되어 있고 깨끗한 것은 중요합니다. 어지러운 것을 정말 싫어합니다.",
    },
  },
  {
    id: 20,
    valueType: "security",
    higherOrder: "conservation",
    text: {
      en: "Having a stable government is important to this person. They are concerned that the social order be protected.",
      zh: "拥有一个稳定的政府对这个人很重要。他们关心社会秩序能否得到维护。",
      nl: "Een stabiele overheid is belangrijk voor deze persoon. Ze maken zich zorgen dat de sociale orde beschermd wordt.",
      de: "Eine stabile Regierung ist dieser Person wichtig. Sie sorgt sich darum, dass die soziale Ordnung geschützt wird.",
      fr: "Avoir un gouvernement stable est important pour cette personne. Elle se soucie de la protection de l'ordre social.",
      es: "Tener un gobierno estable es importante para esta persona. Le preocupa que el orden social esté protegido.",
      pt: "Ter um governo estável é importante para esta pessoa. Ela se preocupa que a ordem social seja protegida.",
      it: "Avere un governo stabile è importante per questa persona. Si preoccupa che l'ordine sociale sia protetto.",
      ru: "Стабильное правительство важно для этого человека. Его беспокоит, чтобы социальный порядок был защищён.",
      ja: "安定した政府があることがこの人にとって重要です。社会秩序が守られることを気にかけています。",
      ko: "안정적인 정부를 갖는 것이 이 사람에게 중요합니다. 사회 질서가 보호되는 것에 관심을 갖고 있습니다.",
    },
  },
];

// ============================================================
// Value Type → Item Number Mapping (for scoring)
// ============================================================

export const DDVQ21_VALUE_MAP: Record<SchwartzValue, number[]> = {
  conformity: [1, 11],
  tradition: [2, 12],
  benevolence: [3, 13],
  universalism: [4, 14],
  "self-direction": [5, 15],
  stimulation: [6, 16],
  hedonism: [7, 17],
  achievement: [8, 18],
  power: [9, 19],
  security: [10, 20],
};

// Note: Hedonism straddles openness-to-change and self-enhancement
