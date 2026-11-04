export default function ProfileLoading() {
  return (
    <div className="min-h-dvh bg-[var(--depth-surface,#F0F6FC)] dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile hero skeleton */}
        <div className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full skeleton-brand shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-44 rounded-lg skeleton-brand" />
            <div className="h-4 w-60 rounded skeleton-brand" />
            <div className="h-3 w-32 rounded skeleton-brand" />
          </div>
        </div>

        {/* Dimension cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.04] p-5 space-y-3">
              <div className="h-4 w-28 rounded skeleton-brand" />
              <div className="h-3 w-full rounded skeleton-brand" />
              <div className="h-3 w-5/6 rounded skeleton-brand" />
              <div className="h-3 w-3/4 rounded skeleton-brand" />
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
