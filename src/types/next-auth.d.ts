import type { DefaultSession } from "next-auth";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: string[];
      appRole: AcademyAppRole;
      provider: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    appRole?: AcademyAppRole;
    provider?: string;
    idToken?: string;
  }
}
