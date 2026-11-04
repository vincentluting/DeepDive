"use client";

// ── Types ──────────────────────────────────────────────────────────────────

interface DepthRingProps {
  depth: number;
  completionPercent: number;
  size?: number;
  /** Localized unit label (rendered uppercase). Falls back to "METERS". */
  unitLabel?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Circular depth indicator with warm→cool gradient stroke.
 * Animates strokeDashoffset via CSS transition.
 */
export function DepthRing({
  depth,
  completionPercent,
  size = 100,
  unitLabel = "METERS",
}: DepthRingProps) {
  const strokeWidth = 3.5;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(completionPercent, 0), 100);
  const offset = circ - (pct / 100) * circ;

  // Font sizes derived from ring size
  const depthFontSize = Math.round(size * 0.24);

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          {/* Unique gradient ID per component mount — avoids clashes if multiple rings render */}
          <linearGradient
            id="depth-ring-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#C4956A" />
            <stop offset="40%" stopColor="#8A9A9E" />
            <stop offset="100%" stopColor="#2E7D8E" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#EDF1F5"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#depth-ring-grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>

      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="font-mono text-foreground"
          style={{
            fontSize: depthFontSize,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {depth}
        </span>
        <span
          className="text-muted-foreground"
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginTop: 3,
          }}
        >
          {unitLabel}
        </span>
      </div>
    </div>
  );
}
