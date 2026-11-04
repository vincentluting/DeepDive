import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ApiErrorCode,
  createErrorResponse,
  isSchemaDriftError,
  logApiError,
} from "../api/api-errors";

describe("createErrorResponse", () => {
  it("returns a NextResponse with the correct JSON structure", async () => {
    const response = createErrorResponse(
      ApiErrorCode.SESSION_NOT_FOUND,
      "Session abc not found",
      404,
    );

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
    expect(body.error.message).toBe("Session abc not found");
    expect(body.error.timestamp).toBeDefined();
    // Timestamp should be ISO format
    expect(() => new Date(body.error.timestamp)).not.toThrow();
    expect(new Date(body.error.timestamp).toISOString()).toBe(
      body.error.timestamp,
    );
  });

  it("supports all ApiErrorCode values", async () => {
    const codes = Object.values(ApiErrorCode);
    expect(codes.length).toBeGreaterThan(0);

    for (const code of codes) {
      const response = createErrorResponse(code, `Test ${code}`, 500);
      const body = await response.json();
      expect(body.error.code).toBe(code);
    }
  });

  it("preserves the HTTP status code", async () => {
    const statuses = [400, 401, 403, 404, 409, 429, 500, 502, 503];
    for (const status of statuses) {
      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "test",
        status,
      );
      expect(response.status).toBe(status);
    }
  });

  it("includes Content-Type application/json header", () => {
    const response = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "test",
      500,
    );
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("logApiError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs structured JSON to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.INTERNAL_ERROR, {
      message: "Something went wrong",
    });

    expect(spy).toHaveBeenCalledTimes(1);

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.level).toBe("error");
    expect(loggedJson.route).toBe("/api/test");
    expect(loggedJson.errorCode).toBe("INTERNAL_ERROR");
    expect(loggedJson.message).toBe("Something went wrong");
    expect(loggedJson.ts).toBeDefined();
  });

  it("includes userId when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.UNAUTHORIZED, {
      userId: "user-123",
      message: "Not authorized",
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.userId).toBe("user-123");
  });

  it("excludes userId when null", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.VALIDATION_ERROR, {
      userId: null,
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.userId).toBeUndefined();
  });

  it("includes stack trace when cause is an Error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const originalError = new Error("DB connection failed");
    logApiError("/api/test", ApiErrorCode.DB_CONSTRAINT_FAILED, {
      message: "DB error",
      cause: originalError,
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.stack).toBeDefined();
    expect(loggedJson.stack).toContain("DB connection failed");
  });

  it("does not include stack when cause is not an Error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.INTERNAL_ERROR, {
      cause: "just a string",
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.stack).toBeUndefined();
  });

  it("uses errorCode as default message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.AI_TIMEOUT);

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.message).toBe("AI_TIMEOUT");
  });

  it("flags schema drift (pgCode + schemaDrift) for a missing-column error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const pgErr = Object.assign(
      new Error('column "planPhase" does not exist'),
      { code: "42703" },
    );
    logApiError("/api/test", ApiErrorCode.DB_CONSTRAINT_FAILED, {
      cause: pgErr,
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.pgCode).toBe("42703");
    expect(loggedJson.schemaDrift).toBe(true);
  });

  it("omits schemaDrift/pgCode for ordinary errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError("/api/test", ApiErrorCode.INTERNAL_ERROR, {
      cause: new Error("boom"),
    });

    const loggedJson = JSON.parse(spy.mock.calls[0][0] as string);
    expect(loggedJson.schemaDrift).toBeUndefined();
    expect(loggedJson.pgCode).toBeUndefined();
  });
});

describe("isSchemaDriftError", () => {
  it("detects schema-drift Postgres SQLSTATE codes", () => {
    for (const code of ["42703", "42P01", "42P10", "42704"]) {
      expect(isSchemaDriftError(Object.assign(new Error("x"), { code }))).toBe(
        true,
      );
    }
  });

  it("returns false for non-drift codes, plain errors, and non-errors", () => {
    // 23505 = unique_violation (a real constraint error, not drift)
    expect(
      isSchemaDriftError(Object.assign(new Error("dup"), { code: "23505" })),
    ).toBe(false);
    expect(isSchemaDriftError(new Error("plain"))).toBe(false);
    expect(isSchemaDriftError("a string")).toBe(false);
    expect(isSchemaDriftError(undefined)).toBe(false);
    expect(isSchemaDriftError(null)).toBe(false);
  });
});

describe("ApiErrorCode enum", () => {
  it("contains expected error codes", () => {
    expect(ApiErrorCode.SESSION_NOT_FOUND).toBe("SESSION_NOT_FOUND");
    expect(ApiErrorCode.ASSESSMENT_NOT_FOUND).toBe("ASSESSMENT_NOT_FOUND");
    expect(ApiErrorCode.DB_CONSTRAINT_FAILED).toBe("DB_CONSTRAINT_FAILED");
    expect(ApiErrorCode.AI_TIMEOUT).toBe("AI_TIMEOUT");
    expect(ApiErrorCode.AI_SERVICE_ERROR).toBe("AI_SERVICE_ERROR");
    expect(ApiErrorCode.AI_RATE_LIMITED).toBe("AI_RATE_LIMITED");
    expect(ApiErrorCode.AI_KEY_INVALID).toBe("AI_KEY_INVALID");
    expect(ApiErrorCode.AI_NOT_CONFIGURED).toBe("AI_NOT_CONFIGURED");
    expect(ApiErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ApiErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
    expect(ApiErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ApiErrorCode.CONFLICT).toBe("CONFLICT");
    expect(ApiErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });
});
