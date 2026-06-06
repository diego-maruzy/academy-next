import { cookies } from "next/headers";
import { DEV_ROLE_COOKIE } from "@/lib/auth/constants";
import type { UserRole } from "@/lib/auth/roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientEmail: string;
};

// Este mock será substituído pela sessão real do Keycloak.
// Troque `MOCK_ROLE` manualmente para testar: "client" | "team" | "admin"
const MOCK_ROLE: UserRole = "admin";
// Email do cliente/aluno mockado no Supabase (tabela clients).
const MOCK_CLIENT_EMAIL = "mariana@email.com";

function resolveRole(
  cookieRole: string | undefined,
  envRole: string | undefined,
): UserRole {
  if (cookieRole === "client" || cookieRole === "team" || cookieRole === "admin") {
    return cookieRole;
  }

  if (envRole === "client" || envRole === "team" || envRole === "admin") {
    return envRole;
  }

  return MOCK_ROLE;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get(DEV_ROLE_COOKIE)?.value;

  return {
    id: "mock-user",
    name: "Diego",
    email: "diego@checkmate.com",
    role: resolveRole(cookieRole, process.env.NEXT_PUBLIC_MOCK_USER_ROLE),
    clientEmail: MOCK_CLIENT_EMAIL,
  };
}
