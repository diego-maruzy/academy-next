import type { Session } from "next-auth";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";
import type { UserRole } from "@/lib/auth/roles";
import {
  getAdminPermissionFromKeycloakRoles,
  getClientRoleFromKeycloak,
  mapKeycloakRolesToAppRole,
} from "@/lib/auth/keycloak-roles";

export function sessionToCurrentAdmin(
  session: Session | null,
): CurrentAdmin | null {
  if (!session?.user?.email) {
    return null;
  }

  const roles = session.user.roles ?? [];
  const permission = getAdminPermissionFromKeycloakRoles(roles);

  if (!permission) {
    return null;
  }

  const appRole = session.user.appRole ?? mapKeycloakRolesToAppRole(roles);

  return {
    id: session.user.id || session.user.email,
    email: session.user.email,
    full_name: session.user.name ?? session.user.email,
    role: appRole === "admin" ? "admin" : "team",
    permission,
  };
}

export function sessionToCurrentUser(session: Session) {
  const roles = session.user.roles ?? [];
  const appRole = session.user.appRole ?? mapKeycloakRolesToAppRole(roles);

  let role: UserRole = "client";

  if (appRole === "admin") {
    role = "admin";
  } else if (getAdminPermissionFromKeycloakRoles(roles)) {
    role = "team";
  }

  return {
    id: session.user.id || session.user.email || "keycloak-user",
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role,
    clientEmail: session.user.email ?? "",
    roles,
    appRole,
    clientRole: getClientRoleFromKeycloak(roles),
  };
}
