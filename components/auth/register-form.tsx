"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { getClientId } from "@/lib/auth/client-id";
import { OAuthButtons } from "./oauth-buttons";

export function RegisterForm({
  locale,
  from,
  inviteCode,
}: {
  locale: string;
  from?: string;
  inviteCode?: string;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").registerForm;
  const a11y = getDictionaryClient(locale as "en" | "zh").a11y;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Synchronous submission lock — prevents double-submit race where a second
  // Enter/click lands before React flushes `isLoading` state to the DOM.
  // (BUG-001, 2026-04-08)
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");

    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);

    try {
      const res = await csrfFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          anonymousId: getClientId() || undefined,
          inviteCode: inviteCode || undefined,
          // Send the registration-UI locale so the API can gate thesis
          // cohort enrolment to professionally-translated locales (en/zh).
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string" ? data.error : data.error?.message;
        setError(msg || t.createAccountFailed);
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
        // Claim failure is non-blocking — user can still proceed
      }

      let redirectPath = `/${locale}/explore`;
      if (from === "questionnaire" || from === "deepdive") {
        redirectPath = `/${locale}/deepdive`;
      } else if (from === "coaching") {
        redirectPath = `/${locale}/coaching`;
      } else if (from === "narrative" || from === "immersive-dive") {
        redirectPath = `/${locale}/immersive-dive`;
      } else if (from === "report") {
        redirectPath = `/${locale}/dashboard`;
      }
      // Research participants (registered with invite code) → dashboard for guided journey
      if (inviteCode) {
        redirectPath = `/${locale}/dashboard`;
      }
      // Full page navigation ensures session cookie is propagated to server components
      window.location.href = redirectPath;
    } catch (err) {
      setError(
        err instanceof TypeError ? t.networkError : t.somethingWentWrong,
      );
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
        <Label htmlFor="name" className="text-sm font-medium">
          {t.name}
        </Label>
        <Input
          id="name"
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="h-11 rounded-xl"
        />
      </div>

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
        <Label htmlFor="password">{t.password}</Label>
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
        <p className="text-xs text-muted-foreground">{t.passwordHint}</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {error && /invite\s*code|cohort/i.test(error) && (
        <div className="rounded-xl border border-md-hairline-strong bg-md-gold/10 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t.inviteCodeHelpTitle}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.inviteCodeHelpBody}
          </p>
          <a
            href="mailto:vincentluting@gmail.com?subject=Deep%20Dive%20invite%20code%20help"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t.inviteCodeHelpCTA} →
          </a>
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
            {t.creatingAccount}
          </>
        ) : (
          <>
            {t.createAccount}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
