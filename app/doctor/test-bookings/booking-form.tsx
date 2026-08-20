"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { createTestBooking, updateTestBooking } from "./actions";
import type { BookingRow } from "./test-bookings-table";

const initialState = { error: null as string | null };

type Vendor = { id: number; name: string };
type Test = { id: number; name: string; price: string | null };

type Suggest = { id: number; name: string; phone: string | null; registrationId: string | null };

const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking"];

export function BookingForm({
  vendors,
  tests,
  booking,
  onClose,
}: {
  vendors: Vendor[];
  tests: Test[];
  booking?: BookingRow | null;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    booking ? updateTestBooking : createTestBooking,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Patient autosuggest
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Suggest | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) setSuggestions([]);
  }

  // Tests
  const [selectedTests, setSelectedTests] = useState<number[]>(
    booking ? ((booking.tests as { id: number }[] | null) ?? []).map((t) => t.id) : []
  );

  const [paymentMethod, setPaymentMethod] = useState(booking?.paymentMethod ?? "cash");

  useEffect(() => {
    if (!open || booking) return;
    if (!query.trim() || query.length < 2) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/doctor/test-bookings/suggestions?q=${encodeURIComponent(query)}&type=mobile`);
      if (res.ok) setSuggestions((await res.json()) as Suggest[]);
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, booking]);

  async function fetchPatient(type: string, value: string) {
    const res = await fetch(`/api/doctor/test-bookings/patient-details?type=${type}&value=${encodeURIComponent(value)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) setSelectedPatient(data.patient as Suggest);
  }

  const selectedTestObjs = tests.filter((t) => selectedTests.includes(t.id));
  const totalAmount = selectedTestObjs.reduce((sum, t) => sum + Number(t.price ?? 0), 0);

  function close() {
    setOpen(false);
    onClose?.();
  }

  return (
    <>
      {!booking && (
        <button type="button" onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New booking
        </button>
      )}

      {(open || booking) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={close}>
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {booking ? "Edit test booking" : "New test booking"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {booking ? `Booking #${booking.id} · ${booking.patientName}` : "Book a lab test for a patient"}
                </p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(fd) => {
                if (booking) fd.set("id", String(booking.id));
                if (selectedPatient) {
                  fd.set("registration_id", selectedPatient.registrationId ?? "");
                  fd.set("phone", selectedPatient.phone ?? "");
                }
                fd.set("vendor_id", String(fd.get("vendor_id") || ""));
                fd.set("test_ids", selectedTests.join(","));
                fd.set("payment_method", paymentMethod);
                formAction(fd);
              }}
              className="mt-5 space-y-4"
            >
              {/* Patient lookup */}
              <div>
                <label className="label">Patient</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{selectedPatient.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedPatient.registrationId} · {selectedPatient.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      placeholder="Search by mobile number or name…"
                      className="input pl-9"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        {suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={async () => {
                              setSelectedPatient(s);
                              setSuggestions([]);
                              await fetchPatient("mobile", s.phone ?? "");
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                          >
                            <span className="font-medium text-slate-800">{s.name}</span>
                            <span className="text-xs text-slate-400">
                              {s.registrationId} · {s.phone}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!selectedPatient && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input name="registration_id" placeholder="Registration ID (PAT…)" className="input !py-2 !text-xs" />
                        <input name="phone" placeholder="Mobile number" className="input !py-2 !text-xs" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vendor */}
              <div>
                <label htmlFor="vendor_id" className="label">Vendor</label>
                <select id="vendor_id" name="vendor_id" required defaultValue={booking?.vendorId ?? ""} className="input">
                  <option value="" disabled>
                    Select vendor…
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {vendors.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">No vendors yet — add one with the “Vendors” button.</p>
                )}
              </div>

              {/* Tests */}
              <div>
                <label className="label">Tests (auto-prices total)</label>
                <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2.5">
                  {tests.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-sm hover:bg-brand-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(t.id)}
                          onChange={() =>
                            setSelectedTests((prev) =>
                              prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                        />
                        <span className="font-medium text-slate-700">{t.name}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500">₹{Number(t.price ?? 0).toLocaleString("en-IN")}</span>
                    </label>
                  ))}
                  {tests.length === 0 && <p className="px-2.5 py-2 text-xs text-slate-400">No tests yet — add one with the “Tests” button.</p>}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-brand-800">Total: ₹{totalAmount.toLocaleString("en-IN")}</p>
              </div>

              {/* Booking date/time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking_date" className="label">Booking date</label>
                  <input
                    id="booking_date"
                    name="booking_date"
                    type="date"
                    defaultValue={booking ? (booking.bookingDate ? new Date(booking.bookingDate).toISOString().slice(0, 10) : "") : ""}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="booking_time" className="label">Booking time</label>
                  <input
                    id="booking_time"
                    name="booking_time"
                    type="time"
                    defaultValue={booking?.bookingTime ?? ""}
                    className="input"
                  />
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Payment method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="amount" className="label">Amount received (₹)</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={booking?.paymentAmount ?? "0"}
                      className="input"
                    />
                  </div>
                </div>

                {paymentMethod === "upi" && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="upi_id" className="label">UPI ID</label>
                      <input id="upi_id" name="upi_id" className="input" placeholder="name@bank" />
                    </div>
                    <div>
                      <label htmlFor="transaction_date" className="label">Transaction date</label>
                      <input id="transaction_date" name="transaction_date" type="date" className="input" />
                    </div>
                  </div>
                )}
                {paymentMethod === "cash" && (
                  <div className="mt-3">
                    <label htmlFor="payment_date" className="label">Payment date</label>
                    <input id="payment_date" name="payment_date" type="date" className="input" />
                  </div>
                )}
                {paymentMethod === "card" && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="card_number" className="label">Card number</label>
                      <input id="card_number" name="card_number" className="input" placeholder="4242…" />
                    </div>
                    <div>
                      <label htmlFor="expiry" className="label">Expiry</label>
                      <input id="expiry" name="expiry" className="input" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="label">CVV</label>
                      <input id="cvv" name="cvv" className="input" placeholder="•••" />
                    </div>
                  </div>
                )}
                {paymentMethod === "netbanking" && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="bank_name" className="label">Bank</label>
                      <input id="bank_name" name="bank_name" className="input" />
                    </div>
                    <div>
                      <label htmlFor="transaction_id" className="label">Transaction ID</label>
                      <input id="transaction_id" name="transaction_id" className="input" />
                    </div>
                    <div>
                      <label htmlFor="transaction_date" className="label">Date</label>
                      <input id="transaction_date" name="transaction_date" type="date" className="input" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="label">Notes (optional)</label>
                <textarea id="notes" name="notes" rows={2} defaultValue={booking?.notes ?? ""} className="input" />
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                  {pending ? "Saving…" : booking ? "Save changes" : "Create booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}