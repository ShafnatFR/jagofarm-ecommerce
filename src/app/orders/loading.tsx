export default function OrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Memuat daftar">
      <div className="h-8 w-48 rounded bg-slate-200" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
