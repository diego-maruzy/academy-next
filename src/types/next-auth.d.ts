import type { DefaultSession } from "next-auth";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";
import type { KeycloakRolesSource } from "@/lib/auth/keycloak-token";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
      ignoredRoles: string[];
      appRole: AcademyAppRole;
      rolesSource: KeycloakRolesSource;
      provider: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    ignoredRoles?: string[];
    appRole?: AcademyAppRole;
    rolesSource?: KeycloakRolesSource;
    provider?: string;
    idToken?: string;
  }
}
