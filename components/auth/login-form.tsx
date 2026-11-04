"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm({
  locale,
  redirectTo,
}: {
  locale: string;
  redirectTo?: string | null;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").loginForm;
  const a11y = getDictionaryClient(locale as "en" | "zh").a11y;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Synchronous submission lock — see register-form.tsx (BUG-001, 2026-04-08)
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    submittingRef.current = true;
    setIsLoading(true);

    try {
      const res = await csrfFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string" ? data.error : data.error?.message;
        setError(msg || t.loginFailed);
        return;
      }

      // Claim any anonymous Quick Dive result before redirecting.
      // Poll for in-flight save instead of hardcoded timeout.
      try {
        let quickDiveId =
          localStorage.getItem("deep-dive-last-quickdive-id") ||
          localStorage.getItem("deep-dive-last-immersive-id");
        if (!quickDiveId && sessionStorage.getItem("quickdive-active")) {
          for (let i = 0; i < 16; i++) {
            await new Promise((r) => setTimeout(r, 300));
            quickDiveId =
              localStorage.getItem("deep-dive-last-quickdive-id") ||
              localStorage.getItem("deep-dive-last-immersive-id");
            if (quickDiveId) break;
          }
        }
        if (quickDiveId) {
          await csrfFetch("/api/quickdive/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultId: quickDiveId }),
          });
        }
      } catch {
        // Claim failure is non-blocking
      }

      window.location.href = safeRedirectPath(
        redirectTo,
        `/${locale}/dashboard`,
      );
    } catch {
      setError(t.somethingWentWrong);
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <OAuthButtons
        locale={locale}
        position="top"
        dictionary={
          t as typeof t & {
            continueWithGoogle: string;
            continueWithApple: string;
            orDivider: string;
          }
        }
      />

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          {t.email}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          {t.password}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-12 h-11 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? a11y.hidePassword : a11y.showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex justify-end mt-1">
          <a
            href={`/${locale}/forgot-password`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {t.forgotPassword}
          </a>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base gap-2 mt-2 shadow-lg shadow-primary/20"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.divingIn}
          </>
        ) : (
          <>
            {t.signIn}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
