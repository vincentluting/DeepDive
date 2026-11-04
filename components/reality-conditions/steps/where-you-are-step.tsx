"use client";

import { Label } from "@/components/ui/label";
import { CountryCombobox } from "../country-combobox";
import type { FormData } from "../use-real-conditions-form";
import type { Locale } from "@/lib/i18n/config";
import type { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface WhereYouAreStepProps {
  form: FormData;
  updateForm: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  locale: Locale;
  t: ReturnType<typeof getDictionaryClient>["realityConditions"];
}

const VISA_STATUSES = [
  "citizen",
  "permanent_resident",
  "work_visa",
  "student_visa",
  "job_seeker_visa",
  "dependent_visa",
  "undocumented",
  "other",
] as const;

const LOCATION_FLEXIBILITY = [
  "stay-local",
  "relocate-home",
  "relocate-other",
  "remote-global",
  "open",
] as const;
const RELOCATION_TIMELINES = [
  "1year",
  "2-3years",
  "5years",
  "indefinite",
] as const;

export function WhereYouAreStep({
  form,
  updateForm,
  locale,
  t,
}: WhereYouAreStepProps) {
  const needsVisaType =
    form.visaStatus &&
    form.visaStatus !== "citizen" &&
    form.visaStatus !== "permanent_resident";
  const showRelocationTimeline =
    form.locationFlexibility === "relocate-home" ||
    form.locationFlexibility === "relocate-other";

  return (
    <div className="space-y-6">
      {/* Current Country */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t.currentCountry}</Label>
        <CountryCombobox
          value={form.currentCountry}
          onChange={(code) => updateForm("currentCountry", code)}
          placeholder={t.countryPlaceholder}
          locale={locale}
          t={t as Record<string, string>}
        />
        {!form.currentCountry && (
          <p className="text-xs text-destructive">{t.countryRequired}</p>
        )}
      </div>

      {/* Visa Status — Card selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t.visaStatus}</Label>
        <div className="grid grid-cols-2 gap-2">
          {VISA_STATUSES.map((status) => {
            const selected = form.visaStatus === status;
            const key = `visa_${status}` as keyof typeof t;
            return (
              <button
                key={status}
                type="button"
                onClick={() => updateForm("visaStatus", status)}
                className={`p-3 min-h-[50px] rounded-xl border text-sm text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                {(t[key] as string) || status}
              </button>
            );
          })}
        </div>
        {!form.visaStatus && (
          <p className="text-xs text-destructive">{t.visaRequired}</p>
        )}
      </div>

      {/* Visa Type — text input (conditional) */}
      {needsVisaType && (
        <div className="space-y-2">
          <Label htmlFor="visa-type" className="text-sm font-medium">
            {t.visaTypeLabel}{" "}
            <span className="text-muted-foreground font-normal">
              {t.optional}
            </span>
          </Label>
          <input
            id="visa-type"
            type="text"
            value={form.visaType}
            onChange={(e: { target: { value: string } }) =>
              updateForm("visaType", e.target.value)
            }
            placeholder={t.visaTypePlaceholder}
            maxLength={100}
            className="w-full min-h-[50px] rounded-xl border border-input bg-background px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Sponsorship Required */}
      {needsVisaType && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t.sponsorshipRequired}</Label>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((val) => {
              const selected = form.sponsorshipRequired === val;
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => updateForm("sponsorshipRequired", val)}
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

      {/* Location Flexibility */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {(t as Record<string, string>).locationFlexibility}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {LOCATION_FLEXIBILITY.map((option) => {
            const selected = form.locationFlexibility === option;
            const key = `locationFlexibility_${option}` as string;
            return (
              <button
                key={option}
                type="button"
                onClick={() => updateForm("locationFlexibility", option)}
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

      {/* Relocation Timeline (conditional) */}
      {showRelocationTimeline && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {(t as Record<string, string>).relocationTimelineLabel}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {RELOCATION_TIMELINES.map((timeline) => {
              const selected = form.relocationTimeline === timeline;
              const key = `relocationTimeline_${timeline}` as string;
              return (
                <button
                  key={timeline}
                  type="button"
                  onClick={() => updateForm("relocationTimeline", timeline)}
                  className={`p-3 min-h-[50px] rounded-xl border text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  {(t as Record<string, string>)[key] || timeline}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
