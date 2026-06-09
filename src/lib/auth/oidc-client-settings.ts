import { WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";
import { getOidcAppOrigin } from "@/lib/auth/oidc-app-origin";

export function createOidcClientSettings(origin = getOidcAppOrigin()): UserManagerSettings {
  const authority =
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ??
    "https://auth.checkmateproperty.com/realms/Checkmate";

  const clientId =
    process.env.NEXT_PUBLIC_KEYCLOAK_PUBLIC_CLIENT_ID ??
    "checkmate-academy-public";

  return {
    authority,
    client_id: clientId,
    redirect_uri: `${origin}/auth/callback`,
    silent_redirect_uri: `${origin}/auth/silent-callback`,
    post_logout_redirect_uri: `${origin}/oidc/login`,
    response_type: "code",
    scope: "openid profile email roles",
    automaticSilentRenew: true,
    loadUserInfo: true,
    userStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
    stateStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
  };
}
