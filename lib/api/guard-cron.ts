// ============================================================
// guardCron — Shared Bearer-token auth for cron endpoints
//
// Usage:
//   const cronGuard = guardCron(request);
//   if (cronGuard.blocked) return cronGuard.response;
//
// Reads CRON_SECRET env var and validates
//   Authorization: Bearer <secret>
// Returns 401 if missing or invalid.
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

type CronGuardResult =
  | { blocked: false }
  | { blocked: true; response: NextResponse };

/** Constant-time string comparison to prevent timing side-channel attacks. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function guardCron(request: NextRequest): CronGuardResult {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return {
      blocked: true,
      response: NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 401 }),
    };
  }

  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${cronSecret}`;
  if (!authHeader || !safeCompare(authHeader, expected)) {
    return {
      blocked: true,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { blocked: false };
}
