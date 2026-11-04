// ============================================================
// CoverPlate — Section 00 of the chart-archive result.
//
// The "plate cover": large Holland Code title, dimension line, a bordered
// PLATE catalogue number, a short lede, four metadata fields, and the script
// coda. Pure rev-token paper; no card chrome.
// ============================================================

import { RevHandRule } from "@/components/profile-panels/editorial";

interface MetaField {
  label: string;
  value: string;
}

interface CoverPlateProps {
  /** Localised "Holland Code I-R-A" (code already interpolated). */
  title: string;
  /** "Investigative · Realistic · Artistic" */
  dimsLine: string;
  /** Localised lede paragraph. */
  lede: string;
  /** "Plate" small-caps label. */
  plateLabel: string;
  /** Catalogue code, e.g. "QD-IRA-086". */
  plateCode: string;
  meta: MetaField[];
  /** Script coda — "Go deeper. Live clearer." */
  coda: string;
}

export function CoverPlate({
  title,
  dimsLine,
  lede,
  plateLabel,
  plateCode,
  meta,
  coda,
}: CoverPlateProps) {
  return (
    <div className="pt-2">
      {/* Plate catalogue tag (top-right) */}
      <div className="flex items-start justify-end">
        <span className="inline-flex items-center gap-2 border border-rev-rule rounded-[2px] px-3 py-1.5">
          <span className="font-sans uppercase tracking-[0.2em] text-[9px] text-rev-signal-info">
            {plateLabel}
          </span>
          <span className="font-serif italic text-[13px] text-rev-ink tabular-nums">
            {plateCode}
          </span>
        </span>
      </div>

      {/* Title */}
      <h1
        className="font-display font-normal text-rev-ink leading-[1.02] tracking-[-0.02em] mt-4"
        style={{ fontSize: "var(--rev-display-xl)" }}
      >
        {title}
      </h1>
      <p className="mt-3 font-serif italic text-rev-ink-soft text-[clamp(15px,1.6vw,19px)]">
        {dimsLine}
      </p>

      <div className="mt-7">
        <RevHandRule width="full" tone="rule" />
      </div>

      {/* Lede + meta + coda */}
      <div className="mt-7 grid gap-x-12 gap-y-8 lg:grid-cols-[1.2fr_1fr] items-start">
        <p className="font-serif text-rev-ink-soft leading-[1.65] max-w-[46ch] text-[clamp(14px,1.1vw,16px)]">
          {lede}
        </p>

        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {meta.map((m) => (
              <div key={m.label} className="flex flex-col gap-1">
                <dt className="font-sans uppercase tracking-[0.16em] text-[9px] text-rev-signal-info">
                  {m.label}
                </dt>
                <dd className="font-serif text-rev-ink text-[15px] tabular-nums">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="font-script text-rev-signal-attention text-[clamp(18px,1.8vw,22px)] leading-tight lg:text-right">
            {coda}
          </p>
        </div>
      </div>
    </div>
  );
}
