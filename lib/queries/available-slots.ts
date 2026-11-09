import { and, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getHolidays, isHolidayOn } from "@/lib/integrations/public-apis";
import { HOLIDAY_STATE_DEFAULT, PUBLIC_API_HOLIDAY_ENABLED } from "@/lib/config";

export type AvailableSlots = {
  /** Free 30-minute slots, chronologically sorted ("9:00 AM" … "5:00 PM"). */
  slots: string[];
  /** Non-blocking explanation when there are no slots (e.g. a day off). */
  message: string | null;
  /** Advisory only — booking stays allowed, including for emergencies. */
  holiday: { name: string; source: string } | null;
};

/** "h:mm AM/PM" or "HH:MM" -> minutes since midnight, or null. */
export function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem) {
    if (h < 1 || h > 12) return null;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
  } else {
    if (h > 23) return null;
  }
  if (min > 59) return null;
  return h * 60 + min;
}

/** Normalize "09:30 AM" / "9:30 AM" / "14:05" → "9:30 AM" (no leading zero). */
export function normalizeTime(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  const meridiem = (m[3] ?? "").toUpperCase();
  if (!meridiem) {
    // 24h → 12h for comparison
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${min} ${period}`;
  }
  return `${h}:${min} ${meridiem}`;
}

export function toDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min).padStart(2, "0")} ${period}`;
}

/** Holiday advisory for a date (non-blocking): booking stays allowed for emergencies. */
export async function holidayAdvisoryFor(date: string): Promise<{ name: string; source: string } | null> {
  if (!PUBLIC_API_HOLIDAY_ENABLED) return null;
  try {
    const year = Number(date.slice(0, 4));
    const { data } = await getHolidays(HOLIDAY_STATE_DEFAULT, year);
    const hit = isHolidayOn(data, date, HOLIDAY_STATE_DEFAULT);
    return hit ? { name: hit.name, source: hit.source } : null;
  } catch {
    return null;
  }
}

/**
 * Weekday for a `YYYY-MM-DD` string.
 *
 * Parsed as UTC on purpose (audit R4): `new Date("YYYY-MM-DDT00:00:00")` is a
 * LOCAL-time parse, so a server whose timezone differs from the clinic's —
 * an aaPanel box defaulting to UTC while clinics run IST — resolved the wrong
 * weekday and a doctor's schedule silently came back empty. The date carries
 * no time and no offset, so it is a calendar date: UTC is the honest reading.
 */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Cached holiday advisory + schedule/booked windows for one (doctor, date). */
type SlotCacheEntry = {
  holiday: { name: string; source: string } | null;
  schedules: (typeof schema.doctorSchedules.$inferSelect)[];
  booked: string[];
  expiresAtMs: number;
};

/** Per-process memo. Keyed by doctor+date; a short TTL keeps booking latency out of the read. */
const slotCache = new Map<string, SlotCacheEntry>();
const SLOT_CACHE_TTL_MS = 30_000;
const SLOT_CACHE_MAX = 500;

/**
 * The expensive half of the slot computation — clinics, schedules, booked
 * times and the holiday call — memoized for SLOT_CACHE_TTL_MS.
 *
 * The point (audit P3): `holidayAdvisoryFor` reaches an external API on every
 * invocation, so a patient polling the tracker once a second multiplied that
 * outbound call. The cacheable parts change only when the doctor edits their
 * schedule or someone books, not on every read; the is-today filter is applied
 * AFTER this returns, so a cached entry is never stale in a way a patient
 * could exploit to book a taken slot.
 */
async function loadSlotContext(doctorId: number, date: string) {
  const key = `${doctorId}:${date}`;
  const hit = slotCache.get(key);
  if (hit && hit.expiresAtMs > Date.now()) return hit;

  const holiday = await holidayAdvisoryFor(date);

  const clinics = await db
    .select({ id: schema.doctorClinics.id })
    .from(schema.doctorClinics)
    .where(and(eq(schema.doctorClinics.doctorId, doctorId), eq(schema.doctorClinics.isActive, true)));

  let schedules: (typeof schema.doctorSchedules.$inferSelect)[] = [];
  if (clinics.length > 0) {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    schedules = await db
      .select()
      .from(schema.doctorSchedules)
      .where(
        and(
          eq(schema.doctorSchedules.dayOfWeek, dayNames[weekdayOf(date)] as never),
          eq(schema.doctorSchedules.isActive, true),
          inArray(schema.doctorSchedules.doctorClinicId, clinics.map((c) => c.id))
        )
      );
  }

  const bookedRows = await db
    .select({ time: schema.appointments.time })
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.doctorId, doctorId),
        eq(schema.appointments.date, date as never),
        ne(schema.appointments.status, "cancelled")
      )
    );

  const entry: SlotCacheEntry = {
    holiday,
    schedules,
    booked: bookedRows.map((r) => normalizeTime(r.time)),
    expiresAtMs: Date.now() + SLOT_CACHE_TTL_MS,
  };
  // Bound the memo so a crawl over doctor ids cannot grow it without limit.
  if (slotCache.size >= SLOT_CACHE_MAX) {
    const oldest = slotCache.keys().next().value;
    if (oldest) slotCache.delete(oldest);
  }
  slotCache.set(key, entry);
  return entry;
}

/** Drop every cached slot context (call after a booking or a schedule edit). */
export function invalidateSlotCache(): void {
  slotCache.clear();
}

/**
 * The free 30-minute slots for a doctor on a date.
 *
 * Slots come from the doctor's active schedule windows, minus
 * booked/cancelled-excluded appointments, minus past times for today, sorted
 * chronologically. Extracted so the web route (`app/api/patient/available-slots`)
 * and the mobile one share one implementation — the two must never drift on
 * what a patient is allowed to book.
 */
export async function getAvailableSlots(doctorId: number, date: string): Promise<AvailableSlots> {
  const ctx = await loadSlotContext(doctorId, date);
  const holiday = ctx.holiday;
  const schedules = ctx.schedules;

  if (schedules.length === 0) {
    return { slots: [], message: "Doctor is not available on this day.", holiday };
  }

  const booked = new Set(ctx.booked);

  const now = new Date();
  const isToday = date === new Date().toLocaleDateString("en-CA");
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = new Set<string>();
  for (const s of schedules) {
    if (s.is24Hours) {
      for (let t = 0; t < 24 * 60; t += 30) {
        slots.add(toDisplay(t));
      }
    } else {
      const start = parseTimeToMinutes(s.startTime ?? "");
      const end = parseTimeToMinutes(s.endTime ?? "");
      if (start === null || end === null) continue;
      let endAdj = end;
      if (end <= start) endAdj = end + 24 * 60;
      for (let t = start; t < endAdj; t += 30) {
        slots.add(toDisplay(t % (24 * 60)));
      }
    }
  }

  const free = [...slots]
    .filter((slot) => !booked.has(slot))
    .filter((slot) => {
      if (!isToday) return true;
      const min = parseTimeToMinutes(slot);
      return min !== null && min > nowMin;
    })
    // Chronological, not lexicographic ("9:00 AM" sorts before "10:00 AM"
    // as text, which puts the morning's last slot first).
    .sort((a, b) => (parseTimeToMinutes(a) ?? 0) - (parseTimeToMinutes(b) ?? 0));

  return { slots: free, message: null, holiday };
}
