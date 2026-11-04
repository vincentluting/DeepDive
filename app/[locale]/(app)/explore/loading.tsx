export default function ExploreLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="h-8 w-48 rounded bg-muted mx-auto" />
          <div className="h-4 w-72 rounded bg-muted mx-auto" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/30 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
