import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { toDateLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { listOpenReportsWithDetails } from "@/lib/db/companions";
import { AdminReportActions } from "@/components/companions/admin-report-row";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  return {
    title: `${dictionary.companionAdminQueue.pageTitle} — Deep Dive`,
  };
}

const REASON_LABEL_KEYS: Record<
  string,
  keyof Pick<
    Awaited<ReturnType<typeof getDictionary>>["companionAdminQueue"],
    "reasonHarassment" | "reasonInappropriate" | "reasonSpam" | "reasonOther"
  >
> = {
  harassment: "reasonHarassment",
  inappropriate_content: "reasonInappropriate",
  spam: "reasonSpam",
  other: "reasonOther",
};

/**
 * /admin/moderation — Trust & Safety triage queue.
 * (Moved from /admin/companion-reports, which now redirects here.)
 *
 * Server component: lists open reports oldest-first via a single SQL JOIN
 * (lib/db/companions.listOpenReportsWithDetails). Each row exposes
 * Mark Reviewed / Dismiss actions through a small client component.
 */
export default async function AdminModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  // Track DB read failures explicitly so the admin sees a clear error,
  // not a falsely empty queue. Silently catching to [] would let a DB
  // outage masquerade as "all clear" and hide actual T&S work.
  const dictionary = await getDictionary(locale as Locale);
  let reports: Awaited<ReturnType<typeof listOpenReportsWithDetails>> = [];
  let loadFailed = false;
  try {
    reports = await listOpenReportsWithDetails();
  } catch (err) {
    console.error("[admin/moderation] failed to load queue", err);
    loadFailed = true;
  }

  const t = dictionary.companionAdminQueue;
  const dateFmt = (d: Date) =>
    d.toLocaleString(toDateLocale(locale as Locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <AdminPageHeader title={t.pageTitle} description={t.pageSubtitle} />
      <div className="max-w-4xl space-y-4">
        {loadFailed ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center space-y-1">
            <p className="text-sm font-medium text-destructive">
              {t.errorGeneric}
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((entry) => {
              const r = entry.report;
              const reasonLabel =
                t[REASON_LABEL_KEYS[r.reason] ?? "reasonOther"];
              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-border bg-card p-5 space-y-4 card-inset-highlight"
                >
                  <header className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {reasonLabel}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">
                        {interpolate(t.filedAt, {
                          at: dateFmt(r.createdAt),
                        })}
                      </p>
                    </div>
                    <code className="text-[11px] text-muted-foreground/70 font-mono break-all max-w-xs">
                      {r.id}
                    </code>
                  </header>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t.reporterLabel}
                      </p>
                      <p className="text-foreground">
                        {entry.reporterDisplayName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 break-all">
                        {entry.reporterEmail ?? r.reporterId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t.reportedLabel}
                      </p>
                      <p className="text-foreground">
                        {entry.reportedDisplayName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 break-all">
                        {entry.reportedEmail ?? r.reportedId}
                      </p>
                    </div>
                  </div>

                  {r.details && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t.detailsLabel}
                      </p>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">
                        {r.details}
                      </p>
                    </div>
                  )}

                  <AdminReportActions
                    reportId={r.id}
                    t={{
                      actionReviewed: t.actionReviewed,
                      actionDismiss: t.actionDismiss,
                      actionWorking: t.actionWorking,
                      errorGeneric: t.errorGeneric,
                    }}
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
