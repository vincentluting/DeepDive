"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface ReportNPSProps {
  reportId: string;
  locale: Locale;
}

const SCORE_COLORS: Record<number, string> = {
  1: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  2: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  3: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  4: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  5: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  6: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  7: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  8: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  9: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
  10: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
};

const HOVER_COLORS: Record<string, string> = {
  amber: "hover:bg-amber-500/15 hover:border-amber-500/30",
  blue: "hover:bg-blue-500/15 hover:border-blue-500/30",
  emerald: "hover:bg-emerald-500/15 hover:border-emerald-500/30",
};

function getHoverColor(score: number): string {
  if (score <= 6) return HOVER_COLORS.amber;
  if (score <= 8) return HOVER_COLORS.blue;
  return HOVER_COLORS.emerald;
}

export function ReportNPS({ reportId, locale }: ReportNPSProps) {
  const [visible, setVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [pmfResponse, setPmfResponse] = useState<string | null>(null);
  const [pmfSubmitted, setPmfSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dict = getDictionaryClient(locale);
  const t = dict.reportPanels || {};

  const npsTitle = t.npsTitle;
  const npsLow = t.npsLow;
  const npsMid = t.npsMid;
  const npsHigh = t.npsHigh;
  const npsFeedbackLabel = t.npsFeedbackLabel;
  const npsFeedbackPlaceholder = t.npsFeedbackPlaceholder;
  const npsSubmit = t.npsSubmit;
  const npsThanks = t.npsThanks;
  const npsThanksDetail = t.npsThanksDetail;
  const pmfQuestion = t.pmfQuestion;
  const pmfVeryDisappointed = t.pmfVeryDisappointed;
  const pmfSomewhatDisappointed = t.pmfSomewhatDisappointed;
  const pmfNotDisappointed = t.pmfNotDisappointed;
  const pmfThanks = t.pmfThanks;

  // Check if already rated
  useEffect(() => {
    csrfFetch(`/api/report-nps?reportId=${reportId}`, {
      credentials: "include",
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error(`NPS fetch ${res.status}`)),
      )
      .then((data) => {
        if (data.nps) {
          setAlreadyRated(true);
          setSelectedScore(data.nps.score);
          setSubmitted(true);
          if (data.nps.pmfResponse) {
            setPmfResponse(data.nps.pmfResponse);
            setPmfSubmitted(true);
          }
        }
      })
      .catch(() => {});
  }, [reportId]);

  // Show after 45s or when scrolled to bottom (whichever comes first)
  const showNPS = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (alreadyRated) {
      setVisible(true);
      return;
    }

    // Timer: show after 45 seconds
    timerRef.current = setTimeout(showNPS, 45000);

    // Scroll observer: show when section enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          showNPS();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [alreadyRated, showNPS]);

  const handleSubmit = async () => {
    if (!selectedScore || submitting) return;
    setSubmitting(true);

    try {
      await csrfFetch("/api/report-nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          score: selectedScore,
          feedback: feedback.trim() || undefined,
          locale,
        }),
        credentials: "include",
      });
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePmfSubmit = async (value: string) => {
    setPmfResponse(value);

    try {
      await csrfFetch("/api/report-nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          score: selectedScore,
          pmfResponse: value,
          feedback: feedback.trim() || undefined,
          locale,
        }),
        credentials: "include",
      });
    } catch {
      console.warn("[ReportNPS] PMF submit failed");
    }

    // Brief pause so the user sees their selection before transitioning
    setTimeout(() => setPmfSubmitted(true), 600);
  };

  return (
    <section ref={sectionRef} id="report-nps" className="scroll-mt-24 mt-6">
      <div
        className={`transition-all duration-700 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-muted/20 border-primary/10">
          <CardContent className="p-6 sm:p-8">
            {submitted ? (
              /* Post-submit: Sean Ellis PMF question or final thanks */
              <div className="text-center py-2 animate-fade-in-up">
                {pmfSubmitted ? (
                  /* Final thanks after PMF */
                  <>
                    <div className="text-3xl mb-3">
                      {selectedScore && selectedScore >= 9
                        ? "🎉"
                        : selectedScore && selectedScore >= 7
                          ? "👍"
                          : "🙏"}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {npsThanks}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {npsThanksDetail}
                    </p>
                  </>
                ) : (
                  /* Sean Ellis PMF question */
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {pmfThanks}
                    </p>
                    <h3 className="text-base font-semibold text-foreground mb-4">
                      {pmfQuestion}
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                      {(
                        [
                          {
                            value: "very_disappointed",
                            label: pmfVeryDisappointed,
                          },
                          {
                            value: "somewhat_disappointed",
                            label: pmfSomewhatDisappointed,
                          },
                          {
                            value: "not_disappointed",
                            label: pmfNotDisappointed,
                          },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePmfSubmit(option.value)}
                          disabled={!!pmfResponse}
                          className={`
                            px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200
                            focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1
                            ${
                              pmfResponse === option.value
                                ? "bg-primary/20 border-primary/40 text-primary"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                  {npsTitle}
                </h3>

                {/* Score labels */}
                <div className="flex justify-between text-xs text-muted-foreground mb-3 px-1">
                  <span>{npsLow}</span>
                  <span>{npsMid}</span>
                  <span>{npsHigh}</span>
                </div>

                {/* Score buttons */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                    const isSelected = selectedScore === score;
                    return (
                      <button
                        key={score}
                        onClick={() => setSelectedScore(score)}
                        aria-label={`${score}/10`}
                        className={`
                          w-8 h-8 sm:w-10 sm:h-10 rounded-full border text-sm font-medium
                          transition-all duration-200 flex items-center justify-center
                          focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1
                          ${
                            isSelected
                              ? SCORE_COLORS[score]
                              : `border-border bg-background text-muted-foreground ${getHoverColor(score)} cursor-pointer`
                          }
                        `}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback textarea — fades in after score selection */}
                {selectedScore && (
                  <div className="animate-fade-in-up space-y-3">
                    <label
                      htmlFor="nps-feedback"
                      className="block text-sm text-muted-foreground"
                    >
                      {npsFeedbackLabel}
                    </label>
                    <textarea
                      id="nps-feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={npsFeedbackPlaceholder}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary/50 resize-none"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-full px-8"
                      >
                        {submitting ? "..." : npsSubmit}
                      </Button>
                      {submitError && (
                        <p className="text-xs text-destructive animate-fade-in-up">
                          {t.submitFailed}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
