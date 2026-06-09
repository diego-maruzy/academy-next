import Credentials from "next-auth/providers/credentials";
import { validateHostTokens } from "@/lib/auth/host-token-validation";

export const keycloakTokenProvider = Credentials({
  id: "keycloak-token",
  name: "Keycloak Token",
  credentials: {
    id_token: { label: "ID Token", type: "text" },
    access_token: { label: "Access Token", type: "text" },
    auth_source: { label: "Auth Source", type: "text" },
  },
  authorize: async (credentials) => {
    const idToken = credentials?.id_token;
    const accessToken = credentials?.access_token;
    const authSource = credentials?.auth_source;

    const validated = await validateHostTokens({
      idToken: typeof idToken === "string" ? idToken : undefined,
      accessToken:
        typeof accessToken === "string" && accessToken.length > 0
          ? accessToken
          : undefined,
    });

    if (!validated.ok) {
      return null;
    }

    const isHostBootstrap = authSource === "host-tokens";

    return {
      id: validated.sub,
      email: validated.email,
      name: validated.name,
      roles: validated.roles.roles,
      ignoredRoles: validated.roles.ignoredRoles,
      appRole: validated.roles.appRole,
      rolesSource: isHostBootstrap ? "host-tokens" : validated.roles.source,
      provider: isHostBootstrap ? "oidc-host" : "oidc",
    };
  },
});
