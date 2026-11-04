"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface InviteCodeCardProps {
  /** Current site locale — sent to /api/claim-invite so the API can gate
   *  thesis cohort entry to en/zh only (consent + DDVQ instruments are
   *  professionally translated only in en + zh).
   *
   *  Optional for back-compat with parent components that haven't been
   *  updated to pass `locale` yet. **However**: a thesis_* invite claim
   *  WITHOUT a locale will be rejected by the API with a clear error message
   *  (fail-closed). For thesis upgrade via Settings to succeed, parents
   *  MUST pass `locale`. See `app/[locale]/(app)/settings/settings-client.tsx`
   *  for the canonical call site. */
  locale?: string;
  t: {
    title: string;
    description: string;
    placeholder: string;
    submit: string;
    submitting: string;
    success: string;
    errorInvalid: string;
    errorAlreadyEnrolled: string;
    errorGeneric: string;
  };
}

export function InviteCodeCard({ locale, t }: InviteCodeCardProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await csrfFetch("/api/claim-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: trimmed, locale }),
      });

      if (res.ok) {
        setStatus("success");
        // Soft RSC refresh — rehydrates server components (header nav,
        // entitlement gates) without losing client state or doing a full
        // page reload. 600ms delay lets the user see the success flash.
        setTimeout(() => router.refresh(), 600);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        if (res.status === 409) {
          setErrorMsg(t.errorAlreadyEnrolled);
        } else if (res.status === 400) {
          setErrorMsg(data.error || t.errorInvalid);
        } else {
          setErrorMsg(t.errorGeneric);
        }
      }
    } catch {
      setStatus("error");
      setErrorMsg(t.errorGeneric);
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t.success}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t.description}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (status === "error") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.trim()) handleSubmit();
          }}
          placeholder={t.placeholder}
          maxLength={50}
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm font-mono tracking-wider placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          disabled={status === "loading"}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!code.trim() || status === "loading"}
          className="gap-1.5 shrink-0"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.submitting}
            </>
          ) : (
            t.submit
          )}
        </Button>
      </div>
      {status === "error" && errorMsg && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
