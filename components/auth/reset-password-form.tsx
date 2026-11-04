"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { csrfFetch } from "@/lib/auth/csrf-client";

interface ResetPasswordFormProps {
  dictionary: {
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    submitButton: string;
    submitting: string;
    successMessage: string;
    errorMessage: string;
    tokenExpired: string;
    passwordMismatch: string;
    backToLogin: string;
  };
}

export function ResetPasswordForm({ dictionary: t }: ResetPasswordFormProps) {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "expired"
  >("idle");
  const [localError, setLocalError] = useState("");

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-destructive mb-4">{t.tokenExpired}</p>
        <button
          onClick={() => router.push(`/${locale}/login`)}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {t.backToLogin}
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirm) {
      setLocalError(t.passwordMismatch);
      return;
    }

    setStatus("loading");

    try {
      const res = await csrfFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push(`/${locale}/login`), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        if (
          data.error?.includes("expired") ||
          data.error?.includes("Invalid")
        ) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-md-gold/15 border border-md-hairline flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-md-gold-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{t.successMessage}</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-destructive mb-4">{t.tokenExpired}</p>
        <button
          onClick={() => router.push(`/${locale}/forgot-password`)}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {t.submitButton}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {t.newPasswordLabel}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {t.confirmPasswordLabel}
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {(localError || status === "error") && (
        <p className="text-sm text-destructive">
          {localError || t.errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? t.submitting : t.submitButton}
      </button>
    </form>
  );
}
