"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";

type ReportType = "deep_dive" | "quick_dive" | "immersive_dive";

interface UserReport {
  id: string;
  type: ReportType;
  createdAt: string;
  version: string | null;
  archetypeLabel: string | null;
  exploreMode: string | null;
}

const TYPE_CONFIG: Record<
  ReportType,
  { label: string; color: string; path: (locale: string, id: string) => string }
> = {
  deep_dive: {
    label: "Deep Dive",
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    path: (locale, id) => `/${locale}/report/${id}`,
  },
  quick_dive: {
    label: "Quick Dive",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    path: (locale, id) => `/${locale}/report/quick/${id}`,
  },
  immersive_dive: {
    label: "Immersive",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    path: (locale, id) => `/${locale}/report/quick/${id}`,
  },
};

export function UserReportDetail({
  userId,
  locale,
}: {
  userId: string;
  locale: Locale;
}) {
  const rd = (getDictionaryClient(locale).admin?.reportDetail || {}) as Record<
    string,
    string
  >;
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/reports`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [userId]);

  const handleDelete = async (report: UserReport) => {
    if (
      !confirm(
        rd.confirmDelete ||
          `Delete this ${report.type.replace(/_/g, " ")} report?`,
      )
    )
      return;
    setDeleting(report.id);
    try {
      const res = await csrfFetch(`/api/admin/users/${userId}/reports`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, reportType: report.type }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
      }
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground animate-pulse">
        {rd.loading || "Loading..."}
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {rd.noReports || "No reports for this user"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const config = TYPE_CONFIG[r.type] || TYPE_CONFIG.deep_dive;
        return (
          <div
            key={`${r.type}-${r.id}`}
            className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={`text-[10px] font-medium ${config.color}`}
              >
                {config.label}
              </Badge>
              <span className="text-sm text-foreground">
                {r.archetypeLabel || rd.careerReport || "Career Report"}
              </span>
              {r.version && (
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  v{r.version}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toISOString().slice(0, 10)} UTC
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={config.path(locale, r.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {rd.viewReport || "View"} <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => handleDelete(r)}
                disabled={deleting === r.id}
                className="text-xs text-red-500/60 hover:text-red-500 flex items-center gap-1 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
