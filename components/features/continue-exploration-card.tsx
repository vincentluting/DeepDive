"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { loadFromLocalStorage } from "@/lib/questionnaire/store-utils";

interface ContinueExplorationCardProps {
  locale: Locale;
}

/**
 * Client component that checks localStorage for an incomplete Deep Dive session.
 * If found, renders a "Continue Exploring" card in the dashboard.
 */
export function ContinueExplorationCard({
  locale,
}: ContinueExplorationCardProps) {
  const [hasIncompleteSession, setHasIncompleteSession] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    // Canonical session store (sessionStorage since 2026-05-18). The accessor
    // already filters out completed + >48h-old sessions and is SSR-safe.
    const session = loadFromLocalStorage();
    if (!session || !session.answers || session.answers.length === 0) return;

    setHasIncompleteSession(true);
    // v3.0: 6 SJT + 20 TwIVI + 60 IPIP-60 = 86 questions
    const totalQ = 86;
    setProgressPct(Math.round((session.answers.length / totalQ) * 100));
  }, []);

  if (!hasIncompleteSession) return null;

  const t = getDictionaryClient(locale).dashboardContinue;

  return (
    <Link
      href={`/${locale}/deepdive`}
      className="group col-span-2 relative p-5 rounded-2xl border border-sky-500/15 hover-lift overflow-hidden animate-fade-in-up"
      style={{
        background:
          "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(14,165,233,0.02) 100%)",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center shrink-0">
          <Compass className="h-5 w-5 text-sky-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-1">
            {t.title}
          </p>
          <p className="text-xs text-muted-foreground mb-3">{t.subtitle}</p>

          {/* Progress bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden mb-2"
            style={{ background: "rgba(14,165,233,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background:
                  "linear-gradient(90deg, rgba(14,165,233,0.6), rgba(74,222,128,0.6))",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {progressPct}%
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-500 group-hover:gap-2 transition-all duration-300">
              {t.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
