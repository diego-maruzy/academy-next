import { getCurrentUser } from "@/lib/auth/current-user";
import { createSupabaseReadServerClient } from "@/lib/supabase/server";

export type CurrentClient = {
  id: string;
  email: string;
  full_name: string;
};

let warnedMissingClient = false;

// Futuramente será substituído pelo usuário autenticado do Keycloak.
export async function getCurrentClient(): Promise<CurrentClient | null> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, email, full_name")
    .eq("email", user.clientEmail)
    .maybeSingle();

  if (error) {
    console.error("[current-client] Erro ao buscar cliente:", error.message);
    return null;
  }

  if (!data) {
    if (!warnedMissingClient) {
      warnedMissingClient = true;
      console.warn(
        "Cliente mockado não encontrado. Crie um cliente com email mariana@email.com ou ajuste currentUser.clientEmail.",
      );
    }

    return null;
  }

  return data as CurrentClient;
}
