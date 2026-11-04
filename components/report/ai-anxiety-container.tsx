"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { ReportDict } from "@/lib/types";
import type { AiEraPersonalInsight } from "@/lib/types/report";

interface AiAnxietyContainerProps {
  personalInsight?: AiEraPersonalInsight;
  locale: Locale;
  t: ReportDict;
}

/**
 * AiAnxietyContainer — emotional-naming preface that sits ABOVE the V1
 * AiEraOpportunities section. Three concerns kept separate by design:
 *
 * 1. Naming — mirror the user's likely worry without diagnosing it.
 * 2. Disclosure — EU AI Act defense: explicitly say this is built from
 *    test answers, not behavioral inference.
 * 3. Invitation — soft CTA into the coaching anxiety-reframing flow.
 *
 * Tiered display by the V1 adaptabilityScore so we don't prime anxiety
 * for users who don't carry it (>80 → minimal mirror, only the bridge
 * line + CTA; 60-80 → naming + bridge; <60 → full three-line mirror).
 */
export function AiAnxietyContainer({
  personalInsight,
  locale,
  t,
}: AiAnxietyContainerProps) {
  const router = useRouter();

  const coachingHref = useMemo(() => {
    // focus=ai_anxiety is redundant with from=ai-era (which already triggers
    // AI_ANXIETY_REFRAMING_PROTOCOL), but kept for analytics + future
    // sub-topic routing within the anxiety flow.
    const q = new URLSearchParams({ from: "ai-era", focus: "ai_anxiety" });
    return `/${locale}/coaching?${q.toString()}`;
  }, [locale]);

  const handleAskCoach = useCallback(() => {
    router.push(coachingHref);
  }, [router, coachingHref]);

  if (!personalInsight) return null;

  const score = personalInsight.adaptabilityScore;
  const tier: "full" | "partial" | "minimal" =
    score < 60 ? "full" : score <= 80 ? "partial" : "minimal";

  return (
    <section
      id="ai-anxiety-container"
      data-testid="ai-anxiety-container"
      data-tier={tier}
      className="mt-16 mb-4 rounded-2xl border border-border/50 bg-muted/30 dark:bg-muted/15 px-5 py-6 lg:px-7 lg:py-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/75 mb-4">
        {t.aiAnxietyEyebrow}
      </p>

      <div className="space-y-3 mb-5">
        {tier !== "minimal" && (
          <p className="text-base sm:text-[17px] leading-[1.55] text-foreground/90 m-0">
            {t.aiAnxietyMirrorLine1}
          </p>
        )}
        {tier === "full" && (
          <p className="text-sm leading-[1.6] text-foreground/70 m-0">
            {t.aiAnxietyMirrorLine2}
          </p>
        )}
        <p className="text-sm italic leading-[1.6] text-foreground/65 m-0">
          {t.aiAnxietyMirrorLine3}
        </p>
      </div>

      {tier !== "minimal" && (
        <div className="flex items-start gap-2 mb-5 px-3 py-2.5 rounded-md bg-background/60 dark:bg-background/30 border border-border/40">
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
          <p className="text-[11px] leading-[1.55] text-muted-foreground/85 m-0">
            {t.aiAnxietyDataDisclosure}
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAskCoach}
        className="h-9 px-3 -ml-3 text-[13px] font-medium gap-1.5 text-md-sea hover:text-md-sea-deep dark:hover:text-md-sea hover:bg-md-sea/10"
        data-testid="ai-anxiety-coach-cta"
      >
        <MessageCircleQuestion className="w-3.5 h-3.5" />
        {t.aiAnxietyChatCta}
      </Button>
    </section>
  );
}
