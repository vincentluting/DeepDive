// Next.js instrumentation hook
// Initializes Sentry on server startup AND validates LLM API keys.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    // Validate LLM API key formats at startup (nodejs runtime only — edge
    // runtime doesn't run the model router). This catches the most common
    // deployment mistake (env var unset / wrong provider's key / corrupted
    // copy-paste) BEFORE the first user request hits a 401.
    //
    // Format check is local-only — does NOT call any provider API. The live
    // probe lives in /api/health/llm and /api/cron/llm-digest.
    await validateLLMKeysAtStartup();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

type ProviderKeyState =
  | { state: "healthy" }
  | { state: "invalid-format"; reason: string }
  | { state: "empty-string-override" } // present in process.env but empty — shell/parent likely exports `KEY=""` masking .env.local
  | { state: "unset" }; // not present at all — fallback chain will route around

interface ProviderCheck {
  envName: string;
  provider: "anthropic" | "openai" | "gemini";
}

const LLM_PROVIDER_CHECKS: readonly ProviderCheck[] = [
  { envName: "ANTHROPIC_API_KEY", provider: "anthropic" },
  { envName: "OPENAI_API_KEY", provider: "openai" },
  { envName: "GOOGLE_API_KEY", provider: "gemini" },
];

function classifyProviderKey(
  check: ProviderCheck,
  validateKeyFormat: (
    provider: ProviderCheck["provider"],
    apiKey: string | undefined,
  ) => { valid: boolean; reason?: string },
): ProviderKeyState {
  const present = Object.prototype.hasOwnProperty.call(
    process.env,
    check.envName,
  );
  const value = process.env[check.envName];
  if (!present) return { state: "unset" };
  if (!value) return { state: "empty-string-override" };
  const fmt = validateKeyFormat(check.provider, value);
  if (!fmt.valid) {
    return { state: "invalid-format", reason: fmt.reason ?? "unknown" };
  }
  return { state: "healthy" };
}

/**
 * Validate LLM API key state at startup. Distinguishes 4 cases per provider:
 *   - healthy           — truthy + format-valid; provider is callable
 *   - invalid-format    — truthy but doesn't match expected prefix (typo / wrong provider key copy-paste)
 *   - empty-string-override — `process.env[X]` is present-but-empty. Cause: parent shell
 *                          exports `X=""` which dotenv refuses to override, masking the
 *                          legitimate .env.local value. Fix: `unset X && restart dev`.
 *   - unset             — not in process.env at all; fallback chain handles routing.
 *
 * Empty-string-override is the silent failure mode we want to surface loudly:
 * the router silently demotes to fallback, latency and cost drift, and the only
 * symptom is "[model-router] Primary provider unavailable for X" buried in logs.
 */
async function validateLLMKeysAtStartup(): Promise<void> {
  try {
    const { validateKeyFormat } = await import("./lib/ai/health-check");

    const results = LLM_PROVIDER_CHECKS.map((check) => ({
      check,
      result: classifyProviderKey(check, validateKeyFormat),
    }));

    const healthy = results.filter((r) => r.result.state === "healthy");
    const masked = results.filter(
      (r) => r.result.state === "empty-string-override",
    );
    const invalid = results.filter((r) => r.result.state === "invalid-format");
    const unset = results.filter((r) => r.result.state === "unset");

    console.log("[startup] LLM key health check:");
    for (const { check, result } of results) {
      switch (result.state) {
        case "healthy":
          console.log(`  ✅ ${check.envName} (${check.provider}): healthy`);
          break;
        case "empty-string-override":
          console.error(
            `  ❌ ${check.envName} (${check.provider}): EMPTY STRING — shell value masks .env.local. ` +
              `Fix: \`unset ${check.envName}\` (and \`ANTHROPIC_BASE_URL\` if set) then restart`,
          );
          break;
        case "invalid-format":
          console.warn(
            `  ⚠️  ${check.envName} (${check.provider}): INVALID FORMAT — ${result.reason}`,
          );
          break;
        case "unset":
          console.log(
            `  ⚪ ${check.envName} (${check.provider}): unset (fallback chain will route around)`,
          );
          break;
      }
    }
    console.log(
      `[startup] LLM providers: ${healthy.length}/${LLM_PROVIDER_CHECKS.length} healthy` +
        (masked.length > 0 ? `, ${masked.length} shell-masked` : "") +
        (invalid.length > 0 ? `, ${invalid.length} invalid` : "") +
        (unset.length > 0 ? `, ${unset.length} unset` : ""),
    );

    if (healthy.length === 0) {
      console.error(
        "[startup] CRITICAL: No LLM providers healthy. All LLM calls will fail.",
      );
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage("No LLM providers healthy at startup", {
        level: "error",
        tags: { source: "startup-validation" },
        extra: {
          masked: masked.map((r) => r.check.envName),
          invalid: invalid.map((r) => r.check.envName),
          unset: unset.map((r) => r.check.envName),
        },
      });
      return;
    }

    if (masked.length > 0 || invalid.length > 0) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(
        `LLM key issues at startup: ${masked.length} shell-masked, ${invalid.length} invalid`,
        {
          level: masked.length > 0 ? "error" : "warning",
          tags: { source: "startup-validation" },
          extra: {
            masked: masked.map((r) => r.check.envName),
            invalid: invalid.map((r) => ({
              envName: r.check.envName,
              reason:
                r.result.state === "invalid-format" ? r.result.reason : "?",
            })),
          },
        },
      );
    }
  } catch (err) {
    // Don't crash startup if validation itself errors — just log and continue.
    console.error("[startup] LLM key validation failed:", err);
  }
}

export async function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderType: "server" | "client" | undefined;
    revalidateReason: "on-demand" | "stale" | undefined;
    serverComponentType:
      | "Page"
      | "Layout"
      | "Not Found"
      | "Template"
      | "Default"
      | undefined;
  },
): Promise<void> {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(error, request, context);
}
