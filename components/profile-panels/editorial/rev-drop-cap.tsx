/**
 * RevDropCap — Editorial first-letter flourish for chapter leads.
 *
 * English (en): the wrapping <p> gets the `rev-drop-cap` class and CSS
 * ::first-letter float handles the 4-line drop. Pass the entire paragraph
 * as children; the component just adds the class.
 *
 * Chinese (zh): first-letter float looks broken with Han characters. Instead
 * we render the first character as an oversize inline glyph (1.8em) in
 * cold-glow colour, no float. Children must start with the target glyph.
 *
 * Usage:
 *   <RevDropCap locale={loc}>Your paragraph here...</RevDropCap>
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface RevDropCapProps extends React.ComponentProps<"p"> {
  locale: "en" | "zh";
  children: React.ReactNode;
}

export function RevDropCap({
  locale,
  className,
  children,
  ...props
}: RevDropCapProps) {
  if (locale === "en") {
    return (
      <p
        data-slot="rev-drop-cap"
        className={cn(
          "rev-drop-cap font-serif text-rev-ink leading-[1.7]",
          "text-[17px] sm:text-[18px]",
          className,
        )}
        {...props}
      >
        {children}
      </p>
    );
  }

  // Chinese: take first character, render inline oversized glyph.
  const raw = typeof children === "string" ? children : null;
  if (!raw) {
    // Non-string children — fallback to plain paragraph.
    return (
      <p
        className={cn(
          "font-serif text-rev-ink leading-[1.85] text-[17px]",
          className,
        )}
        {...props}
      >
        {children}
      </p>
    );
  }

  const [first, ...rest] = Array.from(raw);
  return (
    <p
      data-slot="rev-drop-cap"
      className={cn(
        "font-serif text-rev-ink leading-[1.85] text-[17px]",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="font-display text-rev-glow-cold font-normal mr-1 align-[-0.05em]"
        style={{ fontSize: "1.8em", lineHeight: 0.9 }}
      >
        {first}
      </span>
      <span className="sr-only">{first}</span>
      {rest.join("")}
    </p>
  );
}
