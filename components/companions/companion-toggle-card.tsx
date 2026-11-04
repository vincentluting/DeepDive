"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import type {
  CompanionLocale,
  CompanionProfile,
  CompanionVisibility,
} from "@/lib/types/companion";

interface CompanionToggleCardProps {
  initialEnabled: boolean;
  initialProfile: CompanionProfile | null;
  hasQuickDive: boolean;
  locale: Locale;
  t: {
    title: string;
    subtitle: string;
    description: string;
    privacyNote: string;
    toggleLabel: string;
    toggleHelpEnabled: string;
    toggleHelpDisabled: string;
    statusEnabled: string;
    statusDisabled: string;
    statusEnabling: string;
    statusDisabling: string;
    needQuickDiveTitle: string;
    needQuickDiveDesc: string;
    needQuickDiveCta: string;
    errorGeneric: string;
    manageProfileTitle: string;
    manageProfileEdit: string;
    manageProfileSave: string;
    manageProfileSaving: string;
    manageProfileCancel: string;
    manageProfileSaved: string;
  };
  tOnboarding: {
    heading: string;
    intro: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    bioLabel: string;
    bioPlaceholder: string;
    bioCounter: string;
    visibilityLabel: string;
    visibilityDiscoverable: string;
    visibilityDiscoverableDesc: string;
    visibilityFriendsOnly: string;
    visibilityFriendsOnlyDesc: string;
    submit: string;
    submitting: string;
    cancel: string;
  };
}

type Status = "idle" | "loading" | "error" | "saved";

