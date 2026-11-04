"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { reportClientError } from "@/lib/observability/client-error";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { useAdminTimeRange } from "@/components/admin/shell/time-range-context";

interface FunnelConversions {
  registered: number;
  quickdive_started: number;
  quickdive_completed: number;
  immersive_explore_started: number;
  immersive_explore_completed: number;
  deepdive_started: number;
  deepdive_completed: number;
  report_viewed: number;
  report_reacted: number;
  coaching_started: number;
}

interface StepTiming {
  from: string;
  to: string;
  medianMinutes: number | null;
}

interface FunnelFilterOptions {
  languages: string[];
  countries: string[];
  devices: string[];
  exploreModes: string[];
}

interface FunnelApiResponse {
  conversions: FunnelConversions;
  nps: { average: number; count: number };
  days: number;
  stepTiming: StepTiming[];
  filterOptions: FunnelFilterOptions;
}

interface FunnelDatum {
  name: string;
  value: number;
  rate: string;
  lossRate: string;
  timingLabel?: string;
}

const FUNNEL_EVENTS = [
  "registered",
  "quickdive_started",
  "quickdive_completed",
  "immersive_explore_started",
  "immersive_explore_completed",
  "deepdive_started",
  "deepdive_completed",
  "report_viewed",
  "report_reacted",
  "coaching_started",
];

function FunnelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: FunnelDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground">{data.payload.name}</p>
      <p className="text-sm text-muted-foreground">
        {data.value} users ({data.payload.rate})
      </p>
      {data.payload.lossRate && (
        <p className="text-xs text-muted-foreground/60">
          {data.payload.lossRate}
        </p>
      )}
      {data.payload.timingLabel && (
        <p className="text-xs text-blue-500">
          median {data.payload.timingLabel} from prev step
        </p>
      )}
    </div>
  );
}

function FunnelFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[96px] rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:h-8 sm:min-w-[80px]"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Conversion funnel chart with segmentation filters and step timing.
 * Lives at the top of /admin/insights (UserFunnel domain). Uses the
 * shared admin time range. Segmentation is "by latest profile" — see
 * docs/architecture/admin-metrics.md §2.3.
 */
