-- 064: Change CareerReport.userId FK from SET NULL to CASCADE
-- Was leaving orphaned reports when users were deleted

ALTER TABLE "CareerReport" DROP CONSTRAINT IF EXISTS "CareerReport_userId_fkey";
ALTER TABLE "CareerReport" ADD CONSTRAINT "CareerReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
