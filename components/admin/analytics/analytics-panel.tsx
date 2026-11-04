"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Users,
  Globe,
  Activity,
  TrendingUp,
  FileText,
  ExternalLink,
  Bot,
  RefreshCw,
  Info,
  Star,
  ThumbsUp,
  Sparkles,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { countryCodeToFlag } from "@/lib/utils/country-flags";
import type { Locale } from "@/lib/i18n/config";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { NotableVisits } from "./notable-visits";

import { AnalyticsHealthPanel } from "@/components/admin/analytics-health-panel";
import { reportClientError } from "@/lib/observability/client-error";

// ── Types ────────────────────────────────────────

interface VisitOverview {
  totalPV: number;
  uniqueVisitors: number;
  botVisits: number;
  todayPV: number;
  todayUV: number;
  weekPV: number;
  mobilePercent: number;
}

interface VisitTrendPoint {
  date: string;
  pv: number;
  uv: number;
}

interface RecentVisitor {
  id: string;
  path: string;
  ipHash: string | null;
  userAgent: string | null;
  referer: string | null;
  userId: string | null;
  userEmail: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isMobile: boolean | null;
  platform: string | null;
  deviceType: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  durationMs: number | null;
  isBot: boolean;
  isInternal: boolean;
  createdAt: string;
}

interface CampaignStat {
  utmSource: string;
  utmCampaign: string | null;
  visits: number;
  registrations: number;
}

interface VisitorJourneyEvent {
  id: string;
  path: string;
  country: string | null;
  city: string | null;
  referer: string | null;
  deviceType: string | null;
  userId: string | null;
  userEmail: string | null;
  durationMs: number | null;
  createdAt: string;
}

interface VisitorJourneyFingerprint {
  fullUA: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  platform: string | null;
  deviceType: string | null;
}

