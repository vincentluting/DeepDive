// ============================================================
// Theme Extraction — extracts coaching themes from conversation
//
// Called after coaching sessions are saved. Identifies key topics
// the user discussed and upserts them into CoachingTheme table.
// Pure keyword/pattern matching — 0 LLM calls.
// ============================================================

import { upsertTheme } from "@/lib/db/coaching-themes";
import type { CoachingTheme } from "@/lib/db/coaching-themes";

// ── Theme detection patterns ─────
// Each pattern maps a regex to a theme label and default sentiment

interface ThemePattern {
  pattern: RegExp;
  theme: string;
  sentiment: CoachingTheme["sentiment"];
}

const THEME_PATTERNS: ThemePattern[] = [
  // Career decision themes
  {
    pattern: /resign|quit|leave.*job|辞职|离职|换工作/i,
    theme: "career_transition",
    sentiment: "conflicted",
  },
  {
    pattern: /freelanc|self.?employ|自由职业|创业/i,
    theme: "entrepreneurship",
    sentiment: "neutral",
  },
  {
    pattern: /promot|advance|升职|晋升/i,
    theme: "career_advancement",
    sentiment: "neutral",
  },
  {
    pattern: /stuck|stagnant|plateau|停滞|迷茫|困住/i,
    theme: "feeling_stuck",
    sentiment: "negative",
  },

  // Identity themes
  {
    pattern: /who am i|identity|我是谁|身份/i,
    theme: "identity_exploration",
    sentiment: "neutral",
  },
  {
    pattern: /passion|purpose|meaning|热情|意义|目的/i,
    theme: "purpose_seeking",
    sentiment: "neutral",
  },
  {
    pattern: /impostor|not good enough|冒充|不够好/i,
    theme: "impostor_feelings",
    sentiment: "negative",
  },
  {
    pattern: /strength|good at|talent|擅长|优势|天赋/i,
    theme: "strengths_discovery",
    sentiment: "positive",
  },

  // Constraint themes
  {
    pattern: /money|salary|financ|income|钱|薪资|收入|经济/i,
    theme: "financial_concerns",
    sentiment: "negative",
  },
  {
    pattern: /visa|immigra|relocat|签证|移民|搬家/i,
    theme: "location_constraints",
    sentiment: "conflicted",
  },
  {
    pattern: /family|parent|partner|spouse|家人|父母|伴侣/i,
    theme: "family_influence",
    sentiment: "conflicted",
  },
  {
    pattern: /age|too old|too young|年龄|太老|太年轻/i,
    theme: "age_concerns",
    sentiment: "negative",
  },

  // Emotional themes
  {
    pattern: /afraid|fear|scar|anxious|害怕|恐惧|焦虑/i,
    theme: "fear_and_anxiety",
    sentiment: "negative",
  },
  {
    pattern: /excit|energi|motiv|兴奋|有动力|充满能量/i,
    theme: "motivation_energy",
    sentiment: "positive",
  },
  {
    pattern: /confus|uncertain|不确定|困惑|纠结/i,
    theme: "uncertainty",
    sentiment: "conflicted",
  },
  {
    pattern: /control|autonom|freedom|自主|自由|控制/i,
    theme: "autonomy_desire",
    sentiment: "neutral",
  },

  // Action themes
  {
    pattern: /plan|next step|action|计划|下一步|行动/i,
    theme: "action_planning",
    sentiment: "positive",
  },
  {
    pattern: /learn|skill|course|study|学习|技能|课程/i,
    theme: "skill_development",
    sentiment: "positive",
  },
  {
    pattern: /network|connect|reach out|社交|人脉|联系/i,
    theme: "networking",
    sentiment: "neutral",
  },

  // AI-era themes
  {
    pattern: /ai.*replac|automat|被.*替代|AI.*取代/i,
    theme: "ai_displacement_fear",
    sentiment: "negative",
  },
  {
    pattern: /ai.*tool|ai.*help|AI.*工具|AI.*辅助/i,
    theme: "ai_adoption",
    sentiment: "positive",
  },
];

