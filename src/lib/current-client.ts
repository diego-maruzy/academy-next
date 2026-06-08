import { auth } from "@/auth";
import { sessionToCurrentUser } from "@/lib/auth/keycloak-session";
import { createSupabaseReadServerClient } from "@/lib/supabase/server";

export type CurrentClient = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

let warnedMissingClient = false;

export async function getCurrentClient(): Promise<CurrentClient | null> {
  const session = await auth();
  const supabase = await createSupabaseReadServerClient();

  if (!supabase || !session?.user?.email) {
    return null;
  }

  const keycloakUser = sessionToCurrentUser(session);

  const { data, error } = await supabase
    .from("clients")
    .select("id, email, full_name, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error) {
    console.error("[current-client] Erro ao buscar cliente:", error.message);
    return null;
  }

  if (!data) {
    if (!warnedMissingClient) {
      warnedMissingClient = true;
      console.warn(
        `[current-client] Cliente não encontrado no Supabase para ${session.user.email}.`,
      );
    }

    return {
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.name ?? session.user.email,
      role: keycloakUser.clientRole,
    };
  }

  return {
    ...(data as CurrentClient),
    role: keycloakUser.clientRole,
  };
}
