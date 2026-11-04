const __DEV__ = process.env.NODE_ENV === "development";

import { useState, useEffect, useCallback } from "react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import type { RealConditions } from "@/lib/types";
import { type ProficiencyLevel, TOTAL_STEPS } from "./constants";

export type FormData = {
  // Step 1 — Where you are
  currentCountry: string;
  visaStatus: RealConditions["visaStatus"];
  visaType: string;
  sponsorshipRequired: boolean;
  locationFlexibility: RealConditions["locationFlexibility"];
  relocationTimeline: RealConditions["relocationTimeline"] | "";

  // Step 2 — Your constraints
  workLanguages: Array<{ language: string; proficiency: ProficiencyLevel }>;
  hasPartner: boolean;
  partnerWorkRestriction: boolean;
  salaryFloor: "critical" | "important" | "flexible" | "";
  willingToRetrain: "yes" | "somewhat" | "no" | "";

  // Step 3 — Background & career direction
  currentIndustry: string;
  industryBackground: string;
  experienceYears: "0-2" | "3-5" | "6-10" | "10+" | "";
  interestedIndustries: string[];
  careerChangeUrgency: "exploring" | "considering" | "urgent" | "";
  externalExpectationPressure: "high" | "medium" | "low" | "none" | "";
  externalExpectationNote: string;

  // Legacy fields kept for backward compat in formDataToConditions
  educationLevel: RealConditions["education"]["level"];
  educationField: string;
  pastIndustries: string[];
  currentCity: string;
  targetCountry: string;
  targetCities: string[];
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  workType: RealConditions["workType"];
  officeMode: RealConditions["officeMode"];
  openToCareerChange: RealConditions["openToCareerChange"];
};

function getDefaultFormData(): FormData {
  return {
    // Step 1
    currentCountry: "",
    visaStatus: "",
    visaType: "",
    sponsorshipRequired: false,
    locationFlexibility: "open",
    relocationTimeline: "",

    // Step 2
    workLanguages: [],
    hasPartner: false,
    partnerWorkRestriction: false,
    salaryFloor: "",
    willingToRetrain: "",

    // Step 3
    currentIndustry: "",
    industryBackground: "",
    experienceYears: "",
    interestedIndustries: [],
    careerChangeUrgency: "",
    externalExpectationPressure: "",
    externalExpectationNote: "",

    // Legacy defaults
    educationLevel: "bachelor",
    educationField: "",
    pastIndustries: [],
    currentCity: "",
    targetCountry: "",
    targetCities: [],
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: "USD",
    workType: "open",
    officeMode: "open",
    openToCareerChange: "open",
  };
}

function experienceYearsToNumber(range: string): number {
  switch (range) {
    case "0-2":
      return 1;
    case "3-5":
      return 4;
    case "6-10":
      return 8;
    case "10+":
      return 15;
    default:
      return 0;
  }
}

function numberToExperienceRange(years: number): FormData["experienceYears"] {
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 10) return "6-10";
  if (years > 10) return "10+";
  return "";
}

function conditionsToFormData(c: RealConditions): FormData {
  // Backward compat: handle old string[] format for workLanguages
  const workLanguages: FormData["workLanguages"] = Array.isArray(
    c.workLanguages,
  )
    ? c.workLanguages.map((item) => {
        if (typeof item === "string") {
          return {
            language: item,
            proficiency: "professional" as ProficiencyLevel,
          };
        }
        return item as { language: string; proficiency: ProficiencyLevel };
      })
    : [];

  return {
    // Step 1
    currentCountry: c.currentCountry || "",
    visaStatus: c.visaStatus || "",
    visaType: c.visaType || "",
    sponsorshipRequired: c.workRestrictions?.sponsorshipRequired ?? false,
    locationFlexibility: c.locationFlexibility || "open",
    relocationTimeline: c.relocationTimeline || "",

    // Step 2
    workLanguages,
    hasPartner: c.familyConstraints?.hasPartner ?? false,
    partnerWorkRestriction:
      c.familyConstraints?.partnerWorkRestriction ?? false,
    salaryFloor: c.economicConstraints?.salaryFloor || "",
    willingToRetrain:
      c.economicConstraints?.willingToRetrain === false
        ? "no"
        : c.economicConstraints?.willingToRetrain === true
          ? "yes"
          : "",

    // Step 3
    currentIndustry: c.currentIndustry || "",
    industryBackground: c.industryBackground || "",
    experienceYears: c.experienceYears
      ? numberToExperienceRange(c.experienceYears)
      : "",
    interestedIndustries: c.interestedIndustries || [],
    careerChangeUrgency: c.careerChangeUrgency || "",
    externalExpectationPressure:
      c.culturalIdentity?.externalExpectationPressure || "",
    externalExpectationNote: c.culturalIdentity?.externalExpectationNote || "",

    // Legacy
    educationLevel: c.education.level,
    educationField: c.education.field,
    pastIndustries: c.pastIndustries,
    currentCity: c.currentCity,
    targetCountry: c.targetCountry || "",
    targetCities: c.targetCities,
    salaryMin: c.salaryRange.min,
    salaryMax: c.salaryRange.max,
    salaryCurrency: c.salaryRange.currency,
    workType: c.workType,
    officeMode: c.officeMode,
    openToCareerChange: c.openToCareerChange,
  };
}

