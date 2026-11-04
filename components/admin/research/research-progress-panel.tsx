"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  CheckCircle2,
  Database,
  AlertTriangle,
  RefreshCw,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface ParticipantProgress {
  participantId: string;
  userId: string;
  email: string;
  researchGroup: "classic" | "immersive";
  registeredAt: string;

  preTest: {
    completed: boolean;
    completedAt?: string;
    sccTotal?: number;
  } | null;
  quickDive: {
    completed: boolean;
    completedAt?: string;
    mode?: string;
    archetypeCode?: string;
  } | null;
  deepDive: {
    completed: boolean;
    completedAt?: string;
    totalTimeMs?: number;
    rushCount?: number;
  } | null;
  report: {
    generated: boolean;
    generatedAt?: string;
    reaction?: string;
    npsScore?: number;
  } | null;
  coaching: {
    started: boolean;
    sessionCount: number;
    totalRounds: number;
    feedbackRating?: string;
  };
  postImmediate: {
    completed: boolean;
    completedAt?: string;
    sccTotal?: number;
  } | null;
  post1Week: {
    completed: boolean;
    completedAt?: string;
    dueDate?: string;
    sccTotal?: number;
  } | null;

  lastActivityAt: string;
  status: "complete" | "active" | "stalled" | "needs_attention";
  missingSteps: string[];

  inviteCode: string | null;
  inviteNote: string | null;
}

interface Summary {
  totalParticipants: number;
  classicCount: number;
  immersiveCount: number;
  fullyComplete: number;
  dataUsable: number;
  needsReminder: number;
}

function StatusBadge({ status }: { status: ParticipantProgress["status"] }) {
  const config = {
    complete: {
      label: "Complete",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    active: {
      label: "Active",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    stalled: {
      label: "Stalled",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    needs_attention: {
      label: "Needs Attention",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function StepCell({
  completed,
  label,
  missingLabel = "Missing",
}: {
  completed: boolean | null;
  label?: string;
  missingLabel?: string;
}) {
  if (completed === null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  if (completed) {
    return (
      <span className="text-emerald-600 text-xs font-medium">
        {label || "Done"}
      </span>
    );
  }
  return (
    <span className="text-red-500 text-xs font-medium">{missingLabel}</span>
  );
}

function formatDueIn(dueDate: string): string {
  const diff = new Date(dueDate).getTime() - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  return `due in ${days}d`;
}

export function ResearchProgressPanel({ locale }: { locale: Locale }) {
  const [participants, setParticipants] = useState<ParticipantProgress[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = (getDictionaryClient(locale).admin?.research || {}) as Record<
    string,
    string
  >;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/research-progress");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setParticipants(data.participants);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="h-16 bg-muted/30 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="h-64 bg-muted/30 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center">
          <p className="text-destructive text-sm mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          {t.refresh}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{t.total}</p>
                  <p className="text-lg font-bold text-primary">
                    {summary.totalParticipants}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.classic}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.classicCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-violet-100 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.immersive}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.immersiveCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.complete}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.fullyComplete}/{summary.totalParticipants}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.dataUsable}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.dataUsable}/{summary.totalParticipants}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.needsReminder}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {summary.needsReminder}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participant Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  {t.participant}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  {t.group}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  {t.inviteCode}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Pre-test
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Quick Dive
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Deep Dive
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  {t.report}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Coaching
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Post-imm
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  Post-1wk
                </TableHead>
                <TableHead className="text-muted-foreground text-xs whitespace-nowrap">
                  {t.status}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    {t.noParticipants}
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow
                    key={p.userId}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="py-2">
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-medium text-foreground">
                          {p.participantId}
                        </span>
                        <br />
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[120px]">
                          {p.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          p.researchGroup === "classic"
                            ? "border-blue-200 text-blue-700"
                            : "border-violet-200 text-violet-700"
                        }`}
                      >
                        {p.researchGroup === "classic"
                          ? t.classic
                          : t.immersive}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      {p.inviteCode ? (
                        <div className="min-w-0">
                          <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono text-foreground">
                            {p.inviteCode}
                          </code>
                          {p.inviteNote && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-[120px] mt-0.5">
                              {p.inviteNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <StepCell
                        completed={p.preTest ? p.preTest.completed : null}
                        missingLabel={t.missing}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <StepCell
                        completed={p.quickDive ? p.quickDive.completed : null}
                        missingLabel={t.missing}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <StepCell
                        completed={p.deepDive ? p.deepDive.completed : null}
                        missingLabel={t.missing}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <StepCell
                        completed={p.report ? p.report.generated : null}
                        missingLabel={t.missing}
                        label={
                          p.report?.npsScore
                            ? `NPS ${p.report.npsScore}`
                            : p.report?.reaction
                              ? p.report.reaction
                              : undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      {p.coaching.started ? (
                        <span className="text-emerald-600 text-xs font-medium">
                          {p.coaching.totalRounds}r
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <StepCell
                        completed={
                          p.postImmediate ? p.postImmediate.completed : null
                        }
                        missingLabel={t.missing}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      {p.post1Week ? (
                        p.post1Week.completed ? (
                          <span className="text-emerald-600 text-xs font-medium">
                            Done
                          </span>
                        ) : p.post1Week.dueDate ? (
                          <span className="text-amber-600 text-[10px] font-medium whitespace-nowrap">
                            {formatDueIn(p.post1Week.dueDate)}
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs font-medium">
                            Missing
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
