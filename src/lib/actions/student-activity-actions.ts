"use server";

import { z } from "zod";
import { recordStudentActivity } from "@/lib/student-activity";
import type { StudentEventType } from "@/types/client-analytics";

const studentEventTypes = [
  "platform_access",
  "program_view",
  "module_view",
  "lesson_view",
  "lesson_completed",
  "session_heartbeat",
] as const satisfies StudentEventType[];

const recordStudentActivitySchema = z.object({
  clientId: z.uuid("Cliente inválido."),
  programId: z.uuid().nullable().optional(),
  moduleId: z.uuid().nullable().optional(),
  lessonId: z.uuid().nullable().optional(),
  eventType: z.enum(studentEventTypes),
  durationSeconds: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function recordStudentActivityAction(
  input: z.infer<typeof recordStudentActivitySchema>,
): Promise<{ success: boolean }> {
  const parsed = recordStudentActivitySchema.safeParse(input);

  if (!parsed.success) {
    console.error(
      "[student-activity-action] Dados inválidos:",
      parsed.error.issues[0]?.message,
    );
    return { success: false };
  }

  return recordStudentActivity(parsed.data);
}
