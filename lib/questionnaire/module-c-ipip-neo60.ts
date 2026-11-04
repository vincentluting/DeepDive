// ============================================================
// Module C (v3.0): IPIP-NEO-60 — Maples-Keller et al. (2019)
// ============================================================
// Published, IRT-validated 60-item Big Five personality inventory.
// 2 items per facet × 30 facets = 60 items.
//
// Source: Maples-Keller, J. L., Williamson, R. L., Sleep, C. E.,
//   Carter, N. T., Campbell, W. K., & Miller, J. D. (2019).
//   Using item response theory to develop a 60-item representation
//   of the NEO PI-R using the International Personality Item Pool.
//   Journal of Personality Assessment, 101(1), 4-15.
//   DOI: 10.1080/00223891.2017.1381968
//
// Items selected from IPIP-NEO-300 (Goldberg, 1999) via Graded
// Response Model with MML estimation. Convergent validity with
// NEO PI-R: rICC = .96 (Maples-Keller et al., 2019).
//
// License: PUBLIC DOMAIN — IPIP items are free for any use
//   including commercial (ipip.ori.org/newPermission.htm).
//
// Item numbering: Sequential 1-60 (this instrument's canonical order).
// 51 items have translations from Johnson (2014) IPIP-NEO-120 pool.
// 9 items translated by Deep Dive research team following IPIP style.
//
// DO NOT MODIFY item text — these are published instrument items.
// ============================================================

import type { IPIPItem } from '@/lib/types/questionnaire';
import type { BigFiveDimension } from '@/lib/types/dimensions';

// ============================================================
// Complete 60 Items (canonical Maples-Keller order by domain)
// ============================================================
// Items 1-12: Neuroticism (N)
// Items 13-24: Extraversion (E)
// Items 25-36: Openness (O)
// Items 37-48: Agreeableness (A)
// Items 49-60: Conscientiousness (C)

