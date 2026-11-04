"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface AdminReportRowProps {
  reportId: string;
  t: {
    actionReviewed: string;
    actionDismiss: string;
    actionWorking: string;
    errorGeneric: string;
  };
}

/**
 * Inline action buttons for the admin Companion-reports queue.
 * On success the parent server component re-renders via router.refresh().
 */
export function AdminReportActions({ reportId, t }: AdminReportRowProps) {
  const [busy, setBusy] = useState<"idle" | "reviewing" | "dismissing">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const decide = async (status: "reviewed" | "dismissed") => {
    if (busy !== "idle") return;
    setBusy(status === "reviewed" ? "reviewing" : "dismissing");
    setErrorMsg("");

    try {
      const res = await csrfFetch(
        `/api/companions/reports/${encodeURIComponent(reportId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) {
        setErrorMsg(t.errorGeneric);
        return;
      }
      // Hard-refresh — the page is a server component and the row should disappear.
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      setErrorMsg(t.errorGeneric);
    } finally {
      setBusy("idle");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => decide("reviewed")}
        disabled={busy !== "idle"}
        className="gap-1.5"
      >
        {busy === "reviewing" && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        {busy === "reviewing" ? t.actionWorking : t.actionReviewed}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => decide("dismissed")}
        disabled={busy !== "idle"}
      >
        {busy === "dismissing" ? t.actionWorking : t.actionDismiss}
      </Button>
      {errorMsg && <p className="text-xs text-destructive ml-2">{errorMsg}</p>}
    </div>
  );
}
