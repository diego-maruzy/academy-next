import type { NextAuthConfig } from "next-auth";
import { buildPrimaryAuthProviders } from "@/lib/auth/auth-providers";

export const authConfig = {
  trustHost: true,
  providers: buildPrimaryAuthProviders(),
  pages: {
    signIn: "/oidc/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
