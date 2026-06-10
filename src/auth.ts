import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";
import { mapKeycloakRolesToAppRole } from "@/lib/auth/keycloak-roles";
import { hostSsoProvider } from "@/lib/auth/host-sso-provider";
import {
  resolveKeycloakRolesFromAuthPayload,
  type KeycloakRolesSource,
} from "@/lib/auth/keycloak-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, hostSsoProvider],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "host-sso") {
        return true;
      }

      return true;
    },
    async jwt({ token, account, profile, user }) {
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

      if (account?.provider === "host-sso" && user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.provider = user.provider ?? "oidc-host";
        token.roles = user.roles ?? [];
        token.ignoredRoles = user.ignoredRoles ?? [];
        token.appRole = user.appRole ?? "free";
        token.rolesSource = user.rolesSource ?? "host-tokens";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const roles = (token.roles as string[] | undefined) ?? [];

        session.user.id = String(token.sub ?? "");
        session.user.email = (token.email as string | undefined) ?? session.user.email;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
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
