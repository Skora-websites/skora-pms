"use server";

// The medicines catalogue is super-admin master data (legacy parity: legacy
// doctors had a read-only ShopingController@index). Doctor-side mutations
// were removed — see super-admin Masters (kind "medicines") for management.

export type MedicineActionResult = { error: string | null };
