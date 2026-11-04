"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  FlaskConical,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { useAdminQuery } from "@/lib/hooks/use-admin-query";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/admin/shared/states";
import { UserAvatar, formatAdminDate } from "@/components/admin/shared/badges";
import type { AdminOverviewData } from "@/lib/db/admin-overview";

const LLM_DEGRADED_ALERT_THRESHOLD_PCT = 5;

/**
 * /admin landing cockpit: KPI row → thesis recruitment + alerts →
 * registration trend + recent signups. Every card links to its section.
 */
export function OverviewBoard({ locale }: { locale: Locale }) {
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const t = (dict.overview || {}) as Record<string, string>;
  const base = `/${locale}/admin`;

  const { data, loading, error, refetch } = useAdminQuery<AdminOverviewData>(
    "/api/admin/overview",
    { component: "OverviewBoard" },
  );

  if (error) {
    return (
      <ErrorState
        message={t.loadError || "Failed to load overview."}
        retryLabel={t.retry || "Retry"}
        onRetry={refetch}
      />
    );
  }

  if (loading || !data) {
    return <LoadingSkeleton height="h-[32rem]" />;
  }

  const { kpis, research, alerts, registrationTrend, recentUsers } = data;

  const activeAlerts: string[] = [];
  if (alerts) {
    if (alerts.durableJobsFailed24h > 0) {
      activeAlerts.push(
        interpolate(
          t.alertJobsFailed || "{n} background job(s) failed in the last 24h",
          { n: String(alerts.durableJobsFailed24h) },
        ),
      );
    }
    if (
      alerts.llmDegradedRate7dPct != null &&
      alerts.llmDegradedRate7dPct > LLM_DEGRADED_ALERT_THRESHOLD_PCT
    ) {
      activeAlerts.push(
        interpolate(t.alertLlmDegraded || "LLM degraded rate {n}% (7d)", {
          n: String(alerts.llmDegradedRate7dPct),
        }),
      );
    }
    if (alerts.openModerationReports > 0) {
      activeAlerts.push(
        interpolate(
          t.alertOpenReports || "{n} unhandled moderation report(s)",
          {
            n: String(alerts.openModerationReports),
          },
        ),
      );
    }
    if (alerts.thesisDataErrors > 0) {
      activeAlerts.push(
        interpolate(t.alertThesisErrors || "{n} thesis data error(s)", {
          n: String(alerts.thesisDataErrors),
        }),
      );
    }
  }

  const targetPct = research
    ? Math.min(100, Math.round((research.consented / research.target) * 100))
    : 0;

  return (
    <div className="dd-admin-cockpit space-y-6 min-w-0">
      {/* KPI row */}
      {kpis ? (
        <div className="dd-admin-kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={t.kpiTotalUsers || "Total Users"}
            value={kpis.totalUsers}
            icon={Users}
            iconTone="primary"
            definition={t.kpiTotalUsersDef}
            sub={interpolate(t.kpiTotalUsersSub || "+{n} this week", {
              n: String(kpis.newUsers7d),
            })}
            href={`${base}/users`}
          />
          <KpiCard
            label={t.kpiActive7d || "Active (7d)"}
            value={kpis.active7d}
            icon={Activity}
            iconTone="green"
            definition={t.kpiActive7dDef}
            href={`${base}/insights`}
          />
          <KpiCard
            label={t.kpiQdToReport || "QD → Report (30d)"}
            value={
              kpis.qdToReportRate30d != null
                ? `${kpis.qdToReportRate30d}%`
                : "—"
            }
            icon={TrendingUp}
            iconTone="blue"
            definition={t.kpiQdToReportDef}
            href={`${base}/insights`}
          />
          <KpiCard
            label={t.kpiLlmCost7d || "LLM Cost (7d)"}
            value={`$${kpis.llmCost7dUsd.toFixed(2)}`}
            icon={Bot}
            iconTone="violet"
            definition={t.kpiLlmCost7dDef}
            sub={interpolate(t.kpiLlmCalls || "{n} calls", {
              n: String(kpis.llmCalls7d),
            })}
            href={`${base}/ai`}
          />
        </div>
      ) : (
        <ErrorState
          message={t.loadError || "Failed to load overview."}
          retryLabel={t.retry || "Retry"}
          onRetry={refetch}
        />
      )}

      {/* Research recruitment + alerts */}
      <div className="dd-admin-overview-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
        {research && (
          <Link href={`${base}/research`} className="lg:col-span-2 block">
            <Card className="dd-admin-panel dd-admin-panel--wide bg-card border-border h-full transition-colors hover:border-primary/40">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-primary" />
                    <h2 className="text-base font-semibold text-foreground">
                      {t.researchTitle || "Thesis Recruitment"}
                    </h2>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {research.consented} / {research.target}
                  </span>
                </div>
                <div
                  className="dd-admin-progress h-2 w-full rounded-full bg-muted/50 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={research.consented}
                  aria-valuemin={0}
                  aria-valuemax={research.target}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div>
                    <p className="text-[11px] text-muted-foreground">T0</p>
                    <p className="text-lg font-bold text-foreground">
                      {research.t0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">T1</p>
                    <p className="text-lg font-bold text-foreground">
                      {research.t1}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">T2</p>
                    <p className="text-lg font-bold text-foreground">
                      {research.t2}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.researchFullChain || "Full chain"}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {research.fullChain}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span>
                    <span className="dd-admin-signal-text font-medium">
                      Classic {research.classic}
                    </span>
                    {" · "}
                    <span className="dd-admin-signal-text font-medium">
                      Immersive {research.immersive}
                    </span>
                  </span>
                  {research.missingT2Due > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {interpolate(t.researchT2Due || "{n} T2 overdue", {
                        n: String(research.missingT2Due),
                      })}
                    </span>
                  )}
                  <span className="ml-auto text-primary">
                    {t.researchView || "Open Research →"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Alerts */}
        <Card
          className={`dd-admin-panel dd-admin-alert-panel border h-full ${
            activeAlerts.length > 0
              ? "is-alert bg-red-500/5 border-red-500/30"
              : "bg-card border-border"
          }`}
        >
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              {activeAlerts.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <h2 className="text-base font-semibold text-foreground">
                {t.alertsTitle || "Alerts"}
              </h2>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.alertsAllClear || "All clear."}
              </p>
            ) : (
              <ul className="space-y-2">
                {activeAlerts.map((alert, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 flex items-start gap-2"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend + recent signups */}
      <div className="dd-admin-overview-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="dd-admin-panel dd-admin-chart-panel bg-card border-border lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              {t.trendTitle || "Registrations (30d)"}
            </h2>
            {registrationTrend && registrationTrend.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={registrationTrend}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                      tickFormatter={(d: string) => d.slice(5)}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t.recentEmpty || "No users yet."} />
            )}
          </CardContent>
        </Card>

        <Card className="dd-admin-panel dd-admin-list-panel bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              {t.recentTitle || "Recent signups"}
            </h2>
            {recentUsers && recentUsers.length > 0 ? (
              <ul className="space-y-3">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={u.name} email={u.email} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {u.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatAdminDate(u.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t.recentEmpty || "No users yet."} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
