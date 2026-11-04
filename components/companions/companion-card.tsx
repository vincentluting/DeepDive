"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";
import type { Locale } from "@/lib/i18n/config";
import type { CompanionCandidate } from "@/lib/types/companion";

interface CompanionCardProps {
  candidate: CompanionCandidate;
  locale: Locale;
  /** Whether the user has already sent a request in this session (UI-only badge). */
  initialRequestSent?: boolean;
  /** Called after a successful POST so the parent can refresh Pending/badges. */
  onRequestSent?: () => void;
  t: {
    matchScoreSuffix: string;
    matchInsightSame: string;
    matchInsightOpposite: string;
    sendRequest: string;
    sending: string;
    requestSentBadge: string;
    requestPlaceholder: string;
    requestCounter: string;
    requestCancel: string;
    requestSubmit: string;
    requestErrorGeneric: string;
    requestErrorDuplicate: string;
    requestErrorBlocked: string;
  };
}

type Status = "idle" | "loading" | "sent" | "error";

export function CompanionCard({
  candidate,
  locale,
  initialRequestSent = false,
  onRequestSent,
  t,
}: CompanionCardProps) {
  const [status, setStatus] = useState<Status>(
    initialRequestSent ? "sent" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const archetypeEntry = ARCHETYPE_MAP[candidate.profile.archetypeCode];
  const archetypeLabel = archetypeEntry
    ? getLocalizedField(archetypeEntry, "label", locale)
    : candidate.profile.archetypeCode;
  const archetypeTagline = archetypeEntry
    ? getLocalizedField(archetypeEntry, "tagline", locale)
    : "";

  const insightLine =
    candidate.compatibility.complementarity === 1.0
      ? t.matchInsightOpposite
      : t.matchInsightSame;

  const handleSend = async () => {
    if (status === "loading" || status === "sent") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await csrfFetch("/api/companions/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: candidate.profile.userId,
          message: message.trim() || null,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setShowForm(false);
        // Notify parent so it can refresh the Pending tab + dashboard badge.
        // Without this the user would have to hard-reload to see the
        // outgoing-pending entry appear.
        onRequestSent?.();
        return;
      }
      if (res.status === 409) {
        setStatus("error");
        setErrorMsg(t.requestErrorDuplicate);
      } else if (res.status === 400 || res.status === 404) {
        setStatus("error");
        setErrorMsg(t.requestErrorBlocked);
      } else {
        setStatus("error");
        setErrorMsg(t.requestErrorGeneric);
      }
    } catch {
      setStatus("error");
      setErrorMsg(t.requestErrorGeneric);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 card-inset-highlight">
      {/* Header — display name + archetype */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground truncate">
            {candidate.profile.displayName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {archetypeLabel}
            {archetypeTagline && (
              <span className="text-muted-foreground/70">
                {" "}
                · {archetypeTagline}
              </span>
            )}
          </p>
        </div>
        <CompatibilityRing
          score={candidate.compatibility.score}
          suffix={t.matchScoreSuffix}
        />
      </div>

      {/* Bio */}
      {candidate.profile.bio && (
        <p className="text-sm text-foreground/90 whitespace-pre-line">
          {candidate.profile.bio}
        </p>
      )}

      {/* Insight line */}
      <p className="text-xs text-muted-foreground italic">{insightLine}</p>

      {/* Action area */}
      {status === "sent" ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t.requestSentBadge}
        </div>
      ) : showForm ? (
        <div className="space-y-2 pt-1">
          <div className="space-y-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder={t.requestPlaceholder}
              rows={3}
              disabled={status === "loading"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-50"
            />
            <p className="text-right text-xs text-muted-foreground/70">
              {interpolate(t.requestCounter, { count: String(message.length) })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSend}
              disabled={status === "loading"}
              className="gap-1.5"
            >
              {status === "loading" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {status === "loading" ? t.sending : t.requestSubmit}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setMessage("");
                setStatus("idle");
                setErrorMsg("");
              }}
              disabled={status === "loading"}
            >
              {t.requestCancel}
            </Button>
          </div>
          {status === "error" && errorMsg && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            {t.sendRequest}
          </Button>
          {status === "error" && errorMsg && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CompatibilityRing({
  score,
  suffix,
}: {
  score: number;
  suffix: string;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  return (
    <div className="relative shrink-0 h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground">
        {score}
        <span className="sr-only">{suffix}</span>
      </span>
    </div>
  );
}
