"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  HelpCircle,
  Trash2,
  Plus,
  AlertCircle,
  Fingerprint,
  Compass,
  Activity,
  Navigation,
  Anchor,
  Flame,
  Eye,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { csrfFetch } from "@/lib/auth/csrf-client";
import {
  getDictionarySection,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import type { UserMemory, MemoryCategory } from "@/lib/types/memory";
import {
  MEMORY_CATEGORY_LABELS,
  MEMORY_CATEGORY_COLORS,
} from "@/lib/types/memory";

/** Map MEMORY_CATEGORY_LABELS.icon string → Lucide component */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Fingerprint,
  Compass,
  Activity,
  Navigation,
  Anchor,
  Flame,
  Eye,
  Sparkles,
  MessageCircle,
};

interface MemoryPanelProps {
  locale: "en" | "zh";
  compact?: boolean;
}

const CATEGORY_OPTIONS: MemoryCategory[] = [
  "personality",
  "strength",
  "values",
  "motivation",
  "career",
  "behavior",
  "constraint",
  "blindspot",
];

export function MemoryPanel({ locale, compact = false }: MemoryPanelProps) {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<{
    message: string;
    reason?: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Manual add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addKeyword, setAddKeyword] = useState("");
  const [addInsight, setAddInsight] = useState("");
  const [addCategory, setAddCategory] = useState<MemoryCategory>("personality");
  const [addSaving, setAddSaving] = useState(false);

  // Prevent race condition: only auto-generate once
  const hasTriedGenerate = useRef(false);

  const t = getDictionarySection(locale, "memoryPanel");

  // ---- Fetch existing memories ----
  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      } else if (res.status === 401) {
        setMemories([]);
      } else {
        setError({
          message: t.loadError,
          reason: "fetch_error",
        });
      }
    } catch {
      setError({
        message: t.networkError,
        reason: "network",
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ---- Generate memories (LLM + deterministic fallback) ----
  const handleGenerate = useCallback(
    async (force = false) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await csrfFetch("/api/memory/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRegenerate: force }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reason === "no_data") {
            setError({
              message: t.noAssessmentData,
              reason: "no_data",
            });
            setMemories([]);
          } else {
            setMemories(data.memories || []);
          }
        } else if (res.status === 401) {
          setError({
            message: t.loginRequired,
            reason: "auth",
          });
        } else if (res.status === 429) {
          setError({
            message: t.rateLimited,
            reason: "rate_limit",
          });
        } else {
          setError({
            message: t.generateError,
            reason: "generate_error",
          });
        }
      } catch {
        setError({
          message: t.networkErrorGenerate,
          reason: "network",
        });
      } finally {
        setGenerating(false);
      }
    },
    [t],
  );

  // ---- Delete a single memory ----
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await csrfFetch("/api/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      } else {
        if (__DEV__)
          console.warn("[memory-panel] Delete failed with status:", res.status);
      }
    } catch (err) {
      if (__DEV__) console.warn("[memory-panel] Delete request failed:", err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  // ---- Manual add ----
  const handleAdd = useCallback(async () => {
    if (!addKeyword.trim() || !addInsight.trim()) return;
    setAddSaving(true);
    try {
      const res = await csrfFetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: addCategory,
          keyword: addKeyword.trim(),
          insight: addInsight.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
        setAddKeyword("");
        setAddInsight("");
        setShowAddForm(false);
      } else {
        if (__DEV__)
          console.warn("[memory-panel] Add failed with status:", res.status);
      }
    } catch (err) {
      if (__DEV__) console.warn("[memory-panel] Add request failed:", err);
    } finally {
      setAddSaving(false);
    }
  }, [addCategory, addKeyword, addInsight]);

  // ---- Initial load ----
  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // ---- Auto-generate once if no memories after initial load ----
  useEffect(() => {
    if (
      !loading &&
      memories.length === 0 &&
      !error &&
      !generating &&
      !hasTriedGenerate.current
    ) {
      hasTriedGenerate.current = true;
      handleGenerate(false);
    }
  }, [loading, memories.length, error, generating, handleGenerate]);

  const totalCount = memories.length;
  const lastUpdated =
    memories.length > 0
      ? new Date(
          Math.max(
            ...memories.map((m) =>
              new Date(m.updatedAt || m.createdAt).getTime(),
            ),
          ),
        )
      : null;

  function formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t.today;
    if (days === 1) return t.oneDayAgo;
    if (days < 30) return interpolate(t.daysAgo, { days });
    const months = Math.floor(days / 30);
    return interpolate(t.monthsAgo, { months });
  }

  // ---- Skeleton loading ----
  if (loading || generating) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/50 overflow-hidden",
          compact ? "bg-card/80" : "bg-card",
        )}
      >
        <div className="px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-muted animate-pulse" />
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-48 rounded bg-muted/50 animate-pulse mt-2" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-muted/30 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 rounded bg-muted/40" />
                <div className="h-3 w-full rounded bg-muted/20" />
              </div>
            </div>
          ))}
        </div>
        {generating && (
          <div
            className="px-5 py-3 border-t border-border/30 text-xs text-muted-foreground text-center"
            aria-live="polite"
          >
            {t.analyzing}
          </div>
        )}
      </div>
    );
  }

  // ---- Empty state (with possible error) ----
  if (memories.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/50 overflow-hidden",
          compact ? "bg-card/80" : "bg-card",
        )}
      >
        <div className="p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-primary/50" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            {t.empty}
          </h3>
          {error ? (
            <>
              <p className="text-xs text-amber-400 mb-4 max-w-xs mx-auto flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error.message}
              </p>
              {error.reason === "no_data" ? (
                <a
                  href={`/${locale}/deepdive`}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  {t.startAssessment}
                </a>
              ) : error.reason !== "auth" ? (
                <button
                  onClick={() => {
                    hasTriedGenerate.current = false;
                    handleGenerate(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t.retry}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                {t.emptyDesc}
              </p>
              <a
                href={`/${locale}/deepdive`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {t.startAssessment}
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Main UI: flat list ----
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 overflow-hidden",
        compact ? "bg-card/80" : "bg-card",
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/70" />
            {t.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 transition-colors"
            aria-label={t.addManually}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 transition-colors disabled:opacity-40"
            aria-label={t.regenerate}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", generating && "animate-spin")}
            />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 transition-colors"
            aria-label={t.help}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Help */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 bg-primary/5 border-b border-border/30 text-xs text-muted-foreground leading-relaxed">
              {t.helpText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error.message}
          </span>
          {error.reason !== "auth" && error.reason !== "no_data" && (
            <button
              onClick={() => handleGenerate(true)}
              className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2"
            >
              {t.retry}
            </button>
          )}
        </div>
      )}

      {/* Manual add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border/30 bg-white/[0.02] space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={addCategory}
                  onChange={(e) =>
                    setAddCategory(e.target.value as MemoryCategory)
                  }
                  aria-label={t.memoryCategory}
                  className="text-xs bg-transparent border border-border/50 rounded-lg px-2 py-1.5 text-foreground"
                >
                  {CATEGORY_OPTIONS.map((cat) => {
                    const label = MEMORY_CATEGORY_LABELS[cat];
                    return (
                      <option key={cat} value={cat}>
                        {pickLocaleText(label, locale)}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={addKeyword}
                  onChange={(e) => setAddKeyword(e.target.value)}
                  placeholder={t.tagPlaceholder}
                  aria-label={t.tagLabel}
                  maxLength={20}
                  className="flex-1 text-xs bg-transparent border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary/60"
                />
              </div>
              <textarea
                value={addInsight}
                onChange={(e) => setAddInsight(e.target.value)}
                placeholder={t.insightPlaceholder}
                aria-label={t.insightLabel}
                maxLength={200}
                rows={2}
                className="w-full text-xs bg-transparent border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary/60 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={
                    addSaving || !addKeyword.trim() || !addInsight.trim()
                  }
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  {addSaving ? t.saving : t.add}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory list */}
      <div className="divide-y divide-border/30">
        {memories.map((memory, i) => {
          const catLabel = MEMORY_CATEGORY_LABELS[memory.category];
          const colorClass =
            MEMORY_CATEGORY_COLORS[memory.category] ||
            "bg-muted text-muted-foreground border-border";
          const isDeleting = deletingId === memory.id;
          const IconComponent =
            CATEGORY_ICON_MAP[catLabel?.icon ?? ""] ?? Sparkles;

          return (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: isDeleting ? 0.3 : 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="px-5 py-3.5 group hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Category icon */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 mt-0.5",
                    colorClass,
                  )}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground leading-snug">
                    {memory.keyword}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {memory.insight}
                  </div>
                </div>

                {/* Delete button — appears on hover */}
                <button
                  onClick={() => handleDelete(memory.id)}
                  disabled={isDeleting}
                  className="p-1 rounded-lg text-transparent group-hover:text-muted-foreground/40 focus-visible:text-muted-foreground/40 hover:!text-red-400 hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all shrink-0"
                  aria-label={t.delete}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground/60">
        <span>{interpolate(t.memoryCount, { count: totalCount })}</span>
        {lastUpdated && (
          <span>
            {t.lastUpdated}
            {formatTimeAgo(lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
}
