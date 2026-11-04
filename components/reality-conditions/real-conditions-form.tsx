"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  ShieldAlert,
  User,
  RefreshCw,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { RealConditions } from "@/lib/types";
import { TOTAL_STEPS } from "./constants";
import { useRealConditionsForm } from "./use-real-conditions-form";
import { StepIndicator } from "./step-indicator";
import { WhereYouAreStep } from "./steps/where-you-are-step";
import { YourConstraintsStep } from "./steps/your-constraints-step";
import { BackgroundPressureStep } from "./steps/background-pressure-step";

interface RealConditionsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  locale: Locale;
  existingConditions?: RealConditions | null;
  onSuccess?: () => void;
  onSkip?: () => void;
}

const stepIcons = [MapPin, ShieldAlert, User];

export function RealConditionsForm({
  open,
  onOpenChange,
  sessionId,
  locale,
  existingConditions,
  onSuccess,
  onSkip,
}: RealConditionsFormProps) {
  const hook = useRealConditionsForm({
    open,
    onOpenChange,
    sessionId,
    locale,
    existingConditions,
    onSuccess,
  });
  const {
    step,
    form,
    isSaving,
    error,
    canGoNext,
    goNext,
    goBack,
    handleSubmit,
    t,
  } = hook;
  const a11y = getDictionaryClient(locale).a11y;
  const stepLabels = [
    t.stepWhereYouAre,
    t.stepYourConstraints,
    t.stepBackgroundPressure,
  ];
  const CurrentStepIcon = stepIcons[step - 1];

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <WhereYouAreStep
            form={form}
            updateForm={hook.updateForm}
            locale={locale}
            t={t}
          />
        );
      case 2:
        return (
          <YourConstraintsStep
            form={form}
            updateForm={hook.updateForm}
            toggleLanguage={hook.toggleLanguage}
            updateProficiency={hook.updateProficiency}
            locale={locale}
            t={t}
          />
        );
      case 3:
        return (
          <BackgroundPressureStep
            form={form}
            updateForm={hook.updateForm}
            toggleArrayItem={hook.toggleArrayItem}
            locale={locale}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl overflow-y-auto flex flex-col"
        closeLabel={a11y.close}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CurrentStepIcon className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="px-6 py-4 flex-shrink-0">
          <StepIndicator
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            labels={stepLabels}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-20">
          {renderCurrentStep()}
        </div>
        {error && (
          <div className="px-6 py-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-destructive">{error}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t.retry}
                </button>
                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {t.skipForNow}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div
          className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--background) 30%)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
            className="rounded-full min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.back}
          </Button>
          <span className="text-xs text-muted-foreground">
            {step} / {TOTAL_STEPS}
          </span>
          {step < TOTAL_STEPS ? (
            <Button
              onClick={goNext}
              disabled={!canGoNext}
              className="rounded-full min-h-[44px]"
            >
              {t.continue}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="rounded-full min-h-[44px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t.generateReport}
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
