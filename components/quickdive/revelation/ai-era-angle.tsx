// ============================================================
// AiEraAngle — Section 06 of the chart-archive result.
//
// Three columns — Advantage / Risk / Direction — from the primary-dimension
// AI-era insight. Sea + brass only (the legacy violet card is dropped here).
// ============================================================

interface AiEraAngleProps {
  advantageLabel: string;
  advantage: string;
  riskLabel: string;
  risk: string;
  directionLabel: string;
  direction: string;
  /** Optional attribution line. */
  source?: string;
}

const COLS = [
  { key: "advantage", tone: "var(--rev-signal-positive)" },
  { key: "risk", tone: "var(--rev-signal-risk)" },
  { key: "direction", tone: "var(--rev-signal-info)" },
] as const;

export function AiEraAngle({
  advantageLabel,
  advantage,
  riskLabel,
  risk,
  directionLabel,
  direction,
  source,
}: AiEraAngleProps) {
  const data: Record<string, { label: string; body: string }> = {
    advantage: { label: advantageLabel, body: advantage },
    risk: { label: riskLabel, body: risk },
    direction: { label: directionLabel, body: direction },
  };

  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
        {COLS.map(({ key, tone }) => (
          <div key={key} className="sm:border-l sm:border-rev-rule sm:pl-6">
            <p
              className="font-sans uppercase tracking-[0.16em] text-[10px]"
              style={{ color: tone }}
            >
              {data[key].label}
            </p>
            <p className="mt-3 font-serif text-rev-ink-soft text-[14px] leading-[1.7]">
              {data[key].body}
            </p>
          </div>
        ))}
      </div>
      {source && (
        <p className="mt-7 font-sans uppercase tracking-[0.12em] text-[9px] text-rev-ink-soft/70">
          {source}
        </p>
      )}
    </div>
  );
}
