"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings, Check } from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { reportClientError } from "@/lib/observability/client-error";

interface PersonaValues {
  coachingStyle: "supportive" | "balanced" | "challenging";
  communicationStyle: "warm" | "professional";
  responseDetail: "brief" | "balanced" | "thorough";
}

interface CoachPersonaSettingsProps {
  locale: string;
  initialValues?: PersonaValues | null;
  onSave?: (values: PersonaValues) => void;
}

type LabelMap = Record<string, string>;

const LABELS: Record<string, LabelMap> = {
  title: {
    en: "Coach Style",
    zh: "教练风格",
    nl: "Coachstijl",
    de: "Coaching-Stil",
    fr: "Style de coaching",
    es: "Estilo de coaching",
    pt: "Estilo de coaching",
    it: "Stile di coaching",
    ru: "Стиль коучинга",
    ja: "コーチスタイル",
    ko: "코칭 스타일",
  },
  close: {
    en: "Close coach style",
    zh: "关闭教练风格",
    nl: "Coachstijl sluiten",
    de: "Coaching-Stil schließen",
    fr: "Fermer le style de coaching",
    es: "Cerrar estilo de coach",
    pt: "Fechar estilo do coach",
    it: "Chiudi stile coach",
    ru: "Закрыть стиль коуча",
    ja: "コーチスタイルを閉じる",
    ko: "코치 스타일 닫기",
  },
  coachingStyle: {
    en: "Coaching Approach",
    zh: "教练方式",
    nl: "Aanpak",
    de: "Ansatz",
    fr: "Approche",
    es: "Enfoque",
    pt: "Abordagem",
    it: "Approccio",
    ru: "Подход",
    ja: "アプローチ",
    ko: "접근 방식",
  },
  supportive: {
    en: "Supportive",
    zh: "温暖支持",
    nl: "Ondersteunend",
    de: "Unterstützend",
    fr: "Bienveillant",
    es: "Comprensivo",
    pt: "Acolhedor",
    it: "Empatico",
    ru: "Поддерживающий",
    ja: "サポート型",
    ko: "지지형",
  },
  balanced: {
    en: "Balanced",
    zh: "平衡",
    nl: "Gebalanceerd",
    de: "Ausgewogen",
    fr: "Équilibré",
    es: "Equilibrado",
    pt: "Equilibrado",
    it: "Equilibrato",
    ru: "Сбалансированный",
    ja: "バランス型",
    ko: "균형형",
  },
  challenging: {
    en: "Direct",
    zh: "直接挑战",
    nl: "Direct",
    de: "Direkt",
    fr: "Direct",
    es: "Directo",
    pt: "Direto",
    it: "Diretto",
    ru: "Прямой",
    ja: "直接型",
    ko: "직접형",
  },
  communicationStyle: {
    en: "Communication",
    zh: "沟通风格",
    nl: "Communicatie",
    de: "Kommunikation",
    fr: "Communication",
    es: "Comunicación",
    pt: "Comunicação",
    it: "Comunicazione",
    ru: "Коммуникация",
    ja: "コミュニケーション",
    ko: "소통 방식",
  },
  warm: {
    en: "Warm",
    zh: "温暖",
    nl: "Warm",
    de: "Warmherzig",
    fr: "Chaleureux",
    es: "Cálido",
    pt: "Caloroso",
    it: "Caloroso",
    ru: "Тёплый",
    ja: "温かい",
    ko: "따뜻한",
  },
  professional: {
    en: "Structured",
    zh: "结构化",
    nl: "Gestructureerd",
    de: "Strukturiert",
    fr: "Structuré",
    es: "Estructurado",
    pt: "Estruturado",
    it: "Strutturato",
    ru: "Структурированный",
    ja: "体系的",
    ko: "체계적",
  },
  responseDetail: {
    en: "Detail Level",
    zh: "回复详略",
    nl: "Detailniveau",
    de: "Detailgrad",
    fr: "Niveau de détail",
    es: "Nivel de detalle",
    pt: "Nível de detalhe",
    it: "Livello di dettaglio",
    ru: "Уровень детализации",
    ja: "詳細度",
    ko: "상세 수준",
  },
  brief: {
    en: "Brief",
    zh: "简短",
    nl: "Kort",
    de: "Kurz",
    fr: "Bref",
    es: "Breve",
    pt: "Breve",
    it: "Breve",
    ru: "Кратко",
    ja: "簡潔",
    ko: "간결",
  },
  thorough: {
    en: "Thorough",
    zh: "详尽",
    nl: "Uitgebreid",
    de: "Ausführlich",
    fr: "Détaillé",
    es: "Detallado",
    pt: "Detalhado",
    it: "Approfondito",
    ru: "Подробно",
    ja: "詳細",
    ko: "상세",
  },
  saved: {
    en: "Saved",
    zh: "已保存",
    nl: "Opgeslagen",
    de: "Gespeichert",
    fr: "Enregistré",
    es: "Guardado",
    pt: "Salvo",
    it: "Salvato",
    ru: "Сохранено",
    ja: "保存済み",
    ko: "저장됨",
  },
  savePreferences: {
    en: "Save preferences",
    zh: "保存偏好",
    nl: "Voorkeuren opslaan",
    de: "Einstellungen speichern",
    fr: "Enregistrer",
    es: "Guardar preferencias",
    pt: "Salvar preferências",
    it: "Salva preferenze",
    ru: "Сохранить настройки",
    ja: "設定を保存",
    ko: "설정 저장",
  },
};

