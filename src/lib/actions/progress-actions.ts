"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toggleLessonCompleted } from "@/lib/progress-data";
import { recordStudentActivity } from "@/lib/student-activity";

type ActionResult = {
  success: boolean;
  error?: string;
};

const toggleLessonCompletedSchema = z.object({
  clientId: z.uuid("Cliente inválido."),
  lessonId: z.uuid("Aula inválida."),
  completed: z.boolean(),
  programId: z.uuid().optional(),
  moduleId: z.uuid().optional(),
  programSlug: z.string().min(1).optional(),
  moduleSlug: z.string().min(1).optional(),
});

export async function toggleLessonCompletedAction(
  input: z.infer<typeof toggleLessonCompletedSchema>,
): Promise<ActionResult> {
  const parsed = toggleLessonCompletedSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const result = await toggleLessonCompleted(
    parsed.data.clientId,
    parsed.data.lessonId,
    parsed.data.completed,
  );

  if (!result.success) {
    return result;
  }

  if (parsed.data.completed) {
    void recordStudentActivity({
      clientId: parsed.data.clientId,
      programId: parsed.data.programId ?? null,
      moduleId: parsed.data.moduleId ?? null,
      lessonId: parsed.data.lessonId,
      eventType: "lesson_completed",
    });
  }

  revalidatePath("/programas");

  if (parsed.data.programSlug) {
    revalidatePath(`/programas/${parsed.data.programSlug}`);

    if (parsed.data.moduleSlug) {
      revalidatePath(
        `/programas/${parsed.data.programSlug}/modulos/${parsed.data.moduleSlug}`,
      );
    }
  }

  return { success: true };
}
