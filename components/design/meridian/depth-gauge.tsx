/**
 * DepthGauge — Meridian signature element #1.
 * Vertical hairline rail with depth stations; the active station glows gold.
 * Spec: `.claude/skills/deepdive-design/references/layout-shell.md` §6.
 */
export interface DepthStation {
  /** e.g. "0m" */
  depth: string;
  /** e.g. "Surface" */
  label: string;
}

export interface DepthGaugeProps {
  stations: DepthStation[];
  /** Index of the current station (gold). */
  activeIndex: number;
  className?: string;
}

export function DepthGauge({
  stations,
  activeIndex,
  className,
}: DepthGaugeProps) {
  return (
    <div
      className={["md-depth-gauge", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={stations
        .map(
          (s, i) =>
            `${s.depth} ${s.label}${i === activeIndex ? " (current)" : ""}`,
        )
        .join(", ")}
    >
      {stations.map((station, i) => (
        <div
          key={station.depth}
          className={`md-depth-gauge__row${i === activeIndex ? " is-active" : ""}`}
        >
          <span className="md-depth-gauge__dot" />
          <span className="md-depth-gauge__label">
            {station.depth}
            <span className="md-depth-gauge__name">{station.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
