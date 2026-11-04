"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Settings,
  Shield,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { useTheme } from "next-themes";
import type { HeaderUserInfo } from "./use-header-user";

interface AvatarPopoverProps {
  user: HeaderUserInfo;
  locale: string;
  getLocalizedPath: (path: string) => string;
  isActive: (path: string) => boolean;
}

export function AvatarPopover({
  user,
  locale,
  getLocalizedPath,
  isActive,
}: AvatarPopoverProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fallbackDict = getDictionaryClient(locale as "en" | "zh");
  const t = fallbackDict.nav;
  const logoutT = fallbackDict.logoutButton;
  const commonT = fallbackDict.common;
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await csrfFetch("/api/auth/logout", { method: "POST" });
      window.location.href = `/${locale}/`;
    } catch (error) {
      if (__DEV__) console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="header-trigger-btn flex items-center gap-1.5 px-2 min-h-[36px] rounded-full transition-all duration-200"
          aria-label={fallbackDict.a11y.userMenu}
        >
          <div className="w-7 h-7 rounded-full bg-[var(--md-sea-deep)] text-white flex items-center justify-center text-[11px] font-semibold ring-1 ring-white/25 shadow-sm">
            {user.name?.[0]?.toUpperCase() || fallbackDict.profile.explorer[0]}
          </div>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="header-dropdown w-52 p-0 overflow-hidden"
      >
        {/* User info */}
        <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
          <div className="text-[13px] font-medium text-foreground truncate">
            {user.name || fallbackDict.profile.explorer}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {user.email}
          </div>
        </div>

        {/* Links */}
        <div className="py-1">
          <Link
            href={getLocalizedPath("/dashboard")}
            className={`header-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors ${
              isActive("/dashboard") ? "text-foreground bg-white/[0.04]" : ""
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {t.dashboard}
          </Link>
          <Link
            href={getLocalizedPath("/settings")}
            className={`header-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors ${
              isActive("/settings") ? "text-foreground bg-white/[0.04]" : ""
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {t.settings}
          </Link>
          {user.isAdmin && (
            <Link
              href={getLocalizedPath("/admin")}
              className={`header-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors ${
                isActive("/admin") ? "text-foreground bg-white/[0.04]" : ""
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              {t.adminLabel}
            </Link>
          )}
        </div>

        {/* Theme */}
        <div className="border-t border-white/[0.06] px-3.5 py-2.5">
          {/* Theme row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sun className="w-3.5 h-3.5" />
              {commonT.theme}
            </div>
            <div className="flex items-center gap-0.5">
              {(
                [
                  { value: "light", Icon: Sun },
                  { value: "dark", Icon: Moon },
                  { value: "system", Icon: Monitor },
                ] as const
              ).map(({ value, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`p-1 rounded-md transition-colors ${
                    theme === value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-white/[0.06] py-1">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="header-dropdown-item flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium w-full hover:!text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {isLoggingOut ? logoutT.loggingOut : logoutT.logout}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
