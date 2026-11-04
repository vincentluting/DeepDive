// ============================================================
// FirstSignal — Section 01 of the chart-archive result.
//
// Left: a bordered monogram plate (3-letter Holland code) with a caption.
// Centre: the archetype title + three numbered "signal" rows (top-3 dims).
// Right: a "Curiosity gap" pull-line that teases the Deep Dive.
// ============================================================

interface SignalRow {
  title: string;
  body: string;
}

interface FirstSignalProps {
  /** 3-letter Holland code, e.g. "IRA". */
  monogram: string;
  /** Caption under the monogram (combo first sentence / tagline). */
  monogramCaption?: string;
  /** Archetype name, e.g. "Investigative Maker". */
  title: string;
  /** Optional lede above the rows. */
  lede?: string;
  /** Top-3 signal rows. */
  rows: SignalRow[];
  curiosityLabel: string;
  curiosityQuote: string;
}

export function FirstSignal({
  monogram,
  monogramCaption,
  title,
  lede,
  rows,
  curiosityLabel,
  curiosityQuote,
}: FirstSignalProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
      {/* Monogram plate */}
      <div className="lg:col-span-3">
        <div className="relative border border-rev-rule rounded-[3px] aspect-[4/5] flex flex-col items-center justify-center px-4 py-6 bg-rev-paper-warm">
          <span
            className="font-display font-normal text-rev-ink tracking-[0.12em] leading-none"
            style={{ fontSize: "clamp(48px, 7vw, 76px)" }}
            aria-hidden="true"
          >
            {monogram}
          </span>
          {monogramCaption && (
            <p className="mt-5 font-serif italic text-rev-ink-soft text-[12px] leading-[1.5] text-center max-w-[22ch]">
              {monogramCaption}
            </p>
          )}
        </div>
      </div>

      {/* Title + signal rows */}
      <div className="lg:col-span-6">
        <h3
          className="font-display font-normal text-rev-ink leading-[1.08] tracking-[-0.01em]"
          style={{ fontSize: "var(--rev-display-md)" }}
        >
          {title}
        </h3>
        {lede && (
          <p className="mt-3 font-serif italic text-rev-ink-soft text-[14px] leading-[1.5]">
            {lede}
          </p>
        )}

        <ol className="mt-7 space-y-5">
          {rows.map((row, i) => (
            <li key={row.title} className="flex gap-4">
              <span className="font-sans tabular-nums text-[11px] tracking-[0.16em] text-rev-signal-attention pt-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 border-t border-rev-rule pt-1">
                <p className="font-display text-rev-ink text-[17px] leading-snug">
                  {row.title}
                </p>
                <p className="mt-1 font-serif text-rev-ink-soft text-[14px] leading-[1.6]">
                  {row.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Curiosity gap */}
      <div className="lg:col-span-3">
        <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info">
          {curiosityLabel}
        </p>
        <blockquote className="mt-4 font-display italic text-rev-ink leading-[1.4] text-[clamp(18px,1.9vw,22px)]">
          {curiosityQuote}
        </blockquote>
      </div>
    </div>
  );
}
