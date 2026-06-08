import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";
import { mapKeycloakRolesToAppRole } from "@/lib/auth/keycloak-roles";
import {
  resolveKeycloakRolesFromAuthPayload,
  type KeycloakRolesSource,
} from "@/lib/auth/keycloak-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "keycloak") {
        const resolved = resolveKeycloakRolesFromAuthPayload({
          profile: profile as Record<string, unknown> | undefined,
          accessToken: account.access_token,
          idToken: account.id_token,
        });

        token.provider = "keycloak";
        token.roles = resolved.roles;
        token.ignoredRoles = resolved.ignoredRoles;
        token.appRole = resolved.appRole;
        token.rolesSource = resolved.source;

        if (account.id_token) {
          token.idToken = account.id_token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const roles = (token.roles as string[] | undefined) ?? [];

        session.user.id = String(token.sub ?? "");
        session.user.roles = roles;
        session.user.ignoredRoles =
          (token.ignoredRoles as string[] | undefined) ?? [];
        session.user.appRole =
          (token.appRole as AcademyAppRole | undefined) ??
          mapKeycloakRolesToAppRole(roles);
        session.user.rolesSource =
          (token.rolesSource as KeycloakRolesSource | undefined) ??
          (roles.length > 0 ? "keycloak" : "fallback");
        session.user.provider =
          (token.provider as string | undefined) ?? "keycloak";
      }

      return session;
    },
  },
});
