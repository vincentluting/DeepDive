"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  CalendarDays,
  FileText,
  Zap,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Route,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { reportClientError } from "@/lib/observability/client-error";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { UserReportDetail } from "@/app/[locale]/(app)/admin/user-report-detail";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import {
  UserAvatar,
  CountryDisplay,
  CareerStageBadge,
  ResearchGroupBadge,
  formatAdminDate,
} from "@/components/admin/shared/badges";
import { AnswerPresetCard } from "./answer-preset-card";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  registrationCountry: string | null;
  registrationIp: string | null;
  careerStage: string | null;
  languages: string[];
  reportCount: number;
  lastReportAt: string | null;
  researchGroup: "classic" | "immersive" | null;
  researchParticipantId: string | null;
  researchConsentAt: string | null;
  cohort: string | null;
}

interface Stats {
  total: number;
  todayCount: number;
  weekCount: number;
  totalReports: number;
  totalQuickDives: number;
  byCareerStage: Record<string, number>;
  byCountry: Record<string, number>;
}

interface ApiResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  stats: Stats;
}

const ITEMS_PER_PAGE = 20;

const EMPTY_STATS: Stats = {
  total: 0,
  todayCount: 0,
  weekCount: 0,
  totalReports: 0,
  totalQuickDives: 0,
  byCareerStage: {},
  byCountry: {},
};

/**
 * User management panel: KPI row + searchable paginated user table +
 * expandable detail rows + delete flow + answer-preset dev tool.
 * Extracted from the legacy 1670-line admin-client.tsx.
 */
