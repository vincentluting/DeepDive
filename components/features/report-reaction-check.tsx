"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight } from "lucide-react";
import type { ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";
import { getClientId } from "@/lib/auth/client-id";

type ReactionType = "surprised" | "skeptical" | "resonates";

interface ReportReactionCheckProps {
  reportId: string;
  locale: Locale;
  t: ReportDict;
}

const REACTIONS: Array<{
  type: ReactionType;
  emoji: string;
  labelKey: string;
}> = [
  { type: "surprised", emoji: "😮", labelKey: "reactionSurprised" },
  { type: "skeptical", emoji: "🤔", labelKey: "reactionSkeptical" },
  { type: "resonates", emoji: "✨", labelKey: "reactionResonates" },
];

const FOLLOWUP_MAP: Record<
  ReactionType,
  { textKey: string; cta?: { labelKey: string; href: string } }
> = {
  surprised: {
    textKey: "reactionFollowupSurprised",
  },
  skeptical: {
    textKey: "reactionFollowupSkeptical",
    cta: { labelKey: "reactionCtaCoaching", href: "coaching" },
  },
  resonates: {
    textKey: "reactionFollowupResonates",
    cta: { labelKey: "reactionCtaPanel3", href: "pathway-section" },
  },
};

export function ReportReactionCheck({
  reportId,
  locale,
  t,
}: ReportReactionCheckProps) {
  const [selected, setSelected] = useState<ReactionType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  const handleSelect = async (reaction: ReactionType) => {
    setSelected(reaction);
    setSubmitting(true);

    try {
      // Save reaction to report
      await csrfFetch("/api/report-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, reaction }),
        credentials: "include",
      });

      // Track funnel event (non-blocking)
      analytics.track("report_reacted", { reportId, reaction }).catch(() => {});

      // Also create a coaching trigger for this reaction (non-blocking)
      csrfFetch("/api/report-reaction-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, reaction }),
        credentials: "include",
      }).catch((err) => {
        if (__DEV__)
          console.error("[ReportReactionCheck] trigger failed:", err);
      });
    } catch {
      setSubmitError(true);
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  const followup = selected ? FOLLOWUP_MAP[selected] : null;

  return (
    <section id="report-reaction" className="scroll-mt-24">
      <Card className="glass-subtle border-primary/10">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground mb-5 text-center">
            {t.reactionTitle}
          </h3>

          {/* Emoji reaction bar */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {REACTIONS.map(({ type, emoji, labelKey }) => {
              const isSelected = selected === type;
              return (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  disabled={submitting && !isSelected}
                  className={`
                    flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border text-sm font-medium
                    transition-all duration-300
                    ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20 scale-110"
                        : selected
                          ? "border-transparent bg-muted/20 text-muted-foreground opacity-40 cursor-default scale-95"
                          : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-primary/5 hover:scale-105 text-foreground cursor-pointer"
                    }
                  `}
                >
                  <span
                    className={`text-2xl transition-transform duration-300 ${isSelected ? "scale-125" : ""}`}
                  >
                    {emoji}
                  </span>
                  <span className="text-xs">{t[labelKey]}</span>
                </button>
              );
            })}
          </div>

          {/* Error message */}
          {submitError && (
            <p className="mt-4 text-center text-xs text-destructive animate-fade-in-up">
              {t.submitFailed}
            </p>
          )}

          {/* Follow-up message */}
          {followup && (
            <div className="mt-6 text-center animate-fade-in-up">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {t[followup.textKey]}
              </p>

              {followup.cta && (
                <div className="mt-4">
                  {followup.cta.href === "coaching" ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <Link href={`/${locale}/coaching`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t[followup.cta.labelKey]}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        const el =
                          document.getElementById("pathway-action-plan") ||
                          document.getElementById("realistic-directions");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {t[followup.cta.labelKey]}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