type LabelKey = keyof typeof LABELS;

function t(locale: string, key: LabelKey): string {
  const map = LABELS[key];
  if (!map) return String(key);
  return map[locale] ?? map.en ?? String(key);
}

function TripleToggle({
  value,
  options,
  locale,
  onChange,
}: {
  value: string;
  options: [LabelKey, LabelKey, LabelKey];
  locale: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted/50 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`min-h-10 flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
            value === opt
              ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(locale, opt)}
        </button>
      ))}
    </div>
  );
}

function DualToggle({
  value,
  options,
  locale,
  onChange,
}: {
  value: string;
  options: [LabelKey, LabelKey];
  locale: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted/50 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`min-h-10 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt
              ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(locale, opt)}
        </button>
      ))}
    </div>
  );
}

export function CoachPersonaSettings({
  locale,
  initialValues,
  onSave,
}: CoachPersonaSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<PersonaValues>(
    initialValues ?? {
      coachingStyle: "balanced",
      communicationStyle: "warm",
      responseDetail: "balanced",
    },
  );

  const handleChange = useCallback((key: keyof PersonaValues, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await csrfFetch("/api/coach-persona", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSaved(true);
      onSave?.(values);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      // #128: don't swallow silently — a failed persona save otherwise looks
      // like success to observability/PM. Report (dev console + prod Sentry).
      reportClientError(error, {
        component: "CoachPersonaSettings",
        feature: "coach-persona",
        level: "warning",
      });
    }
  }, [values, onSave]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        aria-label={t(locale, "title")}
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border px-4 py-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t(locale, "title")}
        </h4>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[14px] text-muted-foreground/60 hover:bg-muted hover:text-foreground"
          aria-label={t(locale, "close")}
        >
          ×
        </button>
      </div>

      {/* Coaching Style */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1 block">
          {t(locale, "coachingStyle")}
        </label>
        <TripleToggle
          value={values.coachingStyle}
          options={["supportive", "balanced", "challenging"]}
          locale={locale}
          onChange={(v) => handleChange("coachingStyle", v)}
        />
      </div>

      {/* Communication Style */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1 block">
          {t(locale, "communicationStyle")}
        </label>
        <DualToggle
          value={values.communicationStyle}
          options={["warm", "professional"]}
          locale={locale}
          onChange={(v) => handleChange("communicationStyle", v)}
        />
      </div>

      {/* Response Detail */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1 block">
          {t(locale, "responseDetail")}
        </label>
        <TripleToggle
          value={values.responseDetail}
          options={["brief", "balanced", "thorough"]}
          locale={locale}
          onChange={(v) => handleChange("responseDetail", v)}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`min-h-10 w-full rounded-lg px-3 py-2 text-xs font-medium transition-all ${
          saved
            ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30"
            : "bg-muted/50 text-muted-foreground hover:bg-white/10 border border-border"
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {t(locale, "saved")}
          </span>
        ) : (
          t(locale, "savePreferences")
        )}
      </button>
    </motion.div>
  );
}
