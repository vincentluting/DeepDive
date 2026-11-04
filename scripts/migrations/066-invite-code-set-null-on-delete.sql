-- 066: Change InviteCode.createdBy from ON DELETE CASCADE to ON DELETE SET NULL
-- CASCADE was silently deleting invite codes when the creating user was deleted.
-- SET NULL preserves invite codes and only clears the creator reference.

-- Step 1: Allow NULL in createdBy column
ALTER TABLE "InviteCode" ALTER COLUMN "createdBy" DROP NOT NULL;

-- Step 2: Replace CASCADE FK with SET NULL
ALTER TABLE "InviteCode" DROP CONSTRAINT IF EXISTS "InviteCode_createdBy_fkey";
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL;
