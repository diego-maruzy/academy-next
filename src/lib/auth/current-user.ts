import type { UserRole } from "@/lib/auth/roles";
import { getCurrentClient } from "@/lib/current-client";
import { getSupabaseCurrentUser } from "@/lib/supabase/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientEmail: string;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const student = await getCurrentClient();

  if (student) {
    return {
      id: student.authUserId,
      name: student.name,
      email: student.email,
      role: "client",
      clientEmail: student.email,
    };
  }

  const user = await getSupabaseCurrentUser();

  if (user) {
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Usuário";

    return {
      id: user.id,
      name,
      email: user.email ?? "",
      role: "client",
      clientEmail: user.email ?? "",
    };
  }

  return {
    id: "anonymous",
    name: "Usuário",
    email: "",
    role: "client",
    clientEmail: "",
  };
}