function formDataToConditions(d: FormData): RealConditions {
  return {
    education: { level: d.educationLevel, field: d.educationField },
    experienceYears: experienceYearsToNumber(d.experienceYears),
    pastIndustries: d.pastIndustries,
    currentCountry: d.currentCountry || undefined,
    currentCity: d.currentCity,
    targetCountry: d.targetCountry || undefined,
    targetCities: d.targetCities,
    visaStatus: d.visaStatus || "",
    visaType: d.visaType || undefined,
    workRestrictions: {
      canWorkFullTime:
        d.visaStatus === "citizen" ||
        d.visaStatus === "permanent_resident" ||
        d.visaStatus === "work_visa" ||
        d.visaStatus === "",
      sponsorshipRequired: d.sponsorshipRequired,
      occupationRestricted: false,
    },
    workLanguages: d.workLanguages.map((wl) => ({
      language: wl.language,
      proficiency: wl.proficiency,
    })),
    locationFlexibility: d.locationFlexibility,
    relocationTimeline: d.relocationTimeline || undefined,
    familyConstraints: {
      hasPartner: d.hasPartner,
      partnerWorkRestriction: d.partnerWorkRestriction,
      hasDependents: false,
    },
    economicConstraints: {
      salaryFloor: d.salaryFloor || undefined,
      canRelocate: true,
      willingToRetrain:
        d.willingToRetrain === "yes" || d.willingToRetrain === "somewhat",
    },
    salaryRange: {
      min: d.salaryMin,
      max: d.salaryMax,
      currency: d.salaryCurrency,
    },
    workType: d.workType,
    officeMode: d.officeMode,
    currentIndustry: d.currentIndustry || undefined,
    industrySatisfaction: undefined,
    careerChangeUrgency: d.careerChangeUrgency || undefined,
    interestedIndustries: d.interestedIndustries,
    openToCareerChange: d.openToCareerChange,
    industryBackground: d.industryBackground || undefined,
    culturalIdentity: {
      externalExpectationPressure: (d.externalExpectationPressure ||
        "none") as RealConditions["culturalIdentity"]["externalExpectationPressure"],
      externalExpectationNote: d.externalExpectationNote || undefined,
    },
  };
}

interface UseRealConditionsFormOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  locale: Locale;
  existingConditions?: RealConditions | null;
  onSuccess?: () => void;
}

export function useRealConditionsForm({
  open,
  onOpenChange,
  sessionId,
  locale,
  existingConditions,
  onSuccess,
}: UseRealConditionsFormOptions) {
  const t = getDictionaryClient(locale).realityConditions;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(getDefaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize form with existing conditions
  useEffect(() => {
    if (existingConditions) {
      setForm(conditionsToFormData(existingConditions));
    }
  }, [existingConditions]);

  // Reset step when form opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setError("");
    }
  }, [open]);

  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev: FormData) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleArrayItem = useCallback((key: keyof FormData, item: string) => {
    setForm((prev: FormData) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(item)
          ? arr.filter((i: string) => i !== item)
          : [...arr, item],
      };
    });
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setForm((prev: FormData) => {
      const exists = prev.workLanguages.find((wl) => wl.language === lang);
      if (exists) {
        return {
          ...prev,
          workLanguages: prev.workLanguages.filter(
            (wl) => wl.language !== lang,
          ),
        };
      }
      return {
        ...prev,
        workLanguages: [
          ...prev.workLanguages,
          { language: lang, proficiency: "professional" as ProficiencyLevel },
        ],
      };
    });
  }, []);

  const updateProficiency = useCallback(
    (lang: string, proficiency: ProficiencyLevel) => {
      setForm((prev: FormData) => ({
        ...prev,
        workLanguages: prev.workLanguages.map((wl) =>
          wl.language === lang ? { ...wl, proficiency } : wl,
        ),
      }));
    },
    [],
  );

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!form.currentCountry && !!form.visaStatus;
      case 2:
        return form.workLanguages.length > 0;
      default:
        return true;
    }
  };

  const canGoNext = validateStep(step);

  const goNext = () => {
    if (step < TOTAL_STEPS && canGoNext) {
      setStep((s: number) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((s: number) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setIsSaving(true);
    try {
      const conditions = formDataToConditions(form);
      const payload = {
        sessionId,
        userId: null,
        conditions,
      };

      // Attempt fetch, with CSRF token refresh on 403
      let res = await csrfFetch("/api/reality-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If CSRF token was missing/expired, refresh and retry once
      if (res.status === 403) {
        await fetch("/", { method: "GET", credentials: "same-origin" });
        res = await csrfFetch("/api/reality-conditions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Show specific field errors from Zod validation
        if (
          data.details &&
          Array.isArray(data.details) &&
          data.details.length > 0
        ) {
          const fieldMsg = data.details
            .map(
              (d: { path?: string; message?: string }) => d.message || d.path,
            )
            .filter(Boolean)
            .join("; ");
          setError(fieldMsg || t.saveFailed);
        } else {
          // Always use i18n translation for server errors, never raw API strings
          setError(t.saveFailed);
        }
        if (data.debug) {
          if (__DEV__)
            console.warn("[reality-conditions] Server debug:", data.debug);
        }
        return;
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError(t.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBracketSelect = (bracket: { min: number; max: number }) => {
    setForm((prev: FormData) => ({
      ...prev,
      salaryMin: bracket.min,
      salaryMax: bracket.max,
    }));
  };

  const handleCurrencyChange = (newCurrency: string) => {
    // When currency changes, reset salary selection since brackets differ
    setForm((prev: FormData) => ({
      ...prev,
      salaryCurrency: newCurrency,
      salaryMin: 0,
      salaryMax: 0,
    }));
  };

  return {
    step,
    form,
    isSaving,
    error,
    canGoNext,
    updateForm,
    toggleArrayItem,
    toggleLanguage,
    updateProficiency,
    goNext,
    goBack,
    handleSubmit,
    handleBracketSelect,
    handleCurrencyChange,
    t,
  };
}
