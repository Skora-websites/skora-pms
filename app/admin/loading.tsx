export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-28 animate-pulse bg-slate-100/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-72 animate-pulse bg-slate-100/60" />
        <div className="card h-72 animate-pulse bg-slate-100/60" />
      </div>
    </div>
  );
}
