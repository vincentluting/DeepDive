"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  PieChart,
  Pie,
  ErrorBar,
  Legend,
} from "recharts";
import {
  FlaskConical,
  Clock,
  BarChart3,
  MessageSquare,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import {
  pairedTTest,
  cohenDPaired,
  effectSizeLabel,
} from "@/lib/admin/statistics";
import { reportClientError } from "@/lib/observability/client-error";

// ── Types ────────────────────────────────────────

interface PrePostPairedRow {
  userId: string;
  sccPre: number;
  sccPost: number;
  postType: string;
}

interface CompletionTimeBucket {
  bucket: string;
  quickCount: number;
  deepCount: number;
}

interface CompletionTimeStats {
  buckets: CompletionTimeBucket[];
  quickMedianMs: number;
  deepMedianMs: number;
}

interface DropoffPoint {
  module: string;
  questionIndex: number;
  count: number;
}

interface ReportEngagementStats {
  avgAnchors: number;
  stdAnchors: number;
  avgCareers: number;
  stdCareers: number;
  avgShadow: number;
  stdShadow: number;
  avgLetter: number;
  stdLetter: number;
  avgExplore: number;
  stdExplore: number;
  avgTotalMs: number;
  avgScrollDepth: number;
  avgScrollbackCount: number;
  n: number;
}

interface CoachingDepthStats {
  totalSessions: number;
  avgRounds: number;
  avgMessageLength: number;
  roundDistribution: { rounds: number; count: number }[];
  messageLengthBuckets: { bucket: string; count: number }[];
  feedbackDistribution: { rating: string; count: number }[];
}

interface ResearchGroupData {
  group: string;
  count: number;
  completedCount: number;
  completionRate: number;
  avgTimeMs: number;
  riasecAvg: Record<string, number>;
  npsDistribution: { score: number; count: number }[];
  avgNps: number;
}

interface ResearchGroupComparison {
  classic: ResearchGroupData | null;
  immersive: ResearchGroupData | null;
}

interface ThesisData {
  prePostPaired: PrePostPairedRow[];
  completionTime: CompletionTimeStats;
  reportEngagement: ReportEngagementStats;
  coachingDepth: CoachingDepthStats;
  researchGroups: ResearchGroupComparison;
  dropoff: DropoffPoint[];
}

// ── Shared Tooltip Style ─────────────────────────

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "13px",
};

// pairedTTest, cohenDPaired, effectSizeLabel, significanceLabel
// → imported from @/lib/admin/statistics

// ── No Data Placeholder ─────────────────────────

function NoData({ locale }: { locale: Locale }) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      {tl("noData", "No data yet")}
    </div>
  );
}

// ── Section Header ──────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// ── KPI Metric Card ─────────────────────────────

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── 1. SCC Pre-Post Scatter Plot ───────────

