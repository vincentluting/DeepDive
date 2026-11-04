// ============================================================
// Module C: IPIP-NEO-120 — 完整 Big Five 题库 (Item Source Pool)
// ============================================================
// 120-item IPIP-NEO representation, serves as the canonical item source for:
//   - module-c-ipip60.ts  (filters 60-item standard subset for v3.0 Deep Dive)
//   - module-c-ipip30.ts  (filters 30-item screening subset, historical)
//   - score-ipip60.ts     (reversed item detection)
//   - question-renderer.tsx (item lookup by ID during rendering)
//
// The full 120-item set is reserved for potential Ultra Deep Dive use.
//
// Source: Johnson (2014), International Personality Item Pool
// License: Public Domain
// ============================================================

import type { IPIPItem } from '@/lib/types/questionnaire';
import type { BigFiveDimension } from '@/lib/types/dimensions';

// ============================================================
// Instructions
// ============================================================

export const IPIP_INSTRUCTIONS = {
  en: 'Describe yourself as you generally are now, not as you wish to be in the future. Describe yourself as you honestly see yourself, in relation to other people you know of the same sex and roughly the same age. Indicate for each statement how accurately it describes you.',
  zh: '请描述你现在通常的样子，而不是你希望未来成为的样子。请诚实地描述你自己，相对于你认识的同性别、大致同龄的人。对每个陈述，指出它对你的描述有多准确。',
  nl: 'Beschrijf uzelf zoals u nu in het algemeen bent, niet zoals u in de toekomst zou willen zijn. Beschrijf uzelf zoals u uzelf eerlijk ziet, in vergelijking met andere mensen die u kent van hetzelfde geslacht en ongeveer dezelfde leeftijd. Geef voor elke uitspraak aan hoe nauwkeurig deze u beschrijft.',
  de: 'Beschreiben Sie sich so, wie Sie im Allgemeinen jetzt sind, nicht wie Sie in Zukunft sein möchten. Beschreiben Sie sich so, wie Sie sich ehrlich sehen, im Vergleich zu anderen Menschen gleichen Geschlechts und ungefähr gleichen Alters, die Sie kennen. Geben Sie für jede Aussage an, wie genau sie Sie beschreibt.',
  fr: 'Décrivez-vous tel que vous êtes généralement maintenant, pas tel que vous aimeriez être à l\'avenir. Décrivez-vous honnêtement, par rapport aux autres personnes que vous connaissez du même sexe et à peu près du même âge. Indiquez pour chaque affirmation dans quelle mesure elle vous décrit avec précision.',
  es: 'Descríbase tal como es generalmente ahora, no como desearía ser en el futuro. Descríbase como se ve honestamente, en relación con otras personas que conoce del mismo sexo y aproximadamente la misma edad. Indique para cada afirmación con qué precisión le describe.',
  pt: 'Descreva-se como você geralmente é agora, não como gostaria de ser no futuro. Descreva-se como você honestamente se vê, em relação a outras pessoas que conhece do mesmo sexo e aproximadamente da mesma idade. Indique para cada afirmação quão precisamente ela o descreve.',
  it: 'Si descriva come è generalmente adesso, non come vorrebbe essere in futuro. Si descriva come si vede onestamente, in relazione ad altre persone che conosce dello stesso sesso e approssimativamente della stessa età. Indichi per ogni affermazione quanto accuratamente la descrive.',
  ru: 'Опишите себя таким, какой вы обычно есть сейчас, а не таким, каким хотели бы быть в будущем. Опишите себя честно, по сравнению с другими людьми того же пола и примерно того же возраста, которых вы знаете. Укажите для каждого утверждения, насколько точно оно вас описывает.',
  ja: '将来なりたい自分ではなく、今の自分を一般的にどのような人物か描写してください。同性で同年代の知り合いと比較して、正直に自分自身を描写してください。各文がどの程度正確にあなたを表しているか示してください。',
  ko: '미래에 되고 싶은 모습이 아니라 현재 일반적인 자신의 모습을 설명하세요. 같은 성별, 비슷한 나이의 아는 사람들과 비교하여 정직하게 자신을 설명하세요. 각 문장이 자신을 얼마나 정확하게 설명하는지 표시하세요.',
};

// ============================================================
// Response Scale Labels
// ============================================================

export const IPIP_SCALE_LABELS = {
  1: {
    en: 'Very Inaccurate', zh: '非常不准确',
    nl: 'Zeer onnauwkeurig', de: 'Sehr unzutreffend', fr: 'Très inexact',
    es: 'Muy inexacto', pt: 'Muito impreciso', it: 'Molto impreciso',
    ru: 'Совершенно неточно', ja: '全く当てはまらない', ko: '매우 부정확하다',
  },
  2: {
    en: 'Moderately Inaccurate', zh: '比较不准确',
    nl: 'Enigszins onnauwkeurig', de: 'Eher unzutreffend', fr: 'Plutôt inexact',
    es: 'Bastante inexacto', pt: 'Moderadamente impreciso', it: 'Abbastanza impreciso',
    ru: 'Скорее неточно', ja: 'やや当てはまらない', ko: '다소 부정확하다',
  },
  3: {
    en: 'Neither', zh: '中性',
    nl: 'Neutraal', de: 'Neutral', fr: 'Neutre',
    es: 'Neutro', pt: 'Neutro', it: 'Neutro',
    ru: 'Нейтрально', ja: 'どちらともいえない', ko: '보통이다',
  },
  4: {
    en: 'Moderately Accurate', zh: '比较准确',
    nl: 'Enigszins nauwkeurig', de: 'Eher zutreffend', fr: 'Plutôt exact',
    es: 'Bastante exacto', pt: 'Moderadamente preciso', it: 'Abbastanza preciso',
    ru: 'Скорее точно', ja: 'やや当てはまる', ko: '다소 정확하다',
  },
  5: {
    en: 'Very Accurate', zh: '非常准确',
    nl: 'Zeer nauwkeurig', de: 'Sehr zutreffend', fr: 'Très exact',
    es: 'Muy exacto', pt: 'Muito preciso', it: 'Molto preciso',
    ru: 'Совершенно точно', ja: '非常に当てはまる', ko: '매우 정확하다',
  },
} as const;

// ============================================================
// Complete 120 Items
// ============================================================
// Items ordered by Johnson (2014) standard numbering (1-120).
// Every 30 items completes one N-E-O-A-C cycle.
// isReversed = true means reverse-scored (1→5, 2→4, 3→3, 4→2, 5→1)

