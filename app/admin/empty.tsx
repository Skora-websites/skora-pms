import Link from "next/link";

/**
 * Rendered by the admin layout when the viewer has no business context:
 * an owner who hasn't created a business yet, or a manager with no clinic
 * assignments. Kept minimal and outside DashboardShell — there's no
 * meaningful navigation to show yet.
 */
export function AdminEmptyState({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="card max-w-lg p-10 text-center">
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">
          {isOwner ? "Set up your business" : "No clinic assigned yet"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {isOwner
            ? "Your account is ready, but no business exists under it yet. Create your business and add clinics to start managing your operations."
            : "You're not assigned to any clinic yet. Once a business owner assigns you to a clinic, your operations dashboard will appear here."}
        </p>
        {isOwner ? (
          <p className="mt-4 text-xs text-slate-400">
            Contact support if you believe this is an error.
          </p>
        ) : (
          <Link href="/" className="mt-6 inline-block btn-primary">
            Back to home
          </Link>
        )}
      </div>
    </div>
  );
}
