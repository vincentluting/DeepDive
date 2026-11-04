"use client";

import { Label } from "@/components/ui/label";
import { type ProficiencyLevel, PROFICIENCY_LEVELS } from "../constants";
import type { FormData } from "../use-real-conditions-form";
import type { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface YourConstraintsStepProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleLanguage: (lang: string) => void;
  updateProficiency: (lang: string, proficiency: ProficiencyLevel) => void;
  locale: string;
  t: ReturnType<typeof getDictionaryClient>["realityConditions"];
}

const BASE_LANGUAGES = [
  "Arabic",
  "Chinese",
  "Dutch",
  "English",
  "French",
  "German",
  "Italian",
  "Japanese",
  "Korean",
  "Portuguese",
  "Spanish",
] as const;

// Map locale to its corresponding language card so the user's language comes first
const LOCALE_TO_LANG: Record<string, string> = {
  zh: "Chinese",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  nl: "Dutch",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ar: "Arabic",
};

function getOrderedLanguages(locale: string): string[] {
  const localeLang = LOCALE_TO_LANG[locale];
  const rest = BASE_LANGUAGES.filter((l) => l !== localeLang);
  return [...(localeLang ? [localeLang] : []), ...rest, "Other"];
}

const SALARY_FLOOR_OPTIONS = ["critical", "important", "flexible"] as const;
const RETRAIN_OPTIONS = ["yes", "somewhat", "no"] as const;

export function YourConstraintsStep({
  form,
  updateForm,
  toggleLanguage,
  updateProficiency,
  locale,
  t,
}: YourConstraintsStepProps) {
  const languageCards = getOrderedLanguages(locale);
  const getProficiencyLabel = (level: ProficiencyLevel): string => {
    return (t[`proficiency_${level}` as keyof typeof t] as string) || level;
  };

  // Check if English is selected for showing proficiency level
  const hasEnglish = form.workLanguages.some((wl) => wl.language === "English");

  return (
    <div className="space-y-6">
      {/* Work Languages — multi-select cards */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.workLanguages}</Label>
        <div className="grid grid-cols-3 gap-2">
          {languageCards.map((lang) => {
            const selected = form.workLanguages.some(
              (wl) => wl.language === lang,
            );
            const key = `lang_${lang}` as keyof typeof t;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t[key] as string) || lang}
              </button>
            );
          })}
        </div>
        {form.workLanguages.length === 0 && (
          <p className="text-xs text-destructive">{t.languagesRequired}</p>
        )}
      </div>

      {/* English proficiency (conditional) */}
      {hasEnglish && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t.englishProficiency}</Label>
          <div className="grid grid-cols-2 gap-2">
            {PROFICIENCY_LEVELS.map((level) => {
              const englishEntry = form.workLanguages.find(
                (wl) => wl.language === "English",
              );
              const selected = englishEntry?.proficiency === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateProficiency("English", level)}
                  className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  {getProficiencyLabel(level)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Has Partner */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.hasPartnerLabel}</Label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((val) => {
            const selected = form.hasPartner === val;
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => {
                  updateForm("hasPartner", val);
                  if (!val) updateForm("partnerWorkRestriction", false);
                }}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {val ? t.yes : t.no}
              </button>
            );
          })}
        </div>
      </div>

      {/* Partner work restriction (conditional) */}
      {form.hasPartner && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t.partnerRestrictionLabel}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((val) => {
              const selected = form.partnerWorkRestriction === val;
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => updateForm("partnerWorkRestriction", val)}
                  className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  {val ? t.yes : t.no}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Salary Floor */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.salaryFloorLabel}</Label>
        <div className="grid grid-cols-3 gap-2">
          {SALARY_FLOOR_OPTIONS.map((option) => {
            const selected = form.salaryFloor === option;
            const key = `salaryFloor_${option}` as keyof typeof t;
            return (
              <button
                key={option}
                type="button"
                onClick={() => updateForm("salaryFloor", option)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t[key] as string) || option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Willing to Retrain */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.willingToRetrainLabel}</Label>
        <div className="grid grid-cols-3 gap-2">
          {RETRAIN_OPTIONS.map((option) => {
            const selected = form.willingToRetrain === option;
            const key = `retrain_${option}` as keyof typeof t;
            return (
              <button
                key={option}
                type="button"
                onClick={() => updateForm("willingToRetrain", option)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t[key] as string) || option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
