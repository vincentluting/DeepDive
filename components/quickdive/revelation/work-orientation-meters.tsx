// ============================================================
// WorkOrientationMeters — Section 03 of the chart-archive result.
//
// Four DPTI orientation meters (Data / Ideas / Things / People) drawn as
// Sounding measurement plates: a hairline track, a sea fill, a brass marker,
// the value, and a 0–50–100 scale. Plus a one-line interpretation footnote.
// ============================================================

interface Meter {
  key: string;
  label: string;
  value: number;
}

interface WorkOrientationMetersProps {
  title: string;
  lede: string;
  meters: Meter[];
  interpretation?: string;
}

export function WorkOrientationMeters({
  title,
  lede,
  meters,
  interpretation,
}: WorkOrientationMetersProps) {
  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <h3
          className="font-display font-normal text-rev-ink leading-tight"
          style={{ fontSize: "var(--rev-display-md)" }}
        >
          {title}
        </h3>
        <p className="font-serif italic text-rev-ink-soft text-[14px] leading-snug max-w-[40ch]">
          {lede}
        </p>
      </div>

      <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {meters.map((m) => {
          const pct = Math.max(0, Math.min(100, Math.round(m.value)));
          return (
            <div key={m.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-rev-ink text-[17px]">
                  {m.label}
                </span>
                <span className="font-sans tabular-nums text-rev-signal-attention text-[15px]">
                  {pct}
                </span>
              </div>

              <div className="mt-3 relative h-[3px] bg-rev-rule rounded-full">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "var(--rev-signal-info)",
                  }}
                />
                <span
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[9px] h-[9px] rounded-full border-[1.5px] border-rev-paper"
                  style={{
                    left: `${pct}%`,
                    background: "var(--rev-signal-attention)",
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between font-sans tabular-nums text-[9px] tracking-[0.1em] text-rev-ink-soft/70">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          );
        })}
      </div>

      {interpretation && (
        <p className="mt-8 font-serif italic text-rev-ink-soft text-[14px] leading-[1.7] max-w-[64ch]">
          {interpretation}
        </p>
      )}
    </div>
  );
}
