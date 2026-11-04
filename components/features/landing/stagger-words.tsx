"use client";

import { useEffect, useState } from "react";

/**
 * Split a heading into animatable word segments.
 * Uses Intl.Segmenter (word granularity) so CJK headings cascade too —
 * the historical version split on whitespace, which left Chinese as one
 * motionless block. Falls back to whitespace splitting.
 */
export function segmentWords(text: string, locale: string): string[] {
  try {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  } catch {
    return text.split(/(\s+)/).filter((part) => part.length > 0);
  }
}

/**
 * StaggerWords — hero heading words rise one by one.
 *
 * Progressive enhancement: SSR renders the plain string (SEO/LCP/no-JS
 * safe); after mount the text re-renders as word spans and the cascade
 * plays. Segmentation happens only on the client, so server/client ICU
 * differences can never cause hydration mismatches.
 */
export function StaggerWords({
  text,
  locale,
  className,
}: {
  text: string;
  locale: string;
  className?: string;
}) {
  const [words, setWords] = useState<string[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWords(segmentWords(text, locale));
  }, [text, locale]);

  if (!words) {
    return <span className={className}>{text}</span>;
  }

  let wordIndex = 0;
  return (
    <span className={`dd-words ${className ?? ""}`}>
      {words.map((segment, index) => {
        if (/^\s+$/.test(segment)) return segment; // keep whitespace inline
        const delay = Math.min(wordIndex++, 10) * 80;
        return (
          <span
            key={`${segment}-${index}`}
            className="dd-word"
            style={{ animationDelay: `${delay}ms` }}
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}
