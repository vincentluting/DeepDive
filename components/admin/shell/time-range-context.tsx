"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

export type AdminTimeRange = 7 | 30 | 90;

const STORAGE_KEY = "admin-time-range";
const VALID: AdminTimeRange[] = [7, 30, 90];

interface TimeRangeContextValue {
  days: AdminTimeRange;
  setDays: (d: AdminTimeRange) => void;
}

const TimeRangeContext = createContext<TimeRangeContextValue>({
  days: 30,
  setDays: () => {},
});

/**
 * Shared admin time window (7/30/90 days), remembered in localStorage.
 * Consumed by Overview / Insights / Traffic / AI Usage. Research pages
 * deliberately ignore it — thesis stats are always full-population.
 */
export function AdminTimeRangeProvider({ children }: { children: ReactNode }) {
  const [days, setDaysState] = useState<AdminTimeRange>(30);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : NaN;
      if (VALID.includes(parsed as AdminTimeRange)) {
        setDaysState(parsed as AdminTimeRange);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  const setDays = (d: AdminTimeRange) => {
    setDaysState(d);
    try {
      localStorage.setItem(STORAGE_KEY, String(d));
    } catch {
      // localStorage unavailable — state-only
    }
  };

  return (
    <TimeRangeContext.Provider value={{ days, setDays }}>
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useAdminTimeRange(): TimeRangeContextValue {
  return useContext(TimeRangeContext);
}

/** Compact 7/30/90-day selector rendered in page header action slots. */
export function TimeRangeSelect({ locale }: { locale: Locale }) {
  const { days, setDays } = useAdminTimeRange();
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const nav = (dict.nav || {}) as Record<string, string>;
  const template = nav.timeRangeDays || "{n}d";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
      {VALID.map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          aria-pressed={days === d}
          className={`min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${
            days === d
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {template.replace("{n}", String(d))}
        </button>
      ))}
    </div>
  );
}
