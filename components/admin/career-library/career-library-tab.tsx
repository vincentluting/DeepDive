"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Library,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Eye,
  EyeOff,
  Check,
  Download,
  Upload,
} from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Types ────────────────────────────────────────

interface CareerDirection {
  id: string;
  source: "curated" | "onet" | "emerging";
  titleEn: string;
  titleZh: string;
  subtitleZh: string | null;
  idealRiasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  alignedValues: string[];
  idealBigFive: Record<string, { min: number; max: number }>;
  industries: string[];
  crossCulturalFit: string[];
  seniorityMin: number;
  seniorityMax: number;
  tags: string[];
  aiEraCategory: "stable" | "augmented" | "transformed" | "ai-native" | null;
  annotationSource: string;
  annotationConfidence: string;
  marketOutlook: {
    trend: string;
    label_zh: string;
    label_en: string;
    note_zh?: string;
    note_en?: string;
    source: string;
    lastUpdated: string;
  } | null;
  isActive: boolean;
  lastReviewedAt: string | null;
  updatedAt: string;
}

interface Stats {
  total: number;
  curated: number;
  onet: number;
  emerging: number;
  active: number;
  inactive: number;
}

const RIASEC_KEYS = ["R", "I", "A", "S", "E", "C"] as const;
const RIASEC_LABELS: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};
const RIASEC_COLORS: Record<string, string> = {
  R: "bg-red-500",
  I: "bg-blue-500",
  A: "bg-purple-500",
  S: "bg-green-500",
  E: "bg-amber-500",
  C: "bg-slate-500",
};

const PAGE_SIZE = 30;

// ── Component ────────────────────────────────────

