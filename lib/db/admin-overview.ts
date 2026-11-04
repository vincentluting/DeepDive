// ============================================================
// Admin Overview — aggregated cockpit data for /admin.
//
// One Promise.allSettled round-trip composing existing query modules.
// Partial-failure tolerant: a failed segment returns null and the UI
// renders an error card for that segment without sinking the page.
// Metric definitions: docs/architecture/admin-metrics.md.
// ============================================================

import { sql } from "./connection";
import { getAdminOverview } from "./admin-insights";
import { getConversionRates } from "@/lib/analytics/funnel-queries";
import { getDurableJobHealth } from "./durable-jobs";
import { getLLMUsageByModel } from "./llm-usage";
import { countOpenReports } from "./companions";
import { getResearchChainRows } from "./research-data-quality";
import {
  computeResearchSummary,
  validateResearchChain,
} from "@/lib/research/thesis-validation";
import { RESEARCH_TARGET_N } from "@/lib/research/config";

export interface OverviewKpis {
  totalUsers: number;
  newUsers7d: number;
  /** Distinct stitched identities with ≥1 funnel event in the window. */
  active7d: number;
  /** report_viewed / quickdive_started over the last 30d (percent). */
  qdToReportRate30d: number | null;
  llmCost7dUsd: number;
  llmCalls7d: number;
}

export interface OverviewResearch {
  consented: number;
  target: number;
  t0: number;
  t1: number;
  t2: number;
  fullChain: number;
  classic: number;
  immersive: number;
  missingT2Due: number;
}

export interface OverviewAlerts {
  durableJobsFailed24h: number;
  durableJobsPending: number;
  llmDegradedRate7dPct: number | null;
  openModerationReports: number;
  thesisDataErrors: number;
}

export interface RegistrationTrendPoint {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AdminOverviewData {
  kpis: OverviewKpis | null;
  research: OverviewResearch | null;
  alerts: OverviewAlerts | null;
  registrationTrend: RegistrationTrendPoint[] | null;
  recentUsers: RecentUser[] | null;
}

async function getActiveIdentities7d(): Promise<number> {
  // Same identity-stitching + admin double-gate as funnel-queries.ts
  const rows = await sql`
    SELECT COUNT(DISTINCT COALESCE(uf."userId", il."userId", uf."clientId"))::int AS "active"
    FROM "UserFunnel" uf
    LEFT JOIN LATERAL (
      SELECT l."userId"
      FROM "IdentityLink" l
      WHERE l."anonymousId" = uf."clientId"
      ORDER BY l."linkedAt" ASC
      LIMIT 1
    ) il ON uf."userId" IS NULL AND uf."clientId" IS NOT NULL
    WHERE uf."createdAt" >= NOW() - INTERVAL '7 days'
      AND (uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "User" au
        WHERE au."id" = COALESCE(uf."userId", il."userId")
          AND au."isAdmin" = TRUE
      )
  `;
  return Number(rows[0]?.active ?? 0);
}

async function getLLMDegradedRate7d(): Promise<number | null> {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS "total",
      COUNT(*) FILTER (WHERE "degraded" = TRUE)::int AS "degraded"
    FROM "LLMUsageLog"
    WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      AND "success" = TRUE
      AND "environment" = 'production'
  `;
  const total = Number(rows[0]?.total ?? 0);
  if (total === 0) return null;
  return Math.round((Number(rows[0]?.degraded ?? 0) / total) * 1000) / 10;
}

async function getRegistrationTrend30d(): Promise<RegistrationTrendPoint[]> {
  const rows = await sql`
    SELECT
      TO_CHAR(("createdAt" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS "date",
      COUNT(*)::int AS "count"
    FROM "User"
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY ("createdAt" AT TIME ZONE 'UTC')::date
    ORDER BY ("createdAt" AT TIME ZONE 'UTC')::date ASC
  `;
  return rows.map((r) => ({
    date: r.date as string,
    count: Number(r.count ?? 0),
  }));
}

async function getRecentUsers(limit: number): Promise<RecentUser[]> {
  const rows = await sql`
    SELECT "id", "email", "name", "createdAt"
    FROM "User"
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    name: (r.name as string) || null,
    createdAt: String(r.createdAt),
  }));
}

