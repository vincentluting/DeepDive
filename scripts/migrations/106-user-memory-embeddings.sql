-- Migration 106: UserMemory embeddings for semantic memory retrieval
-- Adds a pgvector column so coaching memory retrieval can rank by semantic
-- similarity (cosine) instead of pure keyword/term-frequency matching, which
-- missed paraphrases and mis-ranked negated concepts (a "don't want X" query
-- surfacing a "suited for X" memory). Columns are nullable for graceful
-- fallback: rows without an embedding fall back to keyword selection, and the
-- retriever degrades to the existing selectRelevantMemories path.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "UserMemory"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536),
  ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT,
  ADD COLUMN IF NOT EXISTS "embeddedAt" TIMESTAMPTZ;

-- HNSW over cosine: no warm-up, incremental-insert friendly (memory rows are
-- written in small continuous batches). 1536 dims = OpenAI text-embedding-3-small.
-- embeddingModel records which model produced the vector so a future model swap
-- can re-backfill without mixing incompatible vector spaces.
CREATE INDEX IF NOT EXISTS "idx_user_memory_embedding"
  ON "UserMemory" USING hnsw ("embedding" vector_cosine_ops);
