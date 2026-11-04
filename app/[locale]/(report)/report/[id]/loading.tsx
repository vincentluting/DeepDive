export default function ReportLoading() {
  return (
    <div className="min-h-dvh" style={{ background: 'linear-gradient(180deg, #011828 0%, #022A4A 40%, #0A5A8A 100%)' }}>
      {/* Hero skeleton — mimics ReportHero structure */}
      <div className="relative px-6 pt-20 pb-12 flex flex-col items-center text-center">
        {/* Avatar circle */}
        <div className="w-20 h-20 rounded-full skeleton-shimmer mb-6" />
        {/* Archetype name */}
        <div className="h-7 w-52 rounded-lg skeleton-shimmer mb-3" />
        {/* Tagline */}
        <div className="h-4 w-72 rounded skeleton-shimmer mb-2" />
        <div className="h-4 w-56 rounded skeleton-shimmer mb-6" />
        {/* Highlight tags */}
        <div className="flex gap-3 justify-center">
          {[96, 72, 84].map((w, i) => (
            <div key={i} className="h-7 rounded-full skeleton-shimmer" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Transition zone — depth gradient */}
      <div className="h-16" style={{ background: 'linear-gradient(180deg, transparent, #F0FAFF)' }} />

      {/* Content skeleton — light surface zone */}
      <div className="bg-[#F0FAFF] dark:bg-[#0A1528] px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-8 pt-8">
          {/* Tab bar skeleton */}
          <div className="flex gap-3 justify-center mb-6">
            {[80, 96, 80, 88].map((w, i) => (
              <div key={i} className="h-9 rounded-full skeleton-shimmer-light" style={{ width: w }} />
            ))}
          </div>

          {/* Identity card skeleton */}
          <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full skeleton-shimmer-light shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 rounded skeleton-shimmer-light" />
                <div className="h-4 w-64 rounded skeleton-shimmer-light" />
              </div>
            </div>
            <div className="h-3 w-full rounded skeleton-shimmer-light" />
            <div className="h-3 w-5/6 rounded skeleton-shimmer-light" />
            <div className="h-3 w-3/4 rounded skeleton-shimmer-light" />
          </div>

          {/* Panel cards skeleton */}
          {[1, 2].map((panel) => (
            <div key={panel} className="space-y-3">
              <div className="h-5 w-40 rounded skeleton-shimmer-light" />
              <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-6 space-y-4">
                <div className="h-4 w-full rounded skeleton-shimmer-light" />
                <div className="h-4 w-5/6 rounded skeleton-shimmer-light" />
                <div className="h-4 w-4/5 rounded skeleton-shimmer-light" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] p-4 space-y-2">
                      <div className="h-3 w-16 rounded skeleton-shimmer-light" />
                      <div className="h-5 w-10 rounded skeleton-shimmer-light" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline styles for shimmer — scoped to this loading page */}
      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.12) 40%,
            rgba(255,255,255,0.06) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .skeleton-shimmer-light {
          background: linear-gradient(
            90deg,
            rgba(8,112,174,0.06) 0%,
            rgba(8,112,174,0.10) 40%,
            rgba(8,112,174,0.06) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
