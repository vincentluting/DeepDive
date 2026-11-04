export default function CoachingLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border/30 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="h-5 w-40 rounded bg-muted" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Chat bubbles skeleton */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted shrink-0 mt-1" />
          <div className="space-y-2 flex-1 max-w-sm">
            <div className="h-4 w-full rounded-lg bg-muted" />
            <div className="h-4 w-4/5 rounded-lg bg-muted" />
            <div className="h-4 w-3/5 rounded-lg bg-muted" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <div className="space-y-2 max-w-xs">
            <div className="h-4 w-48 rounded-lg bg-muted" />
            <div className="h-4 w-36 rounded-lg bg-muted" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted shrink-0 mt-1" />
          <div className="space-y-2 flex-1 max-w-md">
            <div className="h-4 w-full rounded-lg bg-muted" />
            <div className="h-4 w-5/6 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border/30 bg-background px-4 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <div className="flex-1 h-12 rounded-xl bg-muted" />
            <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
