export default function QuickReportLoading() {
  return (
    <div
      className="min-h-screen flex flex-col animate-pulse"
      style={{ background: "linear-gradient(180deg, var(--depth-shallow) 0%, var(--reef-surface) 40%, var(--reef-shallow) 100%)" }}
    >
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 pb-24" style={{ paddingTop: 'var(--header-height, 64px)' }}>
        <div className="h-4 w-28 rounded bg-white/20 mb-6" />
        <div className="space-y-3 mb-8">
          <div className="h-6 w-48 rounded bg-white/20" />
          <div className="h-3 w-32 rounded bg-white/20" />
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/20 mx-auto" />
          <div className="h-6 w-40 rounded bg-white/20 mx-auto" />
          <div className="h-4 w-56 rounded bg-white/20 mx-auto" />
        </div>
      </main>
    </div>
  )
}
