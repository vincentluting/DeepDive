// ============================================================
// Action Hub — Data Access Layer
//
// Tables: ActionPlan, ActionItem, ActionMilestone
//
// All IDs are TEXT (nanoid). Import `sql` from connection.ts.
// ============================================================

import { sql } from "./connection";

// ── Types ──────────────────────────────────────────────────

export type ActionPlanStatus = "active" | "archived" | "superseded";
export type ActionCategory =
  | "explore"
  | "learn"
  | "network"
  | "create"
  | "apply"
  | "reflect";
export type ActionIntensity = "passive" | "active" | "social" | "creative";
export type ActionItemStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";
export type MilestoneStatus = "pending" | "reached" | "skipped";
export interface ActionPlanRow {
  id: string;
  userId: string;
  reportId: string;
  status: ActionPlanStatus;
  contextJson: Record<string, unknown>;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchedFlowDimensionJson {
  activity?: string;
  social?: string;
  environment?: string;
}

export interface ActionItemRow {
  id: string;
  planId: string;
  userId: string;
  title: string;
  description: string | null;
  category: ActionCategory;
  intensity: ActionIntensity;
  status: ActionItemStatus;
  priority: number;
  estimatedMinutes: number | null;
  sourceDimension: string | null;
  planPhase: number | null;
  recommendationReason: string | null;
  completionOutcome: string | null;
  dueDate: string | null;
  completedAt: Date | null;
  userNote: string | null;
  matchedNonNegotiable: string | null;
  matchedFlowDimension: MatchedFlowDimensionJson | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── ActionPlan CRUD ────────────────────────────────────────

export async function createActionPlan(params: {
  id: string;
  userId: string;
  reportId: string;
  contextJson: Record<string, unknown>;
  locale?: string;
}): Promise<void> {
  const locale = params.locale ?? "en";
  await sql`
    INSERT INTO "ActionPlan" ("id", "userId", "reportId", "contextJson", "locale")
    VALUES (${params.id}, ${params.userId}, ${params.reportId}, ${JSON.stringify(params.contextJson)}, ${locale})
  `;
}

export async function getActiveActionPlan(
  userId: string,
): Promise<ActionPlanRow | null> {
  const rows = await sql`
    SELECT * FROM "ActionPlan"
    WHERE "userId" = ${userId} AND "status" = 'active'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return (rows[0] as ActionPlanRow | undefined) ?? null;
}

export async function archiveActionPlan(planId: string): Promise<void> {
  await sql`
    UPDATE "ActionPlan" SET "status" = 'archived', "updatedAt" = NOW()
    WHERE "id" = ${planId}
  `;
}

/**
 * Hard-delete a plan and all its children (milestones + items).
 *
 * Used as a compensating action when plan generation fails partway through:
 * the neon HTTP driver has no interactive transaction across the
 * plan→items→milestones writes, so a mid-flight failure would otherwise leave
 * an orphaned empty/partial plan behind.
 *
 * The FKs DO declare ON DELETE CASCADE (schema.sql), so deleting the plan row
 * alone would normally cascade. We still delete children explicitly first as
 * defense-in-depth: this whole module exists because the live DB can drift
 * from schema.sql, so we don't assume the cascade is present — and child-first
 * order also satisfies the FK constraint if a cascade is ever missing.
 */
export async function deleteActionPlanCascade(planId: string): Promise<void> {
  await sql`DELETE FROM "ActionMilestone" WHERE "planId" = ${planId}`;
  await sql`DELETE FROM "ActionItem" WHERE "planId" = ${planId}`;
  await sql`DELETE FROM "ActionPlan" WHERE "id" = ${planId}`;
}

// ── ActionItem CRUD ────────────────────────────────────────

export async function createActionItem(params: {
  id: string;
  planId: string;
  userId: string;
  title: string;
  description?: string;
  category: ActionCategory;
  intensity?: ActionIntensity;
  priority?: number;
  estimatedMinutes?: number;
  sourceDimension?: string;
  planPhase?: number | null;
  recommendationReason?: string | null;
  completionOutcome?: string | null;
  dueDate?: string;
  matchedNonNegotiable?: string | null;
  matchedFlowDimension?: MatchedFlowDimensionJson | null;
}): Promise<void> {
  const matchedFlow = params.matchedFlowDimension
    ? JSON.stringify(params.matchedFlowDimension)
    : null;
  await sql`
    INSERT INTO "ActionItem" (
      "id", "planId", "userId", "title", "description",
      "category", "intensity", "priority", "estimatedMinutes",
      "sourceDimension", "planPhase", "recommendationReason",
      "completionOutcome", "dueDate",
      "matchedNonNegotiable", "matchedFlowDimension"
    ) VALUES (
      ${params.id}, ${params.planId}, ${params.userId}, ${params.title},
      ${params.description ?? null}, ${params.category},
      ${params.intensity ?? "passive"}, ${params.priority ?? 0},
      ${params.estimatedMinutes ?? null}, ${params.sourceDimension ?? null},
      ${params.planPhase ?? null},
      ${params.recommendationReason ?? null},
      ${params.completionOutcome ?? null},
      ${params.dueDate ?? null},
      ${params.matchedNonNegotiable ?? null},
      ${matchedFlow}
    )
  `;
}

export async function createCoachingActionForActivePlan(params: {
  userId: string;
  title: string;
  description: string;
  category: ActionCategory;
  intensity: ActionIntensity;
  estimatedMinutes: number;
  dueDate: string;
}): Promise<
  | { created: true; itemId: string; planId: string }
  | { created: false; reason: "no_active_plan" }
> {
  const plan = await getActiveActionPlan(params.userId);
  if (!plan) {
    return { created: false, reason: "no_active_plan" };
  }

  const itemId = crypto.randomUUID();
  await createActionItem({
    id: itemId,
    planId: plan.id,
    userId: params.userId,
    title: params.title,
    description: params.description,
    category: params.category,
    intensity: params.intensity,
    priority: 100,
    estimatedMinutes: params.estimatedMinutes,
    sourceDimension: "coaching_session",
    dueDate: params.dueDate,
  });

  return { created: true, itemId, planId: plan.id };
}

export async function getActionItemsByPlan(
  planId: string,
  status?: ActionItemStatus,
): Promise<ActionItemRow[]> {
  if (status) {
    return (await sql`
      SELECT * FROM "ActionItem"
      WHERE "planId" = ${planId} AND "status" = ${status}
      ORDER BY "priority" DESC, "createdAt" ASC
    `) as ActionItemRow[];
  }
  return (await sql`
    SELECT * FROM "ActionItem"
    WHERE "planId" = ${planId}
    ORDER BY "priority" DESC, "createdAt" ASC
  `) as ActionItemRow[];
}

export async function completeActionItem(
  itemId: string,
  note?: string,
  userId?: string,
): Promise<boolean> {
  const rows = userId
    ? await sql`
        UPDATE "ActionItem"
        SET "status" = 'completed', "completedAt" = NOW(), "userNote" = COALESCE(${note ?? null}, "userNote"), "updatedAt" = NOW()
        WHERE "id" = ${itemId} AND "userId" = ${userId}
        RETURNING "id"
      `
    : await sql`
        UPDATE "ActionItem"
        SET "status" = 'completed', "completedAt" = NOW(), "userNote" = COALESCE(${note ?? null}, "userNote"), "updatedAt" = NOW()
        WHERE "id" = ${itemId}
        RETURNING "id"
      `;
  return rows.length > 0;
}

export async function updateActionItemStatus(
  itemId: string,
  status: ActionItemStatus,
  userId?: string,
): Promise<boolean> {
  // When reverting from completed, clear completedAt
  const clearCompleted = status !== "completed";
  const rows = userId
    ? await sql`
        UPDATE "ActionItem"
        SET "status" = ${status},
            "completedAt" = ${clearCompleted ? null : sql`"completedAt"`},
            "updatedAt" = NOW()
        WHERE "id" = ${itemId} AND "userId" = ${userId}
        RETURNING "id"
      `
    : await sql`
        UPDATE "ActionItem"
        SET "status" = ${status},
            "completedAt" = ${clearCompleted ? null : sql`"completedAt"`},
            "updatedAt" = NOW()
        WHERE "id" = ${itemId}
        RETURNING "id"
      `;
  return rows.length > 0;
}

// ── ActionMilestone ────────────────────────────────────────

export async function createActionMilestone(params: {
  id: string;
  planId: string;
  title: string;
  description?: string;
  targetDay: number;
}): Promise<void> {
  await sql`
    INSERT INTO "ActionMilestone" ("id", "planId", "title", "description", "targetDay")
    VALUES (${params.id}, ${params.planId}, ${params.title}, ${params.description ?? null}, ${params.targetDay})
  `;
}

export async function getMilestonesByPlan(planId: string): Promise<unknown[]> {
  return await sql`
    SELECT * FROM "ActionMilestone"
    WHERE "planId" = ${planId}
    ORDER BY "targetDay" ASC
  `;
}

export async function reachMilestone(milestoneId: string): Promise<void> {
  await sql`
    UPDATE "ActionMilestone" SET "status" = 'reached', "reachedAt" = NOW()
    WHERE "id" = ${milestoneId}
  `;
}

// ── Milestone Auto-Detection ─────────────────────────────

/**
 * Check whether any pending milestones should be auto-reached
 * after an action item is completed.
 *
 * Uses cumulative completion thresholds aligned with
 * milestone-builder.ts phase allocations (3 / 4 / 3):
 *   Phase 1 (Day 7):  ≥ 3 completed
 *   Phase 2 (Day 30): ≥ 7 completed
 *   Phase 3 (Day 90): ≥ 10 completed
 *
 * Returns IDs of milestones that were reached.
 */
const MILESTONE_THRESHOLDS: Record<number, number> = { 7: 3, 30: 7, 90: 10 };

export async function checkAndReachMilestones(
  itemId: string,
): Promise<string[]> {
  // 1. Get planId from the completed item
  const itemRows = await sql`
    SELECT "planId" FROM "ActionItem" WHERE "id" = ${itemId} LIMIT 1
  `;
  const planId = (itemRows[0] as { planId?: string } | undefined)?.planId;
  if (!planId) return [];

  // 2. Count completed items for this plan
  const countRows = await sql`
    SELECT COUNT(*) as count FROM "ActionItem"
    WHERE "planId" = ${planId} AND "status" = 'completed'
  `;
  const completedCount = Number(
    (countRows[0] as { count?: string | number })?.count ?? 0,
  );

  // 3. Get pending milestones
  const pendingMilestones = await sql`
    SELECT "id", "targetDay" FROM "ActionMilestone"
    WHERE "planId" = ${planId} AND "status" = 'pending'
    ORDER BY "targetDay" ASC
  `;

  // 4. Reach milestones whose threshold is met
  const reached: string[] = [];
  for (const ms of pendingMilestones) {
    const row = ms as { id: string; targetDay: number };
    const threshold = MILESTONE_THRESHOLDS[row.targetDay] ?? Infinity;
    if (completedCount >= threshold) {
      await reachMilestone(row.id);
      reached.push(row.id);
    }
  }

  return reached;
}

// ── Query helpers ──────────────────────────────────────────

export async function getReachedMilestones(
  userId: string,
  limit = 20,
): Promise<unknown[]> {
  return await sql`
    SELECT m."id", m."planId", m."title", m."targetDay", m."status", m."reachedAt"
    FROM "ActionMilestone" m
    JOIN "ActionPlan" p ON m."planId" = p."id"
    WHERE p."userId" = ${userId} AND m."status" = 'reached'
    ORDER BY m."reachedAt" DESC
    LIMIT ${limit}
  `;
}
