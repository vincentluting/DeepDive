"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface DataExportCardProps {
  t: {
    exportTitle: string;
    exportDesc: string;
    exportButton: string;
    exportHelperText: string;
    exporting: string;
    exportSuccess: string;
    exportFailed: string;
  };
}

export function DataExportCard({ t }: DataExportCardProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleExport = async () => {
    setStatus("loading");
    try {
      const res = await csrfFetch("/api/user-data/export", { method: "POST" });
      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deep-dive-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4 text-primary" />
          {t.exportTitle}
        </CardTitle>
        <CardDescription>{t.exportDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t.exportHelperText}</p>
        <Button
          onClick={handleExport}
          disabled={status === "loading"}
          variant={status === "success" ? "outline" : "default"}
          className="w-full sm:w-auto"
          aria-live="polite"
        >
          {status === "loading" && (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.exporting}
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.exportSuccess}
            </>
          )}
          {status === "error" && t.exportFailed}
          {status === "idle" && (
            <>
              <Download className="h-4 w-4 mr-2" />
              {t.exportButton}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