export function CareerLibraryTab({ locale }: { locale: Locale }) {
  const [rows, setRows] = useState<CareerDirection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<CareerDirection | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dict = getDictionaryClient(locale);
  const t = (dict.admin?.careerLibrary || {}) as Record<string, string>;

  // ── Fetch data ─────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      if (activeFilter) params.set("isActive", activeFilter);

      const [listRes, statsRes] = await Promise.all([
        csrfFetch(`/api/admin/career-directions?${params}`),
        csrfFetch("/api/admin/career-directions?stats=true"),
      ]);

      if (!listRes.ok) throw new Error("Failed to fetch career directions");
      const listData = await listRes.json();
      setRows(listData.rows ?? []);
      setTotal(listData.total ?? 0);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ───────────────────────────────────

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleEdit = (row: CareerDirection) => {
    setEditingId(row.id);
    setEditData({ ...row });
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/career-directions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          action: "update",
          data: {
            titleEn: editData.titleEn,
            titleZh: editData.titleZh,
            subtitleZh: editData.subtitleZh,
            idealRiasec: editData.idealRiasec,
            alignedValues: editData.alignedValues,
            idealBigFive: editData.idealBigFive,
            industries: editData.industries,
            crossCulturalFit: editData.crossCulturalFit,
            seniorityMin: editData.seniorityMin,
            seniorityMax: editData.seniorityMax,
            tags: editData.tags,
            aiEraCategory: editData.aiEraCategory,
            annotationSource: editData.annotationSource,
            annotationConfidence: editData.annotationConfidence,
            marketOutlook: editData.marketOutlook,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditingId(null);
      setEditData(null);
      setSuccessMsg(t.saved || "Saved!");
      setTimeout(() => setSuccessMsg(null), 2000);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      const res = await csrfFetch("/api/admin/career-directions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: currentlyActive ? "deactivate" : "reactivate",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle");
      }
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      if (activeFilter) params.set("isActive", activeFilter);

      const res = await csrfFetch(`/api/admin/career-directions?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `career-directions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    dryRun?: boolean;
    totalParsed?: number;
    imported?: number;
    skipped?: number;
    errors?: Array<{ row: number; field: string; message: string }>;
    preview?: Array<{ id: string; titleEn: string; source: string }>;
    pendingFile?: File;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      // Step 1: dry run
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", "true");

      const res = await csrfFetch("/api/admin/career-directions/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Validation failed");
      }

      setImportResult({ ...data, pendingFile: file });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult?.pendingFile) return;
    setImporting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", importResult.pendingFile);

      const res = await csrfFetch("/api/admin/career-directions/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Import failed");
      }

      setImportResult({ ...data, pendingFile: undefined });
      setSuccessMsg(
        `${t.importSuccess || "Imported"}: ${data.imported} ${t.importRows || "rows"}`,
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setImportResult(null);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const handleBatchAction = async (action: "deactivate" | "reactivate") => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/admin/career-directions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `batch-${action}`,
          ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Batch action failed");
      }
      const data = await res.json();
      setSuccessMsg(
        `${data.affected} ${t.importRows || "rows"} ${action === "deactivate" ? t.deactivated || "deactivated" : t.reactivated || "reactivated"}`,
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      setSelectedIds(new Set());
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch action failed");
    } finally {
      setBatchLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── RIASEC mini bar ────────────────────────────

  const RiasecBar = ({
    riasec,
  }: {
    riasec: CareerDirection["idealRiasec"];
  }) => (
    <div
      className="flex items-center gap-0.5"
      title={RIASEC_KEYS.map((k) => `${k}:${riasec[k]}`).join(" ")}
    >
      {RIASEC_KEYS.map((k) => (
        <div key={k} className="flex flex-col items-center gap-0.5">
          <div className="w-3 h-8 bg-muted rounded-sm overflow-hidden flex flex-col-reverse">
            <div
              className={`${RIASEC_COLORS[k]} rounded-sm transition-all`}
              style={{ height: `${riasec[k]}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground leading-none">
            {k}
          </span>
        </div>
      ))}
    </div>
  );

  // ── RIASEC Editor ──────────────────────────────

  const RiasecEditor = ({
    riasec,
    onChange,
  }: {
    riasec: CareerDirection["idealRiasec"];
    onChange: (r: CareerDirection["idealRiasec"]) => void;
  }) => (
    <div className="grid grid-cols-6 gap-3">
      {RIASEC_KEYS.map((k) => (
        <div key={k} className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {RIASEC_LABELS[k]}
          </span>
          <div className={`w-full h-2 rounded-full bg-muted overflow-hidden`}>
            <div
              className={`h-full ${RIASEC_COLORS[k]} rounded-full transition-all`}
              style={{ width: `${riasec[k]}%` }}
            />
          </div>
          <Input
            type="number"
            min={0}
            max={100}
            value={riasec[k]}
            onChange={(e) =>
              onChange({ ...riasec, [k]: parseInt(e.target.value, 10) || 0 })
            }
            className="h-7 w-16 text-center text-xs"
          />
        </div>
      ))}
    </div>
  );

  // ── Source badge ────────────────────────────────

  const SourceBadge = ({ source }: { source: string }) => {
    const colors: Record<string, string> = {
      curated: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      onet: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      emerging: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return (
      <Badge className={`text-[10px] ${colors[source] || ""}`}>{source}</Badge>
    );
  };

  // ── Render ─────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Library className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {t.title || "Career Library"}
            </h2>
            {stats && (
              <Badge variant="secondary" className="text-xs">
                {stats.total} {t.total || "total"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportClick}
              disabled={importing}
              title={t.importCsv || "Import CSV"}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              title={t.exportCsv || "Export CSV"}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: t.curated || "Curated",
                value: stats.curated,
                color: "text-blue-600",
              },
              { label: "O*NET", value: stats.onet, color: "text-emerald-600" },
              {
                label: t.emerging || "Emerging",
                value: stats.emerging,
                color: "text-purple-600",
              },
              {
                label: t.active || "Active",
                value: stats.active,
                color: "text-foreground",
              },
              {
                label: t.inactive || "Inactive",
                value: stats.inactive,
                color: "text-muted-foreground",
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t.searchPlaceholder || "Search by title or ID..."}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            {t.search || "Search"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t.allSources || "All sources"}</option>
            <option value="curated">{t.curated || "Curated"}</option>
            <option value="onet">O*NET</option>
            <option value="emerging">{t.emerging || "Emerging"}</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t.allStatus || "All status"}</option>
            <option value="true">{t.active || "Active"}</option>
            <option value="false">{t.inactive || "Inactive"}</option>
          </select>
        </div>
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.size} {t.selected || "selected"}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("deactivate")}
              disabled={batchLoading}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              {t.batchDeactivate || "Deactivate"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction("reactivate")}
              disabled={batchLoading}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              {t.batchReactivate || "Reactivate"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              {t.clearSelection || "Clear"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Import Preview Panel */}
      {importResult?.dryRun && (
        <Card className="border-amber-500/30 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {t.importPreview || "Import Preview"}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCancelImport}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t.importParsed || "Parsed rows"}:
                </span>{" "}
                <span className="font-medium">{importResult.totalParsed}</span>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div>
                  <span className="text-destructive">
                    {t.importErrors || "Errors"}:
                  </span>{" "}
                  <span className="font-medium text-destructive">
                    {importResult.errors.length}
                  </span>
                </div>
              )}
            </div>

            {/* Error details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-destructive/5 p-3 text-xs space-y-1">
                {importResult.errors.slice(0, 20).map((err, i) => (
                  <div key={i} className="text-destructive">
                    Row {err.row} · {err.field}: {err.message}
                  </div>
                ))}
                {importResult.errors.length > 20 && (
                  <div className="text-muted-foreground">
                    ...and {importResult.errors.length - 20} more
                  </div>
                )}
              </div>
            )}

            {/* Preview rows */}
            {importResult.preview && importResult.preview.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground">
                  {t.importSample || "Sample rows"}:
                </span>
                {importResult.preview.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <code className="text-[10px] font-mono">{r.id}</code>
                    <span>{r.titleEn}</span>
                    <Badge className="text-[9px]">{r.source}</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleCancelImport}>
                {t.cancel || "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmImport}
                disabled={importing || (importResult.totalParsed ?? 0) === 0}
              >
                {importing && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {t.importConfirm || "Confirm Import"} (
                {importResult.totalParsed} {t.importRows || "rows"})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result (after confirm) */}
      {importResult &&
        !importResult.dryRun &&
        importResult.imported !== undefined && (
          <Card className="border-emerald-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{t.importComplete || "Import complete"}:</span>
                <span className="font-medium">
                  {importResult.imported} {t.importUpserted || "upserted"}
                </span>
                {(importResult.skipped ?? 0) > 0 && (
                  <span className="text-muted-foreground">
                    · {importResult.skipped} {t.importSkipped || "skipped"}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportResult(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Edit Panel */}
      {editingId && editData && (
        <Card className="border-primary/30 shadow-md">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {t.editing || "Editing"}: {editData.id}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.titleEn || "Title (EN)"}
                </label>
                <Input
                  value={editData.titleEn}
                  onChange={(e) =>
                    setEditData({ ...editData, titleEn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.titleZh || "Title (ZH)"}
                </label>
                <Input
                  value={editData.titleZh}
                  onChange={(e) =>
                    setEditData({ ...editData, titleZh: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t.subtitle || "Subtitle (ZH)"}
              </label>
              <Input
                value={editData.subtitleZh || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    subtitleZh: e.target.value || null,
                  })
                }
              />
            </div>

            {/* RIASEC Editor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.riasec || "RIASEC Profile"}
              </label>
              <RiasecEditor
                riasec={editData.idealRiasec}
                onChange={(r) => setEditData({ ...editData, idealRiasec: r })}
              />
            </div>

            {/* Values + Industries + Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.values || "Aligned Values"}
                </label>
                <Input
                  value={editData.alignedValues.join(", ")}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      alignedValues: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={t.valuesPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.industries || "Industries"}
                </label>
                <Input
                  value={editData.industries.join(", ")}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      industries: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.tags || "Tags"}
                </label>
                <Input
                  value={editData.tags.join(", ")}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      tags: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>

            {/* Seniority + Cultural Fit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.seniorityRange || "Seniority (years)"}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={editData.seniorityMin}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        seniorityMin: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={editData.seniorityMax}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        seniorityMax: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-20 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.culturalFit || "Cross-Cultural Fit"}
                </label>
                <Input
                  value={editData.crossCulturalFit.join(", ")}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      crossCulturalFit: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={t.culturalFitPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t.confidence || "Confidence"}
                </label>
                <select
                  value={editData.annotationConfidence}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      annotationConfidence: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="expert-estimated">{t.expertEstimated}</option>
                  <option value="data-validated">{t.dataValidated}</option>
                  <option value="community-verified">
                    {t.communityVerified}
                  </option>
                </select>
              </div>
            </div>

            {/* AI Era Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t.aiEraCategory}</label>
                <select
                  value={editData.aiEraCategory || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      aiEraCategory: (e.target.value ||
                        null) as CareerDirection["aiEraCategory"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t.notSet}</option>
                  <option value="stable">{t.stable}</option>
                  <option value="augmented">{t.augmented}</option>
                  <option value="transformed">{t.transformed}</option>
                  <option value="ai-native">{t.aiNative}</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                {t.cancel || "Cancel"}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {t.save || "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Library className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t.empty || "No career directions found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 && selectedIds.size === rows.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[140px]">
                    ID
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    {t.titleCol || "Title"}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[80px]">
                    {t.source || "Source"}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[150px]">
                    {t.riasecHeader}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[100px] hidden md:table-cell">
                    {t.values || "Values"}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[90px] hidden md:table-cell">
                    {t.aiEraHeader}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[80px] hidden lg:table-cell">
                    {t.status || "Status"}
                  </TableHead>
                  <TableHead className="text-muted-foreground w-[90px] text-right">
                    {t.actions || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`border-border ${!row.isActive ? "opacity-50" : ""} ${editingId === row.id ? "bg-primary/5" : ""} ${selectedIds.has(row.id) ? "bg-primary/5" : ""}`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleToggleSelect(row.id)}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <code className="text-[11px] font-mono text-muted-foreground">
                        {row.id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-foreground">
                          {row.titleEn}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.titleZh}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={row.source} />
                    </TableCell>
                    <TableCell>
                      <RiasecBar riasec={row.idealRiasec} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {row.alignedValues.slice(0, 3).map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.aiEraCategory ? (
                        <Badge
                          className={`text-[10px] ${
                            row.aiEraCategory === "ai-native"
                              ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                              : row.aiEraCategory === "augmented"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : row.aiEraCategory === "transformed"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                          }`}
                        >
                          {row.aiEraCategory}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          {t.active || "Active"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          {t.inactive || "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(row)}
                          title={t.edit || "Edit"}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(row.id, row.isActive)
                          }
                          title={
                            row.isActive
                              ? t.deactivate || "Deactivate"
                              : t.reactivate || "Reactivate"
                          }
                          className="h-7 w-7 p-0"
                        >
                          {row.isActive ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t.showing || "Showing"} {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, total)} {t.of || "of"} {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
