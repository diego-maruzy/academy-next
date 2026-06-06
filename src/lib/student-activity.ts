/**
 * Registro de atividade do aluno.
 * Quando Keycloak estiver ativo, clientId virá da sessão do aluno autenticado.
 * Eventos serão registrados apenas para o aluno autenticado.
 */

import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import type { StudentEventType } from "@/types/client-analytics";

export type RecordStudentActivityInput = {
  clientId: string;
  programId?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  eventType: StudentEventType;
  durationSeconds?: number;
  metadata?: Record<string, unknown> | null;
};

export async function recordStudentActivity(
  input: RecordStudentActivityInput,
): Promise<{ success: boolean }> {
  if (!input.clientId || !input.eventType) {
    return { success: false };
  }

  try {
    const supabase = createSupabaseServiceServerClient();

    if (!supabase) {
      console.error(
        "[student-activity] Supabase não configurado para registrar evento.",
      );
      return { success: false };
    }

    const { error } = await supabase.from("student_activity_events").insert({
      client_id: input.clientId,
      program_id: input.programId ?? null,
      module_id: input.moduleId ?? null,
      lesson_id: input.lessonId ?? null,
      event_type: input.eventType,
      duration_seconds: input.durationSeconds ?? 0,
      metadata: input.metadata ?? null,
    });

    if (error) {
      console.error("[student-activity] Erro ao registrar evento:", error.message);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("[student-activity] Falha inesperada ao registrar evento:", error);
    return { success: false };
  }
}
