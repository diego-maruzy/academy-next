import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import {
  extractKeycloakRoles,
  mapKeycloakRolesToAppRole,
  type AcademyAppRole,
} from "@/lib/auth/keycloak-roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "keycloak") {
        token.provider = "keycloak";

        if (account.id_token) {
          token.idToken = account.id_token;
        }

        const roles = extractKeycloakRoles(
          profile as Record<string, unknown> | undefined,
        );
        token.roles = roles;
        token.appRole = mapKeycloakRolesToAppRole(roles);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.roles = (token.roles as string[] | undefined) ?? [];
        session.user.appRole =
          (token.appRole as AcademyAppRole | undefined) ??
          mapKeycloakRolesToAppRole(session.user.roles);
        session.user.provider = (token.provider as string | undefined) ?? "keycloak";
      }

      return session;
    },
  },
});
