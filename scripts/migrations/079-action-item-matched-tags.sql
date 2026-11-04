-- Migration 079: Action Item matched-tags for Personal Plan attribution
--
-- Adds two nullable columns to ActionItem so the priority-ranker can persist
-- which non-negotiable / flow dimension drove each item's selection. The UI
-- renders these as attribution chips ("Anchor: psych_safety" / "Flow: alone")
-- so users can see WHY each item was chosen for them.
--
-- Both columns are nullable: legacy ActionItems and lite-tier plans without
-- exercise data will simply have NULL and render no chip.
--
-- Companion app changes:
--   - lib/db/action-hub.ts: createActionItem() accepts the two new fields
--   - lib/action-hub/priority-ranker.ts: emits matched* on RankedAction
--   - components/action-hub/action-board.tsx: renders attribution chips

ALTER TABLE "ActionItem"
  ADD COLUMN IF NOT EXISTS "matchedNonNegotiable" TEXT,
  ADD COLUMN IF NOT EXISTS "matchedFlowDimension" JSONB;
