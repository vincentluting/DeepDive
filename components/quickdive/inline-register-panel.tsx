// ============================================================
// InlineRegisterPanel — Bottom sheet registration/login panel
//
// Triggered when user clicks "Claim My Profile" on the Quick Dive
// result page. Avoids page navigation to preserve decision momentum
// (Cognitive Fluency principle).
//
// Mobile: slides up from bottom (~70% screen height)
// Desktop: centered modal (max-width 420px)
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { getClientId } from "@/lib/auth/client-id";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

const INVITE_CODE_STORAGE_KEY = "deep-dive-pending-invite-code";

/** Read any persisted invite code (saved by InviteCodePersister in layout) */
function getPendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(INVITE_CODE_STORAGE_KEY);
}

/** Clear after successful registration */
function clearPendingInviteCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INVITE_CODE_STORAGE_KEY);
}

export interface InlineRegisterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locale: string;
  archetypeCode: string;
  archetypeTitle: string;
  archetypeTitleEn: string;
  /** Quick Dive result ID to claim on registration — avoids localStorage dependency */
  quickDiveResultId?: string | null;
}

type PanelTab = "register" | "login";

// ── Texts ────────────────────────────────────────────────────

function getTexts(
  locale: string,
  archetypeTitle: string,
  archetypeTitleEn: string,
) {
  const isZh = locale === "zh";
  const t = getDictionaryClient(locale as Locale).quickDive;
  const archetypeName = isZh ? archetypeTitle : archetypeTitleEn;
  return {
    claimTitle: interpolate(t.claimHeadline, { archetype: archetypeName }),
    tabRegister: t.registerTab,
    tabLogin: t.signInTab,
    // TODO: Google OAuth — add Google Sign-In button once OAuth is implemented
    // googleBtn: t.googleContinue,
    divider: t.orEmail,
    nameLabel: t.nameOptional,
    namePlaceholder: t.namePlaceholder,
    emailLabel: t.emailLabel,
    emailPlaceholder: t.emailPlaceholder,
    passwordLabel: t.passwordLabel,
    passwordPlaceholder: t.passwordHint,
    passwordHint: t.passwordHint,
    registerBtn: t.claimButton,
    loginBtn: t.signInButton,
    creatingAccount: t.creatingProfile,
    signingIn: t.signingIn,
    privacyNote: t.privacyNote,
    passwordTooShort: t.passwordTooShort,
    somethingWentWrong: t.genericError,
    loginFailed: t.invalidCredentials,
    emailExists: t.emailExists,
    switchToLogin: t.switchToSignIn,
    switchToRegister: t.switchToRegister,
    successTitle: t.profileClaimed,
  };
}

// ── Main Component ────────────────────────────────────────────

