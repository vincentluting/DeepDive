"use client";

import { AlertTriangle, CheckCircle2, Users2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { useAdminQuery } from "@/lib/hooks/use-admin-query";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/admin/shared/states";
import type {
  ResearchSummary,
  ThesisIssue,
} from "@/lib/research/thesis-validation";

interface QualityResponse {
  summary: ResearchSummary;
  issues: ThesisIssue[];
  multiRecordUsers: {
    userId: string;
    email: string;
    assessmentType: string;
    count: number;
  }[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  generatedAt: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  error: "border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5",
  warning:
    "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5",
  info: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/5",
};

/**
 * Thesis data-quality cockpit: same validation rules as
 * `npm run verify:thesis` (shared lib/research/thesis-validation.ts),
 * plus duplicate-timepoint warnings from the canonical pairing module.
 */
export function DataQualityPanel({ locale }: { locale: Locale }) {
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const t = (dict.quality || {}) as Record<string, string>;

  const { data, loading, error, refetch } = useAdminQuery<QualityResponse>(
    "/api/admin/research-quality",
    { component: "DataQualityPanel" },
  );

  if (error) {
    return (
      <ErrorState
        message={t.loadError || "Failed to load data quality report."}
        retryLabel={t.retry || "Retry"}
        onRetry={refetch}
      />
    );
  }

  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const { summary } = data;

  return (
    <div className="space-y-6 min-w-0">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t.errors || "Errors"}
          value={data.errorCount}
          icon={XCircle}
          iconTone={data.errorCount > 0 ? "red" : "green"}
          definition={t.errorsDef}
        />
        <KpiCard
          label={t.warnings || "Warnings"}
          value={data.warningCount}
          icon={AlertTriangle}
          iconTone={data.warningCount > 0 ? "amber" : "green"}
          definition={t.warningsDef}
        />
        <KpiCard
          label={t.usableN || "Full-chain n"}
          value={summary.fullChain}
          icon={CheckCircle2}
          iconTone="green"
          definition={t.usableNDef}
        />
        <KpiCard
          label={t.multiRecord || "Multi-record users"}
          value={data.multiRecordUsers.length}
          icon={Users2}
          iconTone={data.multiRecordUsers.length > 0 ? "amber" : "green"}
          definition={t.multiRecordDef}
        />
      </div>

      {/* Timepoint completion strip */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {t.timepoints || "Timepoint completion"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                {t.consented || "Consented"}
              </p>
              <p className="text-lg font-bold text-foreground">
                {summary.consentedUsers}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.t0 || "T0"}</p>
              <p className="text-lg font-bold text-foreground">
                {summary.t0Count}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.t1 || "T1"}</p>
              <p className="text-lg font-bold text-foreground">
                {summary.t1Count}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.t2 || "T2"}</p>
              <p className="text-lg font-bold text-foreground">
                {summary.t2Count}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t.invalidT2 || "Invalid T2 timing"}
              </p>
              <p
                className={`text-lg font-bold ${summary.invalidT2Timing > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
              >
                {summary.invalidT2Timing}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t.missingT2Due || "T2 overdue"}
              </p>
              <p
                className={`text-lg font-bold ${summary.missingT2Due > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
              >
                {summary.missingT2Due}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues table */}
      <Card className="bg-card border-border overflow-hidden py-0">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t.issuesTitle || "Issues"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
            {t.cliHint}
          </p>
        </div>
        {data.issues.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t.issuesEmpty || "No issues found."}
          />
        ) : (
          <div className="overflow-x-auto pt-3">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    {t.colSeverity || "Severity"}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t.colUser || "Participant"}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">
                    {t.colCategory || "Category"}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t.colIssue || "Issue"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.issues.map((issue, i) => (
                  <TableRow
                    key={`${issue.userId}-${i}`}
                    className="border-border"
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase ${SEVERITY_STYLES[issue.severity] || ""}`}
                      >
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground break-all max-w-[180px]">
                      {issue.email || issue.userId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      {issue.category}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/90">
                      {issue.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Multi-record table */}
      <Card className="bg-card border-border overflow-hidden py-0">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t.multiRecordTitle || "Duplicate timepoint records"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t.multiRecordDef}
          </p>
        </div>
        {data.multiRecordUsers.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t.multiRecordEmpty || "No duplicates."}
          />
        ) : (
          <div className="overflow-x-auto pt-3">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">
                    {t.colUser || "Participant"}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t.colTimepoint || "Timepoint"}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t.colCount || "Records"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.multiRecordUsers.map((m, i) => (
                  <TableRow
                    key={`${m.userId}-${m.assessmentType}-${i}`}
                    className="border-border"
                  >
                    <TableCell className="text-xs text-foreground break-all max-w-[220px]">
                      {m.email || m.userId.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {m.assessmentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${SEVERITY_STYLES.warning}`}
                      >
                        ×{m.count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
