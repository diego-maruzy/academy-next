import { safeAuth } from "@/lib/auth/safe-auth";
import { sessionToCurrentUser } from "@/lib/auth/keycloak-session";
import type { UserRole } from "@/lib/auth/roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientEmail: string;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await safeAuth();

  if (session?.user) {
    const user = sessionToCurrentUser(session);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientEmail: user.clientEmail,
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
