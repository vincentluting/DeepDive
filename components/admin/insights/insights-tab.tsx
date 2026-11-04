"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Star,
  AlertTriangle,
  Users,
  ArrowRight,
  RefreshCw,
  Megaphone,
  Copy,
  FlaskConical,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Locale } from "@/lib/i18n/config";
import type {
  WeeklyKPIs,
  FunnelLossStep,
  SuperUserProfile,
  ABTestResult,
  UTMAttributionResult,
  BottleneckDiagnosis,
  ABTrendAnalysis,
  PrePostEffectSummary,
} from "@/lib/db/admin-insights-cross";
import type { CohortRetentionMatrix } from "@/lib/db/analytics-materialized";
import { requiredSampleSizeFromH } from "@/lib/admin/statistics";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";

// ── Helper: get insights dictionary ────────────────────────────
type InsightsDict = Record<string, string>;

function useInsightsDict(locale: Locale): InsightsDict {
  return (
    ((getDictionaryClient(locale).admin as Record<string, unknown>)
      ?.insights as InsightsDict) || {}
  );
}

// ── Batch fetch context ──────────────────────────────────────
// Single request fetches all sections; children read from context.

interface InsightsBatchData {
  batch: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const InsightsBatchContext = createContext<InsightsBatchData>({
  batch: null,
  loading: true,
  error: null,
  reload: () => {},
});

function useInsightsBatch() {
  const [batch, setBatch] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/insights?section=all");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = await res.json();
      setBatch(json.data as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { batch, loading, error, reload: load };
}

/** Hook for individual sections — reads from batch context */
function useInsightsData<T>(section: string) {
  const { batch, loading, error, reload } = useContext(InsightsBatchContext);
  const data = (batch?.[section] as T | undefined) ?? null;
  return { data, loading, error, reload };
}

// ── Insights Tab ─────────────────────────────────────────────
// All sections loaded via single /api/admin/insights?section=all request.

export function InsightsTab({ locale }: { locale: Locale }) {
  const batchState = useInsightsBatch();

  return (
    <InsightsBatchContext.Provider value={batchState}>
      <div className="space-y-6">
        <KPISection locale={locale} />
        <FunnelLossSection locale={locale} />
        <UTMAttributionSection locale={locale} />
        <SuperUserSection locale={locale} />
        <ABTestSection locale={locale} />
        <PrePostEffectSection locale={locale} />
        <RetentionSection locale={locale} />
      </div>
    </InsightsBatchContext.Provider>
  );
}

function SectionShell({
  title,
  icon,
  loading,
  error,
  onReload,
  refreshLabel = "Refresh",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  error: string | null;
  onReload?: () => void;
  refreshLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          {onReload && (
            <button
              onClick={onReload}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={refreshLabel}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
        {loading && !error && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        {!loading && !error && children}
      </CardContent>
    </Card>
  );
}

// ── Step label keys ─────────────────────────────────────────────

const STEP_LABEL_KEYS: Record<string, string> = {
  registered: "stepRegistered",
  quickdive_started: "stepQdStart",
  quickdive_completed: "stepQdDone",
  deepdive_started: "stepDdStart",
  deepdive_completed: "stepDdDone",
  report_viewed: "stepReport",
  coaching_started: "stepCoach",
};

// ── Funnel column keys ──────────────────────────────────────────

const FUNNEL_COLS = [
  { key: "registered" as const, dictKey: "funnelReg" },
  { key: "quickdiveCompleted" as const, dictKey: "funnelQd" },
  { key: "deepdiveCompleted" as const, dictKey: "funnelDd" },
  { key: "reportViewed" as const, dictKey: "funnelReport" },
  { key: "coachingStarted" as const, dictKey: "funnelCoach" },
] as const;

// ── Significance label keys ─────────────────────────────────────

const SIGNIFICANCE_LABEL_KEYS: Record<string, string> = {
  significant: "sigSignificant",
  marginal: "sigMarginal",
  not_significant: "sigNotSignificant",
};

// ── Section 1: Weekly KPI Cards ──────────────────────────────

function KPISection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } = useInsightsData<WeeklyKPIs>("kpi");

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.weeklyKpis}
      icon={<Zap className="w-5 h-5 text-amber-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label={t.fullFunnel}
            value={`${data.fullFunnelRate}%`}
            delta={data.weekOverWeek.fullFunnelDelta}
            suffix="pp"
          />
          <KPICard
            label={t.reportDwell}
            value={
              data.medianReportTimeMs != null
                ? `${Math.round(data.medianReportTimeMs / 1000)}s`
                : "—"
            }
            delta={
              data.weekOverWeek.reportTimeDelta != null
                ? Math.round(data.weekOverWeek.reportTimeDelta / 1000)
                : null
            }
            suffix="s"
            invertColor
          />
          <KPICard
            label={t.coachingRate}
            value={`${data.coachingStartRate}%`}
            delta={data.weekOverWeek.coachingDelta}
            suffix="pp"
          />
          <KPICard
            label="NPS"
            value={data.npsCount > 0 ? `${data.npsAvg}` : "—"}
            delta={data.weekOverWeek.npsDelta}
            subtitle={`n=${data.npsCount}`}
          />
        </div>
      )}
    </SectionShell>
  );
}

