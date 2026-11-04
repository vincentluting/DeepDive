"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  ArrowRight,
  Compass,
  Sparkles,
  Filter,
  ArrowUpDown,
  BookOpen,
  Target,
  Trash2,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { type Locale, toDateLocale } from "@/lib/i18n/config";
import { csrfFetch } from "@/lib/auth/csrf-client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Report {
  id: string;
  summary: string;
  summaryZh?: string;
  createdAt: string;
  reportType?: "deep" | "quick";
  exploreMode?: string | null;
}

interface ReportsPageClientProps {
  initialReports: Report[];
  locale: string;
  dbError?: boolean;
}

type ReportFilterType = "all" | "immersive" | "classic" | "deep";

type ReportCategory = "immersive" | "classic" | "deep";

function getReportCategory(report: Report): ReportCategory {
  if (report.reportType === "quick") {
    return report.exploreMode === "classic" ? "classic" : "immersive";
  }
  return "deep";
}

function getReportSummary(report: Report, locale: string): string {
  if (report.reportType === "quick" && locale === "zh" && report.summaryZh) {
    return report.summaryZh;
  }
  return report.summary || "";
}

function getReportLink(report: Report, locale: string): string {
  if (report.reportType === "quick") {
    return `/${locale}/report/quick/${report.id}`;
  }
  return `/${locale}/report/${report.id}`;
}

export function ReportsPageClient({
  initialReports,
  locale,
  dbError,
}: ReportsPageClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState<ReportFilterType>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dict = getDictionaryClient(locale as "en" | "zh");
  const t = dict.reportsPage;

  const filteredAndSorted = useMemo(() => {
    let result = [...reports];
    if (filterType !== "all") {
      result = result.filter((r) => getReportCategory(r) === filterType);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [reports, sortOrder, filterType]);

  const handleDelete = async (report: Report) => {
    setDeletingId(report.id);
    setDeleteError(null);
    try {
      const endpoint =
        report.reportType === "quick"
          ? `/api/quickdive/report/${report.id}`
          : `/api/report/${report.id}`;
      const res = await csrfFetch(endpoint, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDialogOpen(null);
        // Defer report removal so Radix AlertDialog can complete its
        // close animation and return focus to the trigger button before
        // the report card (and its trigger) is removed from the DOM.
        setTimeout(() => {
          setReports((prev) => prev.filter((r) => r.id !== report.id));
        }, 150);
      } else {
        const data = await res.json().catch(() => null);
        const err = data?.error;
        setDeleteError(
          typeof err === "string" ? err : (err?.message ?? t.deleteError),
        );
      }
    } catch (error) {
      if (__DEV__) console.error("Error deleting report:", error);
      setDeleteError(t.networkError);
    } finally {
      setDeletingId(null);
    }
  };

  const typeConfig: Record<
    ReportCategory,
    { label: string; color: string; icon: typeof Compass }
  > = {
    immersive: {
      label: t.narrativeExploreLabel,
      color: "bg-md-gold/10 text-md-gold-text border-md-gold/30",
      icon: BookOpen,
    },
    classic: {
      label: t.quickDiveLabel,
      color:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      icon: Zap,
    },
    deep: {
      label: t.deepDiveLabel,
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Compass,
    },
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-20">
        {dbError && (
          <div className="mb-6 mx-auto max-w-md rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {t.partialLoadError}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-[30px] animate-breathe" />
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Compass className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {t.noReports}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t.noReportsDesc}
        </p>
        <Button
          asChild
          className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Link href={`/${locale}/quickdive`}>
            <Sparkles className="h-4 w-4" />
            {t.beginDive}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="dd-reports-index space-y-7">
      {dbError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {t.partialLoadError}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="dd-reports-hero flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {interpolate(t.subtitleCount, { count: reports.length })}
          </p>
        </div>
        <Button
          asChild
          className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 shrink-0"
        >
          <Link href={`/${locale}/deepdive`}>
            <Sparkles className="h-4 w-4" />
            {t.newExploration}
          </Link>
        </Button>
      </div>

      {/* Filters & Sort */}
      <div className="dd-reports-controls flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
        </div>
        {(["all", "immersive", "classic", "deep"] as const).map((type) => {
          const labels: Record<ReportFilterType, string> = {
            all: t.filterAll,
            immersive: t.filterNarrative,
            classic: t.filterClassic,
            deep: t.deepDiveLabel,
          };
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`min-h-10 min-w-10 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                filterType === type
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary"
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
        <div className="ml-auto">
          <button
            onClick={() =>
              setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
            }
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOrder === "newest" ? t.sortNewest : t.sortOldest}
          </button>
        </div>
      </div>

      {/* Report Cards */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t.noMatch}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((report) => {
            const category = getReportCategory(report);
            const config = typeConfig[category];
            const TypeIcon = config.icon;
            const summary = getReportSummary(report, locale);
            const reportLink = getReportLink(report, locale);
            const isNarrative = category === "immersive";
            const isClassic = category === "classic";
            const reportTitle = isNarrative
              ? t.narrativeExploreReport
              : isClassic
                ? t.quickDiveReport
                : `${t.discoveryReport} #${reports.filter((r) => r.reportType !== "quick").length - reports.filter((r) => r.reportType !== "quick").indexOf(report)}`;

            return (
              <div
                key={report.id}
                className="dd-report-index-card group rounded-2xl bg-card border border-border hover:border-primary/20 card-shadow hover:card-shadow-hover transition-all duration-300 overflow-hidden hover-glow"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 ${
                        isNarrative
                          ? "bg-md-gold/10 border-md-gold/30"
                          : isClassic
                            ? "bg-orange-500/8 border-orange-500/15"
                            : "bg-primary/8 border-primary/15"
                      }`}
                    >
                      {isNarrative ? (
                        <BookOpen className="h-6 w-6 text-md-gold-text" />
                      ) : isClassic ? (
                        <Zap className="h-6 w-6 text-orange-500" />
                      ) : (
                        <FileText className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2
                              className={`font-semibold text-base transition-colors duration-200 ${
                                isNarrative
                                  ? "text-foreground group-hover:text-md-gold-text"
                                  : isClassic
                                    ? "text-foreground group-hover:text-orange-500"
                                    : "text-foreground group-hover:text-primary"
                              }`}
                            >
                              {reportTitle}
                            </h2>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 rounded-full ${config.color}`}
                            >
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(report.createdAt).toLocaleDateString(
                              toDateLocale(locale as Locale),
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </div>
                          {summary && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Target
                                className={`h-3.5 w-3.5 shrink-0 ${isNarrative ? "text-md-gold-text" : isClassic ? "text-orange-500" : "text-primary"}`}
                              />
                              <span className="truncate">{summary}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <AlertDialog
                            open={dialogOpen === report.id}
                            onOpenChange={(open) => {
                              setDialogOpen(open ? report.id : null);
                              if (!open) setDeleteError(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t.deleteReport}
                                className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t.deleteReport}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.deleteConfirm}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              {deleteError && (
                                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                  <p className="text-sm text-destructive">
                                    {deleteError}
                                  </p>
                                </div>
                              )}
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t.cancel}
                                </AlertDialogCancel>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(report)}
                                  disabled={deletingId === report.id}
                                >
                                  {deletingId === report.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      {t.deleting}
                                    </>
                                  ) : (
                                    t.delete
                                  )}
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="min-h-10 gap-1.5 rounded-full border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Link href={reportLink}>
                              {t.viewReport}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
