-- 063: Add ON DELETE CASCADE to InviteCode.createdBy FK
-- Was blocking user deletion when user had created invite codes

ALTER TABLE "InviteCode" DROP CONSTRAINT IF EXISTS "InviteCode_createdBy_fkey";
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE;
