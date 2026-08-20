import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getMasterCounts, getMasterData, type MasterKind } from "@/lib/queries/super-admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { MasterPanel } from "./master-panel";

export const metadata: Metadata = { title: "Consult Masters · Super Admin" };

const KINDS: MasterKind[] = ["symptoms", "examinations", "diagnoses", "lab-tests", "medicines"];

export default async function MastersPage() {
  await requireRole(["super_admin", "admin"]);
  const [counts, ...datasets] = await Promise.all([getMasterCounts(), ...KINDS.map((k) => getMasterData(k))]);
  const data = Object.fromEntries(KINDS.map((k, i) => [k, datasets[i]])) as Record<MasterKind, typeof datasets[number]>;

  return (
    <div>
      <PageHeader
        title="Consult masters"
        subtitle={`${counts.symptoms + counts.examinations + counts.diagnoses + counts.labTests + counts.medicines} master records power the consultation forms`}
      />
      <MasterPanel data={data} />
    </div>
  );
}