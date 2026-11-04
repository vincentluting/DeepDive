export default function QuestionnaireLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-pulse">
      {/* Progress bar skeleton */}
      <div className="w-full h-1 bg-muted">
        <div className="h-1 w-1/4 bg-primary/30 rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto w-full space-y-10">
        {/* Phase label */}
        <div className="h-4 w-24 rounded-full bg-muted" />

        {/* Question text */}
        <div className="w-full space-y-3 text-center">
          <div className="h-6 w-5/6 rounded bg-muted mx-auto" />
          <div className="h-6 w-2/3 rounded bg-muted mx-auto" />
        </div>

        {/* Answer options */}
        <div className="w-full space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 p-4 flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full border border-border/40 bg-muted shrink-0" />
              <div className="h-4 rounded bg-muted flex-1" style={{ width: `${60 + i * 8}%` }} />
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between w-full pt-4">
          <div className="h-10 w-24 rounded-lg bg-muted" />
          <div className="h-10 w-28 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
