// ============================================================
// TheFitPlate — Section 04 of the chart-archive result.
//
// The single best-fit direction rendered as an archive ledger entry:
// a named direction with a fit score, a tagline, an evidence column built
// from the driving RIASEC dimensions, and a "day in the work" note.
// ============================================================

interface EvidenceRow {
  dim: string;
  score: number;
  phrase: string;
}

interface TheFitPlateProps {
  bestFitLabel: string;
  careerName: string;
  fitPct: number;
  tagline?: string;
  evidenceLabel: string;
  evidence: EvidenceRow[];
  dayLabel: string;
  dayText: string;
}

export function TheFitPlate({
  bestFitLabel,
  careerName,
  fitPct,
  tagline,
  evidenceLabel,
  evidence,
  dayLabel,
  dayText,
}: TheFitPlateProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-x-12">
      {/* Direction */}
      <div>
        <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info">
          {bestFitLabel}
        </p>
        <h3 className="mt-3 font-display font-normal text-rev-ink leading-[1.06] tracking-[-0.01em] flex flex-wrap items-baseline gap-x-3">
          <span style={{ fontSize: "var(--rev-display-md)" }}>
            {careerName}
          </span>
          <span className="font-sans tabular-nums text-rev-signal-attention text-[clamp(20px,2vw,28px)]">
            — {fitPct}
          </span>
        </h3>
        {tagline && (
          <p className="mt-3 font-serif italic text-rev-ink-soft text-[15px] leading-[1.55] max-w-[34ch]">
            {tagline}
          </p>
        )}
      </div>

      {/* Evidence */}
      <div>
        <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info">
          {evidenceLabel}
        </p>
        <ul className="mt-4 space-y-2.5">
          {evidence.map((e) => (
            <li
              key={e.dim}
              className="flex items-baseline gap-2.5 font-serif text-rev-ink text-[14px]"
            >
              <span className="font-display text-rev-ink w-4">{e.dim}</span>
              <span className="font-sans tabular-nums text-rev-signal-attention text-[12px] w-7">
                {e.score}
              </span>
              <span className="text-rev-ink-soft italic leading-snug flex-1">
                {e.phrase}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* A day in the work */}
      <div>
        <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info">
          {dayLabel}
        </p>
        <p className="mt-4 font-serif text-rev-ink-soft text-[14px] leading-[1.7]">
          {dayText}
        </p>
      </div>
    </div>
  );
}
