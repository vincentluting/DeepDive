"use client"

import { useState } from "react"
import { ONET_ATTRIBUTION, ONET_MODIFICATION_NOTICE } from "@/lib/assessment/mini-ip"

interface OnetAttributionProps {
  locale: string
  variant?: "compact" | "full"
  t: Record<string, string>
}

export function OnetAttribution({ locale, variant = "compact", t }: OnetAttributionProps) {
  const [expanded, setExpanded] = useState(false)
  const isZh = locale === "zh"

  if (variant === "full") {
    return (
      <div
        className="text-xs leading-relaxed"
        style={{ color: "var(--text-secondary-on-shallow)" }}
      >
        <p className="mb-1.5">
          {isZh ? ONET_ATTRIBUTION.zh : ONET_ATTRIBUTION.en}
        </p>
        <p>
          {isZh ? ONET_MODIFICATION_NOTICE.zh : ONET_MODIFICATION_NOTICE.en}
        </p>
      </div>
    )
  }

  // compact mode: single line with expand toggle
  return (
    <div
      className="text-[10px] leading-relaxed"
      style={{ color: "var(--text-secondary-on-shallow)" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="underline underline-offset-2 cursor-pointer hover:opacity-70 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current transition-opacity"
        style={{ color: "var(--text-secondary-on-shallow)" }}
        type="button"
      >
        {t.onetAttribution} · {expanded ? t.hide : t.showAttribution}
      </button>

      {expanded && (
        <div className="mt-2 max-w-prose space-y-1.5">
          <p>{isZh ? ONET_ATTRIBUTION.zh : ONET_ATTRIBUTION.en}</p>
          <p>{isZh ? ONET_MODIFICATION_NOTICE.zh : ONET_MODIFICATION_NOTICE.en}</p>
        </div>
      )}
    </div>
  )
}
