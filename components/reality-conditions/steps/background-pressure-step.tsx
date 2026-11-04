"use client";

import { Label } from "@/components/ui/label";
import { INDUSTRIES, getIndustryLabelByLocale } from "@/lib/constants/industries";
import type { FormData } from "../use-real-conditions-form";
import type { Locale } from "@/lib/i18n/config";
import type { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface BackgroundPressureStepProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleArrayItem: (key: keyof FormData, item: string) => void;
  locale: Locale;
  t: ReturnType<typeof getDictionaryClient>["realityConditions"];
}

const EXPERIENCE_RANGES = ["0-2", "3-5", "6-10", "10+"] as const;
const EXTERNAL_PRESSURE_OPTIONS = ["high", "medium", "low", "none"] as const;
const CAREER_CHANGE_OPTIONS = ["exploring", "considering", "urgent"] as const;

export function BackgroundPressureStep({
  form,
  updateForm,
  toggleArrayItem,
  locale,
  t,
}: BackgroundPressureStepProps) {
  const showExpectationNote =
    form.externalExpectationPressure === "high" ||
    form.externalExpectationPressure === "medium";

  return (
    <div className="space-y-6">
      {/* Current Industry — structured dropdown */}
      <div className="space-y-2">
        <Label htmlFor="current-industry" className="text-sm font-medium">
          {t.industryBackgroundLabel}
        </Label>
        <select
          id="current-industry"
          value={form.currentIndustry}
          onChange={(e: { target: { value: string } }) =>
            updateForm("currentIndustry", e.target.value)
          }
          className="w-full min-h-[50px] rounded-xl border border-input bg-background px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t.selectIndustry}</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {getIndustryLabelByLocale(ind, locale)}
            </option>
          ))}
        </select>
      </div>

      {/* Years of Experience — card select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.experienceYears}</Label>
        <div className="grid grid-cols-4 gap-2">
          {EXPERIENCE_RANGES.map((range) => {
            const selected = form.experienceYears === range;
            const key = `exp_${range}` as keyof typeof t;
            return (
              <button
                key={range}
                type="button"
                onClick={() => updateForm("experienceYears", range)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t[key] as string) || range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interested Industries — multi-select chips */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t.interestedIndustries}
          <span className="text-muted-foreground font-normal ml-1">
            {t.optional}
          </span>
        </Label>
        <p className="text-xs text-muted-foreground">
          {(t as Record<string, string>).interestedIndustriesHint}
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Recommend for me option */}
          <button
            type="button"
            onClick={() => {
              if (form.interestedIndustries.includes("recommend_for_me")) {
                toggleArrayItem("interestedIndustries", "recommend_for_me");
              } else {
                updateForm("interestedIndustries", ["recommend_for_me"]);
              }
            }}
            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
              form.interestedIndustries.includes("recommend_for_me")
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border hover:bg-muted/30"
            }`}
          >
            {t.recommendForMe}
          </button>
          {INDUSTRIES.map((ind) => {
            const selected = form.interestedIndustries.includes(ind.id);
            const isRecommendMode =
              form.interestedIndustries.includes("recommend_for_me");
            const atLimit =
              form.interestedIndustries.filter((i) => i !== "recommend_for_me")
                .length >= 5;
            return (
              <button
                key={ind.id}
                type="button"
                disabled={isRecommendMode || (!selected && atLimit)}
                onClick={() => {
                  // If "recommend_for_me" is selected, clear it and select this one
                  if (isRecommendMode) {
                    updateForm("interestedIndustries", [ind.id]);
                  } else {
                    toggleArrayItem("interestedIndustries", ind.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : isRecommendMode
                      ? "border-border opacity-40 cursor-not-allowed"
                      : atLimit
                        ? "border-border opacity-40 cursor-not-allowed"
                        : "border-border hover:bg-muted/30"
                }`}
              >
                {getIndustryLabelByLocale(ind, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Career Change Urgency — 3 cards */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {(t as Record<string, string>).careerChangeUrgencyLabel}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {CAREER_CHANGE_OPTIONS.map((option) => {
            const selected = form.careerChangeUrgency === option;
            const key = `urgency_${option}` as string;
            return (
              <button
                key={option}
                type="button"
                onClick={() => updateForm("careerChangeUrgency", option)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t as Record<string, string>)[key] || option}
              </button>
            );
          })}
        </div>
      </div>

      {/* External Expectation Pressure — 4 cards */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {(t as Record<string, string>).externalPressureLabel}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {EXTERNAL_PRESSURE_OPTIONS.map((option) => {
            const selected = form.externalExpectationPressure === option;
            const key = `pressure_${option}` as keyof typeof t;
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateForm("externalExpectationPressure", option)
                }
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

      {/* External Expectation Note (conditional) */}
      {showExpectationNote && (
        <div className="space-y-2">
          <Label
            htmlFor="external-expectation-note"
            className="text-sm font-medium"
          >
            {(t as Record<string, string>).externalExpectationNoteLabel}{" "}
            <span className="text-muted-foreground font-normal">
              {t.optional}
            </span>
          </Label>
          <input
            id="external-expectation-note"
            type="text"
            value={form.externalExpectationNote}
            onChange={(e: { target: { value: string } }) =>
              updateForm("externalExpectationNote", e.target.value.slice(0, 80))
            }
            placeholder={
              (t as Record<string, string>).externalExpectationNotePlaceholder
            }
            maxLength={80}
            className="w-full min-h-[50px] rounded-xl border border-input bg-background px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.externalExpectationNote.length}/80
          </p>
        </div>
      )}
    </div>
  );
}
