"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { ExternalLink, Pencil, Check, X, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface QDResult {
  id: string;
  anonymousId: string | null;
  userId: string | null;
  archetypeCode: string;
  archetypeLabel: string;
  language: string;
  exploreMode: string;
  adminNote: string | null;
  environment: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  converted: boolean;
  convertedEmail: string | null;
  convertedName: string | null;
  convertedAt: string | null;
}

interface Stats {
  total: number;
  anonymous: number;
  registered: number;
  unique_anonymous: number;
}

export function AnonymousQDTab({
  locale = "en" as Locale,
}: {
  locale?: Locale;
}) {
  const qt = (getDictionaryClient(locale).admin?.qdTab || {}) as Record<
    string,
    string
  >;
  const [results, setResults] = useState<QDResult[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    anonymous: 0,
    registered: 0,
    unique_anonymous: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "anonymous" | "registered">(
    "all",
  );
  const [envFilter, setEnvFilter] = useState<
    "all" | "production" | "development"
  >("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await csrfFetch("/api/admin/anonymous-qd");
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.results ?? []);
      setStats(
        data.stats ?? {
          total: 0,
          anonymous: 0,
          registered: 0,
          unique_anonymous: 0,
        },
      );
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEdit = (r: QDResult) => {
    setEditingId(r.id);
    setEditValue(r.adminNote ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveNote = async (id: string) => {
    setSaving(true);
    try {
      const res = await csrfFetch("/api/admin/anonymous-qd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          adminNote: editValue.trim() || null,
        }),
      });
      if (res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, adminNote: editValue.trim() || null } : r,
          ),
        );
        setEditingId(null);
        setEditValue("");
      }
    } catch {
      /* non-critical */
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QDResult | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const r = deleteTarget;
    setDeleteTarget(null);
    setDeleting(r.id);
    try {
      const res = await csrfFetch("/api/admin/anonymous-qd", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id }),
      });
      if (res.ok) {
        setResults((prev) => prev.filter((x) => x.id !== r.id));
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          anonymous: r.userId ? prev.anonymous : prev.anonymous - 1,
          registered: r.userId ? prev.registered - 1 : prev.registered,
        }));
      }
    } finally {
      setDeleting(null);
    }
  };

  const filtered = results.filter((r) => {
    if (filter === "anonymous" && r.userId) return false;
    if (filter === "registered" && !r.userId) return false;
    if (envFilter === "production" && r.environment === "development")
      return false;
    if (envFilter === "development" && r.environment !== "development")
      return false;
    return true;
  });

  const devCount = results.filter(
    (r) => r.environment === "development",
  ).length;
  const prodCount = results.length - devCount;

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted/30 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {qt.totalCompletions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {stats.anonymous}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{qt.anonymous}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {stats.registered}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {qt.registered}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.unique_anonymous}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {qt.uniqueAnonymous}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "anonymous", "registered"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? qt.allFilter?.replace("{count}", String(stats.total))
              : f === "anonymous"
                ? qt.anonymousFilter?.replace(
                    "{count}",
                    String(stats.anonymous),
                  )
                : qt.registeredFilter?.replace(
                    "{count}",
                    String(stats.registered),
                  )}
          </Button>
        ))}
        <div className="border-l border-border pl-2 ml-1 flex gap-2">
          {(["all", "production", "development"] as const).map((f) => (
            <Button
              key={f}
              variant={envFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setEnvFilter(f)}
              className={
                f === "development" && envFilter === f
                  ? "bg-amber-600 hover:bg-amber-700"
                  : ""
              }
            >
              {f === "all"
                ? qt.allEnv
                : f === "production"
                  ? qt.prodFilter?.replace("{count}", String(prodCount))
                  : qt.devFilter?.replace("{count}", String(devCount))}
            </Button>
          ))}
        </div>
      </div>

      {/* Results table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">{qt.time}</TableHead>
                <TableHead>{qt.archetype}</TableHead>
                <TableHead>{qt.mode}</TableHead>
                <TableHead>{qt.lang}</TableHead>
                <TableHead>{qt.userStatus}</TableHead>
                <TableHead>{qt.note}</TableHead>
                <TableHead className="w-[60px]">{qt.report}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    {qt.noResults}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {r.archetypeCode}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        {r.archetypeLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {r.exploreMode}
                        </Badge>
                        {r.environment === "development" && (
                          <Badge className="text-[9px] bg-amber-500/20 text-amber-600 border-amber-500/30">
                            Dev
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{r.language}</TableCell>
                    <TableCell>
                      {r.userId ? (
                        <div>
                          <Badge className="bg-primary/15 text-primary text-[10px]">
                            Registered
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                            {r.userName || r.userEmail}
                          </p>
                        </div>
                      ) : r.converted ? (
                        <div>
                          <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">
                            Converted
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                            {r.convertedName || r.convertedEmail}
                          </p>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          {qt.anonymous}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={qt.addNotePlaceholder}
                            className="h-7 text-xs w-[140px]"
                            maxLength={500}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveNote(r.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => saveNote(r.id)}
                            disabled={saving}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={cancelEdit}
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1 group cursor-pointer min-w-[80px]"
                          onClick={() => startEdit(r)}
                        >
                          {r.adminNote ? (
                            <span className="text-xs text-foreground truncate max-w-[140px]">
                              {r.adminNote}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              {qt.addNoteHint}
                            </span>
                          )}
                          <Pencil className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${locale}/report/quick/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          disabled={deleting === r.id}
                          className="text-red-500/50 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{qt.deleteQdResult}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? qt.deleteConfirm?.replace(
                    "{name}",
                    `${deleteTarget.archetypeCode} · ${deleteTarget.archetypeLabel}`,
                  )
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {qt.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {qt.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
