import Credentials from "next-auth/providers/credentials";
import { validateKeycloakTokens } from "@/lib/auth/validate-keycloak-tokens";

export const keycloakTokenProvider = Credentials({
  id: "keycloak-token",
  name: "Keycloak Token",
  credentials: {
    id_token: { label: "ID Token", type: "text" },
    access_token: { label: "Access Token", type: "text" },
  },
  authorize: async (credentials) => {
    const idToken = credentials?.id_token;
    const accessToken = credentials?.access_token;

    if (!idToken || typeof idToken !== "string") {
      return null;
    }

    const validated = await validateKeycloakTokens({
      idToken,
      accessToken:
        typeof accessToken === "string" && accessToken.length > 0
          ? accessToken
          : undefined,
    });

    if (!validated) {
      return null;
    }

    return {
      id: validated.sub,
      email: validated.email,
      name: validated.name,
      roles: validated.roles.roles,
      ignoredRoles: validated.roles.ignoredRoles,
      appRole: validated.roles.appRole,
      rolesSource: validated.roles.source,
      provider: "oidc",
    };
  },
});
