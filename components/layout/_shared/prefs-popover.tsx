"use client";

import { Sun, Moon, Monitor, Globe } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";

interface PrefsPopoverProps {
  locale: string;
}

const THEME_OPTIONS = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "dark", Icon: Moon, label: "Dark" },
  { value: "system", Icon: Monitor, label: "System" },
] as const;

export function PrefsPopover({ locale }: PrefsPopoverProps) {
  const { theme, setTheme } = useTheme();
  const commonT = getDictionaryClient(locale as "en" | "zh").common;
  const pathname = usePathname();
  const router = useRouter();

  const targetLocale = locale === "zh" ? "en" : "zh";

  function switchLocale() {
    // Replace /en/ or /zh/ prefix in the current path
    const newPath = pathname.replace(/^\/(en|zh)/, `/${targetLocale}`);
    router.push(newPath);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="header-trigger-btn flex items-center gap-1 px-2 min-h-[36px] rounded-full transition-all duration-200"
          aria-label={
            getDictionaryClient(locale as "en" | "zh").a11y.preferences
          }
        >
          <Sun className="w-4 h-4 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="header-dropdown w-48 p-0 overflow-hidden"
      >
        <div className="px-3.5 py-2.5 space-y-2.5">
          {/* Theme row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sun className="w-3.5 h-3.5" />
              {commonT.theme}
            </div>
            <div className="flex items-center gap-0.5">
              {THEME_OPTIONS.map(({ value, Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-label={label}
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

          {/* Language row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              {commonT.language}
            </div>
            <div className="flex items-center gap-0.5">
              {(["en", "zh"] as const).map((lang) => {
                const label =
                  lang === "en"
                    ? (commonT as Record<string, string>).langLabelEn
                    : (commonT as Record<string, string>).langLabelZh;
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      if (lang !== locale) switchLocale();
                    }}
                    aria-label={label}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                      lang === locale
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
