// ============================================================
// NorthStarPeaks — Section 07 of the chart-archive result.
//
// Three brass-labelled directional peaks — Leadership / Expertise / Impact —
// drawn from the archetype's North Star map. No card chrome, no gold gradient:
// just a brass eyebrow, a serif direction, and a one-line why.
// ============================================================

interface Peak {
  label: string;
  role: string;
  why: string;
}

interface NorthStarPeaksProps {
  peaks: Peak[];
  caption: string;
}

export function NorthStarPeaks({ peaks, caption }: NorthStarPeaksProps) {
  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
        {peaks.map((p) => (
          <div key={p.label} className="text-center sm:text-left">
            <p className="font-sans uppercase tracking-[0.18em] text-[10px] text-rev-signal-attention">
              {p.label}
            </p>
            <h4
              className="mt-3 font-display font-normal text-rev-ink leading-snug"
              style={{ fontSize: "clamp(19px, 2vw, 24px)" }}
            >
              {p.role}
            </h4>
            <p className="mt-2 font-serif text-rev-ink-soft text-[13px] leading-[1.6]">
              {p.why}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 font-serif italic text-rev-ink-soft text-[13px] leading-[1.6] text-center max-w-[60ch] mx-auto">
        {caption}
      </p>
    </div>
  );
}
