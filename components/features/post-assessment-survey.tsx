"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SCC_QUESTIONS,
  SCC_SCALE_LABELS,
  type SCCResponses,
} from "@/lib/cdse/scc-questions";
import { CDC_QUESTIONS, CDC_SCALE_LABELS } from "@/lib/cdse/cdc-questions";
import {
  TRUST_SAFETY_QUESTIONS,
  CONSTRAINTS_CONFIDENCE_QUESTIONS,
  DELAYED_REFLECTION_QUESTIONS,
  FEATURE_OPTIONS,
  getFeatureLabel,
  AGREE_DISAGREE_SCALE_LABELS,
  ATTENTION_CHECK_QUESTION,
} from "@/lib/cdse/research-questions";
import { UES_QUESTIONS, UES_SCALE_LABELS } from "@/lib/cdse/ues-questions";
import { DEMOGRAPHIC_QUESTIONS } from "@/lib/cdse/demographics-questions";
import type {
  PrePostAssessmentType,
  ExperienceFeedback,
} from "@/lib/types/platform";
import { RESEARCH_CONSENT } from "@/lib/cdse/research-consent";
import {
  Anchor,
  ArrowRight,
  ArrowLeft,
  Check,
  GripVertical,
  FileCheck,
} from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";

// ── Section enum for step navigation ──

type SurveySection =
  | "demographics"
  | "scc"
  | "cdc"
  | "ues"
  | "trust"
  | "constraints"
  | "attention"
  | "features"
  | "delayed_reflection"
  | "feedback";

// T1 order per thesis v4.1: UES → Trust → Constraints → Attention check → Features
// → SCC → CDC → Open. Attention check inserted between content blocks per
// Meade & Craig (2012) instructed-response practice.
const POST_SECTIONS: SurveySection[] = [
  "ues",
  "trust",
  "constraints",
  "attention",
  "features",
  "scc",
  "cdc",
  "feedback",
];
// T2 order per thesis v5.2: DR-3 → SCC-12 → CDC-5 → Open
const T2_SECTIONS: SurveySection[] = [
  "delayed_reflection",
  "scc",
  "cdc",
  "feedback",
];
// T0 order per Research Survey v5.2: Demographics → SCC-12 → CDC-5
const PRE_SECTIONS: SurveySection[] = ["demographics", "scc", "cdc"];

interface PostAssessmentSurveyProps {
  assessmentType: PrePostAssessmentType;
  locale: string;
  onComplete: () => void;
  onSkip?: () => void;
  /** Whether user completed at least one coaching conversation. Trust-5 is only shown if true. */
  hasUsedCoaching?: boolean;
  /** Whether user's report included real-world constraints integration. Constraints-3 is only shown if true. */
  hasRealWorldConstraints?: boolean;
  /** Research group assignment. Reserved for experimental label overrides if needed. */
  researchGroup?: "classic" | "immersive" | null;
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  current: number;
  total: number;
  locale: string;
}