export function CompanionToggleCard({
  initialEnabled,
  initialProfile,
  hasQuickDive,
  locale,
  t,
  tOnboarding,
}: CompanionToggleCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [profile, setProfile] = useState<CompanionProfile | null>(
    initialProfile,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Onboarding form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] =
    useState<CompanionVisibility>("discoverable");

  const companionLocale: CompanionLocale = locale === "zh" ? "zh" : "en";

  const setError = (msg: string) => {
    setStatus("error");
    setErrorMsg(msg);
  };

  const flashSaved = () => {
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  };

  const callToggle = async (next: boolean) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await csrfFetch("/api/user/social-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setError(t.errorGeneric);
        return false;
      }
      setEnabled(next);
      setStatus("idle");
      return true;
    } catch {
      setError(t.errorGeneric);
      return false;
    }
  };

  const handleToggleClick = async () => {
    if (status === "loading") return;
    if (!hasQuickDive) return; // Quick Dive gate handled below in render
    if (enabled) {
      await callToggle(false);
      return;
    }
    // Turning ON: if profile exists, just toggle. Otherwise show onboarding.
    if (profile) {
      await callToggle(true);
    } else {
      // Pre-fill onboarding form (empty)
      setDisplayName("");
      setBio("");
      setVisibility("discoverable");
      setShowOnboarding(true);
      setStatus("idle");
      setErrorMsg("");
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    const trimmedName = displayName.trim();
    if (!trimmedName) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      // Step 1: Create companion profile
      const createRes = await csrfFetch("/api/companions/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedName,
          bio: bio.trim() || null,
          visibility,
          locale: companionLocale,
        }),
      });
      if (!createRes.ok) {
        setError(t.errorGeneric);
        return;
      }
      const createData = (await createRes.json()) as {
        profile: CompanionProfile;
      };

      // Step 2: Flip the user-level opt-in
      const ok = await callToggle(true);
      if (!ok) return;

      setProfile(createData.profile);
      setShowOnboarding(false);
      flashSaved();
    } catch {
      setError(t.errorGeneric);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !profile) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await csrfFetch("/api/companions/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedName,
          bio: bio.trim() || null,
          visibility,
        }),
      });
      if (!res.ok) {
        setError(t.errorGeneric);
        return;
      }
      const data = (await res.json()) as { profile: CompanionProfile };
      setProfile(data.profile);
      setShowEdit(false);
      flashSaved();
    } catch {
      setError(t.errorGeneric);
    }
  };

  const startEdit = () => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? "");
    setVisibility(
      profile.visibility === "hidden" ? "discoverable" : profile.visibility,
    );
    setShowEdit(true);
    setStatus("idle");
    setErrorMsg("");
  };

  const visibilityOptions: Array<{
    value: CompanionVisibility;
    label: string;
    desc: string;
  }> = [
    {
      value: "discoverable",
      label: tOnboarding.visibilityDiscoverable,
      desc: tOnboarding.visibilityDiscoverableDesc,
    },
    {
      value: "friends_only",
      label: tOnboarding.visibilityFriendsOnly,
      desc: tOnboarding.visibilityFriendsOnlyDesc,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header copy */}
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      {/* Quick Dive gate */}
      {!hasQuickDive ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t.needQuickDiveTitle}
          </p>
          <p className="text-xs text-muted-foreground">{t.needQuickDiveDesc}</p>
          <Link
            href={`/${locale}/quickdive`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t.needQuickDiveCta} →
          </Link>
        </div>
      ) : (
        <>
          {/* Toggle row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <label
                htmlFor="companion-toggle"
                className="text-sm font-medium text-foreground"
              >
                {t.toggleLabel}
              </label>
              <p className="text-xs text-muted-foreground">
                {enabled ? t.toggleHelpEnabled : t.toggleHelpDisabled}
              </p>
              <p
                className="text-xs font-medium"
                aria-live="polite"
                style={{
                  color:
                    status === "saved"
                      ? "var(--color-emerald-600, #059669)"
                      : undefined,
                }}
              >
                {status === "loading"
                  ? enabled
                    ? t.statusDisabling
                    : t.statusEnabling
                  : enabled
                    ? t.statusEnabled
                    : t.statusDisabled}
              </p>
            </div>
            <Switch
              id="companion-toggle"
              checked={enabled}
              onCheckedChange={handleToggleClick}
              disabled={status === "loading"}
              aria-label={t.toggleLabel}
            />
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground/80 italic">
            {t.privacyNote}
          </p>

          {/* Profile summary + Edit (only when enabled and profile exists) */}
          {enabled && profile && !showEdit && (
            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {t.manageProfileTitle}
                </p>
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t.manageProfileEdit}
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">
                  {profile.displayName}
                </p>
                {profile.bio && (
                  <p className="text-muted-foreground text-xs whitespace-pre-line">
                    {profile.bio}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {profile.visibility === "discoverable"
                    ? tOnboarding.visibilityDiscoverable
                    : tOnboarding.visibilityFriendsOnly}
                </p>
              </div>
            </div>
          )}

          {/* Onboarding form */}
          {showOnboarding && (
            <CompanionForm
              kind="onboarding"
              t={tOnboarding}
              tCommon={t}
              displayName={displayName}
              setDisplayName={setDisplayName}
              bio={bio}
              setBio={setBio}
              visibility={visibility}
              setVisibility={setVisibility}
              visibilityOptions={visibilityOptions}
              status={status}
              onSubmit={handleOnboardingSubmit}
              onCancel={() => setShowOnboarding(false)}
            />
          )}

          {/* Edit form */}
          {showEdit && profile && (
            <CompanionForm
              kind="edit"
              t={tOnboarding}
              tCommon={t}
              displayName={displayName}
              setDisplayName={setDisplayName}
              bio={bio}
              setBio={setBio}
              visibility={visibility}
              setVisibility={setVisibility}
              visibilityOptions={visibilityOptions}
              status={status}
              onSubmit={handleEditSubmit}
              onCancel={() => setShowEdit(false)}
            />
          )}

          {/* Error / saved feedback */}
          {status === "error" && errorMsg && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}
          {status === "saved" && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t.manageProfileSaved}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Inline form sub-component (used for both onboarding and edit) ──────────

interface CompanionFormProps {
  kind: "onboarding" | "edit";
  t: CompanionToggleCardProps["tOnboarding"];
  tCommon: CompanionToggleCardProps["t"];
  displayName: string;
  setDisplayName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  visibility: CompanionVisibility;
  setVisibility: (v: CompanionVisibility) => void;
  visibilityOptions: Array<{
    value: CompanionVisibility;
    label: string;
    desc: string;
  }>;
  status: Status;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

function CompanionForm({
  kind,
  t,
  tCommon,
  displayName,
  setDisplayName,
  bio,
  setBio,
  visibility,
  setVisibility,
  visibilityOptions,
  status,
  onSubmit,
  onCancel,
}: CompanionFormProps) {
  const submitLabel =
    kind === "onboarding"
      ? status === "loading"
        ? t.submitting
        : t.submit
      : status === "loading"
        ? tCommon.manageProfileSaving
        : tCommon.manageProfileSave;
  const cancelLabel =
    kind === "onboarding" ? t.cancel : tCommon.manageProfileCancel;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card/50 p-4 space-y-4"
    >
      {kind === "onboarding" && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{t.heading}</p>
          <p className="text-xs text-muted-foreground">{t.intro}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="companion-display-name"
          className="text-xs font-medium text-foreground"
        >
          {t.displayNameLabel}
        </label>
        <Input
          id="companion-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t.displayNamePlaceholder}
          maxLength={40}
          required
          disabled={status === "loading"}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="companion-bio"
          className="flex items-center justify-between text-xs font-medium text-foreground"
        >
          <span>{t.bioLabel}</span>
          <span className="text-muted-foreground/70">
            {interpolate(t.bioCounter, { count: String(bio.length) })}
          </span>
        </label>
        <textarea
          id="companion-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          placeholder={t.bioPlaceholder}
          rows={3}
          disabled={status === "loading"}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          {t.visibilityLabel}
        </p>
        <div className="space-y-2">
          {visibilityOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                visibility === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="companion-visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
                disabled={status === "loading"}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={status === "loading" || !displayName.trim()}
          className="gap-1.5"
        >
          {status === "loading" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {submitLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={status === "loading"}
        >
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}