export function UsersPanel({ locale }: { locale: Locale }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const adminT = dict as Record<string, string>;
  const panelT = (dict.usersPanel || {}) as Record<string, string>;
  const label = (key: string, fallback: string): string =>
    adminT[key] || fallback;
  const pLabel = (key: string, fallback: string): string =>
    panelT[key] || fallback;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading users`);

      const data: ApiResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setStats(data.stats);
    } catch (err) {
      reportClientError(err, { component: "UsersPanel", feature: "admin" });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (user: AdminUser) => {
    setDeleting(true);
    try {
      const res = await csrfFetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setTotal((prev) => prev - 1);
        setExpandedUserId(null);
      }
    } catch (err) {
      reportClientError(err, { component: "UsersPanel", feature: "admin" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label={label("totalUsers", "Total Users")}
          value={stats.total}
          icon={Users}
          iconTone="primary"
          definition={label(
            "tooltipTotalUsers",
            "Total registered users on the platform",
          )}
          loading={loading}
        />
        <KpiCard
          label={label("newToday", "New Today")}
          value={stats.todayCount}
          icon={UserPlus}
          iconTone="green"
          definition={label(
            "tooltipNewToday",
            "Users who registered today (UTC)",
          )}
          loading={loading}
        />
        <KpiCard
          label={label("newThisWeek", "New This Week")}
          value={stats.weekCount}
          icon={CalendarDays}
          iconTone="blue"
          definition={label(
            "tooltipNewWeek",
            "Users who registered in the past 7 days",
          )}
          loading={loading}
        />
        <KpiCard
          label={label("totalReports", "Total Reports")}
          value={stats.totalReports}
          icon={FileText}
          iconTone="violet"
          definition={label(
            "tooltipTotalReports",
            "Total career reports generated",
          )}
          loading={loading}
        />
        <KpiCard
          label={label("quickDives", "Quick Dives")}
          value={stats.totalQuickDives}
          icon={Zap}
          iconTone="amber"
          definition={label(
            "tooltipQuickDives",
            "Total Quick Dive completions",
          )}
          loading={loading}
        />
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={label(
              "searchPlaceholder",
              "Search by email or name...",
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button
          aria-label={label("search", "Search")}
          onClick={handleSearch}
          variant="secondary"
          className="shrink-0"
          disabled={loading}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  {label("email", "Email")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">
                  {label("name", "Name")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">
                  {label("registered", "Registered")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">
                  {label("careerStage", "Career Stage")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">
                  {label("country", "Country")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">
                  {label("languages", "Languages")}
                </TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">
                  {label("reports", "Reports")}
                </TableHead>
                <TableHead className="text-muted-foreground">
                  {label("role", "Role")}
                </TableHead>
                <TableHead className="text-muted-foreground w-10 hidden sm:table-cell" />
                <TableHead className="text-muted-foreground w-10 hidden sm:table-cell" />
                <TableHead className="text-muted-foreground w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell colSpan={11}>
                      <div className="h-10 bg-muted/30 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {label("noUsers", "No users found")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <React.Fragment key={u.id}>
                    <TableRow
                      className="border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() =>
                        setExpandedUserId(expandedUserId === u.id ? null : u.id)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} email={u.email} />
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {u.email}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden truncate">
                              {u.name || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-foreground">
                        {u.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {formatAdminDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <CareerStageBadge
                          stage={u.careerStage}
                          locale={locale}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <CountryDisplay code={u.registrationCountry} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {u.languages.length > 0 ? (
                          <div className="flex gap-1">
                            {u.languages.map((lang) => (
                              <Badge
                                key={lang}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {lang.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <span className="font-medium text-foreground">
                          {u.reportCount}
                        </span>
                        {u.lastReportAt && (
                          <span className="text-xs text-muted-foreground ml-1">
                            · {formatAdminDate(u.lastReportAt)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.isAdmin ? (
                            <Badge
                              variant="default"
                              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20"
                            >
                              {label("admin", "Admin")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-muted-foreground"
                            >
                              {label("user", "User")}
                            </Badge>
                          )}
                          <ResearchGroupBadge
                            group={u.researchGroup}
                            participantId={u.researchParticipantId}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="w-10 hidden sm:table-cell">
                        <a
                          href={`/${locale}/profile/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-10 w-10 items-center justify-center rounded text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary"
                          title={label("viewProfile", "Profile")}
                        >
                          <UserIcon className="w-4 h-4" />
                        </a>
                      </TableCell>
                      <TableCell className="w-10 hidden sm:table-cell">
                        <a
                          href={`/${locale}/admin/user-journey/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-10 w-10 items-center justify-center rounded text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary"
                          title={label("viewJourney", "Journey")}
                        >
                          <Route className="w-4 h-4" />
                        </a>
                      </TableCell>
                      <TableCell className="w-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedUserId(
                              expandedUserId === u.id ? null : u.id,
                            );
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded hover:bg-muted"
                        >
                          {expandedUserId === u.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === u.id && (
                      <TableRow className="border-border bg-muted/30">
                        <TableCell colSpan={11} className="p-4">
                          <div className="space-y-2">
                            {u.registrationIp && (
                              <p className="text-xs text-muted-foreground">
                                IP:{" "}
                                <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                                  {u.registrationIp}
                                </code>
                              </p>
                            )}
                            <UserReportDetail userId={u.id} locale={locale} />
                            {!u.isAdmin && (
                              <div className="pt-3 border-t border-border">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(u);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                  {pLabel(
                                    "deleteUserButton",
                                    "Delete user & all data",
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-border"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {label("previous", "Previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {label("pageOf", "Page {page} of {total}")
              .replace("{page}", String(page))
              .replace("{total}", String(totalPages))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="border-border"
          >
            {label("next", "Next")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Dev tool: answer preset */}
      <AnswerPresetCard locale={locale} />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pLabel("deleteConfirmTitle", "Confirm User Deletion")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {pLabel(
                    "deleteConfirmDesc",
                    "This action cannot be undone. The following user and all associated data will be permanently deleted:",
                  )}
                </p>
                {deleteTarget && (
                  <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">
                        {label("email", "Email")}:
                      </span>{" "}
                      <strong>{deleteTarget.email}</strong>
                    </p>
                    {deleteTarget.name && (
                      <p>
                        <span className="text-muted-foreground">
                          {label("name", "Name")}:
                        </span>{" "}
                        {deleteTarget.name}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">
                        {label("reports", "Reports")}:
                      </span>{" "}
                      {deleteTarget.reportCount}
                    </p>
                  </div>
                )}
                <p className="text-destructive text-xs">
                  {pLabel(
                    "deleteIncludes",
                    "Includes: Profile, reports, assessments, coaching sessions, questionnaire data, and all other records",
                  )}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {pLabel("cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteUser(deleteTarget)}
            >
              {deleting
                ? pLabel("deleting", "Deleting...")
                : pLabel("deleteConfirm", "Delete permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
