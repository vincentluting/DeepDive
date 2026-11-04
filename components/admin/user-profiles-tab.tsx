"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { countryCodeToFlag } from "@/lib/utils/country-flags";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

// ── Value label maps (bilingual, accessed via locale key) ──
const SCHWARTZ_LABELS: Record<string, Record<string, string>> = {
  achievement: { en: "Achievement", zh: "成就" },
  power: { en: "Power", zh: "权力" },
  stimulation: { en: "Stimulation", zh: "刺激" },
  "self-direction": { en: "Self-Direction", zh: "自主" },
  hedonism: { en: "Hedonism", zh: "享乐" },
  benevolence: { en: "Benevolence", zh: "仁爱" },
  universalism: { en: "Universalism", zh: "普世" },
  conformity: { en: "Conformity", zh: "遵从" },
  tradition: { en: "Tradition", zh: "传统" },
  security: { en: "Security", zh: "安全" },
};

const COLLAB_LABELS: Record<string, Record<string, string>> = {
  D: { en: "Leading", zh: "引领型" },
  I: { en: "Inspiring", zh: "激发型" },
  S: { en: "Anchoring", zh: "稳健型" },
  C: { en: "Refining", zh: "精研型" },
};

const BIG_FIVE_SHORT: Record<string, string> = {
  openness: "O",
  conscientiousness: "C",
  extraversion: "E",
  agreeableness: "A",
  neuroticism: "N",
};

const RIASEC_NAMES: Record<string, Record<string, string>> = {
  R: { en: "Realistic", zh: "现实型" },
  I: { en: "Investigative", zh: "研究型" },
  A: { en: "Artistic", zh: "艺术型" },
  S: { en: "Social", zh: "社会型" },
  E: { en: "Enterprising", zh: "企业型" },
  C: { en: "Conventional", zh: "常规型" },
};

interface UserProfileRow {
  id: string;
  email: string;
  name: string | null;
  careerStage: string | null;
  country: string | null;
  createdAt: string;
  profileCreatedAt: string | null;
  hasProfile: boolean;
  hasQuickDive: boolean;
  riasecCode: string | null;
  riasecScores: Record<string, number> | null;
  cognitiveStyleCode: string | null;
  top3Values: string[] | null;
  archetype: {
    code: string | null;
    label_en: string | null;
    label_zh: string | null;
  } | null;
  collabStyle: { primary: string | null; secondary: string | null } | null;
  bigFiveScores: Record<string, number> | null;
  quickDiveArchetype: string | null;
}

interface Aggregates {
  totalUsers: number;
  profileCount: number;
  quickDiveCount: number;
  riasecAvg: Record<string, number>;
  riasecSampleSize: number;
  bigFiveAvg: Record<string, number>;
  bigFiveSampleSize: number;
  valueFrequency: Record<string, number>;
  cognitiveTypes: Record<string, number>;
  archetypeCodes: Record<string, number>;
  collabTypes: Record<string, number>;
  sjtConsistencyAvg: number | null;
  sjtConsistencySampleSize: number;
}

interface ApiResponse {
  users: UserProfileRow[];
  total: number;
  page: number;
  limit: number;
  aggregates: Aggregates;
}

const ITEMS_PER_PAGE = 50;

