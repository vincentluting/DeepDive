"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ChevronDown,
  User,
  Mail,
  Calendar,
  LogOut,
  Shield,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Palette,
  Ticket,
  FlaskConical,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/theme-toggle";
import { DataExportCard } from "@/components/settings/data-export-card";
import { AccountDeletionCard } from "@/components/settings/account-deletion-card";
import { InviteCodeCard } from "@/components/settings/invite-code-card";
import { CareerInputsCard } from "@/components/settings/career-inputs-card";
import { CompanionToggleCard } from "@/components/companions/companion-toggle-card";
import type { CompanionProfile } from "@/lib/types/companion";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { useActiveSection } from "@/lib/hooks/use-active-section";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { toDateLocale } from "@/lib/i18n/config";

interface SettingsPageClientProps {
  userName: string | null;
  userEmail: string;
  userCreatedAt: string;
  userCohort: string | null;
  /** True when the invite-code section should render: user is either
   * uncohorted (first claim) or in an active non-research cohort (upgrade
   * to thesis). Research-cohort, unknown, or retired-cohort users have
   * this set to false — the API would reject their claim anyway, so the
   * UI shouldn't bait a guaranteed failure. */
  canShowInviteSection: boolean;
  reportCount: number;
  insightCount: number;
  archetypeName: string | null;
  locale: Locale;
  dictionary: Dictionary;
  /** True if cohort entitlement allows Archetype Companion (typically beta_2026 only). */
  showCompanion: boolean;
  /** Per-user opt-in flag (User.socialEnabled). */
  companionEnabled: boolean;
  /** Existing companion profile, if user has onboarded. */
  companionProfile: CompanionProfile | null;
  /** Whether user has completed Quick Dive (precondition for Companion onboarding). */
  hasQuickDive: boolean;
  /** Career Inputs card data — null assessmentId means user hasn't done
   *  Quick Dive yet, so the row shows an empty state with a CTA. */
  careerInputs: {
    assessmentId: string | null;
    canUpload: boolean;
    currentResume: { fileName: string | null; uploadedAt: string } | null;
  };
}

// Helper to safely convert string | string[] to string
function str(val: string | string[] | undefined): string {
  if (!val) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}