interface VisitorJourney {
  ipHash: string;
  events: VisitorJourneyEvent[];
  fingerprint: VisitorJourneyFingerprint;
  summary: {
    totalVisits: number;
    firstVisit: string;
    lastVisit: string;
    spanMs: number;
    isRegistered: boolean;
    deepestPage: string | null;
  };
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

interface TopReferrer {
  domain: string;
  visits: number;
}

interface CountryVisit {
  country: string;
  visits: number;
}

interface ReactionDistribution {
  surprised: number;
  skeptical: number;
  resonates: number;
  total: number;
}

interface NPSDistribution {
  distribution: { score: number; count: number }[];
  average: number;
  promoterRate: number;
  recentFeedback: { score: number; feedback: string; createdAt: string }[];
}

interface ArchetypeCount {
  archetype: string;
  count: number;
}

interface CountryInsight {
  totalVisits: number;
  uniqueVisitors: number;
  registeredUsers: number;
  topPages: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referer: string; count: number }>;
  visitsByHour: Array<{ hour: number; count: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  avgVisitsPerUser: number;
  conversionRate: number;
  recentTrend: Array<{ date: string; visits: number }>;
}

interface GeoCount {
  country: string;
  count: number;
}

interface AnalyticsData {
  overview: VisitOverview;
  trend: VisitTrendPoint[];
  recentVisitors: RecentVisitor[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
  byCountry: CountryVisit[];
  reactions: ReactionDistribution;
  nps: NPSDistribution;
  archetypes: ArchetypeCount[];
  campaigns: CampaignStat[];
  countryInsight?: CountryInsight | null;
  registrationGeo: GeoCount[];
  days: number;
}

// ── Helpers ──────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes} UTC`;
}

function formatTrendDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parts[1]}/${parts[2]}`;
}

function shortenPath(path: string, maxLen: number = 30): string {
  if (path.length <= maxLen) return path;
  return path.slice(0, maxLen - 3) + "...";
}

function shortenUA(ua: string | null): string {
  if (!ua) return "—";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("curl")) return "cURL";
  if (ua.includes("python")) return "Python";
  if (ua.includes("vercel")) return "Vercel";
  return ua.slice(0, 20) + "...";
}

function deviceEmoji(
  deviceType: string | null,
  isMobile: boolean | null,
): string {
  if (deviceType === "tablet") return "📲";
  if (deviceType === "mobile" || isMobile === true) return "📱";
  return "💻";
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatSpan(ms: number): string {
  if (ms < 60_000) return "<1m";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function isDeepPage(path: string): boolean {
  return (
    path.includes("/report") ||
    path.includes("/coaching") ||
    path.includes("/questionnaire") ||
    path.includes("/deepdive")
  );
}

const OWN_DOMAINS = [
  "deepdivecareer.com",
  "www.deepdivecareer.com",
  "v0-career-exploration-questionnaire.vercel.app",
];

function extractDomain(referer: string | null): string {
  if (!referer) return "Direct";
  try {
    const hostname = new URL(referer).hostname;
    if (OWN_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d))) {
      return "Self";
    }
    return hostname;
  } catch {
    return referer.slice(0, 30);
  }
}

function isPreviewDeploy(referer: string | null): boolean {
  if (!referer) return false;
  return (
    /\.vercel\.app/i.test(referer) && !/deepdivecareer\.com/i.test(referer)
  );
}

/** 从完整 userAgent 字符串中提取浏览器版本 + OS 版本 */
function parseUADetail(ua: string): string {
  const parts: string[] = [];

  // 浏览器 + 版本
  const edge = ua.match(/Edg\/([\d.]+)/);
  const chrome = ua.match(/Chrome\/([\d.]+)/);
  const safari = ua.match(/Version\/([\d.]+).*Safari/);
  const firefox = ua.match(/Firefox\/([\d.]+)/);

  if (edge) parts.push(`Edge ${edge[1]}`);
  else if (chrome && !ua.includes("Edg")) parts.push(`Chrome ${chrome[1]}`);
  else if (safari) parts.push(`Safari ${safari[1]}`);
  else if (firefox) parts.push(`Firefox ${firefox[1]}`);

  // OS + 版本
  const mac = ua.match(/Mac OS X ([\d_]+)/);
  const win = ua.match(/Windows NT ([\d.]+)/);
  const android = ua.match(/Android ([\d.]+)/);
  const ios = ua.match(/iPhone OS ([\d_]+)/);

  if (mac) parts.push(`macOS ${mac[1].replace(/_/g, ".")}`);
  else if (win) {
    const winVer: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.1": "7",
    };
    parts.push(`Windows ${winVer[win[1]] || win[1]}`);
  } else if (ios) parts.push(`iOS ${ios[1].replace(/_/g, ".")}`);
  else if (android) parts.push(`Android ${android[1]}`);

  return parts.join(" · ") || ua.slice(0, 40) + "...";
}

// ── KPI Hover Tooltip ────────────────────────────

function KpiTooltip({ text }: { text: string }) {
  return (
    <span className="group/kpi relative inline-flex ml-1">
      <Info className="w-3 h-3 text-muted-foreground/40 group-hover/kpi:text-muted-foreground transition-colors cursor-help" />
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground leading-relaxed w-52 opacity-0 invisible group-hover/kpi:opacity-100 group-hover/kpi:visible transition-all duration-150 z-50 pointer-events-none">
        {text}
      </span>
    </span>
  );
}

// ── Custom Tooltip ───────────────────────────────

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.dataKey === "pv" ? "PV" : "UV"}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Reaction Colors ──────────────────────────────

const REACTION_COLORS: Record<string, string> = {
  resonates: "#22c55e",
  surprised: "#f59e0b",
  skeptical: "#ef4444",
};

// ── NPS Score Colors ─────────────────────────────

function npsBarColor(score: number): string {
  if (score >= 9) return "#22c55e"; // promoter
  if (score >= 7) return "#f59e0b"; // passive
  return "#ef4444"; // detractor
}

// ── Main Component ───────────────────────────────

export function AnalyticsDashboardPanel({ locale }: { locale: Locale }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [filterReal, setFilterReal] = useState(true);
  const [countryFilter, setCountryFilter] = useState("");
  // Journey drill-down: undefined=not loaded, 'loading'=in-flight, VisitorJourney|null=loaded
  const [journeys, setJourneys] = useState<
    Record<string, VisitorJourney | null | "loading">
  >({});
  const [expandedJourneys, setExpandedJourneys] = useState<Set<string>>(
    new Set(),
  );
  // Owner marker state
  const [ownerMarked, setOwnerMarked] = useState<boolean | null>(null);
  const [ownerMarkLoading, setOwnerMarkLoading] = useState(false);
  const [archetypeExpanded, setArchetypeExpanded] = useState(false);
  const [engagementData, setEngagementData] = useState<{
    overview: {
      totalSessions: number;
      avgTotalTimeSec: number;
      avgMaxScrollDepth: number;
      avgScrollbacksPerSession: number;
      panelAvgTimeSec: Record<string, number>;
    };
    sessions: Array<{
      id: string;
      reportId: string;
      userId: string | null;
      totalTimeMs: number | null;
      maxScrollDepth: number | null;
      panelTimes: Record<string, number | undefined>;
      scrollbackCount: number;
      createdAt: string;
    }>;
  } | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [refreshingViews, setRefreshingViews] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    ok: boolean;
    ms?: number;
  } | null>(null);

  const t = getDictionaryClient(locale);
  const at = (t.admin?.analytics || {}) as Record<string, string>;

  const label = (
    key: string,
    fallbackEn: string,
    fallbackZh?: string,
  ): string => {
    return at[key] || (locale === "zh" ? fallbackZh || fallbackEn : fallbackEn);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (filterReal) params.set("filter", "real");
      if (countryFilter) params.set("country", countryFilter);
      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) return;
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      reportClientError(err, { component: "AnalyticsDashboardPanel", feature: "admin" });
    } finally {
      setLoading(false);
    }
  }, [days, filterReal, countryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch report engagement data
  useEffect(() => {
    setEngagementLoading(true);
    fetch(`/api/admin/report-engagement?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEngagementData(d))
      .catch(() => setEngagementData(null))
      .finally(() => setEngagementLoading(false));
  }, [days]);

  // Check owner cookie status on mount
  useEffect(() => {
    fetch("/api/admin/mark-owner")
      .then((r) => r.json())
      .then((d) => setOwnerMarked(d.marked ?? false))
      .catch(() => setOwnerMarked(false));

    // Silently trigger notable visitor scan in background
    csrfFetch("/api/admin/notable", { method: "POST" }).catch(() => {});
  }, []);

  const handleToggleOwner = async () => {
    setOwnerMarkLoading(true);
    try {
      if (ownerMarked) {
        const res = await csrfFetch("/api/admin/mark-owner", {
          method: "DELETE",
        });
        if (res.ok) setOwnerMarked(false);
      } else {
        const res = await csrfFetch("/api/admin/mark-owner", {
          method: "POST",
        });
        if (res.ok) setOwnerMarked(true);
      }
    } catch (err) {
      reportClientError(err, { component: "AnalyticsDashboardPanel", feature: "admin" });
    } finally {
      setOwnerMarkLoading(false);
    }
  };

  const toggleJourney = async (ipHash: string) => {
    const isExpanded = expandedJourneys.has(ipHash);
    if (isExpanded) {
      setExpandedJourneys((prev) => {
        const s = new Set(prev);
        s.delete(ipHash);
        return s;
      });
      return;
    }
    setExpandedJourneys((prev) => new Set(prev).add(ipHash));
    if (journeys[ipHash] !== undefined) return; // already loaded (or loading)
    setJourneys((prev) => ({ ...prev, [ipHash]: "loading" }));
    try {
      const res = await fetch(
        `/api/admin/analytics?journey=${encodeURIComponent(ipHash)}`,
      );
      if (!res.ok) {
        setJourneys((prev) => ({ ...prev, [ipHash]: null }));
        return;
      }
      const json = await res.json();
      setJourneys((prev) => ({ ...prev, [ipHash]: json.journey ?? null }));
    } catch {
      setJourneys((prev) => ({ ...prev, [ipHash]: null }));
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {label("loadFailed", "Failed to load analytics data")}
      </div>
    );
  }

  const {
    overview,
    trend,
    recentVisitors,
    topPages,
    topReferrers,
    byCountry,
    reactions,
    nps,
    archetypes,
    campaigns = [],
    countryInsight,
    registrationGeo,
  } = data;
  const botPercent =
    overview.totalPV > 0
      ? ((overview.botVisits / overview.totalPV) * 100).toFixed(1)
      : "0";

  // Prepare reaction pie data
  const reactionPieData = [
    {
      name: label("reactionResonates", "Resonates"),
      value: reactions.resonates,
      color: REACTION_COLORS.resonates,
    },
    {
      name: label("reactionSurprised", "Surprised"),
      value: reactions.surprised,
      color: REACTION_COLORS.surprised,
    },
    {
      name: label("reactionSkeptical", "Skeptical"),
      value: reactions.skeptical,
      color: REACTION_COLORS.skeptical,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {label("title", "Site Analytics")}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Real Traffic Filter Toggle */}
          <Button
            variant={filterReal ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterReal((prev) => !prev)}
            className="text-xs"
          >
            {filterReal
              ? "✓ " + label("filterRealOnly", "Real Traffic Only")
              : label("filterAll", "All Traffic")}
          </Button>
          {/* Time Range Selector */}
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
              className="text-xs"
            >
              {d}
              {label("dayUnit", "d")}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {/* Manual materialized view refresh */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            disabled={refreshingViews}
            onClick={async () => {
              setRefreshingViews(true);
              setRefreshResult(null);
              try {
                const res = await csrfFetch(
                  "/api/admin/analytics?section=run-cron&job=refresh-analytics",
                  { method: "POST" },
                );
                if (res.ok) {
                  const json = await res.json();
                  setRefreshResult({ ok: true, ms: json.durationMs });
                  fetchData();
                } else {
                  setRefreshResult({ ok: false });
                }
              } catch {
                setRefreshResult({ ok: false });
              } finally {
                setRefreshingViews(false);
                setTimeout(() => setRefreshResult(null), 4000);
              }
            }}
            title={label(
              "refreshViewsTooltip",
              "Refresh materialized views (normally every 6h)",
            )}
          >
            {refreshingViews ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />{" "}
                {label("refreshingViews", "Refreshing...")}
              </>
            ) : refreshResult ? (
              refreshResult.ok ? (
                `✓ ${refreshResult.ms ? (refreshResult.ms / 1000).toFixed(1) + "s" : "Done"}`
              ) : (
                `✗ ${label("refreshFailed", "Failed")}`
              )
            ) : (
              label("refreshViews", "Refresh Views")
            )}
          </Button>
          {/* Owner marker: suppress tracking for this browser */}
          <Button
            variant={ownerMarked ? "default" : "outline"}
            size="sm"
            onClick={handleToggleOwner}
            disabled={ownerMarkLoading || ownerMarked === null}
            className={`text-xs ${ownerMarked ? "bg-violet-600 hover:bg-violet-700 text-white" : "text-muted-foreground"}`}
            title={
              ownerMarked
                ? label(
                    "ownerMarkedTooltip",
                    "Browser marked as developer (click to unmark)",
                  )
                : label(
                    "ownerUnmarkedTooltip",
                    "Mark browser as developer to suppress tracking",
                  )
            }
          >
            {ownerMarked ? "🔒 Dev" : "🔓 Mark Dev"}
          </Button>
        </div>
      </div>

      {/* ═══ Row 1: Smart KPI Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center">
                {label("todayPV", "Today PV")}
                <KpiTooltip
                  text={label(
                    "tooltipTodayPV",
                    "Page views today (excludes bots + internal traffic)",
                  )}
                />
              </p>
              <p className="text-2xl font-bold text-primary">
                {overview.todayPV}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center">
                {label("todayUV", "Today UV")}
                <KpiTooltip
                  text={label(
                    "tooltipTodayUV",
                    "Unique visitors today — counted by unique IP hash",
                  )}
                />
              </p>
              <p className="text-2xl font-bold text-primary">
                {overview.todayUV}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center">
                {label("weekPV", "7-day PV")}
                <KpiTooltip
                  text={label(
                    "tooltipWeekPV",
                    "Total page views in the past 7 days",
                  )}
                />
              </p>
              <p className="text-2xl font-bold text-primary">
                {overview.weekPV}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Bot className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center">
                {label("botRate", "Bot+Internal")}
                <KpiTooltip
                  text={label(
                    "tooltipBotRate",
                    "Percentage of total visits detected as bots/crawlers or internal traffic",
                  )}
                />
              </p>
              <p className="text-2xl font-bold text-primary">{botPercent}%</p>
              <p className="text-xs text-muted-foreground">
                {overview.botVisits} / {overview.totalPV}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Smartphone className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center">
                {label("mobileRate", "Mobile %")}
                <KpiTooltip
                  text={label(
                    "tooltipMobileRate",
                    "Mobile visits as a percentage of real traffic (only visits with device type data)",
                  )}
                />
              </p>
              <p className="text-2xl font-bold text-primary">
                {overview.mobilePercent}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Row 2: Traffic Trend Chart ═══ */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              {label("trendTitle", `Traffic Trend (${days} days)`)}
            </h3>
          </div>
          {trend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              {label("noData", "No data yet")}
            </div>
          ) : (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTrendDate}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pv"
                    stroke="hsl(var(--primary))"
                    fill="url(#pvGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="uv"
                    stroke="#22c55e"
                    fill="url(#uvGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-primary inline-block rounded" /> PV
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded" />{" "}
              UV
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Row 3: Top Pages + Traffic Sources ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Pages */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("topPages", "Top Pages")}
              </h3>
            </div>
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {label("noData", "No data yet")}
              </p>
            ) : (
              <div className="space-y-2">
                {topPages.map((page, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <span
                      className="text-sm text-foreground truncate flex-1"
                      title={page.path}
                    >
                      {shortenPath(page.path)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {page.views}
                      </Badge>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {page.uniqueVisitors} UV
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("topReferrers", "Traffic Sources")}
              </h3>
            </div>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {label("noData", "No data yet")}
              </p>
            ) : (
              <div className="space-y-2">
                {topReferrers.map((ref, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-foreground truncate flex-1">
                      {ref.domain}
                      {ref.domain.endsWith(".vercel.app") &&
                        ref.domain !==
                          "v0-career-exploration-questionnaire.vercel.app" && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] text-muted-foreground border-muted-foreground/30"
                          >
                            Preview
                          </Badge>
                        )}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {ref.visits}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Row 4: NPS + Reactions ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NPS Distribution */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("npsTitle", "NPS Score Distribution")}
              </h3>
            </div>
            {/* NPS Summary */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {nps.average || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {label("npsAvgLabel", "Average")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {nps.promoterRate}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {label("npsPromoter", "Promoter")}
                </p>
              </div>
            </div>
            {/* NPS Bar Chart */}
            {nps.distribution.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={nps.distribution}
                    margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="score"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30}>
                      {nps.distribution.map((entry, index) => (
                        <Cell key={index} fill={npsBarColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {label("noData", "No data yet")}
              </p>
            )}
            {/* Recent Feedback */}
            {nps.recentFeedback.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {label("recentFeedback", "Recent Feedback")}
                </p>
                {nps.recentFeedback.slice(0, 3).map((fb, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {fb.score}
                    </Badge>
                    <span className="text-muted-foreground line-clamp-2">
                      {fb.feedback}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Reactions */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("reactionsTitle", "Report Reactions")}
              </h3>
            </div>
            {reactions.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                {label("noData", "No data yet")}
              </p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reactionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {reactionPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                  {reactionPieData.map((entry, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-sm inline-block"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}: {entry.value}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {interpolate(at.totalReactions || "{count} total reactions", {
                    count: String(reactions.total),
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Row 5: Archetypes Distribution (Collapsible) ═══ */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <button
            onClick={() => setArchetypeExpanded(!archetypeExpanded)}
            className="flex items-center gap-2 mb-4 w-full hover:opacity-70 transition-opacity"
          >
            {archetypeExpanded ? (
              <ChevronDown className="w-5 h-5 text-primary" />
            ) : (
              <ChevronRight className="w-5 h-5 text-primary" />
            )}
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              {label("archetypesTitle", "Archetype Distribution")}
            </h3>
          </button>
          {archetypeExpanded && (
            <>
              {archetypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {label("noData", "No data yet")}
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={archetypes.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="archetype"
                        width={100}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={20}
                      >
                        {archetypes.slice(0, 10).map((_, index) => (
                          <Cell
                            key={index}
                            fill="hsl(var(--primary))"
                            opacity={1 - index * 0.07}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ Row 6: Geographic Distribution (Visitor + Registration) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visitor Geography (existing — based on PageVisit) */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("geoTitle", "Visitor Geography")}
              </h3>
            </div>
            {byCountry.length > 0 ? (
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byCountry.slice(0, 10)}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="country"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="visits" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {byCountry.slice(0, 10).map((_, index) => (
                        <Cell
                          key={index}
                          fill="hsl(var(--primary))"
                          opacity={1 - index * 0.06}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {label("noData", "No data yet")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Geography (based on User.registrationCountry) */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("regGeoTitle", "User Registration Geography")}
              </h3>
            </div>
            {registrationGeo && registrationGeo.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {registrationGeo.map(({ country, count }) => (
                  <div
                    key={country}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg text-sm"
                  >
                    <span>
                      {country !== "Unknown" ? countryCodeToFlag(country) : ""}
                    </span>
                    <span className="text-foreground">{country}</span>
                    <Badge variant="secondary" className="text-[10px] ml-0.5">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {label("noData", "No data yet")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Country Deep-Dive Panel ═══ */}
      {countryFilter && countryInsight && (
        <Card className="bg-card border-border border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {countryCodeToFlag(countryFilter)} {countryFilter}
                {" " + label("countryInsightTitle", "Visitor Insights")}
              </h3>
              <Badge variant="outline" className="ml-auto text-xs">
                {interpolate(at.lastNDays || "Last {days} days", {
                  days: String(days),
                })}
              </Badge>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {label("ciTotalVisits", "Total Visits")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {countryInsight.totalVisits}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {label("ciUniqueVisitors", "Unique Visitors")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {countryInsight.uniqueVisitors}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {label("ciRegistered", "Registered")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {countryInsight.registeredUsers}
                </p>
                <p className="text-xs text-muted-foreground">
                  {countryInsight.conversionRate}%{" "}
                  {label("ciConversion", "conv.")}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {label("ciVisitsPerUser", "Visits/User")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {countryInsight.avgVisitsPerUser}
                </p>
              </div>
            </div>

            {/* Top Pages + Referrers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {"🔥 " + label("ciTopPages", "Top Pages")}
                </p>
                <div className="space-y-1">
                  {countryInsight.topPages.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground truncate max-w-[200px]">
                        {p.path}
                      </span>
                      <span className="text-muted-foreground ml-2 shrink-0">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {"📡 " + label("ciTrafficSources", "Traffic Sources")}
                </p>
                <div className="space-y-1">
                  {countryInsight.topReferrers.length > 0 ? (
                    countryInsight.topReferrers.map((r, i) => {
                      const domain = extractDomain(r.referer);
                      return (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="truncate max-w-[200px]">
                            {domain === "Self" ? (
                              <span className="text-muted-foreground/40 italic text-xs">
                                Self
                              </span>
                            ) : (
                              <span className="text-foreground">{domain}</span>
                            )}
                          </span>
                          <span className="text-muted-foreground ml-2 shrink-0">
                            {r.count}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {label("ciAllDirect", "All direct visits")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📱 {countryInsight.deviceBreakdown.mobile}</span>
              <span>💻 {countryInsight.deviceBreakdown.desktop}</span>
              <span>📟 {countryInsight.deviceBreakdown.tablet}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Notable Visitors (DB-backed) ═══ */}
      <NotableVisits locale={locale} />

      {/* ═══ Row 7: Recent Visitors Table ═══ */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Eye className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              {label("recentVisitors", "Recent Visitors")}
            </h3>
            {filterReal && (
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                {label("realOnly", "Real only")}
              </Badge>
            )}
            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="ml-auto text-sm bg-card border border-border rounded-md px-2 py-1 text-foreground"
            >
              <option value="">{label("allCountries", "All Countries")}</option>
              {byCountry.map((c) => (
                <option key={c.country} value={c.country}>
                  {countryCodeToFlag(c.country)} {c.country} ({c.visits})
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-6"></TableHead>
                  <TableHead className="text-muted-foreground">
                    {label("time", "Time")}
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {label("path", "Path")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden sm:table-cell">
                    {label("source", "Source")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">
                    {label("location", "Location")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">
                    {label("identity", "Identity")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">
                    {label("device", "Device")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden xl:table-cell">
                    {label("duration", "Duration")}
                  </TableHead>
                  <TableHead className="text-muted-foreground hidden xl:table-cell">
                    {label("campaign", "Campaign")}
                  </TableHead>
                  <TableHead className="text-muted-foreground text-center">
                    {label("status", "Status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisitors.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {label("noVisits", "No visits recorded yet")}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentVisitors.map((v) => {
                    const ipKey = v.ipHash ?? "";
                    const isExpanded = expandedJourneys.has(ipKey);
                    const journeyData = journeys[ipKey];
                    return (
                      <Fragment key={v.id}>
                        <TableRow className="border-border">
                          {/* Journey expand button */}
                          <TableCell className="w-6 p-1">
                            {v.ipHash && (
                              <button
                                onClick={() => toggleJourney(v.ipHash!)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                                title={label(
                                  "viewJourney",
                                  "View visitor journey",
                                )}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatTime(v.createdAt)}
                          </TableCell>
                          <TableCell
                            className="text-sm text-foreground max-w-[180px] truncate"
                            title={v.path}
                          >
                            {shortenPath(v.path, 25)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm truncate max-w-[120px]">
                            {extractDomain(v.referer) === "Self" ? (
                              <span className="text-muted-foreground/40 italic text-xs">
                                Self
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {extractDomain(v.referer)}
                                {isPreviewDeploy(v.referer) && (
                                  <Badge
                                    variant="outline"
                                    className="ml-1 text-[9px] text-muted-foreground/60 border-muted-foreground/20"
                                  >
                                    Preview
                                  </Badge>
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {v.country ? (
                              <span>
                                {countryCodeToFlag(v.country)} {v.country}
                                {v.city && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · {v.city}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {v.userEmail ? (
                              <span className="text-foreground truncate max-w-[150px] block">
                                {v.userEmail}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {v.ipHash
                                  ? v.ipHash.slice(0, 8) + "..."
                                  : label("anonymous", "Anonymous")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            <span>
                              {deviceEmoji(v.deviceType, v.isMobile)}{" "}
                              {shortenUA(v.userAgent)}
                            </span>
                            {v.platform && (
                              <div className="text-xs text-muted-foreground/60 mt-0.5">
                                {v.platform}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {formatDuration(v.durationMs)}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                            {v.utmSource ? (
                              <span>
                                <span className="text-purple-500">
                                  {v.utmSource}
                                </span>
                                {v.utmCampaign && (
                                  <span className="text-muted-foreground/60">
                                    {" "}
                                    · {v.utmCampaign}
                                  </span>
                                )}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {v.isInternal ? (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-500 border-amber-500/30"
                              >
                                Internal
                              </Badge>
                            ) : v.isBot ? (
                              <Badge variant="destructive" className="text-xs">
                                Bot
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Journey expanded row */}
                        {isExpanded && (
                          <TableRow
                            key={`journey-${v.id}`}
                            className="border-border bg-muted/20"
                          >
                            <TableCell colSpan={10} className="p-3">
                              {journeyData === "loading" ? (
                                <div className="text-xs text-muted-foreground animate-pulse py-1">
                                  {label(
                                    "loadingJourney",
                                    "Loading journey...",
                                  )}
                                </div>
                              ) : !journeyData ? (
                                <div className="text-xs text-muted-foreground py-1">
                                  {label(
                                    "noJourneyData",
                                    "No journey data found",
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {/* 设备指纹 — 用于跨 IP 比较 */}
                                  {journeyData.fingerprint &&
                                    (journeyData.fingerprint.fullUA ||
                                      journeyData.fingerprint.city ||
                                      journeyData.fingerprint.country ||
                                      journeyData.fingerprint.timezone) && (
                                      <div className="text-xs text-muted-foreground/70 flex flex-wrap gap-x-3 gap-y-1 mb-2 pb-2 border-b border-border/40">
                                        {journeyData.fingerprint.fullUA && (
                                          <span>
                                            🖥{" "}
                                            {parseUADetail(
                                              journeyData.fingerprint.fullUA,
                                            )}
                                          </span>
                                        )}
                                        {(journeyData.fingerprint.city ||
                                          journeyData.fingerprint.country) && (
                                          <span>
                                            📍{" "}
                                            {[
                                              journeyData.fingerprint.city,
                                              journeyData.fingerprint.country,
                                            ]
                                              .filter(Boolean)
                                              .join(", ")}
                                          </span>
                                        )}
                                        {journeyData.fingerprint.timezone && (
                                          <span>
                                            🕐{" "}
                                            {journeyData.fingerprint.timezone}
                                          </span>
                                        )}
                                        {journeyData.fingerprint.deviceType && (
                                          <span>
                                            {deviceEmoji(
                                              journeyData.fingerprint
                                                .deviceType,
                                              null,
                                            )}{" "}
                                            {journeyData.fingerprint.deviceType}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  {/* Journey summary */}
                                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                                    <span>
                                      {interpolate(
                                        at.nVisits || "{count} visits",
                                        {
                                          count: String(
                                            journeyData.summary.totalVisits,
                                          ),
                                        },
                                      )}
                                    </span>
                                    <span>
                                      {interpolate(
                                        at.journeySpan || "Span: {span}",
                                        {
                                          span: formatSpan(
                                            journeyData.summary.spanMs,
                                          ),
                                        },
                                      )}
                                    </span>
                                    {journeyData.summary.isRegistered && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] text-green-500 border-green-500/30 py-0 h-4"
                                      >
                                        {label(
                                          "journeyRegistered",
                                          "Registered",
                                        )}
                                      </Badge>
                                    )}
                                    {journeyData.summary.deepestPage && (
                                      <span className="text-green-500">
                                        {interpolate(
                                          at.journeyDeepest ||
                                            "Deepest: {page}",
                                          {
                                            page: journeyData.summary
                                              .deepestPage,
                                          },
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {/* Events timeline */}
                                  <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                                    {journeyData.events.map((ev, idx) => (
                                      <div
                                        key={ev.id}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            idx === 0
                                              ? "bg-green-500"
                                              : isDeepPage(ev.path)
                                                ? "bg-blue-500"
                                                : ev.userId
                                                  ? "bg-amber-500"
                                                  : "bg-muted-foreground/40"
                                          }`}
                                        />
                                        <span className="text-muted-foreground/60 whitespace-nowrap shrink-0">
                                          {formatTime(ev.createdAt)}
                                        </span>
                                        <span className="text-foreground truncate">
                                          {ev.path}
                                        </span>
                                        {ev.durationMs && (
                                          <span className="text-muted-foreground/50 shrink-0">
                                            {formatDuration(ev.durationMs)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Campaign Performance ═══ */}
      {campaigns.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {label("campaignTitle", "Campaign Performance")}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                {campaigns.length}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      {label("campaignSource", "Source")}
                    </TableHead>
                    <TableHead className="text-muted-foreground hidden sm:table-cell">
                      {label("campaignName", "Campaign")}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      {label("campaignVisits", "Visits")}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right hidden sm:table-cell">
                      {label("campaignSignups", "Signups")}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right hidden sm:table-cell">
                      {label("campaignConvRate", "Conv. Rate")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell className="text-sm text-purple-500 font-medium">
                        {c.utmSource}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {c.utmCampaign ?? (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground text-right">
                        {c.visits}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-green-500 text-right">
                        {c.registrations}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground text-right">
                        {c.visits > 0
                          ? `${((c.registrations / c.visits) * 100).toFixed(1)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Engagement */}
      {engagementLoading ? (
        <div className="animate-pulse h-48 bg-muted/30 rounded-lg" />
      ) : engagementData && engagementData.overview.totalSessions > 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {label("reportEngagement", "Report Engagement", "报告参与度")}
            </h3>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  {label("engSessions", "Sessions", "会话数")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {engagementData.overview.totalSessions}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  {label("engAvgTime", "Avg Time", "平均时长")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {engagementData.overview.avgTotalTimeSec >= 60
                    ? `${Math.floor(engagementData.overview.avgTotalTimeSec / 60)}m ${engagementData.overview.avgTotalTimeSec % 60}s`
                    : `${engagementData.overview.avgTotalTimeSec}s`}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  {label("engScrollDepth", "Avg Scroll Depth", "平均滚动深度")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {Math.round(engagementData.overview.avgMaxScrollDepth)}%
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  {label("engScrollbacks", "Avg Scrollbacks", "平均回滚次数")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {engagementData.overview.avgScrollbacksPerSession}
                </p>
              </div>
            </div>

            {/* Panel dwell times bar */}
            {Object.keys(engagementData.overview.panelAvgTimeSec).length >
              0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {label("engPanelDwell", "Avg Dwell Time by Section (sec)")}
                </p>
                <div className="space-y-1.5">
                  {Object.entries(engagementData.overview.panelAvgTimeSec)
                    .sort(([, a], [, b]) => b - a)
                    .map(([panel, sec]) => {
                      const maxSec = Math.max(
                        ...Object.values(
                          engagementData!.overview.panelAvgTimeSec,
                        ),
                        1,
                      );
                      return (
                        <div key={panel} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate">
                            {panel}
                          </span>
                          <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                            <div
                              className="h-full bg-primary/30 rounded"
                              style={{
                                width: `${Math.round((sec / maxSec) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground w-10 text-right">
                            {sec}s
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Recent sessions table */}
            {engagementData.sessions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {label("engRecent", "Recent Sessions", "近期会话")}
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-xs">
                          {label("engTime", "Time", "时间")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {label("engDuration", "Duration", "时长")}
                        </TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">
                          {label("engScroll", "Scroll", "滚动")}
                        </TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">
                          {label("engScrollbackCol", "Scrollbacks", "回滚")}
                        </TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          {label("engUser", "User", "用户")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engagementData.sessions.slice(0, 10).map((s) => (
                        <TableRow key={s.id} className="border-border">
                          <TableCell className="text-xs text-muted-foreground">
                            {formatTime(s.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {formatDuration(s.totalTimeMs)}
                          </TableCell>
                          <TableCell className="text-xs text-foreground hidden sm:table-cell">
                            {s.maxScrollDepth != null
                              ? `${Math.round(s.maxScrollDepth)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-foreground hidden sm:table-cell">
                            {s.scrollbackCount}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {s.userId ? s.userId.slice(0, 8) + "..." : "anon"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Analytics Health */}
      <AnalyticsHealthPanel locale={locale} />
    </div>
  );
}
