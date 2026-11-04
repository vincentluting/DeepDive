// ============================================================
// Typed API Error Responses + Structured Logging
//
// Standardizes all API error responses to the format:
//   { error: { code: ApiErrorCode, message: string, timestamp: string } }
//
// Usage:
//   return createErrorResponse('SESSION_NOT_FOUND', 'Session abc not found', 404);
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export enum ApiErrorCode {
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  ASSESSMENT_NOT_FOUND = "ASSESSMENT_NOT_FOUND",
  DB_CONSTRAINT_FAILED = "DB_CONSTRAINT_FAILED",
  AI_TIMEOUT = "AI_TIMEOUT",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  AI_RATE_LIMITED = "AI_RATE_LIMITED",
  AI_KEY_INVALID = "AI_KEY_INVALID",
  AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED",
  EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  UNAUTHORIZED = "UNAUTHORIZED",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    timestamp: string;
  };
}

/**
 * Postgres SQLSTATE codes that signal schema drift — the code references a
 * column/table/object that does not exist in the live database, i.e. a
 * migration was committed but never applied. These are P0 infrastructure
 * faults (fix = run the migration), NOT transient hiccups or user errors,
 * so they must be visibly distinguishable in Sentry from generic 500s.
 *   42703 undefined_column · 42P01 undefined_table
 *   42P10 invalid_column_reference · 42704 undefined_object
 */
const SCHEMA_DRIFT_PG_CODES = new Set(["42703", "42P01", "42P10", "42704"]);

function pgErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * True when the error is a Postgres schema-drift fault (missing column/table).
 * Use to surface an actionable "a migration is unapplied" signal instead of
 * burying it under a generic "Failed to …" message.
 */
export function isSchemaDriftError(error: unknown): boolean {
  const code = pgErrorCode(error);
  return code !== undefined && SCHEMA_DRIFT_PG_CODES.has(code);
}

/**
 * Create a standardized error response for API routes.
 *
 * All error responses follow the shape:
 *   { error: { code, message, timestamp } }
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}

/**
 * Log a structured error to console.error for observability.
 *
 * Outputs a JSON-friendly object that can be parsed by log aggregators.
 */
export function logApiError(
  route: string,
  errorCode: ApiErrorCode,
  details: {
    userId?: string | null;
    message?: string;
    cause?: unknown;
  } = {},
): void {
  const pgCode = pgErrorCode(details.cause);
  const schemaDrift = isSchemaDriftError(details.cause);

  console.error(
    JSON.stringify({
      level: "error",
      route,
      errorCode,
      userId: details.userId ?? undefined,
      message: details.message ?? errorCode,
      pgCode,
      schemaDrift: schemaDrift || undefined,
      stack: details.cause instanceof Error ? details.cause.stack : undefined,
      ts: new Date().toISOString(),
    }),
  );

  // Schema drift (a migration is unapplied) is an operational P0 — tag it so
  // it stands out in Sentry from transient/user errors and can be alerted on.
  const driftTags = schemaDrift
    ? { dbErrorClass: "schema_drift", pgCode: pgCode ?? "unknown" }
    : {};

  // Send to Sentry for production monitoring
  if (details.cause instanceof Error) {
    Sentry.captureException(details.cause, {
      level: schemaDrift ? "fatal" : "error",
      tags: { route, errorCode, ...driftTags },
      extra: { userId: details.userId, message: details.message },
    });
  } else {
    Sentry.captureMessage(details.message ?? errorCode, {
      level: "error",
      tags: { route, errorCode, ...driftTags },
      extra: { userId: details.userId },
    });
  }
}
