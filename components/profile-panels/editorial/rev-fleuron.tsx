/**
 * RevFleuron — Ornamental mark that closes each chapter.
 *
 * A small typographic flourish (✺ sextile by default) centred below the
 * last content block. Signals "end of section" the way a printed book does,
 * so readers don't confuse the next chapter's opener with continuation.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type FleuronGlyph = "sextile" | "lozenge" | "floral";

const GLYPHS: Record<FleuronGlyph, string> = {
  sextile: "\u273A",
  lozenge: "\u2756",
  floral: "\u2766",
};

interface RevFleuronProps extends React.ComponentProps<"div"> {
  glyph?: FleuronGlyph;
}

export function RevFleuron({
  glyph = "sextile",
  className,
  ...props
}: RevFleuronProps) {
  return (
    <div
      data-slot="rev-fleuron"
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center select-none",
        "mt-20 mb-4 text-rev-glow-cold/50",
        className,
      )}
      {...props}
    >
      <span
        className="font-display font-normal"
        style={{ fontSize: "28px", letterSpacing: "0.5em" }}
      >
        {GLYPHS[glyph]}
      </span>
    </div>
  );
}
