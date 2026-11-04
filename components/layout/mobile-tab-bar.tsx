"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Search01Icon,
  File01Icon,
  Compass01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { hapticTap } from "@/lib/haptic";
import { useAuthStore } from "@/store/auth-store";

interface MobileTabBarProps {
  locale: Locale;
}

export function MobileTabBar({ locale }: MobileTabBarProps) {
  const pathname = usePathname();
  const t = getDictionaryClient(locale).nav;
  const userLevel = useAuthStore((s) => s.userLevel);

  const tabs = [
    {
      path: `/${locale}/dashboard`,
      icon: Home01Icon,
      label: t.home,
      minLevel: 0 as const,
    },
    {
      path: `/${locale}/explore`,
      icon: Search01Icon,
      label: t.explore,
      minLevel: 0 as const,
    },
    {
      path: `/${locale}/reports`,
      icon: File01Icon,
      label: t.reports,
      minLevel: 1 as const,
    },
    {
      path: `/${locale}/profile`,
      icon: UserCircleIcon,
      label: t.profile,
      minLevel: 2 as const,
    },
    {
      path: `/${locale}/coaching`,
      icon: Compass01Icon,
      label: t.aiCoach,
      minLevel: 2 as const,
    },
  ];

  return (
    <nav
      aria-label={t.mobileNavLabel}
      className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(8, 18, 32, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(148, 163, 184, 0.1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.path);
          const isLocked = userLevel < tab.minLevel;

          if (isLocked) {
            return (
              <span
                key={tab.path}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative opacity-25"
                style={{ minHeight: "56px" }}
                aria-disabled="true"
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  size={20}
                  strokeWidth={1.75}
                  style={{ color: "rgba(148,163,184,0.4)" }}
                />
                <span
                  className="text-[10px] tracking-[0.02em]"
                  style={{
                    color: "rgba(148,163,184,0.4)",
                    fontFamily: "var(--font-body, system-ui, sans-serif)",
                  }}
                >
                  {tab.label}
                </span>
              </span>
            );
          }

          return (
            <Link
              key={tab.path}
              href={tab.path}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  hapticTap();
                } else {
                  hapticTap();
                }
              }}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-transform duration-100 active:scale-[0.96]"
              style={{ minHeight: "56px" }}
            >
              <HugeiconsIcon
                icon={tab.icon}
                size={20}
                strokeWidth={1.75}
                className="transition-colors duration-200"
                style={{
                  color: isActive ? "#93C5FD" : "rgba(148,163,184,0.6)",
                }}
              />
              <span
                className="text-[10px] tracking-[0.02em] transition-colors duration-200"
                style={{
                  color: isActive ? "#93C5FD" : "rgba(148,163,184,0.6)",
                  fontFamily: "var(--font-body, system-ui, sans-serif)",
                }}
              >
                {tab.label}
              </span>
              {/* Active indicator — glow dot */}
              {isActive && (
                <span
                  className="absolute bottom-[6px] left-1/2 -translate-x-1/2"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(147, 197, 253, 0.7)",
                    boxShadow:
                      "0 0 8px rgba(147,197,253,0.4), 0 0 16px rgba(147,197,253,0.15)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
