"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const dict = getDictionaryClient(locale as Locale);
  const t = dict.errorPage;
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (__DEV__) console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t.tryAgain}
          </button>
          <Link
            href={`/${locale}`}
            className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>

        {/* Debug: show error details (dev only) */}
        {__DEV__ && (
          <>
            <button
              onClick={() => setShowDebug((prev) => !prev)}
              className="mt-8 text-xs text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
            >
              {showDebug ? "Hide" : "Show"} error details
            </button>
            {showDebug && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 text-left overflow-auto max-h-64">
                <p className="text-xs font-mono text-destructive break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
                {error.digest && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </>
        )}
        {!__DEV__ && error.digest && (
          <p className="mt-8 text-xs text-muted-foreground/55">
            {t.errorId} {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
