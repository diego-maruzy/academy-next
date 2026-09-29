import { z } from "zod";

const LEGACY_PLAN_FIELD = ["plan", "id"].join("_");

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? null);

export const importClientRecordSchema = z
  .object({
    id: z.string().uuid(),
    display_name: z.string().min(1),
    email: z.string().min(3),
    created_at: z.string(),
    country: nullableStringSchema,
    state: nullableStringSchema,
    city: nullableStringSchema,
    whatsapp: nullableStringSchema,
    roles: z.array(z.string()).default([]),
    has_accessed: z.boolean().default(false),
    last_sign_in_at: nullableStringSchema,
  })
  .extend({
    [LEGACY_PLAN_FIELD]: z.string().uuid().optional(),
  });

export const importClientsPayloadSchema = z
  .array(importClientRecordSchema)
  .min(1);

export type ImportClientRecordInput = z.infer<typeof importClientRecordSchema>;