/**
 * Extract themes from a coaching conversation and upsert into DB.
 * Analyzes user messages only (not coach responses).
 */
export async function extractAndSaveThemes(
  userId: string,
  messages: Array<{
    role: string;
    content: string;
    kind?: "message" | "correction";
  }>,
): Promise<void> {
  // Only analyze user messages
  const userText = messages
    .filter((m) => m.role === "user" && m.kind !== "correction")
    .map((m) => m.content)
    .join(" ");

  if (!userText || userText.length < 20) return;

  const detectedThemes = new Set<string>();

  for (const { pattern, theme, sentiment } of THEME_PATTERNS) {
    if (pattern.test(userText) && !detectedThemes.has(theme)) {
      detectedThemes.add(theme);

      // Extract a brief context snippet (first match + surrounding words)
      const match = userText.match(pattern);
      const contextStart = Math.max(0, (match?.index ?? 0) - 30);
      const contextEnd = Math.min(
        userText.length,
        (match?.index ?? 0) + (match?.[0]?.length ?? 0) + 30,
      );
      const context = userText.slice(contextStart, contextEnd).trim();

      await upsertTheme(userId, theme, context, sentiment);
    }
  }
}

/**
 * Build a prompt section from coaching themes for injection into system prompt.
 * Formats recurring themes, contradiction candidates, and growth indicators.
 */

type ThemeTexts = Record<string, string>;

