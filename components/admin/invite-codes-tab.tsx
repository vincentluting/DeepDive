"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Power,
  ChevronDown,
  Users,
  Trash2,
  Pencil,
  X,
  Search,
  AlertTriangle,
} from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { countryCodeToFlag } from "@/lib/utils/country-flags";
import type { ClaimedUserStep } from "@/lib/db/invite-codes";
import {
  JourneyProgressStepper,
  stepIndex,
  stepLabel,
} from "@/components/admin/journey-progress-stepper";

interface InviteCode {
  id: string;
  code: string;
  cohortId: string;
  researchGroup: "classic" | "immersive" | null;
  maxUses: number;
  usedCount: number;
  claimedByUserIds: string[];
  expiresAt: string | null;
  adminNote: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Per-claimed-user recruitment snapshot resolved by the API (GET userProgress). */
interface ClaimedProgress {
  email: string;
  name: string | null;
  furthestStep: ClaimedUserStep;
  createdAt: string;
  updatedAt: string;
  country: string | null;
  language: string | null;
}

// A claimed user counts as "stalled" once they've gone STALLED_DAYS without
// reaching a report, so the admin can see at a glance who needs a nudge.
const STALLED_DAYS = 7;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function isStalled(p: ClaimedProgress): boolean {
  if (stepIndex(p.furthestStep) >= stepIndex("report")) {
    return false;
  }
  return daysSince(p.updatedAt) >= STALLED_DAYS;
}

/** Locale-aware "3 days ago" / "3天前" without hardcoded strings. */
function relativeTime(iso: string, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 24) return rtf.format(-Math.max(hours, 1), "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.floor(months / 12), "year");
}

export function InviteCodesTab({ locale }: { locale: Locale }) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [userProgress, setUserProgress] = useState<
    Record<string, ClaimedProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Search + filter (client-side; the roster is at most a few dozen rows)
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newCohortId, setNewCohortId] = useState("thesis_2026");
  const [newResearchGroup, setNewResearchGroup] = useState<
    "" | "classic" | "immersive"
  >("");
  const [newMaxUses, setNewMaxUses] = useState("50");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState("");
  const [batchCount, setBatchCount] = useState("10");

  const t = (getDictionaryClient(locale).admin?.inviteCodes || {}) as Record<
    string,
    string
  >;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/invite-codes");
      if (!res.ok) throw new Error("Failed to fetch invite codes");
      const data = await res.json();
      setCodes(data.codes ?? []);
      setUserProgress(data.userProgress ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      if (batchMode) {
        // Batch create: PREFIX-001 through PREFIX-N
        const prefix = batchPrefix.trim().toUpperCase();
        if (!prefix) {
          setCreating(false);
          return;
        }
        const count = parseInt(batchCount, 10) || 10;
        const errors: string[] = [];

        for (let i = 1; i <= count; i++) {
          const code = `${prefix}-${String(i).padStart(3, "0")}`;
          const res = await csrfFetch("/api/admin/invite-codes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              cohortId: newCohortId,
              maxUses: parseInt(newMaxUses, 10) || 50,
              ...(newResearchGroup ? { researchGroup: newResearchGroup } : {}),
              ...(newExpiresAt
                ? { expiresAt: new Date(newExpiresAt).toISOString() }
                : {}),
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            errors.push(`${code}: ${data.error || "failed"}`);
          }
        }
        if (errors.length > 0) {
          setError(
            `Batch created with ${errors.length} errors: ${errors.slice(0, 3).join("; ")}`,
          );
        }
      } else {
        // Single create
        if (!newCode.trim()) {
          setCreating(false);
          return;
        }
        const res = await csrfFetch("/api/admin/invite-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: newCode.trim(),
            cohortId: newCohortId,
            maxUses: parseInt(newMaxUses, 10) || 50,
            ...(newResearchGroup ? { researchGroup: newResearchGroup } : {}),
            ...(newExpiresAt
              ? { expiresAt: new Date(newExpiresAt).toISOString() }
              : {}),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create invite code");
        }
      }

      setNewCode("");
      setBatchPrefix("");
      setNewResearchGroup("");
      setShowForm(false);
      await fetchCodes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (codeId: string, currentActive: boolean) => {
    setTogglingId(codeId);
    try {
      const res = await csrfFetch("/api/admin/invite-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      setCodes((prev) =>
        prev.map((c) =>
          c.id === codeId ? { ...c, isActive: !currentActive } : c,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (codeId: string, code: string) => {
    const confirmMsg = (
      t.deleteConfirm ??
      'Permanently delete invite code "{code}"? This cannot be undone.'
    ).replace("{code}", code);
    if (!window.confirm(confirmMsg)) return;
    setDeletingId(codeId);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/invite-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          setError(
            t.cannotDeleteUsed ??
              "Cannot delete a code that has been claimed. Deactivate instead.",
          );
        } else {
          setError(t.deleteFailed ?? "Failed to delete invite code.");
        }
        return;
      }
      setCodes((prev) => prev.filter((c) => c.id !== codeId));
      if (expandedId === codeId) setExpandedId(null);
    } catch {
      setError(t.deleteFailed ?? "Failed to delete invite code.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyRegistrationLink = (code: string) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://deepdive.app";
    const link = `${baseUrl}/${locale}/register?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const startEditNote = (ic: InviteCode) => {
    setEditingId(ic.id);
    setEditValue(ic.adminNote ?? "");
  };

  const cancelEditNote = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveNote = async (codeId: string) => {
    setSavingNote(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/invite-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, adminNote: editValue.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      setCodes((prev) =>
        prev.map((c) =>
          c.id === codeId ? { ...c, adminNote: editValue.trim() || null } : c,
        ),
      );
      setEditingId(null);
      setEditValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Distinct cohorts present, for the cohort filter dropdown
  const cohortOptions = useMemo(
    () => Array.from(new Set(codes.map((c) => c.cohortId))).sort(),
    [codes],
  );

  // Recruitment funnel roll-up across all distinct claimed users
  const summary = useMemo(() => {
    const values = Object.values(userProgress);
    const reached = (target: ClaimedUserStep) =>
      values.filter((p) => stepIndex(p.furthestStep) >= stepIndex(target))
        .length;
    return {
      claimed: values.length,
      quickDive: reached("quickDive"),
      deepDive: reached("deepDive"),
      report: reached("report"),
      coaching: reached("coaching"),
      stalled: values.filter(isStalled).length,
    };
  }, [userProgress]);

  // Search + stage + cohort filtering, evaluated at the code level
  const filteredCodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return codes.filter((ic) => {
      if (cohortFilter !== "all" && ic.cohortId !== cohortFilter) return false;
      const claimants = ic.claimedByUserIds
        .map((uid) => userProgress[uid])
        .filter(Boolean) as ClaimedProgress[];

      if (stageFilter === "stalled") {
        if (!claimants.some(isStalled)) return false;
      } else if (stageFilter !== "all") {
        if (!claimants.some((p) => p.furthestStep === stageFilter))
          return false;
      }

      if (q) {
        const haystack = [
          ic.code,
          ic.adminNote ?? "",
          ...claimants.flatMap((p) => [p.name ?? "", p.email]),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [codes, userProgress, searchQuery, stageFilter, cohortFilter]);

  // One claimed account: identity (name · email, links to journey detail),
  // language/region, join time, stall badge, and the visual progress stepper.
  const renderClaimant = (uid: string) => {
    const up = userProgress[uid];
    if (!up) {
      // Claimed uid with no resolvable User row (account deleted). Surface it
      // explicitly rather than as a mystery id — don't hide the gap.
      return (
        <div key={uid} className="text-xs text-muted-foreground/60 italic">
          {t.deletedAccount || "Deleted account"} · {uid.slice(0, 8)}…
        </div>
      );
    }
    const stalled = isStalled(up);
    const flag = up.country ? countryCodeToFlag(up.country) : "";
    const joinedLabel = (t.joinedAgo || "joined {time}").replace(
      "{time}",
      relativeTime(up.createdAt, locale),
    );
    return (
      <div
        key={uid}
        className="flex flex-col gap-2 rounded-lg bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${locale}/admin/user-journey/${uid}`}
              className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate max-w-[220px]"
              title={t.viewJourney || "View journey"}
            >
              {up.name || up.email}
            </Link>
            {(flag || up.language) && (
              <span
                className="text-xs text-muted-foreground whitespace-nowrap"
                title={t.region || "Language / region"}
              >
                {flag} {up.language ? up.language.toUpperCase() : ""}
              </span>
            )}
            {stalled && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-0.5 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {(t.stalledDays || "Stalled {n}d").replace(
                  "{n}",
                  String(daysSince(up.updatedAt)),
                )}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {up.name ? `${up.email} · ${joinedLabel}` : joinedLabel}
          </div>
        </div>
        <JourneyProgressStepper
          step={up.furthestStep}
          locale={locale}
          className="shrink-0"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <Badge variant="secondary" className="text-xs">
            {codes.length} {t.total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCodes}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" />
            {t.newCode}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            {/* Single / Batch toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!batchMode ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted"}`}
              >
                {t.singleMode || "Single"}
              </button>
              <button
                type="button"
                onClick={() => setBatchMode(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${batchMode ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted"}`}
              >
                {t.batchMode || "Batch"}
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code / Prefix */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {batchMode ? t.batchPrefix || "Prefix" : t.code}
                  </label>
                  {batchMode ? (
                    <Input
                      value={batchPrefix}
                      onChange={(e) =>
                        setBatchPrefix(e.target.value.toUpperCase())
                      }
                      placeholder={
                        t.batchPrefixPlaceholder || "e.g. BETA-LINKEDIN"
                      }
                      className="uppercase"
                      maxLength={40}
                      required
                    />
                  ) : (
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder={t.codePlaceholder}
                      className="uppercase"
                      maxLength={50}
                      required
                    />
                  )}
                </div>

                {/* Cohort */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t.cohort}
                  </label>
                  <select
                    value={newCohortId}
                    onChange={(e) => setNewCohortId(e.target.value)}
                    required
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="thesis_2026">thesis_2026 (Research)</option>
                    <option value="beta_2026">beta_2026 (Beta Tester)</option>
                  </select>
                </div>

                {/* Max Uses / Batch Count */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {batchMode ? t.batchCount || "Count" : t.maxUses}
                  </label>
                  {batchMode ? (
                    <Input
                      type="number"
                      value={batchCount}
                      onChange={(e) => setBatchCount(e.target.value)}
                      min={1}
                      max={100}
                      required
                    />
                  ) : (
                    <Input
                      type="number"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      min={1}
                      max={10000}
                      required
                    />
                  )}
                </div>

                {/* Research Group */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t.researchGroup || "Research Group"}
                  </label>
                  <select
                    value={newResearchGroup}
                    onChange={(e) =>
                      setNewResearchGroup(
                        e.target.value as "" | "classic" | "immersive",
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">
                      {t.researchGroupAuto || "Auto balance"}
                    </option>
                    <option value="classic">
                      {t.researchGroupClassic || "Classic / Quick Dive"}
                    </option>
                    <option value="immersive">
                      {t.researchGroupImmersive || "Immersive Dive"}
                    </option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {t.researchGroupHint ||
                      "Only thesis research codes need a fixed group."}
                  </p>
                </div>

                {/* Expires At */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t.expiresAt || "Expires At"}
                  </label>
                  <Input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.expiresAtHint || "Leave empty for no expiry"}
                  </p>
                </div>

                {/* Max uses per code (batch mode) */}
                {batchMode && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {t.maxUsesPerCode || "Max Uses Per Code"}
                    </label>
                    <Input
                      type="number"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      min={1}
                      max={10000}
                      required
                    />
                  </div>
                )}
              </div>

              {batchMode && batchPrefix && (
                <p className="text-xs text-muted-foreground">
                  {t.batchPreview || "Preview"}: {batchPrefix.toUpperCase()}-001
                  ~ {batchPrefix.toUpperCase()}-
                  {String(parseInt(batchCount, 10) || 10).padStart(3, "0")}
                </p>
              )}

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    creating ||
                    (!batchMode && !newCode.trim()) ||
                    (batchMode && !batchPrefix.trim())
                  }
                >
                  {creating && (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  )}
                  {batchMode
                    ? t.batchCreate || `Create ${batchCount} codes`
                    : t.create}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recruitment funnel summary */}
      {!loading && codes.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-foreground">
            <strong className="font-semibold">{codes.length}</strong>{" "}
            <span className="text-muted-foreground">{t.total}</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground">
            <strong className="font-semibold">{summary.claimed}</strong>{" "}
            <span className="text-muted-foreground">
              {t.claimedUsers || "claimed"}
            </span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">
            {t.reached || "reached"}
          </span>
          <span className="text-foreground">
            {stepLabel("quickDive", locale)}{" "}
            <strong className="font-semibold">{summary.quickDive}</strong>
          </span>
          <span className="text-foreground">
            {stepLabel("deepDive", locale)}{" "}
            <strong className="font-semibold">{summary.deepDive}</strong>
          </span>
          <span className="text-foreground">
            {stepLabel("report", locale)}{" "}
            <strong className="font-semibold">{summary.report}</strong>
          </span>
          <span className="text-foreground">
            {stepLabel("coaching", locale)}{" "}
            <strong className="font-semibold">{summary.coaching}</strong>
          </span>
          {summary.stalled > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <strong className="font-semibold">{summary.stalled}</strong>
                {t.stalled || "stalled"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Search + filters */}
      {!loading && codes.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                t.searchPlaceholder || "Search code, recipient, name, email…"
              }
              className="pl-9 h-9"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="flex h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{t.allStages || "All stages"}</option>
            <option value="registered">
              {stepLabel("registered", locale)}
            </option>
            <option value="quickDive">{stepLabel("quickDive", locale)}</option>
            <option value="deepDive">{stepLabel("deepDive", locale)}</option>
            <option value="report">{stepLabel("report", locale)}</option>
            <option value="coaching">{stepLabel("coaching", locale)}</option>
            <option value="stalled">{`⚠ ${t.stalled || "Stalled"}`}</option>
          </select>
          {cohortOptions.length > 1 && (
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="flex h-9 rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">{t.allCohorts || "All cohorts"}</option>
              {cohortOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Roster */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t.emptyState}</p>
          </CardContent>
        </Card>
      ) : filteredCodes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t.noMatches || "No invite codes match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {filteredCodes.map((ic) => {
              const isExpired =
                ic.expiresAt && new Date(ic.expiresAt) < new Date();
              const isFull = ic.usedCount >= ic.maxUses;
              const isActiveState = ic.isActive && !isExpired && !isFull;
              const isExpanded = expandedId === ic.id;
              const claimCount = ic.claimedByUserIds.length;
              const multi = claimCount > 1;

              return (
                <div key={ic.id} className="p-4 space-y-3">
                  {/* Header: code + badges + actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono font-semibold">
                        {ic.code}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {ic.cohortId}
                      </Badge>
                      {ic.researchGroup && (
                        <Badge variant="secondary" className="text-xs">
                          {ic.researchGroup === "classic"
                            ? t.researchGroupClassic || "Classic / Quick Dive"
                            : t.researchGroupImmersive || "Immersive Dive"}
                        </Badge>
                      )}
                      {isActiveState ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          {t.active}
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="secondary" className="text-xs">
                          {t.expired}
                        </Badge>
                      ) : isFull ? (
                        <Badge variant="secondary" className="text-xs">
                          {t.full}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          {t.disabled}
                        </Badge>
                      )}
                      <span
                        className={`text-xs ${isFull ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {ic.usedCount}/{ic.maxUses}
                      </span>
                      {ic.expiresAt && !isExpired && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(ic.expiresAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle active */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(ic.id, ic.isActive)}
                        disabled={togglingId === ic.id}
                        title={
                          ic.isActive
                            ? t.deactivate || "Deactivate"
                            : t.activate || "Activate"
                        }
                        className={
                          ic.isActive
                            ? "text-emerald-600 hover:text-red-500"
                            : "text-red-500 hover:text-emerald-600"
                        }
                      >
                        {togglingId === ic.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      {/* Copy link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyRegistrationLink(ic.code)}
                        title={t.copyRegLink}
                      >
                        {copiedCode === ic.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="ml-1 hidden sm:inline text-xs">
                          {copiedCode === ic.code ? t.copied : t.copyLink}
                        </span>
                      </Button>
                      {/* Delete (only for never-claimed codes) */}
                      {ic.usedCount === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ic.id, ic.code)}
                          disabled={deletingId === ic.id}
                          title={t.delete || "Delete"}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          {deletingId === ic.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Assigned-to (intended recipient) — inline editable */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">
                      {t.assignedTo || "Assigned to"}:
                    </span>
                    {editingId === ic.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={t.assignPlaceholder}
                          className="h-7 text-xs w-[160px]"
                          maxLength={500}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveNote(ic.id);
                            if (e.key === "Escape") cancelEditNote();
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => saveNote(ic.id)}
                          disabled={savingNote}
                          title={t.save || "Save"}
                        >
                          {savingNote ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={cancelEditNote}
                          disabled={savingNote}
                          title={t.cancel || "Cancel"}
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 group cursor-pointer"
                        onClick={() => startEditNote(ic)}
                        title={t.assignedTo || "Assigned to"}
                      >
                        {ic.adminNote ? (
                          <span className="text-foreground truncate max-w-[220px]">
                            {ic.adminNote}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">
                            {t.assignHint || "Assign…"}
                          </span>
                        )}
                        <Pencil className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Claimed account(s) + progress */}
                  {claimCount === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic">
                      {t.notClaimed || "Not claimed yet"}
                    </p>
                  ) : !multi ? (
                    renderClaimant(ic.claimedByUserIds[0])
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : ic.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {(t.claimedCount || "{n} claimed").replace(
                          "{n}",
                          String(claimCount),
                        )}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="space-y-1.5">
                          {ic.claimedByUserIds.map((uid) =>
                            renderClaimant(uid),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Usage Tip */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <p className="text-sm text-muted-foreground">
          {`\u{1F4A1} ${t.usageTip}`}
        </p>
      </div>
    </div>
  );
}