export function SettingsPageClient({
  userName,
  userEmail,
  userCreatedAt,
  userCohort,
  canShowInviteSection,
  reportCount,
  insightCount,
  archetypeName,
  locale,
  dictionary,
  showCompanion,
  companionEnabled,
  companionProfile,
  hasQuickDive,
  careerInputs,
}: SettingsPageClientProps) {
  const t = dictionary.settingsPage;
  const privacyT = dictionary.privacy;
  const profileT = dictionary.profile;
  const companionT = dictionary.companionSettings;
  const companionOnboardingT = dictionary.companionOnboarding;
  const careerInputsT = dictionary.careerInputs;

  const [accountOpen, setAccountOpen] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteExpanded, setDeleteExpanded] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || "");
  const [currentName, setCurrentName] = useState(userName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  // Which section is in view — drives the desktop anchor-nav highlight.
  // Section ids in document order; conditional sections are omitted when
  // absent so the scrollspy never points at a missing anchor. Changing this
  // set re-arms the shared observer.
  const sectionIds = [
    "account",
    "career-inputs",
    ...(canShowInviteSection ? ["invite"] : []),
    ...(showCompanion ? ["companion"] : []),
    "appearance",
    "privacy",
  ];
  const activeSection =
    useActiveSection(sectionIds, "-20% 0px -70% 0px") ?? "account";

  const joinedDate = new Date(userCreatedAt).toLocaleDateString(
    toDateLocale(locale),
    {
      year: "numeric",
      month: "long",
    },
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await csrfFetch("/api/auth/logout", { method: "POST" });
      // Hard navigation to fully clear client-side cache and state
      window.location.href = `/${locale}/`;
    } catch {
      setIsLoggingOut(false);
    }
  };

  const displayName =
    currentName || (profileT.explorer as string) || "Explorer";

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === currentName) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    setNameStatus("idle");
    try {
      const res = await csrfFetch("/api/user/update-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setCurrentName(trimmed);
      setIsEditingName(false);
      setNameStatus("saved");
      setTimeout(() => setNameStatus("idle"), 2000);
    } catch {
      setNameStatus("error");
      setTimeout(() => setNameStatus("idle"), 3000);
    } finally {
      setIsSavingName(false);
    }
  };

  const navLinkProps = (section: string) => ({
    className: `block -ml-px border-l-2 px-3 py-1.5 transition-colors ${
      activeSection === section
        ? "border-primary text-primary font-medium"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`,
    "aria-current": (activeSection === section ? "location" : undefined) as
      | "location"
      | undefined,
  });

  return (
    <div className="md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 animate-fade-in-up">
      {/* Section nav — desktop only. Labelled by the page <h1> (zero new i18n);
          anchors reuse each section's existing title key. Collapsible sections
          (account/privacy) also open on click. */}
      <nav
        aria-labelledby="settings-title"
        className="hidden md:block sticky top-20 self-start"
      >
        <ul className="space-y-0.5 text-sm border-l border-border">
          <li>
            <a
              href="#account"
              onClick={() => setAccountOpen(true)}
              {...navLinkProps("account")}
            >
              {t.accountSection}
            </a>
          </li>
          <li>
            <a href="#career-inputs" {...navLinkProps("career-inputs")}>
              {careerInputsT.sectionTitle}
            </a>
          </li>
          {canShowInviteSection && (
            <li>
              <a href="#invite" {...navLinkProps("invite")}>
                {userCohort
                  ? str(t.inviteCodeSwitchSection)
                  : str(t.inviteCodeSection)}
              </a>
            </li>
          )}
          {showCompanion && (
            <li>
              <a href="#companion" {...navLinkProps("companion")}>
                {companionT.title}
              </a>
            </li>
          )}
          <li>
            <a href="#appearance" {...navLinkProps("appearance")}>
              {t.appearance}
            </a>
          </li>
          <li>
            <a
              href="#privacy"
              onClick={() => setPrivacyOpen(true)}
              {...navLinkProps("privacy")}
            >
              {t.dataPrivacySection}
            </a>
          </li>
        </ul>
      </nav>

      {/* Content column */}
      <div className="space-y-4 min-w-0">
        {/* Page title */}
        <div className="mb-6">
          <h1
            id="settings-title"
            className="text-2xl font-bold text-foreground tracking-tight"
          >
            {t.pageTitle}
          </h1>
        </div>

        {/* ─── Section 1: Account ─── */}
        <div
          id="account"
          className="scroll-mt-20 rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden"
        >
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/40 transition-colors"
            aria-expanded={accountOpen}
          >
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-primary" />
              <span className="text-base font-semibold text-foreground">
                {t.accountSection}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
            />
          </button>

          {accountOpen && (
            <div className="px-6 pb-6 space-y-5 border-t border-border">
              {/* Display Name — editable */}
              <div className="pt-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t.displayName}
                  </p>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") {
                            setNameInput(currentName || "");
                            setIsEditingName(false);
                          }
                        }}
                        maxLength={50}
                        autoFocus
                        className="flex-1 min-w-0 text-sm font-medium text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="inline-flex items-center justify-center min-h-11 min-w-11 -my-2 rounded-md hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                        aria-label={str(t.saveName)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNameInput(currentName || "");
                          setIsEditingName(false);
                        }}
                        className="inline-flex items-center justify-center min-h-11 min-w-11 -my-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        aria-label={str(t.cancelEdit)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <button
                        onClick={() => {
                          setNameInput(currentName || "");
                          setIsEditingName(true);
                        }}
                        className="inline-flex items-center justify-center min-h-11 min-w-11 -my-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={str(t.editName)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {nameStatus === "saved" && (
                        <span className="text-xs text-green-500">
                          {str(t.nameSaved)}
                        </span>
                      )}
                      {nameStatus === "error" && (
                        <span className="text-xs text-destructive">
                          {str(t.nameSaveFailed)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t.email}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t.memberSince}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {joinedDate}
                  </p>
                </div>
              </div>

              {/* Sign Out */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="gap-2 text-muted-foreground hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut
                    ? (dictionary.logoutButton?.loggingOut ?? t.signOut)
                    : t.signOut}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Section: Career Inputs ───
          Always rendered. Internal state handles:
            - no assessment yet → empty state + Quick Dive CTA
            - cohort not entitled → row visible, action disabled
            - active resume present → Replace / Remove
            - no resume → Upload CTA
          Future LinkedIn / portfolio rows slot in alongside resume.
      */}
        <div id="career-inputs" className="scroll-mt-20">
          <CareerInputsCard
            locale={locale}
            assessmentId={careerInputs.assessmentId}
            canUpload={careerInputs.canUpload}
            initialCurrentResume={careerInputs.currentResume}
            t={{
              sectionTitle: careerInputsT.sectionTitle,
              sectionDescription: careerInputsT.sectionDescription,
              resumeLabel: careerInputsT.resumeLabel,
              noResumeHelper: careerInputsT.noResumeHelper,
              activeStateUploadedAt: careerInputsT.activeStateUploadedAt,
              uploadCta: careerInputsT.uploadCta,
              replaceCta: careerInputsT.replaceCta,
              removeCta: careerInputsT.removeCta,
              removeConfirmTitle: careerInputsT.removeConfirmTitle,
              removeConfirmBody: careerInputsT.removeConfirmBody,
              removeConfirmConfirm: careerInputsT.removeConfirmConfirm,
              removeConfirmCancel: careerInputsT.removeConfirmCancel,
              removeSuccessToast: careerInputsT.removeSuccessToast,
              removeErrorToast: careerInputsT.removeErrorToast,
              gatedNotice: careerInputsT.gatedNotice,
              noAssessmentEmpty: careerInputsT.noAssessmentEmpty,
              noAssessmentCta: careerInputsT.noAssessmentCta,
              freshnessTitle: careerInputsT.freshnessTitle,
              freshnessBody: careerInputsT.freshnessBody,
              regenerateNowCta: careerInputsT.regenerateNowCta,
              regenerateLaterCta: careerInputsT.regenerateLaterCta,
              uploadDialogClose: careerInputsT.uploadDialogClose,
            }}
          />
        </div>

        {/* ─── Section: Invite Code ───
          Visibility decided server-side: null cohort (claim) or active
          non-research cohort (upgrade, e.g. beta_2026 → thesis_2026).
          Research / unknown / retired cohorts are hidden — the API would
          reject those claims anyway.
      */}
        {canShowInviteSection && (
          <div
            id="invite"
            className="scroll-mt-20 rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden"
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-2.5 mb-3">
                {userCohort ? (
                  <FlaskConical className="h-4 w-4 text-primary" />
                ) : (
                  <Ticket className="h-4 w-4 text-primary" />
                )}
                <span className="text-base font-semibold text-foreground">
                  {userCohort
                    ? str(t.inviteCodeSwitchSection)
                    : str(t.inviteCodeSection)}
                </span>
              </div>
              <InviteCodeCard
                locale={locale}
                t={
                  userCohort
                    ? {
                        title: str(t.inviteCodeSwitchSection),
                        description: str(t.inviteCodeSwitchDesc),
                        placeholder: str(t.inviteCodeSwitchPlaceholder),
                        submit: str(t.inviteCodeSwitchSubmit),
                        submitting: str(t.inviteCodeSwitchSubmitting),
                        success: str(t.inviteCodeSwitchSuccess),
                        errorInvalid: str(t.inviteCodeSwitchErrorInvalid),
                        errorAlreadyEnrolled: str(
                          t.inviteCodeSwitchErrorAlreadyEnrolled,
                        ),
                        errorGeneric: str(t.inviteCodeSwitchErrorGeneric),
                      }
                    : {
                        title: str(t.inviteCodeSection),
                        description: str(t.inviteCodeDesc),
                        placeholder: str(t.inviteCodePlaceholder),
                        submit: str(t.inviteCodeSubmit),
                        submitting: str(t.inviteCodeSubmitting),
                        success: str(t.inviteCodeSuccess),
                        errorInvalid: str(t.inviteCodeErrorInvalid),
                        errorAlreadyEnrolled: str(
                          t.inviteCodeErrorAlreadyEnrolled,
                        ),
                        errorGeneric: str(t.inviteCodeErrorGeneric),
                      }
                }
              />
            </div>
          </div>
        )}

        {/* ─── Section: Archetype Companion (gated by cohort entitlement) ─── */}
        {showCompanion && (
          <div
            id="companion"
            className="scroll-mt-20 rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden"
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-2.5 mb-3">
                <User className="h-4 w-4 text-primary" />
                <span className="text-base font-semibold text-foreground">
                  {companionT.title}
                </span>
              </div>
              <CompanionToggleCard
                initialEnabled={companionEnabled}
                initialProfile={companionProfile}
                hasQuickDive={hasQuickDive}
                locale={locale}
                t={{
                  title: companionT.title,
                  subtitle: companionT.subtitle,
                  description: companionT.description,
                  privacyNote: companionT.privacyNote,
                  toggleLabel: companionT.toggleLabel,
                  toggleHelpEnabled: companionT.toggleHelpEnabled,
                  toggleHelpDisabled: companionT.toggleHelpDisabled,
                  statusEnabled: companionT.statusEnabled,
                  statusDisabled: companionT.statusDisabled,
                  statusEnabling: companionT.statusEnabling,
                  statusDisabling: companionT.statusDisabling,
                  needQuickDiveTitle: companionT.needQuickDiveTitle,
                  needQuickDiveDesc: companionT.needQuickDiveDesc,
                  needQuickDiveCta: companionT.needQuickDiveCta,
                  errorGeneric: companionT.errorGeneric,
                  manageProfileTitle: companionT.manageProfileTitle,
                  manageProfileEdit: companionT.manageProfileEdit,
                  manageProfileSave: companionT.manageProfileSave,
                  manageProfileSaving: companionT.manageProfileSaving,
                  manageProfileCancel: companionT.manageProfileCancel,
                  manageProfileSaved: companionT.manageProfileSaved,
                }}
                tOnboarding={{
                  heading: companionOnboardingT.heading,
                  intro: companionOnboardingT.intro,
                  displayNameLabel: companionOnboardingT.displayNameLabel,
                  displayNamePlaceholder:
                    companionOnboardingT.displayNamePlaceholder,
                  bioLabel: companionOnboardingT.bioLabel,
                  bioPlaceholder: companionOnboardingT.bioPlaceholder,
                  bioCounter: companionOnboardingT.bioCounter,
                  visibilityLabel: companionOnboardingT.visibilityLabel,
                  visibilityDiscoverable:
                    companionOnboardingT.visibilityDiscoverable,
                  visibilityDiscoverableDesc:
                    companionOnboardingT.visibilityDiscoverableDesc,
                  visibilityFriendsOnly:
                    companionOnboardingT.visibilityFriendsOnly,
                  visibilityFriendsOnlyDesc:
                    companionOnboardingT.visibilityFriendsOnlyDesc,
                  submit: companionOnboardingT.submit,
                  submitting: companionOnboardingT.submitting,
                  cancel: companionOnboardingT.cancel,
                }}
              />
            </div>
          </div>
        )}

        {/* ─── Section 2: Appearance ─── */}
        <div
          id="appearance"
          className="scroll-mt-20 rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden"
        >
          <div className="px-6 py-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-base font-semibold text-foreground">
                {t.appearance}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t.appearanceDesc}
            </p>
            <ThemeSelector
              t={{
                light: t.themeLight,
                dark: t.themeDark,
                system: t.themeSystem,
              }}
            />
          </div>
        </div>

        {/* ─── Section 3: Data & Privacy ─── */}
        <div
          id="privacy"
          className="scroll-mt-20 rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden"
        >
          <button
            onClick={() => setPrivacyOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/40 transition-colors"
            aria-expanded={privacyOpen}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-base font-semibold text-foreground">
                {t.dataPrivacySection}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${privacyOpen ? "rotate-180" : ""}`}
            />
          </button>

          {privacyOpen && (
            <div className="border-t border-border">
              {/* Overview text */}
              <div className="px-6 py-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.dataPrivacyDesc}
                </p>
              </div>

              {/* Export Data */}
              <div className="px-6 pb-5">
                <DataExportCard
                  t={{
                    exportTitle: t.exportData,
                    exportDesc: t.exportDataDesc,
                    exportButton: str(privacyT.exportButton),
                    exportHelperText: t.exportDataDesc,
                    exporting: str(privacyT.exporting),
                    exportSuccess: str(privacyT.exportSuccess),
                    exportFailed: str(privacyT.exportFailed),
                  }}
                />
              </div>

              {/* Delete Account — nested collapsible */}
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
                  <button
                    onClick={() => {
                      setDeleteExpanded((v) => !v);
                      if (deleteExpanded) setDeleteConfirmed(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-destructive/8 transition-colors"
                    aria-expanded={deleteExpanded}
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        {t.deleteAccount}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-destructive/60 transition-transform duration-200 ${deleteExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {deleteExpanded && !deleteConfirmed && (
                    <div className="px-4 pb-4 border-t border-destructive/15 space-y-4 pt-4">
                      {/* Loss list */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-3">
                          {t.youWillLose}
                        </p>
                        <ul className="space-y-2">
                          {archetypeName && (
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                              {interpolate(t.lossArchetype, {
                                name: archetypeName,
                              })}
                            </li>
                          )}
                          {insightCount > 0 && (
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                              {interpolate(t.lossInsights, {
                                count: String(insightCount),
                              })}
                            </li>
                          )}
                          {reportCount > 0 && (
                            <li className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                              {interpolate(t.lossReports, {
                                count: String(reportCount),
                              })}
                            </li>
                          )}
                          <li className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                            {t.lossProfile}
                          </li>
                        </ul>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <p className="text-xs text-destructive font-medium">
                          {t.lossWarning}
                        </p>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setDeleteConfirmed(true)}
                      >
                        {t.confirmDelete}
                      </Button>
                    </div>
                  )}

                  {deleteExpanded && deleteConfirmed && (
                    <div className="px-4 pb-4 border-t border-destructive/15 pt-4">
                      <AccountDeletionCard
                        t={{
                          deleteTitle: str(privacyT.deleteTitle),
                          deleteDesc: str(privacyT.deleteDesc),
                          deleteButton: str(privacyT.deleteButton),
                          deleteWarning: str(privacyT.deleteWarning),
                          deleteSuccess: str(privacyT.deleteSuccess),
                          deleteFailed: str(privacyT.deleteFailed),
                          coolingPeriod: str(privacyT.coolingPeriod),
                          coolingPeriodDesc: str(privacyT.coolingPeriodDesc),
                          deleteStepInfoTitle: str(
                            privacyT.deleteStepInfoTitle,
                          ),
                          deleteStepInfoWarning: str(
                            privacyT.deleteStepInfoWarning,
                          ),
                          deleteStepInfoItems:
                            privacyT.deleteStepInfoItems as string[],
                          deleteStepInfoRetention: str(
                            privacyT.deleteStepInfoRetention,
                          ),
                          deleteStepVerifyTitle: str(
                            privacyT.deleteStepVerifyTitle,
                          ),
                          deleteStepVerifyDesc: str(
                            privacyT.deleteStepVerifyDesc,
                          ),
                          deleteStepVerifyTypeLabel: str(
                            privacyT.deleteStepVerifyTypeLabel,
                          ),
                          deleteStepVerifyTypeWord: str(
                            privacyT.deleteStepVerifyTypeWord,
                          ),
                          deleteStepVerifyPasswordLabel: str(
                            privacyT.deleteStepVerifyPasswordLabel,
                          ),
                          deleteStepVerifyPasswordPlaceholder: str(
                            privacyT.deleteStepVerifyPasswordPlaceholder,
                          ),
                          deleteStepVerifyTypeError: str(
                            privacyT.deleteStepVerifyTypeError,
                          ),
                          deleteStepVerifyPasswordError: str(
                            privacyT.deleteStepVerifyPasswordError,
                          ),
                          deleteStepVerifyGenericError: str(
                            privacyT.deleteStepVerifyGenericError,
                          ),
                          deleteStepFinalTitle: str(
                            privacyT.deleteStepFinalTitle,
                          ),
                          deleteStepFinalDesc: str(
                            privacyT.deleteStepFinalDesc,
                          ),
                          deleteStepNext: str(privacyT.deleteStepNext),
                          deleteStepBack: str(privacyT.deleteStepBack),
                          deleteStepCancel: str(privacyT.deleteStepCancel),
                          deleteStepConfirmDelete: str(
                            privacyT.deleteStepConfirmDelete,
                          ),
                          deleteStepOf: str(privacyT.deleteStepOf),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Policy link */}
              <div className="px-6 pb-5 border-t border-border pt-4">
                <Link
                  href={`/${locale}/legal/privacy`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {t.legalInfo}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