function TL(texts: ThemeTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

const THEME_SECTION_LABELS = {
  recurringHeader: {
    en: "Recurring themes:",
    zh: "反复出现的主题：",
    nl: "Terugkerende thema's:",
    de: "Wiederkehrende Themen:",
    fr: "Thèmes récurrents :",
    es: "Temas recurrentes:",
    pt: "Temas recorrentes:",
    it: "Temi ricorrenti:",
    ru: "Повторяющиеся темы:",
    ja: "繰り返し出現するテーマ：",
    ko: "반복되는 주제:",
  },
  mentioned: {
    en: "mentioned",
    zh: "提及",
    nl: "vermeld",
    de: "erwähnt",
    fr: "mentionné",
    es: "mencionado",
    pt: "mencionado",
    it: "menzionato",
    ru: "упомянуто",
    ja: "言及",
    ko: "언급",
  },
  times: {
    en: "times",
    zh: "次",
    nl: "keer",
    de: "Mal",
    fr: "fois",
    es: "veces",
    pt: "vezes",
    it: "volte",
    ru: "раз",
    ja: "回",
    ko: "회",
  },
  recent: {
    en: "recent",
    zh: "最近",
    nl: "recent",
    de: "kürzlich",
    fr: "récent",
    es: "reciente",
    pt: "recente",
    it: "recente",
    ru: "недавно",
    ja: "最近",
    ko: "최근",
  },
  conflictHeader: {
    en: "Areas of inner conflict:",
    zh: "用户内心冲突的领域：",
    nl: "Gebieden van innerlijk conflict:",
    de: "Bereiche inneren Konflikts:",
    fr: "Zones de conflit intérieur :",
    es: "Áreas de conflicto interno:",
    pt: "Áreas de conflito interno:",
    it: "Aree di conflitto interiore:",
    ru: "Области внутреннего конфликта:",
    ja: "内面の葛藤の領域：",
    ko: "내면 갈등의 영역:",
  },
  conflictAdvice: {
    en: "when they come up, gently name the tension",
    zh: "当它们出现时，温和地指出这种拉扯",
    nl: "benoem de spanning zachtjes wanneer ze opkomen",
    de: "benenne die Spannung sanft, wenn sie aufkommt",
    fr: "quand ils apparaissent, nomme doucement la tension",
    es: "cuando surjan, nombra suavemente la tensión",
    pt: "quando surgirem, nomeie suavemente a tensão",
    it: "quando emergono, nomina delicatamente la tensione",
    ru: "когда они возникают, мягко назови напряжение",
    ja: "それらが出てきたとき、穏やかに緊張を指摘してください",
    ko: "그것들이 나타날 때, 부드럽게 긴장을 지적하세요",
  },
  highFreqPrefix: {
    en: "High-frequency topics",
    zh: "高频主题",
    nl: "Veelbesproken onderwerpen",
    de: "Häufige Themen",
    fr: "Thèmes fréquents",
    es: "Temas frecuentes",
    pt: "Temas frequentes",
    it: "Temi frequenti",
    ru: "Часто обсуждаемые темы",
    ja: "高頻度トピック",
    ko: "고빈도 주제",
  },
  highFreqAdvice: {
    en: 'The user keeps returning to these. Consider naming the pattern: "Have you noticed we keep coming back to this?"',
    zh: '用户反复回到这些话题。考虑指出这个模式："你注意到了吗，我们已经第N次聊到这个了？"',
    nl: 'De gebruiker keert steeds terug naar deze onderwerpen. Overweeg het patroon te benoemen: "Is het je opgevallen dat we hier steeds op terugkomen?"',
    de: 'Der Nutzer kehrt immer wieder zu diesen Themen zurück. Erwäge, das Muster zu benennen: „Ist dir aufgefallen, dass wir immer wieder darauf zurückkommen?"',
    fr: "L'utilisateur revient sans cesse sur ces sujets. Envisage de nommer le schéma : « As-tu remarqué qu'on revient toujours là-dessus ? »",
    es: 'El usuario sigue volviendo a estos temas. Considera nombrar el patrón: "¿Te has dado cuenta de que seguimos volviendo a esto?"',
    pt: 'O usuário continua voltando a esses temas. Considere nomear o padrão: "Você notou que continuamos voltando a isso?"',
    it: 'L\'utente continua a tornare su questi temi. Considera di nominare il pattern: "Hai notato che continuiamo a tornare su questo?"',
    ru: "Пользователь продолжает возвращаться к этим темам. Попробуй назвать паттерн: «Ты заметил(а), что мы всё время возвращаемся к этому?»",
    ja: "ユーザーはこれらのトピックに繰り返し戻ってきます。パターンを指摘することを検討してください：「これに何度も戻ってきていることに気づいていますか？」",
    ko: '사용자가 이 주제들로 계속 돌아옵니다. 패턴을 지적하는 것을 고려하세요: "우리가 계속 이 주제로 돌아오고 있다는 걸 눈치채셨나요?"',
  },
  sectionHeader: {
    en: "\n## Longitudinal Coaching Memory\nThe following patterns are tracked from the user's previous coaching conversations. Use these to ask more precise questions — don't list them directly, but reference them naturally when relevant topics arise.\n",
    zh: "\n## 跨会话纵向记忆\n以下是从用户之前的教练对话中追踪到的模式。用这些来提出更精准的问题——不要直接列出它们，而是当相关话题出现时自然地引用。\n",
    nl: "\n## Longitudinaal Coachgeheugen\nDe volgende patronen zijn bijgehouden uit eerdere coachgesprekken. Gebruik deze om preciezere vragen te stellen — som ze niet op, maar verwijs er natuurlijk naar wanneer relevante onderwerpen opkomen.\n",
    de: "\n## Longitudinales Coaching-Gedächtnis\nDie folgenden Muster wurden aus früheren Coaching-Gesprächen verfolgt. Nutze sie, um präzisere Fragen zu stellen — liste sie nicht direkt auf, sondern verweise natürlich darauf, wenn relevante Themen aufkommen.\n",
    fr: "\n## Mémoire de Coaching Longitudinale\nLes schémas suivants sont suivis à partir des conversations de coaching précédentes. Utilise-les pour poser des questions plus précises — ne les liste pas directement, mais fais-y référence naturellement quand des sujets pertinents émergent.\n",
    es: "\n## Memoria Longitudinal de Coaching\nLos siguientes patrones se rastrean de las conversaciones de coaching anteriores. Úsalos para hacer preguntas más precisas — no los enumeres directamente, sino refiérete a ellos naturalmente cuando surjan temas relevantes.\n",
    pt: "\n## Memória Longitudinal de Coaching\nOs seguintes padrões são rastreados das conversas de coaching anteriores. Use-os para fazer perguntas mais precisas — não os liste diretamente, mas faça referência a eles naturalmente quando temas relevantes surgirem.\n",
    it: "\n## Memoria Longitudinale di Coaching\nI seguenti pattern sono tracciati dalle conversazioni di coaching precedenti. Usali per porre domande più precise — non elencarli direttamente, ma fai riferimento naturalmente quando emergono argomenti rilevanti.\n",
    ru: "\n## Продольная память коучинга\nСледующие паттерны отслеживаются из предыдущих коучинговых разговоров. Используй их для более точных вопросов — не перечисляй их напрямую, а ссылайся на них естественно, когда возникают соответствующие темы.\n",
    ja: "\n## 縦断的コーチング記憶\n以下のパターンは、ユーザーの過去のコーチング会話から追跡されたものです。より的確な質問をするために使用してください。直接列挙するのではなく、関連するトピックが出てきたときに自然に参照してください。\n",
    ko: "\n## 종단적 코칭 기억\n다음 패턴은 사용자의 이전 코칭 대화에서 추적된 것입니다. 더 정확한 질문을 하기 위해 사용하세요. 직접 나열하지 말고, 관련 주제가 나올 때 자연스럽게 참조하세요.\n",
  },
};

export function buildThemeContextSection(
  themes: Array<{
    theme: string;
    context: string | null;
    sentiment: string | null;
    mentionCount: number;
    firstMentionedAt: string;
    lastMentionedAt: string;
  }>,
  locale: string,
): string {
  if (!themes || themes.length === 0) return "";

  const recurring = themes.filter((t) => t.mentionCount >= 2);
  const conflicted = themes.filter((t) => t.sentiment === "conflicted");
  const highFreq = themes.filter((t) => t.mentionCount >= 3);

  const lines: string[] = [];

  if (recurring.length > 0) {
    const mentionedWord = TL(THEME_SECTION_LABELS.mentioned, locale);
    const timesWord = TL(THEME_SECTION_LABELS.times, locale);
    const recentWord = TL(THEME_SECTION_LABELS.recent, locale);
    const items = recurring.map((t) => {
      const label = t.theme.replace(/_/g, " ");
      return `• "${label}" — ${mentionedWord} ${t.mentionCount} ${timesWord}${t.context ? ` (${recentWord}: ${t.context.slice(0, 40)}...)` : ""}`;
    });
    lines.push(
      `${TL(THEME_SECTION_LABELS.recurringHeader, locale)}\n${items.join("\n")}`,
    );
  }

  if (conflicted.length > 0) {
    const items = conflicted.map((t) => t.theme.replace(/_/g, " ")).join(", ");
    lines.push(
      `${TL(THEME_SECTION_LABELS.conflictHeader, locale)} ${items} — ${TL(THEME_SECTION_LABELS.conflictAdvice, locale)}`,
    );
  }

  if (highFreq.length > 0) {
    const items = highFreq.map((t) => t.theme.replace(/_/g, " ")).join(", ");
    lines.push(
      `${TL(THEME_SECTION_LABELS.highFreqPrefix, locale)} (${items}): ${TL(THEME_SECTION_LABELS.highFreqAdvice, locale)}`,
    );
  }

  if (lines.length === 0) return "";

  const header = TL(THEME_SECTION_LABELS.sectionHeader, locale);

  return header + lines.join("\n\n");
}