export const IPIP_60_ITEMS: IPIPItem[] = [
  // -- Neuroticism (12 items: 8 positive, 4 reversed) ------
  { id: 1, text_en: 'Worry about things.', text_zh: '担心很多事情。', text_nl: 'Maak me zorgen over dingen.', text_de: 'Mache mir Sorgen über Dinge.', text_fr: 'Me fais du souci pour des choses.', text_es: 'Me preocupo por las cosas.', text_pt: 'Preocupo-me com as coisas.', text_it: 'Mi preoccupo per le cose.', text_ru: 'Беспокоюсь о многом.', text_ja: '物事を心配する。', text_ko: '여러 가지 일에 대해 걱정한다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  { id: 2, text_en: 'Get stressed out easily.', text_zh: '容易感到压力。', text_nl: 'Raak snel gestrest.', text_de: 'Bin leicht gestresst.', text_fr: 'Me stresse facilement.', text_es: 'Me estreso fácilmente.', text_pt: 'Fico estressado/a facilmente.', text_it: 'Mi stresso facilmente.', text_ru: 'Легко испытываю стресс.', text_ja: 'すぐにストレスを感じる。', text_ko: '쉽게 스트레스를 받는다.', domain: 'neuroticism', facet: 'N1_Anxiety', isReversed: false },
  { id: 3, text_en: 'Get angry easily.', text_zh: '容易生气。', text_nl: 'Word snel boos.', text_de: 'Werde leicht wütend.', text_fr: 'Me mets facilement en colère.', text_es: 'Me enfado fácilmente.', text_pt: 'Fico com raiva facilmente.', text_it: 'Mi arrabbio facilmente.', text_ru: 'Легко злюсь.', text_ja: 'すぐに怒る。', text_ko: '쉽게 화가 난다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: false },
  { id: 4, text_en: 'Lose my temper.', text_zh: '容易发脾气。', text_nl: 'Verlies mijn geduld.', text_de: 'Verliere die Beherrschung.', text_fr: 'Perds mon sang-froid.', text_es: 'Pierdo los estribos.', text_pt: 'Perco a calma.', text_it: 'Perdo le staffe.', text_ru: 'Теряю самообладание.', text_ja: 'かっとなる。', text_ko: '화를 참지 못한다.', domain: 'neuroticism', facet: 'N2_Anger', isReversed: false },
  { id: 5, text_en: 'Often feel blue.', text_zh: '经常感到忧郁。', text_nl: 'Voel me vaak neerslachtig.', text_de: 'Fühle mich oft niedergeschlagen.', text_fr: 'Me sens souvent triste.', text_es: 'A menudo me siento triste.', text_pt: 'Frequentemente me sinto triste.', text_it: 'Mi sento spesso giù.', text_ru: 'Часто чувствую тоску.', text_ja: 'よく憂鬱になる。', text_ko: '자주 우울함을 느낀다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: false },
  { id: 6, text_en: 'Dislike myself.', text_zh: '不喜欢自己。', text_nl: 'Heb een hekel aan mezelf.', text_de: 'Mag mich selbst nicht.', text_fr: 'Ne m\'aime pas.', text_es: 'No me gusto a mí mismo/a.', text_pt: 'Não gosto de mim mesmo/a.', text_it: 'Non mi piaccio.', text_ru: 'Не нравлюсь себе.', text_ja: '自分が嫌いだ。', text_ko: '나 자신이 싫다.', domain: 'neuroticism', facet: 'N3_Depression', isReversed: false },
  { id: 7, text_en: 'Find it difficult to approach others.', text_zh: '觉得很难接近别人。', text_nl: 'Vind het moeilijk om anderen te benaderen.', text_de: 'Finde es schwierig, auf andere zuzugehen.', text_fr: 'Trouve difficile d\'approcher les autres.', text_es: 'Me resulta difícil acercarme a los demás.', text_pt: 'Acho difícil me aproximar dos outros.', text_it: 'Trovo difficile avvicinare gli altri.', text_ru: 'Мне трудно подходить к другим людям.', text_ja: '人に近づくのが難しいと感じる。', text_ko: '다른 사람에게 다가가기 어렵다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: false },
  { id: 8, text_en: 'Am easily intimidated.', text_zh: '容易被吓倒。', text_nl: 'Laat me gemakkelijk intimideren.', text_de: 'Lasse mich leicht einschüchtern.', text_fr: 'Suis facilement intimidé(e).', text_es: 'Me dejo intimidar fácilmente.', text_pt: 'Sou facilmente intimidado/a.', text_it: 'Mi lascio facilmente intimidire.', text_ru: 'Легко поддаюсь запугиванию.', text_ja: '簡単に威圧される。', text_ko: '쉽게 위축된다.', domain: 'neuroticism', facet: 'N4_Self-Consciousness', isReversed: false },
  { id: 9, text_en: 'Rarely overindulge.', text_zh: '很少过度放纵。', text_nl: 'Geef me zelden over aan overdaad.', text_de: 'Neige selten zu Übertreibung.', text_fr: 'M\'adonne rarement aux excès.', text_es: 'Rara vez me excedo.', text_pt: 'Raramente me excedo.', text_it: 'Raramente mi lascio andare.', text_ru: 'Редко злоупотребляю чем-либо.', text_ja: '過度に耽溺することはめったにない。', text_ko: '과도하게 탐닉하는 일이 거의 없다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: true },
  { id: 10, text_en: 'Am able to control my cravings.', text_zh: '能够控制自己的欲望。', text_nl: 'Ben in staat mijn verlangens te beheersen.', text_de: 'Kann meine Gelüste kontrollieren.', text_fr: 'Suis capable de contrôler mes envies.', text_es: 'Soy capaz de controlar mis antojos.', text_pt: 'Consigo controlar meus desejos.', text_it: 'Sono in grado di controllare i miei desideri.', text_ru: 'Способен контролировать свои желания.', text_ja: '欲求をコントロールできる。', text_ko: '욕구를 통제할 수 있다.', domain: 'neuroticism', facet: 'N5_Immoderation', isReversed: true },
  { id: 11, text_en: 'Remain calm under pressure.', text_zh: '在压力下保持冷静。', text_nl: 'Blijf kalm onder druk.', text_de: 'Bleibe unter Druck ruhig.', text_fr: 'Reste calme sous pression.', text_es: 'Mantengo la calma bajo presión.', text_pt: 'Mantenho a calma sob pressão.', text_it: 'Resto calmo/a sotto pressione.', text_ru: 'Сохраняю спокойствие под давлением.', text_ja: 'プレッシャーの中でも冷静でいられる。', text_ko: '압박감 속에서도 침착함을 유지한다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: true },
  { id: 12, text_en: 'Am calm even in tense situations.', text_zh: '即使在紧张的情况下也能保持冷静。', text_nl: 'Blijf kalm, zelfs in gespannen situaties.', text_de: 'Bleibe auch in angespannten Situationen ruhig.', text_fr: 'Reste calme même dans les situations tendues.', text_es: 'Me mantengo tranquilo/a incluso en situaciones tensas.', text_pt: 'Mantenho a calma mesmo em situações tensas.', text_it: 'Resto calmo/a anche in situazioni tese.', text_ru: 'Сохраняю спокойствие даже в напряжённых ситуациях.', text_ja: '緊迫した状況でも冷静でいられる。', text_ko: '긴장된 상황에서도 침착함을 유지한다.', domain: 'neuroticism', facet: 'N6_Vulnerability', isReversed: true },

  // -- Extraversion (12 items: 11 positive, 1 reversed) -----
  { id: 13, text_en: 'Make friends easily.', text_zh: '容易交到朋友。', text_nl: 'Maak gemakkelijk vrienden.', text_de: 'Schließe leicht Freundschaften.', text_fr: 'Me fais facilement des amis.', text_es: 'Hago amigos fácilmente.', text_pt: 'Faço amigos facilmente.', text_it: 'Faccio amicizia facilmente.', text_ru: 'Легко завожу друзей.', text_ja: '友達を簡単に作る。', text_ko: '쉽게 친구를 사귄다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: false },
  { id: 14, text_en: 'Act comfortably with others.', text_zh: '和他人相处时表现自在。', text_nl: 'Gedraag me ontspannen bij anderen.', text_de: 'Verhalte mich ungezwungen mit anderen.', text_fr: 'Me comporte à l\'aise avec les autres.', text_es: 'Me comporto cómodamente con los demás.', text_pt: 'Me comporto confortavelmente com os outros.', text_it: 'Mi comporto a mio agio con gli altri.', text_ru: 'Веду себя непринуждённо с другими.', text_ja: '他人と気楽にふるまえる。', text_ko: '다른 사람들과 편안하게 행동한다.', domain: 'extraversion', facet: 'E1_Friendliness', isReversed: false },
  { id: 15, text_en: 'Love large parties.', text_zh: '喜欢大型聚会。', text_nl: 'Hou van grote feesten.', text_de: 'Liebe große Partys.', text_fr: 'Adore les grandes fêtes.', text_es: 'Me encantan las grandes fiestas.', text_pt: 'Adoro grandes festas.', text_it: 'Adoro le grandi feste.', text_ru: 'Люблю большие вечеринки.', text_ja: '大きなパーティーが好きだ。', text_ko: '큰 파티를 좋아한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: false },
  { id: 16, text_en: 'Avoid crowds.', text_zh: '回避人群。', text_nl: 'Vermijd menigten.', text_de: 'Vermeide Menschenmengen.', text_fr: 'Évite les foules.', text_es: 'Evito las multitudes.', text_pt: 'Evito multidões.', text_it: 'Evito la folla.', text_ru: 'Избегаю толпы.', text_ja: '人混みを避ける。', text_ko: '인파를 피한다.', domain: 'extraversion', facet: 'E2_Gregariousness', isReversed: true },
  { id: 17, text_en: 'Take charge.', text_zh: '承担领导责任。', text_nl: 'Neem de leiding.', text_de: 'Übernehme die Führung.', text_fr: 'Prends les choses en main.', text_es: 'Tomo el mando.', text_pt: 'Assumo o comando.', text_it: 'Prendo il comando.', text_ru: 'Беру на себя ответственность.', text_ja: '主導権を取る。', text_ko: '주도권을 잡는다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: false },
  { id: 18, text_en: 'Try to lead others.', text_zh: '试图领导他人。', text_nl: 'Probeer anderen te leiden.', text_de: 'Versuche, andere zu führen.', text_fr: 'Essaie de diriger les autres.', text_es: 'Intento liderar a los demás.', text_pt: 'Tento liderar os outros.', text_it: 'Cerco di guidare gli altri.', text_ru: 'Стараюсь вести за собой других.', text_ja: '他の人をリードしようとする。', text_ko: '다른 사람들을 이끌려고 한다.', domain: 'extraversion', facet: 'E3_Assertiveness', isReversed: false },
  { id: 19, text_en: 'Am always busy.', text_zh: '总是很忙。', text_nl: 'Ben altijd druk.', text_de: 'Bin immer beschäftigt.', text_fr: 'Suis toujours occupé(e).', text_es: 'Siempre estoy ocupado/a.', text_pt: 'Estou sempre ocupado/a.', text_it: 'Sono sempre impegnato/a.', text_ru: 'Всегда занят(а).', text_ja: 'いつも忙しくしている。', text_ko: '항상 바쁘다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: false },
  { id: 20, text_en: 'Am always on the go.', text_zh: '总是在行动。', text_nl: 'Ben altijd in de weer.', text_de: 'Bin immer unterwegs.', text_fr: 'Suis toujours en mouvement.', text_es: 'Siempre estoy en movimiento.', text_pt: 'Estou sempre em movimento.', text_it: 'Sono sempre in movimento.', text_ru: 'Всегда в движении.', text_ja: 'いつも動き回っている。', text_ko: '항상 바쁘게 움직인다.', domain: 'extraversion', facet: 'E4_Activity_Level', isReversed: false },
  { id: 21, text_en: 'Love excitement.', text_zh: '喜爱刺激。', text_nl: 'Hou van opwinding.', text_de: 'Liebe Aufregung.', text_fr: 'Adore l\'excitation.', text_es: 'Me encanta la emoción.', text_pt: 'Adoro emoção.', text_it: 'Adoro l\'eccitazione.', text_ru: 'Люблю острые ощущения.', text_ja: '刺激が大好きだ。', text_ko: '흥분되는 것을 좋아한다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  { id: 22, text_en: 'Seek adventure.', text_zh: '寻求冒险。', text_nl: 'Zoek avontuur.', text_de: 'Suche Abenteuer.', text_fr: 'Cherche l\'aventure.', text_es: 'Busco aventuras.', text_pt: 'Busco aventura.', text_it: 'Cerco avventure.', text_ru: 'Ищу приключения.', text_ja: '冒険を求める。', text_ko: '모험을 추구한다.', domain: 'extraversion', facet: 'E5_Excitement-Seeking', isReversed: false },
  { id: 23, text_en: 'Have a lot of fun.', text_zh: '拥有很多乐趣。', text_nl: 'Heb veel plezier.', text_de: 'Habe viel Spaß.', text_fr: 'M\'amuse beaucoup.', text_es: 'Me divierto mucho.', text_pt: 'Me divirto muito.', text_it: 'Mi diverto molto.', text_ru: 'Хорошо провожу время.', text_ja: 'たくさん楽しむ。', text_ko: '많이 즐긴다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },
  { id: 24, text_en: 'Love life.', text_zh: '热爱生活。', text_nl: 'Hou van het leven.', text_de: 'Liebe das Leben.', text_fr: 'Aime la vie.', text_es: 'Amo la vida.', text_pt: 'Amo a vida.', text_it: 'Amo la vita.', text_ru: 'Люблю жизнь.', text_ja: '人生を愛している。', text_ko: '삶을 사랑한다.', domain: 'extraversion', facet: 'E6_Cheerfulness', isReversed: false },

  // -- Openness (12 items: 6 positive, 6 reversed) ---------
  { id: 25, text_en: 'Have a vivid imagination.', text_zh: '拥有丰富的想象力。', text_nl: 'Heb een levendige verbeelding.', text_de: 'Habe eine lebhafte Fantasie.', text_fr: 'Ai une imagination vive.', text_es: 'Tengo una imaginación vívida.', text_pt: 'Tenho uma imaginação vívida.', text_it: 'Ho una vivida immaginazione.', text_ru: 'Обладаю живым воображением.', text_ja: '豊かな想像力を持っている。', text_ko: '생생한 상상력을 가지고 있다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  { id: 26, text_en: 'Love to daydream.', text_zh: '喜欢白日做梦。', text_nl: 'Dagdroom graag.', text_de: 'Tagträume gerne.', text_fr: 'Aime rêvasser.', text_es: 'Me encanta soñar despierto/a.', text_pt: 'Adoro sonhar acordado/a.', text_it: 'Amo sognare a occhi aperti.', text_ru: 'Люблю мечтать.', text_ja: '白昼夢を見るのが好きだ。', text_ko: '공상하는 것을 좋아한다.', domain: 'openness', facet: 'O1_Imagination', isReversed: false },
  { id: 27, text_en: 'Believe in the importance of art.', text_zh: '相信艺术的重要性。', text_nl: 'Geloof in het belang van kunst.', text_de: 'Glaube an die Bedeutung von Kunst.', text_fr: 'Crois en l\'importance de l\'art.', text_es: 'Creo en la importancia del arte.', text_pt: 'Acredito na importância da arte.', text_it: 'Credo nell\'importanza dell\'arte.', text_ru: 'Верю в важность искусства.', text_ja: '芸術の重要性を信じている。', text_ko: '예술의 중요성을 믿는다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: false },
  { id: 28, text_en: 'Do not like art.', text_zh: '不喜欢艺术。', text_nl: 'Hou niet van kunst.', text_de: 'Mag keine Kunst.', text_fr: 'N\'aime pas l\'art.', text_es: 'No me gusta el arte.', text_pt: 'Não gosto de arte.', text_it: 'Non mi piace l\'arte.', text_ru: 'Не люблю искусство.', text_ja: '芸術が好きではない。', text_ko: '예술을 좋아하지 않는다.', domain: 'openness', facet: 'O2_Artistic_Interests', isReversed: true },
  { id: 29, text_en: 'Experience my emotions intensely.', text_zh: '强烈地体验自己的情感。', text_nl: 'Ervaar mijn emoties intens.', text_de: 'Erlebe meine Emotionen intensiv.', text_fr: 'Vis mes émotions intensément.', text_es: 'Experimento mis emociones intensamente.', text_pt: 'Experimento minhas emoções intensamente.', text_it: 'Vivo le mie emozioni intensamente.', text_ru: 'Интенсивно переживаю свои эмоции.', text_ja: '感情を強烈に体験する。', text_ko: '감정을 강렬하게 경험한다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: false },
  { id: 30, text_en: 'Am not easily affected by my emotions.', text_zh: '不太容易受情绪影响。', text_nl: 'Word niet gemakkelijk beïnvloed door mijn emoties.', text_de: 'Lasse mich nicht leicht von meinen Emotionen beeinflussen.', text_fr: 'Ne suis pas facilement affecté(e) par mes émotions.', text_es: 'No me afectan fácilmente mis emociones.', text_pt: 'Não sou facilmente afetado/a pelas minhas emoções.', text_it: 'Non sono facilmente influenzato/a dalle mie emozioni.', text_ru: 'Не легко поддаюсь своим эмоциям.', text_ja: '自分の感情にあまり左右されない。', text_ko: '감정에 쉽게 영향받지 않는다.', domain: 'openness', facet: 'O3_Emotionality', isReversed: true },
  { id: 31, text_en: 'Prefer to stick with things that I know.', text_zh: '更喜欢坚持自己熟悉的事物。', text_nl: 'Houd me liever bij dingen die ik ken.', text_de: 'Bleibe lieber bei Dingen, die ich kenne.', text_fr: 'Préfère m\'en tenir à ce que je connais.', text_es: 'Prefiero quedarme con lo que conozco.', text_pt: 'Prefiro ficar com o que conheço.', text_it: 'Preferisco attenermi a ciò che conosco.', text_ru: 'Предпочитаю придерживаться того, что знаю.', text_ja: '知っていることにこだわる方が好きだ。', text_ko: '아는 것에 머무르는 것을 선호한다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: true },
  { id: 32, text_en: 'Don\'t like the idea of change.', text_zh: '不喜欢改变的想法。', text_nl: 'Hou niet van het idee van verandering.', text_de: 'Mag die Vorstellung von Veränderung nicht.', text_fr: 'N\'aime pas l\'idée de changement.', text_es: 'No me gusta la idea de cambiar.', text_pt: 'Não gosto da ideia de mudança.', text_it: 'Non mi piace l\'idea di cambiare.', text_ru: 'Не люблю саму идею перемен.', text_ja: '変化という考え自体が好きではない。', text_ko: '변화라는 생각 자체를 좋아하지 않는다.', domain: 'openness', facet: 'O4_Adventurousness', isReversed: true },
  { id: 33, text_en: 'Avoid philosophical discussions.', text_zh: '回避哲学讨论。', text_nl: 'Vermijd filosofische discussies.', text_de: 'Vermeide philosophische Diskussionen.', text_fr: 'Évite les discussions philosophiques.', text_es: 'Evito las discusiones filosóficas.', text_pt: 'Evito discussões filosóficas.', text_it: 'Evito le discussioni filosofiche.', text_ru: 'Избегаю философских дискуссий.', text_ja: '哲学的な議論を避ける。', text_ko: '철학적 토론을 피한다.', domain: 'openness', facet: 'O5_Intellect', isReversed: true },
  { id: 34, text_en: 'Am not interested in theoretical discussions.', text_zh: '对理论讨论不感兴趣。', text_nl: 'Ben niet geïnteresseerd in theoretische discussies.', text_de: 'Bin nicht an theoretischen Diskussionen interessiert.', text_fr: 'Ne m\'intéresse pas aux discussions théoriques.', text_es: 'No me interesan las discusiones teóricas.', text_pt: 'Não tenho interesse em discussões teóricas.', text_it: 'Non sono interessato/a alle discussioni teoriche.', text_ru: 'Не интересуюсь теоретическими дискуссиями.', text_ja: '理論的な議論に興味がない。', text_ko: '이론적 토론에 관심이 없다.', domain: 'openness', facet: 'O5_Intellect', isReversed: true },
  { id: 35, text_en: 'Tend to vote for liberal political candidates.', text_zh: '倾向于投票给自由派政治候选人。', text_nl: 'Stem doorgaans op liberale politieke kandidaten.', text_de: 'Neige dazu, liberale politische Kandidaten zu wählen.', text_fr: 'Ai tendance à voter pour des candidats politiques libéraux.', text_es: 'Tiendo a votar por candidatos políticos liberales.', text_pt: 'Tendo a votar em candidatos políticos liberais.', text_it: 'Tendo a votare per candidati politici liberali.', text_ru: 'Склонен голосовать за либеральных политических кандидатов.', text_ja: 'リベラルな政治候補者に投票する傾向がある。', text_ko: '진보적인 정치 후보에게 투표하는 경향이 있다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: false },
  { id: 36, text_en: 'Believe in one true religion.', text_zh: '相信只有一种真正的宗教。', text_nl: 'Geloof in één ware religie.', text_de: 'Glaube an eine einzig wahre Religion.', text_fr: 'Crois en une seule vraie religion.', text_es: 'Creo en una sola religión verdadera.', text_pt: 'Acredito em uma única religião verdadeira.', text_it: 'Credo in un\'unica vera religione.', text_ru: 'Верю в единственно истинную религию.', text_ja: '唯一の真の宗教があると信じている。', text_ko: '유일한 참된 종교가 있다고 믿는다.', domain: 'openness', facet: 'O6_Liberalism', isReversed: true },

  // -- Agreeableness (12 items: 6 positive, 6 reversed) ----
  { id: 37, text_en: 'Trust others.', text_zh: '信任他人。', text_nl: 'Vertrouw anderen.', text_de: 'Vertraue anderen.', text_fr: 'Fais confiance aux autres.', text_es: 'Confío en los demás.', text_pt: 'Confio nos outros.', text_it: 'Mi fido degli altri.', text_ru: 'Доверяю другим.', text_ja: '他人を信頼する。', text_ko: '다른 사람들을 신뢰한다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: false },
  { id: 38, text_en: 'Believe that others have good intentions.', text_zh: '相信他人是善意的。', text_nl: 'Geloof dat anderen goede bedoelingen hebben.', text_de: 'Glaube, dass andere gute Absichten haben.', text_fr: 'Crois que les autres ont de bonnes intentions.', text_es: 'Creo que los demás tienen buenas intenciones.', text_pt: 'Acredito que os outros têm boas intenções.', text_it: 'Credo che gli altri abbiano buone intenzioni.', text_ru: 'Верю, что у других добрые намерения.', text_ja: '他人には善意があると信じている。', text_ko: '다른 사람들이 좋은 의도를 가지고 있다고 믿는다.', domain: 'agreeableness', facet: 'A1_Trust', isReversed: false },
  { id: 39, text_en: 'Cheat to get ahead.', text_zh: '通过欺骗来获得成功。', text_nl: 'Sjoemel om vooruit te komen.', text_de: 'Betrüge, um voranzukommen.', text_fr: 'Triche pour avancer.', text_es: 'Hago trampa para salir adelante.', text_pt: 'Trapaceio para progredir.', text_it: 'Imbroglio per andare avanti.', text_ru: 'Обманываю, чтобы продвинуться.', text_ja: '出世するためにずるをする。', text_ko: '앞서 나가기 위해 속임수를 쓴다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  { id: 40, text_en: 'Take advantage of others.', text_zh: '占别人的便宜。', text_nl: 'Maak misbruik van anderen.', text_de: 'Nutze andere aus.', text_fr: 'Profite des autres.', text_es: 'Me aprovecho de los demás.', text_pt: 'Tiro vantagem dos outros.', text_it: 'Approfitto degli altri.', text_ru: 'Использую других в своих интересах.', text_ja: '他人を利用する。', text_ko: '다른 사람을 이용한다.', domain: 'agreeableness', facet: 'A2_Morality', isReversed: true },
  { id: 41, text_en: 'Love to help others.', text_zh: '喜欢帮助别人。', text_nl: 'Help anderen graag.', text_de: 'Helfe gerne anderen.', text_fr: 'Aime aider les autres.', text_es: 'Me encanta ayudar a los demás.', text_pt: 'Adoro ajudar os outros.', text_it: 'Amo aiutare gli altri.', text_ru: 'Люблю помогать другим.', text_ja: '人を助けるのが好きだ。', text_ko: '다른 사람을 돕는 것을 좋아한다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: false },
  { id: 42, text_en: 'Am concerned about others.', text_zh: '关心他人。', text_nl: 'Maak me zorgen om anderen.', text_de: 'Sorge mich um andere.', text_fr: 'Me soucie des autres.', text_es: 'Me preocupo por los demás.', text_pt: 'Preocupo-me com os outros.', text_it: 'Mi preoccupo per gli altri.', text_ru: 'Забочусь о других.', text_ja: '他人のことを心配する。', text_ko: '다른 사람들을 걱정한다.', domain: 'agreeableness', facet: 'A3_Altruism', isReversed: false },
  { id: 43, text_en: 'Insult people.', text_zh: '侮辱他人。', text_nl: 'Beledig mensen.', text_de: 'Beleidige Menschen.', text_fr: 'Insulte les gens.', text_es: 'Insulto a la gente.', text_pt: 'Insulto as pessoas.', text_it: 'Insulto le persone.', text_ru: 'Оскорбляю людей.', text_ja: '人を侮辱する。', text_ko: '사람들을 모욕한다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  { id: 44, text_en: 'Get back at others.', text_zh: '报复他人。', text_nl: 'Neem wraak op anderen.', text_de: 'Zahle es anderen heim.', text_fr: 'Me venge des autres.', text_es: 'Me desquito con los demás.', text_pt: 'Me vingo dos outros.', text_it: 'Mi vendico con gli altri.', text_ru: 'Мщу другим.', text_ja: '人に仕返しをする。', text_ko: '다른 사람에게 복수한다.', domain: 'agreeableness', facet: 'A4_Cooperation', isReversed: true },
  { id: 45, text_en: 'Believe that I am better than others.', text_zh: '相信自己比别人好。', text_nl: 'Geloof dat ik beter ben dan anderen.', text_de: 'Glaube, dass ich besser bin als andere.', text_fr: 'Crois que je suis meilleur(e) que les autres.', text_es: 'Creo que soy mejor que los demás.', text_pt: 'Acredito que sou melhor que os outros.', text_it: 'Credo di essere migliore degli altri.', text_ru: 'Считаю себя лучше других.', text_ja: '自分は他の人より優れていると思う。', text_ko: '나는 다른 사람보다 낫다고 믿는다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  { id: 46, text_en: 'Think highly of myself.', text_zh: '对自己评价很高。', text_nl: 'Heb een hoge dunk van mezelf.', text_de: 'Halte viel von mir.', text_fr: 'Ai une haute opinion de moi-même.', text_es: 'Tengo un alto concepto de mí mismo/a.', text_pt: 'Penso muito bem de mim mesmo/a.', text_it: 'Ho un\'alta opinione di me stesso/a.', text_ru: 'Высоко ценю себя.', text_ja: '自分を高く評価している。', text_ko: '스스로를 높이 평가한다.', domain: 'agreeableness', facet: 'A5_Modesty', isReversed: true },
  { id: 47, text_en: 'Sympathize with the homeless.', text_zh: '同情无家可归的人。', text_nl: 'Sympathiseer met daklozen.', text_de: 'Habe Mitgefühl mit Obdachlosen.', text_fr: 'Compatis avec les sans-abri.', text_es: 'Simpatizo con las personas sin hogar.', text_pt: 'Simpatizo com os sem-teto.', text_it: 'Simpatia per i senzatetto.', text_ru: 'Сочувствую бездомным.', text_ja: 'ホームレスの人々に同情する。', text_ko: '노숙자들에게 동정심을 느낀다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: false },
  { id: 48, text_en: 'Feel sympathy for those who are worse off than myself.', text_zh: '同情比自己更不幸的人。', text_nl: 'Voel sympathie voor degenen die het slechter hebben dan ik.', text_de: 'Empfinde Mitgefühl für diejenigen, denen es schlechter geht als mir.', text_fr: 'Éprouve de la sympathie pour ceux qui sont plus mal lotis que moi.', text_es: 'Siento simpatía por quienes están peor que yo.', text_pt: 'Sinto compaixão por aqueles que estão em pior situação que eu.', text_it: 'Provo simpatia per chi sta peggio di me.', text_ru: 'Сочувствую тем, кому хуже, чем мне.', text_ja: '自分より恵まれない人に同情する。', text_ko: '나보다 어려운 처지에 있는 사람들에게 동정심을 느낀다.', domain: 'agreeableness', facet: 'A6_Sympathy', isReversed: false },

  // -- Conscientiousness (12 items: 7 positive, 5 reversed) -
  { id: 49, text_en: 'Handle tasks smoothly.', text_zh: '顺利处理任务。', text_nl: 'Handel taken soepel af.', text_de: 'Erledige Aufgaben reibungslos.', text_fr: 'Gère les tâches en douceur.', text_es: 'Manejo las tareas sin problemas.', text_pt: 'Lido com tarefas sem problemas.', text_it: 'Gestisco i compiti senza intoppi.', text_ru: 'Справляюсь с задачами без затруднений.', text_ja: 'タスクをスムーズにこなす。', text_ko: '과제를 원활하게 처리한다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  { id: 50, text_en: 'Know how to get things done.', text_zh: '知道如何把事情做好。', text_nl: 'Weet hoe ik dingen gedaan krijg.', text_de: 'Weiß, wie man Dinge erledigt.', text_fr: 'Sais comment accomplir les choses.', text_es: 'Sé cómo hacer las cosas.', text_pt: 'Sei como fazer as coisas.', text_it: 'So come portare a termine le cose.', text_ru: 'Знаю, как добиться результата.', text_ja: '物事をやり遂げる方法を知っている。', text_ko: '일을 처리하는 방법을 안다.', domain: 'conscientiousness', facet: 'C1_Self-Efficacy', isReversed: false },
  { id: 51, text_en: 'Like order.', text_zh: '喜欢秩序。', text_nl: 'Hou van orde.', text_de: 'Mag Ordnung.', text_fr: 'Aime l\'ordre.', text_es: 'Me gusta el orden.', text_pt: 'Gosto de ordem.', text_it: 'Mi piace l\'ordine.', text_ru: 'Люблю порядок.', text_ja: '秩序を好む。', text_ko: '질서를 좋아한다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: false },
  { id: 52, text_en: 'Leave a mess in my room.', text_zh: '房间很乱。', text_nl: 'Laat een rommel achter in mijn kamer.', text_de: 'Hinterlasse ein Durcheinander in meinem Zimmer.', text_fr: 'Laisse du désordre dans ma chambre.', text_es: 'Dejo un desorden en mi habitación.', text_pt: 'Deixo bagunça no meu quarto.', text_it: 'Lascio disordine nella mia stanza.', text_ru: 'Оставляю беспорядок в своей комнате.', text_ja: '部屋を散らかしたままにする。', text_ko: '방을 어지럽혀 놓는다.', domain: 'conscientiousness', facet: 'C2_Orderliness', isReversed: true },
  { id: 53, text_en: 'Tell the truth.', text_zh: '说实话。', text_nl: 'Vertel de waarheid.', text_de: 'Sage die Wahrheit.', text_fr: 'Dis la vérité.', text_es: 'Digo la verdad.', text_pt: 'Digo a verdade.', text_it: 'Dico la verità.', text_ru: 'Говорю правду.', text_ja: '真実を話す。', text_ko: '진실을 말한다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: false },
  { id: 54, text_en: 'Break my promises.', text_zh: '违背承诺。', text_nl: 'Verbreek mijn beloften.', text_de: 'Breche meine Versprechen.', text_fr: 'Ne tiens pas mes promesses.', text_es: 'Rompo mis promesas.', text_pt: 'Quebro minhas promessas.', text_it: 'Non mantengo le mie promesse.', text_ru: 'Нарушаю свои обещания.', text_ja: '約束を破る。', text_ko: '약속을 어긴다.', domain: 'conscientiousness', facet: 'C3_Dutifulness', isReversed: true },
  { id: 55, text_en: 'Work hard.', text_zh: '努力工作。', text_nl: 'Werk hard.', text_de: 'Arbeite hart.', text_fr: 'Travaille dur.', text_es: 'Trabajo duro.', text_pt: 'Trabalho duro.', text_it: 'Lavoro sodo.', text_ru: 'Усердно работаю.', text_ja: '一生懸命働く。', text_ko: '열심히 일한다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: false },
  { id: 56, text_en: 'Set high standards for myself and others.', text_zh: '对自己和他人都设定高标准。', text_nl: 'Stel hoge normen voor mezelf en anderen.', text_de: 'Setze hohe Maßstäbe für mich und andere.', text_fr: 'Fixe des standards élevés pour moi et les autres.', text_es: 'Establezco altos estándares para mí y para los demás.', text_pt: 'Estabeleço padrões altos para mim e para os outros.', text_it: 'Fisso standard elevati per me e per gli altri.', text_ru: 'Устанавливаю высокие стандарты для себя и других.', text_ja: '自分にも他人にも高い基準を設ける。', text_ko: '나 자신과 다른 사람 모두에게 높은 기준을 세운다.', domain: 'conscientiousness', facet: 'C4_Achievement-Striving', isReversed: false },
  { id: 57, text_en: 'Carry out my plans.', text_zh: '执行自己的计划。', text_nl: 'Voer mijn plannen uit.', text_de: 'Führe meine Pläne aus.', text_fr: 'Réalise mes projets.', text_es: 'Llevo a cabo mis planes.', text_pt: 'Executo meus planos.', text_it: 'Porto avanti i miei piani.', text_ru: 'Выполняю свои планы.', text_ja: '計画を実行する。', text_ko: '계획을 실행한다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: false },
  { id: 58, text_en: 'Have difficulty starting tasks.', text_zh: '难以开始任务。', text_nl: 'Heb moeite om aan taken te beginnen.', text_de: 'Habe Schwierigkeiten, Aufgaben zu beginnen.', text_fr: 'Ai du mal à commencer les tâches.', text_es: 'Tengo dificultad para empezar tareas.', text_pt: 'Tenho dificuldade em começar tarefas.', text_it: 'Ho difficoltà ad iniziare i compiti.', text_ru: 'С трудом берусь за задачи.', text_ja: 'タスクを始めるのが難しい。', text_ko: '과제를 시작하기 어렵다.', domain: 'conscientiousness', facet: 'C5_Self-Discipline', isReversed: true },
  { id: 59, text_en: 'Make rash decisions.', text_zh: '做出草率的决定。', text_nl: 'Neem overhaaste beslissingen.', text_de: 'Treffe voreilige Entscheidungen.', text_fr: 'Prends des décisions hâtives.', text_es: 'Tomo decisiones precipitadas.', text_pt: 'Tomo decisões precipitadas.', text_it: 'Prendo decisioni avventate.', text_ru: 'Принимаю поспешные решения.', text_ja: '軽率な決断をする。', text_ko: '성급한 결정을 내린다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },
  { id: 60, text_en: 'Act without thinking.', text_zh: '不经思考就行动。', text_nl: 'Handel zonder na te denken.', text_de: 'Handle, ohne nachzudenken.', text_fr: 'Agis sans réfléchir.', text_es: 'Actúo sin pensar.', text_pt: 'Ajo sem pensar.', text_it: 'Agisco senza pensare.', text_ru: 'Действую не думая.', text_ja: '考えずに行動する。', text_ko: '생각 없이 행동한다.', domain: 'conscientiousness', facet: 'C6_Cautiousness', isReversed: true },
];

// ============================================================
// Derived Exports (auto-built from IPIP_60_ITEMS)
// ============================================================

export const IPIP_60_ITEM_IDS: number[] = IPIP_60_ITEMS.map(i => i.id);

// ============================================================
// Domain -> Facet names (same structure as IPIP-NEO-120)
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

// ============================================================
// Facet -> [Item ID, Item ID] Map
// ============================================================

export const IPIP_60_FACET_ITEM_MAP: Record<string, number[]> = {};

for (const domain of Object.values(DOMAIN_FACETS)) {
  for (const facetName of domain) {
    IPIP_60_FACET_ITEM_MAP[facetName] = IPIP_60_ITEMS
      .filter(i => i.facet === facetName)
      .map(i => i.id);
  }
}

// ============================================================
// Presentation Order — UX-optimized display sequence (60 items)
// ============================================================
// Design principles:
//   1. No two adjacent items from same domain
//   2. Positive/reversed keying alternated where possible
//   3. Warm start (competence + positive affect), warm close
//   4. Same-facet items separated by >= 15 positions
//   5. Negative N-domain items spread across sequence
//
// This order is for DISPLAY only. Scoring uses item IDs.

export const IPIP_60_PRESENTATION_ORDER: number[] = [
  // Block 1 (items 1-20): warm start
  49, 24, 11, 25, 38, 52, 1, 17, 31, 40,
  57, 20, 12, 27, 41, 50, 14, 6, 26, 39,
  // Block 2 (items 21-40): middle section
  53, 3, 13, 30, 48, 55, 22, 10, 43, 35,
  51, 18, 2, 34, 47, 56, 19, 9, 29, 44,
  // Block 3 (items 41-60): close
  59, 7, 45, 16, 33, 54, 21, 8, 42, 28,
  58, 15, 4, 36, 46, 60, 23, 5, 37, 32,
];

// ============================================================
// Item ID -> Domain letter lookup
// ============================================================

export const IPIP_60_ITEM_DOMAIN_MAP: Record<number, string> = {};
for (const item of IPIP_60_ITEMS) {
  IPIP_60_ITEM_DOMAIN_MAP[item.id] = item.domain.charAt(0).toUpperCase();
}
