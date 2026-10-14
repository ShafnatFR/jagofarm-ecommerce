export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-4 animate-pulse p-8">
        <div className="h-8 w-40 rounded bg-slate-200 mx-auto" />
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-lg bg-slate-200" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
