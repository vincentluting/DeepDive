// ============================================================
// Tests for proxy.ts machine-authentication bypass.
//
// Regression guard for the 23-day silent cron outage (2026-03-16 → 2026-04-08)
// caused by bot detection blocking Vercel cron's `vercel-cron/1.0` UA
// (15 chars < 20-char threshold on sensitive path).
//
// The fix: when a request targets /api/cron/ or /api/health/ AND carries
// a Bearer token, proxy.ts MUST bypass bot detection so Vercel cron /
// UptimeRobot / Datadog synthetics can reach the endpoint. Bearer token
// is then validated by guardCron / isAuthorized inside the route handler.
// ============================================================

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { MACHINE_AUTH_PATH_PREFIXES, isMachineAuthedRequest } from "../proxy";

function makeRequest(pathname: string, authHeader?: string): NextRequest {
  const url = new URL(`https://example.com${pathname}`);
  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);
  return new NextRequest(url, { headers });
}

describe("isMachineAuthedRequest", () => {
  describe("returns true (bypass bot detection)", () => {
    it("/api/cron/llm-digest with Bearer token", () => {
      const req = makeRequest("/api/cron/llm-digest", "Bearer abc123");
      expect(isMachineAuthedRequest("/api/cron/llm-digest", req)).toBe(true);
    });

    it("/api/cron/refresh-analytics with Bearer token", () => {
      const req = makeRequest("/api/cron/refresh-analytics", "Bearer xyz456");
      expect(isMachineAuthedRequest("/api/cron/refresh-analytics", req)).toBe(
        true,
      );
    });

    it("/api/health/llm with Bearer token", () => {
      const req = makeRequest("/api/health/llm", "Bearer secret");
      expect(isMachineAuthedRequest("/api/health/llm", req)).toBe(true);
    });

    it("accepts arbitrary suffix under /api/cron/", () => {
      const req = makeRequest("/api/cron/anything/nested", "Bearer x");
      expect(isMachineAuthedRequest("/api/cron/anything/nested", req)).toBe(
        true,
      );
    });
  });

  describe("returns false (still subject to bot detection)", () => {
    it("/api/cron/* without any auth header", () => {
      const req = makeRequest("/api/cron/llm-digest");
      expect(isMachineAuthedRequest("/api/cron/llm-digest", req)).toBe(false);
    });

    it("/api/cron/* with non-Bearer auth (e.g. Basic)", () => {
      const req = makeRequest("/api/cron/llm-digest", "Basic dXNlcjpwYXNz");
      expect(isMachineAuthedRequest("/api/cron/llm-digest", req)).toBe(false);
    });

    it("non-machine path with Bearer (e.g. /api/coaching-chat)", () => {
      const req = makeRequest("/api/coaching-chat", "Bearer abc");
      expect(isMachineAuthedRequest("/api/coaching-chat", req)).toBe(false);
    });

    it("similar but not-quite-prefix path (e.g. /api/crontab)", () => {
      const req = makeRequest("/api/crontab", "Bearer abc");
      expect(isMachineAuthedRequest("/api/crontab", req)).toBe(false);
    });

    it("root path with Bearer", () => {
      const req = makeRequest("/", "Bearer abc");
      expect(isMachineAuthedRequest("/", req)).toBe(false);
    });

    it("/api/health without trailing slash", () => {
      const req = makeRequest("/api/health", "Bearer abc");
      // MUST be explicit: /api/health (no slash) is NOT bypassed — only
      // /api/health/XXX (with slash) is. This prevents a naive /api/healthcheck
      // from accidentally bypassing.
      expect(isMachineAuthedRequest("/api/health", req)).toBe(false);
    });
  });

  describe("MACHINE_AUTH_PATH_PREFIXES constant", () => {
    it("includes /api/cron/ and /api/health/", () => {
      expect(MACHINE_AUTH_PATH_PREFIXES).toContain("/api/cron/");
      expect(MACHINE_AUTH_PATH_PREFIXES).toContain("/api/health/");
    });

    it("all prefixes end with trailing slash (anchors the boundary)", () => {
      for (const prefix of MACHINE_AUTH_PATH_PREFIXES) {
        expect(prefix.endsWith("/")).toBe(true);
      }
    });
  });
});
