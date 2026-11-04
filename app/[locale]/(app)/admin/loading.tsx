export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-8 w-20 rounded-lg bg-muted" />
            <div className="h-8 w-20 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-8 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl border border-border/30 overflow-hidden">
          <div className="border-b border-border/30 px-5 py-3 flex gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-20 rounded bg-muted" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-5 py-3 flex gap-6 border-b border-border/20">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 w-20 rounded bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
