export default function AdminCategoriesLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Memuat panel admin">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="h-12 border-b border-slate-200 flex items-center px-4">
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-100 flex items-center px-4 gap-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
