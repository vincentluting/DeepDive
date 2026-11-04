"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface TaskSummary {
  taskName: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  degradedCount: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  cacheHitCount: number;
  cacheHitRate: number;
}

interface DailySummary {
  date: string;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

interface CostPerUser {
  userId: string;
  email: string | null;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
}

interface ModelSummary {
  model: string;
  provider: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  degradedCount: number;
  estimatedCostUsd: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  cacheHitCount: number;
  cacheHitRate: number;
}

interface UsageData {
  byTask: TaskSummary[];
  byDay: DailySummary[];
  byModel: ModelSummary[];
  costPerUser: CostPerUser[];
  totalEstimatedCost: number;
  days: number;
}

export function AIUsageTab({ locale }: { locale: Locale }) {
  const t = (getDictionaryClient(locale).admin?.aiUsage || {}) as Record<
    string,
    string
  >;
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [environment, setEnvironment] = useState<"all" | "production" | "test">(
    "all",
  );

  useEffect(() => {
    setLoading(true);
    const envParam = environment !== "all" ? `&environment=${environment}` : "";
    csrfFetch(`/api/admin/llm-usage?days=${days}${envParam}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days, environment]);

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted/30 rounded-lg" />;
  }

  if (!data) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t.noData ||
            "No LLM usage data available. Data will appear after LLM calls are made."}
        </CardContent>
      </Card>
    );
  }

  const totalCalls = data.byTask.reduce((s, t) => s + t.totalCalls, 0);
  const totalInput = data.byTask.reduce((s, t) => s + t.totalInputTokens, 0);
  const totalOutput = data.byTask.reduce((s, t) => s + t.totalOutputTokens, 0);
  const totalDegraded = data.byTask.reduce((s, t) => s + t.degradedCount, 0);
  const avgLatency =
    totalCalls > 0
      ? Math.round(
          data.byTask.reduce((s, t) => s + t.avgLatencyMs * t.totalCalls, 0) /
            totalCalls,
        )
      : 0;

  // Cache metrics
  const totalCacheRead = data.byTask.reduce(
    (s, t) => s + t.totalCacheReadTokens,
    0,
  );
  const totalCacheWrite = data.byTask.reduce(
    (s, t) => s + t.totalCacheWriteTokens,
    0,
  );
  const totalCacheHits = data.byTask.reduce((s, t) => s + t.cacheHitCount, 0);
  const cacheCallsTotal = data.byTask.reduce(
    (s, t) =>
      s +
      t.cacheHitCount +
      (t.totalCacheWriteTokens > 0 ? t.totalCalls - t.cacheHitCount : 0),
    0,
  );
  const overallCacheHitRate =
    cacheCallsTotal > 0
      ? Math.round((totalCacheHits / cacheCallsTotal) * 1000) / 10
      : 0;
  const hasCacheData = totalCacheRead > 0 || totalCacheWrite > 0;

  return (
    <div className="space-y-6">
      {/* Controls: time range + environment filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t.period || "Period:"}
          </span>
          {[1, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === 1 ? t.today || "Today" : `${d}d`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t.env || "Env:"}
          </span>
          {(["all", "production", "test"] as const).map((env) => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                environment === env
                  ? env === "test"
                    ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30"
                    : env === "production"
                      ? "bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/30"
                      : "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {env === "all"
                ? t.envAll || "All"
                : env === "production"
                  ? t.envProd || "Prod"
                  : t.envTest || "Test"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        <SummaryCard
          label={t.totalCalls || "Total Calls"}
          value={totalCalls.toLocaleString()}
        />
        <SummaryCard
          label={t.inputTokens || "Input Tokens"}
          value={formatTokens(totalInput)}
        />
        <SummaryCard
          label={t.outputTokens || "Output Tokens"}
          value={formatTokens(totalOutput)}
        />
        <SummaryCard
          label={t.avgLatency || "Avg Latency"}
          value={`${avgLatency}ms`}
        />
        <SummaryCard
          label={t.degraded || "Degraded"}
          value={totalDegraded.toString()}
          alert={totalDegraded > 0}
        />
        <SummaryCard
          label={(t.estCost || "Est. Cost ({days}d)").replace(
            "{days}",
            String(data.days),
          )}
          value={`$${data.totalEstimatedCost.toFixed(2)}`}
          alert={data.totalEstimatedCost > 10}
        />
      </div>

      {/* Prompt Cache Performance */}
      {hasCacheData && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Prompt Cache Performance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <SummaryCard
                label="Cache Hit Rate"
                value={`${overallCacheHitRate}%`}
                alert={overallCacheHitRate < 30}
              />
              <SummaryCard
                label="Cache Hits"
                value={totalCacheHits.toLocaleString()}
              />
              <SummaryCard
                label="Cached Read Tokens"
                value={formatTokens(totalCacheRead)}
              />
              <SummaryCard
                label="Cache Write Tokens"
                value={formatTokens(totalCacheWrite)}
              />
              <SummaryCard
                label="Est. Savings"
                value={`$${estimateCacheSavings(data.byModel).toFixed(2)}`}
              />
            </div>
            {/* Per-task cache breakdown */}
            {data.byTask.some(
              (t) => t.totalCacheReadTokens > 0 || t.totalCacheWriteTokens > 0,
            ) && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.taskCol}</TableHead>
                      <TableHead className="text-right">{t.callsCol}</TableHead>
                      <TableHead className="text-right">
                        {t.hitRateCol}
                      </TableHead>
                      <TableHead className="text-right">
                        {t.cacheReadCol}
                      </TableHead>
                      <TableHead className="text-right">
                        {t.cacheWriteCol}
                      </TableHead>
                      <TableHead className="text-right">{t.hitsCol}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byTask
                      .filter(
                        (t) =>
                          t.totalCacheReadTokens > 0 ||
                          t.totalCacheWriteTokens > 0,
                      )
                      .map((task) => (
                        <TableRow key={task.taskName}>
                          <TableCell className="font-mono text-sm">
                            {task.taskName}
                          </TableCell>
                          <TableCell className="text-right">
                            {task.totalCalls}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              task.cacheHitRate >= 50
                                ? "text-emerald-500"
                                : task.cacheHitRate > 0
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {task.cacheHitRate}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatTokens(task.totalCacheReadTokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatTokens(task.totalCacheWriteTokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {task.cacheHitCount}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily breakdown */}
      {data.byDay.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t.dailyBreakdown || "Daily Breakdown"}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {data.byDay.slice(-14).map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-muted-foreground">
                    {day.date.slice(5)}
                  </div>
                  <div className="text-sm font-medium">{day.totalCalls}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTokens(day.totalInputTokens + day.totalOutputTokens)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task breakdown table */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t.byTask || "By Task"}
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.taskCol || "Task"}</TableHead>
                  <TableHead className="text-right">
                    {t.callsCol || "Calls"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.successCol || "Success"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.avgLatency || "Avg Latency"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.inputTokens || "Input Tokens"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.outputTokens || "Output Tokens"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t.degraded || "Degraded"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byTask.map((task) => (
                  <TableRow key={task.taskName}>
                    <TableCell className="font-mono text-sm">
                      {task.taskName}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.totalCalls}
                    </TableCell>
                    <TableCell
                      className={`text-right ${task.successRate < 90 ? "text-red-500 font-medium" : ""}`}
                    >
                      {task.successRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {task.avgLatencyMs}ms
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTokens(task.totalInputTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTokens(task.totalOutputTokens)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${task.degradedCount > 0 ? "text-amber-500 font-medium" : ""}`}
                    >
                      {task.degradedCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* By Model breakdown */}
      {data.byModel.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t.byModel || "By Model"}
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.modelCol || "Model"}</TableHead>
                    <TableHead>{t.providerCol || "Provider"}</TableHead>
                    <TableHead className="text-right">
                      {t.callsCol || "Calls"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.successCol || "Success"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.avgLatency || "Avg Latency"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.inputTokens || "Input Tokens"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.outputTokens || "Output Tokens"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.cacheHitCol}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.estCostCol || "Est. Cost"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byModel.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="font-mono text-sm">
                        {m.model}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            m.provider === "anthropic"
                              ? "bg-orange-500/10 text-orange-500"
                              : m.provider === "openai"
                                ? "bg-green-500/10 text-green-500"
                                : m.provider === "groq"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.provider}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.totalCalls}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          m.totalCalls > 0 &&
                          m.successCount / m.totalCalls < 0.9
                            ? "text-red-500 font-medium"
                            : ""
                        }`}
                      >
                        {m.totalCalls > 0
                          ? Math.round((m.successCount / m.totalCalls) * 100)
                          : 0}
                        %
                      </TableCell>
                      <TableCell className="text-right">
                        {m.avgLatencyMs}ms
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTokens(m.totalInputTokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTokens(m.totalOutputTokens)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          m.cacheHitRate >= 50
                            ? "text-emerald-500"
                            : m.cacheHitRate > 0
                              ? "text-amber-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {m.cacheHitRate > 0 ? `${m.cacheHitRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${m.estimatedCostUsd.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost per user */}
      {data.costPerUser.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t.costPerUser || "Cost Per User (Top 20)"}
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.userCol || "User"}</TableHead>
                    <TableHead className="text-right">
                      {t.callsCol || "Calls"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.inputCol || "Input"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.outputCol || "Output"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.estCostCol || "Est. Cost"}
                    </TableHead>
                    <TableHead className="text-right">
                      {t.avgPerCall || "Avg/Call"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.costPerUser.slice(0, 20).map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-mono text-sm">
                        {user.email || user.userId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.totalCalls}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTokens(user.totalInputTokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTokens(user.totalOutputTokens)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${user.estimatedCostUsd.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        $
                        {(
                          user.estimatedCostUsd / Math.max(user.totalCalls, 1)
                        ).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-xl font-bold ${alert ? "text-amber-500" : "text-foreground"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Estimate cost savings from prompt caching across all models.
 *  Anthropic: cached tokens cost 10% of normal → savings = 90% of cached read tokens * input price.
 *  OpenAI: cached tokens cost 50% of normal → savings = 50%.
 *  Gemini: cached tokens cost 10% of normal → savings = 90%. */
function estimateCacheSavings(byModel: ModelSummary[]): number {
  const PRICING: Record<string, { input: number; discount: number }> = {
    "claude-sonnet-4-5-20250929": { input: 3.0, discount: 0.9 },
    "claude-haiku-4-5-20251001": { input: 0.8, discount: 0.9 },
    "gpt-4o-mini": { input: 0.15, discount: 0.5 },
    "gemini-2.5-flash": { input: 0.15, discount: 0.9 },
  };
  const DEFAULT = { input: 1.0, discount: 0.5 };

  return byModel.reduce((total, m) => {
    const p = PRICING[m.model] || DEFAULT;
    return total + (m.totalCacheReadTokens * p.input * p.discount) / 1_000_000;
  }, 0);
}
