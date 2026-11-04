"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, AlertCircle } from "lucide-react";
import type { Panel3Pathway, ActionPlanTask, WeekPreview } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface WeeklyActionPlanProps {
  actionPlan: Panel3Pathway["actionPlan"];
  reportId: string;
  locale: Locale;
  t: Record<string, string>;
  onLockedWeekClick?: () => void;
}

// ── DB-backed item mapping ────────────────────────────────
interface DbItem {
  id: string;
  status: string;
}

// ── localStorage fallback (used when Action Hub plan not available) ──
const STORAGE_KEY_PREFIX = "deep_dive_tasks_";

function getStorageKey(reportId: string) {
  return `${STORAGE_KEY_PREFIX}${reportId}`;
}

function loadTaskStates(reportId: string): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(getStorageKey(reportId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return {};
}

function saveTaskStates(reportId: string, states: Record<number, boolean>) {
  try {
    localStorage.setItem(getStorageKey(reportId), JSON.stringify(states));
  } catch {
    // ignore storage errors
  }
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: {
    label: "easy",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  medium: {
    label: "medium",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  stretch: {
    label: "stretch",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export function WeeklyActionPlan({
  actionPlan,
  reportId,
  locale,
  t,
  onLockedWeekClick,
}: WeeklyActionPlanProps) {
  // ── DB state: maps task description → ActionItem id + status ──
  const [dbItemMap, setDbItemMap] = useState<Map<string, DbItem> | null>(null);
  const dbLoadedRef = useRef(false);

  // ── localStorage fallback state ──
  const [taskStates, setTaskStates] = useState<Record<number, boolean>>({});

  // Try to load Action Hub items matching this report
  useEffect(() => {
    if (dbLoadedRef.current) return;
    dbLoadedRef.current = true;

    fetch("/api/action-hub/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plan?.reportId === reportId && data?.items?.length) {
          const week1Items = (
            data.items as Array<{
              id: string;
              status: string;
              sourceDimension: string | null;
              title: string;
            }>
          ).filter((item) => item.sourceDimension === "panel3_week1");
          if (week1Items.length > 0) {
            const map = new Map<string, DbItem>();
            for (const item of week1Items) {
              map.set(item.title, { id: item.id, status: item.status });
            }
            setDbItemMap(map);
            return;
          }
        }
        // No matching DB items — load localStorage fallback
        setTaskStates(loadTaskStates(reportId));
      })
      .catch(() => {
        // Auth failed or network error — fall back to localStorage
        setTaskStates(loadTaskStates(reportId));
      });
  }, [reportId]);

  // Check if a task is completed (DB-first, localStorage fallback)
  const isTaskCompleted = useCallback(
    (task: ActionPlanTask, idx: number): boolean => {
      if (dbItemMap) {
        const match = dbItemMap.get(task.description);
        return match?.status === "completed";
      }
      return !!taskStates[idx];
    },
    [dbItemMap, taskStates],
  );

  // Toggle task status (DB-first, localStorage fallback)
  const toggleTask = useCallback(
    (task: ActionPlanTask, idx: number) => {
      if (dbItemMap) {
        const match = dbItemMap.get(task.description);
        if (match) {
          const newStatus =
            match.status === "completed" ? "pending" : "completed";
          // Optimistic update
          setDbItemMap((prev) => {
            const next = new Map(prev);
            next.set(task.description, { id: match.id, status: newStatus });
            return next;
          });
          // Persist to DB via Action Hub API
          csrfFetch("/api/action-hub/items", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: match.id, status: newStatus }),
          }).catch(() => {
            // Revert on failure
            setDbItemMap((prev) => {
              const next = new Map(prev);
              next.set(task.description, {
                id: match.id,
                status: match.status,
              });
              return next;
            });
          });
          return;
        }
      }
      // localStorage fallback
      setTaskStates((prev: Record<number, boolean>) => {
        const next = { ...prev, [idx]: !prev[idx] };
        saveTaskStates(reportId, next);
        return next;
      });
    },
    [dbItemMap, reportId],
  );

  const completedCount = actionPlan.week1.tasks.filter((task, idx) =>
    isTaskCompleted(task, idx),
  ).length;
  const totalTasks = actionPlan.week1.tasks.length;

  const weekLabel = (n: number) => {
    return interpolate(t.weekNumber, { n });
  };

  return (
    <div className="space-y-4">
      {/* Thrust note */}
      {actionPlan.thrustNote && (
        <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {actionPlan.thrustNote}
          </p>
        </div>
      )}

      {/* Confidence note */}
      {actionPlan.confidenceNote && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {actionPlan.confidenceNote}
          </p>
        </div>
      )}

      {/* Week 1 — full tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {weekLabel(1)}
              <span className="text-muted-foreground font-normal text-sm">
                — {actionPlan.week1.theme}
              </span>
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalTasks}
            </Badge>
          </div>
          {/* Week 1 progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width:
                  totalTasks > 0
                    ? `${(completedCount / totalTasks) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {actionPlan.week1.tasks.map((task, idx) => (
              <TaskItem
                key={idx}
                task={task}
                checked={isTaskCompleted(task, idx)}
                onToggle={() => toggleTask(task, idx)}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weeks 2-4 — locked previews */}
      {actionPlan.weeksPreview.length > 0 && (
        <div className="space-y-3">
          {actionPlan.weeksPreview.map((week) => (
            <LockedWeekCard
              key={week.weekNumber}
              week={week}
              locale={locale}
              t={t}
              weekLabel={weekLabel(week.weekNumber)}
              onClick={onLockedWeekClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  checked,
  onToggle,
  locale: _locale,
  t,
}: {
  task: ActionPlanTask;
  checked: boolean;
  onToggle: () => void;
  locale: Locale;
  t: Record<string, string>;
}) {
  const diff = difficultyConfig[task.difficulty] || difficultyConfig.easy;
  const diffLabel = t[task.difficulty] || diff.label;

  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        checked
          ? "bg-primary/5 border-primary/20"
          : "bg-transparent border-border hover:bg-muted/30"
      }`}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${checked ? "line-through text-muted-foreground/60" : "text-foreground"}`}
        >
          {task.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${diff.className}`}
          >
            {diffLabel}
          </Badge>
          {task.relatedDirection > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {t.direction} #{task.relatedDirection}
            </span>
          )}
        </div>
      </div>
    </label>
  );
}

function LockedWeekCard({
  week,
  locale: _locale,
  t,
  weekLabel,
}: {
  week: WeekPreview;
  locale: Locale;
  t: Record<string, string>;
  weekLabel: string;
  onClick?: () => void;
}) {
  return (
    <Card className="border-dashed border-muted-foreground/20 bg-muted/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {weekLabel} — {week.theme}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {week.taskCount} {t.tasks}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs text-muted-foreground/50 border-muted-foreground/15"
          >
            {t.previewOnly}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
