export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/30 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="h-6 w-36 rounded bg-muted" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/30 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted mt-3" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-muted shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