export function FunnelBoard({ locale }: { locale: Locale }) {
  const { days } = useAdminTimeRange();
  const [funnelData, setFunnelData] = useState<FunnelDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FunnelFilterOptions>({
    languages: [],
    countries: [],
    devices: [],
    exploreModes: [],
  });
  const [language, setLanguage] = useState("");
  const [country, setCountry] = useState("");
  const [device, setDevice] = useState("");
  const [exploreMode, setExploreMode] = useState("");
  const [researchGroup, setResearchGroup] = useState("");

  const dict = getDictionaryClient(locale);
  const adminT = (dict.admin || {}) as Record<string, string>;
  const label = (key: string, fallback: string): string =>
    adminT[key] || fallback;

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
      if (language) params.set("language", language);
      if (country) params.set("country", country);
      if (device) params.set("device", device);
      if (exploreMode) params.set("exploreMode", exploreMode);
      if (researchGroup) params.set("researchGroup", researchGroup);

      const res = await fetch(`/api/admin/funnel?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading funnel`);

      const data: FunnelApiResponse = await res.json();
      const c = data.conversions;
      const registered = c.registered || 1; // avoid division by zero

      const labels = [
        adminT.funnelRegistered,
        adminT.funnelQdStart,
        adminT.funnelQdComplete,
        adminT.funnelImmersiveStart,
        adminT.funnelImmersiveComplete,
        adminT.funnelDdStart,
        adminT.funnelDdComplete,
        adminT.funnelReportView,
        adminT.funnelReacted,
        adminT.funnelCoaching,
      ] as string[];

      const values = [
        c.registered,
        c.quickdive_started,
        c.quickdive_completed,
        c.immersive_explore_started,
        c.immersive_explore_completed,
        c.deepdive_started,
        c.deepdive_completed,
        c.report_viewed,
        c.report_reacted,
        c.coaching_started,
      ];

      const timingMap = new Map<string, number>();
      for (const t of data.stepTiming || []) {
        if (t.medianMinutes !== null) timingMap.set(t.to, t.medianMinutes);
      }

      setFunnelData(
        labels.map((name, i) => {
          const median = timingMap.get(FUNNEL_EVENTS[i]);
          let timingLabel: string | undefined;
          if (median !== undefined && i > 0) {
            if (median < 1) timingLabel = `${Math.round(median * 60)}s`;
            else if (median < 60) timingLabel = `${Math.round(median)}m`;
            else if (median < 1440)
              timingLabel = `${(median / 60).toFixed(1)}h`;
            else timingLabel = `${(median / 1440).toFixed(1)}d`;
          }
          return {
            name,
            value: values[i],
            rate: `${Math.round((values[i] / registered) * 100)}%`,
            lossRate:
              i > 0
                ? `↓ ${100 - Math.round((values[i] / Math.max(1, values[i - 1])) * 100)}% loss`
                : "",
            timingLabel,
          };
        }),
      );

      if (data.filterOptions) setFilterOptions(data.filterOptions);
    } catch (err) {
      reportClientError(err, { component: "FunnelBoard", feature: "admin" });
    } finally {
      setLoading(false);
    }
    // `locale` stands in for the label lookups (dictionary is locale-keyed
    // and module-cached, so its object identity is not a safe dependency)
  }, [days, language, country, device, exploreMode, researchGroup, locale]);

  useEffect(() => {
    void fetchFunnel();
  }, [fetchFunnel]);

  const hasActiveFilter =
    language || country || device || exploreMode || researchGroup;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            {label("funnelTitle", "Conversion Funnel").replace(
              "(30 days)",
              `(${days} days)`,
            )}
          </h2>
        </div>

        {/* Segmentation filters — classified by user's LATEST profile */}
        <div className="dd-mobile-scroll-x mb-4 flex items-end gap-2 overflow-x-auto border-b border-border/50 pb-3">
          <FunnelFilterSelect
            allLabel={label("filterAll", "All")}
            label={label("filterLanguage", "Language")}
            value={language}
            onChange={setLanguage}
            options={filterOptions.languages.map((l) => ({
              value: l,
              label: l.toUpperCase(),
            }))}
          />
          <FunnelFilterSelect
            allLabel={label("filterAll", "All")}
            label={label("filterCountry", "Country")}
            value={country}
            onChange={setCountry}
            options={filterOptions.countries.map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <FunnelFilterSelect
            allLabel={label("filterAll", "All")}
            label={label("filterDevice", "Device")}
            value={device}
            onChange={setDevice}
            options={filterOptions.devices.map((d) => ({
              value: d,
              label: d.charAt(0).toUpperCase() + d.slice(1),
            }))}
          />
          <FunnelFilterSelect
            allLabel={label("filterAll", "All")}
            label={label("filterExploreMode", "Explore Mode")}
            value={exploreMode}
            onChange={setExploreMode}
            options={filterOptions.exploreModes.map((m) => ({
              value: m,
              label: m.charAt(0).toUpperCase() + m.slice(1),
            }))}
          />
          <FunnelFilterSelect
            allLabel={label("filterAll", "All")}
            label={label("filterResearchGroup", "Research Group")}
            value={researchGroup}
            onChange={setResearchGroup}
            options={[
              { value: "classic", label: "Classic" },
              { value: "immersive", label: "Immersive" },
              {
                value: "non-research",
                label: label("filterNonResearch", "Non-research"),
              },
            ]}
          />
          {hasActiveFilter && (
            <button
              onClick={() => {
                setLanguage("");
                setCountry("");
                setDevice("");
                setExploreMode("");
                setResearchGroup("");
              }}
              className="min-h-10 shrink-0 px-2 text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              {label("clearFilters", "Clear filters")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-64 bg-muted/30 animate-pulse rounded" />
        ) : funnelData.length === 0 ||
          funnelData.every((d) => d.value === 0) ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            {label("noData", "No data yet")}
          </div>
        ) : (
          <>
            <div className="dd-mobile-chart-scroll">
              <div className="h-72 min-w-[620px] sm:h-80 sm:min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<FunnelTooltip />}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {funnelData.map((_, index) => (
                        <Cell
                          key={index}
                          fill="hsl(var(--primary))"
                          opacity={1 - index * 0.08}
                        />
                      ))}
                      <LabelList
                        dataKey="rate"
                        position="top"
                        style={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {funnelData.some((d) => d.timingLabel) && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground mb-2 font-medium">
                  {label("medianTimeBetweenSteps", "Median time between steps")}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {funnelData.map((d, i) =>
                    i > 0 && d.timingLabel ? (
                      <span
                        key={i}
                        className="text-[10px] text-muted-foreground"
                      >
                        {funnelData[i - 1].name} → {d.name}:{" "}
                        <span className="text-blue-500 font-medium">
                          {d.timingLabel}
                        </span>
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
