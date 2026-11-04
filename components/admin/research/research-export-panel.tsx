"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FlaskConical } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { reportClientError } from "@/lib/observability/client-error";

type DataSource = "quickdive" | "deepdive" | "thesis";
type ExportMode = "all" | "classic" | "narrative" | "immersive";
type ExportFormat = "json" | "csv";

export function ResearchExportPanel({ locale }: { locale: Locale }) {
  const t = (getDictionaryClient(locale).admin?.researchExport || {}) as Record<
    string,
    string
  >;
  const [datasource, setDatasource] = useState<DataSource>("quickdive");
  const [mode, setMode] = useState<ExportMode>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [anonymize, setAnonymize] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Build the fetch URL for count or export
  const buildUrl = useCallback(
    (countOnly: boolean): string => {
      if (datasource === "quickdive") {
        const params = new URLSearchParams({ mode, format });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (countOnly) params.set("countOnly", "true");
        return `/api/admin/research-export?${params}`;
      }
      if (datasource === "deepdive") {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (countOnly) params.set("countOnly", "true");
        return `/api/admin/research-export/deep-dive?${params}`;
      }
      // thesis — no countOnly (full export only)
      const params = new URLSearchParams();
      if (!anonymize) params.set("includePii", "true");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return `/api/admin/export/thesis-data?${params}`;
    },
    [datasource, mode, format, from, to, anonymize],
  );

  const fetchCount = useCallback(async () => {
    if (datasource === "thesis") {
      // Thesis export has no countOnly endpoint; show "N/A"
      setCount(null);
      return;
    }
    setCountLoading(true);
    setCount(null);
    try {
      const res = await fetch(buildUrl(true));
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? null);
    } catch (err) {
      reportClientError(err, { component: "ResearchExportPanel", feature: "admin" });
    } finally {
      setCountLoading(false);
    }
  }, [buildUrl, datasource]);

  // Refresh count when filters change
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const res = await fetch(buildUrl(false));
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      const suffix = datasource === "thesis" && anonymize ? "-anonymized" : "";
      const ext = datasource === "quickdive" ? format : "csv";
      const prefix =
        datasource === "quickdive"
          ? "deepdive-research-export"
          : datasource === "deepdive"
            ? "deepdive-item-level"
            : "deepdive-thesis-data";
      a.download = `${prefix}-${today}${suffix}-UTC.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      reportClientError(err, { component: "ResearchExportPanel", feature: "admin" });
    } finally {
      setExportLoading(false);
    }
  }, [buildUrl, datasource, format, anonymize]);

  const datasourceLabel: Record<DataSource, string> = {
    quickdive: t.quickDive || "Quick Dive",
    deepdive: t.deepDiveItemLevel || "Deep Dive (Item-Level)",
    thesis: t.thesisSummary || "Thesis Summary",
  };

  const showModeSelector = datasource === "quickdive";
  const showFormatSelector = datasource === "quickdive";
  const showAnonymize = datasource === "deepdive" || datasource === "thesis";
  const showCount = datasource !== "thesis";

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            {t.title || "Research Export"}
          </h2>
          <span className="text-xs text-muted-foreground ml-1">
            {t.subtitle || "Data for SPSS / R"}
          </span>
        </div>

        {/* Data Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t.dataSource || "Data Source"}
          </label>
          <div className="flex flex-wrap gap-2">
            {(["quickdive", "deepdive", "thesis"] as DataSource[]).map((ds) => (
              <button
                key={ds}
                onClick={() => setDatasource(ds)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  datasource === ds
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {datasourceLabel[ds]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {datasource === "quickdive" &&
              (t.quickDiveDesc ||
                "Quick Dive RIASEC results + behavioral metrics (one row per result). Consented research participants only.")}
            {datasource === "deepdive" &&
              (t.deepDiveDesc ||
                "Deep Dive item-level answers: SJT × 6, DDVQ-21, IPIP-60 + scoring (one row per session). Consented research participants only.")}
            {datasource === "thesis" &&
              (t.thesisDesc ||
                "Aggregated thesis summary: one row per consented research participant, all study measures.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode — Quick Dive only */}
          {showModeSelector && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.mode || "Mode"}
              </label>
              <div className="flex flex-col gap-1.5">
                {(
                  ["all", "classic", "immersive", "narrative"] as ExportMode[]
                ).map((m) => (
                  <label
                    key={m}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="export-mode"
                      value={m}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">
                      {m === "all" ? t.allModes || "All modes" : m}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.modeNote ||
                  "A/B assignment removed. New sessions are classic by default."}
              </p>
            </div>
          )}

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t.fromDate || "From date"}
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t.toDate || "To date"}
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Format — Quick Dive only */}
          {showFormatSelector && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.format || "Format"}
              </label>
              <div className="flex flex-col gap-1.5">
                {(["csv", "json"] as ExportFormat[]).map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground uppercase">
                      {f}
                    </span>
                  </label>
                ))}
              </div>

              {/* Anonymize — Deep Dive / Thesis */}
              {showAnonymize && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={anonymize}
                    onChange={(e) => setAnonymize(e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    {t.anonymizeOutput || "Anonymize output"}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Anonymize — shown separately when Format selector is hidden */}
          {showAnonymize && !showFormatSelector && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.privacy || "Privacy"}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">
                  {t.anonymizeOutput || "Anonymize output"}
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                {datasource === "thesis"
                  ? t.anonymizeThesisDesc ||
                    "Replaces userId with participantId; removes email column."
                  : t.anonymizeDeepDiveDesc ||
                    "Uses participantId (or SHA-256 prefix) instead of raw userId."}
              </p>
            </div>
          )}

          {/* Count + Export */}
          <div className="space-y-3 flex flex-col justify-end">
            {showCount && (
              <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t.matchingRecords || "Matching records"}
                </p>
                {countLoading ? (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      {t.loading || "Loading\u2026"}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {count !== null ? count.toLocaleString() : "—"}
                  </p>
                )}
              </div>
            )}
            {datasource === "thesis" && (
              <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {t.allRegisteredUsers || "Consented research participants"}
                </p>
              </div>
            )}
            <Button
              onClick={handleExport}
              disabled={exportLoading || (showCount && count === 0)}
              className="w-full"
              size="sm"
            >
              {exportLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t.exporting || "Exporting\u2026"}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  {datasource === "quickdive"
                    ? `${t.exportCsv || "Export"} ${format.toUpperCase()}`
                    : datasource === "deepdive"
                      ? anonymize
                        ? t.exportCsvAnon || "Export CSV (Anon)"
                        : t.exportCsv || "Export CSV"
                      : anonymize
                        ? t.exportThesisAnon || "Export Thesis (Anon)"
                        : t.exportThesis || "Export Thesis"}
                </span>
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {datasource === "quickdive" &&
            (t.quickDiveNote ||
              "Exports up to 10,000 rows. Arrays are semicolon-separated in CSV. Includes only consented research participants (matches thesis export gate).")}
          {datasource === "deepdive" &&
            (t.deepDiveNote ||
              "Exports up to 10,000 completed Deep Dive sessions. IPIP-60 columns are positional. Includes only consented research participants (matches thesis export gate).")}
          {datasource === "thesis" &&
            (t.thesisNote ||
              "One row per consented research participant. Date filters use registration date. Anonymize removes email.")}
        </p>
      </CardContent>
    </Card>
  );
}
