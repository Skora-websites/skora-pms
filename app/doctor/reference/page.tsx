import { requireRole } from "@/lib/auth/guard";
import { ReferenceSearch } from "@/components/integrations/reference-search";

export const dynamic = "force-dynamic";

/** Doctor-only clinical reference search (read-only literature, non-diagnostic). */
export default async function ReferencePage() {
  await requireRole(["doctor"]);
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold">Clinical reference</h1>
        <p className="text-sm text-slate-500">
          Literature from Europe PMC / OpenAlex and food data from Open Food Facts. No API keys, no patient data leaves
          this server except your topic query.
        </p>
      </div>
      <ReferenceSearch />
    </div>
  );
}
