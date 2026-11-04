-- 060: Add adminNote column to QuickDiveResult for admin labeling of anonymous visitors
ALTER TABLE "QuickDiveResult" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