function KPICard({
  label,
  value,
  delta,
  suffix = "",
  subtitle,
  invertColor = false,
}: {
  label: string;
  value: string;
  delta: number | null;
  suffix?: string;
  subtitle?: string;
  invertColor?: boolean;
}) {
  const isPositive = delta != null && delta > 0;
  const isNegative = delta != null && delta < 0;
  const colorPositive = invertColor ? "text-emerald-500" : "text-emerald-500";
  const colorNegative = invertColor ? "text-red-500" : "text-red-500";

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <div className="flex items-center gap-1">
        {delta != null ? (
          <>
            {isPositive && (
              <TrendingUp className={`w-3 h-3 ${colorPositive}`} />
            )}
            {isNegative && (
              <TrendingDown className={`w-3 h-3 ${colorNegative}`} />
            )}
            {delta === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
            <span
              className={`text-xs font-medium ${
                isPositive
                  ? colorPositive
                  : isNegative
                    ? colorNegative
                    : "text-muted-foreground"
              }`}
            >
              {isPositive ? "+" : ""}
              {delta}
              {suffix}
            </span>
            <span className="text-[10px] text-muted-foreground">WoW</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {subtitle && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Section 2: Funnel Loss Spotlight ─────────────────────────

function FunnelLossSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } =
    useInsightsData<FunnelLossStep[]>("loss");

  const maxLoss = data ? Math.max(...data.map((d) => d.lossRate), 0) : 0;

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.funnelLossSpotlight}
      icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((step) => {
            const isWorst = step.lossRate === maxLoss && maxLoss > 0;
            return (
              <div
                key={step.step}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  isWorst
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-muted/20"
                }`}
              >
                {/* Step labels */}
                <div className="flex items-center gap-1.5 min-w-[140px] sm:min-w-[180px]">
                  <span className="text-xs font-medium text-foreground truncate">
                    {t[STEP_LABEL_KEYS[step.step]]}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {t[STEP_LABEL_KEYS[step.nextStep]]}
                  </span>
                </div>

                {/* Loss bar */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isWorst ? "bg-red-500/70" : "bg-red-400/40"
                      }`}
                      style={{ width: `${Math.min(step.lossRate, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold min-w-[42px] text-right ${
                      isWorst ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    {step.lossRate}%
                  </span>
                </div>

                {/* Counts */}
                <span className="text-[10px] text-muted-foreground min-w-[60px] text-right hidden sm:block">
                  {step.fromCount}→{step.toCount}
                </span>

                {/* Archetype badges */}
                <div className="flex gap-1 min-w-[120px] justify-end hidden lg:flex">
                  {step.lostUserArchetypes.length > 0 ? (
                    step.lostUserArchetypes.map((a) => (
                      <Badge
                        key={a.type}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {a.type} ({a.count})
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.noFunnelData}</p>
      )}
      {/* Bottleneck diagnosis sub-card */}
      <BottleneckDiagnosisCard locale={locale} />
    </SectionShell>
  );
}

// ── Bottleneck Diagnosis Card (inside Funnel Loss) ──────────

function BottleneckDiagnosisCard({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const isZh = locale === "zh";
  const { data, loading } = useInsightsData<BottleneckDiagnosis | null>(
    "bottleneck",
  );

  if (loading || !data) return null;

  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t.bottleneckDiagnosis}
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {isZh ? data.interpretation.zh : data.interpretation.en}
          </p>
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0"
        >
          {data.worst.riskRatio}x risk
        </Badge>
      </div>

      {/* Mini bar chart: top segments */}
      {data.segments.length > 0 && (
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.segments.map((s) => ({
                name:
                  s.label.length > 20 ? s.label.slice(0, 18) + "…" : s.label,
                loss: s.lossRate,
                count: s.count,
              }))}
              layout="vertical"
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                stroke="var(--color-muted-foreground)"
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                stroke="var(--color-muted-foreground)"
                width={130}
              />
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={data.baselineLossRate}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: `avg ${data.baselineLossRate}%`,
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                }}
              />
              <Bar
                dataKey="loss"
                fill="rgb(245, 158, 11)"
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Section 3: UTM Channel Attribution ───────────────────────

function UTMAttributionSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } =
    useInsightsData<UTMAttributionResult>("utm");

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.channelAttribution}
      icon={<Megaphone className="w-5 h-5 text-purple-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && (
        <>
          {data.channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noUtmData}</p>
          ) : (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-purple-500/70" />
                  {t.utmTagged}: {data.totalAttributed}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                  {t.direct}: {data.totalDirect}
                </span>
              </div>

              {/* Attribution table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.channel}
                      </th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">
                        Campaign
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.visitors}
                      </th>
                      {FUNNEL_COLS.map((col) => (
                        <th
                          key={col.key}
                          className="text-center py-2 px-2 text-xs text-muted-foreground font-medium hidden md:table-cell"
                        >
                          {t[col.dictKey]}
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.full}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium hidden lg:table-cell">
                        NPS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.channels.map((ch, i) => {
                      const isDirect = ch.channel === "(direct)";
                      return (
                        <tr
                          key={`${ch.channel}-${ch.campaign}-${i}`}
                          className="border-b border-border/50 hover:bg-muted/20"
                        >
                          <td
                            className={`py-1.5 px-2 text-xs font-medium ${
                              isDirect
                                ? "text-muted-foreground"
                                : "text-purple-500"
                            }`}
                          >
                            {ch.channel}
                          </td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[120px]">
                            {ch.campaign ?? "—"}
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs font-medium">
                            {ch.visitors}
                          </td>
                          {FUNNEL_COLS.map((col) => (
                            <td
                              key={col.key}
                              className="py-1.5 px-2 text-center text-xs hidden md:table-cell"
                            >
                              <span
                                className={
                                  ch[col.key] > 0
                                    ? "text-foreground"
                                    : "text-muted-foreground/40"
                                }
                              >
                                {ch[col.key]}
                              </span>
                            </td>
                          ))}
                          <td className="py-1.5 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                ch.fullFunnelRate > 0
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {ch.fullFunnelRate}%
                            </Badge>
                          </td>
                          <td className="py-1.5 px-2 text-center text-xs hidden lg:table-cell">
                            {ch.avgNps != null ? (
                              <span
                                className={
                                  ch.avgNps >= 8
                                    ? "text-emerald-500 font-medium"
                                    : "text-foreground"
                                }
                              >
                                {ch.avgNps}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ── Section 4: Super User Profile ────────────────────────────

function SuperUserSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } =
    useInsightsData<SuperUserProfile>("super");

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.superUserProfile}
      icon={<Star className="w-5 h-5 text-amber-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && (
        <>
          {data.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noSuperUsers}</p>
          ) : (
            <div className="space-y-4">
              {/* Aggregate cards */}
              <div className="grid grid-cols-3 gap-3">
                <AggregateCard
                  label={t.topArchetypes}
                  items={data.profile.topArchetypes.map(
                    (a) => `${a.type} (${a.count})`,
                  )}
                />
                <AggregateCard
                  label={t.topCountries}
                  items={data.profile.topCountries.map(
                    (c) => `${c.country} (${c.count})`,
                  )}
                />
                <AggregateCard
                  label={t.topLanguages}
                  items={data.profile.topLanguages.map(
                    (l) => `${l.language} (${l.count})`,
                  )}
                />
              </div>

              {/* User table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">
                        Email
                      </th>
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.archetype}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        NPS
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.reportTime}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.coachingRounds}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.slice(0, 20).map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="py-1.5 px-2 text-xs truncate max-w-[200px]">
                          {u.email}
                        </td>
                        <td className="py-1.5 px-2">
                          {u.archetype ? (
                            <Badge variant="outline" className="text-[10px]">
                              {u.archetype}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs font-medium">
                          {u.nps}
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs">
                          {Math.round(u.reportTimeMs / 1000)}s
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs">
                          {u.coachingRounds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {interpolate(t.superUserCount, { count: data.users.length })}
              </p>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

function AggregateCard({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {items.length > 0 ? (
        <div className="space-y-0.5">
          {items.slice(0, 3).map((item, i) => (
            <p key={i} className="text-xs font-medium text-foreground truncate">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}

// ── Section 4: A/B Test Dashboard ────────────────────────────

const SIGNIFICANCE_COLORS: Record<string, string> = {
  significant: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  marginal: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  not_significant: "bg-muted/50 text-muted-foreground border-border",
};

function ABTestSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } = useInsightsData<ABTestResult>("ab");

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.abTestDashboard}
      icon={<BarChart className="w-5 h-5 text-violet-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && (
        <div className="space-y-4">
          {/* Sample sizes */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500/70" />
              Classic: n={data.classicTotal}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-500/70" />
              Immersive: n={data.immersiveTotal}
            </span>
          </div>

          {data.tests.length > 0 ? (
            <>
              {/* Bar chart comparison */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.tests.map((test) => ({
                      step: t[STEP_LABEL_KEYS[test.step]],
                      classic: test.classicRate,
                      immersive: test.immersiveRate,
                    }))}
                    barGap={2}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="step"
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="classic"
                      fill="rgb(59, 130, 246)"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="immersive"
                      fill="rgb(139, 92, 246)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Significance table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.step}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        Classic
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        Immersive
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.diff}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        p-value
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {"Cohen's h"}
                      </th>
                      <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium">
                        {t.significance}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tests.map((test) => (
                      <tr
                        key={test.step}
                        className="border-b border-border/50 hover:bg-muted/20"
                      >
                        <td className="py-1.5 px-2 text-xs font-medium">
                          {t[STEP_LABEL_KEYS[test.step]]}
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs">
                          {test.classicRate}%
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs">
                          {test.immersiveRate}%
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs font-medium">
                          {test.immersiveRate - test.classicRate > 0 ? "+" : ""}
                          {Math.round(
                            (test.immersiveRate - test.classicRate) * 10,
                          ) / 10}
                          pp
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs font-mono">
                          {test.pValue}
                        </td>
                        <td className="py-1.5 px-2 text-center text-xs font-mono">
                          {test.effectSizeH}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${SIGNIFICANCE_COLORS[test.significance]}`}
                          >
                            {t[SIGNIFICANCE_LABEL_KEYS[test.significance]]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.noAbTestData}</p>
          )}

          {/* A/B Trend line */}
          <ABTrendChart locale={locale} />

          {/* Power analysis & sample size guidance */}
          <PowerAnalysisCard
            locale={locale}
            classicTotal={data.classicTotal}
            immersiveTotal={data.immersiveTotal}
          />
        </div>
      )}
    </SectionShell>
  );
}

