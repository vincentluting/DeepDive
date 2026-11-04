export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-[var(--depth-surface,#F0F6FC)] dark:bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome banner skeleton */}
        <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-6 space-y-3">
          <div className="h-6 w-56 rounded-lg skeleton-brand" />
          <div className="h-4 w-80 rounded skeleton-brand" />
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-4 space-y-2">
              <div className="h-3 w-16 rounded skeleton-brand" />
              <div className="h-7 w-12 rounded skeleton-brand" />
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-5 space-y-3">
              <div className="h-5 w-32 rounded skeleton-brand" />
              <div className="h-3 w-full rounded skeleton-brand" />
              <div className="h-3 w-5/6 rounded skeleton-brand" />
              <div className="h-9 w-28 rounded-lg skeleton-brand mt-2" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .skeleton-brand {
          background: linear-gradient(90deg, rgba(8,112,174,0.06) 0%, rgba(8,112,174,0.12) 40%, rgba(8,112,174,0.06) 100%);
          background-size: 200% 100%;
          animation: skeleton-sweep 1.8s ease-in-out infinite;
        }
        @media (prefers-color-scheme: dark) {
          .skeleton-brand {
            background: linear-gradient(90deg, rgba(66,198,255,0.06) 0%, rgba(66,198,255,0.12) 40%, rgba(66,198,255,0.06) 100%);
            background-size: 200% 100%;
          }
        }
        @keyframes skeleton-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
