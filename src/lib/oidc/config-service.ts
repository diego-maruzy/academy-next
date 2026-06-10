import { WebStorageStateStore, type UserManagerSettings } from "oidc-client-ts";

const DEFAULT_AUTHORITY =
  "https://auth.checkmateproperty.com/realms/Checkmate";
const DEFAULT_CLIENT_ID = "checkmate-academy-public";

export function getOidcAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.APP_URL?.replace(/\/$/, "") ??
    "https://play.checkmateproperty.com"
  );
}

export function getOidcAuthority() {
  return process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ?? DEFAULT_AUTHORITY;
}

export function getOidcClientId() {
  return (
    process.env.NEXT_PUBLIC_KEYCLOAK_PUBLIC_CLIENT_ID ?? DEFAULT_CLIENT_ID
  );
}

export function getOidcUserStorageKey(origin = getOidcAppOrigin()) {
  return `oidc.user:${getOidcAuthority()}:${getOidcClientId()}`;
}

export function createOidcClientSettings(
  origin = getOidcAppOrigin(),
): UserManagerSettings {
  const authority = getOidcAuthority();
  const clientId = getOidcClientId();

  return {
    authority,
    client_id: clientId,
    redirect_uri: `${origin}/auth/callback`,
    silent_redirect_uri: `${origin}/auth/silent-callback`,
    post_logout_redirect_uri: `${origin}/oidc/login`,
    response_type: "code",
    scope: "openid profile email roles",
    automaticSilentRenew: true,
    silentRequestTimeoutInSeconds: 8,
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
