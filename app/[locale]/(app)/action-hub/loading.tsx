/**
 * Action Hub loading skeleton — mirrors the Sanctuary dashboard layout:
 * eyebrow + big title + stat row, then numbered sections with paper cards.
 * Kept structurally identical to page.tsx so the content swap is invisible.
 */
export default function ActionHubLoading() {
  return (
    <div className="mx-auto max-w-[680px] px-6 sm:px-8 py-12 sm:py-16 space-y-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="space-y-5">
        <div className="h-3 w-36 rounded-sm bg-[var(--sanc-rule)]/70" />
        <div className="h-16 sm:h-20 w-56 sm:w-72 rounded-sm bg-[var(--sanc-rule)]/80" />
        <div className="border-t border-[var(--sanc-rule)] pt-4">
          <div className="h-4 w-72 rounded-sm bg-[var(--sanc-rule)]/60" />
        </div>
      </div>

      {/* 01 — Actions skeleton */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3 border-t border-[var(--sanc-rule)] pt-5">
          <div className="h-3 w-6 rounded-sm bg-[var(--sanc-rule)]/70" />
          <div className="h-3 w-20 rounded-sm bg-[var(--sanc-rule)]/60" />
        </div>
        {/* Progress bar card */}
        <div className="rounded-lg bg-[var(--sanc-sand)] border border-[var(--sanc-rule)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-sm bg-[var(--sanc-rule)]/70" />
            <div className="h-4 w-10 rounded-sm bg-[var(--sanc-rule)]/70" />
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--sanc-linen)]" />
        </div>
        {/* Keystone skeleton */}
        <div className="rounded-lg bg-[var(--sanc-linen)]/70 border border-[var(--sanc-rule)] p-5 space-y-3">
          <div className="h-3 w-24 rounded-sm bg-[var(--sanc-rule)]/70" />
          <div className="h-5 w-3/4 rounded-sm bg-[var(--sanc-rule)]/60" />
          <div className="h-3 w-1/2 rounded-sm bg-[var(--sanc-rule)]/50" />
        </div>
        {/* Action item cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg bg-[var(--sanc-sand)] border border-[var(--sanc-rule)] p-4 space-y-2"
          >
            <div className="h-4 w-3/5 rounded-sm bg-[var(--sanc-rule)]/60" />
            <div className="h-3 w-20 rounded-sm bg-[var(--sanc-rule)]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
