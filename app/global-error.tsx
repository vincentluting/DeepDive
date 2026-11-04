"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocaleFromCookie } from "@/lib/i18n/get-locale-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Locale resolved from URL path / session / cookie (all 11, SSR-safe) — not
  // just zh/en, so the error page isn't forced to English for de/ja/… (#127).
  const locale = getLocaleFromCookie();
  const t = getDictionaryClient(locale).errorPage;

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>{t.title}</h2>
          <button
            onClick={() => reset()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
          >
            {t.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
