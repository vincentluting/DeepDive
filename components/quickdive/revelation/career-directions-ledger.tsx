// ============================================================
// CareerDirectionsLedger — Section 05 of the chart-archive result.
//
// A continuous editorial ledger (NOT a card stack) of fitting directions:
// each row is index · direction · fit bar · why-it-fits · first-experiment,
// separated by hairlines. A "watch-outs" strip lists lower-fit / draining
// directions underneath.
//
// Used for the OPEN (authenticated / saved-report) view. The unauthenticated
// claim wall is handled separately by SealedCareersChapter so the conversion
// gate stays untouched.
// ============================================================

interface LedgerRow {
  name: string;
  pct: number;
  why?: string;
  experiment: string;
}

interface WatchOut {
  name: string;
  pct: number;
}

interface CareerDirectionsLedgerProps {
  rows: LedgerRow[];
  directionCol: string;
  fitCol: string;
  whyCol: string;
  experimentCol: string;
  watchOuts: WatchOut[];
  watchOutsLabel: string;
  watchOutsLede: string;
}

export function CareerDirectionsLedger({
  rows,
  directionCol,
  fitCol,
  whyCol,
  experimentCol,
  watchOuts,
  watchOutsLabel,
  watchOutsLede,
}: CareerDirectionsLedgerProps) {
  return (
    <div>
      {/* Column header — desktop only */}
      <div className="hidden lg:grid grid-cols-[2.2fr_1.4fr_2.4fr_2.4fr] gap-x-8 pb-3 border-b border-rev-rule">
        {[directionCol, fitCol, whyCol, experimentCol].map((label) => (
          <span
            key={label}
            className="font-sans uppercase tracking-[0.16em] text-[9px] text-rev-signal-info"
          >
            {label}
          </span>
        ))}
      </div>

      <ol>
        {rows.map((row, i) => {
          const pct = Math.max(0, Math.min(100, Math.round(row.pct)));
          return (
            <li
              key={`${row.name}-${i}`}
              className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr_2.4fr_2.4fr] gap-x-8 gap-y-2 py-5 border-b border-rev-rule"
            >
              {/* Direction */}
              <div className="flex items-baseline gap-3">
                <span className="font-sans tabular-nums text-[11px] tracking-[0.12em] text-rev-signal-attention">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-rev-ink text-[17px] leading-snug">
                  {row.name}
                </span>
              </div>

              {/* Fit bar */}
              <div className="flex items-center gap-3 lg:pr-2">
                <div className="flex-1 h-[3px] bg-rev-rule rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "var(--rev-signal-info)",
                    }}
                  />
                </div>
                <span className="font-sans tabular-nums text-rev-signal-attention text-[13px]">
                  {pct}
                </span>
              </div>

              {/* Why it fits */}
              <p className="font-serif text-rev-ink-soft text-[13px] leading-[1.6]">
                {row.why}
              </p>

              {/* First experiment */}
              <p className="font-serif italic text-rev-ink-soft text-[13px] leading-[1.6]">
                {row.experiment}
              </p>
            </li>
          );
        })}
      </ol>

      {/* Watch-outs strip */}
      {watchOuts.length > 0 && (
        <div className="mt-8 border border-rev-rule rounded-[3px] px-5 py-5 bg-rev-paper-warm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-risk">
              {watchOutsLabel}
            </p>
            <p className="font-serif italic text-rev-ink-soft text-[13px] leading-snug">
              {watchOutsLede}
            </p>
          </div>
          <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {watchOuts.map((w, i) => {
              const pct = Math.max(0, Math.min(100, Math.round(w.pct)));
              return (
                <div key={`${w.name}-${i}`} className="flex items-center gap-3">
                  <span className="flex-1 font-serif text-rev-ink text-[14px] leading-snug truncate">
                    {w.name}
                  </span>
                  <div className="w-14 h-[2px] bg-rev-rule rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "var(--rev-signal-risk)",
                      }}
                    />
                  </div>
                  <span className="font-sans tabular-nums text-rev-ink-soft text-[12px] w-6 text-right">
                    {pct}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
