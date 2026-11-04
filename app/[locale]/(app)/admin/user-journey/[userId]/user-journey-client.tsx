"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MessageCircle,
  ClipboardList,
  Star,
  User,
  Globe,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  AlertTriangle,
  Brain,
  Target,
  Activity,
  Eye,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { countryCodeToFlag } from "@/lib/utils/country-flags";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Types ──────────────────────────────────────────────────

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  registrationCountry: string | null;
  careerStage: string | null;
  journeyState: string;
  cohort: string | null;
}

interface QuickDiveData {
  archetypeCode: string;
  archetypeLabel: string;
  exploreMode: string;
  language: string;
  createdAt: string;
}

interface DiscoveryData {
  firstVisit: {
    path: string;
    referer: string | null;
    country: string | null;
    deviceType: string | null;
    createdAt: string;
  } | null;
  registrationDate: string;
  timeToRegister: number | null;
  preRegVisits: Array<{
    path: string;
    durationMs: number | null;
    createdAt: string;
  }>;
}

interface SessionData {
  id: string;
  tier: string;
  language: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalTimeMs: number | null;
  answerAssistantEnabled: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  rushCount: number;
  hesitationCount: number;
  avgResponseTimeMs: number;
  moduleBreakdown: Record<string, { count: number; avgTimeMs: number }>;
}

interface AssessmentData {
  id: string;
  sessionId: string;
  createdAt: string;
  topRIASEC: string[];
  topBigFive: string[];
  topValues: string[];
}

interface ReportData {
  id: string;
  assessmentId: string;
  createdAt: string;
  generationTimeMs: number | null;
  llmModel: string | null;
  archetypeLabel: string | null;
  reaction: string | null;
  npsScore: number | null;
  npsFeedback: string | null;
}

interface CoachingSessionData {
  id: string;
  mode: string;
  roundNumber: number;
  maxRounds: number;
  startedAt: string;
  messageCount: number;
  userMessageCount: number;
  avgUserMsgLength: number;
}

interface MemoryData {
  category: string;
  keyword: string;
  insight: string;
  source: string;
  confidence: number;
  createdAt: string;
}

interface PersonalProfileData {
  id: string;
  version: string;
  createdAt: string;
  archetype: {
    code: string;
    label_en: string;
    label_zh: string;
    confidence: number;
    confidenceLevel: string;
  } | null;
  cognitiveStyleCode: string | null;
  cognitiveStyleDisplayMode: string | null;
  collabStyle: {
    primary: string;
    secondary: string | null;
  } | null;
  topValues: string[];
  riasecScores: Record<string, number> | null;
  bigFiveScores: Record<string, number> | null;
  socialStyle: string | null;
  leadershipStyle: string | null;
  interpersonalEnergy: string | null;
  conflictHandling: string | null;
}

interface TimelineEvent {
  type: string;
  timestamp: string;
  summary: string;
  metadata: Record<string, unknown>;
}

interface PipelineStage {
  done: boolean;
  at: string | null;
  timeMs?: number | null;
  questions?: string | null;
  generationTimeMs?: number | null;
  rounds?: string | null;
  archetypeLabel?: string | null;
  exploreMode?: string | null;
}

interface PipelineData {
  registered: PipelineStage;
  quickDive: PipelineStage;
  deepDive: PipelineStage;
  profile: PipelineStage;
  report: PipelineStage;
  coaching: PipelineStage;
}

interface EngagementData {
  totalVisits: number;
  lastActiveAt: string;
  rushRatio: number;
  totalUserMessages: number;
  avgCoachMsgLen: number;
  funnelEventsCount: number;
  hasReaction: boolean;
  hasNps: boolean;
  quickDiveCount: number;
}

interface UserJourney {
  user: UserInfo;
  discovery: DiscoveryData;
  quickDive: QuickDiveData | null;
  questionnaire: { sessions: SessionData[] };
  assessment: { results: AssessmentData[] };
  reports: ReportData[];
  coaching: {
    totalSessions: number;
    sessions: CoachingSessionData[];
    memories: MemoryData[];
  };
  timeline: TimelineEvent[];
  pipeline: PipelineData;
  engagement: EngagementData;
  personalProfile: PersonalProfileData | null;
}

// ── Constants ──────────────────────────────────────────────

