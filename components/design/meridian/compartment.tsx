import type { ReactNode } from "react";

/**
 * Compartment — Meridian signature element #2 (numbered editorial section).
 * Renders the `01 ─── YOUR PORTRAIT ───────` header; children follow below.
 * Spec: `.claude/skills/deepdive-design/references/layout-shell.md` §3.
 */
export interface CompartmentProps {
  /** Two-digit index, e.g. "01". */
  index: string;
  /** Small-caps label, e.g. "Your portrait". */
  label: string;
  /** Optional anchor id for ExpeditionRail section links. */
  id?: string;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
}

export function Compartment({
  index,
  label,
  id,
  children,
  className,
  headerClassName,
}: CompartmentProps) {
  return (
    <section
      id={id}
      className={["md-compartment", className].filter(Boolean).join(" ")}
    >
      <div
        className={["md-compartment__head", headerClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="md-compartment__num">{index}</span>
        <span className="md-eyebrow">{label}</span>
        <span className="md-rule" />
      </div>
      {children}
    </section>
  );
}