export const IPIP_NEO_120_ITEMS: IPIPItem[] = [
  // ============================================================
  // Items 1-30 (Cycle 1: facets x1 from each domain)
  // ============================================================

  // N1: Anxiety
  { id: 1, text_en: 'Worry about things.', text_zh: '担心很多事情。', text_nl: 'Maak me zorgen over dingen.', text_de: 'Mache mir Sorgen über Dinge.', text_fr: 'Me fais du souci pour des choses.', text_es: 'Me preocupo por las cosas.', text_pt: 'Preocupo-me com as coisas.', text_it: 'Mi preoccupo per le cose.', text_ru: 'Беспокоюсь о многом.', text_ja: '物事を心配する。', text_ko: '여러 가지 일에 대해 걱정한다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  // N2: Anger
  { id: 2, text_en: 'Get angry easily.', text_zh: '容易生气。', text_nl: 'Word snel boos.', text_de: 'Werde leicht wütend.', text_fr: 'Me mets facilement en colère.', text_es: 'Me enfado fácilmente.', text_pt: 'Fico com raiva facilmente.', text_it: 'Mi arrabbio facilmente.', text_ru: 'Легко злюсь.', text_ja: 'すぐに怒る。', text_ko: '쉽게 화가 난다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: false },
  // N3: Depression
  { id: 3, text_en: 'Often feel blue.', text_zh: '经常感到忧郁。', text_nl: 'Voel me vaak neerslachtig.', text_de: 'Fühle mich oft niedergeschlagen.', text_fr: 'Me sens souvent triste.', text_es: 'A menudo me siento triste.', text_pt: 'Frequentemente me sinto triste.', text_it: 'Mi sento spesso giù.', text_ru: 'Часто чувствую тоску.', text_ja: 'よく憂鬱になる。', text_ko: '자주 우울함을 느낀다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: false },
  // N4: Self-Consciousness
  { id: 4, text_en: 'Find it difficult to approach others.', text_zh: '觉得很难接近别人。', text_nl: 'Vind het moeilijk om anderen te benaderen.', text_de: 'Finde es schwierig, auf andere zuzugehen.', text_fr: 'Trouve difficile d\'approcher les autres.', text_es: 'Me resulta difícil acercarme a los demás.', text_pt: 'Acho difícil me aproximar dos outros.', text_it: 'Trovo difficile avvicinare gli altri.', text_ru: 'Мне трудно подходить к другим людям.', text_ja: '人に近づくのが難しいと感じる。', text_ko: '다른 사람에게 다가가기 어렵다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: false },
  // N5: Immoderation
  { id: 5, text_en: 'Go on binges.', text_zh: '会暴饮暴食。', text_nl: 'Geef me over aan overdaad.', text_de: 'Neige zu Exzessen.', text_fr: 'Fais des excès.', text_es: 'Me doy atracones.', text_pt: 'Tenho episódios de excessos.', text_it: 'Mi lascio andare a eccessi.', text_ru: 'Склонен к излишествам.', text_ja: '度を越してしまうことがある。', text_ko: '폭식이나 과도한 행동을 한다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: false },
  // N6: Vulnerability
  { id: 6, text_en: 'Panic easily.', text_zh: '容易恐慌。', text_nl: 'Raak snel in paniek.', text_de: 'Gerate leicht in Panik.', text_fr: 'Panique facilement.', text_es: 'Entro en pánico fácilmente.', text_pt: 'Entro em pânico facilmente.', text_it: 'Mi faccio prendere dal panico facilmente.', text_ru: 'Легко впадаю в панику.', text_ja: 'すぐにパニックになる。', text_ko: '쉽게 공황 상태에 빠진다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: false },

  // E1: Friendliness
  { id: 7, text_en: 'Make friends easily.', text_zh: '容易交到朋友。', text_nl: 'Maak gemakkelijk vrienden.', text_de: 'Schließe leicht Freundschaften.', text_fr: 'Me fais facilement des amis.', text_es: 'Hago amigos fácilmente.', text_pt: 'Faço amigos facilmente.', text_it: 'Faccio amicizia facilmente.', text_ru: 'Легко завожу друзей.', text_ja: '友達を簡単に作る。', text_ko: '쉽게 친구를 사귄다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: false },
  // E2: Gregariousness
  { id: 8, text_en: 'Love large parties.', text_zh: '喜欢大型聚会。', text_nl: 'Hou van grote feesten.', text_de: 'Liebe große Partys.', text_fr: 'Adore les grandes fêtes.', text_es: 'Me encantan las grandes fiestas.', text_pt: 'Adoro grandes festas.', text_it: 'Adoro le grandi feste.', text_ru: 'Люблю большие вечеринки.', text_ja: '大きなパーティーが好きだ。', text_ko: '큰 파티를 좋아한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: false },
  // E3: Assertiveness
  { id: 9, text_en: 'Take charge.', text_zh: '承担领导责任。', text_nl: 'Neem de leiding.', text_de: 'Übernehme die Führung.', text_fr: 'Prends les choses en main.', text_es: 'Tomo el mando.', text_pt: 'Assumo o comando.', text_it: 'Prendo il comando.', text_ru: 'Беру на себя ответственность.', text_ja: '主導権を取る。', text_ko: '주도권을 잡는다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: false },
  // E4: Activity Level
  { id: 10, text_en: 'Am always busy.', text_zh: '总是很忙。', text_nl: 'Ben altijd druk.', text_de: 'Bin immer beschäftigt.', text_fr: 'Suis toujours occupé(e).', text_es: 'Siempre estoy ocupado/a.', text_pt: 'Estou sempre ocupado/a.', text_it: 'Sono sempre impegnato/a.', text_ru: 'Всегда занят(а).', text_ja: 'いつも忙しくしている。', text_ko: '항상 바쁘다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: false },
  // E5: Excitement-Seeking
  { id: 11, text_en: 'Love excitement.', text_zh: '喜爱刺激。', text_nl: 'Hou van opwinding.', text_de: 'Liebe Aufregung.', text_fr: 'Adore l\'excitation.', text_es: 'Me encanta la emoción.', text_pt: 'Adoro emoção.', text_it: 'Adoro l\'eccitazione.', text_ru: 'Люблю острые ощущения.', text_ja: '刺激が大好きだ。', text_ko: '흥분되는 것을 좋아한다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  // E6: Cheerfulness
  { id: 12, text_en: 'Radiate joy.', text_zh: '散发快乐。', text_nl: 'Straal vreugde uit.', text_de: 'Strahle Freude aus.', text_fr: 'Rayonne de joie.', text_es: 'Irradio alegría.', text_pt: 'Irradio alegria.', text_it: 'Irradi gioia.', text_ru: 'Излучаю радость.', text_ja: '喜びを振りまく。', text_ko: '기쁨을 발산한다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },

  // O1: Imagination
  { id: 13, text_en: 'Have a vivid imagination.', text_zh: '拥有丰富的想象力。', text_nl: 'Heb een levendige verbeelding.', text_de: 'Habe eine lebhafte Fantasie.', text_fr: 'Ai une imagination vive.', text_es: 'Tengo una imaginación vívida.', text_pt: 'Tenho uma imaginação vívida.', text_it: 'Ho una vivida immaginazione.', text_ru: 'Обладаю живым воображением.', text_ja: '豊かな想像力を持っている。', text_ko: '생생한 상상력을 가지고 있다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  // O2: Artistic Interests
  { id: 14, text_en: 'Believe in the importance of art.', text_zh: '相信艺术的重要性。', text_nl: 'Geloof in het belang van kunst.', text_de: 'Glaube an die Bedeutung von Kunst.', text_fr: 'Crois en l\'importance de l\'art.', text_es: 'Creo en la importancia del arte.', text_pt: 'Acredito na importância da arte.', text_it: 'Credo nell\'importanza dell\'arte.', text_ru: 'Верю в важность искусства.', text_ja: '芸術の重要性を信じている。', text_ko: '예술의 중요성을 믿는다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: false },
  // O3: Emotionality
  { id: 15, text_en: 'Experience my emotions intensely.', text_zh: '强烈地体验自己的情感。', text_nl: 'Ervaar mijn emoties intens.', text_de: 'Erlebe meine Emotionen intensiv.', text_fr: 'Vis mes émotions intensément.', text_es: 'Experimento mis emociones intensamente.', text_pt: 'Experimento minhas emoções intensamente.', text_it: 'Vivo le mie emozioni intensamente.', text_ru: 'Интенсивно переживаю свои эмоции.', text_ja: '感情を強烈に体験する。', text_ko: '감정을 강렬하게 경험한다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: false },
  // O4: Adventurousness
  { id: 16, text_en: 'Prefer variety to routine.', text_zh: '比起例行公事更喜欢多样化。', text_nl: 'Geef de voorkeur aan afwisseling boven routine.', text_de: 'Bevorzuge Abwechslung gegenüber Routine.', text_fr: 'Préfère la variété à la routine.', text_es: 'Prefiero la variedad a la rutina.', text_pt: 'Prefiro variedade à rotina.', text_it: 'Preferisco la varietà alla routine.', text_ru: 'Предпочитаю разнообразие рутине.', text_ja: 'ルーティンよりも変化を好む。', text_ko: '일상보다 다양성을 선호한다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: false },
  // O5: Intellect
  { id: 17, text_en: 'Love to read challenging material.', text_zh: '喜欢阅读有挑战性的材料。', text_nl: 'Lees graag uitdagend materiaal.', text_de: 'Lese gerne anspruchsvolles Material.', text_fr: 'Aime lire du matériel stimulant.', text_es: 'Me encanta leer material desafiante.', text_pt: 'Adoro ler material desafiador.', text_it: 'Amo leggere materiale impegnativo.', text_ru: 'Люблю читать сложный материал.', text_ja: '難しい読み物を読むのが好きだ。', text_ko: '도전적인 자료를 읽는 것을 좋아한다.', domain: 'openness', facet: 'O5_Intellect', isReversed: false },
  // O6: Liberalism
  { id: 18, text_en: 'Tend to vote for liberal political candidates.', text_zh: '倾向于投票给自由派政治候选人。', text_nl: 'Stem doorgaans op liberale politieke kandidaten.', text_de: 'Neige dazu, liberale politische Kandidaten zu wählen.', text_fr: 'Ai tendance à voter pour des candidats politiques libéraux.', text_es: 'Tiendo a votar por candidatos políticos liberales.', text_pt: 'Tendo a votar em candidatos políticos liberais.', text_it: 'Tendo a votare per candidati politici liberali.', text_ru: 'Склонен голосовать за либеральных политических кандидатов.', text_ja: 'リベラルな政治候補者に投票する傾向がある。', text_ko: '진보적인 정치 후보에게 투표하는 경향이 있다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: false },

  // A1: Trust
  { id: 19, text_en: 'Trust others.', text_zh: '信任他人。', text_nl: 'Vertrouw anderen.', text_de: 'Vertraue anderen.', text_fr: 'Fais confiance aux autres.', text_es: 'Confío en los demás.', text_pt: 'Confio nos outros.', text_it: 'Mi fido degli altri.', text_ru: 'Доверяю другим.', text_ja: '他人を信頼する。', text_ko: '다른 사람들을 신뢰한다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: false },
  // A2: Morality
  { id: 20, text_en: 'Use others for my own ends.', text_zh: '利用他人达到自己的目的。', text_nl: 'Gebruik anderen voor mijn eigen doeleinden.', text_de: 'Benutze andere für meine eigenen Zwecke.', text_fr: 'Utilise les autres à mes propres fins.', text_es: 'Utilizo a los demás para mis propios fines.', text_pt: 'Uso os outros para meus próprios fins.', text_it: 'Uso gli altri per i miei scopi.', text_ru: 'Использую других в своих целях.', text_ja: '自分の目的のために他人を利用する。', text_ko: '나의 목적을 위해 다른 사람을 이용한다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  // A3: Altruism
  { id: 21, text_en: 'Am concerned about others.', text_zh: '关心他人。', text_nl: 'Maak me zorgen om anderen.', text_de: 'Sorge mich um andere.', text_fr: 'Me soucie des autres.', text_es: 'Me preocupo por los demás.', text_pt: 'Preocupo-me com os outros.', text_it: 'Mi preoccupo per gli altri.', text_ru: 'Забочусь о других.', text_ja: '他人のことを心配する。', text_ko: '다른 사람들을 걱정한다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: false },
  // A4: Cooperation
  { id: 22, text_en: 'Love a good fight.', text_zh: '喜欢争论。', text_nl: 'Hou van een goed gevecht.', text_de: 'Liebe einen guten Streit.', text_fr: 'Aime une bonne dispute.', text_es: 'Me gusta una buena pelea.', text_pt: 'Gosto de uma boa briga.', text_it: 'Amo una bella discussione.', text_ru: 'Люблю хороший спор.', text_ja: '論争が好きだ。', text_ko: '논쟁을 즐긴다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  // A5: Modesty
  { id: 23, text_en: 'Believe that I am better than others.', text_zh: '相信自己比别人好。', text_nl: 'Geloof dat ik beter ben dan anderen.', text_de: 'Glaube, dass ich besser bin als andere.', text_fr: 'Crois que je suis meilleur(e) que les autres.', text_es: 'Creo que soy mejor que los demás.', text_pt: 'Acredito que sou melhor que os outros.', text_it: 'Credo di essere migliore degli altri.', text_ru: 'Считаю себя лучше других.', text_ja: '自分は他の人より優れていると思う。', text_ko: '나는 다른 사람보다 낫다고 믿는다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  // A6: Sympathy
  { id: 24, text_en: 'Sympathize with the homeless.', text_zh: '同情无家可归的人。', text_nl: 'Sympathiseer met daklozen.', text_de: 'Habe Mitgefühl mit Obdachlosen.', text_fr: 'Compatis avec les sans-abri.', text_es: 'Simpatizo con las personas sin hogar.', text_pt: 'Simpatizo com os sem-teto.', text_it: 'Simpatia per i senzatetto.', text_ru: 'Сочувствую бездомным.', text_ja: 'ホームレスの人々に同情する。', text_ko: '노숙자들에게 동정심을 느낀다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: false },

  // C1: Self-Efficacy
  { id: 25, text_en: 'Complete tasks successfully.', text_zh: '成功完成任务。', text_nl: 'Voltooi taken succesvol.', text_de: 'Erledige Aufgaben erfolgreich.', text_fr: 'Accomplis les tâches avec succès.', text_es: 'Completo las tareas con éxito.', text_pt: 'Concluo tarefas com sucesso.', text_it: 'Completo i compiti con successo.', text_ru: 'Успешно выполняю задачи.', text_ja: 'タスクを首尾よくこなす。', text_ko: '과제를 성공적으로 완료한다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  // C2: Orderliness
  { id: 26, text_en: 'Like to tidy up.', text_zh: '喜欢收拾整理。', text_nl: 'Ruim graag op.', text_de: 'Räume gerne auf.', text_fr: 'Aime ranger.', text_es: 'Me gusta ordenar.', text_pt: 'Gosto de arrumar.', text_it: 'Mi piace riordinare.', text_ru: 'Люблю наводить порядок.', text_ja: '片付けが好きだ。', text_ko: '정리 정돈하는 것을 좋아한다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: false },
  // C3: Dutifulness
  { id: 27, text_en: 'Keep my promises.', text_zh: '遵守承诺。', text_nl: 'Houd me aan mijn beloften.', text_de: 'Halte meine Versprechen.', text_fr: 'Tiens mes promesses.', text_es: 'Cumplo mis promesas.', text_pt: 'Cumpro minhas promessas.', text_it: 'Mantengo le mie promesse.', text_ru: 'Держу свои обещания.', text_ja: '約束を守る。', text_ko: '약속을 지킨다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: false },
  // C4: Achievement-Striving
  { id: 28, text_en: "Do more than what's expected of me.", text_zh: '做得比期望的更多。', text_nl: 'Doe meer dan wat van me verwacht wordt.', text_de: 'Tue mehr als von mir erwartet wird.', text_fr: 'Fais plus que ce qu\'on attend de moi.', text_es: 'Hago más de lo que se espera de mí.', text_pt: 'Faço mais do que se espera de mim.', text_it: 'Faccio più di quanto ci si aspetta da me.', text_ru: 'Делаю больше, чем от меня ожидают.', text_ja: '期待される以上のことをする。', text_ko: '기대되는 것 이상을 한다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: false },
  // C5: Self-Discipline
  { id: 29, text_en: 'Am always prepared.', text_zh: '总是做好准备。', text_nl: 'Ben altijd voorbereid.', text_de: 'Bin immer vorbereitet.', text_fr: 'Suis toujours préparé(e).', text_es: 'Siempre estoy preparado/a.', text_pt: 'Estou sempre preparado/a.', text_it: 'Sono sempre preparato/a.', text_ru: 'Всегда подготовлен(а).', text_ja: 'いつも準備ができている。', text_ko: '항상 준비되어 있다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: false },
  // C6: Cautiousness
  { id: 30, text_en: 'Jump into things without thinking.', text_zh: '不假思索就行动。', text_nl: 'Spring zonder na te denken ergens in.', text_de: 'Stürze mich ohne nachzudenken in Dinge.', text_fr: 'Me lance dans les choses sans réfléchir.', text_es: 'Me lanzo a las cosas sin pensar.', text_pt: 'Me lanço nas coisas sem pensar.', text_it: 'Mi butto nelle cose senza pensare.', text_ru: 'Бросаюсь в дела, не думая.', text_ja: '考えずに飛び込む。', text_ko: '생각 없이 일에 뛰어든다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },

  // ============================================================
  // Items 31-60 (Cycle 2)
  // ============================================================

  // N1: Anxiety
  { id: 31, text_en: 'Fear for the worst.', text_zh: '害怕最糟糕的情况发生。', text_nl: 'Vrees het ergste.', text_de: 'Befürchte das Schlimmste.', text_fr: 'Crains le pire.', text_es: 'Temo lo peor.', text_pt: 'Temo o pior.', text_it: 'Temo il peggio.', text_ru: 'Боюсь худшего.', text_ja: '最悪の事態を恐れる。', text_ko: '최악의 상황을 두려워한다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  // N2: Anger
  { id: 32, text_en: 'Get irritated easily.', text_zh: '容易烦躁。', text_nl: 'Raak snel geïrriteerd.', text_de: 'Bin leicht reizbar.', text_fr: 'M\'irrite facilement.', text_es: 'Me irrito fácilmente.', text_pt: 'Fico irritado/a facilmente.', text_it: 'Mi irrito facilmente.', text_ru: 'Легко раздражаюсь.', text_ja: 'すぐにイライラする。', text_ko: '쉽게 짜증이 난다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: false },
  // N3: Depression
  { id: 33, text_en: 'Dislike myself.', text_zh: '不喜欢自己。', text_nl: 'Heb een hekel aan mezelf.', text_de: 'Mag mich selbst nicht.', text_fr: 'Ne m\'aime pas.', text_es: 'No me gusto a mí mismo/a.', text_pt: 'Não gosto de mim mesmo/a.', text_it: 'Non mi piaccio.', text_ru: 'Не нравлюсь себе.', text_ja: '自分が嫌いだ。', text_ko: '나 자신이 싫다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: false },
  // N4: Self-Consciousness
  { id: 34, text_en: 'Am afraid to draw attention to myself.', text_zh: '害怕引起别人的注意。', text_nl: 'Ben bang om de aandacht op mezelf te vestigen.', text_de: 'Habe Angst, Aufmerksamkeit auf mich zu ziehen.', text_fr: 'Ai peur d\'attirer l\'attention sur moi.', text_es: 'Tengo miedo de llamar la atención.', text_pt: 'Tenho medo de chamar atenção para mim.', text_it: 'Ho paura di attirare l\'attenzione su di me.', text_ru: 'Боюсь привлекать к себе внимание.', text_ja: '注目を集めるのが怖い。', text_ko: '주목받는 것이 두렵다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: false },
  // N5: Immoderation
  { id: 35, text_en: 'Rarely overindulge.', text_zh: '很少过度放纵。', text_nl: 'Geef me zelden over aan overdaad.', text_de: 'Neige selten zu Übertreibung.', text_fr: 'M\'adonne rarement aux excès.', text_es: 'Rara vez me excedo.', text_pt: 'Raramente me excedo.', text_it: 'Raramente mi lascio andare.', text_ru: 'Редко злоупотребляю чем-либо.', text_ja: '過度に耽溺することはめったにない。', text_ko: '과도하게 탐닉하는 일이 거의 없다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: true },
  // N6: Vulnerability
  { id: 36, text_en: 'Become overwhelmed by events.', text_zh: '容易被事情压倒。', text_nl: 'Raak overweldigd door gebeurtenissen.', text_de: 'Werde von Ereignissen überwältigt.', text_fr: 'Suis submergé(e) par les événements.', text_es: 'Me siento abrumado/a por los acontecimientos.', text_pt: 'Fico sobrecarregado/a por eventos.', text_it: 'Mi sento sopraffatto/a dagli eventi.', text_ru: 'Теряюсь перед лицом событий.', text_ja: '出来事に圧倒される。', text_ko: '사건에 압도당한다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: false },

  // E1: Friendliness
  { id: 37, text_en: 'Feel comfortable around people.', text_zh: '在人群中感到自在。', text_nl: 'Voel me op mijn gemak bij mensen.', text_de: 'Fühle mich in Gesellschaft anderer wohl.', text_fr: 'Me sens à l\'aise en compagnie des autres.', text_es: 'Me siento cómodo/a rodeado/a de gente.', text_pt: 'Sinto-me confortável perto de pessoas.', text_it: 'Mi sento a mio agio con le persone.', text_ru: 'Чувствую себя комфортно среди людей.', text_ja: '人々の中で居心地がいい。', text_ko: '사람들과 함께 있으면 편안하다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: false },
  // E2: Gregariousness
  { id: 38, text_en: 'Talk to a lot of different people at parties.', text_zh: '在聚会上和很多不同的人交谈。', text_nl: 'Praat met veel verschillende mensen op feestjes.', text_de: 'Unterhalte mich auf Partys mit vielen verschiedenen Leuten.', text_fr: 'Parle à beaucoup de gens différents aux fêtes.', text_es: 'Hablo con mucha gente diferente en las fiestas.', text_pt: 'Converso com muitas pessoas diferentes em festas.', text_it: 'Parlo con molte persone diverse alle feste.', text_ru: 'Разговариваю с множеством разных людей на вечеринках.', text_ja: 'パーティーでたくさんの人と話す。', text_ko: '파티에서 다양한 사람들과 대화한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: false },
  // E3: Assertiveness
  { id: 39, text_en: 'Try to lead others.', text_zh: '试图领导他人。', text_nl: 'Probeer anderen te leiden.', text_de: 'Versuche, andere zu führen.', text_fr: 'Essaie de diriger les autres.', text_es: 'Intento liderar a los demás.', text_pt: 'Tento liderar os outros.', text_it: 'Cerco di guidare gli altri.', text_ru: 'Стараюсь вести за собой других.', text_ja: '他の人をリードしようとする。', text_ko: '다른 사람들을 이끌려고 한다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: false },
  // E4: Activity Level
  { id: 40, text_en: 'Am always on the go.', text_zh: '总是在行动。', text_nl: 'Ben altijd in de weer.', text_de: 'Bin immer unterwegs.', text_fr: 'Suis toujours en mouvement.', text_es: 'Siempre estoy en movimiento.', text_pt: 'Estou sempre em movimento.', text_it: 'Sono sempre in movimento.', text_ru: 'Всегда в движении.', text_ja: 'いつも動き回っている。', text_ko: '항상 바쁘게 움직인다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: false },
  // E5: Excitement-Seeking
  { id: 41, text_en: 'Seek adventure.', text_zh: '寻求冒险。', text_nl: 'Zoek avontuur.', text_de: 'Suche Abenteuer.', text_fr: 'Cherche l\'aventure.', text_es: 'Busco aventuras.', text_pt: 'Busco aventura.', text_it: 'Cerco avventure.', text_ru: 'Ищу приключения.', text_ja: '冒険を求める。', text_ko: '모험을 추구한다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  // E6: Cheerfulness
  { id: 42, text_en: 'Have a lot of fun.', text_zh: '拥有很多乐趣。', text_nl: 'Heb veel plezier.', text_de: 'Habe viel Spaß.', text_fr: 'M\'amuse beaucoup.', text_es: 'Me divierto mucho.', text_pt: 'Me divirto muito.', text_it: 'Mi diverto molto.', text_ru: 'Хорошо провожу время.', text_ja: 'たくさん楽しむ。', text_ko: '많이 즐긴다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },

  // O1: Imagination
  { id: 43, text_en: 'Enjoy wild flights of fantasy.', text_zh: '享受天马行空的幻想。', text_nl: 'Geniet van wilde fantasieën.', text_de: 'Genieße wilde Fantasien.', text_fr: 'Apprécie les envolées de fantaisie.', text_es: 'Disfruto de vuelos salvajes de fantasía.', text_pt: 'Aprecio voos selvagens de fantasia.', text_it: 'Apprezzo voli sfrenati di fantasia.', text_ru: 'Наслаждаюсь безудержными фантазиями.', text_ja: '自由奔放な空想を楽しむ。', text_ko: '거침없는 공상을 즐긴다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  // O2: Artistic Interests
  { id: 44, text_en: 'See beauty in things that others might not notice.', text_zh: '在别人可能注意不到的地方看到美。', text_nl: 'Zie schoonheid in dingen die anderen misschien niet opmerken.', text_de: 'Sehe Schönheit in Dingen, die andere vielleicht nicht bemerken.', text_fr: 'Vois la beauté dans des choses que d\'autres pourraient ne pas remarquer.', text_es: 'Veo belleza en cosas que otros podrían no notar.', text_pt: 'Vejo beleza em coisas que outros podem não notar.', text_it: 'Vedo bellezza in cose che altri potrebbero non notare.', text_ru: 'Вижу красоту в том, чего другие могут не замечать.', text_ja: '他の人が気づかないものに美しさを見出す。', text_ko: '다른 사람들이 알아채지 못하는 것에서 아름다움을 본다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: false },
  // O3: Emotionality
  { id: 45, text_en: "Feel others' emotions.", text_zh: '能感受到他人的情绪。', text_nl: 'Voel de emoties van anderen.', text_de: 'Fühle die Emotionen anderer.', text_fr: 'Ressens les émotions des autres.', text_es: 'Siento las emociones de los demás.', text_pt: 'Sinto as emoções dos outros.', text_it: 'Sento le emozioni degli altri.', text_ru: 'Чувствую эмоции других людей.', text_ja: '他人の感情を感じ取る。', text_ko: '다른 사람의 감정을 느낀다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: false },
  // O4: Adventurousness
  { id: 46, text_en: 'Prefer to stick with things that I know.', text_zh: '更喜欢坚持自己熟悉的事物。', text_nl: 'Houd me liever bij dingen die ik ken.', text_de: 'Bleibe lieber bei Dingen, die ich kenne.', text_fr: 'Préfère m\'en tenir à ce que je connais.', text_es: 'Prefiero quedarme con lo que conozco.', text_pt: 'Prefiro ficar com o que conheço.', text_it: 'Preferisco attenermi a ciò che conosco.', text_ru: 'Предпочитаю придерживаться того, что знаю.', text_ja: '知っていることにこだわる方が好きだ。', text_ko: '아는 것에 머무르는 것을 선호한다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: true },
  // O5: Intellect
  { id: 47, text_en: 'Avoid philosophical discussions.', text_zh: '回避哲学讨论。', text_nl: 'Vermijd filosofische discussies.', text_de: 'Vermeide philosophische Diskussionen.', text_fr: 'Évite les discussions philosophiques.', text_es: 'Evito las discusiones filosóficas.', text_pt: 'Evito discussões filosóficas.', text_it: 'Evito le discussioni filosofiche.', text_ru: 'Избегаю философских дискуссий.', text_ja: '哲学的な議論を避ける。', text_ko: '철학적 토론을 피한다.', domain: 'openness', facet: 'O5_Intellect', isReversed: true },
  // O6: Liberalism
  { id: 48, text_en: 'Believe that there is no absolute right and wrong.', text_zh: '相信没有绝对的对与错。', text_nl: 'Geloof dat er geen absoluut goed en kwaad is.', text_de: 'Glaube, dass es kein absolutes Richtig und Falsch gibt.', text_fr: 'Crois qu\'il n\'y a pas de bien et de mal absolus.', text_es: 'Creo que no hay un bien y un mal absolutos.', text_pt: 'Acredito que não existe certo e errado absolutos.', text_it: 'Credo che non esista un giusto e un sbagliato assoluti.', text_ru: 'Считаю, что нет абсолютного добра и зла.', text_ja: '絶対的な善悪はないと信じている。', text_ko: '절대적인 옳고 그름은 없다고 믿는다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: false },

  // A1: Trust
  { id: 49, text_en: 'Believe that others have good intentions.', text_zh: '相信他人是善意的。', text_nl: 'Geloof dat anderen goede bedoelingen hebben.', text_de: 'Glaube, dass andere gute Absichten haben.', text_fr: 'Crois que les autres ont de bonnes intentions.', text_es: 'Creo que los demás tienen buenas intenciones.', text_pt: 'Acredito que os outros têm boas intenções.', text_it: 'Credo che gli altri abbiano buone intenzioni.', text_ru: 'Верю, что у других добрые намерения.', text_ja: '他人には善意があると信じている。', text_ko: '다른 사람들이 좋은 의도를 가지고 있다고 믿는다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: false },
  // A2: Morality
  { id: 50, text_en: 'Cheat to get ahead.', text_zh: '通过欺骗来获得成功。', text_nl: 'Sjoemel om vooruit te komen.', text_de: 'Betrüge, um voranzukommen.', text_fr: 'Triche pour avancer.', text_es: 'Hago trampa para salir adelante.', text_pt: 'Trapaceio para progredir.', text_it: 'Imbroglio per andare avanti.', text_ru: 'Обманываю, чтобы продвинуться.', text_ja: '出世するためにずるをする。', text_ko: '앞서 나가기 위해 속임수를 쓴다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  // A3: Altruism
  { id: 51, text_en: 'Love to help others.', text_zh: '喜欢帮助别人。', text_nl: 'Help anderen graag.', text_de: 'Helfe gerne anderen.', text_fr: 'Aime aider les autres.', text_es: 'Me encanta ayudar a los demás.', text_pt: 'Adoro ajudar os outros.', text_it: 'Amo aiutare gli altri.', text_ru: 'Люблю помогать другим.', text_ja: '人を助けるのが好きだ。', text_ko: '다른 사람을 돕는 것을 좋아한다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: false },
  // A4: Cooperation
  { id: 52, text_en: 'Yell at people.', text_zh: '对人大喊大叫。', text_nl: 'Schreeuw tegen mensen.', text_de: 'Schreie Menschen an.', text_fr: 'Crie sur les gens.', text_es: 'Le grito a la gente.', text_pt: 'Grito com as pessoas.', text_it: 'Urlo alle persone.', text_ru: 'Кричу на людей.', text_ja: '人に怒鳴る。', text_ko: '사람들에게 소리를 지른다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  // A5: Modesty
  { id: 53, text_en: 'Think highly of myself.', text_zh: '对自己评价很高。', text_nl: 'Heb een hoge dunk van mezelf.', text_de: 'Halte viel von mir.', text_fr: 'Ai une haute opinion de moi-même.', text_es: 'Tengo un alto concepto de mí mismo/a.', text_pt: 'Penso muito bem de mim mesmo/a.', text_it: 'Ho un\'alta opinione di me stesso/a.', text_ru: 'Высоко ценю себя.', text_ja: '自分を高く評価している。', text_ko: '스스로를 높이 평가한다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  // A6: Sympathy
  { id: 54, text_en: 'Feel sympathy for those who are worse off than myself.', text_zh: '同情比自己更不幸的人。', text_nl: 'Voel sympathie voor degenen die het slechter hebben dan ik.', text_de: 'Empfinde Mitgefühl für diejenigen, denen es schlechter geht als mir.', text_fr: 'Éprouve de la sympathie pour ceux qui sont plus mal lotis que moi.', text_es: 'Siento simpatía por quienes están peor que yo.', text_pt: 'Sinto compaixão por aqueles que estão em pior situação que eu.', text_it: 'Provo simpatia per chi sta peggio di me.', text_ru: 'Сочувствую тем, кому хуже, чем мне.', text_ja: '自分より恵まれない人に同情する。', text_ko: '나보다 어려운 처지에 있는 사람들에게 동정심을 느낀다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: false },

  // C1: Self-Efficacy
  { id: 55, text_en: 'Excel in what I do.', text_zh: '在所做的事情上表现出色。', text_nl: 'Blink uit in wat ik doe.', text_de: 'Bin hervorragend in dem, was ich tue.', text_fr: 'Excelle dans ce que je fais.', text_es: 'Sobresalgo en lo que hago.', text_pt: 'Me destaco no que faço.', text_it: 'Eccello in ciò che faccio.', text_ru: 'Преуспеваю в том, что делаю.', text_ja: '自分のすることに秀でている。', text_ko: '하는 일에서 뛰어나다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  // C2: Orderliness
  { id: 56, text_en: 'Often forget to put things back in their proper place.', text_zh: '经常忘记把东西放回原处。', text_nl: 'Vergeet vaak dingen terug te leggen op hun plek.', text_de: 'Vergesse oft, Dinge an ihren Platz zurückzulegen.', text_fr: 'Oublie souvent de remettre les choses à leur place.', text_es: 'A menudo olvido poner las cosas en su lugar.', text_pt: 'Frequentemente esqueço de colocar as coisas de volta no lugar.', text_it: 'Dimentico spesso di rimettere le cose al loro posto.', text_ru: 'Часто забываю вернуть вещи на место.', text_ja: 'よく物を元の場所に戻すのを忘れる。', text_ko: '물건을 제자리에 돌려놓는 것을 자주 잊는다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: true },
  // C3: Dutifulness
  { id: 57, text_en: 'Tell the truth.', text_zh: '说实话。', text_nl: 'Vertel de waarheid.', text_de: 'Sage die Wahrheit.', text_fr: 'Dis la vérité.', text_es: 'Digo la verdad.', text_pt: 'Digo a verdade.', text_it: 'Dico la verità.', text_ru: 'Говорю правду.', text_ja: '真実を話す。', text_ko: '진실을 말한다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: false },
  // C4: Achievement-Striving
  { id: 58, text_en: 'Work hard.', text_zh: '努力工作。', text_nl: 'Werk hard.', text_de: 'Arbeite hart.', text_fr: 'Travaille dur.', text_es: 'Trabajo duro.', text_pt: 'Trabalho duro.', text_it: 'Lavoro sodo.', text_ru: 'Усердно работаю.', text_ja: '一生懸命働く。', text_ko: '열심히 일한다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: false },
  // C5: Self-Discipline
  { id: 59, text_en: 'Carry out my plans.', text_zh: '执行自己的计划。', text_nl: 'Voer mijn plannen uit.', text_de: 'Führe meine Pläne aus.', text_fr: 'Réalise mes projets.', text_es: 'Llevo a cabo mis planes.', text_pt: 'Executo meus planos.', text_it: 'Porto avanti i miei piani.', text_ru: 'Выполняю свои планы.', text_ja: '計画を実行する。', text_ko: '계획을 실행한다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: false },
  // C6: Cautiousness
  { id: 60, text_en: 'Make rash decisions.', text_zh: '做出草率的决定。', text_nl: 'Neem overhaaste beslissingen.', text_de: 'Treffe voreilige Entscheidungen.', text_fr: 'Prends des décisions hâtives.', text_es: 'Tomo decisiones precipitadas.', text_pt: 'Tomo decisões precipitadas.', text_it: 'Prendo decisioni avventate.', text_ru: 'Принимаю поспешные решения.', text_ja: '軽率な決断をする。', text_ko: '성급한 결정을 내린다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },

  // ============================================================
  // Items 61-90 (Cycle 3)
  // ============================================================

  // N1: Anxiety
  { id: 61, text_en: 'Am afraid of many things.', text_zh: '害怕很多事情。', text_nl: 'Ben bang voor veel dingen.', text_de: 'Habe vor vielen Dingen Angst.', text_fr: 'Ai peur de beaucoup de choses.', text_es: 'Tengo miedo de muchas cosas.', text_pt: 'Tenho medo de muitas coisas.', text_it: 'Ho paura di molte cose.', text_ru: 'Боюсь многого.', text_ja: '多くのことを恐れている。', text_ko: '많은 것을 두려워한다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  // N2: Anger
  { id: 62, text_en: 'Lose my temper.', text_zh: '容易发脾气。', text_nl: 'Verlies mijn geduld.', text_de: 'Verliere die Beherrschung.', text_fr: 'Perds mon sang-froid.', text_es: 'Pierdo los estribos.', text_pt: 'Perco a calma.', text_it: 'Perdo le staffe.', text_ru: 'Теряю самообладание.', text_ja: 'かっとなる。', text_ko: '화를 참지 못한다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: false },
  // N3: Depression
  { id: 63, text_en: 'Am often down in the dumps.', text_zh: '经常情绪低落。', text_nl: 'Ben vaak in de put.', text_de: 'Bin oft niedergeschlagen.', text_fr: 'Suis souvent déprimé(e).', text_es: 'A menudo estoy deprimido/a.', text_pt: 'Frequentemente estou para baixo.', text_it: 'Sono spesso giù di morale.', text_ru: 'Часто нахожусь в подавленном состоянии.', text_ja: 'よく落ち込んでいる。', text_ko: '자주 기분이 가라앉는다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: false },
  // N4: Self-Consciousness
  { id: 64, text_en: 'Only feel comfortable with friends.', text_zh: '只有和朋友在一起才觉得自在。', text_nl: 'Voel me alleen op mijn gemak bij vrienden.', text_de: 'Fühle mich nur bei Freunden wohl.', text_fr: 'Ne me sens à l\'aise qu\'avec des amis.', text_es: 'Solo me siento cómodo/a con amigos.', text_pt: 'Só me sinto confortável com amigos.', text_it: 'Mi sento a mio agio solo con gli amici.', text_ru: 'Чувствую себя комфортно только с друзьями.', text_ja: '友達といるときだけ居心地がいい。', text_ko: '친구들과 함께 있을 때만 편안하다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: false },
  // N5: Immoderation
  { id: 65, text_en: 'Easily resist temptations.', text_zh: '容易抵制诱惑。', text_nl: 'Weersta gemakkelijk verleidingen.', text_de: 'Widerstehe Versuchungen leicht.', text_fr: 'Résiste facilement aux tentations.', text_es: 'Resisto fácilmente las tentaciones.', text_pt: 'Resisto facilmente às tentações.', text_it: 'Resisto facilmente alle tentazioni.', text_ru: 'Легко противостою соблазнам.', text_ja: '誘惑に簡単に抵抗できる。', text_ko: '유혹에 쉽게 저항한다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: true },
  // N6: Vulnerability
  { id: 66, text_en: "Feel that I'm unable to deal with things.", text_zh: '觉得自己无法处理事情。', text_nl: 'Heb het gevoel dat ik niet met dingen kan omgaan.', text_de: 'Habe das Gefühl, Dinge nicht bewältigen zu können.', text_fr: 'Sens que je suis incapable de gérer les choses.', text_es: 'Siento que soy incapaz de manejar las cosas.', text_pt: 'Sinto que sou incapaz de lidar com as coisas.', text_it: 'Sento di non essere in grado di gestire le cose.', text_ru: 'Чувствую, что не могу справиться с ситуацией.', text_ja: '物事に対処できないと感じる。', text_ko: '일을 처리할 수 없다고 느낀다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: false },

  // E1: Friendliness
  { id: 67, text_en: 'Avoid contacts with others.', text_zh: '回避与他人接触。', text_nl: 'Vermijd contact met anderen.', text_de: 'Vermeide Kontakt mit anderen.', text_fr: 'Évite les contacts avec les autres.', text_es: 'Evito el contacto con los demás.', text_pt: 'Evito contato com os outros.', text_it: 'Evito il contatto con gli altri.', text_ru: 'Избегаю контактов с другими.', text_ja: '他人との接触を避ける。', text_ko: '다른 사람과의 접촉을 피한다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: true },
  // E2: Gregariousness
  { id: 68, text_en: 'Prefer to be alone.', text_zh: '更喜欢独处。', text_nl: 'Ben liever alleen.', text_de: 'Bin lieber allein.', text_fr: 'Préfère être seul(e).', text_es: 'Prefiero estar solo/a.', text_pt: 'Prefiro ficar sozinho/a.', text_it: 'Preferisco stare da solo/a.', text_ru: 'Предпочитаю быть один/одна.', text_ja: '一人でいる方が好きだ。', text_ko: '혼자 있는 것을 선호한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: true },
  // E3: Assertiveness
  { id: 69, text_en: 'Take control of things.', text_zh: '掌控局面。', text_nl: 'Neem de controle over dingen.', text_de: 'Übernehme die Kontrolle.', text_fr: 'Prends le contrôle des choses.', text_es: 'Tomo el control de las cosas.', text_pt: 'Assumo o controle das coisas.', text_it: 'Prendo il controllo delle cose.', text_ru: 'Беру ситуацию под контроль.', text_ja: '物事を掌握する。', text_ko: '상황을 통제한다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: false },
  // E4: Activity Level
  { id: 70, text_en: 'Do a lot in my spare time.', text_zh: '空闲时间做很多事情。', text_nl: 'Doe veel in mijn vrije tijd.', text_de: 'Mache viel in meiner Freizeit.', text_fr: 'Fais beaucoup de choses pendant mon temps libre.', text_es: 'Hago muchas cosas en mi tiempo libre.', text_pt: 'Faço muita coisa no meu tempo livre.', text_it: 'Faccio molto nel mio tempo libero.', text_ru: 'Много делаю в свободное время.', text_ja: '暇な時間にたくさんのことをする。', text_ko: '여가 시간에 많은 일을 한다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: false },
  // E5: Excitement-Seeking
  { id: 71, text_en: 'Enjoy being reckless.', text_zh: '享受冒险行为。', text_nl: 'Geniet van roekeloos zijn.', text_de: 'Genieße es, leichtsinnig zu sein.', text_fr: 'Apprécie d\'être imprudent(e).', text_es: 'Disfruto ser imprudente.', text_pt: 'Gosto de ser imprudente.', text_it: 'Mi piace essere spericolato/a.', text_ru: 'Мне нравится быть безрассудным.', text_ja: '無謀なことを楽しむ。', text_ko: '무모한 행동을 즐긴다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  // E6: Cheerfulness
  { id: 72, text_en: 'Love life.', text_zh: '热爱生活。', text_nl: 'Hou van het leven.', text_de: 'Liebe das Leben.', text_fr: 'Aime la vie.', text_es: 'Amo la vida.', text_pt: 'Amo a vida.', text_it: 'Amo la vita.', text_ru: 'Люблю жизнь.', text_ja: '人生を愛している。', text_ko: '삶을 사랑한다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },

  // O1: Imagination
  { id: 73, text_en: 'Love to daydream.', text_zh: '喜欢白日做梦。', text_nl: 'Dagdroom graag.', text_de: 'Tagträume gerne.', text_fr: 'Aime rêvasser.', text_es: 'Me encanta soñar despierto/a.', text_pt: 'Adoro sonhar acordado/a.', text_it: 'Amo sognare a occhi aperti.', text_ru: 'Люблю мечтать.', text_ja: '白昼夢を見るのが好きだ。', text_ko: '공상하는 것을 좋아한다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  // O2: Artistic Interests
  { id: 74, text_en: 'Do not like poetry.', text_zh: '不喜欢诗歌。', text_nl: 'Hou niet van poëzie.', text_de: 'Mag keine Lyrik.', text_fr: 'N\'aime pas la poésie.', text_es: 'No me gusta la poesía.', text_pt: 'Não gosto de poesia.', text_it: 'Non mi piace la poesia.', text_ru: 'Не люблю поэзию.', text_ja: '詩が好きではない。', text_ko: '시를 좋아하지 않는다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: true },
  // O3: Emotionality
  { id: 75, text_en: 'Rarely notice my emotional reactions.', text_zh: '很少注意到自己的情绪反应。', text_nl: 'Merk mijn emotionele reacties zelden op.', text_de: 'Bemerke meine emotionalen Reaktionen selten.', text_fr: 'Remarque rarement mes réactions émotionnelles.', text_es: 'Rara vez noto mis reacciones emocionales.', text_pt: 'Raramente noto minhas reações emocionais.', text_it: 'Raramente noto le mie reazioni emotive.', text_ru: 'Редко замечаю свои эмоциональные реакции.', text_ja: '自分の感情的な反応にほとんど気づかない。', text_ko: '나의 감정적 반응을 거의 알아채지 못한다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: true },
  // O4: Adventurousness
  { id: 76, text_en: 'Dislike changes.', text_zh: '不喜欢变化。', text_nl: 'Houd niet van veranderingen.', text_de: 'Mag keine Veränderungen.', text_fr: 'N\'aime pas les changements.', text_es: 'No me gustan los cambios.', text_pt: 'Não gosto de mudanças.', text_it: 'Non mi piacciono i cambiamenti.', text_ru: 'Не люблю перемены.', text_ja: '変化が好きではない。', text_ko: '변화를 싫어한다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: true },
  // O5: Intellect
  { id: 77, text_en: 'Have difficulty understanding abstract ideas.', text_zh: '难以理解抽象概念。', text_nl: 'Heb moeite met het begrijpen van abstracte ideeën.', text_de: 'Habe Schwierigkeiten, abstrakte Ideen zu verstehen.', text_fr: 'Ai du mal à comprendre les idées abstraites.', text_es: 'Tengo dificultad para entender ideas abstractas.', text_pt: 'Tenho dificuldade em entender ideias abstratas.', text_it: 'Ho difficoltà a capire le idee astratte.', text_ru: 'С трудом понимаю абстрактные идеи.', text_ja: '抽象的な考えを理解するのが難しい。', text_ko: '추상적인 아이디어를 이해하기 어렵다.', domain: 'openness', facet: 'O5_Intellect', isReversed: true },
  // O6: Liberalism
  { id: 78, text_en: 'Tend to vote for conservative political candidates.', text_zh: '倾向于投票给保守派政治候选人。', text_nl: 'Stem doorgaans op conservatieve politieke kandidaten.', text_de: 'Neige dazu, konservative politische Kandidaten zu wählen.', text_fr: 'Ai tendance à voter pour des candidats politiques conservateurs.', text_es: 'Tiendo a votar por candidatos políticos conservadores.', text_pt: 'Tendo a votar em candidatos políticos conservadores.', text_it: 'Tendo a votare per candidati politici conservatori.', text_ru: 'Склонен голосовать за консервативных политических кандидатов.', text_ja: '保守的な政治候補者に投票する傾向がある。', text_ko: '보수적인 정치 후보에게 투표하는 경향이 있다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: true },

  // A1: Trust
  { id: 79, text_en: 'Trust what people say.', text_zh: '相信别人说的话。', text_nl: 'Vertrouw op wat mensen zeggen.', text_de: 'Vertraue dem, was Menschen sagen.', text_fr: 'Fais confiance à ce que les gens disent.', text_es: 'Confío en lo que la gente dice.', text_pt: 'Confio no que as pessoas dizem.', text_it: 'Mi fido di ciò che la gente dice.', text_ru: 'Доверяю тому, что говорят люди.', text_ja: '人の言うことを信じる。', text_ko: '사람들이 하는 말을 신뢰한다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: false },
  // A2: Morality
  { id: 80, text_en: 'Take advantage of others.', text_zh: '占别人的便宜。', text_nl: 'Maak misbruik van anderen.', text_de: 'Nutze andere aus.', text_fr: 'Profite des autres.', text_es: 'Me aprovecho de los demás.', text_pt: 'Tiro vantagem dos outros.', text_it: 'Approfitto degli altri.', text_ru: 'Использую других в своих интересах.', text_ja: '他人を利用する。', text_ko: '다른 사람을 이용한다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  // A3: Altruism
  { id: 81, text_en: 'Am indifferent to the feelings of others.', text_zh: '对他人的感受漠不关心。', text_nl: 'Ben onverschillig voor de gevoelens van anderen.', text_de: 'Bin gleichgültig gegenüber den Gefühlen anderer.', text_fr: 'Suis indifférent(e) aux sentiments des autres.', text_es: 'Soy indiferente a los sentimientos de los demás.', text_pt: 'Sou indiferente aos sentimentos dos outros.', text_it: 'Sono indifferente ai sentimenti degli altri.', text_ru: 'Равнодушен к чувствам других.', text_ja: '他人の感情に無関心だ。', text_ko: '다른 사람의 감정에 무관심하다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: true },
  // A4: Cooperation
  { id: 82, text_en: 'Insult people.', text_zh: '侮辱他人。', text_nl: 'Beledig mensen.', text_de: 'Beleidige Menschen.', text_fr: 'Insulte les gens.', text_es: 'Insulto a la gente.', text_pt: 'Insulto as pessoas.', text_it: 'Insulto le persone.', text_ru: 'Оскорбляю людей.', text_ja: '人を侮辱する。', text_ko: '사람들을 모욕한다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  // A5: Modesty
  { id: 83, text_en: 'Have a high opinion of myself.', text_zh: '对自己有很高的看法。', text_nl: 'Heb een hoge dunk van mezelf.', text_de: 'Habe eine hohe Meinung von mir.', text_fr: 'Ai une haute opinion de moi-même.', text_es: 'Tengo una alta opinión de mí mismo/a.', text_pt: 'Tenho uma alta opinião de mim mesmo/a.', text_it: 'Ho un\'alta opinione di me stesso/a.', text_ru: 'Высокого мнения о себе.', text_ja: '自分について高い評価を持っている。', text_ko: '나 자신에 대해 높은 평가를 한다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  // A6: Sympathy
  { id: 84, text_en: "Am not interested in other people's problems.", text_zh: '对别人的问题不感兴趣。', text_nl: 'Ben niet geïnteresseerd in de problemen van anderen.', text_de: 'Bin nicht an den Problemen anderer interessiert.', text_fr: 'Ne m\'intéresse pas aux problèmes des autres.', text_es: 'No me interesan los problemas de los demás.', text_pt: 'Não me interesso pelos problemas dos outros.', text_it: 'Non mi interessano i problemi degli altri.', text_ru: 'Не интересуюсь проблемами других людей.', text_ja: '他人の問題に興味がない。', text_ko: '다른 사람들의 문제에 관심이 없다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: true },

  // C1: Self-Efficacy
  { id: 85, text_en: 'Handle tasks smoothly.', text_zh: '顺利处理任务。', text_nl: 'Handel taken soepel af.', text_de: 'Erledige Aufgaben reibungslos.', text_fr: 'Gère les tâches en douceur.', text_es: 'Manejo las tareas sin problemas.', text_pt: 'Lido com tarefas sem problemas.', text_it: 'Gestisco i compiti senza intoppi.', text_ru: 'Справляюсь с задачами без затруднений.', text_ja: 'タスクをスムーズにこなす。', text_ko: '과제를 원활하게 처리한다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  // C2: Orderliness
  { id: 86, text_en: 'Leave a mess in my room.', text_zh: '房间很乱。', text_nl: 'Laat een rommel achter in mijn kamer.', text_de: 'Hinterlasse ein Durcheinander in meinem Zimmer.', text_fr: 'Laisse du désordre dans ma chambre.', text_es: 'Dejo un desorden en mi habitación.', text_pt: 'Deixo bagunça no meu quarto.', text_it: 'Lascio disordine nella mia stanza.', text_ru: 'Оставляю беспорядок в своей комнате.', text_ja: '部屋を散らかしたままにする。', text_ko: '방을 어지럽혀 놓는다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: true },
  // C3: Dutifulness
  { id: 87, text_en: 'Break rules.', text_zh: '违反规则。', text_nl: 'Overtreed regels.', text_de: 'Breche Regeln.', text_fr: 'Enfreins les règles.', text_es: 'Rompo las reglas.', text_pt: 'Quebro regras.', text_it: 'Infrango le regole.', text_ru: 'Нарушаю правила.', text_ja: 'ルールを破る。', text_ko: '규칙을 어긴다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: true },
  // C4: Achievement-Striving
  { id: 88, text_en: 'Put little time and effort into my work.', text_zh: '在工作上投入很少的时间和精力。', text_nl: 'Steek weinig tijd en moeite in mijn werk.', text_de: 'Investiere wenig Zeit und Mühe in meine Arbeit.', text_fr: 'Consacre peu de temps et d\'efforts à mon travail.', text_es: 'Dedico poco tiempo y esfuerzo a mi trabajo.', text_pt: 'Dedico pouco tempo e esforço ao meu trabalho.', text_it: 'Dedico poco tempo e impegno al mio lavoro.', text_ru: 'Трачу мало времени и усилий на работу.', text_ja: '仕事に時間と労力をあまりかけない。', text_ko: '일에 시간과 노력을 거의 들이지 않는다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: true },
  // C5: Self-Discipline
  { id: 89, text_en: 'Waste my time.', text_zh: '浪费时间。', text_nl: 'Verspil mijn tijd.', text_de: 'Verschwende meine Zeit.', text_fr: 'Perds mon temps.', text_es: 'Pierdo el tiempo.', text_pt: 'Desperdiço meu tempo.', text_it: 'Spreco il mio tempo.', text_ru: 'Трачу время впустую.', text_ja: '時間を無駄にする。', text_ko: '시간을 낭비한다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: true },
  // C6: Cautiousness
  { id: 90, text_en: 'Rush into things.', text_zh: '仓促行事。', text_nl: 'Ga overhaast te werk.', text_de: 'Stürze mich in Dinge.', text_fr: 'Me précipite dans les choses.', text_es: 'Me precipito en las cosas.', text_pt: 'Me apresso nas coisas.', text_it: 'Mi precipito nelle cose.', text_ru: 'Тороплюсь с делами.', text_ja: '性急に物事に取りかかる。', text_ko: '성급하게 일을 처리한다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },

  // ============================================================
  // Items 91-120 (Cycle 4)
  // ============================================================

  // N1: Anxiety
  { id: 91, text_en: 'Get stressed out easily.', text_zh: '容易感到压力。', text_nl: 'Raak snel gestrest.', text_de: 'Bin leicht gestresst.', text_fr: 'Me stresse facilement.', text_es: 'Me estreso fácilmente.', text_pt: 'Fico estressado/a facilmente.', text_it: 'Mi stresso facilmente.', text_ru: 'Легко испытываю стресс.', text_ja: 'すぐにストレスを感じる。', text_ko: '쉽게 스트레스를 받는다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  // N2: Anger
  { id: 92, text_en: 'Am not easily annoyed.', text_zh: '不容易被惹恼。', text_nl: 'Raak niet snel geërgerd.', text_de: 'Lasse mich nicht leicht ärgern.', text_fr: 'Ne suis pas facilement contrarié(e).', text_es: 'No me molesto fácilmente.', text_pt: 'Não me irrito facilmente.', text_it: 'Non mi infastidisco facilmente.', text_ru: 'Меня нелегко рассердить.', text_ja: '簡単には腹を立てない。', text_ko: '쉽게 짜증나지 않는다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: true },
  // N3: Depression
  { id: 93, text_en: 'Feel comfortable with myself.', text_zh: '对自己感到自在。', text_nl: 'Voel me goed bij mezelf.', text_de: 'Fühle mich wohl mit mir selbst.', text_fr: 'Me sens bien dans ma peau.', text_es: 'Me siento cómodo/a conmigo mismo/a.', text_pt: 'Me sinto confortável comigo mesmo/a.', text_it: 'Mi sento a mio agio con me stesso/a.', text_ru: 'Чувствую себя комфортно.', text_ja: '自分自身に満足している。', text_ko: '나 자신에 대해 편안하게 느낀다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: true },
  // N4: Self-Consciousness
  { id: 94, text_en: 'Am not bothered by difficult social situations.', text_zh: '困难的社交场合不会困扰我。', text_nl: 'Word niet gestoord door moeilijke sociale situaties.', text_de: 'Werde durch schwierige soziale Situationen nicht beunruhigt.', text_fr: 'Ne suis pas gêné(e) par les situations sociales difficiles.', text_es: 'No me molestan las situaciones sociales difíciles.', text_pt: 'Não me incomodo com situações sociais difíceis.', text_it: 'Non mi turbano le situazioni sociali difficili.', text_ru: 'Сложные социальные ситуации меня не беспокоят.', text_ja: '難しい社交場面に動じない。', text_ko: '어려운 사교 상황에 신경 쓰이지 않는다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: true },
  // N5: Immoderation
  { id: 95, text_en: 'Am able to control my cravings.', text_zh: '能够控制自己的欲望。', text_nl: 'Ben in staat mijn verlangens te beheersen.', text_de: 'Kann meine Gelüste kontrollieren.', text_fr: 'Suis capable de contrôler mes envies.', text_es: 'Soy capaz de controlar mis antojos.', text_pt: 'Consigo controlar meus desejos.', text_it: 'Sono in grado di controllare i miei desideri.', text_ru: 'Способен контролировать свои желания.', text_ja: '欲求をコントロールできる。', text_ko: '욕구를 통제할 수 있다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: true },
  // N6: Vulnerability
  { id: 96, text_en: 'Remain calm under pressure.', text_zh: '在压力下保持冷静。', text_nl: 'Blijf kalm onder druk.', text_de: 'Bleibe unter Druck ruhig.', text_fr: 'Reste calme sous pression.', text_es: 'Mantengo la calma bajo presión.', text_pt: 'Mantenho a calma sob pressão.', text_it: 'Resto calmo/a sotto pressione.', text_ru: 'Сохраняю спокойствие под давлением.', text_ja: 'プレッシャーの中でも冷静でいられる。', text_ko: '압박감 속에서도 침착함을 유지한다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: true },

  // E1: Friendliness
  { id: 97, text_en: 'Keep others at a distance.', text_zh: '与他人保持距离。', text_nl: 'Houd anderen op afstand.', text_de: 'Halte andere auf Distanz.', text_fr: 'Garde les autres à distance.', text_es: 'Mantengo a los demás a distancia.', text_pt: 'Mantenho os outros à distância.', text_it: 'Tengo gli altri a distanza.', text_ru: 'Держу других на расстоянии.', text_ja: '他人と距離を置く。', text_ko: '다른 사람들을 멀리한다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: true },
  // E2: Gregariousness
  { id: 98, text_en: 'Avoid crowds.', text_zh: '回避人群。', text_nl: 'Vermijd menigten.', text_de: 'Vermeide Menschenmengen.', text_fr: 'Évite les foules.', text_es: 'Evito las multitudes.', text_pt: 'Evito multidões.', text_it: 'Evito la folla.', text_ru: 'Избегаю толпы.', text_ja: '人混みを避ける。', text_ko: '인파를 피한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: true },
  // E3: Assertiveness
  { id: 99, text_en: 'Wait for others to lead the way.', text_zh: '等待别人带路。', text_nl: 'Wacht tot anderen de weg wijzen.', text_de: 'Warte darauf, dass andere die Führung übernehmen.', text_fr: 'Attends que les autres montrent le chemin.', text_es: 'Espero a que otros tomen la iniciativa.', text_pt: 'Espero que os outros tomem a iniciativa.', text_it: 'Aspetto che siano gli altri a fare strada.', text_ru: 'Жду, пока другие возьмут на себя инициативу.', text_ja: '他の人がリードするのを待つ。', text_ko: '다른 사람이 앞장서기를 기다린다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: true },
  // E4: Activity Level
  { id: 100, text_en: 'Like to take it easy.', text_zh: '喜欢轻松度日。', text_nl: 'Neem het graag rustig aan.', text_de: 'Nehme es gerne leicht.', text_fr: 'Aime prendre les choses facilement.', text_es: 'Me gusta tomármelo con calma.', text_pt: 'Gosto de levar as coisas com calma.', text_it: 'Mi piace prendermela comoda.', text_ru: 'Люблю не торопиться.', text_ja: 'のんびりするのが好きだ。', text_ko: '느긋하게 지내는 것을 좋아한다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: true },
  // E5: Excitement-Seeking
  { id: 101, text_en: 'Act wild and crazy.', text_zh: '行为疯狂大胆。', text_nl: 'Gedraag me wild en gek.', text_de: 'Verhalte mich wild und verrückt.', text_fr: 'Agis de manière folle et extravagante.', text_es: 'Actúo de forma alocada.', text_pt: 'Ajo de forma selvagem e maluca.', text_it: 'Mi comporto in modo selvaggio e folle.', text_ru: 'Веду себя дико и безумно.', text_ja: '奔放で型破りな行動をする。', text_ko: '거칠고 미친 듯이 행동한다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  // E6: Cheerfulness
  { id: 102, text_en: 'Look at the bright side of life.', text_zh: '看到生活光明的一面。', text_nl: 'Kijk naar de zonnige kant van het leven.', text_de: 'Sehe die helle Seite des Lebens.', text_fr: 'Vois le bon côté de la vie.', text_es: 'Veo el lado positivo de la vida.', text_pt: 'Vejo o lado bom da vida.', text_it: 'Guardo il lato positivo della vita.', text_ru: 'Смотрю на светлую сторону жизни.', text_ja: '人生の明るい面を見る。', text_ko: '인생의 밝은 면을 본다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },

  // O1: Imagination
  { id: 103, text_en: 'Like to get lost in thought.', text_zh: '喜欢沉浸在思考中。', text_nl: 'Verdwaal graag in mijn gedachten.', text_de: 'Versinke gerne in Gedanken.', text_fr: 'Aime me perdre dans mes pensées.', text_es: 'Me gusta perderme en mis pensamientos.', text_pt: 'Gosto de me perder em pensamentos.', text_it: 'Mi piace perdermi nei miei pensieri.', text_ru: 'Люблю погружаться в размышления.', text_ja: '物思いにふけるのが好きだ。', text_ko: '생각에 빠져드는 것을 좋아한다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  // O2: Artistic Interests
  { id: 104, text_en: 'Do not enjoy going to art museums.', text_zh: '不喜欢去美术馆。', text_nl: 'Geniet niet van bezoekjes aan kunstmusea.', text_de: 'Gehe nicht gerne in Kunstmuseen.', text_fr: 'N\'apprécie pas d\'aller dans les musées d\'art.', text_es: 'No disfruto ir a museos de arte.', text_pt: 'Não gosto de ir a museus de arte.', text_it: 'Non mi piace andare ai musei d\'arte.', text_ru: 'Не люблю ходить в художественные музеи.', text_ja: '美術館に行くのが好きではない。', text_ko: '미술관에 가는 것을 즐기지 않는다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: true },
  // O3: Emotionality
  { id: 105, text_en: "Don't understand people who get emotional.", text_zh: '不理解容易情绪化的人。', text_nl: 'Begrijp mensen die emotioneel worden niet.', text_de: 'Verstehe Menschen nicht, die emotional werden.', text_fr: 'Ne comprends pas les gens qui deviennent émotifs.', text_es: 'No entiendo a las personas que se emocionan.', text_pt: 'Não entendo pessoas que ficam emocionais.', text_it: 'Non capisco le persone che si emozionano.', text_ru: 'Не понимаю людей, которые проявляют эмоции.', text_ja: '感情的になる人が理解できない。', text_ko: '감정적이 되는 사람들을 이해하지 못한다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: true },
  // O4: Adventurousness
  { id: 106, text_en: 'Am attached to conventional ways.', text_zh: '固守传统方式。', text_nl: 'Ben gehecht aan conventionele manieren.', text_de: 'Hänge an konventionellen Wegen.', text_fr: 'Suis attaché(e) aux manières conventionnelles.', text_es: 'Me aferro a las formas convencionales.', text_pt: 'Sou apegado/a a formas convencionais.', text_it: 'Sono legato/a ai modi convenzionali.', text_ru: 'Привязан к традиционным способам.', text_ja: '従来のやり方にこだわる。', text_ko: '관습적인 방식에 집착한다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: true },
  // O5: Intellect
  { id: 107, text_en: 'Am not interested in theoretical discussions.', text_zh: '对理论讨论不感兴趣。', text_nl: 'Ben niet geïnteresseerd in theoretische discussies.', text_de: 'Bin nicht an theoretischen Diskussionen interessiert.', text_fr: 'Ne m\'intéresse pas aux discussions théoriques.', text_es: 'No me interesan las discusiones teóricas.', text_pt: 'Não tenho interesse em discussões teóricas.', text_it: 'Non sono interessato/a alle discussioni teoriche.', text_ru: 'Не интересуюсь теоретическими дискуссиями.', text_ja: '理論的な議論に興味がない。', text_ko: '이론적 토론에 관심이 없다.', domain: 'openness', facet: 'O5_Intellect', isReversed: true },
  // O6: Liberalism
  { id: 108, text_en: 'Believe that we should be tough on crime.', text_zh: '认为我们应该严厉打击犯罪。', text_nl: 'Geloof dat we hard moeten optreden tegen misdaad.', text_de: 'Glaube, dass wir hart gegen Kriminalität vorgehen sollten.', text_fr: 'Crois que nous devrions être sévères envers le crime.', text_es: 'Creo que debemos ser duros con el crimen.', text_pt: 'Acredito que devemos ser duros com o crime.', text_it: 'Credo che dovremmo essere duri con il crimine.', text_ru: 'Считаю, что нужно жёстко бороться с преступностью.', text_ja: '犯罪には厳しく対処すべきだと考える。', text_ko: '범죄에 강경하게 대응해야 한다고 믿는다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: true },

  // A1: Trust
  { id: 109, text_en: 'Distrust people.', text_zh: '不信任别人。', text_nl: 'Wantrouw mensen.', text_de: 'Misstraue Menschen.', text_fr: 'Me méfie des gens.', text_es: 'Desconfío de la gente.', text_pt: 'Desconfio das pessoas.', text_it: 'Diffido delle persone.', text_ru: 'Не доверяю людям.', text_ja: '人を信用しない。', text_ko: '사람들을 불신한다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: true },
  // A2: Morality
  { id: 110, text_en: "Obstruct others' plans.", text_zh: '阻碍他人的计划。', text_nl: 'Dwarsboom de plannen van anderen.', text_de: 'Behindere die Pläne anderer.', text_fr: 'Entrave les projets des autres.', text_es: 'Obstruyo los planes de los demás.', text_pt: 'Obstruo os planos dos outros.', text_it: 'Ostacolo i piani degli altri.', text_ru: 'Мешаю планам других.', text_ja: '他人の計画を妨げる。', text_ko: '다른 사람의 계획을 방해한다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  // A3: Altruism
  { id: 111, text_en: 'Take no time for others.', text_zh: '不花时间在他人身上。', text_nl: 'Neem geen tijd voor anderen.', text_de: 'Nehme mir keine Zeit für andere.', text_fr: 'Ne prends pas de temps pour les autres.', text_es: 'No dedico tiempo a los demás.', text_pt: 'Não dedico tempo aos outros.', text_it: 'Non dedico tempo agli altri.', text_ru: 'Не уделяю время другим.', text_ja: '他人に時間を割かない。', text_ko: '다른 사람에게 시간을 내지 않는다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: true },
  // A4: Cooperation
  { id: 112, text_en: 'Get back at others.', text_zh: '报复他人。', text_nl: 'Neem wraak op anderen.', text_de: 'Zahle es anderen heim.', text_fr: 'Me venge des autres.', text_es: 'Me desquito con los demás.', text_pt: 'Me vingo dos outros.', text_it: 'Mi vendico con gli altri.', text_ru: 'Мщу другим.', text_ja: '人に仕返しをする。', text_ko: '다른 사람에게 복수한다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  // A5: Modesty
  { id: 113, text_en: 'Boast about my virtues.', text_zh: '吹嘘自己的优点。', text_nl: 'Schep op over mijn deugden.', text_de: 'Prahle mit meinen Tugenden.', text_fr: 'Me vante de mes vertus.', text_es: 'Presumo de mis virtudes.', text_pt: 'Me vanglorizo das minhas virtudes.', text_it: 'Mi vanto delle mie virtù.', text_ru: 'Хвастаюсь своими достоинствами.', text_ja: '自分の美徳を自慢する。', text_ko: '나의 미덕을 자랑한다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  // A6: Sympathy
  { id: 114, text_en: 'Try not to think about the needy.', text_zh: '尽量不去想那些需要帮助的人。', text_nl: 'Probeer niet aan de behoeftigen te denken.', text_de: 'Versuche, nicht an die Bedürftigen zu denken.', text_fr: 'Essaie de ne pas penser aux nécessiteux.', text_es: 'Intento no pensar en los necesitados.', text_pt: 'Tento não pensar nos necessitados.', text_it: 'Cerco di non pensare ai bisognosi.', text_ru: 'Стараюсь не думать о нуждающихся.', text_ja: '困っている人のことを考えないようにする。', text_ko: '도움이 필요한 사람들에 대해 생각하지 않으려 한다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: true },

  // C1: Self-Efficacy
  { id: 115, text_en: 'Know how to get things done.', text_zh: '知道如何把事情做好。', text_nl: 'Weet hoe ik dingen gedaan krijg.', text_de: 'Weiß, wie man Dinge erledigt.', text_fr: 'Sais comment accomplir les choses.', text_es: 'Sé cómo hacer las cosas.', text_pt: 'Sei como fazer as coisas.', text_it: 'So come portare a termine le cose.', text_ru: 'Знаю, как добиться результата.', text_ja: '物事をやり遂げる方法を知っている。', text_ko: '일을 처리하는 방법을 안다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  // C2: Orderliness
  { id: 116, text_en: 'Leave my belongings around.', text_zh: '到处乱放自己的东西。', text_nl: 'Laat mijn spullen rondslingeren.', text_de: 'Lasse meine Sachen herumliegen.', text_fr: 'Laisse traîner mes affaires.', text_es: 'Dejo mis cosas por ahí.', text_pt: 'Deixo meus pertences espalhados.', text_it: 'Lascio le mie cose in giro.', text_ru: 'Разбрасываю свои вещи.', text_ja: '持ち物をそこら中に放置する。', text_ko: '소지품을 이곳저곳에 둔다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: true },
  // C3: Dutifulness
  { id: 117, text_en: 'Break my promises.', text_zh: '违背承诺。', text_nl: 'Verbreek mijn beloften.', text_de: 'Breche meine Versprechen.', text_fr: 'Ne tiens pas mes promesses.', text_es: 'Rompo mis promesas.', text_pt: 'Quebro minhas promessas.', text_it: 'Non mantengo le mie promesse.', text_ru: 'Нарушаю свои обещания.', text_ja: '約束を破る。', text_ko: '약속을 어긴다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: true },
  // C4: Achievement-Striving
  { id: 118, text_en: 'Do just enough work to get by.', text_zh: '只做刚好够的工作。', text_nl: 'Doe net genoeg werk om rond te komen.', text_de: 'Mache nur genug Arbeit, um durchzukommen.', text_fr: 'Fais juste assez de travail pour m\'en sortir.', text_es: 'Hago solo lo necesario para salir del paso.', text_pt: 'Faço apenas o suficiente para me virar.', text_it: 'Faccio solo il minimo indispensabile.', text_ru: 'Делаю ровно столько, сколько нужно.', text_ja: 'なんとかやっていける程度にしか働かない。', text_ko: '겨우 해낼 정도만 일한다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: true },
  // C5: Self-Discipline
  { id: 119, text_en: 'Have difficulty starting tasks.', text_zh: '难以开始任务。', text_nl: 'Heb moeite om aan taken te beginnen.', text_de: 'Habe Schwierigkeiten, Aufgaben zu beginnen.', text_fr: 'Ai du mal à commencer les tâches.', text_es: 'Tengo dificultad para empezar tareas.', text_pt: 'Tenho dificuldade em começar tarefas.', text_it: 'Ho difficoltà ad iniziare i compiti.', text_ru: 'С трудом берусь за задачи.', text_ja: 'タスクを始めるのが難しい。', text_ko: '과제를 시작하기 어렵다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: true },
  // C6: Cautiousness
  { id: 120, text_en: 'Act without thinking.', text_zh: '不经思考就行动。', text_nl: 'Handel zonder na te denken.', text_de: 'Handle, ohne nachzudenken.', text_fr: 'Agis sans réfléchir.', text_es: 'Actúo sin pensar.', text_pt: 'Ajo sem pensar.', text_it: 'Agisco senza pensare.', text_ru: 'Действую не думая.', text_ja: '考えずに行動する。', text_ko: '생각 없이 행동한다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },
];

// ============================================================
// Reverse-Scored Item IDs (for quick lookup)
// ============================================================

export const REVERSED_ITEMS: number[] = [
  // N domain
  92, 93, 94, 35, 65, 95, 96,
  // E domain
  67, 97, 68, 98, 99, 100,
  // O domain
  74, 104, 75, 105, 46, 76, 106, 47, 77, 107, 78, 108,
  // A domain
  109, 20, 50, 80, 110, 81, 111, 22, 52, 82, 112, 23, 53, 83, 113, 84, 114,
  // C domain
  56, 86, 116, 87, 117, 88, 118, 89, 119, 30, 60, 90, 120,
];

// ============================================================
// Facet → Domain × Items Mapping (with Cronbach's α)
// ============================================================

export const FACET_MAP: Record<string, {
  domain: BigFiveDimension;
  items: number[];
  alpha: number;
}> = {
  // Neuroticism
  'N1_Anxiety':            { domain: 'neuroticism',       items: [1, 31, 61, 91],    alpha: 0.78 },
  'N2_Anger':              { domain: 'neuroticism',       items: [2, 32, 62, 92],    alpha: 0.87 },
  'N3_Depression':         { domain: 'neuroticism',       items: [3, 33, 63, 93],    alpha: 0.85 },
  'N4_Self-Consciousness': { domain: 'neuroticism',       items: [4, 34, 64, 94],    alpha: 0.70 },
  'N5_Immoderation':       { domain: 'neuroticism',       items: [5, 35, 65, 95],    alpha: 0.69 },
  'N6_Vulnerability':      { domain: 'neuroticism',       items: [6, 36, 66, 96],    alpha: 0.76 },

  // Extraversion
  'E1_Friendliness':       { domain: 'extraversion',      items: [7, 37, 67, 97],    alpha: 0.81 },
  'E2_Gregariousness':     { domain: 'extraversion',      items: [8, 38, 68, 98],    alpha: 0.79 },
  'E3_Assertiveness':      { domain: 'extraversion',      items: [9, 39, 69, 99],    alpha: 0.85 },
  'E4_Activity_Level':     { domain: 'extraversion',      items: [10, 40, 70, 100],  alpha: 0.69 },
  'E5_Excitement-Seeking': { domain: 'extraversion',      items: [11, 41, 71, 101],  alpha: 0.73 },
  'E6_Cheerfulness':       { domain: 'extraversion',      items: [12, 42, 72, 102],  alpha: 0.79 },

  // Openness
  'O1_Imagination':        { domain: 'openness',          items: [13, 43, 73, 103],  alpha: 0.74 },
  'O2_Artistic_Interests': { domain: 'openness',          items: [14, 44, 74, 104],  alpha: 0.74 },
  'O3_Emotionality':       { domain: 'openness',          items: [15, 45, 75, 105],  alpha: 0.65 },
  'O4_Adventurousness':    { domain: 'openness',          items: [16, 46, 76, 106],  alpha: 0.70 },
  'O5_Intellect':          { domain: 'openness',          items: [17, 47, 77, 107],  alpha: 0.73 },
  'O6_Liberalism':         { domain: 'openness',          items: [18, 48, 78, 108],  alpha: 0.63 },

  // Agreeableness
  'A1_Trust':              { domain: 'agreeableness',     items: [19, 49, 79, 109],  alpha: 0.85 },
  'A2_Morality':           { domain: 'agreeableness',     items: [20, 50, 80, 110],  alpha: 0.74 },
  'A3_Altruism':           { domain: 'agreeableness',     items: [21, 51, 81, 111],  alpha: 0.73 },
  'A4_Cooperation':        { domain: 'agreeableness',     items: [22, 52, 82, 112],  alpha: 0.71 },
  'A5_Modesty':            { domain: 'agreeableness',     items: [23, 53, 83, 113],  alpha: 0.73 },
  'A6_Sympathy':           { domain: 'agreeableness',     items: [24, 54, 84, 114],  alpha: 0.72 },

  // Conscientiousness
  'C1_Self-Efficacy':       { domain: 'conscientiousness', items: [25, 55, 85, 115],  alpha: 0.77 },
  'C2_Orderliness':         { domain: 'conscientiousness', items: [26, 56, 86, 116],  alpha: 0.83 },
  'C3_Dutifulness':         { domain: 'conscientiousness', items: [27, 57, 87, 117],  alpha: 0.67 },
  'C4_Achievement-Striving': { domain: 'conscientiousness', items: [28, 58, 88, 118],  alpha: 0.79 },
  'C5_Self-Discipline':     { domain: 'conscientiousness', items: [29, 59, 89, 119],  alpha: 0.71 },
  'C6_Cautiousness':        { domain: 'conscientiousness', items: [30, 60, 90, 120],  alpha: 0.88 },
};

// ============================================================
// Domain → Facet names (utility)
// ============================================================

export const DOMAIN_FACETS: Record<BigFiveDimension, string[]> = {
  neuroticism: [
    'N1_Anxiety', 'N2_Anger', 'N3_Depression',
    'N4_Self-Consciousness', 'N5_Immoderation', 'N6_Vulnerability',
  ],
  extraversion: [
    'E1_Friendliness', 'E2_Gregariousness', 'E3_Assertiveness',
    'E4_Activity_Level', 'E5_Excitement-Seeking', 'E6_Cheerfulness',
  ],
  openness: [
    'O1_Imagination', 'O2_Artistic_Interests', 'O3_Emotionality',
    'O4_Adventurousness', 'O5_Intellect', 'O6_Liberalism',
  ],
  agreeableness: [
    'A1_Trust', 'A2_Morality', 'A3_Altruism',
    'A4_Cooperation', 'A5_Modesty', 'A6_Sympathy',
  ],
  conscientiousness: [
    'C1_Self-Efficacy', 'C2_Orderliness', 'C3_Dutifulness',
    'C4_Achievement-Striving', 'C5_Self-Discipline', 'C6_Cautiousness',
  ],
};
