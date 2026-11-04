"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useRef, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Shield, Zap, LogOut, Sun } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  File01Icon,
  UserCircleIcon,
  Compass01Icon,
  DashboardSquare01Icon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import { Lock as LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth-store";
import type { HeaderUserInfo } from "./use-header-user";

interface MobileSheetMenuProps {
  locale: string;
  variant: "brand" | "app";
  user: HeaderUserInfo | null;
  hasInProgressSession: boolean;
  latestReportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSheetMenu({
  locale,
  variant: _variant,
  user,
  hasInProgressSession,
  latestReportId,
  open,
  onOpenChange,
}: MobileSheetMenuProps) {
  const logoutRef = useRef(false);
  const userLevel = useAuthStore((s) => s.userLevel);
  const pathname = usePathname();
  const router = useRouter();
  const fallbackDict = getDictionaryClient(locale as "en" | "zh");
  const t = fallbackDict.nav;
  const a11yT = fallbackDict.a11y;
  const coachingT = fallbackDict.coaching;

  const getLocalizedPath = (path: string) => `/${locale}${path}`;
  const isActive = (path: string) =>
    pathname === getLocalizedPath(path) || pathname === path;

  const deepdivePath = `/${locale}/deepdive`;
  const quickdivePath = `/${locale}/quickdive`;
  const explorePath = `/${locale}/explore`;
  const isOnDivePage =
    pathname?.startsWith(deepdivePath) ||
    pathname?.startsWith(quickdivePath) ||
    pathname?.startsWith(explorePath);

  const handleMenuLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    router.push(href);
    window.setTimeout(() => onOpenChange(false), 100);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden w-11 h-11 rounded-full border border-border/50 bg-background/60 hover:bg-accent flex items-center justify-center transition-all duration-200"
          aria-label={a11yT.openMenu}
        >
          <div className="flex flex-col gap-[4px]">
            <span className="w-[16px] h-[1.5px] bg-foreground/80 rounded-full" />
            <span className="w-[12px] h-[1.5px] bg-foreground/80 rounded-full" />
          </div>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-80 bg-background border-border p-0 flex flex-col h-full"
        aria-label={a11yT.mainMenu}
        closeLabel={a11yT.close}
      >
        <SheetHeader className="p-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="Deep Dive"
              width={24}
              height={24}
              priority
            />
            <span className="text-[18px] font-semibold text-foreground tracking-tight">
              Deep Dive
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {a11yT.mainMenu}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable middle content */}
        <div className="flex-1 overflow-y-auto">
          {/* User info in drawer */}
          {user && (
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-medium text-foreground border border-primary/10">
                  {user.name?.[0] || fallbackDict.profile.explorer[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {user.name || fallbackDict.profile.explorer}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          {!isOnDivePage && (
            <div className="px-4 py-4 border-b border-border">
              <Link
                href={`/${locale}/explore`}
                onClick={handleMenuLinkClick}
                className="header-cta-primary flex min-h-11 items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-white"
              >
                <Zap className="w-4 h-4" />
                {hasInProgressSession
                  ? fallbackDict.landing.headerCtaContinue
                  : latestReportId
                    ? fallbackDict.landing.headerCtaContinueExploring
                    : fallbackDict.landing.headerCta}
              </Link>
            </div>
          )}

          {/* Nav links */}
          <nav className="px-3 py-4 space-y-0.5">
            {/* Home link — always visible */}
            <Link
              href={getLocalizedPath("/")}
              onClick={handleMenuLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                isActive("/")
                  ? "text-foreground font-medium bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <HugeiconsIcon
                icon={Home01Icon}
                size={20}
                strokeWidth={1.75}
                className={`shrink-0 ${isActive("/") ? "text-foreground" : "text-muted-foreground"}`}
              />
              {t.home}
            </Link>

            {/* Feature nav links — visible to all users */}
            {user && userLevel < 1 ? (
              <span
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm opacity-35 cursor-not-allowed"
                aria-disabled="true"
              >
                <HugeiconsIcon
                  icon={File01Icon}
                  size={20}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted-foreground"
                />
                {t.reports}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/reports" : "/login")}
                onClick={handleMenuLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive("/reports")
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <HugeiconsIcon
                  icon={File01Icon}
                  size={20}
                  strokeWidth={1.75}
                  className={`shrink-0 ${isActive("/reports") ? "text-foreground" : "text-muted-foreground"}`}
                />
                {t.reports}
              </Link>
            )}
            {user && userLevel < 2 ? (
              <span
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm opacity-35 cursor-not-allowed"
                aria-disabled="true"
              >
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  size={20}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted-foreground"
                />
                {t.profile}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/profile" : "/login")}
                onClick={handleMenuLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive("/profile")
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  size={20}
                  strokeWidth={1.75}
                  className={`shrink-0 ${isActive("/profile") ? "text-foreground" : "text-muted-foreground"}`}
                />
                {t.profile}
              </Link>
            )}
            {user && userLevel < 2 ? (
              <span
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm opacity-35 cursor-not-allowed"
                aria-disabled="true"
              >
                <HugeiconsIcon
                  icon={Compass01Icon}
                  size={20}
                  strokeWidth={1.75}
                  className="shrink-0 text-muted-foreground"
                />
                {(t as Record<string, string>).aiCoach || coachingT.navLabel}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/coaching" : "/login")}
                onClick={handleMenuLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive("/coaching")
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <HugeiconsIcon
                  icon={Compass01Icon}
                  size={20}
                  strokeWidth={1.75}
                  className={`shrink-0 ${isActive("/coaching") ? "text-foreground" : "text-muted-foreground"}`}
                />
                {(t as Record<string, string>).aiCoach || coachingT.navLabel}
              </Link>
            )}

            {/* Action Hub — gated on report existence (latestReportId), not
                userLevel. Locked entry still links through so users see the
                explanatory PrerequisiteGate rather than a dead button. */}
            {(() => {
              const actionHubUnlocked = !user || !!latestReportId;
              const lockedLabel =
                fallbackDict.journeyGate?.nav?.locked ?? "Locked";
              const actionHubLabel = fallbackDict.actionHub.title;
              return (
                <Link
                  href={getLocalizedPath(user ? "/action-hub" : "/login")}
                  onClick={handleMenuLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive("/action-hub")
                      ? "text-foreground font-medium bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  } ${actionHubUnlocked ? "" : "opacity-55"}`}
                  aria-label={
                    actionHubUnlocked
                      ? actionHubLabel
                      : `${actionHubLabel} — ${lockedLabel}`
                  }
                >
                  <HugeiconsIcon
                    icon={Target01Icon}
                    size={20}
                    strokeWidth={1.75}
                    className={`shrink-0 ${
                      isActive("/action-hub")
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="inline-flex items-center gap-1.5">
                    {actionHubLabel}
                    {!actionHubUnlocked && (
                      <LockIcon className="size-3 opacity-60" aria-hidden />
                    )}
                  </span>
                </Link>
              );
            })()}

            {/* Utility links — dashboard, settings, admin */}
            {user && (
              <>
                <Link
                  href={getLocalizedPath("/dashboard")}
                  onClick={handleMenuLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive("/dashboard")
                      ? "text-foreground font-medium bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <HugeiconsIcon
                    icon={DashboardSquare01Icon}
                    size={20}
                    strokeWidth={1.75}
                    className={`shrink-0 ${isActive("/dashboard") ? "text-foreground" : "text-muted-foreground"}`}
                  />
                  {t.dashboard}
                </Link>
                <Link
                  href={getLocalizedPath("/settings")}
                  onClick={handleMenuLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive("/settings")
                      ? "text-foreground font-medium bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Settings
                    className={`h-5 w-5 ${isActive("/settings") ? "text-foreground" : "text-muted-foreground"}`}
                  />
                  {t.settings || t.privacy}
                </Link>
                {user.isAdmin && (
                  <Link
                    href={getLocalizedPath("/admin")}
                    onClick={handleMenuLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                      isActive("/admin")
                        ? "text-foreground font-medium bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Shield
                      className={`h-5 w-5 ${isActive("/admin") ? "text-foreground" : "text-muted-foreground"}`}
                    />
                    {t.adminLabel}
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Theme switcher */}
          <div className="px-6 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <ThemeToggle className="theme-toggle-touch" />
            </div>
          </div>
        </div>
        {/* end scrollable middle content */}

        {/* Bottom actions */}
        <div className="shrink-0 px-6 py-4 border-t border-border">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (logoutRef.current) return;
                logoutRef.current = true;
                try {
                  await csrfFetch("/api/auth/logout", { method: "POST" });
                  window.location.href = `/${locale}/`;
                } catch (error) {
                  logoutRef.current = false;
                  if (__DEV__) console.error("Logout failed:", error);
                }
              }}
              className="min-h-11 w-full justify-start gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/8 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              {fallbackDict.logoutButton.logout}
            </Button>
          ) : (
            <Button asChild className="w-full rounded-xl nav-btn-hover">
              <Link
                href={getLocalizedPath("/login")}
                onClick={handleMenuLinkClick}
              >
                {t.signIn}
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