function PrePostScatterChart({
  data,
  locale,
}: {
  data: PrePostPairedRow[];
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  const [postType, setPostType] = useState<"post_immediate" | "post_1week">(
    "post_immediate",
  );

  const filtered = data.filter((d) => d.postType === postType);

  const sccData = filtered.map((d) => ({ x: d.sccPre, y: d.sccPost }));

  const sccPre = filtered.map((d) => d.sccPre);
  const sccPost = filtered.map((d) => d.sccPost);

  const sccStats = pairedTTest(sccPre, sccPost);
  const sccD = cohenDPaired(sccPre, sccPost);

  const maxVal = Math.max(...sccData.map((d) => Math.max(d.x, d.y)), 10);
  const minVal = Math.min(...sccData.map((d) => Math.min(d.x, d.y)), 0);
  const domain: [number, number] = [
    Math.floor(minVal - 1),
    Math.ceil(maxVal + 1),
  ];

  if (data.length === 0) return <NoData locale={locale} />;

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPostType("post_immediate")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            postType === "post_immediate"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {tl("postImmediate", "Post-Immediate")}
        </button>
        <button
          onClick={() => setPostType("post_1week")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            postType === "post_1week"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {tl("post1Week", "Post-1Week")}
        </button>
      </div>

      <div>
        {/* SCC Scatter */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">SCC</p>
          {sccStats && (
            <p className="text-xs text-muted-foreground mb-2">
              Δ = {sccStats.meanDelta >= 0 ? "+" : ""}
              {sccStats.meanDelta.toFixed(2)}
              {" · "}
              <span
                className={
                  sccStats.pValue < 0.05 ? "text-emerald-500" : "text-amber-500"
                }
              >
                p = {sccStats.pValue.toFixed(3)}
              </span>
              {sccD != null && (
                <>
                  {" · "}
                  <span className="font-medium">
                    d = {sccD.toFixed(2)}
                  </span>{" "}
                  <span className="text-[10px]">({effectSizeLabel(sccD)})</span>
                </>
              )}
              {" · "}n = {filtered.length}
            </p>
          )}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Pre"
                  domain={domain}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Pre",
                    position: "bottom",
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Post"
                  domain={domain}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Post",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <ReferenceLine
                  segment={[
                    { x: domain[0], y: domain[0] },
                    { x: domain[1], y: domain[1] },
                  ]}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                <Scatter data={sccData} fill="#f59e0b" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Completion Time Histogram ────────────────

function CompletionTimeHistogram({
  data,
  locale,
}: {
  data: CompletionTimeStats;
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  if (data.buckets.length === 0) return <NoData locale={locale} />;

  const quickMedianMin = Math.round(data.quickMedianMs / 60000);
  const deepMedianMin = Math.round(data.deepMedianMs / 60000);

  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm mr-1"
            style={{ backgroundColor: "#22c55e" }}
          />
          {interpolate(tl("quickDiveMedian", "Quick Dive median: {value}min"), {
            value: quickMedianMin,
          })}
        </span>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm mr-1"
            style={{ backgroundColor: "#3b82f6" }}
          />
          {interpolate(tl("deepDiveMedian", "Deep Dive median: {value}min"), {
            value: deepMedianMin,
          })}
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.buckets}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: tl("completionTimeLabel", "Completion Time (min)"),
                position: "bottom",
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
                offset: -2,
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: tl("usersAxisLabel", "Users"),
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="quickCount"
              name="Quick Dive"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="deepCount"
              name="Deep Dive"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
            {/* Rush suspect zone marker via reference line */}
            <ReferenceLine
              x="0-5"
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        <span className="text-red-400">⚠</span>{" "}
        {tl("rushSuspect", "< 5min = rush suspect")}
      </p>
    </div>
  );
}

// ── 3. Module Dropoff Heatmap ───────────────────

const MODULE_CONFIG: Record<string, { label: string; maxQ: number }> = {
  A: { label: "SJT", maxQ: 6 },
  B: { label: "DDVQ-21", maxQ: 21 },
  C: { label: "IPIP-60", maxQ: 60 },
};

function DropoffHeatmap({
  data,
  locale,
}: {
  data: DropoffPoint[];
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  if (data.length === 0) return <NoData locale={locale} />;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Build a lookup map
  const lookup: Record<string, number> = {};
  for (const d of data) {
    lookup[`${d.module}-${d.questionIndex}`] = d.count;
  }

  const modules = ["A", "B", "C"];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {modules.map((mod) => {
          const cfg = MODULE_CONFIG[mod] || { label: mod, maxQ: 10 };
          const questions = Array.from({ length: cfg.maxQ }, (_, i) => i);
          return (
            <div key={mod} className="mb-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                {tl("moduleLabel", "Module")} {mod}: {cfg.label}
              </p>
              <div className="flex gap-px flex-wrap">
                {questions.map((qi) => {
                  const count = lookup[`${mod}-${qi}`] || 0;
                  const intensity =
                    count > 0 ? Math.max(0.15, count / maxCount) : 0;
                  return (
                    <div
                      key={qi}
                      className="w-4 h-6 rounded-sm relative group cursor-default"
                      style={{
                        backgroundColor:
                          count > 0
                            ? `rgba(239, 68, 68, ${intensity})`
                            : "hsl(var(--muted))",
                      }}
                      title={`${cfg.label} Q${qi + 1}: ${count} ${tl("abandoned", "abandoned")}`}
                    >
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-[10px] text-popover-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-lg">
                        {cfg.label} Q{qi + 1}: {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{tl("low", "Low")}</span>
          <div className="flex gap-px">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((a) => (
              <div
                key={a}
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(239, 68, 68, ${a})` }}
              />
            ))}
          </div>
          <span>{tl("high", "High")}</span>
        </div>
      </div>
    </div>
  );
}

// ── 4. Report Panel Dwell Time ──────────────────

function ReportDwellTimeChart({
  data,
  locale,
}: {
  data: ReportEngagementStats;
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  if (data.n === 0) return <NoData locale={locale} />;

  const panels = [
    {
      name: tl("anchorsName", "Career\nAnchors"),
      short: "Anc",
      avgSec: Math.round(data.avgAnchors / 1000),
      stdSec: Math.round(data.stdAnchors / 1000),
    },
    {
      name: tl("careersName", "Career\nLandscape"),
      short: "Car",
      avgSec: Math.round(data.avgCareers / 1000),
      stdSec: Math.round(data.stdCareers / 1000),
    },
    {
      name: tl("shadowName", "Shadow &\nDrain"),
      short: "Shd",
      avgSec: Math.round(data.avgShadow / 1000),
      stdSec: Math.round(data.stdShadow / 1000),
    },
    {
      name: tl("letterName", "Letter\n& Coach"),
      short: "Ltr",
      avgSec: Math.round(data.avgLetter / 1000),
      stdSec: Math.round(data.stdLetter / 1000),
    },
    {
      name: tl("exploreName", "Feedback &\nMethodology"),
      short: "Exp",
      avgSec: Math.round(data.avgExplore / 1000),
      stdSec: Math.round(data.stdExplore / 1000),
    },
  ];

  const chartData = panels.map((p) => ({
    name: p.short,
    avg: p.avgSec,
    errorY: p.stdSec,
  }));

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          label={tl("avgTotalTime", "Avg Total Time")}
          value={`${Math.round(data.avgTotalMs / 1000)}s`}
        />
        <MetricCard
          label={tl("avgScrollDepth", "Avg Scroll Depth")}
          value={`${Math.round(data.avgScrollDepth)}%`}
        />
        <MetricCard
          label={tl("avgScrollbacks", "Avg Scrollbacks")}
          value={data.avgScrollbackCount.toFixed(1)}
          sub={`n = ${data.n}`}
        />
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: tl("secAxisLabel", "sec"),
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => `${v}s`}
            />
            <Bar
              dataKey="avg"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              <ErrorBar
                dataKey="errorY"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Panel detail table */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
        {panels.map((p) => (
          <div key={p.short} className="bg-muted/30 rounded p-2 text-center">
            <p className="text-muted-foreground">{p.short}</p>
            <p className="font-medium text-foreground">{p.avgSec}s</p>
            <p className="text-muted-foreground/70">±{p.stdSec}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5. Coaching Depth Panel ─────────────────────

const FEEDBACK_COLORS: Record<string, string> = {
  very_helpful: "#22c55e",
  helpful: "#3b82f6",
  okay: "#f59e0b",
};

const FEEDBACK_LABELS: Record<string, Record<string, string>> = {
  very_helpful: { en: "Very Helpful", zh: "非常有帮助" },
  helpful: { en: "Helpful", zh: "有帮助" },
  okay: { en: "Okay", zh: "一般" },
};

function CoachingDepthPanel({
  data,
  locale,
}: {
  data: CoachingDepthStats;
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  if (data.totalSessions === 0) return <NoData locale={locale} />;

  const feedbackPie = data.feedbackDistribution.map((d) => ({
    name: FEEDBACK_LABELS[d.rating]?.[locale] || d.rating,
    value: d.count,
    color: FEEDBACK_COLORS[d.rating] || "#64748b",
  }));

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          label={tl("totalSessions", "Total Sessions")}
          value={data.totalSessions}
        />
        <MetricCard
          label={tl("avgRounds", "Avg Rounds")}
          value={data.avgRounds}
        />
        <MetricCard
          label={tl("avgMsgLength", "Avg Msg Length")}
          value={data.avgMessageLength}
          sub={tl("chars", "chars")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* A: Round Distribution */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {tl("roundDistribution", "Round Distribution")}
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.roundDistribution}
                margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="rounds"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B: Message Length Distribution */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {tl("msgLengthDistribution", "Message Length Distribution")}
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.messageLengthBuckets}
                margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="count"
                  fill="var(--chart-3)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* C: Feedback Pie */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {tl("feedbackRating", "Feedback Rating")}
          </p>
          {feedbackPie.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feedbackPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {feedbackPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 6. Research Group Comparison ─────────────────

const RIASEC_KEYS = ["R", "I", "A", "S", "E", "C"];
const _RIASEC_LABELS: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

function ResearchGroupPanel({
  data,
  locale,
}: {
  data: ResearchGroupComparison;
  locale: Locale;
}) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  if (!data.classic && !data.immersive) return <NoData locale={locale} />;

  // Build RIASEC comparison bar chart data
  const riasecData = RIASEC_KEYS.map((key) => ({
    dimension: key,
    classic:
      data.classic?.riasecAvg[key] ||
      data.classic?.riasecAvg[key.toLowerCase()] ||
      0,
    immersive:
      data.immersive?.riasecAvg[key] ||
      data.immersive?.riasecAvg[key.toLowerCase()] ||
      0,
  }));

  return (
    <div>
      {/* Group overview cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {(["classic", "immersive"] as const).map((group) => {
          const g = data[group];
          if (!g)
            return (
              <div
                key={group}
                className="bg-muted/30 rounded-lg p-4 text-center"
              >
                <p className="text-sm font-medium text-muted-foreground capitalize">
                  {group}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tl("noGroupData", "No data")}
                </p>
              </div>
            );
          return (
            <div key={group} className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground capitalize mb-2">
                {group === "classic"
                  ? tl("classicGroup", "Classic Group")
                  : tl("immersiveGroup", "Immersive Group")}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">
                    {tl("usersLabel", "Users")}:{" "}
                  </span>
                  <span className="text-foreground font-medium">{g.count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {tl("completionLabel", "Completion")}:{" "}
                  </span>
                  <span className="text-foreground font-medium">
                    {g.completionRate}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {tl("avgTimeLabel", "Avg Time")}:{" "}
                  </span>
                  <span className="text-foreground font-medium">
                    {g.avgTimeMs > 0
                      ? `${Math.round(g.avgTimeMs / 60000)}min`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">NPS: </span>
                  <span className="text-foreground font-medium">
                    {g.avgNps || "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIASEC Comparison */}
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {tl("riasecComparison", "RIASEC Dimension Comparison")}
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={riasecData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [
                value.toFixed(1),
                name === "classic"
                  ? tl("classicTooltip", "Classic")
                  : tl("immersiveTooltip", "Immersive"),
              ]}
            />
            <Bar
              dataKey="classic"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
              name="classic"
            />
            <Bar
              dataKey="immersive"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
              name="immersive"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* NPS Comparison (if data exists) */}
      {data.classic && data.immersive && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {tl("npsDistribution", "NPS Distribution Comparison")}
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {(["classic", "immersive"] as const).map((group) => {
              const g = data[group];
              if (!g) return null;
              const total = g.npsDistribution.reduce((s, d) => s + d.count, 0);
              if (total === 0)
                return (
                  <div
                    key={group}
                    className="text-muted-foreground text-center py-4"
                  >
                    {tl("noNpsData", "No NPS data")}
                  </div>
                );
              return (
                <div key={group}>
                  <p className="text-muted-foreground mb-1 capitalize">
                    {group === "classic"
                      ? tl("classicTooltip", "Classic")
                      : tl("immersiveTooltip", "Immersive")}{" "}
                    (avg: {g.avgNps})
                  </p>
                  <div className="space-y-1">
                    {g.npsDistribution
                      .filter((d) => d.count > 0)
                      .map((d) => (
                        <div key={d.score} className="flex items-center gap-1">
                          <span className="w-4 text-right text-muted-foreground">
                            {d.score}
                          </span>
                          <div className="flex-1 h-2 bg-muted/30 rounded-full">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(d.count / total) * 100}%`,
                                backgroundColor:
                                  d.score >= 9
                                    ? "#22c55e"
                                    : d.score >= 7
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="w-4 text-muted-foreground">
                            {d.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────

export function ThesisAnalyticsPanel({ locale }: { locale: Locale }) {
  const th = (getDictionaryClient(locale).admin as Record<string, unknown>)
    ?.thesis as Record<string, string> | undefined;
  const tl = (key: string, fallback: string) => th?.[key] || fallback;
  const [data, setData] = useState<ThesisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchThesisData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics?section=thesis");
      if (!res.ok) return;
      const json: ThesisData = await res.json();
      setData(json);
    } catch (err) {
      reportClientError(err, {
        component: "ThesisAnalyticsPanel",
        feature: "admin",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded && !data) {
      fetchThesisData();
    }
  }, [expanded, data, fetchThesisData]);

  return (
    <div className="space-y-4">
      {/* Section Header with expand toggle */}
      <Card className="bg-card border-border border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {tl("title", "Thesis Research Analytics")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {tl(
                    "subtitle",
                    "Pre-Post paired analysis · Completion time · Dropoff heatmap · Report engagement · Coaching depth · Group comparison",
                  )}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 ml-2">
              {expanded ? tl("collapse", "Collapse") : tl("expand", "Expand")}
            </Badge>
          </button>
        </CardContent>
      </Card>

      {expanded && (
        <>
          {loading && !data ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-muted/30 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : data ? (
            <>
              {/* 1. SCC Pre-Post Scatter */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={FlaskConical}
                    title={tl("scatterTitle", "SCC Pre-Post Paired Scatter")}
                    subtitle={tl(
                      "scatterSubtitle",
                      "Each dot = one user · Above diagonal = improved · Toggle between post timepoints",
                    )}
                  />
                  <PrePostScatterChart
                    data={data.prePostPaired}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* 2. Completion Time Distribution */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={Clock}
                    title={tl(
                      "completionTimeTitle",
                      "Completion Time Distribution",
                    )}
                    subtitle={tl(
                      "completionTimeSubtitle",
                      "Bucketed completion times for Quick Dive and Deep Dive",
                    )}
                  />
                  <CompletionTimeHistogram
                    data={data.completionTime}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* 3. Module Dropoff Heatmap */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={BarChart3}
                    title={tl("dropoffTitle", "Module-Level Dropoff Heatmap")}
                    subtitle={tl(
                      "dropoffSubtitle",
                      "Darker = more abandonments at that position · Hover for details",
                    )}
                  />
                  <DropoffHeatmap data={data.dropoff} locale={locale} />
                </CardContent>
              </Card>

              {/* 4. Report Panel Dwell Time */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={BarChart3}
                    title={tl("dwellTitle", "Report Panel Dwell Time")}
                    subtitle={tl(
                      "dwellSubtitle",
                      "Average dwell time per panel (sec) + std dev · Excludes < 5s invalid data",
                    )}
                  />
                  <ReportDwellTimeChart
                    data={data.reportEngagement}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* 5. Coaching Depth Analysis */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={MessageSquare}
                    title={tl("coachingTitle", "Coaching Depth Analysis")}
                    subtitle={tl(
                      "coachingSubtitle",
                      "Conversation rounds · Message length · Feedback ratings",
                    )}
                  />
                  <CoachingDepthPanel
                    data={data.coachingDepth}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* 6. Research Group Comparison */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 sm:p-6">
                  <SectionHeader
                    icon={Users}
                    title={tl("groupTitle", "Research Group Comparison")}
                    subtitle={tl(
                      "groupSubtitle",
                      "Classic vs Immersive · RIASEC comparison · Completion rate · NPS",
                    )}
                  />
                  <ResearchGroupPanel
                    data={data.researchGroups}
                    locale={locale}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {tl("loadFailed", "Failed to load thesis data")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
