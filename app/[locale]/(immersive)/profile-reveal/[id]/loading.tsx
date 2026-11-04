export default function ProfileRevealLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center animate-pulse">
      <div className="text-center space-y-6">
        <div className="w-28 h-28 rounded-full bg-muted mx-auto" />
        <div className="h-3 w-20 rounded-full bg-muted mx-auto" />
        <div className="h-8 w-48 rounded bg-muted mx-auto" />
        <div className="h-4 w-56 rounded bg-muted mx-auto" />
      </div>
    </div>
  )
}
