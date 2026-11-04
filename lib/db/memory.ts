// ============================================================
// Memory — UserMemory CRUD (AI coaching persistent memory)
//
// ARCHITECTURE NOTE: Two insight systems exist, with distinct roles:
//   1. UserMemory (this file) — AI-facing context for coaching prompts.
//      Read by: coaching-chat.
//      Written by: assessment generation, coaching extraction.
//      Cap: 50 active per user. Confidence decays over time.
//   2. UserProfile.insightsJson (lib/db/profiles.ts) — User-facing display layer.
//      Read by: dashboard, settings, coaching-insights API.
//      Written by: coaching-summary, profile-feedback.
//      Cap: 50 coaching insights. No decay.
//   coaching-summary writes to BOTH (extracted insights → ProfileInsights,
//   extracted memories → UserMemory). This is intentional: same conversation
//   produces human-readable insights AND machine-readable memory entries.
//
// Table: UserMemory
// Key fields: id, userId, category, keyword, insight, source,
//             confidence, isActive, metadata
// Categories: personality/values/behavior/career/constraint/
//             motivation/blindspot/strength/coaching_insight
// Sources: questionnaire/report/profile/coaching/manual
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { UserMemory, MemoryEntry } from "@/lib/types/memory";
import {
  getEmbeddingsBatch,
  isEmbeddingAvailable,
  toVectorLiteral,
  EMBEDDING_MODEL_ID,
} from "@/lib/ai/embeddings";

/** Default decay: 10% per cycle, deactivate below 0.3 */
const DECAY_RATE = 0.1;
const MIN_CONFIDENCE = 0.3;
/** Throttle: at most one decay per user per hour (in-memory, resets on cold start) */
const _lastDecay = new Map<string, number>();
const DECAY_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

export async function getUserMemories(
  userId: string,
  options?: { limit?: number },
): Promise<UserMemory[]> {
  // limit=null means no cap (callers doing dedup over the full set);
  // otherwise default cap keeps worst-case system-prompt build bounded
  // even for power users with hundreds of active memories.
  const limit = options?.limit;
  const rows = limit
    ? await sql<UserMemory>`
        SELECT "id", "userId", "category", "keyword", "insight", "source",
               "confidence", "isActive", "metadata", "createdAt", "updatedAt"
        FROM "UserMemory"
        WHERE "userId" = ${userId} AND "isActive" = TRUE
        ORDER BY "confidence" DESC, "createdAt" DESC
        LIMIT ${limit}
      `
    : await sql<UserMemory>`
        SELECT "id", "userId", "category", "keyword", "insight", "source",
               "confidence", "isActive", "metadata", "createdAt", "updatedAt"
        FROM "UserMemory"
        WHERE "userId" = ${userId} AND "isActive" = TRUE
        ORDER BY "confidence" DESC, "createdAt" DESC
      `;

  // Fire-and-forget: decay stale memories (7+ days untouched) without blocking the caller
  const now = Date.now();
  const last = _lastDecay.get(userId) ?? 0;
  if (now - last > DECAY_THROTTLE_MS) {
    _lastDecay.set(userId, now);
    applyConfidenceDecay(userId, DECAY_RATE, MIN_CONFIDENCE).catch((err) => {
      console.warn(
        "[memory] Confidence decay failed:",
        err instanceof Error ? err.message : err,
      );
    });
  }

  return rows;
}

