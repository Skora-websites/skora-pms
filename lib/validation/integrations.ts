import { z } from "zod";

/** Zod schemas for no-key public-API integration routes. */

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(4).max(300),
});


export const pincodeQuerySchema = z.object({
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Pincode must be 6 digits"),
});

export const holidaysQuerySchema = z.object({
  state: z.string().trim().max(3).optional().default("DL"),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const emailCheckQuerySchema = z.object({
  email: z.string().trim().max(255),
});

export const nameHintQuerySchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(["age", "gender", "nationality"]).optional().default("gender"),
});

export const qrQuerySchema = z.object({
  text: z.string().trim().min(1).max(500),
  size: z.coerce.number().int().min(120).max(500).optional().default(220),
});

export const chartQuerySchema = z.object({
  kind: z.enum(["bar", "line", "pie"]).optional().default("bar"),
  title: z.string().trim().max(80).optional().default("Clinic stats"),
  labels: z.string().trim().min(1).max(500),
  values: z.string().trim().min(1).max(500),
});

export const referenceQuerySchema = z.object({
  q: z.string().trim().min(3).max(120),
});

export const foodQuerySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const geoDataQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
});

/** Indian clinical-data pickers (consultation form): term per domain. */
export const indiaQuerySchema = z.object({
  kind: z
    .enum(["medicines", "symptoms", "examinations", "diagnoses", "lab-tests", "history", "instructions"])
    .optional()
    .default("medicines"),
  q: z.string().trim().min(1).max(120),
});
