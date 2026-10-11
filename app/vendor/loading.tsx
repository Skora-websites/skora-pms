/**
 * Segment-level loading skeleton for the vendor upload-test flow — shown while
 * the token lookup and the booking queries stream.
 */
export default function VendorLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md animate-pulse p-8">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-200" />
        <div className="mx-auto mt-4 h-6 w-48 rounded-lg bg-slate-200" />
        <div className="mx-auto mt-2 h-3 w-64 rounded bg-slate-100" />
        <div className="mt-8 space-y-4">
          <div className="h-10 rounded-lg bg-slate-100" />
          <div className="h-10 rounded-lg bg-slate-100" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </div>
        <div className="mx-auto mt-8 h-10 w-32 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