export function UserProfilesTab({ locale }: { locale: string }) {
  const loc = locale as Locale;
  const t = getDictionaryClient(loc).admin as Record<string, unknown>;
  const up = t.userProfiles as Record<string, string>;
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set("search", search);
      const res = await csrfFetch(`/api/admin/user-profiles?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0;
  const withProfile = data?.users.filter((u) => u.hasProfile).length || 0;
  const withQuickDive = data?.users.filter((u) => u.hasQuickDive).length || 0;

  return (
    <div className="space-y-4">
      {/* Search + Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={up.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        {data && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {data.total} {up.usersCount}
            </span>
            <span>·</span>
            <span>
              {withProfile} {up.withProfile}
            </span>
            <span>·</span>
            <span>
              {withQuickDive} {up.withQuickDive}
            </span>
          </div>
        )}
      </div>

      {/* ── Aggregate Dashboard ── */}
      {!loading && data?.aggregates && data.aggregates.profileCount > 0 && (
        <AggregateDashboard agg={data.aggregates} locale={loc} up={up} />
      )}

      {loading ? (
        <div className="animate-pulse h-96 bg-muted/30 rounded-lg" />
      ) : !data || data.users.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center text-muted-foreground">
            {up.noUsersFound}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{up.colUser}</TableHead>
                    <TableHead className="text-center">{up.colStage}</TableHead>
                    <TableHead className="text-center">RIASEC</TableHead>
                    <TableHead className="text-center">
                      {up.colCognitive}
                    </TableHead>
                    <TableHead>{up.colTop3Values}</TableHead>
                    <TableHead className="text-center">
                      {up.colArchetype}
                    </TableHead>
                    <TableHead className="text-center">
                      {up.colCollab}
                    </TableHead>
                    <TableHead className="text-center">{up.colData}</TableHead>
                    <TableHead className="text-center">
                      {up.colActions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <React.Fragment key={user.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() =>
                          setExpandedId(expandedId === user.id ? null : user.id)
                        }
                      >
                        {/* User */}
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            {user.country && (
                              <span className="text-sm shrink-0">
                                {countryCodeToFlag(user.country)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate max-w-[160px]">
                                {user.name || user.email.split("@")[0]}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Career Stage */}
                        <TableCell className="text-center">
                          {user.careerStage ? (
                            <Badge variant="secondary" className="text-xs">
                              {user.careerStage}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* RIASEC */}
                        <TableCell className="text-center">
                          {user.riasecCode ? (
                            <span className="font-mono font-bold text-sm tracking-wider text-primary">
                              {user.riasecCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Cognitive Style */}
                        <TableCell className="text-center">
                          {user.cognitiveStyleCode ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {user.cognitiveStyleCode}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Top 3 Values */}
                        <TableCell>
                          {user.top3Values ? (
                            <div className="flex flex-wrap gap-1">
                              {user.top3Values.map((v) => (
                                <Badge
                                  key={v}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {SCHWARTZ_LABELS[v]?.[loc] || v}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Archetype */}
                        <TableCell className="text-center">
                          {user.archetype ? (
                            <span
                              className="text-xs"
                              title={user.archetype.code || ""}
                            >
                              {loc === "zh"
                                ? user.archetype.label_zh
                                : user.archetype.label_en}
                            </span>
                          ) : user.quickDiveArchetype ? (
                            <span
                              className="text-xs text-muted-foreground"
                              title={up.quickDiveOnly}
                            >
                              {user.quickDiveArchetype}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Collab Style */}
                        <TableCell className="text-center">
                          {user.collabStyle?.primary ? (
                            <span className="text-xs">
                              {COLLAB_LABELS[user.collabStyle.primary]?.[loc]}
                              {user.collabStyle.secondary && (
                                <span className="text-muted-foreground">
                                  /
                                  {
                                    COLLAB_LABELS[user.collabStyle.secondary]?.[
                                      loc
                                    ]
                                  }
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Data completeness */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {user.hasQuickDive && (
                              <span
                                className="w-2 h-2 rounded-full bg-blue-400"
                                title={up.quickDiveData}
                              />
                            )}
                            {user.hasProfile && (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-400"
                                title={up.deepDiveProfile}
                              />
                            )}
                            {!user.hasQuickDive && !user.hasProfile && (
                              <span
                                className="w-2 h-2 rounded-full bg-muted-foreground/30"
                                title={up.noData}
                              />
                            )}
                          </div>
                        </TableCell>

                        {/* Admin shortcuts — Profile + Journey jump links.
                            stopPropagation prevents the row-expand handler
                            from firing when an admin clicks a link. */}
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2 justify-center">
                            <Link
                              href={`/${locale}/profile/${user.id}`}
                              className="text-xs underline text-primary hover:text-primary/80"
                            >
                              {up.actionViewProfile}
                            </Link>
                            <Link
                              href={`/${locale}/admin/user-journey/${user.id}`}
                              className="text-xs underline text-primary hover:text-primary/80"
                            >
                              {up.actionViewJourney}
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail row */}
                      {expandedId === user.id && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/20 p-4">
                            <ExpandedDetail user={user} locale={loc} up={up} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {interpolate(up.pageInfo, { page, total: totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Aggregate Dashboard ──

const RIASEC_COLORS: Record<string, string> = {
  R: "bg-red-500/70",
  I: "bg-blue-500/70",
  A: "bg-purple-500/70",
  S: "bg-yellow-500/70",
  E: "bg-orange-500/70",
  C: "bg-green-500/70",
};

function AggregateDashboard({
  agg,
  locale,
  up,
}: {
  agg: Aggregates;
  locale: Locale;
  up: Record<string, string>;
}) {
  const completionRate =
    agg.totalUsers > 0
      ? Math.round((agg.profileCount / agg.totalUsers) * 100)
      : 0;

  // Sort values by frequency
  const sortedValues = Object.entries(agg.valueFrequency).sort(
    ([, a], [, b]) => b - a,
  );
  const maxValueFreq = sortedValues[0]?.[1] || 1;

  // Sort cognitive types by count
  const sortedCognitive = Object.entries(agg.cognitiveTypes).sort(
    ([, a], [, b]) => b - a,
  );

  // Sort archetypes by count
  const sortedArchetypes = Object.entries(agg.archetypeCodes).sort(
    ([, a], [, b]) => b - a,
  );

  // Sort collab by count
  const sortedCollab = Object.entries(agg.collabTypes).sort(
    ([, a], [, b]) => b - a,
  );
  const totalCollab = sortedCollab.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="space-y-4">
      {/* Row 1: Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label={up.totalUsers} value={agg.totalUsers} />
        <StatCard
          label={up.profiles}
          value={agg.profileCount}
          sub={`${completionRate}%`}
        />
        <StatCard label="Quick Dive" value={agg.quickDiveCount} />
        <StatCard
          label={up.sjtConsistency}
          value={
            agg.sjtConsistencyAvg != null
              ? agg.sjtConsistencyAvg.toFixed(2)
              : "—"
          }
          sub={
            agg.sjtConsistencySampleSize > 0
              ? `n=${agg.sjtConsistencySampleSize}`
              : undefined
          }
        />
        <StatCard
          label={up.cognitiveTypes}
          value={Object.keys(agg.cognitiveTypes).length}
          sub={
            sortedCognitive[0]
              ? `${up.top}: ${sortedCognitive[0][0]}`
              : undefined
          }
        />
      </div>

      {/* Row 2: Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RIASEC Average */}
        {Object.keys(agg.riasecAvg).length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                RIASEC {up.average}{" "}
                <span className="text-muted-foreground/60">
                  n={agg.riasecSampleSize}
                </span>
              </div>
              <div className="space-y-1.5">
                {["R", "I", "A", "S", "E", "C"].map((dim) => {
                  const val = agg.riasecAvg[dim] || 0;
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="font-mono w-4 text-center font-bold text-xs">
                        {dim}
                      </span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${RIASEC_COLORS[dim]}`}
                          style={{ width: `${Math.min(100, val)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-muted-foreground/60">
                {up.groupLeans}
                <span className="font-medium text-foreground">
                  {["R", "I", "A", "S", "E", "C"]
                    .sort(
                      (a, b) =>
                        (agg.riasecAvg[b] || 0) - (agg.riasecAvg[a] || 0),
                    )
                    .slice(0, 2)
                    .map((d) => RIASEC_NAMES[d][locale])
                    .join(" + ")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Big Five Average */}
        {Object.keys(agg.bigFiveAvg).length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                Big Five {up.average}{" "}
                <span className="text-muted-foreground/60">
                  n={agg.bigFiveSampleSize}
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  "openness",
                  "conscientiousness",
                  "extraversion",
                  "agreeableness",
                  "neuroticism",
                ].map((dim) => {
                  const val = agg.bigFiveAvg[dim] || 0;
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="font-mono w-4 text-center font-bold text-xs">
                        {BIG_FIVE_SHORT[dim]}
                      </span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${Math.min(100, val)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Landscape */}
        {sortedValues.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground mb-3">
                {up.valueLandscape}
              </div>
              <div className="space-y-1">
                {sortedValues.map(([val, count]) => (
                  <div key={val} className="flex items-center gap-2">
                    <span className="text-xs w-16 truncate text-right">
                      {SCHWARTZ_LABELS[val]?.[locale] || val}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500/70"
                        style={{ width: `${(count / maxValueFreq) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-4 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Type Distributions */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-4">
            {/* Archetype distribution */}
            {sortedArchetypes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {up.archetypeDistribution}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortedArchetypes.map(([code, count]) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {code}{" "}
                      <span className="ml-1 text-muted-foreground">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cognitive Style distribution */}
            {sortedCognitive.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {up.cognitiveStyleDist}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortedCognitive.map(([code, count]) => (
                    <Badge
                      key={code}
                      variant="outline"
                      className="text-xs font-mono"
                    >
                      {code}{" "}
                      <span className="ml-1 text-muted-foreground">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Collab Style distribution */}
            {sortedCollab.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {up.collabStyleDist}
                </div>
                <div className="flex gap-1">
                  {sortedCollab.map(([style, count]) => {
                    const pct =
                      totalCollab > 0
                        ? Math.round((count / totalCollab) * 100)
                        : 0;
                    const label = COLLAB_LABELS[style]?.[locale];
                    return (
                      <div key={style} className="flex-1 text-center">
                        <div className="text-lg font-bold">{pct}%</div>
                        <div className="text-xs text-muted-foreground">
                          {label || style}
                        </div>
                        <div className="text-xs text-muted-foreground/60">
                          n={count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground/60">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ── Expanded detail panel ──

function ExpandedDetail({
  user,
  up,
}: {
  user: UserProfileRow;
  locale?: Locale;
  up: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      {/* RIASEC scores */}
      {user.riasecScores && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            RIASEC {up.scores}
          </div>
          <div className="space-y-1">
            {Object.entries(user.riasecScores)
              .sort(([, a], [, b]) => b - a)
              .map(([dim, rawScore]) => {
                // RIASEC scores are 0-1 normalized; scale to 0-100 for display
                const score = rawScore <= 1 ? rawScore * 100 : rawScore;
                return (
                  <div key={dim} className="flex items-center gap-2">
                    <span className="font-mono w-4 text-center font-bold text-xs">
                      {dim}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {score.toFixed(0)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Big Five scores */}
      {user.bigFiveScores && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Big Five {up.scores}
          </div>
          <div className="space-y-1">
            {Object.entries(user.bigFiveScores).map(([dim, score]) => (
              <div key={dim} className="flex items-center gap-2">
                <span className="font-mono w-4 text-center font-bold text-xs">
                  {BIG_FIVE_SHORT[dim] || dim[0]?.toUpperCase()}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/70 rounded-full"
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {typeof score === "number" ? score.toFixed(0) : score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {up.details}
        </div>
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">{up.registered}</span>
            {formatDate(user.createdAt)}
          </div>
          {user.profileCreatedAt && (
            <div>
              <span className="text-muted-foreground">{up.profileCreated}</span>
              {formatDate(user.profileCreatedAt)}
            </div>
          )}
          {user.archetype?.code && (
            <div>
              <span className="text-muted-foreground">{up.archetypeCode}</span>
              <span className="font-mono">{user.archetype.code}</span>
            </div>
          )}
          {user.cognitiveStyleCode && (
            <div>
              <span className="text-muted-foreground">{up.cognitiveLabel}</span>
              <span className="font-mono font-bold">
                {user.cognitiveStyleCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}-${day}`;
}
