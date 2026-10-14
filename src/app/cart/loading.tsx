export default function CartLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Memuat formulir">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="h-10 w-32 rounded-lg bg-slate-200" />
    </div>
  );
}
