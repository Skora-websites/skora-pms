"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserStatus } from "../actions";

export function DoctorStatusToggle({
  doctorId,
  currentStatus,
}: {
  doctorId: number;
  currentStatus: string;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    const res = await toggleUserStatus(doctorId);
    if (res?.error) {
      alert(res.error);
    } else {
      setStatus(status === "active" ? "inactive" : "active");
      router.refresh();
    }
    setBusy(false);
  }

  const isActive = status === "active";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
        isActive
          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-accent-50 text-accent-800 hover:bg-accent-100"
      } disabled:opacity-50`}
      aria-label={isActive ? `Deactivate doctor` : `Activate doctor`}
    >
      {busy ? "..." : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}