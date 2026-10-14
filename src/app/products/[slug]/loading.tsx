export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat detail">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-square rounded-lg bg-slate-200" />
        <div className="space-y-4">
          <div className="h-6 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-10 w-32 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
