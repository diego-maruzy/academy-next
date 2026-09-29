import {
  createSupabaseAuthServerClient,
  getSupabaseCurrentUser,
} from "@/lib/supabase/auth";
import { userHasAdminRole } from "@/lib/admin-auth/user-roles";

export type CurrentAdmin = {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
  /** Mantido para compatibilidade com navegação e permissões legadas. */
  permission: "admin_access";
};

function buildCurrentAdmin(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): CurrentAdmin {
  const fullName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null) ??
    user.email ??
    "Administrador";

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: fullName,
    role: "admin",
    permission: "admin_access",
  };
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    return null;
  }

  const user = await getSupabaseCurrentUser();

  if (!user) {
    return null;
  }

  const hasAdminRole = await userHasAdminRole(supabase, user.id);

  if (!hasAdminRole) {
    return null;
  }

  return buildCurrentAdmin(user);
}
