/**
 * ScriptCoda — Meridian signature element #5.
 * Handwritten sign-off ("Go deeper. Live clearer.") + gold point.
 * Caveat latin / Kaiti fallback for zh (via --font-script stack).
 */
export interface ScriptCodaProps {
  text: string;
  /** Render the small glowing gold dot after the text. */
  dot?: boolean;
  className?: string;
}

export function ScriptCoda({ text, dot = true, className }: ScriptCodaProps) {
  return (
    <span className={["md-coda", className].filter(Boolean).join(" ")}>
      {text}
      {dot ? <span className="md-coda__dot" aria-hidden="true" /> : null}
    </span>
  );
}