export function InlineRegisterPanel({
  isOpen,
  onClose,
  onSuccess,
  locale,
  archetypeCode,
  archetypeTitle,
  archetypeTitleEn,
  quickDiveResultId,
}: InlineRegisterPanelProps) {
  const [tab, setTab] = useState<PanelTab>("register");
  const t = getTexts(locale, archetypeTitle, archetypeTitleEn);
  const a11y = getDictionaryClient(locale as Locale).a11y;
  const firstInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap & ESC key
  useEffect(() => {
    if (!isOpen) return;

    // Focus first input when panel opens
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap within panel
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, input, a[href], [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.claimTitle}
            data-testid="quickdive-inline-register-panel"
            // Mobile: bottom sheet | Desktop: centered modal
            className="fixed z-50 bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="md:pointer-events-auto w-full max-w-[calc(100vw-2rem)] md:max-w-[420px] md:mx-4 rounded-t-3xl md:rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #0F1E35 0%, #0A1628 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:
                  "0 -8px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04)",
                maxHeight: "90svh",
                overflowY: "auto",
              }}
              // Mobile: slide up from bottom | Desktop: scale in
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 280,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(
                _: MouseEvent | TouchEvent | PointerEvent,
                info: PanInfo,
              ) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  onClose();
                }
              }}
            >
              {/* Drag handle (mobile visual affordance) */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: "rgba(255, 255, 255, 0.2)" }}
                />
              </div>

              {/* Panel inner */}
              <div className="px-6 pb-8 pt-4">
                {/* Header row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 pr-4">
                    {/* Archetype badge */}
                    <div className="inline-flex items-center gap-1.5 mb-2">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(232, 118, 58, 0.15)",
                          color: "#E8763A",
                          border: "1px solid rgba(232, 118, 58, 0.25)",
                        }}
                      >
                        {archetypeCode.split("-")[0]}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {t.claimTitle}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                    aria-label={a11y.close}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Tab switcher */}
                <div
                  className="flex rounded-xl p-1 mb-6"
                  style={{ background: "rgba(255, 255, 255, 0.05)" }}
                >
                  {(["register", "login"] as PanelTab[]).map((t2) => (
                    <button
                      key={t2}
                      onClick={() => setTab(t2)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={
                        tab === t2
                          ? {
                              background: "rgba(255, 255, 255, 0.1)",
                              color: "#fff",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                            }
                          : { color: "rgba(255, 255, 255, 0.4)" }
                      }
                    >
                      {t2 === "register" ? t.tabRegister : t.tabLogin}
                    </button>
                  ))}
                </div>

                {/* Form content */}
                <AnimatePresence mode="wait">
                  {tab === "register" ? (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <RegisterSubForm
                        locale={locale}
                        t={t}
                        firstInputRef={firstInputRef}
                        onSuccess={onSuccess}
                        onSwitchToLogin={() => setTab("login")}
                        quickDiveResultId={quickDiveResultId}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <LoginSubForm
                        locale={locale}
                        t={t}
                        firstInputRef={firstInputRef}
                        onSuccess={onSuccess}
                        onSwitchToRegister={() => setTab("register")}
                        quickDiveResultId={quickDiveResultId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Register Sub-Form ─────────────────────────────────────────

function RegisterSubForm({
  locale,
  t,
  firstInputRef,
  onSuccess,
  onSwitchToLogin,
  quickDiveResultId,
}: {
  locale: string;
  t: ReturnType<typeof getTexts>;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  quickDiveResultId?: string | null;
}) {
  const a11y = getDictionaryClient(locale as Locale).a11y;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (password.length < 8) {
        setError(t.passwordTooShort);
        return;
      }

      setIsLoading(true);
      try {
        const inviteCode = getPendingInviteCode();
        const res = await csrfFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            email,
            password,
            anonymousId: getClientId() || undefined,
            ...(inviteCode ? { inviteCode } : {}),
            // Send the registration-UI locale so the API can gate thesis
            // cohort enrolment to professionally-translated locales (en/zh).
            locale,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            setError(t.emailExists);
          } else {
            const msg =
              typeof data.error === "string" ? data.error : data.error?.message;
            setError(msg || t.somethingWentWrong);
          }
          return;
        }

        // Claim any anonymous Quick Dive result before invoking onSuccess.
        // Use prop (from in-memory state) first, fall back to localStorage.
        try {
          let quickDiveId =
            quickDiveResultId ||
            localStorage.getItem("deep-dive-last-quickdive-id") ||
            localStorage.getItem("deep-dive-last-immersive-id");
          if (!quickDiveId) {
            await new Promise((r) => setTimeout(r, 2000));
            quickDiveId =
              localStorage.getItem("deep-dive-last-quickdive-id") ||
              localStorage.getItem("deep-dive-last-immersive-id");
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

        // Clear persisted invite code on successful registration
        clearPendingInviteCode();

        // Success — parent handles the reward animation
        onSuccess();
      } catch {
        setError(t.somethingWentWrong);
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, password, t, onSuccess, quickDiveResultId],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: Google OAuth — add Google Sign-In button here once OAuth is implemented */}

      {/* Name field */}
      <FormField label={t.nameLabel}>
        <PanelInput
          ref={firstInputRef}
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </FormField>

      {/* Email field */}
      <FormField label={t.emailLabel}>
        <PanelInput
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>

      {/* Password field */}
      <FormField label={t.passwordLabel} hint={t.passwordHint}>
        <PasswordInput
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          autoComplete="new-password"
          a11y={a11y}
        />
      </FormField>

      {/* Error message */}
      {error && <ErrorMessage message={error} />}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
        style={{
          background: isLoading
            ? "rgba(232, 118, 58, 0.5)"
            : "linear-gradient(135deg, #E8763A 0%, #D4592A 100%)",
          boxShadow: isLoading ? "none" : "0 4px 16px rgba(232, 118, 58, 0.35)",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            {t.creatingAccount}
          </>
        ) : (
          <>
            {t.registerBtn}
            <ArrowRight size={15} />
          </>
        )}
      </button>

      {/* Privacy note */}
      <p
        className="text-xs text-center"
        style={{ color: "rgba(255, 255, 255, 0.3)" }}
      >
        {t.privacyNote}
      </p>

      {/* Switch to login */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs underline-offset-2 hover:underline transition-colors"
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
        >
          {t.switchToLogin}
        </button>
      </div>
    </form>
  );
}

// ── Login Sub-Form ────────────────────────────────────────────

function LoginSubForm({
  locale,
  t,
  firstInputRef,
  onSuccess,
  onSwitchToRegister,
  quickDiveResultId,
}: {
  locale: string;
  t: ReturnType<typeof getTexts>;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  quickDiveResultId?: string | null;
}) {
  const a11y = getDictionaryClient(locale as Locale).a11y;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const res = await csrfFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            setError(t.loginFailed);
          } else {
            const msg =
              typeof data.error === "string" ? data.error : data.error?.message;
            setError(msg || t.somethingWentWrong);
          }
          return;
        }

        // Claim any anonymous Quick Dive result before invoking onSuccess.
        // Use prop (from in-memory state) first, fall back to localStorage.
        try {
          let quickDiveId =
            quickDiveResultId ||
            localStorage.getItem("deep-dive-last-quickdive-id") ||
            localStorage.getItem("deep-dive-last-immersive-id");
          if (!quickDiveId) {
            await new Promise((r) => setTimeout(r, 2000));
            quickDiveId =
              localStorage.getItem("deep-dive-last-quickdive-id") ||
              localStorage.getItem("deep-dive-last-immersive-id");
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

        onSuccess();
      } catch {
        setError(t.somethingWentWrong);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, t, onSuccess, quickDiveResultId],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TODO: Google OAuth — add Google Sign-In button here once OAuth is implemented */}

      {/* Email field */}
      <FormField label={t.emailLabel}>
        <PanelInput
          ref={firstInputRef}
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>

      {/* Password field */}
      <FormField label={t.passwordLabel}>
        <PasswordInput
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
          autoComplete="current-password"
          a11y={a11y}
        />
      </FormField>

      {/* Error message */}
      {error && <ErrorMessage message={error} />}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
        style={{
          background: isLoading
            ? "rgba(232, 118, 58, 0.5)"
            : "linear-gradient(135deg, #E8763A 0%, #D4592A 100%)",
          boxShadow: isLoading ? "none" : "0 4px 16px rgba(232, 118, 58, 0.35)",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            {t.signingIn}
          </>
        ) : (
          <>
            {t.loginBtn}
            <ArrowRight size={15} />
          </>
        )}
      </button>

      {/* Privacy note */}
      <p
        className="text-xs text-center"
        style={{ color: "rgba(255, 255, 255, 0.3)" }}
      >
        {t.privacyNote}
      </p>

      {/* Switch to register */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs underline-offset-2 hover:underline transition-colors"
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
        >
          {t.switchToRegister}
        </button>
      </div>
    </form>
  );
}

// ── Shared sub-components ────────────────────────────────────

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-medium"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const PanelInput = ({
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.RefObject<HTMLInputElement | null>;
}) => (
  <input
    ref={ref}
    {...props}
    className="w-full h-11 px-3 rounded-xl text-sm text-white placeholder:text-white/50 outline-none transition-all"
    style={{
      background: "rgba(255, 255, 255, 0.06)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}
    onFocus={(e) => {
      e.currentTarget.style.border = "1px solid rgba(232, 118, 58, 0.5)";
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      props.onFocus?.(e);
    }}
    onBlur={(e) => {
      e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.1)";
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
      props.onBlur?.(e);
    }}
  />
);

function PasswordInput({
  placeholder,
  value,
  onChange,
  showPassword,
  onToggleShow,
  autoComplete,
  a11y,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  a11y: Record<string, string>;
}) {
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        className="w-full h-11 px-3 pr-12 rounded-xl text-sm text-white placeholder:text-white/50 outline-none transition-all"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(232, 118, 58, 0.5)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
        }}
      />
      <button
        type="button"
        onClick={onToggleShow}
        tabIndex={-1}
        aria-label={showPassword ? a11y.hidePassword : a11y.showPassword}
        className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center transition-colors"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="text-xs px-3 py-2.5 rounded-xl"
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        color: "#FCA5A5",
      }}
    >
      {message}
    </div>
  );
}
