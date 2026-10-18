export default function AdminOrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Memuat panel admin">
      <div className="h-8 w-48 rounded bg-surface-container" />
      <div className="rounded-lg border border-outline-variant bg-surface overflow-hidden">
        <div className="h-12 border-b border-outline-variant flex items-center px-4">
          <div className="h-4 w-32 rounded bg-surface-container" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-outline-variant flex items-center px-4 gap-4">
            <div className="h-4 w-24 rounded bg-surface-container" />
            <div className="h-4 w-32 rounded bg-surface-container" />
            <div className="h-4 w-20 rounded bg-surface-container" />
          </div>
        ))}
      </div>
    </div>
  );
}
