"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { ReportDialog, type ReportDialogTexts } from "./report-dialog";

interface ProfileDetailActionsProps {
  /** Target user's id (NOT their CompanionProfile.id). */
  targetUserId: string;
  /** Target's display name (used inside the report dialog copy). */
  targetDisplayName: string;
  /** Locale-prefixed redirect path after successful block. */
  blockRedirect: string;
  t: {
    blockButton: string;
    reportButton: string;
    confirmBlock: string;
    blockError: string;
  };
  tReport: ReportDialogTexts;
}

/**
 * Block + Report actions for the Companion profile detail page.
 * Block uses confirm() (no extra modal — the action is destructive but
 * obvious). Report opens a structured dialog with reason + details.
 */
export function ProfileDetailActions({
  targetUserId,
  targetDisplayName,
  blockRedirect,
  t,
  tReport,
}: ProfileDetailActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showReport, setShowReport] = useState(false);

  const handleBlock = async () => {
    if (busy) return;
    if (!confirm(t.confirmBlock)) return;
    setBusy(true);
    setErrorMsg("");

    try {
      const res = await csrfFetch("/api/companions/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: targetUserId, reason: null }),
      });
      if (!res.ok) {
        setErrorMsg(t.blockError);
        return;
      }
      router.push(blockRedirect);
      router.refresh();
    } catch {
      setErrorMsg(t.blockError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleBlock}
          disabled={busy}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {t.blockButton}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowReport(true)}
          disabled={busy}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" />
          {t.reportButton}
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

      {showReport && (
        <ReportDialog
          reportedId={targetUserId}
          reportedDisplayName={targetDisplayName}
          onClose={() => setShowReport(false)}
          t={tReport}
        />
      )}
    </div>
  );
}
