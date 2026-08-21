"use client";

import { useActionState, useState, useEffect } from "react";
import { CalendarPlus, Clock, Loader2, MapPin, IndianRupee, BadgeCheck, Stethoscope, Home } from "lucide-react";
import { createPatientAppointment } from "../actions";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

type Doctor = {
  id: number;
  name: string;
  qualification: string | null;
  registrationNumber: string | null;
  salutation: string | null;
  profilePhotoPath: string | null;
  city: string | null;
  state: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  consultationFee: string | null;
};

const initialState = { error: null as string | null };

function formatINR(n: string | null): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return `₹${v.toLocaleString("en-IN")}`;
}

export function BookAppointmentForm({ doctors }: { doctors: Doctor[] }) {
  const [state, formAction, pending] = useActionState(createPatientAppointment, initialState);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [fetchedKey, setFetchedKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<"clinical_visit" | "home_visit">("clinical_visit");
  const today = new Date().toISOString().slice(0, 10);

  const selectedDoctor = doctors.find((d) => String(d.id) === doctorId) ?? null;

  const requestKey = doctorId && date ? `${doctorId}:${date}` : "";
  const loadingSlots = !!requestKey && fetchedKey !== requestKey;

  // Fetch available slots when doctor or date changes.
  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    fetch(`/api/patient/available-slots?doctor_id=${doctorId}&date=${date}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots ?? []);
        setSlotMessage(data.message ?? null);
        setSelectedSlot("");
        setFetchedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;
        setSlotMessage("Could not load available slots.");
        setSlots([]);
        setSelectedSlot("");
        setFetchedKey(requestKey);
      });
    return () => { cancelled = true; };
  }, [requestKey, doctorId, date]);

  return (
    <div className="space-y-6">
      {doctors.length === 0 ? (
        <div className="card p-7">
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No doctors are currently accepting online bookings. Please contact your clinic.
          </p>
        </div>
      ) : (
        <>
          {/* Doctor cards */}
          <div>
            <h2 className="mb-3 font-display text-base font-bold text-slate-900">
              Choose your doctor
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((d) => {
                const isSelected = String(d.id) === doctorId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDoctorId(String(d.id));
                      setSelectedSlot("");
                    }}
                    className={cn(
                      "relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all",
                      isSelected
                        ? "border-brand-600 bg-brand-50/50 shadow-md"
                        : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                    {/* Avatar / photo */}
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 font-display text-lg font-bold text-white shadow">
                      {d.profilePhotoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/doctors/${d.id}/photo`}
                          alt={d.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(d.name)
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-slate-900">
                        {d.salutation ? `${d.salutation} ` : ""}{d.name}
                      </p>
                      {d.qualification && (
                        <p className="mt-0.5 text-xs font-medium text-brand-800">{d.qualification}</p>
                      )}
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        {d.clinicName && (
                          <p className="flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                            {d.clinicName}
                          </p>
                        )}
                        {(d.clinicAddress || d.city) && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {d.clinicAddress ?? d.city}
                            {d.city ? `, ${d.city}` : ""}
                          </p>
                        )}
                        {d.registrationNumber && (
                          <p className="flex items-center gap-1.5">
                            <BadgeCheck className="h-3.5 w-3.5 text-slate-400" />
                            Reg. {d.registrationNumber}
                          </p>
                        )}
                        {d.consultationFee && (
                          <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                            Consultation {formatINR(d.consultationFee)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking form */}
          <form action={formAction} className="card space-y-5 p-7">
            <input type="hidden" name="doctor_id" value={doctorId} />
            {selectedDoctor && (
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
                <span className="font-semibold">{selectedDoctor.name}</span>
                {selectedDoctor.qualification ? ` · ${selectedDoctor.qualification}` : ""}
                {selectedDoctor.consultationFee ? ` · ${formatINR(selectedDoctor.consultationFee)}` : ""}
              </div>
            )}

            {/* Visit type */}
            <div>
              <label className="label">Visit type</label>
              <input type="hidden" name="case_type" value={visitType} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitType("clinical_visit")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                    visitType === "clinical_visit"
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Stethoscope className="h-4 w-4" /> Clinical visit
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType("home_visit")}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                    visitType === "home_visit"
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Home className="h-4 w-4" /> Home visit
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {visitType === "home_visit" ? "The doctor will visit you at your registered address." : "You will visit the doctor's clinic."}
              </p>
            </div>

            <div>
              <label htmlFor="date" className="label">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Available slots */}
            <input type="hidden" name="time" value={selectedSlot ? selectedSlot : ""} />
            <div>
              <label className="label">Available time slots</label>
              {!doctorId || !date ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">
                  Choose a date to see available slots.
                </p>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available slots…
                </div>
              ) : slotMessage ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
                  {slotMessage}
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-400">
                  No available slots for this date.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    // Convert display slot to 24h format: "2:05 PM" → "14:05"
                    const m = slot.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
                    let h24 = "";
                    if (m) {
                      let h = Number(m[1]);
                      if (m[3] === "PM" && h !== 12) h += 12;
                      if (m[3] === "AM" && h === 12) h = 0;
                      h24 = `${String(h).padStart(2, "0")}:${m[2]}`;
                    }
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(h24 || slot)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                          isSelected
                            ? "border-accent-500 bg-accent-50 text-accent-800"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {state.error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || !selectedSlot}
              className="btn-primary w-full !rounded-xl !py-3.5 disabled:opacity-50"
            >
              <CalendarPlus className="h-4 w-4" />
              {pending ? "Booking…" : "Book appointment"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}