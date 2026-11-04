/**
 * AI Coach V2 rollout and acceptance metrics.
 *
 * Usage:
 *   npm run coaching:v2:metrics
 *   npm run coaching:v2:metrics -- --days=30 --json
 *   npm run coaching:v2:metrics -- --export-review=coaching-review.jsonl
 */

import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

import { sql } from "@/lib/db/connection";

interface CountRow {
  variant: string;
  count: number;
}

interface FeedbackRow {
  variant: string;
  feedbackCount: number;
  missedPointCount: number;
  unclearCount: number;
  notPracticalCount: number;
  helpfulNextStepCount: number;
  naturalConversationCount: number;
}

interface AuditSummaryRow {
  auditCount: number;
  sessionCount: number;
  averageConfidence: number | string | null;
  lowConfidenceCount: number;
  repairCount: number;
}

interface RecoveryRow {
  evaluableRepairs: number;
  successfulRepairs: number;
}

interface ContributionRow {
  mode: string;
  eligibleTurns: number;
  contributedWithinTwoTurns: number;
}

interface ActionRow {
  eligibleActions: number;
  completedWithinSevenDays: number;
}

interface ReviewRow {
  sessionId: string;
  turnNumber: number;
  locale: string;
  strategyVersion: string;
  mode: string;
  coreQuestion: string;
  confidence: number | string;
  messagesJson: unknown;
}

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return (
    process.argv
      .slice(2)
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function asNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function userMessageForTurn(messagesJson: unknown, turnNumber: number): string {
  if (!Array.isArray(messagesJson)) return "";
  const userMessages = messagesJson.filter(
    (message): message is { role: string; content: string } =>
      typeof message === "object" &&
      message !== null &&
      "role" in message &&
      "content" in message &&
      message.role === "user" &&
      typeof message.content === "string",
  );
  return userMessages[turnNumber - 1]?.content ?? "";
}

async function main(): Promise<void> {
  const requestedDays = Number(argument("days") ?? 14);
  const days = Number.isFinite(requestedDays)
    ? Math.max(1, Math.min(180, Math.round(requestedDays)))
    : 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const jsonOutput = process.argv.includes("--json");
  const exportReviewPath = argument("export-review");

  const [sessionVariants, feedback, audits, recovery, contributions, actions] =
    await Promise.all([
      sql<CountRow>`
      SELECT
        COALESCE("stateJson"->>'strategyVersion', 'legacy') AS variant,
        COUNT(*)::int AS count
      FROM "CoachingSession"
      WHERE "updatedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
      sql<FeedbackRow>`
      SELECT
        COALESCE(cs."stateJson"->>'strategyVersion', 'legacy') AS variant,
        COUNT(*)::int AS "feedbackCount",
        COUNT(*) FILTER (
          WHERE 'missed_my_point' = ANY(cf."reasons")
        )::int AS "missedPointCount",
        COUNT(*) FILTER (
          WHERE 'unclear' = ANY(cf."reasons")
        )::int AS "unclearCount",
        COUNT(*) FILTER (
          WHERE 'not_practical' = ANY(cf."reasons")
        )::int AS "notPracticalCount",
        COUNT(*) FILTER (
          WHERE 'helpful_next_step' = ANY(cf."reasons")
        )::int AS "helpfulNextStepCount",
        COUNT(*) FILTER (
          WHERE 'natural_conversation' = ANY(cf."reasons")
        )::int AS "naturalConversationCount"
      FROM "CoachingFeedback" cf
      JOIN "CoachingSession" cs ON cs."id" = cf."sessionId"
      WHERE cf."createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
      sql<AuditSummaryRow>`
      SELECT
        COUNT(*)::int AS "auditCount",
        COUNT(DISTINCT "sessionId")::int AS "sessionCount",
        ROUND(AVG("confidence"), 3) AS "averageConfidence",
        COUNT(*) FILTER (WHERE "confidence" < 0.62)::int AS "lowConfidenceCount",
        COUNT(*) FILTER (WHERE "needsRepair")::int AS "repairCount"
      FROM "CoachingTurnAudit"
      WHERE "createdAt" >= ${since}
    `,
      sql<RecoveryRow>`
      WITH ordered AS (
        SELECT
          "needsRepair",
          LEAD("needsRepair") OVER (
            PARTITION BY "sessionId" ORDER BY "turnNumber"
          ) AS "nextNeedsRepair",
          LEAD("id") OVER (
            PARTITION BY "sessionId" ORDER BY "turnNumber"
          ) AS "nextAuditId"
        FROM "CoachingTurnAudit"
        WHERE "createdAt" >= ${since}
      )
      SELECT
        COUNT(*) FILTER (
          WHERE "needsRepair" AND "nextAuditId" IS NOT NULL
        )::int AS "evaluableRepairs",
        COUNT(*) FILTER (
          WHERE "needsRepair"
            AND "nextAuditId" IS NOT NULL
            AND "nextNeedsRepair" = FALSE
        )::int AS "successfulRepairs"
      FROM ordered
    `,
      sql<ContributionRow>`
      SELECT
        target."mode",
        COUNT(*)::int AS "eligibleTurns",
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM "CoachingTurnAudit" contribution
            WHERE contribution."sessionId" = target."sessionId"
              AND contribution."turnNumber"
                BETWEEN target."turnNumber" AND target."turnNumber" + 1
              AND (
                (target."mode" = 'act' AND contribution."hasActionDraft")
                OR
                (target."mode" = 'decide' AND contribution."hasRecommendation")
              )
          )
        )::int AS "contributedWithinTwoTurns"
      FROM "CoachingTurnAudit" target
      WHERE target."createdAt" >= ${since}
        AND target."mode" IN ('act', 'decide')
      GROUP BY target."mode"
      ORDER BY target."mode"
    `,
      sql<ActionRow>`
      SELECT
        COUNT(*)::int AS "eligibleActions",
        COUNT(*) FILTER (
          WHERE "completedAt" IS NOT NULL
            AND "completedAt" <= "createdAt" + INTERVAL '7 days'
        )::int AS "completedWithinSevenDays"
      FROM "ActionItem"
      WHERE "sourceDimension" LIKE 'coaching:%'
        AND "createdAt" >= ${since}
        AND "createdAt" <= NOW() - INTERVAL '7 days'
    `,
    ]);

  const audit = audits[0] ?? {
    auditCount: 0,
    sessionCount: 0,
    averageConfidence: null,
    lowConfidenceCount: 0,
    repairCount: 0,
  };
  const repair = recovery[0] ?? {
    evaluableRepairs: 0,
    successfulRepairs: 0,
  };
  const action = actions[0] ?? {
    eligibleActions: 0,
    completedWithinSevenDays: 0,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    since: since.toISOString(),
    sessionsByVariant: sessionVariants,
    turnAudits: {
      auditCount: asNumber(audit.auditCount),
      sessionCount: asNumber(audit.sessionCount),
      averageConfidence:
        audit.averageConfidence === null
          ? null
          : asNumber(audit.averageConfidence),
      lowConfidenceRate: percent(
        asNumber(audit.lowConfidenceCount),
        asNumber(audit.auditCount),
      ),
      repairCount: asNumber(audit.repairCount),
    },
    repairRecovery: {
      evaluable: asNumber(repair.evaluableRepairs),
      successful: asNumber(repair.successfulRepairs),
      successRate: percent(
        asNumber(repair.successfulRepairs),
        asNumber(repair.evaluableRepairs),
      ),
      target: 95,
    },
    contributionWithinTwoTurns: contributions.map((row) => ({
      mode: row.mode,
      eligible: asNumber(row.eligibleTurns),
      contributed: asNumber(row.contributedWithinTwoTurns),
      rate: percent(
        asNumber(row.contributedWithinTwoTurns),
        asNumber(row.eligibleTurns),
      ),
    })),
    feedbackByVariant: feedback.map((row) => ({
      variant: row.variant,
      feedbackCount: asNumber(row.feedbackCount),
      missedPointRate: percent(
        asNumber(row.missedPointCount),
        asNumber(row.feedbackCount),
      ),
      unclearRate: percent(
        asNumber(row.unclearCount),
        asNumber(row.feedbackCount),
      ),
      notPracticalRate: percent(
        asNumber(row.notPracticalCount),
        asNumber(row.feedbackCount),
      ),
      helpfulNextStepRate: percent(
        asNumber(row.helpfulNextStepCount),
        asNumber(row.feedbackCount),
      ),
      naturalConversationRate: percent(
        asNumber(row.naturalConversationCount),
        asNumber(row.feedbackCount),
      ),
    })),
    sevenDayActionCompletion: {
      eligible: asNumber(action.eligibleActions),
      completed: asNumber(action.completedWithinSevenDays),
      rate: percent(
        asNumber(action.completedWithinSevenDays),
        asNumber(action.eligibleActions),
      ),
    },
    rolloutGate: {
      readyForAutomaticPromotion: false,
      reason:
        "Promotion still requires a reviewed core-question sample and enough real shadow/V2 traffic for baseline comparison.",
    },
  };

  if (exportReviewPath) {
    const requestedLimit = Number(argument("limit") ?? 100);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(500, Math.round(requestedLimit)))
      : 100;
    const reviewRows = await sql<ReviewRow>`
      SELECT
        audit."sessionId",
        audit."turnNumber",
        session."locale",
        audit."strategyVersion",
        audit."mode",
        audit."coreQuestion",
        audit."confidence",
        session."messagesJson"
      FROM "CoachingTurnAudit" audit
      JOIN "CoachingSession" session ON session."id" = audit."sessionId"
      WHERE audit."createdAt" >= ${since}
      ORDER BY audit."createdAt" DESC
      LIMIT ${limit}
    `;
    const jsonl = reviewRows
      .map((row) =>
        JSON.stringify({
          sessionId: row.sessionId,
          turnNumber: row.turnNumber,
          locale: row.locale,
          strategyVersion: row.strategyVersion,
          mode: row.mode,
          userMessage: userMessageForTurn(
            row.messagesJson,
            asNumber(row.turnNumber),
          ),
          inferredCoreQuestion: row.coreQuestion,
          confidence: asNumber(row.confidence),
          reviewer: {
            coreQuestionCorrect: null,
            answerFocused: null,
            communicationClear: null,
            notes: "",
          },
        }),
      )
      .join("\n");
    await writeFile(path.resolve(process.cwd(), exportReviewPath), jsonl);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`AI Coach V2 metrics (${days} days)`);
  console.table(report.sessionsByVariant);
  console.log("Turn audits:", report.turnAudits);
  console.log("Repair recovery:", report.repairRecovery);
  console.table(report.contributionWithinTwoTurns);
  console.table(report.feedbackByVariant);
  console.log("7-day action completion:", report.sevenDayActionCompletion);
  console.log("Rollout gate:", report.rolloutGate.reason);
  if (exportReviewPath) {
    console.log(`Review queue written to ${exportReviewPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(
    "Failed to generate AI Coach V2 metrics:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
