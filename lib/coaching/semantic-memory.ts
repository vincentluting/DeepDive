// ============================================================
// Semantic memory retrieval — hybrid (cosine + keyword) recall via RRF.
//
// The pre-semantic baseline (context-selection.ts) ranks memories by keyword
// overlap, which misses paraphrases ("好领导" vs "厌恶办公室政治") and can rank
// negated concepts wrong. This module adds a cosine-similarity recall over
// pgvector embeddings and fuses it with the keyword ranking using Reciprocal
// Rank Fusion (RRF) — robust because it combines ranks, not raw scores of
// different scales.
//
// FAIL-SOFT: returns null whenever semantic retrieval is unavailable (kill
// switch, no OpenAI key, embedding error, no embedded rows yet, or the pool is
// already within the limit). The caller then falls back to keyword-only
// selectRelevantMemories — semantic retrieval is strictly additive.
// ============================================================

import { sql } from "@/lib/db/connection";
import type { UserMemory } from "@/lib/types/memory";
import type { CoachingTurnState } from "./turn-state";
import {
  getEmbedding,
  isEmbeddingAvailable,
  toVectorLiteral,
} from "@/lib/ai/embeddings";
import { rankMemoriesByKeyword } from "./context-selection";

// Standard RRF constant. Larger = flatter contribution from top ranks.
const RRF_K = 60;

function isSemanticMemoryDisabled(): boolean {
  return process.env.LLM_SEMANTIC_MEMORY_DISABLED === "1";
}

/** Semantic query text — what the user's live turn means, matched against each
 *  memory's embedded "keyword. insight". */
function buildQueryText(
  state: CoachingTurnState,
  latestUserMessage: string,
): string {
  return [latestUserMessage, state.coreConcern ?? "", state.evidenceQuote ?? ""]
    .filter(Boolean)
    .join(". ")
    .trim();
}

export async function retrieveMemoriesHybrid(
  userId: string,
  candidates: UserMemory[],
  state: CoachingTurnState,
  latestUserMessage: string,
  limit: number,
): Promise<UserMemory[] | null> {
  if (isSemanticMemoryDisabled() || !isEmbeddingAvailable()) return null;
  // Pool already fits — caller returns it as-is (same as selectRelevantMemories).
  if (candidates.length <= limit) return null;

  const queryText = buildQueryText(state, latestUserMessage);
  if (!queryText) return null;

  let queryVec: number[];
  try {
    queryVec = await getEmbedding(queryText);
  } catch {
    return null; // degrade to keyword
  }

  // Semantic recall: nearest embedded memories for this user (cosine distance).
  let semanticRows: { id: string }[];
  try {
    semanticRows = (await sql<{ id: string }>`
      SELECT "id"
      FROM "UserMemory"
      WHERE "userId" = ${userId}
        AND "isActive" = TRUE
        AND "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${toVectorLiteral(queryVec)}::vector
      LIMIT ${limit * 3}
    `) as { id: string }[];
  } catch {
    return null;
  }
  // Nothing embedded yet (pre-backfill) → keyword path is just as good.
  if (semanticRows.length === 0) return null;

  // Keyword recall: full keyword ranking over the same candidate pool.
  const keywordRanked = rankMemoriesByKeyword(
    candidates,
    state,
    latestUserMessage,
  );

  const semanticRank = new Map<string, number>();
  semanticRows.forEach((r, i) => semanticRank.set(r.id, i));
  const keywordRank = new Map<string, number>();
  keywordRanked.forEach((m, i) => keywordRank.set(m.id, i));

  // RRF: sum of 1/(K + rank) across the two rankings. Memories without an
  // embedding still get a keyword contribution, so they degrade gracefully
  // rather than vanishing while a backfill is in progress.
  const scored = candidates.map((m) => {
    let score = 0;
    const sRank = semanticRank.get(m.id);
    if (sRank !== undefined) score += 1 / (RRF_K + sRank);
    const kRank = keywordRank.get(m.id);
    if (kRank !== undefined) score += 1 / (RRF_K + kRank);
    return { memory: m, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.memory);
}