function SectionHeader({
  title,
  subtitle,
  current,
  total,
  locale,
}: SectionHeaderProps) {
  const tDict = getDictionaryClient(locale as Locale).postAssessment;
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground mb-2 font-medium">
        {interpolate(tDict.sectionOf, {
          current: String(current),
          total: String(total),
        })}
      </p>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// ── Likert scale row (shared by SCC, CDC, Trust, Constraints) ──

interface LikertQuestionProps {
  questionText: string;
  questionIndex: number;
  totalQuestions: number;
  scaleLabels: readonly { value: number; label: string }[];
  selectedValue: number | undefined;
  onSelect: (value: number) => void;
}

function LikertQuestion({
  questionText,
  questionIndex,
  totalQuestions,
  scaleLabels,
  selectedValue,
  onSelect,
}: LikertQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-xs text-muted-foreground mb-2 font-medium">
        {questionIndex + 1} / {totalQuestions}
      </p>
      <h4 className="text-base font-medium text-foreground mb-4 leading-relaxed">
        {questionText}
      </h4>
      <div className="space-y-2">
        {scaleLabels.map(({ value, label }) => {
          const selected = selectedValue === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left
                transition-all duration-200
                ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5 text-foreground"
                }
              `}
            >
              <span
                className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                }
              `}
              >
                {value}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main Component ──

export function PostAssessmentSurvey({
  assessmentType,
  locale,
  onComplete,
  onSkip,
  hasUsedCoaching = true,
  hasRealWorldConstraints = true,
  researchGroup = null,
}: PostAssessmentSurveyProps) {
  const tDict = getDictionaryClient(locale as Locale).postAssessment;
  const isPost = assessmentType !== "pre";
  const isT2 = assessmentType === "post_1week";
  // Resolve section list per assessment type
  const sections = isT2
    ? T2_SECTIONS
    : isPost
      ? POST_SECTIONS.filter((s) => {
          if (s === "trust" && !hasUsedCoaching) return false;
          if (s === "constraints" && !hasRealWorldConstraints) return false;
          // Attention check is T1-only and always shown — no conditional skip
          return true;
        })
      : PRE_SECTIONS;
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Demographics state (T0 only — 4 select items)
  const [demoResponses, setDemoResponses] = useState<Record<string, string>>(
    {},
  );
  // SCC state
  const [sccResponses, setSccResponses] = useState<SCCResponses>({});
  // CDC state
  const [cdcScores, setCdcScores] = useState<Record<string, number>>({});
  // Trust & Safety state (Q1)
  const [trustScores, setTrustScores] = useState<Record<string, number>>({});
  // Constraints state (Q2)
  const [constraintScores, setConstraintScores] = useState<
    Record<string, number>
  >({});
  // Feature Attribution state (Q3)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureRanking, setFeatureRanking] = useState<string[]>([]);
  // DR-3: Delayed Reflection state (T2 only)
  const [drScores, setDrScores] = useState<Record<string, number>>({});
  // UES-SF-12 state
  const [uesScores, setUesScores] = useState<Record<string, number>>({});
  // Attention check state (T1 only, 1 item)
  const [attentionScores, setAttentionScores] = useState<
    Record<string, number>
  >({});
  // Open Feedback
  const [feedbackComments, setFeedbackComments] = useState("");

  // Consent state (T0 only — shown before survey)
  const [consentGiven, setConsentGiven] = useState(assessmentType !== "pre");
  const [consentChecked, setConsentChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSection = sections[currentSectionIdx];

  // ── Section titles (en required, others optional — pickLocaleText falls back to en) ──
  const sectionTitles: Record<
    SurveySection,
    { title: Record<string, string>; subtitle: Record<string, string> }
  > = {
    demographics: {
      title: {
        en: "About You",
        zh: "关于你",
      },
      subtitle: {
        en: "A few quick questions to describe our sample.",
        zh: "几个简短的问题，用于描述研究样本。",
      },
    },
    scc: {
      title: {
        en: "Self-Concept Clarity",
        zh: "自我认知清晰度",
        nl: "Zelfconcepthelderheid",
        de: "Selbstkonzept-Klarheit",
        fr: "Clarté du concept de soi",
        es: "Claridad del autoconcepto",
        pt: "Clareza do autoconceito",
        it: "Chiarezza del concetto di sé",
        ru: "Ясность самовосприятия",
        ja: "自己概念の明確さ",
        ko: "자기 개념 명확성",
      },
      subtitle: {
        en: "How clearly do you see yourself right now?",
        zh: "你目前对自己的认知有多清晰？",
        nl: "Hoe duidelijk zie je jezelf op dit moment?",
        de: "Wie klar sehen Sie sich selbst gerade?",
        fr: "À quel point vous voyez-vous clairement en ce moment ?",
        es: "¿Qué tan claramente te ves a ti mismo/a ahora?",
        pt: "Quão claramente você se vê agora?",
        it: "Quanto chiaramente ti vedi in questo momento?",
        ru: "Насколько ясно вы видите себя сейчас?",
        ja: "今の自分をどの程度はっきりと認識していますか？",
        ko: "지금 자신을 얼마나 명확하게 보고 있습니까?",
      },
    },
    cdc: {
      title: {
        en: "Career Decision Confidence",
        zh: "职业决策信心",
        nl: "Vertrouwen in loopbaanbeslissingen",
        de: "Vertrauen in Berufsentscheidungen",
        fr: "Confiance dans les décisions de carrière",
        es: "Confianza en decisiones profesionales",
        pt: "Confiança em decisões de carreira",
        it: "Fiducia nelle decisioni di carriera",
        ru: "Уверенность в карьерных решениях",
        ja: "キャリア決断への自信",
        ko: "직업 결정 자신감",
      },
      subtitle: {
        en: "How confident are you about career decisions?",
        zh: "你对职业决策有多大信心？",
        nl: "Hoe zeker ben je over loopbaanbeslissingen?",
        de: "Wie zuversichtlich sind Sie bei Berufsentscheidungen?",
        fr: "Quelle confiance avez-vous dans vos décisions de carrière ?",
        es: "¿Qué tan seguro/a te sientes sobre las decisiones profesionales?",
        pt: "Quão confiante você está sobre decisões de carreira?",
        it: "Quanto sei sicuro/a delle tue decisioni di carriera?",
        ru: "Насколько вы уверены в своих карьерных решениях?",
        ja: "キャリアの決断にどの程度自信がありますか？",
        ko: "직업적 결정에 대해 얼마나 자신감이 있습니까?",
      },
    },
    trust: {
      title: {
        en: "Trust & Psychological Safety",
        zh: "信任与心理安全感",
        nl: "Vertrouwen & psychologische veiligheid",
        de: "Vertrauen & psychologische Sicherheit",
        fr: "Confiance et sécurité psychologique",
        es: "Confianza y seguridad psicológica",
        pt: "Confiança e segurança psicológica",
        it: "Fiducia e sicurezza psicologica",
        ru: "Доверие и психологическая безопасность",
        ja: "信頼と心理的安全性",
        ko: "신뢰와 심리적 안전",
      },
      subtitle: {
        en: "How safe did you feel during the experience?",
        zh: "在体验过程中你感到多安全？",
        nl: "Hoe veilig voelde je je tijdens de ervaring?",
        de: "Wie sicher fühlten Sie sich während der Erfahrung?",
        fr: "À quel point vous êtes-vous senti(e) en sécurité pendant l'expérience ?",
        es: "¿Qué tan seguro/a te sentiste durante la experiencia?",
        pt: "Quão seguro/a você se sentiu durante a experiência?",
        it: "Quanto ti sei sentito/a al sicuro durante l'esperienza?",
        ru: "Насколько безопасно вы себя чувствовали во время опыта?",
        ja: "体験中にどの程度安心感を感じましたか？",
        ko: "경험 중 얼마나 안전하다고 느꼈습니까?",
      },
    },
    attention: {
      title: {
        en: "Quick Check",
        zh: "注意力检查",
        nl: "Snelle controle",
        de: "Kurze Prüfung",
        fr: "Vérification rapide",
        es: "Verificación rápida",
        pt: "Verificação rápida",
        it: "Verifica rapida",
        ru: "Быстрая проверка",
        ja: "確認",
        ko: "간단 확인",
      },
      subtitle: {
        en: "A brief check that you're reading carefully.",
        zh: "简短确认你正在认真阅读。",
        nl: "Een korte controle of je aandachtig leest.",
        de: "Eine kurze Prüfung, dass Sie aufmerksam lesen.",
        fr: "Une brève vérification que vous lisez attentivement.",
        es: "Una breve verificación de que estás leyendo con atención.",
        pt: "Uma breve verificação de que você está lendo com atenção.",
        it: "Una breve verifica che tu stia leggendo con attenzione.",
        ru: "Краткая проверка того, что вы внимательно читаете.",
        ja: "注意して読んでいるかの簡単な確認です。",
        ko: "주의 깊게 읽고 있는지 간단히 확인합니다.",
      },
    },
    constraints: {
      title: {
        en: "Real-World Integration",
        zh: "现实条件整合",
        nl: "Integratie met de echte wereld",
        de: "Integration realer Bedingungen",
        fr: "Intégration des conditions réelles",
        es: "Integración con el mundo real",
        pt: "Integração com o mundo real",
        it: "Integrazione con il mondo reale",
        ru: "Интеграция с реальными условиями",
        ja: "現実世界との統合",
        ko: "현실 세계 통합",
      },
      subtitle: {
        en: "How well did the platform consider your constraints?",
        zh: "平台对你的现实条件考虑得如何？",
        nl: "Hoe goed hield het platform rekening met je beperkingen?",
        de: "Wie gut berücksichtigte die Plattform Ihre Einschränkungen?",
        fr: "Dans quelle mesure la plateforme a-t-elle tenu compte de vos contraintes ?",
        es: "¿Qué tan bien consideró la plataforma tus restricciones?",
        pt: "Quão bem a plataforma considerou suas restrições?",
        it: "Quanto bene la piattaforma ha considerato i tuoi vincoli?",
        ru: "Насколько хорошо платформа учла ваши ограничения?",
        ja: "プラットフォームはあなたの制約をどの程度考慮しましたか？",
        ko: "플랫폼이 당신의 제약 조건을 얼마나 잘 고려했습니까?",
      },
    },
    ues: {
      title: {
        en: "Your Experience",
        zh: "你的体验感受",
        nl: "Jouw ervaring",
        de: "Ihre Erfahrung",
        fr: "Votre expérience",
        es: "Tu experiencia",
        pt: "Sua experiência",
        it: "La tua esperienza",
        ru: "Ваш опыт",
        ja: "あなたの体験",
        ko: "당신의 경험",
      },
      subtitle: {
        en: "How engaging was the Deep Dive experience?",
        zh: "Deep Dive 的体验感受如何？",
        nl: "Hoe boeiend was de Deep Dive-ervaring?",
        de: "Wie fesselnd war die Deep Dive-Erfahrung?",
        fr: "À quel point l'expérience Deep Dive était-elle captivante ?",
        es: "¿Qué tan atractiva fue la experiencia Deep Dive?",
        pt: "Quão envolvente foi a experiência Deep Dive?",
        it: "Quanto è stata coinvolgente l'esperienza Deep Dive?",
        ru: "Насколько захватывающим был опыт Deep Dive?",
        ja: "Deep Diveの体験はどの程度魅力的でしたか？",
        ko: "Deep Dive 경험은 얼마나 몰입적이었습니까?",
      },
    },
    features: {
      title: {
        en: "Most Valuable Features",
        zh: "最有价值的功能",
        nl: "Meest waardevolle functies",
        de: "Wertvollste Funktionen",
        fr: "Fonctionnalités les plus précieuses",
        es: "Funciones más valiosas",
        pt: "Recursos mais valiosos",
        it: "Funzionalità più preziose",
        ru: "Наиболее ценные функции",
        ja: "最も価値のある機能",
        ko: "가장 가치 있는 기능",
      },
      subtitle: {
        en: "Which features were most valuable to you?",
        zh: "哪些功能对你最有价值？",
        nl: "Welke functies waren het meest waardevol voor je?",
        de: "Welche Funktionen waren für Sie am wertvollsten?",
        fr: "Quelles fonctionnalités ont été les plus précieuses pour vous ?",
        es: "¿Qué funciones fueron más valiosas para ti?",
        pt: "Quais recursos foram mais valiosos para você?",
        it: "Quali funzionalità sono state più preziose per te?",
        ru: "Какие функции были для вас наиболее ценными?",
        ja: "どの機能が最も価値がありましたか？",
        ko: "어떤 기능이 가장 가치 있었습니까?",
      },
    },
    delayed_reflection: {
      title: {
        en: "Looking Back",
        zh: "回顾反思",
        nl: "Terugkijken",
        de: "Rückblick",
        fr: "Regard en arrière",
        es: "Mirando atrás",
        pt: "Olhando para trás",
        it: "Guardando indietro",
        ru: "Оглядываясь назад",
        ja: "振り返り",
        ko: "돌아보며",
      },
      subtitle: {
        en: "How has the experience stayed with you?",
        zh: "这次体验对你产生了怎样的持续影响？",
        nl: "Hoe is de ervaring bij je gebleven?",
        de: "Wie hat die Erfahrung bei Ihnen nachgewirkt?",
        fr: "Comment cette expérience vous a-t-elle marqué(e) ?",
        es: "¿Cómo ha permanecido la experiencia contigo?",
        pt: "Como a experiência ficou com você?",
        it: "Come è rimasta con te l'esperienza?",
        ru: "Как этот опыт остался с вами?",
        ja: "この体験はどのようにあなたに影響を残しましたか？",
        ko: "그 경험이 어떻게 남아 있습니까?",
      },
    },
    feedback: {
      title: {
        en: "Open Feedback",
        zh: "开放反馈",
        nl: "Open feedback",
        de: "Offenes Feedback",
        fr: "Commentaires libres",
        es: "Comentarios abiertos",
        pt: "Feedback aberto",
        it: "Feedback aperto",
        ru: "Открытый отзыв",
        ja: "オープンフィードバック",
        ko: "자유 피드백",
      },
      // Subtitle is overridden dynamically below based on T1 vs T2
      subtitle: {
        en: "",
        zh: "",
      },
    },
  };

  // T1/T2 open-ended question text (spec v5.2)
  const feedbackSubtitle = isT2
    ? {
        en: "Looking back over the past week, has anything from the Deep Dive experience influenced how you think about your career or any actions you have taken?",
        zh: "回顾过去一周，Deep Dive 体验是否影响了你对职业的思考或你采取的任何行动？",
      }
    : {
        en: "How, if at all, has the Deep Dive experience influenced how you think about your career?",
        zh: "Deep Dive 体验是否影响了你对职业的思考？如果有，是哪些方面？",
      };
  // Override feedback subtitle dynamically
  sectionTitles.feedback.subtitle = feedbackSubtitle;

  // ── Questions for current section ──
  const getSectionQuestions = (section: SurveySection) => {
    switch (section) {
      case "scc":
        return SCC_QUESTIONS;
      case "cdc":
        return CDC_QUESTIONS;
      case "ues":
        return UES_QUESTIONS;
      case "trust":
        return TRUST_SAFETY_QUESTIONS;
      case "constraints":
        return CONSTRAINTS_CONFIDENCE_QUESTIONS;
      case "attention":
        return [ATTENTION_CHECK_QUESTION];
      case "delayed_reflection":
        return DELAYED_REFLECTION_QUESTIONS;
      default:
        return [];
    }
  };

  const currentQuestions = getSectionQuestions(currentSection);
  const isLikertSection = [
    "scc",
    "cdc",
    "ues",
    "trust",
    "constraints",
    "attention",
    "delayed_reflection",
  ].includes(currentSection);
  const totalSections = sections.length;

  // ── Check if current section is complete ──
  const isSectionComplete = useCallback(
    (section: SurveySection): boolean => {
      switch (section) {
        case "demographics":
          return DEMOGRAPHIC_QUESTIONS.every(
            (q) =>
              demoResponses[q.id] !== undefined && demoResponses[q.id] !== "",
          );
        case "scc":
          return SCC_QUESTIONS.every((q) => sccResponses[q.id] !== undefined);
        case "cdc":
          return CDC_QUESTIONS.every((q) => cdcScores[q.id] !== undefined);
        case "ues":
          return UES_QUESTIONS.every((q) => uesScores[q.id] !== undefined);
        case "trust":
          return TRUST_SAFETY_QUESTIONS.every(
            (q) => trustScores[q.key] !== undefined,
          );
        case "constraints":
          return CONSTRAINTS_CONFIDENCE_QUESTIONS.every(
            (q) => constraintScores[q.key] !== undefined,
          );
        case "attention":
          return attentionScores[ATTENTION_CHECK_QUESTION.key] !== undefined;
        case "delayed_reflection":
          return DELAYED_REFLECTION_QUESTIONS.every(
            (q) => drScores[q.key] !== undefined,
          );
        case "features":
          return selectedFeatures.length > 0;
        case "feedback":
          return true; // feedback is always optional
      }
    },
    [
      demoResponses,
      sccResponses,
      cdcScores,
      uesScores,
      trustScores,
      constraintScores,
      attentionScores,
      drScores,
      selectedFeatures,
    ],
  );

  const canProceed = isSectionComplete(currentSection);
  const isLastSection = currentSectionIdx === totalSections - 1;

  // Likert section 未答题信息：用户可通过 dots 跳题，跳过的题需要可定位回去
  const getLikertIncompleteInfo = useCallback(
    (section: SurveySection): { count: number; firstIdx: number } | null => {
      const isLikert = [
        "scc",
        "cdc",
        "ues",
        "trust",
        "constraints",
        "attention",
        "delayed_reflection",
      ].includes(section);
      if (!isLikert) return null;
      const questions = getSectionQuestions(section);
      if (questions.length === 0) return null;

      let firstIdx = -1;
      let count = 0;
      questions.forEach((q, i) => {
        const qWithKey = q as { id: string; key?: string };
        let answered = false;
        switch (section) {
          case "scc":
            answered = sccResponses[qWithKey.id] !== undefined;
            break;
          case "cdc":
            answered = cdcScores[qWithKey.id] !== undefined;
            break;
          case "ues":
            answered = uesScores[qWithKey.id] !== undefined;
            break;
          case "trust":
            answered =
              !!qWithKey.key && trustScores[qWithKey.key] !== undefined;
            break;
          case "constraints":
            answered =
              !!qWithKey.key && constraintScores[qWithKey.key] !== undefined;
            break;
          case "attention":
            answered =
              !!qWithKey.key && attentionScores[qWithKey.key] !== undefined;
            break;
          case "delayed_reflection":
            answered = !!qWithKey.key && drScores[qWithKey.key] !== undefined;
            break;
        }
        if (!answered) {
          if (firstIdx === -1) firstIdx = i;
          count++;
        }
      });
      return count > 0 ? { count, firstIdx } : null;
    },
    [
      sccResponses,
      cdcScores,
      uesScores,
      trustScores,
      constraintScores,
      attentionScores,
      drScores,
    ],
  );

  const incompleteInfo = getLikertIncompleteInfo(currentSection);

  // 清掉 pending 的 auto-advance — 任何手动跳题前必须调用，避免 stale timer 把用户的跳转覆盖掉
  const clearAutoAdvanceTimer = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  };

  // ── Handle Likert selection ──
  const handleLikertSelect = (questionId: string, value: number) => {
    switch (currentSection) {
      case "scc":
        setSccResponses((prev) => ({ ...prev, [questionId]: value }));
        break;
      case "cdc":
        setCdcScores((prev) => ({ ...prev, [questionId]: value }));
        break;
      case "ues":
        setUesScores((prev) => ({ ...prev, [questionId]: value }));
        break;
      case "trust": {
        const tq = TRUST_SAFETY_QUESTIONS.find((q) => q.id === questionId);
        if (tq) setTrustScores((prev) => ({ ...prev, [tq.key]: value }));
        break;
      }
      case "constraints": {
        const cq = CONSTRAINTS_CONFIDENCE_QUESTIONS.find(
          (q) => q.id === questionId,
        );
        if (cq) setConstraintScores((prev) => ({ ...prev, [cq.key]: value }));
        break;
      }
      case "attention": {
        setAttentionScores((prev) => ({
          ...prev,
          [ATTENTION_CHECK_QUESTION.key]: value,
        }));
        break;
      }
      case "delayed_reflection": {
        const drq = DELAYED_REFLECTION_QUESTIONS.find(
          (q) => q.id === questionId,
        );
        if (drq) setDrScores((prev) => ({ ...prev, [drq.key]: value }));
        break;
      }
    }
    // Auto-advance within section (clear any pending timer first)
    clearAutoAdvanceTimer();
    if (currentQuestionIdx < currentQuestions.length - 1) {
      const maxIdx = currentQuestions.length - 1;
      autoAdvanceTimer.current = setTimeout(() => {
        autoAdvanceTimer.current = null;
        setCurrentQuestionIdx((prev) => Math.min(prev + 1, maxIdx));
      }, 300);
    }
  };

  // ── Get current Likert value ──
  const getCurrentLikertValue = (): number | undefined => {
    if (!isLikertSection || currentQuestions.length === 0) return undefined;
    const safeIdx = Math.min(currentQuestionIdx, currentQuestions.length - 1);
    const q = currentQuestions[safeIdx];
    if (!q) return undefined;
    switch (currentSection) {
      case "scc":
        return sccResponses[q.id];
      case "cdc":
        return cdcScores[q.id];
      case "ues":
        return uesScores[q.id];
      case "trust":
        return trustScores[(q as (typeof TRUST_SAFETY_QUESTIONS)[number]).key];
      case "constraints":
        return constraintScores[
          (q as (typeof CONSTRAINTS_CONFIDENCE_QUESTIONS)[number]).key
        ];
      case "attention":
        return attentionScores[ATTENTION_CHECK_QUESTION.key];
      case "delayed_reflection":
        return drScores[
          (q as (typeof DELAYED_REFLECTION_QUESTIONS)[number]).key
        ];
      default:
        return undefined;
    }
  };

  // ── Get scale labels for current section ──
  const getScaleLabels = () => {
    const loc = locale as string;
    switch (currentSection) {
      case "scc":
        return (
          SCC_SCALE_LABELS[loc as keyof typeof SCC_SCALE_LABELS] ??
          SCC_SCALE_LABELS.en
        );
      case "cdc":
        return (
          CDC_SCALE_LABELS[loc as keyof typeof CDC_SCALE_LABELS] ??
          CDC_SCALE_LABELS.en
        );
      case "ues":
        return (
          UES_SCALE_LABELS[loc as keyof typeof UES_SCALE_LABELS] ??
          UES_SCALE_LABELS.en
        );
      case "trust":
      case "constraints":
      case "attention":
      case "delayed_reflection":
        return (
          AGREE_DISAGREE_SCALE_LABELS[
            loc as keyof typeof AGREE_DISAGREE_SCALE_LABELS
          ] ?? AGREE_DISAGREE_SCALE_LABELS.en
        );
      default:
        return [];
    }
  };

  // ── Feature toggle ──
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) => {
      // Spec: select top 1-2 features (max 2)
      if (!prev.includes(featureId) && prev.length >= 2) return prev;
      const newSelected = prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId];
      // Update ranking to match selection
      setFeatureRanking((current) => {
        if (newSelected.includes(featureId) && !current.includes(featureId)) {
          return [...current, featureId];
        }
        return current.filter((f) => newSelected.includes(f));
      });
      return newSelected;
    });
  };

  // ── Feature ranking reorder ──
  const moveFeatureUp = (index: number) => {
    if (index === 0) return;
    setFeatureRanking((prev) => {
      const newRanking = [...prev];
      [newRanking[index - 1], newRanking[index]] = [
        newRanking[index],
        newRanking[index - 1],
      ];
      return newRanking;
    });
  };

  const moveFeatureDown = (index: number) => {
    if (index >= featureRanking.length - 1) return;
    setFeatureRanking((prev) => {
      const newRanking = [...prev];
      [newRanking[index], newRanking[index + 1]] = [
        newRanking[index + 1],
        newRanking[index],
      ];
      return newRanking;
    });
  };

  // ── Navigation ──
  const goNextSection = () => {
    clearAutoAdvanceTimer();
    if (isLastSection) {
      handleSubmit();
      return;
    }
    setCurrentSectionIdx((prev) => prev + 1);
    setCurrentQuestionIdx(0);
  };

  const goPrevSection = () => {
    clearAutoAdvanceTimer();
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx((prev) => prev - 1);
      setCurrentQuestionIdx(0);
    }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const experienceFeedback: ExperienceFeedback = isT2
        ? {
            // DR-3: Delayed Reflection (T2 only)
            delayed_continued_thinking: drScores["delayed_continued_thinking"],
            delayed_took_action: drScores["delayed_took_action"],
            delayed_perspective_shift: drScores["delayed_perspective_shift"],
            // Open feedback
            comments: feedbackComments || undefined,
          }
        : isPost
          ? {
              // Trust-5
              trust_willing_to_disclose:
                trustScores["trust_willing_to_disclose"],
              trust_felt_understood: trustScores["trust_felt_understood"],
              trust_comfortable_sharing:
                trustScores["trust_comfortable_sharing"],
              trust_ai_competence: trustScores["trust_ai_competence"],
              trust_emotional_safety: trustScores["trust_emotional_safety"],
              // Constraints-3
              constraints_adequately_considered:
                constraintScores["constraints_adequately_considered"],
              constraints_increased_confidence:
                constraintScores["constraints_increased_confidence"],
              constraints_actionable:
                constraintScores["constraints_actionable"],
              // Attention check (1 item, T1 only — expected value = 4)
              attn_check_1: attentionScores["attn_check_1"],
              // Feature attribution (ranking only — fc_* deprecated)
              most_valuable_features:
                selectedFeatures as ExperienceFeedback["most_valuable_features"],
              feature_ranking: featureRanking,
              // UES-SF-12 (all 12 items)
              ux1: uesScores["ux1"],
              ux2: uesScores["ux2"],
              ux3: uesScores["ux3"],
              ux4: uesScores["ux4"],
              ux5: uesScores["ux5"],
              ux6: uesScores["ux6"],
              ux7: uesScores["ux7"],
              ux8: uesScores["ux8"],
              ux9: uesScores["ux9"],
              ux10: uesScores["ux10"],
              ux11: uesScores["ux11"],
              ux12: uesScores["ux12"],
              // Open feedback
              comments: feedbackComments || undefined,
            }
          : {};

      // Demographics stored in experienceFeedback for pre assessment (T0)
      const demographicsPayload = !isPost
        ? {
            demo_age: demoResponses["demo_age"],
            demo_gender: demoResponses["demo_gender"],
            demo_employment: demoResponses["demo_employment"],
            demo_experience: demoResponses["demo_experience"],
          }
        : undefined;

      const res = await csrfFetch("/api/pre-post-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType,
          sccResponses,
          cdcResponses: cdcScores,
          experienceFeedback: isPost ? experienceFeedback : demographicsPayload,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitting(false);
      setSubmitError(false);
      onComplete();
    } catch (err) {
      if (__DEV__)
        console.warn(
          "[post-assessment-survey] Failed to save assessment data:",
          err,
        );
      setSubmitting(false);
      setSubmitError(true);
    }
  };

  // ── Copy ──
  const headerCopy: Record<
    string,
    { title: Record<string, string>; subtitle: Record<string, string> }
  > = {
    pre: {
      title: {
        en: "Before You Dive",
        zh: "出发前，先给自己定个基准",
        nl: "Voordat je duikt",
        de: "Bevor Sie eintauchen",
        fr: "Avant de plonger",
        es: "Antes de sumergirte",
        pt: "Antes de mergulhar",
        it: "Prima di immergerti",
        ru: "Прежде чем погрузиться",
        ja: "始める前に",
        ko: "시작하기 전에",
      },
      subtitle: {
        en: "Set a baseline for your career clarity and confidence.",
        zh: "为你的职业清晰度和信心设定一个起点。",
        nl: "Stel een basislijn vast voor je loopbaanhelderheid en zelfvertrouwen.",
        de: "Legen Sie eine Basislinie für Ihre berufliche Klarheit und Ihr Selbstvertrauen fest.",
        fr: "Établissez une base de référence pour votre clarté et confiance professionnelles.",
        es: "Establece una línea base para tu claridad y confianza profesional.",
        pt: "Defina uma linha de base para sua clareza e confiança profissional.",
        it: "Stabilisci un punto di riferimento per la tua chiarezza e fiducia professionale.",
        ru: "Установите отправную точку для вашей карьерной ясности и уверенности.",
        ja: "キャリアの明確さと自信の基準を設定しましょう。",
        ko: "직업적 명확성과 자신감의 기준선을 설정하세요.",
      },
    },
    post_immediate: {
      title: {
        en: "After Your Exploration",
        zh: "探索之后",
        nl: "Na je verkenning",
        de: "Nach Ihrer Erkundung",
        fr: "Après votre exploration",
        es: "Después de tu exploración",
        pt: "Depois da sua exploração",
        it: "Dopo la tua esplorazione",
        ru: "После вашего исследования",
        ja: "探索の後に",
        ko: "탐색 후에",
      },
      subtitle: {
        en: "Let's see how the experience has influenced your perspective.",
        zh: "让我们看看这次体验对你的影响。",
        nl: "Laten we zien hoe de ervaring je perspectief heeft beïnvloed.",
        de: "Sehen wir, wie die Erfahrung Ihre Perspektive beeinflusst hat.",
        fr: "Voyons comment l'expérience a influencé votre perspective.",
        es: "Veamos cómo la experiencia ha influido en tu perspectiva.",
        pt: "Vamos ver como a experiência influenciou sua perspectiva.",
        it: "Vediamo come l'esperienza ha influenzato la tua prospettiva.",
        ru: "Давайте посмотрим, как этот опыт повлиял на ваше восприятие.",
        ja: "この体験があなたの視点にどう影響したか見てみましょう。",
        ko: "이 경험이 당신의 관점에 어떤 영향을 미쳤는지 살펴봅시다.",
      },
    },
    post_1week: {
      title: {
        en: "One Week Later",
        zh: "一周之后",
        nl: "Een week later",
        de: "Eine Woche später",
        fr: "Une semaine plus tard",
        es: "Una semana después",
        pt: "Uma semana depois",
        it: "Una settimana dopo",
        ru: "Неделю спустя",
        ja: "一週間後",
        ko: "일주일 후",
      },
      subtitle: {
        en: "A week has passed — let's check in on your career clarity.",
        zh: "一周过去了——让我们重新审视你的职业清晰度。",
        nl: "Er is een week verstreken — laten we je loopbaanhelderheid opnieuw bekijken.",
        de: "Eine Woche ist vergangen — überprüfen wir Ihre berufliche Klarheit.",
        fr: "Une semaine s'est écoulée — vérifions votre clarté de carrière.",
        es: "Ha pasado una semana — revisemos tu claridad profesional.",
        pt: "Uma semana se passou — vamos verificar sua clareza profissional.",
        it: "È passata una settimana — controlliamo la tua chiarezza professionale.",
        ru: "Прошла неделя — давайте проверим вашу карьерную ясность.",
        ja: "一週間が経ちました — キャリアの明確さを確認しましょう。",
        ko: "일주일이 지났습니다 — 직업적 명확성을 확인해 봅시다.",
      },
    },
  };

  const headerEntry = headerCopy[assessmentType];
  const copy = {
    title: (headerEntry?.title[locale] || headerEntry?.title.en) ?? "",
    subtitle: (headerEntry?.subtitle[locale] || headerEntry?.subtitle.en) ?? "",
  };

  // ── Progress bar ──
  const overallProgress = (() => {
    let completed = 0;
    for (let i = 0; i < currentSectionIdx; i++) {
      completed += 1;
    }
    // Partial progress within current Likert section
    if (isLikertSection && currentQuestions.length > 0) {
      let answered = 0;
      switch (currentSection) {
        case "scc":
          answered = Object.keys(sccResponses).length;
          break;
        case "cdc":
          answered = Object.keys(cdcScores).length;
          break;
        case "ues":
          answered = Object.keys(uesScores).length;
          break;
        case "trust":
          answered = Object.keys(trustScores).length;
          break;
        case "constraints":
          answered = Object.keys(constraintScores).length;
          break;
        case "delayed_reflection":
          answered = Object.keys(drScores).length;
          break;
      }
      completed += answered / currentQuestions.length;
    } else if (currentSection === "features" && selectedFeatures.length > 0) {
      completed += 0.5;
    } else if (currentSection === "feedback") {
      completed += 0.5;
    }
    return completed / totalSections;
  })();

  // ── Record consent server-side ──
  const recordConsent = async () => {
    try {
      await csrfFetch("/api/pre-post-assessment/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentGiven: true }),
        credentials: "include",
      });
    } catch {
      // Consent recording is best-effort; the T0 submission will still proceed
      if (__DEV__)
        console.warn("[consent] Failed to record consent server-side");
    }
    setConsentGiven(true);
  };

  // ── Consent screen (T0 only, before survey) ──
  if (!consentGiven) {
    const consentData =
      locale === "zh" ? RESEARCH_CONSENT.zh : RESEARCH_CONSENT.en;
    return (
      <div className="dd-post-assessment-page min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg">
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {consentData.title}
            </h2>
          </div>

          <Card className="dd-post-assessment-card border-border bg-card">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-2">
                {consentData.sections.map((section, i) => (
                  <div key={i}>
                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                      {section.heading}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed group-hover:text-foreground/80">
                    {consentData.consentCheckbox}
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <Button
                  onClick={recordConsent}
                  disabled={!consentChecked}
                  className="rounded-full w-full"
                >
                  {consentData.proceedButton}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {consentData.declineButton}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-post-assessment-page min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Anchor className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {copy.title}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {copy.subtitle}
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallProgress * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Section content */}
        <Card className="dd-post-assessment-card border-border bg-card">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SectionHeader
                  title={pickLocaleText(
                    sectionTitles[currentSection].title as {
                      en: string;
                      zh: string;
                      [key: string]: unknown;
                    },
                    locale as Locale,
                  )}
                  subtitle={pickLocaleText(
                    sectionTitles[currentSection].subtitle as {
                      en: string;
                      zh: string;
                      [key: string]: unknown;
                    },
                    locale as Locale,
                  )}
                  current={currentSectionIdx + 1}
                  total={totalSections}
                  locale={locale}
                />

                {/* Demographics section (T0 only — 4 select items) */}
                {currentSection === "demographics" && (
                  <div className="space-y-4">
                    {DEMOGRAPHIC_QUESTIONS.map((q) => {
                      const labelKey = `text_${locale}` as keyof typeof q;
                      const questionText =
                        (typeof q[labelKey] === "string" && q[labelKey]) ||
                        q.text_en;
                      return (
                        <div key={q.id} className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {questionText}
                          </label>
                          {q.type === "select" && q.options && (
                            <div className="grid gap-2">
                              {q.options.map((opt) => {
                                const optLabel =
                                  locale === "zh" ? opt.label_zh : opt.label_en;
                                const isSelected =
                                  demoResponses[q.id] === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() =>
                                      setDemoResponses((prev) => ({
                                        ...prev,
                                        [q.id]: opt.value,
                                      }))
                                    }
                                    className={`
                                      w-full text-left px-4 py-3 rounded-xl border text-sm
                                      transition-all duration-200
                                      ${
                                        isSelected
                                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                                          : "border-border bg-background hover:border-primary/30 hover:bg-primary/5 text-foreground"
                                      }
                                    `}
                                  >
                                    {optLabel}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Likert sections (SCC, CDC, Trust, Constraints) */}
                {isLikertSection &&
                  currentQuestions.length > 0 &&
                  (() => {
                    // Clamp index to valid range — defends against stale setTimeout
                    const safeIdx = Math.min(
                      currentQuestionIdx,
                      currentQuestions.length - 1,
                    );
                    const currentQ = currentQuestions[safeIdx];
                    if (!currentQ) return null;
                    return (
                      <>
                        {/* Question dots */}
                        <div className="flex justify-center gap-1.5 mb-5">
                          {currentQuestions.map((_q, i) => {
                            const q = _q as { id: string; key?: string };
                            let answered = false;
                            switch (currentSection) {
                              case "scc":
                                answered = sccResponses[q.id] !== undefined;
                                break;
                              case "cdc":
                                answered = cdcScores[q.id] !== undefined;
                                break;
                              case "ues":
                                answered = uesScores[q.id] !== undefined;
                                break;
                              case "trust":
                                answered = q.key
                                  ? trustScores[q.key] !== undefined
                                  : false;
                                break;
                              case "constraints":
                                answered = q.key
                                  ? constraintScores[q.key] !== undefined
                                  : false;
                                break;
                              case "delayed_reflection":
                                answered = q.key
                                  ? drScores[q.key] !== undefined
                                  : false;
                                break;
                            }
                            const isCurrent = i === safeIdx;
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  clearAutoAdvanceTimer();
                                  setCurrentQuestionIdx(i);
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                  isCurrent
                                    ? "bg-primary scale-125"
                                    : answered
                                      ? "bg-primary/40"
                                      : "bg-muted-foreground/20"
                                }`}
                              />
                            );
                          })}
                        </div>

                        <LikertQuestion
                          questionText={(() => {
                            const key =
                              `text_${locale}` as keyof typeof currentQ;
                            const val = currentQ[key];
                            return (
                              (typeof val === "string" && val) ||
                              currentQ.text_en
                            );
                          })()}
                          questionIndex={safeIdx}
                          totalQuestions={currentQuestions.length}
                          scaleLabels={getScaleLabels()}
                          selectedValue={getCurrentLikertValue()}
                          onSelect={(value) =>
                            handleLikertSelect(currentQ.id, value)
                          }
                        />

                        {/* Within-section navigation */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                          <button
                            onClick={() => {
                              clearAutoAdvanceTimer();
                              setCurrentQuestionIdx((prev) =>
                                Math.max(prev - 1, 0),
                              );
                            }}
                            disabled={safeIdx === 0}
                            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2"
                          >
                            {tDict.back}
                          </button>
                          {safeIdx < currentQuestions.length - 1 ? (
                            <button
                              onClick={() => {
                                clearAutoAdvanceTimer();
                                setCurrentQuestionIdx((prev) =>
                                  Math.min(
                                    prev + 1,
                                    currentQuestions.length - 1,
                                  ),
                                );
                              }}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                            >
                              {tDict.next}
                              <ArrowRight className="h-3 w-3 ml-1 inline" />
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      </>
                    );
                  })()}

                {/* Feature Attribution section */}
                {currentSection === "features" && (
                  <div className="space-y-6">
                    {/* Multi-select */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        {tDict.selectFeatures}
                      </p>
                      <div className="space-y-2">
                        {FEATURE_OPTIONS.map((feature) => {
                          const selected = selectedFeatures.includes(
                            feature.id,
                          );
                          const atMax =
                            selectedFeatures.length >= 2 && !selected;
                          return (
                            <button
                              key={feature.id}
                              onClick={() => toggleFeature(feature.id)}
                              disabled={atMax}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left
                                transition-all duration-200
                                ${
                                  selected
                                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                                    : atMax
                                      ? "border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                                      : "border-border bg-background hover:border-primary/30 hover:bg-primary/5 text-foreground"
                                }
                              `}
                            >
                              <span
                                className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }
                              `}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                              <span>
                                {getFeatureLabel(
                                  feature,
                                  locale,
                                  researchGroup,
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ranking (shown when features are selected) */}
                    {featureRanking.length > 1 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-3">
                          {tDict.rankFeatures}
                        </p>
                        <div className="space-y-1.5">
                          {featureRanking.map((featureId, index) => {
                            const feature = FEATURE_OPTIONS.find(
                              (f) => f.id === featureId,
                            );
                            if (!feature) return null;
                            return (
                              <div
                                key={featureId}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background"
                              >
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                                  {index + 1}
                                </span>
                                <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                <span className="text-sm text-foreground flex-1">
                                  {getFeatureLabel(
                                    feature,
                                    locale,
                                    researchGroup,
                                  )}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => moveFeatureUp(index)}
                                    disabled={index === 0}
                                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                                    aria-label={tDict.moveUp}
                                  >
                                    <ArrowLeft className="h-3 w-3 rotate-90" />
                                  </button>
                                  <button
                                    onClick={() => moveFeatureDown(index)}
                                    disabled={
                                      index === featureRanking.length - 1
                                    }
                                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                                    aria-label={tDict.moveDown}
                                  >
                                    <ArrowRight className="h-3 w-3 rotate-90" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Open Feedback section */}
                {currentSection === "feedback" && (
                  <div>
                    <textarea
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      placeholder={tDict.feedbackPlaceholder}
                      className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary placeholder:text-muted-foreground/60"
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {feedbackComments.length}/2000
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Section navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <button
                onClick={goPrevSection}
                disabled={currentSectionIdx === 0}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                {tDict.previousSection}
              </button>

              {isLastSection ? (
                <div className="flex flex-col items-end gap-2">
                  {submitError && (
                    <p className="text-xs text-destructive">
                      {tDict.submitFailed}
                    </p>
                  )}
                  {incompleteInfo && (
                    <p className="text-xs text-muted-foreground">
                      {interpolate(tDict.unansweredHint, {
                        count: String(incompleteInfo.count),
                      })}
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      if (incompleteInfo) {
                        clearAutoAdvanceTimer();
                        setCurrentQuestionIdx(incompleteInfo.firstIdx);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={
                      submitting ||
                      (!canProceed &&
                        !incompleteInfo &&
                        currentSection !== "feedback")
                    }
                    className="rounded-full px-6"
                    variant={
                      incompleteInfo
                        ? "outline"
                        : submitError
                          ? "destructive"
                          : "default"
                    }
                  >
                    {incompleteInfo
                      ? tDict.goToIncomplete
                      : submitting
                        ? tDict.submitting
                        : submitError
                          ? tDict.retry
                          : tDict.submit}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {incompleteInfo && (
                    <p className="text-xs text-muted-foreground">
                      {interpolate(tDict.unansweredHint, {
                        count: String(incompleteInfo.count),
                      })}
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      if (incompleteInfo) {
                        clearAutoAdvanceTimer();
                        setCurrentQuestionIdx(incompleteInfo.firstIdx);
                      } else {
                        goNextSection();
                      }
                    }}
                    disabled={!canProceed && !incompleteInfo}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    {incompleteInfo ? tDict.goToIncomplete : tDict.nextSection}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        {onSkip && (
          <div className="text-center mt-4">
            <button
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {tDict.skip}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
