export default function HowToOrderLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Memuat konten">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-4/6 rounded bg-slate-200" />
      </div>
    </div>
  );
}
