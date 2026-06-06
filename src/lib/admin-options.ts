import { createSupabaseReadServerClient } from "@/lib/supabase/server";
import type { ProgramOption } from "@/lib/admin-labels";

export async function getProgramOptions(): Promise<ProgramOption[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar programas.");
    return [];
  }

  const { data, error } = await supabase
    .from("programs")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar programas:", error.message);
    return [];
  }

  return (data ?? []) as ProgramOption[];
}
