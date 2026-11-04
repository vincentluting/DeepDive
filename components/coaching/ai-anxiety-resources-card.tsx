"use client";

import { Briefcase, HeartHandshake, AlertTriangle } from "lucide-react";

interface AiAnxietyDict {
  resourcesTitle?: string;
  resourcesSubtitle?: string;
  resourcesCareerCounselor?: string;
  resourcesMentalHealthPro?: string;
  dismissExitPrompt?: string;
}

interface AiAnxietyResourcesCardProps {
  dict: AiAnxietyDict;
  /** Career counselor outbound link (provided by host page; left as anchor for analytics). */
  careerCounselorHref?: string;
  /** Mental health resource outbound link. */
  mentalHealthHref?: string;
  /** Dismiss handler (parent owns the visibility state). */
  onDismiss: () => void;
}

/**
 * AiAnxietyResourcesCard — yellow soft-escalation card.
 *
 * Surfaces when client-side anxiety keywords fire OR when LLM emits
 * <<ANXIETY_ESCALATION>>. Dual recommendation order matches plan D3:
 * career counselor first (root cause is economic identity loss, not
 * clinical pathology), mental health professional as backup. Distinct
 * from the red CRISIS card — never shown together.
 */
export function AiAnxietyResourcesCard({
  dict,
  careerCounselorHref,
  mentalHealthHref,
  onDismiss,
}: AiAnxietyResourcesCardProps) {
  return (
    <div className="border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 sm:px-6 py-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {dict.resourcesTitle}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
            {dict.resourcesSubtitle}
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            {careerCounselorHref ? (
              <a
                href={careerCounselorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 min-h-[40px]"
              >
                <Briefcase className="w-3.5 h-3.5" />
                {dict.resourcesCareerCounselor}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 min-h-[40px]">
                <Briefcase className="w-3.5 h-3.5" />
                {dict.resourcesCareerCounselor}
              </span>
            )}
            {mentalHealthHref ? (
              <a
                href={mentalHealthHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 min-h-[40px]"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                {dict.resourcesMentalHealthPro}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-amber-600/40 bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 min-h-[40px]">
                <HeartHandshake className="w-3.5 h-3.5" />
                {dict.resourcesMentalHealthPro}
              </span>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="mt-3 text-xs text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 min-h-[44px] flex items-center"
          >
            {dict.dismissExitPrompt}
          </button>
        </div>
      </div>
    </div>
  );
}