export async function getUserMemoryCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM "UserMemory"
    WHERE "userId" = ${userId} AND "isActive" = TRUE
  `;
  return rows[0]?.count ?? 0;
}

export async function saveMemories(
  userId: string,
  memories: MemoryEntry[],
): Promise<void> {
  if (memories.length === 0) return;

  const ids = memories.map(() => randomUUID());

  if (memories.length === 1) {
    const m = memories[0];
    try {
      await sql`
        INSERT INTO "UserMemory" ("id", "userId", "category", "keyword", "insight", "source", "confidence", "isActive", "metadata")
        VALUES (
          ${ids[0]},
          ${userId},
          ${m.category},
          ${m.keyword},
          ${m.insight},
          ${m.source},
          ${m.confidence},
          TRUE,
          ${JSON.stringify(m.metadata ?? {})}::jsonb
        )
      `;
    } catch (dbErr) {
      throw new Error(`saveMemories DB insert failed for user ${userId}`, {
        cause: dbErr,
      });
    }
  } else {
    // Batch insert: build a single INSERT with multiple value rows via UNNEST
    const categories = memories.map((m) => m.category);
    const keywords = memories.map((m) => m.keyword);
    const insights = memories.map((m) => m.insight);
    const sources = memories.map((m) => m.source);
    const confidences = memories.map((m) => m.confidence);
    const metadatas = memories.map((m) => JSON.stringify(m.metadata ?? {}));

    try {
      await sql`
        INSERT INTO "UserMemory" ("id", "userId", "category", "keyword", "insight", "source", "confidence", "isActive", "metadata")
        SELECT
          unnest(${ids}::text[]),
          ${userId},
          unnest(${categories}::text[]),
          unnest(${keywords}::text[]),
          unnest(${insights}::text[]),
          unnest(${sources}::text[]),
          unnest(${confidences}::float8[]),
          TRUE,
          unnest(${metadatas}::jsonb[])
      `;
    } catch (dbErr) {
      throw new Error(
        `saveMemories batch DB insert failed for user ${userId} (${memories.length} entries)`,
        { cause: dbErr },
      );
    }
  }

  // Generate + store embeddings for semantic retrieval. Awaited but fail-soft:
  // any embedding error leaves a NULL embedding and retrieval falls back to
  // keyword selection — never block memory persistence on the embedding API.
  await storeMemoryEmbeddings(ids, memories);
}

/** Text embedded per memory. Mirrors the semantic meaning the coach query is
 *  matched against (keyword = distilled, insight = expanded). Category is a
 *  metadata label, intentionally excluded from the semantic vector. */
function buildMemoryEmbeddingText(m: MemoryEntry): string {
  return `${m.keyword}. ${m.insight}`;
}

async function storeMemoryEmbeddings(
  ids: string[],
  memories: MemoryEntry[],
): Promise<void> {
  if (!isEmbeddingAvailable()) return;

  let embeddings: number[][];
  try {
    embeddings = await getEmbeddingsBatch(
      memories.map(buildMemoryEmbeddingText),
    );
  } catch (err) {
    console.warn(
      "[memory] embedding generation failed, leaving NULL (keyword fallback):",
      err instanceof Error ? err.message : err,
    );
    return;
  }

  for (let i = 0; i < ids.length; i++) {
    const emb = embeddings[i];
    if (!emb) continue;
    try {
      await sql`
        UPDATE "UserMemory"
        SET "embedding" = ${toVectorLiteral(emb)}::vector,
            "embeddingModel" = ${EMBEDDING_MODEL_ID},
            "embeddedAt" = NOW()
        WHERE "id" = ${ids[i]}
      `;
    } catch (err) {
      console.warn(
        `[memory] embedding UPDATE failed for ${ids[i]}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

export async function deactivateMemory(
  userId: string,
  memoryId: string,
): Promise<boolean> {
  const rows = await sql`
    UPDATE "UserMemory"
    SET "isActive" = FALSE, "updatedAt" = NOW()
    WHERE "id" = ${memoryId} AND "userId" = ${userId} AND "isActive" = TRUE
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function deactivateAllMemories(userId: string): Promise<void> {
  await sql`
    UPDATE "UserMemory"
    SET "isActive" = FALSE, "updatedAt" = NOW()
    WHERE "userId" = ${userId} AND "isActive" = TRUE
  `;
}

// ── Memory evolution helpers ───────────────────────────────

/**
 * Reinforce a memory's confidence (bump up when topic recurs).
 */
export async function reinforceMemoryConfidence(
  memoryId: string,
  newConfidence: number,
): Promise<void> {
  await sql`
    UPDATE "UserMemory"
    SET "confidence" = ${newConfidence}, "updatedAt" = NOW()
    WHERE "id" = ${memoryId} AND "isActive" = TRUE
  `;
}

/**
 * Apply confidence decay to all memories older than a given threshold.
 * Returns count of updated rows.
 */
export async function applyConfidenceDecay(
  userId: string,
  decayRate: number,
  minConfidence: number,
): Promise<number> {
  // Single atomic UPDATE: decay + deactivate below minimum in one pass
  const result = await sql`
    UPDATE "UserMemory"
    SET "confidence" = CASE
          WHEN "updatedAt" < NOW() - INTERVAL '7 days'
          THEN GREATEST("confidence" * ${1 - decayRate}, 0)
          ELSE "confidence"
        END,
        "isActive" = CASE
          WHEN "updatedAt" < NOW() - INTERVAL '7 days'
               AND GREATEST("confidence" * ${1 - decayRate}, 0) < ${minConfidence}
          THEN FALSE
          WHEN "confidence" < ${minConfidence}
          THEN FALSE
          ELSE "isActive"
        END,
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
      AND "isActive" = TRUE
      AND ("updatedAt" < NOW() - INTERVAL '7 days' OR "confidence" < ${minConfidence})
    RETURNING "id"
  `;

  return result.length;
}
