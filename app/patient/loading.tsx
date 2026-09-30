/** Segment-level loading skeleton matching the dashboard page layout. */
export default function PatientLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-40 rounded-lg bg-slate-200" />
        <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            </div>
            <div className="mt-3 h-9 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-28 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
              </div>
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}