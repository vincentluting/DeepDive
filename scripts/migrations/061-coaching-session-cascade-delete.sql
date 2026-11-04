-- Migration 061: Add ON DELETE CASCADE to CoachingSession.userId
-- Previously the only User FK missing CASCADE, blocking single-statement user deletion.

ALTER TABLE "CoachingSession" DROP CONSTRAINT IF EXISTS "CoachingSession_userId_fkey";
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
