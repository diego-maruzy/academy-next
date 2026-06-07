import { z } from "zod";

export const importClientRecordSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1),
  email: z.string().min(3),
  created_at: z.string(),
  country: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  whatsapp: z.string().nullable(),
  roles: z.array(z.string()),
  plan_id: z.string().uuid(),
  has_accessed: z.boolean(),
  last_sign_in_at: z.string().nullable(),
});

export const importClientsPayloadSchema = z.array(importClientRecordSchema).min(1);

export type ImportClientRecordInput = z.infer<typeof importClientRecordSchema>;