const EVENT_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; bgColor: string }
> = {
  visit: {
    color: "text-sky-400",
    bgColor: "bg-sky-400/20",
    icon: <Globe className="w-3.5 h-3.5" />,
  },
  funnel: {
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/20",
    icon: <Target className="w-3.5 h-3.5" />,
  },
  questionnaire_start: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/20",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
  },
  questionnaire_complete: {
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
  },
  report_generated: {
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  reaction: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    icon: <Star className="w-3.5 h-3.5" />,
  },
  nps: {
    color: "text-amber-300",
    bgColor: "bg-amber-300/20",
    icon: <Star className="w-3.5 h-3.5" />,
  },
  coaching_start: {
    color: "text-violet-400",
    bgColor: "bg-violet-400/20",
    icon: <MessageCircle className="w-3.5 h-3.5" />,
  },
};

const CAREER_STAGE_LABELS: Record<string, Record<string, string>> = {
  en: {
    student: "Student",
    new_grad: "New Grad",
    early_career: "Early Career",
    mid_career: "Mid Career",
    senior: "Senior",
  },
  zh: {
    student: "在校学生",
    new_grad: "应届毕业",
    early_career: "初级阶段",
    mid_career: "中级阶段",
    senior: "资深阶段",
  },
};

const MILESTONE_TYPES = new Set([
  "questionnaire_start",
  "questionnaire_complete",
  "report_generated",
  "coaching_start",
]);

// ── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string, _locale: Locale): string {
  const d = new Date(dateStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  const hours = Math.floor(ms / 3600000);
  const mins = Math.round((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function formatGap(fromStr: string, toStr: string): string {
  const ms = new Date(toStr).getTime() - new Date(fromStr).getTime();
  if (ms < 0) return "—";
  if (ms < 60000) return "<1m";
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function dateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  colorClass = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 flex items-center gap-2.5">
        <div
          className={`p-1.5 rounded-lg ${colorClass.replace("text-", "bg-")}/10`}
        >
          <span className={colorClass}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight truncate">
            {label}
          </p>
          <p className={`text-lg font-bold ${colorClass} leading-tight`}>
            {value}
          </p>
          {sub && (
            <p className="text-[10px] text-muted-foreground leading-tight">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="bg-card border-border">
      <button
        className="w-full p-4 sm:p-5 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground flex-1">
          {title}
        </h3>
        {badge !== undefined && (
          <Badge variant="secondary" className="text-[10px]">
            {badge}
          </Badge>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// ── Journey Pipeline ──────────────────────────────────────

const PIPELINE_STAGES = [
  "registered",
  "quickDive",
  "deepDive",
  "profile",
  "report",
  "coaching",
] as const;

function JourneyPipeline({
  pipeline,
  locale,
}: {
  pipeline: PipelineData;
  locale: Locale;
}) {
  const jt =
    (getDictionaryClient(locale).admin?.journey as unknown as Record<
      string,
      string
    >) ?? {};
  const stageLabels: Record<string, string> = {
    registered: jt.pipelineRegistered || "Registered",
    quickDive: jt.pipelineQD || "Quick Dive",
    deepDive: jt.pipelineDD || "Deep Dive",
    profile: jt.pipelineProfile || "Profile",
    report: jt.pipelineReport || "Report",
    coaching: jt.pipelineCoaching || "Coaching",
  };

  // Find the current (furthest completed) stage
  let currentIdx = -1;
  for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
    if (pipeline[PIPELINE_STAGES[i]].done) {
      currentIdx = i;
      break;
    }
  }

  // Find drop-off: first incomplete stage after a completed one
  let dropOffIdx = -1;
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    if (
      !pipeline[PIPELINE_STAGES[i]].done &&
      i > 0 &&
      pipeline[PIPELINE_STAGES[i - 1]].done
    ) {
      dropOffIdx = i;
      break;
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          {jt.pipelineTitle || "Journey Pipeline"}
        </h2>

        {/* Pipeline visualization */}
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const data = pipeline[stage];
            const isDone = data.done;
            const isCurrent = i === currentIdx;
            const isDropOff = i === dropOffIdx;
            const isFuture = !isDone && i > currentIdx;

            // Gap between this and previous stage
            const prevStage = i > 0 ? pipeline[PIPELINE_STAGES[i - 1]] : null;
            const gap =
              prevStage?.at && data.at
                ? formatGap(prevStage.at, data.at)
                : null;

            return (
              <React.Fragment key={stage}>
                {/* Connector with gap time */}
                {i > 0 && (
                  <div className="flex flex-col items-center pt-3 shrink-0">
                    <div
                      className={`h-px w-6 sm:w-10 ${isDone || isDropOff ? "bg-primary/40" : "bg-border"}`}
                    />
                    {gap && (
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        {gap}
                      </span>
                    )}
                  </div>
                )}

                {/* Stage node */}
                <div
                  className={`flex flex-col items-center gap-1.5 min-w-[72px] sm:min-w-[88px] shrink-0 ${isFuture ? "opacity-35" : ""}`}
                >
                  {/* Circle indicator */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone
                        ? "bg-primary/20 border-primary text-primary"
                        : isDropOff
                          ? "bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse"
                          : "bg-muted/30 border-border text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isDropOff
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stageLabels[stage]}
                  </span>

                  {/* Detail line */}
                  <div className="text-[9px] text-muted-foreground text-center leading-tight min-h-[14px]">
                    {isDone && data.at && formatDateShort(data.at)}
                    {isDone && data.timeMs && (
                      <span className="block">
                        {formatDuration(data.timeMs)}
                      </span>
                    )}
                    {isDone && data.archetypeLabel && (
                      <span className="block text-primary">
                        {data.archetypeLabel}
                      </span>
                    )}
                    {isDone && data.questions && (
                      <span className="block">{data.questions}</span>
                    )}
                    {isDone && data.rounds && (
                      <span className="block">{data.rounds}</span>
                    )}
                    {isDone && data.generationTimeMs && (
                      <span className="block">
                        {Math.round(data.generationTimeMs / 1000)}s gen
                      </span>
                    )}
                    {isDropOff && (
                      <span className="text-amber-500 font-medium">
                        {jt.dropOff || "Drop-off"}
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Data Quality Indicator ──────────────────────────────────

function DataQualityBadge({ rushRatio }: { rushRatio: number }) {
  if (rushRatio <= 10)
    return (
      <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
        Good
      </Badge>
    );
  if (rushRatio <= 25)
    return (
      <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
        Fair
      </Badge>
    );
  return (
    <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
      Poor
    </Badge>
  );
}

// ── Grouped Timeline ────────────────────────────────────────

function GroupedTimeline({
  timeline,
  locale,
}: {
  timeline: TimelineEvent[];
  locale: Locale;
}) {
  const jt =
    (getDictionaryClient(locale).admin?.journey as unknown as Record<
      string,
      string
    >) ?? {};
  const [showVisits, setShowVisits] = useState(false);

  const _grouped = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const event of timeline) {
      const key = dateKey(event.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [timeline]);

  const visitCount = timeline.filter((e) => e.type === "visit").length;
  const filteredTimeline = showVisits
    ? timeline
    : timeline.filter((e) => e.type !== "visit");

  const filteredGrouped = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const event of filteredTimeline) {
      const key = dateKey(event.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTimeline]);

  return (
    <Card className="bg-card border-border lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground flex-1">
            {jt.timeline || "Timeline"}
          </h2>
          <Badge variant="secondary" className="text-[10px]">
            {timeline.length}
          </Badge>
        </div>

        {/* Visit toggle */}
        {visitCount > 0 && (
          <button
            onClick={() => setShowVisits(!showVisits)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-3 flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            {showVisits
              ? jt.hideVisits || `Hide ${visitCount} visits`
              : jt.showVisits || `Show ${visitCount} visits`}
          </button>
        )}

        {/* Grouped by day */}
        <div className="space-y-4">
          {filteredGrouped.map(([day, events]) => (
            <div key={day}>
              {/* Day header */}
              <div className="text-[10px] font-medium text-muted-foreground mb-1.5 sticky top-0 bg-card py-0.5">
                {day}
              </div>

              {/* Events */}
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-0.5">
                  {events.map((event, i) => {
                    const config =
                      EVENT_CONFIG[event.type] || EVENT_CONFIG.visit;
                    const isMilestone = MILESTONE_TYPES.has(event.type);

                    return (
                      <div
                        key={i}
                        className={`relative flex gap-2.5 py-1 group ${isMilestone ? "py-1.5" : ""}`}
                      >
                        {/* Node */}
                        <div
                          className={`relative z-10 rounded-full flex items-center justify-center shrink-0 ${
                            isMilestone
                              ? `w-[27px] h-[27px] ${config.bgColor} ring-2 ring-card`
                              : `w-[23px] h-[23px] ${config.bgColor}`
                          }`}
                        >
                          <span className={config.color}>{config.icon}</span>
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p
                            className={`text-xs leading-snug break-words ${isMilestone ? "text-foreground font-medium" : "text-muted-foreground"}`}
                          >
                            {event.summary}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "UTC",
                              },
                            )}{" "}
                            UTC
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {filteredGrouped.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {jt.noData || "No data"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Module Bar Chart ──────────────────────────────────────

function ModuleBarChart({
  breakdown,
  locale,
}: {
  breakdown: Record<string, { count: number; avgTimeMs: number }>;
  locale: Locale;
}) {
  const jt2 =
    (getDictionaryClient(locale).admin?.journey as unknown as Record<
      string,
      string
    >) ?? {};
  const data = Object.entries(breakdown).map(([mod, stats]) => ({
    name:
      (mod === "A"
        ? jt2.moduleSjt
        : mod === "B"
          ? jt2.modulePvq
          : mod === "C"
            ? jt2.moduleIpip
            : null) || `Module ${mod}`,
    count: stats.count,
    avgTime: Math.round(stats.avgTimeMs / 1000),
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-48 mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
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
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="avgTime"
            name={jt2.avgTimeSeconds || "Avg Time (s)"}
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export function UserJourneyClient({
  locale,
  userId,
}: {
  locale: Locale;
  userId: string;
}) {
  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = getDictionaryClient(locale);
  const jt = (t.admin?.journey as unknown as Record<string, string>) ?? {};
  const label = (
    key: string,
    fallbackEn: string,
    fallbackZh?: string,
  ): string =>
    jt[key] || (locale === "zh" ? fallbackZh || fallbackEn : fallbackEn);

  const fetchJourney = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/journey`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(label("notFound", "User not found"));
        } else {
          setError(label("loadError", "Failed to load user journey"));
        }
        return;
      }
      const data: UserJourney = await res.json();
      setJourney(data);
    } catch {
      setError(label("loadError", "Failed to load user journey"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted/30 animate-pulse rounded w-48" />
        <div className="h-28 bg-muted/30 animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted/30 animate-pulse rounded-lg"
            />
          ))}
        </div>
        <div className="h-96 bg-muted/30 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {label("backToAdmin", "Back to Admin")}
        </Link>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {error || label("notFound", "User not found")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    user,
    discovery,
    quickDive,
    questionnaire,
    assessment,
    reports,
    coaching,
    timeline,
    pipeline,
    engagement,
    personalProfile,
  } = journey;
  const latestArchetype =
    reports.length > 0
      ? reports[reports.length - 1].archetypeLabel
      : quickDive?.archetypeLabel || null;
  const latestNps = reports.find((r) => r.npsScore !== null)?.npsScore ?? null;
  const completedDDSessions = questionnaire.sessions.filter(
    (s) => s.status === "completed",
  ).length;
  const totalAssessments = engagement.quickDiveCount + completedDDSessions;
  const totalSessions =
    engagement.quickDiveCount + questionnaire.sessions.length;
  const totalReports = engagement.quickDiveCount + reports.length;
  const daysInactive = daysSince(engagement.lastActiveAt);

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href={`/${locale}/admin`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {label("backToAdmin", "Back to Admin")}
      </Link>

      {/* Hero — User Info */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-lg font-semibold text-foreground border border-primary/20">
          {(user.name?.[0] || user.email[0] || "?").toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {user.name || user.email}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{user.email}</span>
            {user.registrationCountry && (
              <span>
                {countryCodeToFlag(user.registrationCountry)}{" "}
                {user.registrationCountry}
              </span>
            )}
            {user.careerStage && (
              <Badge variant="secondary" className="text-xs">
                {CAREER_STAGE_LABELS[locale]?.[user.careerStage] ||
                  user.careerStage}
              </Badge>
            )}
            {user.cohort && (
              <Badge
                variant="outline"
                className="text-xs border-violet-500/30 text-violet-400"
              >
                {user.cohort}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {user.journeyState.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {latestArchetype && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm">
              {latestArchetype}
            </Badge>
          )}
          {daysInactive > 7 && (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
              {daysInactive}d {label("inactive", "inactive")}
            </Badge>
          )}
        </div>
      </div>

      {/* Journey Pipeline — THE key addition */}
      <JourneyPipeline pipeline={pipeline} locale={locale} />

      {/* KPI Cards — 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label={label("daysSinceReg", "Days Since Reg")}
          value={daysSince(user.createdAt)}
          colorClass="text-blue-500"
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label={label("totalVisits", "Visits")}
          value={engagement.totalVisits}
          colorClass="text-sky-500"
        />
        <StatCard
          icon={<ClipboardList className="w-4 h-4" />}
          label={label("questionnaires", "Assessments")}
          value={totalAssessments}
          sub={`/ ${totalSessions}`}
          colorClass="text-emerald-500"
        />
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          label={label("reports", "Reports")}
          value={totalReports}
          sub={
            engagement.quickDiveCount > 0
              ? `${engagement.quickDiveCount} QD + ${reports.length} DD`
              : undefined
          }
          colorClass="text-amber-500"
        />
        <StatCard
          icon={<MessageCircle className="w-4 h-4" />}
          label={label("coachingSessions", "Coaching")}
          value={coaching.totalSessions}
          sub={
            engagement.totalUserMessages > 0
              ? `${engagement.totalUserMessages} msgs`
              : undefined
          }
          colorClass="text-violet-500"
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label="NPS"
          value={latestNps !== null ? `${latestNps}/10` : "—"}
          colorClass="text-amber-400"
        />
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label={label("dataQuality", "Data Quality")}
          value={`${100 - engagement.rushRatio}%`}
          sub={`${engagement.rushRatio}% rush`}
          colorClass={
            engagement.rushRatio <= 10
              ? "text-emerald-500"
              : engagement.rushRatio <= 25
                ? "text-amber-500"
                : "text-red-500"
          }
        />
        <StatCard
          icon={<Brain className="w-4 h-4" />}
          label={label("memoryTags", "Memories")}
          value={coaching.memories.length}
          colorClass="text-orange-500"
        />
      </div>

      {/* Last active indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <div
          className={`w-2 h-2 rounded-full ${daysInactive <= 1 ? "bg-emerald-500" : daysInactive <= 7 ? "bg-amber-500" : "bg-red-500"}`}
        />
        {label("lastActive", "Last active")}:{" "}
        {formatDate(engagement.lastActiveAt, locale)}
        {engagement.hasReaction && (
          <Badge variant="outline" className="text-[9px] py-0">
            Reacted
          </Badge>
        )}
        {engagement.hasNps && (
          <Badge variant="outline" className="text-[9px] py-0">
            NPS
          </Badge>
        )}
      </div>

      {/* Main content: Timeline + Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Timeline — grouped by day */}
        <GroupedTimeline timeline={timeline} locale={locale} />

        {/* Detail Panels */}
        <div className="space-y-4">
          {/* Discovery */}
          <CollapsibleSection
            title={label("discovery", "Discovery & Registration")}
            icon={<Globe className="w-4 h-4" />}
            badge={
              discovery.preRegVisits.length > 0
                ? `${discovery.preRegVisits.length} visits`
                : undefined
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {label("registrationDate", "Registration Date")}
                </p>
                <p className="text-foreground">
                  {formatDate(discovery.registrationDate, locale)}
                </p>
              </div>
              {discovery.timeToRegister !== null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {label("timeToRegister", "Time to Register")}
                  </p>
                  <p className="text-foreground">
                    {formatDuration(discovery.timeToRegister)}
                  </p>
                </div>
              )}
              {discovery.firstVisit && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {label("firstVisit", "First Visit")}
                    </p>
                    <p className="text-foreground font-mono text-xs">
                      {discovery.firstVisit.path}
                    </p>
                  </div>
                  {discovery.firstVisit.referer && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Referer
                      </p>
                      <p className="text-foreground text-xs truncate">
                        {discovery.firstVisit.referer}
                      </p>
                    </div>
                  )}
                  {discovery.firstVisit.deviceType && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Device
                      </p>
                      <p className="text-foreground text-xs">
                        {discovery.firstVisit.deviceType}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {discovery.preRegVisits.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {label("preRegVisits", "Pre-Registration Visits")} (
                  {discovery.preRegVisits.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {discovery.preRegVisits.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1"
                    >
                      <span className="text-foreground font-mono truncate flex-1">
                        {v.path}
                      </span>
                      {v.durationMs && (
                        <span className="text-muted-foreground shrink-0">
                          {formatDuration(v.durationMs)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Questionnaire Analysis */}
          {questionnaire.sessions.length > 0 && (
            <CollapsibleSection
              title={label("questionnaireAnalysis", "Questionnaire Analysis")}
              icon={<ClipboardList className="w-4 h-4" />}
              defaultOpen
              badge={questionnaire.sessions.length}
            >
              <div className="space-y-4">
                {questionnaire.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-muted/20 rounded-lg p-3 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          session.tier === "quick" ? "secondary" : "default"
                        }
                        className="text-xs"
                      >
                        {session.tier === "quick"
                          ? label("quickDive", "Quick Dive")
                          : label("deepDive", "Deep Dive")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {session.language.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={
                          session.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-[10px] ${session.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : session.status === "abandoned" ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}`}
                      >
                        {session.status === "completed"
                          ? label("completed", "Completed")
                          : session.status === "abandoned"
                            ? label("abandoned", "Abandoned")
                            : label("inProgress", "In Progress")}
                      </Badge>
                      {session.answerAssistantEnabled && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-violet-500/30 text-violet-400"
                        >
                          AI Assist
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDate(session.startedAt, locale)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          {label("totalTime", "Total Time")}
                        </span>
                        <p className="text-foreground font-medium">
                          {session.totalTimeMs
                            ? formatDuration(session.totalTimeMs)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {label("questions", "Questions")}
                        </span>
                        <p className="text-foreground font-medium">
                          {session.answeredQuestions}/{session.totalQuestions}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {label("rushAnswers", "Rush")}
                        </span>
                        <p
                          className={`font-medium ${session.rushCount > 5 ? "text-amber-400" : "text-foreground"}`}
                        >
                          {session.rushCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-400" />
                          {label("hesitations", "Hesitation")}
                        </span>
                        <p className="text-foreground font-medium">
                          {session.hesitationCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {label("avgResponseTime", "Avg Time")}
                        </span>
                        <p className="text-foreground font-medium">
                          {session.avgResponseTimeMs > 0
                            ? formatDuration(session.avgResponseTimeMs)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Data quality bar */}
                    {session.answeredQuestions > 0 && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">
                          {label("dataQuality", "Data Quality")}:
                        </span>
                        <DataQualityBadge
                          rushRatio={
                            session.totalQuestions > 0
                              ? Math.round(
                                  (session.rushCount / session.totalQuestions) *
                                    100,
                                )
                              : 0
                          }
                        />
                      </div>
                    )}

                    {Object.keys(session.moduleBreakdown).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {label("moduleBreakdown", "Module Breakdown")}
                        </p>
                        <ModuleBarChart
                          breakdown={session.moduleBreakdown}
                          locale={locale}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Assessment Results */}
          {assessment.results.length > 0 && (
            <CollapsibleSection
              title={label("assessmentResults", "Assessment Results")}
              icon={<Target className="w-4 h-4" />}
              badge={assessment.results.length}
            >
              <div className="space-y-3">
                {assessment.results.map((a) => (
                  <div
                    key={a.id}
                    className="bg-muted/20 rounded-lg p-3 space-y-2"
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.createdAt, locale)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {a.topRIASEC.length > 0 && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">
                            RIASEC Top-2
                          </span>
                          <div className="flex gap-1">
                            {a.topRIASEC.map((r) => (
                              <Badge
                                key={r}
                                className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {a.topBigFive.length > 0 && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">
                            Big Five Top
                          </span>
                          <div className="flex gap-1">
                            {a.topBigFive.map((b) => (
                              <Badge
                                key={b}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {b}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {a.topValues.length > 0 && (
                        <div>
                          <span className="text-[10px] text-muted-foreground block mb-1">
                            Values
                          </span>
                          <div className="flex gap-1">
                            {a.topValues.map((v) => (
                              <Badge
                                key={v}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Personal Profile */}
          {personalProfile && (
            <CollapsibleSection
              title={label("personalProfile", "Personal Profile", "个人档案")}
              icon={<User className="w-4 h-4" />}
              defaultOpen
              badge={personalProfile.version}
            >
              <div className="space-y-4">
                {/* Archetype + Cognitive Style + Collab Style row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {personalProfile.archetype && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <span className="text-[10px] text-muted-foreground block mb-1">
                        {label("profileArchetype", "Archetype", "原型")}
                      </span>
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                        {locale === "zh"
                          ? personalProfile.archetype.label_zh
                          : personalProfile.archetype.label_en}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {personalProfile.archetype.code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {label("profileConfidence", "Confidence", "置信度")}:{" "}
                        {Math.round(personalProfile.archetype.confidence * 100)}
                        % ({personalProfile.archetype.confidenceLevel})
                      </p>
                    </div>
                  )}
                  {personalProfile.cognitiveStyleCode && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <span className="text-[10px] text-muted-foreground block mb-1">
                        {label(
                          "profileCognitiveStyle",
                          "Cognitive Style",
                          "认知风格",
                        )}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {personalProfile.cognitiveStyleDisplayMode ===
                        "balanced"
                          ? `~${personalProfile.cognitiveStyleCode}`
                          : personalProfile.cognitiveStyleCode}
                      </Badge>
                    </div>
                  )}
                  {personalProfile.collabStyle && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <span className="text-[10px] text-muted-foreground block mb-1">
                        {label(
                          "profileCollabStyle",
                          "Collaboration Style",
                          "协作风格",
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {personalProfile.collabStyle.primary}
                        {personalProfile.collabStyle.secondary &&
                          ` / ${personalProfile.collabStyle.secondary}`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Top Values */}
                {personalProfile.topValues.length > 0 && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block mb-1.5">
                      {label("profileValues", "Top Values", "核心价值观")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {personalProfile.topValues.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* RIASEC Scores */}
                {personalProfile.riasecScores && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block mb-1.5">
                      {label("profileRiasec", "RIASEC Scores", "RIASEC 分数")}
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {(["R", "I", "A", "S", "E", "C"] as const).map((dim) => {
                        const score = personalProfile.riasecScores?.[dim] ?? 0;
                        return (
                          <div key={dim} className="text-center">
                            <div className="text-xs font-semibold text-foreground">
                              {dim}
                            </div>
                            <div className="w-full bg-muted/40 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-primary rounded-full h-1.5 transition-all"
                                style={{ width: `${Math.min(score, 100)}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              {Math.round(score)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Big Five Scores */}
                {personalProfile.bigFiveScores && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <span className="text-[10px] text-muted-foreground block mb-1.5">
                      {label(
                        "profileBigFive",
                        "Big Five Scores",
                        "Big Five 分数",
                      )}
                    </span>
                    <div className="space-y-1.5">
                      {(
                        [
                          "openness",
                          "conscientiousness",
                          "extraversion",
                          "agreeableness",
                          "neuroticism",
                        ] as const
                      ).map((dim) => {
                        const score = personalProfile.bigFiveScores?.[dim] ?? 0;
                        const shortLabels: Record<string, string> = {
                          openness: "O",
                          conscientiousness: "C",
                          extraversion: "E",
                          agreeableness: "A",
                          neuroticism: "N",
                        };
                        return (
                          <div key={dim} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-4 text-center font-semibold">
                              {shortLabels[dim]}
                            </span>
                            <div className="flex-1 bg-muted/40 rounded-full h-1.5">
                              <div
                                className="bg-violet-500 rounded-full h-1.5 transition-all"
                                style={{
                                  width: `${Math.min(score, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right">
                              {Math.round(score)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Derived Models row */}
                {(personalProfile.socialStyle ||
                  personalProfile.leadershipStyle ||
                  personalProfile.interpersonalEnergy ||
                  personalProfile.conflictHandling) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {personalProfile.socialStyle && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          {label(
                            "profileSocialStyle",
                            "Social Style",
                            "社交风格",
                          )}
                        </span>
                        <p className="text-xs text-foreground font-medium">
                          {personalProfile.socialStyle}
                        </p>
                      </div>
                    )}
                    {personalProfile.leadershipStyle && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          {label(
                            "profileLeadershipStyle",
                            "Leadership Style",
                            "领导力风格",
                          )}
                        </span>
                        <p className="text-xs text-foreground font-medium">
                          {personalProfile.leadershipStyle}
                        </p>
                      </div>
                    )}
                    {personalProfile.interpersonalEnergy && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          {label(
                            "profileInterpersonalEnergy",
                            "Interpersonal Energy",
                            "人际能量",
                          )}
                        </span>
                        <p className="text-xs text-foreground font-medium">
                          {personalProfile.interpersonalEnergy}
                        </p>
                      </div>
                    )}
                    {personalProfile.conflictHandling && (
                      <div className="bg-muted/20 rounded-lg p-3">
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          {label(
                            "profileConflictHandling",
                            "Conflict Handling",
                            "冲突处理",
                          )}
                        </span>
                        <p className="text-xs text-foreground font-medium">
                          {personalProfile.conflictHandling}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* View full profile link */}
                <div className="flex justify-end">
                  <a
                    href={`/${locale}/profile/${userId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
                  >
                    {label(
                      "profileViewFull",
                      "View Full Profile",
                      "查看完整档案",
                    )}{" "}
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Report Experience */}
          {reports.length > 0 && (
            <CollapsibleSection
              title={label("reportExperience", "Report Experience")}
              icon={<FileText className="w-4 h-4" />}
              defaultOpen
              badge={reports.length}
            >
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="bg-muted/20 rounded-lg p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {r.archetypeLabel && (
                        <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                          {r.archetypeLabel}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt, locale)}
                      </span>
                      <a
                        href={`/${locale}/report/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:text-primary/80 ml-auto inline-flex items-center gap-0.5"
                      >
                        {label("viewReport", "View")}{" "}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {r.generationTimeMs && (
                        <div>
                          <span className="text-muted-foreground">
                            {label("generationTime", "Gen Time")}
                          </span>
                          <p className="text-foreground font-medium">
                            {Math.round(r.generationTimeMs / 1000)}s
                          </p>
                        </div>
                      )}
                      {r.llmModel && (
                        <div>
                          <span className="text-muted-foreground">Model</span>
                          <p className="text-foreground font-medium text-[10px]">
                            {r.llmModel}
                          </p>
                        </div>
                      )}
                      {r.reaction && (
                        <div>
                          <span className="text-muted-foreground">
                            Reaction
                          </span>
                          <p className="text-foreground font-medium">
                            {r.reaction}
                          </p>
                        </div>
                      )}
                      {r.npsScore !== null && (
                        <div>
                          <span className="text-muted-foreground">NPS</span>
                          <p
                            className={`font-medium ${r.npsScore >= 9 ? "text-emerald-400" : r.npsScore >= 7 ? "text-foreground" : "text-amber-400"}`}
                          >
                            {r.npsScore}/10
                          </p>
                          {r.npsFeedback && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate">
                              &ldquo;{r.npsFeedback}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Coaching Insights */}
          {(coaching.sessions.length > 0 || coaching.memories.length > 0) && (
            <CollapsibleSection
              title={label("coachingInsights", "Coaching Insights")}
              icon={<MessageCircle className="w-4 h-4" />}
              badge={
                coaching.sessions.length > 0
                  ? `${coaching.totalSessions} sessions`
                  : undefined
              }
            >
              <div className="space-y-4">
                {coaching.sessions.length > 0 && (
                  <div className="space-y-2">
                    {coaching.sessions.map((c) => (
                      <div key={c.id} className="bg-muted/20 rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {c.mode}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Round {c.roundNumber}/{c.maxRounds}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatDate(c.startedAt, locale)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              {label("messages", "Messages")}
                            </span>
                            <p className="text-foreground font-medium">
                              {c.messageCount}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {label("userMessages", "User Msgs")}
                            </span>
                            <p className="text-foreground font-medium">
                              {c.userMessageCount}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {label("avgMsgLength", "Avg Length")}
                            </span>
                            <p
                              className={`font-medium ${c.avgUserMsgLength > 100 ? "text-emerald-400" : c.avgUserMsgLength > 30 ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {c.avgUserMsgLength} {label("chars", "chars")}
                            </p>
                          </div>
                        </div>
                        {/* Engagement indicator */}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Activity className="w-3 h-3" />
                          {label("engagement", "Engagement")}:
                          {c.avgUserMsgLength > 100 ? (
                            <span className="text-emerald-400 font-medium">
                              {label("engagementHigh", "High")}
                            </span>
                          ) : c.avgUserMsgLength > 30 ? (
                            <span className="text-foreground">
                              {label("engagementMedium", "Medium")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {label("engagementLow", "Low")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {coaching.memories.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {label("memoryTags", "Memory Tags")} (
                      {coaching.memories.length})
                    </p>
                    {/* Group memories by category */}
                    {Object.entries(
                      coaching.memories.reduce<Record<string, MemoryData[]>>(
                        (acc, m) => {
                          if (!acc[m.category]) acc[m.category] = [];
                          acc[m.category].push(m);
                          return acc;
                        },
                        {},
                      ),
                    ).map(([category, mems]) => (
                      <div key={category} className="mb-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {category}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {mems.map((m, i) => (
                            <div key={i} className="group relative">
                              <Badge
                                variant="outline"
                                className={`text-[10px] cursor-help ${
                                  m.confidence >= 0.7
                                    ? "border-primary/40 text-primary"
                                    : m.confidence >= 0.4
                                      ? "border-muted-foreground/40"
                                      : "border-muted-foreground/20 text-muted-foreground"
                                }`}
                              >
                                {m.keyword}
                              </Badge>
                              <div className="absolute left-0 bottom-full mb-1 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                                <p className="font-medium mb-1">{m.keyword}</p>
                                <p className="text-muted-foreground">
                                  {m.insight}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {m.source} · {Math.round(m.confidence * 100)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Empty state */}
          {questionnaire.sessions.length === 0 &&
            assessment.results.length === 0 &&
            reports.length === 0 &&
            coaching.sessions.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {label(
                      "noActivityData",
                      "No activity data for this user yet",
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
