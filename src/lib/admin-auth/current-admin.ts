import { auth } from "@/auth";
import { sessionToCurrentAdmin } from "@/lib/auth/keycloak-session";
import {
  verifyAdminSession,
  type AdminSessionPayload,
} from "@/lib/admin-auth/session";

export type CurrentAdmin = AdminSessionPayload;

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await auth();

  if (session?.user) {
    return sessionToCurrentAdmin(session);
  }

  return verifyAdminSession();
}
