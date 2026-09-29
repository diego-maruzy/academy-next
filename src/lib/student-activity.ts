/**
 * Registro de atividade do aluno.
 * O schema Supabase atual não possui tabela de eventos de atividade.
 */

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
  void input;
  return { success: false };
}
