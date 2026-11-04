export default function ProfileDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/30 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-muted" />
          <div className="h-5 w-20 rounded bg-muted" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Identity card skeleton */}
        <div className="rounded-2xl border border-border/30 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-40 rounded bg-muted" />
            <div className="h-4 w-56 rounded bg-muted" />
          </div>
        </div>

        {/* Content sections skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/30 p-5 space-y-3">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