// ── Power Analysis Card (inside A/B Test section) ───────────

const EFFECT_TIERS = [
  { label: "small", h: 0.2, dictKey: "effectSmall" },
  { label: "medium", h: 0.5, dictKey: "effectMedium" },
  { label: "large", h: 0.8, dictKey: "effectLarge" },
] as const;

function PowerAnalysisCard({
  locale,
  classicTotal,
  immersiveTotal,
}: {
  locale: Locale;
  classicTotal: number;
  immersiveTotal: number;
}) {
  const t = useInsightsDict(locale);
  const minGroup = Math.min(classicTotal, immersiveTotal);

  // Compute required n per group for each effect tier
  const tiers = EFFECT_TIERS.map((tier) => {
    const nRequired = requiredSampleSizeFromH(tier.h);
    const still = Math.max(0, nRequired - minGroup);
    const reached = minGroup >= nRequired;
    return { ...tier, nRequired, still, reached };
  });

  const allReached = tiers.every((tr) => tr.reached);

  return (
    <div
      className={`p-3 rounded-lg border space-y-2 ${
        allReached
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-blue-500/10 border-blue-500/20"
      }`}
    >
      <p className="text-xs font-semibold text-foreground">{t.powerAnalysis}</p>
      <div className="grid grid-cols-3 gap-2">
        {tiers.map((tier) => (
          <div
            key={tier.label}
            className="bg-background/50 rounded p-2 space-y-1"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {interpolate(t[tier.dictKey], { h: tier.h })}
            </p>
            <p className="text-sm font-bold text-foreground">
              {tier.nRequired}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                {t.perGroup}
              </span>
            </p>
            {tier.reached ? (
              <p className="text-[10px] text-emerald-600 font-medium">
                {t.reached}
              </p>
            ) : (
              <p className="text-[10px] text-blue-600 font-medium">
                {interpolate(t.needMore, { still: tier.still })}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {interpolate(t.currentMinGroup, {
          min: minGroup,
          classic: classicTotal,
          immersive: immersiveTotal,
        })}
      </p>
    </div>
  );
}

// ── A/B Trend Chart (inside A/B Test section) ───────────────

function ABTrendChart({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const isZh = locale === "zh";
  const { data, loading } = useInsightsData<ABTrendAnalysis>("ab-trend");

  if (loading || !data || data.points.length < 2) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">
        {t.weeklyTrend}
      </h4>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.points}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="var(--color-muted-foreground)"
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === "classicRate" ? "Classic" : "Immersive",
              ]}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="classicRate"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="classicRate"
            />
            <Line
              type="monotone"
              dataKey="immersiveRate"
              stroke="rgb(139, 92, 246)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="immersiveRate"
            />
            {data.inflection && (
              <ReferenceLine
                x={data.inflection.week}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="6 3"
                label={{
                  value:
                    data.inflection.type === "converging"
                      ? t.converging
                      : t.inflection,
                  fontSize: 10,
                  fill: "var(--color-muted-foreground)",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation card */}
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
        <p className="text-xs text-foreground/80 leading-relaxed">
          {isZh ? data.interpretation.zh : data.interpretation.en}
        </p>
      </div>
    </div>
  );
}

// ── Section 6: Pre/Post Effect Summary ──────────────────────

function PrePostEffectSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const isZh = locale === "zh";
  const { data, loading, error, reload } =
    useInsightsData<PrePostEffectSummary | null>("prepost-effect");

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.researchImpactSummary}
      icon={<FlaskConical className="w-5 h-5 text-emerald-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data ? (
        <div className="space-y-4">
          {/* One-line summary with copy button */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-2">
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                {isZh ? data.summary.zh : data.summary.en}
              </p>
              <button
                onClick={() => {
                  const text = isZh ? data.summary.zh : data.summary.en;
                  navigator.clipboard.writeText(text);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                title={t.copyToClipboard}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Effect cards grid — T0→T1 and T0→T2 are separate paired tests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.sccImmediate && (
              <EffectCard
                locale={locale}
                label="SCC T0→T1"
                result={data.sccImmediate}
              />
            )}
            {data.scc1Week && (
              <EffectCard
                locale={locale}
                label="SCC T0→T2 (1wk)"
                result={data.scc1Week}
              />
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <p className="text-sm text-muted-foreground">
            {t.insufficientPrePost}
          </p>
        )
      )}
    </SectionShell>
  );
}

function EffectCard({
  locale,
  label,
  result,
}: {
  locale: Locale;
  label: string;
  result: {
    meanDelta: number;
    d: number;
    label: string;
    pValue: number;
    tStat: number;
    significant: boolean;
    n: number;
  };
}) {
  const t = useInsightsDict(locale);
  const effectColors: Record<string, string> = {
    large: "text-emerald-600 dark:text-emerald-400",
    medium: "text-blue-600 dark:text-blue-400",
    small: "text-amber-600 dark:text-amber-400",
    negligible: "text-muted-foreground",
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${result.significant ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-muted-foreground/30"}`}
          >
            {result.significant ? "p<0.05" : "n.s."}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">{t.meanDelta}</p>
            <p className="font-mono font-medium">
              {result.meanDelta > 0 ? "+" : ""}
              {result.meanDelta}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{"Cohen's d"}</p>
            <p
              className={`font-mono font-medium ${effectColors[result.label] || ""}`}
            >
              {result.d} ({result.label})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">p-value</p>
            <p className="font-mono">{result.pValue}</p>
          </div>
          <div>
            <p className="text-muted-foreground">n</p>
            <p className="font-mono">{result.n}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section 7: Cohort Retention Matrix ───────────────────────

function RetentionSection({ locale }: { locale: Locale }) {
  const t = useInsightsDict(locale);
  const { data, loading, error, reload } =
    useInsightsData<CohortRetentionMatrix>("retention");

  // Find max weekN across all cohorts for column headers
  const maxWeekN = data
    ? Math.max(
        ...data.cohorts.flatMap((c) => c.retention.map((r) => r.weekN)),
        0,
      )
    : 0;

  return (
    <SectionShell
      refreshLabel={t.refresh}
      title={t.cohortRetention}
      icon={<Users className="w-5 h-5 text-emerald-500" />}
      loading={loading}
      error={error}
      onReload={reload}
    >
      {data && (
        <>
          {data.cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noRetentionData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium min-w-[90px]">
                      {t.cohortWeek}
                    </th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium min-w-[40px]">
                      n
                    </th>
                    {Array.from({ length: maxWeekN + 1 }, (_, i) => (
                      <th
                        key={i}
                        className="text-center py-2 px-2 text-muted-foreground font-medium min-w-[48px]"
                      >
                        W{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cohorts.map((cohort) => {
                    // Build retention lookup
                    const retMap = new Map<number, number>();
                    for (const r of cohort.retention)
                      retMap.set(r.weekN, r.rate);

                    return (
                      <tr
                        key={cohort.week}
                        className="border-b border-border/30"
                      >
                        <td className="py-1.5 px-2 font-medium text-foreground">
                          {cohort.week}
                        </td>
                        <td className="py-1.5 px-2 text-center text-muted-foreground">
                          {cohort.size}
                        </td>
                        {Array.from({ length: maxWeekN + 1 }, (_, i) => {
                          const rate = retMap.get(i);
                          return (
                            <td key={i} className="py-1 px-1 text-center">
                              {rate != null ? (
                                <span
                                  className="inline-block w-full py-1 rounded text-[11px] font-medium"
                                  style={{
                                    backgroundColor: retentionColor(rate),
                                    color: rate > 50 ? "white" : "inherit",
                                  }}
                                >
                                  {rate}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </SectionShell>
  );
}

function retentionColor(rate: number): string {
  // 0% → light gray, 100% → deep green
  if (rate >= 80) return "rgba(16, 185, 129, 0.8)"; // emerald-500
  if (rate >= 60) return "rgba(16, 185, 129, 0.6)";
  if (rate >= 40) return "rgba(16, 185, 129, 0.4)";
  if (rate >= 20) return "rgba(16, 185, 129, 0.25)";
  if (rate > 0) return "rgba(16, 185, 129, 0.12)";
  return "rgba(0, 0, 0, 0.03)";
}
