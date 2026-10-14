export default function AccountLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat detail">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div className="h-24 w-24 rounded-full bg-slate-200" />
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-200" />
        <div className="h-4 w-56 rounded bg-slate-200" />
      </div>
    </div>
  );
}
