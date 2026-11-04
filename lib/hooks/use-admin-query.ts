"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reportClientError } from "@/lib/observability/client-error";

interface UseAdminQueryOptions<T> {
  /** Transform the raw JSON payload before storing it. */
  transform?: (raw: unknown) => T;
  /** Component name for error reporting (defaults to "useAdminQuery"). */
  component?: string;
}

interface UseAdminQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Unified GET fetch hook for admin panels: loading / error / refetch in
 * one place, with reportClientError on failure (no silent catches).
 * Pass `null` as url to skip fetching (conditional queries).
 *
 * GET-only by design — admin mutations go through csrfFetch directly.
 */
export function useAdminQuery<T>(
  url: string | null,
  opts?: UseAdminQueryOptions<T>,
): UseAdminQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(url != null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  // Keep latest transform/component without retriggering the effect
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${url}`);
        }
        const raw: unknown = await res.json();
        if (cancelled) return;
        const transform = optsRef.current?.transform;
        setData(transform ? transform(raw) : (raw as T));
      } catch (err) {
        if (cancelled) return;
        reportClientError(err, {
          component: optsRef.current?.component ?? "useAdminQuery",
          feature: "admin",
          extra: { url },
        });
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refetch };
}
