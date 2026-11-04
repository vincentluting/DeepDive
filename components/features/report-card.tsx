"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { FileText, Calendar, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { type Locale, toDateLocale } from "@/lib/i18n/config";

interface ReportCardProps {
  report: {
    id: string;
    summary: string;
    summaryZh?: string;
    createdAt: string;
    reportType?: "deep" | "quick";
  };
  index: number;
  totalReports: number;
  onDelete: (id: string) => void;
  locale?: string;
}

export function ReportCard({
  report,
  index,
  totalReports,
  onDelete,
  locale = "en",
}: ReportCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const t = getDictionaryClient(locale as "en" | "zh").reportCard;

  const archetypeName =
    report.reportType === "quick" && locale === "zh" && report.summaryZh
      ? report.summaryZh
      : report.summary;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);

    try {
      const deleteEndpoint =
        report.reportType === "quick"
          ? `/api/quickdive/report/${report.id}`
          : `/api/report/${report.id}`;
      const response = await csrfFetch(deleteEndpoint, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setShowDialog(false);
        // Defer report removal so Radix AlertDialog can complete its
        // close animation and return focus to the trigger button before
        // the report card (and its trigger) is removed from the DOM.
        setTimeout(() => {
          onDelete(report.id);
        }, 150);
      } else {
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          alert(t.loginRequired);
        } else {
          const err = data?.error;
          alert(
            `${t.deleteFailed} ${typeof err === "string" ? err : (err?.message ?? "")}`,
          );
        }
      }
    } catch (error) {
      if (__DEV__) console.error("Error deleting report:", error);
      alert(t.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const reportPath =
    report.reportType === "quick"
      ? `/${locale}/report/quick/${report.id}`
      : `/${locale}/report/${report.id}`;

  return (
    <div className="group p-4 rounded-xl border border-border bg-card card-shadow transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover-glow active:scale-[0.98] active:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <Link href={reportPath} className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
              {archetypeName ?? `${t.discoveryReport} #${totalReports - index}`}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
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
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.deleteReport}
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteReport}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deleteConfirm}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  {t.cancel}
                </AlertDialogCancel>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
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
          <Link href={reportPath} aria-label={t.viewReport}>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
