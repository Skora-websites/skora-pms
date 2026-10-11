/**
 * Shared clinic-form validation (audit F-22).
 *
 * The same clinic CRUD was implemented three times — once per dashboard
 * tier (super-admin, doctor schedule, admin clinics) — each re-implementing
 * the input contract verbatim. A validation fix landing in one tier left
 * the others behind (the exact divergence pattern that produced F-05).
 * This module is the ONE implementation of the contract; each tier keeps
 * its own guard (who may call) and ownership check (which clinics it may
 * touch) — those divergences are deliberate.
 *
 * Contract (union of the three former copies):
 *   - clinic name required, ≤ 255 chars
 *   - address type ∈ {manual, map}
 *   - manual → address required; map → latitude + longitude required
 *   - a map clinic without a typed address synthesizes "Map Location: lat, lng"
 *   - phone required, ≤ 20 chars
 *   - consultation fee required, finite, ≥ 0, ≤ 2^31−1 (the column bound —
 *     previously only enforced by a raw DB error on the biggest values)
 */
export const CLINIC_ADDRESS_TYPES = ["manual", "map"] as const;

export type ParsedClinicForm = {
  clinicName: string;
  addressType: (typeof CLINIC_ADDRESS_TYPES)[number];
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  /** Fee normalized to a 2-dp string, ready for the decimal column. */
  fee: string;
};

export type ClinicFormFields = {
  clinicName: string;
  addressType: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  fee: string;
};

/** Validate already-extracted form fields (super-admin tier uses this shape). */
export function validateClinicFields(
  f: ClinicFormFields
): { error: string } | ParsedClinicForm {
  const clinicName = f.clinicName.trim();
  const address = f.address.trim();
  const latitude = f.latitude?.trim() || null;
  const longitude = f.longitude?.trim() || null;
  const phone = f.phone.trim();
  const fee = f.fee.trim();

  if (!clinicName) return { error: "Clinic name is required." };
  if (clinicName.length > 255) return { error: "Clinic name must be at most 255 characters." };
  if (!(CLINIC_ADDRESS_TYPES as readonly string[]).includes(f.addressType)) {
    return { error: "Invalid address type." };
  }
  const addressType = f.addressType as (typeof CLINIC_ADDRESS_TYPES)[number];
  if (addressType === "manual" && !address) {
    return { error: "Address is required for manual address." };
  }
  if (addressType === "map" && (!latitude || !longitude)) {
    return { error: "Latitude and longitude are required for map address." };
  }
  if (!phone) return { error: "Phone is required." };
  if (phone.length > 20) return { error: "Phone must be at most 20 characters." };
  const feeNum = Number(fee);
  if (!fee || !Number.isFinite(feeNum) || feeNum < 0) {
    return { error: "Consultation fee must be a valid non-negative amount." };
  }
  if (feeNum > 2_147_483_647) {
    return { error: "Consultation fee is too large." };
  }

  return {
    clinicName,
    addressType,
    // Map locations without a typed address synthesize one (doctor-module parity).
    address: addressType === "map" && !address ? `Map Location: ${latitude}, ${longitude}` : address,
    latitude,
    longitude,
    phone,
    fee: feeNum.toFixed(2),
  };
}

/** Extract + validate straight from FormData (doctor + admin tiers). */
export function parseClinicForm(formData: FormData): { error: string } | ParsedClinicForm {
  return validateClinicFields({
    clinicName: String(formData.get("clinic_name") ?? ""),
    addressType: String(formData.get("address_type") ?? "manual"),
    address: String(formData.get("address") ?? ""),
    latitude: String(formData.get("latitude") ?? "").trim() || null,
    longitude: String(formData.get("longitude") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? ""),
    fee: String(formData.get("consultation_fee") ?? ""),
  });
}
