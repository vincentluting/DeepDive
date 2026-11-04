"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun, Monitor } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { type Locale, locales, defaultLocale } from "@/lib/i18n/config";

type ThemeOption = "light" | "dark" | "system";

/**
 * Compact 3-way theme toggle: Light / Dark / System.
 * Matches the lang-toggle visual style.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  // Resolve the full locale (all 11) from the path, not just zh/en — otherwise
  // de/ja/… fall back to English aria-labels even though translations exist (#127).
  const locale: Locale =
    locales.find((l) => pathname?.startsWith(`/${l}`)) ?? defaultLocale;
  const a11y = getDictionaryClient(locale).a11y;

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`theme-toggle-track ${className ?? ""}`}>
        <div className="theme-toggle-option w-[30px] h-[26px]" />
        <div className="theme-toggle-option w-[30px] h-[26px]" />
        <div className="theme-toggle-option w-[30px] h-[26px]" />
      </div>
    );
  }

  const options: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: a11y.themeLightMode },
    { value: "dark", icon: Moon, label: a11y.themeDarkMode },
    { value: "system", icon: Monitor, label: a11y.themeSystem },
  ];

  const activeIndex = options.findIndex((o) => o.value === theme);

  return (
    <div
      className={`theme-toggle-track ${className ?? ""}`}
      role="radiogroup"
      aria-label={a11y.themeLabel}
    >
      {/* Sliding indicator */}
      <div
        className="theme-toggle-indicator"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={`theme-toggle-option ${theme === value ? "theme-toggle-option-active" : ""}`}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/**
 * Row-style theme selector for Settings page.
 * Shows all three options as labeled buttons.
 */
export function ThemeSelector({
  t,
}: {
  t: { light: string; dark: string; system: string };
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-16 bg-secondary/50 animate-pulse rounded-lg" />;
  }

  const options: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: t.light },
    { value: "dark", icon: Moon, label: t.dark },
    { value: "system", icon: Monitor, label: t.system },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`flex flex-1 min-w-[100px] flex-col gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            theme === value
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {label}
          </span>
          {/* Live swatch preview of each theme's palette (bg / card / accent).
              Hardcoded because var() would only reflect the active theme.
              Source: globals.css :root (light) & .dark — --background / --card
              / --primary. Keep in sync if those tokens change. */}
          <span className="flex gap-1" aria-hidden="true">
            {THEME_SWATCHES[value].map((c, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-sm border border-black/10 dark:border-white/10"
                style={{ background: c }}
              />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

// A cross-theme palette preview must show each theme's *fixed* colors at once,
// so var() (which only reflects the active theme) cannot be used here — the
// literals are deliberate. Values mirror globals.css :root (light) & .dark:
// --background / --card / --primary. Keep in sync if those tokens change.
/* eslint-disable local/no-hardcoded-brand-colors */
const THEME_SWATCHES: Record<ThemeOption, [string, string, string]> = {
  light: ["#f9faf6", "#ffffff", "#0b5f91"],
  dark: ["#04121f", "#0a2336", "#76d4e8"],
  system: ["#f9faf6", "#0a2336", "#76d4e8"],
};
/* eslint-enable local/no-hardcoded-brand-colors */