async function getKpis(): Promise<OverviewKpis> {
  const [overview, active7d, rates30d, llmModels7d] = await Promise.all([
    getAdminOverview(7),
    getActiveIdentities7d(),
    getConversionRates(30),
    getLLMUsageByModel(7, "production"),
  ]);

  const qdToReportRate30d =
    rates30d.quickdive_started > 0
      ? Math.round((rates30d.report_viewed / rates30d.quickdive_started) * 100)
      : null;

  return {
    totalUsers: overview.totalUsers,
    newUsers7d: overview.newUsersInPeriod,
    active7d,
    qdToReportRate30d,
    llmCost7dUsd:
      Math.round(
        llmModels7d.reduce((s, m) => s + m.estimatedCostUsd, 0) * 100,
      ) / 100,
    llmCalls7d: llmModels7d.reduce((s, m) => s + m.totalCalls, 0),
  };
}

async function getResearchOverview(): Promise<{
  research: OverviewResearch;
  thesisDataErrors: number;
}> {
  const chainRows = await getResearchChainRows();
  const now = Date.now();
  // Recruitment-progress numbers use the canonical research population
  // (docs/architecture/admin-metrics.md §1.1): grouped + consented + non-admin
  // + active (non-withdrawn) consent. getResearchChainRows is deliberately
  // wider (partial enrollments) for the data-quality errors below, so the
  // cockpit must narrow it here — otherwise admin/test/withdrawn users inflate
  // recruitment progress (#087).
  const canonicalRows = chainRows.filter(
    (r) =>
      r.researchGroup !== null &&
      r.researchConsentAt !== null &&
      !r.isAdmin &&
      r.hasActiveConsentRecord,
  );
  const summary = computeResearchSummary(canonicalRows, now);
  // Data-quality errors run over the WIDER set on purpose — they exist to
  // surface partial enrollments the canonical filter would hide.
  const errors = chainRows
    .flatMap((row) => validateResearchChain(row, now))
    .filter((i) => i.severity === "error").length;

  return {
    research: {
      consented: summary.consentedUsers,
      target: RESEARCH_TARGET_N,
      t0: summary.t0Count,
      t1: summary.t1Count,
      t2: summary.t2Count,
      fullChain: summary.fullChain,
      classic: canonicalRows.filter((r) => r.researchGroup === "classic")
        .length,
      immersive: canonicalRows.filter((r) => r.researchGroup === "immersive")
        .length,
      missingT2Due: summary.missingT2Due,
    },
    thesisDataErrors: errors,
  };
}

/** Compose the full cockpit payload; each segment fails independently. */
export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const [kpis, researchSeg, jobs, degradedRate, openReports, trend, recent] =
    await Promise.allSettled([
      getKpis(),
      getResearchOverview(),
      getDurableJobHealth(),
      getLLMDegradedRate7d(),
      countOpenReports(),
      getRegistrationTrend30d(),
      getRecentUsers(5),
    ]);

  const researchValue =
    researchSeg.status === "fulfilled" ? researchSeg.value : null;

  // Alerts compose from three independent sources; show what we have.
  const alerts: OverviewAlerts | null =
    jobs.status === "fulfilled" ||
    degradedRate.status === "fulfilled" ||
    openReports.status === "fulfilled" ||
    researchValue
      ? {
          durableJobsFailed24h:
            jobs.status === "fulfilled" ? jobs.value.failedLast24h : 0,
          durableJobsPending:
            jobs.status === "fulfilled" ? jobs.value.pending : 0,
          llmDegradedRate7dPct:
            degradedRate.status === "fulfilled" ? degradedRate.value : null,
          openModerationReports:
            openReports.status === "fulfilled" ? openReports.value : 0,
          thesisDataErrors: researchValue?.thesisDataErrors ?? 0,
        }
      : null;

  return {
    kpis: kpis.status === "fulfilled" ? kpis.value : null,
    research: researchValue?.research ?? null,
    alerts,
    registrationTrend: trend.status === "fulfilled" ? trend.value : null,
    recentUsers: recent.status === "fulfilled" ? recent.value : null,
  };
}
