export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-7 w-24 rounded bg-muted" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border/30 p-5 space-y-3">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
