export default function AddressesLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat alamat">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-slate-200" />
        <div className="h-10 w-44 rounded-lg bg-slate-200" />
      </div>
      <div className="h-28 rounded-lg border border-slate-200 bg-white" />
    </div>
  );
}
