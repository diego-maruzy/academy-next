import { redirect } from "next/navigation";
import {
  createSupabaseAuthServerClient,
  getSupabaseCurrentUser,
} from "@/lib/supabase/auth";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { userHasAdminRole } from "@/lib/admin-auth/user-roles";

export async function requireAdminUser(): Promise<CurrentAdmin> {
  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    redirect("/admin/login");
  }

  const user = await getSupabaseCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const hasAdminRole = await userHasAdminRole(supabase, user.id);

  if (!hasAdminRole) {
    redirect("/admin/login?error=unauthorized");
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login?error=unauthorized");
  }

  return admin;
}

/** @deprecated Use requireAdminUser */
export async function requireAdmin() {
  return requireAdminUser();
}

/** @deprecated Apenas role admin é suportada */
export async function requireTeamOrAdmin() {
  return requireAdminUser();
}
