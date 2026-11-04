"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock as LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { HeaderShell } from "./header-shell";
import { useHeaderUser } from "./_shared/use-header-user";
import { AvatarPopover } from "./_shared/avatar-popover";
import { PrefsPopover } from "./_shared/prefs-popover";
import { ExploreCTA } from "./_shared/explore-cta";
import { MobileSheetMenu } from "./_shared/mobile-sheet-menu";

interface BrandHeaderProps {
  locale: Locale;
}

export function BrandHeader({ locale }: BrandHeaderProps) {
  const { user, isLoading, hasInProgressSession, latestReportId, userLevel } =
    useHeaderUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const dict = getDictionaryClient(locale);
  const t = dict.nav;
  const a11yT = dict.a11y;

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const coachingT = dict.coaching;
  const getLocalizedPath = (path: string) => `/${locale}${path}`;
  const isActive = (path: string) =>
    pathname === getLocalizedPath(path) || pathname === path;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-white focus-visible:rounded-lg pointer-events-auto"
      >
        {a11yT.skipToContent}
      </a>
      <HeaderShell className="header-on-dark">
        {/* Left — Logo + Nav */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0 min-w-0">
          <Link
            href={getLocalizedPath("/")}
            className="header-logo-link flex items-center gap-2 group shrink-0"
            aria-label="Deep Dive"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={26}
              height={26}
              priority
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-[16px] font-semibold text-foreground tracking-[-0.01em] hidden sm:block">
              Deep Dive
            </span>
          </Link>

          <div className="hidden lg:block w-px h-5 bg-border/20" />

          <nav className="hidden lg:flex items-center gap-0.5">
            <Link
              href={getLocalizedPath("/explore")}
              className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap ${isActive("/explore") ? "header-nav-link-active" : ""}`}
            >
              {t.explore}
            </Link>
            {/* Pricing — hidden until user research on willingness-to-pay is complete */}
            {/* <Link
              href={getLocalizedPath("/pricing")}
              className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap ${isActive("/pricing") ? "header-nav-link-active" : ""}`}
            >
              {(t as Record<string, string>).pricing || "Pricing"}
            </Link> */}

            {user && userLevel < 2 ? (
              <span
                className="header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap opacity-55 cursor-not-allowed"
                aria-disabled="true"
              >
                {t.profile}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/profile" : "/login")}
                className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap ${isActive("/profile") ? "header-nav-link-active" : ""}`}
              >
                {t.profile}
              </Link>
            )}
            {user && userLevel < 1 ? (
              <span
                className="header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap opacity-55 cursor-not-allowed"
                aria-disabled="true"
              >
                {t.reports}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/reports" : "/login")}
                className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap ${isActive("/reports") ? "header-nav-link-active" : ""}`}
              >
                {t.reports}
              </Link>
            )}
            {/* Action Hub — gated on report existence, not userLevel.
                See app-header.tsx for the same pattern + rationale. */}
            {(() => {
              const actionHubUnlocked = !user || !!latestReportId;
              const lockedLabel = dict.journeyGate?.nav?.locked ?? "Locked";
              return (
                <Link
                  href={getLocalizedPath(user ? "/action-hub" : "/login")}
                  className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isActive("/action-hub") ? "header-nav-link-active" : ""
                  } ${actionHubUnlocked ? "" : "opacity-55"}`}
                  aria-label={
                    actionHubUnlocked
                      ? dict.actionHub.title
                      : `${dict.actionHub.title} — ${lockedLabel}`
                  }
                >
                  {dict.actionHub.title}
                  {!actionHubUnlocked && (
                    <LockIcon className="size-3 opacity-60" aria-hidden />
                  )}
                </Link>
              );
            })()}
            {user && userLevel < 2 ? (
              <span
                className="header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap opacity-55 cursor-not-allowed"
                aria-disabled="true"
              >
                {(t as Record<string, string>).aiCoach || coachingT.navLabel}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(user ? "/coaching" : "/login")}
                className={`header-nav-link relative text-[13.5px] font-medium tracking-[0.01em] px-3 py-1.5 whitespace-nowrap ${isActive("/coaching") ? "header-nav-link-active" : ""}`}
              >
                {(t as Record<string, string>).aiCoach || coachingT.navLabel}
              </Link>
            )}
          </nav>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-4" />

        {/* Right — Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {mounted && (
            <MobileSheetMenu
              locale={locale}
              variant="brand"
              user={user}
              hasInProgressSession={hasInProgressSession}
              latestReportId={latestReportId}
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            />
          )}

          {isLoading ? (
            <div className="hidden lg:block w-7 h-7 bg-secondary/50 animate-pulse rounded-full" />
          ) : user ? (
            <div className="hidden lg:flex items-center gap-2.5">
              <AvatarPopover
                user={user}
                locale={locale}
                getLocalizedPath={getLocalizedPath}
                isActive={isActive}
              />
              <ExploreCTA
                locale={locale}
                hasInProgressSession={hasInProgressSession}
                hasReport={!!latestReportId}
              />
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2.5">
              <PrefsPopover locale={locale} />
              <Button
                variant="outline"
                size="sm"
                asChild
                className="header-sign-in-btn rounded-full text-[13px] h-8 px-4 font-medium"
              >
                <Link href={getLocalizedPath("/login")}>{t.signIn}</Link>
              </Button>
              <ExploreCTA
                locale={locale}
                hasInProgressSession={hasInProgressSession}
                hasReport={!!latestReportId}
              />
            </div>
          )}
        </div>
      </HeaderShell>
    </>
  );
}
